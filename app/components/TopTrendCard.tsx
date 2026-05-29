import Link from 'next/link';
import { Icon } from '@iconify/react';
import { Trend, TrendStatus } from '@/lib/mocks';

interface TopTrendCardProps {
  trend: Trend;
}

const statusConfig: Record<TrendStatus, { label: string; icon: string; color: string }> = {
  'Viral': { label: 'Viral', icon: 'mdi:fire', color: 'text-red-400' },
  'Émergent': { label: 'Émergent', icon: 'mdi:trending-up', color: 'text-green-400' },
  'En hausse': { label: 'En hausse', icon: 'mdi:arrow-up-bold', color: 'text-emerald-400' },
  'Stable': { label: 'Stable', icon: 'mdi:arrow-right-bold', color: 'text-gray-400' },
  'En baisse': { label: 'En baisse', icon: 'mdi:arrow-down-bold', color: 'text-red-400' },
};

export default function TopTrendCard({ trend }: TopTrendCardProps) {
  const status = statusConfig[trend.status];

  return (
    <Link href={`?trendId=${trend.id}`} scroll={false} className="block flex-shrink-0 w-44">
      <div className="bg-[var(--color-card-dark)] rounded-2xl p-4 h-52 flex flex-col justify-between hover:bg-[#132b1c] transition-colors">
        <div>
          <p className="font-inter text-xs text-gray-400 mb-1">N°{String(trend.rank).padStart(2, '0')}</p>
          <div className={`flex items-center gap-1 ${status.color} mb-3`}>
            <Icon icon={status.icon} className="text-xs" />
            <span className="font-inter text-xs font-medium">{status.label}</span>
          </div>
          <h3 className="font-syne font-bold text-white text-lg leading-tight line-clamp-2">
            {trend.title}
          </h3>
        </div>

        <div>
          <span className="inline-block px-2.5 py-1 bg-white/10 text-white font-inter text-xs rounded-full mb-3">
            {trend.category}
          </span>
          <p className="font-inter text-xs text-gray-500">
            {trend.region} · {trend.ageRange}
          </p>
        </div>
      </div>
    </Link>
  );
}
