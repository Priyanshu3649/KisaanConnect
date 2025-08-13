
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
  email: z.string().optional().describe("The user's email address."),
  language: z.string().optional().default('en').describe('The language for the response.'),
});
export type AgriCreditScoreInput = z.infer<typeof AgriCreditScoreInputSchema>;

const AgriCreditScoreOutputSchema = z.object({
    score: z.number().min(0).max(1000).describe('The calculated agri-credit score, from 0 to 1000.'),
    cibilScore: z.number().describe("The user's CIBIL score. -1 if not available."),
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

const demoUsers = [
    'pandeypriyanshu53@gmail.com',
    'admin@kissanconnect.com'
];

const agriCreditScoreFlow = ai.defineFlow(
  {
    name: 'agriCreditScoreFlow',
    inputSchema: AgriCreditScoreInputSchema,
    outputSchema: AgriCreditScoreOutputSchema,
  },
  async (input) => {
    // For new users, return a default zero state.
    if (!input.email || !demoUsers.includes(input.email)) {
        return {
            score: 300,
            cibilScore: -1,
            trend: 'stable',
            trendPoints: 0,
            improvementTips: [
                "Complete your profile to get a baseline score.",
                "Connect a bank account to start building your credit history.",
                "Explore the app features to learn more."
            ],
            loanEligibility: {
                isEligible: false,
                amount: 0,
                currency: "INR",
            },
            badges: [],
        };
    }

    // DEVELOPER: This is a mock implementation using the new 50/30/20 weighted logic.
    // In a real application, you would fetch real data for each component.
    await new Promise(resolve => setTimeout(resolve, 1000));

    const hash = input.userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    
    // 1. Simulate CIBIL score (300-900 range)
    const simulatedCibilScore = 650 + (hash % 100); // 650-750
    
    // 2. Simulate Farm Data Analysis score (0-1000 range)
    const simulatedFarmDataScore = 700 + (hash % 150); // 700-850
    
    // 3. Simulate Platform Transactions score (0-1000 range)
    const simulatedPlatformScore = 600 + (hash % 200); // 600-800

    // Calculate weighted score
    const finalScore = Math.round(
        (simulatedCibilScore * 0.5) +   // 50% from CIBIL (normalized from 900 max)
        (simulatedFarmDataScore * 0.3) + // 30% from Farm Data
        (simulatedPlatformScore * 0.2)   // 20% from Platform Transactions
    );
    
    const loanAmount = finalScore * 150;

    const tips: Record<string, string[]> = {
        en: [
            `Your score is based on CIBIL (50%), farm data (30%), and platform transactions (20%).`,
            "Improving your traditional CIBIL score will have the largest impact.",
            "Complete more rentals and sales on the platform to boost your transaction score.",
            `Any approved loan will be automatically registered under the PM-Fasal Bima Yojana for crop insurance.`,
        ],
        hi: [
            `आपका स्कोर सिबिल (50%), खेत डेटा (30%), और प्लेटफॉर्म लेनदेन (20%) पर आधारित है।`,
            "अपने पारंपरिक सिबिल स्कोर में सुधार करने से सबसे बड़ा प्रभाव पड़ेगा।",
            "अपने लेनदेन स्कोर को बढ़ाने के लिए प्लेटफॉर्म पर अधिक किराये और बिक्री पूरी करें।",
            `किसी भी स्वीकृत ऋण को फसल बीमा के लिए पीएम-फसल बीमा योजना के तहत स्वचालित रूप से पंजीकृत किया जाएगा।`,
        ],
        pa: [
            `ਤੁਹਾਡਾ ਸਕੋਰ CIBIL (50%), ਖੇਤ ਡੇਟਾ (30%), ਅਤੇ ਪਲੇਟਫਾਰਮ ਲੈਣ-ਦੇਣ (20%) 'ਤੇ ਅਧਾਰਤ ਹੈ।`,
            "ਆਪਣੇ ਰਵਾਇਤੀ CIBIL ਸਕੋਰ ਨੂੰ ਸੁਧਾਰਨ ਦਾ ਸਭ ਤੋਂ ਵੱਡਾ ਪ੍ਰਭਾਵ ਹੋਵੇਗਾ।",
            "ਆਪਣੇ ਲੈਣ-ਦੇਣ ਦੇ ਸਕੋਰ ਨੂੰ ਵਧਾਉਣ ਲਈ ਪਲੇਟਫਾਰਮ 'ਤੇ ਹੋਰ ਕਿਰਾਏ ਅਤੇ ਵਿਕਰੀ ਨੂੰ ਪੂਰਾ ਕਰੋ।",
            `ਕੋਈ ਵੀ ਪ੍ਰਵਾਨਿਤ ਕਰਜ਼ਾ ਫਸਲ ਬੀਮਾ ਲਈ ਪ੍ਰਧਾਨ ਮੰਤਰੀ-ਫਸਲ ਬੀਮਾ ਯੋਜਨਾ ਦੇ ਤਹਿਤ ਆਪਣੇ ਆਪ ਰਜਿਸਟਰ ਹੋ ਜਾਵੇਗਾ।`,
        ],
        mr: [
            `तुमचा स्कोअर सिबिल (50%), शेती डेटा (30%), आणि प्लॅटफॉर्म व्यवहार (20%) वर आधारित आहे.`,
            "तुमचा पारंपरिक सिबिल स्कोअर सुधारण्याने सर्वात मोठा परिणाम होईल.",
            "तुमचा व्यवहार स्कोअर वाढवण्यासाठी प्लॅटफॉर्मवर अधिक भाडे आणि विक्री पूर्ण करा.",
            `कोणतेही मंजूर कर्ज पीक विम्यासाठी पंतप्रधान-फसल विमा योजनेअंतर्गत आपोआप नोंदणीकृत होईल.`,
        ],
        ta: [
            `உங்கள் ஸ்கோர் சிபில் (50%), பண்ணை தரவு (30%), மற்றும் மேடை பரிவர்த்தனைகள் (20%) அடிப்படையில் அமைந்துள்ளது.`,
            "உங்கள் பாரம்பரிய சிபில் ஸ்கோரை மேம்படுத்துவது மிகப்பெரிய தாக்கத்தை ஏற்படுத்தும்.",
            "உங்கள் பரிவர்த்தனை ஸ்கோரை அதிகரிக்க மேடையில் அதிக வாடகைகள் மற்றும் விற்பனைகளை முடிக்கவும்.",
            `ഏതെങ്കിലും അംഗീകൃത വായ്പ വിള ഇൻഷുറൻസിനായി പിഎം-ഫസൽ ഭീമ യോജന പ്രകാരം സ്വയമേവ രജിസ്റ്റർ ചെയ്യപ്പെടും.`,
        ],
        te: [
            `మీ స్కోరు సిబిల్ (50%), వ్యవసాయ డేటా (30%), మరియు ప్లాట్‌ఫారమ్ లావాదేవీలు (20%) పై ఆధారపడి ఉంటుంది.`,
            "మీ సాంప్రదాయ సిబిల్ స్కోరును మెరుగుపరచడం వల్ల అతిపెద్ద ప్రభావం ఉంటుంది.",
            "మీ లావాదేవీల స్కోరును పెంచడానికి ప్లాట్‌ఫారమ్‌లో మరిన్ని అద్దెలు మరియు అమ్మకాలను పూర్తి చేయండి.",
            `ఏదైనా ఆమోదించబడిన రుణం పంట బీమా కోసం పిఎం-ఫసల్ బీమా యోజన కింద స్వయంచాలకంగా నమోదు చేయబడుతుంది.`,
        ],
    };

    return {
        score: finalScore,
        cibilScore: simulatedCibilScore,
        trend: 'up',
        trendPoints: 15,
        improvementTips: tips[input.language || 'en'],
        loanEligibility: {
            isEligible: true,
            amount: loanAmount,
            currency: "INR",
        },
        badges: [
            { name: "Reliable Renter", icon: "Tractor" },
            { name: "On Time Seller", icon: "ShieldCheck" },
            { name: "High Yield Hero", icon: "Star" },
        ],
    };
  }
);
