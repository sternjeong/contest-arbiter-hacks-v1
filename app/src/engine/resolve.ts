import type { Bin, Catalog, Item, Rule, Ruleset, Variant } from './types';

export interface Engine {
  items: Item[];
  itemById: Map<string, Item>;
  cities: Ruleset[];
  cityById: Map<string, Ruleset>;
  ruleIndex: Map<string, Map<string, Rule>>; // cityId -> itemId -> rule
}

export function createEngine(catalog: Catalog, rulesets: Ruleset[]): Engine {
  const itemById = new Map(catalog.items.map((i) => [i.id, i]));
  const ruleIndex = new Map<string, Map<string, Rule>>();
  for (const rs of rulesets) ruleIndex.set(rs.city.id, new Map(rs.rules.map((r) => [r.itemId, r])));
  return { items: catalog.items, itemById, cities: rulesets, cityById: new Map(rulesets.map((r) => [r.city.id, r])), ruleIndex };
}

export interface ItemState {
  /** Food residue, liquid, grease or otherwise not clean. */
  dirty?: boolean;
}

export interface Answer {
  city: Ruleset['city'];
  item: Item;
  rule: Rule;
  /** The bin after applying any variant triggered by the item state. */
  bin: Bin;
  binLabel: string;
  appliedVariant?: Variant;
}

export function getRule(engine: Engine, cityId: string, itemId: string): Rule | undefined {
  return engine.ruleIndex.get(cityId)?.get(itemId);
}

/** Resolve an item for a city. Returns undefined when the city's official guide has no rule for it. */
export function resolve(engine: Engine, cityId: string, itemId: string, state: ItemState = {}): Answer | undefined {
  const rs = engine.cityById.get(cityId);
  const item = engine.itemById.get(itemId);
  const rule = getRule(engine, cityId, itemId);
  if (!rs || !item || !rule) return undefined;
  const appliedVariant = state.dirty ? rule.variants?.find((v) => v.trigger === 'dirty') : undefined;
  const bin = appliedVariant?.bin ?? rule.bin;
  return { city: rs.city, item, rule, bin, binLabel: rs.bins[bin].label, appliedVariant };
}

export interface Comparison {
  item: Item;
  answers: { cityId: string; cityName: string; answer?: Answer }[];
  distinctBins: Bin[];
  /** True when at least two cities that have a rule disagree on the bin. */
  differs: boolean;
}

export function compare(engine: Engine, itemId: string): Comparison | undefined {
  const item = engine.itemById.get(itemId);
  if (!item) return undefined;
  const answers = engine.cities.map((c) => ({ cityId: c.city.id, cityName: c.city.name, answer: resolve(engine, c.city.id, itemId) }));
  const distinctBins = [...new Set(answers.flatMap((a) => (a.answer ? [a.answer.bin] : [])))];
  return { item, answers, distinctBins, differs: distinctBins.length > 1 };
}

/** Items ranked by how much the cities disagree (most distinct bins first, then most cities covered). */
export function disagreements(engine: Engine): Comparison[] {
  return engine.items
    .map((i) => compare(engine, i.id)!)
    .filter((c) => c.differs)
    .sort((a, b) =>
      b.distinctBins.length - a.distinctBins.length ||
      b.answers.filter((x) => x.answer).length - a.answers.filter((x) => x.answer).length ||
      a.item.name.localeCompare(b.item.name));
}

export const CONDITION_LABELS: Record<string, string> = {
  empty: 'Empty',
  clean: 'Clean / rinsed',
  dry: 'Dry',
  flatten: 'Flattened',
  'lid-on': 'Lid on',
  'lid-off': 'Lid off',
  'caps-on': 'Cap on',
  'remove-liner': 'Liner removed',
  'ball-up': 'Balled up',
  'min-3in': 'Bigger than 3 in',
  'bag-shredded': 'Shreds bagged',
  'bagged-tied': 'Bagged & tied',
  'labeled-compostable': 'Labeled “compostable”',
};
