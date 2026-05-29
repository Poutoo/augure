import Header from '@/components/Header';
import SearchBar from '@/components/SearchBar';
import TrendCard from '@/components/TrendCard';
import { mockTrends } from '@/lib/mocks';
import { Icon } from '@iconify/react';
import Link from 'next/link';

export default function GlossaryPage() {
  return (
    <main className="flex-1 pb-16 bg-white min-h-screen">
      <Header />
      
      <div className="px-4 mt-4">
        <Link href="/" className="inline-flex items-center gap-2 text-gray-500 font-syne mb-6 hover:text-gray-800 transition-colors">
          <Icon icon="mdi:arrow-left" className="text-xl" />
          Retour
        </Link>
        
        <h1 className="font-syne font-bold text-4xl text-[var(--color-text-dark)] mb-4">
          Glossaire
        </h1>
        <p className="font-inter text-gray-600 text-lg mb-8">
          Toutes les tendances décryptées par Augure.
        </p>

        <SearchBar />

        <div className="flex flex-col gap-4 mt-8">
          {mockTrends.map((trend) => (
            <TrendCard key={trend.id} trend={trend} />
          ))}
        </div>
      </div>
    </main>
  );
}
