"use client";

import { useState, useEffect, useRef } from 'react';
import { Icon } from '@iconify/react';
import Link from 'next/link';
import { STATUS_CONFIG, ApiThread, ApiThreadList, ApiTrend, apiGetThreads, apiCreateThread, apiGetAllTrends } from '@/lib/api';

// ── Helpers ───────────────────────────────────────────────────────────────────

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('augure_token');
}

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 2) return "à l'instant";
  if (mins < 60) return `il y a ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  return days < 7 ? `il y a ${days}j` : new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

function Avatar({ username, size = 8 }: { username: string | null; size?: number }) {
  return (
    <div
      className={`w-${size} h-${size} rounded-full bg-[var(--color-text-dark)] flex items-center justify-center flex-shrink-0`}
    >
      <span className="font-syne font-bold text-xs text-white">
        {username?.[0]?.toUpperCase() ?? '?'}
      </span>
    </div>
  );
}

// ── Thread card ───────────────────────────────────────────────────────────────

function ThreadCard({ thread }: { thread: ApiThread }) {
  const trendStatus = thread.trend ? STATUS_CONFIG[thread.trend.status] : null;

  return (
    <Link href={`/community/${thread.id}`} className="block group">
      <div className="bg-white rounded-2xl px-4 py-4 shadow-[0_1px_4px_rgba(0,0,0,0.06)] hover:shadow-md transition-shadow active:scale-[0.99]">
        {thread.trend && (
          <div className="flex items-center gap-1.5 mb-2">
            <Icon icon="mdi:link-variant" className="text-xs text-gray-400" />
            <span className="font-inter text-xs text-gray-400 truncate">{thread.trend.title}</span>
            {trendStatus && (
              <span className={`flex-shrink-0 text-xs font-inter font-semibold px-2 py-0.5 rounded-full ${trendStatus.badge}`}>
                {trendStatus.label}
              </span>
            )}
          </div>
        )}

        <h3 className="font-syne font-bold text-[var(--color-text-dark)] text-base leading-snug group-hover:opacity-75 transition-opacity line-clamp-2">
          {thread.title}
        </h3>

        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-2">
            <Avatar username={thread.author.username} size={6} />
            <span className="font-inter text-xs text-gray-500">
              {thread.author.username ?? 'Utilisateur'} · {formatRelativeTime(thread.created_at)}
            </span>
          </div>
          <div className="flex items-center gap-3 text-gray-400">
            <span className="flex items-center gap-1 font-inter text-xs">
              <Icon icon="mdi:comment-outline" className="text-sm" />
              {thread.comment_count}
            </span>
            <span className="flex items-center gap-1 font-inter text-xs">
              <Icon icon="mdi:heart-outline" className="text-sm" />
              {thread.like_count}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ── Create thread modal ───────────────────────────────────────────────────────

interface CreateThreadModalProps {
  onClose: () => void;
  onCreated: (thread: ApiThread) => void;
  token: string;
}

function CreateThreadModal({ onClose, onCreated, token }: CreateThreadModalProps) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [trendQuery, setTrendQuery] = useState('');
  const [trendResults, setTrendResults] = useState<ApiTrend[]>([]);
  const [selectedTrend, setSelectedTrend] = useState<ApiTrend | null>(null);
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!trendQuery.trim()) { setTrendResults([]); return; }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const data = await apiGetAllTrends({ q: trendQuery, limit: 5 });
        setTrendResults(data.items);
      } finally {
        setSearching(false);
      }
    }, 350);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [trendQuery]);

  async function handleSubmit() {
    if (!title.trim() || !body.trim()) return;
    setSubmitting(true);
    setError('');
    try {
      const thread = await apiCreateThread(
        { title: title.trim(), body: body.trim(), trend_id: selectedTrend?.id },
        token,
      );
      onCreated(thread);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur lors de la création');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative bg-white w-full md:max-w-lg rounded-t-[32px] md:rounded-[32px] shadow-2xl z-10 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
          <h2 className="font-syne font-bold text-lg text-[var(--color-text-dark)]">Nouveau forum</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
            <Icon icon="mdi:close" className="text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">
          {/* Titre */}
          <div>
            <label className="font-syne font-bold text-xs text-gray-400 uppercase tracking-wider block mb-2">Titre *</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="De quoi voulez-vous parler ?"
              maxLength={300}
              className="w-full font-inter text-sm px-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:border-[var(--color-text-dark)] transition-colors"
            />
          </div>

          {/* Corps */}
          <div>
            <label className="font-syne font-bold text-xs text-gray-400 uppercase tracking-wider block mb-2">Description *</label>
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder="Développez votre sujet…"
              rows={4}
              maxLength={5000}
              className="w-full resize-none font-inter text-sm px-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:border-[var(--color-text-dark)] transition-colors"
            />
          </div>

          {/* Trend liée */}
          <div>
            <label className="font-syne font-bold text-xs text-gray-400 uppercase tracking-wider block mb-2">Trend liée (optionnel)</label>
            {selectedTrend ? (
              <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-2xl border border-gray-200">
                <span className="font-inter text-sm text-[var(--color-text-dark)] flex-1 truncate">{selectedTrend.title}</span>
                <button onClick={() => { setSelectedTrend(null); setTrendQuery(''); }}>
                  <Icon icon="mdi:close" className="text-gray-400 text-sm" />
                </button>
              </div>
            ) : (
              <div className="relative">
                <input
                  type="text"
                  value={trendQuery}
                  onChange={e => setTrendQuery(e.target.value)}
                  placeholder="Rechercher une trend…"
                  className="w-full font-inter text-sm px-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:border-[var(--color-text-dark)] transition-colors"
                />
                {(trendResults.length > 0 || searching) && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-2xl border border-gray-100 shadow-lg z-10 overflow-hidden">
                    {searching ? (
                      <div className="px-4 py-3 font-inter text-sm text-gray-400">Recherche…</div>
                    ) : trendResults.map(t => (
                      <button
                        key={t.id}
                        onClick={() => { setSelectedTrend(t); setTrendQuery(''); setTrendResults([]); }}
                        className="w-full text-left px-4 py-3 font-inter text-sm text-[var(--color-text-dark)] hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0"
                      >
                        {t.title}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {error && <p className="font-inter text-sm text-red-500">{error}</p>}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 pt-4 border-t border-gray-100">
          <button
            onClick={handleSubmit}
            disabled={!title.trim() || !body.trim() || submitting}
            className="w-full bg-[var(--color-text-dark)] text-white font-syne font-bold text-sm py-3.5 rounded-2xl disabled:opacity-40 transition-opacity flex items-center justify-center gap-2"
          >
            {submitting && <Icon icon="mdi:loading" className="animate-spin" />}
            {submitting ? 'Publication…' : 'Publier le forum'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

type Filter = 'all' | 'linked' | 'free';

export default function CommunityPage() {
  const [threads, setThreads] = useState<ApiThread[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('all');
  const [showCreate, setShowCreate] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => { setToken(getToken()); }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    apiGetThreads({ limit: 50 }).then((data: ApiThreadList) => {
      if (!cancelled) {
        setThreads(data.items);
        setTotal(data.total);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, []);

  const filtered = threads.filter(t => {
    if (filter === 'linked') return t.trend !== null;
    if (filter === 'free') return t.trend === null;
    return true;
  });

  const filters: { key: Filter; label: string }[] = [
    { key: 'all', label: 'Tous' },
    { key: 'linked', label: 'Liés à une trend' },
    { key: 'free', label: 'Discussions libres' },
  ];

  return (
    <main className="w-full min-h-screen">
      <div className="max-w-2xl mx-auto md:max-w-full">

        {/* Header */}
        <div
          className="bg-[var(--color-text-dark)] relative overflow-hidden px-4 md:px-8 pt-12 pb-8"
          style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(255,255,255,0.025) 1px, rgba(255,255,255,0.025) 2px)' }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-syne font-extrabold text-2xl text-white">Communauté</h1>
              <p className="font-inter text-sm text-white/50 mt-1">{total} forum{total !== 1 ? 's' : ''}</p>
            </div>
            {token && (
              <button
                onClick={() => setShowCreate(true)}
                className="flex items-center gap-2 bg-white text-[var(--color-text-dark)] font-syne font-bold text-sm px-4 py-2.5 rounded-2xl hover:bg-gray-100 transition-colors"
              >
                <Icon icon="mdi:plus" className="text-base" />
                Nouveau
              </button>
            )}
          </div>
        </div>

        {/* Filtres */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide px-4 md:px-8 py-4">
          {filters.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`flex-shrink-0 px-4 py-2 rounded-full font-syne font-semibold text-sm transition-all ${
                filter === f.key
                  ? 'bg-[var(--color-text-dark)] text-white'
                  : 'bg-white text-[var(--color-text-dark)] border border-gray-200 hover:border-gray-400'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Liste */}
        <section className="px-4 md:px-8 pb-10">
          {loading ? (
            <div className="flex flex-col gap-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="bg-white rounded-2xl p-4 animate-pulse space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <Icon icon="mdi:account-group-outline" className="text-5xl text-gray-200 mx-auto mb-3" />
              <p className="font-syne font-bold text-gray-400">Aucun forum pour l&apos;instant</p>
              {token && (
                <button
                  onClick={() => setShowCreate(true)}
                  className="mt-4 font-inter text-sm text-[var(--color-text-dark)] font-semibold hover:underline"
                >
                  Créer le premier →
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filtered.map(t => <ThreadCard key={t.id} thread={t} />)}
            </div>
          )}
        </section>

        {/* CTA connexion */}
        {!token && !loading && (
          <div className="mx-4 md:mx-8 mb-8 bg-white rounded-2xl px-5 py-5 text-center shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
            <p className="font-inter text-sm text-gray-500">
              <Link href="/login" className="text-[var(--color-text-dark)] font-semibold hover:underline">
                Connectez-vous
              </Link>{' '}
              pour créer un forum et participer aux discussions.
            </p>
          </div>
        )}
      </div>

      {showCreate && token && (
        <CreateThreadModal
          token={token}
          onClose={() => setShowCreate(false)}
          onCreated={thread => setThreads(prev => [thread, ...prev])}
        />
      )}
    </main>
  );
}
