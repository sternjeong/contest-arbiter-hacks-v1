import { useEffect, useRef, useState } from 'react';
import { engine } from '../engine/data';
import { BinBadge } from './common';

export function Tour({ cityId, onCity, onFinish }: { cityId: string; onCity: (id: string) => void; onFinish: (goDemo: boolean) => void }) {
  const [step, setStep] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    ref.current?.querySelector<HTMLElement>('button')?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onFinish(false);
      if (e.key === 'Tab' && ref.current) {
        const f = [...ref.current.querySelectorAll<HTMLElement>('button, a[href]')];
        if (!f.length) return;
        if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); prev?.focus?.(); };
  }, [onFinish]);

  const bag = (id: string) => {
    const r = engine.ruleIndex.get(id)!.get('plastic-bag')!;
    return <BinBadge bin={r.bin} label={`${engine.cityById.get(id)!.city.name}: ${engine.cityById.get(id)!.bins[r.bin].short}`} size="sm" />;
  };

  const steps = [
    {
      title: 'Recycling rules are local',
      body: <>
        <p>A plastic grocery bag goes to three different places in three cities. Generic advice gets this wrong, and wrong items contaminate whole loads.</p>
        <div className="tour-art">{bag('sf')}{bag('seattle')}{bag('toronto')}</div>
        <p className="small muted">Pick your city (you can change it any time at the top):</p>
        <div className="seg" role="group" aria-label="City">
          {engine.cities.map((c) => <button key={c.city.id} aria-pressed={cityId === c.city.id} onClick={() => onCity(c.city.id)}>{c.city.name}</button>)}
        </div>
      </>,
    },
    {
      title: 'Look up any item, with receipts',
      body: <>
        <p>Search 100 everyday items. You get the bin, the prep steps (“remove lid”, “flatten”), and a <b>verbatim quote from the city’s official guide</b> with a link.</p>
        <p className="small muted">If the guide doesn’t cover something, SortLocal says so instead of guessing. No AI model is involved in answers.</p>
      </>,
    },
    {
      title: 'Compare cities and audit your bin',
      body: <>
        <p><b>Compare</b> shows where cities disagree. <b>Bin audit</b> scores your recycling contamination by your city’s rules, estimates CO₂e (EPA WARM), and ranks fixes. Save audits to track before/after.</p>
      </>,
    },
  ];
  const s = steps[step];
  return (
    <div className="overlay" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) onFinish(false); }}>
      <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="tour-title" ref={ref}>
        <div className="dots" aria-hidden="true">{steps.map((_, i) => <span key={i} className={i <= step ? 'on' : ''} />)}</div>
        <p className="small muted" style={{ margin: 0 }}>Step {step + 1} of {steps.length}</p>
        <h2 id="tour-title">{s.title}</h2>
        {s.body}
        <div className="btn-row" style={{ justifyContent: 'space-between', marginTop: 16 }}>
          <button className="link-btn" onClick={() => onFinish(false)}>Skip</button>
          <div className="btn-row">
            {step > 0 && <button className="btn secondary" onClick={() => setStep(step - 1)}>Back</button>}
            {step < steps.length - 1
              ? <button className="btn" onClick={() => setStep(step + 1)}>Next</button>
              : <button className="btn" onClick={() => onFinish(true)}>Show me the plastic bag</button>}
          </div>
        </div>
      </div>
    </div>
  );
}
