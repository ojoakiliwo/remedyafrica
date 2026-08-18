'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/firebase/client';
import { 
  collection, 
  query, 
  orderBy, 
  getDocs, 
  doc, 
  deleteDoc, 
  getDoc
} from 'firebase/firestore';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Loader2, 
  Plus, 
  Upload, 
  Trash2, 
  Edit, 
  Eye, 
  AlertCircle,
  Search,
  Leaf,
  Image as ImageIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { getHerbPrimaryImage, getHerbImageCount } from '@/lib/herb-images';

interface Herb {
  id: string;
  name: string;
  scientificName: string;
  category: string;
  description: string;
  origin: string;
  partsUsed: string;
  status: string;
  benefits: string[];
  images?: { url: string }[] | string[];
  imageUrl?: string;
  createdAt?: any;
}

const CATEGORY_LABELS: Record<string, string> = {
  'mental-wellness': 'Mental Wellness',
  'pain-relief': 'Pain Relief',
  'digestive-health': 'Digestive Health',
  'immune-support': 'Immune Support',
  'skin-care': 'Skin Care',
  'respiratory': 'Respiratory',
  'womens-health': "Women's Health",
  'mens-health': "Men's Health",
  'uncategorized': 'Uncategorized'
};

const CATEGORY_COLORS: Record<string, string> = {
  'mental-wellness': 'bg-purple-100 text-purple-800',
  'pain-relief': 'bg-red-100 text-red-800',
  'digestive-health': 'bg-green-100 text-green-800',
  'immune-support': 'bg-blue-100 text-blue-800',
  'skin-care': 'bg-pink-100 text-pink-800',
  'respiratory': 'bg-cyan-100 text-cyan-800',
  'womens-health': 'bg-rose-100 text-rose-800',
  'mens-health': 'bg-indigo-100 text-indigo-800',
  'uncategorized': 'bg-gray-100 text-gray-800'
};

