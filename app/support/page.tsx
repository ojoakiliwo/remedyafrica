'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { EditorialPage, PageHero } from '@/components/editorial/PageHero';
import { Button } from '@/components/ui/button';
import { SUPPORT_STARTERS } from '@/lib/support/guide';
import { Loader2, Send, Sparkles } from 'lucide-react';

type GuideLink = { label: string; href: string };

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
  links?: GuideLink[];
};

const WELCOME: ChatMessage = {
  role: 'assistant',
  content:
    'I am Remedy, your in-app guide. Ask me how to book a healer, join a call, identify a plant, edit your profile, or find your way around.',
  links: [
    { label: 'Find a practitioner', href: '/practitioners' },
    { label: 'Identify a herb', href: '/identify' },
    { label: 'Edit profile', href: '/profile/edit' },
  ],
};

export default function SupportPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  const ask = async (question: string) => {
    const text = question.trim();
    if (!text || sending) return;

    const nextMessages: ChatMessage[] = [...messages, { role: 'user', content: text }];
    setMessages(nextMessages);
    setInput('');
    setSending(true);

    try {
      const response = await fetch('/api/support/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: nextMessages.map((item) => ({ role: item.role, content: item.content })),
        }),
      });
      const data = await response.json();
      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          content: data.reply || 'I could not answer just then. Try again, or write to hello@remedyafrica.com.',
          links: Array.isArray(data.links) ? data.links : [],
        },
      ]);
    } catch {
      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          content: 'The guide is quiet for a moment. You can still open Contact, or try the question again.',
          links: [{ label: 'Write to us', href: '/contact' }],
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    ask(input);
  };

  return (
    <EditorialPage>
      <PageHero
        eyebrow="House guide"
        title="Ask, and we will walk with you."
        subtitle="A calm bot that knows RemedyAfrica — booking, calls, plant identification, profiles, and the rest of the house. It does not diagnose."
        backHref="/contact"
        backLabel="Write to a person"
      />

      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <div className="rounded-3xl border border-forest/10 bg-white shadow-soft overflow-hidden flex flex-col min-h-[32rem]">
            <div className="flex-1 space-y-4 overflow-y-auto p-5 sm:p-8">
              {messages.map((message, index) => (
                <div key={`${message.role}-${index}`} className={message.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                  <div
                    className={
                      message.role === 'user'
                        ? 'max-w-[85%] rounded-3xl rounded-br-md bg-forest px-4 py-3 text-cream'
                        : 'max-w-[90%] rounded-3xl rounded-bl-md bg-cream px-4 py-3 text-ink'
                    }
                  >
                    {message.role === 'assistant' && (
                      <p className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-bronze">
                        <Sparkles className="h-3 w-3" /> Remedy
                      </p>
                    )}
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                    {message.links && message.links.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {message.links.map((link) => (
                          <Link
                            key={`${link.href}-${link.label}`}
                            href={link.href}
                            className="rounded-full border border-forest/20 bg-white px-3 py-1 text-xs font-medium text-forest hover:bg-forest hover:text-cream"
                          >
                            {link.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {sending && (
                <p className="flex items-center gap-2 text-sm text-ink-muted">
                  <Loader2 className="h-4 w-4 animate-spin" /> Looking through the house…
                </p>
              )}
              <div ref={endRef} />
            </div>

            <form onSubmit={handleSubmit} className="border-t border-forest/10 bg-white p-4 flex gap-3">
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Ask how to book, join a call, identify a plant…"
                className="booking-field flex-1"
                aria-label="Ask the RemedyAfrica guide"
              />
              <Button type="submit" disabled={sending || !input.trim()} className="bg-forest hover:bg-forest-mist text-cream">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>

          <aside className="space-y-3">
            <p className="eyebrow">Try asking</p>
            {SUPPORT_STARTERS.map((starter) => (
              <button
                key={starter}
                type="button"
                onClick={() => ask(starter)}
                className="w-full rounded-3xl border border-forest/10 bg-white px-4 py-3 text-left text-sm text-forest shadow-soft hover:border-bronze/40"
              >
                {starter}
              </button>
            ))}
            <p className="pt-4 text-sm text-ink-muted">
              Need a person?{' '}
              <Link href="/contact" className="text-bronze hover:text-forest">
                Write to the house
              </Link>
              .
            </p>
          </aside>
        </div>
      </div>
    </EditorialPage>
  );
}
