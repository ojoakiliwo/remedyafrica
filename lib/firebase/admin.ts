import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getAuth, type Auth } from 'firebase-admin/auth';

function readServiceAccount(): Record<string, unknown> | null {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function getAdminDb(): Firestore | null {
  const sa = readServiceAccount();
  if (!sa) return null;
  if (!getApps().length) {
    initializeApp({ credential: cert(sa as any) });
  }
  return getFirestore();
}

export function getAdminAuth(): Auth | null {
  const sa = readServiceAccount();
  if (!sa) return null;
  if (!getApps().length) {
    initializeApp({ credential: cert(sa as any) });
  }
  return getAuth();
}
