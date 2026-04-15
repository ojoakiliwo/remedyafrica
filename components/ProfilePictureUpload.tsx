'use client';

import { useState, useRef, useCallback } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore'; // Changed from updateDoc to setDoc
import { auth, db, storage } from '@/lib/firebase/client';
import { Button } from '@/components/ui/button';
import { Camera, X, Loader2, User } from 'lucide-react';
import { toast } from 'sonner';

interface ProfilePictureUploadProps {
  currentPhotoURL?: string | null;
  userId: string;
  onUpdate?: (url: string) => void;
  size?: 'sm' | 'md' | 'lg';
}

export default function ProfilePictureUpload({ 
  currentPhotoURL, 
  userId, 
  onUpdate,
  size = 'md' 
}: ProfilePictureUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentPhotoURL || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-24 h-24',
    lg: 'w-32 h-32'
  };

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('=== FILE SELECT TRIGGERED ===');
    
    const file = e.target.files?.[0];
    console.log('File selected:', file?.name, 'Size:', file?.size);
    
    if (!file) {
      console.log('No file selected');
      return;
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please select a valid image (JPG, PNG, WebP)');
      return;
    }

    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image too large. Max 2MB.');
      return;
    }

    // Show preview immediately
    const reader = new FileReader();
    reader.onloadend = () => {
      console.log('Preview loaded');
      setPreview(reader.result as string);
    };
    reader.onerror = () => {
      console.error('FileReader error');
      toast.error('Failed to load preview');
    };
    reader.readAsDataURL(file);

    // Start upload
    setUploading(true);
    toast.info('Uploading...');

    try {
      console.log('Starting upload...');
      console.log('User ID:', userId);
      
      const timestamp = Date.now();
      const safeFileName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
      const storagePath = `profile-pictures/${userId}/${timestamp}_${safeFileName}`;
      
      console.log('Storage path:', storagePath);
      
      const storageRef = ref(storage, storagePath);
      console.log('Storage ref created');

      console.log('Uploading bytes...');
      const uploadResult = await uploadBytes(storageRef, file);
      console.log('Upload success:', uploadResult.metadata.name);

      console.log('Getting download URL...');
      const downloadURL = await getDownloadURL(storageRef);
      console.log('Got URL:', downloadURL.substring(0, 50));

      // Update Firebase Auth
      const currentUser = auth.currentUser;
      if (currentUser) {
        console.log('Updating Auth profile...');
        await updateProfile(currentUser, { photoURL: downloadURL });
        console.log('Auth updated');
      }

      // Update Firestore using setDoc with merge (creates if doesn't exist)
      console.log('Updating Firestore...');
      await setDoc(doc(db, 'users', userId), {
        photoURL: downloadURL,
        updatedAt: new Date(),
        userId: userId
      }, { merge: true }); // merge: true prevents overwriting other fields
      console.log('Firestore updated');

      // Update state
      setPreview(downloadURL);
      onUpdate?.(downloadURL);
      
      toast.success('Photo updated!');
      
    } catch (error: any) {
      console.error('=== UPLOAD ERROR ===');
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Full error:', error);
      
      // Revert preview
      setPreview(currentPhotoURL || null);
      
      // Show error
      if (error.code === 'permission-denied' || error.code === 'storage/unauthorized') {
        toast.error('Permission denied. Check Firebase rules.');
      } else if (error.code === 'storage/canceled') {
        toast.error('Upload canceled.');
      } else if (error.code === 'storage/quota-exceeded') {
        toast.error('Storage quota exceeded.');
      } else if (error.code === 'storage/network-error') {
        toast.error('Network error. Check connection.');
      } else {
        toast.error('Upload failed: ' + (error.message || 'Unknown error'));
      }
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [currentPhotoURL, onUpdate, userId]);

  const handleRemove = async () => {
    if (!confirm('Remove your profile picture?')) return;
    
    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        await updateProfile(currentUser, { photoURL: null });
      }
      
      // Use setDoc with merge for remove as well
      await setDoc(doc(db, 'users', userId), {
        photoURL: null,
        updatedAt: new Date()
      }, { merge: true });
      
      setPreview(null);
      onUpdate?.('');
      toast.success('Photo removed');
    } catch (error: any) {
      console.error('Remove error:', error);
      toast.error('Failed to remove photo: ' + (error.message || 'Unknown error'));
    }
  };

  const triggerFileInput = () => {
    console.log('Triggering file input');
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className={`relative ${sizeClasses[size]} group`}>
        {/* Image or placeholder */}
        {preview ? (
          <img 
            src={preview} 
            alt="Profile" 
            className={`${sizeClasses[size]} rounded-full object-cover border-2 border-[#97A97C]`}
          />
        ) : (
          <div className={`${sizeClasses[size]} rounded-full bg-[#97A97C]/10 flex items-center justify-center border-2 border-dashed border-[#97A97C]`}>
            <User className="w-1/3 h-1/3 text-[#97A97C]" />
          </div>
        )}

        {/* Upload overlay */}
        {!uploading && (
          <button
            type="button"
            onClick={triggerFileInput}
            aria-label="Upload profile photo"
            title="Upload profile photo"
            className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
          >
            <Camera className="w-6 h-6 text-white" />
          </button>
        )}

        {/* Loading spinner */}
        {uploading && (
          <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-white animate-spin" />
          </div>
        )}

        {/* Remove button */}
        {preview && !uploading && (
          <button
            type="button"
            onClick={handleRemove}
            aria-label="Remove profile photo"
            title="Remove profile photo"
            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 shadow-md z-10"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/jpg"
        onChange={handleFileSelect}
        aria-label="Select profile photo"
        title="Select profile photo"
        className="hidden"
        disabled={uploading}
      />

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={triggerFileInput}
        disabled={uploading}
      >
        {uploading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Uploading...
          </>
        ) : preview ? (
          'Change Photo'
        ) : (
          <>
            <Camera className="w-4 h-4 mr-2" />
            Add Photo
          </>
        )}
      </Button>
    </div>
  );
}