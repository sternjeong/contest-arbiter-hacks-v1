import type { Engine } from './resolve';
import { resolve } from './resolve';
import type { Bin, Citation, Material } from './types';

export interface AuditEntry {
  itemId: string;
  /** Number of pieces. Used with the item's default unit mass when weightKg is absent. */
  count?: number;
  /** Measured weight in kg (overrides count × unit mass). */
  weightKg?: number;
  dirty?: boolean;
  /** Put in the bin inside a plastic bag. */
  bagged?: boolean;
}

export interface WarmFactor { label: string; recycling: number | null; landfill: number; compost: number | null; source: string; exhibit: string; note?: string }
export type WarmFactors = Partial<Record<Material, WarmFactor>>;

export type Reason = 'wrong-bin' | 'dirty' | 'bagged';
export type Severity = 'critical' | 'high' | 'medium';

export interface AuditLine {
  entry: AuditEntry;
  itemName: string;
  massKg: number;
  status: 'accepted' | 'contaminant' | 'unknown';
  reason?: Reason;
  /** Where it should go instead (for wrong-bin contaminants). */
  belongs?: Bin;
  belongsLabel?: string;
  severity?: Severity;
  citation?: Citation;
}

export interface Fix {
  itemId: string;
  itemName: string;
  count?: number;
  massKg: number;
  severity: Severity;
  reason: Reason;
  action: string;
  why: string;
  citation?: Citation;
  /** Extra kg CO2e avoided if this fix is made (estimate; 0 when WARM has no factor). */
  potentialKgCO2e: number;
}

export interface AuditResult {
  cityId: string;
  totalKg: number;
  knownKg: number;
  acceptedKg: number;
  contaminantKg: number;
  unknownKg: number;
  /** contaminantKg / knownKg, 0..1. Items without an official rule are excluded. */
  contaminationRate: number;
  /** Estimated kg CO2e avoided by recycling the accepted material instead of landfilling it. */
  avoidedKgCO2e: number;
  /** Estimated additional kg CO2e if every fix were made. */
  potentialKgCO2e: number;
  /** Accepted mass with no WARM recycling factor (excluded from avoided emissions). */
  unfactoredKg: number;
  lines: AuditLine[];
  fixes: Fix[];
}

export const SHORT_TON_KG = 907.18474;

/** Items that wrap around sorting-equipment shafts ("tanglers"). */
const TANGLERS = new Set(['plastic-bag', 'plastic-film', 'zip-bag', 'bubble-wrap', 'plastic-mailer', 'garden-hose', 'cables', 'wire-hanger', 'six-pack-rings', 'stand-up-pouch']);

export function entryMassKg(engine: Engine, e: AuditEntry): number {
  if (e.weightKg !== undefined && e.weightKg > 0) return e.weightKg;
  const item = engine.itemById.get(e.itemId);
  if (!item || !e.count || e.count <= 0) return 0;
  return (e.count * item.unitMassG) / 1000;
}

/** kg CO2e avoided by sending `massKg` to `to` instead of landfill (positive = avoided). */
export function avoidedVsLandfill(factors: WarmFactors, material: Material, to: 'recycling' | 'compost', massKg: number): number {
  const f = factors[material];
  const path = f?.[to];
  if (!f || path === null || path === undefined) return 0;
  return (f.landfill - path) * 1000 * (massKg / SHORT_TON_KG);
}

const SEVERITY_WEIGHT: Record<Severity, number> = { critical: 1000, high: 10, medium: 1 };

