import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebase/admin';

export type AuthedUser = {
  uid: string;
  email: string | null;
};

export async function requireUser(request: NextRequest): Promise<AuthedUser | NextResponse> {
  const header = request.headers.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!token) {
    return NextResponse.json({ success: false, error: 'Sign in required' }, { status: 401 });
  }

  try {
    const decoded = await getAdminAuth().verifyIdToken(token);
    return {
      uid: decoded.uid,
      email: decoded.email || null,
    };
  } catch {
    return NextResponse.json({ success: false, error: 'Session expired. Please sign in again.' }, { status: 401 });
  }
}

export function isAuthError(value: AuthedUser | NextResponse): value is NextResponse {
  return value instanceof NextResponse;
}
