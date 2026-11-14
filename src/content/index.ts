import en from './content.en.json';
import type { AppRecord, Content, Language } from './types';
import { DROPPED_ENTRY_IDS } from '@/data/corrections';

/**
 * The content, loaded one language at a time.
 *
 * Both languages together are 292 kB of JSON — more than the rest of the application put
 * together. English is bundled because it is what the page opens in; Arabic is a separate
 * chunk fetched the first time it is actually asked for, so a visitor who never switches
 * never downloads it. The generated JSON is wider than the interface needs, which is why
 * each import is cast once, here and nowhere else.
 */
const EN = en as unknown as Content;

const cache = new Map<Language, Content>([['en', EN]]);

/** The content for a language, if it has already been loaded. */
export const peekContent = (lang: Language): Content | null => cache.get(lang) ?? null;

/** The content for a language, fetching the chunk on first use. */
export async function loadContent(lang: Language): Promise<Content> {
  const cached = cache.get(lang);
  if (cached) return cached;
  const module = await import('./content.ar.json');
  const content = (module.default ?? module) as unknown as Content;
  cache.set('ar', content);
  return content;
}

export const englishContent = (): Content => EN;

/**
 * Every application, in the order the portfolio presents them: a case either carries
 * sibling applications (MentorX Student and Parent; Hen Lehen Patient and Doctor) or is
 * one itself, then the standalone projects follow.
 */
export function allApplications(content: Content): AppRecord[] {
  const out: AppRecord[] = [];
  for (const entry of content.cases) {
    if (entry.apps && entry.apps.length > 0) out.push(...entry.apps);
    else out.push(entry);
  }
  for (const group of content.projects.groups) out.push(...group.items);
  return out;
}

/** The applications the work chapter lists, after the corrections layer's exclusions. */
export function listedApplications(content: Content): AppRecord[] {
  return allApplications(content).filter((app) => !DROPPED_ENTRY_IDS.includes(app.id));
}

export function findApplication(content: Content, id: string): AppRecord | undefined {
  return listedApplications(content).find((app) => app.id === id);
}