export function computeAudit(engine: Engine, factors: WarmFactors, cityId: string, entries: AuditEntry[]): AuditResult {
  const rs = engine.cityById.get(cityId);
  if (!rs) throw new Error(`Unknown city ${cityId}`);
  const requiresLoose = rs.general.some((g) => g.id === 'loose');
  const looseRule = rs.general.find((g) => g.id === 'loose');
  const cleanRule = rs.general.find((g) => g.id === 'clean');

  const lines: AuditLine[] = [];
  for (const entry of entries) {
    const item = engine.itemById.get(entry.itemId);
    const massKg = entryMassKg(engine, entry);
    if (!item || massKg <= 0) continue;
    const ans = resolve(engine, cityId, entry.itemId, { dirty: entry.dirty });
    if (!ans) { lines.push({ entry, itemName: item.name, massKg, status: 'unknown' }); continue; }
    const conds = ans.rule.conditions ?? [];
    let line: AuditLine;
    if (ans.bin !== 'recycling') {
      line = { entry, itemName: item.name, massKg, status: 'contaminant', reason: 'wrong-bin', belongs: ans.bin, belongsLabel: ans.binLabel,
        citation: ans.appliedVariant?.citation ?? ans.rule.citation };
    } else if (entry.dirty && (conds.includes('clean') || conds.includes('empty') || conds.includes('dry') || cleanRule)) {
      line = { entry, itemName: item.name, massKg, status: 'contaminant', reason: 'dirty', belongs: 'recycling', belongsLabel: rs.bins.recycling.label,
        citation: cleanRule?.citation ?? ans.rule.citation };
    } else if (entry.bagged && requiresLoose) {
      line = { entry, itemName: item.name, massKg, status: 'contaminant', reason: 'bagged', belongs: 'recycling', belongsLabel: rs.bins.recycling.label,
        citation: looseRule?.citation };
    } else {
      line = { entry, itemName: item.name, massKg, status: 'accepted', citation: ans.rule.citation };
    }
    if (line.status === 'contaminant') {
      line.severity = item.category === 'Hazardous' && ans.bin === 'special' ? 'critical'
        : TANGLERS.has(item.id) || line.reason === 'bagged' ? 'high'
        : line.reason === 'dirty' || item.category === 'Organics' || item.category === 'Hygiene' ? 'high'
        : 'medium';
    }
    lines.push(line);
  }

  const sum = (xs: AuditLine[]) => xs.reduce((a, l) => a + l.massKg, 0);
  const accepted = lines.filter((l) => l.status === 'accepted');
  const contaminants = lines.filter((l) => l.status === 'contaminant');
  const unknown = lines.filter((l) => l.status === 'unknown');
  const acceptedKg = sum(accepted), contaminantKg = sum(contaminants), unknownKg = sum(unknown);
  const knownKg = acceptedKg + contaminantKg;

  let avoided = 0, unfactoredKg = 0;
  for (const l of accepted) {
    const mat = engine.itemById.get(l.entry.itemId)!.material;
    const a = avoidedVsLandfill(factors, mat, 'recycling', l.massKg);
    if (factors[mat]?.recycling == null) unfactoredKg += l.massKg;
    avoided += a;
  }

  // Group contaminants per item+reason into fixes.
  const groups = new Map<string, AuditLine[]>();
  for (const l of contaminants) {
    const k = `${l.entry.itemId}|${l.reason}`;
    groups.set(k, [...(groups.get(k) ?? []), l]);
  }
  const fixes: Fix[] = [];
  for (const ls of groups.values()) {
    const l0 = ls[0];
    const item = engine.itemById.get(l0.entry.itemId)!;
    const massKg = sum(ls);
    const count = ls.every((l) => l.entry.weightKg === undefined) ? ls.reduce((a, l) => a + (l.entry.count ?? 0), 0) : undefined;
    const n = count ? `${count} × ` : '';
    let action: string, why: string, potential = 0;
    if (l0.reason === 'wrong-bin') {
      action = `Move ${n}${item.name} → ${l0.belongsLabel}`;
      why = l0.severity === 'critical' ? 'Fire or safety hazard at the sorting facility.'
        : TANGLERS.has(item.id) ? 'Wraps around sorting machinery and stops the line.'
        : `Not accepted in ${rs.city.name} recycling.`;
      if (l0.belongs === 'compost') potential = avoidedVsLandfill(factors, item.material, 'compost', massKg);
    } else if (l0.reason === 'dirty') {
      action = `Empty and rinse ${n}${item.name} before recycling`;
      why = 'Food and liquid soak into paper and spoil whole bales.';
      potential = avoidedVsLandfill(factors, item.material, 'recycling', massKg);
    } else {
      action = `Take ${n}${item.name} out of the plastic bag (recyclables go in loose)`;
      why = 'Bagged recyclables are treated as trash and the bag jams machinery.';
      potential = avoidedVsLandfill(factors, item.material, 'recycling', massKg);
    }
    fixes.push({ itemId: item.id, itemName: item.name, count, massKg, severity: l0.severity!, reason: l0.reason!, action, why, citation: l0.citation, potentialKgCO2e: potential });
  }
  const share = (kg: number) => (contaminantKg > 0 ? kg / contaminantKg : 0);
  fixes.sort((a, b) => SEVERITY_WEIGHT[b.severity] * (1 + share(b.massKg)) - SEVERITY_WEIGHT[a.severity] * (1 + share(a.massKg)) || b.massKg - a.massKg || a.itemName.localeCompare(b.itemName));

  return {
    cityId,
    totalKg: knownKg + unknownKg,
    knownKg,
    acceptedKg,
    contaminantKg,
    unknownKg,
    contaminationRate: knownKg > 0 ? contaminantKg / knownKg : 0,
    avoidedKgCO2e: avoided,
    potentialKgCO2e: fixes.reduce((a, f) => a + f.potentialKgCO2e, 0),
    unfactoredKg,
    lines,
    fixes,
  };
}
