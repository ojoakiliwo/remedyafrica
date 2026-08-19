import { NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin';

function asString(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback;
}

function asCertifications(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }
  if (typeof value === 'string') {
    return value.split(',').map((item) => item.trim()).filter(Boolean);
  }
  return [];
}

function asExperience(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const parsed = parseInt(String(value ?? ''), 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    if (!token) {
      return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
    }

    const { applicationId } = await request.json();
    if (!applicationId || typeof applicationId !== 'string') {
      return NextResponse.json({ error: 'applicationId is required' }, { status: 400 });
    }

    const decoded = await getAdminAuth().verifyIdToken(token);
    const db = getAdminDb();
    const adminSnap = await db.doc(`users/${decoded.uid}`).get();
    if (adminSnap.data()?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin only' }, { status: 403 });
    }

    const applicationRef = db.doc(`practitioner_applications/${applicationId}`);
    const applicationSnap = await applicationRef.get();
    if (!applicationSnap.exists) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    const application = applicationSnap.data() || {};
    const practitionerId = asString(application.userId) || applicationId;
    const name = asString(application.name) || asString(application.fullName) || 'Practitioner';

    await db.doc(`practitioners/${practitionerId}`).set({
      name,
      email: asString(application.email) || asString(application.applicantEmail),
      phone: asString(application.phone),
      location: asString(application.location),
      experience: asExperience(application.experience),
      specialty: asString(application.specialty, 'General'),
      bio: asString(application.bio),
      certifications: asCertifications(application.certifications),
      photoURL: asString(application.photoURL),
      isVerified: true,
      isActive: true,
      rating: 0,
      reviews: 0,
      consultationFee: asExperience(application.consultationFee),
      createdAt: FieldValue.serverTimestamp(),
      applicationId,
      userId: asString(application.userId) || null,
    }, { merge: true });

    if (application.userId) {
      await db.doc(`users/${application.userId}`).set({
        role: 'practitioner',
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
    }

    await applicationRef.update({
      status: 'approved',
      approvedAt: FieldValue.serverTimestamp(),
      approvedBy: decoded.uid,
    });

    return NextResponse.json({ ok: true, practitionerId, name });
  } catch (error: any) {
    console.error('Approve application error:', error);
    const message = error?.message || 'Failed to approve application';
    const missingCreds = String(message).includes('FIREBASE_SERVICE_ACCOUNT');
    return NextResponse.json(
      { error: missingCreds ? 'Server is missing FIREBASE_SERVICE_ACCOUNT' : 'Failed to approve application' },
      { status: missingCreds ? 503 : 500 }
    );
  }
}
