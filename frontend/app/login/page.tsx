"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Icon } from "@iconify/react";
import { apiLogin } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email || !password) return;
    setError(null);
    setLoading(true);
    try {
      const { access_token } = await apiLogin(email, password);
      localStorage.setItem("augure_token", access_token);
      document.cookie = "augure_session=1; path=/; SameSite=Lax";
      router.push("/");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col overflow-hidden" style={{ background: "#0c0c0c" }}>

      {/* Scanlines */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,255,255,0.016) 3px, rgba(255,255,255,0.016) 4px)",
        }}
      />

      {/* Radial glow at center */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: "radial-gradient(ellipse 70% 60% at 50% 40%, rgba(255,255,255,0.04) 0%, transparent 70%)",
        }}
      />

      {/* Layout */}
      <div className="relative z-10 flex flex-col flex-1 items-center justify-center px-6 gap-10">

        {/* Logo */}
        <Image src="/logo.svg" alt="Augure" width={240} height={14} priority className="opacity-95 anim-fade-in" />

        {/* Liquid Glass Card */}
        <div
          className="w-full max-w-xs rounded-3xl p-7 flex flex-col gap-5 relative overflow-hidden anim-fade-up"
          style={{
            animationDelay: '80ms',
            background: "rgba(255,255,255,0.055)",
            backdropFilter: "blur(28px)",
            WebkitBackdropFilter: "blur(28px)",
            border: "1px solid rgba(255,255,255,0.13)",
            boxShadow: [
              "inset 0 1px 0 rgba(255,255,255,0.22)",
              "inset 1px 0 0 rgba(255,255,255,0.09)",
              "inset -1px 0 0 rgba(255,255,255,0.06)",
              "inset 0 -1px 0 rgba(0,0,0,0.35)",
              "0 12px 48px rgba(0,0,0,0.55)",
            ].join(", "),
          }}
        >
          {/* Top edge reflection */}
          <span
            aria-hidden
            className="pointer-events-none absolute top-0 h-px rounded-full"
            style={{
              left: "8%", right: "8%",
              background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.45) 50%, transparent)",
            }}
          />

          <h2 className="font-syne font-bold text-white text-center text-base tracking-[0.28em] uppercase">
            Connexion
          </h2>

          <div className="flex flex-col gap-3">
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSubmit()}
              placeholder="Email"
              className="w-full px-4 py-3.5 rounded-xl text-white font-syne text-sm placeholder-white/30 focus:outline-none transition-colors"
              style={{
                background: "rgba(255,255,255,0.07)",
                border: "1px solid rgba(255,255,255,0.11)",
              }}
            />
            <div className="relative">
              <input
                type={showPwd ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSubmit()}
                placeholder="Mot de passe"
                className="w-full px-4 py-3.5 rounded-xl text-white font-syne text-sm placeholder-white/30 focus:outline-none transition-colors pr-12"
                style={{
                  background: "rgba(255,255,255,0.07)",
                  border: "1px solid rgba(255,255,255,0.11)",
                }}
              />
              <button
                type="button"
                onClick={() => setShowPwd(p => !p)}
                tabIndex={-1}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
              >
                <Icon icon={showPwd ? "mdi:eye-off-outline" : "mdi:eye-outline"} className="text-xl" />
              </button>
            </div>
          </div>

          {error && (
            <p key={error} className="anim-shake font-syne text-xs text-white/50 rounded-lg px-3 py-2 text-center" style={{ background: "rgba(255,255,255,0.06)" }}>
              {error}
            </p>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading || !email || !password}
            className="w-full py-3.5 rounded-xl font-syne font-bold text-sm text-white flex items-center justify-center gap-2 transition-opacity active:scale-95 transition-transform disabled:opacity-30"
            style={{
              background: "rgba(255,255,255,0.13)",
              border: "1px solid rgba(255,255,255,0.18)",
            }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.19)")}
            onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.13)")}
          >
            {loading
              ? <Icon icon="mdi:loading" className="animate-spin text-xl" />
              : "Se connecter"
            }
          </button>
        </div>

        {/* Sign-up link */}
        <Link href="/onboarding" className="font-syne text-sm text-white/30 hover:text-white/60 transition-colors text-center">
          Pas encore de compte ?{" "}<span className="underline">Créer un compte</span>
        </Link>
      </div>
    </div>
  );
}
