
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
  selectedCrop: z.string().optional().describe("The specific crop selected by the user for financial analysis."),
});
export type DigitalTwinInput = z.infer<typeof DigitalTwinInputSchema>;

const FinancialAnalysisSchema = z.object({
    grossRevenue: z.number().describe('Estimated gross revenue in INR per acre.'),
    totalCosts: z.number().describe('Total estimated costs in INR per acre.'),
    expectedProfit: z.number().describe('Estimated net profit in INR per acre.'),
    returnOnInvestment: z.number().describe('Return on Investment (ROI) as a percentage.'),
    costBreakdown: z.object({
        seeds: z.number().describe('Cost for seeds.'),
        fertilizers: z.number().describe('Cost for fertilizers.'),
        pesticides: z.number().describe('Cost for pesticides and pest control.'),
        irrigation: z.number().describe('Cost for irrigation.'),
        labor: z.number().describe('Cost for manual labor.'),
        harvesting: z.number().describe('Cost for harvesting and post-harvest activities.'),
    }),
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
  financialAnalysis: z.object({
      conventional: FinancialAnalysisSchema,
      organic: FinancialAnalysisSchema,
  }).describe('A detailed financial breakdown for the selected crop.'),
  cropFailureProbability: z.number().min(0).max(100).describe('The probability of crop failure as a percentage.'),
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
    // This function simulates fetching data based on geo-location and a selected crop.
    await new Promise(resolve => setTimeout(resolve, 1500)); 
    
    // Generate base data based on location
    const baseData = generateBaseMockData(input.latitude, input.longitude);
    
    // Generate financial data for the selected crop, or the first recommended crop by default
    const cropForAnalysis = input.selectedCrop || baseData.recommendedCrops[0];
    const financialAnalysis = generateFinancialMockData(cropForAnalysis);

    return {
        ...baseData,
        financialAnalysis,
    };
  }
);


// Helper to generate financial data for a given crop
const generateFinancialMockData = (crop: string) => {
    const baseSeedCost = crop.length * 200 + 1000;
    const conventionalYield = 10 + (crop.length % 15); // quintals/acre
    const marketPrice = 2000 + (crop.length * 150); // INR/quintal

    const conventionalCosts = {
        seeds: baseSeedCost,
        fertilizers: 3500,
        pesticides: 1500,
        irrigation: 4000,
        labor: 8000,
        harvesting: 3000,
    };
    const totalConventionalCosts = Object.values(conventionalCosts).reduce((a, b) => a + b, 0);
    const conventionalRevenue = conventionalYield * marketPrice;
    const conventionalProfit = conventionalRevenue - totalConventionalCosts;

    const organicCosts = {
        seeds: baseSeedCost * 1.5,
        fertilizers: 5000, // Organic fertilizers can be more expensive
        pesticides: 2000, // Bio-pesticides
        irrigation: 3800,
        labor: 9500, // Often higher for organic
        harvesting: 3200,
    };
    const totalOrganicCosts = Object.values(organicCosts).reduce((a, b) => a + b, 0);
    const organicRevenue = (conventionalYield * 0.9) * (marketPrice * 1.3); // Lower yield, higher price
    const organicProfit = organicRevenue - totalOrganicCosts;

    return {
        conventional: {
            grossRevenue: conventionalRevenue,
            totalCosts: totalConventionalCosts,
            expectedProfit: conventionalProfit,
            returnOnInvestment: (conventionalProfit / totalConventionalCosts) * 100,
            costBreakdown: conventionalCosts,
        },
        organic: {
            grossRevenue: organicRevenue,
            totalCosts: totalOrganicCosts,
            expectedProfit: organicProfit,
            returnOnInvestment: (organicProfit / totalOrganicCosts) * 100,
            costBreakdown: organicCosts,
        }
    };
};

// Helper to generate non-financial data based on location
const generateBaseMockData = (lat: number, lon: number) => {
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
                { type: 'water_stress' as const, severity: 'low' as const, message: 'Slightly low moisture detected. Irrigation recommended for wheat crop within 3 days.'},
                { type: 'weed' as const, severity: 'low' as const, message: 'Low density of Phalaris minor detected. Monitor and control before it spreads.'},
            ],
            cropFailureProbability: 15,
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
            { type: 'heat_stress' as const, severity: 'medium' as const, message: 'High temperatures expected. Ensure adequate shading for sensitive crops.'},
        ],
        cropFailureProbability: 22,
    };
}
