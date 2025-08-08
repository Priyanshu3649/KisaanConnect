
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
import { getMandiPricesTool } from './mandi-prices';

// State machine for the IVR call
const CallStateSchema = z.enum([
    'start',
    'language_select',
    'main_menu',
    'mandi_prices_commodity',
    'mandi_prices_state',
    'mandi_prices_market',
    'mandi_prices_result',
    'crop_diagnosis_help',
    'scheme_info_help',
    'agent_transfer_info',
    'end'
]);
export type CallState = z.infer<typeof CallStateSchema>;

const SupportActionInputSchema = z.object({
  state: CallStateSchema.describe('The current state of the call.'),
  userInput: z.string().optional().describe('The digit pressed or spoken command from the user.'),
  language: z.string().optional().default('hi').describe('The selected language for the conversation (e.g., "hi", "en", "pa").'),
  context: z.record(z.any()).optional().describe('Any context to maintain across turns, like commodity or state for mandi prices.'),
});
export type SupportActionInput = z.infer<typeof SupportActionInputSchema>;

const SupportActionOutputSchema = z.object({
  nextState: CallStateSchema.describe('The next state of the call.'),
  response: z.string().describe('The text response to be displayed in the call log.'),
  audio: z.string().describe('The voice response as a URL to a local file or a base64 encoded WAV data URI.'),
  context: z.record(z.any()).optional().describe('Updated context to be passed in the next request.'),
  listen: z.boolean().describe('Whether the app should start listening for a voice command after this turn.')
});
export type SupportActionOutput = z.infer<typeof SupportActionOutputSchema>;

// Exported wrapper function
export async function processSupportAction(input: SupportActionInput): Promise<SupportActionOutput> {
  return customerSupportIvrFlow(input);
}

// Map of static prompts to pre-recorded audio files to save on API quota
const staticAudioMap: Record<string, string> = {
    "For English, press 1. हिंदी के लिए 2 दबाएं। ਪੰਜਾਬੀ ਲਈ 3 ਦਬਾਓ।": "/audio/language-select.mp3",
    "Welcome! For live Mandi prices, press 1. For crop disease diagnosis help, press 2. For government scheme information, press 3. To talk to an agent, press 4. To go back, press star.": "/audio/main-menu-en.mp3",
    "Namaste! Aap KisaanConnect se jude hain. Yeh seva muft hai.": "/audio/welcome-hi.mp3",
    "Welcome to KisaanConnect. This service is free of charge.": "/audio/welcome-en.mp3",
    "KisaanConnect ਵਿੱਚ ਤੁਹਾਡਾ ਸੁਆਗਤ ਹੈ। ਇਹ ਸੇਵਾ ਮੁਫ਼ਤ ਹੈ।": "/audio/welcome-pa.mp3",
    "नमस्ते! किसानकनेक्ट से जुड़ने के लिए धन्यवाद। मंडी की कीमतों के लिए 1 दबाएं। फसल रोग निदान सहायता के लिए 2 दबाएं। सरकारी योजना की जानकारी के लिए 3 दबाएं। एजेंट से बात करने के लिए 4 दबाएं। वापस जाने के लिए, स्टार दबाएं।": "/audio/main-menu-hi.mp3",
    "ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ! ਕਿਸਾਨਕਨੈਕਟ ਨਾਲ ਜੁੜਨ ਲਈ ਧੰਨਵਾਦ। ਮੰਡੀ ਦੀਆਂ ਕੀਮਤਾਂ ਲਈ 1 ਦਬਾਓ। ਫਸਲ ਰੋਗ ਨਿਦਾਨ ਸਹਾਇਤਾ ਲਈ 2 ਦਬਾਓ। ਸਰਕਾਰੀ ਯੋਜਨਾ ਦੀ ਜਾਣਕਾਰੀ ਲਈ 3 ਦਬਾਓ। ਏਜੰਟ ਨਾਲ ਗੱਲ ਕਰਨ ਲਈ 4 ਦਬਾਓ। ਵਾਪਸ ਜਾਣ ਲਈ, ਸਟਾਰ ਦਬਾਓ।": "/audio/main-menu-pa.mp3",
};

