'use server';

/**
 * @fileOverview An AI agent for estimating the severity of an incident based on the incident report.
 *
 * - estimateIncidentSeverity - A function that handles the incident severity estimation process.
 * - EstimateIncidentSeverityInput - The input type for the estimateIncidentSeverity function.
 * - EstimateIncidentSeverityOutput - The return type for the estimateIncidentSeverity function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const EstimateIncidentSeverityInputSchema = z.object({
  report: z.string().describe('The incident report text.'),
});
export type EstimateIncidentSeverityInput = z.infer<typeof EstimateIncidentSeverityInputSchema>;

const EstimateIncidentSeverityOutputSchema = z.object({
  severity: z
    .enum(['low', 'moderate', 'high', 'critical'])
    .describe('The estimated severity level of the incident.'),
  summary: z.string().describe('A short summary of the incident report.'),
  tags: z.array(z.string()).describe('Suggested tags for the incident.'),
  escalate: z.boolean().describe('Whether the incident should be escalated.'),
});
export type EstimateIncidentSeverityOutput = z.infer<typeof EstimateIncidentSeverityOutputSchema>;

export async function estimateIncidentSeverity(
  input: EstimateIncidentSeverityInput
): Promise<EstimateIncidentSeverityOutput> {
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
    return output!;
  }
);
