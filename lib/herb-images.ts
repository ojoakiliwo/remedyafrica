/**
 * Normalize herb image data from various storage formats
 * Handles: imageUrl string, images: string[], images: {url: string}[]
 */

export function getHerbPrimaryImage(herb: any): string | undefined {
  if (!herb) return undefined;
  
  // Single imageUrl field (most common for simple uploads)
  if (herb.imageUrl && typeof herb.imageUrl === 'string') {
    return ensureValidImageUrl(herb.imageUrl);
  }
  
  // images array
  if (Array.isArray(herb.images) && herb.images.length > 0) {
    const first = herb.images[0];
    // Array of strings
    if (typeof first === 'string') return ensureValidImageUrl(first);
    // Array of objects with url property
    if (first && typeof first === 'object' && first.url) return ensureValidImageUrl(first.url);
  }
  
  // Legacy image field
  if (herb.image && typeof herb.image === 'string') {
    return ensureValidImageUrl(herb.image);
  }
  
  return undefined;
}

export function getHerbImages(herb: any): string[] {
  if (!herb) return [];
  
  const images: string[] = [];
  
  // Single imageUrl
  if (herb.imageUrl && typeof herb.imageUrl === 'string') {
    images.push(ensureValidImageUrl(herb.imageUrl));
  }
  
  // images array
  if (Array.isArray(herb.images) && herb.images.length > 0) {
    herb.images.forEach((item: any) => {
      if (typeof item === 'string') {
        images.push(ensureValidImageUrl(item));
      } else if (item && typeof item === 'object' && item.url) {
        images.push(ensureValidImageUrl(item.url));
      }
    });
  }
  
  // Legacy image field
  if (herb.image && typeof herb.image === 'string') {
    images.push(ensureValidImageUrl(herb.image));
  }
  
  // Deduplicate
  return Array.from(new Set(images));
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