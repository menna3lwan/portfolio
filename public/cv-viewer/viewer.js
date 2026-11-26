// CV viewer core. Renders the real PDF with PDF.js into canvases (+ a transparent text layer for
// selection, find-in-page and screen readers, + real <a> elements for the PDF's link annotations).
//
// Protocol (same-origin postMessage only):
//   host -> viewer  { source: 'cv-host', cmd, ... }
//     cmd: zoomIn | zoomOut | fitWidth | auto | setScale{value} | goto{page} | next | prev |
//          print | theme{value:'light'|'dark'} | dir{value:'ltr'|'rtl'} |
//          labels{region, page:'… {n} … {total}', link} | focus
//   viewer -> host  { source: 'cv-viewer', type, ... }
//     type: hello | progress{loaded,total} | state{status,page,total,scale,percent,mode,canZoomIn,canZoomOut} |
//           printing{value} | error{reason} | unsupported
// URL parameters: src (same-origin PDF URL, required), theme, dir.
import * as pdfjs from './vendor/pdfjs/pdf.min.js';

const CSS_UNITS = 96 / 72;            // PDF points -> CSS px at 100 %
const MIN_SCALE = 0.25, MAX_SCALE = 4;
const STEPS = [0.25, 0.33, 0.5, 0.67, 0.75, 0.8, 0.9, 1, 1.1, 1.25, 1.5, 1.75, 2, 2.5, 3, 4];
const AUTO_MAX = 1;                   // "auto" = fit width, but never larger than 100 %
const MAX_CANVAS_PIXELS = 16e6;       // iOS Safari refuses canvases above ~16.7M pixels
const PRINT_SCALE = 150 / 72;         // 150 dpi page images for printing

const params = new URLSearchParams(location.search);
const embedded = window.parent !== window;
const $scroller = document.getElementById('scroller');
const $pages = document.getElementById('pages');
const $print = document.getElementById('print');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');

const state = { doc: null, pages: [], scale: 1, mode: 'auto', current: 1, status: 'loading', laidOut: false };
let labels = { region: 'CV', page: 'Page {n} of {total}', link: '{url}' };
let renderTimer = 0, scrollRaf = 0, printing = false;

const clamp = s => Math.min(MAX_SCALE, Math.max(MIN_SCALE, s));
const fmt = (t, n, total) => t.replace('{n}', n).replace('{total}', total);
function post(msg) {
  if (embedded) window.parent.postMessage({ source: 'cv-viewer', ...msg }, location.origin);
}
function postState() {
  post({
    type: 'state', status: state.status, page: state.current, total: state.pages.length,
    scale: state.scale, percent: Math.round(state.scale * 100), mode: state.mode,
    canZoomIn: state.scale < MAX_SCALE - 1e-3, canZoomOut: state.scale > MIN_SCALE + 1e-3,
  });
}

const WORKER_URL = new URL('./vendor/pdfjs/pdf.worker.min.js', import.meta.url).href;
pdfjs.GlobalWorkerOptions.workerSrc = WORKER_URL;

/**
 * Point the worker at a blob built from a base64 copy, used only where the host cannot serve
 * the worker as a .js file (the minified worker carries raw control bytes in its string
 * literals, which some static hosts reject). Served normally — the local prototype, and the
 * Flutter build — this never runs: the HEAD below succeeds and the worker loads as usual.
 */
async function ensureWorker() {
  try {
    const r = await fetch(WORKER_URL, { method: 'HEAD' });
    if (r.ok) return;
  } catch { /* fall through to the base64 copy */ }
  const r = await fetch(WORKER_URL + '.b64');
  if (!r.ok) return; // leave workerSrc as-is; PDF.js reports the failure through the normal error path
  const bin = Uint8Array.from(atob((await r.text()).replace(/\s+/g, '')), ch => ch.charCodeAt(0));
  pdfjs.GlobalWorkerOptions.workerSrc =
    URL.createObjectURL(new Blob([bin], { type: 'text/javascript' }));
}

function resolveSrc() {
  const raw = params.get('src');
  if (!raw) throw Object.assign(new Error('Missing src'), { reason: 'nosrc' });
  const url = new URL(raw, location.href);
  // Only documents from this site: the viewer must not become an open viewer for other origins.
  if (url.origin !== location.origin) throw Object.assign(new Error('Cross-origin src'), { reason: 'origin' });
  return url.href;
}

