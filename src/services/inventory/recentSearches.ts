import { RECENT_SEARCHES_KEY } from '@/services/inventory/constants';

const MAX = 8;

export function loadRecentSearches(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_SEARCHES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as string[]).filter((s) => typeof s === 'string') : [];
  } catch {
    return [];
  }
}

export function pushRecentSearch(query: string): void {
  const q = query.trim();
  if (!q) return;
  const prev = loadRecentSearches();
  const next = [q, ...prev.filter((x) => x.toLowerCase() !== q.toLowerCase())].slice(0, MAX);
  localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
}
