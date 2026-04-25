// app/api/payments/cancel/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/client';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID required' }, { status: 400 });
    }

    const subRef = doc(db, 'users', userId, 'subscription', 'current');
    const subSnap = await getDoc(subRef);

    if (!subSnap.exists()) {
      return NextResponse.json({ success: false, error: 'No active subscription found' }, { status: 404 });
    }

    const sub = subSnap.data();
    const gateway = sub.gateway;

    // Cancel on gateway side if possible
    if (gateway === 'paystack') {
      const subCode = sub.paystackSubscriptionCode;
      const emailToken = sub.paystackEmailToken;

      if (subCode && emailToken) {
        const response = await fetch('https://api.paystack.co/subscription/disable', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            code: subCode,
            token: emailToken
          })
        });

        const result = await response.json();
        if (!result.status) {
          console.error('[Cancel] Paystack disable failed:', result.message);
          // Continue to update Firestore anyway
        }
      }
    } else if (gateway === 'flutterwave') {
      // Flutterwave subscription cancellation requires subscription ID
      // If we stored it during creation, use it here
      const flutterSubId = sub.flutterwaveSubscriptionId;
      if (flutterSubId) {
        const response = await fetch(
          `https://api.flutterwave.com/v3/subscriptions/${flutterSubId}/cancel`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`
            }
          }
        );
        const result = await response.json();
        if (result.status !== 'success') {
          console.error('[Cancel] Flutterwave cancel failed:', result.message);
        }
      }
    }

    // Update Firestore — cancel at period end (graceful)
    await updateDoc(subRef, {
      status: 'cancelled',
      cancelledAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      cancelMethod: 'user_requested'
    });

    return NextResponse.json({
      success: true,
      message: 'Subscription cancelled successfully. You will retain access until the end of your current billing period.'
    });
  } catch (error: any) {
    console.error('[Cancel] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to cancel subscription' },
      { status: 500 }
    );
  }
}