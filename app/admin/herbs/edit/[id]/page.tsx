'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { useAuth } from '@/hooks/useAuth';
import { uploadHerbImage } from '@/lib/firebase/storage';
import { 
  Plus, 
  AlertCircle, 
  CheckCircle, 
  Loader2,
  Image as ImageIcon,
  Leaf,
  ArrowLeft,
  Save,
  Trash2,
  Link as LinkIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';

interface HerbImage {
  url: string;
  path?: string;
  name?: string;
}

interface HerbData {
  name: string;
  scientificName: string;
  category: string;
  description: string;
  longDescription: string;
  origin: string;
  partsUsed: string;
  preparation: string;
  dosage: string;
  warnings: string[];
  benefits: string[];
  uses: string[];
  ailments: string[];
  status: 'active' | 'draft';
  images: HerbImage[];
}

const VALID_CATEGORIES = [
  { value: 'mental-wellness', label: 'Mental Wellness' },
  { value: 'pain-relief', label: 'Pain Relief' },
  { value: 'digestive-health', label: 'Digestive Health' },
  { value: 'immune-support', label: 'Immune Support' },
  { value: 'skin-care', label: 'Skin Care' },
  { value: 'respiratory', label: 'Respiratory Health' },
  { value: 'womens-health', label: "Women's Health" },
  { value: 'mens-health', label: "Men's Health" },
  { value: 'uncategorized', label: 'Uncategorized' }
];

export default function EditHerbPage() {
  const router = useRouter();
  const params = useParams();
  const herbId = params.id as string;
  
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<HerbImage[]>([]);
  const [imageUrlInput, setImageUrlInput] = useState('');
  
  const [formData, setFormData] = useState<HerbData>({
    name: '',
    scientificName: '',
    category: 'mental-wellness',
    description: '',
    longDescription: '',
    origin: '',
    partsUsed: '',
    preparation: '',
    dosage: '',
    warnings: [],
    benefits: [],
    uses: [],
    ailments: [],
    status: 'active',
    images: []
  });

  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) {
        router.push('/login');
        return;
      }
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists() && userDoc.data().role === 'admin') {
          setIsAdmin(true);
        } else {
          toast.error('Access denied. Admin only.');
          router.push('/');
          return;
        }
      } catch (err) {
        console.error('Error checking admin:', err);
        router.push('/');
      } finally {
        setCheckingAdmin(false);
      }
    };
    checkAdmin();
  }, [user, router]);

  useEffect(() => {
    if (!isAdmin || !herbId) return;
    
    const fetchHerb = async () => {
      try {
        const herbDoc = await getDoc(doc(db, 'herbs', herbId));
        if (!herbDoc.exists()) {
          setError('Herb not found');
          setLoading(false);
          return;
        }
        
        const data = herbDoc.data();
        
        setFormData({
          name: data.name || '',
          scientificName: data.scientificName || '',
          category: VALID_CATEGORIES.find(c => c.value === data.category) ? data.category : 'mental-wellness',
          description: data.description || '',
          longDescription: data.longDescription || '',
          origin: data.origin || '',
          partsUsed: data.partsUsed || '',
          preparation: data.preparation || '',
          dosage: data.dosage || '',
          warnings: Array.isArray(data.warnings) ? data.warnings : [],
          benefits: Array.isArray(data.benefits) ? data.benefits : [],
          uses: Array.isArray(data.uses) ? data.uses : [],
          ailments: Array.isArray(data.ailments) ? data.ailments : [],
          status: data.status === 'draft' ? 'draft' : 'active',
          images: Array.isArray(data.images) ? data.images : []
        });
        
        setExistingImages(Array.isArray(data.images) ? data.images : []);
      } catch (err) {
        console.error('Error fetching herb:', err);
        setError('Failed to load herb data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchHerb();
  }, [isAdmin, herbId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value } as HerbData));
    setError('');
  };

  const handleArrayInputChange = (field: 'warnings' | 'benefits' | 'uses' | 'ailments', value: string) => {
    const array = value.split(',').map(s => s.trim()).filter(s => s);
    setFormData(prev => {
      if (field === 'warnings') return { ...prev, warnings: array };
      if (field === 'benefits') return { ...prev, benefits: array };
      if (field === 'uses') return { ...prev, uses: array };
      return { ...prev, ailments: array };
    });
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        setError(`${file.name} is not an image`);
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError(`${file.name} is larger than 5MB`);
        return false;
      }
      return true;
    });

    const totalImages = existingImages.length + newImages.length + validFiles.length;
    if (totalImages > 4) {
      setError('Maximum 4 images allowed');
      return;
    }

    setNewImages(prev => [...prev, ...validFiles]);
    
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewImagePreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
    
    setError('');
  };

  const removeNewImage = (index: number) => {
    setNewImages(prev => prev.filter((_, i) => i !== index));
    setNewImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (index: number) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddImageUrl = () => {
    if (!imageUrlInput.trim()) return;
    
    if (existingImages.length + newImages.length >= 4) {
      setError('Maximum 4 images allowed');
      return;
    }

    try {
      new URL(imageUrlInput);
    } catch {
      setError('Please enter a valid URL');
      return;
    }

    setExistingImages(prev => [...prev, { url: imageUrlInput.trim() }]);
    setImageUrlInput('');
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.scientificName.trim()) {
      setError('Herb name and scientific name are required');
      return;
    }

    setSaving(true);
    setError('');
    setUploadProgress(0);

    try {
      const uploadedImageUrls: HerbImage[] = [];
      for (let i = 0; i < newImages.length; i++) {
        const result = await uploadHerbImage(newImages[i], herbId, existingImages.length + i);
        uploadedImageUrls.push({
          url: result.url,
          path: result.path,
          name: result.name
        });
        setUploadProgress(((i + 1) / newImages.length) * 100);
      }

      const finalImages = [...existingImages, ...uploadedImageUrls];

      const updateData = {
        name: formData.name.trim(),
        scientificName: formData.scientificName.trim(),
        category: formData.category,
        description: formData.description,
        longDescription: formData.longDescription,
        origin: formData.origin,
        partsUsed: formData.partsUsed,
        preparation: formData.preparation,
        dosage: formData.dosage,
        benefits: formData.benefits,
        uses: formData.uses,
        warnings: formData.warnings,
        ailments: formData.ailments,
        images: finalImages,
        status: formData.status,
        updatedAt: serverTimestamp(),
        searchKeywords: [
          formData.name.toLowerCase(),
          formData.scientificName.toLowerCase(),
          formData.category,
          ...formData.benefits.map(b => b.toLowerCase()),
          ...formData.ailments.map(a => a.toLowerCase()),
          ...formData.uses.map(u => u.toLowerCase())
        ].filter(Boolean)
      };

      await updateDoc(doc(db, 'herbs', herbId), updateData);

      setSuccess(true);
      setNewImages([]);
      setNewImagePreviews([]);
      setExistingImages(finalImages);
      
    } catch (err: any) {
      console.error('Update error:', err);
      setError('Update failed: ' + (err.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  if (checkingAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-[#97A97C] animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 font-semibold text-lg">Access denied. Admin only.</p>
          <Button onClick={() => router.push('/')} className="mt-4 bg-[#97A97C]">
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-[#97A97C] animate-spin" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-[#2C3E2D] mb-4">Update Successful!</h2>
          <p className="text-gray-600 mb-6">The herb has been updated in Firebase.</p>
          <div className="flex gap-4 justify-center">
            <Button 
              onClick={() => setSuccess(false)}
              className="bg-[#97A97C] hover:bg-[#7A8A63] text-white"
            >
              Edit Again
            </Button>
            <Link href="/admin/herbs/list">
              <Button variant="outline">
                Back to List
              </Button>
            </Link>
            <Link href={`/herb/${herbId}`}>
              <Button variant="outline">
                View Herb
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-[#2C3E2D] text-white p-6">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Leaf className="w-8 h-8 text-[#97A97C]" />
            <div>
              <h1 className="text-2xl font-bold">Edit Herb</h1>
              <p className="text-gray-300 text-sm">Update {formData.name || 'herb'} details and images</p>
            </div>
          </div>
          <Link href="/admin/herbs/list">
            <Button variant="outline" className="border-white/30 text-white hover:bg-white/10">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to List
            </Button>
          </Link>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-8">
        {error && (
          <Alert className="mb-6 bg-red-50 border-red-200">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Images Section */}
          <div className="bg-white p-6 rounded-lg shadow">
            <label className="block font-bold text-[#2C3E2D] mb-4 flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-[#97A97C]" />
              Herb Images ({existingImages.length + newImages.length}/4)
            </label>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              {existingImages.map((img, index) => (
                <div key={`existing-${index}`} className="relative aspect-square rounded-lg overflow-hidden border-2 border-[#97A97C]">
                  <img src={img.url} alt={`Herb ${index + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeExistingImage(index)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    aria-label={`Remove image ${index + 1}`}
                    title="Remove image"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              
              {newImagePreviews.map((preview, index) => (
                <div key={`new-${index}`} className="relative aspect-square rounded-lg overflow-hidden border-2 border-dashed border-[#B8860B]">
                  <img src={preview} alt={`New upload ${index + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeNewImage(index)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    aria-label={`Remove new image ${index + 1}`}
                    title="Remove image"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <span className="absolute bottom-1 left-1 bg-[#B8860B] text-white text-xs px-2 py-0.5 rounded">New</span>
                </div>
              ))}
              
              {existingImages.length + newImages.length < 4 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center hover:border-[#97A97C] hover:bg-[#97A97C]/5 transition-colors"
                  aria-label="Upload new image"
                  title="Upload new image"
                >
                  <Plus className="w-8 h-8 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-500">Upload</span>
                </button>
              )}
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageSelect}
              className="hidden"
              aria-label="Select herb images to upload"
              title="Select herb images"
            />

            {existingImages.length + newImages.length < 4 && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                  <LinkIcon className="w-4 h-4" />
                  Or add image by URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={imageUrlInput}
                    onChange={(e) => setImageUrlInput(e.target.value)}
                    placeholder="https://example.com/herb-image.jpg"
                    className="flex-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#97A97C] focus:border-transparent outline-none text-sm"
                    aria-label="Image URL"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddImageUrl}
                    disabled={!imageUrlInput.trim()}
                    className="text-sm"
                    aria-label="Add image URL"
                  >
                    Add URL
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Paste a direct image link from Wikipedia, Wikimedia Commons, or Unsplash
                </p>
              </div>
            )}
          </div>

          {/* Basic Info */}
          <div className="bg-white p-6 rounded-lg shadow space-y-4">
            <h2 className="text-lg font-bold text-[#2C3E2D] mb-4">Basic Information</h2>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-[#2C3E2D] mb-1">Herb Name *</label>
                <input 
                  type="text" 
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., Ashwagandha"
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#97A97C] focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block font-bold text-[#2C3E2D] mb-1">Scientific Name *</label>
                <input 
                  type="text" 
                  name="scientificName"
                  required
                  value={formData.scientificName}
                  onChange={handleInputChange}
                  placeholder="e.g., Withania somnifera"
                  className="w-full p-2 border border-gray-300 rounded italic focus:ring-2 focus:ring-[#97A97C] focus:border-transparent outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-[#2C3E2D] mb-1">Category</label>
              <select 
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#97A97C] focus:border-transparent outline-none"
                aria-label="Herb category"
                title="Select herb category"
              >
                {VALID_CATEGORIES.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-[#2C3E2D] mb-1">Short Description *</label>
              <textarea 
                name="description"
                required
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Brief description for cards and listings"
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#97A97C] focus:border-transparent outline-none"
                rows={2}
              />
            </div>

            <div>
              <label className="block font-bold text-[#2C3E2D] mb-1">Full Description</label>
              <textarea 
                name="longDescription"
                value={formData.longDescription}
                onChange={handleInputChange}
                placeholder="Detailed description of the herb"
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#97A97C] focus:border-transparent outline-none"
                rows={4}
              />
            </div>
          </div>

          {/* Details */}
          <div className="bg-white p-6 rounded-lg shadow space-y-4">
            <h2 className="text-lg font-bold text-[#2C3E2D] mb-4">Usage & Safety</h2>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-[#2C3E2D] mb-1">Origin</label>
                <input 
                  type="text"
                  name="origin"
                  value={formData.origin}
                  onChange={handleInputChange}
                  placeholder="e.g., India, Ayurveda"
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#97A97C] focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block font-bold text-[#2C3E2D] mb-1">Parts Used</label>
                <input 
                  type="text"
                  name="partsUsed"
                  value={formData.partsUsed}
                  onChange={handleInputChange}
                  placeholder="e.g., Root, Leaves"
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#97A97C] focus:border-transparent outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-[#2C3E2D] mb-1">Preparation Method</label>
              <textarea 
                name="preparation"
                value={formData.preparation}
                onChange={handleInputChange}
                placeholder="How to prepare the herb"
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#97A97C] focus:border-transparent outline-none"
                rows={3}
              />
            </div>

            <div>
              <label className="block font-bold text-[#2C3E2D] mb-1">Dosage</label>
              <input 
                type="text"
                name="dosage"
                value={formData.dosage}
                onChange={handleInputChange}
                placeholder="e.g., 1-2 cups daily, 500mg capsules"
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#97A97C] focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-[#2C3E2D] mb-1">Benefits (comma-separated)</label>
              <input 
                type="text"
                value={formData.benefits.join(', ')}
                onChange={(e) => handleArrayInputChange('benefits', e.target.value)}
                placeholder="e.g., Reduces stress, Better sleep, Mental clarity"
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#97A97C] focus:border-transparent outline-none"
              />
              <p className="text-xs text-gray-500 mt-1">{formData.benefits.length} benefit(s) saved</p>
            </div>

            <div>
              <label className="block font-bold text-[#2C3E2D] mb-1">Uses (comma-separated)</label>
              <input 
                type="text"
                value={formData.uses.join(', ')}
                onChange={(e) => handleArrayInputChange('uses', e.target.value)}
                placeholder="e.g., Anxiety, Insomnia, Stress"
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#97A97C] focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-[#2C3E2D] mb-1">
                Treats Ailments (comma-separated)
              </label>
              <input 
                type="text"
                value={formData.ailments.join(', ')}
                onChange={(e) => handleArrayInputChange('ailments', e.target.value)}
                placeholder="e.g., Anxiety, Stress, Insomnia, Depression"
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#97A97C] focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-red-700 mb-1">Warnings (comma-separated)</label>
              <input 
                type="text"
                value={formData.warnings.join(', ')}
                onChange={(e) => handleArrayInputChange('warnings', e.target.value)}
                placeholder="e.g., Avoid during pregnancy, May cause drowsiness"
                className="w-full p-2 border border-red-300 rounded bg-red-50 focus:ring-2 focus:ring-red-300 focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-[#2C3E2D] mb-1">Status</label>
              <select 
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#97A97C] focus:border-transparent outline-none"
                aria-label="Publication status"
                title="Select publication status"
              >
                <option value="active">Active (published)</option>
                <option value="draft">Draft (hidden)</option>
              </select>
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-4">
            <Button 
              type="submit" 
              disabled={saving}
              className="flex-1 bg-[#97A97C] hover:bg-[#7A8A63] h-12 text-lg"
              aria-label="Save changes"
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Saving... {Math.round(uploadProgress)}%
                </>
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => router.push('/admin/herbs/list')}
              disabled={saving}
              className="px-8"
              aria-label="Cancel and return to list"
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}