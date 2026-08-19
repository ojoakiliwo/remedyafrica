export function normalizeEmail(value?: string | null) {
  return String(value || '').trim().toLowerCase();
}

export function isAdminRole(role?: string | null) {
  return role === 'admin';
}

export function isPractitionerRole(role?: string | null) {
  return role === 'practitioner' || role === 'admin';
}

export function effectiveAccountRole(
  role?: string | null,
  hasPractitionerProfile = false
): 'admin' | 'practitioner' | 'user' {
  if (role === 'admin') return 'admin';
  if (role === 'practitioner' || hasPractitionerProfile) return 'practitioner';
  return 'user';
}

export type StatedAccount = {
  existsInAuth: boolean;
  role?: string | null;
};

export function resolveApplicantUid(input: {
  applicationId: string;
  statedUserId?: string | null;
  statedAccount?: StatedAccount | null;
  authUidByEmail?: string | null;
  emailAccountIsAdmin?: boolean;
}): { uid: string; reason: string } {
  const stated = String(input.statedUserId || '').trim();
  const statedIsAdmin = input.statedAccount?.role === 'admin';
  const statedOk = Boolean(
    stated &&
    input.statedAccount?.existsInAuth &&
    !statedIsAdmin
  );

  if (statedOk) {
    return { uid: stated, reason: 'application.userId' };
  }

  if (input.authUidByEmail && !input.emailAccountIsAdmin) {
    return { uid: input.authUidByEmail, reason: 'auth.email' };
  }

  if (stated && !statedIsAdmin) {
    return { uid: stated, reason: 'application.userId.unverified' };
  }

  return { uid: input.applicationId, reason: 'applicationId' };
}

const ORPHAN_FIELDS = [
  'displayName',
  'name',
  'photoURL',
  'phone',
  'subscriptionTier',
  'subscriptionStatus',
] as const;

export function fieldsToCopyFromOrphan(data?: Record<string, unknown> | null) {
  if (!data) return {} as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const key of ORPHAN_FIELDS) {
    const value = data[key];
    if (value != null && value !== '') out[key] = value;
  }
  return out;
}
