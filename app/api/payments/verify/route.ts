// app/api/payments/verify/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/client';
import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const reference = searchParams.get('reference');
  const txRef = searchParams.get('tx_ref');
  const transactionId = searchParams.get('transaction_id');
  const status = searchParams.get('status');

  try {
    // Flutterwave returns tx_ref, transaction_id, status
    if (txRef && transactionId) {
      return await verifyFlutterwave(txRef, transactionId, status);
    }

    // Paystack returns reference
    if (reference) {
      return await verifyPaystack(reference);
    }

    return NextResponse.json(
      { success: false, error: 'No transaction reference provided' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Verification error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

async function verifyPaystack(reference: string) {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json(
      { success: false, error: 'Paystack not configured' },
      { status: 500 }
    );
  }

  const response = await fetch(
    `https://api.paystack.co/transaction/verify/${reference}`,
    {
      headers: {
        Authorization: `Bearer ${secretKey}`
      }
    }
  );

  const data = await response.json();

  if (!data.status || data.data.status !== 'success') {
    return NextResponse.json({
      success: false,
      verified: false,
      message: data.message || 'Payment not successful',
      reference
    });
  }

  const metadata = data.data.metadata || {};
  const userId = metadata.userId;
  const planId = metadata.planId;
  const planName = metadata.planName;

  if (!userId) {
    return NextResponse.json(
      { success: false, error: 'User ID not found in metadata' },
      { status: 400 }
    );
  }

  // Update subscription
  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + 1);

  await setDoc(doc(db, 'users', userId, 'subscription', 'current'), {
    plan: planId,
    planName: planName || planId,
    status: 'active',
    gateway: 'paystack',
    reference,
    amount: data.data.amount / 100,
    currency: data.data.currency,
    interval: 'monthly',
    startedAt: serverTimestamp(),
    expiresAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    paystackData: {
      channel: data.data.channel,
      paidAt: data.data.paid_at,
      cardType: data.data.authorization?.card_type
    }
  });

  // Log payment
  await setDoc(
    doc(db, 'payments', reference),
    {
      userId,
      planId,
      planName: planName || planId,
      gateway: 'paystack',
      reference,
      amount: data.data.amount / 100,
      currency: data.data.currency,
      status: 'successful',
      verifiedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );

  return NextResponse.json({
    success: true,
    verified: true,
    reference,
    plan: planId,
    message: 'Payment verified successfully'
  });
}

async function verifyFlutterwave(txRef: string, transactionId: string, status?: string | null) {
  if (status === 'cancelled' || status === 'failed') {
    return NextResponse.json({
      success: false,
      verified: false,
      message: `Payment ${status}`,
      txRef
    });
  }

  const secretKey = process.env.FLUTTERWAVE_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json(
      { success: false, error: 'Flutterwave not configured' },
      { status: 500 }
    );
  }

  const response = await fetch(
    `https://api.flutterwave.com/v3/transactions/${transactionId}/verify`,
    {
      headers: {
        Authorization: `Bearer ${secretKey}`
      }
    }
  );

  const data = await response.json();

  if (data.status !== 'success' || data.data.status !== 'successful') {
    return NextResponse.json({
      success: false,
      verified: false,
      message: data.message || 'Payment not successful',
      txRef
    });
  }

  const meta = data.data.meta || {};
  const userId = meta.userId;
  const planId = meta.planId;
  const planName = meta.planName;

  if (!userId) {
    return NextResponse.json(
      { success: false, error: 'User ID not found in metadata' },
      { status: 400 }
    );
  }

  // Update subscription
  await setDoc(doc(db, 'users', userId, 'subscription', 'current'), {
    plan: planId,
    planName: planName || planId,
    status: 'active',
    gateway: 'flutterwave',
    reference: txRef,
    transactionId,
    amount: data.data.amount,
    currency: data.data.currency,
    interval: 'monthly',
    startedAt: serverTimestamp(),
    expiresAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    flutterwaveData: {
      processorResponse: data.data.processor_response,
      paymentType: data.data.payment_type,
      card: data.data.card
    }
  });

  // Log payment
  await setDoc(
    doc(db, 'payments', txRef),
    {
      userId,
      planId,
      planName: planName || planId,
      gateway: 'flutterwave',
      reference: txRef,
      transactionId,
      amount: data.data.amount,
      currency: data.data.currency,
      status: 'successful',
      verifiedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );

  return NextResponse.json({
    success: true,
    verified: true,
    txRef,
    transactionId,
    plan: planId,
    message: 'Payment verified successfully'
  });
}