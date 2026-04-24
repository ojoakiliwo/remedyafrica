import { NextRequest, NextResponse } from 'next/server';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json();

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    if (!GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY not set');
      return NextResponse.json({
        explanation: generateFallbackExplanation(query),
        isFallback: true,
      });
    }

    const prompt = `You are a knowledgeable African traditional medicine assistant. A user searched for "${query}". 

Provide a brief, helpful explanation (2-3 paragraphs) about what this condition/symptom is, its common causes, and how traditional African herbal medicine typically approaches it. Keep it warm, informative, and culturally respectful. Do not provide medical prescriptions or dosage instructions. End with a gentle note that they should consult a qualified practitioner for personalized advice.

Format the response as plain text paragraphs. Do not use markdown headers or bullet points.`;

    const response = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 500 },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Gemini API error:', response.status, errText);
      return NextResponse.json({
        explanation: generateFallbackExplanation(query),
        isFallback: true,
      });
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || generateFallbackExplanation(query);

    return NextResponse.json({ explanation: text.trim(), isFallback: false });
  } catch (error) {
    console.error('AI explain error:', error);
    return NextResponse.json(
      { explanation: generateFallbackExplanation('this condition'), isFallback: true },
      { status: 200 }
    );
  }
}

function generateFallbackExplanation(query: string): string {
  return `Traditional African medicine has long recognized conditions like "${query}" and approaches them holistically, considering the body, mind, and environment as interconnected. Herbal remedies are often used to support the body's natural healing processes, alongside lifestyle and dietary adjustments.

Practitioners of African traditional medicine draw on generations of knowledge about local plants and their properties. If you're experiencing "${query}", browsing our herbal database may reveal remedies that have been used traditionally for similar symptoms. For personalized guidance, we recommend consulting one of our verified practitioners.`;
}