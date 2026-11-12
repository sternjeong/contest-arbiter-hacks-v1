import { engine, warm } from '../engine/data';
import { BINS } from '../engine/types';
import { BinBadge } from './common';

export function Sources() {
  const total = engine.cities.reduce((a, c) => a + c.rules.length, 0);
  return (
    <div className="stack">
      <div>
        <h1>Rules as code, with receipts</h1>
        <p className="lede">
          Each city’s official guide is compiled into a JSON ruleset ({total} rules over {engine.items.length} items). Every rule carries the source URL, section and a verbatim quote.
          A build step checks each quote against an archived copy of the source, and anything we couldn’t confirm is marked <span className="tag warn">Unverified</span>.
        </p>
      </div>
      <div className="grid-3">
        {engine.cities.map((rs) => {
          const unverified = rs.rules.filter((r) => !r.verified);
          const byBin = BINS.map((b) => [b, rs.rules.filter((r) => r.bin === b).length] as const);
          return (
            <article key={rs.city.id} className="card stack">
              <div>
                <h2 style={{ marginBottom: 2 }}>{rs.city.flag} {rs.city.name}</h2>
                <div className="small muted">{rs.city.authority}</div>
              </div>
              <div className="chips">
                {byBin.map(([b, n]) => <BinBadge key={b} bin={b} label={`${rs.bins[b].short} · ${n}`} size="sm" />)}
              </div>
              <div>
                <h3>Sources (retrieved {rs.retrieved})</h3>
                <ul className="small" style={{ paddingLeft: 18, margin: 0 }}>
                  {rs.sources.map((s) => <li key={s.id}><a href={s.url} target="_blank" rel="noreferrer">{s.title}</a></li>)}
                </ul>
              </div>
              {rs.general.length > 0 && (
                <div>
                  <h3>City-wide rules</h3>
                  <ul className="small" style={{ paddingLeft: 18, margin: 0 }}>
                    {rs.general.map((g) => <li key={g.id}>{g.text} <a href={g.citation.url} target="_blank" rel="noreferrer">source</a></li>)}
                  </ul>
                </div>
              )}
              <div>
                <h3>Unverified ({unverified.length})</h3>
                {unverified.length === 0 ? <p className="small muted" style={{ margin: 0 }}>Every rule maps to an explicit entry in the official source.</p> : (
                  <ul className="small" style={{ paddingLeft: 18, margin: 0 }}>
                    {unverified.map((r) => <li key={r.itemId}><b>{engine.itemById.get(r.itemId)!.name}:</b> {r.note}</li>)}
                  </ul>
                )}
              </div>
              {rs.notes?.map((n) => <p key={n} className="notice small" style={{ margin: 0 }}>{n}</p>)}
            </article>
          );
        })}
      </div>

      <section className="card">
        <h2>How the climate estimate works</h2>
        <p className="small">
          Avoided emissions = mass × (landfill factor − recycling factor), using the {warm.publisher}’s {warm.version} net emission factors (MTCO₂e per short ton).
          For items that belong in compost, the compost factor is used instead. {warm.disclaimer}
        </p>
        <div className="table-wrap">
          <table className="data">
            <thead><tr><th>Material</th><th>Recycling</th><th>Composting</th><th>Landfill</th><th>Source</th></tr></thead>
            <tbody>
              {Object.entries(warm.factors).map(([k, f]) => (
                <tr key={k}>
                  <td>{f.label}</td>
                  <td>{f.recycling ?? 'n/a'}</td>
                  <td>{f.compost ?? 'n/a'}</td>
                  <td>{f.landfill}</td>
                  <td><a href={warm.sources.find((s) => s.id === f.source)!.url} target="_blank" rel="noreferrer">{f.exhibit}</a></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card">
        <h2>Add your city</h2>
        <ol className="small" style={{ paddingLeft: 18, margin: 0 }}>
          <li>Paste your city’s official guide into a text file.</li>
          <li>Run <code>npm run rules:compile -- --city "Your City" --url https://… guide.txt</code>. With <code>ANTHROPIC_API_KEY</code> set, Claude drafts a ruleset against the shared item catalog; every quote must appear in your pasted text or the rule is dropped.</li>
          <li>Run <code>npm run rules:validate</code>, review anything marked unverified, and open a pull request.</li>
        </ol>
        <p className="small muted">The app itself never calls an AI model: answers are deterministic lookups in reviewed JSON.</p>
      </section>
    </div>
  );
}
