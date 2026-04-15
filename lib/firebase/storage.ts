import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './client';

export interface UploadResult {
  url: string;
  path: string;
  name: string;
}

export async function uploadHerbImage(
  file: File, 
  herbId: string, 
  imageIndex: number = 0
): Promise<UploadResult> {
  // Validate file
  if (!file.type.startsWith('image/')) {
    throw new Error('File must be an image');
  }
  
  if (file.size > 5 * 1024 * 1024) { // 5MB limit
    throw new Error('Image must be less than 5MB');
  }

  const timestamp = Date.now();
  const extension = file.name.split('.').pop();
  const path = `herbs/${herbId}/${timestamp}-${imageIndex}.${extension}`;
  
  const storageRef = ref(storage, path);
  
  // Upload with metadata
  const metadata = {
    contentType: file.type,
    customMetadata: {
      herbId,
      originalName: file.name,
      uploadedAt: new Date().toISOString()
    }
  };
  
  const snapshot = await uploadBytes(storageRef, file, metadata);
  const url = await getDownloadURL(snapshot.ref);
  
  return {
    url,
    path,
    name: file.name
  };
}

export async function uploadBulkHerbImages(
  files: File[], 
  herbName: string
): Promise<UploadResult[]> {
  const sanitizedName = herbName.toLowerCase().replace(/[^a-z0-9]/g, '-');
  const timestamp = Date.now();
  
  const uploadPromises = files.map(async (file, index) => {
    const extension = file.name.split('.').pop();
    const path = `herbs/bulk/${sanitizedName}-${timestamp}/${index}.${extension}`;
    const storageRef = ref(storage, path);
    
    const metadata = {
      contentType: file.type,
      customMetadata: {
        herbName,
        originalName: file.name,
        uploadedAt: new Date().toISOString()
      }
    };
    
    const snapshot = await uploadBytes(storageRef, file, metadata);
    const url = await getDownloadURL(snapshot.ref);
    
    return {
      url,
      path,
      name: file.name
    };
  });
  
  return Promise.all(uploadPromises);
}

export async function deleteHerbImage(path: string): Promise<void> {
  const storageRef = ref(storage, path);
  await deleteObject(storageRef);
}

export function getStoragePathFromUrl(url: string): string | null {
  // Extract path from Firebase Storage URL
  try {
    const urlObj = new URL(url);
    const pathMatch = urlObj.pathname.match(/\/o\/(.+?)(\?|$)/);
    if (pathMatch) {
      return decodeURIComponent(pathMatch[1]);
    }
    return null;
  } catch {
    return null;
  }
}