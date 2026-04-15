'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function BulkUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      // Parse CSV preview (simplified)
      parseCSV(selectedFile);
    }
  };

  const parseCSV = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').slice(0, 6); // Show first 5 rows + header
      const parsed = lines.map(line => line.split(','));
      setPreview(parsed);
    };
    reader.readAsText(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      alert('Please select a CSV file');
      return;
    }
    
    setLoading(true);
    // TODO: Upload to Firebase
    setTimeout(() => {
      alert('Bulk upload completed! (Demo mode)');
      setLoading(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Header */}
      <div className="bg-[#B8860B] text-white p-4 rounded-lg mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Bulk Upload Herbs</h1>
          <p className="text-sm text-white/80">Import multiple herbs via CSV</p>
        </div>
        <Link href="/admin" className="text-sm hover:underline">← Back to Admin</Link>
      </div>

      <div className="max-w-4xl mx-auto">
        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-6">
          <h3 className="font-bold text-blue-800 mb-2">CSV Format Instructions</h3>
          <p className="text-sm text-blue-700 mb-2">Your CSV file should have these columns:</p>
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
                        {preview[0].map((header: string, i: number) => (
                          <th key={i} className="p-2 text-left font-semibold border-b">{header}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {preview.slice(1).map((row: string[], i: number) => (
                        <tr key={i} className="border-b">
                          {row.map((cell: string, j: number) => (
                            <td key={j} className="p-2 border-r">{cell}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Image Upload Note */}
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
              <h4 className="font-bold text-yellow-800 mb-1">📸 Images</h4>
              <p className="text-sm text-yellow-700">
                For bulk image upload, create a ZIP file with images named after the herb 
                (e.g., "ashwagandha-1.jpg", "ashwagandha-2.jpg") and upload separately.
              </p>
            </div>

            {/* Submit */}
            <div className="flex gap-4">
              <button 
                type="submit" 
                disabled={loading || !file}
                className="flex-1 bg-[#B8860B] text-white p-3 rounded font-bold hover:bg-[#9A7009] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '⏳ Uploading...' : '📤 Upload Herbs'}
              </button>
              <Link href="/admin" className="px-6 py-3 border border-gray-300 rounded hover:bg-gray-100">
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}