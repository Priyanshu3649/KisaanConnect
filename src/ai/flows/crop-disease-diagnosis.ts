
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
      .describe('The confidence level of the disease identification (a decimal value between 0.0 and 1.0).'),
  }),
  recommendedActions: z.array(z.string()).describe('Recommended actions to take to address the disease.'),
});
export type DiagnoseCropDiseaseOutput = z.infer<typeof DiagnoseCropDiseaseOutputSchema>;

export async function diagnoseCropDisease(input: DiagnoseCropDiseaseInput): Promise<DiagnoseCropDiseaseOutput> {
  return diagnoseCropDiseaseFlow(input);
}

// Step 1: Define a "lax" prompt that accepts any JSON object from the AI.
// This prevents the flow from crashing if the AI returns a slightly incorrect format (e.g., "95%" instead of 0.95).
const laxPrompt = ai.definePrompt({
  name: 'diagnoseCropDiseaseLaxPrompt',
  input: {schema: DiagnoseCropDiseaseInputSchema},
  output: {schema: z.any()}, // Accept any format to prevent crashes.
  prompt: `You are an expert in crop diseases. Your response must be in the specified language: {{language}}.

You will use the provided photo and optional description to diagnose the crop and identify potential diseases.

Photo: {{media url=photoDataUri}}
{{#if cropDescription}}
Description: {{{cropDescription}}}
{{/if}}

Based on the image and any available description, determine if the crop is diseased. If so, identify the likely disease and your confidence level.
CRITICAL: The confidenceLevel must be a decimal number between 0.0 and 1.0 (for example 0.95 for 95%). Do NOT return a percentage string.
Also suggest some recommended actions to remediate the disease. All parts of your response must be in {{language}}.

Your output MUST be a JSON object with the following structure:
{
  "diseaseIdentification": {
    "isDiseased": boolean,
    "likelyDisease": string,
    "confidenceLevel": number // e.g., 0.95
  },
  "recommendedActions": [string]
}
`,
});

// Step 2: Create a flow that uses the lax prompt, then manually cleans and validates the data.
const diagnoseCropDiseaseFlow = ai.defineFlow(
  {
    name: 'diagnoseCropDiseaseFlow',
    inputSchema: DiagnoseCropDiseaseInputSchema,
    outputSchema: DiagnoseCropDiseaseOutputSchema,
  },
  async input => {
    const defaultErrorResponse = {
        diseaseIdentification: {
            isDiseased: true,
            likelyDisease: "Analysis Failed",
            confidenceLevel: 0,
        },
        recommendedActions: [
            "The AI model failed to analyze the image correctly.",
            "This can happen due to an unexpected format in the AI's response or a temporary issue.",
            "Please try uploading the image again.",
            "If the problem persists, try a different image or add a more detailed description."
        ]
    };

    try {
        const {output: rawOutput} = await laxPrompt(input);
        
        if (!rawOutput) {
            console.error("AI returned no output.");
            return defaultErrorResponse;
        }

        // Manually clean the data
        let confidence = rawOutput.diseaseIdentification?.confidenceLevel;
        if (typeof confidence === 'string' && confidence.includes('%')) {
            confidence = parseFloat(confidence.replace('%', '')) / 100;
        }

        const cleanedData = {
            ...rawOutput,
            diseaseIdentification: {
                ...rawOutput.diseaseIdentification,
                confidenceLevel: confidence,
            }
        };

        // Step 3: Validate the cleaned data against the strict schema.
        // If this fails, the catch block will handle it.
        const validatedOutput = DiagnoseCropDiseaseOutputSchema.parse(cleanedData);
        return validatedOutput;

    } catch(error) {
        console.error("Error in diagnoseCropDiseaseFlow:", error);
        // If anything fails (AI call, cleaning, validation), return a default error object.
        return defaultErrorResponse;
    }
  }
);
