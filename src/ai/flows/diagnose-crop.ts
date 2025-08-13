
'use server';

/**
 * @fileOverview An AI plant pathologist that diagnoses diseases from an image.
 *
 * - diagnoseCrop - A function that handles the plant disease detection process.
 * - DiagnoseCropInput - The input type for the diagnoseCrop function.
 * - DiagnoseCropOutput - The return type for the diagnoseCrop function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const DiagnoseCropInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a plant, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  language: z.string().describe('The language for the response (e.g., "en", "hi").'),
});
export type DiagnoseCropInput = z.infer<typeof DiagnoseCropInputSchema>;

const DiagnoseCropOutputSchema = z.object({
  analysis: z.string().describe("A single string containing the full analysis in Markdown format."),
});
export type DiagnoseCropOutput = z.infer<typeof DiagnoseCropOutputSchema>;


const prompt = ai.definePrompt({
  name: 'diagnoseCropPrompt',
  input: { schema: DiagnoseCropInputSchema },
  output: { schema: DiagnoseCropOutputSchema },
  prompt: `You are an expert AI plant pathologist. Analyze the provided image of a plant.

  Image: {{media url=photoDataUri}}

  Your task is to provide a comprehensive diagnosis in a single, well-formatted Markdown string. The response must be in the specified language: {{language}}.

  The analysis should include the following sections, clearly marked with Markdown bolding (e.g., **Crop Identification**):
  - **Crop Identification**: The common name of the plant.
  - **Health Status**: A clear statement of whether the plant is healthy or diseased. If diseased, name the disease.
  - **Confidence Score**: Your confidence in this diagnosis (e.g., 95%).
  - **Detailed Analysis**: A paragraph explaining the symptoms, causes, and potential impact of the disease.
  - **Organic Treatment Plan**: A step-by-step guide for organic treatment.
  - **Chemical Treatment Plan**: A step-by-step guide for chemical treatment, including specific chemical names if possible.
  - **Prevention Tips**: Actionable tips to prevent this issue in the future.

  Format the entire output as a single string, using "\\n" for new lines. Example format:
  "**Crop Identification**: Tomato\\n**Health Status**: Diseased - Early Blight\\n**Confidence Score**: 92%\\n..."
  `,
});

export const diagnoseCrop = ai.defineFlow(
  {
    name: 'diagnoseCropFlow',
    inputSchema: DiagnoseCropInputSchema,
    outputSchema: DiagnoseCropOutputSchema,
  },
  async (input) => {
    try {
      const { output } = await prompt(input);
      if (!output) {
        throw new Error("AI model did not return a valid output.");
      }
      return output;
    } catch (error) {
        console.error("Error in diagnoseCropFlow:", error);
        return {
            analysis: "**Analysis Failed**\\n\\nThe AI model could not process the image. This might be due to a temporary issue or if the image does not contain a clear view of a plant. Please try again with a clearer photo.",
        };
    }
  }
);
