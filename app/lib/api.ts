const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api/v1';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ApiTrend {
  id: string;
  title: string;
  description: string;
  context: string;
  usage_example: string;
  usage_keys: string[] | null;
  status: string; // "viral" | "en_hausse" | "emergent" | "stable" | "en_baisse"
  category: string | null;
  region: string | null;
  age_range: string | null;
  image_url: string | null;
  platforms: string[] | null;
  badges: string[] | null;
  extra_stats: { label: string; value: string }[] | null;
  rank: number | null;
  score_base: number;
  tags: { tag_type: string; value: string }[];
  affinity_score?: number;
  created_at: string;
}

/** @deprecated use ApiTrend */
export type ScoredTrend = ApiTrend;

export const STATUS_CONFIG: Record<string, { label: string; icon: string; color: string; badge: string }> = {
  viral:     { label: 'Viral',     icon: 'mdi:fire',             color: 'text-white', badge: 'badge-status badge-status-viral'     },
  en_hausse: { label: 'En hausse', icon: 'mdi:arrow-up-bold',    color: 'text-white', badge: 'badge-status badge-status-en_hausse' },
  emergent:  { label: 'Émergent',  icon: 'mdi:trending-up',      color: 'text-white', badge: 'badge-status badge-status-emergent'  },
  stable:    { label: 'Stable',    icon: 'mdi:arrow-right-bold', color: 'text-white', badge: 'badge-status badge-status-stable'    },
  en_baisse: { label: 'En baisse', icon: 'mdi:arrow-down-bold',  color: 'text-white', badge: 'badge-status badge-status-en_baisse' },
};

// ── User profile ──────────────────────────────────────────────────────────────

export interface ApiUser {
  id: string;
  email: string;
  username: string | null;
  avatar_url: string | null;
  plan: string;
  role: string | null;
  target_ages: string[] | null;
  target_networks: string[] | null;
  target_geography: string[] | null;
  target_gender: string | null;
  interests: { id: number; name: string; slug: string }[];
}

export async function apiGetMe(token: string): Promise<ApiUser> {
  const res = await fetch(`${API_BASE}/user/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Impossible de récupérer le profil');
  return res.json();
}

export async function apiUpdateProfile(token: string, username: string): Promise<ApiUser> {
  const res = await fetch(`${API_BASE}/user/profile`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ username }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(typeof data.detail === 'string' ? data.detail : 'Erreur lors de la mise à jour');
  }
  return res.json();
}

export async function apiUpdatePreferences(
  token: string,
  payload: {
    role: string;
    target_ages: string[];
    target_networks: string[];
    target_geography: string[];
    target_gender: string;
    interest_slugs: string[];
  },
): Promise<ApiUser> {
  const res = await fetch(`${API_BASE}/user/preferences`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(typeof data.detail === 'string' ? data.detail : 'Erreur lors de la mise à jour');
  }
  return res.json();
}

export async function apiUploadAvatar(token: string, file: File): Promise<{ avatar_url: string }> {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${API_BASE}/user/avatar`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(typeof data.detail === 'string' ? data.detail : "Erreur lors de l'upload");
  }
  return res.json();
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export async function apiRegister(email: string, password: string, username?: string) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, username }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(typeof data.detail === 'string' ? data.detail : `Erreur ${res.status}`);
  }
  return res.json() as Promise<{ id: string; email: string; created_at: string }>;
}

export async function apiLogin(email: string, password: string): Promise<{ access_token: string; token_type: string }> {
  const body = new URLSearchParams({ username: email, password });
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(typeof data.detail === 'string' ? data.detail : 'Connexion échouée');
  }
  return res.json();
}

export async function apiSaveOnboarding(
  token: string,
  payload: {
    role: string;
    target_ages: string[];
    target_networks?: string[];
    target_geography?: string[];
    target_gender?: string;
    interest_slugs: string[];
  },
) {
  const res = await fetch(`${API_BASE}/user/onboarding`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(typeof data.detail === 'string' ? data.detail : 'Erreur lors de la configuration');
  }
  return res.json();
}

export async function apiSavePlan(token: string, plan: 'standard' | 'pro'): Promise<void> {
  await fetch(`${API_BASE}/user/plan`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ plan }),
  });
}

// ── Trends ────────────────────────────────────────────────────────────────────

