"use client";

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function PageAnimate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isShowing, setIsShowing] = useState(false);

  useEffect(() => {
    // Déclenche l'animation d'entrée au frame suivant (état initial déjà false)
    const timer = setTimeout(() => {
      setIsShowing(true);
    }, 100);
    return () => {
      clearTimeout(timer);
      setIsShowing(false);
    };
  }, [pathname]);

  return (
    <div
      className={`transition-all duration-300 ease-out transform ${isShowing
        ? 'opacity-100 translate-y-0 filter blur-none'
        : 'opacity-0 translate-y-4 filter blur-[2px]'
        }`}
    >
      {children}
    </div>
  );
}
