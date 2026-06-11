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
  const base =
    "group relative w-full py-4 px-8 rounded-full font-syne font-semibold text-base " +
    "text-center text-white transition-all duration-200 active:scale-[0.97] select-none overflow-hidden ";

  const styles: Record<string, React.CSSProperties> = {
    primary: {
      background:
        "linear-gradient(160deg, rgba(255,255,255,0.11) 0%, rgba(255,255,255,0.04) 100%)",
      border: "1px solid rgba(255,255,255,0.18)",
      boxShadow:
        "inset 0 1px 0 rgba(255,255,255,0.14), inset 0 -1px 0 rgba(0,0,0,0.3), 0 4px 24px rgba(0,0,0,0.4)",
      backdropFilter: "blur(16px)",
      WebkitBackdropFilter: "blur(16px)",
    },
    secondary: {
      background:
        "linear-gradient(160deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)",
      border: "1px solid rgba(255,255,255,0.10)",
      boxShadow:
        "inset 0 1px 0 rgba(255,255,255,0.08), inset 0 -1px 0 rgba(0,0,0,0.2), 0 2px 12px rgba(0,0,0,0.3)",
      backdropFilter: "blur(12px)",
      WebkitBackdropFilter: "blur(12px)",
    },
  };

  const inner = (
    <>
      {/* Top shimmer highlight */}
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 h-px pointer-events-none"
        style={{
          background:
            variant === "primary"
              ? "linear-gradient(90deg, transparent 5%, rgba(255,255,255,0.35) 50%, transparent 95%)"
              : "linear-gradient(90deg, transparent 5%, rgba(255,255,255,0.18) 50%, transparent 95%)",
        }}
      />

      {/* Hover glow overlay */}
      <span
        aria-hidden
        className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
        style={{
          background:
            variant === "primary"
              ? "linear-gradient(160deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.03) 100%)"
              : "linear-gradient(160deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 100%)",
        }}
      />

      {/* Bottom shimmer on hover */}
      <span
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-px pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        style={{
          background:
            "linear-gradient(90deg, transparent 5%, rgba(255,255,255,0.15) 50%, transparent 95%)",
        }}
      />

      <span className="relative z-10">{children}</span>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={base + className} style={styles[variant]}>
        {inner}
      </Link>
    );
  }

  return (
    <button onClick={onClick} className={base + className} style={styles[variant]}>
      {inner}
    </button>
  );
}
