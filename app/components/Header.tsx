"use client";

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@iconify/react';

function getInitialFromToken(token: string): string {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const email: string = payload.sub ?? payload.email ?? '';
    return email.charAt(0).toUpperCase();
  } catch {
    return '';
  }
}

export default function Header() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [initial, setInitial] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = localStorage.getItem('augure_token');
    if (token) setInitial(getInitialFromToken(token));
  }, []);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  const handleLogout = () => {
    localStorage.removeItem('augure_token');
    document.cookie = 'augure_session=; path=/; max-age=0; SameSite=Lax';
    router.push('/welcome');
  };

  return (
    <header className="flex items-start justify-between px-4 pt-6 pb-2 md:px-8">
      <div>
        <Link href="/" className="flex items-center gap-0.5">
          <Image src="/logo.svg" alt="Augure" width={110} height={26} priority style={{ height: 'auto' }} />
        </Link>
        <p className="font-inter text-sm text-gray-500 mt-0.5 ml-0.5">Découvrez ce qui buzz</p>
      </div>

      <div ref={containerRef} className="relative flex-shrink-0">
        <button
          onClick={() => setOpen(o => !o)}
          aria-label="Mon profil"
          aria-expanded={open}
          className="w-10 h-10 rounded-full bg-[var(--color-primary)] text-white font-syne font-bold text-sm flex items-center justify-center shadow-md hover:opacity-80 transition-opacity"
        >
          {initial
            ? initial
            : <Icon icon="mdi:account" className="text-xl" />
          }
        </button>

        {open && (
          <div className="absolute right-0 top-[calc(100%+8px)] w-44 rounded-2xl bg-white border border-gray-100 shadow-xl overflow-hidden z-50">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-4 py-3.5 font-inter text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Icon icon="mdi:logout" className="text-base text-gray-400" />
              Se déconnecter
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
