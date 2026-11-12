import { useMemo, useState } from 'react';
import { engine, factors } from '../engine/data';
import { computeAudit, entryMassKg, type AuditEntry, type AuditResult, type Fix } from '../engine/audit';
import { loadAudits, readPref, saveAudits, trend, writePref, type SavedAudit } from '../engine/storage';
import { CitationBlock, ItemSearch, fmtKg, fmtPct } from './common';

const QUICK = ['aluminum-can', 'plastic-bottle', 'cardboard-box', 'glass-jar', 'plastic-tub', 'plastic-bag', 'paper-coffee-cup', 'pizza-box', 'chip-bag', 'foam-cup', 'battery'];

export const SAMPLE_BIN: AuditEntry[] = [
  { itemId: 'aluminum-can', count: 8 },
  { itemId: 'plastic-bottle', count: 6 },
  { itemId: 'cardboard-box', count: 2 },
  { itemId: 'newspaper', count: 1 },
  { itemId: 'glass-jar', count: 3, bagged: true },
  { itemId: 'plastic-tub', count: 4, dirty: true },
  { itemId: 'plastic-bag', count: 5 },
  { itemId: 'pizza-box', count: 1 },
  { itemId: 'paper-coffee-cup', count: 3 },
  { itemId: 'foam-cup', count: 2 },
  { itemId: 'chip-bag', count: 4 },
  { itemId: 'battery', count: 2 },
  { itemId: 'egg-carton-paper', count: 2 },
  { itemId: 'metal-jar-lid', count: 3 },
];

const DRAFT_KEY = 'sortlocal.auditDraft.v1';

function loadDraft(): AuditEntry[] {
  try { const d = JSON.parse(readPref(DRAFT_KEY) ?? '[]'); return Array.isArray(d) ? d : []; } catch { return []; }
}

