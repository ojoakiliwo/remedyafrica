// app/api/payments/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'crypto';
import { db } from '@/lib/firebase/client';
import { doc, getDoc, setDoc, serverTimestamp, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const paystackSig = request.headers.get('x-paystack-signature');
  const flutterwaveHash = request.headers.get('verif-hash');

  try {
    if (paystackSig) {
      return handlePaystackWebhook(rawBody, paystackSig);
    } else if (flutterwaveHash) {
      return handleFlutterwaveWebhook(rawBody, flutterwaveHash);
    }

    return NextResponse.json({ error: 'Unknown gateway' }, { status: 400 });
  } catch (error: any) {
    console.error('[Webhook] Unhandled error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

/* ─────────────── Paystack ─────────────── */

async function handlePaystackWebhook(rawBody: string, signature: string) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) {
    console.error('[Paystack Webhook] Missing secret key');
    return NextResponse.json({ error: 'Not configured' }, { status: 500 });
  }

  const hash = createHmac('sha512', secret).update(rawBody).digest('hex');
  if (hash !== signature) {
    console.warn('[Paystack Webhook] Invalid signature');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const event = JSON.parse(rawBody);
  console.log('[Paystack Webhook] Event:', event.event);

  switch (event.event) {
    case 'charge.success':
      await handlePaystackChargeSuccess(event.data);
      break;
    case 'subscription.disable':
      await handlePaystackSubscriptionDisabled(event.data);
      break;
    case 'invoice.update':
      await handlePaystackInvoiceUpdate(event.data);
      break;
    case 'subscription.create':
      await handlePaystackSubscriptionCreated(event.data);
      break;
    default:
      console.log('[Paystack Webhook] Unhandled event:', event.event);
  }

  return NextResponse.json({ received: true });
}

async function handlePaystackChargeSuccess(data: any) {
  const metadata = data.metadata || {};
  const userId = metadata.userId;
  const planId = metadata.planId;
  const planName = metadata.planName;

  if (!userId || !planId) {
    console.warn('[Paystack] Missing metadata in charge.success');
    return;
  }

  const subRef = doc(db, 'users', userId, 'subscription', 'current');
  const subSnap = await getDoc(subRef);

  if (subSnap.exists() && subSnap.data().status === 'active' && subSnap.data().plan === planId) {
    // Renewal — extend by 3 months
    const currentExpiry = subSnap.data().expiresAt?.toDate?.() || new Date();
    const newExpiry = new Date(currentExpiry);
    newExpiry.setMonth(newExpiry.getMonth() + 3);

    await updateDoc(subRef, {
      status: 'active',
      expiresAt: newExpiry,
      lastRenewedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      'paystackData.lastCharge': {
        reference: data.reference,
        amount: data.amount / 100,
        paidAt: data.paid_at,
        channel: data.channel
      }
    });

    console.log(`[Paystack] Renewed quarterly subscription for ${userId}`);
  } else {
    // Initial
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 3);

    await setDoc(subRef, {
      plan: planId,
      planName: planName || planId,
      status: 'active',
      gateway: 'paystack',
      reference: data.reference,
      amount: data.amount / 100,
      currency: data.currency,
      interval: 'quarterly',
      startedAt: serverTimestamp(),
      expiresAt: expiresAt,
      updatedAt: serverTimestamp(),
      paystackData: {
        authorization: data.authorization,
        channel: data.channel,
        paidAt: data.paid_at
      }
    });

    console.log(`[Paystack] Created quarterly subscription for ${userId}`);
  }

  await setDoc(
    doc(db, 'payments', data.reference),
    {
      userId,
      planId,
      planName: planName || planId,
      gateway: 'paystack',
      reference: data.reference,
      amount: data.amount / 100,
      currency: data.currency,
      status: 'successful',
      event: 'webhook.charge.success',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );
}

async function handlePaystackSubscriptionCreated(data: any) {
  const { customer, plan, subscription_code, email_token } = data;
  if (!customer?.customer_code) return;

  const usersQuery = query(collection(db, 'users'), where('email', '==', customer.email));
  const usersSnap = await getDocs(usersQuery);
  if (usersSnap.empty) {
    console.warn('[Paystack] No user found for email:', customer.email);
    return;
  }

  const userId = usersSnap.docs[0].id;
  const subRef = doc(db, 'users', userId, 'subscription', 'current');

  await updateDoc(subRef, {
    paystackSubscriptionCode: subscription_code,
    paystackEmailToken: email_token,
    paystackPlanCode: plan.plan_code,
    updatedAt: serverTimestamp()
  });

  console.log(`[Paystack] Stored subscription code for ${userId}`);
}

async function handlePaystackSubscriptionDisabled(data: any) {
  const customerEmail = data.customer?.email;
  if (!customerEmail) return;

  const usersQuery = query(collection(db, 'users'), where('email', '==', customerEmail));
  const usersSnap = await getDocs(usersQuery);
  if (usersSnap.empty) return;

  const userId = usersSnap.docs[0].id;
  const subRef = doc(db, 'users', userId, 'subscription', 'current');
  
  await updateDoc(subRef, {
    status: 'cancelled',
    cancelledAt: serverTimestamp(),
    cancelReason: 'Gateway cancellation',
    updatedAt: serverTimestamp()
  });

  console.log(`[Paystack] Quarterly subscription disabled for ${userId}`);
}

async function handlePaystackInvoiceUpdate(data: any) {
  if (data.status === 'success') {
    const customerEmail = data.customer?.email;
    if (!customerEmail) return;

    const usersQuery = query(collection(db, 'users'), where('email', '==', customerEmail));
    const usersSnap = await getDocs(usersQuery);
    if (usersSnap.empty) return;

    const userId = usersSnap.docs[0].id;
    const subRef = doc(db, 'users', userId, 'subscription', 'current');
    const subSnap = await getDoc(subRef);

    if (subSnap.exists()) {
      const currentExpiry = subSnap.data().expiresAt?.toDate?.() || new Date();
      const newExpiry = new Date(currentExpiry);
      newExpiry.setMonth(newExpiry.getMonth() + 3);

      await updateDoc(subRef, {
        status: 'active',
        expiresAt: newExpiry,
        lastRenewedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        'paystackData.lastInvoice': {
          reference: data.transaction?.reference,
          amount: data.amount / 100,
          periodStart: data.period_start,
          periodEnd: data.period_end
        }
      });

      console.log(`[Paystack] Quarterly auto-renewal successful for ${userId}`);
    }
  } else if (data.status === 'failure') {
    const customerEmail = data.customer?.email;
    if (!customerEmail) return;

    const usersQuery = query(collection(db, 'users'), where('email', '==', customerEmail));
    const usersSnap = await getDocs(usersQuery);
    if (usersSnap.empty) return;

    const userId = usersSnap.docs[0].id;
    const subRef = doc(db, 'users', userId, 'subscription', 'current');

    await updateDoc(subRef, {
      status: 'past_due',
      updatedAt: serverTimestamp(),
      'paystackData.lastFailure': {
        reason: data.description,
        attemptedAt: serverTimestamp()
      }
    });

    console.log(`[Paystack] Quarterly auto-renewal failed for ${userId}`);
  }
}

/* ─────────────── Flutterwave ─────────────── */

async function handleFlutterwaveWebhook(rawBody: string, signature: string) {
  const secretHash = process.env.FLUTTERWAVE_SECRET_HASH;
  if (!secretHash) {
    console.error('[Flutterwave Webhook] Missing FLUTTERWAVE_SECRET_HASH');
    return NextResponse.json({ error: 'Not configured' }, { status: 500 });
  }

  if (signature !== secretHash) {
    console.warn('[Flutterwave Webhook] Invalid secret hash');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const event = JSON.parse(rawBody);
  console.log('[Flutterwave Webhook] Event:', event.event);

  switch (event.event) {
    case 'charge.completed':
      await handleFlutterwaveChargeCompleted(event.data);
      break;
    case 'subscription.cancelled':
      await handleFlutterwaveSubscriptionCancelled(event.data);
      break;
    default:
      console.log('[Flutterwave Webhook] Unhandled event:', event.event);
  }

  return NextResponse.json({ received: true });
}

async function handleFlutterwaveChargeCompleted(data: any) {
  const meta = data.meta || {};
  const userId = meta.userId;
  const planId = meta.planId;
  const planName = meta.planName;
  const txRef = data.tx_ref;

  if (!userId || !planId) {
    console.warn('[Flutterwave] Missing metadata in charge.completed');
    return;
  }

  const subRef = doc(db, 'users', userId, 'subscription', 'current');
  const subSnap = await getDoc(subRef);

  if (subSnap.exists() && subSnap.data().status === 'active' && subSnap.data().plan === planId) {
    // Renewal — extend by 3 months
    const currentExpiry = subSnap.data().expiresAt?.toDate?.() || new Date();
    const newExpiry = new Date(currentExpiry);
    newExpiry.setMonth(newExpiry.getMonth() + 3);

    await updateDoc(subRef, {
      status: 'active',
      expiresAt: newExpiry,
      lastRenewedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      'flutterwaveData.lastCharge': {
        id: data.id,
        amount: data.amount,
        chargedAt: data.created_at
      }
    });

    console.log(`[Flutterwave] Renewed quarterly subscription for ${userId}`);
  } else {
    // Initial
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 3);

    await setDoc(subRef, {
      plan: planId,
      planName: planName || planId,
      status: 'active',
      gateway: 'flutterwave',
      reference: txRef,
      transactionId: data.id,
      amount: data.amount,
      currency: data.currency,
      interval: 'quarterly',
      startedAt: serverTimestamp(),
      expiresAt: expiresAt,
      updatedAt: serverTimestamp(),
      flutterwaveData: {
        paymentType: data.data?.payment_type,
        processorResponse: data.data?.processor_response
      }
    });

    console.log(`[Flutterwave] Created quarterly subscription for ${userId}`);
  }

  await setDoc(
    doc(db, 'payments', txRef),
    {
      userId,
      planId,
      planName: planName || planId,
      gateway: 'flutterwave',
      reference: txRef,
      transactionId: data.id,
      amount: data.amount,
      currency: data.currency,
      status: 'successful',
      event: 'webhook.charge.completed',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );
}

async function handleFlutterwaveSubscriptionCancelled(data: any) {
  const customerEmail = data.customer?.email;
  if (!customerEmail) return;

  const usersQuery = query(collection(db, 'users'), where('email', '==', customerEmail));
  const usersSnap = await getDocs(usersQuery);
  if (usersSnap.empty) return;

  const userId = usersSnap.docs[0].id;
  const subRef = doc(db, 'users', userId, 'subscription', 'current');

  await updateDoc(subRef, {
    status: 'cancelled',
    cancelledAt: serverTimestamp(),
    cancelReason: 'Gateway cancellation',
    updatedAt: serverTimestamp()
  });

  console.log(`[Flutterwave] Quarterly subscription cancelled for ${userId}`);
}