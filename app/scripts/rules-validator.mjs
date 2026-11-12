// Shared validation logic used by the CLI validator, the LLM compiler and the tests.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

let cached;
export function loadSchemas(rulesDir) {
  if (cached) return cached;
  const ajv = new Ajv({ allErrors: true, strict: false });
  addFormats(ajv);
  const rulesetSchema = JSON.parse(readFileSync(join(rulesDir, 'ruleset.schema.json'), 'utf8'));
  const itemsSchema = JSON.parse(readFileSync(join(rulesDir, 'items.schema.json'), 'utf8'));
  cached = { ajv, validateRuleset: ajv.compile(rulesetSchema), validateItems: ajv.compile(itemsSchema), rulesetSchema };
  return cached;
}

/** Returns a list of human-readable problems (empty = valid). */
export function validateRulesetObject(data, itemIds, rulesDir) {
  const { ajv, validateRuleset } = loadSchemas(rulesDir);
  const errs = [];
  if (!validateRuleset(data)) {
    errs.push(...validateRuleset.errors.map((e) => `${e.instancePath || '(root)'} ${e.message}`));
    return errs;
  }
  void ajv;
  const sourceIds = new Set(data.sources.map((s) => s.id));
  const seen = new Set();
  for (const r of data.rules) {
    if (seen.has(r.itemId)) errs.push(`duplicate rule for ${r.itemId}`);
    seen.add(r.itemId);
    if (itemIds && !itemIds.has(r.itemId)) errs.push(`rule ${r.itemId}: unknown itemId (not in items.json)`);
    for (const c of [r.citation, ...(r.variants || []).map((v) => v.citation)]) {
      if (!sourceIds.has(c.sourceId)) errs.push(`rule ${r.itemId}: citation sourceId "${c.sourceId}" not listed in sources`);
      if (!c.quote.trim()) errs.push(`rule ${r.itemId}: empty quote`);
    }
  }
  for (const g of data.general) if (!sourceIds.has(g.citation.sourceId)) errs.push(`general ${g.id}: unknown sourceId`);
  return errs;
}
