"use client";

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@iconify/react';
import {
  ApiUser,
  apiGetMe,
  apiUpdatePreferences,
  apiUpdateProfile,
  apiUploadAvatar,
} from '@/lib/api';

// ── Constants (same as onboarding) ────────────────────────────────────────────

const ROLES = [
  { slug: "community_manager", label: "Community Manager", icon: "mdi:account-star" },
  { slug: "agence",            label: "Agence",             icon: "mdi:office-building" },
  { slug: "content_creator",   label: "Créateur de contenu", icon: "mdi:pencil-box" },
  { slug: "influenceur",       label: "Influenceur",         icon: "mdi:account-group" },
  { slug: "parent",            label: "Parent",              icon: "mdi:account-child" },
  { slug: "teacher",           label: "Enseignant",          icon: "mdi:school" },
  { slug: "autre",             label: "Autre",               icon: "mdi:dots-horizontal-circle" },
];

const INTERESTS = [
  { slug: "mode",      label: "Mode",      icon: "mdi:hanger" },
  { slug: "food",      label: "Food",      icon: "mdi:food-fork-drink" },
  { slug: "tech",      label: "Tech",      icon: "mdi:chip" },
  { slug: "musique",   label: "Musique",   icon: "mdi:music-note" },
  { slug: "art",       label: "Art",       icon: "mdi:palette-outline" },
  { slug: "lifestyle", label: "Lifestyle", icon: "mdi:leaf-circle-outline" },
  { slug: "beaute",    label: "Beauté",    icon: "mdi:shimmer" },
  { slug: "langage",   label: "Langage",   icon: "mdi:chat-outline" },
  { slug: "sport",     label: "Sport",     icon: "mdi:run" },
];

