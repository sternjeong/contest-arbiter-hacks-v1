import { useState } from 'react';
import { engine } from '../engine/data';
import { CONDITION_LABELS, compare, resolve } from '../engine/resolve';
import type { Item } from '../engine/types';
import { BinBadge, CitationBlock, ItemSearch } from './common';

export const POPULAR = ['plastic-bag', 'pizza-box', 'paper-coffee-cup', 'foam-cup', 'battery', 'diaper', 'chip-bag', 'egg-carton-paper'];

export function Lookup({ cityId, itemId, onItem, onCompare }: {
  cityId: string;
  itemId?: string;
  onItem: (id: string) => void;
  onCompare: (id: string) => void;
}) {
  const item = itemId ? engine.itemById.get(itemId) : undefined;
  return (
    <div className="stack">
      <div>
        <h1>Where does it go in {engine.cityById.get(cityId)!.city.name}?</h1>
        <p className="lede">Answers come from the city’s own sorting guide, with the exact quote and a link. No guessing: if the guide is silent, SortLocal says so.</p>
      </div>
      <ItemSearch items={engine.items} onSelect={(i: Item) => onItem(i.id)} autoFocus />
      <div className="chips" aria-label="Popular items">
        {POPULAR.map((id) => (
          <button key={id} className="chip" onClick={() => onItem(id)}>{engine.itemById.get(id)!.name}</button>
        ))}
      </div>
      {item && <AnswerCard key={`${cityId}-${item.id}`} cityId={cityId} item={item} onCompare={onCompare} />}
    </div>
  );
}

function AnswerCard({ cityId, item, onCompare }: { cityId: string; item: Item; onCompare: (id: string) => void }) {
  const [dirty, setDirty] = useState(false);
  const rs = engine.cityById.get(cityId)!;
  const ans = resolve(engine, cityId, item.id, { dirty });
  const cmp = compare(engine, item.id)!;
  const hasDirtyVariant = !!ans?.rule.variants?.some((v) => v.trigger === 'dirty');

  return (
    <section className="grid-2 fade-in" aria-live="polite">
      <article className="card">
        <div className="answer-head">
          <h2>{item.name}</h2>
          {ans ? (ans.rule.verified ? <span className="tag ok">✓ Cited</span> : <span className="tag warn">Unverified</span>) : null}
        </div>
        {!ans ? (
          <div className="stack">
            <BinBadge bin="none" label="No official rule found" size="lg" />
            <p className="muted">{rs.city.name}’s guide (as archived on {rs.retrieved}) has no entry for this item, so SortLocal won’t guess. Check the official tool:</p>
            <p>{rs.sources.map((s) => <a key={s.id} href={s.url} target="_blank" rel="noreferrer" style={{ display: 'block' }}>{s.title}</a>)}</p>
          </div>
        ) : (
          <div className="stack">
            <div>
              <BinBadge bin={ans.bin} label={ans.binLabel} size="lg" />
              {ans.appliedVariant && <p className="small muted" style={{ margin: '8px 0 0' }}>Because it’s {ans.appliedVariant.when}.</p>}
            </div>
            {hasDirtyVariant && (
              <label className="toggle">
                <input type="checkbox" checked={dirty} onChange={(e) => setDirty(e.target.checked)} />
                It’s greasy, wet or has food on it
              </label>
            )}
            {(ans.rule.prep?.length || ans.rule.conditions?.length) ? (
              <div>
                <h3>Before you toss it</h3>
                {ans.rule.prep && <ul className="prep">{ans.rule.prep.map((p) => <li key={p}>{p}</li>)}</ul>}
                {ans.rule.conditions && (
                  <div className="chips" style={{ marginTop: 8 }}>
                    {ans.rule.conditions.map((c) => <span key={c} className="tag">{CONDITION_LABELS[c]}</span>)}
                  </div>
                )}
              </div>
            ) : null}
            {ans.rule.note && <p className={ans.rule.verified ? 'notice ok' : 'notice'}>{ans.rule.note}</p>}
            <CitationBlock citation={ans.appliedVariant?.citation ?? ans.rule.citation} />
            {ans.rule.variants && ans.rule.variants.length > 0 && (
              <div>
                <h3>It depends</h3>
                {ans.rule.variants.map((v) => (
                  <div key={v.when} className="variant">
                    <span>If {v.when}:</span>
                    <BinBadge bin={v.bin} label={rs.bins[v.bin].label} size="sm" />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </article>
      <aside className="card">
        <h3>Same item, other cities</h3>
        <div className="elsewhere">
          {cmp.answers.filter((a) => a.cityId !== cityId).map((a) => {
            const diff = !!(a.answer && ans && a.answer.bin !== ans.rule.bin);
            return (
              <div key={a.cityId} className={`elsewhere-row ${diff ? 'diff' : ''}`}>
                <span><b>{a.cityName}</b>{diff && <span className="small muted"> · different</span>}</span>
                {a.answer ? <BinBadge bin={a.answer.bin} label={a.answer.binLabel} size="sm" /> : <BinBadge bin="none" label="No rule" size="sm" />}
              </div>
            );
          })}
        </div>
        <p className="small muted">{cmp.differs ? `This item goes to ${cmp.distinctBins.length} different places depending on the city. A generic “AI sorter” would get at least one of them wrong.` : 'All cities with a rule agree on this one.'}</p>
        <button className="btn secondary" onClick={() => onCompare(item.id)}>Compare side by side →</button>
      </aside>
    </section>
  );
}
