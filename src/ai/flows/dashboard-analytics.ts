'use server';

/**
 * @fileOverview Generates dynamic, realistic dashboard analytics for a farmer.
 *
 * - getDashboardAnalytics - A function that returns simulated key performance indicators and chart data.
 * - DashboardAnalyticsInput - The input type for the getDashboardAnalytics function.
 * - DashboardAnalyticsOutput - The return type for the getDashboardAnalytics function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { format, subMonths } from 'date-fns';

const DashboardAnalyticsInputSchema = z.object({
  userId: z.string().describe("The unique identifier for the farmer."),
  email: z.string().optional().describe("The user's email address."),
  language: z.string().optional().default('en').describe('The language for the response.'),
});
export type DashboardAnalyticsInput = z.infer<typeof DashboardAnalyticsInputSchema>;

const DashboardAnalyticsOutputSchema = z.object({
    totalRevenue: z.number().describe('The total revenue for the current year in INR.'),
    revenueChange: z.number().describe('The percentage change in revenue compared to the previous month.'),
    cropVarieties: z.number().int().describe('The number of different crop varieties currently planted.'),
    cropChange: z.number().int().describe('The change in the number of crop varieties since the last season.'),
    monthlyEarnings: z.array(z.object({
        month: z.string().describe("The month, abbreviated to 3 letters (e.g., 'Jan')."),
        earnings: z.number().describe('The earnings for that month in INR.'),
    })).length(6).describe('An array of earnings for the last 6 months.'),
});
export type DashboardAnalyticsOutput = z.infer<typeof DashboardAnalyticsOutputSchema>;

export async function getDashboardAnalytics(input: DashboardAnalyticsInput): Promise<DashboardAnalyticsOutput> {
  return dashboardAnalyticsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'dashboardAnalyticsPrompt',
  input: { schema: z.object({ months: z.array(z.string()) }) },
  output: { schema: DashboardAnalyticsOutputSchema },
  prompt: `You are an expert agricultural data analyst. Your task is to generate a realistic but simulated dashboard summary for a small-holder farmer in India. The data should look plausible and be internally consistent.

  Generate the following metrics:
  - Total Revenue: A realistic annual revenue in Indian Rupees.
  - Revenue Change: A plausible percentage change (+/-) from the previous month.
  - Crop Varieties: A small number of crop varieties the farmer is currently growing.
  - Crop Change: How many more or fewer varieties they are growing compared to last season.
  - Monthly Earnings: Generate plausible earnings data for the last 6 months. The months are: {{{months}}}. The most recent month's earnings should align with the total revenue and revenue change percentage.

  Return the data strictly in the required JSON format. Be creative and vary the numbers to make it seem like a real, dynamic dashboard.`,
});

const demoUsers = [
    'pandeypriyanshu53@gmail.com',
    'admin@kissanconnect.com'
];

const dashboardAnalyticsFlow = ai.defineFlow(
  {
    name: 'dashboardAnalyticsFlow',
    inputSchema: DashboardAnalyticsInputSchema,
    outputSchema: DashboardAnalyticsOutputSchema,
  },
  async (input) => {
    // Generate the last 6 months' names for the prompt
    const lastSixMonths = Array.from({ length: 6 }).map((_, i) => {
        return format(subMonths(new Date(), 5 - i), 'MMM');
    });

    // For new users, return a default zero state.
    if (!input.email || !demoUsers.includes(input.email)) {
        return {
            totalRevenue: 0,
            revenueChange: 0,
            cropVarieties: 0,
            cropChange: 0,
            monthlyEarnings: lastSixMonths.map(month => ({ month, earnings: 0 })),
        };
    }

    // For demo users, generate simulated data.
    const { output } = await prompt({ months: lastSixMonths });
    return output!;
  }
);
