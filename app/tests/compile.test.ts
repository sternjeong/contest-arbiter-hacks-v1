import { describe, expect, it } from 'vitest';
import { join } from 'node:path';
// @ts-expect-error - plain JS modules shared with the CLI
import { buildDraftRuleset, draftSchema } from '../scripts/compile-lib.mjs';
// @ts-expect-error - plain JS module shared with the CLI
import { validateRulesetObject } from '../scripts/rules-validator.mjs';
import { catalog } from '../src/engine/data';

const guide = 'BLUE CART\nPut these in recycling: aluminum cans and   glass bottles. Rinse first.\nGARBAGE\nPlastic bags go in the garbage.';

describe('LLM compiler post-processing (offline)', () => {
  const llmRules = [
    { itemId: 'aluminum-can', bin: 'recycling', prep: ['Rinse first'], conditions: ['clean', 'bogus'], quote: 'aluminum cans and glass bottles', section: 'Blue cart' },
    { itemId: 'plastic-bag', bin: 'garbage', prep: [], conditions: [], quote: 'Plastic bags go in the garbage.', section: 'Garbage' },
    { itemId: 'battery', bin: 'special', prep: [], conditions: [], quote: 'Batteries go to the depot.', section: 'HHW' },
    { itemId: 'not-an-item', bin: 'garbage', prep: [], conditions: [], quote: 'Plastic bags go in the garbage.', section: 'x' },
    { itemId: 'plastic-bag', bin: 'recycling', prep: [], conditions: [], quote: 'Plastic bags go in the garbage.', section: 'dup' },
  ];
  const { ruleset, dropped } = buildDraftRuleset({ cityId: 'testville', cityName: 'Testville', url: 'https://example.org/guide', guideText: guide, llmRules, catalog, retrieved: '2026-11-12' });

  it('keeps only rules whose quote is verbatim in the guide', () => {
    expect(ruleset.rules.map((r: { itemId: string }) => r.itemId)).toEqual(['aluminum-can', 'plastic-bag']);
    expect(dropped.map((d: { reason: string }) => d.reason)).toEqual(['quote not found verbatim in guide', 'unknown item', 'duplicate item']);
  });

  it('marks drafts unverified, strips invalid conditions, and passes the schema', () => {
    expect(ruleset.rules.every((r: { verified: boolean }) => r.verified === false)).toBe(true);
    expect(ruleset.rules[0].conditions).toEqual(['clean']);
    expect(validateRulesetObject(ruleset, new Set(catalog.items.map((i) => i.id)), join(__dirname, '..', 'src', 'rules'))).toEqual([]);
  });

  it('constrains model output to catalog ids and closed objects', () => {
    const s = draftSchema(['a', 'b']);
    expect(s.properties.rules.items.properties.itemId.enum).toEqual(['a', 'b']);
    expect(s.properties.rules.items.additionalProperties).toBe(false);
  });
});
