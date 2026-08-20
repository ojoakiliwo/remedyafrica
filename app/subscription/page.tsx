'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import {
  SUBSCRIPTION_PLANS,
  startCheckout,
  verifyCheckoutReturn,
  subscriptionIsLive,
  type PaymentGateway,
} from '@/lib/payments';
import { formatMoney, monthlyEquivalent, suggestGatewayFromTimezone } from '@/lib/payments/logic';
import { Button } from '@/components/ui/button';
import { EditorialPage, PageHero, DisclaimerNote } from '@/components/editorial/PageHero';
import {
  Check,
  Loader2,
  Shield,
  Leaf,
  Crown,
  RefreshCw,
  Lock,
} from 'lucide-react';
import { toast } from 'sonner';

type Catalog = {
  usdToNgn: number;
  gateways: { paystack: boolean; flutterwave: boolean };
  defaultGateway: PaymentGateway;
  plans: Array<{ id: string; priceUSD: number; priceNGN: number }>;
};

function SubscriptionCheckout() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(searchParams.get('plan'));
  const [selectedGateway, setSelectedGateway] = useState<PaymentGateway>('paystack');
  const [processing, setProcessing] = useState(false);
  const [currentSub, setCurrentSub] = useState<any>(null);
  const [verifying, setVerifying] = useState(false);

  const canceled = searchParams.get('canceled') === 'true';
  const verifiedFlag = searchParams.get('verified');
  const returnReference = searchParams.get('reference') || searchParams.get('trxref');
  const txRef = searchParams.get('tx_ref');
  const transactionId = searchParams.get('transaction_id');
  const returnStatus = searchParams.get('status');

  useEffect(() => {
    fetch('/api/payments/catalog')
      .then((res) => res.json())
      .then((data) => {
        if (!data?.success) return;
        setCatalog(data);
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const preferred = suggestGatewayFromTimezone(tz);
        if (data.gateways[preferred]) setSelectedGateway(preferred);
        else if (data.gateways.paystack) setSelectedGateway('paystack');
        else if (data.gateways.flutterwave) setSelectedGateway('flutterwave');
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!user) {
      setCurrentSub(null);
      return;
    }
    const tokenPromise = user.getIdToken();
    tokenPromise
      .then((token) => fetch('/api/payments/me', { headers: { Authorization: `Bearer ${token}` } }))
      .then((res) => res.json())
      .then((data) => {
        if (data?.success) setCurrentSub(data.subscription);
      })
      .catch(() => {});
  }, [user]);

  const verifyingOnce = useRef(false);

  useEffect(() => {
    const shouldVerify = Boolean(returnReference || txRef || transactionId);
    if (!shouldVerify) {
      if (canceled) toast.error('Payment was cancelled. Nothing was charged.');
      if (verifiedFlag === 'true') toast.success('Your three-month season is now active.');
      return;
    }
    if (verifyingOnce.current) return;
    verifyingOnce.current = true;

    let cancelled = false;
    setVerifying(true);
    verifyCheckoutReturn({
      reference: returnReference,
      txRef,
      transactionId,
      status: returnStatus,
    })
      .then((result) => {
        if (cancelled) return;
        if (result?.success) {
          toast.success(result.message || 'Payment confirmed. Your season is active.');
          router.replace('/subscription?verified=true');
        } else if (returnStatus === 'cancelled' || canceled) {
          toast.error('Payment was cancelled. Nothing was charged.');
          router.replace('/subscription?canceled=true');
        } else {
          toast.error(result?.error || result?.message || 'We could not confirm that payment yet.');
        }
      })
      .catch(() => {
        if (!cancelled) toast.error('We could not confirm that payment yet. If you were charged, refresh this page in a minute.');
      })
      .finally(() => {
        if (!cancelled) setVerifying(false);
      });

    return () => {
      cancelled = true;
    };
  }, [returnReference, txRef, transactionId, returnStatus, canceled, verifiedFlag, router]);

  const isActive = subscriptionIsLive(currentSub);
  const activePlanId = currentSub?.plan;
  const payInNaira = selectedGateway === 'paystack';
  const rate = catalog?.usdToNgn || 1600;
  const prices = useMemo(() => {
    const map: Record<string, number> = {};
    for (const plan of SUBSCRIPTION_PLANS) {
      const fromCatalog = catalog?.plans.find((item) => item.id === plan.id);
      map[plan.id] = payInNaira ? (fromCatalog?.priceNGN || Math.round(plan.priceUSD * rate)) : plan.priceUSD;
    }
    return map;
  }, [catalog, payInNaira, rate]);

  const handleSubscribe = async (planId: string) => {
    if (!user) {
      router.push(`/login?redirect=${encodeURIComponent(`/subscription?plan=${planId}`)}`);
      return;
    }

    setSelectedPlan(planId);
    setProcessing(true);
    try {
      const data = await startCheckout({ planId, gateway: selectedGateway });
      window.location.href = data.authorizationUrl;
    } catch (error: any) {
      toast.error(error.message || 'Could not start checkout');
      setProcessing(false);
    }
  };

  const gatewayReady = Boolean(catalog?.gateways[selectedGateway]);

  return (
    <EditorialPage>
      {verifying && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-forest/70 px-6">
          <div className="max-w-md rounded-[2rem] bg-cream p-8 text-center shadow-lift">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-bronze" />
            <p className="mt-4 font-serif text-2xl text-forest">Confirming your payment</p>
            <p className="mt-2 text-sm text-ink-muted">
              Stay on this page. We are asking Paystack or Flutterwave whether this charge succeeded.
            </p>
          </div>
        </div>
      )}

      <PageHero
        eyebrow="Care, not a software license"
        title="A healer for the house — for three months at a time."
        subtitle="Healing is not a weekly app. You talk, you follow a protocol, you come back. Every plan covers a season, with consultations included."
      />

      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        {isActive && (
          <div className="mb-12 flex flex-col gap-4 rounded-[2rem] border border-forest/15 bg-white px-6 py-5 sm:flex-row sm:items-center sm:px-8">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-forest/10">
              <Check className="h-5 w-5 text-forest" />
            </div>
            <div className="flex-1">
              <p className="font-serif text-xl text-forest">You are on {currentSub.planName}</p>
              <p className="mt-1 text-sm text-ink-muted">
                Covered until {formatDate(currentSub.expiresAt)}
                {currentSub.cancelAtPeriodEnd ? ' · set to end after this season' : ''}
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
              A private visit to a healer often costs more than one month here. Premium is two conversations a month, included. You are not paying to browse bitter leaf.
            </p>
          </div>
        </div>

        <div className="mb-10 flex flex-col items-center gap-3">
          <div className="inline-flex rounded-full border border-forest/10 bg-white p-1 shadow-soft">
            <GatewayTab
              active={selectedGateway === 'paystack'}
              onClick={() => setSelectedGateway('paystack')}
              label="Pay in naira"
              hint="Nigeria & West Africa"
              disabled={catalog ? !catalog.gateways.paystack : false}
            />
            <GatewayTab
              active={selectedGateway === 'flutterwave'}
              onClick={() => setSelectedGateway('flutterwave')}
              label="Pay in dollars"
              hint="International cards"
              disabled={catalog ? !catalog.gateways.flutterwave : false}
            />
          </div>
          <p className="text-xs text-ink-muted">
            <RefreshCw className="mr-1 inline h-3 w-3" />
            Live rate: $1 = ₦{rate.toLocaleString()} · billed once for three months
          </p>
          {catalog && !gatewayReady && (
            <p className="rounded-full bg-amber-50 px-4 py-2 text-xs text-amber-800">
              This checkout method is not live on the server yet. Choose the other currency, or add the gateway key on Vercel.
            </p>
          )}
        </div>

        <div className="mb-16 grid gap-6 md:grid-cols-3">
          {SUBSCRIPTION_PLANS.map((plan) => {
            const amount = prices[plan.id];
            const currency = payInNaira ? 'NGN' : 'USD';
            const isCurrent = isActive && activePlanId === plan.id;
            const busy = processing && selectedPlan === plan.id;
            return (
              <article
                key={plan.id}
                className={`relative flex flex-col rounded-[2rem] border bg-white p-7 shadow-soft ${
                  plan.popular ? 'border-bronze/50 md:-translate-y-2 md:shadow-lift' : 'border-forest/10'
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-bronze px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-cream">
                    Most chosen
                  </span>
                )}
                <p className="font-serif text-2xl text-forest">{plan.name}</p>
                <p className="mt-1 text-sm text-ink-muted">{plan.description}</p>
                <p className="mt-6 font-serif text-4xl text-forest">{formatMoney(amount, currency)}</p>
                <p className="mt-1 text-sm text-ink-muted">
                  for 3 months · about {monthlyEquivalent(amount, currency)} / month
                </p>
                <p className="mt-4 rounded-full bg-cream px-3 py-1 text-xs text-forest">
                  {plan.consultationsPerMonth >= 999
                    ? 'Unlimited healer visits, included'
                    : plan.consultationsPerMonth === 0
                      ? 'Library access · no consultations'
                      : `${plan.consultationsPerMonth} healer visits each month, included`}
                </p>
                <ul className="mt-6 flex-1 space-y-3 text-sm text-ink">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-bronze" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button
                  className="mt-8 w-full"
                  size="lg"
                  disabled={busy || isCurrent || processing || !gatewayReady}
                  onClick={() => handleSubscribe(plan.id)}
                >
                  {busy ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Opening secure checkout
                    </>
                  ) : isCurrent ? (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Current season
                    </>
                  ) : !user ? (
                    'Sign in to continue'
                  ) : isActive ? (
                    `Switch to ${plan.name}`
                  ) : (
                    <>
                      <Crown className="mr-2 h-4 w-4" />
                      Begin {plan.name}
                    </>
                  )}
                </Button>
              </article>
            );
          })}
        </div>

        <div className="mb-16 grid gap-6 sm:grid-cols-3">
          {[
            { icon: Shield, title: 'Card, transfer, USSD', body: 'Paystack for naira. Flutterwave for cards from anywhere. We never see your full card number.' },
            { icon: Lock, title: 'Confirmed twice', body: 'Checkout return and a signed webhook both have to agree before a season is switched on.' },
            { icon: RefreshCw, title: 'Keep access to the end', body: 'Cancel anytime. You stay covered until the date you already paid for.' },
          ].map((item) => (
            <div key={item.title} className="rounded-[1.75rem] border border-forest/10 bg-white p-6">
              <item.icon className="h-5 w-5 text-bronze" />
              <p className="mt-3 font-serif text-lg text-forest">{item.title}</p>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">{item.body}</p>
            </div>
          ))}
        </div>

        <div className="mx-auto mb-16 max-w-3xl space-y-4">
          <h2 className="text-center font-serif text-3xl text-forest">Common questions</h2>
          {[
            {
              q: 'Why three months?',
              a: 'Traditional care takes time. A season is long enough to speak with a healer, follow a protocol, and see whether it is working.',
            },
            {
              q: 'Are healer visits extra?',
              a: 'No. Premium includes two conversations a month. Healer includes unlimited. There is no per-visit checkout for subscribers.',
            },
            {
              q: 'Can I switch plans?',
              a: 'Yes. Paying for a higher plan starts that season immediately. If you cancel, you keep the plan you already paid for until it ends.',
            },
            {
              q: 'I am outside Nigeria.',
              a: 'Choose Pay in dollars. International cards go through Flutterwave in USD. The naira prices follow a live exchange rate.',
            },
          ].map((faq) => (
            <div key={faq.q} className="rounded-[1.5rem] border border-forest/10 bg-white p-6">
              <p className="font-medium text-forest">{faq.q}</p>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">{faq.a}</p>
            </div>
          ))}
        </div>

        <DisclaimerNote>
          Payments are processed by Paystack or Flutterwave. RemedyAfrica does not store full card details. Subscriptions are educational access to the library and to verified practitioners, not a medical diagnosis.
        </DisclaimerNote>
      </div>
    </EditorialPage>
  );
}

function GatewayTab({
  active,
  onClick,
  label,
  hint,
  disabled,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  hint: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-full px-5 py-2.5 text-left transition ${
        active ? 'bg-forest text-cream' : 'text-ink-muted hover:text-forest'
      } ${disabled ? 'opacity-40' : ''}`}
    >
      <span className="block text-sm font-medium">{label}</span>
      <span className={`block text-[11px] ${active ? 'text-cream/70' : 'text-ink-muted'}`}>{hint}</span>
    </button>
  );
}

function formatDate(value: unknown) {
  if (!value) return 'the end of this season';
  const date = typeof value === 'string' ? new Date(value) : (value as any)?.toDate?.() || new Date(value as any);
  if (Number.isNaN(date.getTime())) return 'the end of this season';
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function SubscriptionPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-cream">
          <Loader2 className="h-8 w-8 animate-spin text-bronze" />
        </div>
      }
    >
      <SubscriptionCheckout />
    </Suspense>
  );
}
