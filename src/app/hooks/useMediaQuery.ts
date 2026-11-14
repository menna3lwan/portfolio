import { useEffect, useState } from 'react';

/** A media query as reactive state, so a change of preference or pointer re-renders. */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() =>
    typeof window === 'undefined' ? false : window.matchMedia(query).matches,
  );

  useEffect(() => {
    const mq = window.matchMedia(query);
    setMatches(mq.matches);
    const onChange = (event: MediaQueryListEvent) => setMatches(event.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}

/** The accessibility contract every motion hook in this app checks first. */
export const useReducedMotion = (): boolean =>
  useMediaQuery('(prefers-reduced-motion: reduce)');

/** A pointer that can actually hover — a coarse pointer would leave effects stuck where
 *  the finger last touched. */
export const useFinePointer = (): boolean =>
  useMediaQuery('(hover: hover) and (pointer: fine)');
