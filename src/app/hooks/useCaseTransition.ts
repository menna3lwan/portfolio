import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { flushSync } from 'react-dom';
import { prefersReducedMotion, supportsViewTransitions } from '@/app/viewTransition';

/** A plain left click with no modifier. Anything else — a middle click, ⌘-click, a
 *  right click — belongs to the browser, and intercepting it would break opening a case
 *  study in a new tab. */
const isPlainClick = (event: React.MouseEvent): boolean =>
  event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;

/**
 * Carry a project's device preview from its card to its case study.
 *
 * Both ends mark their preview with `data-shared`; the stylesheet gives that element a
 * `view-transition-name` for the duration of a `case` transition only, so the browser
 * matches the two and interpolates position, size and aspect rather than cross-fading a
 * disappearance against an appearance. The card itself travels the same way.
 *
 * Measured against the alternative: Motion's `layoutId` does this well, and costs **50 KB
 * gzipped** — 36% on top of this site's entire first-load JavaScript, for one transition.
 * The platform does it for nothing, on the compositor, and has been Baseline since
 * October 2025.
 *
 * Everything degrades to an ordinary navigation: without the API, with reduced motion, or
 * on any click the browser should own.
 */
export function useCaseTransition() {
  const navigate = useNavigate();

  return useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>, to: string) => {
      if (!isPlainClick(event)) return;
      if (!supportsViewTransitions() || prefersReducedMotion()) return;

      event.preventDefault();

      /* The preview inside the card that was clicked — not the first on the page. */
      const card = event.currentTarget.closest('.exp');
      const preview = card?.querySelector<HTMLElement>('.stage__body');
      preview?.setAttribute('data-shared', '');
      card?.setAttribute('data-shared-card', '');

      const root = document.documentElement;
      root.dataset.vt = 'case';

      const clear = () => {
        preview?.removeAttribute('data-shared');
        card?.removeAttribute('data-shared-card');
        if (root.dataset.vt === 'case') delete root.dataset.vt;
      };

      const transition = document.startViewTransition(() => {
        flushSync(() => navigate(to));
        /* The case study starts at the top of the document; scrolling after the snapshot
           would make the new page animate in from wherever the old one had been left. */
        window.scrollTo(0, 0);
      });
      transition.finished.then(clear, clear);
    },
    [navigate],
  );
}
