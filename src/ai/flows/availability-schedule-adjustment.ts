'use server';

/**
 * @fileOverview A flow to automatically adjust doctors' availability schedules based on known holidays or other predictable events.
 *
 * - autoAdjustAvailabilitySchedule - A function that handles the schedule adjustment process.
 * - AutoAdjustAvailabilityScheduleInput - The input type for the autoAdjustAvailabilitySchedule function.
 * - AutoAdjustAvailabilityScheduleOutput - The return type for the autoAdjustAvailabilitySchedule function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AutoAdjustAvailabilityScheduleInputSchema = z.object({
  doctorId: z.string().describe('The ID of the doctor whose schedule needs adjustment.'),
  startDate: z.string().describe('The start date for the schedule adjustment period (YYYY-MM-DD).'),
  endDate: z.string().describe('The end date for the schedule adjustment period (YYYY-MM-DD).'),
  knownEvents: z
    .string()
    .describe(
      'A list of known events (holidays, conferences, etc.) during the period, as a JSON array of objects with date and description fields. Example: [{\"date\": \"2024-01-01\", \"description\": \"New Year\'s Day\"}, {\"date\": \"2024-05-27\", \"description\": \"Memorial Day\"}]'
    ),
});
export type AutoAdjustAvailabilityScheduleInput = z.infer<typeof AutoAdjustAvailabilityScheduleInputSchema>;

const AutoAdjustAvailabilityScheduleOutputSchema = z.object({
  adjustedSchedule: z
    .string()
    .describe(
      'The adjusted availability schedule, as a JSON array of objects with date and availability slots.  Each object has a date field (YYYY-MM-DD) and an availability field (an array of time slots in HH:mm-HH:mm format).'
    ),
  summary: z.string().describe('A summary of the adjustments made to the schedule.'),
});
export type AutoAdjustAvailabilityScheduleOutput = z.infer<typeof AutoAdjustAvailabilityScheduleOutputSchema>;

export async function autoAdjustAvailabilitySchedule(
  input: AutoAdjustAvailabilityScheduleInput
): Promise<AutoAdjustAvailabilityScheduleOutput> {
  return autoAdjustAvailabilityScheduleFlow(input);
}

const prompt = ai.definePrompt({
  name: 'autoAdjustAvailabilitySchedulePrompt',
  input: {schema: AutoAdjustAvailabilityScheduleInputSchema},
  output: {schema: AutoAdjustAvailabilityScheduleOutputSchema},
  prompt: `You are an AI assistant that helps adjust doctors\' availability schedules based on known events such as holidays.

You will receive a doctor ID, a start and end date for the adjustment period, and a list of known events during that period.
Your task is to analyze the known events and adjust the doctor\'s availability schedule accordingly.  You should reduce or eliminate availability on days with known events, and provide a summary of the changes you made.

Doctor ID: {{{doctorId}}}
Start Date: {{{startDate}}}
End Date: {{{endDate}}}
Known Events: {{{knownEvents}}}

Return the adjusted availability schedule as a JSON array of objects with date and availability slots. Each object should have a date field (YYYY-MM-DD) and an availability field (an array of time slots in HH:mm-HH:mm format).
Include a summary of the adjustments made to the schedule.

Ensure that the output is valid JSON matching this schema:
${JSON.stringify(AutoAdjustAvailabilityScheduleOutputSchema.shape, null, 2)}`,
});

const autoAdjustAvailabilityScheduleFlow = ai.defineFlow(
  {
    name: 'autoAdjustAvailabilityScheduleFlow',
    inputSchema: AutoAdjustAvailabilityScheduleInputSchema,
    outputSchema: AutoAdjustAvailabilityScheduleOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
