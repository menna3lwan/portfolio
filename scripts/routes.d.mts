/* Types for the build-time route generator, so the test that compares it with
   `src/seo/meta.ts` type-checks like the rest of the project. */
import type { AppRecord, Content, Language } from '../src/content/types';

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
export declare function caseTitle(record: AppRecord, content: Content): string;
export declare function caseDescription(record: AppRecord): string;
export declare function cvTitle(content: Content, cvLabel: string): string;
export declare function cvDescription(content: Content, lang: Language): string;
export declare function listedApplications(content: Content): AppRecord[];
export declare function routes(lang?: Language): BuildRoute[];
