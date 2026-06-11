import { mockTrends } from '@/lib/mocks';
import { Icon } from '@iconify/react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export default async function TrendDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const trend = mockTrends.find((t) => t.id === parseInt(resolvedParams.id));

  if (!trend) {
    notFound();
  }

  return (
    <main className="flex-1 bg-gray-900/40 min-h-screen flex flex-col justify-end">
      <div className="bg-white rounded-t-3xl min-h-[90vh] w-full max-w-md mx-auto shadow-2xl relative flex flex-col animate-in slide-in-from-bottom-full duration-300">
        
        {/* Handle for "Bottom Sheet" look */}
        <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mt-4 mb-2"></div>
        
        {/* Header Modal */}
        <div className="px-6 py-4 flex justify-between items-center border-b border-gray-100">
          <h1 className="font-syne font-bold text-2xl text-[var(--color-text-dark)]">
            Détail Tendance
          </h1>
          <Link href="/" className="p-2 bg-gray-50 rounded-full hover:bg-gray-100 transition-colors">
            <Icon icon="mdi:close" className="text-xl text-gray-500" />
          </Link>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto pb-24">
          
          <h2 className="font-syne font-bold text-4xl text-[var(--color-primary)] mb-3">
            {trend.title}
          </h2>

          <div className="flex flex-wrap gap-2 mb-6">
            {trend.badges.map((badge, i) => (
              <span key={i} className="px-3 py-1 bg-[var(--color-background-app)] text-[var(--color-text-dark)] font-syne text-sm font-semibold rounded-full border border-gray-200">
                {badge}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8">
            {trend.stats.map((stat, i) => (
              <div key={i} className="bg-black/5 p-4 rounded-2xl border border-black/10">
                <p className="font-inter text-sm text-gray-500 mb-1">{stat.label}</p>
                <p className="font-syne font-bold text-2xl text-[var(--color-primary)]">{stat.value}</p>
              </div>
            ))}
          </div>

          <section className="mb-8">
            <h3 className="font-syne font-bold text-xl text-[var(--color-text-dark)] mb-3 flex items-center gap-2">
              <Icon icon="mdi:book-open-variant" className="text-[var(--color-text-dark)]" /> Signification
            </h3>
            <p className="font-inter text-gray-700 leading-relaxed text-lg">
              {trend.signification}
            </p>
          </section>

          <section className="mb-8 bg-[var(--color-background-app)] p-5 rounded-2xl">
            <h3 className="font-syne font-bold text-xl text-[var(--color-text-dark)] mb-3 flex items-center gap-2">
              <Icon icon="mdi:earth" className="text-[var(--color-text-dark)]" /> Contexte & Origine
            </h3>
            <p className="font-inter text-gray-700 leading-relaxed">
              {trend.context}
            </p>
          </section>

          <section className="mb-4">
            <h3 className="font-syne font-bold text-xl text-[var(--color-text-dark)] mb-3 flex items-center gap-2">
              <Icon icon="mdi:lightbulb-on" className="text-[var(--color-text-dark)]" /> Comment l'utiliser
            </h3>
            <div className="flex flex-col gap-3">
              {trend.usageKeys.map((usage, idx) => (
                <div key={idx} className="bg-black/5 p-4 rounded-xl border-l-4 border-[var(--color-text-dark)]">
                  <p className="font-syne font-medium text-gray-800 italic">{usage}</p>
                </div>
              ))}
            </div>
          </section>

        </div>
      </div>
    </main>
  );
}

