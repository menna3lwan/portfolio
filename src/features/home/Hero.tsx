import { useEffect, useRef, useState } from 'react';
import { useLanguage } from '@/app/hooks/useAppContext';
import { useMotion } from '@/app/motion/runtime';
import { prefersReducedMotion } from '@/app/viewTransition';
import { siteCopy } from '@/content/site';
import { SplitText } from '@/components/site/SplitText';
import { Asterisk } from '@/components/site/icons';
import { useSite } from '@/components/site/site-context';

/**
 * The reference's hero: the title vertically centred, set character by character and
 * tilting with the pointer; the rotating "scroll down" badge bottom-left; "Open to work"
 * bottom-right. As it scrolls away the whole section fades to 30% and settles to 95%.
 */
export function Hero() {
  const { content, lang } = useLanguage();
  const copy = siteCopy(lang);
  const { introDone } = useSite();
  const runtime = useMotion();
  const section = useRef<HTMLElement>(null);
  const tilt = useRef<HTMLDivElement>(null);
  const reduced = prefersReducedMotion();
  // The characters wait out of sight until their entrance can run, so they never show
  // and then jump; if the runtime never arrives they are released after 8s regardless
  // (after the splash's own 6s fallback).
  const [pending, setPending] = useState(!reduced);

  useEffect(() => {
    if (!pending) return;
    const fallback = window.setTimeout(() => setPending(false), 8000);
    return () => window.clearTimeout(fallback);
  }, [pending]);

  useEffect(() => {
    const el = section.current;
    if (!el || !runtime || reduced || !introDone) return;
    const { gsap } = runtime;
    const ctx = gsap.context(() => {
      const chars = [
        ...document.querySelectorAll('[data-namesplit] .char, [data-namesplit] .word'),
        ...el.querySelectorAll('[data-split] .char, [data-split] .word'),
      ];
      gsap.fromTo(chars, { y: 100, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.02, duration: 2, ease: 'power4.out' });
      gsap.fromTo('[data-down]', { opacity: 0 }, { opacity: 1, duration: 2, ease: 'power4.out', delay: 1 });
      gsap.fromTo('[data-based]', { y: -10, opacity: 0 }, { y: 0, opacity: 1, duration: 2, ease: 'power4.out', delay: 1.5 });
      gsap.to(el, { opacity: 0.3, scale: 0.95, scrollTrigger: { trigger: el, start: 'top top', end: 'bottom top', scrub: 1 } });
      // As the hero leaves, its letters lift away at different rates — the centre of each
      // line first — so the title comes apart rather than sliding off as one block.
      const title = el.querySelectorAll('[data-split] .char, [data-split] .word');
      gsap.to(title, {
        yPercent: (i: number) => -40 - ((i * 37) % 5) * 22,
        ease: 'none',
        stagger: { each: 0.01, from: 'center' },
        scrollTrigger: { trigger: el, start: 'top top', end: 'bottom top', scrub: 1 },
      });
      gsap.to('.hero__bar', { yPercent: -60, ease: 'none', scrollTrigger: { trigger: el, start: 'top top', end: 'bottom top', scrub: 1 } });
      const ring = gsap.to('[data-ring]', { rotation: 360, duration: 10, repeat: -1, ease: 'none' });
      // The badge spins up with the scroll and winds back down to its own pace.
      const spin = { v: 1 };
      runtime.ScrollTrigger.create({
        trigger: el,
        start: 'top top',
        end: 'bottom top',
        onUpdate: (self) => {
          gsap.to(spin, { v: 1 + Math.min(Math.abs(self.getVelocity()) / 250, 8), duration: 0.2, overwrite: true, onUpdate: () => void ring.timeScale(spin.v) });
          gsap.to(spin, { v: 1, duration: 1.2, delay: 0.2, ease: 'power2.out', onUpdate: () => void ring.timeScale(spin.v) });
        },
      });
      gsap.to('[data-ast]', { rotation: -360, duration: 10, repeat: -1, ease: 'none' });
    }, el);
    setPending(false);

    let move: ((e: MouseEvent) => void) | null = null;
    let leave: (() => void) | null = null;
    const t = tilt.current;
    if (t && window.innerWidth >= 768) {
      const depth = 15;
      move = (e) => {
        const x = 2 * (e.clientX / window.innerWidth - 0.5);
        const y = 2 * (e.clientY / window.innerHeight - 0.5);
        gsap.to(t, { rotateY: x * depth * 0.5, rotateX: -y * depth * 0.5, x: x * depth, y: y * depth, duration: 0.5, ease: 'power2.out' });
      };
      leave = () => gsap.to(t, { rotateY: 0, rotateX: 0, x: 0, y: 0, duration: 0.8, ease: 'elastic.out(1, 0.5)' });
      window.addEventListener('mousemove', move);
      document.addEventListener('mouseleave', leave);
    }
    return () => {
      ctx.revert();
      if (move) window.removeEventListener('mousemove', move);
      if (leave) document.removeEventListener('mouseleave', leave);
    };
  }, [runtime, introDone, reduced]);

  return (
    <section className="hero" ref={section} data-intro={pending ? 'pending' : 'done'} aria-labelledby="hero-title">
      <div className="tilt" ref={tilt}>
        <h1 className="hero__title" id="hero-title">
          <span className="sr-only">
            {content.meta.name} — {copy.roleSr}
          </span>
          <span aria-hidden="true" data-split="">
            <SplitText text={copy.role[0]} lang={lang} />
            <br />
            <span className="l2">
              <SplitText text={copy.role[1]} lang={lang} />
            </span>
          </span>
        </h1>
      </div>
      <div className="hero__bar">
        <div className="badge" aria-hidden="true">
          <div className="badge__ring" data-ring="">
            <svg viewBox="0 0 100 100" width="100" height="100">
              <defs>
                <path id="badge-path" d="M 0,50 a 50,50 0 1,1 100,0 a 50,50 0 1,1 -100,0" />
              </defs>
              <text>
                <textPath href="#badge-path" startOffset="0">
                  {copy.scroll}
                </textPath>
              </text>
            </svg>
          </div>
          <div className="badge__ast" data-ast="">
            <Asterisk />
          </div>
        </div>
        <div className="open">
          <div className="open__row" data-down="">
            <div className="open__glow" />
            <p className="open__label">{copy.open}</p>
            <Asterisk className="open__ast" />
          </div>
          <p className="open__based" data-based="">
            <span className="open__focus">{copy.based[0]}</span>
            {copy.based[1]}
          </p>
        </div>
      </div>
    </section>
  );
}
