import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';
import { getPlanById } from '@/lib/payments/plans';
import { verifyFlutterwaveTransaction, verifyPaystackTransaction } from '@/lib/payments/gateways';
import { amountMatches, publicAppUrl, readMeta } from '@/lib/payments/logic';
import { activatePaidSubscription, markPaymentFailed } from '@/lib/payments/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function redirectToSubscription(request: NextRequest, params: Record<string, string>) {
  const url = new URL(`${publicAppUrl(request.nextUrl.origin)}/subscription`);
  Object.entries(params).forEach(([key, value]) => {
    if (value) url.searchParams.set(key, value);
  });
  return NextResponse.redirect(url);
}

async function verifyCharge(input: {
  reference?: string | null;
  txRef?: string | null;
  transactionId?: string | null;
  status?: string | null;
}) {
  const cancelled = input.status === 'cancelled' || input.status === 'canceled' || input.status === 'failed';
  if (cancelled) {
    const reference = input.reference || input.txRef;
    if (reference) await markPaymentFailed(reference, `Payment ${input.status}`);
    return {
      success: false,
      verified: false,
      message: input.status === 'failed' ? 'Payment failed' : 'Payment was cancelled',
    };
  }

  if (input.transactionId) {
    return verifyFlutterwave(String(input.transactionId), input.txRef || undefined);
  }
  if (input.reference) {
    return verifyPaystack(String(input.reference));
  }
  return { success: false, verified: false, error: 'No payment reference found' };
}

async function verifyPaystack(reference: string) {
  const verified = await verifyPaystackTransaction(reference);
  if (!verified.ok) {
    return { success: false, verified: false, error: verified.error, reference };
  }

  const data = verified.data || {};
  if (data.status !== 'success') {
    await markPaymentFailed(reference, data.gateway_response || 'Payment not successful');
    return {
      success: false,
      verified: false,
      message: data.gateway_response || 'Payment not successful',
      reference,
    };
  }

  const meta = readMeta(data.metadata || {});
  const pending = await loadPending(reference);
  const userId = meta.userId || pending?.userId;
  const planId = meta.planId || pending?.planId;
  const plan = getPlanById(String(planId || ''));
  if (!userId || !plan) {
    return { success: false, verified: false, error: 'This payment is missing plan details', reference };
  }

  const paidKobo = Number(data.amount);
  const expectedMinor = Number(pending?.amountMinor || 0);
  if (expectedMinor && !amountMatches(paidKobo, expectedMinor, 100)) {
    console.error('[Verify] Paystack amount mismatch', { paidKobo, expectedMinor, reference });
    return { success: false, verified: false, error: 'Paid amount did not match this plan', reference };
  }

  const result = await activatePaidSubscription({
    userId,
    planId: plan.id,
    planName: plan.name,
    gateway: 'paystack',
    reference,
    amount: paidKobo / 100,
    currency: 'NGN',
    amountMinor: paidKobo,
    paidAt: data.paid_at,
    channel: data.channel,
    authorization: data.authorization || null,
    event: 'verify.paystack',
  });

  return {
    success: true,
    verified: true,
    alreadyProcessed: result.alreadyProcessed,
    reference,
    plan: result.planId,
    planName: result.planName,
    expiresAt: result.expiresAt?.toISOString() || null,
    message: result.alreadyProcessed
      ? 'This payment was already confirmed.'
      : `Your ${result.planName} season is now active.`,
  };
}

async function verifyFlutterwave(transactionId: string, txRef?: string) {
  const verified = await verifyFlutterwaveTransaction(transactionId);
  if (!verified.ok) {
    return { success: false, verified: false, error: verified.error, txRef };
  }

  const data = verified.data || {};
  const reference = String(txRef || data.tx_ref || '');
  if (data.status !== 'successful') {
    if (reference) await markPaymentFailed(reference, 'Payment not successful');
    return { success: false, verified: false, message: 'Payment not successful', txRef: reference };
  }

  const meta = readMeta(data.meta || {});
  const pending = reference ? await loadPending(reference) : null;
  const userId = meta.userId || pending?.userId;
  const planId = meta.planId || pending?.planId;
  const plan = getPlanById(String(planId || ''));
  if (!userId || !plan || !reference) {
    return { success: false, verified: false, error: 'This payment is missing plan details', txRef: reference };
  }

  const paid = Number(data.amount);
  const expected = Number(pending?.amount || plan.priceUSD);
  if (expected && Math.abs(paid - expected) > 1) {
    console.error('[Verify] Flutterwave amount mismatch', { paid, expected, reference });
    return { success: false, verified: false, error: 'Paid amount did not match this plan', txRef: reference };
  }

  const result = await activatePaidSubscription({
    userId,
    planId: plan.id,
    planName: plan.name,
    gateway: 'flutterwave',
    reference,
    amount: paid,
    currency: 'USD',
    amountMinor: Math.round(paid * 100),
    paidAt: data.created_at,
    transactionId: data.id,
    event: 'verify.flutterwave',
  });

  return {
    success: true,
    verified: true,
    alreadyProcessed: result.alreadyProcessed,
    reference,
    txRef: reference,
    transactionId,
    plan: result.planId,
    planName: result.planName,
    expiresAt: result.expiresAt?.toISOString() || null,
    message: result.alreadyProcessed
      ? 'This payment was already confirmed.'
      : `Your ${result.planName} season is now active.`,
  };
}

async function loadPending(reference: string) {
  try {
    const snap = await getAdminDb().doc(`payments/${reference}`).get();
    return snap.exists ? snap.data() : null;
  } catch (error) {
    console.error('[Verify] pending lookup failed', error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  const search = request.nextUrl.searchParams;
  const result = await verifyCharge({
    reference: search.get('reference') || search.get('trxref'),
    txRef: search.get('tx_ref'),
    transactionId: search.get('transaction_id'),
    status: search.get('status'),
  });

  return redirectToSubscription(request, {
    verified: result.success ? 'true' : 'false',
    canceled: result.success ? '' : (search.get('status') === 'cancelled' ? 'true' : ''),
    reference: (result as any).reference || search.get('reference') || '',
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const result = await verifyCharge({
      reference: body.reference || body.trxref,
      txRef: body.tx_ref || body.txRef,
      transactionId: body.transaction_id || body.transactionId,
      status: body.status,
    });
    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch (error: any) {
    console.error('[Verify] error', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Could not confirm this payment' },
      { status: 500 }
    );
  }
}
