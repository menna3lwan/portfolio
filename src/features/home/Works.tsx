import { useCallback, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/app/hooks/useAppContext';
import { useMotion } from '@/app/motion/runtime';
import { prefersReducedMotion } from '@/app/viewTransition';
import { siteCopy, WORKS } from '@/content/site';
import { asset } from '@/site.config';
import { useSite } from '@/components/site/site-context';
import { ArrowRight, ArrowUpRight, Asterisk } from '@/components/site/icons';
import { RollText, SplitText } from '@/components/site/SplitText';

const pad = (n: number) => String(n).padStart(2, '0');

/**
 * The reference's selected works: a sticky index (counter, entries) beside 75vh cards.
 * The active project is the card crossing the centre of the screen, or whichever entry
 * or card the pointer is over; it gets the rule and the pulsing dot, the counter pops
 * and the top bar steps. Only "View project" navigates, as on the reference.
 */
export function Works() {
  const { lang, dir } = useLanguage();
  const ui = siteCopy(lang).ui;
  const { active, setActive, go } = useSite();
  const runtime = useMotion();
  const section = useRef<HTMLElement>(null);
  const counter = useRef<HTMLSpanElement>(null);
  const last = useRef(active);

  const activate = useCallback((i: number) => setActive(i), [setActive]);

  // The counter rolls like a slot: the new number comes in from below when moving
  // forward, from above when moving back, inside a one-line window.
  useEffect(() => {
    const previous = last.current;
    if (previous === active) return;
    last.current = active;
    if (!runtime || prefersReducedMotion() || !counter.current) return;
    const from = active > previous ? 100 : -100;
    runtime.gsap.fromTo(counter.current, { yPercent: from }, { yPercent: 0, duration: 0.6, ease: 'expo.out', overwrite: true });
  }, [active, runtime]);

  useEffect(() => {
    setActive(0);
    const el = section.current;
    if (!el || !runtime) return;
    const { gsap, ScrollTrigger } = runtime;
    const rtl = dir === 'rtl';
    const reduced = prefersReducedMotion();
    const cleanups: (() => void)[] = [];
    const ctx = gsap.context(() => {
      if (!reduced) {
        const head = el.querySelector('.split-title');
        gsap.fromTo('.split-title__ast', { rotation: -180, scale: 0 }, { rotation: 0, scale: 1, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 80%' } });
        gsap.fromTo('.split-title :is(.char, .word)', { yPercent: 110 }, { yPercent: 0, duration: 1, stagger: 0.025, ease: 'power4.out', scrollTrigger: { trigger: head, start: 'top 85%' } });
        gsap.fromTo('.counter', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 75%' } });
        gsap.fromTo('.item', { x: rtl ? 50 : -50, opacity: 0 }, { x: 0, opacity: 1, duration: 0.8, stagger: 0.1, ease: 'power2.out', scrollTrigger: { trigger: el, start: 'top 70%' } });

        el.querySelectorAll<HTMLElement>('.preview').forEach((preview) => {
          const card = preview.querySelector<HTMLElement>('.card');
          const img = preview.querySelector<HTMLElement>('.card__img');
          const body = preview.querySelectorAll<HTMLElement>('.card__desc, .card__meta, .card__link');
          if (!card || !img) return;
          // The card opens from an inset window to its full frame as it rises into view,
          // its picture settling from 1.25× — one scrubbed motion, so it tracks the scroll.
          gsap.set(card, { transformPerspective: 1000 });
          gsap.fromTo(
            card,
            { clipPath: 'inset(12% 8% 12% 8% round 32px)' },
            {
              clipPath: 'inset(0% 0% 0% 0% round 24px)',
              ease: 'none',
              scrollTrigger: {
                trigger: preview,
                start: 'top bottom',
                end: 'top 35%',
                scrub: 0.6,
                // Fully open, the clip is dropped so the card's shadow shows again.
                onLeave: () => gsap.set(card, { clipPath: 'none', delay: 0.6 }),
              },
            },
          );
          gsap.fromTo(img, { scale: 1.25 }, { scale: 1.05, ease: 'none', scrollTrigger: { trigger: preview, start: 'top bottom', end: 'top 35%', scrub: 0.6 } });
          // ...then drifts slower than the page while the card crosses the screen.
          gsap.fromTo(img, { yPercent: -4 }, { yPercent: 4, ease: 'none', scrollTrigger: { trigger: preview, start: 'top bottom', end: 'bottom top', scrub: true } });
          gsap.fromTo(body, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 1, stagger: 0.08, ease: 'power3.out', scrollTrigger: { trigger: preview, start: 'top 60%' } });

          // A slight tilt toward the pointer, the picture shifting the other way for depth.
          if (!window.matchMedia('(pointer: fine)').matches) return;
          const rx = gsap.quickTo(card, 'rotationX', { duration: 0.6, ease: 'power3.out' });
          const ry = gsap.quickTo(card, 'rotationY', { duration: 0.6, ease: 'power3.out' });
          const ix = gsap.quickTo(img, 'x', { duration: 0.8, ease: 'power3.out' });
          const iy = gsap.quickTo(img, 'y', { duration: 0.8, ease: 'power3.out' });
          const move = (e: PointerEvent) => {
            const r = card.getBoundingClientRect();
            const x = (e.clientX - r.left) / r.width - 0.5;
            const y = (e.clientY - r.top) / r.height - 0.5;
            rx(-y * 5);
            ry(x * 5);
            ix(-x * 18);
            iy(-y * 18);
          };
          const leave = () => {
            rx(0);
            ry(0);
            ix(0);
            iy(0);
          };
          card.addEventListener('pointermove', move);
          card.addEventListener('pointerleave', leave);
          cleanups.push(() => {
            card.removeEventListener('pointermove', move);
            card.removeEventListener('pointerleave', leave);
          });
        });
      }
      el.querySelectorAll<HTMLElement>('.preview').forEach((preview, i) => {
        ScrollTrigger.create({ trigger: preview, start: 'top center', end: 'bottom center', onEnter: () => activate(i), onEnterBack: () => activate(i) });
      });
    }, el);
    return () => {
      cleanups.forEach((fn) => fn());
      ctx.revert();
    };
  }, [runtime, dir, activate, setActive]);

  return (
    <section className="works" id="works" ref={section} aria-labelledby="works-title">
      <div className="works__grid">
        <div className="works__head">
          <div className="split-title">
            <Asterisk className="split-title__ast" />
            <h2 id="works-title">
              <span className="sr-only">{ui.selected}</span>
              <span className="mask" aria-hidden="true">
                <SplitText text={ui.selected} lang={lang} />
              </span>
            </h2>
          </div>
          <div className="counter" aria-hidden="true">
            <span className="counter__window">
              <span className="counter__num" ref={counter}>
                {pad(active + 1)}
              </span>
            </span>
            <span className="counter__sep">/</span>
            <span className="counter__total">{pad(WORKS.length)}</span>
          </div>
          <div className="items">
            {WORKS.map((work, i) => {
              const text = work[lang];
              return (
                <Link
                  key={work.id}
                  className={`item${i === active ? ' is-active' : ''}`}
                  to={`/work/${work.id}`}
                  onMouseEnter={() => activate(i)}
                  onFocus={() => activate(i)}
                  onClick={(e) => {
                    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
                    e.preventDefault();
                    go(`/work/${work.id}`);
                  }}
                >
                  <div className="item__top">
                    <div className="item__body">
                      <div className="item__meta">
                        <span className="item__year">{work.year}</span>
                        <span className="item__dot" style={{ background: work.color }} />
                      </div>
                      <h3 className="item__title">{text.title}</h3>
                      <p className="item__sub">{text.subtitle}</p>
                    </div>
                  </div>
                  <div className="item__tagrow">
                    <span className="item__tag">{text.tag}</span>
                    <ArrowRight className="item__arrow" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="previews">
          {WORKS.map((work, i) => {
            const text = work[lang];
            return (
              <div key={work.id} className={`preview${i === active ? ' is-active' : ''}`} onMouseEnter={() => activate(i)}>
                <article className="card" aria-labelledby={`card-${work.id}`}>
                  <div className="card__img" style={{ backgroundImage: `url('${asset(work.cover)}')` }} role="img" aria-label={text.title} />
                  <div className="card__shade" />
                  <div className="card__glow" style={{ background: work.color }} />
                  <div className="card__body">
                    <h3 className="sr-only" id={`card-${work.id}`}>
                      {text.title}
                    </h3>
                    <p className="card__desc">{text.card}</p>
                    <div className="card__meta">
                      <span className="card__tag">{text.tag}</span>
                      <span className="card__bullet" aria-hidden="true">
                        •
                      </span>
                      <span className="card__year">{work.year}</span>
                    </div>
                    <Link
                      className="card__link"
                      to={`/work/${work.id}`}
                      aria-label={`${ui.view}: ${text.title}`}
                      onFocus={() => activate(i)}
                      onClick={(e) => {
                        if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
                        e.preventDefault();
                        go(`/work/${work.id}`, e.currentTarget);
                      }}
                    >
                      <span className="card__label">
                        <RollText text={ui.view} lang={lang} />
                      </span>
                      <span className="card__icon">
                        <ArrowUpRight />
                      </span>
                    </Link>
                  </div>
                  <div className="card__num" aria-hidden="true">
                    {pad(i + 1)}
                  </div>
                </article>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
