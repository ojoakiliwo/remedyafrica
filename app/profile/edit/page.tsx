'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase/client';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { updateProfile, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Save, 
  Loader2,
  ArrowLeft,
  Camera
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function EditProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  
  const [profile, setProfile] = useState({
    displayName: '',
    email: '',
    phoneNumber: '',
    location: '',
    bio: '',
    photoURL: ''
  });
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPasswordChange, setShowPasswordChange] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (user) {
      loadProfile();
    }
  }, [user, authLoading, router]);

  const loadProfile = async () => {
    if (!user) return;
    
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.data();
      
      setProfile({
        displayName: user.displayName || '',
        email: user.email || '',
        phoneNumber: userData?.phoneNumber || '',
        location: userData?.location || '',
        bio: userData?.bio || '',
        photoURL: user.photoURL || userData?.photoURL || ''
      });
    } catch (error) {
      console.error('Error loading profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be less than 2MB');
      return;
    }

    setUploadingPhoto(true);
    
    try {
      // Import storage functions
      const { ref, uploadBytes, getDownloadURL } = await import('firebase/storage');
      const { storage } = await import('@/lib/firebase/client');
      
      const timestamp = Date.now();
      const safeName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
      const path = `profile-pictures/${user.uid}/${timestamp}_${safeName}`;
      
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      
      // Update Auth
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { photoURL: downloadURL });
      }
      
      // Update Firestore
      await setDoc(doc(db, 'users', user.uid), {
        photoURL: downloadURL,
        updatedAt: new Date()
      }, { merge: true });
      
      setProfile(prev => ({ ...prev, photoURL: downloadURL }));
      toast.success('Photo updated successfully!');
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error('Failed to upload photo');
    } finally {
      setUploadingPhoto(false);
      e.target.value = '';
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    try {
      // Update Firebase Auth profile
      await updateProfile(user, {
        displayName: profile.displayName
      });

      // Update Firestore
      await setDoc(doc(db, 'users', user.uid), {
        displayName: profile.displayName,
        phoneNumber: profile.phoneNumber,
        location: profile.location,
        bio: profile.bio,
        updatedAt: new Date()
      }, { merge: true });

      toast.success('Profile updated successfully!');
      router.push('/profile'); // Redirect to view page after save
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!user || !user.email) return;
    
    if (!currentPassword || !newPassword) {
      toast.error('Please fill in all password fields');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }

    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      
      toast.success('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setShowPasswordChange(false);
    } catch (error: any) {
      console.error('Password change error:', error);
      if (error.code === 'auth/wrong-password') {
        toast.error('Current password is incorrect');
      } else {
        toast.error('Failed to change password');
      }
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#F5F5F0] flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-[#97A97C] animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#F5F5F0] py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/profile">
            <Button variant="outline" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-[#2C3E2D]">Edit Profile</h1>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Left Column - Photo */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-xl shadow-md p-6 text-center">
              <h2 className="font-semibold text-[#2C3E2D] mb-4">Profile Picture</h2>
              
              <div className="relative w-32 h-32 mx-auto mb-4">
                {profile.photoURL ? (
                  <img 
                    src={profile.photoURL} 
                    alt="Profile" 
                    className="w-full h-full rounded-full object-cover border-4 border-[#97A97C]"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-[#97A97C]/10 flex items-center justify-center border-4 border-dashed border-[#97A97C]">
                    <User className="w-12 h-12 text-[#97A97C]" />
                  </div>
                )}
                
                {uploadingPhoto && (
                  <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                  </div>
                )}
              </div>

              <label className="cursor-pointer inline-block">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handlePhotoUpload}
                  disabled={uploadingPhoto}
                  className="hidden"
                />
                <span className="bg-[#97A97C] text-white px-4 py-2 rounded-lg hover:bg-[#7A8A63] transition-colors inline-flex items-center gap-2 text-sm">
                  <Camera className="w-4 h-4" />
                  {uploadingPhoto ? 'Uploading...' : profile.photoURL ? 'Change Photo' : 'Add Photo'}
                </span>
              </label>
              
              <p className="text-xs text-gray-500 mt-3">
                Max 2MB, JPG/PNG
              </p>
            </div>
          </div>

          {/* Right Column - Form */}
          <div className="md:col-span-2 space-y-6">
            {/* Basic Info */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-semibold text-[#2C3E2D] mb-6 flex items-center gap-2">
                <User className="w-5 h-5 text-[#97A97C]" />
                Basic Information
              </h2>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="displayName">Full Name</Label>
                  <Input
                    id="displayName"
                    value={profile.displayName}
                    onChange={(e) => setProfile({ ...profile, displayName: e.target.value })}
                    placeholder="Your full name"
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile.email}
                    disabled
                    className="bg-gray-100"
                  />
                  <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                </div>

                <div>
                  <Label htmlFor="phoneNumber" className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Phone Number
                  </Label>
                  <Input
                    id="phoneNumber"
                    value={profile.phoneNumber}
                    onChange={(e) => setProfile({ ...profile, phoneNumber: e.target.value })}
                    placeholder="+1234567890"
                  />
                </div>

                <div>
                  <Label htmlFor="location" className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Location
                  </Label>
                  <Input
                    id="location"
                    value={profile.location}
                    onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                    placeholder="City, Country"
                  />
                </div>

                <div>
                  <Label htmlFor="bio">Bio</Label>
                  <textarea
                    id="bio"
                    value={profile.bio}
                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                    placeholder="Tell us about yourself..."
                    rows={4}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#97A97C]"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-[#97A97C] hover:bg-[#7A8A63] text-white"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
                
                <Link href="/profile">
                  <Button variant="outline">
                    Cancel
                  </Button>
                </Link>
              </div>
            </div>

            {/* Password Change */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-semibold text-[#2C3E2D] mb-4">Security</h2>
              
              {!showPasswordChange ? (
                <Button
                  variant="outline"
                  onClick={() => setShowPasswordChange(true)}
                >
                  Change Password
                </Button>
              ) : (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowPasswordChange(false);
                        setCurrentPassword('');
                        setNewPassword('');
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handlePasswordChange}
                      className="bg-[#97A97C] hover:bg-[#7A8A63] text-white"
                    >
                      Update Password
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}