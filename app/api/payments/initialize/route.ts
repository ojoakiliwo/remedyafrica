// app/api/payments/initiate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { SUBSCRIPTION_PLANS, PaymentGateway } from '@/lib/payments';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, userId, planId, gateway, callbackUrl } = body;

    if (!email || !userId || !planId || !gateway) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId);
    if (!plan) {
      return NextResponse.json(
        { success: false, error: 'Invalid plan' },
        { status: 400 }
      );
    }

    const txRef = `remedy-${userId.slice(0, 8)}-${Date.now()}`;
    const callback = callbackUrl || `${process.env.NEXT_PUBLIC_APP_URL}/subscription/verify`;

    if (gateway === 'paystack') {
      return await initiatePaystack(email, plan, txRef, callback, userId);
    } else if (gateway === 'flutterwave') {
      return await initiateFlutterwave(email, plan, txRef, callback, userId);
    }

    return NextResponse.json(
      { success: false, error: 'Invalid gateway' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Payment initiation error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

async function initiatePaystack(
  email: string,
  plan: any,
  txRef: string,
  callback: string,
  userId: string
) {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json(
      { success: false, error: 'Paystack not configured' },
      { status: 500 }
    );
  }

  const response = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email,
      amount: plan.priceNGN * 100, // Paystack uses kobo
      reference: txRef,
      callback_url: callback,
      metadata: {
        userId,
        planId: plan.id,
        planName: plan.name,
        gateway: 'paystack',
        cancel_action: `${process.env.NEXT_PUBLIC_APP_URL}/subscription?canceled=true`
      }
    })
  });

  const data = await response.json();

  if (!data.status) {
    return NextResponse.json(
      { success: false, error: data.message || 'Paystack initialization failed' },
      { status: 400 }
    );
  }

  return NextResponse.json({
    success: true,
    authorizationUrl: data.data.authorization_url,
    reference: data.data.reference,
    gateway: 'paystack'
  });
}

async function initiateFlutterwave(
  email: string,
  plan: any,
  txRef: string,
  callback: string,
  userId: string
) {
  const secretKey = process.env.FLUTTERWAVE_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json(
      { success: false, error: 'Flutterwave not configured' },
      { status: 500 }
    );
  }

  const response = await fetch('https://api.flutterwave.com/v3/payments', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      tx_ref: txRef,
      amount: plan.priceUSD,
      currency: 'USD',
      redirect_url: callback,
      payment_options: 'card',
      customer: {
        email,
        name: email.split('@')[0]
      },
      customizations: {
        title: 'RemedyAfrica Subscription',
        description: `${plan.name} Plan - ${plan.description}`,
        logo: `${process.env.NEXT_PUBLIC_APP_URL}/logo.png`
      },
      meta: {
        userId,
        planId: plan.id,
        planName: plan.name,
        gateway: 'flutterwave'
      }
    })
  });

  const data = await response.json();

  if (data.status !== 'success') {
    return NextResponse.json(
      { success: false, error: data.message || 'Flutterwave initialization failed' },
      { status: 400 }
    );
  }

  return NextResponse.json({
    success: true,
    authorizationUrl: data.data.link,
    txRef: txRef,
    gateway: 'flutterwave'
  });
}