import { createHmac } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { getPlanById } from '@/lib/payments/plans';
import { readMeta } from '@/lib/payments/logic';
import { activatePaidSubscription } from '@/lib/payments/server';
import { verifyFlutterwaveTransaction, verifyPaystackTransaction } from '@/lib/payments/gateways';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const paystackSig = request.headers.get('x-paystack-signature');
  const flutterwaveHash = request.headers.get('verif-hash');

  try {
    if (paystackSig) return await handlePaystack(rawBody, paystackSig);
    if (flutterwaveHash) return await handleFlutterwave(rawBody, flutterwaveHash);
    return NextResponse.json({ error: 'Unknown gateway' }, { status: 400 });
  } catch (error: any) {
    console.error('[Webhook] error', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

async function handlePaystack(rawBody: string, signature: string) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) return NextResponse.json({ error: 'Not configured' }, { status: 500 });

  const hash = createHmac('sha512', secret).update(rawBody).digest('hex');
  if (hash !== signature) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const event = JSON.parse(rawBody);
  if (event.event === 'charge.success') {
    await fulfillPaystack(event.data);
  } else if (event.event === 'subscription.disable') {
    await markGatewayCancelled(event.data?.customer?.email, 'Gateway cancellation');
  }
  return NextResponse.json({ received: true });
}

async function fulfillPaystack(data: any) {
  const reference = String(data?.reference || '');
  if (!reference) return;

  const verified = await verifyPaystackTransaction(reference);
  if (!verified.ok || verified.data?.status !== 'success') {
    console.warn('[Webhook] Paystack charge not verified', reference);
    return;
  }

  const payload = verified.data;
  const meta = readMeta(payload.metadata || data.metadata || {});
  const pending = await loadPending(reference);
  const userId = meta.userId || pending?.userId;
  const plan = getPlanById(String(meta.planId || pending?.planId || ''));
  if (!userId || !plan) {
    console.warn('[Webhook] Paystack missing user/plan', reference);
    return;
  }

  await activatePaidSubscription({
    userId,
    planId: plan.id,
    planName: plan.name,
    gateway: 'paystack',
    reference,
    amount: Number(payload.amount) / 100,
    currency: 'NGN',
    amountMinor: Number(payload.amount),
    paidAt: payload.paid_at,
    channel: payload.channel,
    authorization: payload.authorization || null,
    event: 'webhook.paystack.charge.success',
  });
}

async function handleFlutterwave(rawBody: string, signature: string) {
  const secretHash = process.env.FLUTTERWAVE_SECRET_HASH;
  if (!secretHash) return NextResponse.json({ error: 'Not configured' }, { status: 500 });
  if (signature !== secretHash) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const event = JSON.parse(rawBody);
  if (event.event === 'charge.completed' || event.data?.status === 'successful') {
    await fulfillFlutterwave(event.data);
  } else if (event.event === 'subscription.cancelled') {
    await markGatewayCancelled(event.data?.customer?.email, 'Gateway cancellation');
  }
  return NextResponse.json({ received: true });
}

async function fulfillFlutterwave(data: any) {
  const transactionId = String(data?.id || '');
  if (!transactionId) return;
  const verified = await verifyFlutterwaveTransaction(transactionId);
  if (!verified.ok || verified.data?.status !== 'successful') {
    console.warn('[Webhook] Flutterwave charge not verified', transactionId);
    return;
  }

  const payload = verified.data;
  const reference = String(payload.tx_ref || data.tx_ref || '');
  const meta = readMeta(payload.meta || data.meta || {});
  const pending = reference ? await loadPending(reference) : null;
  const userId = meta.userId || pending?.userId;
  const plan = getPlanById(String(meta.planId || pending?.planId || ''));
  if (!userId || !plan || !reference) {
    console.warn('[Webhook] Flutterwave missing user/plan', transactionId);
    return;
  }

  await activatePaidSubscription({
    userId,
    planId: plan.id,
    planName: plan.name,
    gateway: 'flutterwave',
    reference,
    amount: Number(payload.amount),
    currency: 'USD',
    amountMinor: Math.round(Number(payload.amount) * 100),
    paidAt: payload.created_at,
    transactionId: payload.id,
    event: 'webhook.flutterwave.charge.completed',
  });
}

async function loadPending(reference: string) {
  const snap = await getAdminDb().doc(`payments/${reference}`).get();
  return snap.exists ? snap.data() : null;
}

async function markGatewayCancelled(email: string | undefined, reason: string) {
  if (!email) return;
  const db = getAdminDb();
  const users = await db.collection('users').where('email', '==', email).limit(1).get();
  if (users.empty) return;
  const userId = users.docs[0].id;
  await db.doc(`users/${userId}/subscription/current`).set({
    cancelAtPeriodEnd: true,
    cancelledAt: FieldValue.serverTimestamp(),
    cancelReason: reason,
    cancelMethod: 'gateway',
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });
}
