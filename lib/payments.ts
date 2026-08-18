// lib/payments.ts

import { db } from './firebase/client';
import {
  doc,
  setDoc,
  serverTimestamp,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  writeBatch
} from 'firebase/firestore';
import { getExchangeRate, convertUSDtoNGN } from './exchange-rate';

/* ─────────────── Types ─────────────── */

export interface PaymentPlan {
  id: string;
  name: string;
  description: string;
  /** One-line offer. This is what the card is actually selling. */
  headline: string;
  /** Who should feel this plan is “for me”. */
  whoItsFor: string;
  cta: string;
  priceUSD: number; // Base price in USD — NGN calculated live
  interval: 'quarterly';
  features: string[];
  popular?: boolean;
  consultationsPerMonth: number;
  plantIdsPerMonth: number;
  familyMembers?: number;
}

export type PaymentGateway = 'paystack' | 'flutterwave';

export interface SubscriptionRecord {
  plan: string;
  planName: string;
  status: 'active' | 'cancelled' | 'past_due' | 'pending';
  gateway: PaymentGateway;
  reference: string;
  amount: number;
  currency: string;
  interval: string;
  startedAt: any;
  expiresAt: any;
  lastRenewedAt?: any;
  cancelledAt?: any;
  cancelReason?: string;
  cancelMethod?: string;
  paystackSubscriptionCode?: string;
  paystackEmailToken?: string;
  paystackPlanCode?: string;
  flutterwaveSubscriptionId?: string;
  paystackData?: any;
  flutterwaveData?: any;
}

/* ─────────────── Plans — Quarterly (3 months) ───────────────
 *
 * NO per-consultation fees. Consultations are INCLUDED in subscription.
 * Practitioners are paid monthly based on number of users they served.
 *
 * Base prices in USD. NGN calculated at live exchange rate.
 */

export const SUBSCRIPTION_PLANS: PaymentPlan[] = [
  {
    id: 'basic',
    name: 'Basic',
    description: 'For when you already know the plants — and just need a second look.',
    headline: '5 photo identifications each month',
    whoItsFor: 'You cook with these plants. You want the camera to confirm what you picked.',
    cta: 'Identify plants',
    priceUSD: 9,
    interval: 'quarterly',
    consultationsPerMonth: 0,
    plantIdsPerMonth: 5,
    features: [
      'Photograph a leaf or market bundle — 5 identifications a month',
      'Keep a kitchen list of 10 plants',
      'Ask and answer in the community',
      'Herb library and safety notes stay free for everyone'
    ]
  },
  {
    id: 'premium',
    name: 'Premium',
    description: 'A healer who knows your plants — not an app that guesses.',
    headline: '2 private healer sessions every month',
    whoItsFor: 'You want a person to listen, then tell you what to do at home.',
    cta: 'Begin 3 months of care',
    priceUSD: 24,
    interval: 'quarterly',
    consultationsPerMonth: 2,
    plantIdsPerMonth: 20,
    popular: true,
    features: [
      'Two included consultations every month — no extra sitting fee',
      'Message a practitioner between sessions',
      'A protocol written for your home, not a generic list',
      '20 plant identifications a month',
      'Unlimited saved plants',
      'Community included'
    ]
  },
  {
    id: 'healer',
    name: 'Household',
    description: 'One roof. One plan. The family does not take turns for care.',
    headline: 'Unlimited sessions for the home',
    whoItsFor: 'Parents, elders, and children sharing one compound.',
    cta: 'Cover the family',
    priceUSD: 54,
    interval: 'quarterly',
    consultationsPerMonth: 999, // unlimited
    plantIdsPerMonth: 999, // unlimited
    familyMembers: 3,
    features: [
      'Unlimited consultations, included',
      'Share with two other people under your roof',
      'Unlimited plant identifications',
      'A quarterly note on how the household is using the plants',
      'Everything in Premium'
    ]
  }
];

/** Maps a paid plan id onto the user document field used by the app. */
export function subscriptionTierFromPlanId(planId: string): string {
  if (planId === 'basic' || planId === 'premium' || planId === 'healer') {
    return planId;
  }
  if (planId === 'premium_pro') return 'healer';
  return 'premium';
}

export async function markUserSubscriptionTier(userId: string, planId: string): Promise<void> {
  await setDoc(
    doc(db, 'users', userId),
    {
      subscriptionTier: subscriptionTierFromPlanId(planId),
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );
}

/* ─────────────── Dynamic Pricing ─────────────── */

export async function getPlanPriceNGN(planId: string): Promise<number> {
  const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId);
  if (!plan) throw new Error('Plan not found');

  const rate = await getExchangeRate();
  return convertUSDtoNGN(plan.priceUSD, rate);
}

export function getPlanById(planId: string): PaymentPlan | undefined {
  return SUBSCRIPTION_PLANS.find((p) => p.id === planId);
}

