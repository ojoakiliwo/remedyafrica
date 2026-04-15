'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { uploadHerbImage } from '@/lib/firebase/storage';
import { 
  Upload, 
  X, 
  Plus, 
  AlertCircle, 
  CheckCircle, 
  Loader2,
  Image as ImageIcon,
  Leaf
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function UploadHerbPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  
  const [formData, setFormData] = useState({
    name: '',
    scientificName: '',
    category: 'mental-wellness',
    description: '',
    longDescription: '',
    origin: '',
    partsUsed: '',
    preparation: '',
    dosage: '',
    warnings: '',
    benefits: '',
    uses: '',
    ailments: '',
    status: 'active' as 'active' | 'draft'
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
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

    if (validFiles.length + images.length > 4) {
      setError('Maximum 4 images allowed');
      return;
    }

    setImages(prev => [...prev, ...validFiles]);
    
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
    
    setError('');
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (images.length === 0) {
      setError('Please upload at least one image');
      return;
    }

    setLoading(true);
    setError('');
    setUploadProgress(0);

    try {
      // Parse arrays from comma-separated strings
      const benefitsArray = formData.benefits.split(',').map(b => b.trim()).filter(b => b);
      const usesArray = formData.uses.split(',').map(u => u.trim()).filter(u => u);
      const warningsArray = formData.warnings.split(',').map(w => w.trim()).filter(w => w);
      const ailmentsArray = formData.ailments.split(',').map(a => a.trim()).filter(a => a);

      // Create herb document first to get ID
      const herbRef = await addDoc(collection(db, 'herbs'), {
        name: formData.name,
        scientificName: formData.scientificName,
        category: formData.category,
        description: formData.description,
        longDescription: formData.longDescription,
        origin: formData.origin,
        partsUsed: formData.partsUsed,
        preparation: formData.preparation,
        dosage: formData.dosage,
        benefits: benefitsArray,
        uses: usesArray,
        warnings: warningsArray,
        ailments: ailmentsArray,
        images: [],
        rating: 0,
        reviews: 0,
        views: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        status: formData.status
      });

      // Upload images to Firebase Storage
      const imageUrls = [];
      for (let i = 0; i < images.length; i++) {
        const result = await uploadHerbImage(images[i], herbRef.id, i);
        imageUrls.push({
          url: result.url,
          path: result.path,
          name: result.name
        });
        setUploadProgress(((i + 1) / images.length) * 100);
      }

      // Update with image URLs
      const { updateDoc, doc } = await import('firebase/firestore');
      await updateDoc(doc(db, 'herbs', herbRef.id), {
        images: imageUrls
      });

      setSuccess(true);
      
      // Reset form
      setFormData({
        name: '',
        scientificName: '',
        category: 'mental-wellness',
        description: '',
        longDescription: '',
        origin: '',
        partsUsed: '',
        preparation: '',
        dosage: '',
        warnings: '',
        benefits: '',
        uses: '',
        ailments: '',
        status: 'active'
      });
      setImages([]);
      setImagePreviews([]);
      
    } catch (err: any) {
      console.error('Upload error:', err);
      setError('Upload failed: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-[#2C3E2D] mb-4">Upload Successful!</h2>
          <p className="text-gray-600 mb-6">The herb has been saved to Firebase with images.</p>
          <div className="space-x-4">
            <button 
              onClick={() => setSuccess(false)}
              className="bg-[#97A97C] text-white px-6 py-2 rounded hover:bg-[#7A8A63]"
            >
              Upload Another
            </button>
            <Link href="/admin" className="text-[#97A97C] hover:underline">
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-[#2C3E2D] text-white p-6">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Leaf className="w-8 h-8 text-[#97A97C]" />
            <div>
              <h1 className="text-2xl font-bold">Upload New Herb</h1>
              <p className="text-gray-300 text-sm">Add to Firebase database with Storage images</p>
            </div>
          </div>
          <Link href="/admin" className="text-sm hover:underline">← Back to Admin</Link>
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
          
          {/* Images Upload Section */}
          <div className="bg-white p-6 rounded-lg shadow">
            <label className="block font-bold text-[#2C3E2D] mb-4 flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-[#97A97C]" />
              Herb Images (Max 4) *
            </label>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              {imagePreviews.map((preview, index) => (
                <div key={index} className="relative aspect-square rounded-lg overflow-hidden border-2 border-[#97A97C]">
                  <img src={preview} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    title="Remove image"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              
              {images.length < 4 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center hover:border-[#97A97C] hover:bg-[#97A97C]/5 transition-colors"
                >
                  <Plus className="w-8 h-8 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-500">Add Image</span>
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
              aria-label="Upload herb images"
              title="Select herb images to upload"
              placeholder="Choose herb images"
            />
            
            <p className="text-sm text-gray-500">
              Upload images directly to Firebase Storage. Max 5MB per image. Supported: JPG, PNG, WebP.
            </p>
          </div>

          {/* Basic Info */}
          <div className="bg-white p-6 rounded-lg shadow space-y-4">
            <h2 className="text-lg font-bold text-[#2C3E2D] mb-4">Basic Information</h2>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="herb-name" className="block font-bold text-[#2C3E2D] mb-1">Herb Name *</label>
                <input 
                  type="text" 
                  id="herb-name"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded"
                  placeholder="e.g., Ashwagandha"
                />
              </div>
              <div>
                <label htmlFor="scientific-name" className="block font-bold text-[#2C3E2D] mb-1">Scientific Name *</label>
                <input 
                  type="text" 
                  id="scientific-name"
                  name="scientificName"
                  required
                  value={formData.scientificName}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded italic"
                  placeholder="e.g., Withania somnifera"
                />
              </div>
            </div>

            <div>
              <label htmlFor="category-select" className="block font-bold text-[#2C3E2D] mb-1">Category</label>
              <select 
                id="category-select"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded"
                title="Select herb category"
              >
                <option value="mental-wellness">Mental Wellness</option>
                <option value="pain-relief">Pain Relief</option>
                <option value="digestive-health">Digestive Health</option>
                <option value="immune-support">Immune Support</option>
                <option value="skin-care">Skin Care</option>
                <option value="respiratory">Respiratory Health</option>
              </select>
            </div>

            <div>
              <label htmlFor="short-description" className="block font-bold text-[#2C3E2D] mb-1">Short Description *</label>
              <textarea 
                id="short-description"
                name="description"
                required
                value={formData.description}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded"
                rows={2}
                placeholder="Brief description for cards"
              />
            </div>

            <div>
              <label htmlFor="long-description" className="block font-bold text-[#2C3E2D] mb-1">Full Description</label>
              <textarea 
                id="long-description"
                name="longDescription"
                value={formData.longDescription}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded"
                rows={4}
                placeholder="Detailed description"
              />
            </div>
          </div>

          {/* Details */}
          <div className="bg-white p-6 rounded-lg shadow space-y-4">
            <h2 className="text-lg font-bold text-[#2C3E2D] mb-4">Usage & Safety</h2>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="origin" className="block font-bold text-[#2C3E2D] mb-1">Origin</label>
                <input 
                  type="text"
                  id="origin"
                  name="origin"
                  value={formData.origin}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded"
                  placeholder="e.g., India"
                />
              </div>
              <div>
                <label htmlFor="parts-used" className="block font-bold text-[#2C3E2D] mb-1">Parts Used</label>
                <input 
                  type="text"
                  id="parts-used"
                  name="partsUsed"
                  value={formData.partsUsed}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded"
                  placeholder="e.g., Root, leaves"
                />
              </div>
            </div>

            <div>
              <label htmlFor="preparation" className="block font-bold text-[#2C3E2D] mb-1">Preparation Method</label>
              <textarea 
                id="preparation"
                name="preparation"
                value={formData.preparation}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded"
                rows={3}
                placeholder="How to prepare the herb"
              />
            </div>

            <div>
              <label htmlFor="dosage" className="block font-bold text-[#2C3E2D] mb-1">Dosage</label>
              <input 
                type="text"
                id="dosage"
                name="dosage"
                value={formData.dosage}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded"
                placeholder="e.g., 1-2 cups daily, 500mg capsules"
              />
            </div>

            <div>
              <label htmlFor="benefits" className="block font-bold text-[#2C3E2D] mb-1">Benefits (comma-separated)</label>
              <input 
                type="text"
                id="benefits"
                name="benefits"
                value={formData.benefits}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded"
                placeholder="e.g., Reduces stress, Better sleep, Mental clarity"
              />
            </div>

            <div>
              <label htmlFor="uses" className="block font-bold text-[#2C3E2D] mb-1">Uses (comma-separated)</label>
              <input 
                type="text"
                id="uses"
                name="uses"
                value={formData.uses}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded"
                placeholder="e.g., Anxiety, Insomnia, Stress"
              />
            </div>

            <div>
              <label htmlFor="ailments" className="block font-bold text-[#2C3E2D] mb-1">
                Treats Ailments (comma-separated)
                <span className="text-sm font-normal text-gray-500 ml-2">- Links herb to ailment pages</span>
              </label>
              <input 
                type="text"
                id="ailments"
                name="ailments"
                value={formData.ailments}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded"
                placeholder="e.g., Anxiety, Stress, Insomnia, Depression"
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter ailment names exactly as they appear in the database.
              </p>
            </div>

            <div>
              <label htmlFor="warnings" className="block font-bold text-red-700 mb-1">⚠️ Warnings (comma-separated)</label>
              <input 
                type="text"
                id="warnings"
                name="warnings"
                value={formData.warnings}
                onChange={handleInputChange}
                className="w-full p-2 border border-red-300 rounded bg-red-50"
                placeholder="e.g., Avoid during pregnancy, May cause drowsiness"
              />
            </div>

            <div>
              <label htmlFor="status-select" className="block font-bold text-[#2C3E2D] mb-1">Status</label>
              <select 
                id="status-select"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded"
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
              disabled={loading}
              className="flex-1 bg-[#97A97C] hover:bg-[#7A8A63] h-12 text-lg"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Uploading... {Math.round(uploadProgress)}%
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5 mr-2" />
                  Save to Firebase
                </>
              )}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => window.location.href = '/admin'}
              disabled={loading}
              className="px-8"
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}