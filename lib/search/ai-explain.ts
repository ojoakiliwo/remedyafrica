import { resolveSearchIntent, type SearchExplainMode } from './query-intent';

export type { SearchExplainMode };

export interface ExplainRequestBody {
  symptoms?: unknown;
  query?: unknown;
  mode?: unknown;
  intent?: unknown;
  scientificName?: unknown;
  source?: unknown;
}

export interface ParsedExplainRequest {
  query: string;
  mode: SearchExplainMode;
  scientificName: string;
}

export function parseExplainRequest(body: ExplainRequestBody): ParsedExplainRequest | { error: string } {
  const query = String(body.symptoms || body.query || '').trim();
  if (!query) {
    return { error: 'A plant name or symptom description is required' };
  }

  return {
    query,
    mode: resolveSearchIntent({
      intent: typeof body.intent === 'string' ? body.intent : null,
      mode: typeof body.mode === 'string' ? body.mode : null,
      source: typeof body.source === 'string' ? body.source : null,
    }),
    scientificName: String(body.scientificName || '').trim(),
  };
}

export function buildExplainPrompt(request: ParsedExplainRequest): string {
  return request.mode === 'plant' ? buildPlantPrompt(request) : buildConditionPrompt(request.query);
}

function buildConditionPrompt(symptoms: string): string {
  return `You are a medical information assistant. Provide a clear, accurate medical explanation of the following symptoms/condition.

SYMPTOMS: "${symptoms}"

RESPONSE FORMAT (follow exactly):

**1. What is this condition?**
Provide a clear, factual medical definition of what these symptoms likely indicate. Use standard medical terminology. Explain what body systems are involved and what is happening physiologically. Be objective and informative.

**2. Common Causes**
List the most common causes or triggers for this condition.

**3. When to Seek Medical Attention**
Clearly state red flags or warning signs that require immediate professional medical care.

**4. Traditional African Herbal Approaches**
After the medical explanation, briefly mention that traditional African medicine has historically used herbal remedies to support the body's natural healing processes for symptoms like these. Do NOT prescribe specific herbs or dosages. Instead, suggest that the user explore the RemedyAfrica database for herbs traditionally associated with these symptoms, or consult a verified practitioner.

**5. Important Disclaimer**
Include: "This information is for educational purposes only and does not constitute medical advice. Always consult a qualified healthcare professional for diagnosis and treatment."

RULES:
- Lead with medical facts, NOT herbal recommendations
- Do not diagnose — explain possibilities
- Do not prescribe specific herbs or dosages
- Keep the tone educational and neutral
- Maximum 400 words`;
}

function buildPlantPrompt(request: ParsedExplainRequest): string {
  const scientificLine = request.scientificName
    ? `Scientific name: ${request.scientificName}`
    : 'Scientific name: not provided';

  return `You are an ethnobotany assistant for RemedyAfrica. A user photographed a living plant. Identification returned this plant, not a human disease.

Common name: ${request.query}
${scientificLine}

Explain traditional and medicinal uses of THIS PLANT — leaves, grain, silk, husk, roots, stem, or other parts as they are actually used. Focus on African and widely documented household uses, food value, and folk medicine.

RESPONSE FORMAT (follow exactly):

**1. What plant is this?**
Name the plant clearly. Mention edible or useful parts in everyday language.

**2. Traditional uses of the plant and its parts**
Describe documented traditional uses of the plant itself (for example corn leaves, silk, grain, or husks). Include household, nutritional, and folk-medicine uses where they exist.

**3. How it is typically prepared**
Briefly describe common preparations (tea, poultice, food, decoction) without dosages that sound like a prescription.

**4. Cautions**
Note allergies, contamination, or when a healer or clinician should be consulted. Do not invent dramatic toxicity claims.

**5. Important Disclaimer**
Include: "This information is for educational purposes only and does not constitute medical advice. Identification can be wrong. Confirm the plant before use, and consult a qualified healthcare professional or verified practitioner."

RULES:
- The user identified a PLANT. Do NOT explain a human medical condition that happens to share the same English word (for example a foot corn, callus, or clavus when the plant is maize/corn).
- Do not write a heading that treats this as a human disease or skin lesion.
- Do not diagnose skin lesions, infections, or other diseases.
- Do not prescribe dosages.
- Keep the tone educational and practical.
- Maximum 400 words`;
}

export function generateFallbackExplanation(request: ParsedExplainRequest | string): string {
  const parsed: ParsedExplainRequest =
    typeof request === 'string'
      ? { query: request, mode: 'condition', scientificName: '' }
      : request;

  if (parsed.mode === 'plant') {
    const label = parsed.scientificName
      ? `${parsed.query} (${parsed.scientificName})`
      : parsed.query;
    return `**1. What plant is this?**
We could not write a full plant note just now for "${label}". The identification still stands as a starting point.

**2. Traditional uses of the plant and its parts**
Browse the library below for documented traditional uses of this plant's leaves, grain, or other parts, or ask a verified practitioner.

**3. How it is typically prepared**
Unable to retrieve preparation notes at this time.

**4. Cautions**
Do not ingest a plant unless you are sure of the identification. If you have a medical complaint, seek qualified care.

**5. Important Disclaimer**
This information is for educational purposes only and does not constitute medical advice. Always consult a qualified healthcare professional or verified practitioner.`;
  }

  return `**1. What is this condition?**
We apologize, but our AI analysis service is currently experiencing high demand and could not generate a complete response for "${parsed.query}".

**2. Common Causes**
Unable to retrieve at this time.

**3. When to Seek Medical Attention**
If symptoms are severe, persistent, or worsening, please consult a qualified healthcare professional immediately.

**4. Traditional African Herbal Approaches**
We recommend browsing our herbal database below for remedies traditionally associated with these symptoms, or consulting with one of our verified practitioners.

**5. Important Disclaimer**
This information is for educational purposes only and does not constitute medical advice. Always consult a qualified healthcare professional for diagnosis and treatment.`;
}