// Function to convert text to speech, using pre-recorded files where possible
async function textToSpeech(text: string, language: string): Promise<string> {
    if (staticAudioMap[text]) {
        return staticAudioMap[text];
    }
    
    // Fallback to live TTS for dynamic content
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

// Data for IVR menus
const commodities = ["Potato", "Onion", "Tomato"];
const states: Record<string, string[]> = {
    "Maharashtra": ["Pune", "Nashik"],
    "Punjab": ["Ludhiana", "Amritsar"],
};

const interpretInput = ai.definePrompt({
    name: 'interpretIvrInput',
    input: { schema: z.object({ userInput: z.string(), menu: z.string() }) },
    output: { schema: z.string() },
    prompt: `Interpret the user's input for an IVR menu. The user might say a number, a word, or a phrase. Map it to one of the following digits:
    
    - '1', '2', '3', '4', '*' or '#' for navigation.
    
    Current Menu: {{{menu}}}
    User Input: "{{{userInput}}}"
    
    Examples:
    - User says "two" or "fasal rog" for the main menu -> "2"
    - User says "mandi prices" -> "1"
    - User says "go back" or "star" -> "*"
    - User says "English" for language selection -> "1"
    
    Return only the single digit or symbol that corresponds to the user's intent.`
});


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
    let newContext = { ...(input.context || {}) };
    let lang = input.language || 'hi';
    let listen = true;

    const menuPrompts: Record<string, string> = {
        en: "Welcome! For live Mandi prices, press 1. For crop disease diagnosis help, press 2. For government scheme information, press 3. To talk to an agent, press 4. To go back, press star.",
        hi: "नमस्ते! किसानकनेक्ट से जुड़ने के लिए धन्यवाद। मंडी की कीमतों के लिए 1 दबाएं। फसल रोग निदान सहायता के लिए 2 दबाएं। सरकारी योजना की जानकारी के लिए 3 दबाएं। एजेंट से बात करने के लिए 4 दबाएं। वापस जाने के लिए, स्टार दबाएं।",
        pa: "ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ! ਕਿਸਾਨਕਨੈਕਟ ਨਾਲ ਜੁੜਨ ਲਈ ਧੰਨਵਾਦ। ਮੰਡੀ ਦੀਆਂ ਕੀਮਤਾਂ ਲਈ 1 ਦਬਾਓ। ਫਸਲ ਰੋਗ ਨਿਦਾਨ ਸਹਾਇਤਾ ਲਈ 2 ਦਬਾਓ। ਸਰਕਾਰੀ ਯੋਜਨਾ ਦੀ ਜਾਣਕਾਰੀ ਲਈ 3 ਦਬਾਓ। ਏਜੰਟ ਨਾਲ ਗੱਲ ਕਰਨ ਲਈ 4 ਦਬਾਓ। ਵਾਪਸ ਜਾਣ ਲਈ, ਸਟਾਰ ਦਬਾਓ।",
    };
    
    const welcomePrompts: Record<string, string> = {
        en: "Welcome to KisaanConnect. This service is free of charge.",
        hi: "Namaste! Aap KisaanConnect se jude hain. Yeh seva muft hai.",
        pa: "KisaanConnect ਵਿੱਚ ਤੁਹਾਡਾ ਸੁਆਗਤ ਹੈ। ਇਹ ਸੇਵਾ ਮੁਫ਼ਤ ਹੈ।"
    };

    let userInput = input.userInput || '';

    // If input is text, interpret it
    if (userInput && !/^[0-9*#]$/.test(userInput)) {
        const interpretation = await interpretInput({ userInput, menu: input.state });
        userInput = interpretation.output || userInput;
    }


    if (userInput === '*') {
        response = menuPrompts[lang];
        nextState = 'main_menu';
        newContext = { language: lang }; // Reset context
    } else {
        switch (input.state) {
            case 'start':
                response = "For English, press 1. हिंदी के लिए 2 दबाएं। ਪੰਜਾਬੀ ਲਈ 3 ਦਬਾਓ।";
                nextState = 'language_select';
                break;
            
            case 'language_select':
                if (userInput === '1') lang = 'en';
                else if (userInput === '2') lang = 'hi';
                else if (userInput === '3') lang = 'pa';
                
                response = `${welcomePrompts[lang]} ${menuPrompts[lang]}`;
                nextState = 'main_menu';
                newContext = { language: lang };
                break;

            case 'main_menu':
                switch(userInput) {
                    case '1':
                        response = `For ${commodities[0]} press 1. For ${commodities[1]} press 2. For ${commodities[2]} press 3.`;
                        nextState = 'mandi_prices_commodity';
                        break;
                    case '2':
                        response = "For Crop Disease Diagnosis, please use the 'Crop Diagnosis' feature in the app. You can upload a photo for an instant AI analysis. " + menuPrompts[lang];
                        nextState = 'main_menu';
                        break;
                    case '3':
                        response = "For Government Scheme Information, please use the 'Government Schemes' feature in the app. " + menuPrompts[lang];
                        nextState = 'main_menu';
                        break;
                    case '4':
                        response = "Connecting you to an agent... Please note our agents are busy. We recommend using the in-app features. " + menuPrompts[lang];
                        nextState = 'main_menu';
                        break;
                    default:
                        response = "Invalid option. " + menuPrompts[lang];
                        nextState = 'main_menu';
                }
                break;

            case 'mandi_prices_commodity':
                const commodityIndex = parseInt(userInput || '0') - 1;
                if (commodityIndex >= 0 && commodityIndex < commodities.length) {
                    newContext.commodity = commodities[commodityIndex];
                    const stateNames = Object.keys(states);
                    response = `For ${stateNames[0]} press 1. For ${stateNames[1]} press 2.`;
                    nextState = 'mandi_prices_state';
                } else {
                    response = "Invalid commodity. Please try again. " + `For ${commodities[0]} press 1...`;
                    nextState = 'mandi_prices_commodity';
                }
                break;

            case 'mandi_prices_state':
                const stateIndex = parseInt(userInput || '0') - 1;
                const stateNames = Object.keys(states);
                if (stateIndex >= 0 && stateIndex < stateNames.length) {
                    newContext.state = stateNames[stateIndex];
                    const markets = states[newContext.state];
                    response = `For ${markets[0]} press 1. For ${markets[1]} press 2.`;
                    nextState = 'mandi_prices_market';
                } else {
                    response = "Invalid state. Please try again. " + `For ${stateNames[0]} press 1...`;
                    nextState = 'mandi_prices_state';
                }
                break;

            case 'mandi_prices_market':
                const marketIndex = parseInt(userInput || '0') - 1;
                const markets = states[newContext.state];
                 if (marketIndex >= 0 && marketIndex < markets.length) {
                    newContext.market = markets[marketIndex];
                    
                    const prices = await getMandiPricesTool({
                        commodity: newContext.commodity,
                        state: newContext.state,
                        market: newContext.market,
                    });

                    if (prices && prices.length > 0) {
                        const latestPrice = prices[0];
                        response = `The latest price for ${latestPrice.Commodity} in ${latestPrice.City} is ${latestPrice['Model Prize']} Rupees per quintal. ` + menuPrompts[lang];
                    } else {
                        response = `Sorry, I could not find prices for ${newContext.commodity} in ${newContext.market}. ` + menuPrompts[lang];
                    }
                    nextState = 'main_menu';
                } else {
                    response = "Invalid market. Please try again. " + `For ${markets[0]} press 1...`;
                    nextState = 'mandi_prices_market';
                }
                break;

            default:
                response = "An error occurred. Returning to main menu. " + menuPrompts[lang];
                nextState = 'main_menu';
        }
    }


    const audio = await textToSpeech(response, lang);

    return {
      nextState,
      response,
      audio,
      context: newContext,
      listen
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
