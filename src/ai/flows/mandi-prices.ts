'use server';

/**
 * @fileOverview A mock service for fetching live Mandi (market) prices.
 *
 * - getMandiPrices - A function that returns simulated real-time market prices.
 * - GetMandiPricesInput - The input type for the getMandiPrices function.
 * - GetMandiPricesOutput - The return type for the getMandiPrices function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const CropPriceSchema = z.object({
  crop: z.string().describe('The name of the crop.'),
  variety: z.string().describe('The variety of the crop.'),
  price: z.number().describe('The price per quintal in INR.'),
  market: z.string().describe('The market where the price was recorded.'),
  trend: z.enum(['up', 'down', 'stable']).describe('The price trend.'),
  recommendation: z
    .enum(['Sell Now', 'Hold', 'Good Price'])
    .describe('A recommendation for the farmer.'),
});

const GetMandiPricesInputSchema = z.object({
  market: z.string().describe('The market to fetch prices for. "All Markets" fetches for all available markets.'),
});
export type GetMandiPricesInput = z.infer<typeof GetMandiPricesInputSchema>;

const GetMandiPricesOutputSchema = z.array(CropPriceSchema);
export type GetMandiPricesOutput = z.infer<typeof GetMandiPricesOutputSchema>;
export type CropPrice = z.infer<typeof CropPriceSchema>;


const allMockData: CropPrice[] = [
  { crop: "Tomato", variety: "Desi", price: 2500 + Math.floor(Math.random() * 500) - 250, market: "Pune", trend: "up", recommendation: "Sell Now" },
  { crop: "Onion", variety: "Red", price: 1800 + Math.floor(Math.random() * 300) - 150, market: "Nashik", trend: "down", recommendation: "Hold" },
  { crop: "Potato", variety: "Jyoti", price: 2200 + Math.floor(Math.random() * 200) - 100, market: "Indore", trend: "up", recommendation: "Good Price" },
  { crop: "Wheat", variety: "Lokwan", price: 2100 + Math.floor(Math.random() * 100) - 50, market: "Ludhiana", trend: "stable", recommendation: "Hold" },
  { crop: "Soybean", variety: "JS-335", price: 4500 + Math.floor(Math.random() * 600) - 300, market: "Nagpur", trend: "up", recommendation: "Sell Now" },
  { crop: "Cotton", variety: "BT", price: 5500 + Math.floor(Math.random() * 400) - 200, market: "Aurangabad", trend: "down", recommendation: "Hold" },
  { crop: "Sugarcane", variety: "Co-86032", price: 320 + Math.floor(Math.random() * 50) - 25, market: "Kolhapur", trend: "stable", recommendation: "Good Price" },
  { crop: "Tomato", variety: "Hybrid", price: 2800 + Math.floor(Math.random() * 400) - 200, market: "Nashik", trend: "up", recommendation: "Sell Now" },
  { crop: "Onion", variety: "White", price: 2000 + Math.floor(Math.random() * 350) - 175, market: "Pune", trend: "up", recommendation: "Good Price" },
];


export async function getMandiPrices(input: GetMandiPricesInput): Promise<GetMandiPricesOutput> {
  return getMandiPricesFlow(input);
}


const getMandiPricesFlow = ai.defineFlow(
  {
    name: 'getMandiPricesFlow',
    inputSchema: GetMandiPricesInputSchema,
    outputSchema: GetMandiPricesOutputSchema,
  },
  async (input) => {
    // In a real application, you would replace this mock implementation
    // with a call to the Agmarknet API.
    //
    // Example:
    // const response = await fetch(`https://api.agmarknet.gov.in/v1/...?market=${input.market}`, {
    //   headers: { 'Authorization': `Bearer ${process.env.AGMARKNET_API_KEY}` }
    // });
    // const data = await response.json();
    // return data.prices;
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    if (input.market === 'All Markets') {
      return allMockData;
    }
    
    return allMockData.filter(item => item.market === input.market);
  }
);
