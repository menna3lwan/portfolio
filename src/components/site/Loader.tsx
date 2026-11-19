import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useMotion } from '@/app/motion/runtime';
import { prefersReducedMotion } from '@/app/viewTransition';
import { useSite } from './site-context';

const SEEN = 'site-visited';

const seenThisSession = (): boolean => {
  try {
    return window.sessionStorage.getItem(SEEN) === '1';
  } catch {
    return false;
  }
};

/**
 * The reference's first-visit loader: a 0 → 100 count over 2s (power2.inOut), a glow
 * that breathes three times, then five panels fold up and the screen fades. Once per
 * session, on the home page only, and never under reduced motion.
 */
export function Loader({ label }: { label: string }) {
  const { finishIntro } = useSite();
  const { pathname } = useLocation();
  const [show] = useState(() => pathname === '/' && !seenThisSession() && !prefersReducedMotion());
  const [count, setCount] = useState(0);
  const [gone, setGone] = useState(!show);
  const runtime = useMotion();
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!show) finishIntro();
  }, [show, finishIntro]);

  useEffect(() => {
    if (!show || !runtime || !root.current) return;
    const { gsap, lenis } = runtime;
    lenis?.stop();
    const el = root.current;
    const done = () => {
      try {
        window.sessionStorage.setItem(SEEN, '1');
      } catch {
        /* the loader simply shows again next time */
      }
      setGone(true);
      lenis?.start();
      finishIntro();
    };
    const counter = { v: 0 };
    const ctx = gsap.context(() => {
      gsap.to(counter, { v: 100, duration: 2, ease: 'power2.inOut', onUpdate: () => setCount(Math.floor(counter.v)) });
      gsap.to('.loader__blob', { scale: 1.2, duration: 1, ease: 'power2.inOut', yoyo: true, repeat: 2 });
      gsap
        .timeline({ onComplete: done })
        .to('.loader__panels span', { scaleY: 0, duration: 0.8, ease: 'power4.inOut', stagger: 0.1, transformOrigin: 'top', delay: 2.2 })
        .to(el, { opacity: 0, duration: 0.3 }, '-=0.2');
    }, el);
    return () => ctx.revert();
  }, [show, runtime, finishIntro]);

  if (gone) return null;
  return (
    <div className="loader" ref={root} aria-hidden="true">
      <div className="loader__blob" />
      <div className="loader__num">
        {count}
        <span className="loader__pct">%</span>
      </div>
      <div className="loader__panels">
        <span />
        <span />
        <span />
        <span />
        <span />
      </div>
      <div className="loader__label">
        <span>{label}</span>
      </div>
    </div>
  );
}
