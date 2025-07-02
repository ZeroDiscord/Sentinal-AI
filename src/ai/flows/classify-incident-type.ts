'use server';

/**
 * @fileOverview Incident type classification AI agent.
 *
 * - classifyIncidentType - A function that handles the incident classification process.
 * - ClassifyIncidentTypeInput - The input type for the classifyIncidentType function.
 * - ClassifyIncidentTypeOutput - The return type for the classifyIncidentType function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ClassifyIncidentTypeInputSchema = z.object({
  description: z.string().describe('The description of the incident.'),
});
export type ClassifyIncidentTypeInput = z.infer<typeof ClassifyIncidentTypeInputSchema>;

const ClassifyIncidentTypeOutputSchema = z.object({
  incidentType: z.string().describe('The classified type of incident (e.g., harassment, theft, vandalism).'),
  suggestedTags: z.array(z.string()).describe('Suggested tags for the incident.'),
  severityEstimate: z.string().describe('Estimated severity of the incident (e.g., low, medium, high).'),
  escalationRequired: z.boolean().describe('Whether escalation is required for this incident.'),
});
export type ClassifyIncidentTypeOutput = z.infer<typeof ClassifyIncidentTypeOutputSchema>;

export async function classifyIncidentType(input: ClassifyIncidentTypeInput): Promise<ClassifyIncidentTypeOutput> {
  return classifyIncidentTypeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'classifyIncidentTypePrompt',
  input: {schema: ClassifyIncidentTypeInputSchema},
  output: {schema: ClassifyIncidentTypeOutputSchema},
  prompt: `You are an AI assistant specializing in classifying incident reports.
  Given the incident description, classify the incident type, suggest relevant tags, estimate the severity, and determine if escalation is required.

  Incident Description: {{{description}}}

  Output in JSON format:
  `,
});

const classifyIncidentTypeFlow = ai.defineFlow(
  {
    name: 'classifyIncidentTypeFlow',
    inputSchema: ClassifyIncidentTypeInputSchema,
    outputSchema: ClassifyIncidentTypeOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
