import type { AuditEntry } from './audit';

export interface SavedAudit {
  id: string;
  savedAt: string; // ISO date
  cityId: string;
  label: string;
  entries: AuditEntry[];
  contaminationRate: number;
  contaminantKg: number;
  knownKg: number;
  avoidedKgCO2e: number;
}

export const AUDITS_KEY = 'sortlocal.audits.v1';

export interface KV { getItem(k: string): string | null; setItem(k: string, v: string): void }

function store(): KV | undefined {
  try { return typeof localStorage === 'undefined' ? undefined : localStorage; } catch { return undefined; }
}

export function loadAudits(kv: KV | undefined = store()): SavedAudit[] {
  try {
    const raw = kv?.getItem(AUDITS_KEY);
    const list = raw ? (JSON.parse(raw) as SavedAudit[]) : [];
    return Array.isArray(list) ? list.filter((a) => a && typeof a.contaminationRate === 'number') : [];
  } catch {
    return [];
  }
}

export function saveAudits(list: SavedAudit[], kv: KV | undefined = store()): boolean {
  try { kv?.setItem(AUDITS_KEY, JSON.stringify(list.slice(-50))); return !!kv; } catch { return false; }
}

/** Before/after summary: first vs latest audit for a city (needs ≥2 audits). */
export function trend(list: SavedAudit[], cityId: string) {
  const xs = list.filter((a) => a.cityId === cityId).sort((a, b) => a.savedAt.localeCompare(b.savedAt));
  if (xs.length < 2) return { points: xs, change: undefined as number | undefined };
  return { points: xs, change: xs[xs.length - 1].contaminationRate - xs[0].contaminationRate };
}

export function readPref(key: string): string | null {
  try { return store()?.getItem(key) ?? null; } catch { return null; }
}
export function writePref(key: string, value: string): void {
  try { store()?.setItem(key, value); } catch { /* ignore */ }
}
