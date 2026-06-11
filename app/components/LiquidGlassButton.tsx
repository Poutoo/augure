"use client";

import Link from "next/link";
import { ReactNode } from "react";

interface LiquidGlassButtonProps {
  href?: string;
  onClick?: () => void;
  children: ReactNode;
  variant?: "primary" | "secondary";
  className?: string;
}

export default function LiquidGlassButton({
  href,
  onClick,
  children,
  variant = "primary",
  className = "",
}: LiquidGlassButtonProps) {
  const isPrimary = variant === "primary";

  const base =
    "group relative w-full py-4 px-8 rounded-full font-syne font-semibold text-base " +
    "text-center text-white transition-all duration-200 active:scale-[0.97] select-none overflow-hidden ";

  const style: React.CSSProperties = isPrimary
    ? {
        background: "rgba(255,255,255,0.07)",
        boxShadow: [
          "0 0 0 1px rgba(255,255,255,0.20)",
          "inset 0 1px 0 rgba(255,255,255,0.40)",
          "inset 1px 0 0 rgba(255,255,255,0.12)",
          "inset -1px 0 0 rgba(255,255,255,0.08)",
          "inset 0 -1px 0 rgba(0,0,0,0.28)",
          "0 4px 24px rgba(0,0,0,0.4)",
        ].join(", "),
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
      }
    : {
        background: "rgba(255,255,255,0.03)",
        boxShadow: [
          "0 0 0 1px rgba(255,255,255,0.12)",
          "inset 0 1px 0 rgba(255,255,255,0.22)",
          "inset 1px 0 0 rgba(255,255,255,0.07)",
          "inset -1px 0 0 rgba(255,255,255,0.04)",
          "inset 0 -1px 0 rgba(0,0,0,0.18)",
          "0 2px 12px rgba(0,0,0,0.3)",
        ].join(", "),
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      };

  const inner = (
    <>
      {/* Reflet bord haut — ligne fine, plus courte que la largeur totale pour coller à la courbure */}
      <span
        aria-hidden
        className="absolute top-0 h-px pointer-events-none transition-opacity duration-200"
        style={{
          left: "10%",
          right: "10%",
          background: isPrimary
            ? "linear-gradient(90deg, transparent, rgba(255,255,255,0.65) 25%, rgba(255,255,255,0.92) 50%, rgba(255,255,255,0.65) 75%, transparent)"
            : "linear-gradient(90deg, transparent, rgba(255,255,255,0.35) 25%, rgba(255,255,255,0.55) 50%, rgba(255,255,255,0.35) 75%, transparent)",
        }}
      />

      {/* Reflet bord haut hover — plus brillant */}
      <span
        aria-hidden
        className="absolute top-0 h-px pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        style={{
          left: "6%",
          right: "6%",
          background: isPrimary
            ? "linear-gradient(90deg, transparent, rgba(255,255,255,0.45) 20%, rgba(255,255,255,0.25) 50%, rgba(255,255,255,0.45) 80%, transparent)"
            : "linear-gradient(90deg, transparent, rgba(255,255,255,0.25) 20%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.25) 80%, transparent)",
        }}
      />

      {/* Reflet bord bas — liseré très discret */}
      <span
        aria-hidden
        className="absolute bottom-0 h-px pointer-events-none"
        style={{
          left: "22%",
          right: "22%",
          background:
            "linear-gradient(90deg, transparent, rgba(255,255,255,0.10) 50%, transparent)",
        }}
      />

      <span className="relative z-10">{children}</span>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={base + className} style={style}>
        {inner}
      </Link>
    );
  }

  return (
    <button onClick={onClick} className={base + className} style={style}>
      {inner}
    </button>
  );
}
