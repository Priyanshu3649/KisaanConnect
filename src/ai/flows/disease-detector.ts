
'use server';

/**
 * @fileOverview An AI plant pathologist that diagnoses diseases from an image and an optional description.
 *
 * - detectDisease - A function that handles the plant disease detection process.
 * - DetectDiseaseInput - The input type for the detectDisease function.
 * - DetectDiseaseOutput - The return type for the detectDisease function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const DetectDiseaseInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a plant, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  language: z.string().describe('The language for the response (e.g., "en", "hi").'),
});
export type DetectDiseaseInput = z.infer<typeof DetectDiseaseInputSchema>;

const DetectDiseaseOutputSchema = z.object({
  isPlant: z.boolean().describe('Whether or not the image contains a plant.'),
  plantName: z.string().describe('The common name of the identified plant.'),
  isHealthy: z.boolean().describe('Whether or not the plant appears to be healthy.'),
  diseaseName: z.string().describe("The name of the detected disease, or 'None' if healthy."),
  confidence: z.number().min(0).max(1).describe('The confidence score of the diagnosis (from 0 to 1).'),
  detailedReview: z.string().describe('A detailed review of the disease, its causes, and symptoms.'),
  organicTreatment: z.string().describe('A detailed plan for treating the disease using organic methods.'),
  chemicalTreatment: z.string().describe('A detailed plan for treating the disease using chemical methods.'),
  preventionTips: z.string().describe('Actionable tips to prevent this disease in the future.'),
});
export type DetectDiseaseOutput = z.infer<typeof DetectDiseaseOutputSchema>;


const prompt = ai.definePrompt({
  name: 'diseaseDetectorPrompt',
  input: { schema: DetectDiseaseInputSchema },
  output: { schema: DetectDiseaseOutputSchema },
  prompt: `You are an expert AI plant pathologist. Analyze the following image of a plant.

  Image: {{media url=photoDataUri}}

  Your task is to:
  1. Determine if the image contains a plant. If not, set 'isPlant' to false and provide default values for other fields.
  2. Identify the common name of the plant.
  3. Determine if the plant is healthy.
  4. If the plant is not healthy, identify the specific disease affecting it. If it is healthy, set the disease name to "None".
  5. Provide a confidence score (0.0 to 1.0) for your diagnosis.
  6. Write a detailed review of the disease, including its common causes and symptoms.
  7. Suggest a detailed organic treatment plan.
  8. Suggest a detailed chemical treatment plan.
  9. Provide several actionable prevention tips.

  Your entire response must be in the specified language: {{language}}.
  `,
});

export const detectDisease = ai.defineFlow(
  {
    name: 'detectDiseaseFlow',
    inputSchema: DetectDiseaseInputSchema,
    outputSchema: DetectDiseaseOutputSchema,
  },
  async (input) => {
    try {
      const { output } = await prompt(input);
      if (!output) {
        throw new Error("AI model did not return a valid output.");
      }
      return output;
    } catch (error) {
        console.error("Error in detectDiseaseFlow:", error);
        // Return a structured error response that the UI can handle
        return {
            isPlant: false,
            plantName: "Unknown",
            isHealthy: false,
            diseaseName: "Analysis Failed",
            confidence: 0,
            detailedReview: "The AI model could not process the image. This might be due to a temporary issue, an unsupported image format, or if the image does not contain a clear view of a plant.",
            organicTreatment: "Please try uploading the image again. If the problem persists, try a different, clearer image of the affected plant.",
            chemicalTreatment: "N/A",
            preventionTips: "Ensure the photo is well-lit and focuses on the affected area of the plant (leaves, stem, etc.)."
        };
    }
  }
);
