import { describe, expect, it } from 'vitest';
import { loadContent } from '@/content';
import { WORKS } from '@/content/site';
import {
  clamp,
  cvDescription,
  cvTitle,
  homeDescription,
  homeTitle,
  workDescription,
  workTitle,
} from '@/seo/meta';
import * as build from '../../scripts/routes.mjs';
import type { BuildRoute } from '../../scripts/routes.mjs';
import type { Content, Language } from '@/content/types';

const LANGS: readonly Language[] = ['en', 'ar'];
const CONTENT = Object.fromEntries(
  await Promise.all(LANGS.map(async (l) => [l, await loadContent(l)] as const)),
) as Record<Language, Content>;

/**
 * The build-time generator cannot import the application's TypeScript, so it carries its
 * own copy of these formulas. These cases are what stops the two drifting: if they ever
 * disagree, the head a social scraper reads stops matching the head the page sets.
 */
describe('the build generator agrees with the application', () => {
  it.each(LANGS)('forms the same home title and description in %s', (lang) => {
    const content = CONTENT[lang];
    expect(build.homeTitle(content, lang)).toBe(homeTitle(content, lang));
    expect(build.homeDescription(content)).toBe(homeDescription(content));
  });

  it.each(LANGS)('forms the same project-page head in %s', (lang) => {
    const content = CONTENT[lang];
    for (const work of WORKS) {
      const text = work[lang];
      expect(build.workTitle(text.title, content)).toBe(workTitle(text.title, content));
      expect(build.workDescription(text.about)).toBe(workDescription(text.about));
    }
  });

  it.each(LANGS)('forms the same CV head in %s', (lang) => {
    const content = CONTENT[lang];
    const label = content.ui.cv?.title ?? 'Curriculum vitae';
    expect(build.cvTitle(content, label)).toBe(cvTitle(content, label));
    expect(build.cvDescription(content, lang)).toBe(cvDescription(content, lang));
  });

  it('lists exactly the routes the application serves', () => {
    expect(build.routes('en').map((r: BuildRoute) => r.path)).toEqual([
      '/',
      ...WORKS.map((work) => `/work/${work.id}`),
      '/cv',
    ]);
  });

  it('reads the same works file the application renders', () => {
    expect(build.WORKS.map((w: { id: string }) => w.id)).toEqual(WORKS.map((w) => w.id));
  });
});

describe('descriptions', () => {
  it('stays inside what a search result shows', () => {
    for (const lang of LANGS) {
      for (const route of build.routes(lang)) {
        expect(route.description.length).toBeLessThanOrEqual(159);
        expect(route.description.length).toBeGreaterThan(40);
        expect(route.title.length).toBeGreaterThan(8);
      }
    }
  });

  it('trims on a word boundary rather than mid-word', () => {
    const long = `${'word '.repeat(60)}end`;
    const out = clamp(long);
    expect(out.endsWith('…')).toBe(true);
    expect(out.length).toBeLessThanOrEqual(159);
    expect(out.replace('…', '').trim().endsWith('word')).toBe(true);
  });

  it('leaves a short description exactly as written', () => {
    expect(clamp('A short line.')).toBe('A short line.');
  });
});
