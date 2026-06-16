"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Icon } from '@iconify/react';
import Link from 'next/link';
import { STATUS_CONFIG, ApiThreadDetail, apiGetThread, apiToggleThreadLike, apiDeleteThread } from '@/lib/api';
import TrendComments from '@/components/TrendComments';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('augure_token');
}

function getUserIdFromToken(token: string | null): string | null {
  if (!token) return null;
  try {
    return JSON.parse(atob(token.split('.')[1])).sub ?? null;
  } catch {
    return null;
  }
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

function Avatar({ username, avatarUrl }: { username: string | null; avatarUrl?: string | null }) {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={username ?? 'avatar'}
        className="w-9 h-9 rounded-full object-cover flex-shrink-0"
      />
    );
  }
  return (
    <div className="w-9 h-9 rounded-full bg-[var(--color-text-dark)] flex items-center justify-center flex-shrink-0">
      <span className="font-syne font-bold text-sm text-white">
        {username?.[0]?.toUpperCase() ?? '?'}
      </span>
    </div>
  );
}

export default function ThreadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const threadId = params.threadId as string;

  const [thread, setThread] = useState<ApiThreadDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [likeCount, setLikeCount] = useState(0);
  const [liking, setLiking] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { setToken(getToken()); }, []);

  useEffect(() => {
    if (!threadId) return;
    setLoading(true);
    apiGetThread(threadId)
      .then(data => {
        setThread(data);
        setLikeCount(data.like_count);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [threadId]);

  const currentUserId = getUserIdFromToken(token);
  const isOwner = thread && currentUserId && thread.author.id === currentUserId;
  const trendStatus = thread?.trend ? STATUS_CONFIG[thread.trend.status] : null;

  async function handleLike() {
    if (!token || liking || !threadId) return;
    setLiking(true);
    try {
      const res = await apiToggleThreadLike(threadId, token);
      setLikeCount(res.like_count);
    } finally {
      setLiking(false);
    }
  }

  async function handleDelete() {
    if (!token || deleting || !threadId) return;
    if (!confirm('Supprimer ce forum ? Cette action est irréversible.')) return;
    setDeleting(true);
    try {
      await apiDeleteThread(threadId, token);
      router.push('/community');
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <main className="w-full min-h-screen">
        <div className="max-w-2xl mx-auto md:max-w-3xl px-4 md:px-8 py-10 space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/4 animate-pulse" />
          <div className="h-8 bg-gray-200 rounded w-3/4 animate-pulse" />
          <div className="h-4 bg-gray-100 rounded w-1/2 animate-pulse" />
          <div className="space-y-2 pt-4">
            {[1, 2, 3].map(i => <div key={i} className="h-4 bg-gray-100 rounded animate-pulse" />)}
          </div>
        </div>
      </main>
    );
  }

  if (notFound || !thread) {
    return (
      <main className="w-full min-h-screen flex items-center justify-center">
        <div className="text-center px-4">
          <Icon icon="mdi:alert-circle-outline" className="text-5xl text-gray-200 mx-auto mb-3" />
          <p className="font-syne font-bold text-gray-500 mb-4">Forum introuvable</p>
          <Link href="/community" className="font-inter text-sm text-[var(--color-text-dark)] font-semibold hover:underline">
            ← Retour à la communauté
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="w-full min-h-screen">
      <div className="max-w-2xl mx-auto md:max-w-3xl">

        {/* Header dark */}
        <div
          className="bg-[var(--color-text-dark)] relative overflow-hidden px-4 md:px-8 pt-10 pb-8"
          style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(255,255,255,0.025) 1px, rgba(255,255,255,0.025) 2px)' }}
        >
          <Link
            href="/community"
            className="inline-flex items-center gap-1.5 text-white/60 hover:text-white font-inter text-sm mb-5 transition-colors"
          >
            <Icon icon="mdi:arrow-left" className="text-base" />
            Communauté
          </Link>

          {/* Trend liée */}
          {thread.trend && (
            <div className="flex items-center gap-2 mb-3">
              <Icon icon="mdi:link-variant" className="text-white/40 text-sm" />
              <span className="font-inter text-xs text-white/50 truncate">{thread.trend.title}</span>
              {trendStatus && (
                <span className={`flex-shrink-0 text-xs font-inter font-semibold px-2 py-0.5 rounded-full ${trendStatus.badge}`}>
                  {trendStatus.label}
                </span>
              )}
            </div>
          )}

          <h1 className="font-syne font-extrabold text-2xl text-white leading-tight mb-4">
            {thread.title}
          </h1>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Avatar username={thread.author.username} avatarUrl={thread.author.avatar_url} />
              <div>
                <p className="font-syne font-bold text-sm text-white">
                  {thread.author.username ?? 'Utilisateur'}
                </p>
                <p className="font-inter text-xs text-white/40">{formatDate(thread.created_at)}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleLike}
                disabled={!token || liking}
                className="flex items-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors disabled:opacity-40"
              >
                <Icon icon="mdi:heart-outline" className="text-white text-sm" />
                <span className="font-inter text-xs text-white">{likeCount}</span>
              </button>
              {isOwner && (
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="w-9 h-9 flex items-center justify-center bg-white/10 hover:bg-red-500/30 rounded-xl transition-colors disabled:opacity-40"
                >
                  <Icon icon={deleting ? 'mdi:loading' : 'mdi:delete-outline'} className={`text-white text-sm ${deleting ? 'animate-spin' : ''}`} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Corps + commentaires */}
        <div className="px-4 md:px-8 py-6 flex flex-col gap-6 pb-10">

          {/* Corps du forum */}
          <div className="bg-white rounded-2xl px-5 py-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
            <p className="font-inter text-gray-700 text-base leading-relaxed whitespace-pre-wrap">
              {thread.body}
            </p>
          </div>

          <hr className="border-gray-100" />

          {/* Commentaires */}
          <TrendComments threadId={thread.id} isLocked={thread.is_locked} />
        </div>

      </div>
    </main>
  );
}
