import { describe, expect, it } from 'vitest';
import { applyHenLehenCorrections, correctScope } from '@/data/corrections';
import type { ScopeGroup } from '@/content/types';

describe('applyHenLehenCorrections', () => {
  it('removes a snapshot-only sentence rather than reversing it', () => {
    const before = {
      limits: [
        'No backend integration: all data is an in-memory mock, and login uses hard-coded credentials.',
        'Something still true of the delivered product.',
      ],
    };
    const after = applyHenLehenCorrections(before);
    expect(after.limits).toEqual(['Something still true of the delivered product.']);
  });

  it('drops the unconnected FastAPI sentence', () => {
    const after = applyHenLehenCorrections({
      notes: ['A separate FastAPI backend exists on its own branch but is not connected.'],
    });
    expect(after.notes).toEqual([]);
  });

  it('strips only the snapshot qualifier from a sentence that is otherwise true', () => {
    const after = applyHenLehenCorrections({
      summary: 'A women-only telemedicine idea, built in Flutter.',
    });
    expect(after.summary).toBe('A women-only telemedicine platform, built in Flutter.');
  });

  it('asserts nothing in place of what it removes', () => {
    const after = applyHenLehenCorrections({
      limits: ['The migration itself exists only on side branches, which is why this is shown as a prototype.'],
    });
    expect(after.limits).toEqual([]);
    expect(JSON.stringify(after)).not.toMatch(/\.NET|FastAPI|PostgreSQL|Redis|JWT/);
  });

  it('prunes containers that corrections empty out', () => {
    const after = applyHenLehenCorrections({
      groups: [{ title: 'Models and the mock data set', items: ['Models and the mock data set'] }],
    });
    // the group survives only if something inside it did
    expect(after.groups[0]?.items).toEqual([]);
    expect(after.groups[0]?.title).toBeUndefined();
  });

  it('leaves unrelated content untouched', () => {
    const value = { a: 'Kept exactly', b: [1, 2, 3], c: { d: true } };
    expect(applyHenLehenCorrections(value)).toEqual(value);
  });

  it('applies to Arabic as well as English', () => {
    const after = applyHenLehenCorrections({
      items: ['لا اتصال بخدمة خلفية: كل البيانات محاكاة في الذاكرة، وتسجيل الدخول ببيانات ثابتة في الكود.'],
    });
    expect(after.items).toEqual([]);
  });
});

describe('correctScope', () => {
  const groups: ScopeGroup[] = [
    {
      title: 'Discovery',
      items: [
        ['All doctor, review and appointment data from an in-memory mock set', 'mock'],
        ['Chat screen over a local message list', 'mock'],
        ['Browse and filter doctors', 'done'],
      ],
    },
    { title: 'Payments', items: [['Real payment processing', 'planned']] },
  ];

  it('drops the snapshot lines and rewrites the one that keeps its substance', () => {
    const fixed = correctScope('hen-lehen-patient', groups);
    expect(fixed).toHaveLength(1);
    expect(fixed[0]!.items).toEqual([
      ['Chat screen', 'done'],
      ['Browse and filter doctors', 'done'],
    ]);
  });

  it('prunes a group left with nothing in it', () => {
    const fixed = correctScope('hen-lehen-patient', groups);
    expect(fixed.some((g) => g.title === 'Payments')).toBe(false);
  });

  it('leaves other applications alone', () => {
    expect(correctScope('tasky', groups)).toEqual(groups);
  });
});