export function Audit({ cityId }: { cityId: string }) {
  const [entries, setEntriesState] = useState<AuditEntry[]>(loadDraft);
  const [mode, setMode] = useState<'count' | 'weight'>('count');
  const [history, setHistory] = useState<SavedAudit[]>(() => loadAudits());
  const [savedMsg, setSavedMsg] = useState('');
  const rs = engine.cityById.get(cityId)!;

  const setEntries = (next: AuditEntry[]) => { setEntriesState(next); writePref(DRAFT_KEY, JSON.stringify(next)); setSavedMsg(''); };
  const result = useMemo(() => computeAudit(engine, factors, cityId, entries), [cityId, entries]);
  const others = useMemo(() => engine.cities.map((c) => ({ city: c.city, r: computeAudit(engine, factors, c.city.id, entries) })), [entries]);

  const add = (itemId: string) => {
    const i = entries.findIndex((e) => e.itemId === itemId);
    if (i >= 0) {
      const e = entries[i];
      const next = [...entries];
      next[i] = mode === 'count' ? { ...e, count: (e.count ?? 0) + 1, weightKg: undefined } : e;
      setEntries(next);
    } else {
      const item = engine.itemById.get(itemId)!;
      setEntries([...entries, mode === 'count' ? { itemId, count: 1 } : { itemId, weightKg: +(item.unitMassG / 1000).toFixed(3) }]);
    }
  };
  const update = (idx: number, patch: Partial<AuditEntry>) => setEntries(entries.map((e, i) => (i === idx ? { ...e, ...patch } : e)));
  const remove = (idx: number) => setEntries(entries.filter((_, i) => i !== idx));

  const switchMode = (m: 'count' | 'weight') => {
    if (m === mode) return;
    setMode(m);
    setEntries(entries.map((e) => {
      const item = engine.itemById.get(e.itemId)!;
      return m === 'weight'
        ? { ...e, weightKg: +entryMassKg(engine, e).toFixed(3), count: undefined }
        : { ...e, count: Math.max(1, Math.round(entryMassKg(engine, e) / (item.unitMassG / 1000))), weightKg: undefined };
    }));
  };

  /** Apply every fix: drop wrong-bin items, rinse dirty ones, unbag bagged ones. */
  const applyFixes = () => {
    const wrong = new Set(result.lines.filter((l) => l.reason === 'wrong-bin').map((l) => l.entry.itemId));
    setEntries(entries.filter((e) => !wrong.has(e.itemId)).map((e) => ({ ...e, dirty: false, bagged: false })));
  };

  const save = () => {
    const a: SavedAudit = {
      id: `${Date.now()}`,
      savedAt: new Date().toISOString(),
      cityId,
      label: new Date().toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      entries,
      contaminationRate: result.contaminationRate,
      contaminantKg: result.contaminantKg,
      knownKg: result.knownKg,
      avoidedKgCO2e: result.avoidedKgCO2e,
    };
    const next = [...history, a];
    setHistory(next);
    const ok = saveAudits(next);
    setSavedMsg(ok ? 'Saved to this browser.' : 'Saved for this session (browser storage is unavailable).');
  };

  const t = trend(history, cityId);

  return (
    <div className="stack">
      <div>
        <h1>Audit your recycling bin</h1>
        <p className="lede">Tell SortLocal what’s in your <b>{rs.bins.recycling.label.toLowerCase()}</b>. It scores contamination with {rs.city.name}’s own rules, estimates the climate benefit, and tells you what to fix first.</p>
      </div>
      <div className="grid-2">
        <section className="card stack" aria-labelledby="bin-h">
          <div className="answer-head" style={{ marginBottom: 0 }}>
            <h2 id="bin-h">What’s in the bin?</h2>
            <div className="seg" role="group" aria-label="Measure by">
              <button aria-pressed={mode === 'count'} onClick={() => switchMode('count')}>Count</button>
              <button aria-pressed={mode === 'weight'} onClick={() => switchMode('weight')}>Weight (kg)</button>
            </div>
          </div>
          <ItemSearch items={engine.items} onSelect={(i) => add(i.id)} label="Add an item to the audit" placeholder="Add an item…" />
          <div className="chips" aria-label="Quick add">
            {QUICK.map((id) => <button key={id} className="chip" onClick={() => add(id)}>+ {engine.itemById.get(id)!.name}</button>)}
          </div>
          {entries.length === 0 ? (
            <div className="notice ok">Your bin is empty. Add items above, or <button className="link-btn" style={{ color: 'inherit' }} onClick={() => setEntries(SAMPLE_BIN)}>load an example bin</button>.</div>
          ) : (
            <div className="rows">
              {entries.map((e, idx) => {
                const item = engine.itemById.get(e.itemId)!;
                const line = result.lines.find((l) => l.entry === e);
                return (
                  <div key={e.itemId} className="row">
                    <div>
                      <div className="row-name">{item.name}</div>
                      <div className="small muted">
                        {line?.status === 'accepted' && <span className="tag ok">Accepted</span>}
                        {line?.status === 'contaminant' && <span className="tag warn">Contaminant</span>}
                        {line?.status === 'unknown' && <span className="tag">No official rule</span>}
                        {' '}{fmtKg(entryMassKg(engine, e))}
                      </div>
                    </div>
                    {mode === 'count' ? (
                      <div className="stepper">
                        <button aria-label={`One less ${item.name}`} onClick={() => (e.count ?? 1) <= 1 ? remove(idx) : update(idx, { count: (e.count ?? 1) - 1 })}>−</button>
                        <input aria-label={`${item.name} count`} inputMode="numeric" value={e.count ?? 0}
                          onChange={(ev) => update(idx, { count: Math.max(0, Math.min(9999, parseInt(ev.target.value || '0', 10) || 0)) })} />
                        <button aria-label={`One more ${item.name}`} onClick={() => update(idx, { count: (e.count ?? 0) + 1 })}>+</button>
                      </div>
                    ) : (
                      <div className="stepper">
                        <input aria-label={`${item.name} weight in kg`} inputMode="decimal" style={{ width: 90 }} value={e.weightKg ?? 0}
                          onChange={(ev) => { const v = parseFloat(ev.target.value); update(idx, { weightKg: Number.isFinite(v) && v >= 0 ? v : 0 }); }} />
                        <span style={{ padding: '0 10px' }} className="small muted">kg</span>
                      </div>
                    )}
                    <div className="row-flags">
                      <label className="toggle"><input type="checkbox" checked={!!e.dirty} onChange={(ev) => update(idx, { dirty: ev.target.checked })} />Dirty / not empty</label>
                      <label className="toggle"><input type="checkbox" checked={!!e.bagged} onChange={(ev) => update(idx, { bagged: ev.target.checked })} />In a plastic bag</label>
                      <button className="link-btn" onClick={() => remove(idx)} aria-label={`Remove ${item.name}`}>Remove</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <div className="btn-row">
            <button className="btn secondary" onClick={() => setEntries(SAMPLE_BIN)}>Load example bin</button>
            <button className="btn secondary" onClick={() => setEntries([])} disabled={!entries.length}>Clear</button>
          </div>
        </section>

        <section className="stack" aria-live="polite" aria-labelledby="res-h">
          <div className="card stack">
            <h2 id="res-h">Result for {rs.city.name}</h2>
            <Score result={result} />
            <div className="btn-row">
              <button className="btn" onClick={save} disabled={!result.knownKg}>Save audit</button>
              <button className="btn secondary" onClick={applyFixes} disabled={!result.fixes.length}>Apply all fixes</button>
            </div>
            {savedMsg && <p className="small muted" role="status" style={{ margin: 0 }}>{savedMsg}</p>}
          </div>
          {entries.length > 0 && (
            <div className="card">
              <h3>The same bin in each city</h3>
              <div className="city-compare">
                {others.map(({ city, r }) => (
                  <div key={city.id} className={city.id === cityId ? 'current' : ''}>
                    <span className="small">{city.name}</span>
                    <b>{r.knownKg ? fmtPct(r.contaminationRate) : '–'}</b>
                    <span className="small muted">contaminated</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {result.fixes.length > 0 && <Fixes fixes={result.fixes} />}
          <TrendCard points={t.points} change={t.change} cityName={rs.city.name} onClear={() => { const next = history.filter((h) => h.cityId !== cityId); setHistory(next); saveAudits(next); }} />
        </section>
      </div>
    </div>
  );
}

function Score({ result }: { result: AuditResult }) {
  if (!result.totalKg) return <p className="muted">Add items to see your contamination rate.</p>;
  const rate = result.contaminationRate;
  const color = rate === 0 ? 'var(--bin-compost)' : rate < 0.1 ? 'var(--bin-recycling)' : rate < 0.25 ? 'var(--bin-special)' : 'var(--bad)';
  return (
    <div className="stack">
      <div>
        <div className="big-num" style={{ color }}>{fmtPct(rate)}</div>
        <div className="muted">contamination by weight ({fmtKg(result.contaminantKg)} of {fmtKg(result.knownKg)})</div>
      </div>
      <div className="meter" role="img" aria-label={`${fmtPct(1 - rate)} accepted, ${fmtPct(rate)} contaminants`}>
        <span style={{ width: `${(1 - rate) * 100}%`, background: 'var(--bin-recycling)' }} />
        <span style={{ width: `${rate * 100}%`, background: color }} />
      </div>
      <div className="stat-grid">
        <div className="stat"><span className="small muted">Est. CO₂e avoided by what’s accepted</span><b>{result.avoidedKgCO2e.toFixed(2)} kg</b></div>
        <div className="stat"><span className="small muted">Extra if you make every fix</span><b>+{result.potentialKgCO2e.toFixed(2)} kg</b></div>
      </div>
      <p className="small muted" style={{ margin: 0 }}>
        Estimates: EPA WARM v16 factors vs. landfill, using typical item weights.
        {result.unfactoredKg > 0 && ` ${fmtKg(result.unfactoredKg)} of accepted film/foam has no WARM recycling factor and is not counted.`}
        {result.unknownKg > 0 && ` ${fmtKg(result.unknownKg)} has no official rule in this city and is excluded from the rate.`}
      </p>
    </div>
  );
}

function Fixes({ fixes }: { fixes: Fix[] }) {
  const sev = { critical: ['crit', 'Safety'], high: ['warn', 'High impact'], medium: ['', 'Fix'] } as const;
  return (
    <div className="card">
      <h3>Fix these first</h3>
      <ol className="fixes">
        {fixes.map((f) => (
          <li key={`${f.itemId}-${f.reason}`}>
            <b>{f.action}</b> <span className={`tag ${sev[f.severity][0]}`}>{sev[f.severity][1]}</span>
            <div className="small muted">{f.why} {fmtKg(f.massKg)}.</div>
            {f.citation && (
              <details>
                <summary>Why? Show the rule</summary>
                <CitationBlock citation={f.citation} label="Source" />
              </details>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}

function TrendCard({ points, change, cityName, onClear }: { points: SavedAudit[]; change?: number; cityName: string; onClear: () => void }) {
  if (points.length === 0) {
    return <div className="card"><h3>Your progress</h3><p className="small muted" style={{ margin: 0 }}>Save an audit, fix things, and save again to see your before/after trend for {cityName}. Audits stay in this browser only.</p></div>;
  }
  const W = 320, H = 120, P = 22;
  const xs = points.map((_, i) => (points.length === 1 ? W / 2 : P + (i * (W - 2 * P)) / (points.length - 1)));
  const ys = points.map((p) => H - P - p.contaminationRate * (H - 2 * P));
  const first = points[0], last = points[points.length - 1];
  return (
    <div className="card">
      <h3>Your progress in {cityName}</h3>
      {change !== undefined && (
        <p style={{ margin: '0 0 8px' }}>
          {change < 0 ? '↓' : change > 0 ? '↑' : '→'} <b>{fmtPct(first.contaminationRate)} → {fmtPct(last.contaminationRate)}</b>{' '}
          <span className="muted">({change <= 0 ? '' : '+'}{Math.round(change * 100)} pts over {points.length} audits)</span>
        </p>
      )}
      <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Contamination rate over ${points.length} saved audits`}>
        <line x1={P} x2={W - P} y1={H - P} y2={H - P} stroke="var(--border)" />
        <line x1={P} x2={W - P} y1={P} y2={P} stroke="var(--border)" strokeDasharray="3 3" />
        <text x={2} y={P + 4}>100%</text>
        <text x={8} y={H - P + 4}>0%</text>
        {points.length > 1 && <polyline fill="none" stroke="var(--accent)" strokeWidth="2.5" points={xs.map((x, i) => `${x},${ys[i]}`).join(' ')} />}
        {points.map((p, i) => (
          <g key={p.id}>
            <circle cx={xs[i]} cy={ys[i]} r="4.5" fill="var(--accent)"><title>{`${p.label}: ${fmtPct(p.contaminationRate)}`}</title></circle>
            <text x={xs[i]} y={ys[i] - 8} textAnchor="middle">{fmtPct(p.contaminationRate)}</text>
          </g>
        ))}
      </svg>
      <button className="link-btn" onClick={onClear}>Clear {cityName} history</button>
    </div>
  );
}

