"use client";

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import SearchBar from '@/components/SearchBar';
import TopTrendCard from '@/components/TopTrendCard';
import TrendListItem from '@/components/TrendListItem';
import { ApiTrend, apiGetAllTrends, apiGetRecommendedTrends } from '@/lib/api';
import { Icon } from '@iconify/react';
import Link from 'next/link';

const CATEGORIES = ['Mode', 'Food', 'Musique', 'Art', 'Tech', 'Lifestyle'];

export default function Home() {
  const [activeCategory, setActiveCategory] = useState<string>('Tous');
  const [allTrends, setAllTrends] = useState<ApiTrend[]>([]);
  const [audienceTrends, setAudienceTrends] = useState<ApiTrend[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [audienceLoading, setAudienceLoading] = useState(true);

  // Fetch all trends on mount
  useEffect(() => {
    apiGetAllTrends({ limit: 50 })
      .then(d => setAllTrends(d.items))
      .finally(() => setListLoading(false));
  }, []);

  // Fetch personalized trends if logged in
  useEffect(() => {
    const token = localStorage.getItem('augure_token');
    if (!token) { setAudienceLoading(false); return; }
    apiGetRecommendedTrends(token, 5)
      .then(setAudienceTrends)
      .finally(() => setAudienceLoading(false));
  }, []);

  const topTrends = allTrends.filter(t => t.rank != null && t.rank <= 3).slice(0, 3);

  const filteredTrends = activeCategory === 'Tous'
    ? allTrends
    : allTrends.filter(t => t.category?.toLowerCase() === activeCategory.toLowerCase());

  return (
    <main className="w-full min-h-screen overflow-x-hidden">
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
          <div className="flex gap-3 overflow-x-auto scrollbar-hide px-4 md:px-8 pb-3">
            {listLoading
              ? [1, 2, 3].map(i => <div key={i} className="flex-shrink-0 w-44 h-52 rounded-2xl bg-gray-200 animate-pulse" />)
              : topTrends.map(trend => <TopTrendCard key={trend.id} trend={trend} />)
            }
            <div className="flex-shrink-0 w-10 flex items-center justify-center opacity-30 pr-2">
              <Icon icon="mdi:chevron-right" className="text-3xl text-gray-500" />
            </div>
          </div>
        </section>

        {/* ── Pour votre audience ── */}
        <section className="mt-8 px-4 md:px-8">
          <h2 className="font-syne font-bold text-xl text-[var(--color-text-dark)] mb-3">Pour votre audience</h2>
          {audienceLoading ? (
            <div className="flex flex-col gap-3">
              {[1, 2, 3].map(i => <div key={i} className="h-16 rounded-2xl bg-gray-100 animate-pulse" />)}
            </div>
          ) : audienceTrends.length > 0 ? (
            <div className="flex flex-col gap-3">
              {audienceTrends.map(t => <TrendListItem key={t.id} trend={t} />)}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <p className="font-inter text-sm text-gray-400">Complétez votre profil pour voir des tendances personnalisées.</p>
              <a href="/onboarding" className="font-syne font-semibold text-sm text-[var(--color-text-dark)] underline underline-offset-2">
                Configurer mon profil →
              </a>
            </div>
          )}
        </section>

        {/* ── Catégories ── */}
        <section className="mt-8">
          <h2 className="font-syne font-bold text-xl text-[var(--color-text-dark)] mb-4 px-4 md:px-8">Catégories</h2>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide px-4 md:px-8 pb-2">
            <button
              onClick={() => setActiveCategory('Tous')}
              className={`flex-shrink-0 px-5 py-2 rounded-full font-syne font-semibold text-sm transition-all ${activeCategory === 'Tous' ? 'bg-[var(--color-text-dark)] text-white' : 'bg-white text-[var(--color-text-dark)] border border-gray-200 hover:border-gray-400'}`}
            >
              Tous
            </button>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex-shrink-0 px-5 py-2 rounded-full font-syne font-semibold text-sm transition-all ${activeCategory === cat ? 'bg-[var(--color-primary)] text-white' : 'bg-white text-[var(--color-text-dark)] border border-gray-200 hover:border-gray-400'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </section>

        {/* ── Tendances filtrées ── */}
        <section className="mt-6 px-4 md:px-8 pb-10">
          <h2 className="font-syne font-bold text-xl text-[var(--color-text-dark)] mb-4">
            Tendances{activeCategory !== 'Tous' ? ` ${activeCategory}` : ''}
          </h2>
          {listLoading ? (
            <div className="flex flex-col gap-3">
              {[1, 2, 3].map(i => <div key={i} className="h-16 rounded-2xl bg-gray-100 animate-pulse" />)}
            </div>
          ) : filteredTrends.length > 0 ? (
            <div className="flex flex-col gap-3">
              {filteredTrends.map(trend => <TrendListItem key={trend.id} trend={trend} />)}
            </div>
          ) : (
            <p className="font-inter text-gray-400 text-center py-8">Aucune tendance pour cette catégorie.</p>
          )}
        </section>

      </div>
    </main>
  );
}
