import { NextResponse } from 'next/server';
import { callGemini } from '@/ai/gemini';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import crypto from 'crypto';

// In-memory cache for AI results
const aiCache = new Map();

export async function POST(req) {
  try {
    const { text } = await req.json();
    
    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    // Check cache first
    const textHash = crypto.createHash('sha256').update(text).digest('hex');
    let ai = aiCache.get(textHash);
    
    if (!ai) {
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
Incident Description: {text}
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
        .replace('{description}', text)
        .replace('{text}', text)
        .replace('{type}', '')
        .replace('{location}', '')
        .replace('{language}', 'English')
        .replace('{school}', '')
        .replace('{hostel}', '');

      // Call Gemini
      const response = await callGemini({ prompt });
      const candidate = response.candidates?.[0];
      const responseText = candidate?.content?.parts?.[0]?.text || candidate?.content?.parts?.[0] || '';
      
      let parsed;
      try {
        parsed = JSON.parse(responseText);
      } catch (e) {
        const match = responseText.match(/```json([\s\S]*?)```|({[\s\S]*})/);
        if (match) {
          try {
            parsed = JSON.parse(match[1] || match[2]);
          } catch (e2) {
            parsed = null;
          }
        }
      }

      if (!parsed) {
        const simplePrompt = `Analyze the following incident and respond ONLY with valid JSON: {"summary": string, "tags": string[], "severity": "low"|"medium"|"high"|"critical", "escalate": boolean, "escalationReason": string, "type": string, "confidence": {"summary": number, "tags": number, "severity": number, "escalate": number, "type": number}}\nIncident: ${text}`;
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
        function validateConfidence(score) {
          return typeof score === 'number' && score >= 0 && score <= 1 ? score : 0.5;
        }

        function getConfidence(confidenceObj, field) {
          return confidenceObj && typeof confidenceObj === 'object' 
            ? validateConfidence(confidenceObj[field]) 
            : 0.5;
        }

        return {
          type: typeof ai.type === 'string' && ai.type.length < 100 ? ai.type : 'Other',
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

      ai = sanitizeAI(parsed || {});
      aiCache.set(textHash, ai);

      // Audit trail
      try {
        await addDoc(collection(db, 'ai_audit_trail'), {
          createdAt: new Date(),
          textHash,
          prompt,
          response: responseText,
          parsed: parsed || {},
          user: null,
          language: 'English',
          action: 'analyze_text',
        });
      } catch (e) {
        console.error('[AI] Failed to write audit trail:', e);
      }
    }

    return NextResponse.json({ analysis: ai });
  } catch (err) {
    console.error('[API] Error in POST /api/analyze-text:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
} 