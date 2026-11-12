import catalogJson from '../rules/items.json';
import sfJson from '../rules/sf.json';
import seattleJson from '../rules/seattle.json';
import torontoJson from '../rules/toronto.json';
import warmJson from '../climate/warm-factors.json';
import { createEngine } from './resolve';
import type { Catalog, Ruleset } from './types';
import type { WarmFactors } from './audit';

export const catalog = catalogJson as unknown as Catalog;
export const rulesets = [sfJson, seattleJson, torontoJson] as unknown as Ruleset[];
export const engine = createEngine(catalog, rulesets);
export const warm = warmJson;
export const factors = warmJson.factors as unknown as WarmFactors;
