'use server';
/**
 * @fileOverview An AI-powered customer support IVR system.
 *
 * - customerSupport - A function that handles the interactive support call process.
 * - CustomerSupportInput - The input type for the customerSupport function.
 * - CustomerSupportOutput - The return type for the customerSupport function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import wav from 'wav';
import { getWeatherTool } from './get-weather';
import { getMandiPricesTool } from './mandi-prices';


const CustomerSupportInputSchema = z.object({
  step: z.enum(['welcome', 'main_menu_selection', 'mandi_prices_commodity', 'weather_location']).describe('The current step in the IVR flow.'),
  userInput: z.string().optional().describe('The user\'s selection or input.'),
  language: z.string().optional().describe('The language for the response (e.g., "en" or "hi").'),
  latitude: z.number().optional().describe("The user's current latitude for location-specific queries like weather."),
  longitude: z.number().optional().describe("The user's current longitude for location-specific queries like weather."),
});
export type CustomerSupportInput = z.infer<typeof CustomerSupportInputSchema>;

const CustomerSupportOutputSchema = z.object({
  response: z.string().describe('The text response to be spoken.'),
  audio: z.string().describe('The voice-based answer in base64 encoded WAV format.'),
  nextStep: z.string().describe('The next step in the conversation flow.'),
  isEnd: z.boolean().describe('Whether the conversation has ended.'),
});
export type CustomerSupportOutput = z.infer<typeof CustomerSupportOutputSchema>;

export async function customerSupport(input: CustomerSupportInput): Promise<CustomerSupportOutput> {
  return customerSupportFlow(input);
}


async function textToSpeech(text: string, language: string = 'en'): Promise<string> {
    const ttsResult = await ai.generate({
      model: 'googleai/gemini-2.5-flash-preview-tts',
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {voiceName: language === 'hi' ? 'en-IN-Wavenet-D' : 'Algenib'},
          },
        },
      },
      prompt: text,
    });

    if (!ttsResult.media) {
      throw new Error('no media returned from TTS');
    }
    const audioBuffer = Buffer.from(
      ttsResult.media.url.substring(ttsResult.media.url.indexOf(',') + 1),
      'base64'
    );

    return 'data:audio/wav;base64,' + (await toWav(audioBuffer));
}


const customerSupportFlow = ai.defineFlow(
  {
    name: 'customerSupportFlow',
    inputSchema: CustomerSupportInputSchema,
    outputSchema: CustomerSupportOutputSchema,
  },
  async (input) => {
    let responseText = '';
    let nextStep = '';
    let isEnd = false;

    switch (input.step) {
        case 'welcome':
            responseText = "Welcome to KisaanConnect Support. To know current Mandi prices, press 1. For a weather update, press 2. To speak to our scheme eligibility expert, press 3. To go back to the main menu at any time, press star.";
            nextStep = 'main_menu_selection';
            break;

        case 'main_menu_selection':
            switch (input.userInput) {
                case '1':
                    responseText = "You've selected Mandi Prices. Please tell me the name of the commodity you're interested in, for example, Potato.";
                    nextStep = 'mandi_prices_commodity';
                    break;
                case '2':
                    if (input.latitude && input.longitude) {
                        const weather = await getWeatherTool({ latitude: input.latitude, longitude: input.longitude });
                        if (weather) {
                           responseText = `The current weather in your location is ${weather.current.temperature} degrees Celsius and ${weather.current.condition}. The high for today is ${weather.current.high} and the low is ${weather.current.low}. To hear the main menu again, press star.`;
                        } else {
                           responseText = "Sorry, I couldn't fetch the weather for your location. Please try again later. To hear the main menu again, press star.";
                        }
                        nextStep = 'main_menu_selection';
                    } else {
                         responseText = "I need your location for a weather report. Could you please provide your city and state?";
                         nextStep = 'weather_location';
                    }
                    break;
                case '3':
                    responseText = "You've selected Scheme Eligibility. This feature is coming soon. To hear the main menu again, press star.";
                    nextStep = 'main_menu_selection';
                    break;
                default:
                    responseText = "Invalid selection. Please press 1 for Mandi prices, 2 for weather, or 3 for schemes. To end this call, press hash.";
                    nextStep = 'main_menu_selection';
                    break;
            }
            break;

        case 'mandi_prices_commodity':
            const commodity = input.userInput || 'Potato';
            const prices = await getMandiPricesTool({ commodity: commodity, state: 'Maharashtra', market: 'Pune' }); // Using defaults for demo
             if (prices && prices.length > 0) {
                const latestPrice = prices[0];
                responseText = `The latest model price for ${commodity} in Pune is ${latestPrice['Model Prize']} rupees per quintal. To check another commodity, please state the name. To go back to the main menu, press star.`;
            } else {
                responseText = `Sorry, I could not find prices for ${commodity}. Please try another commodity, or press star to return to the main menu.`;
            }
            nextStep = 'mandi_prices_commodity';
            break;
        
        case 'weather_location':
             const weather = await getWeatherTool({ location: input.userInput });
             if (weather) {
                responseText = `The current weather in ${input.userInput} is ${weather.current.temperature} degrees Celsius and ${weather.current.condition}. The high for today is ${weather.current.high} and the low is ${weather.current.low}. To hear the main menu again, press star.`;
             } else {
                responseText = `Sorry, I couldn't fetch the weather for ${input.userInput}. Please try again later. To hear the main menu again, press star.`;
             }
             nextStep = 'main_menu_selection';
             break;
    }
    
    // Handle global commands
    if (input.userInput === '*') {
        responseText = "Main menu. To know current Mandi prices, press 1. For a weather update, press 2. To speak to our scheme eligibility expert, press 3. To end this call, press hash.";
        nextStep = 'main_menu_selection';
        isEnd = false;
    } else if (input.userInput === '#') {
        responseText = "Thank you for calling KisaanConnect support. Goodbye!";
        nextStep = 'end';
        isEnd = true;
    }


    const audio = await textToSpeech(responseText, input.language);
    
    return {
      response: responseText,
      audio,
      nextStep,
      isEnd
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
