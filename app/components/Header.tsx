import Image from 'next/image';
import Link from 'next/link';

export default function Header() {
  return (
    <header className="flex items-start justify-between px-4 pt-6 pb-2 md:px-8">
      <div>
        <Link href="/" className="flex items-center gap-0.5">
          <Image src="/logo.svg" alt="Augure" width={110} height={26} priority style={{ height: 'auto' }} />
        </Link>
        <p className="font-inter text-sm text-gray-500 mt-0.5 ml-0.5">Découvrez ce qui buzz</p>
      </div>

      {/* Avatar utilisateur */}
      <Link
        href="/onboarding"
        className="w-10 h-10 rounded-full bg-[var(--color-primary)] text-white font-syne font-bold text-sm flex items-center justify-center shadow-md flex-shrink-0 hover:opacity-80 transition-opacity"
        aria-label="Créer ou configurer mon profil"
      >
        JD
      </Link>
    </header>
  );
}
