import { useEffect, useRef } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { useMotion } from '@/app/motion/runtime';
import { prefersReducedMotion } from '@/app/viewTransition';

/**
 * The reference's magnetic wrapper: within a radius of the element's shorter side, it
 * follows the pointer by `strength` of the offset (its content by a fifth of that), and
 * springs back on leave. Off below 768px and under reduced motion.
 */
export function Magnetic({
  strength = 0.15,
  className = '',
  style,
  innerStyle,
  children,
}: {
  strength?: number;
  className?: string;
  style?: CSSProperties;
  innerStyle?: CSSProperties;
  children: ReactNode;
}) {
  const outer = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLSpanElement>(null);
  const runtime = useMotion();

  useEffect(() => {
    const el = outer.current;
    if (!el || !runtime || window.innerWidth < 768 || prefersReducedMotion()) return;
    const { gsap } = runtime;
    const move = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      if (Math.sqrt(dx * dx + dy * dy) > Math.min(r.width, r.height)) return;
      gsap.to(el, { x: dx * strength, y: dy * strength, duration: 0.4, ease: 'power2.out' });
      gsap.to(inner.current, { x: dx * strength * 0.2, y: dy * strength * 0.2, duration: 0.4, ease: 'power2.out' });
    };
    const leave = () => {
      gsap.to(el, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1, 0.3)' });
      gsap.to(inner.current, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1, 0.3)' });
    };
    el.addEventListener('mousemove', move);
    el.addEventListener('mouseleave', leave);
    return () => {
      el.removeEventListener('mousemove', move);
      el.removeEventListener('mouseleave', leave);
    };
  }, [runtime, strength]);

  return (
    <div ref={outer} className={`magnetic ${className}`} style={style}>
      <span ref={inner} style={innerStyle}>
        {children}
      </span>
    </div>
  );
}
