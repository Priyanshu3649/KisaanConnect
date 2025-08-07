'use server';

/**
 * @fileOverview Checks a user's eligibility for a specific government scheme.
 *
 * - checkSchemeEligibility - A function that handles the eligibility check process.
 * - SchemeEligibilityInput - The input type for the checkSchemeEligibility function.
 * - SchemeEligibilityOutput - The return type for the checkSchemeEligibility function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

export const SchemeEligibilityInputSchema = z.object({
  schemeName: z.string().describe('The name of the government scheme.'),
  landSizeInAcres: z.number().describe('The user\'s land size in acres.'),
  annualIncome: z.number().describe('The user\'s total annual income in INR.'),
  language: z.string().describe('The language for the response (e.g., "en" or "hi").'),
});
export type SchemeEligibilityInput = z.infer<typeof SchemeEligibilityInputSchema>;

export const SchemeEligibilityOutputSchema = z.object({
  isEligible: z.boolean().describe('Whether the user is likely eligible for the scheme.'),
  reasoning: z.string().describe('A detailed explanation of why the user is or is not eligible.'),
  benefits: z.array(z.string()).describe('A list of key benefits provided by the scheme.'),
});
export type SchemeEligibilityOutput = z.infer<typeof SchemeEligibilityOutputSchema>;

export async function checkSchemeEligibility(input: SchemeEligibilityInput): Promise<SchemeEligibilityOutput> {
  return checkSchemeEligibilityFlow(input);
}

const prompt = ai.definePrompt({
  name: 'checkSchemeEligibilityPrompt',
  input: { schema: SchemeEligibilityInputSchema },
  output: { schema: SchemeEligibilityOutputSchema },
  prompt: `You are an expert on Indian government agricultural schemes. A farmer wants to know if they are eligible for a specific scheme.

  Scheme Name: {{{schemeName}}}
  
  Farmer's Details:
  - Land Size: {{{landSizeInAcres}}} acres
  - Annual Income: ₹{{{annualIncome}}}

  Based on the typical criteria for the "{{{schemeName}}}" scheme, please determine if the farmer is likely eligible.
  - For PM-KISAN, the main criteria is land ownership, with some exclusions for high-income individuals. Most small farmers are eligible.
  - For Agricultural Mechanization Subsidy, eligibility often depends on the state and specific equipment, but generally all farmers can apply, with small farmers getting higher subsidies.
  - For PMKSY (irrigation), any farmer is typically eligible to apply.
  - For PM-KUSUM (solar), any farmer is typically eligible.

  Your task:
  1. Determine if they are eligible based on the provided details. Set 'isEligible' to true or false.
  2. Provide a clear 'reasoning' for your decision. Explain which criteria they meet or don't meet.
  3. List the top 3-4 key 'benefits' of the scheme.
  
  Your entire response must be in the specified language: {{language}}.
  `,
});

const checkSchemeEligibilityFlow = ai.defineFlow(
  {
    name: 'checkSchemeEligibilityFlow',
    inputSchema: SchemeEligibilityInputSchema,
    outputSchema: SchemeEligibilityOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
