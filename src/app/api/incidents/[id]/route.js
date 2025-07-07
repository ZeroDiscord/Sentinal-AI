import { NextResponse } from 'next/server';
import { doc, getDoc, updateDoc, deleteDoc, serverTimestamp, addDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { verifyIdToken } from '@/lib/server-auth';
import { callGemini } from '@/ai/gemini';
import crypto from 'crypto';

// In-memory cache for AI results (shared with main route)
const aiCache = new Map();

// Simple rate limiter (shared with main route)
const rateLimitMap = new Map();
function isRateLimited(ip) {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxReq = 5;
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

// Handles GET /api/incidents/:id
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const incidentRef = doc(db, 'incidents', id);
    const incidentSnap = await getDoc(incidentRef);

    if (!incidentSnap.exists()) {
      return NextResponse.json({ error: 'Incident not found' }, { status: 404 });
    }

    return NextResponse.json({ incident: { id: incidentSnap.id, ...incidentSnap.data() } });
  } catch (err) {
    console.error(`Error in GET /api/incidents/${params.id}:`, err);
    return NextResponse.json({ error: 'Failed to fetch incident' }, { status: 500 });
  }
}

// Handles PUT /api/incidents/:id (re-analyze with AI)
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Missing auth token' }, { status: 401 });
    }
    const token = authHeader.replace('Bearer ', '');
    const user = await verifyIdToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Invalid auth token' }, { status: 401 });
    }

    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    if (isRateLimited(ip)) {
      return NextResponse.json({ error: 'Rate limit exceeded. Please try again later.' }, { status: 429 });
    }

    // Get the incident
    const incidentRef = doc(db, 'incidents', id);
    const incidentSnap = await getDoc(incidentRef);
    if (!incidentSnap.exists()) {
      return NextResponse.json({ error: 'Incident not found' }, { status: 404 });
    }
    const incident = incidentSnap.data();

    // Get custom prompt template
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

    // Replace placeholders
    const prompt = promptTemplate
      .replace('{description}', incident.description || '')
      .replace('{type}', incident.type || '')
      .replace('{location}', incident.location || '')
      .replace('{language}', 'English')
      .replace('{school}', incident.school || '')
      .replace('{hostel}', incident.hostel || '');

    // Clear cache for this incident to force re-analysis
    const descHash = crypto.createHash('sha256').update(incident.description || '').digest('hex');
    aiCache.delete(descHash);

    // Run AI analysis
    const response = await callGemini({ prompt });
    const candidate = response.candidates?.[0];
    const text = candidate?.content?.parts?.[0]?.text || candidate?.content?.parts?.[0] || '';
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      const match = text.match(/```json([\s\S]*?)```|({[\s\S]*})/);
      if (match) {
        try {
          parsed = JSON.parse(match[1] || match[2]);
        } catch (e2) {
          parsed = null;
        }
      }
    }

    if (!parsed) {
      const simplePrompt = `Analyze the following incident and respond ONLY with valid JSON: {"summary": string, "tags": string[], "severity": "low"|"medium"|"high"|"critical", "escalate": boolean, "escalationReason": string, "type": string}\nIncident: ${incident.description}`;
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
    }

    // Sanitize AI output
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
        type: typeof ai.type === 'string' && ai.type.length < 100 ? ai.type : (incident.type || 'Other'),
        tags: Array.isArray(ai.tags) ? ai.tags.filter(t => typeof t === 'string' && t.length < 50) : [],
        severity: ['low','medium','high','critical'].includes((ai.severity||'').toLowerCase())
          ? (ai.severity||'').toLowerCase() === 'moderate' ? 'medium' : (ai.severity||'').toLowerCase()
          : 'low',
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

    const aiSanitized = sanitizeAI(parsed || {});

    function calculatePriorityScore(ai) {
      let score = 0;
      if (ai.severity === 'critical') score = 1;
      else if (ai.severity === 'high') score = 0.8;
      else if (ai.severity === 'medium') score = 0.5;
      else score = 0.2;
      if (ai.escalate) score += 0.2;
      return Math.min(1, score);
    }

    const priorityScore = calculatePriorityScore(aiSanitized);

    // Update incident
    const incidentUpdate = {
      ...aiSanitized,
      priorityScore,
      status: 'analyzed',
      aiRaw: parsed || {},
      reanalyzedAt: serverTimestamp(),
    };
    await updateDoc(incidentRef, incidentUpdate);

    // Audit trail
    try {
      await addDoc(collection(db, 'ai_audit_trail'), {
        createdAt: serverTimestamp(),
        incidentId: id,
        incidentHash: descHash,
        prompt,
        response: text,
        parsed: parsed || {},
        user: user.uid,
        language: 'English',
        action: 'reanalyze',
      });
    } catch (e) {
      console.error('[AI] Failed to write audit trail:', e);
    }

    return NextResponse.json({ 
      success: true, 
      incident: { id: incidentSnap.id, ...incident, ...incidentUpdate } 
    });
  } catch (err) {
    console.error(`Error in PUT /api/incidents/${params.id}:`, err);
    return NextResponse.json({ error: 'Failed to re-analyze incident' }, { status: 500 });
  }
}

