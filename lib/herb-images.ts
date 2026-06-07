/**
 * Normalize herb image data from various storage formats
 * Handles: imageUrl string, images: string[], images: {url: string}[]
 */

export function getHerbPrimaryImage(herb: any): string | undefined {
  if (!herb) return undefined;
  
  // Single imageUrl field (most common for simple uploads)
  if (herb.imageUrl && typeof herb.imageUrl === 'string') {
    return herb.imageUrl;
  }
  
  // images array
  if (Array.isArray(herb.images) && herb.images.length > 0) {
    const first = herb.images[0];
    // Array of strings
    if (typeof first === 'string') return first;
    // Array of objects with url property
    if (first && typeof first === 'object' && first.url) return first.url;
  }
  
  // Legacy image field
  if (herb.image && typeof herb.image === 'string') {
    return herb.image;
  }
  
  return undefined;
}

export function getHerbImages(herb: any): string[] {
  if (!herb) return [];
  
  const images: string[] = [];
  
  // Single imageUrl
  if (herb.imageUrl && typeof herb.imageUrl === 'string') {
    images.push(herb.imageUrl);
  }
  
  // images array
  if (Array.isArray(herb.images) && herb.images.length > 0) {
    herb.images.forEach((item: any) => {
      if (typeof item === 'string') {
        images.push(item);
      } else if (item && typeof item === 'object' && item.url) {
        images.push(item.url);
      }
    });
  }
  
  // Legacy image field
  if (herb.image && typeof herb.image === 'string') {
    images.push(herb.image);
  }
  
  // Deduplicate - use Array.from for compatibility with older TypeScript targets
  return Array.from(new Set(images));
}

export function getHerbImageCount(herb: any): number {
  return getHerbImages(herb).length;
}