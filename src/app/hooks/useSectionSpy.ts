import { useEffect, useState } from 'react';

/**
 * Which section the reader is in.
 *
 * A band across the middle of the viewport decides; when two sections overlap it, the
 * later one wins, so the indicator advances as the reader scrolls down rather than
 * flickering between neighbours.
 */
export function useSectionSpy(ids: readonly string[], enabled = true): string | null {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || typeof IntersectionObserver === 'undefined') return;

    const visible = new Set<string>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target.id);
          else visible.delete(entry.target.id);
        }
        const inOrder = ids.filter((id) => visible.has(id));
        setActive(inOrder.length ? (inOrder[inOrder.length - 1] ?? null) : null);
      },
      { rootMargin: '-45% 0px -50% 0px' },
    );

    for (const id of ids) {
      const node = document.getElementById(id);
      if (node) observer.observe(node);
    }

    return () => observer.disconnect();
  }, [ids, enabled]);

  return active;
}
