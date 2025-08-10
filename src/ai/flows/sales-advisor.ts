'use server';

/**
 * @fileOverview An AI tool that analyzes Mandi price trends and crop cycles to suggest the best times for a farmer to sell their produce.
 *
 * - getSalesAdvice - A function that returns a sales recommendation and price forecast.
 * - SalesAdviceInput - The input type for the getSalesAdvice function.
 * - SalesAdviceOutput - The return type for the getSalesAdvice function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getMandiPrices, type MandiPriceRecord } from './mandi-prices';
import { format, addDays } from 'date-fns';

const SalesAdviceInputSchema = z.object({
  commodity: z.string().describe('The commodity to get advice for (e.g., "Potato").'),
  market: z.string().describe('The specific market/city.'),
  state: z.string().describe('The state of the market.'),
  language: z.string().optional().default('en').describe('The language for the response.'),
});
export type SalesAdviceInput = z.infer<typeof SalesAdviceInputSchema>;

const SalesAdviceOutputSchema = z.object({
    recommendation: z.enum(['Strong Sell', 'Sell', 'Hold', 'Buy']).describe('The recommendation for the farmer.'),
    confidence: z.number().min(0).max(1).describe('The confidence level of the recommendation (0 to 1).'),
    reasoning: z.string().describe('A detailed explanation for the recommendation.'),
    priceForecast: z.array(z.object({
        date: z.string().describe("The forecasted date (e.g., 'YYYY-MM-DD')."),
        price: z.number().describe('The predicted model price in INR per quintal.'),
    })).describe('A 7-day price forecast.'),
});
export type SalesAdviceOutput = z.infer<typeof SalesAdviceOutputSchema>;

export async function getSalesAdvice(input: SalesAdviceInput): Promise<SalesAdviceOutput> {
  return salesAdvisorFlow(input);
}

// Internal function to prepare data for the prompt
const analyzePriceData = (prices: MandiPriceRecord[]) => {
    if (prices.length < 2) {
        return {
            currentPrice: prices[0] ? parseInt(prices[0]['Model Prize']) : 0,
            trend: 'stable',
            volatility: 0,
            recentPrices: prices.map(p => parseInt(p['Model Prize'])),
        }
    }
    const sortedPrices = [...prices].sort((a,b) => new Date(a.Date).getTime() - new Date(b.Date).getTime());
    const modelPrices = sortedPrices.map(p => parseInt(p['Model Prize']));
    const latestPrice = modelPrices[modelPrices.length - 1];
    const previousPrice = modelPrices[modelPrices.length - 2];
    
    const trend = latestPrice > previousPrice ? 'up' : 'down';
    
    const average = modelPrices.reduce((sum, price) => sum + price, 0) / modelPrices.length;
    const volatility = Math.sqrt(modelPrices.map(p => Math.pow(p - average, 2)).reduce((sum, sq) => sum + sq, 0) / modelPrices.length);

    return {
        currentPrice: latestPrice,
        trend,
        volatility: (volatility / average) * 100, // as a percentage
        recentPrices: modelPrices,
    };
}


const prompt = ai.definePrompt({
  name: 'salesAdvisorPrompt',
  input: { schema: z.object({
    commodity: z.string(),
    market: z.string(),
    language: z.string(),
    analysis: z.object({
        currentPrice: z.number(),
        trend: z.string(),
        volatility: z.number(),
        recentPrices: z.array(z.number()),
    })
  }) },
  output: { schema: SalesAdviceOutputSchema },
  prompt: `You are an expert agricultural market analyst. Your goal is to provide a clear sales recommendation to a farmer for their commodity.

  Commodity: {{{commodity}}}
  Market: {{{market}}}
  Language: {{{language}}}

  Market Analysis:
  - Current Model Price: ₹{{{analysis.currentPrice}}} per quintal
  - Recent Trend: {{{analysis.trend}}}
  - Price Volatility: {{{analysis.volatility}}}%
  - Recent Prices (last 8 days): {{{analysis.recentPrices}}}

  Based on this analysis, provide a recommendation ('Strong Sell', 'Sell', 'Hold', 'Buy'), a confidence score (0-1), a detailed reasoning, and a 7-day price forecast.
  The reasoning should be easy for a farmer to understand. For the forecast, extrapolate the trend but consider market volatility; if volatility is high, make the forecast more conservative.
  The entire response must be in the specified language: {{language}}.
  `,
});


const salesAdvisorFlow = ai.defineFlow(
  {
    name: 'salesAdvisorFlow',
    inputSchema: SalesAdviceInputSchema,
    outputSchema: SalesAdviceOutputSchema,
  },
  async (input) => {
    
    const priceData = await getMandiPrices({
        commodity: input.commodity,
        state: input.state,
        market: input.market,
    });
    
    if (priceData.length === 0) {
        throw new Error(`No price data found for ${input.commodity} in ${input.market}, ${input.state}`);
    }

    const analysis = analyzePriceData(priceData);

    const { output } = await prompt({
        commodity: input.commodity,
        market: input.market,
        language: input.language,
        analysis,
    });
    
    // Fallback logic if the LLM fails to generate a forecast
    if (!output.priceForecast || output.priceForecast.length === 0) {
        const lastPrice = analysis.currentPrice;
        output.priceForecast = Array.from({ length: 7 }).map((_, i) => ({
            date: format(addDays(new Date(), i + 1), 'yyyy-MM-dd'),
            price: lastPrice + (analysis.trend === 'up' ? 1 : -1) * (i + 1) * (analysis.volatility * 2),
        }));
    }

    return output;
  }
);
