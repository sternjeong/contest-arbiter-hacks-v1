import { describe, expect, it } from 'vitest';
import { engine, factors } from '../src/engine/data';
import { avoidedVsLandfill, computeAudit, entryMassKg, SHORT_TON_KG } from '../src/engine/audit';
import { loadAudits, saveAudits, trend, type KV, type SavedAudit } from '../src/engine/storage';

describe('audit math', () => {
  it('computes mass from count × unit mass, or uses measured weight', () => {
    expect(entryMassKg(engine, { itemId: 'aluminum-can', count: 10 })).toBeCloseTo(0.15);
    expect(entryMassKg(engine, { itemId: 'aluminum-can', count: 10, weightKg: 0.2 })).toBe(0.2);
    expect(entryMassKg(engine, { itemId: 'aluminum-can', count: 0 })).toBe(0);
  });

  it('WARM avoided emissions = (landfill − recycling) × short tons', () => {
    // 1 short ton of aluminum cans: 0.02 − (−9.13) = 9.15 t = 9150 kg CO2e
    expect(avoidedVsLandfill(factors, 'aluminum', 'recycling', SHORT_TON_KG)).toBeCloseTo(9150, 6);
    expect(avoidedVsLandfill(factors, 'ldpe', 'recycling', 10)).toBe(0); // no WARM factor
    expect(avoidedVsLandfill(factors, 'food-waste', 'compost', SHORT_TON_KG)).toBeCloseTo(650, 6);
  });

  it('clean bin → 0% contamination and positive avoided emissions', () => {
    const r = computeAudit(engine, factors, 'seattle', [{ itemId: 'aluminum-can', count: 20 }, { itemId: 'cardboard-box', count: 2 }]);
    expect(r.contaminationRate).toBe(0);
    expect(r.acceptedKg).toBeCloseTo(0.3 + 0.8);
    const expected = (0.02 + 9.13) * 1000 * (0.3 / SHORT_TON_KG) + (0.18 + 3.14) * 1000 * (0.8 / SHORT_TON_KG);
    expect(r.avoidedKgCO2e).toBeCloseTo(expected, 6);
    expect(r.fixes).toEqual([]);
  });

  it('the same bin scores differently per city', () => {
    const bin = [{ itemId: 'plastic-bag', count: 10 }, { itemId: 'plastic-bottle', count: 10 }];
    const tor = computeAudit(engine, factors, 'toronto', bin);
    const sea = computeAudit(engine, factors, 'seattle', bin);
    expect(tor.contaminationRate).toBe(0);
    expect(sea.contaminationRate).toBeCloseTo(0.06 / 0.31, 6);
  });

  it('flags dirty and bagged items by city rules', () => {
    const r = computeAudit(engine, factors, 'seattle', [
      { itemId: 'plastic-tub', count: 5, dirty: true },
      { itemId: 'glass-jar', count: 2, bagged: true },
      { itemId: 'cardboard-box', count: 1, dirty: true },
    ]);
    const byItem = Object.fromEntries(r.lines.map((l) => [l.entry.itemId, l]));
    expect(byItem['plastic-tub'].reason).toBe('dirty');
    expect(byItem['glass-jar'].reason).toBe('bagged');
    expect(byItem['cardboard-box'].reason).toBe('wrong-bin');
    expect(byItem['cardboard-box'].belongs).toBe('compost');
    expect(r.contaminationRate).toBe(1);
    // Toronto has no "loose" rule in its guide → bagged glass is accepted there
    const t = computeAudit(engine, factors, 'toronto', [{ itemId: 'glass-jar', count: 2, bagged: true }]);
    expect(t.contaminationRate).toBe(0);
  });

  it('prioritises hazards, then tanglers, over ordinary mistakes', () => {
    const r = computeAudit(engine, factors, 'sf', [
      { itemId: 'drinking-glass', count: 4 },
      { itemId: 'plastic-bag', count: 3 },
      { itemId: 'battery', count: 1 },
    ]);
    expect(r.fixes.map((f) => f.itemId)).toEqual(['battery', 'plastic-bag', 'drinking-glass']);
    expect(r.fixes[0].severity).toBe('critical');
    expect(r.fixes[0].action).toMatch(/Special handling/);
  });

  it('excludes items with no official rule from the rate and reports them', () => {
    const r = computeAudit(engine, factors, 'sf', [{ itemId: 'receipt', count: 5 }, { itemId: 'aluminum-can', count: 1 }]);
    expect(r.unknownKg).toBeCloseTo(0.01);
    expect(r.contaminationRate).toBe(0);
  });

  it('estimates the benefit of composting misplaced food', () => {
    const r = computeAudit(engine, factors, 'toronto', [{ itemId: 'food-scraps', count: 2 }]);
    expect(r.potentialKgCO2e).toBeCloseTo(0.65 * 1000 * (0.6 / SHORT_TON_KG), 6);
  });
});

describe('audit persistence', () => {
  const memory = (): KV & { data: Record<string, string> } => {
    const data: Record<string, string> = {};
    return { data, getItem: (k) => data[k] ?? null, setItem: (k, v) => { data[k] = v; } };
  };
  const mk = (id: string, savedAt: string, rate: number, cityId = 'sf'): SavedAudit =>
    ({ id, savedAt, cityId, label: id, entries: [], contaminationRate: rate, contaminantKg: 0, knownKg: 1, avoidedKgCO2e: 0 });

  it('round-trips audits and survives corrupt storage', () => {
    const kv = memory();
    expect(saveAudits([mk('a', '2026-11-01', 0.4)], kv)).toBe(true);
    expect(loadAudits(kv)).toHaveLength(1);
    kv.data['sortlocal.audits.v1'] = '{not json';
    expect(loadAudits(kv)).toEqual([]);
  });

  it('computes before/after change per city', () => {
    const list = [mk('b', '2026-11-08', 0.1), mk('a', '2026-11-01', 0.4), mk('c', '2026-11-05', 0.9, 'toronto')];
    const t = trend(list, 'sf');
    expect(t.points.map((p) => p.id)).toEqual(['a', 'b']);
    expect(t.change).toBeCloseTo(-0.3);
    expect(trend(list, 'toronto').change).toBeUndefined();
  });
});
