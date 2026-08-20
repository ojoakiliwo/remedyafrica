export const UTM_KEYS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
] as const;

export const CLICK_ID_KEYS = ['gclid', 'fbclid', 'ttclid', 'msclkid'] as const;

export type CampaignParams = Partial<Record<(typeof UTM_KEYS)[number] | (typeof CLICK_ID_KEYS)[number], string>>;

export const CAMPAIGN_EVENTS = [
  'landing_view',
  'install_click',
  'install_accepted',
  'install_help_android',
  'install_help_ios',
  'share_whatsapp',
  'share_native',
  'share_copy',
  'identify_cta',
] as const;

export type CampaignEventName = (typeof CAMPAIGN_EVENTS)[number];

export const SITE_ORIGIN = 'https://www.remedyafrica.com';
export const GET_THE_APP_PATH = '/get-the-app';

const FIRST_KEY = 'ra_campaign_first';
const LAST_KEY = 'ra_campaign_last';

function cleanValue(value: string | null | undefined) {
  if (!value) return '';
  return value.trim().slice(0, 120);
}

export function paramsFromSearch(search: string | URLSearchParams): CampaignParams {
  const query = typeof search === 'string' ? new URLSearchParams(search) : search;
  const next: CampaignParams = {};
  for (const key of [...UTM_KEYS, ...CLICK_ID_KEYS]) {
    const value = cleanValue(query.get(key));
    if (value) next[key] = value;
  }
  return next;
}

export function hasCampaignParams(params: CampaignParams) {
  return Object.keys(params).length > 0;
}

export function readStoredCampaign(): { first: CampaignParams; last: CampaignParams } {
  if (typeof window === 'undefined') return { first: {}, last: {} };
  const parse = (raw: string | null): CampaignParams => {
    if (!raw) return {};
    try {
      const value = JSON.parse(raw) as CampaignParams;
      return value && typeof value === 'object' ? value : {};
    } catch {
      return {};
    }
  };
  return {
    first: parse(window.localStorage.getItem(FIRST_KEY)),
    last: parse(window.sessionStorage.getItem(LAST_KEY) || window.localStorage.getItem(LAST_KEY)),
  };
}

export function persistCampaignParams(incoming: CampaignParams) {
  if (typeof window === 'undefined' || !hasCampaignParams(incoming)) return;
  const stored = readStoredCampaign();
  if (!hasCampaignParams(stored.first)) {
    window.localStorage.setItem(FIRST_KEY, JSON.stringify(incoming));
  }
  window.sessionStorage.setItem(LAST_KEY, JSON.stringify(incoming));
  window.localStorage.setItem(LAST_KEY, JSON.stringify(incoming));
}

export function withCampaignParams(path: string, extra: CampaignParams = {}) {
  const stored = readStoredCampaign().last;
  const merged = { ...stored, ...extra };
  const url = new URL(path, SITE_ORIGIN);
  for (const [key, value] of Object.entries(merged)) {
    if (value) url.searchParams.set(key, value);
  }
  return `${url.pathname}${url.search}`;
}

export function shareUrl(extra: CampaignParams = {}) {
  return `${SITE_ORIGIN}${withCampaignParams(GET_THE_APP_PATH, extra)}`;
}

export function trackCampaignEvent(name: CampaignEventName, extra: Record<string, string> = {}) {
  if (typeof window === 'undefined') return;
  const stored = readStoredCampaign();
  const payload = {
    name,
    path: window.location.pathname,
    first: stored.first,
    last: stored.last,
    ...extra,
  };

  const dataLayer = ((window as Window & { dataLayer?: Record<string, unknown>[] }).dataLayer ||= []);
  dataLayer.push({ event: `ra_${name}`, ...payload });

  void fetch('/api/campaign/event', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch(() => {});
}
