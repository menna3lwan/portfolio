import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useMotion } from '@/app/motion/runtime';
import { prefersReducedMotion } from '@/app/viewTransition';
import { useSite } from './site-context';
import { AIN_DEEP_PATH, AIN_PATH, AIN_SHADE_PATH, LOGO_COLORS, LOGO_H, LOGO_W, M_PATH } from './logoPaths';

const SEEN = 'site-visited';

const seenThisSession = (): boolean => {
  try {
    return window.sessionStorage.getItem(SEEN) === '1';
  } catch {
    return false;
  }
};

/* The Ain as one pen gesture along the ribbon's centre line — from the upper tip, round
   the loop, through the joint, down into the bowl and out along the tail — and the
   hooked lower tip of the head as a flick from the joint. A 46-unit stroke along each,
   used as a mask, writes the letter's vector shape; at rest the mask is gone. */
const GESTURE =
  'M117 1C108 6 92 15 78 24C64 33 56 40 40 50C27 58 19 68 18 82C17 96 26 107 40 111C55 115 68 118 79 120C87 122 78 140 70 156C62 172 49 188 45 202C41 216 42 231 48 241C56 254 76 263 98 267C125 271 158 264 186 255C206 248 224 235 235 210';
const FLICK = 'M80 118C94 118 108 110 118 100C129 89 140 76 148 65';
const JOINT = { x: 79, y: 120 };

/* While they are made, the two letters stand apart: the Ain to the left, the M to the
   right, clear of each other. */
const AIN_APART = { x: -140, y: -8, rotation: -5 };
const M_APART = { x: 112 };

/**
 * First-visit splash: the logo is made, then assembled.
 *
 * Both letters are clean vector shapes traced from the logo (scripts/trace-logo.py), so
 * every edge is sharp at any size and at every frame. They are made apart, side by side:
 * the M is drawn as an outline, ruled in one line, and then filled from the baseline up;
 * the Ain is written beside it in a single pen gesture. Once both are whole they travel
 * toward each other — slowly at first, then with intent — and the Ain settles into its
 * seat over the M, passing it by a hair and coming back; its shadow falls on the M as it
 * lands, and the logo gives a little and rests. The page then opens as the panels lift,
 * the logo rising ahead of them.
 *
 * Once per session, on the home page only, and never under reduced motion.
 */
