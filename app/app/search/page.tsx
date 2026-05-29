"use client";

import { useState, useMemo } from 'react';
import { Icon } from '@iconify/react';
import Link from 'next/link';
import { mockTrends, TrendCategory } from '@/lib/mocks';
import ExplorerTrendCard from '@/components/ExplorerTrendCard';

const CATEGORIES: (TrendCategory | 'Tous')[] = ['Tous', 'Mode', 'Food', 'Musique', 'Art', 'Tech', 'Lifestyle'];

type SortMode = 'default' | 'asc' | 'desc';

export default function SearchPage() {
  const [activeCategory, setActiveCategory] = useState<TrendCategory | 'Tous'>('Tous');
  const [sortMode, setSortMode] = useState<SortMode>('default');
  const [query, setQuery] = useState('');

  const filteredTrends = useMemo(() => {
    let result = activeCategory === 'Tous'
      ? [...mockTrends]
      : mockTrends.filter(t => t.category === activeCategory);

    if (query.trim()) {
      result = result.filter(t =>
        t.title.toLowerCase().includes(query.toLowerCase()) ||
        t.category.toLowerCase().includes(query.toLowerCase())
      );
    }

    if (sortMode === 'asc') result.sort((a, b) => a.title.localeCompare(b.title));
    if (sortMode === 'desc') result.sort((a, b) => b.title.localeCompare(a.title));

    return result;
  }, [activeCategory, sortMode, query]);

  const toggleSort = () => {
    setSortMode(prev => prev === 'default' ? 'asc' : prev === 'asc' ? 'desc' : 'default');
  };

  const sortLabel: Record<SortMode, string> = {
    default: 'Trier',
    asc: 'A → Z',
    desc: 'Z → A',
  };

  return (
    <main className="w-full min-h-screen overflow-x-hidden">
      <div className="max-w-2xl mx-auto md:max-w-full">

        {/* ── Header ── */}
        <div className="flex items-center gap-3 px-4 pt-6 pb-4 md:px-8">
          <Link href="/" className="w-9 h-9 flex items-center justify-center bg-gray-100 rounded-full hover:bg-gray-200 transition-colors flex-shrink-0">
            <Icon icon="mdi:arrow-left" className="text-xl text-[var(--color-text-dark)]" />
          </Link>
          <h1 className="font-syne font-bold text-2xl text-[var(--color-text-dark)]">Tendances</h1>
        </div>

        {/* ── Barre de recherche ── */}
        <div className="px-4 md:px-8 mb-4">
          <div className="flex items-center bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3 gap-2 focus-within:border-[var(--color-primary)]/40 transition-all">
            <Icon icon="mdi:magnify" className="text-lg text-gray-400 flex-shrink-0" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Rechercher une tendance..."
              className="flex-1 min-w-0 bg-transparent outline-none font-inter text-[15px] text-[var(--color-text-dark)] placeholder:text-gray-400"
            />
            {query && (
              <button onClick={() => setQuery('')} className="flex-shrink-0">
                <Icon icon="mdi:close-circle" className="text-gray-300 text-lg" />
              </button>
            )}
          </div>
        </div>

        {/* ── Onglets catégories ── */}
        <div className="flex gap-0 overflow-x-auto scrollbar-hide px-4 md:px-8 border-b border-gray-100">
          {CATEGORIES.map(cat => {
            const active = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex-shrink-0 px-4 py-3 font-syne font-semibold text-sm border-b-2 transition-all whitespace-nowrap ${
                  active
                    ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                    : 'border-transparent text-gray-400 hover:text-gray-700'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* ── Compteur + Tri ── */}
        <div className="flex items-center justify-between px-4 md:px-8 py-3">
          <p className="font-inter text-sm text-gray-500">
            <span className="font-semibold text-[var(--color-text-dark)]">{filteredTrends.length}</span> tendance{filteredTrends.length > 1 ? 's' : ''} trouvée{filteredTrends.length > 1 ? 's' : ''}
          </p>
          <button
            onClick={toggleSort}
            className="flex items-center gap-1.5 font-inter text-sm font-semibold text-[var(--color-text-dark)] hover:text-[var(--color-primary)] transition-colors"
          >
            {sortLabel[sortMode]}
            <Icon icon="mdi:swap-vertical" className="text-base" />
          </button>
        </div>

        {/* ── Liste des tendances ── */}
        <div className="px-4 md:px-8 pb-10">
          {filteredTrends.length > 0 ? (
            filteredTrends.map(trend => (
              <ExplorerTrendCard key={trend.id} trend={trend} />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Icon icon="mdi:magnify-close" className="text-5xl text-gray-200 mb-4" />
              <p className="font-syne font-semibold text-gray-400">Aucune tendance trouvée</p>
              <p className="font-inter text-sm text-gray-300 mt-1">Essayez un autre filtre ou mot-clé.</p>
            </div>
          )}
        </div>

      </div>
    </main>
  );
}
