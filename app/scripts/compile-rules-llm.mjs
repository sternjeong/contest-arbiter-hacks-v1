#!/usr/bin/env node
// OPTIONAL: draft a new city ruleset from pasted guide text with Claude.
// The app never needs this; it only helps contributors add cities faster.
//
//   ANTHROPIC_API_KEY=... node scripts/compile-rules-llm.mjs --city "Portland" --id portland \
//       --url https://www.portland.gov/... guide.txt [--out src/rules/portland.json]
//   node scripts/compile-rules-llm.mjs --city X --id x --url https://... guide.txt --from-response saved.json   (offline)
//
// Output is validated against src/rules/ruleset.schema.json. Quotes not found verbatim
// in the guide are dropped, and every rule is marked unverified for human review.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { buildDraftRuleset, buildPrompt, draftSchema } from './compile-lib.mjs';
import { validateRulesetObject } from './rules-validator.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const rulesDir = join(here, '..', 'src', 'rules');
const MODEL = process.env.SORTLOCAL_MODEL || 'claude-sonnet-5-5';

const { values: a, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    city: { type: 'string' }, id: { type: 'string' }, url: { type: 'string' }, region: { type: 'string' },
    authority: { type: 'string' }, out: { type: 'string' }, 'from-response': { type: 'string' }, help: { type: 'boolean' },
  },
});

if (a.help || !a.city || !a.id || !a.url || positionals.length !== 1) {
  console.log('Usage: node scripts/compile-rules-llm.mjs --city "Name" --id slug --url https://official-guide [--region R] [--authority A] [--out file] guide.txt');
  console.log('       add --from-response model-output.json to post-process a saved response without calling the API.');
  process.exit(a.help ? 0 : 1);
}

const guideText = readFileSync(positionals[0], 'utf8');
const catalog = JSON.parse(readFileSync(join(rulesDir, 'items.json'), 'utf8'));
let llmRules;

if (a['from-response']) {
  llmRules = JSON.parse(readFileSync(a['from-response'], 'utf8')).rules;
} else {
  if (!process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_AUTH_TOKEN) {
    console.error('No ANTHROPIC_API_KEY set. This step is optional: you can hand-write rules in rules-src/catalog.mjs instead.');
    process.exit(2);
  }
  const { default: Anthropic } = await import('@anthropic-ai/sdk');
  const client = new Anthropic();
  console.error(`Asking ${MODEL} to draft rules for ${a.city} (${guideText.length} chars of guide text)…`);
  try {
    const stream = client.beta.messages.stream({
      model: MODEL,
      max_tokens: 64000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort: 'medium', format: { type: 'json_schema', schema: draftSchema(catalog.items.map((i) => i.id)) } },
      messages: [{ role: 'user', content: buildPrompt(a.city, guideText, catalog) }],
    });
    const msg = await stream.finalMessage();
    if (msg.stop_reason === 'refusal') { console.error('Model declined the request:', msg.stop_details?.category ?? ''); process.exit(1); }
    if (msg.stop_reason === 'max_tokens') { console.error('Output was cut off (max_tokens). Try a shorter guide excerpt.'); process.exit(1); }
    const text = msg.content.filter((b) => b.type === 'text').map((b) => b.text).join('');
    llmRules = JSON.parse(text).rules;
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) console.error('Authentication failed: check ANTHROPIC_API_KEY.');
    else if (err instanceof Anthropic.RateLimitError) console.error('Rate limited: try again shortly.');
    else if (err instanceof Anthropic.APIError) console.error(`API error ${err.status ?? ''}: ${err.message}`);
    else console.error(err);
    process.exit(1);
  }
}

const { ruleset, dropped } = buildDraftRuleset({
  cityId: a.id, cityName: a.city, region: a.region, authority: a.authority, url: a.url, guideText, llmRules, catalog,
  retrieved: new Date().toISOString().slice(0, 10),
});
const errs = validateRulesetObject(ruleset, new Set(catalog.items.map((i) => i.id)), rulesDir);
for (const d of dropped) console.error(`  dropped ${d.itemId}: ${d.reason}`);
if (errs.length) { console.error('✗ Draft failed schema validation:\n  ' + errs.join('\n  ')); process.exit(1); }
const out = a.out || `${a.id}.draft.json`;
writeFileSync(out, JSON.stringify(ruleset, null, 2) + '\n');
console.log(`✓ ${ruleset.rules.length} draft rules written to ${out} (${dropped.length} dropped). Review them, then add the city to src/engine/data.ts.`);
