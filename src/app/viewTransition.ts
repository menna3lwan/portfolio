import { flushSync } from 'react-dom';

/** The DOM lib declares `startViewTransition` as always present; it is not, so the
 *  feature check reads it as optional rather than trusting the type. */
type MaybeTransitions = Partial<Pick<Document, 'startViewTransition'>>;

/**
 * Commit a state change as a cross-fade rather than a cut.
 *
 * Switching theme or language replaces the colour of every surface, or the direction of
 * the whole layout, in one frame. Done instantly that is a flash — the single harshest
 * moment in the interface, and the one most likely to make someone blink.
 *
 * The View Transitions API does the work the right way round: the browser snapshots the
 * page, applies the change, and cross-fades the two. There is no per-element transition,
 * so the cost does not grow with the two thousand elements on this page, and nothing
 * moves — only the pixels dissolve.
 *
 * `flushSync` is required: the API captures whatever the DOM looks like when the callback
 * returns, and React would otherwise still be holding the update.
 *
 * Where the API is missing (Firefox today) or motion is not wanted, the change is applied
 * directly and the result is exactly what it was before: instant, and correct.
 */
export function commitWithTransition(update: () => void, animate = true): void {
  const doc = document as Document & MaybeTransitions;
  if (!animate || typeof doc.startViewTransition !== 'function') {
    update();
    return;
  }
  doc.startViewTransition(() => flushSync(update));
}

export const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
