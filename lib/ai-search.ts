import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface AISearchResult {
  type: 'herb' | 'ailment-info' | 'no-match';
  query: string;
  ailmentInfo?: {
    name: string;
    description: string;
    symptoms: string[];
    conventionalTreatment: string;
    herbalOptionsAvailable: boolean;
  };
  matchingHerbs?: any[];
  suggestedPractitioners?: any[];
  requiresSubscription: boolean;
}

export async function smartSearch(
  query: string, 
  userSubscription: 'free' | 'premium' | null,
  availableHerbs: any[]
): Promise<AISearchResult> {
  // First, check if we have direct herb matches
  const directMatches = availableHerbs.filter(herb => 
    herb.name.toLowerCase().includes(query.toLowerCase()) ||
    herb.medicinalUses?.some((use: any) => 
      use.condition.toLowerCase().includes(query.toLowerCase())
    ) ||
    herb.tags?.some((tag: string) => 
      tag.toLowerCase().includes(query.toLowerCase())
    )
  );

  if (directMatches.length > 0) {
    return {
      type: 'herb',
      query,
      matchingHerbs: directMatches,
      requiresSubscription: false,
    };
  }

  // No direct match - use AI to explain the ailment
  const completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: `You are a medical information assistant for an African traditional medicine platform. 
        Provide accurate, helpful information about health conditions. 
        Always include a disclaimer that this is informational only and not medical advice.
        Focus on whether traditional herbal remedies are commonly used for this condition.
        IMPORTANT: Your response must be in valid JSON format.`
      },
      {
        role: 'user',
        content: `The user searched for: "${query}"
        
        Please provide:
        1. What this condition is (brief, clear explanation)
        2. Common symptoms
        3. Whether traditional African herbal medicine commonly treats this
        4. Any safety warnings
        
        Format as JSON:
        {
          "name": "condition name",
          "description": "clear explanation",
          "symptoms": ["symptom 1", "symptom 2"],
          "conventionalTreatment": "brief overview",
          "herbalMedicineUsed": true/false,
          "commonHerbalApproaches": "if applicable",
          "safetyWarning": "important cautions"
        }`
      }
    ],
    response_format: { type: 'json_object' }
  });

  const ailmentData = JSON.parse(completion.choices[0].message.content || '{}');

  // Check if we have herbs for related conditions
  const relatedHerbs = availableHerbs.filter(herb => {
    const herbText = `${herb.name} ${herb.description} ${herb.medicinalUses?.map((u: any) => u.condition).join(' ')}`.toLowerCase();
    return ailmentData.symptoms?.some((symptom: string) => 
      herbText.includes(symptom.toLowerCase())
    ) || ailmentData.commonHerbalApproaches?.toLowerCase().split(' ').some((word: string) =>
      herbText.includes(word.toLowerCase())
    );
  });

  return {
    type: 'ailment-info',
    query,
    ailmentInfo: {
      name: ailmentData.name,
      description: ailmentData.description,
      symptoms: ailmentData.symptoms,
      conventionalTreatment: ailmentData.conventionalTreatment,
      herbalOptionsAvailable: relatedHerbs.length > 0,
    },
    matchingHerbs: relatedHerbs.length > 0 ? relatedHerbs : undefined,
    requiresSubscription: userSubscription === null, // Require login for practitioners
  };
}