// ---------------------------------------------------------------- loading
async function load() {
  post({ type: 'hello' });
  try {
    await ensureWorker();
    // verbosity ERRORS: PDF.js otherwise logs harmless font-hinting warnings ("TT: undefined function").
    const task = pdfjs.getDocument({ url: resolveSrc(), isEvalSupported: false, enableXfa: false, verbosity: pdfjs.VerbosityLevel.ERRORS });
    task.onProgress = ({ loaded, total }) => post({ type: 'progress', loaded, total });
    const doc = await task.promise;
    state.doc = doc;
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const vp = page.getViewport({ scale: 1 });
      const el = document.createElement('div');
      el.className = 'page';
      el.setAttribute('role', 'group');
      el.dataset.n = String(i);
      state.pages.push({ n: i, page, w: vp.width, h: vp.height, el, canvas: null, task: null, text: false });
    }
    $pages.replaceChildren(...state.pages.map(p => p.el));
    applyLabels();
    state.scale = targetScale('auto');
    layout();
    state.laidOut = true;
    await Promise.all(state.pages.map(renderPage));
    state.status = 'ready';
    postState();
    state.pages.forEach(p => { addTextLayer(p); addLinks(p); });
  } catch (err) {
    state.status = 'error';
    console.warn('[cv-viewer]', err && err.message);
    post({ type: 'error', reason: (err && (err.reason || err.name)) || 'load' });
    if (!embedded) $pages.textContent = 'The CV could not be displayed.';
  }
}

// ---------------------------------------------------------------- scale + layout
function padX() { return parseFloat(getComputedStyle($pages).paddingLeft) || 0; }
function fitScale() {
  if (!state.pages.length) return 1;
  const avail = Math.max(120, $scroller.clientWidth - 2 * padX());
  const widest = Math.max(...state.pages.map(p => p.w));
  return clamp(Math.floor((avail / (widest * CSS_UNITS)) * 1000) / 1000);
}
function targetScale(mode) {
  if (mode === 'fit') return fitScale();
  if (mode === 'auto') return Math.min(fitScale(), AUTO_MAX);
  return state.scale;
}
function layout() {
  const f = state.scale * CSS_UNITS;
  for (const p of state.pages) {
    p.el.style.width = Math.floor(p.w * f) + 'px';
    p.el.style.height = Math.floor(p.h * f) + 'px';
    p.el.style.setProperty('--total-scale-factor', String(f));
  }
}
// Keeps the document point under `anchor` (scroller client coords) in place while resizing.
function setScale(next, mode, anchor) {
  next = clamp(next);
  state.mode = mode;
  if (Math.abs(next - state.scale) < 1e-4) { postState(); return; }
  const box = $scroller.getBoundingClientRect();
  const ax = anchor ? anchor.x : $scroller.clientWidth / 2;
  const ay = anchor ? anchor.y : $scroller.clientHeight / 3;
  let hit = null;
  for (const p of state.pages) {
    const b = p.el.getBoundingClientRect();
    hit = { p, fx: (box.left + ax - b.left) / b.width, fy: (box.top + ay - b.top) / b.height };
    if (box.top + ay <= b.bottom) break;
  }
  state.scale = next;
  layout();
  if (hit) {
    const b = hit.p.el.getBoundingClientRect();
    $scroller.scrollLeft += b.left + hit.fx * b.width - (box.left + ax);
    $scroller.scrollTop += b.top + hit.fy * b.height - (box.top + ay);
  }
  scheduleRender();
  updateCurrent();
  postState();
}
function zoomIn(anchor) { setScale(STEPS.find(s => s > state.scale * 1.04) || MAX_SCALE, 'custom', anchor); }
function zoomOut(anchor) { setScale([...STEPS].reverse().find(s => s < state.scale / 1.04) || MIN_SCALE, 'custom', anchor); }

