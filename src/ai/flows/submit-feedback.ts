'use server';

/**
 * @fileOverview Processes user feedback submissions.
 *
 * - submitFeedback - A function that handles feedback processing.
 * - SubmitFeedbackInput - The input type for the submitFeedback function.
 * - SubmitFeedbackOutput - The return type for the submitFeedback function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SubmitFeedbackInputSchema = z.object({
  type: z.string().describe('The type of feedback (e.g., "feedback", "bug", "feature").'),
  subject: z.string().describe('The subject line of the feedback.'),
  message: z.string().describe('The detailed feedback message from the user.'),
  language: z.string().describe('The language for the response (e.g., "en" or "hi").'),
});
export type SubmitFeedbackInput = z.infer<typeof SubmitFeedbackInputSchema>;

const SubmitFeedbackOutputSchema = z.object({
  confirmationMessage: z.string().describe('A confirmation message to be shown to the user.'),
  ticketId: z.string().describe('A unique identifier for the submitted feedback.'),
});
export type SubmitFeedbackOutput = z.infer<typeof SubmitFeedbackOutputSchema>;


// Exported wrapper function
export async function submitFeedback(input: SubmitFeedbackInput): Promise<SubmitFeedbackOutput> {
  return submitFeedbackFlow(input);
}


const prompt = ai.definePrompt({
    name: 'feedbackProcessorPrompt',
    input: { schema: SubmitFeedbackInputSchema },
    output: { schema: SubmitFeedbackOutputSchema },
    prompt: `You are an AI assistant responsible for processing user feedback for the KisaanConnect app.
    
    A user has submitted the following information:
    - Type: {{{type}}}
    - Subject: {{{subject}}}
    - Message: {{{message}}}

    Your task is to:
    1.  Generate a unique ticket ID for this submission. The ID should be in the format KC-FB-[8 random alphanumeric characters].
    2.  Create a friendly, professional confirmation message for the user, acknowledging their submission. The message must be in the specified language: {{language}}.
    
    Return the confirmation message and the ticket ID.`,
});

const submitFeedbackFlow = ai.defineFlow(
  {
    name: 'submitFeedbackFlow',
    inputSchema: SubmitFeedbackInputSchema,
    outputSchema: SubmitFeedbackOutputSchema,
  },
  async (input) => {
    
    // In a real application, you would save the feedback to a database here.
    // For example:
    // await db.collection('feedback').add({ 
    //   ...input,
    //   createdAt: new Date(),
    //   status: 'New'
    // });
    
    const { output } = await prompt(input);

    return output!;
  }
);
