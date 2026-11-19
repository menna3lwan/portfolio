import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useMotion } from '@/app/motion/runtime';
import { prefersReducedMotion } from '@/app/viewTransition';
import ainLayer from '@/assets/logo-layers/logo-ain.webp';
import mLayer from '@/assets/logo-layers/logo-m.webp';
import logo from '@/assets/logo-dark.webp';
import { useSite } from './site-context';

const SEEN = 'site-visited';

const seenThisSession = (): boolean => {
  try {
    return window.sessionStorage.getItem(SEEN) === '1';
  } catch {
    return false;
  }
};

/* The logo's own coordinate space: the 297×320 source the two layers were cut from
   (scripts/make-logo-layers.py). */
const W = 297;
const H = 320;

/* The Ain as one pen gesture along the ribbon's centre line: from the upper tip, round
   the loop, through the joint where head meets tail, down into the bowl and out along
   the tail. The hooked lower tip of the head is a separate flick, made as the pen passes
   the joint. The writing stroke (46 units) is a little narrower than the ribbon, so its
   leading edge stays at the pen even where the ribbon loops back on itself; when the
   gesture ends the full ribbon settles in over it, like ink reaching its edges. */
const GESTURE =
  'M117 1C108 6 92 15 78 24C64 33 56 40 40 50C27 58 19 68 18 82C17 96 26 107 40 111C55 115 68 118 79 120C87 122 78 140 70 156C62 172 49 188 45 202C41 216 42 231 48 241C56 254 76 263 98 267C125 271 158 264 186 255C206 248 224 235 235 210';
const FLICK = 'M80 118C94 118 108 110 118 100C129 89 140 76 148 65';
const JOINT = { x: 79, y: 120 };

/* The M's four strokes, cut along vertical lines through its joints, in the order an M
   is written — up the left stem, down the left diagonal, up the right diagonal, down the
   right stem. They are written by one continuous pen that starts as the Ain's tail
   sweeps into the bowl; each stroke picks up while the one before is still finishing. */
const STROKES: readonly { x0: number; x1: number; dir: 1 | -1 }[] = [
  { x0: 0, x1: 58, dir: -1 },
  { x0: 58, x1: 145, dir: 1 },
  { x0: 145, x1: 237, dir: -1 },
  { x0: 237, x1: W, dir: 1 },
];
const M_START_X = 46; // the tail's x, low in the bowl, when the M's pen starts
const M_WRITE = 1.4; // the whole M, seconds
const M_SPAN = 0.5; // the share of the M's progress each stroke takes
/* Where each stroke starts in the M's progress. The left diagonal and the right stem
   start early: the one's top runs under the Ain's head and the other's window first
   crosses the empty space above the M, so each is under way before it can be seen. */
const M_STARTS = [0, 0.13, 0.31, 0.44];

/* The pen's timing, in seconds. */
const WRITE = 1.75;
const WRITE_AT = 0.3;

