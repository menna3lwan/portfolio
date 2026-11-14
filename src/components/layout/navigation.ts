import type { Strings } from '@/i18n/strings';

export interface NavItem {
  readonly id: string;
  readonly key: keyof Pick<
    Strings,
    'navHome' | 'navWhoami' | 'navWork' | 'navExperience' | 'navContact'
  >;
}

/** The five sections, in page order. The spy and both navigations read this one list. */
export const NAV_ITEMS: readonly NavItem[] = [
  { id: 'hero', key: 'navHome' },
  { id: 'whoami', key: 'navWhoami' },
  { id: 'work', key: 'navWork' },
  { id: 'experience', key: 'navExperience' },
  { id: 'contact', key: 'navContact' },
];

export const NAV_IDS: readonly string[] = NAV_ITEMS.map((item) => item.id);
