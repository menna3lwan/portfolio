import { useEffect } from 'react';
import { useFinePointer, useReducedMotion } from './useMediaQuery';

/**
 * The pointer-following highlight on cards.
 *
 * One delegated listener for the whole page rather than one per card, coalesced into a
 * single rAF, writing only the two custom properties the card's radial gradient reads.
 * Fine pointers only — a coarse pointer has no hover, and the highlight would stick where
 * the finger last touched.
 */
export function usePointerGlow(): void {
  const fine = useFinePointer();
  const reduced = useReducedMotion();

  useEffect(() => {
    if (!fine || reduced) return;

    let pending: { card: HTMLElement; x: number; y: number } | null = null;
    let queued = false;

    const apply = () => {
      queued = false;
      if (!pending) return;
      const { card, x, y } = pending;
      const rect = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${(((x - rect.left) / rect.width) * 100).toFixed(1)}%`);
      card.style.setProperty('--my', `${(((y - rect.top) / rect.height) * 100).toFixed(1)}%`);
      pending = null;
    };

    const onMove = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const card = target.closest<HTMLElement>('.card');
      if (!card) return;
      pending = { card, x: event.clientX, y: event.clientY };
      if (queued) return;
      queued = true;
      requestAnimationFrame(apply);
    };

    document.addEventListener('pointermove', onMove, { passive: true });
    return () => document.removeEventListener('pointermove', onMove);
  }, [fine, reduced]);
}
