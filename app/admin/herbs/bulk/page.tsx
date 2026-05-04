'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/firebase/client';
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { 
  Loader2, 
  Upload, 
  ArrowLeft, 
  AlertCircle, 
  FileSpreadsheet,
  CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';

interface ParsedHerb {
  name: string;
  scientificName: string;
  category: string;
  description: string;
  preparation: string;
  warnings: string;
  benefits: string;
  origin: string;
  partsUsed: string;
  [key: string]: string | undefined;
}

const VALID_CATEGORIES = [
  'mental-wellness', 'pain-relief', 'digestive-health', 
  'immune-support', 'skin-care', 'respiratory', 
  'womens-health', 'mens-health', 'uncategorized'
];

export default function BulkUploadPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ParsedHerb[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [success, setSuccess] = useState(false);
  const [resultStats, setResultStats] = useState({ success: 0, errors: 0, total: 0 });

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.csv')) {
      toast.error('Please upload a CSV file');
      return;
    }

    setFile(selectedFile);
    setSuccess(false);
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim());
      if (lines.length < 2) {
        toast.error('CSV appears to be empty or invalid');
        return;
      }
      
      const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
      const rows: ParsedHerb[] = [];
      
      for (let i = 1; i < Math.min(lines.length, 6); i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        const row: any = {};
        headers.forEach((h, idx) => {
          row[h] = values[idx] || '';
        });
        rows.push(row as ParsedHerb);
      }
      
      setPreview(rows);
    };
    reader.readAsText(selectedFile);
  };

  const parseCSV = (text: string): ParsedHerb[] => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    const rows: ParsedHerb[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      const row: any = {};
      headers.forEach((h, idx) => {
        row[h] = values[idx] || '';
      });
      if (row.name && row.scientificName) {
        rows.push(row as ParsedHerb);
      }
    }
    
    return rows;
  };

  // CRITICAL: Parse semicolon or comma separated string into array
  const parseArray = (value: string | undefined): string[] => {
    if (!value || !value.trim()) return [];
    const separator = value.includes(';') ? ';' : ',';
    return value.split(separator).map(s => s.trim()).filter(s => s.length > 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast.error('Please select a CSV file');
      return;
    }
    
    setLoading(true);
    setUploadProgress(0);
    setSuccess(false);
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const herbs = parseCSV(text);
      
      if (herbs.length === 0) {
        toast.error('No valid herb data found in CSV');
        setLoading(false);
        return;
      }

      let successCount = 0;
      let errorCount = 0;

      for (let i = 0; i < herbs.length; i++) {
        const herb = herbs[i];
        
        try {
          const category = herb.category?.trim().toLowerCase() || 'uncategorized';
          const validCategory = VALID_CATEGORIES.includes(category) ? category : 'uncategorized';

          const benefitsArray = parseArray(herb.benefits);
          const warningsArray = parseArray(herb.warnings);

          const herbData = {
            name: herb.name.trim(),
            scientificName: herb.scientificName.trim(),
            category: validCategory,
            description: herb.description?.trim() || '',
            preparation: herb.preparation?.trim() || '',
            warnings: warningsArray,
            benefits: benefitsArray,
            origin: herb.origin?.trim() || '',
            partsUsed: herb.partsUsed?.trim() || '',
            images: [],
            rating: 0,
            reviews: 0,
            views: 0,
            status: 'active' as const,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            searchKeywords: [
              herb.name.toLowerCase(),
              herb.scientificName.toLowerCase(),
              validCategory,
              ...benefitsArray.map(b => b.toLowerCase()),
              ...(herb.origin?.toLowerCase().split(',').map((s: string) => s.trim()) || [])
            ].filter(Boolean),
          };

          await addDoc(collection(db, 'herbs'), herbData);
          successCount++;
        } catch (error) {
          console.error('Error uploading herb:', herb.name, error);
          errorCount++;
        }
        
        setUploadProgress(Math.round(((i + 1) / herbs.length) * 100));
      }

      setResultStats({ success: successCount, errors: errorCount, total: herbs.length });
      setLoading(false);
      setSuccess(true);
      setFile(null);
      setPreview([]);
      toast.success(`Upload complete! ${successCount} added, ${errorCount} errors.`);
    };
    
    reader.readAsText(file);
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
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="bg-[#B8860B] text-white p-4 rounded-lg mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Bulk Upload Herbs</h1>
          <p className="text-sm text-white/80">Import multiple herbs via CSV to Firestore</p>
        </div>
        <Link href="/admin/herbs/list" className="text-sm hover:underline">← Back to List</Link>
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-6">
          <h3 className="font-bold text-blue-800 mb-2">CSV Format Instructions</h3>
          <p className="text-sm text-blue-700 mb-2">Required columns:</p>
          <code className="block bg-white p-2 rounded text-xs text-gray-700">
            name,scientificName,category,description,preparation,warnings,benefits,origin,partsUsed
          </code>
          <p className="text-xs text-blue-600 mt-2">
            <strong>Benefits/Warnings:</strong> Use semicolons (;) to separate multiple values.
          </p>
          <p className="text-xs text-blue-600 mt-1">
            Valid categories: {VALID_CATEGORIES.join(', ')}
          </p>
        </div>

        <div className="bg-white p-8 rounded-lg shadow">
          {success && (
            <div className="bg-green-50 border border-green-200 p-4 rounded-lg mb-6">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <h3 className="font-bold text-green-800">Upload Complete</h3>
              </div>
              <p className="text-sm text-green-700">
                {resultStats.success} of {resultStats.total} herbs uploaded successfully.
                {resultStats.errors > 0 && ` ${resultStats.errors} rows had errors.`}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block font-bold text-[#2C3E2D] mb-2">Select CSV File</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-[#B8860B] transition-colors">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="hidden"
                  id="csv-upload"
                />
                <label htmlFor="csv-upload" className="cursor-pointer">
                  <FileSpreadsheet className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                  <p className="text-gray-600">
                    {file ? file.name : 'Click to upload CSV file'}
                  </p>
                  <p className="text-sm text-gray-400 mt-1">Maximum file size: 5MB</p>
                </label>
              </div>
            </div>

            {preview.length > 0 && (
              <div>
                <h3 className="font-bold text-[#2C3E2D] mb-2">Preview (First {preview.length} rows)</h3>
                <div className="overflow-x-auto border rounded-lg">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        {Object.keys(preview[0]).map((header) => (
                          <th key={header} className="p-2 text-left font-semibold border-b">{header}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {preview.map((row, i) => (
                        <tr key={i} className="border-b">
                          {Object.values(row).map((cell: any, j) => (
                            <td key={j} className="p-2 border-r truncate max-w-[150px]">{cell}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {loading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Uploading to Firestore...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-[#B8860B] h-2 rounded-full transition-all" 
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
            )}

            <div className="flex gap-4">
              <Button 
                type="submit" 
                disabled={loading || !file}
                className="flex-1 bg-[#B8860B] hover:bg-[#9A7009] text-white"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload to Firestore
                  </>
                )}
              </Button>
              <Link href="/admin/herbs/list">
                <Button variant="outline" type="button">Cancel</Button>
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}