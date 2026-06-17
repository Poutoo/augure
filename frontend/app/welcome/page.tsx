"use client";

import Image from "next/image";
import LiquidGlassButton from "@/components/LiquidGlassButton";

export default function WelcomePage() {
  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-between py-16 px-6 overflow-hidden">

      {/* ── Coin haut-droite : lignes horizontales avec dégradé diagonal ── */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-0 right-0"
        style={{
          width: "55%",
          height: "42%",
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.18) 2px, rgba(255,255,255,0.18) 3px)",
          WebkitMaskImage:
            "linear-gradient(to bottom left, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 45%, transparent 75%)",
          maskImage:
            "linear-gradient(to bottom left, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 45%, transparent 75%)",
        }}
      />

      {/* ── Coin bas-gauche : lignes horizontales avec dégradé diagonal ── */}
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-0"
        style={{
          width: "55%",
          height: "42%",
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.18) 2px, rgba(255,255,255,0.18) 3px)",
          WebkitMaskImage:
            "linear-gradient(to top right, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 45%, transparent 75%)",
          maskImage:
            "linear-gradient(to top right, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 45%, transparent 75%)",
        }}
      />

      {/* Zone vide supérieure */}
      <div className="flex-1" />

      {/* Logo SVG centré */}
      <div className="anim-fade-in flex items-center justify-center px-10 relative z-10">
        <Image
          src="/logo.svg"
          alt="AUGURE."
          width={220}
          height={20}
          priority
          className="w-full max-w-[220px]"
        />
      </div>

      {/* Zone vide inférieure */}
      <div className="flex-1" />

      {/* Boutons liquid glass */}
      <div className="w-full max-w-xs flex flex-col gap-4 relative z-10">
        <LiquidGlassButton href="/login" variant="primary" className="anim-fade-up" style={{ animationDelay: '80ms' }}>
          Se connecter
        </LiquidGlassButton>
        <LiquidGlassButton href="/onboarding" variant="secondary" className="anim-fade-up" style={{ animationDelay: '160ms' }}>
          Créer un compte
        </LiquidGlassButton>
      </div>

    </div>
  );
}
