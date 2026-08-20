import { NextResponse } from 'next/server';
import { ANDROID_PACKAGE_NAME, PLAY_ASSETLINKS_SHA256 } from '@/lib/pwa';

export const dynamic = 'force-dynamic';

export async function GET() {
  const fingerprints = PLAY_ASSETLINKS_SHA256 ? [PLAY_ASSETLINKS_SHA256] : [];

  return NextResponse.json(
    [
      {
        relation: ['delegate_permission/common.handle_all_urls'],
        target: {
          namespace: 'android_app',
          package_name: ANDROID_PACKAGE_NAME,
          sha256_cert_fingerprints: fingerprints,
        },
      },
    ],
    {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'public, max-age=300',
      },
    }
  );
}
