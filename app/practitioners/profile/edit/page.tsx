'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { useAuth } from '@/hooks/useAuth';
import { getPractitionerLookupIds } from '@/lib/consultations/lookup';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ArrowLeft, Loader2, Save } from 'lucide-react';

export default function PractitionerProfileEditPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [profileId, setProfileId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [missing, setMissing] = useState(false);
  const [form, setForm] = useState({
    name: '',
    title: '',
    specialty: '',
    location: '',
    bio: '',
    experience: '',
  });

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login?redirect=/practitioners/profile/edit');
      return;
    }

    let cancelled = false;
    const load = async () => {
      try {
        const ids = await getPractitionerLookupIds(user.uid);
        const candidates = ids.length ? ids : [user.uid];
        for (const id of candidates) {
          const snap = await getDoc(doc(db, 'practitioners', id));
          if (!snap.exists()) continue;
          const data = snap.data();
          if (cancelled) return;
          setProfileId(snap.id);
          setForm({
            name: data.name || data.fullName || user.displayName || '',
            title: data.title || '',
            specialty: data.specialty || '',
            location: data.location || '',
            bio: data.bio || '',
            experience: String(data.experience || ''),
          });
          setMissing(false);
          setLoading(false);
          return;
        }
        if (!cancelled) {
          setMissing(true);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error loading practitioner profile:', error);
        toast.error('Could not load your practitioner profile.');
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [user, authLoading, router]);

  const save = async () => {
    if (!profileId) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'practitioners', profileId), {
        name: form.name.trim(),
        title: form.title.trim(),
        specialty: form.specialty.trim(),
        location: form.location.trim(),
        bio: form.bio.trim(),
        experience: Number(form.experience) || 0,
        updatedAt: serverTimestamp(),
      });
      toast.success('Profile updated');
      router.push('/practitioners/dashboard');
    } catch (error) {
      console.error('Error saving practitioner profile:', error);
      toast.error('Could not save your profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-forest" />
      </div>
    );
  }

  if (missing) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center px-4">
        <div className="max-w-md bg-white rounded-2xl border border-forest/10 p-8 text-center">
          <h1 className="text-2xl font-bold text-forest">No practitioner profile yet</h1>
          <p className="text-gray-600 mt-3">
            Apply as a practitioner first, then you can edit the public profile patients see.
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <Link href="/practitioners/apply">
              <Button className="w-full bg-forest hover:bg-forest-mist">Apply now</Button>
            </Link>
            <Link href="/practitioners/dashboard">
              <Button variant="outline" className="w-full">Back to dashboard</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      <div className="bg-forest text-white py-10 px-4">
        <div className="max-w-2xl mx-auto">
          <Link href="/practitioners/dashboard" className="inline-flex items-center gap-1 text-bronze hover:text-white text-sm mb-4">
            <ArrowLeft className="h-4 w-4" /> Back to dashboard
          </Link>
          <h1 className="text-3xl font-bold">Edit practitioner profile</h1>
          <p className="text-gray-300 mt-2">This is the public profile patients see when they book you.</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">
        <div className="bg-white rounded-2xl border border-forest/10 p-6 space-y-4">
          <div>
            <Label htmlFor="name">Full name</Label>
            <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="title">Title</Label>
            <Input id="title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Traditional healer" />
          </div>
          <div>
            <Label htmlFor="specialty">Specialty</Label>
            <Input id="specialty" value={form.specialty} onChange={(e) => setForm({ ...form, specialty: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="location">Location</Label>
            <Input id="location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="experience">Years of experience</Label>
            <Input id="experience" type="number" min="0" value={form.experience} onChange={(e) => setForm({ ...form, experience: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="bio">Bio</Label>
            <textarea
              id="bio"
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              rows={5}
              className="w-full rounded-md border border-forest/20 px-3 py-2 text-ink"
            />
          </div>
          <Button onClick={save} disabled={saving || !form.name.trim()} className="bg-forest hover:bg-forest-mist">
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Save profile
          </Button>
        </div>
      </div>
    </div>
  );
}
