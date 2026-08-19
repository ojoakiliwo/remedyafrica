'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { collection, doc, getDoc, getDocs, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { useAuth } from '@/hooks/useAuth';
import { GRANTABLE_PLANS, buildGrantFields, subscriptionGrantDocId } from '@/lib/auth/subscription';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { ArrowLeft, Crown, Loader2, Search } from 'lucide-react';

interface AdminUserRow {
  id: string;
  email: string;
  name: string;
  role: string;
  subscriptionTier?: string;
  subscriptionStatus?: string;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [search, setSearch] = useState('');
  const [planId, setPlanId] = useState('healer');
  const [months, setMonths] = useState('3');
  const [selectedId, setSelectedId] = useState('');
  const [email, setEmail] = useState('');
  const [granting, setGranting] = useState(false);

  useEffect(() => {
    const boot = async () => {
      if (!user) {
        router.push('/login');
        return;
      }
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.data()?.role !== 'admin') {
        toast.error('Admin only');
        router.push('/');
        return;
      }
      setIsAdmin(true);
      const snap = await getDocs(collection(db, 'users'));
      const rows = snap.docs.map((item) => {
        const data = item.data();
        return {
          id: item.id,
          email: data.email || '',
          name: data.displayName || data.name || 'Unnamed',
          role: data.role || 'user',
          subscriptionTier: data.subscriptionTier,
          subscriptionStatus: data.subscriptionStatus,
        } as AdminUserRow;
      });
      rows.sort((a, b) => a.email.localeCompare(b.email));
      setUsers(rows);
      setLoading(false);
    };
    boot();
  }, [user, router]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return users;
    return users.filter((item) =>
      `${item.email} ${item.name} ${item.role}`.toLowerCase().includes(term)
    );
  }, [users, search]);

  const grant = async () => {
    const targetEmail = email.trim();
    if (!selectedId && !targetEmail) {
      toast.error('Choose a user or enter their email');
      return;
    }
    setGranting(true);
    try {
      const idToken = await user?.getIdToken();
      if (idToken) {
        const response = await fetch('/api/admin/subscriptions/grant', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            userId: selectedId || undefined,
            email: targetEmail || undefined,
            planId,
            months: Number(months) || 3,
          }),
        });
        const payload = await response.json().catch(() => ({}));
        if (response.ok) {
          toast.success(`Granted ${payload.planName || 'subscription'} access`);
          return;
        }
      }

      const grantFields = buildGrantFields({
        planId,
        months: Number(months) || 3,
        grantedBy: user?.uid || 'admin',
      });
      const targetId = selectedId || users.find((item) => item.email.toLowerCase() === targetEmail.toLowerCase())?.id;
      if (!targetId) {
        throw new Error('Could not find that user in Firestore. Open the user document in Firebase and grant access there.');
      }

      try {
        await setDoc(doc(db, 'users', targetId), {
          ...grantFields.userFields,
          updatedAt: serverTimestamp(),
        }, { merge: true });

        await setDoc(doc(db, 'users', targetId, 'subscription', 'current'), {
          ...grantFields.record,
          reference: `admin-grant-${Date.now()}`,
          startedAt: serverTimestamp(),
          expiresAt: grantFields.expiresAt,
          updatedAt: serverTimestamp(),
          grantedAt: serverTimestamp(),
        }, { merge: true });
      } catch (writeError) {
        await setDoc(doc(db, 'practitioners', subscriptionGrantDocId(targetId)), {
          isSubscriptionGrant: true,
          isActive: false,
          name: 'Subscription grant',
          userId: targetId,
          email: targetEmail,
          ...grantFields.record,
          ...grantFields.userFields,
          expiresAt: grantFields.expiresAt,
          updatedAt: serverTimestamp(),
        }, { merge: true });
      }

      toast.success(`Granted ${grantFields.plan.name} access. Ask them to refresh or sign in again.`);
    } catch (error: any) {
      const raw = String(error?.message || '');
      const friendly = /insufficient|permission/i.test(raw)
        ? 'Firebase blocked the write. Refresh this page and try once more.'
        : (error?.message || 'Failed to grant access');
      toast.error(friendly);
    } finally {
      setGranting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-forest" />
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-cream">
      <div className="bg-white border-b border-[#e8e4df]">
        <div className="max-w-5xl mx-auto px-4 py-5 flex items-center gap-3">
          <Link href="/admin" className="p-2 rounded-lg hover:bg-stone-100">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-forest">Users & subscriptions</h1>
            <p className="text-sm text-gray-500">Grant paid access to any member without a payment</p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 grid gap-6 lg:grid-cols-[1.2fr,0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Members</CardTitle>
            <CardDescription>Select a person, then grant a plan on the right.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by name or email"
                className="pl-9"
              />
            </div>
            <div className="max-h-[28rem] overflow-auto divide-y rounded-xl border">
              {filtered.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setSelectedId(item.id);
                    setEmail(item.email);
                  }}
                  className={`w-full text-left px-4 py-3 hover:bg-cream ${
                    selectedId === item.id ? 'bg-forest/5' : 'bg-white'
                  }`}
                >
                  <p className="font-medium text-forest">{item.name}</p>
                  <p className="text-sm text-gray-500">{item.email || 'No email on profile'}</p>
                  <p className="text-xs text-gray-400 mt-1 capitalize">
                    {item.role} · {item.subscriptionTier || 'free'} {item.subscriptionStatus ? `(${item.subscriptionStatus})` : ''}
                  </p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-amber-500" />
                Grant access
              </CardTitle>
              <CardDescription>
                Healer includes forum access. Premium unlocks practitioner consultations.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-forest">Email</label>
                <Input
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="member@email.com"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-forest">Plan</label>
                <select
                  value={planId}
                  onChange={(event) => setPlanId(event.target.value)}
                  className="mt-1 w-full rounded-md border px-3 py-2"
                >
                  {GRANTABLE_PLANS.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-forest">Months</label>
                <Input
                  type="number"
                  min={1}
                  max={36}
                  value={months}
                  onChange={(event) => setMonths(event.target.value)}
                />
              </div>
              <Button className="w-full bg-forest" onClick={grant} disabled={granting}>
                {granting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Crown className="h-4 w-4 mr-2" />}
                Grant subscription
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>From Firebase Console</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-gray-600 space-y-2">
              <p>1. Open Authentication and copy the user&apos;s UID.</p>
              <p>2. Open Firestore → <code>users</code> → that UID.</p>
              <p>3. Set <code>subscriptionTier</code> to <code>premium</code> for Basic/Premium, or <code>premium_pro</code> for Healer. Set <code>subscriptionStatus</code> to <code>active</code>.</p>
              <p>4. Optional: add subcollection <code>subscription/current</code> with <code>status: active</code>, <code>plan: healer</code>, and an <code>expiresAt</code> timestamp in the future.</p>
              <p>The member should refresh or sign in again after you save.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
