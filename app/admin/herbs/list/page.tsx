'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { db } from '@/lib/firebase/client';
import { collection, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Leaf, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  ArrowLeft,
  Eye,
  Loader2,
  Upload
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface Herb {
  id: string;
  name: string;
  scientificName?: string;
  category: string;
  description: string;
  images?: string[];
  status?: string;
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
};

export default function ManageHerbsPage() {
  const { isAdmin } = useAuth();
  const [herbs, setHerbs] = useState<Herb[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdmin) return;

    const unsubscribe = onSnapshot(collection(db, 'herbs'), (snapshot) => {
      const herbsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Herb[];
      setHerbs(herbsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isAdmin]);

  const handleDelete = async (herbId: string, herbName: string) => {
    if (!confirm(`Are you sure you want to delete "${herbName}"?`)) return;
    
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

  const filteredHerbs = herbs.filter(herb => 
    herb.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    herb.scientificName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#F5F5F0] flex items-center justify-center">
        <p className="text-red-600">Access denied. Admin only.</p>
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
            </div>
          </div>
          <div className="flex gap-2">
            <Link href="/admin/herbs/bulk">
              <Button variant="outline" className="border-[#97A97C] text-[#97A97C]">
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
              placeholder="Search herbs by name or scientific name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Herbs Grid */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-12 h-12 text-[#97A97C] animate-spin" />
          </div>
        ) : filteredHerbs.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center">
            <Leaf className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600">No herbs found</h3>
            <p className="text-gray-500">Try adjusting your search or upload a new herb</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredHerbs.map((herb) => (
              <div key={herb.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
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
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      herb.status === 'draft' 
                        ? 'bg-yellow-100 text-yellow-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {herb.status === 'draft' ? 'Draft' : 'Active'}
                    </span>
                  </div>
                </div>
                
                <div className="p-4">
                  <h3 className="font-bold text-lg text-[#2C3E2D] mb-1">{herb.name}</h3>
                  <p className="text-sm text-gray-500 italic mb-2">{herb.scientificName}</p>
                  <p className="text-xs text-[#97A97C] uppercase font-semibold mb-3">
                    {CATEGORY_LABELS[herb.category] || herb.category}
                  </p>
                  <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                    {herb.description}
                  </p>
                  
                  <div className="flex gap-2">
                    <Link href={`/herb/${herb.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                    </Link>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="border-blue-500 text-blue-500 hover:bg-blue-50"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDelete(herb.id, herb.name)}
                      disabled={deletingId === herb.id}
                      className="border-red-500 text-red-500 hover:bg-red-50"
                    >
                      {deletingId === herb.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
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