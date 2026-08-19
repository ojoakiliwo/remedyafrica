'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  collection,
  query,
  where,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { useAuth } from '@/hooks/useAuth';
import { getPractitionerLookupIds } from '@/lib/consultations/lookup';
import { Button } from '@/components/ui/button';
import {
  Loader2,
  Calendar,
  Video,
  Phone,
  ArrowLeft,
  AlertCircle,
  Clock,
} from 'lucide-react';

interface ConsultationItem {
  id: string;
  patientId?: string;
  practitionerId?: string;
  patientName?: string;
  practitionerName?: string;
  date?: string;
  time?: string;
  status?: string;
  type?: 'video' | 'audio' | string;
  dailyRoomUrl?: string | null;
  notes?: string;
}

function statusLabel(status?: string) {
  if (!status) return 'Scheduled';
  return status.replace(/-/g, ' ');
}

export default function ConsultationsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [consultations, setConsultations] = useState<ConsultationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login?redirect=/consultations');
      return;
    }

    const buckets = new Map<string, ConsultationItem[]>();
    const unsubs: Array<() => void> = [];
    let cancelled = false;

    const publish = () => {
      const items = Array.from(buckets.values()).flat();
      const seen = new Set<string>();
      const unique = items.filter((item) => {
        if (seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
      });
      unique.sort((a, b) => {
        const left = `${a.date || ''} ${a.time || ''}`;
        const right = `${b.date || ''} ${b.time || ''}`;
        return right.localeCompare(left);
      });
      setConsultations(unique);
      setLoading(false);
    };

    const listen = (key: string, field: 'patientId' | 'practitionerId', value: string) => {
      const q = query(collection(db, 'consultations'), where(field, '==', value));
      const unsub = onSnapshot(
        q,
        (snap) => {
          buckets.set(
            key,
            snap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() } as ConsultationItem))
          );
          setError('');
          publish();
        },
        (err) => {
          console.error('Error loading consultations:', err);
          setError('We could not load your consultations right now.');
          publish();
        }
      );
      unsubs.push(unsub);
    };

    listen('patient', 'patientId', user.uid);

    getPractitionerLookupIds(user.uid).then((ids) => {
      if (cancelled) return;
      ids.forEach((id) => listen(`practitioner:${id}`, 'practitionerId', id));
    });

    return () => {
      cancelled = true;
      unsubs.forEach((unsub) => unsub());
    };
  }, [user, authLoading, router]);

  const upcoming = useMemo(
    () => consultations.filter((item) => item.status !== 'completed' && item.status !== 'cancelled'),
    [consultations]
  );

  if (authLoading || (user && loading)) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-forest" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-forest mb-2">Sign in to view consultations</h1>
          <p className="text-gray-600 mb-6">Your booked video and audio sessions will appear here.</p>
          <Link href="/login?redirect=/consultations">
            <Button className="bg-forest hover:bg-forest-mist">Sign in</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      <div className="bg-forest text-white py-10 px-4">
        <div className="max-w-4xl mx-auto">
          <Link href="/dashboard" className="inline-flex items-center gap-1 text-bronze hover:text-white text-sm mb-4">
            <ArrowLeft className="h-4 w-4" /> Back to dashboard
          </Link>
          <h1 className="text-3xl font-bold">My consultations</h1>
          <p className="text-gray-300 mt-2">
            Sessions you booked, and sessions booked with you as a practitioner.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-4">
        {error && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900 flex gap-3">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {consultations.length === 0 ? (
          <div className="bg-white rounded-2xl border border-forest/10 p-10 text-center">
            <Calendar className="h-12 w-12 text-forest/30 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-forest mb-2">No consultations yet</h2>
            <p className="text-gray-600 mb-6">
              When a patient books you, or you book a healer, the session will show up here.
            </p>
            <Link href="/practitioners">
              <Button className="bg-forest hover:bg-forest-mist">Browse practitioners</Button>
            </Link>
          </div>
        ) : (
          <>
            <p className="text-sm text-ink-muted">
              {upcoming.length} upcoming · {consultations.length} total
            </p>
            {consultations.map((item) => {
              const isPatient = item.patientId === user.uid;
              const counterpart = isPatient ? item.practitionerName : item.patientName;
              const TypeIcon = item.type === 'audio' ? Phone : Video;
              return (
                <div key={item.id} className="bg-white rounded-2xl border border-forest/10 p-5 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
                  <div>
                    <p className="font-semibold text-forest">{counterpart || 'Consultation'}</p>
                    <p className="text-sm text-gray-500 capitalize mt-1 flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      {item.date || 'Date TBD'} {item.time ? `at ${item.time}` : ''}
                    </p>
                    <p className="text-xs text-gray-500 mt-1 capitalize">
                      {statusLabel(item.status)} · {item.type || 'video'}
                    </p>
                  </div>
                  <Link href={`/consultation/${item.id}`}>
                    <Button className="bg-forest hover:bg-forest-mist">
                      <TypeIcon className="h-4 w-4 mr-2" />
                      {item.dailyRoomUrl || item.status === 'in-progress' ? 'Join' : 'Open'}
                    </Button>
                  </Link>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}
