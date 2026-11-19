/* =============================================================================
   How every route's title and description are formed.

   These two formulas are the single definition. The build-time generator in
   `scripts/routes.mjs` produces the same strings for the static HTML it emits, and
   `src/test/seo.test.ts` imports both and asserts they agree — so the head a social
   scraper reads can never drift from the head the application sets at runtime.
   ========================================================================== */
import type { Content, Language } from '@/content/types';

const SUFFIX: Record<Language, string> = {
  en: 'Software Developer, Flutter & Mobile',
  ar: 'مطوّرة برمجيات · Flutter والموبايل',
};

/** A description is trimmed on a word boundary — a sentence cut mid-word reads as broken
 *  in a search result, and the limit is what search engines actually show. */
export function clamp(text: string, limit = 158): string {
  const flat = text.replace(/\s+/g, ' ').trim();
  if (flat.length <= limit) return flat;
  const cut = flat.slice(0, limit);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > limit * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[،,;:.\s]+$/, '')}…`;
}

export const homeTitle = (content: Content, lang: Language): string =>
  `${content.meta.name} · ${SUFFIX[lang]}`;

export const homeDescription = (content: Content): string =>
  clamp(`${content.about.title} ${content.about.body[0] ?? ''}`);

/** A selected work's page: its title in the page's language, and its About text. */
export const workTitle = (title: string, content: Content): string => `${title} · ${content.meta.name}`;

export const workDescription = (about: string): string => clamp(about);

export const cvTitle = (content: Content, cvLabel: string): string =>
  `${cvLabel} · ${content.meta.name}`;

export const cvDescription = (content: Content, lang: Language): string =>
  clamp(
    lang === 'ar'
      ? `السيرة الذاتية لـ ${content.meta.name} — ${SUFFIX.ar}.`
      : `The curriculum vitae of ${content.meta.name} — ${SUFFIX.en}.`,
  );
