import { flushSync } from 'react-dom';

/** The DOM lib declares `startViewTransition` as always present; it is not, so the
 *  feature check reads it as optional rather than trusting the type. */
type MaybeTransitions = Partial<Pick<Document, 'startViewTransition'>>;

export const supportsViewTransitions = (): boolean =>
  typeof document !== 'undefined' &&
  typeof (document as Document & MaybeTransitions).startViewTransition === 'function';

export const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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
 * Where the API is missing or motion is not wanted, the change is applied directly and the
 * result is exactly what it was before: instant, and correct. Same-document view
 * transitions reached Baseline on 2025-10-14, so that path is now the rare one.
 *
 * `kind` names the transition on the root element so the stylesheet can give each one its
 * own choreography — the theme switch sweeps, a route change dissolves — without any of
 * them having to know about the others.
 */
export function commitWithTransition(update: () => void, animate = true, kind?: string): void {
  const doc = document as Document & MaybeTransitions;
  if (!animate || typeof doc.startViewTransition !== 'function') {
    update();
    return;
  }

  const root = document.documentElement;
  if (kind) root.dataset.vt = kind;

  const transition = doc.startViewTransition(() => flushSync(update));
  /* The attribute has to outlive the snapshot, or the pseudo-elements lose the selector
     that styles them half-way through. `finished` also rejects when a transition is
     skipped — which is normal, not an error — so the cleanup is attached to both. */
  const clear = () => {
    if (root.dataset.vt === kind) delete root.dataset.vt;
  };
  transition.finished.then(clear, clear);
}

/**
 * Give one element a view-transition name for the duration of one navigation.
 *
 * This is what makes a project's device preview appear to travel from its card in the Work
 * chapter to the top of its case study, rather than the one disappearing and the other
 * fading in somewhere else. Both ends carry the same name, so the browser matches them and
 * interpolates position, size and aspect between the two — the shared-element morph that
 * `layoutId` would otherwise be carrying a 50 KB dependency to do.
 *
 * The name is applied only while a transition is in flight. Left on permanently it would
 * promote nine previews to their own snapshot layer on every single transition, including
 * the theme switch, which is both wasteful and wrong: two elements sharing a name at
 * capture time make the transition fail outright.
 */
export function withSharedElement(
  element: HTMLElement | null,
  name: string,
  run: () => void,
): void {
  if (!element) {
    run();
    return;
  }
  element.style.viewTransitionName = name;
  const clear = () => {
    element.style.viewTransitionName = '';
  };
  const doc = document as Document & MaybeTransitions;
  if (typeof doc.startViewTransition !== 'function') {
    run();
    clear();
    return;
  }
  const transition = doc.startViewTransition(() => flushSync(run));
  transition.finished.then(clear, clear);
}
