'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { getSubscriptionStatus } from '@/lib/payments';
import { 
  SUBSCRIPTION_PLANS, 
  PaymentGateway
} from '@/lib/payments';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Check, 
  Loader2, 
  Globe, 
  CreditCard, 
  Zap, 
  Crown, 
  Shield,
  ArrowLeft,
  ArrowRight,
  Heart,
  Users,
  Sparkles,
  Leaf,
  MessageSquare,
  Calendar,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

export default function SubscriptionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [selectedGateway, setSelectedGateway] = useState<PaymentGateway>('paystack');
  const [processing, setProcessing] = useState(false);
  const [currentSub, setCurrentSub] = useState<any>(null);
  const [checkingSub, setCheckingSub] = useState(true);
  const [showPractitionerSection, setShowPractitionerSection] = useState(false);

  const canceled = searchParams.get('canceled') === 'true';
  const verified = searchParams.get('verified') === 'true';

  useEffect(() => {
    if (canceled) {
      toast.error('Payment was canceled. You can try again.');
    }
    if (verified) {
      toast.success('Payment successful! Your subscription is now active for 3 months.');
    }
  }, [canceled, verified]);

  useEffect(() => {
    const loadSub = async () => {
      if (!user) {
        setCheckingSub(false);
        return;
      }
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

  // Auto-suggest gateway based on timezone
  useEffect(() => {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const africanTimezones = ['Africa/Lagos', 'Africa/Accra', 'Africa/Nairobi', 'Africa/Johannesburg', 'Africa/Abidjan'];
    if (africanTimezones.some(tz => timezone.includes(tz))) {
      setSelectedGateway('paystack');
    } else {
      setSelectedGateway('flutterwave');
    }
  }, []);

  const handleSubscribe = async (planId: string) => {
    console.log('[Subscribe] Clicked plan:', planId);
    
    if (!user) {
      toast.error('Please sign in first');
      router.push('/login?redirect=/subscription');
      return;
    }

    if (!user.email) {
      toast.error('Your account is missing an email. Please update your profile.');
      return;
    }

    setSelectedPlan(planId);
    setProcessing(true);

    try {
      const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId);
      if (!plan) throw new Error('Plan not found');

      const payload = {
        email: user.email,
        userId: user.uid,
        planId,
        gateway: selectedGateway,
        callbackUrl: `${window.location.origin}/subscription`
      };

      console.log('[Subscribe] Initiating payment:', payload);

      const response = await fetch('/api/payments/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      // Check if response is actually JSON before parsing
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('[Subscribe] Non-JSON response:', text.slice(0, 500));
        throw new Error('Server returned an error. Please try again.');
      }

      const data = await response.json();
      console.log('[Subscribe] Response:', data);

      if (!data.success) {
        throw new Error(data.error || 'Payment initiation failed');
      }

      if (!data.authorizationUrl) {
        throw new Error('No payment URL returned from gateway');
      }

      // Redirect to payment gateway
      window.location.href = data.authorizationUrl;
    } catch (error: any) {
      console.error('[Subscribe] Error:', error);
      toast.error(error.message || 'Failed to initiate payment');
      setProcessing(false);
      setSelectedPlan(null);
    }
  };

  if (authLoading || checkingSub) {
    return (
      <div className="min-h-screen bg-[#F5F5F0] flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-[#97A97C] animate-spin" />
      </div>
    );
  }

  const isActive = currentSub?.status === 'active';
  const activePlanId = currentSub?.plan;

  return (
    <div className="min-h-screen bg-[#F5F5F0]">
      {/* ─── Hero ─── */}
      <div className="bg-[#2C3E2D] text-white py-16 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Choose Your Path to Wellness</h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Access traditional African healing wisdom. Connect with verified practitioners. 
            Join a community on the journey to natural wellness.
          </p>
          <p className="text-[#97A97C] mt-3 font-medium">
            <Calendar className="w-4 h-4 inline mr-1" />
            All plans bill every 3 months — enough time to heal
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* ─── Current Subscription Banner ─── */}
        {isActive && (
          <Card className="mb-8 border-green-200 bg-green-50">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Check className="w-6 h-6 text-green-600" />
                <div>
                  <h3 className="font-bold text-green-900">
                    You have an active {currentSub.planName} subscription
                  </h3>
                  <p className="text-sm text-green-700">
                    Paid via {currentSub.gateway} • Valid until {currentSub.expiresAt?.toDate?.().toLocaleDateString?.() || '3 months from start'}
                  </p>
                </div>
                <Link href="/subscription/manage" className="ml-auto">
                  <Button variant="outline" size="sm" className="border-green-600 text-green-700">
                    Manage
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ─── Gateway Selector ─── */}
        <div className="flex justify-center mb-10">
          <div className="bg-white rounded-lg p-1 shadow-sm border inline-flex">
            <button
              type="button"
              onClick={() => setSelectedGateway('paystack')}
              className={`px-6 py-3 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                selectedGateway === 'paystack'
                  ? 'bg-[#97A97C] text-white shadow'
                  : 'text-gray-600 hover:text-[#2C3E2D]'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              Paystack (NGN)
              <Badge variant="outline" className="text-[10px] ml-1 bg-white/20">Africa</Badge>
            </button>
            <button
              type="button"
              onClick={() => setSelectedGateway('flutterwave')}
              className={`px-6 py-3 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                selectedGateway === 'flutterwave'
                  ? 'bg-[#97A97C] text-white shadow'
                  : 'text-gray-600 hover:text-[#2C3E2D]'
              }`}
            >
              <Globe className="w-4 h-4" />
              Flutterwave (USD)
              <Badge variant="outline" className="text-[10px] ml-1 bg-white/20">Global</Badge>
            </button>
          </div>
        </div>

        {/* ─── Plans ─── */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {SUBSCRIPTION_PLANS.map((plan) => {
            const price = selectedGateway === 'paystack' ? plan.priceNGN : plan.priceUSD;
            const currency = selectedGateway === 'paystack' ? '₦' : '$';
            const isSelected = selectedPlan === plan.id;
            const isCurrentPlan = activePlanId === plan.id;
            const isButtonDisabled = processing || (isActive && isCurrentPlan);

            return (
              <Card 
                key={plan.id}
                className={`relative transition-all hover:shadow-xl ${
                  plan.popular ? 'border-[#97A97C] border-2 shadow-lg md:scale-105' : 'border-gray-200'
                } ${isSelected ? 'ring-2 ring-[#97A97C]' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="bg-[#B8860B] text-white px-4 py-1">
                      <Zap className="w-3 h-3 mr-1" />
                      Most Popular
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-2xl font-bold text-[#2C3E2D]">
                    {plan.name}
                  </CardTitle>
                  <p className="text-sm text-gray-500 mt-1">{plan.description}</p>
                </CardHeader>

                <CardContent className="text-center pb-6">
                  <div className="mb-2">
                    <span className="text-4xl font-bold text-[#2C3E2D]">
                      {currency}{price.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mb-6">
                    Every 3 months
                  </p>

                  <ul className="space-y-3 text-left mb-8">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-sm">
                        <Check className="w-5 h-5 text-[#97A97C] shrink-0 mt-0.5" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {!user ? (
                    <Button
                      type="button"
                      onClick={() => router.push('/login?redirect=/subscription')}
                      className={`w-full h-12 text-base ${
                        plan.popular
                          ? 'bg-[#97A97C] hover:bg-[#7A8A63] text-white'
                          : 'bg-[#2C3E2D] hover:bg-[#3d5238] text-white'
                      }`}
                    >
                      Sign In to Subscribe
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      onClick={() => handleSubscribe(plan.id)}
                      disabled={isButtonDisabled}
                      className={`w-full h-12 text-base ${
                        plan.popular
                          ? 'bg-[#97A97C] hover:bg-[#7A8A63] text-white'
                          : 'bg-[#2C3E2D] hover:bg-[#3d5238] text-white'
                      }`}
                    >
                      {processing && isSelected ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : isActive && isCurrentPlan ? (
                        <>
                          <Check className="w-5 h-5 mr-2" />
                          Current Plan
                        </>
                      ) : isActive ? (
                        <>
                          <ArrowRight className="w-5 h-5 mr-2" />
                          Switch to {plan.name}
                        </>
                      ) : (
                        <>
                          <Crown className="w-5 h-5 mr-2" />
                          Subscribe Now
                        </>
                      )}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* ─── For Practitioners ─── */}
        <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 mb-16">
          <div className="md:flex items-center gap-12">
            <div className="md:w-1/2 mb-8 md:mb-0">
              <h2 className="text-3xl font-bold text-[#2C3E2D] mb-4">
                Are You a Traditional Healer?
              </h2>
              <p className="text-gray-700 mb-6 leading-relaxed">
                Join our network of verified African traditional medicine practitioners. 
                Offer consultations, share your wisdom, and reach patients across the continent and diaspora.
              </p>
              <ul className="space-y-3 mb-6">
                {[
                  'Set your own consultation fees',
                  'We handle scheduling and payments (15% platform fee)',
                  'Sell your herbal preparations directly to patients',
                  'Build your reputation with reviews'
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-[#97A97C]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Link 
                href="/practitioners/apply"
                className="inline-block bg-[#2C3E2D] text-white px-8 py-3 rounded-lg font-bold hover:bg-[#3d523e] transition-colors"
              >
                Apply as Practitioner
              </Link>
            </div>
            <div className="md:w-1/2">
              <div className="bg-[#F5F5F0] p-6 rounded-lg">
                <h3 className="font-bold text-[#2C3E2D] mb-4">How Practitioner Payments Work</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b">
                    <span className="text-gray-600">Patient pays</span>
                    <span className="font-bold">$25.00</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b">
                    <span className="text-gray-600">Platform fee (15%)</span>
                    <span className="text-red-600">-$3.75</span>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-gray-600 font-semibold">You receive</span>
                    <span className="text-[#97A97C] font-bold text-lg">$21.25</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-4">
                  *Medicine sales: You keep 85% of product sales. We handle payment processing.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ─── FAQ ─── */}
        <div className="max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl font-bold text-center text-[#2C3E2D] mb-8">Common Questions</h2>
          <div className="space-y-4">
            {[
              {
                q: 'Why 3 months?',
                a: 'Traditional healing takes time. A 3-month subscription gives you enough time to work with a practitioner, follow a protocol, and see real results before deciding to renew.'
              },
              {
                q: 'Can I switch plans?',
                a: 'Yes. You can upgrade anytime — the new plan takes effect immediately. Downgrades apply at your next renewal.'
              },
              {
                q: 'Is my payment information secure?',
                a: 'Absolutely. We never store your card details. All payments are processed securely through Paystack and Flutterwave with PCI-DSS compliance.'
              },
              {
                q: 'Can I pay from outside Africa?',
                a: 'Yes! Select "Flutterwave (USD)" to pay with any international Visa, Mastercard, or American Express card from anywhere in the world.'
              },
              {
                q: 'How do I cancel?',
                a: 'You can cancel anytime from your subscription management page. You will continue to have access until the end of your current 3-month period.'
              },
              {
                q: 'Are the practitioners medically certified?',
                a: 'Our practitioners are verified traditional healers with documented experience. "Verified" means we have checked their credentials and background. They are not necessarily Western medical doctors unless specified.'
              }
            ].map((faq, idx) => (
              <div key={idx} className="bg-white rounded-lg shadow p-6">
                <h3 className="font-bold text-[#2C3E2D] mb-2">{faq.q}</h3>
                <p className="text-gray-600">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ─── Trust Badges ─── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { icon: <Shield className="w-8 h-8 text-[#97A97C] mx-auto mb-2" />, label: 'Secure Payments' },
            { icon: <Check className="w-8 h-8 text-[#97A97C] mx-auto mb-2" />, label: 'Verified Healers' },
            { icon: <MessageSquare className="w-8 h-8 text-[#97A97C] mx-auto mb-2" />, label: '24/7 Support' },
            { icon: <Globe className="w-8 h-8 text-[#97A97C] mx-auto mb-2" />, label: 'African Owned' }
          ].map((badge, i) => (
            <div key={i}>
              {badge.icon}
              <p className="text-sm font-semibold text-[#2C3E2D]">{badge.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}