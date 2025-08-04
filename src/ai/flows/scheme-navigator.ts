// 'use server';
/**
 * @fileOverview A government scheme navigator AI agent. This agent allows farmers to ask questions about government subsidies and receive instant voice-based answers with summarized information and reasoning.
 *
 * - schemeNavigator - A function that handles the scheme navigation process.
 * - SchemeNavigatorInput - The input type for the schemeNavigator function.
 * - SchemeNavigatorOutput - The return type for the schemeNavigator function.
 */

'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import wav from 'wav';

const SchemeNavigatorInputSchema = z.object({
  query: z.string().describe('The question about government subsidies.'),
});
export type SchemeNavigatorInput = z.infer<typeof SchemeNavigatorInputSchema>;

const SchemeNavigatorOutputSchema = z.object({
  summary: z.string().describe('The summarized information about the relevant government subsidies.'),
  reasoning: z.string().describe('The reasoning for the summarized information.'),
  audio: z.string().describe('The voice-based answer in base64 encoded WAV format.'),
});
export type SchemeNavigatorOutput = z.infer<typeof SchemeNavigatorOutputSchema>;

export async function schemeNavigator(input: SchemeNavigatorInput): Promise<SchemeNavigatorOutput> {
  return schemeNavigatorFlow(input);
}

const schemeNavigatorPrompt = ai.definePrompt({
  name: 'schemeNavigatorPrompt',
  input: {schema: SchemeNavigatorInputSchema},
  output: {schema: SchemeNavigatorOutputSchema},
  prompt: `You are an expert in government subsidies for farmers. Answer the question in a way that is easy to understand.

Question: {{{query}}}

Summarize the information and provide reasoning for your answer.

Summary:
Reasoning:`,
});

const schemeNavigatorFlow = ai.defineFlow(
  {
    name: 'schemeNavigatorFlow',
    inputSchema: SchemeNavigatorInputSchema,
    outputSchema: SchemeNavigatorOutputSchema,
  },
  async input => {
    const {output} = await schemeNavigatorPrompt(input);

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
      prompt: output?.summary + '\n' + output?.reasoning,
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
