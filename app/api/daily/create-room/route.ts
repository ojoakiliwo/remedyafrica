import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { consultationId, type } = await request.json();
    
    const apiKey = process.env.DAILY_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Daily.co API key not configured' }, 
        { status: 500 }
      );
    }

    // Create room name from consultation ID
    const roomName = `remedy-${consultationId.slice(0, 8)}-${Date.now()}`;
    
    const response = await fetch('https://api.daily.co/v1/rooms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        name: roomName,
        privacy: 'private',
        properties: {
          max_participants: 2,
          enable_screenshare: true,
          enable_chat: true,
          start_video_off: type === 'audio', // Start with video off for audio calls
          start_audio_off: false,
          enable_prejoin_ui: true,
          enable_knocking: false,
          lang: 'en'
        }
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.info || 'Failed to create room');
    }

    const roomData = await response.json();
    
    return NextResponse.json({
      roomUrl: roomData.url,
      roomName: roomData.name,
      config: {
        type,
        consultationId
      }
    });
    
  } catch (error) {
    console.error('Daily.co room creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create meeting room' }, 
      { status: 500 }
    );
  }
}