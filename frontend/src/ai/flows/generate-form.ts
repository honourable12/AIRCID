// src/ai/flows/generate-form.ts
'use server';
/**
 * @fileOverview A form generation AI agent.
 *
 * - generateForm - A function that handles the form generation process.
 * - GenerateFormInput - The input type for the generateForm function.
 * - GenerateFormOutput - The return type for the generateForm function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateFormInputSchema = z.object({
  studyObjectives: z.string().describe('The objectives of the study for which the form is generated.'),
});
export type GenerateFormInput = z.infer<typeof GenerateFormInputSchema>;

const GenerateFormOutputSchema = z.object({
  formSchema: z.string().describe('The generated form schema based on the study objectives.'),
  formDescription: z.string().describe('A description of the generated form and its intended use.'),
});
export type GenerateFormOutput = z.infer<typeof GenerateFormOutputSchema>;

export async function generateForm(input: GenerateFormInput): Promise<GenerateFormOutput> {
  return generateFormFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateFormPrompt',
  input: {schema: GenerateFormInputSchema},
  output: {schema: GenerateFormOutputSchema},
  prompt: `You are an expert in creating patient intake forms for research studies.

  Based on the provided study objectives, generate a form schema that can be used to collect relevant patient data.
  Also, provide a description of the generated form and its intended use.

  Study Objectives: {{{studyObjectives}}}
  `,
});

const generateFormFlow = ai.defineFlow(
  {
    name: 'generateFormFlow',
    inputSchema: GenerateFormInputSchema,
    outputSchema: GenerateFormOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
