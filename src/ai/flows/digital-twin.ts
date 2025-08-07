'use server';

/**
 * @fileOverview Provides a digital twin analysis for a farmer's field based on location.
 *
 * - getDigitalTwinData - A function that returns simulated digital twin metrics for a given location.
 * - DigitalTwinInput - The input type for the getDigitalTwinData function.
 * - DigitalTwinOutput - The return type for the getDigitalTwinData function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const DigitalTwinInputSchema = z.object({
  latitude: z.number().describe("The latitude of the field's location."),
  longitude: z.number().describe("The longitude of the field's location."),
});
export type DigitalTwinInput = z.infer<typeof DigitalTwinInputSchema>;

const DigitalTwinOutputSchema = z.object({
  soilHealthScore: z.number().min(0).max(100).describe('The overall soil health score (0-100).'),
  moistureLevel: z.number().min(0).max(100).describe('The current soil moisture percentage.'),
  expectedYield: z.object({
    value: z.number().describe('The numerical value of the yield.'),
    unit: z.string().describe('The unit of the yield (e.g., "quintal/acre").'),
  }),
  alerts: z.array(z.object({
      type: z.enum(['weed', 'infestation', 'nutrient_deficiency', 'water_stress', 'heat_stress']),
      severity: z.enum(['low', 'medium', 'high']),
      message: z.string().describe('A descriptive message about the alert.'),
  })).describe('A list of alerts for the field.'),
});
export type DigitalTwinOutput = z.infer<typeof DigitalTwinOutputSchema>;


export async function getDigitalTwinData(input: DigitalTwinInput): Promise<DigitalTwinOutput> {
  return digitalTwinFlow(input);
}


const digitalTwinFlow = ai.defineFlow(
  {
    name: 'digitalTwinFlow',
    inputSchema: DigitalTwinInputSchema,
    outputSchema: DigitalTwinOutputSchema,
  },
  async (input) => {
    // DEVELOPER: This is a mock implementation.
    // In a real application, you would use the coordinates to get real data.

    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network delay

    const generateMockData = (lat: number, lon: number): DigitalTwinOutput => {
        // Simple geo-fencing for different regions
        
        // Haryana (e.g., for wheat)
        if (lat > 28.5 && lat < 30.5 && lon > 75.0 && lon < 77.5) {
             return {
                soilHealthScore: 75,
                moistureLevel: 45,
                expectedYield: { value: 45, unit: 'quintal/acre' }, // Higher wheat yield
                alerts: [
                    { type: 'water_stress', severity: 'medium', message: 'Low moisture detected. Irrigation recommended for wheat crop.'},
                    { type: 'weed', severity: 'low', message: 'Low density of Phalaris minor detected.'},
                ]
            };
        }

        // Delhi (urban proximity)
        if (lat > 28.4 && lat < 28.9 && lon > 76.8 && lon < 77.3) {
            return {
                soilHealthScore: 68,
                moistureLevel: 55,
                expectedYield: { value: 150, unit: 'quintal/acre' }, // Vegetable yield
                alerts: [
                    { type: 'infestation', severity: 'low', message: 'Whitefly presence detected on vegetable crops. Monitor closely.'},
                    { type: 'heat_stress', severity: 'medium', message: 'High temperatures expected. Ensure adequate shading for sensitive crops.'},
                ]
            };
        }
        
        // Mumbai (high humidity)
        if (lat > 18.9 && lat < 19.2 && lon > 72.8 && lon < 73.0) {
            return {
                soilHealthScore: 62,
                moistureLevel: 85,
                expectedYield: { value: 80, unit: 'quintal/acre' }, // Rice/vegetable yield
                alerts: [
                    { type: 'infestation', severity: 'high', message: 'High humidity increases risk of fungal diseases. Prophylactic spray recommended.'},
                ]
            };
        }

        // Default for Pune (or other areas)
        return {
            soilHealthScore: 82,
            moistureLevel: 65,
            expectedYield: { value: 25, unit: 'quintal/acre' }, // Sugarcane/Onion yield
            alerts: [
                { type: 'nutrient_deficiency', severity: 'medium', message: 'Signs of potassium deficiency observed. Consider appropriate fertilization.'}
            ]
        };
    }
    
    return generateMockData(input.latitude, input.longitude);
  }
);
