import { useEffect } from 'react';
import { absoluteUrl, HAS_SITE_URL } from '@/site.config';
import type { Language } from '@/content/types';

export interface DocumentMeta {
  title: string;
  description: string;
  /** The route's own path, used for the canonical URL and `og:url`. */
  path: string;
  lang: Language;
}

const upsert = (selector: string, make: () => HTMLElement, apply: (el: HTMLElement) => void) => {
  let el = document.head.querySelector<HTMLElement>(selector);
  if (!el) {
    el = make();
    document.head.appendChild(el);
  }
  apply(el);
};

const meta = (key: 'name' | 'property', value: string, content: string) =>
  upsert(
    `meta[${key}="${value}"]`,
    () => {
      const el = document.createElement('meta');
      el.setAttribute(key, value);
      return el;
    },
    (el) => el.setAttribute('content', content),
  );

const linkRel = (rel: string, href: string, extra?: Record<string, string>) =>
  upsert(
    `link[rel="${rel}"]${extra?.hreflang ? `[hreflang="${extra.hreflang}"]` : ''}`,
    () => {
      const el = document.createElement('link');
      el.setAttribute('rel', rel);
      if (extra) for (const [k, v] of Object.entries(extra)) el.setAttribute(k, v);
      return el;
    },
    (el) => el.setAttribute('href', href),
  );

/**
 * Per-route title, description, canonical URL and social tags.
 *
 * The static HTML emitted at build time already carries the correct head for each route,
 * which is what the social scrapers read — they do not run JavaScript. This keeps the
 * head correct afterwards, as the visitor moves between routes and switches language,
 * which is what a search crawler (which does run JavaScript) and the browser tab see.
 *
 * Nothing is written when the site URL has not been configured: a canonical pointing at
 * a guessed domain is worse than no canonical at all.
 */
export function useDocumentMeta({ title, description, path, lang }: DocumentMeta): void {
  useEffect(() => {
    document.title = title;
    meta('name', 'description', description);
    meta('property', 'og:title', title);
    meta('property', 'og:description', description);
    meta('property', 'og:locale', lang === 'ar' ? 'ar_EG' : 'en_US');
    meta('name', 'twitter:title', title);
    meta('name', 'twitter:description', description);

    if (!HAS_SITE_URL) return;
    const url = absoluteUrl(path);
    if (!url) return;
    linkRel('canonical', url);
    meta('property', 'og:url', url);
  }, [title, description, path, lang]);
}
