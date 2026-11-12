import { describe, expect, it } from 'vitest';
import { engine } from '../src/engine/data';
import { compare, disagreements, resolve } from '../src/engine/resolve';
import { editDistance, normalize, searchItems } from '../src/engine/search';

describe('search', () => {
  it('normalizes case, punctuation and plurals', () => {
    expect(normalize('  Pizza-Boxes! ')).toBe('pizza box');
    expect(normalize('Batteries')).toBe('battery');
  });

  it('computes edit distance with transpositions', () => {
    expect(editDistance('battery', 'battrey')).toBe(1);
    expect(editDistance('cat', 'dog')).toBe(3);
  });

  it('finds items by exact name, synonym, plural and typo', () => {
    expect(searchItems(engine.items, 'plastic grocery bag')[0].item.id).toBe('plastic-bag');
    expect(searchItems(engine.items, 'styrofoam cup')[0].item.id).toBe('foam-cup');
    expect(searchItems(engine.items, 'batteries')[0].item.id).toBe('battery');
    expect(searchItems(engine.items, 'piza box')[0].item.id).toBe('pizza-box');
    expect(searchItems(engine.items, 'cardbord')[0].item.id).toBe('cardboard-box');
    expect(searchItems(engine.items, 'k-cup')[0].item.id).toBe('coffee-pod');
  });

  it('returns nothing for empty or nonsense queries', () => {
    expect(searchItems(engine.items, '')).toEqual([]);
    expect(searchItems(engine.items, 'zzqxv')).toEqual([]);
  });

  it('is deterministic', () => {
    expect(searchItems(engine.items, 'cup')).toEqual(searchItems(engine.items, 'cup'));
  });
});

describe('resolver', () => {
  it('answers with bin, label and citation per city', () => {
    const a = resolve(engine, 'toronto', 'plastic-bag')!;
    expect(a.bin).toBe('recycling');
    expect(a.binLabel).toBe('Blue Bin');
    expect(a.rule.citation.url).toMatch(/toronto\.ca/);
  });

  it('applies the "dirty" variant when the item is soiled', () => {
    expect(resolve(engine, 'seattle', 'cardboard-box')!.bin).toBe('recycling');
    const dirty = resolve(engine, 'seattle', 'cardboard-box', { dirty: true })!;
    expect(dirty.bin).toBe('compost');
    expect(dirty.appliedVariant?.citation.section).toMatch(/Food & yard waste/);
  });

  it('does not apply non-dirty variants for a dirty item', () => {
    // Pizza box variant is "clean, no grease" → must not fire on dirty
    expect(resolve(engine, 'toronto', 'pizza-box', { dirty: true })!.bin).toBe('compost');
  });

  it('returns undefined when a city has no official rule', () => {
    expect(resolve(engine, 'sf', 'receipt')).toBeUndefined();
    expect(resolve(engine, 'nowhere', 'receipt')).toBeUndefined();
  });

  it('compare() shows the plastic bag going to three different places', () => {
    const c = compare(engine, 'plastic-bag')!;
    expect(c.differs).toBe(true);
    expect(new Set(c.distinctBins)).toEqual(new Set(['special', 'garbage', 'recycling']));
  });

  it('compare() reports agreement for aluminum cans', () => {
    expect(compare(engine, 'aluminum-can')!.differs).toBe(false);
  });

  it('disagreements() ranks three-way splits first', () => {
    const d = disagreements(engine);
    expect(d.length).toBeGreaterThan(20);
    expect(d[0].distinctBins.length).toBe(3);
    for (let i = 1; i < d.length; i++) expect(d[i - 1].distinctBins.length).toBeGreaterThanOrEqual(d[i].distinctBins.length);
  });
});
