import { db, storage } from './client';
import {
  collection,
  addDoc,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

export interface HerbData {
  name: string;
  scientificName: string;
  category: string;
  description: string;
  longDescription?: string;
  origin?: string;
  partsUsed?: string;
  preparation?: string;
  dosage?: string;
  benefits: string[];
  uses?: string[];
  warnings: string[];
  sideEffects?: string[];
  interactions?: string[];
  rating?: number;
  reviews?: number;
  images: string[];
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  status: 'active' | 'draft' | 'archived';
}

// Upload image to Firebase Storage
export async function uploadHerbImage(file: File, herbId: string, index: number): Promise<string> {
  const storageRef = ref(storage, `herbs/${herbId}/image-${index}-${Date.now()}`);
  await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(storageRef);
  return downloadURL;
}

// Add new herb to Firestore
export async function addHerb(herbData: Omit<HerbData, 'id'>, imageFiles: File[]): Promise<string> {
  try {
    // 1. Add herb document to Firestore first (to get ID)
    const docRef = await addDoc(collection(db, 'herbs'), {
      ...herbData,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // 2. Upload images and get URLs
    const imageUrls: string[] = [];
    for (let i = 0; i < imageFiles.length; i++) {
      const url = await uploadHerbImage(imageFiles[i], docRef.id, i);
      imageUrls.push(url);
    }

    // 3. Update herb document with image URLs
    await updateDoc(doc(db, 'herbs', docRef.id), {
      images: imageUrls,
      updatedAt: new Date(),
    });

    return docRef.id;
  } catch (error) {
    console.error('Error adding herb:', error);
    throw error;
  }
}

// Get all herbs
export async function getAllHerbs(): Promise<(HerbData & { id: string })[]> {
  const querySnapshot = await getDocs(collection(db, 'herbs'));
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  } as HerbData & { id: string }));
}

// Get herbs by category
export async function getHerbsByCategory(category: string): Promise<(HerbData & { id: string })[]> {
  const q = query(collection(db, 'herbs'), where('category', '==', category));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  } as HerbData & { id: string }));
}

// Get single herb by ID
export async function getHerbById(id: string): Promise<(HerbData & { id: string }) | null> {
  const docRef = doc(db, 'herbs', id);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return {
      id: docSnap.id,
      ...docSnap.data(),
    } as HerbData & { id: string };
  }
  return null;
}

// Update herb
export async function updateHerb(id: string, updates: Partial<HerbData>): Promise<void> {
  const docRef = doc(db, 'herbs', id);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: new Date(),
  });
}

// Delete herb and its images
export async function deleteHerb(id: string, imageUrls: string[]): Promise<void> {
  // Delete images from storage
  for (const url of imageUrls) {
    try {
      const imageRef = ref(storage, url);
      await deleteObject(imageRef);
    } catch (e) {
      console.error('Error deleting image:', e);
    }
  }

  // Delete document
  await deleteDoc(doc(db, 'herbs', id));
}