import { FX_FALLBACK_USD_NGN } from '@/lib/payments/logic';

type RateCache = { rate: number; expiresAt: number };

let memoryCache: RateCache | null = null;
const CACHE_MS = 1000 * 60 * 30;

async function fetchJson(url: string): Promise<any> {
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) throw new Error(`FX ${response.status}`);
  return response.json();
}

async function fetchLiveRate(): Promise<number> {
  try {
    const data = await fetchJson('https://api.exchangerate-api.com/v4/latest/USD');
    const rate = Number(data?.rates?.NGN);
    if (Number.isFinite(rate) && rate > 100) return Math.round(rate);
  } catch (error) {
    console.error('[FX] primary failed', error);
  }

  try {
    const data = await fetchJson('https://api.frankfurter.app/latest?from=USD&to=NGN');
    const rate = Number(data?.rates?.NGN);
    if (Number.isFinite(rate) && rate > 100) return Math.round(rate);
  } catch (error) {
    console.error('[FX] fallback failed', error);
  }

  return FX_FALLBACK_USD_NGN;
}

export async function getUsdToNgnRate(): Promise<number> {
  if (memoryCache && memoryCache.expiresAt > Date.now()) {
    return memoryCache.rate;
  }

  const rate = await fetchLiveRate();
  memoryCache = { rate, expiresAt: Date.now() + CACHE_MS };
  return rate;
}
