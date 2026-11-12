import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
// @ts-expect-error - plain JS module shared with the CLI
import { loadSchemas, validateRulesetObject } from '../scripts/rules-validator.mjs';
import { catalog, rulesets } from '../src/engine/data';

const rulesDir = join(__dirname, '..', 'src', 'rules');
const norm = (s: string) => s.replace(/\s+/g, ' ').trim();

// Snapshot text of every official source, used to prove each quote is verbatim.
const snap = (f: string) => readFileSync(join(__dirname, '..', 'rules-src', 'snapshots', f), 'utf8');
const corpus = norm([
  snap('sf-sfrecycles.json'), snap('sf-poster-2023.txt').replace(/•/g, ' '), snap('sf-recology-better-at-the-bin.txt'),
  snap('seattle-wdig.json'), snap('seattle-how-to-sort.txt'), snap('seattle-recycling-process.txt'),
  snap('toronto-wastewizard.json'),
].join(' ')).replace(/\\"/g, '"');

describe('rulesets', () => {
  const itemIds = new Set(catalog.items.map((i) => i.id));

  it('item catalog matches its schema and has unique ids', () => {
    const { validateItems } = loadSchemas(rulesDir);
    expect(validateItems(catalog)).toBe(true);
    expect(itemIds.size).toBe(catalog.items.length);
  });

  it('covers three cities with 60+ rules each', () => {
    expect(rulesets.map((r) => r.city.id)).toEqual(['sf', 'seattle', 'toronto']);
    for (const rs of rulesets) expect(rs.rules.length).toBeGreaterThanOrEqual(60);
  });

  for (const rs of rulesets) {
    describe(rs.city.name, () => {
      it('is valid against ruleset.schema.json and cross-file checks', () => {
        expect(validateRulesetObject(rs, itemIds, rulesDir)).toEqual([]);
      });

      it('every rule and variant has an https citation with a non-empty quote', () => {
        for (const r of rs.rules) {
          for (const c of [r.citation, ...(r.variants ?? []).map((v) => v.citation)]) {
            expect(c.url, r.itemId).toMatch(/^https:\/\//);
            expect(c.quote.length, r.itemId).toBeGreaterThan(5);
            expect(rs.sources.some((s) => s.id === c.sourceId), r.itemId).toBe(true);
          }
        }
      });

      it('every quote appears verbatim in the archived official source', () => {
        for (const r of rs.rules) {
          for (const c of [r.citation, ...(r.variants ?? []).map((v) => v.citation)]) {
            const q = norm(c.quote).replace(/…$/, '');
            expect(corpus.includes(q), `${rs.city.id}/${r.itemId}: ${q}`).toBe(true);
          }
        }
      });

      it('unverified rules explain why', () => {
        for (const r of rs.rules.filter((x) => !x.verified)) expect(r.note, r.itemId).toBeTruthy();
      });
    });
  }

  it('rejects a rule without a citation', () => {
    const bad = structuredClone(rulesets[0]) as unknown as { rules: Record<string, unknown>[] };
    delete bad.rules[0].citation;
    expect(validateRulesetObject(bad, itemIds, rulesDir).length).toBeGreaterThan(0);
  });

  it('rejects a rule pointing at an unknown item', () => {
    const bad = structuredClone(rulesets[1]);
    bad.rules[0].itemId = 'not-a-real-item';
    expect(validateRulesetObject(bad, itemIds, rulesDir).join(' ')).toMatch(/unknown itemId/);
  });
});
