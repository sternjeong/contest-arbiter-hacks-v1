#!/usr/bin/env node
// Validates every ruleset in src/rules against the JSON schemas plus
// cross-file invariants (itemIds exist, sources referenced, citations present).
// Usage: node scripts/validate-rules.mjs [extra-ruleset.json ...]
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateRulesetObject, loadSchemas } from './rules-validator.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const rulesDir = join(here, '..', 'src', 'rules');
const { ajv, validateItems } = loadSchemas(rulesDir);

const items = JSON.parse(readFileSync(join(rulesDir, 'items.json'), 'utf8'));
let failures = 0;
if (!validateItems(items)) {
  failures++;
  console.error('✗ items.json:', ajv.errorsText(validateItems.errors));
}
const itemIds = new Set(items.items.map((i) => i.id));

const files = process.argv.slice(2).length
  ? process.argv.slice(2).map((f) => resolve(f))
  : readdirSync(rulesDir).filter((f) => f.endsWith('.json') && !f.includes('schema') && f !== 'items.json').map((f) => join(rulesDir, f));

for (const f of files) {
  const data = JSON.parse(readFileSync(f, 'utf8'));
  const errs = validateRulesetObject(data, itemIds, rulesDir);
  if (errs.length) {
    failures++;
    console.error(`✗ ${f}\n  - ${errs.slice(0, 20).join('\n  - ')}`);
  } else {
    const unverified = data.rules.filter((r) => !r.verified).length;
    console.log(`✓ ${data.city.name}: ${data.rules.length} rules, all cited (${unverified} unverified)`);
  }
}
if (failures) process.exit(1);
