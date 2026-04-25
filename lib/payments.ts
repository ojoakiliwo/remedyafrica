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

/* ─────────────── Types ─────────────── */

export interface PaymentPlan {
  id: string;
  name: string;
  description: string;
  priceNGN: number; // For Paystack (Nigerian/local)
  priceUSD: number; // For Flutterwave (International)
  interval: 'monthly' | 'yearly';
  features: string[];
  popular?: boolean;
}

export type PaymentGateway = 'paystack' | 'flutterwave';

export interface InitiatePaymentParams {
  userId: string;
  email: string;
  planId: string;
  gateway: PaymentGateway;
  callbackUrl: string;
}

export interface PaymentResponse {
  success: boolean;
  authorizationUrl?: string;
  reference?: string;
  txRef?: string;
  error?: string;
}

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

/* ─────────────── Plans ─────────────── */

export const SUBSCRIPTION_PLANS: PaymentPlan[] = [
  {
    id: 'basic',
    name: 'Basic',
    description: 'Essential access to herbal remedies',
    priceNGN: 5000,
    priceUSD: 5,
    interval: 'monthly',
    features: [
      'Browse all herbs',
      'AI symptom search',
      'Save up to 10 herbs',
      'Community forum access'
    ]
  },
  {
    id: 'premium',
    name: 'Premium',
    description: 'Full access + practitioner consultations',
    priceNGN: 15000,
    priceUSD: 15,
    interval: 'monthly',
    features: [
      'Everything in Basic',
      'Unlimited herb saves',
      '2 practitioner consultations/month',
      'Plant identification (20/month)',
      'Priority support'
    ],
    popular: true
  },
  {
    id: 'healer',
    name: 'Healer',
    description: 'Unlimited access for serious wellness',
    priceNGN: 40000,
    priceUSD: 40,
    interval: 'monthly',
    features: [
      'Everything in Premium',
      'Unlimited consultations',
      'Unlimited plant IDs',
      'Personal wellness report',
      'Early access to new features'
    ]
  }
];

/* ─────────────── Helpers ─────────────── */

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

/* ─────────────── Firestore Operations ─────────────── */

export async function createSubscriptionRecord(
  userId: string,
  plan: PaymentPlan,
  gateway: PaymentGateway,
  reference: string,
  status: 'pending' | 'active' | 'failed'
) {
  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + (plan.interval === 'yearly' ? 12 : 1));

  await setDoc(doc(db, 'users', userId, 'subscription', 'current'), {
    plan: plan.id,
    planName: plan.name,
    status,
    gateway,
    reference,
    amount: gateway === 'paystack' ? plan.priceNGN : plan.priceUSD,
    currency: gateway === 'paystack' ? 'NGN' : 'USD',
    interval: plan.interval,
    startedAt: serverTimestamp(),
    expiresAt: expiresAt,
    updatedAt: serverTimestamp()
  });

  // Also log to payments collection
  await setDoc(doc(db, 'payments', reference), {
    userId,
    planId: plan.id,
    planName: plan.name,
    gateway,
    reference,
    amount: gateway === 'paystack' ? plan.priceNGN : plan.priceUSD,
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

/* ─────────────── Client-side Actions ─────────────── */

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