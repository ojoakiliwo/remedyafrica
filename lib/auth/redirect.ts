const DEFAULT_AFTER_AUTH = '/profile';

export function safeInternalPath(value?: string | null, fallback = DEFAULT_AFTER_AUTH): string {
  if (!value) return fallback;
  let decoded = value;
  try {
    decoded = decodeURIComponent(value);
  } catch {
    decoded = value;
  }
  if (!decoded.startsWith('/')) return fallback;
  if (decoded.startsWith('//')) return fallback;
  if (decoded.includes('://')) return fallback;
  if (decoded.includes('\\')) return fallback;
  return decoded;
}
