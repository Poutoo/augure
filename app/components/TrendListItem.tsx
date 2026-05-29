import Link from 'next/link';
import { Icon } from '@iconify/react';
import { Trend, TrendStatus } from '@/lib/mocks';

interface TrendListItemProps {
  trend: Trend;
}

const statusConfig: Record<TrendStatus, { label: string; icon: string; color: string }> = {
  'Viral': { label: 'Viral', icon: 'mdi:fire', color: 'text-red-500' },
  'Émergent': { label: 'Émergent', icon: 'mdi:trending-up', color: 'text-[var(--color-secondary-green)]' },
  'En hausse': { label: 'En hausse', icon: 'mdi:arrow-up-bold', color: 'text-[var(--color-secondary-green)]' },
  'Stable': { label: 'Stable', icon: 'mdi:arrow-right-bold', color: 'text-gray-400' },
  'En baisse': { label: 'En baisse', icon: 'mdi:arrow-down-bold', color: 'text-red-500' },
};

export default function TrendListItem({ trend }: TrendListItemProps) {
  const status = statusConfig[trend.status];

  return (
    <Link href={`?trendId=${trend.id}`} scroll={false} className="block group">
      <div className="bg-white rounded-2xl px-4 py-4 flex items-center gap-3 shadow-[0_1px_4px_rgba(0,0,0,0.06)] hover:shadow-md transition-shadow active:scale-[0.99]">
        <div className="flex-1 min-w-0">
          <h3 className="font-syne font-bold text-[var(--color-text-dark)] text-base truncate group-hover:text-[var(--color-primary)] transition-colors">
            {trend.title}
          </h3>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {trend.badges.map((badge, i) => (
              <span key={i} className="text-[var(--color-primary)] font-inter font-semibold text-xs uppercase tracking-wide">
                {badge}
              </span>
            ))}
            <span className="font-inter text-xs text-gray-400">
              {trend.ageRange} · {trend.region}
            </span>
          </div>
        </div>

        <div className={`flex items-center gap-1 flex-shrink-0 ${status.color}`}>
          <Icon icon={status.icon} className="text-sm" />
          <span className="font-inter text-sm font-semibold whitespace-nowrap">{status.label}</span>
        </div>
      </div>
    </Link>
  );
}
