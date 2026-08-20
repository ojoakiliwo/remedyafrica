import { NextResponse } from 'next/server';
import { createDailyMeetingToken } from '@/lib/daily/api';
import { dailyRoomNameFromUrl, resolveCallDisplayName, withDailyJoinIdentity } from '@/lib/consultations/call-identity';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const roomUrl = String(body.roomUrl || '').trim();
    const roomName = String(body.roomName || dailyRoomNameFromUrl(roomUrl)).trim();
    const userName = resolveCallDisplayName({
      displayName: body.userName,
      name: body.name,
      email: body.email,
      fallback: body.fallbackName,
    });

    if (!roomName) {
      return NextResponse.json({ error: 'roomName is required' }, { status: 400 });
    }

    const apiKey = process.env.DAILY_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Daily.co API key not configured' }, { status: 500 });
    }

    const tokenData = await createDailyMeetingToken(apiKey, {
      roomName,
      userName,
      isAudio: body.type === 'audio',
      userId: typeof body.userId === 'string' ? body.userId : undefined,
    });

    const baseUrl = roomUrl || `https://remedyafrica.daily.co/${roomName}`;
    return NextResponse.json({
      token: tokenData.token,
      userName,
      roomUrl: withDailyJoinIdentity(baseUrl, {
        userName,
        token: tokenData.token,
      }),
    });
  } catch (error) {
    console.error('Daily.co join token error:', error);
    return NextResponse.json({ error: 'Failed to create meeting token' }, { status: 500 });
  }
}
