import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { siteCopy, WORKS } from '@/content/site';

const PUBLIC = join(__dirname, '..', '..', 'public');
const LANGS = ['en', 'ar'] as const;

describe('the selected works', () => {
  it('are the five she chose, in order', () => {
    expect(WORKS.map((w) => w.id)).toEqual(['flower-app', 'hen-lehen', 'tracking-app', 'elevate-exams', 'mentorx']);
  });

  it('ship every picture they reference', () => {
    for (const work of WORKS) {
      for (const file of [work.cover, ...work.gallery]) expect(existsSync(join(PUBLIC, file)), file).toBe(true);
    }
  });

  it.each(LANGS)('carry every text field in %s', (lang) => {
    for (const work of WORKS) {
      const t = work[lang];
      for (const key of ['title', 'subtitle', 'tag', 'card', 'about', 'role', 'challenge', 'architecture'] as const) {
        expect(t[key].trim().length, `${work.id}.${lang}.${key}`).toBeGreaterThan(0);
      }
      expect(t.built.length).toBeGreaterThan(0);
      expect(t.tags.length).toBeGreaterThan(0);
    }
  });

  /* Her stated corrections and her CV, enforced. */
  it('never ties Hen Lehen to the FastAPI snapshot, and links no snapshot repository', () => {
    const henLehen = WORKS.find((w) => w.id === 'hen-lehen')!;
    expect(JSON.stringify(henLehen)).not.toMatch(/FastAPI|PostgreSQL|Redis|JWT/);
    expect(henLehen.code).toBeNull();
    expect(henLehen.stack).toContain('.NET backend');
  });

  it('describes Flowrist and Tracking App as team projects she maintains independently', () => {
    for (const id of ['flower-app', 'tracking-app']) {
      const work = WORKS.find((w) => w.id === id)!;
      expect(work.en.role).toMatch(/team project/i);
      expect(work.en.role).toMatch(/independently/i);
    }
  });

  it('presents MentorX as a team contribution', () => {
    expect(WORKS.find((w) => w.id === 'mentorx')!.en.tag).toBe('Team contribution');
  });

  it('links only to her own repositories', () => {
    for (const work of WORKS) {
      if (work.code) expect(work.code).toMatch(/^https:\/\/github\.com\/menna3lwan\//);
    }
  });
});

describe('the skills reel', () => {
  it('follows her priority order', () => {
    expect(siteCopy('en').skills.map((s) => s.word)).toEqual([
      'SOFTWARE ENGINEERING',
      'FLUTTER / DART',
      'CLEAN ARCHITECTURE',
      'OOP / SOLID',
      'BLOC / CUBIT',
      'REST APIS',
      'SYSTEM DESIGN',
      'DATABASE DESIGN',
      'GIT / TEAMWORK',
      'TESTING / QUALITY',
    ]);
  });

  it.each(LANGS)('has the same ten in %s, and never presents language support as a skill', (lang) => {
    const skills = siteCopy(lang).skills;
    expect(skills).toHaveLength(10);
    expect(JSON.stringify(skills)).not.toMatch(/RTL|right-to-left|من اليمين/i);
  });
});
