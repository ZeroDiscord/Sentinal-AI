// Summarizes incident reports using AI to provide a quick understanding of key details.

'use server';

import { callGemini } from '../gemini';

/**
 * Calls Gemini API to summarize an incident report.
 * @param {string} report - The full text of the incident report.
 * @returns {Promise<object>} - The summary and other AI results.
 */
export async function summarizeIncidentReport({ report }) {
  const prompt = `Summarize the following incident report and suggest tags, severity (low, medium, high), and whether escalation is needed. Respond in JSON with keys: summary, tags (array), severity, escalate (boolean).\n\n${report}`;
  const response = await callGemini({ prompt });
  let summary = '', tags = [], severity = '', escalate = false;
  try {
    const candidate = response.candidates?.[0];
    const text = candidate?.content?.parts?.[0]?.text || candidate?.content?.parts?.[0] || '';
    // Try to parse JSON from the response
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      // Fallback: try to extract JSON from markdown or text
      const match = text.match(/```json([\s\S]*?)```|({[\s\S]*})/);
      if (match) {
        parsed = JSON.parse(match[1] || match[2]);
      }
    }
    if (parsed) {
      summary = parsed.summary || '';
      tags = Array.isArray(parsed.tags) ? parsed.tags : [];
      severity = parsed.severity || '';
      escalate = typeof parsed.escalate === 'boolean' ? parsed.escalate : false;
    } else {
      // Fallback: try to extract with regex
      summary = text;
    }
  } catch (err) {
    summary = 'AI response parsing error';
  }
  return {
    summary,
    tags,
    severity,
    escalate
  };
}
