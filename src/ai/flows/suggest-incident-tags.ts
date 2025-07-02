'use server';

/**
 * @fileOverview An AI agent that suggests relevant tags for incident reports.
 *
 * - suggestIncidentTags - A function that suggests tags for an incident report.
 * - SuggestIncidentTagsInput - The input type for the suggestIncidentTags function.
 * - SuggestIncidentTagsOutput - The return type for the suggestIncidentTags function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestIncidentTagsInputSchema = z.object({
  incidentReport: z
    .string()
    .describe('The text of the incident report to analyze.'),
});
export type SuggestIncidentTagsInput = z.infer<typeof SuggestIncidentTagsInputSchema>;

const SuggestIncidentTagsOutputSchema = z.object({
  tags: z
    .array(z.string())
    .describe('An array of suggested tags for the incident report.'),
});
export type SuggestIncidentTagsOutput = z.infer<typeof SuggestIncidentTagsOutputSchema>;

export async function suggestIncidentTags(input: SuggestIncidentTagsInput): Promise<SuggestIncidentTagsOutput> {
  return suggestIncidentTagsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestIncidentTagsPrompt',
  input: {schema: SuggestIncidentTagsInputSchema},
  output: {schema: SuggestIncidentTagsOutputSchema},
  prompt: `You are an AI assistant specializing in analyzing incident reports and suggesting relevant tags.

  Given the following incident report, please suggest a list of tags that would be helpful for categorizing and searching for this incident.

  Incident Report: {{{incidentReport}}}

  Please provide only the tags, separated by commas.`,
});

const suggestIncidentTagsFlow = ai.defineFlow(
  {
    name: 'suggestIncidentTagsFlow',
    inputSchema: SuggestIncidentTagsInputSchema,
    outputSchema: SuggestIncidentTagsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return {
      tags: output!.tags,
    };
  }
);
