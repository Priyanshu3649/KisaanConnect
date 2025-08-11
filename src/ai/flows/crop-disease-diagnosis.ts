
'use server';

/**
 * @fileOverview Diagnoses crop diseases from uploaded images using AI.
 *
 * - diagnoseCropDisease - A function that handles the crop disease diagnosis process.
 * - DiagnoseCropDiseaseInput - The input type for the diagnoseCropDisease function.
 * - DiagnoseCropDiseaseOutput - The return type for the diagnoseCropDisease function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DiagnoseCropDiseaseInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a crop, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  cropDescription: z.string().optional().describe('An optional description of the crop and its symptoms.'),
  language: z.string().describe('The language for the response (e.g., "en" or "hi").'),
});
export type DiagnoseCropDiseaseInput = z.infer<typeof DiagnoseCropDiseaseInputSchema>;

const DiagnoseCropDiseaseOutputSchema = z.object({
  diseaseIdentification: z.object({
    isDiseased: z.boolean().describe('Whether or not the crop is diseased.'),
    likelyDisease: z.string().describe('The likely disease affecting the crop.'),
    confidenceLevel: z
      .number()
      .min(0)
      .max(1)
      .describe('The confidence level of the disease identification (0-1).'),
  }),
  recommendedActions: z.array(z.string()).describe('Recommended actions to take to address the disease.'),
});
export type DiagnoseCropDiseaseOutput = z.infer<typeof DiagnoseCropDiseaseOutputSchema>;

export async function diagnoseCropDisease(input: DiagnoseCropDiseaseInput): Promise<DiagnoseCropDiseaseOutput> {
  return diagnoseCropDiseaseFlow(input);
}

const prompt = ai.definePrompt({
  name: 'diagnoseCropDiseasePrompt',
  input: {schema: DiagnoseCropDiseaseInputSchema},
  output: {schema: DiagnoseCropDiseaseOutputSchema},
  prompt: `You are an expert in crop diseases. Your response must be in the specified language: {{language}}.

You will use the provided photo and optional description to diagnose the crop and identify potential diseases.

Photo: {{media url=photoDataUri}}
{{#if cropDescription}}
Description: {{{cropDescription}}}
{{/if}}

Based on the image and any available description, determine if the crop is diseased. If so, identify the likely disease and your confidence level (as a decimal number between 0 and 1, for example 0.95 for 95%).
Also suggest some recommended actions to remediate the disease. All parts of your response must be in {{language}}.
`,
});

const diagnoseCropDiseaseFlow = ai.defineFlow(
  {
    name: 'diagnoseCropDiseaseFlow',
    inputSchema: DiagnoseCropDiseaseInputSchema,
    outputSchema: DiagnoseCropDiseaseOutputSchema,
  },
  async input => {
    try {
        const {output} = await prompt(input);
        return output!;
    } catch(error) {
        console.error("Error in diagnoseCropDiseaseFlow:", error);
        // Return a default error object if the prompt fails validation or throws an error
        return {
            diseaseIdentification: {
                isDiseased: true,
                likelyDisease: "Analysis Failed",
                confidenceLevel: 0,
            },
            recommendedActions: [
                "The AI model failed to analyze the image. This can happen due to an unexpected format in the AI's response.",
                "Please try uploading the image again.",
                "If the problem persists, try a different image or add a more detailed description."
            ]
        };
    }
  }
);
