'use server';

/**
 * @fileOverview Calculates an agriculture-specific credit score for a farmer.
 *
 * - getAgriCreditScore - A function that returns a simulated agri-credit score and improvement tips.
 * - AgriCreditScoreInput - The input type for the getAgriCreditScore function.
 * - AgriCreditScoreOutput - The return type for the getAgriCreditScore function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AgriCreditScoreInputSchema = z.object({
  userId: z.string().describe("The unique identifier for the farmer."),
});
export type AgriCreditScoreInput = z.infer<typeof AgriCreditScoreInputSchema>;

const AgriCreditScoreOutputSchema = z.object({
    score: z.number().min(0).max(1000).describe('The calculated agri-credit score, from 0 to 1000.'),
    trend: z.enum(['up', 'down', 'stable']).describe("The recent trend of the score."),
    trendPoints: z.number().describe("The number of points the score has changed recently."),
    improvementTips: z.array(z.string()).describe('A list of actionable tips for the farmer to improve their score.'),
    badges: z.array(z.object({
        name: z.string().describe("The name of the badge, e.g., 'Reliable Renter'."),
        icon: z.enum(["Tractor", "ShieldCheck", "Star", "BadgeCheck"]).describe("The icon representing the badge."),
    })).describe('A list of badges earned by the farmer.'),
});
export type AgriCreditScoreOutput = z.infer<typeof AgriCreditScoreOutputSchema>;


export async function getAgriCreditScore(input: AgriCreditScoreInput): Promise<AgriCreditScoreOutput> {
  return agriCreditScoreFlow(input);
}


const agriCreditScoreFlow = ai.defineFlow(
  {
    name: 'agriCreditScoreFlow',
    inputSchema: AgriCreditScoreInputSchema,
    outputSchema: AgriCreditScoreOutputSchema,
  },
  async (input) => {
    // DEVELOPER: This is a mock implementation using static demo data.
    // In a real application, you would use the userId to fetch real data from various sources.

    // Simulate a delay for fetching and processing data.
    await new Promise(resolve => setTimeout(resolve, 1000));

    // For this simulation, we'll generate a consistent score based on the userId hash.
    const hash = input.userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const score = 600 + (hash % 250); // Generates a score between 600 and 850

    return {
        score: score,
        trend: 'up',
        trendPoints: 25,
        improvementTips: [
            "Rent out your equipment more regularly to boost your score.",
            "Sell your crops through verified buyers on the platform for better transaction records.",
            "Consider linking your loan repayment history for a potential score increase.",
        ],
        badges: [
            { name: "Reliable Renter", icon: "Tractor" },
            { name: "On-time Seller", icon: "ShieldCheck" },
            { name: "High Yield Hero", icon: "Star" },
        ],
    };
  }
);
