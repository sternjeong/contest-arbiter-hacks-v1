#!/usr/bin/env node
// Compiles rules-src/catalog.mjs + official source snapshots into src/rules/*.json.
// Every citation quote is checked against the snapshot text; a quote that is not
// found verbatim fails the build. Toronto keywords that appear under conflicting
// Waste Wizard records are flagged automatically as unverified.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { items, general } from './catalog.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const snap = (f) => join(here, 'snapshots', f);
const outDir = join(here, '..', 'src', 'rules');
const RETRIEVED = '2026-11-12';

const norm = (s) => s.replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
const readJSON = (f) => JSON.parse(readFileSync(snap(f), 'utf8'));

const sfItems = readJSON('sf-sfrecycles.json').records;
const seaRecs = readJSON('seattle-wdig.json').records;
const torRecs = readJSON('toronto-wastewizard.json').records;
const sfPoster = norm(readFileSync(snap('sf-poster-2023.txt'), 'utf8').replace(/•/g, ' '));
const sfRecology = norm(readFileSync(snap('sf-recology-better-at-the-bin.txt'), 'utf8'));
const seaHowTo = norm(readFileSync(snap('seattle-how-to-sort.txt'), 'utf8'));
const seaProcess = norm(readFileSync(snap('seattle-recycling-process.txt'), 'utf8'));

const SEA_FIELD = {
  Recycling: 'Recycling', Foodandyard: 'Food & yard waste', Garbage: 'Garbage', Dropoff: 'Drop-off',
  Hazardous: 'Hazardous waste', Donate: 'Donate', General: 'General', Transferstation: 'Transfer station',
};

const SOURCES = {
  'sf-sfrecycles': { title: 'SF Environment Department: SF Recycles item lookup', url: 'https://www.sfenvironment.org/sfrecycles', publisher: 'City and County of San Francisco' },
  'sf-poster': { title: 'SF Environment: Recycle / Compost / Landfill posters (PDF, 2023)', url: 'https://sfenvironment.org/files/sfe_zw_posters_85x11_vertical_trilingual.pdf', publisher: 'City and County of San Francisco' },
  'sf-recology': { title: 'Recology: Better at the Bin (San Francisco)', url: 'https://www.recology.com/better-at-the-bin/', publisher: 'Recology' },
  'sea-wdig': { title: 'Seattle Public Utilities: Where Does It Go? tool', url: 'https://www.seattle.gov/utilities/your-services/collection-and-disposal/where-does-it-go', publisher: 'Seattle Public Utilities' },
  'sea-howto': { title: 'Seattle Public Utilities: How to Sort at Home', url: 'https://www.seattle.gov/utilities/your-services/collection-and-disposal/how-to-sort-at-home', publisher: 'Seattle Public Utilities' },
  'sea-process': { title: "Seattle Public Utilities: Seattle's Recycling Process", url: 'https://www.seattle.gov/utilities/your-services/collection-and-disposal/recycling/recycling-process', publisher: 'Seattle Public Utilities' },
  'tor-ww': { title: 'City of Toronto: Waste Wizard', url: 'https://www.toronto.ca/services-payments/recycling-organics-garbage/waste-wizard/', publisher: 'City of Toronto' },
};

const CITIES = {
  sf: {
    city: { id: 'sf', name: 'San Francisco', region: 'California, USA', authority: 'SF Environment Department / Recology', flag: '🇺🇸' },
    bins: {
      recycling: { label: 'Blue recycling bin', short: 'Recycle' },
      compost: { label: 'Green compost bin', short: 'Compost' },
      garbage: { label: 'Black landfill bin', short: 'Landfill' },
      special: { label: 'Special handling (no curbside bin)', short: 'Special' },
      reuse: { label: 'Reuse or donate', short: 'Reuse' },
    },
    sources: ['sf-sfrecycles', 'sf-poster', 'sf-recology'],
  },
  seattle: {
    city: { id: 'seattle', name: 'Seattle', region: 'Washington, USA', authority: 'Seattle Public Utilities', flag: '🇺🇸' },
    bins: {
      recycling: { label: 'Recycling cart', short: 'Recycle' },
      compost: { label: 'Food & yard waste cart', short: 'Compost' },
      garbage: { label: 'Garbage cart', short: 'Garbage' },
      special: { label: 'Drop-off or hazardous-waste facility', short: 'Special' },
      reuse: { label: 'Donate or reuse', short: 'Reuse' },
    },
    sources: ['sea-wdig', 'sea-howto', 'sea-process'],
  },
  toronto: {
    city: { id: 'toronto', name: 'Toronto', region: 'Ontario, Canada', authority: 'City of Toronto (Blue Bin run by Circular Materials)', flag: '🇨🇦' },
    bins: {
      recycling: { label: 'Blue Bin', short: 'Blue Bin' },
      compost: { label: 'Green Bin (organics)', short: 'Green Bin' },
      garbage: { label: 'Garbage Bin', short: 'Garbage' },
      special: { label: 'Depot, deposit return or special collection', short: 'Special' },
      reuse: { label: 'Donate or reuse', short: 'Reuse' },
    },
    sources: ['tor-ww'],
    notes: ['Residential Blue Bin recycling is now run by Circular Materials (producer responsibility). The Waste Wizard still contains a few older entries that contradict the new Blue Bin list; SortLocal flags those as unverified.'],
  },
};

