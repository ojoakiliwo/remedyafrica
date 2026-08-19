'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase/client';
import { doc, updateDoc } from 'firebase/firestore';
import { updateProfile, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, User, Lock, Camera, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { isPractitionerRole } from '@/lib/auth/roles';

export default function ProfilePage() {
  const { user, userData } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mounted, setMounted] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    setMounted(true);
    if (userData?.displayName) {
      setDisplayName(userData.displayName);
    }
  }, [userData]);

  if (!mounted) {
    return <div className="min-h-screen bg-cream" />;
  }

  if (!user) {
    router.push('/login');
    return null;
  }

  const handleUpdateProfile = async () => {
    if (!displayName.trim()) return;
    
    setLoading(true);
    try {
      await updateProfile(user, { displayName: displayName.trim() });
      await updateDoc(doc(db, 'users', user.uid), {
        displayName: displayName.trim(),
        updatedAt: new Date().toISOString()
      });
      setMessage('Profile updated successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setMessage('Please fill in all password fields');
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage('New passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      setMessage('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const credential = EmailAuthProvider.credential(user.email!, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordChange(false);
      setMessage('Password changed successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error: any) {
      console.error('Error changing password:', error);
      setMessage(error.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onloadend = async () => {
      const photoURL = reader.result as string;
      try {
        await updateProfile(user, { photoURL });
        await updateDoc(doc(db, 'users', user.uid), { photoURL });
        if (typeof window !== 'undefined') {
          window.location.reload();
        }
      } catch (error) {
        console.error('Error updating photo:', error);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="min-h-screen bg-cream py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link href="/dashboard" className="text-bronze hover:underline flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
        </div>

        <h1 className="text-3xl font-bold text-forest mb-8">My Profile</h1>

        {message && (
          <div className={`p-4 rounded-lg mb-6 ${message.includes('success') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {message}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Profile Information
              </CardTitle>
              <CardDescription>Update your display name and photo</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="relative">
                  {userData?.photoURL ? (
                    <img src={userData.photoURL} alt="Profile" className="w-20 h-20 rounded-full object-cover" />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-forest flex items-center justify-center text-white text-2xl font-bold">
                      {(userData?.displayName || user?.email?.[0] || 'U').toUpperCase()}
                    </div>
                  )}
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute -bottom-2 -right-2 bg-forest text-white p-2 rounded-full hover:bg-forest-mist"
                    aria-label="Upload profile picture"
                    type="button"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                  <input 
                    ref={fileInputRef}
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleImageUpload}
                    aria-label="Choose profile picture file"
                  />
                </div>
                <div>
                  <p className="font-medium text-forest">{userData?.displayName}</p>
                  <p className="text-sm text-gray-500">{user.email}</p>
                  <p className="mt-1 text-xs font-medium text-forest">
                    {userData?.role === 'admin'
                      ? 'Admin account'
                      : isPractitionerRole(userData?.role)
                        ? 'Practitioner account'
                        : 'Member account'}
                  </p>
                  {isPractitionerRole(userData?.role) && userData?.role !== 'admin' && (
                    <Link href="/practitioners/dashboard" className="mt-2 inline-block text-sm text-bronze hover:underline">
                      Open practitioner dashboard
                    </Link>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your name"
                />
                <p className="text-xs text-gray-500">This is what others will see in the forum and consultations</p>
              </div>

              <Button 
                onClick={handleUpdateProfile} 
                disabled={loading || !displayName.trim()}
                className="bg-forest hover:bg-forest-mist"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update Profile'}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5" />
                Security
              </CardTitle>
              <CardDescription>Change your password</CardDescription>
            </CardHeader>
            <CardContent>
              {!showPasswordChange ? (
                <Button 
                  onClick={() => setShowPasswordChange(true)} 
                  variant="outline"
                >
                  Change Password
                </Button>
              ) : (
                <div className="space-y-4">
                  <div>
                    <Label>Current Password</Label>
                    <Input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Current password"
                    />
                  </div>
                  <div>
                    <Label>New Password</Label>
                    <Input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="New password"
                    />
                  </div>
                  <div>
                    <Label>Confirm New Password</Label>
                    <Input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      onClick={handleChangePassword} 
                      disabled={loading}
                      className="bg-forest hover:bg-forest-mist"
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update Password'}
                    </Button>
                    <Button 
                      variant="ghost" 
                      onClick={() => setShowPasswordChange(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}