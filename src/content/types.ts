/**
 * The shape of the portfolio's content model.
 *
 * `content.{en,ar}.json` are generated from Menna's verified repository and profile
 * survey and are the single source of truth for every fact on the page. The interfaces
 * below describe them; nothing here adds information, it only types what is there.
 */

export type Language = 'en' | 'ar';

/** Scope status vocabulary. `done` is the unmarked default; the rest are tagged, because
 *  the point of these flags is to keep team work, mock data and unbuilt plans legible. */
export type ScopeStatus = 'done' | 'team' | 'mock' | 'planned' | 'partial';

/** A scope line as the content files write it: `[text, status]`, or bare text. */
export type ScopeEntry = readonly [string, ScopeStatus] | string;

export interface ScopeGroup {
  readonly title?: string;
  readonly label?: string;
  readonly name?: string;
  readonly items?: readonly ScopeEntry[];
}

export interface ArchitectureLayer {
  readonly name: string;
  readonly items?: readonly string[];
}

export interface Decision {
  readonly text?: string;
  readonly title?: string;
}

export interface ArchitectureDetail {
  readonly intro?: string;
  readonly layers?: readonly ArchitectureLayer[];
  readonly flow?: readonly unknown[];
  readonly decisions?: readonly (string | Decision)[];
}

export interface Challenge {
  readonly title: string;
  readonly problem?: string;
  readonly constraint?: string;
  readonly approach?: string;
  readonly implementation?: string;
  readonly outcome?: string;
}

export interface QualityBlock {
  readonly summary?: string;
  readonly items?: readonly (string | Decision)[];
}

export interface Overview {
  readonly purpose?: string;
  readonly users?: string;
  readonly role?: string;
  readonly status?: string;
  readonly timeline?: string;
  readonly platform?: string;
}

export interface Detail {
  readonly overview?: Overview;
  readonly scope?: readonly ScopeGroup[];
  readonly architecture?: ArchitectureDetail;
  readonly challenges?: readonly Challenge[];
  readonly quality?: QualityBlock;
  readonly limits?: readonly (string | Decision)[];
}

export interface Status {
  readonly text: string;
  readonly tone?: string;
}

export interface Stack {
  readonly core?: readonly string[];
  readonly supporting?: readonly string[];
}

/** One application — a case, one of a case's sibling apps, or a standalone project.
 *  All three use the same record shape, which is why one component renders them all. */
export interface AppRecord {
  readonly id: string;
  readonly kind?: string;
  readonly name: string;
  readonly accent?: string;
  readonly kicker?: string;
  readonly status?: Status;
  readonly image?: string;
  readonly imageAlt?: string;
  readonly summary: string;
  readonly highlights?: readonly string[];
  readonly stack?: Stack;
  readonly backend?: unknown;
  readonly role?: unknown;
  readonly note?: string;
  readonly links?: readonly (readonly [string, string])[];
  readonly detail?: Detail;
  /** A case may carry sibling applications instead of being one itself. */
  readonly apps?: readonly AppRecord[];
}

export interface ProjectGroup {
  readonly label: string;
  readonly items: readonly AppRecord[];
}

export interface ExperienceItem {
  readonly role: string;
  readonly org: string;
  readonly when: string;
  readonly type?: string;
  readonly points?: readonly string[];
  readonly skills?: readonly string[];
  readonly start?: string;
  readonly end?: string;
  readonly kind?: string;
  readonly evidence?: unknown;
}

export interface Education {
  readonly label: string;
  readonly title?: string;
  readonly degree: string;
  readonly school: string;
  readonly when: string;
  readonly points?: readonly string[];
}

export interface SkillItem {
  readonly skill: string;
  readonly where?: readonly (readonly [string, string])[];
}

export interface SkillGroup {
  readonly id?: string;
  readonly label: string;
  readonly items: readonly SkillItem[];
}

export interface PullRequest {
  readonly name: string;
  readonly repo: string;
  readonly pr: string;
  readonly url: string;
  readonly status: Status;
  readonly title: string;
  readonly problem?: string;
  readonly fix?: string;
  readonly tests?: string;
  readonly size?: string;
  readonly origin?: string;
  readonly diff?: unknown;
}

export interface TeamNote {
  readonly name: string;
  readonly what: string;
  readonly status?: string;
}

/** Copy owned by the content files that the shell reads (CV chrome, labels, glossary). */
export interface UiStrings {
  readonly lang?: string;
  readonly theme?: string;
  readonly cv?: Readonly<Record<string, string>>;
  readonly x?: Readonly<Record<string, string>>;
  readonly [key: string]: unknown;
}

export interface Content {
  readonly meta: {
    readonly name: string;
    readonly role: string;
    readonly email: string;
    readonly github: string;
    readonly linkedin: string;
    readonly cv?: string;
  };
  readonly ui: UiStrings;
  readonly hero: {
    readonly eyebrow?: string;
    readonly title: readonly string[];
    readonly lead?: string;
    readonly facts: readonly (readonly [string, string])[];
  };
  readonly cases: readonly AppRecord[];
  readonly openSource: {
    readonly label?: string;
    readonly title?: string;
    readonly pluto: PullRequest;
    readonly team?: readonly TeamNote[];
  };
  readonly experience: {
    readonly label: string;
    readonly title: string;
    readonly items: readonly ExperienceItem[];
  };
  readonly skills: {
    readonly label: string;
    readonly title: string;
    readonly intro?: string;
    readonly groups: readonly SkillGroup[];
  };
  readonly about: {
    readonly label?: string;
    readonly title: string;
    readonly body: readonly string[];
    readonly portrait?: string;
  };
  readonly contact: {
    readonly label?: string;
    readonly title?: string;
    readonly body: string;
  };
  readonly footer: { readonly built: string };
  readonly projects: { readonly groups: readonly ProjectGroup[] };
  readonly education: Education;
  readonly architecture: {
    readonly label?: string;
    readonly title?: string;
    readonly flows: readonly unknown[];
  };
}
