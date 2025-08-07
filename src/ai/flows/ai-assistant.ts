// 'use server';
/**
 * @fileOverview An AI assistant for farmers. This agent allows farmers to ask questions about government subsidies, crop advice, or market prices and receive instant voice-based answers with summarized information and reasoning.
 *
 * - aiAssistant - A function that handles the AI assistant process.
 * - AiAssistantInput - The input type for the aiAssistant function.
 * - AiAssistantOutput - The return type for the aiAssistant function.
 */

'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import wav from 'wav';

const AiAssistantInputSchema = z.object({
  query: z.string().describe('The question about government subsidies, crop advice, or market prices.'),
});
export type AiAssistantInput = z.infer<typeof AiAssistantInputSchema>;

const AiAssistantOutputSchema = z.object({
  summary: z.string().describe('A concise, direct answer to the user\'s question.'),
  reasoning: z.string().describe('A brief explanation of the reasoning or context behind the summary.'),
  audio: z.string().describe('The voice-based answer in base64 encoded WAV format.'),
});
export type AiAssistantOutput = z.infer<typeof AiAssistantOutputSchema>;

export async function aiAssistant(input: AiAssistantInput): Promise<AiAssistantOutput> {
  return aiAssistantFlow(input);
}

const aiAssistantPrompt = ai.definePrompt({
  name: 'aiAssistantPrompt',
  input: {schema: AiAssistantInputSchema},
  output: {schema: z.object({
      summary: z.string().describe('A concise, direct answer to the user\'s question.'),
      reasoning: z.string().describe('A brief explanation of the reasoning or context behind the summary.'),
  })},
  prompt: `You are an expert AI assistant for Indian farmers. Your name is KisaanConnect Assistant. Answer the user's question in a clear, easy-to-understand way.

The user's question could be about government schemes, crop management, pest control, market prices, or general farming advice.

Your response must have two parts:
1.  **Summary:** A direct and concise answer to the question.
2.  **Reasoning:** A brief explanation providing more context, sources, or the "why" behind your answer.

Question: {{{query}}}
`,
});

const aiAssistantFlow = ai.defineFlow(
  {
    name: 'aiAssistantFlow',
    inputSchema: AiAssistantInputSchema,
    outputSchema: AiAssistantOutputSchema,
  },
  async input => {
    const {output} = await aiAssistantPrompt(input);
    const textToSpeak = `Summary: ${output?.summary}\nReasoning: ${output?.reasoning}`;

    // Convert the summary and reasoning to speech
    const ttsResult = await ai.generate({
      model: 'googleai/gemini-2.5-flash-preview-tts',
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {voiceName: 'Algenib'},
          },
        },
      },
      prompt: textToSpeak,
    });

    if (!ttsResult.media) {
      throw new Error('no media returned');
    }
    const audioBuffer = Buffer.from(
      ttsResult.media.url.substring(ttsResult.media.url.indexOf(',') + 1),
      'base64'
    );

    const audio = 'data:audio/wav;base64,' + (await toWav(audioBuffer));

    return {
      summary: output?.summary ?? 'No summary available.',
      reasoning: output?.reasoning ?? 'No reasoning available.',
      audio,
    };
  }
);

async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    const bufs = [] as any[];
    writer.on('error', reject);
    writer.on('data', function (d) {
      bufs.push(d);
    });
    writer.on('end', function () {
      resolve(Buffer.concat(bufs).toString('base64'));
    });

    writer.write(pcmData);
    writer.end();
  });
}