// ---------------------------------------------------------------- rendering
function scheduleRender() {
  clearTimeout(renderTimer);
  renderTimer = setTimeout(() => state.pages.forEach(renderPage), 140);
}
async function renderPage(p) {
  const vp = p.page.getViewport({ scale: state.scale * CSS_UNITS });
  let out = Math.min(window.devicePixelRatio || 1, 3);
  if (vp.width * vp.height * out * out > MAX_CANVAS_PIXELS) out = Math.sqrt(MAX_CANVAS_PIXELS / (vp.width * vp.height));
  if (p.task) p.task.cancel();
  const canvas = document.createElement('canvas');
  canvas.width = Math.floor(vp.width * out);
  canvas.height = Math.floor(vp.height * out);
  canvas.setAttribute('aria-hidden', 'true');
  const task = p.page.render({ canvas, viewport: vp, transform: out !== 1 ? [out, 0, 0, out, 0, 0] : undefined });
  p.task = task;
  try {
    await task.promise;
  } catch (err) {
    if (err instanceof pdfjs.RenderingCancelledException || (err && err.name === 'RenderingCancelledException')) return;
    throw err;
  } finally {
    if (p.task === task) p.task = null;
  }
  // Double-buffered swap: the old bitmap stays visible (stretched) until the sharp one is ready.
  if (p.canvas) p.canvas.replaceWith(canvas); else p.el.prepend(canvas);
  p.canvas = canvas;
}
async function addTextLayer(p) {
  if (p.text) return;
  p.text = true;
  try {
    const div = document.createElement('div');
    div.className = 'textLayer';
    p.el.append(div);
    const layer = new pdfjs.TextLayer({ textContentSource: p.page.streamTextContent(), container: div, viewport: p.page.getViewport({ scale: CSS_UNITS }) });
    await layer.render();
  } catch (err) { console.warn('[cv-viewer] text layer', err && err.message); }
}
async function addLinks(p) {
  try {
    const annots = await p.page.getAnnotations({ intent: 'display' });
    const vp = p.page.getViewport({ scale: 1 });
    const wrap = document.createElement('div');
    wrap.className = 'links';
    for (const a of annots) {
      if (a.subtype !== 'Link' || !a.url) continue;
      let url;
      try { url = new URL(a.url); } catch (e) { continue; }
      if (!/^(https?|mailto):$/.test(url.protocol)) continue;
      const [x1, y1] = vp.convertToViewportPoint(a.rect[0], a.rect[1]);
      const [x2, y2] = vp.convertToViewportPoint(a.rect[2], a.rect[3]);
      const el = document.createElement('a');
      el.href = url.href;
      if (url.protocol !== 'mailto:') { el.target = '_blank'; el.rel = 'noopener noreferrer'; }
      const shown = url.protocol === 'mailto:' ? url.pathname : (url.host + url.pathname).replace(/\/$/, '');
      el.setAttribute('aria-label', labels.link.replace('{url}', shown));
      el.title = shown;
      Object.assign(el.style, {
        left: (Math.min(x1, x2) / vp.width) * 100 + '%', top: (Math.min(y1, y2) / vp.height) * 100 + '%',
        width: (Math.abs(x2 - x1) / vp.width) * 100 + '%', height: (Math.abs(y2 - y1) / vp.height) * 100 + '%',
      });
      wrap.append(el);
    }
    if (wrap.childElementCount) p.el.append(wrap);
  } catch (err) { console.warn('[cv-viewer] links', err && err.message); }
}

// ---------------------------------------------------------------- pages + scrolling
function updateCurrent() {
  if (!state.pages.length) return;
  const max = $scroller.scrollHeight - $scroller.clientHeight;
  let n = 1;
  if ($scroller.scrollTop >= max - 2 && max > 0) n = state.pages.length;
  else {
    const mid = $scroller.scrollTop + $scroller.clientHeight / 2;
    for (const p of state.pages) if (p.el.offsetTop <= mid) n = p.n;
  }
  if (n !== state.current) { state.current = n; postState(); }
}
function goto(n) {
  const p = state.pages[Math.min(state.pages.length, Math.max(1, n)) - 1];
  if (!p) return;
  // Never scrollIntoView: it would also scroll the host page around the iframe.
  $scroller.scrollTo({ top: p.el.offsetTop - padX(), behavior: reduced.matches ? 'auto' : 'smooth' });
}
$scroller.addEventListener('scroll', () => {
  if (!scrollRaf) scrollRaf = requestAnimationFrame(() => { scrollRaf = 0; updateCurrent(); });
}, { passive: true });

