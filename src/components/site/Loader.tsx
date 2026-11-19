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

/* The Ain's two pen strokes, traced along the ribbon's centre line: the head, from the
   upper tip round the loop to the hooked lower tip; then the tail, from where the head
   closes down into the bowl and out to the right. A 64-unit stroke along each covers
   the ribbon's full width, so drawing the stroke writes the letter. */
const HEAD =
  'M117 1C108 6 92 15 78 24C64 33 56 40 40 50C27 58 19 68 18 82C17 96 26 107 40 111C55 115 67 118 80 118C94 118 108 110 118 100C129 89 140 76 148 65';
const TAIL =
  'M80 118C77 132 73 149 66 162C59 175 49 188 45 202C41 216 42 231 48 241C56 254 76 263 98 267C125 271 158 264 186 255C206 248 224 235 235 210';

/* The M, cut into its four strokes along vertical lines through the joints: the left
   stem, the left diagonal, the right diagonal (split at the centre vertex) and the right
   stem. They arrive in the order the Ain's tail sweeps past them, alternating up and
   down, so the letter is drawn into the M rather than set beside it. */
const BANDS: readonly (readonly [number, number, 1 | -1])[] = [
  [0, 58, 1],
  [58, 145, -1],
  [145, 237, 1],
  [237, W, -1],
];

/**
 * First-visit splash: the logo forms. The Ain is written as two pen strokes — the head,
 * then the tail sweeping down and across — a little above its place; as the tail passes,
 * the M's four strokes rise and drop into place behind it, alternating, and the Ain moves
 * down into its seat in the M, until the two letters sit as the logo.
 * It settles, then lifts away as the reference's five panels fold up.
 *
 * The animation moves the logo's own pixels (the two layers of the original artwork),
 * masked and translated, so the final frame is the logo exactly. Once per session, on the
 * home page only, and never under reduced motion.
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

    const done = () => {
      try {
        window.sessionStorage.setItem(SEEN, '1');
      } catch {
        /* the splash simply shows again next time */
      }
      setGone(true);
      lenis?.start();
      finishIntro();
    };

    // Both layers are decoded before the first stroke, so nothing pops in half-way; a
    // slow network gets 1.5s, then the splash runs with whatever has arrived.
    const decode = (src: string) => {
      const img = new Image();
      img.src = src;
      return img.decode().catch(() => undefined);
    };
    const ready = Promise.race([
      Promise.all([decode(ainLayer), decode(mLayer), decode(logo)]),
      new Promise((resolve) => window.setTimeout(resolve, 1500)),
    ]);

    void ready.then(() => {
      if (cancelled) return;
      ctx = gsap.context(() => {
        const strokes = el.querySelectorAll<SVGPathElement>('.splash__stroke');
        const pieces = el.querySelectorAll<SVGImageElement>('.splash__piece');
        const ain = el.querySelector<SVGImageElement>('.splash__ain');

        gsap.set(strokes, { strokeDasharray: '1 2', strokeDashoffset: 1, opacity: 0 });
        gsap.set(pieces, { y: (i: number) => (BANDS[i]?.[2] ?? 1) * H, opacity: 1 });
        // The Ain is written a little high and large, and moves down into its seat in the
        // M as the strokes arrive. The mask is in the image's own space, so it travels too.
        if (ain) gsap.set(ain, { x: -8, y: -14, scale: 1.08, transformOrigin: '50% 50%' });

        gsap
          .timeline({ onComplete: done })
          .addLabel('start', 0.2)
          // The glow gathers where the logo will be.
          .fromTo('.splash__glow', { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: 1.4, ease: 'power2.out' }, 0)
          // The Ain is written: the head, then the tail picking up before the head ends.
          .set(strokes[0] ?? [], { opacity: 1 }, 'start')
          .to(strokes[0] ?? [], { strokeDashoffset: 0, duration: 0.85, ease: 'power1.inOut' }, 'start')
          .set(strokes[1] ?? [], { opacity: 1 }, 'start+=0.62')
          .to(strokes[1] ?? [], { strokeDashoffset: 0, duration: 1.0, ease: 'power2.inOut' }, 'start+=0.62')
          // As the tail sweeps across, the M's strokes arrive behind it, left to right.
          .to(pieces, { y: 0, duration: 0.85, ease: 'expo.out', stagger: 0.1 }, 'start+=1.2')
          .to(ain ?? [], { x: 0, y: 0, scale: 1, duration: 1.1, ease: 'expo.inOut' }, 'start+=1.05')
          // Written in full, the mask is dropped so the ribbon's every pixel shows...
          .add(() => ain?.removeAttribute('mask'), 'start+=1.75')
          // ...and once the strokes have landed, the moving layers give way to the logo
          // file itself, so the resting frame is the original artwork, pixel for pixel.
          .set('.splash__final', { opacity: 1 }, 'start+=2.36')
          .set([...pieces, ain ?? []], { opacity: 0 }, 'start+=2.36')
          // A breath: the logo settles a touch, the glow warms once.
          .fromTo('.splash__logo', { scale: 1.035 }, { scale: 1, duration: 0.9, ease: 'power3.out' }, 'start+=1.75')
          .to('.splash__glow', { scale: 1.25, duration: 0.6, ease: 'power2.inOut', yoyo: true, repeat: 1 }, 'start+=1.7')
          // Out: the logo lifts and fades as the panels fold up from the bottom.
          .to('.splash__logo', { y: -36, scale: 0.92, opacity: 0, duration: 0.7, ease: 'power3.in' }, 'start+=2.55')
          .to('.splash__label', { opacity: 0, duration: 0.3 }, 'start+=2.55')
          .to('.loader__panels span', { scaleY: 0, duration: 0.8, ease: 'power4.inOut', stagger: 0.1, transformOrigin: 'top' }, 'start+=2.85')
          .to(el, { opacity: 0, duration: 0.3 }, '-=0.2');
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
          <mask id="splash-ain" maskUnits="userSpaceOnUse" x="0" y="0" width={W} height={H}>
            {[HEAD, TAIL].map((d) => (
              <path
                key={d}
                className="splash__stroke"
                d={d}
                pathLength={1}
                fill="none"
                stroke="#fff"
                strokeWidth={64}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ))}
          </mask>
          {BANDS.map(([x0, x1], i) => (
            <clipPath key={i} id={`splash-band-${i}`} clipPathUnits="userSpaceOnUse">
              {/* Bands overlap by a pixel so no hairline shows at the cuts while they move. */}
              <rect x={x0 - 0.75} y={0} width={x1 - x0 + 1.5} height={H} />
            </clipPath>
          ))}
        </defs>
        {BANDS.map((_, i) => (
          <g key={i} clipPath={`url(#splash-band-${i})`}>
            <image className="splash__piece" href={mLayer} width={W} height={H} />
          </g>
        ))}
        <image className="splash__ain" href={ainLayer} width={W} height={H} mask="url(#splash-ain)" />
        <image className="splash__final" href={logo} width={W} height={H} />
      </svg>
      <div className="loader__label splash__label">
        <span>{label}</span>
      </div>
    </div>
  );
}
