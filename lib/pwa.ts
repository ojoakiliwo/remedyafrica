/** Intended Android application id for the Play Store TWA (Phase 2). */
export const ANDROID_PACKAGE_NAME =
  process.env.ANDROID_PACKAGE_NAME?.trim() || 'com.remedyafrica.app';

/**
 * SHA-256 fingerprint of the Play App Signing cert, colon-separated hex.
 * Set PLAY_ASSETLINKS_SHA256 on Vercel after creating the Play listing.
 * Until then /.well-known/assetlinks.json is published with the package
 * name only so Bubblewrap has a stable URL to point at.
 */
export const PLAY_ASSETLINKS_SHA256 = process.env.PLAY_ASSETLINKS_SHA256?.trim() || '';
