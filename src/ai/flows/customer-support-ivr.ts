'use server';

/**
 * @fileOverview An AI-powered Interactive Voice Response (IVR) system for customer support.
 *
 * - processSupportAction - A function that handles the IVR logic based on call state and user input.
 * - SupportActionInput - The input type for the processSupportAction function.
 * - SupportActionOutput - The return type for the processSupportAction function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import wav from 'wav';

// State machine for the IVR call
const CallStateSchema = z.enum([
    'start',
    'language_select',
    'main_menu',
    'mandi_prices_commodity',
    'mandi_prices_state',
    'mandi_prices_market',
    'crop_diagnosis_help',
    'scheme_info_query',
    'agent_transfer',
    'end'
]);
export type CallState = z.infer<typeof CallStateSchema>;

const SupportActionInputSchema = z.object({
  state: CallStateSchema.describe('The current state of the call.'),
  userInput: z.string().optional().describe('The digit pressed by the user or a text query.'),
  language: z.string().optional().default('hi').describe('The selected language for the conversation (e.g., "hi", "en", "pa").'),
  context: z.record(z.any()).optional().describe('Any context to maintain across turns, like commodity or state for mandi prices.'),
});
export type SupportActionInput = z.infer<typeof SupportActionInputSchema>;

const SupportActionOutputSchema = z.object({
  nextState: CallStateSchema.describe('The next state of the call.'),
  response: z.string().describe('The text response to be displayed in the call log.'),
  audio: z.string().describe('The voice response in base64 encoded WAV format.'),
  context: z.record(z.any()).optional().describe('Updated context to be passed in the next request.'),
});
export type SupportActionOutput = z.infer<typeof SupportActionOutputSchema>;

// Exported wrapper function
export async function processSupportAction(input: SupportActionInput): Promise<SupportActionOutput> {
  return customerSupportIvrFlow(input);
}


// Function to convert text to speech
async function textToSpeech(text: string, language: string): Promise<string> {
    const languageToVoice: Record<string, string> = {
        'en': 'Algenib', 
        'hi': 'en-IN-Wavenet-D',
        'pa': 'en-IN-Wavenet-D',
    };
    const voice = languageToVoice[language] || 'en-IN-Wavenet-D';

    const ttsResult = await ai.generate({
      model: 'googleai/gemini-2.5-flash-preview-tts',
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice },
          },
        },
      },
      prompt: text,
    });
    
    if (!ttsResult.media) throw new Error('TTS failed to generate audio.');
    
    const audioBuffer = Buffer.from(ttsResult.media.url.substring(ttsResult.media.url.indexOf(',') + 1), 'base64');
    return 'data:audio/wav;base64,' + (await toWav(audioBuffer));
}

// Main IVR Flow
const customerSupportIvrFlow = ai.defineFlow(
  {
    name: 'customerSupportIvrFlow',
    inputSchema: SupportActionInputSchema,
    outputSchema: SupportActionOutputSchema,
  },
  async (input) => {
    let response = '';
    let nextState: CallState = input.state;
    let newContext = input.context || {};
    let lang = input.language || 'hi';

    switch (input.state) {
        case 'start':
            response = "For English, press 1. हिंदी के लिए 2 दबाएं। ਪੰਜਾਬੀ ਲਈ 3 ਦਬਾਓ।";
            nextState = 'language_select';
            break;
        
        case 'language_select':
            const choice = input.userInput;
            if (choice === '1') lang = 'en';
            else if (choice === '2') lang = 'hi';
            else if (choice === '3') lang = 'pa';
            
            const welcomeMessage = "नमस्ते! आप किसानकनेक्ट से जुड़े हैं। यह सेवा मुफ्त है।";
            
            const menuPrompts: Record<string, string> = {
                en: "For live Mandi prices, press 1. For crop disease diagnosis help, press 2. For government scheme information, press 3. To talk to an agent, press 4.",
                hi: "मंडी की कीमतों के लिए 1 दबाएं। फसल रोग निदान सहायता के लिए 2 दबाएं। सरकारी योजना की जानकारी के लिए 3 दबाएं। एजेंट से बात करने के लिए 4 दबाएं।",
                pa: "ਮੰਡੀ ਦੀਆਂ ਕੀਮਤਾਂ ਲਈ 1 ਦਬਾਓ। ਫਸਲ ਰੋਗ ਨਿਦਾਨ ਸਹਾਇਤਾ ਲਈ 2 ਦਬਾਓ। ਸਰਕਾਰੀ ਯੋਜਨਾ ਦੀ ਜਾਣਕਾਰੀ ਲਈ 3 ਦਬਾਓ। ਏਜੰਟ ਨਾਲ ਗੱਲ ਕਰਨ ਲਈ 4 ਦਬਾਓ।",
            };
            response = `${welcomeMessage} ${menuPrompts[lang]}`;
            nextState = 'main_menu';
            newContext = { language: lang };
            break;

        case 'main_menu':
            switch(input.userInput) {
                case '1':
                    response = "You've selected Mandi Prices. This service is under development and will be available soon. Returning to the main menu.";
                    nextState = 'main_menu';
                    break;
                case '2':
                    response = "For Crop Disease Diagnosis, please use the 'Crop Diagnosis' feature in the app. You can upload a photo of your crop for an instant AI analysis and recommended actions. Returning to the main menu.";
                    nextState = 'main_menu';
                    break;
                case '3':
                    response = "For Government Scheme Information, please use the 'Government Schemes' feature in the app to check your eligibility or ask our AI assistant on the main dashboard. Returning to the main menu.";
                     nextState = 'main_menu';
                    break;
                case '4':
                    response = "Connecting you to an agent... Please note that our agents are currently busy. We recommend using the in-app features for faster assistance. Returning to the main menu.";
                    nextState = 'main_menu';
                    break;
                default:
                    response = "Invalid option, please try again.";
                    nextState = 'main_menu';
            }
             break;

        default:
            response = "An error occurred. Please hang up and try again.";
            nextState = 'end';
    }

    const audio = await textToSpeech(response, lang);

    return {
      nextState,
      response,
      audio,
      context: newContext
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
