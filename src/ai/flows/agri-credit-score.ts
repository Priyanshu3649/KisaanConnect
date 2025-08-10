'use server';

/**
 * @fileOverview Calculates an agriculture-specific credit score for a farmer.
 *
 * - getAgriCreditScore - A function that returns a simulated agri-credit score and improvement tips.
 * - AgriCreditScoreInput - The input type for the getAgriCreditScore function.
 * - AgriCreditScoreOutput - The return type for the getAgriCreditScore function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AgriCreditScoreInputSchema = z.object({
  userId: z.string().describe("The unique identifier for the farmer."),
  language: z.string().optional().default('en').describe('The language for the response.'),
});
export type AgriCreditScoreInput = z.infer<typeof AgriCreditScoreInputSchema>;

const AgriCreditScoreOutputSchema = z.object({
    score: z.number().min(0).max(1000).describe('The calculated agri-credit score, from 0 to 1000.'),
    trend: z.enum(['up', 'down', 'stable']).describe("The recent trend of the score."),
    trendPoints: z.number().describe("The number of points the score has changed recently."),
    improvementTips: z.array(z.string()).describe('A list of actionable tips for the farmer to improve their score.'),
    loanEligibility: z.object({
        isEligible: z.boolean(),
        amount: z.number(),
        currency: z.string().default('INR'),
    }).describe("The farmer's eligibility for a pre-approved loan."),
    badges: z.array(z.object({
        name: z.string().describe("The name of the badge, e.g., 'Reliable Renter'."),
        icon: z.enum(["Tractor", "ShieldCheck", "Star", "BadgeCheck"]).describe("The icon representing the badge."),
    })).describe('A list of badges earned by the farmer.'),
});
export type AgriCreditScoreOutput = z.infer<typeof AgriCreditScoreOutputSchema>;


export async function getAgriCreditScore(input: AgriCreditScoreInput): Promise<AgriCreditScoreOutput> {
  return agriCreditScoreFlow(input);
}


const agriCreditScoreFlow = ai.defineFlow(
  {
    name: 'agriCreditScoreFlow',
    inputSchema: AgriCreditScoreInputSchema,
    outputSchema: AgriCreditScoreOutputSchema,
  },
  async (input) => {
    // DEVELOPER: This is a mock implementation using static demo data.
    // In a real application, you would use the userId to fetch real data from various sources.

    // Simulate a delay for fetching and processing data.
    await new Promise(resolve => setTimeout(resolve, 1000));

    // For this simulation, we'll generate a consistent score based on the userId hash.
    const hash = input.userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const score = 600 + (hash % 250); // Generates a score between 600 and 850
    const loanAmount = score * 200; // Simple logic for loan amount

    const tips: Record<string, string[]> = {
        en: [
            "Rent out your equipment more regularly to boost your score.",
            "Sell your crops through verified buyers on the platform for better transaction records.",
            "Consider linking your loan repayment history for a potential score increase.",
            `Based on your score, you are eligible for a loan up to ₹${loanAmount.toLocaleString('en-IN')}.`,
        ],
        hi: [
            "अपना स्कोर बढ़ाने के लिए अपने उपकरण नियमित रूप से किराए पर दें।",
            "बेहतर लेनदेन रिकॉर्ड के लिए अपनी फसलें प्लेटफॉर्म पर सत्यापित खरीदारों के माध्यम से बेचें।",
            "संभावित स्कोर वृद्धि के लिए अपने ऋण चुकौती इतिहास को जोड़ने पर विचार करें।",
            `आपके स्कोर के आधार पर, आप ₹${loanAmount.toLocaleString('hi-IN')} तक के ऋण के लिए पात्र हैं।`,
        ],
        pa: [
            "ਆਪਣਾ ਸਕੋਰ ਵਧਾਉਣ ਲਈ ਆਪਣੇ ਉਪਕਰਣਾਂ ਨੂੰ ਨਿਯਮਤ ਤੌਰ 'ਤੇ ਕਿਰਾਏ 'ਤੇ ਦਿਓ।",
            "ਬਿਹਤਰ ਲੈਣ-ਦੇਣ ਦੇ ਰਿਕਾਰਡ ਲਈ ਆਪਣੀਆਂ ਫਸਲਾਂ ਨੂੰ ਪਲੇਟਫਾਰਮ 'ਤੇ ਪ੍ਰਮਾਣਿਤ ਖਰੀਦਦਾਰਾਂ ਰਾਹੀਂ ਵੇਚੋ।",
            "ਸੰਭਾਵੀ ਸਕੋਰ ਵਾਧੇ ਲਈ ਆਪਣੇ ਕਰਜ਼ੇ ਦੀ ਮੁੜ ਅਦਾਇਗੀ ਦੇ ਇਤਿਹਾਸ ਨੂੰ ਲਿੰਕ ਕਰਨ 'ਤੇ ਵਿਚਾਰ ਕਰੋ।",
            `ਤੁਹਾਡੇ ਸਕੋਰ ਦੇ ਆਧਾਰ 'ਤੇ, ਤੁਸੀਂ ₹${loanAmount.toLocaleString('pa-IN')} ਤੱਕ ਦੇ ਕਰਜ਼ੇ ਲਈ ਯੋਗ ਹੋ।`,
        ],
        mr: [
            "तुमचा स्कोअर वाढवण्यासाठी तुमची उपकरणे अधिक नियमितपणे भाड्याने द्या.",
            "चांगल्या व्यवहाराच्या नोंदीसाठी तुमची पिके प्लॅटफॉर्मवर सत्यापित खरेदीदारांमार्फत विका.",
            "संभाव्य स्कोअर वाढीसाठी तुमचा कर्ज परतफेडीचा इतिहास लिंक करण्याचा विचार करा.",
            `तुमच्या स्कोअरवर आधारित, तुम्ही ₹${loanAmount.toLocaleString('mr-IN')} पर्यंतच्या कर्जासाठी पात्र आहात.`,
        ],
        ta: [
            "உங்கள் ஸ்கோரை அதிகரிக்க உங்கள் உபகரணங்களை அடிக்கடி வாடகைக்கு விடுங்கள்.",
            "சிறந்த பரிவர்த்தனை பதிவுகளுக்கு உங்கள் பயிர்களை மேடையில் சரிபார்க்கப்பட்ட வாங்குபவர்கள் மூலம் விற்கவும்.",
            "சாத்தியமான மதிப்பெண் அதிகரிப்புக்கு உங்கள் கடன் திருப்பிச் செலுத்தும் வரலாற்றை இணைப்பதைக் கவனியுங்கள்.",
            `உங்கள் ஸ்கோரின் அடிப்படையில், நீங்கள் ₹${loanAmount.toLocaleString('ta-IN')} வரை கடனுக்குத் தகுதியுடையவர்.`,
        ],
        te: [
            "మీ స్కోరును పెంచుకోవడానికి మీ పరికరాలను మరింత క్రమం తప్పకుండా అద్దెకు ఇవ్వండి.",
            "మెరుగైన లావాదేవీల రికార్డుల కోసం మీ పంటలను ప్లాట్‌ఫారమ్‌లో ధృవీకరించబడిన కొనుగోలుదారుల ద్వారా అమ్మండి.",
            "సంభావ్య స్కోరు పెరుగుదల కోసం మీ రుణ తిరిగి చెల్లింపు చరిత్రను లింక్ చేయడాన్ని పరిగణించండి.",
            `మీ స్కోరు ఆధారంగా, మీరు ₹${loanAmount.toLocaleString('te-IN')} వరకు రుణానికి అర్హులు.`,
        ],
    };

    return {
        score: score,
        trend: 'up',
        trendPoints: 25,
        improvementTips: tips[input.language || 'en'],
        loanEligibility: {
            isEligible: true,
            amount: loanAmount,
            currency: "INR",
        },
        badges: [
            { name: "Reliable Renter", icon: "Tractor" },
            { name: "On-time Seller", icon: "ShieldCheck" },
            { name: "High Yield Hero", icon: "Star" },
        ],
    };
  }
);
