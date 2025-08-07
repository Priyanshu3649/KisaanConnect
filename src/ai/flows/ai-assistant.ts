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
import { getWeatherTool } from './get-weather';
import { getMandiPricesTool } from './mandi-prices';


const AiAssistantInputSchema = z.object({
  query: z.string().describe('The question about government subsidies, crop advice, or market prices.'),
  language: z.string().optional().describe('The language for the response (e.g., "en" or "hi").'),
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

// Map language codes to specific TTS voices for better quality
const languageToVoice: Record<string, string> = {
    'en': 'Algenib', // English
    'hi': 'en-IN-Wavenet-D', // Hindi (using a high-quality en-IN voice as a proxy)
    'pa': 'en-IN-Wavenet-D', // Punjabi (proxy)
    'mr': 'en-IN-Wavenet-D', // Marathi (proxy)
    'ta': 'ta-IN-Wavenet-A', // Tamil
    'te': 'te-IN-Standard-A', // Telugu
}

const aiAssistantPrompt = ai.definePrompt({
  name: 'aiAssistantPrompt',
  tools: [getWeatherTool, getMandiPricesTool],
  input: {schema: AiAssistantInputSchema},
  output: {schema: z.object({
      summary: z.string().describe('A concise, direct answer to the user\'s question.'),
      reasoning: z.string().describe('A brief explanation of the reasoning or context behind the summary.'),
  })},
  prompt: `You are an expert AI assistant for Indian farmers. Your name is KisaanConnect Assistant. Answer the user's question in a clear, easy-to-understand way, in the language of their query.

The user's question could be about government schemes, crop management, pest control, market prices, weather, or general farming advice. It could also be a simple greeting.

If the user asks about weather, use the getWeatherTool. You can ask the user for their location if it's not provided.
If the user asks about market (mandi) prices, use the getMandiPricesTool. You will likely need to know the commodity, state, and market/city.

Your response must have two parts:
1.  **Summary:** A direct and concise answer to the question. For a simple greeting like "Hello", this could be "Hi there!". When using a tool, summarize the tool's output in a conversational way (e.g., "The weather in Pune is currently 25°C and sunny.").
2.  **Reasoning:** A brief explanation providing more context, sources, or the "why" behind your answer. For a simple greeting, this could be "How can I help you today?". When using a tool, you can provide additional details from the tool's output here (e.g., "The high for today is 32°C and the low is 20°C.").

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
    const voice = languageToVoice[input.language || 'en'] || 'Algenib';

    // Convert the summary and reasoning to speech
    const ttsResult = await ai.generate({
      model: 'googleai/gemini-2.5-flash-preview-tts',
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {voiceName: voice},
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
