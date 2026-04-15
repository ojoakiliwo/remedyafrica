'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error('App Error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#F5F5DC] flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-md text-center">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Something went wrong!</h2>
        <p className="text-gray-600 mb-4">{error.message}</p>
        <div className="space-y-2">
          <button 
            onClick={reset}
            className="block w-full bg-[#97A97C] text-white px-4 py-2 rounded hover:bg-[#7A8A63]"
          >
            Try again
          </button>
          <Link 
            href="/"
            className="block w-full border border-gray-300 px-4 py-2 rounded hover:bg-gray-50"
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}