export default function HerbsListPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  
  const [herbs, setHerbs] = useState<Herb[]>([]);
  const [filteredHerbs, setFilteredHerbs] = useState<Herb[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Restore scroll + search on mount
  useEffect(() => {
    const savedSearch = sessionStorage.getItem('herbListSearch');
    const savedScroll = sessionStorage.getItem('herbListScroll');
    
    if (savedSearch) {
      setSearchQuery(savedSearch);
      sessionStorage.removeItem('herbListSearch');
    }
    
    if (savedScroll) {
      const restoreScroll = () => {
        window.scrollTo(0, parseInt(savedScroll, 10));
        sessionStorage.removeItem('herbListScroll');
      };
      const timer = setTimeout(restoreScroll, 300);
      return () => clearTimeout(timer);
    }
  }, []);

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

  useEffect(() => {
    if (!isAdmin) return;
    
    const fetchHerbs = async () => {
      try {
        const q = query(collection(db, 'herbs'), orderBy('name', 'asc'));
        const snapshot = await getDocs(q);
        const herbsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Herb[];
        setHerbs(herbsData);
        setFilteredHerbs(herbsData);
      } catch (err) {
        console.error('Error fetching herbs:', err);
        toast.error('Failed to load herbs');
      } finally {
        setLoading(false);
      }
    };
    
    fetchHerbs();
  }, [isAdmin]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredHerbs(herbs);
      return;
    }
    
    const query_lower = searchQuery.toLowerCase();
    const filtered = herbs.filter(herb => 
      herb.name.toLowerCase().includes(query_lower) ||
      herb.scientificName.toLowerCase().includes(query_lower) ||
      herb.category.toLowerCase().includes(query_lower) ||
      herb.origin.toLowerCase().includes(query_lower) ||
      (Array.isArray(herb.benefits) ? herb.benefits : []).some((b: string) => b.toLowerCase().includes(query_lower))
    );
    setFilteredHerbs(filtered);
  }, [searchQuery, herbs]);

  const handleDelete = async (herbId: string, herbName: string) => {
    if (!confirm(`Are you sure you want to delete "${herbName}"?`)) return;
    
    setDeletingId(herbId);
    try {
      await deleteDoc(doc(db, 'herbs', herbId));
      setHerbs(prev => prev.filter(h => h.id !== herbId));
      setFilteredHerbs(prev => prev.filter(h => h.id !== herbId));
      toast.success(`"${herbName}" deleted successfully`);
    } catch (err) {
      console.error('Error deleting herb:', err);
      toast.error('Failed to delete herb');
    } finally {
      setDeletingId(null);
    }
  };

  const handleEdit = (herbId: string) => {
    sessionStorage.setItem('herbListScroll', window.scrollY.toString());
    sessionStorage.setItem('herbListSearch', searchQuery);
    router.push(`/admin/herbs/edit/${herbId}`);
  };

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
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <Leaf className="w-8 h-8 text-[#97A97C]" />
            <div>
              <h1 className="text-2xl font-bold">Herb Management</h1>
              <p className="text-gray-300 text-sm">
                {herbs.length} herb{herbs.length !== 1 ? 's' : ''} in database — use Photos to upload pictures yourself
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Link href="/admin/herbs/bulk">
              <Button variant="outline" className="border-white/30 text-white hover:bg-white/10">
                <Upload className="w-4 h-4 mr-2" />
                Bulk Upload
              </Button>
            </Link>
            <Link href="/admin/herbs/upload">
              <Button className="bg-[#97A97C] hover:bg-[#7A8A63] text-white">
                <Plus className="w-4 h-4 mr-2" />
                Add Herb
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search herbs by name, scientific name, category, origin, or benefits..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-full bg-white text-ink placeholder:text-ink-muted caret-ink"
            />
          </div>
          {searchQuery && (
            <p className="text-sm text-gray-500 mt-2">
              Showing {filteredHerbs.length} of {herbs.length} herbs
            </p>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-12 h-12 text-[#97A97C] animate-spin" />
          </div>
        ) : herbs.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <Leaf className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Herbs Found</h3>
            <p className="text-gray-500 mb-6">Your herbs collection is empty.</p>
            <div className="flex gap-4 justify-center">
              <Link href="/admin/herbs/bulk">
                <Button className="bg-[#B8860B] hover:bg-[#9A7009]">
                  <Upload className="w-4 h-4 mr-2" />
                  Bulk Upload CSV
                </Button>
              </Link>
              <Link href="/admin/herbs/upload">
                <Button variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Single Herb
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left p-4 font-semibold text-gray-700">Herb</th>
                    <th className="text-left p-4 font-semibold text-gray-700">Category</th>
                    <th className="text-left p-4 font-semibold text-gray-700 hidden md:table-cell">Origin</th>
                    <th className="text-left p-4 font-semibold text-gray-700 hidden lg:table-cell">Parts Used</th>
                    <th className="text-left p-4 font-semibold text-gray-700 hidden lg:table-cell">Photos</th>
                    <th className="text-right p-4 font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredHerbs.map((herb) => (
                    <tr key={herb.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {(() => {
                            const imgUrl = getHerbPrimaryImage(herb);
                            return imgUrl ? (
                              <img 
                                src={imgUrl} 
                                alt={herb.name}
                                className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                                <span className="text-xs text-gray-400">—</span>
                              </div>
                            );
                          })()}
                          <div>
                            <p className="font-semibold text-[#2C3E2D]">{herb.name}</p>
                            <p className="text-xs text-gray-500 italic">{herb.scientificName}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${CATEGORY_COLORS[herb.category] || CATEGORY_COLORS.uncategorized}`}>
                          {CATEGORY_LABELS[herb.category] || herb.category}
                        </span>
                      </td>
                      <td className="p-4 text-gray-600 hidden md:table-cell">
                        {herb.origin || '-'}
                      </td>
                      <td className="p-4 text-gray-600 hidden lg:table-cell">
                        {herb.partsUsed || '-'}
                      </td>
                      <td className="p-4 hidden lg:table-cell">
                        {(() => {
                          const count = getHerbImageCount(herb);
                          return (
                            <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${count === 0 ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'}`}>
                              {count === 0 ? 'No photos' : `${count} photo${count === 1 ? '' : 's'}`}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/admin/herbs/photos/${herb.id}`}>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 border-[#97A97C] text-[#2C3E2D] hover:bg-[#97A97C]/10"
                              title="Upload photos"
                              aria-label={`Upload photos for ${herb.name}`}
                            >
                              <ImageIcon className="w-4 h-4 mr-1" />
                              Photos
                            </Button>
                          </Link>

                          <Link href={`/herb/${herb.id}`} target="_blank">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 w-8 p-0"
                              title="View public page"
                              aria-label="View herb"
                            >
                              <Eye className="w-4 h-4 text-gray-500" />
                            </Button>
                          </Link>
                          
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0"
                            onClick={() => handleEdit(herb.id)}
                            title="Edit herb"
                            aria-label="Edit herb"
                          >
                            <Edit className="w-4 h-4 text-blue-500" />
                          </Button>
                          
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0"
                            onClick={() => handleDelete(herb.id, herb.name)}
                            disabled={deletingId === herb.id}
                            title="Delete herb"
                            aria-label="Delete herb"
                          >
                            {deletingId === herb.id ? (
                              <Loader2 className="w-4 h-4 animate-spin text-red-500" />
                            ) : (
                              <Trash2 className="w-4 h-4 text-red-500" />
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {filteredHerbs.length === 0 && searchQuery && (
              <div className="p-12 text-center text-gray-500">
                No herbs match your search.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}