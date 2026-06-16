"use client";

import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import Link from 'next/link';
import type { ApiComment } from '@/lib/api';
import {
  apiGetTrendComments,
  apiPostTrendComment,
  apiGetThread,
  apiPostThreadComment,
  apiToggleCommentLike,
} from '@/lib/api';

const LIMIT = 20;

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

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 2) return "à l'instant";
  if (mins < 60) return `il y a ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `il y a ${days}j`;
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

function Avatar({ username, avatarUrl }: { username: string | null; avatarUrl?: string | null }) {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={username ?? 'avatar'}
        className="w-8 h-8 rounded-full object-cover flex-shrink-0"
      />
    );
  }
  return (
    <div className="w-8 h-8 rounded-full bg-[var(--color-text-dark)] flex items-center justify-center flex-shrink-0">
      <span className="font-syne font-bold text-xs text-white">
        {username?.[0]?.toUpperCase() ?? '?'}
      </span>
    </div>
  );
}

interface CommentItemProps {
  comment: ApiComment;
  token: string | null;
  currentUserId: string | null;
  onReply: (id: string, username: string) => void;
  onLikeUpdate: (id: string, likeCount: number) => void;
  isReply?: boolean;
}

function CommentItem({ comment, token, currentUserId: _currentUserId, onReply, onLikeUpdate, isReply = false }: CommentItemProps) {
  const [likeCount, setLikeCount] = useState(comment.like_count);
  const [liking, setLiking] = useState(false);

  async function handleLike() {
    if (!token || liking) return;
    setLiking(true);
    try {
      const res = await apiToggleCommentLike(comment.id, token);
      setLikeCount(res.like_count);
      onLikeUpdate(comment.id, res.like_count);
    } finally {
      setLiking(false);
    }
  }

  return (
    <div className={`flex gap-3 ${isReply ? 'ml-10' : ''}`}>
      <Avatar username={comment.author.username} avatarUrl={comment.author.avatar_url} />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="font-syne font-bold text-sm text-[var(--color-text-dark)]">
            {comment.author.username ?? 'Utilisateur'}
          </span>
          <span className="font-inter text-xs text-gray-400">
            {formatRelativeTime(comment.created_at)}
          </span>
        </div>
        <p className={`font-inter text-sm mt-1 leading-relaxed ${comment.is_deleted ? 'text-gray-400 italic' : 'text-gray-700'}`}>
          {comment.body}
        </p>
        {!comment.is_deleted && (
          <div className="flex items-center gap-4 mt-2">
            <button
              onClick={handleLike}
              disabled={!token || liking}
              className="flex items-center gap-1 text-gray-400 hover:text-rose-500 transition-colors disabled:opacity-40"
            >
              <Icon icon="mdi:heart-outline" className="text-sm" />
              <span className="font-inter text-xs">{likeCount}</span>
            </button>
            {!isReply && token && (
              <button
                onClick={() => onReply(comment.id, comment.author.username ?? 'Utilisateur')}
                className="flex items-center gap-1 text-gray-400 hover:text-[var(--color-text-dark)] transition-colors"
              >
                <Icon icon="mdi:reply-outline" className="text-sm" />
                <span className="font-inter text-xs">Répondre</span>
              </button>
            )}
          </div>
        )}
        {comment.replies?.map(reply => (
          <div key={reply.id} className="mt-3">
            <CommentItem
              comment={reply}
              token={token}
              currentUserId={_currentUserId}
              onReply={onReply}
              onLikeUpdate={onLikeUpdate}
              isReply
            />
          </div>
        ))}
      </div>
    </div>
  );
}

interface TrendCommentsProps {
  trendId?: string;
  threadId?: string;
  isLocked?: boolean;
}

export default function TrendComments({ trendId, threadId, isLocked = false }: TrendCommentsProps) {
  const [comments, setComments] = useState<ApiComment[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [skip, setSkip] = useState(0);
  const [token, setToken] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState(false);
  const [body, setBody] = useState('');
  const [replyTo, setReplyTo] = useState<{ id: string; username: string } | null>(null);
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    setToken(getToken());
  }, []);

  const currentUserId = getUserIdFromToken(token);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setComments([]);
    setTotal(0);
    setSkip(0);
    setFetchError(false);

    async function load() {
      try {
        if (trendId) {
          const data = await apiGetTrendComments(trendId, { skip: 0, limit: LIMIT });
          if (!cancelled) {
            setComments(data.items);
            setTotal(data.total);
            setSkip(data.items.length);
          }
        } else if (threadId) {
          const thread = await apiGetThread(threadId);
          if (!cancelled) {
            setComments(thread.comments);
            setTotal(thread.comment_count);
            setSkip(thread.comments.length);
          }
        }
      } catch {
        if (!cancelled) setFetchError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [trendId, threadId]);

  async function handleLoadMore() {
    if (loadingMore || !trendId) return;
    setLoadingMore(true);
    try {
      const data = await apiGetTrendComments(trendId, { skip, limit: LIMIT });
      setComments(prev => [...prev, ...data.items]);
      setSkip(s => s + data.items.length);
      setTotal(data.total);
    } finally {
      setLoadingMore(false);
    }
  }

  async function handlePost() {
    if (!body.trim() || !token || posting) return;
    setPosting(true);
    try {
      const payload = { body: body.trim(), parent_comment_id: replyTo?.id };
      let newComment: ApiComment;
      if (trendId) {
        newComment = await apiPostTrendComment(trendId, payload, token);
      } else if (threadId) {
        newComment = await apiPostThreadComment(threadId, payload, token);
      } else return;

      if (replyTo) {
        setComments(prev =>
          prev.map(c =>
            c.id === replyTo.id ? { ...c, replies: [...(c.replies ?? []), newComment] } : c
          )
        );
      } else {
        setComments(prev => [newComment, ...prev]);
        setTotal(t => t + 1);
      }
      setBody('');
      setReplyTo(null);
    } finally {
      setPosting(false);
    }
  }

  function handleReplyStart(id: string, username: string) {
    setReplyTo({ id, username });
    setBody('');
  }

  function handleLikeUpdate(commentId: string, likeCount: number) {
    setComments(prev =>
      prev.map(c =>
        c.id === commentId
          ? { ...c, like_count: likeCount }
          : { ...c, replies: (c.replies ?? []).map(r => r.id === commentId ? { ...r, like_count: likeCount } : r) }
      )
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-2">
        <h3 className="font-syne font-bold text-base text-[var(--color-text-dark)]">Commentaires</h3>
        {total > 0 && (
          <span className="font-inter text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{total}</span>
        )}
      </div>

      {/* Input */}
      {!isLocked && token ? (
        <div className="flex flex-col gap-2">
          {replyTo && (
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-xl">
              <Icon icon="mdi:reply" className="text-gray-400 text-sm flex-shrink-0" />
              <span className="font-inter text-xs text-gray-500 flex-1">
                Réponse à <strong>{replyTo.username}</strong>
              </span>
              <button onClick={() => { setReplyTo(null); setBody(''); }}>
                <Icon icon="mdi:close" className="text-gray-400 text-sm" />
              </button>
            </div>
          )}
          <div className="flex gap-2 items-end">
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder={replyTo ? `Répondre à @${replyTo.username}…` : 'Ajouter un commentaire…'}
              rows={2}
              className="flex-1 resize-none font-inter text-sm px-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:border-[var(--color-text-dark)] bg-white placeholder-gray-400 transition-colors"
              onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handlePost(); }}
            />
            <button
              onClick={handlePost}
              disabled={!body.trim() || posting}
              className="w-10 h-10 bg-[var(--color-text-dark)] text-white rounded-2xl flex items-center justify-center flex-shrink-0 disabled:opacity-30 transition-opacity"
            >
              <Icon icon={posting ? 'mdi:loading' : 'mdi:send'} className={`text-sm ${posting ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      ) : !token ? (
        <div className="bg-gray-50 rounded-2xl px-4 py-4 text-center border border-gray-100">
          <p className="font-inter text-sm text-gray-500">
            <Link href="/login" className="text-[var(--color-text-dark)] font-semibold hover:underline">
              Connectez-vous
            </Link>{' '}
            pour commenter
          </p>
        </div>
      ) : isLocked ? (
        <div className="bg-gray-50 rounded-2xl px-4 py-3 text-center border border-gray-100">
          <p className="font-inter text-sm text-gray-400">Ce fil est fermé aux nouveaux commentaires.</p>
        </div>
      ) : null}

      {/* List */}
      {fetchError ? (
        <div className="bg-red-50 rounded-2xl px-4 py-4 text-center border border-red-100">
          <p className="font-inter text-sm text-red-400">
            Impossible de charger les commentaires. Vérifiez que le serveur est démarré.
          </p>
        </div>
      ) : loading ? (
        <div className="flex flex-col gap-5">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0" />
              <div className="flex-1 space-y-2 pt-1">
                <div className="h-3 bg-gray-200 rounded w-1/3" />
                <div className="h-3 bg-gray-200 rounded w-full" />
                <div className="h-3 bg-gray-200 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <p className="font-inter text-sm text-gray-400 text-center py-6">
          Aucun commentaire pour l&apos;instant. Soyez le premier !
        </p>
      ) : (
        <div className="flex flex-col gap-5">
          {comments.map(comment => (
            <CommentItem
              key={comment.id}
              comment={comment}
              token={token}
              currentUserId={currentUserId}
              onReply={handleReplyStart}
              onLikeUpdate={handleLikeUpdate}
            />
          ))}
          {comments.length < total && (
            <button
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="font-inter text-sm text-gray-400 hover:text-[var(--color-text-dark)] text-center py-2 transition-colors"
            >
              {loadingMore ? 'Chargement…' : `Voir plus (${total - comments.length})`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
