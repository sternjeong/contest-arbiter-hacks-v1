// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import App from '../src/App';

// Smoke tests: render the real app in jsdom and click through the demo path.
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root;
let el: HTMLDivElement;

beforeEach(() => {
  window.matchMedia = window.matchMedia || ((q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {} }) as unknown as MediaQueryList);
  window.scrollTo = () => {};
  localStorage.clear();
  window.history.replaceState(null, '', '/');
  el = document.createElement('div');
  document.body.appendChild(el);
});
afterEach(() => { act(() => root.unmount()); el.remove(); });

const render = () => act(() => { root = createRoot(el); root.render(<App />); });
const click = (node: Element | null | undefined) => { if (!node) throw new Error('element not found'); act(() => { (node as HTMLElement).dispatchEvent(new MouseEvent('click', { bubbles: true })); }); };
const byText = (sel: string, text: string | RegExp) => [...el.querySelectorAll(sel)].find((n) => (typeof text === 'string' ? n.textContent?.trim() === text : text.test(n.textContent ?? '')));
const tab = (name: string) => click(byText('[role=tab]', name));

describe('app smoke test', () => {
  it('shows the 3-step tour on first visit and remembers dismissal', () => {
    render();
    expect(document.querySelector('[role=dialog]')?.textContent).toMatch(/Step 1 of 3/);
    click(byText('button', 'Next'));
    click(byText('button', 'Next'));
    expect(document.querySelector('[role=dialog]')?.textContent).toMatch(/Step 3 of 3/);
    click(byText('button', 'Show me the plastic bag'));
    expect(document.querySelector('[role=dialog]')).toBeNull();
    expect(el.querySelector('.banner')?.textContent).toMatch(/3 different answers/);
    expect(localStorage.getItem('sortlocal.tour.v1')).toBe('done');
  });

  it('looks up an item via a popular chip and shows a cited answer', () => {
    localStorage.setItem('sortlocal.tour.v1', 'done');
    render();
    click(byText('[role=group] button', 'Toronto'));
    click(byText('.chip', 'Disposable diaper'));
    const card = el.querySelector('article.card')!;
    expect(card.textContent).toMatch(/Green Bin/);
    expect(card.querySelector('blockquote.cite a')?.getAttribute('href')).toMatch(/toronto\.ca/);
    expect(el.textContent).toMatch(/Seattle/);
  });

  it('audits the example bin, applies fixes, and saves a trend', () => {
    localStorage.setItem('sortlocal.tour.v1', 'done');
    render();
    tab('Bin audit');
    click(byText('button', 'Load example bin'));
    const rate = () => el.querySelector('.big-num')?.textContent;
    expect(rate()).not.toBe('0%');
    expect(el.querySelectorAll('.fixes li').length).toBeGreaterThan(2);
    click(byText('button', 'Save audit'));
    click(byText('button', 'Apply all fixes'));
    expect(rate()).toBe('0%');
    click(byText('button', 'Save audit'));
    expect(el.textContent).toMatch(/→ 0%/);
    expect(JSON.parse(localStorage.getItem('sortlocal.audits.v1')!)).toHaveLength(2);
  });

  it('renders the sources page with every city', () => {
    localStorage.setItem('sortlocal.tour.v1', 'done');
    render();
    tab('Rules & sources');
    for (const c of ['San Francisco', 'Seattle', 'Toronto']) expect(el.textContent).toContain(c);
    expect(el.querySelectorAll('table.data tbody tr').length).toBeGreaterThan(10);
  });
});
