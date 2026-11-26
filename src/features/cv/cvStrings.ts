import type { Content } from '@/content/types';

/** Fallback copy, kept identical to the content files' own `ui.cv`, so the page still
 *  reads correctly if a key is ever missing. */
const FALLBACK = {
  title: 'Curriculum vitae',
  updated: 'Last updated Nov 2026',
  docLang: 'In English',
  fileInfo: 'PDF · 70 KB',
  back: 'Back to portfolio',
  download: 'Download CV',
  downloadShort: 'Download CV',
  print: 'Print',
  printing: 'Preparing to print…',
  fullscreen: 'Full screen',
  exitFullscreen: 'Exit full screen',
  zoomIn: 'Zoom in',
  zoomOut: 'Zoom out',
  fitWidth: 'Fit width',
  resetZoom: 'Reset zoom',
  zoomLevel: 'Zoom level',
  prev: 'Previous page',
  next: 'Next page',
  page: 'Page {n} of {total}',
  pageShort: '{n} / {total}',
  toolbar: 'Document controls',
  viewer: 'CV document',
  link: 'Link in the CV: {url}',
  loading: 'Loading the CV…',
  loaded: 'CV loaded, {total} pages.',
  loadedOne: 'CV loaded, 1 page.',
  error: "The CV couldn't be displayed here.",
  errorBody: 'The connection may have dropped. Try again, or download the PDF.',
  retry: 'Try again',
  unsupported: "This browser can't show the CV inside the page. You can download it or open the PDF directly.",
  openPdf: 'Open PDF',
  shortcuts: 'Shortcuts: + and − zoom, 0 fits the width, ← and → change page.',
} as const;

export type CvStrings = typeof FALLBACK & Record<string, string>;

export const cvStrings = (content: Content): CvStrings => ({
  ...FALLBACK,
  ...(content.ui.cv ?? {}),
});

/** `Page {n} of {total}` with the numbers filled in. */
export const format = (template: string, values: Record<string, string | number>): string =>
  template.replace(/\{(\w+)\}/g, (match, key: string) => (key in values ? String(values[key]) : match));
