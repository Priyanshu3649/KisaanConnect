'use server';

/**
 * @fileOverview A service for fetching live Mandi (market) prices, structured to mirror the Agmarknet API.
 *
 * - getMandiPrices - A function that returns simulated real-time market prices.
 * - GetMandiPricesInput - The input type for the getMandiPrices function.
 * - GetMandiPricesOutput - The return type for the getMandiPrices function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { subDays, format } from 'date-fns';

const MandiPriceRecordSchema = z.object({
  'S.No': z.string(),
  City: z.string(),
  Commodity: z.string(),
  'Min Prize': z.string(),
  'Max Prize': z.string(),
  'Model Prize': z.string(),
  Date: z.string(),
});

const GetMandiPricesInputSchema = z.object({
  commodity: z.string().describe('The commodity to fetch prices for (e.g., "Potato").'),
  state: z.string().describe('The state to fetch prices for (e.g., "Karnataka").'),
  market: z.string().describe('The market to fetch prices for (e.g., "Bangalore").'),
});
export type GetMandiPricesInput = z.infer<typeof GetMandiPricesInputSchema>;

const GetMandiPricesOutputSchema = z.array(MandiPriceRecordSchema);
export type GetMandiPricesOutput = z.infer<typeof GetMandiPricesOutputSchema>;
export type MandiPriceRecord = z.infer<typeof MandiPriceRecordSchema>;


// This function generates realistic mock data based on the input.
const generateMockData = (input: GetMandiPricesInput): MandiPriceRecord[] => {
    if (input.commodity === 'None' || input.state === 'None' || input.market === 'None') {
        return [];
    }

    const data: MandiPriceRecord[] = [];
    const basePrice = 2000 + (input.commodity.length * 100) % 500;
    
    for (let i = 0; i < 8; i++) {
        const date = subDays(new Date(), Math.floor(i / 2));
        const min = basePrice - 200 + Math.floor(Math.random() * 200);
        const max = min + 200 + Math.floor(Math.random() * 200);
        const model = Math.floor((min + max) / 2);

        data.push({
            'S.No': (i + 1).toString(),
            City: input.market,
            Commodity: input.commodity,
            'Min Prize': min.toString(),
            'Max Prize': max.toString(),
            'Model Prize': model.toString(),
            Date: format(date, 'yyyy-MM-dd'), // Use a standard, parseable date format
        });
    }
    return data;
}

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
    // DEVELOPER: When your API is deployed to a public URL, replace the mock implementation below
    // with a real fetch call.
    //
    // 1. Replace the line `const data = generateMockData(input);`
    // 2. Uncomment the following block and update the URL:
    /*
    const publicApiUrl = `https://your-deployed-api.com/request?commodity=${input.commodity}&state=${input.state}&market=${input.market}`;
    try {
        const response = await fetch(publicApiUrl);
        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
        }
        const data = await response.json();
        // IMPORTANT: Ensure the 'Date' field from your API is in a standard format like 'yyyy-MM-dd'
        return data.map(item => ({...item, Date: new Date(item.Date).toISOString().split('T')[0]}));
    } catch (error) {
        console.error("Failed to fetch from real API:", error);
        // Fallback to empty array or re-throw error
        return [];
    }
    */

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Generate mock data that matches the API structure
    const data = generateMockData(input);
    
    return data;
  }
);
