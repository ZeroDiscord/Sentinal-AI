// Summarizes incident reports using AI to provide a quick understanding of key details.

'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeIncidentReportInputSchema = z.object({
  report: z.string().describe('The full text of the incident report.'),
});
export type SummarizeIncidentReportInput = z.infer<typeof SummarizeIncidentReportInputSchema>;

const SummarizeIncidentReportOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the incident report.'),
  tags: z.array(z.string()).describe('Suggested tags for the incident.'),
  severity: z.enum(['low', 'moderate', 'high']).describe('Estimated severity level of the incident.'),
  escalate: z.boolean().describe('Recommendation for escalation.'),
});
export type SummarizeIncidentReportOutput = z.infer<typeof SummarizeIncidentReportOutputSchema>;

export async function summarizeIncidentReport(input: SummarizeIncidentReportInput): Promise<SummarizeIncidentReportOutput> {
  return summarizeIncidentReportFlow(input);
}

const summarizeIncidentReportPrompt = ai.definePrompt({
  name: 'summarizeIncidentReportPrompt',
  input: {schema: SummarizeIncidentReportInputSchema},
  output: {schema: SummarizeIncidentReportOutputSchema},
  prompt: `You are an AI assistant that analyzes incident reports and provides a summary, suggested tags, severity level, and escalation recommendation.

  Analyze the following incident report:
  {{report}}

  Provide a concise summary, suggest relevant tags, estimate the severity level (low, moderate, or high), and recommend whether the incident should be escalated.

  Ensure that your response matches the schema exactly, using only the enum values provided for severity.
`,
});

const summarizeIncidentReportFlow = ai.defineFlow(
  {
    name: 'summarizeIncidentReportFlow',
    inputSchema: SummarizeIncidentReportInputSchema,
    outputSchema: SummarizeIncidentReportOutputSchema,
  },
  async input => {
    const {output} = await summarizeIncidentReportPrompt(input);
    return output!;
  }
);
