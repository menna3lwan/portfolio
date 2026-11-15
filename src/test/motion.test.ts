import { afterEach, describe, expect, it, vi } from 'vitest';
import { commitWithTransition } from '@/app/viewTransition';

/* The DOM lib types startViewTransition as always present and strictly shaped; these
   cases need to add, remove and stub it, so the document is widened here only. */
type Doc = Omit<Document, 'startViewTransition'> & {
  startViewTransition?: (cb: () => void) => { finished: Promise<void> };
};

const doc = () => document as unknown as Doc;

afterEach(() => {
  delete doc().startViewTransition;
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
