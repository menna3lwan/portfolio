import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// jsdom has neither of these; the components guard on them, the tests should too.
if (!window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }),
  });
}

if (!('IntersectionObserver' in window)) {
  class StubObserver implements IntersectionObserver {
    readonly root = null;
    readonly rootMargin = '';
    readonly thresholds: ReadonlyArray<number> = [];
    constructor(private readonly cb: IntersectionObserverCallback) {}
    observe(target: Element): void {
      // reveal immediately, so tests see the settled page rather than the entrance
      this.cb(
        [{ isIntersecting: true, target } as unknown as IntersectionObserverEntry],
        this,
      );
    }
    unobserve(): void {}
    disconnect(): void {}
    takeRecords(): IntersectionObserverEntry[] {
      return [];
    }
  }
  Object.defineProperty(window, 'IntersectionObserver', { writable: true, value: StubObserver });
}

afterEach(() => cleanup());
