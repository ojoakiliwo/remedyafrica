// app/api/payments/initiate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { SUBSCRIPTION_PLANS } from '@/lib/payments';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  console.log('[Initiate] Request received');

  try {
    let body;
    try {
      body = await request.json();
    } catch (parseErr) {
      console.error('[Initiate] JSON parse error:', parseErr);
      return NextResponse.json(
        { success: false, error: 'Invalid JSON body' },
        { status: 400 }
      );
    }

    const { email, userId, planId, gateway, callbackUrl } = body || {};

    console.log('[Initiate] Body:', { email, userId, planId, gateway });

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    if (!userId || typeof userId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    if (!planId || typeof planId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Plan ID is required' },
        { status: 400 }
      );
    }

    if (!gateway || (gateway !== 'paystack' && gateway !== 'flutterwave')) {
      return NextResponse.json(
        { success: false, error: 'Gateway must be "paystack" or "flutterwave"' },
        { status: 400 }
      );
    }

    const plan = SUBSCRIPTION_PLANS.find((p) => p.id === planId);
    if (!plan) {
      return NextResponse.json(
        { success: false, error: `Invalid plan: ${planId}` },
        { status: 400 }
      );
    }

    const callback = callbackUrl || `${process.env.NEXT_PUBLIC_APP_URL || 'https://your-app.vercel.app'}/subscription`;

    if (gateway === 'paystack') {
      return await initiatePaystack(email, plan, userId, callback);
    }

    return await initiateFlutterwave(email, plan, userId, callback);
  } catch (error: any) {
    console.error('[Initiate] Unhandled error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

async function initiatePaystack(
  email: string,
  plan: any,
  userId: string,
  callback: string
) {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    console.error('[Initiate] PAYSTACK_SECRET_KEY missing');
    return NextResponse.json(
      { success: false, error: 'Paystack not configured' },
      { status: 500 }
    );
  }

  const txRef = `remedy-${userId.slice(0, 8)}-${Date.now()}`;

  console.log('[Initiate] Calling Paystack with:', { email, amount: plan.priceNGN * 100, txRef });

  let response;
  try {
    response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        amount: plan.priceNGN * 100, // kobo
        reference: txRef,
        callback_url: callback,
        metadata: {
          userId,
          planId: plan.id,
          planName: plan.name,
          gateway: 'paystack',
          interval: 'quarterly',
          cancel_action: `${process.env.NEXT_PUBLIC_APP_URL || 'https://your-app.vercel.app'}/subscription?canceled=true`
        }
      })
    });
  } catch (fetchErr: any) {
    console.error('[Initiate] Paystack fetch failed:', fetchErr);
    return NextResponse.json(
      { success: false, error: 'Failed to reach Paystack: ' + fetchErr.message },
      { status: 502 }
    );
  }

  let data;
  try {
    data = await response.json();
  } catch (jsonErr) {
    const text = await response.text();
    console.error('[Initiate] Paystack non-JSON response:', text.slice(0, 500));
    return NextResponse.json(
      { success: false, error: 'Paystack returned invalid response' },
      { status: 502 }
    );
  }

  console.log('[Initiate] Paystack response:', data);

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
  userId: string,
  callback: string
) {
  const secretKey = process.env.FLUTTERWAVE_SECRET_KEY;
  if (!secretKey) {
    console.error('[Initiate] FLUTTERWAVE_SECRET_KEY missing');
    return NextResponse.json(
      { success: false, error: 'Flutterwave not configured' },
      { status: 500 }
    );
  }

  const txRef = `remedy-${userId.slice(0, 8)}-${Date.now()}`;

  console.log('[Initiate] Calling Flutterwave with:', { email, amount: plan.priceUSD, txRef });

  let response;
  try {
    response = await fetch('https://api.flutterwave.com/v3/payments', {
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
          title: 'RemedyAfrica — 3 Month Subscription',
          description: `${plan.name} Plan — ${plan.description}`,
          logo: `${process.env.NEXT_PUBLIC_APP_URL || 'https://your-app.vercel.app'}/logo.png`
        },
        meta: {
          userId,
          planId: plan.id,
          planName: plan.name,
          gateway: 'flutterwave',
          interval: 'quarterly'
        }
      })
    });
  } catch (fetchErr: any) {
    console.error('[Initiate] Flutterwave fetch failed:', fetchErr);
    return NextResponse.json(
      { success: false, error: 'Failed to reach Flutterwave: ' + fetchErr.message },
      { status: 502 }
    );
  }

  let data;
  try {
    data = await response.json();
  } catch (jsonErr) {
    const text = await response.text();
    console.error('[Initiate] Flutterwave non-JSON response:', text.slice(0, 500));
    return NextResponse.json(
      { success: false, error: 'Flutterwave returned invalid response' },
      { status: 502 }
    );
  }

  console.log('[Initiate] Flutterwave response:', data);

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