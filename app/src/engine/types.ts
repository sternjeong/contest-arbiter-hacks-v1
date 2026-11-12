export type Bin = 'recycling' | 'compost' | 'garbage' | 'special' | 'reuse';
export const BINS: Bin[] = ['recycling', 'compost', 'garbage', 'special', 'reuse'];

export type Condition =
  | 'empty' | 'clean' | 'dry' | 'flatten' | 'lid-on' | 'lid-off' | 'caps-on' | 'remove-liner'
  | 'ball-up' | 'min-3in' | 'bag-shredded' | 'bagged-tied' | 'labeled-compostable';

export type Material =
  | 'corrugated' | 'mixed-paper' | 'newspaper' | 'magazines' | 'office-paper' | 'aluminum' | 'steel'
  | 'glass' | 'pet' | 'hdpe' | 'pp' | 'ldpe' | 'ps' | 'mixed-plastics' | 'food-waste' | 'mixed-organics'
  | 'hazardous' | 'e-waste' | 'none';

export type Category = 'Paper' | 'Metal' | 'Glass' | 'Plastic' | 'Organics' | 'Hygiene' | 'Hazardous' | 'Other';

export interface Item {
  id: string;
  name: string;
  category: Category;
  material: Material;
  unitMassG: number;
  synonyms: string[];
}

export interface Citation {
  sourceId: string;
  url: string;
  section: string;
  quote: string;
}

export interface Variant {
  when: string;
  trigger?: 'dirty' | 'other';
  bin: Bin;
  citation: Citation;
}

export interface Rule {
  itemId: string;
  bin: Bin;
  prep?: string[];
  conditions?: Condition[];
  variants?: Variant[];
  citation: Citation;
  verified: boolean;
  note?: string;
}

export interface Source {
  id: string;
  title: string;
  url: string;
  publisher: string;
  retrieved: string;
}

export interface GeneralRule {
  id: 'loose' | 'clean' | 'min-3in';
  text: string;
  citation: Citation;
}

export interface Ruleset {
  schemaVersion: 1;
  city: { id: string; name: string; region: string; authority: string; flag?: string };
  bins: Record<Bin, { label: string; short: string }>;
  retrieved: string;
  sources: Source[];
  notes?: string[];
  general: GeneralRule[];
  rules: Rule[];
}

export interface Catalog {
  schemaVersion: 1;
  items: Item[];
}
