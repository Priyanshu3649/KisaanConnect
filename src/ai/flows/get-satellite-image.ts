'use server';

/**
 * @fileOverview Generates a satellite-style image for a given geographic location.
 *
 * - getSatelliteImage - A function that returns a simulated satellite image as a data URI.
 * - GetSatelliteImageInput - The input type for the getSatelliteImage function.
 * - GetSatelliteImageOutput - The return type for the getSatelliteImage function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GetSatelliteImageInputSchema = z.object({
  latitude: z.number().describe("The latitude of the location."),
  longitude: z.number().describe("The longitude of the location."),
});
export type GetSatelliteImageInput = z.infer<typeof GetSatelliteImageInputSchema>;

const GetSatelliteImageOutputSchema = z.object({
    imageUrl: z.string().describe("The generated image as a data URI."),
});
export type GetSatelliteImageOutput = z.infer<typeof GetSatelliteImageOutputSchema>;


export async function getSatelliteImage(input: GetSatelliteImageInput): Promise<GetSatelliteImageOutput> {
  return getSatelliteImageFlow(input);
}


const getSatelliteImageFlow = ai.defineFlow(
  {
    name: 'getSatelliteImageFlow',
    inputSchema: GetSatelliteImageInputSchema,
    outputSchema: GetSatelliteImageOutputSchema,
  },
  async (input) => {

    const { media } = await ai.generate({
      model: 'googleai/gemini-2.0-flash-preview-image-generation',
      prompt: `Generate a realistic, high-resolution satellite image of agricultural fields in the style of a Sentinel-2 multispectral satellite image. The image should be suitable for agricultural analysis.
      
      Location context (do not show these in the image):
      - Latitude: ${input.latitude}
      - Longitude: ${input.longitude}

      The image should show a mix of healthy green fields, some patches of brown or yellowing crops (indicating stress or harvest), and some fallow (empty) land. Include some irrigation channels or small farm roads if possible. The colors should be slightly enhanced to show variations in crop health, similar to a false-color composite used for vegetation analysis. Do not include any text, labels, or UI elements on the image.`,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    if (!media.url) {
        throw new Error('Image generation failed to return a data URI.');
    }

    return { imageUrl: media.url };
  }
);
