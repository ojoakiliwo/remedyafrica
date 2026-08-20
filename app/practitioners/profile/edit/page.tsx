'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { doc, getDoc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { db, auth } from '@/lib/firebase/client';
import { useAuth } from '@/hooks/useAuth';
import { getPractitionerLookupIds } from '@/lib/consultations/lookup';
import { uploadPractitionerApplicationFile } from '@/lib/firebase/storage';
import { EditorialPage, LoadingScreen, PageHero } from '@/components/editorial/PageHero';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Camera, Loader2, Save } from 'lucide-react';

export default function PractitionerProfileEditPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [profileId, setProfileId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [missing, setMissing] = useState(false);
  const [form, setForm] = useState({
    name: '',
    title: '',
    specialty: '',
    location: '',
    bio: '',
    experience: '',
    languages: '',
    photoURL: '',
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
            languages: Array.isArray(data.languages) ? data.languages.join(', ') : data.languages || '',
            photoURL: data.photoURL || data.imageUrl || '',
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

  const handlePhoto = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;
    setUploadingPhoto(true);
    try {
      const uploaded = await uploadPractitionerApplicationFile(file, user.uid, 'photo');
      setForm((current) => ({ ...current, photoURL: uploaded.url }));
      toast.success('Photo ready — save the profile to publish it.');
    } catch (error) {
      console.error('Photo upload error:', error);
      toast.error('Could not upload that photo. Try a smaller JPG or PNG.');
    } finally {
      setUploadingPhoto(false);
      event.target.value = '';
    }
  };

  const save = async () => {
    if (!profileId || !user) return;
    setSaving(true);
    try {
      const languages = form.languages
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);

      await updateDoc(doc(db, 'practitioners', profileId), {
        name: form.name.trim(),
        title: form.title.trim(),
        specialty: form.specialty.trim(),
        location: form.location.trim(),
        bio: form.bio.trim(),
        experience: Number(form.experience) || 0,
        languages,
        photoURL: form.photoURL,
        imageUrl: form.photoURL,
        updatedAt: serverTimestamp(),
      });

      if (auth.currentUser && form.name.trim()) {
        await updateProfile(auth.currentUser, {
          displayName: form.name.trim(),
          ...(form.photoURL ? { photoURL: form.photoURL } : {}),
        });
      }
      await setDoc(doc(db, 'users', user.uid), {
        displayName: form.name.trim(),
        name: form.name.trim(),
        ...(form.photoURL ? { photoURL: form.photoURL } : {}),
        updatedAt: serverTimestamp(),
      }, { merge: true }).catch(() => undefined);

      toast.success('Your public profile is updated. Calls will use this name.');
      router.push('/practitioners/dashboard');
    } catch (error) {
      console.error('Error saving practitioner profile:', error);
      toast.error('Could not save your profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return <LoadingScreen label="Opening your public profile…" />;
  }

  if (missing) {
    return (
      <EditorialPage>
        <PageHero
          eyebrow="Your house"
          title="A public profile comes after you apply."
          subtitle="Patients see this page when they book you. Apply first, then return here to shape how you appear."
          backHref="/practitioners/dashboard"
          backLabel="Back to dashboard"
        />
        <div className="mx-auto max-w-xl px-4 py-16 text-center">
          <Link href="/practitioners/apply">
            <Button className="rounded-full bg-forest text-cream hover:bg-forest-mist">Apply as a practitioner</Button>
          </Link>
        </div>
      </EditorialPage>
    );
  }

  return (
    <EditorialPage>
      <PageHero
        eyebrow="Public face"
        title="How patients will find you."
        subtitle="This is the card and the booking page they see. Your video and audio calls will also use this name."
        backHref="/practitioners/dashboard"
        backLabel="Back to dashboard"
      />

      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[18rem_minmax(0,1fr)]">
          <aside className="rounded-3xl border border-forest/10 bg-white p-6 shadow-soft text-center h-fit">
            <div className="mx-auto mb-4 h-36 w-36 overflow-hidden rounded-full bg-cream">
              {form.photoURL ? (
                <img src={form.photoURL} alt={form.name || 'Profile photo'} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-3xl font-serif text-bronze">
                  {(form.name || 'P').charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <p className="font-serif text-2xl text-forest">{form.name || 'Your name'}</p>
            <p className="mt-1 text-sm text-ink-muted">{form.title || form.specialty || 'Traditional healer'}</p>
            <p className="mt-1 text-xs text-ink-muted">{form.location || 'Location'}</p>
            <label className="mt-5 inline-flex cursor-pointer items-center justify-center rounded-full bg-forest px-4 py-2 text-sm text-cream hover:bg-forest-mist">
              <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handlePhoto} disabled={uploadingPhoto} />
              <Camera className="mr-2 h-4 w-4" />
              {uploadingPhoto ? 'Uploading…' : 'Change photo'}
            </label>
          </aside>

          <div className="rounded-3xl border border-forest/10 bg-white p-6 sm:p-8 shadow-soft space-y-5">
            <div>
              <Label htmlFor="name">Full name</Label>
              <Input id="name" className="booking-field mt-1" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input id="title" className="booking-field mt-1" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Traditional healer" />
              </div>
              <div>
                <Label htmlFor="specialty">Specialty</Label>
                <Input id="specialty" className="booking-field mt-1" value={form.specialty} onChange={(e) => setForm({ ...form, specialty: e.target.value })} />
              </div>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <Label htmlFor="location">Location</Label>
                <Input id="location" className="booking-field mt-1" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="experience">Years of experience</Label>
                <Input id="experience" className="booking-field mt-1" type="number" min="0" value={form.experience} onChange={(e) => setForm({ ...form, experience: e.target.value })} />
              </div>
            </div>
            <div>
              <Label htmlFor="languages">Languages</Label>
              <Input id="languages" className="booking-field mt-1" value={form.languages} onChange={(e) => setForm({ ...form, languages: e.target.value })} placeholder="English, Yoruba, Hausa" />
            </div>
            <div>
              <Label htmlFor="bio">Bio</Label>
              <textarea
                id="bio"
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                rows={6}
                className="booking-field mt-1 min-h-[8rem]"
                placeholder="How you work with families, and what you are known for."
              />
            </div>
            <Button onClick={save} disabled={saving || !form.name.trim()} className="rounded-full bg-forest text-cream hover:bg-forest-mist">
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Save public profile
            </Button>
          </div>
        </div>
      </div>
    </EditorialPage>
  );
}
