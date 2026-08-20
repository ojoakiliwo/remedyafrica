import { NextRequest, NextResponse } from 'next/server';
import {
  buildExplainPrompt,
  generateFallbackExplanation,
  parseExplainRequest,
} from '@/lib/search/ai-explain';

export async function POST(request: NextRequest) {
  let fallbackQuery = 'this concern';
  let fallbackMode: 'plant' | 'condition' = 'condition';
  let fallbackScientific = '';

  try {
    const parsed = parseExplainRequest(await request.json());
    if ('error' in parsed) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    fallbackQuery = parsed.query;
    fallbackMode = parsed.mode;
    fallbackScientific = parsed.scientificName;

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      console.error('OPENROUTER_API_KEY is not set');
      return NextResponse.json({
        isFallback: true,
        explanation: generateFallbackExplanation(parsed),
      });
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://remedyafrica.com',
        'X-Title': 'RemedyAfrica',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro',
        messages: [{ role: 'user', content: buildExplainPrompt(parsed) }],
        temperature: 0.3,
        // Gemini 2.5 Pro spends part of this budget on reasoning; 2048 often
        // truncates a 400-word plant note before preparation and cautions.
        max_tokens: 8192,
        top_p: 0.8,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('OpenRouter API error:', errorData);
      return NextResponse.json({
        error: 'Failed to generate explanation',
        isFallback: true,
        explanation: generateFallbackExplanation(parsed),
      });
    }

    const data = await response.json();
    const choice = data.choices?.[0];
    const explanation = choice?.message?.content || '';
    const wasTruncated = choice?.finish_reason === 'length';
    if (wasTruncated) {
      console.warn('OpenRouter response was truncated — consider increasing max_tokens');
    }

    if (!explanation) {
      return NextResponse.json({
        isFallback: true,
        explanation: generateFallbackExplanation(parsed),
      });
    }

    return NextResponse.json({
      explanation: explanation.trim(),
      isFallback: false,
      wasTruncated,
      mode: parsed.mode,
    });
  } catch (error) {
    console.error('AI explain error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      isFallback: true,
      explanation: generateFallbackExplanation({
        query: fallbackQuery,
        mode: fallbackMode,
        scientificName: fallbackScientific,
      }),
    });
  }
}
