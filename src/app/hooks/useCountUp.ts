import { useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { useReducedMotion } from './useMediaQuery';

/**
 * A figure that ticks up once, when it first comes into view.
 *
 * Only whole numbers animate — mixed values such as "+232 / −3" are returned exactly as
 * written — and nothing animates under reduced motion.
 */
export function useCountUp<T extends Element = HTMLElement>(
  value: string,
  durationMs = 620,
): [RefObject<T>, string] {
  const ref = useRef<T>(null);
  const reduced = useReducedMotion();
  const isWholeNumber = /^\d+$/.test(value.trim());
  const target = isWholeNumber ? Number.parseInt(value, 10) : 0;
  const [shown, setShown] = useState(value);
  const raf = useRef(0);

  useEffect(() => {
    setShown(value);
  }, [value]);

  useEffect(() => {
    const node = ref.current;
    if (!node || reduced || !isWholeNumber || target <= 1) return;
    if (typeof IntersectionObserver === 'undefined') return;

    let cancelled = false;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          observer.disconnect();
          const start = performance.now();
          const step = (now: number) => {
            if (cancelled) return;
            const k = Math.min(1, (now - start) / durationMs);
            // ease-out cubic, so it decelerates into the real figure
            setShown(String(Math.round(target * (1 - Math.pow(1 - k, 3)))));
            if (k < 1) raf.current = requestAnimationFrame(step);
          };
          raf.current = requestAnimationFrame(step);
          return;
        }
      },
      { threshold: 0.6 },
    );

    observer.observe(node);
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf.current);
      observer.disconnect();
    };
  }, [reduced, isWholeNumber, target, durationMs]);

  return [ref, shown];
}