const DIRTY_RE = /dirty|soiled|greas|food|stain|wet|oily|chemical/i;
const CLEAN_RE = /\bclean\b|no grease|unsoiled/i;
const errors = [];
const fail = (msg) => errors.push(msg);

/** Make a short verbatim excerpt: whole sentences up to ~260 chars, else word-cut with ellipsis. */
function excerpt(text, max = 260) {
  const t = norm(text);
  if (t.length <= max) return t;
  // Always a verbatim prefix: cut at the last sentence end inside the limit, else at a word boundary.
  let cut = -1;
  const re = /[.!?](?=\s|$)/g;
  let m;
  while ((m = re.exec(t)) && m.index < max) cut = m.index + 1;
  if (cut >= 40) return t.slice(0, cut);
  return t.slice(0, max).replace(/\s+\S*$/, '') + '…';
}

function checkQuote(hay, q, where) {
  if (!norm(hay).includes(norm(q))) fail(`Quote not found in ${where}: "${q}"`);
  return norm(q);
}

const torStrip = (body) => {
  const i = body.indexOf('Toronto.ca/recycle');
  return i >= 0 ? body.slice(i + 'Toronto.ca/recycle'.length).trim() : body;
};

/** Resolve a source pointer into a citation (and conflict notes). */
function cite(src, ctx) {
  const where = `${ctx}`;
  switch (src.doc) {
    case 'sf-sfrecycles': {
      const r = sfItems[src.key];
      if (!r) { fail(`${where}: SF item "${src.key}" not in snapshot`); return null; }
      const body = r.text;
      const quote = src.q ? checkQuote(body, src.q, where) : excerpt(body);
      return { sourceId: src.doc, url: `https://www.sfenvironment.org/sfrecycles/item/${src.key}`, section: `SF Recycles → ${r.name}`, quote };
    }
    case 'sf-poster':
      return { sourceId: src.doc, url: SOURCES['sf-poster'].url, section: 'Poster (English column)', quote: checkQuote(sfPoster, src.q, where) };
    case 'sf-recology':
      return { sourceId: src.doc, url: SOURCES['sf-recology'].url, section: 'Accepted materials', quote: checkQuote(sfRecology, src.q, where) };
    case 'sea-howto':
      return { sourceId: src.doc, url: SOURCES['sea-howto'].url, section: 'Recycling', quote: checkQuote(seaHowTo, src.q, where) };
    case 'sea-process':
      return { sourceId: src.doc, url: SOURCES['sea-process'].url, section: 'What can customers do to #RecycleRight?', quote: checkQuote(seaProcess, src.q, where) };
    case 'sea-wdig': {
      const r = seaRecs[src.key];
      if (!r) { fail(`${where}: Seattle record "${src.key}" not in snapshot`); return null; }
      const body = r.fields[src.field];
      if (!body) { fail(`${where}: Seattle record "${src.key}" has no field ${src.field}`); return null; }
      const quote = src.q ? checkQuote(body, src.q, where) : excerpt(body);
      return { sourceId: src.doc, url: SOURCES['sea-wdig'].url, section: `Where Does It Go? → ${src.key} → ${SEA_FIELD[src.field] || src.field}`, quote };
    }
    case 'tor-ww': {
      const r = torRecs[src.key];
      if (!r) { fail(`${where}: Toronto record "${src.key}" not in snapshot`); return null; }
      const conflicts = [];
      if (src.kw) {
        const kw = src.kw.toLowerCase();
        if (!r.keywords.some((k) => k.toLowerCase() === kw)) fail(`${where}: keyword "${src.kw}" not listed under Toronto record "${src.key}"`);
        for (const [title, other] of Object.entries(torRecs)) {
          if (title === src.key || other.category === r.category) continue;
          if (other.keywords.some((k) => k.toLowerCase() === kw)) conflicts.push(`${title} [${other.category}]`);
        }
      }
      const body = torStrip(r.body);
      const quote = src.q ? checkQuote(body, src.q, where) : excerpt(body);
      return {
        sourceId: src.doc, url: SOURCES['tor-ww'].url,
        section: `Waste Wizard → ${src.kw ? `“${src.kw}” → ` : ''}${r.category}`,
        quote, conflicts,
      };
    }
    default:
      fail(`${where}: unknown doc ${src.doc}`);
      return null;
  }
}

