"use client";

import { Icon } from '@iconify/react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SearchBar({ dark = false }: { dark?: boolean }) {
  const [query, setQuery] = useState('');
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center px-4 mt-3 mb-1 md:px-8 w-full"
    >
      <div className={`flex items-center rounded-xl px-3 py-3 min-w-0 flex-1 transition-all ${dark
        ? 'bg-white/10 border border-white/10 focus-within:border-white/30'
        : 'bg-white border border-gray-100 shadow-sm focus-within:border-[var(--color-primary)] focus-within:ring-2 focus-within:ring-[var(--color-primary)]/10'}`}>
        <Icon icon="mdi:magnify" className={`text-xl flex-shrink-0 ${dark ? 'text-white/40' : 'text-gray-400'}`} />
        <input
          type="text"
          className={`min-w-0 flex-1 bg-transparent outline-none px-2 font-syne text-[15px] ${dark ? 'text-white placeholder:text-white/40' : 'text-[var(--color-text-dark)] placeholder:text-gray-400'}`}
          placeholder="Rechercher une tendance..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
    </form>
  );
}
