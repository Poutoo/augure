"use client";

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Icon } from '@iconify/react';
import Link from 'next/link';
import { ApiTrend, apiGetAllTrends } from '@/lib/api';
import ExplorerTrendCard from '@/components/ExplorerTrendCard';

const CATEGORIES = ['Tous', 'Mode', 'Food', 'Musique', 'Art', 'Tech', 'Lifestyle'];

type SortMode = 'default' | 'asc' | 'desc';

function SearchPageInner() {
  const searchParams = useSearchParams();
  const [activeCategory, setActiveCategory] = useState<string>('Tous');
  const [sortMode, setSortMode] = useState<SortMode>('default');
  const [query, setQuery] = useState(searchParams.get('q') ?? '');
  const [trends, setTrends] = useState<ApiTrend[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGetAllTrends({ limit: 100 })
      .then(d => setTrends(d.items))
      .finally(() => setLoading(false));
  }, []);

  const filteredTrends = useMemo(() => {
    let result = activeCategory === 'Tous'
      ? [...trends]
      : trends.filter(t => t.category?.toLowerCase() === activeCategory.toLowerCase());

    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(t =>
        t.title.toLowerCase().includes(q) ||
        (t.category ?? '').toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q)
      );
    }

    if (sortMode === 'asc') result.sort((a, b) => a.title.localeCompare(b.title));
    if (sortMode === 'desc') result.sort((a, b) => b.title.localeCompare(a.title));

    return result;
  }, [trends, activeCategory, sortMode, query]);

  const toggleSort = () => {
    setSortMode(prev => prev === 'default' ? 'asc' : prev === 'asc' ? 'desc' : 'default');
  };

  const sortLabel: Record<SortMode, string> = { default: 'Trier', asc: 'A → Z', desc: 'Z → A' };

  return (
    <main className="w-full min-h-screen overflow-x-hidden">
      <div className="max-w-2xl mx-auto md:max-w-full">

        <div className="flex items-center gap-3 px-4 pt-6 pb-4 md:px-8">
          <Link href="/" className="w-9 h-9 flex items-center justify-center bg-gray-100 rounded-full hover:bg-gray-200 transition-colors flex-shrink-0">
            <Icon icon="mdi:arrow-left" className="text-xl text-[var(--color-text-dark)]" />
          </Link>
          <h1 className="font-syne font-bold text-2xl text-[var(--color-text-dark)]">Tendances</h1>
        </div>

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

        <div className="flex gap-0 overflow-x-auto scrollbar-hide px-4 md:px-8 border-b border-gray-100">
          {CATEGORIES.map((cat, i) => {
            const active = activeCategory === cat;
            return (
              <button
                key={cat}
                style={{ animationDelay: `${i * 40}ms` }}
                onClick={() => setActiveCategory(cat)}
                className={`anim-fade-up flex-shrink-0 px-4 py-3 font-syne font-semibold text-sm border-b-2 transition-all whitespace-nowrap ${active ? 'border-[var(--color-primary)] text-[var(--color-primary)]' : 'border-transparent text-gray-400 hover:text-gray-700'}`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between px-4 md:px-8 py-3">
          <p className="font-inter text-sm text-gray-500">
            {loading ? '…' : <><span className="font-semibold text-[var(--color-text-dark)]">{filteredTrends.length}</span> tendance{filteredTrends.length > 1 ? 's' : ''} trouvée{filteredTrends.length > 1 ? 's' : ''}</>}
          </p>
          <button
            onClick={toggleSort}
            className="flex items-center gap-1.5 font-inter text-sm font-semibold text-[var(--color-text-dark)] hover:text-[var(--color-primary)] transition-colors"
          >
            {sortLabel[sortMode]}
            <Icon icon="mdi:swap-vertical" className="text-base" />
          </button>
        </div>

        <div className="px-4 md:px-8 pb-10">
          {loading ? (
            <div className="flex flex-col gap-4 pt-4">
              {[1, 2, 3, 4].map(i => <div key={i} className="h-24 rounded-2xl bg-gray-100 animate-pulse" />)}
            </div>
          ) : filteredTrends.length > 0 ? (
            <div key={activeCategory + query} className="flex flex-col">
              {filteredTrends.map((trend, i) => (
                <div key={trend.id} className="anim-fade-up" style={{ animationDelay: `${Math.min(i * 50, 300)}ms` }}>
                  <ExplorerTrendCard trend={trend} />
                </div>
              ))}
            </div>
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

export default function SearchPage() {
  return (
    <Suspense>
      <SearchPageInner />
    </Suspense>
  );
}