export async function apiGetAllTrends(params?: {
  category?: string;
  q?: string;
  limit?: number;
  skip?: number;
}): Promise<{ total: number; items: ApiTrend[] }> {
  const url = new URL(`${API_BASE}/trends/list`);
  if (params?.category) url.searchParams.set('category', params.category);
  if (params?.q) url.searchParams.set('q', params.q);
  if (params?.limit != null) url.searchParams.set('limit', String(params.limit));
  if (params?.skip != null) url.searchParams.set('skip', String(params.skip));

  const res = await fetch(url.toString());
  if (!res.ok) return { total: 0, items: [] };
  return res.json();
}

export async function apiGetRecommendedTrends(token: string, limit = 20): Promise<ApiTrend[]> {
  const res = await fetch(`${API_BASE}/trends/recommend?limit=${limit}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return (data.items ?? []) as ApiTrend[];
}

export async function apiGetTrendById(id: string, token: string): Promise<ApiTrend> {
  const res = await fetch(`${API_BASE}/trends/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Trend not found: ${id}`);
  return res.json();
}

// ── Community types ───────────────────────────────────────────────────────────

export interface ApiCommentAuthor {
  id: string;
  username: string | null;
  avatar_url: string | null;
}

export interface ApiComment {
  id: string;
  author: ApiCommentAuthor;
  body: string;
  like_count: number;
  is_deleted: boolean;
  parent_comment_id: string | null;
  created_at: string;
  updated_at: string;
  replies: ApiComment[];
}

export interface ApiCommentList {
  total: number;
  items: ApiComment[];
  skip: number;
  limit: number;
}

export interface ApiThreadTrend {
  id: string;
  title: string;
  image_url: string | null;
  status: string;
}

export interface ApiThread {
  id: string;
  author: ApiCommentAuthor;
  trend: ApiThreadTrend | null;
  title: string;
  body: string;
  is_pinned: boolean;
  is_locked: boolean;
  comment_count: number;
  like_count: number;
  created_at: string;
  updated_at: string;
}

export interface ApiThreadDetail extends ApiThread {
  comments: ApiComment[];
}

export interface ApiThreadList {
  total: number;
  items: ApiThread[];
  skip: number;
  limit: number;
}

// ── Comments ──────────────────────────────────────────────────────────────────

export async function apiGetTrendComments(
  trendId: string,
  params?: { skip?: number; limit?: number },
): Promise<ApiCommentList> {
  const url = new URL(`${API_BASE}/trends/${trendId}/comments`);
  if (params?.skip != null) url.searchParams.set('skip', String(params.skip));
  if (params?.limit != null) url.searchParams.set('limit', String(params.limit));
  const res = await fetch(url.toString());
  if (!res.ok) return { total: 0, items: [], skip: 0, limit: 20 };
  return res.json();
}

export async function apiPostTrendComment(
  trendId: string,
  payload: { body: string; parent_comment_id?: string },
  token: string,
): Promise<ApiComment> {
  const res = await fetch(`${API_BASE}/trends/${trendId}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(typeof data.detail === 'string' ? data.detail : 'Erreur lors de la publication');
  }
  return res.json();
}

