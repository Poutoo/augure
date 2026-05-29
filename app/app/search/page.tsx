import Header from '@/components/Header';
import SearchBar from '@/components/SearchBar';
import TrendCard from '@/components/TrendCard';
import { mockTrends } from '@/lib/mocks';
import { Icon } from '@iconify/react';

export default function SearchPage() {
  return (
    <main className="flex-1 max-w-md mx-auto w-full">
      <Header />
      
      <div className="px-4 mt-2">
        <h1 className="font-syne font-bold text-3xl text-[var(--color-text-dark)] mb-2">
          Recherche
        </h1>
        <p className="font-inter text-gray-500 text-sm mb-4">
          Trouvez l'explication d'une tendance spécifique.
        </p>

        <SearchBar />

        <div className="mt-6 mb-4">
          <h2 className="font-syne font-bold text-lg text-gray-800 flex items-center gap-2 mb-4">
            <Icon icon="mdi:fire" className="text-[var(--color-primary)] text-xl" /> 
            Les plus recherchés
          </h2>
          <div className="flex flex-col gap-4 pb-20">
            {mockTrends.map((trend) => (
              <TrendCard key={trend.id} trend={trend} />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
