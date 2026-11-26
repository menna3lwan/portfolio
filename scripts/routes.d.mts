/* Types for the build-time route generator, so the test that compares it with
   `src/seo/meta.ts` type-checks like the rest of the project. */
import type { Content, Language } from '../src/content/types';
import type { ExperienceItem, SiteCopy, Work } from '../src/content/site';

export interface BuildRoute {
  path: string;
  title: string;
  description: string;
  priority: string;
  changefreq: string;
}

export declare const CONTENT: Record<Language, Content>;
export declare function clamp(text: string, limit?: number): string;
export declare function homeTitle(content: Content, lang: Language): string;
export declare function homeDescription(content: Content): string;
export declare const WORKS: readonly Work[];
export declare const SITE: Record<Language, SiteCopy>;
export declare function workTitle(title: string, content: Content): string;
export declare function workDescription(about: string): string;
export declare function experienceTitle(org: string, content: Content): string;
export declare function experienceDescription(summary: string): string;
export type { ExperienceItem };
export declare function cvTitle(content: Content, cvLabel: string): string;
export declare function cvDescription(content: Content, lang: Language): string;
export declare const SOCIAL_IMAGE: string;
export declare function routes(lang?: Language): BuildRoute[];
