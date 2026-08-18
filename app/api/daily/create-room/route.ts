import { NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    configured: Boolean(process.env.DAILY_API_KEY),
    domain: process.env.DAILY_DOMAIN || null,
  });
}

export async function POST(request: Request) {
  try {
    const { consultationId, type } = await request.json();

    if (!consultationId || typeof consultationId !== 'string') {
      return NextResponse.json({ error: 'consultationId is required' }, { status: 400 });
    }

    const callType = type === 'audio' ? 'audio' : 'video';
    const apiKey = process.env.DAILY_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Daily.co API key not configured' },
        { status: 500 }
      );
    }

    const safeId = consultationId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 12) || 'room';
    const roomName = `remedy-${safeId}-${Date.now()}`.slice(0, 61);
    const expires = Math.floor(Date.now() / 1000) + 60 * 60 * 4;

    const response = await fetch('https://api.daily.co/v1/rooms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        name: roomName,
        // Unique name is the lock. "private" rooms need meeting tokens, which
        // the iframe never sends — so patients could not join even with a key.
        privacy: 'public',
        properties: {
          max_participants: 4,
          enable_screenshare: callType === 'video',
          enable_chat: true,
          start_video_off: callType === 'audio',
          start_audio_off: false,
          enable_prejoin_ui: true,
          enable_knocking: false,
          exp: expires,
          eject_at_room_exp: true,
          lang: 'en',
        },
      }),
    });

    const roomData = await response.json();
    if (!response.ok) {
      console.error('[Daily] create room failed:', roomData);
      return NextResponse.json(
        { error: roomData.info || roomData.error || 'Failed to create room' },
        { status: 502 }
      );
    }

    const payload = {
      roomUrl: roomData.url,
      roomName: roomData.name,
      config: { type: callType, consultationId },
    };

    const db = getAdminDb();
    if (db) {
      await db.collection('consultations').doc(consultationId).set(
        {
          dailyRoomUrl: roomData.url,
          roomName: roomData.name,
          dailyRoomName: roomData.name,
          linksUpdatedAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    }

    return NextResponse.json(payload);
  } catch (error: any) {
    console.error('Daily.co room creation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create meeting room' },
      { status: 500 }
    );
  }
}
