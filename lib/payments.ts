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
  limit
} from 'firebase/firestore';
import { getExchangeRate, convertUSDtoNGN } from './exchange-rate';

/* ─────────────── Types ─────────────── */

export interface PaymentPlan {
  id: string;
  name: string;
  description: string;
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
    description: 'Start your healing journey',
    priceUSD: 9,
    interval: 'quarterly',
    consultationsPerMonth: 0,
    plantIdsPerMonth: 5,
    features: [
      'Browse all herbs and remedies',
      'AI-powered symptom search',
      'Save up to 10 favorite herbs',
      'Community forum access',
      'Basic plant identification (5/month)'
    ]
  },
  {
    id: 'premium',
    name: 'Premium',
    description: 'Full access + practitioner support',
    priceUSD: 24,
    interval: 'quarterly',
    consultationsPerMonth: 2,
    plantIdsPerMonth: 20,
    popular: true,
    features: [
      'Everything in Basic',
      'Unlimited herb saves',
      '2 practitioner consultations/month (INCLUDED)',
      'Plant identification (20/month)',
      'Personalized wellness protocols',
      'Priority support',
      'Direct chat with practitioners'
    ]
  },
  {
    id: 'healer',
    name: 'Healer',
    description: 'Unlimited access for families',
    priceUSD: 54,
    interval: 'quarterly',
    consultationsPerMonth: 999, // unlimited
    plantIdsPerMonth: 999, // unlimited
    familyMembers: 3,
    features: [
      'Everything in Premium',
      'Unlimited consultations (INCLUDED)',
      'Unlimited plant identifications',
      'Quarterly wellness report',
      'Family sharing (up to 3 members)',
      'Early access to new features',
      'Exclusive practitioner webinars'
    ]
  }
];

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
  
  const batch = db.batch();
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