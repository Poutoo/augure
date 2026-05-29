"use client";

import { Icon } from '@iconify/react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SearchBar() {
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
      className="flex items-center gap-2 px-4 mt-3 mb-1 md:px-8 w-full"
    >
      {/* Champ de recherche — prend tout l'espace dispo, ne peut pas dépasser */}
      <div className="flex items-center bg-white rounded-xl border border-gray-100 shadow-sm px-3 py-3 min-w-0 flex-1 focus-within:border-[var(--color-primary)] focus-within:ring-2 focus-within:ring-[var(--color-primary)]/10 transition-all">
        <Icon icon="mdi:magnify" className="text-xl text-gray-400 flex-shrink-0" />
        <input
          type="text"
          className="min-w-0 flex-1 bg-transparent outline-none px-2 font-inter text-[15px] text-[var(--color-text-dark)] placeholder:text-gray-400"
          placeholder="Rechercher une tendance..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {/* Bouton Filtres — largeur fixe, ne se réduit pas */}
      <button
        type="button"
        className="flex-none px-4 py-3 bg-[var(--color-primary)] text-white font-syne font-semibold text-sm rounded-xl hover:bg-[#3318dd] active:scale-95 transition-all whitespace-nowrap"
        onClick={() => router.push('/search')}
      >
        Filtres
      </button>
    </form>
  );
}
