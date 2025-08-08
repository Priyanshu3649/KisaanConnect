import { config } from 'dotenv';
config({ path: '.env' });

import '@/ai/flows/crop-disease-diagnosis.ts';
import '@/ai/flows/submit-feedback.ts';
import '@/ai/flows/voice-navigator.ts';
import '@/ai/flows/mandi-prices.ts';
import '@/ai/flows/get-weather.ts';
import '@/ai/flows/digital-twin.ts';
import '@/ai/flows/check-scheme-eligibility.ts';
import '@/ai/flows/customer-support-ivr.ts';
