import { NextRequest, NextResponse } from 'next/server';
import { CAMPAIGN_EVENTS, CLICK_ID_KEYS, UTM_KEYS, type CampaignEventName } from '@/lib/campaign';
import { getAdminDb } from '@/lib/firebase/admin';

const ALLOWED = new Set<string>(CAMPAIGN_EVENTS);

function clip(value: unknown, max = 120) {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, max);
}

function pickParams(input: Record<string, unknown> | undefined) {
  const source = input && typeof input === 'object' ? input : {};
  const next: Record<string, string> = {};
  for (const key of [...UTM_KEYS, ...CLICK_ID_KEYS]) {
    const value = clip(source[key]);
    if (value) next[key] = value;
  }
  return next;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const name = clip(body?.name, 40) as CampaignEventName;
    if (!ALLOWED.has(name)) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const record = {
      name,
      path: clip(body?.path, 80) || '/get-the-app',
      first: pickParams(body?.first),
      last: pickParams(body?.last),
      createdAt: new Date().toISOString(),
      userAgent: clip(request.headers.get('user-agent') || '', 180),
    };

    try {
      await getAdminDb().collection('campaign_events').add({
        ...record,
        createdAt: new Date(),
      });
    } catch (error) {
      console.warn('campaign event persist skipped', error);
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
