import { useEffect } from 'react';
import { useReducedMotion } from './useMediaQuery';

/**
 * The page's scroll motion: the reading-progress rule and the parallax drift.
 *
 * One passive listener, coalesced into a single rAF, writing nothing but a transform and
 * one custom property — so no layout is read in a loop and nothing reflows. Elements opt
 * in by carrying `data-par="<px>"`, which keeps the drift declarative in the markup.
 *
 * Progress still runs under reduced motion (it is information, not decoration); the
 * parallax does not.
 */
export function useScrollMotion(barRef: React.RefObject<HTMLElement>): void {
  const reduced = useReducedMotion();

  useEffect(() => {
    let ticking = false;

    const frame = () => {
      ticking = false;
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      const progress = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      if (barRef.current) barRef.current.style.transform = `scaleX(${progress})`;
      if (reduced) return;

      const viewport = window.innerHeight;
      for (const el of document.querySelectorAll<HTMLElement>('[data-par]')) {
        const rect = el.getBoundingClientRect();
        if (rect.bottom < -200 || rect.top > viewport + 200) continue;
        // -1..1 across the viewport, so the element is unshifted when centred
        const mid = (rect.top + rect.height / 2 - viewport / 2) / (viewport / 2);
        const factor = Number.parseFloat(el.dataset.par ?? '0');
        el.style.setProperty('--par', `${(mid * factor).toFixed(2)}px`);
      }
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(frame);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    frame();

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [barRef, reduced]);
}
