const ROOM_TTL_SECONDS = 60 * 60 * 24 * 30;

export async function dailyFetch(apiKey: string, path: string, body: unknown) {
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

export function dailyRoomExpiry() {
  return Math.floor(Date.now() / 1000) + ROOM_TTL_SECONDS;
}

export async function createDailyMeetingToken(
  apiKey: string,
  options: {
    roomName: string;
    userName?: string;
    isAudio?: boolean;
    userId?: string;
  }
) {
  return dailyFetch(apiKey, '/meeting-tokens', {
    properties: {
      room_name: options.roomName,
      is_owner: true,
      exp: dailyRoomExpiry(),
      start_video_off: Boolean(options.isAudio),
      enable_prejoin_ui: true,
      ...(options.userName ? { user_name: options.userName } : {}),
      ...(options.userId ? { user_id: options.userId } : {}),
    },
  });
}
