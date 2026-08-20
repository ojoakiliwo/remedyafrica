export const PRACTITIONER_RESERVED_ROUTES: Record<string, string> = {
  dashboard: '/practitioners/dashboard',
  consultations: '/practitioners/consultations',
  apply: '/practitioners/apply',
  profile: '/profile',
  edit: '/practitioners/profile/edit',
};

export function resolvePractitionerReservedPath(id?: string | null) {
  const key = String(id || '').trim().toLowerCase();
  return PRACTITIONER_RESERVED_ROUTES[key] || null;
}
