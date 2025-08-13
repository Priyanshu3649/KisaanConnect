
'use server';

/**
 * @fileOverview An AI agriculture expert that diagnoses crop issues from an image using a specialized API.
 *
 * - diagnoseCrop - A function that handles the crop diagnosis process.
 * - DiagnoseCropInput - The input type for the diagnoseCrop function.
 * - DiagnoseCropOutput - The return type for the diagnoseCrop function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const DiagnoseCropInputSchema = z.object({
  images: z.array(z.string()).describe("A list of base64 encoded image strings."),
  language: z.string().describe('The language for the response (e.g., "en", "hi", "pa", "mr", "ta", "te").'),
});
export type DiagnoseCropInput = z.infer<typeof DiagnoseCropInputSchema>;

const DiagnoseCropOutputSchema = z.object({
    analysis: z.string().describe("The formatted analysis of the crop, including detection, treatment, and prevention tips.")
});
export type DiagnoseCropOutput = z.infer<typeof DiagnoseCropOutputSchema>;


export async function diagnoseCrop(input: { photoDataUri: string; language: string }): Promise<DiagnoseCropOutput> {
  // Extract just the base64 part of the data URI
  const base64Image = input.photoDataUri.split(',')[1];
  return diagnoseCropFlow({ images: [base64Image], language: input.language });
}

// Helper function to format the API response into markdown
const formatApiResponse = (response: any): string => {
    if (!response.result || !response.result.classification || response.result.classification.suggestions.length === 0) {
        return `**Crop Detected:** Unknown\n**Disease/Issue:** Could not analyze image.\n**Confidence:** 0%\n\n**Detailed Review:** The image could not be processed. Please try again with a clearer, closer image of the affected plant part.\n\n**Organic Treatment:** N/A\n\n**Chemical Treatment:** N/A\n\n**Prevention Tips:** Ensure good lighting and focus on the symptomatic area.`;
    }

    const mainSuggestion = response.result.classification.suggestions[0];
    const cropName = mainSuggestion.name;
    const confidence = (mainSuggestion.probability * 100).toFixed(0);

    const diseaseInfo = response.result.disease.suggestions[0];
    let isHealthy = !diseaseInfo || diseaseInfo.name === 'healthy';
    let diseaseName = isHealthy ? "Healthy" : diseaseInfo.name;
    
    let detailedReview = diseaseInfo?.details?.description || "The plant appears to be healthy. Continue with good agricultural practices.";
    let treatmentOrganic = diseaseInfo?.details?.treatment?.biological?.join('\n- ') || "No specific organic treatment is needed.";
    let treatmentChemical = diseaseInfo?.details?.treatment?.chemical?.join('\n- ') || "No chemical treatment is necessary.";
    let preventionTips = diseaseInfo?.details?.prevention?.join('\n- ') || "Ensure proper watering, sunlight, and nutrient levels to maintain plant health.";

    return [
        `**Crop Detected:** ${cropName}`,
        `**Disease/Issue:** ${diseaseName}`,
        `**Confidence:** ${confidence}%`,
        `\n**Detailed Review:**\n${detailedReview}`,
        `\n**Organic Treatment:**\n- ${treatmentOrganic}`,
        `\n**Chemical Treatment:**\n- ${treatmentChemical}`,
        `\n**Prevention Tips:**\n- ${preventionTips}`
    ].join('\n');
}


const diagnoseCropFlow = ai.defineFlow(
  {
    name: 'diagnoseCropWithApi',
    inputSchema: DiagnoseCropInputSchema,
    outputSchema: DiagnoseCropOutputSchema,
  },
  async (input) => {
    // DEVELOPER NOTE: Add your Plant.id API key to your .env file
    // PLANT_ID_API_KEY=YOUR_API_KEY_HERE
    const apiKey = process.env.PLANT_ID_API_KEY;
    const apiUrl = 'https://plant.id/api/v3/identification';

    if (!apiKey || apiKey === "YOUR_API_KEY_HERE") {
        console.error("Plant.id API key is not configured in .env file.");
        // Return a helpful mock response for demonstration if no key is present
        const mockAnalysis = `**Crop Detected:** Tomato\n**Disease/Issue:** Early blight\n**Confidence:** 88%\n\n**Detailed Review:**\nThe image shows a tomato plant leaf with small, dark, circular lesions, which are characteristic of Early Blight caused by the fungus Alternaria solani. The lesions have a 'target spot' appearance.\n\n**Organic Treatment:**\n- Remove and destroy affected lower leaves.\n- Apply a copper-based fungicide or a bio-fungicide containing Bacillus subtilis.\n\n**Chemical Treatment:**\n- Apply fungicides containing mancozeb or chlorothalonil according to label directions.\n\n**Prevention Tips:**\n- Ensure good air circulation around plants.\n- Water at the base of the plant to avoid wet foliage.\n- Rotate crops and avoid planting tomatoes or potatoes in the same spot for at least two years.`;
        return { analysis: mockAnalysis };
    }

    const defaultErrorResponse = {
        analysis: `**Crop Detected:** Unable to Analyze\n**Disease/Issue:** Analysis Failed\n\n**Detailed Review:** The API model could not process the image. This might be due to a temporary issue with the external service or an unsupported image format.\n\n**Organic Treatment:** Please try uploading the image again. If the problem persists, try a different, clearer image.\n\n**Chemical Treatment:** N/A\n\n**Prevention Tips:** Ensure the photo is well-lit and focuses on the affected area of the plant (leaves, stem, etc.).`
    };

    try {
        const body = {
            images: input.images,
            // Requesting all relevant details for a comprehensive diagnosis
            details: ["cause", "common_names", "classification", "description", "disease", "treatment", "prevention"],
            language: input.language.split('-')[0] // Use base language code like 'en', 'hi'
        };

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Api-Key': apiKey,
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error("Plant.id API request failed:", response.status, errorBody);
            throw new Error(`API request failed with status ${response.status}`);
        }

        const data = await response.json();
        const formattedAnalysis = formatApiResponse(data);
        
        return { analysis: formattedAnalysis };

    } catch (error) {
        console.error("Error in diagnoseCropFlow:", error);
        return defaultErrorResponse;
    }
  }
);