function clean(obj) {
  for (const k of Object.keys(obj)) if (obj[k] === undefined || (Array.isArray(obj[k]) && obj[k].length === 0)) delete obj[k];
  return obj;
}

mkdirSync(outDir, { recursive: true });

// Shared item catalog
const catalog = items.map(({ id, name, category, material, unitMassG, synonyms }) => ({ id, name, category, material, unitMassG, synonyms }));
const ids = new Set();
for (const it of catalog) { if (ids.has(it.id)) fail(`duplicate item id ${it.id}`); ids.add(it.id); }

const summary = {};
for (const [cityId, meta] of Object.entries(CITIES)) {
  const rules = [];
  for (const it of items) {
    const r = it.rules[cityId];
    if (!r) continue;
    const ctx = `${cityId}/${it.id}`;
    const c = cite(r.src, ctx);
    if (!c) continue;
    const { conflicts = [], ...citation } = c;
    let verified = r.verified !== false;
    const notes = [];
    if (r.note) notes.push(r.note);
    if (conflicts.length) {
      verified = false;
      notes.push(`Source conflict: the Toronto Waste Wizard also lists this keyword under ${conflicts.join('; ')}.`);
    }
    const variants = (r.variants || []).map((v, i) => {
      const vc = cite(v.src, `${ctx}#variant${i}`);
      const { conflicts: _c, ...vcit } = vc || {};
      return { when: v.when, trigger: DIRTY_RE.test(v.when) && !CLEAN_RE.test(v.when) ? 'dirty' : 'other', bin: v.bin, citation: vcit };
    });
    rules.push(clean({
      itemId: it.id,
      bin: r.bin,
      prep: r.prep || [],
      conditions: r.cond || [],
      variants,
      citation,
      verified,
      note: notes.length ? notes.join(' ') : undefined,
    }));
  }
  const gen = (general[cityId] || []).map((g) => {
    const c = cite(g.src.doc === 'tor-ww' ? { ...g.src, kw: undefined } : g.src, `${cityId}/general/${g.id}`);
    const { conflicts: _c, ...citation } = c || {};
    return { id: g.id, text: g.text, citation };
  });
  const ruleset = {
    $schema: './ruleset.schema.json',
    schemaVersion: 1,
    city: meta.city,
    bins: meta.bins,
    retrieved: RETRIEVED,
    sources: meta.sources.map((id) => ({ id, ...SOURCES[id], retrieved: RETRIEVED })),
    notes: meta.notes || [],
    general: gen,
    rules,
  };
  writeFileSync(join(outDir, `${cityId}.json`), JSON.stringify(ruleset, null, 2) + '\n');
  summary[cityId] = { rules: rules.length, unverified: rules.filter((x) => !x.verified).map((x) => x.itemId) };
}
writeFileSync(join(outDir, 'items.json'), JSON.stringify({ $schema: './items.schema.json', schemaVersion: 1, items: catalog }, null, 2) + '\n');

if (errors.length) {
  console.error(`✗ ${errors.length} error(s):\n  ` + errors.join('\n  '));
  process.exit(1);
}
console.log(`✓ ${catalog.length} catalog items`);
for (const [c, s] of Object.entries(summary)) console.log(`  ${c}: ${s.rules} rules, ${s.unverified.length} unverified ${s.unverified.length ? `(${s.unverified.join(', ')})` : ''}`);
