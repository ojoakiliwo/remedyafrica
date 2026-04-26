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
  AlertCircle
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

  const canceled = searchParams.get('canceled') === 'true';
  const verified = searchParams.get('verified') === 'true';
  const preselectedPlan = searchParams.get('plan');

  useEffect(() => {
    if (canceled) {
      toast.error('Payment was canceled. You can try again.');
    }
    if (verified) {
      toast.success('Payment successful! Your subscription is now active.');
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
      <div className="min-h-screen bg-[#F5F5DC] flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-[#97A97C] animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#F5F5DC] flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <Shield className="w-16 h-16 text-[#97A97C] mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-[#2C3E2D] mb-2">Subscribe to RemedyAfrica</h1>
            <p className="text-gray-600 mb-6">Sign in to choose a plan and unlock premium features.</p>
            <Button 
              onClick={() => router.push('/login?redirect=/subscription')}
              className="w-full bg-[#97A97C] hover:bg-[#7A8A63]"
            >
              Sign In to Continue
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isActive = currentSub?.status === 'active';
  const activePlanId = currentSub?.plan;

  return (
    <div className="min-h-screen bg-[#F5F5DC]">
      {/* Header */}
      <div className="bg-[#2C3E2D] text-[#F5F5DC] py-12">
        <div className="max-w-6xl mx-auto px-4">
          <Link href="/" className="inline-flex items-center text-[#97A97C] hover:text-white mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
          <h1 className="text-4xl font-bold mb-3">Choose Your Plan</h1>
          <p className="text-[#97A97C] text-lg">
            Unlock premium herbal remedies and practitioner consultations
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Current Subscription Banner */}
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
                    Paid via {currentSub.gateway} • Renews {currentSub.expiresAt?.toDate?.().toLocaleDateString?.() || 'automatically'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Gateway Selector */}
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
              <Badge variant="outline" className="text-[10px] ml-1">Africa</Badge>
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
              <Badge variant="outline" className="text-[10px] ml-1">Global</Badge>
            </button>
          </div>
        </div>

        {/* Plans */}
        <div className="grid md:grid-cols-3 gap-8">
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
                  plan.popular ? 'border-[#97A97C] border-2 shadow-lg scale-105' : 'border-gray-200'
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
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-[#2C3E2D]">
                      {currency}{price.toLocaleString()}
                    </span>
                    <span className="text-gray-500">/{plan.interval}</span>
                  </div>

                  <ul className="space-y-3 text-left mb-8">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-sm">
                        <Check className="w-5 h-5 text-[#97A97C] shrink-0 mt-0.5" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>

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
                    ) : (
                      <>
                        <Crown className="w-5 h-5 mr-2" />
                        {isActive ? 'Switch to ' + plan.name : 'Subscribe Now'}
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Trust badges */}
        <div className="mt-12 flex flex-wrap justify-center gap-6 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#97A97C]" />
            Secure SSL Encryption
          </div>
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-[#97A97C]" />
            Visa, Mastercard, Amex
          </div>
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-[#97A97C]" />
            150+ Countries Supported
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-16 max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-[#2C3E2D] text-center mb-8">Common Questions</h2>
          <div className="space-y-4">
            {[
              {
                q: 'Can I switch plans later?',
                a: 'Yes, you can upgrade or downgrade your plan at any time. Changes take effect on your next billing cycle.'
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
                a: 'You can cancel anytime from your dashboard. You will continue to have access until the end of your current billing period.'
              }
            ].map((faq, idx) => (
              <div key={idx} className="bg-white rounded-lg p-4 border border-gray-100">
                <h3 className="font-semibold text-[#2C3E2D] mb-1">{faq.q}</h3>
                <p className="text-sm text-gray-600">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}