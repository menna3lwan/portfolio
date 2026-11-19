/* =============================================================================
   The motion runtime: GSAP, ScrollTrigger and Lenis — the libraries the reference site
   itself runs on, so its easings and scroll behaviour can be reproduced exactly rather
   than approximated.

   They are loaded after first paint, as one chunk, and never block rendering: every
   section renders its finished state first and animates only once the runtime arrives.
   Under reduced motion Lenis is not created at all, and components skip their tweens.
   ========================================================================== */
import { useEffect, useState } from 'react';
import type { gsap as Gsap } from 'gsap';
import type { ScrollTrigger as ScrollTriggerType } from 'gsap/ScrollTrigger';
import type Lenis from 'lenis';
import { prefersReducedMotion } from '@/app/viewTransition';

export interface MotionRuntime {
  readonly gsap: typeof Gsap;
  readonly ScrollTrigger: typeof ScrollTriggerType;
  /** Smooth scrolling; null under reduced motion. */
  readonly lenis: Lenis | null;
}

let loaded: MotionRuntime | null = null;
let pending: Promise<MotionRuntime> | null = null;

export function loadMotion(): Promise<MotionRuntime> {
  if (loaded) return Promise.resolve(loaded);
  pending ??= Promise.all([import('gsap'), import('gsap/ScrollTrigger'), import('lenis')]).then(
    ([gsapModule, stModule, lenisModule]) => {
      const { gsap } = gsapModule;
      const { ScrollTrigger } = stModule;
      gsap.registerPlugin(ScrollTrigger);

      let lenis: Lenis | null = null;
      if (!prefersReducedMotion()) {
        const LenisClass = lenisModule.default;
        lenis = new LenisClass();
        lenis.on('scroll', ScrollTrigger.update);
        // One clock for everything: Lenis advances on GSAP's ticker.
        gsap.ticker.add((time) => lenis?.raf(time * 1000));
        gsap.ticker.lagSmoothing(0);
      }

      // Development only: lets a motion review step the animations frame by frame.
      if (import.meta.env.DEV) (window as unknown as { __gsap?: typeof gsap }).__gsap = gsap;

      loaded = { gsap, ScrollTrigger, lenis };
      return loaded;
    },
  );
  return pending;
}

/** The runtime once it has arrived; null until then. */
export function useMotion(): MotionRuntime | null {
  const [runtime, setRuntime] = useState<MotionRuntime | null>(loaded);
  useEffect(() => {
    if (runtime) return;
    let alive = true;
    void loadMotion().then((r) => {
      if (alive) setRuntime(r);
    });
    return () => {
      alive = false;
    };
  }, [runtime]);
  return runtime;
}

/** Reset to the top of the page, whether or not Lenis is currently stopped. */
export function scrollToTop(): void {
  window.scrollTo(0, 0);
  loaded?.lenis?.scrollTo(0, { immediate: true, force: true });
}
