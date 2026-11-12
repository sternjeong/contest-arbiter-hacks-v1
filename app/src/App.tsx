import { useCallback, useEffect, useState } from 'react';
import { engine } from './engine/data';
import { readPref, writePref } from './engine/storage';
import { Audit } from './ui/Audit';
import { Compare } from './ui/Compare';
import { Lookup } from './ui/Lookup';
import { Sources } from './ui/Sources';
import { Tour } from './ui/Tour';

type Tab = 'lookup' | 'compare' | 'audit' | 'sources';
const TABS: { id: Tab; label: string }[] = [
  { id: 'lookup', label: 'Look up' },
  { id: 'compare', label: 'Compare cities' },
  { id: 'audit', label: 'Bin audit' },
  { id: 'sources', label: 'Rules & sources' },
];
type Theme = 'system' | 'light' | 'dark';

interface Route { tab: Tab; city: string; item?: string }

function parseHash(): Route {
  const p = new URLSearchParams(window.location.hash.replace(/^#\/?/, ''));
  const tab = (TABS.find((t) => t.id === p.get('tab'))?.id ?? 'lookup') as Tab;
  const city = engine.cityById.has(p.get('city') ?? '') ? p.get('city')! : readPref('sortlocal.city') ?? 'sf';
  const item = engine.itemById.has(p.get('item') ?? '') ? p.get('item')! : undefined;
  return { tab, city: engine.cityById.has(city) ? city : 'sf', item };
}

function toHash(r: Route) {
  const p = new URLSearchParams({ tab: r.tab, city: r.city });
  if (r.item) p.set('item', r.item);
  return `#${p.toString()}`;
}

export default function App() {
  const [route, setRoute] = useState<Route>(parseHash);
  const [theme, setTheme] = useState<Theme>(() => (readPref('sortlocal.theme') as Theme) || 'system');
  const [tour, setTour] = useState(() => readPref('sortlocal.tour.v1') !== 'done');

  const go = useCallback((patch: Partial<Route>) => {
    setRoute((r) => {
      const next = { ...r, ...patch };
      if (window.location.hash !== toHash(next)) window.history.pushState(null, '', toHash(next));
      return next;
    });
  }, []);

  useEffect(() => {
    const onPop = () => setRoute(parseHash());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
  useEffect(() => { writePref('sortlocal.city', route.city); }, [route.city]);
  useEffect(() => {
    if (theme === 'system') document.documentElement.removeAttribute('data-theme');
    else document.documentElement.setAttribute('data-theme', theme);
    writePref('sortlocal.theme', theme);
  }, [theme]);

  const finishTour = useCallback((demo: boolean) => {
    writePref('sortlocal.tour.v1', 'done');
    setTour(false);
    if (demo) go({ tab: 'compare', item: 'plastic-bag' });
  }, [go]);

  const nextTheme: Record<Theme, Theme> = { system: 'dark', dark: 'light', light: 'system' };
  const themeLabel: Record<Theme, string> = { system: 'Auto', dark: 'Dark', light: 'Light' };

  return (
    <>
      <a className="skip" href="#main">Skip to content</a>
      <header className="top">
        <div className="wrap">
          <div className="top-row">
            <div className="brand">
              <span className="brand-mark" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s-8-4.5-8-12a8 8 0 0 1 16 0c0 7.5-8 12-8 12Z" /><path d="m9 10 2 2 4-4" /></svg>
              </span>
              <span>SortLocal <small>recycling rules, by city</small></span>
            </div>
            <div className="seg" role="group" aria-label="Your city">
              {engine.cities.map((c) => (
                <button key={c.city.id} aria-pressed={route.city === c.city.id} onClick={() => go({ city: c.city.id })}>{c.city.name}</button>
              ))}
            </div>
            <button className="icon-btn" onClick={() => setTheme(nextTheme[theme])} aria-label={`Theme: ${themeLabel[theme]}. Switch to ${themeLabel[nextTheme[theme]]}`}>
              {theme === 'dark' ? '☾' : theme === 'light' ? '☀' : '◐'} <span className="small">{themeLabel[theme]}</span>
            </button>
            <button className="icon-btn" onClick={() => setTour(true)} aria-label="Show the guided tour">?</button>
          </div>
          <nav className="tabs" role="tablist" aria-label="Sections">
            {TABS.map((t) => (
              <button key={t.id} role="tab" aria-selected={route.tab === t.id} aria-controls="main" onClick={() => go({ tab: t.id })}>{t.label}</button>
            ))}
          </nav>
        </div>
      </header>
      <main id="main" className="wrap" role="tabpanel" tabIndex={-1}>
        {route.tab === 'lookup' && <Lookup cityId={route.city} itemId={route.item} onItem={(item) => go({ item })} onCompare={(item) => go({ tab: 'compare', item })} />}
        {route.tab === 'compare' && <Compare itemId={route.item ?? 'plastic-bag'} onItem={(item) => go({ item })} onLookup={(city, item) => go({ tab: 'lookup', city, item })} />}
        {route.tab === 'audit' && <Audit cityId={route.city} />}
        {route.tab === 'sources' && <Sources />}
      </main>
      <footer className="site">
        <div className="wrap">
          SortLocal answers come from the official guides of San Francisco (SF Environment / Recology), Seattle (Seattle Public Utilities) and Toronto (City of Toronto Waste Wizard), archived {engine.cities[0].retrieved}.
          Rules change. Always defer to your city. Climate figures are estimates from EPA WARM v16. Not affiliated with any city.
        </div>
      </footer>
      {tour && <Tour cityId={route.city} onCity={(city) => go({ city })} onFinish={finishTour} />}
    </>
  );
}
