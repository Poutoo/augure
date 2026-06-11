import Link from 'next/link';
import { Icon } from '@iconify/react';
import { Trend, TrendStatus } from '@/lib/mocks';

interface ExplorerTrendCardProps {
  trend: Trend;
}

const statusConfig: Record<TrendStatus, { label: string; icon: string; color: string }> = {
  'Viral':      { label: 'Viral',      icon: 'mdi:arrow-up-bold',   color: 'text-[var(--color-text-dark)]' },
  'Émergent':   { label: 'Émergent',   icon: 'mdi:arrow-up-bold',   color: 'text-[var(--color-text-dark)]' },
  'En hausse':  { label: 'En hausse',  icon: 'mdi:arrow-up-bold',   color: 'text-[var(--color-text-dark)]' },
  'Stable':     { label: 'Stable',     icon: 'mdi:arrow-right-bold', color: 'text-gray-500' },
  'En baisse':  { label: 'En baisse',  icon: 'mdi:arrow-down-bold', color: 'text-gray-500' },
};

export default function ExplorerTrendCard({ trend }: ExplorerTrendCardProps) {
  const status = statusConfig[trend.status];

  return (
    <Link href={`?trendId=${trend.id}`} scroll={false} className="block group">
      <div className="flex items-start gap-4 py-5 border-b border-gray-100 last:border-0 active:opacity-70 transition-opacity">
        {/* Contenu texte */}
        <div className="flex-1 min-w-0">
          {/* Catégorie */}
          <p className="font-inter font-semibold text-xs text-[var(--color-primary)] uppercase tracking-widest mb-1">
            {trend.category}
          </p>

          {/* Titre */}
          <h3 className="font-syne font-bold text-[var(--color-text-dark)] text-[22px] leading-snug mb-2 group-hover:text-[var(--color-primary)] transition-colors">
            {trend.title}
          </h3>

          {/* Plateformes */}
          <div className="flex flex-wrap gap-1.5 mb-2">
            {trend.platforms.map((platform, i) => (
              <span
                key={i}
                className="px-2.5 py-0.5 bg-gray-100 text-gray-600 font-inter text-xs rounded-md"
              >
                {platform}
              </span>
            ))}
          </div>

          {/* Statut + démographie */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`flex items-center gap-1 font-inter font-semibold text-sm ${status.color}`}>
              <Icon icon={status.icon} className="text-xs" />
              {status.label}
            </span>
            <span className="font-inter text-sm text-gray-400">
              {trend.ageRange} · {trend.region}
            </span>
          </div>
        </div>

        {/* Vignette */}
        <div className="flex-shrink-0 w-20 h-20 bg-gray-100 rounded-xl overflow-hidden relative">
          <img 
            src={trend.image} 
            alt={trend.title} 
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      </div>
    </Link>
  );
}
