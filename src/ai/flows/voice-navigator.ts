'use server';

/**
 * @fileOverview Processes voice commands for app navigation.
 *
 * - processVoiceCommand - A function that interprets a voice command and returns a navigation route.
 * - VoiceCommandInput - The input type for the processVoiceCommand function.
 * - VoiceCommandOutput - The return type for the processVoiceCommand function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const VoiceCommandInputSchema = z.object({
  command: z.string().describe('The voice command spoken by the user.'),
  language: z.string().describe('The language of the command (e.g., "en" or "hi").'),
});
export type VoiceCommandInput = z.infer<typeof VoiceCommandInputSchema>;

const VoiceCommandOutputSchema = z.object({
    action: z.enum(['navigate', 'logout', 'unknown']).describe("The action to perform."),
    route: z.string().optional().describe("The path to navigate to, if the action is 'navigate'."),
    reasoning: z.string().describe('The reasoning for the determined action.')
});
export type VoiceCommandOutput = z.infer<typeof VoiceCommandOutputSchema>;

// Exported wrapper function
export async function processVoiceCommand(input: VoiceCommandInput): Promise<VoiceCommandOutput> {
  return voiceNavigatorFlow(input);
}


const prompt = ai.definePrompt({
    name: 'voiceNavigatorPrompt',
    input: { schema: VoiceCommandInputSchema },
    output: { schema: VoiceCommandOutputSchema },
    prompt: `You are an AI assistant for the KisaanConnect app, responsible for understanding voice commands for navigation.
    The user's command is in {{language}}.
    
    The available pages are:
    - /dashboard (Dashboard, home)
    - /dashboard/crop-diagnosis (Crop Diagnosis, fasal rog)
    - /dashboard/mandi-prices (Mandi Prices, mandi bhav)
    - /dashboard/equipment-rentals (Equipment Rentals, upkaran)
    - /dashboard/scheme-navigator (Scheme Navigator, sarkari yojana)
    - /dashboard/organics-support (Organics Support, jaivik kheti)
    - /dashboard/help-feedback (Help & Feedback, sahayata)
    
    The user can also 'logout'.

    User command: "{{{command}}}"

    Your task is to:
    1.  Determine if the user wants to navigate to a page, logout, or if the command is unclear.
    2.  If it's a navigation command, identify the correct route from the list above.
    3.  If the user wants to log out, the action is 'logout'.
    4.  If the command is not understood, the action is 'unknown'.
    5.  Provide a short reasoning for your decision.`,
});

const voiceNavigatorFlow = ai.defineFlow(
  {
    name: 'voiceNavigatorFlow',
    inputSchema: VoiceCommandInputSchema,
    outputSchema: VoiceCommandOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
