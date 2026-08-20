import { NextResponse } from 'next/server';
import { createDailyMeetingToken, dailyFetch, dailyRoomExpiry } from '@/lib/daily/api';

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
    const exp = dailyRoomExpiry();

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

    const tokenData = await createDailyMeetingToken(apiKey, {
      roomName: roomData.name,
      isAudio,
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
