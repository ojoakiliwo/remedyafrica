'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { useAuth } from '@/hooks/useAuth';
import HerbPhotoManager from '@/components/admin/HerbPhotoManager';
import { Button } from '@/components/ui/button';
import { AlertCircle, ArrowLeft, Image as ImageIcon, Leaf, Loader2, Pencil } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminHerbPhotosPage() {
  const router = useRouter();
  const params = useParams();
  const herbId = params.id as string;
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);

  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) {
        router.push('/login');
        return;
      }
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists() && userDoc.data().role === 'admin') {
          setIsAdmin(true);
        } else {
          toast.error('Access denied. Admin only.');
          router.push('/');
          return;
        }
      } catch (err) {
        console.error('Error checking admin:', err);
        router.push('/');
      } finally {
        setCheckingAdmin(false);
      }
    };
    checkAdmin();
  }, [user, router]);

  if (checkingAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-[#97A97C] animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 font-semibold text-lg">Access denied. Admin only.</p>
          <Button onClick={() => router.push('/')} className="mt-4 bg-[#97A97C]">
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-[#2C3E2D] text-white p-6">
        <div className="max-w-4xl mx-auto flex justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <ImageIcon className="w-8 h-8 text-[#97A97C]" />
            <div>
              <h1 className="text-2xl font-bold">Upload herb photos</h1>
              <p className="text-gray-300 text-sm">Add or replace pictures yourself — nothing is auto-attached</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href={`/admin/herbs/edit/${herbId}`}>
              <Button variant="outline" className="border-white/30 text-white hover:bg-white/10">
                <Pencil className="w-4 h-4 mr-2" />
                Edit details
              </Button>
            </Link>
            <Link href="/admin/herbs/list">
              <Button variant="outline" className="border-white/30 text-white hover:bg-white/10">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to list
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-8">
        <div className="mb-4 text-sm text-gray-600 flex items-center gap-2">
          <Leaf className="w-4 h-4 text-[#97A97C]" />
          Choose files from your computer, then click Save photos.
        </div>
        <HerbPhotoManager herbId={herbId} />
      </div>
    </div>
  );
}
