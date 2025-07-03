'use server';

import { callGemini } from '../gemini';

/**
 * @fileOverview Incident type classification AI agent.
 *
 * - classifyIncidentType - A function that handles the incident classification process.
 * - ClassifyIncidentTypeInput - The input type for the classifyIncidentType function.
 * - ClassifyIncidentTypeOutput - The return type for the classifyIncidentType function.
 */

const ClassifyIncidentTypeInputSchema = z.object({
  description: z.string().describe('The description of the incident.'),
});

const ClassifyIncidentTypeOutputSchema = z.object({
  incidentType: z.string().describe('The classified type of incident (e.g., harassment, theft, vandalism).'),
  suggestedTags: z.array(z.string()).describe('Suggested tags for the incident.'),
  severityEstimate: z.string().describe('Estimated severity of the incident (e.g., low, medium, high).'),
  escalationRequired: z.boolean().describe('Whether escalation is required for this incident.'),
});

/**
 * Calls Gemini API to classify incident type, suggest tags, and estimate severity.
 * @param {string} description - The description of the incident.
 * @returns {Promise<object>} - The classification and other AI results.
 */
export async function classifyIncidentType({ description }) {
  const prompt = `Classify the following incident description. Suggest tags (array), estimate severity (low, medium, high), and state if escalation is required. Respond in JSON with keys: incidentType, suggestedTags, severityEstimate, escalationRequired.\n\n${description}`;
  const response = await callGemini({ prompt });
  let incidentType = '', suggestedTags = [], severityEstimate = '', escalationRequired = false;
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
    if (parsed) {
      incidentType = parsed.incidentType || '';
      suggestedTags = Array.isArray(parsed.suggestedTags) ? parsed.suggestedTags : [];
      severityEstimate = parsed.severityEstimate || '';
      escalationRequired = typeof parsed.escalationRequired === 'boolean' ? parsed.escalationRequired : false;
    } else {
      incidentType = text;
    }
  } catch (err) {
    incidentType = 'AI response parsing error';
  }
  return {
    incidentType,
    suggestedTags,
    severityEstimate,
    escalationRequired
  };
}
