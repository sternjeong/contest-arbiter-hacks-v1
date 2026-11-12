# SortLocal: recycling rules, by city

**Track:** Theme: Rethinking Waste
**Tagline:** Where does it go? It depends on where you live. SortLocal gives the answer with the city’s own words as proof.

**Try it (no sign-up, no API key):** https://sternjeong.github.io/contest-arbiter-hacks-v1/
**Code:** https://github.com/sternjeong/contest-arbiter-hacks-v1
**Video:** _<YouTube/Vimeo link>_

---

## Theme: the waste problem we target and how we measure success

**Problem:** recycling contamination, meaning non-recyclable, dirty or bagged items in the recycling bin. Contamination lowers the value of sorted bales, jams sorting equipment (plastic bags and hoses wrap around the screens), creates fire risks (batteries), and can send recyclables to landfill. A large share of it is well-meant "wish-cycling", and the root cause is that **the rules are local**. Of the 82 items that San Francisco, Seattle and Toronto all cover in their official guides, 33 (40%) do not go in the same bin in all three cities. Generic advice, including generic AI classifiers, is wrong somewhere by design.

**How we measure success:** SortLocal builds the measurement into the product. The **Bin audit** computes a household’s **contamination rate by weight** under its own city’s rules, and an **estimated kg CO₂e avoided** (EPA WARM v16 net factors versus landfill) for the material that is correctly recycled. It also estimates the extra CO₂e unlocked by each fix. Audits are saved locally so a household can track **before/after**. Our success metrics are (1) a drop in contamination rate between a user’s first and later audits, (2) the share of lookups answered with an official citation rather than "unknown", and (3) estimated kg CO₂e moved from landfill to recycling or compost. For the sample bin in the demo, applying the suggested fixes takes contamination from 48% to 0% in Seattle.

---

## Inspiration

We moved between cities and kept getting it wrong. In one city the plastic grocery bag goes in the blue bin. In another it is "the #1 contaminant, never put it in recycling". Diapers go in the *compost* in Toronto. Each city publishes a careful guide, but it lives in a different format on a different website, and none of them can tell you how your city differs from the one you just left. Meanwhile, every "AI trash sorter" demo answers with one global truth. We wanted a tool that is right locally and can **prove** it.

## What it does

- **Look up** 100 everyday items in San Francisco, Seattle or Toronto. Each answer gives the bin, the prep steps (flatten, lid on or off, bigger than 3 inches, empty, clean, dry), the "it depends" cases (greasy → compost), and a **verbatim quote with a link to the official source**. If the city’s guide is silent, SortLocal says "No official rule" instead of guessing.
- **Compare cities**: shows the same item in three columns, plus a ranked list of the 44 items where the cities disagree. Six items, including plastic bags, plastic film, bubble wrap, foam blocks and empty paint cans, get three different answers in three cities.
- **Bin audit**: count or weigh what is in your recycling bin and flag dirty or bagged items. You get the contamination rate under your city’s rules, estimated CO₂e avoided, a prioritized fix list (safety hazards first, then tanglers and food contamination, each backed by a rule quote), the **same bin scored in all three cities**, and a saved before/after trend.
- **Rules & sources**: every source, every unverified rule and the reason it is unverified, the emission-factor table, and how to add a new city.
- A 3-step guided tour, light and dark themes, an accessible combobox and dialog, and a mobile-first layout.

## How we built it

