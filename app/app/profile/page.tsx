"use client";

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@iconify/react';
import Link from 'next/link';
import {
  ApiUser,
  ApiFavoriteCollection,
  ApiFavoriteItem,
  ApiLikedThread,
  ApiLikedComment,
  apiGetMe,
  apiUpdatePreferences,
  apiUpdateProfile,
  apiUploadAvatar,
  apiGetMyLikedThreads,
  apiGetMyLikedComments,
  apiGetMyCollections,
  apiGetCollectionItems,
  apiCreateCollection,
  apiDeleteCollection,
  STATUS_CONFIG,
} from '@/lib/api';
import CollectionPickerSheet from '@/components/CollectionPickerSheet';

// ── Constants ─────────────────────────────────────────────────────────────────

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

const EMOJI_OPTIONS = ['🔖', '📌', '⭐', '🎯', '🔥', '💡', '🎬', '📸', '🎵', '💎'];

// ── Helpers ───────────────────────────────────────────────────────────────────

function toggle(list: string[], slug: string): string[] {
  return list.includes(slug) ? list.filter(s => s !== slug) : [...list, slug];
}

function formatRelative(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 2) return "à l'instant";
  if (mins < 60) return `il y a ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  return days < 7 ? `il y a ${days}j` : new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="font-syne font-bold text-lg text-[var(--color-text-dark)] mb-3">{children}</h2>;
}

function SaveFeedback({ error, success }: { error: string | null; success: boolean }) {
  if (error) return <p className="mt-2 text-sm font-inter text-red-600 flex items-center gap-1"><Icon icon="mdi:alert-circle-outline" /> {error}</p>;
  if (success) return <p className="mt-2 text-sm font-inter text-green-600 flex items-center gap-1"><Icon icon="mdi:check-circle-outline" /> Sauvegardé !</p>;
  return null;
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [user, setUser] = useState<ApiUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Tab
  const [activeTab, setActiveTab] = useState<'preferences' | 'likes' | 'collections'>('preferences');

  // Avatar
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  // Preferences
  const [username, setUsername] = useState('');
  const [usernameLoading, setUsernameLoading] = useState(false);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [usernameSuccess, setUsernameSuccess] = useState(false);
  const [role, setRole] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [ages, setAges] = useState<string[]>([]);
  const [networks, setNetworks] = useState<string[]>([]);
  const [geos, setGeos] = useState<string[]>([]);
  const [gender, setGender] = useState('');
  const [prefLoading, setPrefLoading] = useState(false);
  const [prefError, setPrefError] = useState<string | null>(null);
  const [prefSuccess, setPrefSuccess] = useState(false);

  // Likes tab
  const [likedThreads, setLikedThreads] = useState<ApiLikedThread[]>([]);
  const [likedComments, setLikedComments] = useState<ApiLikedComment[]>([]);
  const [likesLoaded, setLikesLoaded] = useState(false);
  const [likesLoading, setLikesLoading] = useState(false);
  const [likesSubTab, setLikesSubTab] = useState<'threads' | 'comments'>('threads');

  // Collections tab
  const [collections, setCollections] = useState<ApiFavoriteCollection[]>([]);
  const [collectionsLoaded, setCollectionsLoaded] = useState(false);
  const [collectionsLoading, setCollectionsLoading] = useState(false);
  const [collectionDetail, setCollectionDetail] = useState<ApiFavoriteCollection | null>(null);
  const [collectionItems, setCollectionItems] = useState<ApiFavoriteItem[]>([]);
  const [colItemsLoading, setColItemsLoading] = useState(false);
  const [showCreateCol, setShowCreateCol] = useState(false);
  const [newColName, setNewColName] = useState('');
  const [newColEmoji, setNewColEmoji] = useState('🔖');
  const [creatingCol, setCreatingCol] = useState(false);
  const [colToDelete, setColToDelete] = useState<ApiFavoriteCollection | null>(null);
  const [deletingCol, setDeletingCol] = useState(false);

  // Load user
  useEffect(() => {
    const t = localStorage.getItem('augure_token');
    if (!t) { router.push('/welcome'); return; }
    setToken(t);
    apiGetMe(t)
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

  // Lazy load likes
  useEffect(() => {
    if (activeTab !== 'likes' || likesLoaded || !token) return;
    setLikesLoading(true);
    Promise.all([apiGetMyLikedThreads(token), apiGetMyLikedComments(token)])
      .then(([threads, comments]) => {
        setLikedThreads(threads);
        setLikedComments(comments);
        setLikesLoaded(true);
      })
      .finally(() => setLikesLoading(false));
  }, [activeTab, likesLoaded, token]);

  // Lazy load collections
  useEffect(() => {
    if (activeTab !== 'collections' || collectionsLoaded || !token) return;
    setCollectionsLoading(true);
    apiGetMyCollections(token)
      .then(cols => { setCollections(cols); setCollectionsLoaded(true); })
      .finally(() => setCollectionsLoading(false));
  }, [activeTab, collectionsLoaded, token]);

  // Load collection items on drill-in
  useEffect(() => {
    if (!collectionDetail || !token) return;
    setColItemsLoading(true);
    apiGetCollectionItems(token, collectionDetail.id)
      .then(setCollectionItems)
      .finally(() => setColItemsLoading(false));
  }, [collectionDetail, token]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;
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
    if (!token || !username.trim()) return;
    setUsernameLoading(true); setUsernameError(null); setUsernameSuccess(false);
    try {
      const updated = await apiUpdateProfile(token, username.trim());
      setUser(u => u ? { ...u, username: updated.username } : u);
      setUsernameSuccess(true);
      setTimeout(() => setUsernameSuccess(false), 3000);
    } catch (err) {
      setUsernameError(err instanceof Error ? err.message : "Erreur");
    } finally { setUsernameLoading(false); }
  };

  const handleSavePreferences = async () => {
    if (!token) return;
    if (!role) { setPrefError("Sélectionnez un rôle."); return; }
    if (interests.length === 0) { setPrefError("Sélectionnez au moins un intérêt."); return; }
    if (ages.length === 0) { setPrefError("Sélectionnez au moins une tranche d'âge."); return; }
    setPrefLoading(true); setPrefError(null); setPrefSuccess(false);
    try {
      const updated = await apiUpdatePreferences(token, { role, interest_slugs: interests, target_ages: ages, target_networks: networks, target_geography: geos, target_gender: gender });
      setUser(u => u ? { ...u, ...updated } : u);
      setPrefSuccess(true);
      setTimeout(() => setPrefSuccess(false), 3000);
    } catch (err) {
      setPrefError(err instanceof Error ? err.message : "Erreur");
    } finally { setPrefLoading(false); }
  };

  const handleLogout = () => {
    localStorage.removeItem('augure_token');
    document.cookie = 'augure_session=; path=/; max-age=0; SameSite=Lax';
    router.push('/welcome');
  };

  const handleCreateCollection = async () => {
    if (!token || !newColName.trim()) return;
    setCreatingCol(true);
    try {
      const col = await apiCreateCollection(token, { name: newColName.trim(), emoji: newColEmoji });
      setCollections(prev => [col, ...prev]);
      setNewColName(''); setNewColEmoji('🔖'); setShowCreateCol(false);
    } finally { setCreatingCol(false); }
  };

  const handleDeleteCollection = async () => {
    if (!token || !colToDelete) return;
    setDeletingCol(true);
    try {
      await apiDeleteCollection(token, colToDelete.id);
      setCollections(prev => prev.filter(c => c.id !== colToDelete.id));
      if (collectionDetail?.id === colToDelete.id) setCollectionDetail(null);
      setColToDelete(null);
    } finally {
      setDeletingCol(false);
    }
  };

  // ── Loading skeleton ───────────────────────────────────────────────────────

  if (loading) return (
    <div className="px-4 md:px-8 pt-6 pb-24 max-w-2xl mx-auto space-y-6 animate-pulse">
      <div className="flex flex-col items-center gap-3">
        <div className="w-24 h-24 rounded-full bg-gray-200" />
        <div className="h-5 w-32 bg-gray-200 rounded-full" />
      </div>
      {[1, 2, 3].map(i => <div key={i} className="rounded-2xl bg-gray-100 h-32" />)}
    </div>
  );

  if (!user) return null;

  const initial = (user.username ?? user.email).charAt(0).toUpperCase();
  const PLAN_LABELS: Record<string, string> = { freemium: 'Freemium', premium: 'Premium', business: 'Business' };
  const planLabel = PLAN_LABELS[user.plan] ?? user.plan;
  const planBadgeClass =
    user.plan === 'business' ? 'bg-gray-800 text-white' :
    user.plan === 'premium'  ? 'bg-[var(--color-text-dark)] text-white' :
                               'bg-gray-100 text-gray-600';

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
    <div className="w-full max-w-2xl mx-auto pb-6">

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col items-center gap-3 pt-6 pb-6 px-4">
        <div className="relative">
          <button onClick={() => fileInputRef.current?.click()} className="group relative w-24 h-24 rounded-full overflow-hidden focus:outline-none" aria-label="Changer la photo de profil">
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
          <button onClick={() => fileInputRef.current?.click()} className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center shadow-md" aria-label="Uploader une photo">
            <Icon icon="mdi:pencil" className="text-sm" />
          </button>
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
        {avatarError && <p className="text-sm text-red-500 font-inter flex items-center gap-1"><Icon icon="mdi:alert-circle-outline" /> {avatarError}</p>}
        <div className="text-center">
          <p className="font-syne font-bold text-xl text-[var(--color-text-dark)]">{user.username ? `@${user.username}` : user.email}</p>
          <span className={`inline-block mt-1 px-3 py-0.5 rounded-full text-xs font-syne font-semibold ${planBadgeClass}`}>{planLabel}</span>
        </div>
      </div>

      {/* ── Tabs ─────────────────────────────────────────────────────── */}
      <div className="flex border-b border-gray-100 px-4 mb-0">
        {([
          { key: 'preferences', label: 'Préférences', icon: 'mdi:tune' },
          { key: 'likes',       label: 'Likes',        icon: 'mdi:heart' },
          { key: 'collections', label: 'Collections',  icon: 'mdi:bookmark' },
        ] as const).map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 pb-3 px-3 mr-1 font-syne font-bold text-sm border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-[var(--color-text-dark)] text-[var(--color-text-dark)]'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            <Icon icon={tab.icon} className="text-base" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab: Préférences ────────────────────────────────────────── */}
      {activeTab === 'preferences' && (
        <div className="px-4 md:px-8 pt-6 pb-24 md:pb-6 flex flex-col gap-6">

          <section className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100">
            <SectionTitle>Informations</SectionTitle>
            <label className="block font-inter text-sm text-gray-500 mb-1">Nom d&apos;utilisateur</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={username}
                onChange={e => { setUsername(e.target.value); setUsernameSuccess(false); setUsernameError(null); }}
                onKeyDown={e => e.key === 'Enter' && handleSaveUsername()}
                placeholder="ex: mariedup"
                className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 font-inter text-sm focus:outline-none focus:border-[var(--color-text-dark)] transition-colors"
              />
              <button onClick={handleSaveUsername} disabled={usernameLoading || !username.trim()} className="px-4 py-2.5 rounded-xl bg-[var(--color-primary)] text-white font-syne font-semibold text-sm disabled:opacity-40 hover:opacity-80 transition-opacity">
                {usernameLoading ? <Icon icon="mdi:loading" className="animate-spin text-base" /> : 'Sauver'}
              </button>
            </div>
            <SaveFeedback error={usernameError} success={usernameSuccess} />
          </section>

          <section className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100">
            <SectionTitle>Rôle</SectionTitle>
            <div className="flex flex-wrap gap-2">
              {ROLES.map(r => (
                <button key={r.slug} onClick={() => setRole(r.slug)} className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 font-syne font-semibold text-sm transition-all ${role === r.slug ? 'border-[var(--color-text-dark)] bg-[var(--color-text-dark)] text-white' : 'border-gray-200 text-gray-700 hover:border-gray-400'}`}>
                  <Icon icon={r.icon} className="text-base" />{r.label}
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100">
            <SectionTitle>Centres d&apos;intérêt</SectionTitle>
            <div className="flex flex-wrap gap-2">
              {INTERESTS.map(i => (
                <button key={i.slug} onClick={() => setInterests(prev => toggle(prev, i.slug))} className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 font-syne font-semibold text-sm transition-all ${interests.includes(i.slug) ? 'border-[var(--color-text-dark)] bg-[var(--color-text-dark)] text-white' : 'border-gray-200 text-gray-700 hover:border-gray-400'}`}>
                  <Icon icon={i.icon} className="text-base" />{i.label}
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100">
            <SectionTitle>Audience cible</SectionTitle>
            <p className="font-inter text-xs text-gray-500 uppercase tracking-wide mb-2">Âge</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {AGE_RANGES.map((label, idx) => (
                <button key={AGE_SLUGS[idx]} onClick={() => setAges(prev => toggle(prev, AGE_SLUGS[idx]))} className={`px-3 py-1.5 rounded-lg border-2 font-syne font-semibold text-xs transition-all ${ages.includes(AGE_SLUGS[idx]) ? 'border-[var(--color-text-dark)] bg-[var(--color-text-dark)] text-white' : 'border-gray-200 text-gray-600 hover:border-gray-400'}`}>{label}</button>
              ))}
            </div>
            <p className="font-inter text-xs text-gray-500 uppercase tracking-wide mb-2">Réseaux sociaux</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {NETWORKS.map((label, idx) => (
                <button key={NET_SLUGS[idx]} onClick={() => setNetworks(prev => toggle(prev, NET_SLUGS[idx]))} className={`px-3 py-1.5 rounded-lg border-2 font-syne font-semibold text-xs transition-all ${networks.includes(NET_SLUGS[idx]) ? 'border-[var(--color-text-dark)] bg-[var(--color-text-dark)] text-white' : 'border-gray-200 text-gray-600 hover:border-gray-400'}`}>{label}</button>
              ))}
            </div>
            <p className="font-inter text-xs text-gray-500 uppercase tracking-wide mb-2">Géographie</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {GEOS.map((label, idx) => (
                <button key={GEO_SLUGS[idx]} onClick={() => setGeos(prev => toggle(prev, GEO_SLUGS[idx]))} className={`px-3 py-1.5 rounded-lg border-2 font-syne font-semibold text-xs transition-all ${geos.includes(GEO_SLUGS[idx]) ? 'border-[var(--color-text-dark)] bg-[var(--color-text-dark)] text-white' : 'border-gray-200 text-gray-600 hover:border-gray-400'}`}>{label}</button>
              ))}
            </div>
            <p className="font-inter text-xs text-gray-500 uppercase tracking-wide mb-2">Genre</p>
            <div className="flex flex-wrap gap-2 mb-6">
              {GENDERS.map(g => (
                <button key={g.slug} onClick={() => setGender(g.slug)} className={`px-3 py-1.5 rounded-lg border-2 font-syne font-semibold text-xs transition-all ${gender === g.slug ? 'border-[var(--color-text-dark)] bg-[var(--color-text-dark)] text-white' : 'border-gray-200 text-gray-600 hover:border-gray-400'}`}>{g.label}</button>
              ))}
            </div>
            <button onClick={handleSavePreferences} disabled={prefLoading} className="w-full py-3 rounded-xl bg-[var(--color-primary)] text-white font-syne font-bold text-sm disabled:opacity-40 hover:opacity-80 transition-opacity flex items-center justify-center gap-2">
              {prefLoading ? <><Icon icon="mdi:loading" className="animate-spin" /> Sauvegarde…</> : 'Sauvegarder les préférences'}
            </button>
            <SaveFeedback error={prefError} success={prefSuccess} />
          </section>

          <section className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100">
            <SectionTitle>Compte</SectionTitle>
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="font-inter text-sm text-gray-500">Email</span>
              <span className="font-inter text-sm text-gray-800">{user.email}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="font-inter text-sm text-gray-500">Abonnement</span>
              <span className={`font-syne font-semibold text-sm ${user.plan !== 'freemium' ? 'text-[var(--color-text-dark)]' : 'text-gray-600'}`}>{planLabel}</span>
            </div>
            <button onClick={handleLogout} className="mt-4 w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-red-100 text-red-500 font-syne font-semibold text-sm hover:bg-red-50 transition-colors">
              <Icon icon="mdi:logout" className="text-base" /> Se déconnecter
            </button>
          </section>
        </div>
      )}

      {/* ── Tab: Likes ───────────────────────────────────────────────── */}
      {activeTab === 'likes' && (
        <div className="px-4 md:px-8 pt-5 pb-24 md:pb-6">
          {/* Sub-tabs */}
          <div className="flex gap-2 mb-4">
            {(['threads', 'comments'] as const).map(sub => (
              <button
                key={sub}
                onClick={() => setLikesSubTab(sub)}
                className={`px-4 py-2 rounded-full font-syne font-semibold text-sm transition-all ${likesSubTab === sub ? 'bg-[var(--color-text-dark)] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-400'}`}
              >
                {sub === 'threads' ? 'Forums' : 'Commentaires'}
              </button>
            ))}
          </div>

          {likesLoading ? (
            <div className="flex flex-col gap-3">
              {[1, 2, 3].map(i => <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />)}
            </div>
          ) : likesSubTab === 'threads' ? (
            likedThreads.length === 0 ? (
              <div className="text-center py-16">
                <Icon icon="mdi:heart-outline" className="text-5xl text-gray-200 mx-auto mb-3" />
                <p className="font-syne font-bold text-gray-400">Aucun forum liké</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {likedThreads.map(({ thread, liked_at }) => {
                  const trendStatus = thread.trend ? STATUS_CONFIG[thread.trend.status] : null;
                  return (
                    <Link key={thread.id} href={`/community/${thread.id}`} className="block group">
                      <div className="bg-white rounded-2xl px-4 py-4 shadow-[0_1px_4px_rgba(0,0,0,0.06)] hover:shadow-md transition-shadow">
                        {thread.trend && (
                          <div className="flex items-center gap-1.5 mb-1">
                            <Icon icon="mdi:link-variant" className="text-xs text-gray-400" />
                            <span className="font-inter text-xs text-gray-400 truncate">{thread.trend.title}</span>
                            {trendStatus && <span className={`flex-shrink-0 text-xs font-inter font-semibold px-2 py-0.5 rounded-full ${trendStatus.badge}`}>{trendStatus.label}</span>}
                          </div>
                        )}
                        <h3 className="font-syne font-bold text-[var(--color-text-dark)] text-sm leading-snug line-clamp-2">{thread.title}</h3>
                        <p className="font-inter text-xs text-gray-400 mt-1">{thread.author.username ?? 'Utilisateur'} · liké {formatRelative(liked_at)}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )
          ) : (
            likedComments.length === 0 ? (
              <div className="text-center py-16">
                <Icon icon="mdi:heart-outline" className="text-5xl text-gray-200 mx-auto mb-3" />
                <p className="font-syne font-bold text-gray-400">Aucun commentaire liké</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {likedComments.map(({ comment, context_type, context_id, context_title, liked_at }) => (
                  <Link key={comment.id} href={context_type === 'thread' ? `/community/${context_id}` : `/?trendId=${context_id}`} className="block group">
                    <div className="bg-white rounded-2xl px-4 py-4 shadow-[0_1px_4px_rgba(0,0,0,0.06)] hover:shadow-md transition-shadow">
                      <div className="flex items-start gap-2 mb-2">
                        <Icon icon="mdi:heart" className="text-sm text-red-400 mt-0.5 flex-shrink-0" />
                        <p className="font-inter text-sm text-[var(--color-text-dark)] line-clamp-3">{comment.body}</p>
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        <Icon icon={context_type === 'thread' ? 'mdi:forum-outline' : 'mdi:trending-up'} className="text-xs text-gray-400" />
                        <span className="font-inter text-xs text-gray-400 truncate">{context_title}</span>
                        <span className="font-inter text-xs text-gray-300">·</span>
                        <span className="font-inter text-xs text-gray-400">{comment.author.username ?? 'Utilisateur'}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )
          )}
        </div>
      )}

      {/* ── Tab: Collections ─────────────────────────────────────────── */}
      {activeTab === 'collections' && (
        <div className="px-4 md:px-8 pt-5 pb-24 md:pb-6">

          {/* Collection detail drill-in */}
          {collectionDetail ? (
            <>
              <div className="sticky top-0 z-10 bg-[var(--color-background-app)] -mx-4 md:-mx-8 px-4 md:px-8 pb-3 pt-1 flex items-center gap-3 mb-1">
                <button onClick={() => { setCollectionDetail(null); setCollectionItems([]); }} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
                  <Icon icon="mdi:arrow-left" className="text-[var(--color-text-dark)]" />
                </button>
                <span className="text-xl">{collectionDetail.emoji}</span>
                <h2 className="font-syne font-bold text-[var(--color-text-dark)]">{collectionDetail.name}</h2>
              </div>

              {colItemsLoading ? (
                <div className="flex flex-col gap-3">{[1, 2, 3].map(i => <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />)}</div>
              ) : collectionItems.length === 0 ? (
                <div className="text-center py-16">
                  <Icon icon="mdi:bookmark-outline" className="text-5xl text-gray-200 mx-auto mb-3" />
                  <p className="font-syne font-bold text-gray-400">Cette collection est vide</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {collectionItems.map(item => {
                    if (item.thread) {
                      return (
                        <Link key={item.id} href={`/community/${item.thread.id}`} className="block">
                          <div className="bg-white rounded-2xl px-4 py-4 shadow-[0_1px_4px_rgba(0,0,0,0.06)] hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-1.5 mb-1">
                              <Icon icon="mdi:forum-outline" className="text-xs text-gray-400" />
                              <span className="font-inter text-xs text-gray-400">Forum</span>
                            </div>
                            <h3 className="font-syne font-bold text-sm text-[var(--color-text-dark)] line-clamp-2">{item.thread.title}</h3>
                            <p className="font-inter text-xs text-gray-400 mt-1">{item.thread.author.username ?? 'Utilisateur'}</p>
                          </div>
                        </Link>
                      );
                    }
                    if (item.trend_id) {
                      const trendStatus = item.trend_status ? STATUS_CONFIG[item.trend_status] : null;
                      return (
                        <div key={item.id} className="bg-white rounded-2xl px-4 py-4 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
                          <div className="flex items-center gap-2">
                            {item.trend_image && <img src={item.trend_image} alt={item.trend_title ?? ''} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <Icon icon="mdi:trending-up" className="text-xs text-gray-400" />
                                <span className="font-inter text-xs text-gray-400">Trend</span>
                                {trendStatus && <span className={`text-xs font-inter font-semibold px-2 py-0.5 rounded-full ${trendStatus.badge}`}>{trendStatus.label}</span>}
                              </div>
                              <h3 className="font-syne font-bold text-sm text-[var(--color-text-dark)] truncate">{item.trend_title}</h3>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>
              )}
            </>
          ) : (
            <>
              {/* Create collection form */}
              {showCreateCol ? (
                <div className="mb-4 bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                  <p className="font-syne font-bold text-xs text-gray-400 uppercase tracking-wider mb-3">Nouvelle collection</p>
                  <div className="flex gap-2 flex-wrap mb-3">
                    {EMOJI_OPTIONS.map(e => (
                      <button key={e} onClick={() => setNewColEmoji(e)} className={`w-10 h-10 text-xl rounded-xl transition-all ${newColEmoji === e ? 'bg-[var(--color-text-dark)] ring-2 ring-[var(--color-text-dark)]' : 'bg-gray-100 hover:bg-gray-200'}`}>{e}</button>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={newColName}
                    onChange={e => setNewColName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleCreateCollection()}
                    placeholder="Nom de la collection"
                    autoFocus
                    maxLength={100}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 font-inter text-sm focus:outline-none focus:border-[var(--color-text-dark)] transition-colors mb-3"
                  />
                  <div className="flex gap-2">
                    <button onClick={() => { setShowCreateCol(false); setNewColName(''); setNewColEmoji('🔖'); }} className="flex-1 py-2.5 rounded-xl border border-gray-200 font-syne font-semibold text-sm text-gray-600">Annuler</button>
                    <button onClick={handleCreateCollection} disabled={!newColName.trim() || creatingCol} className="flex-1 py-2.5 rounded-xl bg-[var(--color-text-dark)] text-white font-syne font-semibold text-sm disabled:opacity-40 flex items-center justify-center gap-1.5">
                      {creatingCol && <Icon icon="mdi:loading" className="animate-spin text-sm" />} Créer
                    </button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setShowCreateCol(true)} className="w-full mb-4 flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-gray-200 text-gray-500 font-syne font-semibold text-sm hover:border-gray-400 hover:text-gray-700 transition-colors">
                  <Icon icon="mdi:plus" /> Nouvelle collection
                </button>
              )}

              {/* Collections grid */}
              {collectionsLoading ? (
                <div className="grid grid-cols-2 gap-3">{[1, 2, 3, 4].map(i => <div key={i} className="h-28 bg-gray-100 rounded-2xl animate-pulse" />)}</div>
              ) : collections.length === 0 ? (
                <div className="text-center py-12">
                  <Icon icon="mdi:bookmark-outline" className="text-5xl text-gray-200 mx-auto mb-3" />
                  <p className="font-syne font-bold text-gray-400">Aucune collection</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {collections.map(col => (
                    <div key={col.id} className="relative group">
                      <button onClick={() => setCollectionDetail(col)} className="w-full bg-white rounded-2xl p-4 shadow-[0_1px_4px_rgba(0,0,0,0.06)] hover:shadow-md transition-shadow text-left">
                        <span className="text-3xl block mb-2">{col.emoji}</span>
                        <p className="font-syne font-bold text-sm text-[var(--color-text-dark)] truncate">{col.name}</p>
                        <p className="font-inter text-xs text-gray-400 mt-0.5">{col.item_count} item{col.item_count !== 1 ? 's' : ''}</p>
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); setColToDelete(col); }}
                        className="absolute top-2 right-2 w-7 h-7 rounded-full bg-red-50 text-red-400 flex items-center justify-center transition-opacity hover:bg-red-100 md:opacity-0 md:group-hover:opacity-100"
                        aria-label="Supprimer la collection"
                      >
                        <Icon icon="mdi:delete-outline" className="text-sm" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>

      {/* ── Modale confirmation suppression collection ────────────── */}
      {colToDelete && (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => !deletingCol && setColToDelete(null)} />
          <div className="relative bg-white w-full sm:max-w-sm rounded-t-[28px] sm:rounded-[28px] shadow-2xl p-6 z-10">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">{colToDelete.emoji}</span>
              <h3 className="font-syne font-bold text-lg text-[var(--color-text-dark)] leading-tight">
                Supprimer &ldquo;{colToDelete.name}&rdquo; ?
              </h3>
            </div>
            <p className="font-inter text-sm text-gray-500 mb-6">
              Tous les éléments enregistrés dans cette collection seront perdus. Cette action est irréversible.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setColToDelete(null)}
                disabled={deletingCol}
                className="flex-1 py-3 rounded-2xl border-2 border-gray-200 font-syne font-semibold text-sm text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-40"
              >
                Annuler
              </button>
              <button
                onClick={handleDeleteCollection}
                disabled={deletingCol}
                className="flex-1 py-3 rounded-2xl bg-red-500 text-white font-syne font-semibold text-sm hover:bg-red-600 transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {deletingCol
                  ? <><Icon icon="mdi:loading" className="animate-spin" /> Suppression…</>
                  : <><Icon icon="mdi:delete-outline" /> Supprimer</>
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
