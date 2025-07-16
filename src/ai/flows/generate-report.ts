'use server';

/**
 * @fileOverview Generates a summary report of service logs and hospital usage statistics.
 *
 * - generateServiceLogReport - A function that generates the report.
 * - GenerateServiceLogReportInput - The input type for the generateServiceLogReport function.
 * - GenerateServiceLogReportOutput - The return type for the generateServiceLogReport function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateServiceLogReportInputSchema = z.object({
  startDate: z.string().describe('The start date for the report (YYYY-MM-DD).'),
  endDate: z.string().describe('The end date for the report (YYYY-MM-DD).'),
});
export type GenerateServiceLogReportInput = z.infer<typeof GenerateServiceLogReportInputSchema>;

const GenerateServiceLogReportOutputSchema = z.object({
  reportSummary: z.string().describe('A summary of service logs and hospital usage statistics.'),
});
export type GenerateServiceLogReportOutput = z.infer<typeof GenerateServiceLogReportOutputSchema>;

export async function generateServiceLogReport(input: GenerateServiceLogReportInput): Promise<GenerateServiceLogReportOutput> {
  return generateServiceLogReportFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateServiceLogReportPrompt',
  input: {schema: GenerateServiceLogReportInputSchema},
  output: {schema: GenerateServiceLogReportOutputSchema},
  prompt: `You are a hospital administrator. Generate a summary report of service logs and hospital usage statistics between {{startDate}} and {{endDate}}. The report should include key metrics and trends such as:

*   Total number of patients served
*   Average patient wait time
*   Number of appointments scheduled and completed
*   Most common types of services provided
*   Overall hospital occupancy rate

Provide insights into any significant trends or patterns observed during this period. Focus on providing actionable information that can help improve hospital operations and patient care.`,
});

const generateServiceLogReportFlow = ai.defineFlow(
  {
    name: 'generateServiceLogReportFlow',
    inputSchema: GenerateServiceLogReportInputSchema,
    outputSchema: GenerateServiceLogReportOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
