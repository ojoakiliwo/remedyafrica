import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebase/admin';
import { planToAccessTier } from '@/lib/auth/subscription';
import { getPlanById } from '@/lib/payments/plans';
import {
  alreadyProcessed,
  computePaidExpiry,
  isSamePlanRenewal,
  toJsDate,
  type PaymentGateway,
} from '@/lib/payments/logic';

export type ChargeResult = {
  userId: string;
  planId: string;
  planName: string;
  gateway: PaymentGateway;
  reference: string;
  amount: number;
  currency: 'NGN' | 'USD';
  amountMinor?: number;
  paidAt?: string;
  channel?: string;
  transactionId?: string | number;
  authorization?: Record<string, unknown> | null;
  event: string;
};

export async function writePendingPayment(input: {
  userId: string;
  email: string;
  planId: string;
  planName: string;
  gateway: PaymentGateway;
  reference: string;
  amount: number;
  currency: 'NGN' | 'USD';
  amountMinor: number;
}) {
  const db = getAdminDb();
  const payload = {
    ...input,
    status: 'pending' as const,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };
  await db.doc(`payments/${input.reference}`).set(payload, { merge: true });
  await db.doc(`users/${input.userId}/payments/${input.reference}`).set(payload, { merge: true });
}

export async function markPaymentFailed(reference: string, reason: string) {
  const db = getAdminDb();
  const snap = await db.doc(`payments/${reference}`).get();
  if (!snap.exists || alreadyProcessed(snap.data()?.status)) return;
  const userId = String(snap.data()?.userId || '');
  const patch = {
    status: 'failed',
    failureReason: reason,
    updatedAt: FieldValue.serverTimestamp(),
  };
  await db.doc(`payments/${reference}`).set(patch, { merge: true });
  if (userId) {
    await db.doc(`users/${userId}/payments/${reference}`).set(patch, { merge: true });
  }
}

