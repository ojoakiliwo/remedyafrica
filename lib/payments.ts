import { db, auth } from './firebase/client';
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
} from 'firebase/firestore';
import { hasPaidAccess } from './payments/logic';
import { SUBSCRIPTION_PLANS, getPlanById, getNextPlan, type PaymentPlan } from './payments/plans';

export type { PaymentGateway } from './payments/logic';
export type { PaymentPlan };
export {
  formatMoney,
  monthlyEquivalent,
  suggestGatewayFromTimezone,
  BILLING_MONTHS,
} from './payments/logic';
export { SUBSCRIPTION_PLANS, getPlanById, getNextPlan };

export interface SubscriptionRecord {
  plan: string;
  planName: string;
  status: 'active' | 'cancelled' | 'past_due' | 'pending';
  gateway: string;
  reference: string;
  amount: number;
  currency: string;
  interval: string;
  startedAt: any;
  expiresAt: any;
  lastRenewedAt?: any;
  cancelledAt?: any;
  cancelAtPeriodEnd?: boolean;
  cancelReason?: string;
  cancelMethod?: string;
  consultationsPerMonth?: number;
  plantIdsPerMonth?: number;
  consultationsUsedThisMonth?: number;
  plantIdsUsedThisMonth?: number;
  paystackSubscriptionCode?: string;
  paystackEmailToken?: string;
  paystackPlanCode?: string;
  flutterwaveSubscriptionId?: string;
}

export async function getSubscriptionStatus(userId: string) {
  const subDoc = await getDoc(doc(db, 'users', userId, 'subscription', 'current'));
  if (!subDoc.exists()) return null;
  return subDoc.data() as SubscriptionRecord;
}

export function subscriptionIsLive(sub?: SubscriptionRecord | null) {
  return hasPaidAccess(sub);
}

async function authHeader(): Promise<HeadersInit> {
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error('Please sign in first');
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

export async function startCheckout(input: {
  planId: string;
  gateway: 'paystack' | 'flutterwave';
}) {
  const headers = await authHeader();
  const response = await fetch('/api/payments/initiate', {
    method: 'POST',
    headers,
    body: JSON.stringify(input),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.success) {
    throw new Error(data?.error || 'Could not start checkout');
  }
  return data as { success: true; authorizationUrl: string; reference: string; gateway: string };
}

export async function verifyCheckoutReturn(input: {
  reference?: string | null;
  txRef?: string | null;
  transactionId?: string | null;
  status?: string | null;
}) {
  const response = await fetch('/api/payments/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      reference: input.reference,
      tx_ref: input.txRef,
      transaction_id: input.transactionId,
      status: input.status,
    }),
  });
  const data = await response.json().catch(() => null);
  return data as {
    success: boolean;
    verified?: boolean;
    alreadyProcessed?: boolean;
    message?: string;
    error?: string;
    plan?: string;
    planName?: string;
    expiresAt?: string;
  };
}

export async function cancelSubscription(action: 'cancel' | 'resume' = 'cancel') {
  const headers = await authHeader();
  const response = await fetch('/api/payments/cancel', {
    method: 'POST',
    headers,
    body: JSON.stringify({ action }),
  });
  const data = await response.json().catch(() => null);
  return data as { success: boolean; message?: string; error?: string };
}

export async function getPaymentHistory(userId: string, limitCount: number = 10) {
  try {
    const paymentsQuery = query(
      collection(db, 'users', userId, 'payments'),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    const snapshot = await getDocs(paymentsQuery);
    return snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
      createdAt: (docSnap.data() as any).createdAt?.toDate?.() || null,
    }));
  } catch {
    const fallback = query(
      collection(db, 'payments'),
      where('userId', '==', userId),
      limit(limitCount)
    );
    const snapshot = await getDocs(fallback);
    return snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
      createdAt: (docSnap.data() as any).createdAt?.toDate?.() || null,
    }));
  }
}
