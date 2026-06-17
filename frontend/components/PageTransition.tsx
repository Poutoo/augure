"use client";

import React, { createContext, useContext, useState, useEffect, useId } from 'react';

type TransitionState = 'idle' | 'closing' | 'opening';

interface PageTransitionContextProps {
  transitionState: TransitionState;
}

const PageTransitionContext = createContext<PageTransitionContextProps | undefined>(undefined);

export function usePageTransition() {
  return useContext(PageTransitionContext);
}

export function PageTransitionProvider({ children }: { children: React.ReactNode }) {
  // Start visible to prevent content flash before useEffect
  const [transitionState, setTransitionState] = useState<TransitionState>('closing');
  const [isMounted, setIsMounted] = useState(true);

  useEffect(() => {
    const hasPlayed = sessionStorage.getItem('augure_splash_played');

    if (hasPlayed) {
      setTransitionState('idle');
      setIsMounted(false);
      return;
    }

    // Phase 3 starts at 800ms: horizontal split exit (600ms)
    const openTimer = setTimeout(() => setTransitionState('opening'), 800);

    const idleTimer = setTimeout(() => {
      setTransitionState('idle');
      sessionStorage.setItem('augure_splash_played', 'true');
      setIsMounted(false);
    }, 1400);

    return () => {
      clearTimeout(openTimer);
      clearTimeout(idleTimer);
    };
  }, []);

  const showOverlay = isMounted && transitionState !== 'idle';

  return (
    <PageTransitionContext.Provider value={{ transitionState }}>
      {children}
      {showOverlay && <SplashOverlay state={transitionState} />}
    </PageTransitionContext.Provider>
  );
}

// ─── Overlay ────────────────────────────────────────────────────────────────

function SplashOverlay({ state }: { state: TransitionState }) {
  const isOpening = state === 'opening';

  return (
    <div
      className="fixed inset-0 z-[9999] overflow-hidden"
      style={{ pointerEvents: state === 'closing' ? 'auto' : 'none' }}
    >
      <style>{`
        @keyframes splash-line-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes splash-letter-up {
          from { transform: translateY(110%); }
          to   { transform: translateY(0%); }
        }
      `}</style>

      {/* Top half — slides up on exit */}
      <div
        className="absolute top-0 left-0 right-0 overflow-hidden"
        style={{
          height: '50vh',
          transition: 'transform 600ms cubic-bezier(0.76, 0, 0.24, 1)',
          transform: isOpening ? 'translateY(-100%)' : 'translateY(0)',
        }}
      >
        <div className="absolute top-0 left-0 right-0" style={{ height: '100vh' }}>
          <SplashContent />
        </div>
      </div>

      {/* Bottom half — slides down on exit */}
      <div
        className="absolute bottom-0 left-0 right-0 overflow-hidden"
        style={{
          height: '50vh',
          transition: 'transform 600ms cubic-bezier(0.76, 0, 0.24, 1)',
          transform: isOpening ? 'translateY(100%)' : 'translateY(0)',
        }}
      >
        <div className="absolute bottom-0 left-0 right-0" style={{ height: '100vh' }}>
          <SplashContent />
        </div>
      </div>
    </div>
  );
}

// ─── Static data ─────────────────────────────────────────────────────────────

const LINE_TRANSFORMS: Array<[number, number]> = [
  [-184.455, 270.337], [-175.531, 275.489], [-166.608, 280.641], [-157.684, 285.793],
  [-148.761, 290.945], [-139.838, 296.097], [-130.914, 301.249], [-121.991, 306.401],
  [-113.067, 311.553], [-104.144, 316.705], [-95.220, 321.857], [-86.297, 327.009],
  [-77.373, 332.161], [-68.449, 337.313], [-59.526, 342.465], [-50.603, 347.617],
  [-41.679, 352.769], [-32.756, 357.921], [-23.832, 363.073], [-14.909, 368.225],
  [-5.985, 373.376], [2.938, 378.529], [11.862, 383.681], [20.785, 388.833],
  [29.709, 393.985], [38.632, 399.136],
  [73.545, 447.143], [82.469, 452.295], [91.392, 457.447], [100.316, 462.599],
  [109.239, 467.751], [118.162, 472.903], [127.086, 478.055], [136.009, 483.207],
  [144.933, 488.359], [153.856, 493.511], [162.780, 498.663], [171.703, 503.815],
  [180.627, 508.967], [189.551, 514.119], [198.474, 519.271], [207.397, 524.423],
  [216.321, 529.575], [225.244, 534.727], [234.168, 539.878], [243.091, 545.031],
  [252.015, 550.183], [260.938, 555.334], [269.862, 560.487], [278.785, 565.638],
  [287.709, 570.791], [296.632, 575.942], [305.556, 581.094], [314.479, 586.246],
  [323.403, 591.398], [332.326, 596.550], [341.250, 601.702], [350.173, 606.854],
  [359.097, 612.006], [368.020, 617.158], [376.944, 622.310], [385.867, 627.462],
];

const LETTERS = ['A', 'U', 'G', 'U', 'R', 'E', '.'];

// ─── Content (rendered inside each half) ─────────────────────────────────────

function SplashContent() {
  const gradId = useId().replace(/:/g, '');

  return (
    <div
      className="relative select-none bg-[#0C0C0E] overflow-hidden flex items-center justify-center"
      style={{ width: '100%', height: '100vh' }}
    >
      {/* Phase 1: diagonal lines stagger in (0 → ~370ms) */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 390 844"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={gradId} x1="290.816" y1="0.5" x2="0" y2="0.5" gradientUnits="userSpaceOnUse">
            <stop stopColor="#333333" />
            <stop offset="1" stopColor="#FFFFFF" />
          </linearGradient>
        </defs>
        {LINE_TRANSFORMS.map(([tx, ty], i) => (
          <line
            key={i}
            y1="-0.468361"
            x2="290.816"
            y2="-0.468361"
            transform={`matrix(1 0.000857123 0.56497 0.825111 ${tx} ${ty})`}
            stroke={`url(#${gradId})`}
            strokeWidth="0.936722"
            style={{
              opacity: 0,
              animation: 'splash-line-in 0.35s ease forwards',
              animationDelay: `${i * 6}ms`,
            }}
          />
        ))}
      </svg>

      {/* Phase 2: letter-by-letter curtain reveal (50ms → 780ms) */}
      <div className="relative z-10 flex">
        {LETTERS.map((letter, i) => (
          <span
            key={i}
            style={{ display: 'inline-block', overflow: 'hidden', lineHeight: '1.2' }}
          >
            <span
              style={{
                display: 'inline-block',
                fontFamily: 'var(--font-syne)',
                fontSize: 'clamp(2.2rem, 9vw, 3.2rem)',
                fontWeight: 800,
                letterSpacing: '-0.01em',
                color: '#FFFFFF',
                transform: 'translateY(110%)',
                animation: 'splash-letter-up 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                animationDelay: `${50 + i * 48}ms`,
              }}
            >
              {letter}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
