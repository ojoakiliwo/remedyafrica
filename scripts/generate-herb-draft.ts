import { HerbEntry, herbCategories, preparationMethods, africanRegions } from '@/lib/herb-template';

// This is a template for using AI APIs (OpenAI, Claude, etc.)
// You would integrate your preferred AI service here

interface AIGenerationPrompt {
  herbName: string;
  scientificName?: string;
  region?: string;
  knownUses?: string[];
}

export function generateHerbPrompt(data: AIGenerationPrompt): string {
  return `
You are an expert in African traditional medicine and ethnobotany. 
Create a detailed, accurate herb entry for: ${data.herbName}

${data.scientificName ? `Scientific name: ${data.scientificName}` : ''}
${data.region ? `Primary region: ${data.region}` : ''}

Generate a JSON object matching this structure:
{
  "name": "common name",
  "scientificName": "Genus species",
  "family": "plant family",
  "commonNames": ["local name 1", "local name 2"],
  "description": "2-3 sentences describing the plant",
  "habitat": "where it grows",
  "appearance": "identifying features",
  "medicinalUses": [
    {
      "condition": "what it treats",
      "preparation": "how to make the remedy",
      "dosage": "how much to take",
      "evidenceLevel": "traditional|preliminary|clinical|well-established"
    }
  ],
  "traditionalUses": ["traditional use 1", "traditional use 2"],
  "partsUsed": ["leaves", "roots", "bark"],
  "preparationMethods": ["decoction", "infusion"],
  "contraindications": ["who should avoid"],
  "sideEffects": ["possible side effects"],
  "interactions": ["drug interactions"],
  "pregnancySafety": "safe|caution|avoid|unknown",
  "regions": ["West Africa", "East Africa"],
  "availability": "common|seasonal|rare|cultivated",
  "category": "choose from: ${herbCategories.join(', ')}",
  "tags": ["search", "keywords"]
}

Important guidelines:
- Only include verified traditional uses from African medicine systems
- Mark evidence level appropriately - most will be "traditional" or "preliminary"
- Include safety warnings where known
- Note if information is uncertain
- Focus on plants actually found in Africa
`;
}

// Example of how to use with OpenAI API
export async function generateHerbWithAI(
  apiKey: string, 
  herbData: AIGenerationPrompt
): Promise<Partial<HerbEntry>> {
  const prompt = generateHerbPrompt(herbData);
  
  // Integrate with your preferred AI service
  // This is a placeholder for the actual API call
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: 'You are an expert in African traditional medicine.' },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' }
    }),
  });

  const data = await response.json();
  return JSON.parse(data.choices[0].message.content);
}