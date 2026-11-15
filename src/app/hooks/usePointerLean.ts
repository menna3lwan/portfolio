import { useEffect } from 'react';
import type { RefObject } from 'react';
import { useFinePointer, useReducedMotion } from './useMediaQuery';

/**
 * The portrait group leans with the pointer.
 *
 * Two custom properties on one container, read by the marks' existing transform — no
 * extra loop, no per-element listener, and skipped entirely on coarse pointers and under
 * reduced motion.
 */
export function usePointerLean(
  ref: RefObject<HTMLElement>,
  amplitude: { x: number; y: number } = { x: 5, y: 4 },
): void {
  const fine = useFinePointer();
  const reduced = useReducedMotion();
  const { x: ax, y: ay } = amplitude;

  useEffect(() => {
    const node = ref.current;
    if (!node || !fine || reduced) return;

    let queued = false;
    let nx = 0;
    let ny = 0;

    const apply = () => {
      queued = false;
      node.style.setProperty('--lx', nx.toFixed(2));
      node.style.setProperty('--ly', ny.toFixed(2));
    };

    const schedule = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(apply);
    };

    const onMove = (event: PointerEvent) => {
      const rect = node.getBoundingClientRect();
      nx = ((event.clientX - rect.left) / rect.width - 0.5) * ax;
      ny = ((event.clientY - rect.top) / rect.height - 0.5) * ay;
      schedule();
    };

    const onLeave = () => {
      nx = 0;
      ny = 0;
      schedule();
    };

    node.addEventListener('pointermove', onMove, { passive: true });
    node.addEventListener('pointerleave', onLeave, { passive: true });
    return () => {
      node.removeEventListener('pointermove', onMove);
      node.removeEventListener('pointerleave', onLeave);
      node.style.removeProperty('--lx');
      node.style.removeProperty('--ly');
    };
  }, [ref, fine, reduced, ax, ay]);
}
