
'use server';

/**
 * @fileOverview An AI agriculture expert that diagnoses crop issues from an image.
 *
 * - diagnoseCrop - A function that handles the crop diagnosis process.
 * - DiagnoseCropInput - The input type for the diagnoseCrop function.
 * - DiagnoseCropOutput - The return type for the diagnoseCrop function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const DiagnoseCropInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a crop, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  language: z.string().describe('The language for the response (e.g., "en", "hi", "pa", "mr", "ta", "te").'),
});
export type DiagnoseCropInput = z.infer<typeof DiagnoseCropInputSchema>;

const DiagnoseCropOutputSchema = z.object({
    analysis: z.string().describe("The formatted analysis of the crop, including detection, treatment, and prevention tips.")
});
export type DiagnoseCropOutput = z.infer<typeof DiagnoseCropOutputSchema>;


export async function diagnoseCrop(input: DiagnoseCropInput): Promise<DiagnoseCropOutput> {
  return diagnoseCropFlow(input);
}


const prompt = ai.definePrompt({
  name: 'diagnoseCropPrompt',
  input: { schema: DiagnoseCropInputSchema },
  // Use a flexible output schema initially to prevent crashes if the model deviates.
  output: { schema: z.object({ analysis: z.string() }) }, 
  model: 'googleai/gemini-1.5-flash-latest',
  prompt: `You are an AI agriculture expert integrated into the KisaanConnect application.
The user will provide a single input: an image of a crop.

When receiving an image, you must:
1. Identify the crop species.
2. Detect and name any visible plant diseases, pest damage, or nutrient deficiencies.
3. Provide:
   - Disease or issue name (if any).
   - Confidence score as a percentage.
4. Offer immediate treatment recommendations, covering both:
   - Organic remedies.
   - Chemical treatment options (with safe usage guidance).
5. Suggest preventive measures for the future.
6. If diagnosis confidence is below 60% or the image is unclear, politely request a clearer image.
7. Output all responses in the user’s preferred language (the user's language is {{language}}).
8. Keep explanations simple, clear, and under 200 words.
9. Always format the output as a single string field in a JSON object:

{
  "analysis": "**Crop Detected:** <crop name>\\n**Disease/Issue:** <name or \"None detected\">\\n**Confidence:** <percentage>%\\n**Treatment (Organic):** <steps>\\n**Treatment (Chemical):** <steps>\\n**Prevention Tips:** <steps>"
}

Do not include unrelated information. Focus only on actionable, practical, and farmer-friendly advice.

Image to analyze:
{{media url=photoDataUri}}
`,
});

const diagnoseCropFlow = ai.defineFlow(
  {
    name: 'diagnoseCropFlow',
    inputSchema: DiagnoseCropInputSchema,
    outputSchema: DiagnoseCropOutputSchema,
  },
  async (input) => {
    // This default error response will be sent back if anything in the try block fails.
    // This guarantees the UI never gets stuck loading.
    const defaultErrorResponse = {
        analysis: `**Crop Detected:** Unable to Analyze
**Disease/Issue:** Analysis Failed
**Confidence:** 0%
**Treatment (Organic):** The AI model could not process the image. This might be due to a temporary issue or an unsupported image format.
**Treatment (Chemical):** Please try uploading the image again. If the problem persists, try a different, clearer image of the affected crop.
**Prevention Tips:** Ensure the photo is well-lit and focuses on the affected area of the plant (leaves, stem, etc.).`
    };

    try {
        // FIX: The input object must be passed to the prompt function.
        const { output } = await prompt(input);

        if (!output || !output.analysis) {
             console.error("AI returned invalid or empty output.");
             return defaultErrorResponse;
        }
        
        // Final validation before returning.
        return DiagnoseCropOutputSchema.parse(output);

    } catch (error) {
        console.error("Error in diagnoseCropFlow:", error);
        return defaultErrorResponse;
    }
  }
);
