'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { useAuth } from '@/hooks/useAuth';
import { getPractitionerLookupIds } from '@/lib/consultations/lookup';
import { canUserCancelConsultation, consultationCancelFields } from '@/lib/consultations/cancel';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  Loader2,
  Calendar,
  Video,
  Phone,
  ArrowLeft,
  AlertCircle,
  Clock,
  XCircle,
} from 'lucide-react';

interface ConsultationItem {
  id: string;
  patientId?: string;
  practitionerId?: string;
  practitionerProfileId?: string;
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
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [actorIds, setActorIds] = useState<string[]>([]);

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
      setActorIds(ids);
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

  const cancelAppointment = async (item: ConsultationItem) => {
    if (!user || !canUserCancelConsultation(user.uid, item, actorIds)) return;
    if (!confirm('Cancel this appointment? The other person will no longer be able to join.')) return;

    setCancellingId(item.id);
    try {
      await updateDoc(doc(db, 'consultations', item.id), {
        ...consultationCancelFields(user.uid),
        cancelledAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      toast.success('Appointment cancelled');
    } catch (err) {
      console.error('Error cancelling appointment:', err);
      toast.error('Could not cancel this appointment. Please try again.');
    } finally {
      setCancellingId(null);
    }
  };

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
              const canCancel = canUserCancelConsultation(user.uid, item, actorIds);
              const isCancelled = item.status === 'cancelled';
              const isCompleted = item.status === 'completed';
              return (
                <div key={item.id} className="bg-white rounded-2xl border border-forest/10 p-5 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
                  <div>
                    <p className="font-semibold text-forest">{counterpart || 'Consultation'}</p>
                    <p className="text-sm text-gray-600 capitalize mt-1 flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      {item.date || 'Date TBD'} {item.time ? `at ${item.time}` : ''}
                    </p>
                    <p className="text-xs text-gray-600 mt-1 capitalize">
                      {statusLabel(item.status)} · {item.type || 'video'}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link href={`/consultation/${item.id}`}>
                      <Button className="bg-forest hover:bg-forest-mist">
                        <TypeIcon className="h-4 w-4 mr-2" />
                        {isCancelled || isCompleted ? 'View' : 'Join on this page'}
                      </Button>
                    </Link>
                    {canCancel && (
                      <Button
                        variant="outline"
                        className="border-red-300 text-red-700 hover:bg-red-50"
                        disabled={cancellingId === item.id}
                        onClick={() => cancelAppointment(item)}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        {cancellingId === item.id ? 'Cancelling...' : 'Cancel'}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}
