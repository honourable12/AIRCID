'use server';

/**
 * @fileOverview A question answering AI agent for medical documents.
 *
 * - askLlm - A function that handles asking questions and retrieving answers.
 * - AskLlmInput - The input type for the askLlm function.
 * - AskLlmOutput - The return type for the askLlm function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AskLlmInputSchema = z.object({
  question: z.string().describe('The question to ask.'),
  numContextChunks: z.number().describe('The number of context chunks to use.'),
  email: z.string().describe('The email of the user asking the question.'),
});
export type AskLlmInput = z.infer<typeof AskLlmInputSchema>;

const AskLlmOutputSchema = z.object({
  answer: z.string().describe('The answer to the question.'),
});
export type AskLlmOutput = z.infer<typeof AskLlmOutputSchema>;

export async function askLlm(input: AskLlmInput): Promise<AskLlmOutput> {
  return askLlmFlow(input);
}

const prompt = ai.definePrompt({
  name: 'askLlmPrompt',
  input: {schema: AskLlmInputSchema},
  output: {schema: AskLlmOutputSchema},
  prompt: `You are a medical research assistant.

You will answer questions related to medical documents.  Use the following information to answer the question:

Question: {{{question}}}
Number of Context Chunks: {{{numContextChunks}}}
User Email: {{{email}}}`,
});

const askLlmFlow = ai.defineFlow(
  {
    name: 'askLlmFlow',
    inputSchema: AskLlmInputSchema,
    outputSchema: AskLlmOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
