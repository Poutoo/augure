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

export const STATUS_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  viral:     { label: 'Viral',     icon: 'mdi:fire',             color: 'text-[var(--color-text-dark)]' },
  en_hausse: { label: 'En hausse', icon: 'mdi:arrow-up-bold',    color: 'text-[var(--color-text-dark)]' },
  emergent:  { label: 'Émergent',  icon: 'mdi:trending-up',      color: 'text-[var(--color-text-dark)]' },
  stable:    { label: 'Stable',    icon: 'mdi:arrow-right-bold', color: 'text-gray-500' },
  en_baisse: { label: 'En baisse', icon: 'mdi:arrow-down-bold',  color: 'text-gray-500' },
};

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
