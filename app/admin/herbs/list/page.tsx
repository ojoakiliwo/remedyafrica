'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  collection, 
  onSnapshot, 
  doc, 
  deleteDoc, 
  getDoc 
} from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { useAuth } from '@/hooks/useAuth';
import { 
  Leaf, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  ArrowLeft,
  Eye,
  Loader2,
  Upload,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { toast } from 'sonner';

interface Herb {
  id: string;
  name: string;
  scientificName: string;
  category: string;
  description: string;
  preparation?: string;
  warnings?: string;
  benefits?: string;
  origin?: string;
  partsUsed?: string;
  images?: string[];
  status?: 'draft' | 'published';
  searchKeywords?: string[];
  createdAt?: any;
}

const CATEGORY_LABELS: Record<string, string> = {
  'mental-wellness': 'Mental Wellness',
  'pain-relief': 'Pain Relief',
  'digestive-health': 'Digestive Health',
  'immune-support': 'Immune Support',
  'skin-care': 'Skin Care',
  'respiratory': 'Respiratory Health',
  'womens-health': "Women's Health",
  'mens-health': "Men's Health",
  'uncategorized': 'Uncategorized',
};

export default function ManageHerbsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  
  const [herbs, setHerbs] = useState<Herb[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Check admin status — STRICT: only role === 'admin'
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
          const adminStatus = userData.role === 'admin';
          setIsAdmin(adminStatus);
          
          if (!adminStatus) {
            toast.error('Access denied. Admin only.');
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
      } finally {
        setCheckingAdmin(false);
      }
    };

    checkAdmin();
  }, [user, router]);

  // Load herbs
  useEffect(() => {
    if (!isAdmin || checkingAdmin) return;

    const unsubscribe = onSnapshot(collection(db, 'herbs'), (snapshot) => {
      const herbsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Herb[];
      
      // Sort by createdAt desc, fallback to name
      herbsData.sort((a, b) => {
        if (a.createdAt && b.createdAt) {
          return b.createdAt.toMillis?.() - a.createdAt.toMillis?.() || 0;
        }
        return a.name.localeCompare(b.name);
      });
      
      setHerbs(herbsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isAdmin, checkingAdmin]);

  const handleDelete = async (herbId: string, herbName: string) => {
    if (!confirm(`Are you sure you want to delete "${herbName}"? This cannot be undone.`)) return;
    
    setDeletingId(herbId);
    try {
      await deleteDoc(doc(db, 'herbs', herbId));
      toast.success(`Deleted "${herbName}"`);
    } catch (error) {
      console.error('Error deleting herb:', error);
      toast.error('Failed to delete herb');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredHerbs = herbs.filter(herb => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;
    return (
      herb.name.toLowerCase().includes(term) ||
      herb.scientificName?.toLowerCase().includes(term) ||
      herb.category?.toLowerCase().includes(term) ||
      herb.origin?.toLowerCase().includes(term) ||
      herb.searchKeywords?.some(keyword => keyword.toLowerCase().includes(term))
    );
  });

  if (checkingAdmin) {
    return (
      <div className="min-h-screen bg-[#F5F5F0] flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-[#97A97C] animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#F5F5F0] flex items-center justify-center">
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
    <div className="min-h-screen bg-[#F5F5F0] py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Link href="/admin">
              <Button variant="outline" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-[#2C3E2D] flex items-center gap-2">
                <Leaf className="w-6 h-6 text-[#97A97C]" />
                Manage Herbs
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {herbs.length} herb{herbs.length !== 1 ? 's' : ''} in database
                {filteredHerbs.length !== herbs.length && ` • ${filteredHerbs.length} shown`}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href="/admin/herbs/bulk">
              <Button variant="outline" className="border-[#97A97C] text-[#97A97C] hover:bg-[#97A97C]/10">
                <Upload className="w-4 h-4 mr-2" />
                Bulk Upload
              </Button>
            </Link>
            <Link href="/admin/herbs/upload">
              <Button className="bg-[#97A97C] hover:bg-[#7A8A63] text-white">
                <Plus className="w-4 h-4 mr-2" />
                Add New
              </Button>
            </Link>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white p-4 rounded-xl shadow-sm mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search by name, scientific name, origin, or benefits..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 focus-visible:ring-[#97A97C]"
            />
          </div>
        </div>

        {/* Herbs Grid */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-12 h-12 text-[#97A97C] animate-spin" />
          </div>
        ) : filteredHerbs.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center border-2 border-dashed border-gray-200">
            <Leaf className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600">
              {searchTerm ? 'No herbs match your search' : 'No herbs found'}
            </h3>
            <p className="text-gray-500 mt-2">
              {searchTerm ? 'Try a different search term' : 'Get started by adding your first herb'}
            </p>
            {!searchTerm && (
              <div className="flex gap-3 justify-center mt-6">
                <Link href="/admin/herbs/upload">
                  <Button className="bg-[#97A97C] hover:bg-[#7A8A63]">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Herb
                  </Button>
                </Link>
                <Link href="/admin/herbs/bulk">
                  <Button variant="outline" className="border-[#97A97C] text-[#97A97C]">
                    <Upload className="w-4 h-4 mr-2" />
                    Bulk Import
                  </Button>
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredHerbs.map((herb) => (
              <div key={herb.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 border border-transparent hover:border-[#97A97C]/30">
                <div className="aspect-video bg-gray-200 relative">
                  {herb.images && herb.images[0] ? (
                    <img 
                      src={herb.images[0]} 
                      alt={herb.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-[#97A97C]/10">
                      <Leaf className="w-12 h-12 text-[#97A97C]" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-full ${
                      herb.status === 'draft' 
                        ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' 
                        : 'bg-green-100 text-green-800 border border-green-200'
                    }`}>
                      {herb.status || 'Published'}
                    </span>
                  </div>
                </div>
                
                <div className="p-4">
                  <h3 className="font-bold text-lg text-[#2C3E2D] mb-1 truncate">{herb.name}</h3>
                  <p className="text-sm text-gray-400 italic mb-2 truncate">{herb.scientificName}</p>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[11px] text-[#97A97C] uppercase font-bold bg-[#97A97C]/5 px-2 py-0.5 rounded">
                      {CATEGORY_LABELS[herb.category] || herb.category || 'Uncategorized'}
                    </p>
                    {herb.origin && (
                       <p className="text-[10px] text-gray-400">📍 {herb.origin}</p>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2 mb-4 h-10">
                    {herb.description}
                  </p>
                  
                  <div className="flex gap-2">
                    <Link href={`/herb/${herb.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full text-xs">
                        <Eye className="w-3.5 h-3.5 mr-1" />
                        View
                      </Button>
                    </Link>
                    <Link href={`/admin/herbs/edit/${herb.id}`}>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="border-blue-200 text-blue-600 hover:bg-blue-50"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                    </Link>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDelete(herb.id, herb.name)}
                      disabled={deletingId === herb.id}
                      className="border-red-100 text-red-500 hover:bg-red-50"
                    >
                      {deletingId === herb.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}