export async function apiToggleCommentLike(
  commentId: string,
  token: string,
): Promise<{ liked: boolean; like_count: number }> {
  const res = await fetch(`${API_BASE}/comments/${commentId}/like`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Erreur like');
  return res.json();
}

export async function apiDeleteComment(commentId: string, token: string): Promise<void> {
  await fetch(`${API_BASE}/comments/${commentId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
}

// ── Community / Threads ───────────────────────────────────────────────────────

export async function apiGetThreads(params?: {
  trend_id?: string;
  skip?: number;
  limit?: number;
}): Promise<ApiThreadList> {
  const url = new URL(`${API_BASE}/community/threads`);
  if (params?.trend_id) url.searchParams.set('trend_id', params.trend_id);
  if (params?.skip != null) url.searchParams.set('skip', String(params.skip));
  if (params?.limit != null) url.searchParams.set('limit', String(params.limit));
  const res = await fetch(url.toString());
  if (!res.ok) return { total: 0, items: [], skip: 0, limit: 20 };
  return res.json();
}

export async function apiCreateThread(
  payload: { title: string; body: string; trend_id?: string },
  token: string,
): Promise<ApiThread> {
  const res = await fetch(`${API_BASE}/community/threads`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(typeof data.detail === 'string' ? data.detail : 'Erreur lors de la création');
  }
  return res.json();
}

export async function apiGetThread(threadId: string): Promise<ApiThreadDetail> {
  const res = await fetch(`${API_BASE}/community/threads/${threadId}`);
  if (!res.ok) throw new Error('Thread introuvable');
  return res.json();
}

export async function apiPostThreadComment(
  threadId: string,
  payload: { body: string; parent_comment_id?: string },
  token: string,
): Promise<ApiComment> {
  const res = await fetch(`${API_BASE}/community/threads/${threadId}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(typeof data.detail === 'string' ? data.detail : 'Erreur lors de la publication');
  }
  return res.json();
}

export async function apiToggleThreadLike(
  threadId: string,
  token: string,
): Promise<{ liked: boolean; like_count: number }> {
  const res = await fetch(`${API_BASE}/community/threads/${threadId}/like`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Erreur like');
  return res.json();
}

export async function apiDeleteThread(threadId: string, token: string): Promise<void> {
  await fetch(`${API_BASE}/community/threads/${threadId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
}

// ── Favorites ─────────────────────────────────────────────────────────────────

export interface ApiFavoriteCollection {
  id: string;
  name: string;
  emoji: string;
  item_count: number;
  created_at: string;
}

export interface ApiFavThreadSnippet {
  id: string;
  title: string;
  body: string;
  author: ApiCommentAuthor;
  trend: ApiThreadTrend | null;
  created_at: string;
}

export interface ApiFavoriteItem {
  id: string;
  collection_id: string;
  added_at: string;
  thread: ApiFavThreadSnippet | null;
  trend_id: string | null;
  trend_title: string | null;
  trend_image: string | null;
  trend_status: string | null;
}

export interface ApiLikedThread {
  thread: ApiThread;
  liked_at: string;
}

export interface ApiLikedComment {
  comment: ApiComment;
  context_type: 'thread' | 'trend';
  context_id: string;
  context_title: string;
  liked_at: string;
}

export async function apiGetMyLikedThreads(token: string): Promise<ApiLikedThread[]> {
  const res = await fetch(`${API_BASE}/user/likes/threads`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return [];
  return res.json();
}

export async function apiGetMyLikedComments(token: string): Promise<ApiLikedComment[]> {
  const res = await fetch(`${API_BASE}/user/likes/comments`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return [];
  return res.json();
}

export async function apiGetMyCollections(token: string): Promise<ApiFavoriteCollection[]> {
  const res = await fetch(`${API_BASE}/user/favorites`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return [];
  return res.json();
}

export async function apiCreateCollection(token: string, body: { name: string; emoji: string }): Promise<ApiFavoriteCollection> {
  const res = await fetch(`${API_BASE}/user/favorites`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(typeof data.detail === 'string' ? data.detail : 'Erreur création collection');
  }
  return res.json();
}

export async function apiDeleteCollection(token: string, id: string): Promise<void> {
  await fetch(`${API_BASE}/user/favorites/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function apiGetCollectionItems(token: string, id: string): Promise<ApiFavoriteItem[]> {
  const res = await fetch(`${API_BASE}/user/favorites/${id}/items`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return [];
  return res.json();
}

export async function apiAddToCollection(
  token: string,
  collectionId: string,
  params: { thread_id?: string; trend_id?: string },
): Promise<ApiFavoriteItem> {
  const url = new URL(`${API_BASE}/user/favorites/${collectionId}/items`);
  if (params.thread_id) url.searchParams.set('thread_id', params.thread_id);
  if (params.trend_id) url.searchParams.set('trend_id', params.trend_id);
  const res = await fetch(url.toString(), {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(typeof data.detail === 'string' ? data.detail : 'Erreur ajout favori');
  }
  return res.json();
}

export async function apiRemoveFromCollection(
  token: string,
  collectionId: string,
  params: { thread_id?: string; trend_id?: string },
): Promise<void> {
  const url = new URL(`${API_BASE}/user/favorites/${collectionId}/items`);
  if (params.thread_id) url.searchParams.set('thread_id', params.thread_id);
  if (params.trend_id) url.searchParams.set('trend_id', params.trend_id);
  await fetch(url.toString(), {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function apiCheckCollections(
  token: string,
  params: { thread_id?: string; trend_id?: string },
): Promise<{ collection_ids: string[] }> {
  const url = new URL(`${API_BASE}/user/favorites/check`);
  if (params.thread_id) url.searchParams.set('thread_id', params.thread_id);
  if (params.trend_id) url.searchParams.set('trend_id', params.trend_id);
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return { collection_ids: [] };
  return res.json();
}
