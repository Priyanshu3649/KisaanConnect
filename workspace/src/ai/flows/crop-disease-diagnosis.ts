
'use server';

/**
 * @fileOverview An AI agriculture expert that diagnoses crop issues from an image using the Plant.id API.
 *
 * - diagnoseCrop - A function that handles the crop diagnosis process.
 * - DiagnoseCropInput - The input type for the diagnoseCrop function.
 * - DiagnoseCropOutput - The return type for the diagnoseCrop function.
 */

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

// Helper function to format the API response
const formatPlantIdResponse = (response: any): string => {
    if (!response.result || !response.result.classification || response.result.classification.suggestions.length === 0) {
        return `**Crop Detected:** Unknown\n**Disease/Issue:** Could not analyze image.\n**Confidence:** 0%\n**Treatment (Organic):** N/A\n**Treatment (Chemical):** N/A\n**Prevention Tips:** Please try again with a clearer image.`;
    }

    const mainSuggestion = response.result.classification.suggestions[0];
    const cropName = mainSuggestion.name;
    const confidence = (mainSuggestion.probability * 100).toFixed(0);

    const diseaseInfo = response.result.disease.suggestions[0];
    let diseaseName = "None detected";
    let treatmentOrganic = "Keep monitoring for signs of stress.";
    let treatmentChemical = "No chemical treatment necessary.";
    let preventionTips = "Ensure proper watering, sunlight, and nutrient levels.";

    if (diseaseInfo && diseaseInfo.name !== "healthy") {
        diseaseName = diseaseInfo.name;
        // The API provides 'treatment' which can be split for our UI.
        // This is a simplistic split; a real app might need more sophisticated logic.
        const treatmentDescription = diseaseInfo.details.treatment?.biological?.join(' ') || 'Consult an expert.';
        treatmentOrganic = treatmentDescription;
        treatmentChemical = diseaseInfo.details.treatment?.chemical?.join(' ') || 'Consult an expert.';
        preventionTips = diseaseInfo.details.cause || "Follow best practices for crop health.";
    }

    return `**Crop Detected:** ${cropName}\n**Disease/Issue:** ${diseaseName}\n**Confidence:** ${confidence}%\n**Treatment (Organic):** ${treatmentOrganic}\n**Treatment (Chemical):** ${treatmentChemical}\n**Prevention Tips:** ${preventionTips}`;
}


const diagnoseCropFlow = async (input: DiagnoseCropInput): Promise<DiagnoseCropOutput> => {
    const apiKey = process.env.PLANT_ID_API_KEY;
    const apiUrl = 'https://plant.id/api/v3/identification';

    if (!apiKey) {
        console.error("Plant.id API key is not configured.");
        return { analysis: "**Error:** API key not configured on the server." };
    }

    const defaultErrorResponse = {
        analysis: `**Crop Detected:** Unable to Analyze\n**Disease/Issue:** Analysis Failed\n**Confidence:** 0%\n**Treatment (Organic):** The AI model could not process the image. This might be due to a temporary issue or an unsupported image format.\n**Treatment (Chemical):** Please try uploading the image again. If the problem persists, try a different, clearer image of the affected crop.\n**Prevention Tips:** Ensure the photo is well-lit and focuses on the affected area of the plant (leaves, stem, etc.).`
    };

    try {
        const body = {
            images: [input.photoDataUri],
            // Ask for disease details, which is crucial for our use case
            details: ["cause", "common_names", "classification", "disease", "treatment"],
            language: input.language.split('-')[0] // API uses 'en', 'hi', etc.
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
        const formattedAnalysis = formatPlantIdResponse(data);
        
        return { analysis: formattedAnalysis };

    } catch (error) {
        console.error("Error in diagnoseCropFlow:", error);
        return defaultErrorResponse;
    }
  }
);
