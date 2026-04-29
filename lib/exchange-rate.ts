// lib/exchange-rate.ts

const CACHE_KEY = 'remedy_exchange_rate';
const CACHE_DURATION_MS = 1000 * 60 * 60; // 1 hour

interface RateCache {
  rate: number;
  timestamp: number;
}

async function fetchLiveRate(): Promise<number> {
  try {
    // Free API, no key needed
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
    const data = await response.json();
    const rate = data.rates?.NGN;
    
    if (!rate || typeof rate !== 'number') {
      throw new Error('Invalid rate response');
    }
    
    return rate;
  } catch (err) {
    console.error('[ExchangeRate] API failed, trying fallback:', err);
    
    // Fallback to frankfurter
    try {
      const response = await fetch('https://api.frankfurter.app/latest?from=USD&to=NGN');
      const data = await response.json();
      const rate = data.rates?.NGN;
      if (rate) return rate;
    } catch (e) {
      console.error('[ExchangeRate] Fallback also failed:', e);
    }
    
    // Hard fallback
    return 1600;
  }
}

export async function getExchangeRate(): Promise<number> {
  // Check cache first
  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const parsed: RateCache = JSON.parse(cached);
      if (Date.now() - parsed.timestamp < CACHE_DURATION_MS) {
        return parsed.rate;
      }
    }
  }
  
  const rate = await fetchLiveRate();
  
  // Cache it
  if (typeof window !== 'undefined') {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ rate, timestamp: Date.now() }));
  }
  
  return rate;
}

export function convertUSDtoNGN(usd: number, rate: number): number {
  return Math.round(usd * rate);
}

export function convertNGNtoUSD(ngn: number, rate: number): number {
  return Math.round((ngn / rate) * 100) / 100;
}