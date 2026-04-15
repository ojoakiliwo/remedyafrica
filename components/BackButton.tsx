'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

interface BackButtonProps {
  label?: string;
  className?: string;
}

export default function BackButton({ label = 'Back', className = '' }: BackButtonProps) {
  const router = useRouter();
  
  return (
    <button
      onClick={() => router.back()}
      className={`flex items-center gap-2 text-[#97A97C] hover:text-[#7A8A63] transition-colors ${className}`}
    >
      <ArrowLeft className="w-4 h-4" />
      <span>{label}</span>
    </button>
  );
}