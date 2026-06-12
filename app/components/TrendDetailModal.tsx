"use client";

import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Icon } from '@iconify/react';
import { ApiTrend, STATUS_CONFIG, apiGetTrendById } from '@/lib/api';
import { useEffect, useState } from 'react';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function TrendDetailModal() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [trend, setTrend] = useState<ApiTrend | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  const trendId = searchParams.get('trendId');

  useEffect(() => {
    if (!trendId || !UUID_RE.test(trendId)) {
      setIsVisible(false);
      const t = setTimeout(() => setTrend(null), 300);
      document.body.style.overflow = 'unset';
      return () => clearTimeout(t);
    }

    const token = (typeof window !== 'undefined' ? localStorage.getItem('augure_token') : null) ?? '';
    apiGetTrendById(trendId, token)
      .then(data => {
        setTrend(data);
        const t = setTimeout(() => setIsVisible(true), 30);
        document.body.style.overflow = 'hidden';
        return () => clearTimeout(t);
      })
      .catch(() => setTrend(null));
  }, [trendId]);

  if (!trend) return null;

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete('trendId');
      const query = params.toString() ? `?${params.toString()}` : '';
      router.push(`${pathname}${query}`, { scroll: false });
    }, 250);
  };

  const s = STATUS_CONFIG[trend.status] ?? { label: trend.status, icon: 'mdi:circle', color: 'text-gray-400' };
  const usageKeys: string[] = trend.usage_keys?.length ? trend.usage_keys : [trend.usage_example];

  const overlayClass = `absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ease-out ${isVisible ? 'opacity-100' : 'opacity-0'}`;
  const panelClass = `relative bg-white w-full md:max-w-2xl h-[92vh] md:h-[85vh] rounded-t-[32px] md:rounded-[32px] shadow-2xl flex flex-col overflow-hidden z-10 transition-all duration-300 ease-out transform ${isVisible ? 'translate-y-0 opacity-100 md:scale-100' : 'translate-y-full opacity-0 md:translate-y-8 md:scale-95'}`;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div onClick={handleClose} className={overlayClass} />

      <div className={panelClass}>
        {/* ── Cover ── */}
        <div className="relative h-44 flex-shrink-0 flex flex-col justify-between p-6 overflow-hidden bg-neutral-950">
          {trend.image_url ? (
            <div className="absolute inset-0 z-0">
              <img
                src={trend.image_url}
                alt={trend.title}
                className="w-full h-full object-cover opacity-60 filter blur-[1px]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/85 via-neutral-950/40 to-neutral-950/60" />
            </div>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-neutral-800 to-neutral-950" />
          )}

          <div className="flex justify-between items-center w-full relative z-10">
            <button
              onClick={handleClose}
              className="w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full transition-colors backdrop-blur-md"
            >
              <Icon icon="mdi:arrow-left" className="text-xl text-white" />
            </button>

            <div className="flex items-center gap-2">
              {trend.category && (
                <span className="px-3.5 py-1.5 bg-[var(--color-text-dark)] text-white font-syne font-bold text-xs rounded-full uppercase tracking-wider">
                  {trend.category}
                </span>
              )}
              <span className="px-3.5 py-1.5 bg-white/20 text-white border border-white/30 font-syne font-bold text-xs rounded-full flex items-center gap-1">
                <Icon icon={s.icon} className="text-sm" />
                {s.label}
              </span>
            </div>

            <button
              onClick={() => setIsBookmarked(!isBookmarked)}
              className="w-10 h-10 flex items-center justify-center bg-white hover:bg-gray-100 rounded-full transition-colors shadow-md"
            >
              <Icon
                icon={isBookmarked ? 'mdi:bookmark' : 'mdi:bookmark-outline'}
                className={`text-xl ${isBookmarked ? 'text-[var(--color-text-dark)]' : 'text-gray-800'}`}
              />
            </button>
          </div>

          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-20 bg-white/10 blur-[80px] pointer-events-none rounded-full" />
        </div>

        {/* ── Content ── */}
        <div className="flex-1 bg-white rounded-t-[32px] -mt-6 relative z-20 px-6 py-6 overflow-y-auto pb-12 flex flex-col gap-6">

          {/* Titre + meta */}
          <div>
            {(trend.region || trend.created_at) && (
              <p className="font-inter text-xs font-medium text-gray-400 uppercase tracking-widest mb-1.5">
                {trend.created_at ? `Depuis ${new Date(trend.created_at).getFullYear()}` : ''}
                {trend.region ? ` · ${trend.region}` : ''}
              </p>
            )}
            <h2 className="font-syne font-extrabold text-[32px] text-gray-900 leading-tight">
              {trend.title}
            </h2>
            <div className="flex flex-wrap gap-2 mt-3">
              {trend.age_range && (
                <span className="px-3.5 py-1.5 bg-gray-100 text-gray-600 font-inter text-xs font-semibold rounded-full">
                  {trend.age_range}
                </span>
              )}
              {trend.region && (
                <span className="px-3.5 py-1.5 bg-gray-100 text-gray-600 font-inter text-xs font-semibold rounded-full">
                  {trend.region}
                </span>
              )}
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* Plateformes */}
          {trend.platforms && trend.platforms.length > 0 && (
            <>
              <div>
                <h3 className="font-syne font-bold text-xs text-gray-400 tracking-wider uppercase mb-3">
                  PLATEFORMES
                </h3>
                <div className="flex flex-wrap gap-2.5">
                  {trend.platforms.map((p, i) => (
                    <span key={i} className="px-4 py-2 bg-white text-gray-800 font-inter text-sm font-semibold rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
                      {p}
                    </span>
                  ))}
                </div>
              </div>
              <hr className="border-gray-100" />
            </>
          )}

          {/* Définition */}
          <div>
            <h3 className="font-syne font-bold text-xl text-gray-900 mb-2.5">Définition</h3>
            <p className="font-inter text-gray-600 text-base leading-relaxed">{trend.description}</p>
          </div>

          <hr className="border-gray-100" />

          {/* Contexte */}
          <div>
            <h3 className="font-syne font-bold text-xl text-gray-900 mb-2.5">Contexte & Origine</h3>
            <p className="font-inter text-gray-600 text-base leading-relaxed">{trend.context}</p>
          </div>

          <hr className="border-gray-100" />

          {/* Comment l'utiliser */}
          <div>
            <h3 className="font-syne font-bold text-xl text-gray-900 mb-3 flex items-center gap-2">
              <Icon icon="mdi:lightbulb-on" className="text-[var(--color-text-dark)]" /> Comment l&apos;utiliser
            </h3>
            <div className="flex flex-col gap-3">
              {usageKeys.map((usage, idx) => (
                <div key={idx} className="bg-black/5 p-4 rounded-2xl border-l-4 border-[var(--color-text-dark)]">
                  <p className="font-inter text-sm text-gray-800 leading-relaxed font-medium">{usage}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Chiffres clés */}
          {trend.extra_stats && trend.extra_stats.length > 0 && (
            <>
              <hr className="border-gray-100" />
              <div>
                <h3 className="font-syne font-bold text-xl text-gray-900 mb-4">Chiffres clés</h3>
                <div className="grid grid-cols-2 gap-4">
                  {trend.extra_stats.map((stat, i) => (
                    <div key={i} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
                      <p className="font-syne font-black text-3xl text-[var(--color-text-dark)] tracking-tight mb-1">
                        {stat.value}
                      </p>
                      <p className="font-inter text-xs text-gray-400 leading-tight">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