1. **Fetched the official sources.** We used SF Environment’s *SF Recycles* item pages and its 2023 poster PDF, the Seattle Public Utilities *Where Does It Go?* content API (312 records), and the City of Toronto *Waste Wizard* data feed (195 records). We archived them in the repo as snapshots.
2. **Rules as code.** We hand-authored a catalog of 100 items (names, synonyms, material, typical mass) and, for each city, a rule that points to the exact source record and field. A build script resolves every pointer into a citation (URL, section, quote) and **fails the build if a quote is not found verbatim** in the snapshot. It also detects Toronto keywords that appear under conflicting Waste Wizard entries and marks those rules unverified automatically.
3. **Schema + validator.** A JSON Schema (validated with Ajv) makes a citation mandatory for every rule and variant, and requires a `note` on every unverified rule. Cross-file checks confirm that item ids exist and that sources are declared.
4. **Deterministic TypeScript engine.** Fuzzy search (normalization, plural folding, prefix matching and Damerau-Levenshtein typo tolerance), a resolver with state-dependent variants, city comparison and disagreement ranking, and the audit model. The audit sorts each item into accepted, wrong bin, dirty or bagged, then computes mass, contamination rate, WARM (landfill − recycling) × short tons, and severity-weighted fixes.
5. **React + Vite static site**, deployable to GitHub Pages with a CI workflow that lints, tests and builds. There is no backend, no account and no key.
6. **Optional LLM layer.** A CLI script lets contributors paste a new city’s guide. Claude (`claude-sonnet-5-5`, structured JSON output constrained to catalog ids) drafts the rules. Our code then **drops any rule whose quote is not verbatim in the pasted text**, marks the rest unverified for human review, and validates the result against the schema. The app itself never calls a model.
7. **45 Vitest tests**: schema validity, citation presence, verbatim quotes against the archived sources, resolver behavior, audit math (checked against hand-computed WARM numbers), persistence, the compiler’s post-processing, and UI smoke tests that click through the demo in jsdom.

## Challenges we ran into

- **Official sources disagree with themselves.** SF’s current item page says spray cans need special handling, while SF’s 2023 poster says to recycle them when empty. Toronto’s Waste Wizard lists stand-up pouches under both the new Blue Bin and an older Garbage entry. Seattle’s "Ice Cream Cartons" record contains text about ice-cube trays. We chose to **surface** these conflicts as "Unverified" with an explanation rather than hide them.
- **Citations that are actually verifiable.** Our first quote extractor split sentences on every period and produced a "quote" that skipped text around "0.5 metre". The verbatim-quote test caught it. Quotes are now always exact prefixes or explicit excerpts.
- **Toronto changed its program mid-year.** Toronto’s Blue Bin moved to producer-run recycling and now accepts film, foam and chip bags. That made the cross-city differences much larger, and it shows why rules must be kept as data with archive dates.
- **Honest climate numbers.** WARM has no recycling factor for film or polystyrene, so we report those as not counted instead of inventing one.

## Accomplishments that we're proud of

- 282 city rules across 100 items, **every one with an official citation**, and quotes that a test proves are verbatim.
- The "aha" comparison: *the same bin* is 45% contaminated in San Francisco, 48% in Seattle and 14% in Toronto.
- It works instantly for judges: a static site, no key, no sign-up, and it runs offline after the first load.
- A clean split between a deterministic core and an optional LLM. The model accelerates data entry, and verification stays deterministic.

## What we learned

- The hard part of waste sorting isn’t recognizing the object. It’s knowing the **local rule**, and being able to show where it comes from.
- Encoding policy as data surfaces inconsistencies that a human reader skims past.
- Lifecycle factors (EPA WARM) make the impact measurable, but they have to be presented as estimates with their assumptions visible.

## What's next

- More cities, starting with those that publish structured lookups (many use the same "waste wizard" vendors), using the LLM-assisted compiler with human review.
- Scheduled source re-fetching that opens a pull request when an official guide changes (diffing against the snapshots).
- Building-manager mode: aggregate audits for an apartment building or campus and track contamination over months.
- Printable, city-specific bin labels generated from the rulesets.
- An optional in-app "explain this rule" feature with a user-supplied key, grounded only in the cited quote.

## Built with

TypeScript · React · Vite · JSON Schema · Ajv · Vitest · ESLint · GitHub Actions / GitHub Pages · EPA WARM v16 · Anthropic Claude API (optional rule-compiler CLI only) · Official open data from SF Environment, Seattle Public Utilities and the City of Toronto
