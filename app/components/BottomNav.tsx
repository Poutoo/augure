"use client";

import { Icon } from '@iconify/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/', label: 'Accueil', iconActive: 'mdi:home', iconInactive: 'mdi:home-outline' },
  { href: '/search', label: 'Explorer', iconActive: 'mdi:compass', iconInactive: 'mdi:compass-outline' },
];

export default function BottomNav() {
  const pathname = usePathname();
  const isActive = (path: string) => pathname === path;

  return (
    <>
      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 shadow-[0_-2px_16px_rgba(0,0,0,0.06)] z-50">
        <div className="flex justify-around items-center h-16">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors relative ${active ? 'text-[var(--color-primary)]' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <Icon icon={active ? item.iconActive : item.iconInactive} className="text-[22px]" />
                <span className="text-[10px] font-syne font-medium">{item.label}</span>
                {active && <span className="absolute bottom-1 w-1 h-1 bg-[var(--color-primary)] rounded-full" />}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Desktop Sidebar / Top Nav */}
      <nav className="hidden md:flex fixed top-0 left-0 h-full w-20 xl:w-56 bg-white border-r border-gray-100 flex-col items-center xl:items-start pt-8 pb-6 gap-2 z-50 shadow-sm">
        <div className="px-4 mb-8 w-full">
          <Link href="/">
            <span className="font-syne font-bold text-2xl text-[var(--color-text-dark)] hidden xl:block">AUGURE<span className="text-[var(--color-primary)]">.</span></span>
            <span className="font-syne font-bold text-xl text-[var(--color-primary)] xl:hidden">A.</span>
          </Link>
        </div>
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all mx-2 xl:mx-0 ${active ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'}`}
            >
              <Icon icon={active ? item.iconActive : item.iconInactive} className="text-[22px] flex-shrink-0" />
              <span className="font-syne font-semibold text-sm hidden xl:block">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
