"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import { apiRegister, apiLogin, apiSaveOnboarding, apiSavePlan } from "@/lib/api";
import Image from "next/image";

// ── Data ──────────────────────────────────────────────────────────────────────

const ROLES = [
  { value: "community_manager", label: "Community Manager", desc: "Gestion de communautés" },
  { value: "agence", label: "Agence", desc: "Multi-clients" },
  { value: "content_creator", label: "Créateur de contenu", desc: "Content creator" },
  { value: "influenceur", label: "Influenceur", desc: "Personal branding" },
  { value: "parent", label: "Parent", desc: "Comprendre sa génération" },
  { value: "teacher", label: "Enseignant", desc: "Éducation & médiation" },
  { value: "autre", label: "Autre", desc: "Autre profil" },
] as const;

const INTERESTS = [
  { slug: "mode", label: "Mode", icon: "mdi:hanger" },
  { slug: "food", label: "Food", icon: "mdi:food-fork-drink" },
  { slug: "tech", label: "Tech", icon: "mdi:chip" },
  { slug: "musique", label: "Musique", icon: "mdi:music-note" },
  { slug: "art", label: "Art", icon: "mdi:palette-outline" },
  { slug: "lifestyle", label: "Lifestyle", icon: "mdi:leaf-circle-outline" },
  { slug: "beaute", label: "Beauté", icon: "mdi:shimmer" },
  { slug: "langage", label: "Langage", icon: "mdi:chat-outline" },
  { slug: "sport", label: "Sport", icon: "mdi:run" },
];

const AGE_RANGES = ["13-17 ans", "18-24 ans", "25-34 ans", "35-44 ans", "45-65 ans", "+65 ans"];
const AGE_SLUGS = ["13-17", "18-24", "25-34", "35-44", "45-65", "65-plus"];
const NETWORKS = ["Tiktok", "Instagram", "Youtube", "Pinterest", "X (Twitter)", "Facebook"];
const NET_SLUGS = ["tiktok", "instagram", "youtube", "pinterest", "x", "facebook"];
const GEOS = ["France", "Amér. du Nord", "Amér. du Sud", "Europe", "Asie", "Afrique", "International"];
const GEO_SLUGS = ["france", "amerique-nord", "amerique-sud", "europe", "asie", "afrique", "international"];
const GENDERS = [{ label: "Homme", slug: "homme" }, { label: "Femme", slug: "femme" }, { label: "Tous", slug: "tous" }, { label: "Autre", slug: "autre" }];
const PRO_SITS = ["Salarié.e", "Étudiant.e", "Indépendant.e", "Retraité.e", "En recherche d'emploi"];
const PRO_SLUGS = ["salarie", "etudiant", "independant", "retraite", "en-recherche"];
const FAM_SITS = ["Couple", "Célibataire", "Parents", "Seul", "Colocataire"];
const FAM_SLUGS = ["couple", "celibataire", "parents", "seul", "colocataire"];
const REVENUE_OPTS = ["-10K€", "+10K/20K€", "+20K/30K€", "+30K/40K€", "+50K/60K€", "+60K/70K€", "+70K/80K€", "+80K/90K€", "+100K€"];
const REV_SLUGS = ["-10k", "10-20k", "20-30k", "30-40k", "50-60k", "60-70k", "70-80k", "80-90k", "100k-plus"];

const FEATURES = [
  { label: "Recherches / jour",      freemium: "7",  premium: "∞",   business: "∞"   },
  { label: "Fiches complètes",       freemium: false, premium: true,  business: true  },
  { label: "Tous les filtres",       freemium: false, premium: true,  business: true  },
  { label: "Alertes personnalisées", freemium: false, premium: true,  business: true  },
  { label: "Sauvegarde favoris",     freemium: false, premium: true,  business: true  },
  { label: "Export PDF / Excel",     freemium: false, premium: false, business: true  },
  { label: "Dashboard équipe",       freemium: false, premium: false, business: true  },
  { label: "Rapports personnalisés", freemium: false, premium: false, business: true  },
  { label: "Accès API",              freemium: false, premium: false, business: true  },
  { label: "Communauté",             freemium: true,  premium: true,  business: true  },
];

