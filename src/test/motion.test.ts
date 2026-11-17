import { afterEach, describe, expect, it, vi } from 'vitest';
import { commitWithTransition, withSharedElement } from '@/app/viewTransition';

/* The DOM lib types startViewTransition as always present and strictly shaped; these
   cases need to add, remove and stub it, so the document is widened here only. */
type Doc = Omit<Document, 'startViewTransition'> & {
  startViewTransition?: (cb: () => void) => { finished: Promise<void> };
};

const doc = () => document as unknown as Doc;

afterEach(() => {
  delete doc().startViewTransition;
  delete document.documentElement.dataset.vt;
  vi.restoreAllMocks();
});

/**
 * The cross-fade is an enhancement, never a dependency. Every one of these cases must
 * end with the change applied — the question is only whether it was animated.
 */
describe('commitWithTransition', () => {
  it('applies the change through the API when it is available', () => {
    const update = vi.fn();
    const start = vi.fn((cb: () => void) => {
      cb();
      return { finished: Promise.resolve() };
    });
    doc().startViewTransition = start;

    commitWithTransition(update);

    expect(start).toHaveBeenCalledTimes(1);
    expect(update).toHaveBeenCalledTimes(1);
  });

  it('applies the change directly where the API is missing', () => {
    const update = vi.fn();
    expect(doc().startViewTransition).toBeUndefined();

    commitWithTransition(update);

    expect(update).toHaveBeenCalledTimes(1);
  });

  it('skips the cross-fade when motion is not wanted, and still applies the change', () => {
    const update = vi.fn();
    const start = vi.fn();
    doc().startViewTransition = start;

    commitWithTransition(update, false);

    expect(start).not.toHaveBeenCalled();
    expect(update).toHaveBeenCalledTimes(1);
  });
});

/**
 * The shared-element morph and the named transitions. The browser's own animation is not
 * observable in jsdom, so what these pin is the contract around it: that a name is only
 * ever attached for the duration of one transition, and that every path still commits the
 * change even when nothing can animate.
 */
describe('named transitions', () => {
  it('labels the root so the stylesheet can choreograph each kind', () => {
    const start = vi.fn((cb: () => void) => {
      cb();
      return { finished: Promise.resolve() };
    });
    doc().startViewTransition = start;

    commitWithTransition(() => {}, true, 'theme');
    expect(document.documentElement.dataset.vt).toBe('theme');
  });

  it('adds no label when the change is not animated', () => {
    delete document.documentElement.dataset.vt;
    commitWithTransition(() => {}, false, 'theme');
    expect(document.documentElement.dataset.vt).toBeUndefined();
  });
});

describe('withSharedElement', () => {
  it('names the element, applies the change, and takes the name back', async () => {
    const el = document.createElement('div');
    const start = vi.fn((cb: () => void) => {
      cb();
      // the name has to still be on the element while the snapshot is taken
      expect(el.style.viewTransitionName).toBe('case-preview');
      return { finished: Promise.resolve() };
    });
    doc().startViewTransition = start;

    const run = vi.fn();
    withSharedElement(el, 'case-preview', run);
    await Promise.resolve();
    await Promise.resolve();

    expect(run).toHaveBeenCalledTimes(1);
    expect(el.style.viewTransitionName).toBe('');
  });

  it('still applies the change with no element and no API', () => {
    const run = vi.fn();
    withSharedElement(null, 'case-preview', run);
    expect(run).toHaveBeenCalledTimes(1);
  });
});
