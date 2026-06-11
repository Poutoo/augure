"use client";

import { useState } from 'react';
import Header from '@/components/Header';
import SearchBar from '@/components/SearchBar';
import TopTrendCard from '@/components/TopTrendCard';
import TrendListItem from '@/components/TrendListItem';
import { mockTrends, TrendCategory } from '@/lib/mocks';
import { Icon } from '@iconify/react';
import Link from 'next/link';

const CATEGORIES: TrendCategory[] = ['Mode', 'Food', 'Musique', 'Art', 'Tech', 'Lifestyle'];

export default function Home() {
  const [activeCategory, setActiveCategory] = useState<TrendCategory | 'Tous'>('Tous');

  const topTrends = mockTrends.filter(t => t.rank && t.rank <= 3).slice(0, 3);
  const audienceTrends = mockTrends.filter(t => t.rank && t.rank > 2).slice(0, 3);
  const filteredTrends = activeCategory === 'Tous'
    ? mockTrends
    : mockTrends.filter(t => t.category === activeCategory);

  return (
    <main className="w-full min-h-screen overflow-x-hidden">
      {/* Conteneur centré sur desktop */}
      <div className="max-w-2xl mx-auto md:max-w-full">

        <Header />
        <SearchBar />

        {/* ── Top Tendances ── */}
        <section className="mt-6">
          <div className="flex items-center justify-between mb-4 px-4 md:px-8">
            <h2 className="font-syne font-bold text-xl text-[var(--color-text-dark)]">Top tendances</h2>
            <Link href="/search" className="font-inter text-sm font-semibold text-[var(--color-primary)] hover:underline">
              Tout voir
            </Link>
          </div>
          {/* Scroll horizontal contenu dans la largeur de l'écran */}
          <div className="flex gap-3 overflow-x-auto scrollbar-hide px-4 md:px-8 pb-3">
            {topTrends.map((trend) => (
              <TopTrendCard key={trend.id} trend={trend} />
            ))}
            <div className="flex-shrink-0 w-10 flex items-center justify-center opacity-30 pr-2">
              <Icon icon="mdi:chevron-right" className="text-3xl text-gray-500" />
            </div>
          </div>
        </section>

        {/* ── Pour votre audience ── */}
        <section className="mt-8 px-4 md:px-8">
          <h2 className="font-syne font-bold text-xl text-[var(--color-text-dark)] mb-3">Pour votre audience</h2>
          <div className="flex flex-col gap-3">
            {audienceTrends.map((trend) => (
              <TrendListItem key={trend.id} trend={trend} />
            ))}
          </div>
        </section>

        {/* ── Catégories ── */}
        <section className="mt-8">
          <h2 className="font-syne font-bold text-xl text-[var(--color-text-dark)] mb-4 px-4 md:px-8">Catégories</h2>
          {/* Scroll horizontal contenus dans la largeur */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide px-4 md:px-8 pb-2">
            <button
              onClick={() => setActiveCategory('Tous')}
              className={`flex-shrink-0 px-5 py-2 rounded-full font-syne font-semibold text-sm transition-all ${
                activeCategory === 'Tous'
                  ? 'bg-[var(--color-text-dark)] text-white'
                  : 'bg-white text-[var(--color-text-dark)] border border-gray-200 hover:border-gray-400'
              }`}
            >
              Tous
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex-shrink-0 px-5 py-2 rounded-full font-syne font-semibold text-sm transition-all ${
                  activeCategory === cat
                    ? 'bg-[var(--color-primary)] text-white'
                    : 'bg-white text-[var(--color-text-dark)] border border-gray-200 hover:border-gray-400'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </section>

        {/* ── Tendances Filtrées ── */}
        <section className="mt-6 px-4 md:px-8 pb-10">
          <h2 className="font-syne font-bold text-xl text-[var(--color-text-dark)] mb-4">
            Tendances{activeCategory !== 'Tous' ? ` ${activeCategory}` : ''}
          </h2>
          <div className="flex flex-col gap-3">
            {filteredTrends.length > 0 ? filteredTrends.map((trend) => (
              <TrendListItem key={trend.id} trend={trend} />
            )) : (
              <p className="font-inter text-gray-400 text-center py-8">Aucune tendance pour cette catégorie.</p>
            )}
          </div>
        </section>

      </div>
    </main>
  );
}
