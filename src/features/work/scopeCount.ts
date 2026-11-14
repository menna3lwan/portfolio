import type { ScopeGroup } from '@/content/types';

/** How many scope lines a set of groups holds — the figure the fold shows. */
export const scopeItemCount = (groups: readonly ScopeGroup[]): number =>
  groups.reduce((total, group) => total + (group.items?.length ?? 0), 0);
