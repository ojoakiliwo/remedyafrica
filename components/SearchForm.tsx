'use client';

import { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';

interface SearchFormProps {
  initialQuery?: string;
  size?: 'default' | 'large';
}

export function SearchForm({ initialQuery = '', size = 'default' }: SearchFormProps) {
  const [query, setQuery] = useState(initialQuery);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    setLoading(true);
    router.push(`/search?q=${encodeURIComponent(query)}`);
  };

  const inputClasses = size === 'large' 
    ? "h-14 text-lg pl-12 pr-32 rounded-full border-2 border-[#97A97C]/30 focus:border-[#97A97C] bg-white/80 backdrop-blur-sm"
    : "h-10 pl-10 pr-24 rounded-full";

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <form onSubmit={handleSearch} className="relative">
        <Search className={`absolute left-4 top-1/2 -translate-y-1/2 text-[#97A97C] ${size === 'large' ? 'h-6 w-6' : 'h-4 w-4'}`} />
        
        <Input
          type="text"
          placeholder="Search ailments (e.g., 'malaria', 'anxiety', 'joint pain')..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className={inputClasses}
        />
        
        <Button 
          type="submit" 
          disabled={loading}
          className={`absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-[#97A97C] hover:bg-[#7A8A63] ${size === 'large' ? 'h-10 px-6' : 'h-7 px-4 text-xs'}`}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            'Search'
          )}
        </Button>
      </form>
    </div>
  );
}