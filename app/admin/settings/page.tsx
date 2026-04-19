'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/lib/firebase/client';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Save, Loader2, Bell, Shield, Globe } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function AdminSettingsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Settings state
  const [settings, setSettings] = useState({
    siteName: 'RemedyAfrica',
    maintenanceMode: false,
    allowNewRegistrations: true,
    requireEmailVerification: true,
    defaultConsultationFee: 200,
    platformFeePercentage: 10,
    maxConsultationDuration: 60,
    enableVideoCalls: true,
    enableAudioCalls: true,
    enableChat: true,
    notificationEmail: 'admin@remedyafrica.com',
    supportPhone: '+27 12 345 6789',
    socialLinks: {
      facebook: '',
      twitter: '',
      instagram: '',
      linkedin: ''
    }
  });

  // Check admin status
  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) {
        router.push('/login');
        return;
      }
      
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const adminStatus = userData.role === 'admin' || userData.isAdmin === true;
          setIsAdmin(adminStatus);
          
          if (!adminStatus) {
            toast.error('Access denied');
            router.push('/');
            return;
          }
        } else {
          router.push('/');
          return;
        }
      } catch (err) {
        console.error('Error checking admin:', err);
        router.push('/');
        return;
      }
      
      fetchSettings();
    };

    checkAdmin();
  }, [user, router]);

  const fetchSettings = async () => {
    try {
      const settingsDoc = await getDoc(doc(db, 'settings', 'platform'));
      if (settingsDoc.exists()) {
        setSettings(prev => ({ ...prev, ...settingsDoc.data() }));
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const settingsRef = doc(db, 'settings', 'platform');
      const settingsDoc = await getDoc(settingsRef);
      
      if (settingsDoc.exists()) {
        await updateDoc(settingsRef, settings);
      } else {
        await setDoc(settingsRef, settings);
      }
      
      toast.success('Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: string, value: string | number | boolean) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSocialChange = (platform: string, value: string) => {
    setSettings(prev => ({
      ...prev,
      socialLinks: { ...prev.socialLinks, [platform]: value }
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf9f7] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#5c7c6b]" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#faf9f7]">
      {/* Header */}
      <div className="bg-white border-b border-[#e8e4df]">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-[#2c3e33]">Admin Settings</h1>
                <p className="text-sm text-[#5a5a5a]">Manage platform configuration</p>
              </div>
            </div>
            <Button 
              onClick={handleSave} 
              disabled={saving}
              className="bg-[#5c7c6b] hover:bg-[#4a6354]"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="bg-white border border-[#e8e4df]">
            <TabsTrigger value="general" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              General
            </TabsTrigger>
            <TabsTrigger value="consultation" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Consultation
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <Card className="border-[#e8e4df]">
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
                <CardDescription>Basic platform configuration</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-2">
                  <Label htmlFor="siteName">Site Name</Label>
                  <Input
                    id="siteName"
                    value={settings.siteName}
                    onChange={(e) => handleChange('siteName', e.target.value)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="maintenanceMode" className="font-medium">Maintenance Mode</Label>
                    <p className="text-sm text-[#5a5a5a]">Temporarily disable the site for maintenance</p>
                  </div>
                  <input
                    id="maintenanceMode"
                    type="checkbox"
                    checked={settings.maintenanceMode}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('maintenanceMode', e.target.checked)}
                    className="h-5 w-5 rounded border-gray-300 text-[#5c7c6b] focus:ring-[#5c7c6b]"
                    aria-label="Enable maintenance mode"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="allowNewRegistrations" className="font-medium">Allow New Registrations</Label>
                    <p className="text-sm text-[#5a5a5a]">Enable new user signups</p>
                  </div>
                  <input
                    id="allowNewRegistrations"
                    type="checkbox"
                    checked={settings.allowNewRegistrations}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('allowNewRegistrations', e.target.checked)}
                    className="h-5 w-5 rounded border-gray-300 text-[#5c7c6b] focus:ring-[#5c7c6b]"
                    aria-label="Allow new user registrations"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="requireEmailVerification" className="font-medium">Require Email Verification</Label>
                    <p className="text-sm text-[#5a5a5a]">Users must verify email before accessing features</p>
                  </div>
                  <input
                    id="requireEmailVerification"
                    type="checkbox"
                    checked={settings.requireEmailVerification}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('requireEmailVerification', e.target.checked)}
                    className="h-5 w-5 rounded border-gray-300 text-[#5c7c6b] focus:ring-[#5c7c6b]"
                    aria-label="Require email verification"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-[#e8e4df] mt-6">
              <CardHeader>
                <CardTitle>Social Media Links</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(settings.socialLinks).map(([platform, url]) => (
                  <div key={platform} className="grid gap-2">
                    <Label htmlFor={platform} className="capitalize">{platform}</Label>
                    <Input
                      id={platform}
                      placeholder={`https://${platform}.com/...`}
                      value={url}
                      onChange={(e) => handleSocialChange(platform, e.target.value)}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="consultation">
            <Card className="border-[#e8e4df]">
              <CardHeader>
                <CardTitle>Consultation Settings</CardTitle>
                <CardDescription>Configure consultation parameters</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="grid gap-2">
                    <Label htmlFor="defaultFee">Default Consultation Fee (R)</Label>
                    <Input
                      id="defaultFee"
                      type="number"
                      value={settings.defaultConsultationFee}
                      onChange={(e) => handleChange('defaultConsultationFee', parseInt(e.target.value) || 0)}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="platformFee">Platform Fee (%)</Label>
                    <Input
                      id="platformFee"
                      type="number"
                      value={settings.platformFeePercentage}
                      onChange={(e) => handleChange('platformFeePercentage', parseInt(e.target.value) || 0)}
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="maxDuration">Max Consultation Duration (minutes)</Label>
                  <Input
                    id="maxDuration"
                    type="number"
                    value={settings.maxConsultationDuration}
                    onChange={(e) => handleChange('maxConsultationDuration', parseInt(e.target.value) || 0)}
                  />
                </div>

                <div className="space-y-4 pt-4 border-t border-[#e8e4df]">
                  <h4 className="font-medium">Communication Methods</h4>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="enableVideoCalls">Enable Video Calls</Label>
                    <input
                      id="enableVideoCalls"
                      type="checkbox"
                      checked={settings.enableVideoCalls}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('enableVideoCalls', e.target.checked)}
                      className="h-5 w-5 rounded border-gray-300 text-[#5c7c6b] focus:ring-[#5c7c6b]"
                      aria-label="Enable video calls"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="enableAudioCalls">Enable Audio Calls</Label>
                    <input
                      id="enableAudioCalls"
                      type="checkbox"
                      checked={settings.enableAudioCalls}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('enableAudioCalls', e.target.checked)}
                      className="h-5 w-5 rounded border-gray-300 text-[#5c7c6b] focus:ring-[#5c7c6b]"
                      aria-label="Enable audio calls"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="enableChat">Enable Chat</Label>
                    <input
                      id="enableChat"
                      type="checkbox"
                      checked={settings.enableChat}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('enableChat', e.target.checked)}
                      className="h-5 w-5 rounded border-gray-300 text-[#5c7c6b] focus:ring-[#5c7c6b]"
                      aria-label="Enable chat messaging"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <Card className="border-[#e8e4df]">
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-2">
                  <Label htmlFor="notificationEmail">Notification Email</Label>
                  <Input
                    id="notificationEmail"
                    type="email"
                    value={settings.notificationEmail}
                    onChange={(e) => handleChange('notificationEmail', e.target.value)}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="supportPhone">Support Phone Number</Label>
                  <Input
                    id="supportPhone"
                    value={settings.supportPhone}
                    onChange={(e) => handleChange('supportPhone', e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}