const AGE_RANGES = ["13-17 ans", "18-24 ans", "25-34 ans", "35-44 ans", "45-65 ans", "+65 ans"];
const AGE_SLUGS  = ["13-17",     "18-24",     "25-34",     "35-44",     "45-65",     "65-plus"];
const NETWORKS   = ["TikTok", "Instagram", "YouTube", "Pinterest", "X (Twitter)", "Facebook"];
const NET_SLUGS  = ["tiktok", "instagram",  "youtube", "pinterest", "x",           "facebook"];
const GEOS       = ["France", "Amér. du Nord", "Amér. du Sud", "Europe", "Asie", "Afrique", "International"];
const GEO_SLUGS  = ["france", "amerique-nord", "amerique-sud", "europe", "asie", "afrique", "international"];
const GENDERS    = [
  { label: "Homme", slug: "homme" },
  { label: "Femme",  slug: "femme"  },
  { label: "Tous",   slug: "tous"   },
  { label: "Autre",  slug: "autre"  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function toggle(list: string[], slug: string): string[] {
  return list.includes(slug) ? list.filter(s => s !== slug) : [...list, slug];
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-syne font-bold text-lg text-[var(--color-text-dark)] mb-3">
      {children}
    </h2>
  );
}

function SaveFeedback({ error, success }: { error: string | null; success: boolean }) {
  if (error) return (
    <p className="mt-2 text-sm font-inter text-red-600 flex items-center gap-1">
      <Icon icon="mdi:alert-circle-outline" /> {error}
    </p>
  );
  if (success) return (
    <p className="mt-2 text-sm font-inter text-green-600 flex items-center gap-1">
      <Icon icon="mdi:check-circle-outline" /> Sauvegardé !
    </p>
  );
  return null;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Data ──────────────────────────────────────────────────────────────────
  const [user, setUser] = useState<ApiUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Avatar
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  // Username section
  const [username, setUsername] = useState('');
  const [usernameLoading, setUsernameLoading] = useState(false);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [usernameSuccess, setUsernameSuccess] = useState(false);

  // Preferences section
  const [role, setRole] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [ages, setAges] = useState<string[]>([]);
  const [networks, setNetworks] = useState<string[]>([]);
  const [geos, setGeos] = useState<string[]>([]);
  const [gender, setGender] = useState('');
  const [prefLoading, setPrefLoading] = useState(false);
  const [prefError, setPrefError] = useState<string | null>(null);
  const [prefSuccess, setPrefSuccess] = useState(false);

  // ── Load user ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem('augure_token');
    if (!token) { router.push('/welcome'); return; }

    apiGetMe(token)
      .then(data => {
        setUser(data);
        setUsername(data.username ?? '');
        setRole(data.role ?? '');
        setInterests(data.interests.map(i => i.slug));
        setAges(data.target_ages ?? []);
        setNetworks(data.target_networks ?? []);
        setGeos(data.target_geography ?? []);
        setGender(data.target_gender ?? '');
        if (data.avatar_url) setAvatarPreview(data.avatar_url);
      })
      .catch(() => router.push('/welcome'))
      .finally(() => setLoading(false));
  }, [router]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const token = localStorage.getItem('augure_token');
    if (!token) return;

    const preview = URL.createObjectURL(file);
    setAvatarPreview(preview);
    setAvatarLoading(true);
    setAvatarError(null);

    try {
      const { avatar_url } = await apiUploadAvatar(token, file);
      setAvatarPreview(avatar_url);
      setUser(u => u ? { ...u, avatar_url } : u);
    } catch (err) {
      setAvatarError(err instanceof Error ? err.message : "Erreur upload");
      setAvatarPreview(user?.avatar_url ?? null);
    } finally {
      setAvatarLoading(false);
    }
  };

  const handleSaveUsername = async () => {
    const token = localStorage.getItem('augure_token');
    if (!token || !username.trim()) return;
    setUsernameLoading(true);
    setUsernameError(null);
    setUsernameSuccess(false);
    try {
      const updated = await apiUpdateProfile(token, username.trim());
      setUser(u => u ? { ...u, username: updated.username } : u);
      setUsernameSuccess(true);
      setTimeout(() => setUsernameSuccess(false), 3000);
    } catch (err) {
      setUsernameError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setUsernameLoading(false);
    }
  };

  const handleSavePreferences = async () => {
    const token = localStorage.getItem('augure_token');
    if (!token) return;
    if (!role) { setPrefError("Sélectionnez un rôle."); return; }
    if (interests.length === 0) { setPrefError("Sélectionnez au moins un intérêt."); return; }
    if (ages.length === 0) { setPrefError("Sélectionnez au moins une tranche d'âge."); return; }

    setPrefLoading(true);
    setPrefError(null);
    setPrefSuccess(false);
    try {
      const updated = await apiUpdatePreferences(token, {
        role,
        interest_slugs: interests,
        target_ages: ages,
        target_networks: networks,
        target_geography: geos,
        target_gender: gender,
      });
      setUser(u => u ? { ...u, ...updated } : u);
      setPrefSuccess(true);
      setTimeout(() => setPrefSuccess(false), 3000);
    } catch (err) {
      setPrefError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setPrefLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('augure_token');
    document.cookie = 'augure_session=; path=/; max-age=0; SameSite=Lax';
    router.push('/welcome');
  };

  // ── Skeleton loading ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="px-4 md:px-8 pt-6 pb-24 max-w-2xl mx-auto space-y-6 animate-pulse">
        <div className="flex flex-col items-center gap-3">
          <div className="w-24 h-24 rounded-full bg-gray-200" />
          <div className="h-5 w-32 bg-gray-200 rounded-full" />
          <div className="h-4 w-48 bg-gray-100 rounded-full" />
        </div>
        {[1, 2, 3].map(i => (
          <div key={i} className="rounded-2xl bg-gray-100 h-32" />
        ))}
      </div>
    );
  }

  if (!user) return null;

  const initial = (user.username ?? user.email).charAt(0).toUpperCase();
  const planLabel = user.plan === 'pro' ? 'Pro' : 'Standard';

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="px-4 md:px-8 pt-6 pb-28 max-w-2xl mx-auto">

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col items-center gap-3 mb-8">
        <div className="relative">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="group relative w-24 h-24 rounded-full overflow-hidden focus:outline-none"
            aria-label="Changer la photo de profil"
          >
            {avatarPreview ? (
              <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-[var(--color-primary)] flex items-center justify-center">
                <span className="font-syne font-bold text-3xl text-white">{initial}</span>
              </div>
            )}
            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Icon icon="mdi:camera" className="text-white text-2xl" />
            </div>
          </button>

          {avatarLoading && (
            <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
              <Icon icon="mdi:loading" className="text-white text-2xl animate-spin" />
            </div>
          )}

          <button
            onClick={() => fileInputRef.current?.click()}
            className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center shadow-md"
            aria-label="Uploader une photo"
          >
            <Icon icon="mdi:pencil" className="text-sm" />
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleAvatarChange}
        />

        {avatarError && (
          <p className="text-sm text-red-500 font-inter flex items-center gap-1">
            <Icon icon="mdi:alert-circle-outline" /> {avatarError}
          </p>
        )}

        <div className="text-center">
          <p className="font-syne font-bold text-xl text-[var(--color-text-dark)]">
            {user.username ? `@${user.username}` : user.email}
          </p>
          <span className={`inline-block mt-1 px-3 py-0.5 rounded-full text-xs font-syne font-semibold ${user.plan === 'pro' ? 'bg-[var(--color-text-dark)] text-white' : 'bg-gray-100 text-gray-600'}`}>
            {planLabel}
          </span>
        </div>
      </div>

      {/* ── Informations ─────────────────────────────────────────────── */}
      <section className="mb-6 rounded-2xl bg-white p-5 shadow-sm border border-gray-100">
        <SectionTitle>Informations</SectionTitle>
        <label className="block font-inter text-sm text-gray-500 mb-1">Nom d'utilisateur</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={username}
            onChange={e => { setUsername(e.target.value); setUsernameSuccess(false); setUsernameError(null); }}
            onKeyDown={e => e.key === 'Enter' && handleSaveUsername()}
            placeholder="ex: mariedup"
            className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 font-inter text-sm focus:outline-none focus:border-[var(--color-text-dark)] transition-colors"
          />
          <button
            onClick={handleSaveUsername}
            disabled={usernameLoading || !username.trim()}
            className="px-4 py-2.5 rounded-xl bg-[var(--color-primary)] text-white font-syne font-semibold text-sm disabled:opacity-40 hover:opacity-80 transition-opacity"
          >
            {usernameLoading ? <Icon icon="mdi:loading" className="animate-spin text-base" /> : 'Sauver'}
          </button>
        </div>
        <SaveFeedback error={usernameError} success={usernameSuccess} />
      </section>

      {/* ── Rôle ─────────────────────────────────────────────────────── */}
      <section className="mb-6 rounded-2xl bg-white p-5 shadow-sm border border-gray-100">
        <SectionTitle>Rôle</SectionTitle>
        <div className="flex flex-wrap gap-2">
          {ROLES.map(r => (
            <button
              key={r.slug}
              onClick={() => setRole(r.slug)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 font-syne font-semibold text-sm transition-all ${
                role === r.slug
                  ? 'border-[var(--color-text-dark)] bg-[var(--color-text-dark)] text-white'
                  : 'border-gray-200 text-gray-700 hover:border-gray-400'
              }`}
            >
              <Icon icon={r.icon} className="text-base" />
              {r.label}
            </button>
          ))}
        </div>
      </section>

      {/* ── Centres d'intérêt ─────────────────────────────────────────── */}
      <section className="mb-6 rounded-2xl bg-white p-5 shadow-sm border border-gray-100">
        <SectionTitle>Centres d'intérêt</SectionTitle>
        <div className="flex flex-wrap gap-2">
          {INTERESTS.map(i => (
            <button
              key={i.slug}
              onClick={() => setInterests(prev => toggle(prev, i.slug))}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 font-syne font-semibold text-sm transition-all ${
                interests.includes(i.slug)
                  ? 'border-[var(--color-text-dark)] bg-[var(--color-text-dark)] text-white'
                  : 'border-gray-200 text-gray-700 hover:border-gray-400'
              }`}
            >
              <Icon icon={i.icon} className="text-base" />
              {i.label}
            </button>
          ))}
        </div>
      </section>

      {/* ── Audience cible ────────────────────────────────────────────── */}
      <section className="mb-6 rounded-2xl bg-white p-5 shadow-sm border border-gray-100">
        <SectionTitle>Audience cible</SectionTitle>

        <p className="font-inter text-xs text-gray-500 uppercase tracking-wide mb-2">Âge</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {AGE_RANGES.map((label, idx) => (
            <button
              key={AGE_SLUGS[idx]}
              onClick={() => setAges(prev => toggle(prev, AGE_SLUGS[idx]))}
              className={`px-3 py-1.5 rounded-lg border-2 font-syne font-semibold text-xs transition-all ${
                ages.includes(AGE_SLUGS[idx])
                  ? 'border-[var(--color-text-dark)] bg-[var(--color-text-dark)] text-white'
                  : 'border-gray-200 text-gray-600 hover:border-gray-400'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <p className="font-inter text-xs text-gray-500 uppercase tracking-wide mb-2">Réseaux sociaux</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {NETWORKS.map((label, idx) => (
            <button
              key={NET_SLUGS[idx]}
              onClick={() => setNetworks(prev => toggle(prev, NET_SLUGS[idx]))}
              className={`px-3 py-1.5 rounded-lg border-2 font-syne font-semibold text-xs transition-all ${
                networks.includes(NET_SLUGS[idx])
                  ? 'border-[var(--color-text-dark)] bg-[var(--color-text-dark)] text-white'
                  : 'border-gray-200 text-gray-600 hover:border-gray-400'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <p className="font-inter text-xs text-gray-500 uppercase tracking-wide mb-2">Géographie</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {GEOS.map((label, idx) => (
            <button
              key={GEO_SLUGS[idx]}
              onClick={() => setGeos(prev => toggle(prev, GEO_SLUGS[idx]))}
              className={`px-3 py-1.5 rounded-lg border-2 font-syne font-semibold text-xs transition-all ${
                geos.includes(GEO_SLUGS[idx])
                  ? 'border-[var(--color-text-dark)] bg-[var(--color-text-dark)] text-white'
                  : 'border-gray-200 text-gray-600 hover:border-gray-400'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <p className="font-inter text-xs text-gray-500 uppercase tracking-wide mb-2">Genre</p>
        <div className="flex flex-wrap gap-2 mb-6">
          {GENDERS.map(g => (
            <button
              key={g.slug}
              onClick={() => setGender(g.slug)}
              className={`px-3 py-1.5 rounded-lg border-2 font-syne font-semibold text-xs transition-all ${
                gender === g.slug
                  ? 'border-[var(--color-text-dark)] bg-[var(--color-text-dark)] text-white'
                  : 'border-gray-200 text-gray-600 hover:border-gray-400'
              }`}
            >
              {g.label}
            </button>
          ))}
        </div>

        <button
          onClick={handleSavePreferences}
          disabled={prefLoading}
          className="w-full py-3 rounded-xl bg-[var(--color-primary)] text-white font-syne font-bold text-sm disabled:opacity-40 hover:opacity-80 transition-opacity flex items-center justify-center gap-2"
        >
          {prefLoading
            ? <><Icon icon="mdi:loading" className="animate-spin" /> Sauvegarde…</>
            : 'Sauvegarder les préférences'
          }
        </button>
        <SaveFeedback error={prefError} success={prefSuccess} />
      </section>

      {/* ── Compte ───────────────────────────────────────────────────── */}
      <section className="mb-6 rounded-2xl bg-white p-5 shadow-sm border border-gray-100">
        <SectionTitle>Compte</SectionTitle>
        <div className="flex items-center justify-between py-2 border-b border-gray-100">
          <span className="font-inter text-sm text-gray-500">Email</span>
          <span className="font-inter text-sm text-gray-800">{user.email}</span>
        </div>
        <div className="flex items-center justify-between py-2">
          <span className="font-inter text-sm text-gray-500">Abonnement</span>
          <span className={`font-syne font-semibold text-sm ${user.plan === 'pro' ? 'text-[var(--color-text-dark)]' : 'text-gray-600'}`}>
            {planLabel}
          </span>
        </div>
        <button
          onClick={handleLogout}
          className="mt-4 w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-red-100 text-red-500 font-syne font-semibold text-sm hover:bg-red-50 transition-colors"
        >
          <Icon icon="mdi:logout" className="text-base" />
          Se déconnecter
        </button>
      </section>

    </div>
  );
}
