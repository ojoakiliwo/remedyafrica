/**
 * Normalize herb image data from various storage formats
 * Handles: imageUrl string, images: string[], images: {url: string}[]
 */

export interface HerbImageRecord {
  url: string;
  path?: string;
  name?: string;
}

export const MAX_HERB_IMAGES = 4;

/** Canonical list: the images[] array is the source of truth when present. */
export function normalizeHerbImageRecords(herb: any): HerbImageRecord[] {
  if (!herb) return [];

  const out: HerbImageRecord[] = [];
  const seen = new Set<string>();

  const push = (url?: unknown, extra?: Partial<HerbImageRecord>) => {
    if (typeof url !== 'string' || !url.trim()) return;
    const cleaned = ensureValidImageUrl(url.trim());
    if (!cleaned || seen.has(cleaned)) return;
    seen.add(cleaned);
    out.push({ url: cleaned, ...extra });
  };

  if (Array.isArray(herb.images)) {
    for (const item of herb.images) {
      if (typeof item === 'string') {
        push(item);
      } else if (item && typeof item === 'object' && item.url) {
        push(item.url, {
          path: typeof item.path === 'string' ? item.path : undefined,
          name: typeof item.name === 'string' ? item.name : undefined,
        });
      }
    }
  }

  // Fall back to legacy fields only when images[] is empty
  if (out.length === 0) {
    push(herb.imageUrl);
    push(herb.image);
  }

  return out;
}

export function getHerbPrimaryImage(herb: any): string | undefined {
  return normalizeHerbImageRecords(herb)[0]?.url;
}

export function getHerbImages(herb: any): string[] {
  return normalizeHerbImageRecords(herb).map((img) => img.url);
}

export function getHerbImageCount(herb: any): number {
  return getHerbImages(herb).length;
}

// Helper to fix Firebase Storage URL format
function ensureValidImageUrl(url: string): string {
  if (!url) return url;
  
  // If it's already a valid public URL, return as-is
  if (url.includes('?alt=media')) return url;
  
  // If it's a storage.googleapis.com URL, it needs to be publicly readable
  // The ?alt=media parameter is for Firebase REST API, NOT for direct GCS URLs
  if (url.includes('storage.googleapis.com')) {
    // These are direct GCS URLs - they work if the bucket is public
    // No query params needed, but we can try adding alt=media as fallback
    return url;
  }
  
  // If it's a firebasestorage.app URL (new format), return as-is
  if (url.includes('firebasestorage.app')) {
    return url;
  }
  
  // If it's a Firebase Storage download URL (firebasestorage.googleapis.com)
  if (url.includes('firebasestorage.googleapis.com')) {
    // These should already have tokens, but ensure alt=media is present
    if (!url.includes('?')) {
      return url + '?alt=media';
    }
    return url;
  }
  
  return url;
}