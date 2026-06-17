import Link from 'next/link';
import { Icon } from '@iconify/react';
import { ApiTrend, STATUS_CONFIG } from '@/lib/api';

interface ExplorerTrendCardProps {
  trend: ApiTrend;
}

export default function ExplorerTrendCard({ trend }: ExplorerTrendCardProps) {
  const s = STATUS_CONFIG[trend.status] ?? { label: trend.status, icon: 'mdi:circle', color: 'text-white', badge: 'badge-status badge-status-stable' };

  return (
    <Link href={`?trendId=${trend.id}`} scroll={false} className="block group">
      <div className="flex items-start gap-4 py-5 border-b border-gray-100 last:border-0 active:opacity-70 transition-opacity">
        <div className="flex-1 min-w-0">
          {trend.category && (
            <p className="font-inter font-semibold text-xs text-[var(--color-primary)] uppercase tracking-widest mb-1">
              {trend.category}
            </p>
          )}

          <h3 className="font-syne font-bold text-[var(--color-text-dark)] text-[22px] leading-snug mb-2 group-hover:text-[var(--color-primary)] transition-colors">
            {trend.title}
          </h3>

          {trend.platforms && trend.platforms.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {trend.platforms.map((platform, i) => (
                <span key={i} className="px-2.5 py-0.5 bg-gray-100 text-gray-600 font-inter text-xs rounded-md">
                  {platform}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2 flex-wrap">
            <span className={s.badge}>
              <Icon icon={s.icon} className="text-xs" />
              {s.label}
            </span>
            {(trend.age_range || trend.region) && (
              <span className="font-inter text-sm text-gray-400">
                {trend.age_range ?? ''}{trend.region ? ` · ${trend.region}` : ''}
              </span>
            )}
          </div>
        </div>

        <div className="flex-shrink-0 w-20 h-20 bg-gray-100 rounded-xl overflow-hidden relative">
          {trend.image_url ? (
            <img
              src={trend.image_url}
              alt={trend.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
              <Icon icon="mdi:trending-up" className="text-2xl text-gray-400" />
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
