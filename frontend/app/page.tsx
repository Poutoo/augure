"use client";

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import SearchBar from '@/components/SearchBar';
import TopTrendCard from '@/components/TopTrendCard';
import TrendListItem from '@/components/TrendListItem';
import { ApiTrend, apiGetAllTrends } from '@/lib/api';
import { Icon } from '@iconify/react';
import Link from 'next/link';

const CATEGORIES = ['Mode', 'Food', 'Musique', 'Art', 'Tech', 'Sport', 'Beauté'];

export default function Home() {
  const [activeCategory, setActiveCategory] = useState<string>('Tous');
  const [allTrends, setAllTrends] = useState<ApiTrend[]>([]);
  const [listLoading, setListLoading] = useState(true);

  useEffect(() => {
    apiGetAllTrends({ limit: 50 })
      .then(d => setAllTrends(d.items))
      .finally(() => setListLoading(false));
  }, []);

  const topTrends = allTrends.filter(t => t.rank != null && t.rank <= 3).slice(0, 3);

  const filteredTrends = activeCategory === 'Tous'
    ? allTrends
    : allTrends.filter(t => t.category?.toLowerCase() === activeCategory.toLowerCase());

  return (
    <main className="w-full min-h-screen overflow-x-hidden">
      <div className="max-w-2xl mx-auto md:max-w-full">

        {/* ── Hero sombre ── */}
        <div
          className="bg-[var(--color-text-dark)] relative overflow-hidden pb-7"
          style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(255,255,255,0.025) 1px, rgba(255,255,255,0.025) 2px)' }}
        >
          <Header dark />
          <SearchBar dark />
        </div>

        {/* ── Top Tendances ── */}
        <section className="mt-6">
          <div className="flex items-center justify-between mb-4 px-4 md:px-8">
            <h2 className="font-syne font-bold text-xl text-[var(--color-text-dark)]">Top tendances</h2>
            <Link href="/search" className="font-inter text-sm font-semibold text-[var(--color-primary)] hover:underline">
              Tout voir
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide px-4 md:px-8 pb-3">
            {listLoading
              ? [1, 2, 3].map(i => <div key={i} className="flex-shrink-0 w-44 h-52 rounded-2xl bg-gray-200 animate-pulse" />)
              : topTrends.map((trend, i) => (
                  <div key={trend.id} className="anim-scale-in flex-shrink-0" style={{ animationDelay: `${i * 80}ms` }}>
                    <TopTrendCard trend={trend} />
                  </div>
                ))
            }
            <div className="flex-shrink-0 w-8 flex items-center justify-center opacity-30">
              <Icon icon="mdi:chevron-right" className="text-3xl text-gray-500" />
            </div>
          </div>
        </section>

        {/* ── Catégories ── */}
        <section className="mt-8">
          <h2 className="font-syne font-bold text-xl text-[var(--color-text-dark)] mb-4 px-4 md:px-8">Catégories</h2>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide px-4 md:px-8 pb-2">
            <button
              onClick={() => setActiveCategory('Tous')}
              style={{ animationDelay: '0ms' }}
              className={`anim-fade-up flex-shrink-0 px-5 py-2 rounded-full font-syne font-semibold text-sm transition-all ${activeCategory === 'Tous' ? 'bg-[var(--color-text-dark)] text-white' : 'bg-white text-[var(--color-text-dark)] border border-gray-200 hover:border-gray-400'}`}
            >
              Tous
            </button>
            {CATEGORIES.map((cat, i) => (
              <button
                key={cat}
                style={{ animationDelay: `${(i + 1) * 40}ms` }}
                onClick={() => setActiveCategory(cat)}
                className={`anim-fade-up flex-shrink-0 px-5 py-2 rounded-full font-syne font-semibold text-sm transition-all ${activeCategory === cat ? 'bg-[var(--color-text-dark)] text-white' : 'bg-white text-[var(--color-text-dark)] border border-gray-200 hover:border-gray-400'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </section>

        {/* ── Pour votre audience — bannière compacte ── */}
        <section className="mt-6 px-4 md:px-8">
          <div className="bg-white rounded-2xl px-5 py-4 flex items-center justify-between shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
            <span className="font-syne font-bold text-[var(--color-text-dark)] text-base">Pour votre audience</span>
            <Link href="/profile" className="font-inter text-sm text-gray-400 hover:text-[var(--color-text-dark)] transition-colors whitespace-nowrap">
              Voir mon audience →
            </Link>
          </div>
        </section>

        {/* ── Tendances filtrées ── */}
        <section className="mt-6 px-4 md:px-8 pb-10">
          <h2 className="font-syne font-bold text-2xl text-[var(--color-text-dark)] mb-4">
            Tendances{activeCategory !== 'Tous' ? ` ${activeCategory}` : ''}
          </h2>
          {listLoading ? (
            <div className="flex flex-col gap-3">
              {[1, 2, 3].map(i => <div key={i} className="h-16 rounded-2xl bg-gray-100 animate-pulse" />)}
            </div>
          ) : filteredTrends.length > 0 ? (
            <div className="flex flex-col gap-3">
              {filteredTrends.map((trend, i) => (
                <div key={trend.id} className="anim-fade-up" style={{ animationDelay: `${Math.min(i * 50, 300)}ms` }}>
                  <TrendListItem trend={trend} />
                </div>
              ))}
            </div>
          ) : (
            <p className="font-inter text-gray-400 text-center py-8">Aucune tendance pour cette catégorie.</p>
          )}
        </section>

      </div>
    </main>
  );
}
