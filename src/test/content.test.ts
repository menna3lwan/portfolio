import { describe, expect, it } from 'vitest';
import { allApplications, findApplication, listedApplications, loadContent } from '@/content';
import { DROPPED_ENTRY_IDS, HEN_LEHEN_IDS } from '@/data/corrections';
import { shotsFor } from '@/data/previews';

const LANGS = ['en', 'ar'] as const;

/** Both languages are loaded once up front so each case can stay synchronous. */
const CONTENT = Object.fromEntries(
  await Promise.all(LANGS.map(async (l) => [l, await loadContent(l)] as const)),
) as Record<(typeof LANGS)[number], Awaited<ReturnType<typeof loadContent>>>;

const getContent = (lang: (typeof LANGS)[number]) => CONTENT[lang];

describe('the content model', () => {
  it.each(LANGS)('lists the same nine applications in %s', (lang) => {
    const apps = listedApplications(getContent(lang));
    expect(apps).toHaveLength(9);
    expect(apps.map((a) => a.id)).toEqual([
      'flower-app',
      'tracking-app',
      'mentorx-student',
      'mentorx-parent',
      'hen-lehen-patient',
      'hen-lehen-doctor',
      'elevate-exams',
      'tasky',
      'movie-app',
    ]);
  });

  it.each(LANGS)('keeps every application exactly once in %s', (lang) => {
    const ids = listedApplications(getContent(lang)).map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(LANGS)('keeps MentorX Student and Parent separate in %s', (lang) => {
    const apps = listedApplications(getContent(lang));
    expect(apps.filter((a) => a.id.startsWith('mentorx-'))).toHaveLength(2);
  });

  it.each(LANGS)('keeps Hen Lehen Patient and Doctor separate in %s', (lang) => {
    const apps = listedApplications(getContent(lang));
    expect(apps.filter((a) => a.id.startsWith('hen-lehen-'))).toHaveLength(2);
  });

  it.each(LANGS)('does not list the standalone FastAPI backend under the work chapter in %s', (lang) => {
    expect(findApplication(getContent(lang), 'hen-lehen-backend')).toBeUndefined();
    // it is still present in the content itself: excluded from the listing, not deleted
    expect(allApplications(getContent(lang)).some((a) => a.id === 'hen-lehen-backend')).toBe(true);
    expect(DROPPED_ENTRY_IDS).toContain('hen-lehen-backend');
  });

  it.each(LANGS)('places XPER ERP in experience and never as a project card in %s', (lang) => {
    const content = getContent(lang);
    expect(content.experience.items.some((item) => /XPER/i.test(item.org))).toBe(true);
    expect(listedApplications(content).some((a) => /xper/i.test(a.id))).toBe(false);
  });

  it.each(LANGS)('carries no trace of Sout El-Qaa in %s', (lang) => {
    const serialised = JSON.stringify(getContent(lang));
    expect(serialised).not.toMatch(/sout[-_ ]?el[-_ ]?qaa/i);
    expect(serialised).not.toContain('صوت القاع');
  });

  it.each(LANGS)('has eleven experience entries once education and skills are counted in %s', (lang) => {
    const content = getContent(lang);
    expect(content.experience.items.length + 2).toBe(11);
  });
});

describe('screen previews', () => {
  it.each(LANGS)('gives every listed application its own concept in %s', (lang) => {
    const apps = listedApplications(getContent(lang));
    const files = apps.map((app) => {
      const shots = shotsFor(app);
      expect(shots).toHaveLength(1);
      return shots[0]!.file;
    });
    // one image per application, and each one named by that application's own record
    expect(new Set(files).size).toBe(files.length);
    for (const [i, file] of files.entries()) {
      expect(file).toBe(`/img/cut/${apps[i]!.image!.split('/').pop()}`);
      // base-aware, so a nested route does not resolve it against the route's own path
      expect(file.startsWith(import.meta.env.BASE_URL)).toBe(true);
    }
  });

  it('carries the Movie App simulator at its rebuilt size', () => {
    const movie = findApplication(getContent('en'), 'movie-app');
    const shot = shotsFor(movie)[0];
    expect(shot).toMatchObject({
      file: '/img/cut/movie-app-ui-concept.webp',
      width: 858,
      height: 1209,
    });
  });

  it('offers narrower variants, and never one wider than the source', () => {
    const shot = shotsFor(findApplication(getContent('en'), 'movie-app'))[0]!;
    expect(shot.srcSet).toBe(
      '/img/cut/movie-app-ui-concept-480w.webp 480w, ' +
        '/img/cut/movie-app-ui-concept-720w.webp 720w, ' +
        '/img/cut/movie-app-ui-concept.webp 858w',
    );
    for (const entry of shot.srcSet!.split(', ')) {
      expect(Number.parseInt(entry.split(' ')[1]!, 10)).toBeLessThanOrEqual(858);
    }
  });

  it('returns nothing for a record with no image', () => {
    expect(shotsFor(undefined)).toEqual([]);
    expect(shotsFor({ id: 'x', name: 'X', summary: '' })).toEqual([]);
  });
});

describe('the Hen Lehen corrections', () => {
  it('names the three records the correction applies to', () => {
    expect(HEN_LEHEN_IDS).toEqual(['hen-lehen', 'hen-lehen-patient', 'hen-lehen-doctor']);
  });
});

/**
 * Facts the site states about itself and about Menna. Each of these was wrong on the live
 * build; a case here is cheaper than noticing it again in a screenshot.
 */
describe('stated facts', () => {
  it.each(LANGS)('names the framework this site is actually built in, in %s', (lang) => {
    const built = getContent(lang).footer.built;
    expect(built).not.toMatch(/Flutter/i);
    expect(built).toMatch(/React/);
  });

  it.each(LANGS)('spells the ERP employer XPER, never EXPR, in %s', (lang) => {
    const serialised = JSON.stringify(getContent(lang));
    expect(serialised).not.toMatch(/EXPR/);
    expect(getContent(lang).experience.items.some((item) => /XPER/.test(item.org))).toBe(true);
  });

  it.each(LANGS)('shows the Elevate internship as ongoing from June 2026 in %s', (lang) => {
    const elevate = getContent(lang).experience.items.find((item) => /Elevate/i.test(item.org));
    expect(elevate).toBeDefined();
    expect(elevate!.when).toBe(lang === 'ar' ? 'يونيو 2026 – حتى الآن' : 'Jun 2026 – Present');
  });
});