export function Loader({ label }: { label: string }) {
  const { finishIntro } = useSite();
  const { pathname } = useLocation();
  const [show] = useState(() => pathname === '/' && !seenThisSession() && !prefersReducedMotion());
  const [gone, setGone] = useState(!show);
  const runtime = useMotion();
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!show) finishIntro();
  }, [show, finishIntro]);

  // If the animation runtime never arrives (a failed chunk), the page is not held behind
  // the splash: after 6s it simply opens.
  useEffect(() => {
    if (!show || gone || runtime) return;
    const timer = window.setTimeout(() => {
      setGone(true);
      finishIntro();
    }, 6000);
    return () => window.clearTimeout(timer);
  }, [show, gone, finishIntro, runtime]);

  useEffect(() => {
    if (!show || !runtime || !root.current) return;
    const { gsap, lenis } = runtime;
    lenis?.stop();
    const el = root.current;
    let cancelled = false;
    let ctx: ReturnType<typeof gsap.context> | null = null;

    // The page starts moving while the panels are still lifting, so the two read as one.
    const release = () => {
      try {
        window.sessionStorage.setItem(SEEN, '1');
      } catch {
        /* the splash simply shows again next time */
      }
      lenis?.start();
      finishIntro();
    };
    const done = () => {
      release();
      setGone(true);
    };

    void import('gsap/CustomEase').then(({ CustomEase }) => {
      if (cancelled) return;
      gsap.registerPlugin(CustomEase);
      /* The pen: lands softly, moves evenly round the loop, carries its speed into the
         bowl and lets it run out slowly along the tail. */
      const write = CustomEase.create('splash-write', 'M0,0 C0.16,0 0.26,0.2 0.38,0.38 0.54,0.62 0.62,0.86 1,1');
      /* Ruling the M's outline: an even line that eases in and out. */
      const rule = CustomEase.create('splash-rule', 'M0,0 C0.3,0 0.25,0.3 0.45,0.55 0.62,0.78 0.72,1 1,1');
      /* Coming together: a slow start, real speed through the middle, a long arrival
         that passes the mark by a hair and returns. */
      const meet = CustomEase.create('splash-meet', 'M0,0 C0.34,0 0.28,0.62 0.56,0.9 0.68,1.02 0.8,1.012 1,1');
      /* The give as they land: there and back, easing at both ends. */
      const give = CustomEase.create('splash-give', 'M0,0 C0.2,0.6 0.34,1 0.5,1 0.66,1 0.8,0 1,0');

      ctx = gsap.context(() => {
        const [gesture, flick] = [...el.querySelectorAll<SVGPathElement>('.splash__pen')];
        const logoEl = el.querySelector<SVGSVGElement>('.splash__logo');
        const ainEl = el.querySelector<SVGGElement>('.splash__ain');
        const mEl = el.querySelector<SVGGElement>('.splash__m');
        const outline = el.querySelector<SVGPathElement>('.splash__m-outline');
        const fill = el.querySelector<SVGPathElement>('.splash__m-fill');
        const shadow = el.querySelector<SVGGElement>('.splash__shadow');
        if (!gesture || !flick || !logoEl || !ainEl || !mEl || !outline || !fill || !shadow) return;

        // Where the pen crosses the joint, as a fraction of the gesture.
        const length = gesture.getTotalLength();
        let joint = 0.45;
        let best = Infinity;
        for (let i = 0; i <= 200; i++) {
          const p = gesture.getPointAtLength((i / 200) * length);
          const d = Math.hypot(p.x - JOINT.x, p.y - JOINT.y);
          if (d < best) {
            best = d;
            joint = i / 200;
          }
        }

        // Apart, unmade.
        gsap.set(ainEl, { ...AIN_APART, svgOrigin: '120 160' });
        gsap.set(mEl, { ...M_APART, svgOrigin: '148 200' });
        gsap.set([gesture, flick], { strokeDasharray: '1 2', strokeDashoffset: 1, opacity: 0 });
        // Dashes are written as plain numbers, so the path's pathLength of 1 scales them.
        outline.style.strokeDasharray = '1 2';
        outline.style.strokeDashoffset = '1';
        const ruled = { o: 1 };
        gsap.set(fill, { clipPath: 'inset(100% 0% 0% 0%)' });
        gsap.set([ainEl, mEl], { visibility: 'visible' });

        const pen = { p: 0 };
        const sine = gsap.parseEase('sine.inOut');
        const FLICK_SPAN = 0.2;
        const WRITE = 1.65;
        const W_AT = 0.4;
        const tl = gsap.timeline({ onComplete: done });

        tl
          // The glow gathers.
          .fromTo('.splash__glow', { opacity: 0, scale: 0.7 }, { opacity: 1, scale: 1, duration: 2, ease: 'sine.out' }, 0)
          // The M: its outline ruled in one line…
          .to(ruled, { o: 0, duration: 1.15, ease: rule, onUpdate: () => void (outline.style.strokeDashoffset = String(ruled.o)) }, 0.2)
          // …then filled from the baseline up, while the outline gives way to the fill.
          .to(fill, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.8, ease: 'expo.inOut' }, 1.15)
          .to(outline, { opacity: 0, duration: 0.5, ease: 'sine.inOut' }, 1.6)
          // The Ain, beside it: written in one gesture, the hook flicked out at the joint.
          .set(gesture, { opacity: 1 }, W_AT)
          .to(
            pen,
            {
              p: 1,
              duration: WRITE,
              ease: write,
              onUpdate: () => {
                gesture.style.strokeDashoffset = String(1 - pen.p);
                const f = gsap.utils.clamp(0, 1, (pen.p - joint) / FLICK_SPAN);
                flick.style.opacity = f > 0 ? '1' : '0';
                flick.style.strokeDashoffset = String(1 - sine(f));
              },
            },
            W_AT,
          )
          // Written, the mask comes off: the letter is its own clean shape from here.
          .add(() => ainEl.querySelector('.splash__ain-shape')?.removeAttribute('mask'), W_AT + WRITE);

        // Both whole: they come together. The Ain arcs a little as it travels.
        const meetAt = W_AT + WRITE + 0.15;
        const MEET = 1.25;
        tl.to(mEl, { x: 0, duration: MEET, ease: meet }, meetAt)
          .to(ainEl, { x: 0, duration: MEET, ease: meet }, meetAt)
          .to(ainEl, { y: 0, rotation: 0, duration: MEET, ease: 'sine.inOut' }, meetAt)
          // As it lands its shadow falls on the M, and the logo gives a little.
          .to(shadow, { opacity: 1, duration: 0.6, ease: 'sine.out' }, meetAt + MEET * 0.55)
          .to(logoEl, { scale: 0.985, duration: 0.8, ease: give }, meetAt + MEET * 0.6)
          .to('.splash__glow', { scale: 1.12, duration: 1.3, ease: give }, meetAt + MEET * 0.45);

        // Out: the logo rises and thins; the panels lift after it, one by one, and the
        // page beneath starts moving as the first of them goes.
        const out = meetAt + MEET + 0.45;
        tl.to(logoEl, { y: -36, scale: 0.95, duration: 0.8, ease: 'power2.in' }, out)
          .to(logoEl, { opacity: 0, duration: 0.45, ease: 'sine.in' }, out + 0.3)
          .to('.splash__glow', { opacity: 0, scale: 0.85, duration: 0.8, ease: 'sine.in' }, out)
          .to('.splash__label', { opacity: 0, duration: 0.4, ease: 'sine.in' }, out)
          .to('.loader__panels span', { yPercent: -100, duration: 1.05, ease: 'expo.inOut', stagger: 0.055 }, out + 0.4)
          .add(release, out + 0.55);
      }, el);
    });

    return () => {
      cancelled = true;
      ctx?.revert();
    };
  }, [show, runtime, finishIntro]);

  if (gone) return null;
  return (
    <div className="loader" ref={root} aria-hidden="true">
      <div className="loader__panels">
        <span />
        <span />
        <span />
        <span />
        <span />
      </div>
      <div className="splash__glow" />
      <svg className="splash__logo" viewBox={`0 0 ${LOGO_W} ${LOGO_H}`} focusable="false">
        <defs>
          <mask id="splash-pen" maskUnits="userSpaceOnUse" x="-40" y="-40" width={LOGO_W + 80} height={LOGO_H + 80}>
            {[GESTURE, FLICK].map((d) => (
              <path
                key={d}
                className="splash__pen"
                d={d}
                pathLength={1}
                fill="none"
                stroke="#fff"
                strokeWidth={46}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ))}
          </mask>
          <clipPath id="splash-ain-clip" clipPathUnits="userSpaceOnUse">
            <path d={AIN_PATH} />
          </clipPath>
          {/* The fold's shading, softened inside the ribbon's own edge. */}
          <filter id="splash-soft" x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation="1.6" />
          </filter>
          {/* The ribbon's shadow on the M: soft, down and to the left, as in the artwork. */}
          <filter id="splash-cast" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3.2" />
          </filter>
        </defs>

        <g className="splash__m">
          <path className="splash__m-fill" d={M_PATH} fill={LOGO_COLORS.m} />
          <path
            className="splash__m-outline"
            d={M_PATH}
            pathLength={1}
            fill="none"
            stroke={LOGO_COLORS.m}
            strokeWidth={1.4}
            strokeLinejoin="round"
          />
        </g>

        <g className="splash__ain">
          <g className="splash__shadow" filter="url(#splash-cast)">
            <path d={AIN_PATH} fill="#000" fillOpacity={0.55} transform="translate(-3 4)" />
          </g>
          <g className="splash__ain-shape" mask="url(#splash-pen)">
            <path d={AIN_PATH} fill={LOGO_COLORS.ain} />
            <g clipPath="url(#splash-ain-clip)" filter="url(#splash-soft)">
              <path d={AIN_SHADE_PATH} fill={LOGO_COLORS.shade} />
              <path d={AIN_DEEP_PATH} fill={LOGO_COLORS.deep} />
            </g>
          </g>
        </g>
      </svg>
      <div className="loader__label splash__label">
        <span>{label}</span>
      </div>
    </div>
  );
}
