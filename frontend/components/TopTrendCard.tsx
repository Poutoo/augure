import Link from 'next/link';
import { Icon } from '@iconify/react';
import { ApiTrend, STATUS_CONFIG } from '@/lib/api';

interface TopTrendCardProps {
  trend: ApiTrend;
}

export default function TopTrendCard({ trend }: TopTrendCardProps) {
  const s = STATUS_CONFIG[trend.status] ?? { label: trend.status, icon: 'mdi:circle', color: 'text-white', badge: 'badge-status badge-status-stable' };

  return (
    <Link href={`?trendId=${trend.id}`} scroll={false} className="block flex-shrink-0 w-44">
      <div className="bg-[var(--color-text-dark)] rounded-2xl p-4 h-52 flex flex-col justify-between hover:bg-black transition-colors">
        <div>
          <p className="font-syne text-xs text-gray-400 mb-1">
            N°{String(trend.rank ?? '–').padStart(2, '0')}
          </p>
          <span className={`inline-flex mb-3 ${s.badge}`}>
            <Icon icon={s.icon} className="text-xs" />
            {s.label}
          </span>
          <h3 className="font-syne font-bold text-white text-lg leading-tight line-clamp-2">
            {trend.title}
          </h3>
        </div>

        <div>
          {trend.category && (
            <span className="inline-block px-2.5 py-1 bg-white/10 text-white font-syne text-xs rounded-full mb-3">
              {trend.category}
            </span>
          )}
          <p className="font-syne text-xs text-gray-500">
            {trend.region ?? '–'} · {trend.age_range ?? '–'}
          </p>
        </div>
      </div>
    </Link>
  );
}
