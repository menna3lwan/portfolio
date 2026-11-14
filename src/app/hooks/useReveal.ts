import { useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';

/**
 * Reveal-on-enter.
 *
 * One observer per element, disconnected as soon as it has fired — an element reveals
 * once and then costs nothing. The class it toggles (`is-in`) is the same one the
 * stylesheet keys every reveal, stagger, drawn rule and marked phrase off, so the whole
 * entrance choreography stays in CSS where reduced-motion can switch it off wholesale.
 */
export function useReveal<T extends Element = HTMLElement>(
  options: IntersectionObserverInit = { rootMargin: '0px 0px -6% 0px', threshold: 0.06 },
): [RefObject<T>, boolean] {
  const ref = useRef<T>(null);
  const [isIn, setIsIn] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (typeof IntersectionObserver === 'undefined') {
      setIsIn(true);
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          setIsIn(true);
          observer.disconnect();
          return;
        }
      }
    }, options);

    observer.observe(node);
    return () => observer.disconnect();
    // The options object is a stable literal per call site; re-running on identity alone
    // would reinstall the observer on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return [ref, isIn];
}
