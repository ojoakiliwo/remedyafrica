'use client';

import { useEffect, useRef, useState } from 'react';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { deleteHerbImage, MAX_HERB_IMAGE_BYTES, uploadHerbImage } from '@/lib/firebase/storage';
import {
  MAX_HERB_IMAGES,
  normalizeHerbImageRecords,
  type HerbImageRecord,
} from '@/lib/herb-images';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertCircle,
  CheckCircle,
  Image as ImageIcon,
  Loader2,
  Plus,
  Save,
  Trash2,
} from 'lucide-react';

function formatBytes(n: number) {
  return `${Math.round((n / (1024 * 1024)) * 10) / 10}MB`;
}

export default function HerbPhotoManager({ herbId }: { herbId: string }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [herbName, setHerbName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [existingImages, setExistingImages] = useState<HerbImageRecord[]>([]);
  const [removedPaths, setRemovedPaths] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const herbDoc = await getDoc(doc(db, 'herbs', herbId));
        if (!herbDoc.exists()) {
          setError('Herb not found');
          return;
        }
        const data = herbDoc.data();
        setHerbName(data.name || '');
        setExistingImages(normalizeHerbImageRecords(data));
      } catch (err) {
        console.error('Error loading herb photos:', err);
        setError('Failed to load herb photos');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [herbId]);

  const totalCount = existingImages.length + newImages.length;

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setError('');
    setSuccess('');

    const validFiles = files.filter((file) => {
      if (!file.type.startsWith('image/')) {
        setError(`${file.name} is not an image`);
        return false;
      }
      if (file.size > MAX_HERB_IMAGE_BYTES) {
        setError(`${file.name} is larger than ${formatBytes(MAX_HERB_IMAGE_BYTES)}`);
        return false;
      }
      return true;
    });

    if (existingImages.length + newImages.length + validFiles.length > MAX_HERB_IMAGES) {
      setError(`Maximum ${MAX_HERB_IMAGES} images allowed`);
      return;
    }

    setNewImages((prev) => [...prev, ...validFiles]);
    validFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewImagePreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeExistingImage = (index: number) => {
    const img = existingImages[index];
    if (img?.path) setRemovedPaths((prev) => [...prev, img.path as string]);
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
    setSuccess('');
  };

  const removeNewImage = (index: number) => {
    setNewImages((prev) => prev.filter((_, i) => i !== index));
    setNewImagePreviews((prev) => prev.filter((_, i) => i !== index));
    setSuccess('');
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    setUploadProgress(0);

    try {
      const uploaded: HerbImageRecord[] = [];
      for (let i = 0; i < newImages.length; i++) {
        const result = await uploadHerbImage(newImages[i], herbId, existingImages.length + i);
        uploaded.push({
          url: result.url,
          path: result.path,
          name: result.name,
        });
        setUploadProgress(((i + 1) / newImages.length) * 100);
      }

      const finalImages = [...existingImages, ...uploaded];
      await updateDoc(doc(db, 'herbs', herbId), {
        images: finalImages,
        imageUrl: finalImages[0]?.url || null,
        updatedAt: serverTimestamp(),
      });

      for (const path of removedPaths) {
        try {
          await deleteHerbImage(path);
        } catch {
          /* object may already be gone */
        }
      }

      setExistingImages(finalImages);
      setNewImages([]);
      setNewImagePreviews([]);
      setRemovedPaths([]);
      setSuccess(
        finalImages.length === 0
          ? 'Photos cleared. This herb has no images until you upload some.'
          : `Saved ${finalImages.length} photo${finalImages.length === 1 ? '' : 's'}.`
      );
    } catch (err: any) {
      console.error('Photo save error:', err);
      setError('Save failed: ' + (err.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-10 h-10 text-[#97A97C] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert className="bg-red-50 border-red-200">
          <AlertCircle className="w-4 h-4 text-red-600" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle className="w-4 h-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h2 className="font-bold text-[#2C3E2D] flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-[#97A97C]" />
              Photos for {herbName || 'this herb'}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Upload your own pictures here. {totalCount}/{MAX_HERB_IMAGES} used. JPG, PNG, or WebP, up to {formatBytes(MAX_HERB_IMAGE_BYTES)} each.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          {existingImages.map((img, index) => (
            <div key={`existing-${img.url}-${index}`} className="relative aspect-square rounded-lg overflow-hidden border-2 border-[#97A97C]">
              <img src={img.url} alt={`${herbName} ${index + 1}`} className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removeExistingImage(index)}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                aria-label={`Remove photo ${index + 1}`}
                title="Remove photo"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              {index === 0 && (
                <span className="absolute bottom-1 left-1 bg-[#2C3E2D] text-white text-xs px-2 py-0.5 rounded">
                  Primary
                </span>
              )}
            </div>
          ))}

          {newImagePreviews.map((preview, index) => (
            <div key={`new-${index}`} className="relative aspect-square rounded-lg overflow-hidden border-2 border-dashed border-[#B8860B]">
              <img src={preview} alt={`New upload ${index + 1}`} className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removeNewImage(index)}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                aria-label={`Remove new photo ${index + 1}`}
                title="Remove photo"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <span className="absolute bottom-1 left-1 bg-[#B8860B] text-white text-xs px-2 py-0.5 rounded">New</span>
            </div>
          ))}

          {totalCount < MAX_HERB_IMAGES && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center hover:border-[#97A97C] hover:bg-[#97A97C]/5 transition-colors"
              aria-label="Upload photos"
              title="Upload photos"
            >
              <Plus className="w-8 h-8 text-gray-400 mb-2" />
              <span className="text-sm text-gray-500">Add photos</span>
            </button>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/*"
          multiple
          onChange={handleImageSelect}
          className="hidden"
          aria-label="Select herb photos to upload"
          title="Select herb photos"
        />

        <Button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-[#97A97C] hover:bg-[#7A8A63] h-12 text-lg"
        >
          {saving ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Saving… {newImages.length ? `${Math.round(uploadProgress)}%` : ''}
            </>
          ) : (
            <>
              <Save className="w-5 h-5 mr-2" />
              Save photos
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
