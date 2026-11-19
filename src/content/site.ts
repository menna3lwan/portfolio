/* =============================================================================
   The site's presentation content: the five selected works and the skills reel.

   Kept as JSON beside the content records so the build-time route generator
   (scripts/routes.mjs) can read the same file the application does. Every statement in
   it is drawn from the verified content records, with the corrections Menna has stated
   since and her final CV as the last word (see docs/40, docs/41 in the project notes):
   Flowrist and Tracking App began as team projects and are maintained by her
   independently; Hen Lehen is a freelance product delivered on the client's .NET service
   layer and later sold; MentorX is a team contribution.
   ========================================================================== */
import worksJson from './works.json';
import siteJson from './site.json';
import type { Language } from './types';

export interface WorkText {
  readonly title: string;
  readonly subtitle: string;
  readonly tag: string;
  /** One sentence for the card. */
  readonly card: string;
  readonly about: string;
  readonly role: string;
  readonly challenge: string;
  readonly architecture: string;
  readonly built: readonly string[];
  readonly tags: readonly string[];
}

export interface Work {
  /** Also the route: /work/:id. */
  readonly id: string;
  /** The project's own accent, used for its glow and its index dot. */
  readonly color: string;
  readonly year: string;
  readonly cover: string;
  readonly gallery: readonly string[];
  readonly code: string | null;
  readonly stack: readonly string[];
  readonly en: WorkText;
  readonly ar: WorkText;
}

export interface SkillWord {
  readonly word: string;
  /** The line the rotated quote shows when this word is reached. */
  readonly quote: string;
}

/** The site's own chrome, in each language. */
export interface SiteUi {
  readonly skip: string;
  readonly loading: string;
  readonly cv: string;
  readonly cvLabel: string;
  readonly toAr: string;
  readonly toEn: string;
  readonly toLight: string;
  readonly toDark: string;
  readonly skills: string;
  readonly selected: string;
  readonly view: string;
  readonly touch: string;
  readonly copy: string;
  readonly copied: string;
  readonly about: string;
  readonly role: string;
  readonly challenge: string;
  readonly architecture: string;
  readonly built: string;
  readonly type: string;
  readonly stack: string;
  readonly code: string;
  readonly back: string;
  readonly opened: string;
  readonly notFound: string;
  readonly newTab: string;
}

export interface SiteCopy {
  /** The hero title, as its two lines. */
  readonly role: readonly [string, string];
  readonly roleSr: string;
  readonly open: string;
  /** [the specialisation, the place] — the first part is dropped on phones. */
  readonly based: readonly [string, string];
  readonly scroll: string;
  readonly skills: readonly SkillWord[];
  readonly ui: SiteUi;
}

export const WORKS = worksJson as unknown as readonly Work[];
const SITE = siteJson as unknown as Readonly<Record<Language, SiteCopy>>;

export const siteCopy = (lang: Language): SiteCopy => SITE[lang];

export const findWork = (id: string | undefined): Work | undefined =>
  WORKS.find((work) => work.id === id);
