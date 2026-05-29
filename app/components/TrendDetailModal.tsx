"use client";

import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Icon } from '@iconify/react';
import { mockTrends, TrendStatus } from '@/lib/mocks';
import { useEffect, useState } from 'react';

const statusConfig: Record<TrendStatus, { label: string; icon: string; color: string; bg: string }> = {
  'Viral': { label: 'Viral', icon: 'mdi:fire', color: 'text-emerald-500', bg: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
  'Émergent': { label: 'Émergent', icon: 'mdi:trending-up', color: 'text-emerald-500', bg: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
  'En hausse': { label: 'En hausse', icon: 'mdi:arrow-up-bold', color: 'text-emerald-500', bg: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
  'Stable': { label: 'Stable', icon: 'mdi:arrow-right-bold', color: 'text-gray-500', bg: 'bg-gray-50 text-gray-700 border-gray-100' },
  'En baisse': { label: 'En baisse', icon: 'mdi:arrow-down-bold', color: 'text-red-500', bg: 'bg-red-50 text-red-700 border-red-100' },
};

export default function TrendDetailModal() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [activeTrend, setActiveTrend] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  const trendId = searchParams.get('trendId');
  const trend = trendId ? mockTrends.find(t => t.id === parseInt(trendId)) : null;

  useEffect(() => {
    if (trend) {
      setActiveTrend(trend);
      // Déclenche l'animation d'entrée au frame suivant
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 30);
      document.body.style.overflow = 'hidden';
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
      // Attend la fin de l'animation de sortie (300ms) avant de démonter le contenu
      const timer = setTimeout(() => {
        setActiveTrend(null);
      }, 300);
      document.body.style.overflow = 'unset';
      return () => clearTimeout(timer);
    }
  }, [trend]);

  if (!activeTrend) return null;

  const handleClose = () => {
    setIsVisible(false);
    // On ferme d'abord l'animation visuelle, puis on retire l'ID de l'URL
    setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete('trendId');
      const query = params.toString() ? `?${params.toString()}` : '';
      router.push(`${pathname}${query}`, { scroll: false });
    }, 250);
  };

  const status = statusConfig[activeTrend.status];

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      {/* Backdrop overlay */}
      <div 
        onClick={handleClose}
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ease-out ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Modal Container */}
      <div className={`relative bg-white w-full md:max-w-2xl h-[92vh] md:h-[85vh] rounded-t-[32px] md:rounded-[32px] shadow-2xl flex flex-col overflow-hidden z-10 transition-all duration-300 ease-out transform ${
        isVisible 
          ? 'translate-y-0 opacity-100 md:scale-100' 
          : 'translate-y-full opacity-0 md:translate-y-8 md:scale-95'
      }`}>
        
        {/* Top Dark Cover Image/Vibe Section */}
        <div className="relative bg-neutral-950 h-44 flex-shrink-0 flex flex-col justify-between p-6">
          {/* Top Actions Row */}
          <div className="flex justify-between items-center w-full">
            <button 
              onClick={handleClose}
              className="w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full transition-colors"
            >
              <Icon icon="mdi:arrow-left" className="text-xl text-white" />
            </button>
            <div className="flex items-center gap-2">
              <span className="px-3.5 py-1.5 bg-blue-600 text-white font-syne font-bold text-xs rounded-full uppercase tracking-wider">
                {activeTrend.category}
              </span>
              <span className="px-3.5 py-1.5 bg-emerald-500/20 text-emerald-400 border border-emerald-400/30 font-syne font-bold text-xs rounded-full flex items-center gap-1">
                <Icon icon="mdi:trending-up" className="text-sm" />
                {activeTrend.status}
              </span>
            </div>
            <button 
              onClick={() => setIsBookmarked(!isBookmarked)}
              className="w-10 h-10 flex items-center justify-center bg-white hover:bg-gray-100 rounded-full transition-colors"
            >
              <Icon 
                icon={isBookmarked ? "mdi:bookmark" : "mdi:bookmark-outline"} 
                className={`text-xl ${isBookmarked ? 'text-blue-600' : 'text-gray-800'}`} 
              />
            </button>
          </div>

          {/* Sparkles / Abstract decoration in background */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-20 bg-emerald-500/10 blur-[80px] pointer-events-none rounded-full" />
        </div>

        {/* Bottom Sheet - White Container with Details */}
        <div className="flex-1 bg-white rounded-t-[32px] -mt-6 relative z-20 px-6 py-6 overflow-y-auto pb-12 flex flex-col gap-6">
          
          {/* Subtitle / Timeline details */}
          <div>
            <p className="font-inter text-xs font-medium text-gray-400 uppercase tracking-widest mb-1.5">
              Depuis {activeTrend.date.split('-')[0]} · {activeTrend.region}
            </p>
            <h2 className="font-syne font-extrabold text-[32px] text-gray-900 leading-tight">
              {activeTrend.title}
            </h2>
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="px-3.5 py-1.5 bg-gray-100 text-gray-600 font-inter text-xs font-semibold rounded-full">
                {activeTrend.ageRange}
              </span>
              <span className="px-3.5 py-1.5 bg-gray-100 text-gray-600 font-inter text-xs font-semibold rounded-full">
                {activeTrend.region}
              </span>
              <span className="px-3.5 py-1.5 bg-gray-100 text-gray-600 font-inter text-xs font-semibold rounded-full">
                {activeTrend.date.split('-')[0]} →
              </span>
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* Plateformes Section */}
          <div>
            <h3 className="font-syne font-bold text-xs text-gray-400 tracking-wider uppercase mb-3">
              PLATEFORMES
            </h3>
            <div className="flex flex-wrap gap-2.5">
              {activeTrend.platforms.map((platform: string, i: number) => (
                <span 
                  key={i} 
                  className="px-4 py-2 bg-white text-gray-800 font-inter text-sm font-semibold rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.02)]"
                >
                  {platform}
                </span>
              ))}
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* Définition Section */}
          <div>
            <h3 className="font-syne font-bold text-xl text-gray-900 mb-2.5">
              Définition
            </h3>
            <p className="font-inter text-gray-600 text-base leading-relaxed">
              {activeTrend.signification}
            </p>
          </div>

          <hr className="border-gray-100" />

          {/* Contexte & Origine Section */}
          <div>
            <h3 className="font-syne font-bold text-xl text-gray-900 mb-2.5">
              Contexte & Origine
            </h3>
            <p className="font-inter text-gray-600 text-base leading-relaxed">
              {activeTrend.context}
            </p>
          </div>

          <hr className="border-gray-100" />

          {/* Comment l'utiliser Section */}
          <div>
            <h3 className="font-syne font-bold text-xl text-gray-900 mb-3 flex items-center gap-2">
              <Icon icon="mdi:lightbulb-on" className="text-amber-500" /> Comment l'utiliser
            </h3>
            <div className="flex flex-col gap-3">
              {activeTrend.usageKeys.map((usage: string, idx: number) => (
                <div key={idx} className="bg-emerald-50/40 p-4 rounded-2xl border-l-4 border-emerald-500">
                  <p className="font-inter text-sm text-gray-800 leading-relaxed font-medium">
                    {usage}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* Chiffres clés Section */}
          <div>
            <h3 className="font-syne font-bold text-xl text-gray-900 mb-4">
              Chiffres clés
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {activeTrend.stats.map((stat: any, i: number) => (
                <div key={i} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
                  <p className="font-syne font-black text-3xl text-blue-600 tracking-tight mb-1">
                    {stat.value}
                  </p>
                  <p className="font-inter text-xs text-gray-400 leading-tight">
                    {stat.label}
                  </p>
                </div>
              ))}
              
              {/* Extra stats to make the grid look beautiful and complete like the mockup */}
              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
                <p className="font-syne font-black text-3xl text-blue-600 tracking-tight mb-1">
                  18
                </p>
                <p className="font-inter text-xs text-gray-400 leading-tight">
                  Pays actifs
                </p>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
                <p className="font-syne font-black text-3xl text-blue-600 tracking-tight mb-1">
                  72%
                </p>
                <p className="font-inter text-xs text-gray-400 leading-tight">
                  Audience féminine
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
