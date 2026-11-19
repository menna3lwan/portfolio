import { describe, expect, it } from 'vitest';
import { allApplications, findApplication, listedApplications, loadContent } from '@/content';
import { DROPPED_ENTRY_IDS, HEN_LEHEN_IDS } from '@/data/corrections';

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
    // stated by Menna, so no longer "inferred from project activity"
    expect(elevate).not.toHaveProperty('dateNote');
    expect(elevate!.start).toBe('2026-06');
    expect(elevate!.end).toBeNull();
  });
});

/**
 * The chapter is ordered reverse-chronologically by END date, ongoing first, with ties
 * broken by the later start. The rule was always there; it was only ever broken once, by
 * a date correction that moved an entry's end into the future without moving the entry.
 * This case is what would have caught that.
 */
describe('the experience chapter order', () => {
  /** `null` is ongoing, which sorts above every real date. */
  const key = (value: string | null | undefined): string => value ?? '9999-99';

  it.each(LANGS)('runs newest-ended first in %s', (lang) => {
    const items = getContent(lang).experience.items;
    for (let i = 1; i < items.length; i += 1) {
      const previous = items[i - 1]!;
      const current = items[i]!;
      const [a, b] = [key(previous.end), key(current.end)];
      const ordered = a > b || (a === b && key(previous.start) >= key(current.start));
      expect(
        ordered,
        `${previous.org} (ends ${a}) should not precede ${current.org} (ends ${b})`,
      ).toBe(true);
    }
  });

  it.each(LANGS)('leads with the one ongoing engagement in %s', (lang) => {
    const items = getContent(lang).experience.items;
    expect(items[0]!.end).toBeNull();
    expect(items.filter((item) => item.end === null)).toHaveLength(1);
  });

  it('keeps both languages in the same order', () => {
    const orgs = (lang: (typeof LANGS)[number]) =>
      getContent(lang).experience.items.map((item) => `${item.start}|${item.end}`);
    expect(orgs('ar')).toEqual(orgs('en'));
  });
});
