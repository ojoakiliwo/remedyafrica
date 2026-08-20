import { NextResponse } from 'next/server';
import { localSupportReply, supportSystemPrompt, type SupportLink } from '@/lib/support/guide';

type ChatTurn = {
  role?: string;
  content?: string;
};

function asHistory(messages: ChatTurn[]) {
  return (Array.isArray(messages) ? messages : [])
    .map((item) => ({
      role: item.role === 'assistant' ? 'assistant' : 'user',
      content: String(item.content || '').trim().slice(0, 800),
    }))
    .filter((item) => item.content)
    .slice(-8);
}

async function askOpenRouter(messages: Array<{ role: string; content: string }>) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return null;

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://www.remedyafrica.com',
      'X-Title': 'RemedyAfrica Guide',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      temperature: 0.2,
      max_tokens: 400,
      messages: [{ role: 'system', content: supportSystemPrompt() }, ...messages],
    }),
  });

  if (!response.ok) {
    console.error('Support guide OpenRouter error', response.status, await response.text().catch(() => ''));
    return null;
  }

  const data = await response.json();
  const reply = String(data.choices?.[0]?.message?.content || '').trim();
  return reply || null;
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const history = asHistory(body.messages || []);
    const question = history.filter((item) => item.role === 'user').at(-1)?.content || '';

    if (!question) {
      return NextResponse.json({ error: 'A question is required' }, { status: 400 });
    }

    const local = localSupportReply(question);
    let answer = local.answer;
    let source: 'ai' | 'guide' = 'guide';

    try {
      const aiReply = await askOpenRouter(history);
      if (aiReply) {
        answer = aiReply;
        source = 'ai';
      }
    } catch (error) {
      console.error('Support guide AI fallback:', error);
    }

    const links: SupportLink[] = local.links;
    return NextResponse.json({ reply: answer, links, source, topicId: local.topicId });
  } catch (error) {
    console.error('Support chat error:', error);
    return NextResponse.json({ error: 'Could not answer right now' }, { status: 500 });
  }
}
