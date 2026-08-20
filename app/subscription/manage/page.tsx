'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import {
  cancelSubscription,
  getNextPlan,
  getPlanById,
  SUBSCRIPTION_PLANS,
  subscriptionIsLive,
} from '@/lib/payments';
import { formatMoney } from '@/lib/payments/logic';
import { Button } from '@/components/ui/button';
import { EditorialPage, PageHero } from '@/components/editorial/PageHero';
import {
  Check,
  Loader2,
  Calendar,
  CreditCard,
  Crown,
  AlertTriangle,
  XCircle,
  Clock,
  Receipt,
  Shield,
} from 'lucide-react';
import { toast } from 'sonner';

type HistoryItem = {
  id: string;
  amount?: number;
  currency?: string;
  status?: string;
  gateway?: string;
  reference?: string;
  createdAt?: string | null;
  planName?: string;
};

export default function ManageSubscriptionPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [subscription, setSubscription] = useState<any>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [prices, setPrices] = useState<Record<string, number>>({});

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login?redirect=/subscription/manage');
      return;
    }
    loadData();
  }, [user, authLoading, router]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const [meRes, catalogRes] = await Promise.all([
        fetch('/api/payments/me', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/payments/catalog'),
      ]);
      const me = await meRes.json();
      const catalog = await catalogRes.json();
      if (me.success) {
        setSubscription(me.subscription);
        setHistory(me.history || []);
      }
      if (catalog.success) {
        const next: Record<string, number> = {};
        for (const plan of catalog.plans) next[plan.id] = plan.priceNGN;
        setPrices(next);
      }
    } catch {
      toast.error('Could not load your subscription');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    setCancelling(true);
    const result = await cancelSubscription('cancel');
    if (result.success) {
      toast.success(result.message || 'Your plan will end after this season');
      setShowCancelConfirm(false);
      await loadData();
    } else {
      toast.error(result.error || 'Could not cancel');
    }
    setCancelling(false);
  };

  const handleResume = async () => {
    setCancelling(true);
    const result = await cancelSubscription('resume');
    if (result.success) {
      toast.success(result.message || 'Your plan will continue');
      await loadData();
    } else {
      toast.error(result.error || 'Could not resume');
    }
    setCancelling(false);
  };

  const isLive = subscriptionIsLive(subscription);
  const endingSoon = Boolean(subscription?.cancelAtPeriodEnd);
  const currentPlan = subscription ? getPlanById(subscription.plan) : null;
  const nextPlan = subscription ? getNextPlan(subscription.plan) : null;

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream">
        <Loader2 className="h-8 w-8 animate-spin text-bronze" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <EditorialPage>
      <PageHero
        eyebrow="Your season"
        title="Manage subscription"
        subtitle="See what you paid for, when it ends, and whether it should renew."
        backHref="/"
        backLabel="Home"
      />

      <div className="mx-auto max-w-4xl space-y-6 px-4 py-10 sm:px-6">
        {!subscription && (
          <div className="rounded-[2rem] border border-dashed border-forest/20 bg-white p-10 text-center">
            <Shield className="mx-auto h-10 w-10 text-bronze" />
            <h2 className="mt-4 font-serif text-2xl text-forest">No paid season yet</h2>
            <p className="mt-2 text-sm text-ink-muted">The library stays free. Upgrade only if you want a healer in the house.</p>
            <Link href="/subscription" className="mt-6 inline-block">
              <Button>
                <Crown className="mr-2 h-4 w-4" />
                View plans
              </Button>
            </Link>
          </div>
        )}

        {endingSoon && isLive && (
          <div className="flex gap-3 rounded-[1.5rem] border border-amber-200 bg-amber-50 p-4">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
            <div>
              <p className="font-medium text-amber-900">This season will not renew</p>
              <p className="text-sm text-amber-800">
                You keep access until {formatDate(subscription.expiresAt)}. Resume if you want the next season.
              </p>
            </div>
          </div>
        )}

        {subscription && (
          <section className="rounded-[2rem] border border-forest/10 bg-white p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="eyebrow">Current plan</p>
                <h2 className="mt-2 font-serif text-3xl text-forest">{currentPlan?.name || subscription.planName}</h2>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${isLive ? 'bg-forest/10 text-forest' : 'bg-gray-100 text-gray-600'}`}>
                {endingSoon ? 'Ending' : isLive ? 'Active' : subscription.status}
              </span>
            </div>

            <dl className="mt-8 grid gap-4 sm:grid-cols-2">
              <Info icon={Calendar} label="Started" value={formatDate(subscription.startedAt)} />
              <Info icon={Clock} label={endingSoon ? 'Access until' : 'Renews'} value={formatDate(subscription.expiresAt)} />
              <Info icon={CreditCard} label="Last charge" value={formatCurrency(subscription.amount, subscription.currency)} />
              <Info icon={Shield} label="Paid via" value={String(subscription.gateway || '—')} />
            </dl>

            {currentPlan && (
              <ul className="mt-8 space-y-2 rounded-[1.5rem] bg-cream p-5">
                {currentPlan.features.map((feature) => (
                  <li key={feature} className="flex gap-2 text-sm text-ink">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-bronze" />
                    {feature}
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-8 flex flex-wrap gap-3">
              {isLive && nextPlan && (
                <Link href={`/subscription?plan=${nextPlan.id}`}>
                  <Button variant="gold">Upgrade to {nextPlan.name}</Button>
                </Link>
              )}
              {isLive && !endingSoon && (
                <Button variant="outline" className="border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800" onClick={() => setShowCancelConfirm(true)}>
                  <XCircle className="mr-2 h-4 w-4" />
                  Cancel at period end
                </Button>
              )}
              {isLive && endingSoon && (
                <Button onClick={handleResume} disabled={cancelling}>
                  {cancelling ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Keep my plan'}
                </Button>
              )}
              {!isLive && (
                <Link href="/subscription">
                  <Button>Start a new season</Button>
                </Link>
              )}
            </div>
          </section>
        )}

        <section className="rounded-[2rem] border border-forest/10 bg-white p-6 sm:p-8">
          <div className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-bronze" />
            <h2 className="font-serif text-2xl text-forest">Payment history</h2>
          </div>
          {history.length === 0 ? (
            <p className="mt-6 text-sm text-ink-muted">No charges yet.</p>
          ) : (
            <ul className="mt-6 space-y-3">
              {history.map((payment) => (
                <li key={payment.id} className="flex items-center justify-between rounded-2xl border border-forest/10 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-forest">{payment.planName || 'Subscription'}</p>
                    <p className="text-xs text-ink-muted">
                      {payment.gateway} · {String(payment.reference || payment.id).slice(0, 18)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-forest">
                      {formatCurrency(payment.amount || 0, payment.currency || 'NGN')}
                    </p>
                    <p className="text-xs text-ink-muted">{formatDate(payment.createdAt)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-[2rem] border border-forest/10 bg-white p-6 sm:p-8">
          <h2 className="font-serif text-2xl text-forest">All seasons</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {SUBSCRIPTION_PLANS.map((plan) => {
              const current = subscription?.plan === plan.id && isLive;
              const ngn = prices[plan.id] || plan.priceUSD * 1600;
              return (
                <div key={plan.id} className={`rounded-2xl border p-4 ${current ? 'border-bronze/40 bg-cream' : 'border-forest/10'}`}>
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-forest">{plan.name}</p>
                    {current && <span className="text-[10px] uppercase tracking-wide text-bronze">Current</span>}
                  </div>
                  <p className="mt-2 font-serif text-xl text-forest">{formatMoney(ngn, 'NGN')}</p>
                  {!current && (
                    <Link href={`/subscription?plan=${plan.id}`} className="mt-4 inline-block text-sm text-bronze hover:underline">
                      {isLive ? 'Switch' : 'Select'}
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {showCancelConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-forest/70 p-4">
          <div className="w-full max-w-md rounded-[2rem] bg-cream p-6 shadow-lift">
            <h2 className="font-serif text-2xl text-forest">End after this season?</h2>
            <p className="mt-3 text-sm text-ink-muted">
              You keep everything you already paid for until <strong>{formatDate(subscription?.expiresAt)}</strong>. We will not take the next charge.
            </p>
            <div className="mt-6 flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowCancelConfirm(false)} disabled={cancelling}>
                Keep plan
              </Button>
              <Button className="flex-1 bg-red-700 hover:bg-red-800" onClick={handleCancel} disabled={cancelling}>
                {cancelling ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Yes, end it'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </EditorialPage>
  );
}

function Info({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 text-sm">
      <Icon className="mt-0.5 h-4 w-4 text-bronze" />
      <div>
        <p className="text-ink-muted">{label}</p>
        <p className="font-medium capitalize text-forest">{value}</p>
      </div>
    </div>
  );
}

function formatDate(value: unknown) {
  if (!value) return '—';
  const date = typeof value === 'string' ? new Date(value) : (value as any)?.toDate?.() || new Date(String(value));
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatCurrency(amount: number, currency: string) {
  return formatMoney(amount, currency === 'USD' ? 'USD' : 'NGN');
}
