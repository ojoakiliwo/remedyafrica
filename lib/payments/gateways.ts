import { publicAppUrl, type PaymentGateway } from '@/lib/payments/logic';

export async function initializePaystack(input: {
  email: string;
  amountKobo: number;
  reference: string;
  callbackUrl: string;
  metadata: Record<string, unknown>;
}) {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    return { ok: false as const, error: 'Paystack is not configured yet', status: 503 };
  }

  const response = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: input.email,
      amount: input.amountKobo,
      currency: 'NGN',
      reference: input.reference,
      callback_url: input.callbackUrl,
      channels: ['card', 'bank', 'ussd', 'qr', 'mobile_money', 'bank_transfer'],
      metadata: {
        ...input.metadata,
        cancel_action: `${publicAppUrl()}/subscription?canceled=true`,
      },
    }),
  });

  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.status || !data?.data?.authorization_url) {
    return {
      ok: false as const,
      error: data?.message || 'Paystack could not start this payment',
      status: 502,
    };
  }

  return {
    ok: true as const,
    authorizationUrl: String(data.data.authorization_url),
    reference: String(data.data.reference || input.reference),
  };
}

export async function verifyPaystackTransaction(reference: string) {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    return { ok: false as const, error: 'Paystack is not configured yet' };
  }

  const response = await fetch(
    `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
    { headers: { Authorization: `Bearer ${secretKey}` } }
  );
  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.status) {
    return { ok: false as const, error: data?.message || 'Could not verify Paystack payment' };
  }
  return { ok: true as const, data: data.data };
}

export async function initializeFlutterwave(input: {
  email: string;
  amountUsd: number;
  reference: string;
  redirectUrl: string;
  planName: string;
  description: string;
  metadata: Record<string, string>;
}) {
  const secretKey = process.env.FLUTTERWAVE_SECRET_KEY;
  if (!secretKey) {
    return { ok: false as const, error: 'Flutterwave is not configured yet', status: 503 };
  }

  const response = await fetch('https://api.flutterwave.com/v3/payments', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      tx_ref: input.reference,
      amount: input.amountUsd,
      currency: 'USD',
      redirect_url: input.redirectUrl,
      payment_options: 'card',
      customer: {
        email: input.email,
        name: input.email.split('@')[0],
      },
      customizations: {
        title: 'RemedyAfrica',
        description: `${input.planName} — three months of care`,
        logo: `${publicAppUrl()}/logo.png`,
      },
      meta: input.metadata,
    }),
  });

  const data = await response.json().catch(() => null);
  if (!response.ok || data?.status !== 'success' || !data?.data?.link) {
    return {
      ok: false as const,
      error: data?.message || 'Flutterwave could not start this payment',
      status: 502,
    };
  }

  return {
    ok: true as const,
    authorizationUrl: String(data.data.link),
    reference: input.reference,
  };
}

export async function verifyFlutterwaveTransaction(transactionId: string) {
  const secretKey = process.env.FLUTTERWAVE_SECRET_KEY;
  if (!secretKey) {
    return { ok: false as const, error: 'Flutterwave is not configured yet' };
  }

  const response = await fetch(
    `https://api.flutterwave.com/v3/transactions/${encodeURIComponent(transactionId)}/verify`,
    { headers: { Authorization: `Bearer ${secretKey}` } }
  );
  const data = await response.json().catch(() => null);
  if (!response.ok || data?.status !== 'success') {
    return { ok: false as const, error: data?.message || 'Could not verify Flutterwave payment' };
  }
  return { ok: true as const, data: data.data };
}

export async function disablePaystackSubscription(code: string, token: string) {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey || !code || !token) return;
  await fetch('https://api.paystack.co/subscription/disable', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ code, token }),
  }).catch((error) => {
    console.error('[Cancel] Paystack disable failed', error);
  });
}

export async function cancelFlutterwaveSubscription(subscriptionId: string) {
  const secretKey = process.env.FLUTTERWAVE_SECRET_KEY;
  if (!secretKey || !subscriptionId) return;
  await fetch(`https://api.flutterwave.com/v3/subscriptions/${encodeURIComponent(subscriptionId)}/cancel`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${secretKey}` },
  }).catch((error) => {
    console.error('[Cancel] Flutterwave cancel failed', error);
  });
}

export function configuredGateways(): Record<PaymentGateway, boolean> {
  return {
    paystack: Boolean(process.env.PAYSTACK_SECRET_KEY),
    flutterwave: Boolean(process.env.FLUTTERWAVE_SECRET_KEY),
  };
}
