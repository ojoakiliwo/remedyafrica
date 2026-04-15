'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { useAuth } from '@/providers/AuthProvider';
import { AlertCircle, Loader2, CheckCircle, Camera, X, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase/client';
import { toast } from 'sonner';

export default function PractitionerApplicationPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  
  // Profile picture state
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    console.log('Photo selected:', file?.name, file?.size);
    
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (JPG, PNG)');
      toast.error('Please select an image file');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('Image must be less than 2MB');
      toast.error('Image too large. Max 2MB');
      return;
    }

    setPhotoFile(file);
    setError(null);
    toast.success('Photo selected! Click Submit to upload.');
    
    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      console.log('Preview loaded');
      setPhotoPreview(reader.result as string);
    };
    reader.onerror = () => {
      console.error('FileReader error');
      toast.error('Failed to load preview');
    };
    reader.readAsDataURL(file);
  };

  const removePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    toast.info('Photo removed');
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log('Form submit started');
    setLoading(true);
    setError(null);
    
    // Check if user is logged in
    if (!user) {
      setError('Please sign in before submitting your application');
      toast.error('Please sign in first');
      setLoading(false);
      return;
    }
    
    const formData = new FormData(e.currentTarget);
    console.log('Form data collected');
    console.log('Photo file exists:', !!photoFile);
    
    try {
      let photoURL = '';
      
      // Upload photo if selected
      if (photoFile) {
        console.log('Starting photo upload...');
        setUploadingPhoto(true);
        
        const fileName = `${Date.now()}_${photoFile.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
        const storagePath = `practitioner-photos/${user.uid}/${fileName}`;
        console.log('Storage path:', storagePath);
        
        const storageRef = ref(storage, storagePath);
        
        console.log('Uploading bytes...');
        const uploadResult = await uploadBytes(storageRef, photoFile);
        console.log('Upload successful:', uploadResult.metadata.name);
        
        console.log('Getting download URL...');
        photoURL = await getDownloadURL(storageRef);
        console.log('Download URL obtained:', photoURL.substring(0, 50) + '...');
        
        setUploadingPhoto(false);
        toast.success('Photo uploaded!');
      } else {
        console.log('No photo to upload');
      }
      
      console.log('Saving to Firestore...');
      const docData = {
        fullName: formData.get('fullName'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        location: formData.get('location'),
        experience: Number(formData.get('experience')),
        specialty: formData.get('specialty'),
        certifications: formData.get('certifications'),
        bio: formData.get('bio'),
        whyJoin: formData.get('whyJoin'),
        photoURL: photoURL || '',
        userId: user.uid,
        status: 'pending',
        submittedAt: serverTimestamp()
      };
      
      console.log('Document data:', { ...docData, photoURL: photoURL ? '[PRESENT]' : '[EMPTY]' });
      
      const docRef = await addDoc(collection(db, 'practitioner_applications'), docData);
      console.log('Document written with ID:', docRef.id);
      
      toast.success('Application submitted successfully!');
      setSubmitted(true);
      window.scrollTo(0, 0);
    } catch (err: any) {
      console.error('Full error:', err);
      console.error('Error code:', err.code);
      console.error('Error message:', err.message);
      
      const errorMsg = err.message || 'Error submitting application. Please try again.';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
      setUploadingPhoto(false);
      console.log('Submit finished');
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#F5F5F0] flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-[#2C3E2D] mb-4">Application Received!</h1>
          <p className="text-gray-600 mb-6">
            Thank you for your interest. Our team will review your credentials and respond within 5-7 business days.
          </p>
          <Link href="/" className="text-[#97A97C] hover:underline font-medium">
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F0] py-12 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <Link href="/pricing" className="text-[#97A97C] hover:underline mb-4 inline-block">
          ← Back to Pricing
        </Link>
        
        <h1 className="text-3xl font-bold text-[#2C3E2D] mb-2">Apply as a Practitioner</h1>
        <p className="text-gray-600 mb-8">Join our network of traditional healers. All fields are required.</p>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-red-800 font-medium">Submission Error</p>
              <p className="text-red-700 text-sm">{error}</p>
              {!user && (
                <Link href="/login" className="text-red-600 underline text-sm mt-2 inline-block">
                  Go to Login
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Auth Warning */}
        {!user && !error && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-orange-800 font-medium">Authentication Required</p>
              <p className="text-orange-700 text-sm">Please sign in before submitting your application.</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6" id="application-form">
          
          {/* Profile Photo Upload */}
          <div className="bg-gray-50 p-6 rounded-lg border-2 border-dashed border-gray-300 hover:border-[#97A97C] transition-colors">
            <h2 className="text-lg font-semibold text-[#2C3E2D] mb-4 flex items-center gap-2">
              <Camera className="w-5 h-5 text-[#97A97C]" />
              Profile Photo
            </h2>
            
            <div className="flex flex-col items-center gap-4">
              {/* Preview Area */}
              <div className="relative">
                {photoPreview ? (
                  <>
                    <img 
                      src={photoPreview} 
                      alt="Profile preview" 
                      className="w-32 h-32 rounded-full object-cover border-4 border-[#97A97C]"
                    />
                    <button
                      type="button"
                      onClick={removePhoto}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 shadow-lg"
                      title="Remove photo"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <div className="w-32 h-32 rounded-full bg-[#97A97C]/10 flex items-center justify-center border-4 border-dashed border-[#97A97C]">
                    <User className="w-12 h-12 text-[#97A97C]" />
                  </div>
                )}
              </div>
              
              {/* Upload Controls */}
              <div className="text-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handlePhotoSelect}
                  className="hidden"
                  id="photo-upload"
                />
                <label 
                  htmlFor="photo-upload"
                  className="cursor-pointer bg-[#97A97C] text-white px-4 py-2 rounded-lg hover:bg-[#7A8A63] transition-colors inline-flex items-center gap-2"
                >
                  <Camera className="w-4 h-4" />
                  {photoPreview ? 'Change Photo' : 'Upload Photo'}
                </label>
                <p className="text-sm text-gray-500 mt-2">
                  Optional but recommended. Max 2MB, JPG/PNG.
                </p>
                {photoFile && (
                  <p className="text-xs text-green-600 mt-1">
                    ✓ {photoFile.name} selected
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="fullName" className="block font-semibold text-[#2C3E2D] mb-2">Full Name *</label>
              <input 
                id="fullName"
                name="fullName"
                type="text" 
                required
                disabled={loading}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#97A97C] focus:border-transparent disabled:opacity-50"
                placeholder="Your legal name"
              />
            </div>
            <div>
              <label htmlFor="email" className="block font-semibold text-[#2C3E2D] mb-2">Email *</label>
              <input 
                id="email"
                name="email"
                type="email" 
                required
                disabled={loading}
                defaultValue={user?.email || ''}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#97A97C] focus:border-transparent disabled:opacity-50"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="phone" className="block font-semibold text-[#2C3E2D] mb-2">Phone Number *</label>
              <input 
                id="phone"
                name="phone"
                type="tel" 
                required
                disabled={loading}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#97A97C] focus:border-transparent disabled:opacity-50"
                placeholder="+234 800 000 0000"
              />
            </div>
            <div>
              <label htmlFor="location" className="block font-semibold text-[#2C3E2D] mb-2">Location (City, Country) *</label>
              <input 
                id="location"
                name="location"
                type="text" 
                required
                disabled={loading}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#97A97C] focus:border-transparent disabled:opacity-50"
                placeholder="Lagos, Nigeria"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="experience" className="block font-semibold text-[#2C3E2D] mb-2">Years of Experience *</label>
              <input 
                id="experience"
                name="experience"
                type="number" 
                required
                min="1"
                disabled={loading}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#97A97C] focus:border-transparent disabled:opacity-50"
              />
            </div>
            <div>
              <label htmlFor="specialty" className="block font-semibold text-[#2C3E2D] mb-2">Primary Specialty *</label>
              <select 
                id="specialty"
                name="specialty"
                required
                disabled={loading}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#97A97C] focus:border-transparent disabled:opacity-50"
              >
                <option value="">Select specialty...</option>
                <option value="mental-wellness">Mental Wellness</option>
                <option value="pain-relief">Pain Relief</option>
                <option value="digestive-health">Digestive Health</option>
                <option value="immune-support">Immune Support</option>
                <option value="skin-care">Skin Care</option>
                <option value="women-health">Women's Health</option>
                <option value="children-health">Children's Health</option>
                <option value="general">General Practice</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="certifications" className="block font-semibold text-[#2C3E2D] mb-2">Certifications & Training *</label>
            <textarea 
              id="certifications"
              name="certifications"
              required
              rows={3}
              disabled={loading}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#97A97C] focus:border-transparent disabled:opacity-50"
              placeholder="List your certifications, apprenticeships, or traditional training..."
            />
          </div>

          <div>
            <label htmlFor="bio" className="block font-semibold text-[#2C3E2D] mb-2">Professional Bio *</label>
            <textarea 
              id="bio"
              name="bio"
              required
              rows={4}
              disabled={loading}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#97A97C] focus:border-transparent disabled:opacity-50"
              placeholder="Tell us about your healing practice, philosophy, and experience..."
            />
          </div>

          <div>
            <label htmlFor="whyJoin" className="block font-semibold text-[#2C3E2D] mb-2">Why do you want to join RemedyAfrica? *</label>
            <textarea 
              id="whyJoin"
              name="whyJoin"
              required
              rows={3}
              disabled={loading}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#97A97C] focus:border-transparent disabled:opacity-50"
              placeholder="Explain your motivation for joining our platform..."
            />
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> We verify all practitioners. You may be asked to provide:
            </p>
            <ul className="text-sm text-blue-700 list-disc list-inside mt-2">
              <li>Photo ID</li>
              <li>Proof of training/certification</li>
              <li>References from 2 patients</li>
              <li>Video interview</li>
            </ul>
          </div>

          <button 
            type="submit" 
            disabled={loading || uploadingPhoto}
            className="w-full bg-[#97A97C] text-white py-4 rounded-lg font-bold hover:bg-[#7A8A63] disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {loading || uploadingPhoto ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {uploadingPhoto ? 'Uploading Photo...' : 'Submitting...'}
              </>
            ) : (
              'Submit Application'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}