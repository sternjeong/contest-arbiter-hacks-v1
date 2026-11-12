import type { Item } from './types';

/** Lowercase, strip accents and punctuation, collapse whitespace, naive singularization per token. */
export function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[“”"'’()]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean)
    .map(singular)
    .join(' ');
}

function singular(t: string): string {
  if (t.length > 4 && t.endsWith('ies')) return t.slice(0, -3) + 'y';
  if (t.length > 4 && /(ches|shes|xes|sses)$/.test(t)) return t.slice(0, -2);
  if (t.length > 3 && t.endsWith('s') && !t.endsWith('ss')) return t.slice(0, -1);
  return t;
}

/** Optimal-string-alignment edit distance (Damerau-Levenshtein with adjacent transpositions). */
export function editDistance(a: string, b: string, max = 3): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  const m = a.length, n = b.length;
  let prev2: number[] = [];
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    let rowMin = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let v = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) v = Math.min(v, prev2[j - 2] + 1);
      cur[j] = v;
      if (v < rowMin) rowMin = v;
    }
    if (rowMin > max) return max + 1;
    prev2 = prev;
    prev = cur;
  }
  return prev[n];
}

const allowedTypos = (len: number) => (len <= 3 ? 0 : len <= 5 ? 1 : 2);

/** Score how well one query token matches one term token (0..1). */
function tokenScore(q: string, t: string): number {
  if (q === t) return 1;
  if (t.startsWith(q) && q.length >= 2) return 0.85 * (q.length / t.length) + 0.1;
  const d = editDistance(q, t, 2);
  if (d <= allowedTypos(Math.min(q.length, t.length))) return 0.75 - d * 0.1;
  return 0;
}

/** Score a query against one name/synonym (0..100). */
function termScore(qNorm: string, qTokens: string[], term: string): number {
  const tNorm = normalize(term);
  if (!tNorm) return 0;
  if (tNorm === qNorm) return 100;
  if (tNorm.startsWith(qNorm)) return 90;
  const tTokens = tNorm.split(' ');
  let sum = 0;
  for (const q of qTokens) {
    let best = 0;
    for (const t of tTokens) best = Math.max(best, tokenScore(q, t));
    if (best === 0) return 0; // every query token must match something
    sum += best;
  }
  const coverage = qTokens.length / tTokens.length; // prefer tight matches
  return Math.round((sum / qTokens.length) * 70 + Math.min(coverage, 1) * 15);
}

export interface SearchHit {
  item: Item;
  score: number;
  /** The name or synonym that matched best. */
  matched: string;
}

/** Deterministic fuzzy search over item names + synonyms. Ties break by name. */
export function searchItems(items: Item[], query: string, limit = 8): SearchHit[] {
  const qNorm = normalize(query);
  if (!qNorm) return [];
  const qTokens = qNorm.split(' ');
  const hits: SearchHit[] = [];
  for (const item of items) {
    let best = 0;
    let matched = item.name;
    for (const term of [item.name, ...item.synonyms]) {
      const s = termScore(qNorm, qTokens, term) + (term === item.name ? 1 : 0);
      if (s > best) { best = s; matched = term; }
    }
    if (best >= 45) hits.push({ item, score: best, matched });
  }
  hits.sort((a, b) => b.score - a.score || a.item.name.localeCompare(b.item.name));
  return hits.slice(0, limit);
}
