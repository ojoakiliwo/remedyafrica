import { NextRequest, NextResponse } from 'next/server';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

interface ExplainRequest {
  symptoms: string;
}

export async function POST(request: NextRequest) {
  let symptoms = '';

  try {
    const body: ExplainRequest = await request.json();
    symptoms = body.symptoms;

    if (!symptoms || typeof symptoms !== 'string') {
      return NextResponse.json(
        { error: 'Symptoms description is required' },
        { status: 400 }
      );
    }

    if (!OPENROUTER_API_KEY) {
      return NextResponse.json(
        {
          isFallback: true,
          explanation: generateFallbackExplanation(symptoms),
        },
        { status: 200 }
      );
    }

    const prompt = `You are a medical information assistant. Provide a clear, accurate medical explanation of the following symptoms/condition.

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

    const response = await fetch(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'HTTP-Referer': 'https://remedyafrica.com',
          'X-Title': 'RemedyAfrica',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-pro',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.3,
          max_tokens: 2048,
          top_p: 0.8,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('OpenRouter API error:', errorData);
      return NextResponse.json(
        {
          error: 'Failed to generate explanation',
          isFallback: true,
          explanation: generateFallbackExplanation(symptoms)
        },
        { status: 200 }
      );
    }

    const data = await response.json();
    const choice = data.choices?.[0];
    const explanation = choice?.message?.content || '';

    const wasTruncated = choice?.finish_reason === 'length';
    if (wasTruncated) {
      console.warn('OpenRouter response was truncated — consider increasing max_tokens');
    }

    if (!explanation) {
      return NextResponse.json(
        {
          isFallback: true,
          explanation: generateFallbackExplanation(symptoms)
        },
        { status: 200 }
      );
    }

    return NextResponse.json({
      explanation: explanation.trim(),
      isFallback: false,
      wasTruncated
    });

  } catch (error) {
    console.error('AI explain error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        isFallback: true,
        explanation: generateFallbackExplanation(symptoms || 'this condition')
      },
      { status: 200 }
    );
  }
}

function generateFallbackExplanation(symptoms: string): string {
  return `**1. What is this condition?**
We apologize, but our AI analysis service is currently experiencing high demand and could not generate a complete response for "${symptoms}".

**2. Common Causes**
Unable to retrieve at this time.

**3. When to Seek Medical Attention**
If symptoms are severe, persistent, or worsening, please consult a qualified healthcare professional immediately.

**4. Traditional African Herbal Approaches**
We recommend browsing our herbal database below for remedies traditionally associated with these symptoms, or consulting with one of our verified practitioners.

**5. Important Disclaimer**
This information is for educational purposes only and does not constitute medical advice. Always consult a qualified healthcare professional for diagnosis and treatment.`;
}