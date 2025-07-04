// Handles GET and POST requests for /api/incidents

import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, serverTimestamp, getDoc, doc, updateDoc, FieldValue } from 'firebase/firestore';
import { getAuth } from 'firebase-admin/auth';
import { verifyIdToken } from '@/lib/server-auth';
import { callGemini } from '@/ai/gemini';
import crypto from 'crypto';

// In-memory cache for AI results (for demonstration; use Redis or Firestore for production)
const aiCache = new Map();

// Simple in-memory rate limiter (per IP, 5 requests/minute)
const rateLimitMap = new Map();
function isRateLimited(ip) {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxReq = 60;
  const entry = rateLimitMap.get(ip) || { count: 0, start: now };
  if (now - entry.start > windowMs) {
    rateLimitMap.set(ip, { count: 1, start: now });
    return false;
  }
  if (entry.count >= maxReq) return true;
  entry.count++;
  rateLimitMap.set(ip, entry);
  return false;
}

export async function GET() {
  try {
    const snapshot = await getDocs(collection(db, 'incidents'));
    const incidents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json({ incidents });
  } catch (err) {
    console.error("Error in GET /api/incidents:", err);
    return NextResponse.json({ error: 'Failed to fetch incidents' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const data = await req.json();
    const authHeader = req.headers.get('authorization');
    let user = null;
    let displayName = 'Anonymous';
    let reporterRole = 'anonymous';
    let userSchool = null;

    if (authHeader) {
        const token = authHeader.replace('Bearer ', '');
        user = await verifyIdToken(token);
      // Try to fetch user profile from Firestore
      if (user && user.uid) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            displayName = userData.displayName || userData.name || user.email || user.uid;
            reporterRole = userData.role || 'student';
            userSchool = userData.school || null;
          } else {
            displayName = user.email || user.uid;
          }
        } catch (e) {
          displayName = user.email || user.uid;
        }
      }
    }

    // --- Rate Limiting ---
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    if (isRateLimited(ip)) {
      return NextResponse.json({ error: 'Rate limit exceeded. Please try again later.' }, { status: 429 });
    }

    // Prepare initial data
    const incidentData = {
        ...data,
        school: userSchool,
        reportedBy: displayName,
        reporterRole: reporterRole,
        status: 'pending_analysis',
        createdAt: serverTimestamp(),
        date: new Date().toISOString(),
    };

    // 1. Create the incident with basic fields
    const docRef = await addDoc(collection(db, 'incidents'), incidentData);
    console.log('[API] Incident created with ID:', docRef.id);

    // --- Multi-Language Support ---
    const language = data.language || 'English';
    // --- Customizable Prompt Engineering ---
    let promptTemplate = `Analyze the following incident report and respond ONLY with valid JSON in this format:
{
  "summary": string,
  "tags": string[],
  "severity": "low" | "medium" | "high" | "critical",
  "escalate": boolean,
  "escalationReason": string,
  "type": string,
  "confidence": {
    "summary": number (0-1),
    "tags": number (0-1),
    "severity": number (0-1),
    "escalate": number (0-1),
    "type": number (0-1)
  }
}
Incident Description: {description}
Type (if provided): {type}
Location: {location}
Language: {language}
School: {school}
Hostel: {hostel}
Example:
{
  "summary": "A student reported theft in Hostel Block C.",
  "tags": ["theft", "hostel", "student"],
  "severity": "medium",
  "escalate": true,
  "escalationReason": "Theft incidents require immediate attention.",
  "type": "theft",
  "confidence": {
    "summary": 0.85,
    "tags": 0.92,
    "severity": 0.78,
    "escalate": 0.88,
    "type": 0.95
  }
}`;

    // Try to fetch custom prompt template from Firestore
    try {
      const promptSnap = await getDocs(collection(db, 'system_config', 'main', 'ai_prompts'));
      if (!promptSnap.empty) {
        const customTemplate = promptSnap.docs[0].data().template;
        if (customTemplate) {
          promptTemplate = customTemplate;
        }
      }
    } catch (e) {
      console.warn('[AI] Failed to fetch custom prompt template, using default:', e);
    }

    // Replace placeholders in the template
    const prompt = promptTemplate
      .replace('{description}', data.description)
      .replace('{type}', data.type || '')
      .replace('{location}', data.location || '')
      .replace('{language}', language)
      .replace('{school}', data.school || '')
      .replace('{hostel}', data.hostel || '');

    // --- Caching ---
    const descHash = crypto.createHash('sha256').update(data.description).digest('hex');
    let ai = aiCache.get(descHash);
    let response, candidate, text, parsed;
    if (!ai) {
      // --- Gemini Call & Error Handling ---
      response = await callGemini({ prompt });
      candidate = response.candidates?.[0];
      text = candidate?.content?.parts?.[0]?.text || candidate?.content?.parts?.[0] || '';
      try {
        parsed = JSON.parse(text);
      } catch (e) {
        // Try to extract JSON from markdown/code block
        const match = text.match(/```json([\s\S]*?)```|({[\s\S]*})/);
        if (match) {
          try {
            parsed = JSON.parse(match[1] || match[2]);
          } catch (e2) {
            parsed = null;
          }
        }
      }
      // If still not parsed, retry with a simplified prompt
      if (!parsed) {
        const simplePrompt = `Analyze the following incident and respond ONLY with valid JSON: {"summary": string, "tags": string[], "severity": "low"|"medium"|"high"|"critical", "escalate": boolean, "escalationReason": string, "type": string}\nIncident: ${data.description}`;
        const retryResp = await callGemini({ prompt: simplePrompt });
        const retryText = retryResp.candidates?.[0]?.content?.parts?.[0]?.text || retryResp.candidates?.[0]?.content?.parts?.[0] || '';
        try {
          parsed = JSON.parse(retryText);
        } catch (e) {
          const match = retryText.match(/```json([\s\S]*?)```|({[\s\S]*})/);
          if (match) {
            try {
              parsed = JSON.parse(match[1] || match[2]);
            } catch (e2) {
              parsed = null;
            }
          }
        }
        if (!parsed) {
          console.error('[AI] Failed to parse Gemini response:', text, retryText);
        }
      }
      ai = parsed || {};
      aiCache.set(descHash, ai);
    }

    // --- Field Validation & Sanitization ---
    function sanitizeAI(ai) {
      // Helper function to validate confidence scores
      function validateConfidence(score) {
        return typeof score === 'number' && score >= 0 && score <= 1 ? score : 0.5;
      }

      // Helper function to get confidence score with fallback
      function getConfidence(confidenceObj, field) {
        return confidenceObj && typeof confidenceObj === 'object' 
          ? validateConfidence(confidenceObj[field]) 
          : 0.5;
      }

      return {
        type: typeof ai.type === 'string' && ai.type.length < 100 ? ai.type : (data.type || 'Other'),
        tags: Array.isArray(ai.tags) ? ai.tags.filter(t => typeof t === 'string' && t.length < 50) : [],
        severity: ['low','medium','high','critical'].includes((ai.severity||'').toLowerCase()) ? ai.severity.toLowerCase() : 'low',
        escalate: typeof ai.escalate === 'boolean' ? ai.escalate : false,
        summary: typeof ai.summary === 'string' && ai.summary.length < 1000 ? ai.summary : '',
        escalationReason: typeof ai.escalationReason === 'string' && ai.escalationReason.length < 500 ? ai.escalationReason : '',
        confidence: {
          summary: getConfidence(ai.confidence, 'summary'),
          tags: getConfidence(ai.confidence, 'tags'),
          severity: getConfidence(ai.confidence, 'severity'),
          escalate: getConfidence(ai.confidence, 'escalate'),
          type: getConfidence(ai.confidence, 'type'),
        },
      };
    }
    const aiSanitized = sanitizeAI(ai);

    function calculatePriorityScore(ai) {
      let score = 0;
      if (ai.severity === 'critical') score = 1;
      else if (ai.severity === 'high') score = 0.8;
      else if (ai.severity === 'medium') score = 0.5;
      else score = 0.2;
      if (ai.escalate) score += 0.2;
      return Math.min(1, score);
    }

    const priorityScore = calculatePriorityScore(ai);

    const incidentUpdate = {
      ...aiSanitized,
        status: 'analyzed',
      aiRaw: ai,
      priorityScore,
    };
    await updateDoc(doc(db, 'incidents', docRef.id), incidentUpdate);
    console.log('[API] Incident updated with unified AI results.');

    // 3. Return the enriched incident
    const finalIncident = { id: docRef.id, ...incidentData, ...incidentUpdate };
    return NextResponse.json({ incident: finalIncident });

  } catch (err) {
    console.error('[API] Error in POST /api/incidents:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
} 