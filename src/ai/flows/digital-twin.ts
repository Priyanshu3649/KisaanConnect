'use server';

/**
 * @fileOverview Provides a digital twin analysis for a farmer's field.
 *
 * - getDigitalTwinData - A function that returns simulated digital twin metrics.
 * - DigitalTwinInput - The input type for the getDigitalTwinData function.
 * - DigitalTwinOutput - The return type for the getDigitalTwinData function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const DigitalTwinInputSchema = z.object({
  fieldId: z.string().describe("The unique identifier for the farmer's field."),
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
      type: z.enum(['weed', 'infestation', 'nutrient_deficiency']),
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
    // In a real application, you would:
    // 1. Use the input.fieldId to retrieve field boundary coordinates from a database.
    // 2. Fetch Sentinel-2 satellite imagery for those coordinates.
    // 3. (Optional) Fetch local sensor data or user-uploaded images.
    // 4. Pass the imagery and data to a multi-modal Gemini model.
    // 5. The model would analyze the data and return the structured output below.

    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network delay

    // Generate mock data based on a hash of the fieldId to make it unique but consistent
    const generateMockData = (fieldId: string): DigitalTwinOutput => {
        const hash = fieldId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        
        if (fieldId === 'field_2') {
             return {
                soilHealthScore: 65 + (hash % 10), // 65-74
                moistureLevel: 35 + (hash % 15), // 35-49
                expectedYield: {
                    value: 22 + (hash % 4), // 22-25
                    unit: 'quintal/acre',
                },
                alerts: [
                    {
                        type: 'infestation',
                        severity: 'high',
                        message: 'High probability of aphid infestation detected in the southern region. Immediate action required.'
                    }
                ]
            };
        }

        // Default for field_1
        return {
            soilHealthScore: 78 + (hash % 15), // 78-92
            moistureLevel: 45 + (hash % 20), // 45-64
            expectedYield: {
                value: 25 + (hash % 5), // 25-29
                unit: 'quintal/acre',
            },
            alerts: [
                {
                    type: 'weed',
                    severity: 'low',
                    message: 'Low density of broadleaf weeds detected in the northwest corner.'
                },
                {
                    type: 'nutrient_deficiency',
                    severity: 'medium',
                    message: 'Signs of nitrogen deficiency observed in the central area. Consider top-dressing.'
                }
            ]
        };
    }
    
    return generateMockData(input.fieldId);
  }
);
