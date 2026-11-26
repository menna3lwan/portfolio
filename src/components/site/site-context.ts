import { createContext, useContext } from 'react';

export interface SiteContextValue {
  /** True once the first-visit loader has finished (or was never shown). */
  readonly introDone: boolean;
  readonly finishIntro: () => void;
  /** The project the works section currently has active (0-based). */
  readonly active: number;
  readonly setActive: (index: number) => void;
  /** Navigate inside the site behind the page curtain. */
  readonly go: (to: string, trigger?: HTMLElement | null) => void;
}

export const SiteContext = createContext<SiteContextValue | null>(null);

export function useSite(): SiteContextValue {
  const value = useContext(SiteContext);
  if (!value) throw new Error('useSite must be used inside the site shell');
  return value;
}