/**
 * First-visit splash: the logo forms in one continuous movement.
 *
 * The Ain is written in a single gesture, floating a little above its place — unhurried
 * through the loop, gathering speed into the bowl, easing out along the tail. Wherever
 * the tail passes, the M is written behind it, stroke by stroke in the way an M is
 * written. As the pen lifts, the Ain draws back a breath and then sinks into its seat in
 * the M with a soft overshoot; the logo answers with a small give, and rests. The page
 * then opens as the panels lift, the logo rising ahead of them and the hero already
 * moving beneath.
 *
 * Everything moves the logo's own pixels (the two layers of the original artwork),
 * masked and translated, and the resting frame is the logo file itself. Once per
 * session, on the home page only, and never under reduced motion.
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

    // The layers are decoded before the first stroke, so nothing pops in half-way; a
    // slow network gets 1.5s, then the splash runs with whatever has arrived.
    const decode = (src: string) => {
      const img = new Image();
      img.src = src;
      return img.decode().catch(() => undefined);
    };
    const ready = Promise.all([
      import('gsap/CustomEase'),
      Promise.race([
        Promise.all([decode(ainLayer), decode(mLayer), decode(logo)]),
        new Promise((resolve) => window.setTimeout(resolve, 1500)),
      ]),
    ]);

    void ready.then(([{ CustomEase }]) => {
      if (cancelled) return;
      gsap.registerPlugin(CustomEase);
      /* The pen: lands softly, moves evenly round the loop, carries its speed into the
         bowl and lets it run out slowly along the tail. */
      const write = CustomEase.create('splash-write', 'M0,0 C0.16,0 0.26,0.2 0.38,0.38 0.54,0.62 0.62,0.86 1,1');
      /* A stroke of the M: picks up gently, travels at an even pace, slows into its end. */
      const stroke = CustomEase.create('splash-stroke', 'M0,0 C0.2,0 0.3,0.28 0.5,0.55 0.68,0.8 0.78,1 1,1');
      /* The Ain into its seat: a slow fall that passes its mark by a few percent and returns. */
      const seat = CustomEase.create('splash-seat', 'M0,0 C0.3,0 0.32,0.72 0.5,0.94 0.62,1.06 0.76,1.03 1,1');
      /* The give when it lands: there and back, easing at both ends. */
      const give = CustomEase.create('splash-give', 'M0,0 C0.2,0.6 0.34,1 0.5,1 0.66,1 0.8,0 1,0');

      ctx = gsap.context(() => {
        const [gesture, flick] = [...el.querySelectorAll<SVGPathElement>('.splash__stroke')];
        const ain = el.querySelector<SVGGElement>('.splash__ain');
        const logoEl = el.querySelector<SVGSVGElement>('.splash__logo');
        const pieces = [...el.querySelectorAll<SVGImageElement>('.splash__piece')];
        const bands = [...el.querySelectorAll<SVGGElement>('.splash__band')];
        if (!gesture || !flick || !ain || !logoEl) return;

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

        gsap.set([gesture, flick], { strokeDasharray: '1 2', strokeDashoffset: 1, opacity: 0 });
        // Each band's window is a CSS inset over the logo's view box, which repaints
        // reliably as it changes (an animated <clipPath> rect does not, in Chromium).
        const reveal = (i: number, k: number) => {
          const s = STROKES[i];
          const band = bands[i];
          if (!s || !band) return;
          const left = ((s.x0 - 0.75) / W) * 100;
          const right = 100 - ((s.x1 + 0.75) / W) * 100;
          const hidden = (1 - k) * 100;
          const [top, bottom] = s.dir < 0 ? [hidden, 0] : [0, hidden];
          band.style.clipPath = `inset(${top}% ${right}% ${bottom}% ${left}%) view-box`;
        };
        STROKES.forEach((s, i) => {
          reveal(i, 0);
          const piece = pieces[i];
          if (piece) gsap.set(piece, { y: s.dir < 0 ? 18 : -18, opacity: 1 });
        });
        gsap.set(ain, { x: -6, y: -24, scale: 1.08, rotation: -4, svgOrigin: '125 150' });

        // The M is written behind the tail by its own pen: one progress, shared out over
        // the four strokes so each starts while the last is still settling.
        const mPen = { p: 0 };
        const drawM = () => {
          STROKES.forEach((s, i) => {
            const local = gsap.utils.clamp(0, 1, (mPen.p - (M_STARTS[i] ?? 0)) / M_SPAN);
            reveal(i, stroke(local));
            const piece = pieces[i];
            if (piece) gsap.set(piece, { y: (s.dir < 0 ? 18 : -18) * (1 - stroke(Math.min(1, local * 0.85))) });
          });
        };
        let mStarted = false;
        const follow = (progress: number) => {
          if (mStarted || progress < joint) return;
          const tip = gesture.getPointAtLength(progress * length);
          if (tip.y > 200 && tip.x <= M_START_X + 6) {
            mStarted = true;
            ctx?.add(() => gsap.to(mPen, { p: 1, duration: M_WRITE, ease: 'none', onUpdate: drawM }));
          }
        };

        const pen = { p: 0 };
        // The hooked tip of the head is flicked out as the pen passes the joint, over the
        // next stretch of the gesture — tied to the pen, so it keeps the pen's tempo.
        const sine = gsap.parseEase('sine.inOut');
        const FLICK_SPAN = 0.2;
        const tl = gsap.timeline({ onComplete: done });

        tl
          // The glow gathers where the logo will be.
          .fromTo('.splash__glow', { opacity: 0, scale: 0.7 }, { opacity: 1, scale: 1, duration: 2, ease: 'sine.out' }, 0)
          // While it is written, the Ain floats: a little lower and straighter all the way.
          .to(ain, { y: -16, rotation: -2.5, duration: WRITE + 0.1, ease: 'sine.inOut' }, WRITE_AT - 0.1)
          .set(gesture, { opacity: 1 }, WRITE_AT)
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
                follow(pen.p);
              },
            },
            WRITE_AT,
          );

        // The pen lifts. The Ain draws back a breath, then sinks into its seat in the M,
        // passing it by a hair and coming back.
        const lift = WRITE_AT + WRITE - 0.12;
        const land = lift + 0.32;
        tl.to(ain, { y: -21, rotation: -3.2, scale: 1.09, duration: 0.32, ease: 'sine.inOut' }, lift)
          .to(ain, { x: 0, y: 0, scale: 1, rotation: 0, duration: 1.15, ease: seat }, land)
          // Written in full, the ribbon fills out to its edges.
          .to('.splash__ink', { opacity: 1, duration: 0.45, ease: 'sine.inOut' }, lift - 0.1)
          // As it arrives, the whole logo gives a little and recovers; the glow warms once.
          .to(logoEl, { scale: 0.985, duration: 0.9, ease: give }, land + 0.42)
          .to('.splash__glow', { scale: 1.12, duration: 1.4, ease: give }, land + 0.2);

        // At rest, the moving layers give way to the logo file itself.
        const rest = land + 1.15;
        // A short cross-fade, not a cut: the layers and the file differ by a few edge pixels.
        tl.to('.splash__final', { opacity: 1, duration: 0.3, ease: 'sine.inOut' }, rest - 0.3)
          .set([...pieces, ain], { opacity: 0 }, rest);

        // Out. The logo rises and thins; the panels lift after it, one by one, and the
        // page beneath starts moving as the first of them goes.
        const out = rest + 0.3;
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
      <svg className="splash__logo" viewBox={`0 0 ${W} ${H}`} focusable="false">
        <defs>
          <mask id="splash-ain" maskUnits="userSpaceOnUse" x="-40" y="-40" width={W + 80} height={H + 80}>
            {[GESTURE, FLICK].map((d) => (
              <path
                key={d}
                className="splash__stroke"
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
        </defs>
        {STROKES.map((_, i) => (
          // Bands overlap by a pixel so no hairline shows at the cuts; each one's window
          // grows in its stroke's own direction, which writes it.
          <g key={i} className="splash__band">
            <image className="splash__piece" href={mLayer} width={W} height={H} />
          </g>
        ))}
        <g className="splash__ain">
          <image href={ainLayer} width={W} height={H} mask="url(#splash-ain)" />
          <image className="splash__ink" href={ainLayer} width={W} height={H} />
        </g>
        <image className="splash__final" href={logo} width={W} height={H} />
      </svg>
      <div className="loader__label splash__label">
        <span>{label}</span>
      </div>
    </div>
  );
}