export async function activatePaidSubscription(charge: ChargeResult) {
  const db = getAdminDb();
  const paymentRef = db.doc(`payments/${charge.reference}`);
  const userPayRef = db.doc(`users/${charge.userId}/payments/${charge.reference}`);
  const subRef = db.doc(`users/${charge.userId}/subscription/current`);
  const userRef = db.doc(`users/${charge.userId}`);

  const [paymentSnap, subSnap] = await Promise.all([paymentRef.get(), subRef.get()]);
  if (alreadyProcessed(paymentSnap.data()?.status)) {
    const existing = subSnap.data() || {};
    return {
      activated: false,
      alreadyProcessed: true,
      planId: String(existing.plan || charge.planId),
      planName: String(existing.planName || charge.planName),
      expiresAt: toJsDate(existing.expiresAt),
    };
  }

  const existing = subSnap.data() || {};
  const now = new Date();
  const existingExpiry = toJsDate(existing.expiresAt);
  const samePlanRenewal = isSamePlanRenewal({
    existingPlan: existing.plan,
    existingStatus: existing.status,
    existingExpiry,
    nextPlanId: charge.planId,
    now,
  });
  const expiresAt = computePaidExpiry({
    now,
    existingExpiry,
    samePlanRenewal,
  });
  const plan = getPlanById(charge.planId);
  const tier = planToAccessTier(charge.planId);
  const paymentDoc = {
    userId: charge.userId,
    planId: charge.planId,
    planName: charge.planName,
    gateway: charge.gateway,
    reference: charge.reference,
    transactionId: charge.transactionId || null,
    amount: charge.amount,
    currency: charge.currency,
    amountMinor: charge.amountMinor || null,
    status: 'successful',
    event: charge.event,
    channel: charge.channel || null,
    paidAt: charge.paidAt || null,
    verifiedAt: FieldValue.serverTimestamp(),
    createdAt: paymentSnap.data()?.createdAt || FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  const batch = db.batch();
  batch.set(subRef, {
    plan: charge.planId,
    planName: charge.planName,
    status: 'active',
    cancelAtPeriodEnd: false,
    cancelledAt: FieldValue.delete(),
    cancelReason: FieldValue.delete(),
    cancelMethod: FieldValue.delete(),
    gateway: charge.gateway,
    reference: charge.reference,
    amount: charge.amount,
    currency: charge.currency,
    interval: 'quarterly',
    consultationsPerMonth: plan?.consultationsPerMonth ?? 0,
    plantIdsPerMonth: plan?.plantIdsPerMonth ?? 0,
    consultationsUsedThisMonth: samePlanRenewal ? existing.consultationsUsedThisMonth || 0 : 0,
    plantIdsUsedThisMonth: samePlanRenewal ? existing.plantIdsUsedThisMonth || 0 : 0,
    startedAt: samePlanRenewal && existing.startedAt ? existing.startedAt : FieldValue.serverTimestamp(),
    expiresAt: Timestamp.fromDate(expiresAt),
    lastRenewedAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    paystackData: charge.gateway === 'paystack' ? {
      channel: charge.channel,
      paidAt: charge.paidAt,
      authorization: charge.authorization || null,
    } : existing.paystackData || null,
    flutterwaveData: charge.gateway === 'flutterwave' ? {
      transactionId: charge.transactionId || null,
      paidAt: charge.paidAt,
    } : existing.flutterwaveData || null,
  }, { merge: true });

  batch.set(userRef, {
    subscriptionTier: tier,
    subscriptionStatus: 'active',
    subscriptionPlan: charge.planId,
    subscriptionExpiresAt: Timestamp.fromDate(expiresAt),
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });

  batch.set(paymentRef, paymentDoc, { merge: true });
  batch.set(userPayRef, paymentDoc, { merge: true });
  await batch.commit();

  return {
    activated: true,
    alreadyProcessed: false,
    planId: charge.planId,
    planName: charge.planName,
    expiresAt,
    samePlanRenewal,
  };
}

export async function setCancelAtPeriodEnd(userId: string, cancel: boolean) {
  const db = getAdminDb();
  const subRef = db.doc(`users/${userId}/subscription/current`);
  const userRef = db.doc(`users/${userId}`);
  const snap = await subRef.get();
  if (!snap.exists) {
    return { ok: false as const, error: 'No subscription found' };
  }
  const sub = snap.data() || {};
  if (!hasLiveWindow(sub)) {
    return { ok: false as const, error: 'This plan has already ended' };
  }

  if (cancel) {
    await subRef.set({
      cancelAtPeriodEnd: true,
      cancelledAt: FieldValue.serverTimestamp(),
      cancelMethod: 'user_requested',
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
    return {
      ok: true as const,
      message: `Your care continues until ${formatExpiry(sub.expiresAt)}. After that it will not renew.`,
      expiresAt: toJsDate(sub.expiresAt),
    };
  }

  await subRef.set({
    status: 'active',
    cancelAtPeriodEnd: false,
    cancelledAt: FieldValue.delete(),
    cancelMethod: FieldValue.delete(),
    cancelReason: FieldValue.delete(),
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });
  await userRef.set({
    subscriptionStatus: 'active',
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });
  return {
    ok: true as const,
    message: 'Your plan will keep renewing at the end of this season.',
    expiresAt: toJsDate(sub.expiresAt),
  };
}

function hasLiveWindow(sub: Record<string, any>) {
  const expiresAt = toJsDate(sub.expiresAt);
  if (expiresAt && expiresAt.getTime() <= Date.now()) return false;
  return sub.status === 'active' || sub.status === 'cancelled' || sub.cancelAtPeriodEnd;
}

function formatExpiry(value: unknown) {
  const date = toJsDate(value);
  if (!date) return 'the end of this season';
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

export async function serializeCurrentSubscription(userId: string) {
  const db = getAdminDb();
  const [subSnap, historySnap] = await Promise.all([
    db.doc(`users/${userId}/subscription/current`).get(),
    db.collection(`users/${userId}/payments`).orderBy('createdAt', 'desc').limit(12).get().catch(async () => {
      const fallback = await db.collection('payments').where('userId', '==', userId).limit(12).get();
      return fallback;
    }),
  ]);

  const sub = subSnap.exists ? (subSnap.data() as Record<string, any>) : null;
  return {
    subscription: sub ? {
      plan: sub.plan || null,
      planName: sub.planName || null,
      status: sub.status || null,
      cancelAtPeriodEnd: Boolean(sub.cancelAtPeriodEnd),
      gateway: sub.gateway || null,
      reference: sub.reference || null,
      amount: sub.amount || 0,
      currency: sub.currency || 'NGN',
      interval: sub.interval || 'quarterly',
      consultationsPerMonth: sub.consultationsPerMonth || 0,
      plantIdsPerMonth: sub.plantIdsPerMonth || 0,
      startedAt: toIso(sub.startedAt),
      expiresAt: toIso(sub.expiresAt),
      cancelledAt: toIso(sub.cancelledAt),
      lastRenewedAt: toIso(sub.lastRenewedAt),
      updatedAt: toIso(sub.updatedAt),
    } : null,
    history: historySnap.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        planId: data.planId || null,
        planName: data.planName || null,
        gateway: data.gateway || null,
        reference: data.reference || docSnap.id,
        amount: data.amount || 0,
        currency: data.currency || 'NGN',
        status: data.status || null,
        createdAt: toIso(data.createdAt),
        verifiedAt: toIso(data.verifiedAt),
      };
    }),
  };
}

function toIso(value: unknown) {
  return toJsDate(value)?.toISOString() || null;
}
