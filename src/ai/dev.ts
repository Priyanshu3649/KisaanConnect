import { config } from 'dotenv';
config({ path: '.env' });

import '@/ai/flows/scheme-navigator.ts';
import '@/ai/flows/crop-disease-diagnosis.ts';
import '@/ai/flows/submit-feedback.ts';
import '@/ai/flows/voice-navigator.ts';
import '@/ai/flows/mandi-prices.ts';
import '@/ai/flows/get-weather.ts';