// ---------------------------------------------------------------- input: keys, ctrl+wheel, pinch
function isRtl() { return document.documentElement.dir === 'rtl'; }
document.addEventListener('keydown', e => {
  if (e.altKey || state.status !== 'ready') return;
  const mod = e.ctrlKey || e.metaKey;
  let handled = true;
  switch (e.key) {
    case '+': case '=': zoomIn(); break;
    case '-': case '_': zoomOut(); break;
    case '0': setScale(targetScale('fit'), 'fit'); break;
    case 'ArrowRight': if (mod) { handled = false; break; } goto(state.current + (isRtl() ? -1 : 1)); break;
    case 'ArrowLeft': if (mod) { handled = false; break; } goto(state.current + (isRtl() ? 1 : -1)); break;
    case 'p': case 'P': if (mod) doPrint(); else handled = false; break;
    default: handled = false;
  }
  if (handled) e.preventDefault();
});
$scroller.addEventListener('wheel', e => {
  if (!e.ctrlKey || state.status !== 'ready') return;  // trackpad pinch arrives as ctrl+wheel
  e.preventDefault();
  const box = $scroller.getBoundingClientRect();
  const d = Math.max(-60, Math.min(60, -e.deltaY));
  setScale(state.scale * Math.exp(d * 0.005), 'custom', { x: e.clientX - box.left, y: e.clientY - box.top });
}, { passive: false });
let pinch = null;
const dist = t => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
$scroller.addEventListener('touchstart', e => {
  if (e.touches.length !== 2 || state.status !== 'ready') return;
  const box = $scroller.getBoundingClientRect();
  pinch = { d0: dist(e.touches), s0: state.scale, raf: 0,
    anchor: { x: (e.touches[0].clientX + e.touches[1].clientX) / 2 - box.left, y: (e.touches[0].clientY + e.touches[1].clientY) / 2 - box.top } };
}, { passive: true });
$scroller.addEventListener('touchmove', e => {
  if (!pinch || e.touches.length !== 2) return;
  e.preventDefault();
  const next = pinch.s0 * dist(e.touches) / pinch.d0;
  if (!pinch.raf) pinch.raf = requestAnimationFrame(() => { if (pinch) { pinch.raf = 0; setScale(next, 'custom', pinch.anchor); } });
}, { passive: false });
$scroller.addEventListener('touchend', e => { if (e.touches.length < 2) pinch = null; });
// Safari: stop its own page-level pinch gesture inside the viewer.
document.addEventListener('gesturestart', e => e.preventDefault());

new ResizeObserver(() => {
  if (!state.laidOut) return;
  if (state.mode !== 'custom') setScale(targetScale(state.mode), state.mode, { x: 0, y: 0 });
  updateCurrent();
}).observe($scroller);

// ---------------------------------------------------------------- print
async function doPrint() {
  if (!state.doc || printing) return;
  printing = true;
  post({ type: 'printing', value: true });
  const urls = [];
  try {
    const imgs = [];
    for (const p of state.pages) {
      const vp = p.page.getViewport({ scale: PRINT_SCALE });
      const c = document.createElement('canvas');
      c.width = Math.floor(vp.width); c.height = Math.floor(vp.height);
      await p.page.render({ canvas: c, viewport: vp, intent: 'print' }).promise;
      const blob = await new Promise(r => c.toBlob(r, 'image/png'));
      const url = URL.createObjectURL(blob);
      urls.push(url);
      const img = new Image();
      img.alt = '';
      img.src = url;
      await img.decode().catch(() => {});
      imgs.push(img);
    }
    $print.replaceChildren(...imgs);
    window.focus();
    window.print();
  } catch (err) {
    console.warn('[cv-viewer] print', err && err.message);
    post({ type: 'error', reason: 'print', fatal: false });
  } finally {
    printing = false;
    post({ type: 'printing', value: false });
    // window.print() blocks in most browsers; keep the images briefly for those that print async.
    setTimeout(() => { $print.replaceChildren(); urls.forEach(u => URL.revokeObjectURL(u)); }, 60000);
  }
}

// ---------------------------------------------------------------- host commands
function applyLabels() {
  $scroller.setAttribute('aria-label', labels.region);
  for (const p of state.pages) p.el.setAttribute('aria-label', fmt(labels.page, p.n, state.pages.length));
}
window.addEventListener('message', e => {
  if (e.origin !== location.origin || e.source !== window.parent) return;
  const m = e.data;
  if (!m || m.source !== 'cv-host') return;
  const ready = state.status === 'ready';
  switch (m.cmd) {
    case 'zoomIn': if (ready) zoomIn(); break;
    case 'zoomOut': if (ready) zoomOut(); break;
    case 'fitWidth': if (ready) setScale(targetScale('fit'), 'fit'); break;
    case 'auto': if (ready) setScale(targetScale('auto'), 'auto'); break;
    case 'setScale': if (ready && typeof m.value === 'number') setScale(m.value, 'custom'); break;
    case 'goto': if (ready) goto(Number(m.page) || 1); break;
    case 'next': if (ready) goto(state.current + 1); break;
    case 'prev': if (ready) goto(state.current - 1); break;
    case 'print': doPrint(); break;
    case 'theme': if (m.value === 'dark' || m.value === 'light') document.documentElement.dataset.theme = m.value; break;
    case 'dir': document.documentElement.dir = m.value === 'rtl' ? 'rtl' : 'ltr'; break;
    case 'labels': labels = { ...labels, ...m.value }; applyLabels(); break;
    case 'focus': $scroller.focus({ preventScroll: true }); break;
    case 'state': postState(); break;
  }
});

load();
