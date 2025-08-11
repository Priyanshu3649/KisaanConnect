
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

const CostEstimationSchema = z.object({
    seeds: z.number().describe('Estimated cost for seeds in INR per acre.'),
    irrigation: z.number().describe('Estimated cost for irrigation in INR per acre.'),
    fertilizers: z.number().describe('Estimated cost for fertilizers in INR per acre.'),
});

const DigitalTwinOutputSchema = z.object({
  soilHealthScore: z.number().min(0).max(100).describe('The overall soil health score (0-100).'),
  moistureLevel: z.number().min(0).max(100).describe('The current soil moisture percentage.'),
  soilType: z.string().describe('The type of soil in the area (e.g., "Loamy Sand").'),
  nitrogenLevel: z.number().min(0).max(100).describe('The soil nitrogen (N) level percentage of optimum.'),
  phosphorusLevel: z.number().min(0).max(100).describe('The soil phosphorus (P) level percentage of optimum.'),
  potassiumLevel: z.number().min(0).max(100).describe('The soil potassium (K) level percentage of optimum.'),
  phLevel: z.number().min(0).max(14).describe('The soil pH level.'),
  recommendedCrops: z.array(z.string()).describe('A list of crops best suited for the current conditions.'),
  yieldForecast: z.array(z.object({
    crop: z.string().describe('The name of the crop.'),
    value: z.number().describe('The numerical value of the yield.'),
    unit: z.string().describe('The unit of the yield (e.g., "quintal/acre").'),
  })).describe('Expected yield for various suitable crops.'),
  bestSuggestion: z.string().describe('The single most important suggestion or takeaway for the farmer, including the best crop to sow based on past trends.'),
  alerts: z.array(z.object({
      type: z.enum(['weed', 'infestation', 'nutrient_deficiency', 'water_stress', 'heat_stress']),
      severity: z.enum(['low', 'medium', 'high']),
      message: z.string().describe('A descriptive message about the alert.'),
  })).describe('A list of alerts for the field (live farm updates).'),
  costEstimation: CostEstimationSchema.describe('Cost estimation for conventional farming.'),
  organicCostEstimation: CostEstimationSchema.describe('Cost estimation for organic farming.'),
  cropFailureProbability: z.number().min(0).max(100).describe('The probability of crop failure as a percentage.'),
  expectedProfit: z.number().describe('The expected profit in INR per acre.'),
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
    // In a real application, you would use the coordinates to get real data from satellite imagery APIs (like Sentinel-2),
    // weather APIs, and soil databases.

    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network delay

    const generateMockData = (lat: number, lon: number): DigitalTwinOutput => {
        // Simple geo-fencing for different regions to simulate varied data
        
        // Haryana/Punjab (e.g., for wheat/rice)
        if (lat > 28.5 && lat < 32.5 && lon > 74.0 && lon < 78.0) {
             return {
                soilHealthScore: 85,
                moistureLevel: 55,
                soilType: "Alluvial Clay",
                nitrogenLevel: 80,
                phosphorusLevel: 75,
                potassiumLevel: 82,
                phLevel: 7.2,
                recommendedCrops: ["Wheat", "Rice", "Sugarcane", "Maize"],
                yieldForecast: [
                    { crop: "Wheat", value: 48, unit: "quintal/acre" },
                    { crop: "Rice", value: 42, unit: "quintal/acre" },
                ],
                bestSuggestion: "Past trends show high yield for Wheat (HD-3086 variety) in this region. Soil nitrogen levels are optimal; consider a top-dressing of urea after the first irrigation cycle to maximize tillering.",
                alerts: [
                    { type: 'water_stress', severity: 'low', message: 'Slightly low moisture detected. Irrigation recommended for wheat crop within 3 days.'},
                    { type: 'weed', severity: 'low', message: 'Low density of Phalaris minor detected. Monitor and control before it spreads.'},
                ],
                costEstimation: { seeds: 2200, irrigation: 4500, fertilizers: 5500 },
                organicCostEstimation: { seeds: 3500, irrigation: 4000, fertilizers: 7500 },
                cropFailureProbability: 15,
                expectedProfit: 45000,
            };
        }

        // Rajasthan/Gujarat (Arid/Semi-Arid)
        if (lat > 23.0 && lat < 28.0 && lon > 69.0 && lon < 74.0) {
            return {
                soilHealthScore: 45,
                moistureLevel: 25,
                soilType: "Sandy Loam",
                nitrogenLevel: 40,
                phosphorusLevel: 55,
                potassiumLevel: 60,
                phLevel: 8.1,
                recommendedCrops: ["Millet (Bajra)", "Sorghum (Jowar)", "Guar", "Mustard"],
                yieldForecast: [
                    { crop: "Millet", value: 8, unit: "quintal/acre" },
                    { crop: "Mustard", value: 7, unit: "quintal/acre" },
                ],
                bestSuggestion: "Millet (Bajra) is highly recommended due to its drought resistance, fitting past climate trends. High soil pH may reduce nutrient availability; incorporating organic matter can improve water retention.",
                alerts: [
                    { type: 'water_stress', severity: 'high', message: 'Critical water stress detected. Immediate irrigation is required to prevent crop loss.' },
                    { type: 'heat_stress', severity: 'medium', message: 'High temperatures expected. Ensure crops are not water-stressed to mitigate heat damage.' },
                ],
                costEstimation: { seeds: 800, irrigation: 2500, fertilizers: 2000 },
                organicCostEstimation: { seeds: 1200, irrigation: 2200, fertilizers: 3500 },
                cropFailureProbability: 35,
                expectedProfit: 12000,
            };
        }

        // Maharashtra - Pune/Nashik region (Horticulture)
        if (lat > 18.4 && lat < 20.1 && lon > 73.5 && lon < 74.5) {
            return {
                soilHealthScore: 82,
                moistureLevel: 65,
                soilType: "Black Cotton Soil",
                nitrogenLevel: 85,
                phosphorusLevel: 70,
                potassiumLevel: 65,
                phLevel: 7.8,
                recommendedCrops: ["Onion", "Grapes", "Sugarcane", "Tomato"],
                yieldForecast: [
                    { crop: "Onion", value: 100, unit: "quintal/acre"},
                    { crop: "Sugarcane", value: 400, unit: "ton/acre"}, // Note different unit
                ],
                bestSuggestion: "Onion cultivation shows strong profitability in recent years. High humidity poses a risk of fungal diseases; ensure proper ventilation and consider prophylactic organic spray.",
                alerts: [
                    { type: 'nutrient_deficiency', severity: 'medium', message: 'Signs of potassium deficiency observed. Consider appropriate fertilization for sugarcane.'},
                    { type: 'infestation', severity: 'low', message: 'Minor thrips infestation detected in onion crop. Monitor population.'}
                ],
                costEstimation: { seeds: 5000, irrigation: 8000, fertilizers: 7000 },
                organicCostEstimation: { seeds: 7500, irrigation: 7000, fertilizers: 9000 },
                cropFailureProbability: 18,
                expectedProfit: 95000,
            };
        }
        
        // Default (simulating Central India)
        return {
            soilHealthScore: 68,
            moistureLevel: 55,
            soilType: "Red Loam",
            nitrogenLevel: 55,
            phosphorusLevel: 65,
            potassiumLevel: 70,
            phLevel: 6.5,
            recommendedCrops: ["Soybean", "Cotton", "Gram"],
            yieldForecast: [
                { crop: "Soybean", value: 10, unit: "quintal/acre" },
                { crop: "Cotton", value: 8, unit: "quintal/acre" },
            ],
            bestSuggestion: "Soybean is the suggested crop based on market trends and soil suitability. High temperatures are expected next week, ensure adequate moisture to mitigate heat stress.",
            alerts: [
                { type: 'heat_stress', severity: 'medium', message: 'High temperatures expected. Ensure adequate shading for sensitive crops.'},
            ],
            costEstimation: { seeds: 1800, irrigation: 3500, fertilizers: 4000 },
            organicCostEstimation: { seeds: 2800, irrigation: 3000, fertilizers: 6000 },
            cropFailureProbability: 22,
            expectedProfit: 28000,
        };
    }
    
    return generateMockData(input.latitude, input.longitude);
  }
);
