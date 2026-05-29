"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import Image from 'next/image';

type TransitionState = 'idle' | 'closing' | 'opening';

interface PageTransitionContextProps {
  transitionState: TransitionState;
}

const PageTransitionContext = createContext<PageTransitionContextProps | undefined>(undefined);

export function usePageTransition() {
  return useContext(PageTransitionContext);
}

export function PageTransitionProvider({ children }: { children: React.ReactNode }) {
  const [transitionState, setTransitionState] = useState<TransitionState>('idle');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // Vérifie si le Splash Screen a déjà été joué dans cet onglet
    const hasPlayed = sessionStorage.getItem('augure_splash_played');
    
    if (!hasPlayed) {
      setTransitionState('closing'); // Commence fermé sur le logo complet
      setIsMounted(true);
      
      // Après 1200ms, on commence à séparer et ouvrir les volets diagonalement
      const openTimer = setTimeout(() => {
        setTransitionState('opening');
      }, 1200);

      // Après 1900ms (1200ms d'affichage + 700ms de transition), le splash est terminé
      const idleTimer = setTimeout(() => {
        setTransitionState('idle');
        sessionStorage.setItem('augure_splash_played', 'true');
        setIsMounted(false);
      }, 1900);

      return () => {
        clearTimeout(openTimer);
        clearTimeout(idleTimer);
      };
    } else {
      setTransitionState('idle');
      setIsMounted(false);
    }
  }, []);

  const showOverlay = isMounted && transitionState !== 'idle';

  return (
    <PageTransitionContext.Provider value={{ transitionState }}>
      {children}
      
      {showOverlay && (
        <div 
          className={`fixed inset-0 z-[9999] overflow-hidden ${
            transitionState === 'closing' ? 'pointer-events-auto' : 'pointer-events-none'
          }`}
        >
          
          {/* Shutter 1 : Coin Haut-Gauche (avec 101% pour combler l'interstice blanc sub-pixel par chevauchement) */}
          <div 
            style={{ clipPath: 'polygon(0 0, 101% 0, 0 101%)' }}
            className={`absolute inset-0 bg-white transition-transform duration-700 ease-in-out transform ${
              transitionState === 'closing'
                ? 'translate-x-0 translate-y-0'
                : '-translate-x-full -translate-y-full'
            }`}
          >
            <ShutterContent />
          </div>

          {/* Shutter 2 : Coin Bas-Droit */}
          <div 
            style={{ clipPath: 'polygon(100% 0, 100% 100%, 0 100%)' }}
            className={`absolute inset-0 bg-white transition-transform duration-700 ease-in-out transform ${
              transitionState === 'closing'
                ? 'translate-x-0 translate-y-0'
                : 'translate-x-full translate-y-full'
            }`}
          >
            <ShutterContent />
          </div>

        </div>
      )}
    </PageTransitionContext.Provider>
  );
}

// Contenu de chaque volet : utilise l'image officielle vectorielle /loading.svg
function ShutterContent() {
  return (
    <div className="w-full h-full relative select-none bg-white">
      <Image 
        src="/loading.svg" 
        alt="Chargement..." 
        fill
        priority
        className="object-cover object-center"
      />
    </div>
  );
}
