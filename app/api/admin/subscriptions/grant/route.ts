import { NextResponse } from 'next/server';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin';
import { buildGrantFields } from '@/lib/auth/subscription';
import { normalizeEmail as normalizeEmailValue } from '@/lib/auth/roles';

function asString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

async function resolveTargetUid(input: {
  userId?: string;
  email?: string;
}) {
  const db = getAdminDb();
  const auth = getAdminAuth();
  const statedId = asString(input.userId);
  if (statedId) {
    const userSnap = await db.doc(`users/${statedId}`).get();
    if (userSnap.exists) return statedId;
    try {
      await auth.getUser(statedId);
      return statedId;
    } catch {
      // fall through to email
    }
  }

  const email = normalizeEmailValue(input.email);
  if (!email) return null;

  try {
    const record = await auth.getUserByEmail(email);
    return record.uid;
  } catch {
    const snaps = await db.collection('users').where('email', '==', email).limit(1).get();
    if (!snaps.empty) return snaps.docs[0].id;
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    if (!token) {
      return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
    }

    const body = await request.json();
    const decoded = await getAdminAuth().verifyIdToken(token);
    const db = getAdminDb();
    const adminSnap = await db.doc(`users/${decoded.uid}`).get();
    if (adminSnap.data()?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin only' }, { status: 403 });
    }

    const targetUid = await resolveTargetUid({
      userId: asString(body.userId),
      email: asString(body.email),
    });
    if (!targetUid) {
      return NextResponse.json({ error: 'No user found for that email or ID' }, { status: 404 });
    }

    const grant = buildGrantFields({
      planId: asString(body.planId) || 'healer',
      months: body.months,
      grantedBy: decoded.uid,
    });

    await db.doc(`users/${targetUid}`).set({
      ...grant.userFields,
      subscriptionExpiresAt: Timestamp.fromDate(grant.expiresAt),
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });

    await db.doc(`users/${targetUid}/subscription/current`).set({
      ...grant.record,
      reference: `admin-grant-${Date.now()}`,
      startedAt: FieldValue.serverTimestamp(),
      expiresAt: Timestamp.fromDate(grant.expiresAt),
      updatedAt: FieldValue.serverTimestamp(),
      grantedAt: FieldValue.serverTimestamp(),
    }, { merge: true });

    return NextResponse.json({
      ok: true,
      userId: targetUid,
      plan: grant.plan.id,
      planName: grant.plan.name,
      tier: grant.plan.tier,
      expiresAt: grant.expiresAt.toISOString(),
    });
  } catch (error: any) {
    console.error('Grant subscription error:', error);
    const message = error?.message || 'Failed to grant subscription';
    const missingCreds = String(message).includes('FIREBASE_SERVICE_ACCOUNT');
    return NextResponse.json(
      { error: missingCreds ? 'Server is missing FIREBASE_SERVICE_ACCOUNT' : 'Failed to grant subscription' },
      { status: missingCreds ? 503 : 500 }
    );
  }
}
