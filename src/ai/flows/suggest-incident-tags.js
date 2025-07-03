'use server';

import { callGemini } from '../gemini';

/**
 * Calls Gemini API to suggest tags for an incident report.
 * @param {string} incidentReport - The text of the incident report to analyze.
 * @returns {Promise<object>} - The suggested tags and raw Gemini response.
 */
export async function suggestIncidentTags({ incidentReport }) {
  const prompt = `Suggest relevant tags (array) for the following incident report. Respond in JSON with a 'tags' array.\n\n${incidentReport}`;
  const response = await callGemini({ prompt });
  let tags = [];
  try {
    const candidate = response.candidates?.[0];
    const text = candidate?.content?.parts?.[0]?.text || candidate?.content?.parts?.[0] || '';
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      const match = text.match(/```json([\s\S]*?)```|({[\s\S]*})/);
      if (match) {
        parsed = JSON.parse(match[1] || match[2]);
      }
    }
    if (parsed && Array.isArray(parsed.tags)) {
      tags = parsed.tags;
    } else if (Array.isArray(parsed)) {
      tags = parsed;
    } else {
      // Fallback: try to extract comma-separated tags
      tags = text.split(',').map(t => t.trim()).filter(Boolean);
    }
  } catch (err) {
    tags = [];
  }
  return {
    tags,
  };
}
