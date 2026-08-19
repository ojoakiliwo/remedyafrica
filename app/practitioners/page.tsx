'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { useAuth } from '@/hooks/useAuth';
import { isPractitionerRole } from '@/lib/auth/roles';
import { EditorialPage, PageHero, DisclaimerNote } from '@/components/editorial/PageHero';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, MapPin, Star, ShieldCheck, Search } from 'lucide-react';

interface Practitioner {
  id: string;
  name: string;
  title?: string;
  specialty?: string;
  location?: string;
  bio?: string;
  photoURL?: string;
  imageUrl?: string;
  rating?: number;
  reviews?: number;
  consultationFee?: number;
  isVerified?: boolean;
  isActive?: boolean;
  experience?: number;
}

export default function PractitionersDirectoryPage() {
  const { userData } = useAuth();
  const [practitioners, setPractitioners] = useState<Practitioner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');

  const isPractitioner = isPractitionerRole(userData?.role);

  useEffect(() => {
    const load = async () => {
      try {
        const snap = await getDocs(collection(db, 'practitioners'));
        const people = snap.docs.map((d) => {
          const raw = d.data();
          return {
            id: d.id,
            name: raw.name || raw.fullName || 'Practitioner',
            title: raw.title || raw.specialty || 'Traditional healer',
            specialty: raw.specialty || 'General',
            location: raw.location || '',
            bio: raw.bio || '',
            photoURL: raw.photoURL || raw.imageUrl || '',
            imageUrl: raw.imageUrl || '',
            rating: raw.rating || 0,
            reviews: raw.reviews || 0,
            consultationFee: raw.consultationFee || 0,
            isVerified: raw.isVerified === true,
            isActive: raw.isActive !== false,
            experience: raw.experience || 0,
          } as Practitioner;
        });
        setPractitioners(people.filter((p) => p.isActive && !p.id.startsWith('__')));
      } catch (err) {
        console.error('Error loading practitioners:', err);
        setError('We could not load practitioners right now. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return practitioners;
    return practitioners.filter((person) => {
      const haystack = `${person.name} ${person.title} ${person.specialty} ${person.location} ${person.bio}`.toLowerCase();
      return haystack.includes(term);
    });
  }, [practitioners, query]);

  return (
    <EditorialPage>
      <PageHero
        eyebrow="Healers"
        title="Find a verified practitioner"
        subtitle="Browse traditional healers across Africa, then request a private video or audio consultation."
      >
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          {isPractitioner && (
            <Link href="/practitioners/dashboard">
              <Button className="rounded-full bg-cream text-forest hover:bg-white">
                Open practitioner dashboard
              </Button>
            </Link>
          )}
          <Link href="/practitioners/apply">
            <Button variant="outline" className="rounded-full border-cream/30 bg-transparent text-cream hover:bg-white/10">
              Apply as a practitioner
            </Button>
          </Link>
        </div>
      </PageHero>

      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="relative mb-10 max-w-xl">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, specialty, or city"
            className="h-12 rounded-full border-forest/10 bg-white pl-11"
            aria-label="Search practitioners"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24 text-ink-muted">
            <Loader2 className="mr-3 h-6 w-6 animate-spin" />
            Loading practitioners…
          </div>
        ) : error ? (
          <p className="rounded-3xl border border-red-200 bg-white px-6 py-10 text-center text-red-700">{error}</p>
        ) : filtered.length === 0 ? (
          <div className="rounded-3xl border border-forest/10 bg-white px-8 py-16 text-center shadow-soft">
            <h2 className="font-serif text-2xl text-forest">No practitioners matched</h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ink-muted">
              Try a different city or specialty, or check back after more applications are verified.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {filtered.map((person) => {
              const photo = person.photoURL || person.imageUrl;
              return (
                <Link
                  key={person.id}
                  href={`/practitioners/${person.id}`}
                  className="group flex gap-5 rounded-3xl border border-forest/10 bg-white p-6 shadow-soft transition hover:-translate-y-0.5 hover:shadow-lift"
                >
                  <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-cream-dark">
                    {photo ? (
                      <img src={photo} alt={`Portrait of ${person.name}`} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-3xl text-forest/40">👤</div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-serif text-xl text-forest">{person.name}</h2>
                      {person.isVerified && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-forest/5 px-2 py-0.5 text-xs font-medium text-forest">
                          <ShieldCheck className="h-3 w-3" />
                          Verified
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-bronze">{person.title}</p>
                    <div className="mt-3 flex flex-wrap gap-3 text-xs text-ink-muted">
                      {person.location && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {person.location}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1">
                        <Star className="h-3 w-3 text-bronze" />
                        {Number(person.rating || 0).toFixed(1)} ({person.reviews || 0})
                      </span>
                    </div>
                    {person.bio && (
                      <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-ink-muted">{person.bio}</p>
                    )}
                    <p className="mt-4 text-sm font-medium text-forest group-hover:text-bronze">
                      Request a consultation →
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        <div className="mt-12">
          <DisclaimerNote>
            RemedyAfrica lists verified practitioners so you can request a consultation. Advice given in a session is not a substitute for emergency medical care.
          </DisclaimerNote>
        </div>
      </div>
    </EditorialPage>
  );
}
