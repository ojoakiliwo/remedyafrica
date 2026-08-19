import { NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin';
import {
  fieldsToCopyFromOrphan,
  normalizeEmail,
  resolveApplicantUid,
} from '@/lib/auth/roles';

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

async function getAuthUser(uid: string) {
  try {
    return await getAdminAuth().getUser(uid);
  } catch {
    return null;
  }
}

async function getAuthUserByEmail(email: string) {
  if (!email) return null;
  try {
    return await getAdminAuth().getUserByEmail(email);
  } catch {
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
    const statedUserId = asString(application.userId);
    const email = normalizeEmail(asString(application.email) || asString(application.applicantEmail));
    const name = asString(application.name) || asString(application.fullName) || 'Practitioner';

    const statedAuth = statedUserId ? await getAuthUser(statedUserId) : null;
    const statedUserSnap = statedUserId ? await db.doc(`users/${statedUserId}`).get() : null;
    const emailAuth = await getAuthUserByEmail(email);
    const emailUserSnap = emailAuth ? await db.doc(`users/${emailAuth.uid}`).get() : null;

    const resolved = resolveApplicantUid({
      applicationId,
      statedUserId,
      statedAccount: statedUserId
        ? {
            existsInAuth: Boolean(statedAuth),
            role: asString(statedUserSnap?.data()?.role) || null,
          }
        : null,
      authUidByEmail: emailAuth?.uid || null,
      emailAccountIsAdmin: emailUserSnap?.data()?.role === 'admin',
    });

    const practitionerId = resolved.uid;
    const convertedUserSnap = await db.doc(`users/${practitionerId}`).get();
    const convertingAdmin = convertedUserSnap.data()?.role === 'admin';

    const orphanFields: Record<string, unknown> = {};
    const emailsToSearch = Array.from(new Set(
      [asString(application.email), asString(application.applicantEmail), email].filter(Boolean)
    ));
    if (emailsToSearch.length > 0) {
      for (const candidate of emailsToSearch) {
        const orphans = await db.collection('users').where('email', '==', candidate).get();
        for (const orphan of orphans.docs) {
          if (orphan.id === practitionerId) continue;
          const copied = fieldsToCopyFromOrphan(orphan.data() as Record<string, unknown>);
          for (const [key, value] of Object.entries(copied)) {
            if (orphanFields[key] == null) orphanFields[key] = value;
          }
          await orphan.ref.set({
            replacedByUserId: practitionerId,
            updatedAt: FieldValue.serverTimestamp(),
          }, { merge: true });
        }
      }
    }

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
      userId: statedUserId || practitionerId,
    }, { merge: true });

    if (!convertingAdmin) {
      const authRecord = statedAuth?.uid === practitionerId ? statedAuth : emailAuth;
      await db.doc(`users/${practitionerId}`).set({
        ...orphanFields,
        email: asString(application.email) || asString(application.applicantEmail) || authRecord?.email || email,
        displayName: asString(orphanFields.displayName) || name,
        name,
        photoURL: asString(application.photoURL) || asString(orphanFields.photoURL),
        role: 'practitioner',
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
    }

    await applicationRef.update({
      status: 'approved',
      approvedAt: FieldValue.serverTimestamp(),
      approvedBy: decoded.uid,
      convertedUserId: practitionerId,
    });

    return NextResponse.json({
      ok: true,
      practitionerId,
      name,
      convertedExistingAccount: !convertingAdmin,
    });
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
