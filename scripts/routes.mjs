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

const SUFFIX = { en: 'Software Engineer, Flutter', ar: 'مهندسة برمجيات · Flutter' };

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
export const caseTitle = (record, content) => `${record.name} · ${content.meta.name}`;
export const caseDescription = (record) => clamp(record.summary);
export const cvTitle = (content, cvLabel) => `${cvLabel} · ${content.meta.name}`;
export const cvDescription = (content, lang) =>
  clamp(
    lang === 'ar'
      ? `السيرة الذاتية لـ ${content.meta.name} — ${SUFFIX.ar}.`
      : `The curriculum vitae of ${content.meta.name} — ${SUFFIX.en}.`,
  );

/** The entries excluded from the work chapter — kept in step with src/data/corrections.ts. */
const DROPPED = ['hen-lehen-backend'];

export function listedApplications(content) {
  const out = [];
  for (const entry of content.cases) {
    if (entry.apps && entry.apps.length > 0) out.push(...entry.apps);
    else out.push(entry);
  }
  for (const group of content.projects.groups) out.push(...group.items);
  return out.filter((app) => !DROPPED.includes(app.id));
}

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
    ...listedApplications(content).map((record) => ({
      path: `/work/${record.id}`,
      title: caseTitle(record, content),
      description: caseDescription(record),
      priority: '0.8',
      changefreq: 'monthly',
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
