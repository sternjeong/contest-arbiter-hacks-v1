import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { Bin, Citation, Item } from '../engine/types';
import { searchItems } from '../engine/search';

export function BinIcon({ bin, size = 18 }: { bin: Bin | 'none'; size?: number }) {
  const p = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true };
  switch (bin) {
    case 'recycling':
      return <svg {...p}><path d="M7 19H4.8a1.8 1.8 0 0 1-1.6-2.7L5.5 12" /><path d="M11 19h8.2a1.8 1.8 0 0 0 1.6-2.7L19.2 14" /><path d="m14 16-3 3 3 3" /><path d="M8.3 6.3 9.6 4a1.8 1.8 0 0 1 3.1 0l3.4 5.9" /><path d="m13.5 9.9 2.6 0 .9-3" /><path d="m2.6 9.6 2.9 2.4 2.6-1.6" /></svg>;
    case 'compost':
      return <svg {...p}><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.5 19 2c1 2 2 4.2 2 8 0 5.5-4.8 10-10 10Z" /><path d="M2 21c0-3 1.9-5.4 5.1-6" /></svg>;
    case 'garbage':
      return <svg {...p}><path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="M19 6l-1 14H6L5 6" /></svg>;
    case 'special':
      return <svg {...p}><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" /><path d="M12 9v4" /><path d="M12 17h.01" /></svg>;
    case 'reuse':
      return <svg {...p}><path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7Z" /></svg>;
    default:
      return <svg {...p}><circle cx="12" cy="12" r="9" /><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3" /><path d="M12 17h.01" /></svg>;
  }
}

export function BinBadge({ bin, label, size = 'md' }: { bin: Bin | 'none'; label: string; size?: 'sm' | 'md' | 'lg' }) {
  return (
    <span className={`bin ${bin} ${size === 'md' ? '' : size}`}>
      <BinIcon bin={bin} size={size === 'lg' ? 22 : size === 'sm' ? 14 : 18} />
      {label}
    </span>
  );
}

export function CitationBlock({ citation, label = 'Official source' }: { citation: Citation; label?: string }) {
  return (
    <blockquote className="cite">
      <p>“{citation.quote}”</p>
      <footer>
        {label}: <a href={citation.url} target="_blank" rel="noreferrer">{citation.section}</a>
      </footer>
    </blockquote>
  );
}

/** Accessible combobox for item search (WAI-ARIA 1.2 pattern). */
export function ItemSearch({ items, onSelect, label = 'Search an item', placeholder = 'Try “pizza box”, “styrofoam”, “batteries”…', autoFocus = false }: {
  items: Item[];
  onSelect: (item: Item) => void;
  label?: string;
  placeholder?: string;
  autoFocus?: boolean;
}) {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const hits = useMemo(() => searchItems(items, q, 8), [items, q]);

  useEffect(() => { if (autoFocus && window.matchMedia('(min-width: 820px)').matches) inputRef.current?.focus(); }, [autoFocus]);

  const choose = (item: Item) => {
    onSelect(item);
    setQ('');
    setOpen(false);
  };

  return (
    <div className="search">
      <label htmlFor={`${id}-input`} className="sr-only">{label}</label>
      <svg className="glass" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
      <input
        ref={inputRef}
        id={`${id}-input`}
        type="search"
        role="combobox"
        aria-expanded={open && q.length > 0}
        aria-controls={`${id}-list`}
        aria-autocomplete="list"
        aria-activedescendant={open && hits[active] ? `${id}-opt-${active}` : undefined}
        autoComplete="off"
        placeholder={placeholder}
        value={q}
        onChange={(e) => { setQ(e.target.value); setOpen(true); setActive(0); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setActive((a) => Math.min(a + 1, hits.length - 1)); }
          else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
          else if (e.key === 'Enter' && hits[active]) { e.preventDefault(); choose(hits[active].item); }
          else if (e.key === 'Escape') { setOpen(false); }
        }}
      />
      {open && q.length > 0 && (
        <ul id={`${id}-list`} role="listbox" className="listbox" aria-label="Matching items">
          {hits.length === 0 && <li className="empty-hint" role="option" aria-disabled="true" aria-selected="false">No match in the catalog. Try a simpler word (“bag”, “cup”, “can”).</li>}
          {hits.map((h, i) => (
            <li
              key={h.item.id}
              id={`${id}-opt-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => { e.preventDefault(); choose(h.item); }}
              onMouseEnter={() => setActive(i)}
            >
              <span>{h.item.name}</span>
              {h.matched !== h.item.name && <span className="hint">“{h.matched}”</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export const fmtPct = (x: number) => `${Math.round(x * 100)}%`;
export const fmtKg = (kg: number) => (kg < 1 ? `${Math.round(kg * 1000)} g` : `${kg.toFixed(kg < 10 ? 2 : 1)} kg`);
