/* =============================================================================
   The route list the static-HTML generator and the sitemap are built from.

   The two formulas below mirror `src/seo/meta.ts`; `src/test/seo.test.ts` imports both
   and asserts they produce identical strings, so this file cannot drift from the one the
   application uses at runtime.
   ========================================================================== */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const read = (name) => JSON.parse(readFileSync(join(here, '..', 'src', 'content', name), 'utf8'));

export const CONTENT = { en: read('content.en.json'), ar: read('content.ar.json') };

/** The five selected works — the same file the application renders from. */
export const WORKS = read('works.json');

/** The presentation content (experience list, skills, chrome), per language. */
export const SITE = read('site.json');

const SUFFIX = { en: 'Software Developer, Flutter & Mobile', ar: 'مطوّرة برمجيات · Flutter والموبايل' };

export function clamp(text, limit = 158) {
  const flat = String(text).replace(/\s+/g, ' ').trim();
  if (flat.length <= limit) return flat;
  const cut = flat.slice(0, limit);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > limit * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[،,;:.\s]+$/, '')}…`;
}

export const homeTitle = (content, lang) => `${content.meta.name} · ${SUFFIX[lang]}`;
export const homeDescription = (content) =>
  clamp(`${content.about.title} ${content.about.body[0] ?? ''}`);
export const workTitle = (title, content) => `${title} · ${content.meta.name}`;
export const workDescription = (about) => clamp(about);
export const experienceTitle = (org, content) => `${org} · ${content.meta.name}`;
export const experienceDescription = (summary) => clamp(summary);
export const cvTitle = (content, cvLabel) => `${cvLabel} · ${content.meta.name}`;
export const cvDescription = (content, lang) =>
  clamp(
    lang === 'ar'
      ? `السيرة الذاتية لـ ${content.meta.name} — ${SUFFIX.ar}.`
      : `The curriculum vitae of ${content.meta.name} — ${SUFFIX.en}.`,
  );

/**
 * Every page the site serves, with the head each one needs.
 * `priority` and `changefreq` are the sitemap's hints, not claims about the content.
 */
export function routes(lang = 'en') {
  const content = CONTENT[lang];
  const cvLabel = content.ui?.cv?.title ?? 'Curriculum vitae';
  return [
    {
      path: '/',
      title: homeTitle(content, lang),
      description: homeDescription(content),
      priority: '1.0',
      changefreq: 'monthly',
    },
    ...WORKS.map((work) => ({
      path: `/work/${work.id}`,
      title: workTitle(work[lang].title, content),
      description: workDescription(work[lang].about),
      priority: '0.8',
      changefreq: 'monthly',
    })),
    ...SITE[lang].experience.items.map((item) => ({
      path: `/experience/${item.id}`,
      title: experienceTitle(item.org, content),
      description: experienceDescription(item.summary),
      priority: '0.5',
      changefreq: 'yearly',
    })),
    {
      path: '/cv',
      title: cvTitle(content, cvLabel),
      description: cvDescription(content, lang),
      priority: '0.6',
      changefreq: 'monthly',
    },
  ];
}
