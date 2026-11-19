import { useEffect, useRef } from 'react';
import { useMotion } from '@/app/motion/runtime';
import { prefersReducedMotion } from '@/app/viewTransition';

/**
 * The reference's cursor: a 40px ring (0.5s, power3.out), an 8px dot (0.1s) and a trail
 * of five fading dots (0.4s + 0.1s each). Over a link or button the ring grows ×1.3 and
 * the dot shrinks away; over a magnetic element the ring grows ×1.5 and fills faintly.
 *
 * Only for a fine pointer on a screen at least 768px wide, and never under reduced
 * motion — everywhere else the system cursor is left alone.
 */
export function Cursor() {
  const wrap = useRef<HTMLDivElement>(null);
  const runtime = useMotion();

  useEffect(() => {
    const el = wrap.current;
    if (!el || !runtime) return;
    if (prefersReducedMotion() || window.innerWidth < 768 || !window.matchMedia('(pointer: fine)').matches) return;
    const { gsap } = runtime;
    const root = document.documentElement;
    root.classList.add('has-cursor');
    const ring = el.querySelector<HTMLElement>('.c-ring')!;
    const dot = el.querySelector<HTMLElement>('.c-dot')!;
    const trails = [...el.querySelectorAll<HTMLElement>('.c-trail')];
    gsap.set([ring, dot, ...trails], { x: -100, y: -100 });

    const move = (e: MouseEvent) => {
      if (e.clientX === 0 && e.clientY === 0) return;
      el.classList.remove('is-out');
      gsap.to(ring, { x: e.clientX, y: e.clientY, duration: 0.5, ease: 'power3.out' });
      gsap.to(dot, { x: e.clientX, y: e.clientY, duration: 0.1, ease: 'power2.out' });
      trails.forEach((t, i) => gsap.to(t, { x: e.clientX, y: e.clientY, duration: 0.4 + 0.1 * i, ease: 'power2.out' }));
    };
    const out = () => el.classList.add('is-out');
    const over = (e: MouseEvent) => {
      const target = e.target as Element;
      if (target.closest('.magnetic, .git')) {
        ring.classList.add('is-filled');
        gsap.to(ring, { scale: 1.5, duration: 0.3, ease: 'power2.out' });
      } else if (target.closest('a, button')) {
        gsap.to(ring, { scale: 1.3, duration: 0.2, ease: 'power2.out' });
        gsap.to(dot, { scale: 0, duration: 0.2, ease: 'power2.out' });
      }
    };
    const leave = (e: MouseEvent) => {
      const from = (e.target as Element).closest('.magnetic, .git, a, button');
      if (!from || (e.relatedTarget instanceof Node && from.contains(e.relatedTarget))) return;
      ring.classList.remove('is-filled');
      gsap.to(ring, { scale: 1, duration: 0.25, ease: 'power2.out' });
      gsap.to(dot, { scale: 1, duration: 0.2, ease: 'power2.out' });
    };

    window.addEventListener('mousemove', move);
    document.addEventListener('mouseleave', out);
    document.addEventListener('mouseover', over);
    document.addEventListener('mouseout', leave);
    return () => {
      root.classList.remove('has-cursor');
      window.removeEventListener('mousemove', move);
      document.removeEventListener('mouseleave', out);
      document.removeEventListener('mouseover', over);
      document.removeEventListener('mouseout', leave);
    };
  }, [runtime]);

  return (
    <div className="cursor" ref={wrap} aria-hidden="true">
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="c-trail"
          style={{
            width: 14 - 2.5 * i,
            height: 14 - 2.5 * i,
            zIndex: 9996 - i,
            background: `rgb(var(--soft-rgb) / ${0.15 - 0.025 * i})`,
          }}
        />
      ))}
      <div className="c-ring" />
      <div className="c-dot" />
    </div>
  );
}
