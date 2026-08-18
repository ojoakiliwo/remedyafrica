import { NextResponse } from 'next/server';

const ROOM_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days for scheduled consultations

async function dailyFetch(apiKey: string, path: string, body: unknown) {
  const response = await fetch(`https://api.daily.co/v1${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    console.error(`Daily.co ${path} failed`, response.status, data);
    throw new Error(data.info || `Daily.co ${path} failed`);
  }

  return data;
}

export async function POST(request: Request) {
  try {
    const { consultationId, type } = await request.json();

    if (!consultationId || typeof consultationId !== 'string') {
      return NextResponse.json(
        { error: 'consultationId is required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.DAILY_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Daily.co API key not configured' },
        { status: 500 }
      );
    }

    const isAudio = type === 'audio';
    const roomName = `remedy-${consultationId.slice(0, 8)}-${Date.now()}`;
    const exp = Math.floor(Date.now() / 1000) + ROOM_TTL_SECONDS;

    const roomData = await dailyFetch(apiKey, '/rooms', {
      name: roomName,
      privacy: 'private',
      properties: {
        max_participants: 2,
        enable_screenshare: true,
        enable_chat: true,
        start_video_off: isAudio,
        start_audio_off: false,
        enable_prejoin_ui: true,
        enable_knocking: false,
        lang: 'en',
        exp,
        eject_at_room_exp: true,
      },
    });

    // Private rooms require a meeting token to join. Embed it in the shared
    // room URL so copy-link and the consultation iframe both work.
    const tokenData = await dailyFetch(apiKey, '/meeting-tokens', {
      properties: {
        room_name: roomData.name,
        is_owner: true,
        exp,
        start_video_off: isAudio,
        enable_prejoin_ui: true,
      },
    });

    const roomUrl = new URL(roomData.url);
    roomUrl.searchParams.set('t', tokenData.token);

    return NextResponse.json({
      roomUrl: roomUrl.toString(),
      roomName: roomData.name,
      config: {
        type,
        consultationId,
      },
    });
  } catch (error) {
    console.error('Daily.co room creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create meeting room' },
      { status: 500 }
    );
  }
}
