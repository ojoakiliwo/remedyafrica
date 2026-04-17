'use client';

import { useState } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase/client';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Upload, ArrowLeft, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import Papa from 'papaparse';

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
  [key: string]: string;
}

export default function BulkUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ParsedHerb[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    
    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setPreview(results.data.slice(0, 5) as ParsedHerb[]);
      },
      error: (error: any) => {
        toast.error('Error parsing CSV: ' + error.message);
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast.error('Please select a CSV file');
      return;
    }
    
    setLoading(true);
    setUploadProgress(0);
    
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const herbs = results.data as ParsedHerb[];
        let successCount = 0;
        let errorCount = 0;

        for (let i = 0; i < herbs.length; i++) {
          const herb = herbs[i];
          
          try {
            // Skip empty rows
            if (!herb.name || !herb.scientificName) {
              errorCount++;
              continue;
            }

            // Build herb object matching your Firestore structure
            const herbData = {
              name: herb.name.trim(),
              scientificName: herb.scientificName.trim(),
              category: herb.category?.trim() || 'uncategorized',
              description: herb.description?.trim() || '',
              preparation: herb.preparation?.trim() || '',
              warnings: herb.warnings?.trim() || '',
              benefits: herb.benefits?.trim() || '',
              origin: herb.origin?.trim() || '',
              partsUsed: herb.partsUsed?.trim() || '',
              status: 'published',
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
              searchKeywords: [
                herb.name.toLowerCase(),
                herb.scientificName.toLowerCase(),
                herb.category?.toLowerCase(),
                ...(herb.benefits?.toLowerCase().split(',').map((s: string) => s.trim()) || [])
              ].filter(Boolean),
            };

            await addDoc(collection(db, 'herbs'), herbData);
            successCount++;
            setUploadProgress(Math.round(((i + 1) / herbs.length) * 100));
          } catch (error) {
            console.error('Error uploading herb:', herb.name, error);
            errorCount++;
          }
        }

        setLoading(false);
        toast.success(`Upload complete! ${successCount} herbs added, ${errorCount} errors.`);
        setFile(null);
        setPreview([]);
      },
      error: (error: any) => {
        setLoading(false);
        toast.error('Failed to parse CSV: ' + error.message);
      }
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Header */}
      <div className="bg-[#B8860B] text-white p-4 rounded-lg mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Bulk Upload Herbs</h1>
          <p className="text-sm text-white/80">Import multiple herbs via CSV to Firestore</p>
        </div>
        <Link href="/admin/herbs/list" className="text-sm hover:underline">← Back to List</Link>
      </div>

      <div className="max-w-4xl mx-auto">
        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-6">
          <h3 className="font-bold text-blue-800 mb-2">CSV Format Instructions</h3>
          <p className="text-sm text-blue-700 mb-2">Required columns:</p>
          <code className="block bg-white p-2 rounded text-xs text-gray-700">
            name,scientificName,category,description,preparation,warnings,benefits,origin,partsUsed
          </code>
          <a 
            href="/templates/herb-template.csv" 
            download
            className="text-blue-600 hover:underline text-sm mt-2 inline-block"
          >
            Download Template CSV →
          </a>
        </div>

        {/* Upload Form */}
        <div className="bg-white p-8 rounded-lg shadow">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* File Upload */}
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
                  <div className="text-4xl mb-2">📄</div>
                  <p className="text-gray-600">
                    {file ? file.name : 'Click to upload CSV file'}
                  </p>
                  <p className="text-sm text-gray-400 mt-1">Maximum file size: 5MB</p>
                </label>
              </div>
            </div>

            {/* Preview */}
            {preview.length > 0 && (
              <div>
                <h3 className="font-bold text-[#2C3E2D] mb-2">Preview (First 5 rows)</h3>
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
                <p className="text-sm text-gray-500 mt-2">
                  Showing {preview.length} of parsed rows. Ready to upload to Firestore.
                </p>
              </div>
            )}

            {/* Progress */}
            {loading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Uploading to Firestore...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  {/* Fixed dynamic width using CSS variable to satisfy no-inline-styles rule */}
                  <div 
                    className="bg-[#B8860B] h-2 rounded-full transition-all w-[var(--progress-width)]" 
                    style={{ '--progress-width': `${uploadProgress}%` } as React.CSSProperties}
                  ></div>
                </div>
              </div>
            )}

            {/* Submit */}
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
                <Button variant="outline">Cancel</Button>
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}