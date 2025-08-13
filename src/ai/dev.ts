
import { config } from 'dotenv';
config({ path: '.env' });

import '@/ai/flows/submit-feedback.ts';
import '@/ai/flows/voice-navigator.ts';
import '@/ai/flows/mandi-prices.ts';
import '@/ai/flows/get-weather.ts';
import '@/ai/flows/digital-twin.ts';
import '@/ai/flows/check-scheme-eligibility.ts';
import '@/ai/flows/customer-support-ivr.ts';
import '@/ai/flows/agri-credit-score.ts';
import '@/ai/flows/sales-advisor.ts';
import '@/ai/flows/dashboard-analytics.ts';
import '@/ai/flows/get-satellite-image.ts';
import '@/ai/flows/ai-assistant.ts';
import '@/ai/flows/crop-disease-diagnosis.ts';
