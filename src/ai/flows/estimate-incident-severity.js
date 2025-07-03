'use server';

import { GoogleGenAI } from '@google/genai';
import { callGemini } from '../gemini';

/**
 * @fileOverview An AI agent for estimating the severity of an incident based on the incident report.
 *
 * - estimateIncidentSeverity - A function that handles the incident severity estimation process.
 * - EstimateIncidentSeverityInput - The input type for the estimateIncidentSeverity function.
 * - EstimateIncidentSeverityOutput - The return type for the estimateIncidentSeverity function.
 */

// TODO: Replace with your actual Gemini API key or use a secure config
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

const EstimateIncidentSeverityInputSchema = z.object({
  report: z.string().describe('The incident report text.'),
});

const EstimateIncidentSeverityOutputSchema = z.object({
  severity: z
    .enum(['low', 'moderate', 'high', 'critical'])
    .describe('The estimated severity level of the incident.'),
  summary: z.string().describe('A short summary of the incident report.'),
  tags: z.array(z.string()).describe('Suggested tags for the incident.'),
  escalate: z.boolean().describe('Whether the incident should be escalated.'),
  geminiRaw: z.any().describe('Raw data from Gemini API.'),
});

export async function estimateIncidentSeverity(
  input
) {
  return estimateIncidentSeverityFlow(input);
}

const prompt = ai.definePrompt({
  name: 'estimateIncidentSeverityPrompt',
  input: {schema: EstimateIncidentSeverityInputSchema},
  output: {schema: EstimateIncidentSeverityOutputSchema},
  prompt: `You are an AI assistant tasked with estimating the severity of incidents based on their reports.

  Analyze the following incident report and provide:

  - A severity level (low, moderate, high, or critical).
  - A short summary of the incident.
  - Suggested tags for the incident.
  - A boolean value indicating whether the incident should be escalated.

  Incident Report: {{{report}}}

  Respond in JSON format.
  `,
});

const estimateIncidentSeverityFlow = ai.defineFlow(
  {
    name: 'estimateIncidentSeverityFlow',
    inputSchema: EstimateIncidentSeverityInputSchema,
    outputSchema: EstimateIncidentSeverityOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output;
  }
);

/**
 * Calls Gemini API to estimate severity of an incident report.
 * @param {string} report - The incident report text.
 * @returns {Promise<object>} - The severity and other AI results.
 */
export async function estimateIncidentSeverity({ report }) {
  const prompt = `Estimate the severity (low, medium, high) of the following incident report. Provide a summary, tags (array), and whether escalation is needed. Respond in JSON with keys: severity, summary, tags, escalate.\n\n${report}`;
  const response = await callGemini({ prompt });
  let severity = '', summary = '', tags = [], escalate = false;
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
      severity = parsed.severity || '';
      summary = parsed.summary || '';
      tags = Array.isArray(parsed.tags) ? parsed.tags : [];
      escalate = typeof parsed.escalate === 'boolean' ? parsed.escalate : false;
    } else {
      summary = text;
    }
  } catch (err) {
    summary = 'AI response parsing error';
  }
  return {
    severity,
    summary,
    tags,
    escalate
  };
}
