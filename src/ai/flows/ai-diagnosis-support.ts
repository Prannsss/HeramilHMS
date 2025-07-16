'use server';

/**
 * @fileOverview AI-powered diagnosis support flow.
 *
 * - aiDiagnosisSupport - A function that accepts patient symptoms and returns potential diagnoses.
 * - AiDiagnosisSupportInput - The input type for the aiDiagnosisSupport function.
 * - AiDiagnosisSupportOutput - The return type for the aiDiagnosisSupport function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AiDiagnosisSupportInputSchema = z.object({
  symptoms: z
    .string()
    .describe('A description of the patient symptoms.'),
});
export type AiDiagnosisSupportInput = z.infer<typeof AiDiagnosisSupportInputSchema>;

const AiDiagnosisSupportOutputSchema = z.object({
  diagnosisSuggestions: z.array(z.string()).describe('A list of potential diagnoses based on the symptoms.'),
  confidenceLevels: z.array(z.number()).describe('A list of probabilities associated with each potential diagnosis.'),
});
export type AiDiagnosisSupportOutput = z.infer<typeof AiDiagnosisSupportOutputSchema>;

export async function aiDiagnosisSupport(input: AiDiagnosisSupportInput): Promise<AiDiagnosisSupportOutput> {
  return aiDiagnosisSupportFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiDiagnosisSupportPrompt',
  input: {schema: AiDiagnosisSupportInputSchema},
  output: {schema: AiDiagnosisSupportOutputSchema},
  prompt: `You are an AI-powered medical diagnosis assistant.

You will receive a description of the patient's symptoms and return a list of potential diagnoses, sorted by likelihood, along with their probabilities.

Symptoms: {{{symptoms}}}`,
});

const aiDiagnosisSupportFlow = ai.defineFlow(
  {
    name: 'aiDiagnosisSupportFlow',
    inputSchema: AiDiagnosisSupportInputSchema,
    outputSchema: AiDiagnosisSupportOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
