'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import {
  SUBSCRIPTION_PLANS,
  PaymentGateway,
  getSubscriptionStatus,
} from '@/lib/payments';
import { getExchangeRate } from '@/lib/exchange-rate';
import { Button } from '@/components/ui/button';
import {
  Check,
  Loader2,
  Shield,
  Calendar,
  Leaf,
  Users,
  MessageSquare,
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { EditorialPage, PageHero, DisclaimerNote } from '@/components/editorial/PageHero';

export default function SubscriptionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(
    searchParams.get('plan')
  );
  const [selectedGateway, setSelectedGateway] = useState<PaymentGateway>('paystack');
  const [processing, setProcessing] = useState(false);
  const [currentSub, setCurrentSub] = useState<any>(null);
  const [checkingSub, setCheckingSub] = useState(false);
  const [exchangeRate, setExchangeRate] = useState<number>(1600);
  const [ngnPrices, setNgnPrices] = useState<Record<string, number>>(() => {
    const prices: Record<string, number> = {};
    for (const plan of SUBSCRIPTION_PLANS) {
      prices[plan.id] = Math.round(plan.priceUSD * 1600);
    }
    return prices;
  });

  const canceled = searchParams.get('canceled') === 'true';
  const verified = searchParams.get('verified') === 'true';

  useEffect(() => {
    if (canceled) toast.error('Payment was canceled. You can try again.');
    if (verified) toast.success('You are covered for the next three months.');
  }, [canceled, verified]);

  useEffect(() => {
    const loadRates = async () => {
      try {
        const rate = await getExchangeRate();
        setExchangeRate(rate);
        const prices: Record<string, number> = {};
        for (const plan of SUBSCRIPTION_PLANS) {
          prices[plan.id] = Math.round(plan.priceUSD * rate);
        }
        setNgnPrices(prices);
      } catch {
        // Keep the fallback already on screen.
      }
    };
    loadRates();
  }, []);

  useEffect(() => {
    const loadSub = async () => {
      if (!user) {
        setCurrentSub(null);
        setCheckingSub(false);
        return;
      }
      setCheckingSub(true);
      try {
        const sub = await getSubscriptionStatus(user.uid);
        setCurrentSub(sub);
      } catch (err) {
        console.error('Error loading sub:', err);
      } finally {
        setCheckingSub(false);
      }
    };
    loadSub();
  }, [user]);

  useEffect(() => {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    const overseas = ['America/', 'Europe/', 'Australia/', 'Pacific/', 'Atlantic/'];
    if (overseas.some((prefix) => timezone.startsWith(prefix))) {
      setSelectedGateway('flutterwave');
    } else {
      setSelectedGateway('paystack');
    }
  }, []);

  const handleSubscribe = async (planId: string) => {
    if (!user) {
      toast.error('Please sign in first');
      router.push('/login?redirect=/subscription');
      return;
    }

    if (!user.email) {
      toast.error('Your account is missing an email.');
      return;
    }

    setSelectedPlan(planId);
    setProcessing(true);

    try {
      const plan = SUBSCRIPTION_PLANS.find((p) => p.id === planId);
      if (!plan) throw new Error('Plan not found');

      const payload = {
        email: user.email,
        userId: user.uid,
        planId,
        gateway: selectedGateway,
        callbackUrl: `${window.location.origin}/subscription`,
      };

      const response = await fetch('/api/payments/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(`Server error (${response.status}): ${text.slice(0, 200)}`);
      }

      if (!data.success) {
        throw new Error(data.error || 'Payment initiation failed');
      }

      if (!data.authorizationUrl) {
        throw new Error('No payment URL returned');
      }

      window.location.href = data.authorizationUrl;
    } catch (error: any) {
      console.error('[Subscribe] Error:', error);
      toast.error(error.message || 'Failed to initiate payment');
      setProcessing(false);
      setSelectedPlan(null);
    }
  };

  if (authLoading || (user && checkingSub)) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-bronze animate-spin" />
      </div>
    );
  }

  const isActive = currentSub?.status === 'active';
  const activePlanId = currentSub?.plan;
  const payInNaira = selectedGateway === 'paystack';

  const quarterlyPrice = (planId: string): number => {
    const plan = SUBSCRIPTION_PLANS.find((p) => p.id === planId)!;
    if (payInNaira) {
      return ngnPrices[planId] || Math.round(plan.priceUSD * exchangeRate);
    }
    return plan.priceUSD;
  };

  const formatMoney = (amount: number) =>
    payInNaira ? `₦${amount.toLocaleString()}` : `$${amount.toLocaleString()}`;

  const monthlyLabel = (planId: string) => {
    const q = quarterlyPrice(planId);
    if (payInNaira) return `₦${Math.round(q / 3).toLocaleString()}`;
    return `$${(q / 3).toFixed(0)}`;
  };

  return (
    <EditorialPage>
      <PageHero
        eyebrow="Care, not a software license"
        title="A healer for the house — for three months at a time."
        subtitle="Healing is not a monthly app. You talk, you follow a protocol, you come back. That is why every plan covers a season, not a week."
      />

      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        {isActive && (
          <div className="mb-12 rounded-[2rem] border border-forest/15 bg-white px-6 py-5 sm:px-8 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-forest/10">
              <Check className="h-5 w-5 text-forest" />
            </div>
            <div className="flex-1">
              <p className="font-serif text-xl text-forest">
                You are on {currentSub.planName}
              </p>
              <p className="mt-1 text-sm text-ink-muted">
                Covered until{' '}
                {currentSub.expiresAt?.toDate?.().toLocaleDateString?.() ||
                  'the end of this season'}
              </p>
            </div>
            <Link
              href="/subscription/manage"
              className="inline-flex rounded-full border border-forest/20 px-5 py-2 text-sm font-medium text-forest hover:bg-cream"
            >
              Manage
            </Link>
          </div>
        )}

        <div className="mb-14 grid gap-6 md:grid-cols-2">
          <div className="rounded-[2rem] border border-forest/10 bg-white p-8">
            <p className="eyebrow">Always free</p>
            <h2 className="mt-3 font-serif text-2xl text-forest">Read first. Pay only to talk.</h2>
            <ul className="mt-6 space-y-3 text-sm leading-relaxed text-ink">
              {[
                'Search how you feel in your own words',
                'Read the herb library, including local names',
                'See cautions and side effects — we do not lock safety',
              ].map((item) => (
                <li key={item} className="flex gap-3">
                  <Leaf className="mt-0.5 h-4 w-4 shrink-0 text-bronze" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-[2rem] border border-bronze/30 bg-forest p-8 text-cream">
            <p className="eyebrow text-bronze">What you actually buy</p>
            <h2 className="mt-3 font-serif text-2xl">A person who has used these plants.</h2>
            <p className="mt-4 text-sm leading-relaxed text-cream/75">
              A private visit to a healer often costs more than one month here. Premium is two
              conversations a month, included. You are not paying to browse bitter leaf.
            </p>
          </div>
        </div>

        <p className="mb-8 text-center text-sm text-ink-muted">
          {payInNaira
            ? 'You will pay in naira. Cards and transfers from Nigeria are accepted.'
            : 'International cards are charged in US dollars.'}
        </p>

        <div className="grid items-stretch gap-8 lg:grid-cols-3 mb-16">
          {SUBSCRIPTION_PLANS.map((plan) => {
            const price = quarterlyPrice(plan.id);
            const isSelected = selectedPlan === plan.id;
            const isCurrentPlan = activePlanId === plan.id;
            const isButtonDisabled = processing || (isActive && isCurrentPlan);

            return (
              <article
                key={plan.id}
                className={`relative flex flex-col rounded-[2rem] border bg-white p-8 shadow-soft ${
                  plan.popular
                    ? 'border-bronze/50 lg:-mt-4 lg:mb-[-1rem] lg:pt-10'
                    : 'border-forest/10'
                } ${isSelected ? 'ring-2 ring-bronze/40' : ''}`}
              >
                {plan.popular && (
                  <p className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-bronze px-4 py-1 text-[11px] font-medium uppercase tracking-wider text-cream">
                    Most families choose this
                  </p>
                )}

                <p className="eyebrow text-bronze">{plan.name}</p>
                <h3 className="mt-3 font-serif text-2xl leading-snug text-forest">
                  {plan.headline}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-ink-muted">{plan.whoItsFor}</p>

                <div className="mt-8">
                  <p className="font-serif text-4xl text-forest">{monthlyLabel(plan.id)}</p>
                  <p className="mt-1 text-sm text-ink-muted">a month</p>
                  <p className="mt-2 text-xs text-ink-muted">
                    Billed {formatMoney(price)} every 3 months
                  </p>
                </div>

                <ul className="mt-8 flex-1 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm text-ink">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-bronze" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-8">
                  {!user ? (
                    <Button
                      type="button"
                      onClick={() => router.push('/login?redirect=/subscription')}
                      className={`h-12 w-full rounded-full text-base ${
                        plan.popular
                          ? 'bg-forest text-cream hover:bg-forest-mist'
                          : 'bg-cream text-forest hover:bg-white border border-forest/15'
                      }`}
                    >
                      Sign in to continue
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      onClick={() => handleSubscribe(plan.id)}
                      disabled={isButtonDisabled}
                      className={`h-12 w-full rounded-full text-base ${
                        plan.popular
                          ? 'bg-forest text-cream hover:bg-forest-mist'
                          : 'bg-cream text-forest hover:bg-white border border-forest/15'
                      }`}
                    >
                      {processing && isSelected ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Opening payment…
                        </>
                      ) : isActive && isCurrentPlan ? (
                        'Your current plan'
                      ) : isActive ? (
                        `Switch to ${plan.name}`
                      ) : (
                        plan.cta
                      )}
                    </Button>
                  )}
                </div>
              </article>
            );
          })}
        </div>

        <div className="mb-16 grid grid-cols-2 gap-8 md:grid-cols-4 text-center">
          {[
            { icon: Shield, label: 'Secure payments' },
            { icon: Users, label: 'Verified healers' },
            { icon: Calendar, label: 'A season of care' },
            { icon: MessageSquare, label: 'African owned' },
          ].map((badge) => (
            <div key={badge.label}>
              <badge.icon className="mx-auto mb-2 h-6 w-6 text-bronze" />
              <p className="text-sm font-medium text-forest">{badge.label}</p>
            </div>
          ))}
        </div>

        <div className="mx-auto max-w-3xl mb-16">
          <p className="eyebrow text-center">Common questions</p>
          <h2 className="mt-3 mb-8 text-center font-serif text-3xl text-forest">
            Before you pay
          </h2>
          <div className="space-y-4">
            {[
              {
                q: 'Why three months, not one?',
                a: 'A herb protocol is not a ringtone. You need time to talk, follow through, and come back. One month trains you to quit. A season is how traditional care actually works.',
              },
              {
                q: 'Is Premium expensive?',
                a: 'If you wanted a wellness app, yes — $8 a month is a lot for a plant list. If you wanted two private conversations with a healer, it is often less than a single clinic visit. That is the product. Basic exists only if you need the camera, not the person.',
              },
              {
                q: 'Are the consultations really included?',
                a: 'Yes. Premium includes two sessions every month. Household includes as many as the home needs. There is no sitting fee on top. Basic does not include a healer — that is on purpose, so you do not pay for a person you will not meet.',
              },
              {
                q: 'Can I switch later?',
                a: 'Yes. Move up whenever you are ready; it starts at once. Moving down waits until this season ends.',
              },
              {
                q: 'I live outside Nigeria.',
                a: 'Use an international card. We charge dollars. If you are paying from Africa, we take naira so you are not doing the conversion in your head at the till.',
              },
            ].map((faq) => (
              <div key={faq.q} className="rounded-[1.5rem] border border-forest/10 bg-white p-6">
                <h3 className="font-serif text-xl text-forest">{faq.q}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        <DisclaimerNote>
          <p>
            RemedyAfrica is not a hospital. A subscription is access to traditional practitioners
            and a library — not a diagnosis. If someone is in danger, go to emergency care first.
          </p>
          <p className="mt-4">
            Are you a healer?{' '}
            <Link href="/practitioners/apply" className="text-forest underline underline-offset-4">
              Apply to practise here
            </Link>
            . We keep that conversation off this page so families are not shopping while reading
            someone else’s pay.
          </p>
        </DisclaimerNote>
      </div>
    </EditorialPage>
  );
}