// Handles DELETE /api/incidents/:id
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
        return NextResponse.json({ error: 'Missing auth token' }, { status: 401 });
    }
    const token = authHeader.replace('Bearer ', '');
    const user = await verifyIdToken(token);
    if (!user) {
        return NextResponse.json({ error: 'Invalid auth token' }, { status: 401 });
    }
    
    const incidentRef = doc(db, 'incidents', id);
    await deleteDoc(incidentRef);
    
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(`Error in DELETE /api/incidents/${params.id}:`, err);
    return NextResponse.json({ error: 'Failed to delete incident' }, { status: 500 });
  }
}

// Add PATCH for assign/resolve and timeline event recording
export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Missing auth token' }, { status: 401 });
    }
    const token = authHeader.replace('Bearer ', '');
    const user = await verifyIdToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Invalid auth token' }, { status: 401 });
    }
    const incidentRef = doc(db, 'incidents', id);
    const incidentSnap = await getDoc(incidentRef);
    if (!incidentSnap.exists()) {
      return NextResponse.json({ error: 'Incident not found' }, { status: 404 });
    }
    const body = await request.json();
    const currentIncidentData = incidentSnap.data();
    const update = {};

    // Handle assignedTo and assignedAt
    if (body.assignedTo !== undefined) {
      update.assignedTo = body.assignedTo;
      if (!currentIncidentData.assignedTo) { // Only set assignedAt if it's the first assignment
        update.assignedAt = serverTimestamp();
      }
    }
    // Handle status changes (e.g., resolved) and resolvedAt
    if (body.status !== undefined) {
        update.status = body.status;
        if (body.status === 'resolved' && !currentIncidentData.resolvedAt) {
            update.resolvedAt = serverTimestamp();
        }
        // Optionally add 'in_progress_at' for 'In Progress' status
        if (body.status === 'in_progress' && !currentIncidentData.inProgressAt) {
            update.inProgressAt = serverTimestamp();
        }
    }

    // Handle readBy and firstReadAt
    if (Array.isArray(body.readBy) && user.uid) {
      const currentReadBy = currentIncidentData.readBy || [];
      if (!currentReadBy.includes(user.uid)) {
        update.readBy = [...currentReadBy, user.uid];
        if (!currentIncidentData.firstReadAt) { // Only set firstReadAt if it's the very first read
          update.firstReadAt = serverTimestamp();
        }
      }
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    await updateDoc(incidentRef, update);
    const updatedSnap = await getDoc(incidentRef);
    return NextResponse.json({ incident: { id, ...updatedSnap.data() } });
  } catch (err) {
    console.error('Error in PATCH /api/incidents/[id]:', err);
    return NextResponse.json({ error: 'Failed to update incident' }, { status: 500 });
  }
}