import { Trend } from '../lib/mocks';
import { Icon } from '@iconify/react';
import Link from 'next/link';

interface TrendCardProps {
  trend: Trend;
}

export default function TrendCard({ trend }: TrendCardProps) {
  return (
    <Link href={`/trends/${trend.id}`} className="block group">
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow active:scale-[0.98] cursor-pointer">
        <div className="flex justify-between items-start mb-4">
          <h3 className="font-syne font-bold text-2xl text-[var(--color-text-dark)] group-hover:text-[var(--color-primary)] transition-colors">
            {trend.title}
          </h3>
          <div className="bg-[var(--color-background-app)] p-2 rounded-full">
            <Icon icon="mdi:arrow-top-right" className="text-xl text-[var(--color-primary)]" />
          </div>
        </div>
        
        <p className="font-syne text-gray-600 line-clamp-2 mb-4 text-lg">
          {trend.signification}
        </p>

        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-50">
          <Icon icon="mdi:clock-outline" className="text-gray-400" />
          <span className="font-inter text-sm text-gray-500">
            Dernière mise à jour : {new Date(trend.date).toLocaleDateString('fr-FR')}
          </span>
        </div>
      </div>
    </Link>
  );
}
