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
  cropDescription: z.string().describe('The description of the crop.'),
});
export type DiagnoseCropDiseaseInput = z.infer<typeof DiagnoseCropDiseaseInputSchema>;

const DiagnoseCropDiseaseOutputSchema = z.object({
  diseaseIdentification: z.object({
    isDiseased: z.boolean().describe('Whether or not the crop is diseased.'),
    likelyDisease: z.string().describe('The likely disease affecting the crop.'),
    confidenceLevel: z
      .number()
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
  prompt: `You are an expert in crop diseases.

You will use this information to diagnose the crop and identify potential diseases.

Description: {{{cropDescription}}}
Photo: {{media url=photoDataUri}}

Based on the image and description, determine if the crop is diseased.  If so, identify the likely disease and your confidence level (as a number between 0 and 1).
Also suggest some recommended actions to remediate the disease.
`,
});

const diagnoseCropDiseaseFlow = ai.defineFlow(
  {
    name: 'diagnoseCropDiseaseFlow',
    inputSchema: DiagnoseCropDiseaseInputSchema,
    outputSchema: DiagnoseCropDiseaseOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