export function getNextPlan(currentPlanId: string): PaymentPlan | null {
  const plans = SUBSCRIPTION_PLANS;
  const currentIndex = plans.findIndex((p) => p.id === currentPlanId);
  if (currentIndex >= 0 && currentIndex < plans.length - 1) {
    return plans[currentIndex + 1];
  }
  return null;
}

export function suggestGateway(countryCode?: string): PaymentGateway {
  const africanCountries = [
    'NG', 'GH', 'KE', 'ZA', 'CI', 'UG', 'TZ', 'RW', 'SN', 'CM',
    'ET', 'EG', 'MA', 'DZ', 'TN', 'LY', 'SD', 'SS', 'ML', 'BF',
    'NE', 'TD', 'CF', 'CD', 'CG', 'GA', 'GQ', 'ST', 'AO', 'ZM',
    'ZW', 'MW', 'MZ', 'MG', 'MU', 'SC', 'KM', 'DJ', 'ER', 'SO',
    'BJ', 'TG', 'SL', 'LR', 'GW', 'GM', 'CV', 'BI', 'RW', 'UG'
  ];
  if (countryCode && africanCountries.includes(countryCode.toUpperCase())) {
    return 'paystack';
  }
  return 'flutterwave';
}

/* ─────────────── Firestore Operations ─────────────── */

export async function createSubscriptionRecord(
  userId: string,
  plan: PaymentPlan,
  gateway: PaymentGateway,
  reference: string,
  status: 'pending' | 'active' | 'failed',
  ngnAmount: number
) {
  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + 3);

  await setDoc(doc(db, 'users', userId, 'subscription', 'current'), {
    plan: plan.id,
    planName: plan.name,
    status,
    gateway,
    reference,
    amount: gateway === 'paystack' ? ngnAmount : plan.priceUSD,
    currency: gateway === 'paystack' ? 'NGN' : 'USD',
    interval: plan.interval,
    consultationsPerMonth: plan.consultationsPerMonth,
    plantIdsPerMonth: plan.plantIdsPerMonth,
    consultationsUsedThisMonth: 0,
    plantIdsUsedThisMonth: 0,
    startedAt: serverTimestamp(),
    expiresAt: expiresAt,
    updatedAt: serverTimestamp()
  });

  await setDoc(doc(db, 'payments', reference), {
    userId,
    planId: plan.id,
    planName: plan.name,
    gateway,
    reference,
    amount: gateway === 'paystack' ? ngnAmount : plan.priceUSD,
    currency: gateway === 'paystack' ? 'NGN' : 'USD',
    status,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
}

export async function getSubscriptionStatus(userId: string) {
  const subDoc = await getDoc(doc(db, 'users', userId, 'subscription', 'current'));
  if (!subDoc.exists()) return null;
  return subDoc.data();
}

export async function getPaymentHistory(userId: string, limitCount: number = 10) {
  const paymentsQuery = query(
    collection(db, 'payments'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );

  const snapshot = await getDocs(paymentsQuery);
  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
    createdAt: docSnap.data().createdAt?.toDate?.()
  }));
}

export async function cancelSubscription(
  userId: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const response = await fetch('/api/payments/cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    });

    const data = await response.json();
    return data;
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/* ─────────────── Consultation Tracking ─────────────── */

export async function canUserConsult(userId: string): Promise<{ allowed: boolean; remaining: number; error?: string }> {
  const sub = await getSubscriptionStatus(userId);
  if (!sub || sub.status !== 'active') {
    return { allowed: false, remaining: 0, error: 'No active subscription' };
  }

  const plan = getPlanById(sub.plan);
  if (!plan) {
    return { allowed: false, remaining: 0, error: 'Invalid plan' };
  }

  // Unlimited
  if (plan.consultationsPerMonth >= 999) {
    return { allowed: true, remaining: 999 };
  }

  const used = sub.consultationsUsedThisMonth || 0;
  const remaining = plan.consultationsPerMonth - used;

  if (remaining <= 0) {
    return { allowed: false, remaining: 0, error: 'Monthly consultation limit reached' };
  }

  return { allowed: true, remaining };
}

export async function incrementConsultationUsage(userId: string): Promise<void> {
  const subRef = doc(db, 'users', userId, 'subscription', 'current');
  await setDoc(subRef, {
    consultationsUsedThisMonth: (await getDoc(subRef)).data()?.consultationsUsedThisMonth + 1 || 1,
    updatedAt: serverTimestamp()
  }, { merge: true });
}

export async function resetMonthlyUsage(): Promise<void> {
  // Call this via a scheduled function (Vercel Cron or Firebase Scheduled Function)
  const subsQuery = query(collection(db, 'users'), where('subscription.status', '==', 'active'));
  const snapshot = await getDocs(subsQuery);

  const batch = writeBatch(db);
  snapshot.docs.forEach(docSnap => {
    const subRef = doc(db, 'users', docSnap.id, 'subscription', 'current');
    batch.update(subRef, {
      consultationsUsedThisMonth: 0,
      plantIdsUsedThisMonth: 0,
      updatedAt: serverTimestamp()
    });
  });

  await batch.commit();
}