const PLAN_META = {
  freemium: { label: "Freemium", price: "Gratuit",    badge: "bg-gray-100 text-gray-700" },
  premium:  { label: "Premium",  price: "14,99€/mois", badge: "bg-black text-white"       },
  business: { label: "Business", price: "89,99€/mois", badge: "bg-gray-800 text-white"    },
} as const;

type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7;
type Plan = "freemium" | "premium" | "business" | "";

// ── Component ─────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);

  // Profile data
  const [role, setRole] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [ages, setAges] = useState<string[]>([]);
  const [networks, setNetworks] = useState<string[]>([]);
  const [geos, setGeos] = useState<string[]>([]);
  const [gender, setGender] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [proSits, setProSits] = useState<string[]>([]);
  const [famSits, setFamSits] = useState<string[]>([]);
  const [revenues, setRevenues] = useState<string[]>([]);

  // Account
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);

  // Subscription & payment
  const [plan, setPlan] = useState<Plan>("");
  const [payLoading, setPayLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [dir, setDir] = useState<'fwd' | 'bck'>('fwd');

  const toggleItem = (list: string[], setList: (v: string[]) => void, slug: string) => {
    setList(list.includes(slug) ? list.filter(s => s !== slug) : [...list, slug]);
  };

  const handleCreateAccount = async () => {
    if (!email || password.length < 8) return;
    setError(null);
    setLoading(true);
    try {
      await apiRegister(email, password, username || undefined);
      const { access_token } = await apiLogin(email, password);
      await apiSaveOnboarding(access_token, {
        role,
        target_ages: ages,
        target_networks: networks,
        target_geography: geos,
        target_gender: gender || undefined,
        interest_slugs: interests,
      });
      localStorage.setItem("augure_token", access_token);
      document.cookie = "augure_session=1; path=/; SameSite=Lax";
      setStep(5);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur inattendue");
    } finally {
      setLoading(false);
    }
  };

  const callSavePlan = async (chosen: 'freemium' | 'premium' | 'business') => {
    const token = localStorage.getItem('augure_token');
    if (token) await apiSavePlan(token, chosen).catch(() => { });
  };

  const handlePay = async () => {
    setPayLoading(true);
    await new Promise(r => setTimeout(r, 1500));
    await callSavePlan(plan as 'premium' | 'business');
    setPayLoading(false);
    setStep(7);
  };

  const progressTotal = 4;
  const currentProgress = Math.min(step, progressTotal);

  return (
    <div className="fixed inset-0 z-[100] bg-white flex flex-col overflow-y-auto">

      {/* ── Progress bar (steps 1–4) ── */}
      {step < 5 && (
        <div className="flex-shrink-0 px-5 pt-5 pb-0">
          <div className="flex gap-2 mb-2">
            {Array.from({ length: progressTotal }).map((_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-all ${i < currentProgress ? "bg-black" : "bg-gray-200"}`}
              />
            ))}
          </div>
          <div className="flex items-center justify-between mt-3">
            {step > 1 ? (
              <button
                onClick={() => { setError(null); setDir('bck'); setStep((s) => (s - 1) as Step); }}
                className="w-9 h-9 rounded-full border flex items-center justify-center hover:bg-gray-50 transition-colors"
                style={{ borderColor: "var(--color-text-dark)" }}
              >
                <Icon icon="mdi:arrow-left" className="text-lg text-[var(--color-text-dark)]" />
              </button>
            ) : <div />}
            <span className="font-inter text-sm text-gray-400">Étape {step} sur {progressTotal}</span>
          </div>
        </div>
      )}

      {/* ── Content (steps 1–4, 6, 7) ── */}
      {step !== 5 && (
        <div className="flex-1 flex flex-col px-5 pt-6 pb-6 max-w-lg mx-auto w-full">

          {/* STEP 1 – Rôle */}
          {step === 1 && (
            <div key="step-1" className={dir === 'fwd' ? 'anim-step-fwd' : 'anim-step-bck'}>
              <h1 className="font-syne font-bold text-3xl text-[var(--color-text-dark)] mb-1">
                Quel est votre rôle ?
              </h1>
              <p className="font-inter text-sm text-gray-400 mb-6">
                Sélectionnez votre métier pour personnaliser votre expérience.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {ROLES.map((r, i) => (
                  <button
                    key={r.value}
                    style={{ animationDelay: `${i * 50}ms` }}
                    onClick={() => { setRole(r.value); setError(null); }}
                    className={`anim-scale-in relative flex flex-col gap-2 p-4 rounded-2xl border-2 text-left transition-all ${role === r.value
                      ? "bg-black border-black text-white"
                      : "bg-white border-gray-200 hover:border-gray-400 text-[var(--color-text-dark)]"
                      }`}
                  >
                    <div className={`absolute -top-2.5 right-3 px-3 py-0.5 rounded-full text-xs font-syne font-bold ${role === r.value ? "bg-black text-white border border-white/20" : "bg-black text-white"
                      }`}>
                      {r.value === "community_manager" ? "CM"
                        : r.value === "content_creator" ? "CC"
                          : r.value === "influenceur" ? "INF"
                            : r.value === "agence" ? "AG"
                              : r.value === "parent" ? "PA"
                                : r.value === "teacher" ? "EN" : "AU"}
                    </div>
                    <div className="mt-1">
                      <div className="font-syne font-bold text-sm leading-tight">{r.label}</div>
                      <div className={`font-inter text-xs mt-0.5 ${role === r.value ? "text-white/60" : "text-gray-400"}`}>
                        {r.desc}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 2 – Centres d'intérêt */}
          {step === 2 && (
            <div key="step-2" className={dir === 'fwd' ? 'anim-step-fwd' : 'anim-step-bck'}>
              <h1 className="font-syne font-bold text-3xl text-[var(--color-text-dark)] mb-1">
                Vos centres d&apos;intérêt
              </h1>
              <p className="font-inter text-sm text-gray-400 mb-6">
                Sélectionnez au moins un domaine qui vous parle.
              </p>
              <div className="flex flex-wrap gap-2.5">
                {INTERESTS.map((interest, idx) => (
                  <button
                    key={interest.slug}
                    style={{ animationDelay: `${idx * 35}ms` }}
                    onClick={() => toggleItem(interests, setInterests, interest.slug)}
                    className={`anim-fade-up flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 font-syne font-semibold text-sm transition-all ${interests.includes(interest.slug)
                      ? "bg-black border-black text-white"
                      : "bg-white border-gray-200 hover:border-gray-400 text-[var(--color-text-dark)]"
                      }`}
                  >
                    <Icon icon={interest.icon} className="text-lg" />
                    {interest.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3 – Audience */}
          {step === 3 && (
            <div key="step-3" className={dir === 'fwd' ? 'anim-step-fwd' : 'anim-step-bck'}>
              <h1 className="font-syne font-bold text-3xl text-[var(--color-text-dark)] mb-1">
                Votre audience
              </h1>
              <p className="font-inter text-sm text-gray-400 mb-5">
                Augure filtrera les tendances selon ces critères.
              </p>
              <div className="anim-fade-up" style={{ animationDelay: '0ms' }}>
                <Section label="TRANCHE D'ÂGE">
                  <PillGroup items={AGE_RANGES} slugs={AGE_SLUGS} selected={ages} onToggle={s => toggleItem(ages, setAges, s)} />
                </Section>
              </div>
              <div className="anim-fade-up" style={{ animationDelay: '80ms' }}>
                <Section label="RÉSEAUX">
                  <PillGroup items={NETWORKS} slugs={NET_SLUGS} selected={networks} onToggle={s => toggleItem(networks, setNetworks, s)} />
                </Section>
              </div>
              <div className="anim-fade-up" style={{ animationDelay: '160ms' }}>
                <Section label="GÉOGRAPHIE">
                  <PillGroup items={GEOS} slugs={GEO_SLUGS} selected={geos} onToggle={s => toggleItem(geos, setGeos, s)} />
                </Section>
              </div>
              <Section label="GENRE">
                <div className="flex flex-wrap gap-2">
                  {GENDERS.map(g => (
                    <button
                      key={g.slug}
                      onClick={() => setGender(prev => prev === g.slug ? "" : g.slug)}
                      className={`px-4 py-2 rounded-xl border-2 font-inter text-sm font-medium transition-all ${gender === g.slug
                        ? "bg-black border-black text-white"
                        : "bg-white border-gray-200 hover:border-gray-400 text-[var(--color-text-dark)]"
                        }`}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </Section>
              <button
                onClick={() => setShowAdvanced(p => !p)}
                className="flex items-center gap-2 font-inter text-sm font-semibold text-gray-500 hover:text-black transition-colors mt-1 mb-3"
              >
                <div className="h-px flex-1 bg-gray-200" />
                <span>AVANCÉ</span>
                <Icon icon={showAdvanced ? "mdi:chevron-up" : "mdi:chevron-down"} className="text-lg" />
                <div className="h-px flex-1 bg-gray-200" />
              </button>
              {showAdvanced && (
                <>
                  <Section label="SITUATIONS PROFESSIONNELLES">
                    <PillGroup items={PRO_SITS} slugs={PRO_SLUGS} selected={proSits} onToggle={s => toggleItem(proSits, setProSits, s)} />
                  </Section>
                  <Section label="SITUATIONS FAMILIALES">
                    <PillGroup items={FAM_SITS} slugs={FAM_SLUGS} selected={famSits} onToggle={s => toggleItem(famSits, setFamSits, s)} />
                  </Section>
                  <Section label="REVENUS /an">
                    <PillGroup items={REVENUE_OPTS} slugs={REV_SLUGS} selected={revenues} onToggle={s => toggleItem(revenues, setRevenues, s)} />
                  </Section>
                </>
              )}
            </div>
          )}

          {/* STEP 4 – Informations */}
          {step === 4 && (
            <div key="step-4" className={dir === 'fwd' ? 'anim-step-fwd' : 'anim-step-bck'}>
              <h1 className="font-syne font-bold text-3xl text-[var(--color-text-dark)] mb-1">
                Vos informations
              </h1>
              <p className="font-inter text-sm text-gray-400 mb-6">
                Dernière étape avant de découvrir vos tendances.
              </p>
              <div className="flex flex-col gap-4">
                <div>
                  <label className="font-inter text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">Pseudo</label>
                  <input
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="Votre pseudo"
                    className="w-full px-4 py-4 rounded-2xl border border-gray-200 bg-white font-inter text-sm text-[var(--color-text-dark)] placeholder-gray-300 focus:outline-none focus:border-black transition-colors"
                  />
                </div>
                <div>
                  <label className="font-inter text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">Adresse email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleCreateAccount()}
                    placeholder="adresse@gmail.com"
                    className="w-full px-4 py-4 rounded-2xl border border-gray-200 bg-white font-inter text-sm text-[var(--color-text-dark)] placeholder-gray-300 focus:outline-none focus:border-black transition-colors"
                  />
                </div>
                <div>
                  <label className="font-inter text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">Mot de passe</label>
                  <div className="relative">
                    <input
                      type={showPwd ? "text" : "password"}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && handleCreateAccount()}
                      placeholder="8 caractères minimum"
                      className="w-full px-4 py-4 rounded-2xl border border-gray-200 bg-white font-inter text-sm text-[var(--color-text-dark)] placeholder-gray-300 focus:outline-none focus:border-black transition-colors pr-12"
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowPwd(p => !p)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <Icon icon={showPwd ? "mdi:eye-off-outline" : "mdi:eye-outline"} className="text-xl" />
                    </button>
                  </div>
                </div>
              </div>
              {error && (
                <div className="mt-4 px-4 py-3 rounded-xl bg-black/5 font-inter text-sm text-[var(--color-text-dark)]">
                  {error}
                </div>
              )}
            </div>
          )}

          {/* STEP 6 – Paiement simulé (Premium / Business) */}
          {step === 6 && (
            <div key="step-6" className="anim-step-fwd">
              <button
                onClick={() => setStep(5)}
                className="w-9 h-9 mb-5 rounded-full border flex items-center justify-center hover:bg-gray-50 transition-colors self-start"
                style={{ borderColor: "var(--color-text-dark)" }}
              >
                <Icon icon="mdi:arrow-left" className="text-lg text-[var(--color-text-dark)]" />
              </button>

              <h1 className="font-syne font-bold text-3xl text-[var(--color-text-dark)] mb-1">Paiement</h1>
              <p className="font-inter text-sm text-gray-400 mb-6">
                Abonnement {plan === "premium" ? "Premium · 14,99€" : "Business · 89,99€"}/mois
              </p>

              {/* Visual credit card */}
              <div
                className="rounded-2xl p-5 mb-6 relative overflow-hidden"
                style={{ background: "linear-gradient(135deg, #1a1a1a 0%, #3a3a3a 100%)", minHeight: 160 }}
              >
                <div className="absolute top-4 right-4 opacity-20">
                  <Icon icon="mdi:credit-card-chip-outline" className="text-5xl text-white" />
                </div>
                <div className="flex items-center gap-2 mb-8">
                  <div className="w-8 h-5 rounded-sm bg-yellow-400 opacity-80" />
                  <span className="font-syne font-bold text-white/60 text-xs tracking-widest uppercase">
                    AUGURE {plan.toUpperCase()}
                  </span>
                </div>
                <p className="font-mono text-white text-lg tracking-[0.18em] mb-4">4242 4242 4242 4242</p>
                <div className="flex justify-between items-end">
                  <span className="font-inter text-white/70 text-sm">{username || "Titulaire"}</span>
                  <span className="font-inter text-white/70 text-sm">12/26</span>
                </div>
              </div>

              {/* Form — pre-filled, read-only (simulation) */}
              <div className="flex flex-col gap-3">
                <div>
                  <label className="font-inter text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">Numéro de carte</label>
                  <input
                    readOnly
                    value="4242 4242 4242 4242"
                    className="w-full px-4 py-4 rounded-2xl border border-gray-200 bg-gray-50 font-mono text-sm text-[var(--color-text-dark)] focus:outline-none cursor-default"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-inter text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">Expiration</label>
                    <input
                      readOnly
                      value="12/26"
                      className="w-full px-4 py-4 rounded-2xl border border-gray-200 bg-gray-50 font-mono text-sm text-[var(--color-text-dark)] focus:outline-none cursor-default"
                    />
                  </div>
                  <div>
                    <label className="font-inter text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">CVV</label>
                    <input
                      readOnly
                      value="123"
                      className="w-full px-4 py-4 rounded-2xl border border-gray-200 bg-gray-50 font-mono text-sm text-[var(--color-text-dark)] focus:outline-none cursor-default"
                    />
                  </div>
                </div>
              </div>

              <p className="font-inter text-xs text-gray-400 text-center mt-3 mb-6">
                Carte de test — le paiement est entièrement simulé
              </p>

              <button
                onClick={handlePay}
                disabled={payLoading}
                className="w-full py-4 rounded-2xl bg-black text-white font-syne font-bold text-sm flex items-center justify-center gap-2 hover:opacity-80 transition-opacity disabled:opacity-50"
              >
                {payLoading
                  ? <><Icon icon="mdi:loading" className="animate-spin text-xl" /> Traitement en cours…</>
                  : `Payer ${plan === "premium" ? "14,99€" : "89,99€"}`
                }
              </button>
            </div>
          )}

          {/* STEP 7 – Succès */}
          {step === 7 && (
            <div key="step-7" className="anim-step-fwd flex-1 flex flex-col">
              <div className="flex justify-center mb-6">
                <Image src="/logo-black.svg" alt="Augure" width={240} height={26} priority style={{ height: 'auto' }} />
              </div>
              <h1 className="font-syne font-bold text-3xl text-[var(--color-text-dark)] mb-3">
                Votre espace est prêt.
              </h1>
              <p className="font-inter text-sm text-gray-500 leading-relaxed mb-8">
                Augure a configuré votre fil selon votre audience.<br />
                Les tendances qui comptent pour vous apparaissent en premier.
              </p>
              <div className="flex justify-center mb-8">
                <div className="w-24 h-24 rounded-[22px] bg-gradient-to-br from-gray-300 to-black shadow-xl relative">
                  <Icon icon="mdi:star-four-points" className="absolute -top-4 -left-1 text-4xl text-black" />
                </div>
              </div>
              <div className="rounded-2xl border border-gray-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100">
                  <div className="font-inter text-xs text-gray-400 mb-0.5">Plan</div>
                  <div className="flex items-center gap-2">
                    {plan && (
                      <span className={`px-3 py-0.5 rounded-full text-xs font-syne font-bold ${PLAN_META[plan as keyof typeof PLAN_META]?.badge ?? "bg-gray-100 text-gray-700"}`}>
                        {PLAN_META[plan as keyof typeof PLAN_META]?.label ?? plan}
                      </span>
                    )}
                    <span className="font-syne font-bold text-[var(--color-text-dark)]">
                      {plan ? PLAN_META[plan as keyof typeof PLAN_META]?.price : ""}
                    </span>
                  </div>
                </div>
                <div className="px-5 py-4 border-b border-gray-100">
                  <div className="font-inter text-xs text-gray-400 mb-0.5">Rôle</div>
                  <div className="font-syne font-bold text-[var(--color-text-dark)]">
                    {ROLES.find(r => r.value === role)?.label ?? role}
                  </div>
                </div>
                <div className="px-5 py-4 border-b border-gray-100">
                  <div className="font-inter text-xs text-gray-400 mb-0.5">Audience cible</div>
                  <div className="font-syne font-bold text-[var(--color-text-dark)]">
                    {[
                      ages.map(a => AGE_RANGES[AGE_SLUGS.indexOf(a)]).join(", "),
                      geos.map(g => GEOS[GEO_SLUGS.indexOf(g)]).join(", "),
                    ].filter(Boolean).join(" · ") || "Non renseignée"}
                  </div>
                </div>
                <div className="px-5 py-4">
                  <div className="font-inter text-xs text-gray-400 mb-2">Centres d&apos;intérêt</div>
                  <div className="flex flex-wrap gap-2">
                    {interests.map(slug => (
                      <span key={slug} className="px-3 py-1 rounded-full bg-gray-100 font-inter text-sm text-[var(--color-text-dark)] font-medium capitalize">
                        {INTERESTS.find(i => i.slug === slug)?.label ?? slug}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <button
                onClick={() => router.push("/")}
                className="mt-8 w-full py-4 rounded-2xl bg-black text-white font-syne font-bold text-sm hover:opacity-80 transition-opacity flex items-center justify-center gap-2"
              >
                Découvrir les tendances <Icon icon="mdi:arrow-right" className="text-lg" />
              </button>
            </div>
          )}

        </div>
      )}

      {/* ── STEP 5 – Abonnement (layout pleine largeur) ── */}
      {step === 5 && (
        <div className="flex-1 flex flex-col">

          {/* Contenu scrollable */}
          <div className="flex-1 px-5 pt-8 pb-6 max-w-lg mx-auto w-full">
            <h1 className="font-syne font-bold text-3xl text-[var(--color-text-dark)] leading-tight mb-8">
              Bienvenue.<br />Choisissez votre plan.
            </h1>

            {/* Plan cards — stacked vertical */}
            <div className="flex flex-col gap-3 mb-10">

              {/* Freemium */}
              <button
                onClick={() => setPlan("freemium")}
                className={`relative flex flex-col p-5 rounded-2xl border-2 text-left transition-all ${plan === "freemium" ? "border-black bg-white" : "border-gray-200 bg-gray-50"}`}
              >
                <span className="absolute -top-2.5 left-3 px-3 py-0.5 rounded-full text-xs font-syne font-bold bg-gray-200 text-gray-700">
                  FREEMIUM
                </span>
                <div className="mt-3 font-syne font-bold text-2xl text-[var(--color-text-dark)]">Gratuit</div>
                <div className="font-inter text-xs text-gray-400 mt-0.5">7 recherches / jour · Fiches basiques</div>
              </button>

              {/* Premium — recommandé */}
              <button
                onClick={() => setPlan("premium")}
                className={`relative flex flex-col p-5 rounded-2xl border-2 text-left transition-all ${plan === "premium" || plan === "" ? "border-zinc-600" : "border-zinc-700/50"}`}
                style={{ background: "linear-gradient(145deg, #1c1c1e 0%, #2e2e30 55%, #1a1a1c 100%)" }}
              >
                {/* Shine overlay — clipé au contour de la carte, sans affecter le badge qui déborde */}
                <span className="absolute inset-0 overflow-hidden rounded-[14px] pointer-events-none" aria-hidden>
                  <span className="plan-shine" />
                </span>
                <span className="absolute -top-2.5 left-3 px-3 py-0.5 rounded-full text-xs font-syne font-bold bg-white text-black flex items-center gap-1">
                  <Icon icon="mdi:star-four-points" className="text-[10px]" /> PREMIUM · RECOMMANDÉ
                </span>
                <div className="mt-3 font-syne font-bold text-2xl italic text-white">14,99€</div>
                <div className="font-inter text-xs text-white/50 mt-0.5">Par mois · Recherches illimitées</div>
              </button>

              {/* Business */}
              <button
                onClick={() => setPlan("business")}
                className={`relative flex flex-col p-5 rounded-2xl border-2 text-left transition-all ${plan === "business" ? "border-black bg-white" : "border-gray-200"}`}
              >
                <span className="absolute -top-2.5 left-3 px-3 py-0.5 rounded-full text-xs font-syne font-bold bg-gray-800 text-white">
                  BUSINESS
                </span>
                <div className="mt-3 font-syne font-bold text-2xl italic text-[var(--color-text-dark)]">89,99€</div>
                <div className="font-inter text-xs text-gray-400 mt-0.5">Par mois · Équipes jusqu'à 5 membres</div>
              </button>
            </div>

            {/* Tableau comparatif */}
            <div>
              {/* En-tête */}
              <div className="grid pb-2 border-b border-gray-100" style={{ gridTemplateColumns: "1fr 44px 44px 44px" }}>
                <div />
                <div className="font-inter text-[10px] text-gray-400 text-center">F</div>
                <div className="font-syne text-[10px] font-semibold text-[var(--color-text-dark)] text-center">P</div>
                <div className="font-syne text-[10px] font-semibold text-[var(--color-text-dark)] text-center">B</div>
              </div>

              {/* Lignes */}
              {FEATURES.map(f => (
                <div
                  key={f.label}
                  className="grid items-center py-2.5 border-b border-gray-50"
                  style={{ gridTemplateColumns: "1fr 44px 44px 44px" }}
                >
                  <div className="font-inter text-sm text-gray-600 pr-2">{f.label}</div>
                  {(["freemium", "premium", "business"] as const).map(col => {
                    const val = f[col];
                    return (
                      <div key={col} className="flex justify-center">
                        {typeof val === "string"
                          ? <span className="font-inter text-xs font-semibold text-[var(--color-text-dark)]">{val}</span>
                          : val
                            ? <Icon icon="mdi:check" className="text-base text-[var(--color-text-dark)]" />
                            : <span className="text-gray-300 font-bold leading-none text-sm">—</span>
                        }
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Footer CTA noir */}
          <div className="bg-black px-6 pt-7 pb-10 flex-shrink-0">
            <p className="font-syne font-bold text-white text-lg text-center mb-6 leading-snug">
              {plan === "freemium"
                ? <>Démarrez <span className="bg-white text-black px-2.5 py-0.5 rounded-lg font-black">gratuitement</span></>
                : plan === "business"
                  ? <>Passez à l&apos;échelle avec <span className="bg-white text-black px-2.5 py-0.5 rounded-lg font-black">Business</span></>
                  : <>Devenez <span className="bg-white text-black px-2.5 py-0.5 rounded-lg font-black">Premium</span> pour un accès illimité</>
              }
            </p>
            <button
              onClick={async () => {
                const chosen = plan || "premium";
                if (chosen === "freemium") {
                  await callSavePlan("freemium");
                  setStep(7);
                } else {
                  setPlan(chosen as "premium" | "business");
                  setStep(6);
                }
              }}
              className="w-full py-4 rounded-full bg-white text-black font-syne font-bold text-sm hover:opacity-90 transition-opacity mb-3"
            >
              {plan === "freemium"
                ? "Continuer gratuitement"
                : plan === "business"
                  ? "Continuer avec Business"
                  : "Continuer avec Premium"
              }
            </button>
            <p className="font-inter text-xs text-white/40 text-center mb-5">
              {plan === "freemium" ? "Passez à Premium à tout moment" : "Changez ou annulez à tout moment"}
            </p>
            {plan !== "freemium" && (
              <button
                onClick={async () => { setPlan("freemium"); await callSavePlan("freemium"); setStep(7); }}
                className="w-full font-inter text-xs text-white/40 hover:text-white/70 transition-colors text-center mb-6"
              >
                Continuer avec Freemium (gratuit)
              </button>
            )}
            <div className="flex justify-center gap-6">
              {["Abonnement", "Termes", "Privacy"].map(l => (
                <span key={l} className="font-inter text-xs text-white/25">{l}</span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Footer CTA (steps 1–4) ── */}
      {step < 5 && (
        <div className="flex-shrink-0 px-5 pb-8 pt-2 max-w-lg mx-auto w-full">
          {step < 4 && error && (
            <div className="mb-3 px-4 py-3 rounded-xl bg-black/5 font-inter text-sm text-[var(--color-text-dark)]">
              {error}
            </div>
          )}
          <button
            disabled={loading}
            onClick={() => {
              setError(null);
              setDir('fwd');
              if (step === 1) {
                if (!role) { setError("Sélectionnez votre profil."); return; }
                setStep(2);
              } else if (step === 2) {
                if (interests.length === 0) { setError("Sélectionnez au moins un intérêt."); return; }
                setStep(3);
              } else if (step === 3) {
                if (ages.length === 0) { setError("Sélectionnez au moins une tranche d'âge."); return; }
                setStep(4);
              } else if (step === 4) {
                handleCreateAccount();
              }
            }}
            className="w-full py-4 rounded-2xl bg-black text-white font-syne font-bold text-sm flex items-center justify-center gap-2 hover:opacity-80 transition-opacity disabled:opacity-30"
          >
            {loading
              ? <Icon icon="mdi:loading" className="animate-spin text-xl" />
              : step === 4 ? "Créer mon compte" : "Continuer"
            }
          </button>
        </div>
      )}
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <div className="font-inter text-xs font-bold text-gray-500 uppercase tracking-widest mb-2.5">{label}</div>
      {children}
    </div>
  );
}

function PillGroup({ items, slugs, selected, onToggle }: {
  items: string[]; slugs: string[]; selected: string[]; onToggle: (slug: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((label, i) => {
        const slug = slugs[i];
        const active = selected.includes(slug);
        return (
          <button
            key={slug}
            onClick={() => onToggle(slug)}
            className={`px-3.5 py-2 rounded-xl border font-inter text-sm transition-all ${active
              ? "bg-black border-black text-white font-semibold"
              : "bg-white border-gray-200 hover:border-gray-400 text-[var(--color-text-dark)]"
              }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
