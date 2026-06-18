import Link from 'next/link';
import { Icon } from '@iconify/react';
import { ApiTrend, STATUS_CONFIG } from '@/lib/api';

interface TrendListItemProps {
  trend: ApiTrend;
}

export default function TrendListItem({ trend }: TrendListItemProps) {
  const s = STATUS_CONFIG[trend.status] ?? { label: trend.status, icon: 'mdi:circle', color: 'text-white', badge: 'badge-status badge-status-stable' };

  return (
    <Link href={`?trendId=${trend.id}`} scroll={false} className="block group">
      <div className="bg-white rounded-2xl px-4 py-4 flex items-center gap-3 shadow-[0_1px_4px_rgba(0,0,0,0.06)] hover:shadow-md transition-shadow active:scale-[0.99]">
        <div className="flex-1 min-w-0">
          <h3 className="font-syne font-bold text-[var(--color-text-dark)] text-base truncate group-hover:text-[var(--color-primary)] transition-colors">
            {trend.title}
          </h3>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {trend.badges?.map((badge, i) => (
              <span key={i} className="text-gray-400 font-syne font-medium text-xs uppercase tracking-wide">
                {badge}
              </span>
            ))}
            <span className="font-syne text-xs text-gray-400">
              {trend.age_range ?? ''}{trend.region ? ` · ${trend.region}` : ''}
            </span>
          </div>
        </div>

        <span className={`flex-shrink-0 ${s.badge}`}>
          <Icon icon={s.icon} className="text-sm" />
          {s.label}
        </span>
      </div>
    </Link>
  );
}
