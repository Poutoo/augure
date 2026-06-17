"use client";

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@iconify/react';
import { apiGetMe } from '@/lib/api';

const PROFILE_CACHE_KEY = 'augure_profile_cache';

export default function Header({ dark = false }: { dark?: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [initial, setInitial] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = localStorage.getItem('augure_token');
    if (!token) return;

    // Affichage immédiat depuis le cache — évite le rechargement à chaque navigation
    try {
      const raw = localStorage.getItem(PROFILE_CACHE_KEY);
      if (raw) {
        const { initial: ci, avatarUrl: ca } = JSON.parse(raw);
        setInitial(ci);
        setAvatarUrl(ca);
      }
    } catch {}

    // Re-validation silencieuse en arrière-plan
    apiGetMe(token)
      .then(user => {
        const i = (user.username ?? user.email).charAt(0).toUpperCase();
        const a = user.avatar_url;
        setInitial(i);
        setAvatarUrl(a);
        localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify({ initial: i, avatarUrl: a }));
      })
      .catch(() => {
        if (!localStorage.getItem(PROFILE_CACHE_KEY)) {
          try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const email: string = payload.sub ?? payload.email ?? '';
            setInitial(email.charAt(0).toUpperCase());
          } catch {
            setInitial('');
          }
        }
      });
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
    localStorage.removeItem(PROFILE_CACHE_KEY);
    document.cookie = 'augure_session=; path=/; max-age=0; SameSite=Lax';
    router.push('/welcome');
  };

  return (
    <header className="flex items-start justify-between px-4 pt-6 pb-2 md:px-8">
      <div>
        <Link href="/" className="flex items-center gap-0.5">
          <Image src={dark ? '/logo-white.svg' : '/logo-black.svg'} alt="Augure" width={110} height={26} priority style={{ height: 'auto' }} />
        </Link>
        <p className={`font-inter text-sm mt-0.5 ml-0.5 ${dark ? 'text-white/50' : 'text-gray-500'}`}>Découvrez ce qui buzz</p>
      </div>

      <div ref={containerRef} className="relative flex-shrink-0">
        <button
          onClick={() => setOpen(o => !o)}
          aria-label="Mon profil"
          aria-expanded={open}
          className={`w-10 h-10 rounded-full font-syne font-bold text-sm flex items-center justify-center hover:opacity-80 transition-opacity overflow-hidden ${dark ? 'bg-white/15 text-white border border-white/25' : 'bg-[var(--color-primary)] text-white shadow-md'}`}
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
          ) : initial ? (
            initial
          ) : (
            <Icon icon="mdi:account" className="text-xl" />
          )}
        </button>

        {open && (
          <div className="absolute right-0 top-[calc(100%+8px)] w-44 rounded-2xl bg-white border border-gray-100 shadow-xl overflow-hidden z-50">
            <Link
              href="/profile"
              onClick={() => setOpen(false)}
              className="w-full flex items-center gap-2.5 px-4 py-3.5 font-inter text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Icon icon="mdi:account-outline" className="text-base text-gray-400" />
              Mon profil
            </Link>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-4 py-3.5 font-inter text-sm text-gray-700 hover:bg-gray-50 transition-colors border-t border-gray-100"
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
