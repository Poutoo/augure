"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
    <div className="fixed inset-0 z-[100] bg-black flex flex-col overflow-hidden">

      {/* Scanlines */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,255,255,0.018) 3px, rgba(255,255,255,0.018) 4px)",
        }}
      />

      {/* Header */}
      <div className="relative z-10 px-6 pt-12 pb-4">
        <Link href="/welcome" className="inline-flex items-center gap-1 text-white/40 hover:text-white/70 transition-colors mb-8">
          <Icon icon="mdi:arrow-left" className="text-lg" />
        </Link>
        <h1 className="font-syne font-bold text-white text-4xl" style={{ letterSpacing: "-0.02em" }}>
          AUGURE.
        </h1>
      </div>

      {/* Card */}
      <div className="relative z-10 mx-4 mt-4 rounded-2xl bg-[#111] border border-white/10 p-6 flex flex-col gap-5">
        <h2 className="font-syne font-bold text-white text-xl tracking-widest uppercase">
          Connexion
        </h2>

        <div className="flex flex-col gap-3">
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSubmit()}
            placeholder="Email"
            className="w-full px-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white font-inter text-sm placeholder-white/25 focus:outline-none focus:border-white/30 transition-colors"
          />
          <div className="relative">
            <input
              type={showPwd ? "text" : "password"}
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSubmit()}
              placeholder="Mot de passe"
              className="w-full px-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white font-inter text-sm placeholder-white/25 focus:outline-none focus:border-white/30 transition-colors pr-12"
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
          <p className="font-inter text-xs text-white/50 bg-white/5 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading || !email || !password}
          className="w-full py-4 rounded-xl bg-white text-black font-syne font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-30 flex items-center justify-center gap-2"
        >
          {loading
            ? <Icon icon="mdi:loading" className="animate-spin text-xl" />
            : "Se connecter"
          }
        </button>
      </div>

      {/* Lien inscription */}
      <div className="relative z-10 mt-6 text-center">
        <Link href="/onboarding" className="font-inter text-sm text-white/30 hover:text-white/60 transition-colors">
          Pas encore de compte ? <span className="underline">Créer un compte</span>
        </Link>
      </div>
    </div>
  );
}
