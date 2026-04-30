'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/lib/firebase/client';
import { doc, getDoc, collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { 
  getSubscriptionStatus, 
  cancelSubscription, 
  getPlanById, 
  getNextPlan,
  getPlanPriceNGN,
  SUBSCRIPTION_PLANS,
  SubscriptionRecord 
} from '@/lib/payments';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Check, 
  Loader2, 
  Calendar, 
  CreditCard, 
  Crown, 
  AlertTriangle,
  ArrowLeft,
  XCircle,
  TrendingUp,
  Clock,
  Shield,
  Receipt
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

interface PaymentHistoryItem {
  id: string;
  amount: number;
  currency: string;
  status: string;
  gateway: string;
  reference: string;
  createdAt: Date;
  planName: string;
}

export default function ManageSubscriptionPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionRecord | null>(null);
  const [history, setHistory] = useState<PaymentHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [planPrices, setPlanPrices] = useState<Record<string, number>>({});

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
      const [subData, historyData] = await Promise.all([
        getSubscriptionStatus(user.uid),
        fetchPaymentHistory(user.uid)
      ]);

      setSubscription(subData as SubscriptionRecord | null);
      setHistory(historyData);

      // Fetch NGN prices for all plans
      const prices: Record<string, number> = {};
      await Promise.all(
        SUBSCRIPTION_PLANS.map(async (plan) => {
          try {
            prices[plan.id] = await getPlanPriceNGN(plan.id);
          } catch (e) {
            prices[plan.id] = plan.priceUSD * 1500; // fallback
          }
        })
      );
      setPlanPrices(prices);
    } catch (err) {
      console.error('Error loading subscription data:', err);
      toast.error('Failed to load subscription details');
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentHistory = async (userId: string): Promise<PaymentHistoryItem[]> => {
    try {
      const paymentsQuery = query(
        collection(db, 'payments'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(10)
      );
      const snapshot = await getDocs(paymentsQuery);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()
      })) as PaymentHistoryItem[];
    } catch (e) {
      return [];
    }
  };

  const handleCancel = async () => {
    if (!user) return;
    setCancelling(true);

    const result = await cancelSubscription(user.uid);
    if (result.success) {
      toast.success(result.message || 'Subscription cancelled');
      setShowCancelConfirm(false);
      await loadData();
    } else {
      toast.error(result.error || 'Failed to cancel subscription');
    }

    setCancelling(false);
  };

  const handleUpgrade = () => {
    if (!subscription) {
      router.push('/subscription');
      return;
    }
    const nextPlan = getNextPlan(subscription.plan);
    if (nextPlan) {
      router.push(`/subscription?plan=${nextPlan.id}`);
    } else {
      router.push('/subscription');
    }
  };

  const formatDate = (date: any) => {
    if (!date) return 'N/A';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number, currency: string) => {
    const symbol = currency === 'NGN' ? '₦' : '$';
    return `${symbol}${amount.toLocaleString()}`;
  };

  const isActive = subscription?.status === 'active';
  const isCancelled = subscription?.status === 'cancelled';
  const currentPlan = subscription ? getPlanById(subscription.plan) : null;
  const nextPlan = subscription ? getNextPlan(subscription.plan) : null;
  const daysUntilExpiry = subscription?.expiresAt
    ? Math.ceil((subscription.expiresAt.toDate?.() || new Date(subscription.expiresAt)).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    : 0;

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#F5F5DC] flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-[#97A97C] animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#F5F5DC]">
      {/* Header */}
      <div className="bg-[#2C3E2D] text-[#F5F5DC] py-10">
        <div className="max-w-4xl mx-auto px-4">
          <Link href="/" className="inline-flex items-center text-[#97A97C] hover:text-white mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
          <h1 className="text-3xl font-bold">Manage Subscription</h1>
          <p className="text-[#97A97C] mt-1">View and control your RemedyAfrica plan</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        
        {/* Status Banner */}
        {!subscription && (
          <Card className="border-dashed border-2 border-gray-300 bg-white">
            <CardContent className="p-8 text-center">
              <Shield className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <h2 className="text-xl font-bold text-[#2C3E2D] mb-2">No Active Subscription</h2>
              <p className="text-gray-600 mb-4">You are currently on the free plan.</p>
              <Link href="/subscription">
                <Button className="bg-[#97A97C] hover:bg-[#7A8A63]">
                  <Crown className="w-4 h-4 mr-2" />
                  View Plans
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {isActive && daysUntilExpiry <= 3 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-800">Subscription expiring soon</p>
              <p className="text-sm text-amber-700">
                Your plan expires in {Math.floor(daysUntilExpiry)} day{daysUntilExpiry !== 1 ? 's' : ''}. 
                Renew now to avoid interruption.
              </p>
            </div>
          </div>
        )}

        {isCancelled && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <XCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-800">Subscription cancelled</p>
              <p className="text-sm text-red-700">
                Your access will continue until {formatDate(subscription?.expiresAt)}. 
                After that, you will revert to the free plan.
              </p>
            </div>
          </div>
        )}

        {/* Current Plan Card */}
        {subscription && (
          <Card className={isActive ? 'border-[#97A97C] border-2' : 'border-gray-200'}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-[#2C3E2D]">
                  <Crown className="w-5 h-5 text-[#97A97C]" />
                  Current Plan
                </CardTitle>
                <Badge className={isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                  {isActive ? 'Active' : subscription.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-[#2C3E2D]">
                  {currentPlan?.name || subscription.planName}
                </span>
                <span className="text-gray-500">/ {subscription.interval}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="w-4 h-4 text-[#97A97C]" />
                  <span className="text-gray-600">Started:</span>
                  <span className="font-medium">{formatDate(subscription.startedAt)}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Clock className="w-4 h-4 text-[#97A97C]" />
                  <span className="text-gray-600">Renews:</span>
                  <span className="font-medium">{formatDate(subscription.expiresAt)}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <CreditCard className="w-4 h-4 text-[#97A97C]" />
                  <span className="text-gray-600">Amount:</span>
                  <span className="font-medium">
                    {formatCurrency(subscription.amount, subscription.currency)}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Shield className="w-4 h-4 text-[#97A97C]" />
                  <span className="text-gray-600">Gateway:</span>
                  <span className="font-medium capitalize">{subscription.gateway}</span>
                </div>
              </div>

              {currentPlan && (
                <div className="bg-[#F5F5DC] rounded-lg p-4">
                  <p className="font-semibold text-sm text-[#2C3E2D] mb-2">Plan Features</p>
                  <ul className="space-y-2">
                    {currentPlan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                        <Check className="w-4 h-4 text-[#97A97C] shrink-0 mt-0.5" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-3 pt-2">
                {isActive && nextPlan && (
                  <Button 
                    onClick={handleUpgrade}
                    className="bg-[#B8860B] hover:bg-[#9A7009] text-white"
                  >
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Upgrade to {nextPlan.name}
                  </Button>
                )}

                {isActive && (
                  <Button 
                    variant="outline" 
                    onClick={() => setShowCancelConfirm(true)}
                    className="border-red-300 text-red-600 hover:bg-red-50"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Cancel Subscription
                  </Button>
                )}

                {!isActive && !isCancelled && (
                  <Link href="/subscription">
                    <Button className="bg-[#97A97C] hover:bg-[#7A8A63]">
                      <Crown className="w-4 h-4 mr-2" />
                      Subscribe Now
                    </Button>
                  </Link>
                )}

                {isCancelled && (
                  <Link href="/subscription">
                    <Button className="bg-[#97A97C] hover:bg-[#7A8A63]">
                      <Crown className="w-4 h-4 mr-2" />
                      Reactivate
                    </Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Payment History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#2C3E2D]">
              <Receipt className="w-5 h-5 text-[#97A97C]" />
              Payment History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {history.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Receipt className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p>No payment history yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {history.map((payment) => (
                  <div 
                    key={payment.id} 
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${
                        payment.status === 'successful' ? 'bg-green-500' : 'bg-red-500'
                      }`} />
                      <div>
                        <p className="font-medium text-sm text-[#2C3E2D]">{payment.planName}</p>
                        <p className="text-xs text-gray-500">
                          {payment.gateway} • {payment.reference.slice(0, 12)}...
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm">
                        {formatCurrency(payment.amount, payment.currency)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {payment.createdAt?.toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Available Plans */}
        <Card>
          <CardHeader>
            <CardTitle className="text-[#2C3E2D]">All Plans</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              {SUBSCRIPTION_PLANS.map((plan) => {
                const isCurrent = subscription?.plan === plan.id;
                const ngnPrice = planPrices[plan.id] || plan.priceUSD * 1500;
                return (
                  <div 
                    key={plan.id} 
                    className={`border rounded-lg p-4 ${
                      isCurrent ? 'border-[#97A97C] bg-[#97A97C]/5' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-[#2C3E2D]">{plan.name}</span>
                      {isCurrent && <Badge className="bg-[#97A97C] text-white text-[10px]">Current</Badge>}
                    </div>
                    <p className="text-xs text-gray-500 mb-3">{plan.description}</p>
                    <p className="text-lg font-bold text-[#2C3E2D] mb-2">
                      ₦{Math.round(ngnPrice).toLocaleString()}
                      <span className="text-xs font-normal text-gray-500">/3mo</span>
                    </p>
                    <ul className="space-y-1 mb-3">
                      {plan.features.slice(0, 3).map((f, i) => (
                        <li key={i} className="text-xs text-gray-600 flex items-start gap-1">
                          <Check className="w-3 h-3 text-[#97A97C] shrink-0 mt-0.5" />
                          {f}
                        </li>
                      ))}
                      {plan.features.length > 3 && (
                        <li className="text-xs text-gray-400">+{plan.features.length - 3} more</li>
                      )}
                    </ul>
                    {!isCurrent && (
                      <Link href={`/subscription?plan=${plan.id}`}>
                        <Button variant="outline" size="sm" className="w-full text-xs">
                          {subscription && isActive ? 'Switch' : 'Select'}
                        </Button>
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cancel Confirmation Dialog */}
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-[#2C3E2D] mb-2">Cancel Subscription?</h2>
            <p className="text-gray-600 mb-6">
              You will continue to have access until <strong>{formatDate(subscription?.expiresAt)}</strong>. 
              After that, your account will revert to the free plan.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowCancelConfirm(false)}
                className="flex-1"
                disabled={cancelling}
              >
                Keep Subscription
              </Button>
              <Button
                onClick={handleCancel}
                disabled={cancelling}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                {cancelling ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Yes, Cancel'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}