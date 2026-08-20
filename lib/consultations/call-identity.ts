export function resolveCallDisplayName(person: {
  displayName?: string | null;
  name?: string | null;
  email?: string | null;
  fallback?: string | null;
}) {
  const fromProfile = String(person.displayName || '').trim();
  if (fromProfile) return fromProfile;

  const fromName = String(person.name || '').trim();
  if (fromName) return fromName;

  const emailName = String(person.email || '').split('@')[0].trim();
  if (emailName) return emailName;

  const fallback = String(person.fallback || '').trim();
  return fallback || 'Guest';
}

export function dailyRoomNameFromUrl(roomUrl: string) {
  try {
    const parts = new URL(roomUrl).pathname.split('/').filter(Boolean);
    return parts[0] || '';
  } catch {
    return '';
  }
}

export function withDailyJoinIdentity(roomUrl: string, options: {
  userName: string;
  token?: string | null;
}) {
  const url = new URL(roomUrl);
  const token = String(options.token || '').trim();
  if (token) url.searchParams.set('t', token);
  url.searchParams.set('userName', options.userName);
  return url.toString();
}
