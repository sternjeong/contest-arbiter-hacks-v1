import { useMemo } from 'react';
import { engine } from '../engine/data';
import { compare, disagreements } from '../engine/resolve';
import { BinBadge, CitationBlock, ItemSearch } from './common';

export function Compare({ itemId, onItem, onLookup }: { itemId: string; onItem: (id: string) => void; onLookup: (cityId: string, itemId: string) => void }) {
  const cmp = compare(engine, itemId) ?? compare(engine, 'plastic-bag')!;
  const ranked = useMemo(() => disagreements(engine), []);
  const shared = useMemo(() => engine.items.filter((i) => engine.cities.every((c) => engine.ruleIndex.get(c.city.id)!.has(i.id))), []);
  const sharedDiffer = shared.filter((i) => compare(engine, i.id)!.differs).length;
  const n = cmp.distinctBins.length;
  const covered = cmp.answers.filter((a) => a.answer).length;

  return (
    <div className="stack">
      <div>
        <h1>Same item. Different city. Different bin.</h1>
        <p className="lede">
          Of the {shared.length} items all three official guides cover, <b>{sharedDiffer}</b> ({Math.round((sharedDiffer / shared.length) * 100)}%) don’t go in the same bin everywhere.
          That’s why “one-size-fits-all” sorting advice contaminates recycling.
        </p>
      </div>
      <ItemSearch items={engine.items} onSelect={(i) => onItem(i.id)} label="Compare an item" placeholder="Compare an item across cities…" />
      <div className={`banner ${cmp.differs ? '' : 'agree'}`} role="status">
        {cmp.differs
          ? <>{cmp.item.name}: {covered} cities, {n} different answers.</>
          : <>{cmp.item.name}: every city with a rule agrees.</>}
      </div>
      <div className="grid-3">
        {cmp.answers.map((a) => {
          const rs = engine.cityById.get(a.cityId)!;
          return (
            <article key={a.cityId} className="card fade-in">
              <div className="col-city">
                <h2 style={{ margin: 0 }}>{rs.city.flag} {a.cityName}</h2>
                {a.answer && !a.answer.rule.verified && <span className="tag warn">Unverified</span>}
              </div>
              {a.answer ? (
                <>
                  <BinBadge bin={a.answer.bin} label={a.answer.binLabel} />
                  {a.answer.rule.prep && <ul className="prep small" style={{ marginTop: 10 }}>{a.answer.rule.prep.slice(0, 3).map((p) => <li key={p}>{p}</li>)}</ul>}
                  <CitationBlock citation={a.answer.rule.citation} label="Source" />
                  <button className="link-btn" onClick={() => onLookup(a.cityId, cmp.item.id)}>Full answer for {a.cityName}</button>
                </>
              ) : (
                <>
                  <BinBadge bin="none" label="No official rule" />
                  <p className="small muted">This city’s guide doesn’t list it. SortLocal won’t invent one.</p>
                </>
              )}
            </article>
          );
        })}
      </div>
      <section className="card">
        <h2>Where the cities disagree most</h2>
        <p className="small muted">{ranked.length} items get different answers. Three-way splits first. Tap one to compare.</p>
        <ul className="disagree-list">
          {ranked.slice(0, 18).map((c) => (
            <li key={c.item.id}>
              <button onClick={() => { onItem(c.item.id); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
                <b>{c.item.name}</b>
                <span className="disagree-bins">
                  {c.answers.map((a) => a.answer
                    ? <BinBadge key={a.cityId} bin={a.answer.bin} label={`${shortCity(a.cityId)}: ${engine.cityById.get(a.cityId)!.bins[a.answer.bin].short}`} size="sm" />
                    : <BinBadge key={a.cityId} bin="none" label={`${shortCity(a.cityId)}: n/a`} size="sm" />)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

const shortCity = (id: string) => ({ sf: 'SF', seattle: 'SEA', toronto: 'TOR' } as Record<string, string>)[id] ?? id;
