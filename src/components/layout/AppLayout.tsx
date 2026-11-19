import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { SkipLink } from './SkipLink';
import { useLanguage } from '@/app/hooks/useAppContext';
import { loadMotion, scrollToTop } from '@/app/motion/runtime';
import { prefersReducedMotion } from '@/app/viewTransition';
import { findWork, siteCopy, WORKS } from '@/content/site';
import { SiteContext } from '@/components/site/site-context';
import type { SiteContextValue } from '@/components/site/site-context';
import { Loader } from '@/components/site/Loader';
import { Cursor } from '@/components/site/Cursor';
import { ShaderCanvas } from '@/components/site/ShaderCanvas';
import { useSiteTheme } from '@/components/site/useSiteTheme';
import { Magnetic } from '@/components/site/Magnetic';
import { RollText, SplitText } from '@/components/site/SplitText';
import { splitUnits } from '@/components/site/split';
import { Chevron, Moon } from '@/components/site/icons';

/**
 * The shell every portfolio page renders inside — the reference's frame: the shader
 * background, the cursor, the name top-left, the pills top-right, the project progress
 * bar, and the page curtain that carries one page into the next. The CV route sits
 * outside it, keeping its own approved design.
 */
export function AppLayout() {
  const { content, lang, toggleLanguage } = useLanguage();
  const copy = siteCopy(lang);
  const ui = copy.ui;
  const navigate = useNavigate();
  const location = useLocation();
  const { light, toggle } = useSiteTheme();
  const [introDone, setIntroDone] = useState(false);
  const [active, setActive] = useState(0);
  const panels = useRef<HTMLDivElement>(null);
  const busy = useRef(false);
  const ownNavigation = useRef(false);
  const [announce, setAnnounce] = useState('');

  useLayoutEffect(() => {
    const root = document.documentElement;
    root.dataset.shell = 'site';
    return () => {
      delete root.dataset.shell;
    };
  }, []);

  const finishIntro = useCallback(() => setIntroDone(true), []);

  /* Filled buttons ([data-fill]) flood from the point the pointer came in at and drain
     toward the point it left from: the entry and exit points are written as --fx/--fy. */
  useEffect(() => {
    const place = (e: PointerEvent) => {
      const target = (e.target as Element | null)?.closest<HTMLElement>('[data-fill]');
      if (!target) return;
      const related = e.relatedTarget as Node | null;
      if (related && target.contains(related)) return;
      const r = target.getBoundingClientRect();
      target.style.setProperty('--fx', `${e.clientX - r.left}px`);
      target.style.setProperty('--fy', `${e.clientY - r.top}px`);
    };
    document.addEventListener('pointerover', place);
    document.addEventListener('pointerout', place);
    return () => {
      document.removeEventListener('pointerover', place);
      document.removeEventListener('pointerout', place);
    };
  }, []);

  /* What the curtain says while it is closed: where it is taking you. */
  const destination = useCallback(
    (to: string): string => {
      if (to === '/') return content.meta.name;
      if (to === '/cv') return ui.cv;
      const work = findWork(to.replace(/^\/work\//, ''));
      return work ? work[lang].title : '';
    },
    [content.meta.name, ui.cv, lang],
  );

  /* The page curtain: five #111 panels — the loader's — close from the bottom, the route
     changes behind them, then they lift from the top as the new title rises. 0.45s each
     way on the reference's power4.inOut, 0.05s apart. Immediate under reduced motion. */
  const go = useCallback(
    (to: string, trigger?: HTMLElement | null) => {
      if (busy.current) return;
      const swap = () => {
        ownNavigation.current = true;
        navigate(to);
      };
      if (prefersReducedMotion() || !panels.current) {
        swap();
        return;
      }
      busy.current = true;
      trigger?.classList.add('is-going');
      void loadMotion().then(({ gsap, lenis }) => {
        const spans = panels.current?.querySelectorAll(':scope > span');
        if (!spans) {
          busy.current = false;
          swap();
          return;
        }
        panels.current!.classList.add('is-on');
        lenis?.stop();
        // The destination's name rises in the closed curtain and leaves upward with it.
        const label = panels.current!.querySelector<HTMLElement>('.curtain__label');
        const name = destination(to);
        let units: HTMLElement[] = [];
        if (label) {
          label.replaceChildren();
          label.lang = lang;
          const { parts } = splitUnits(name, lang);
          const word = lang === 'ar' || /[\u0600-\u06FF]/.test(name);
          units = parts.map((part) => {
            const unit = document.createElement('span');
            unit.textContent = part === ' ' ? '\u00a0' : part;
            label.append(unit);
            if (word) label.append(' ');
            return unit;
          });
        }
        const start = trigger ? 0.12 : 0;
        gsap
          .timeline({
            onComplete: () => {
              busy.current = false;
            },
          })
          .set(spans, { transformOrigin: 'bottom' })
          .fromTo(spans, { scaleY: 0 }, { scaleY: 1, duration: 0.45, ease: 'power4.inOut', stagger: 0.05 }, start)
          .fromTo(units, { yPercent: 110 }, { yPercent: 0, duration: 0.6, ease: 'power4.out', stagger: 0.025 }, start + 0.3)
          .add(() => {
            swap();
            lenis?.start();
          })
          .set(spans, { transformOrigin: 'top' })
          .to(units, { yPercent: -110, duration: 0.45, ease: 'power4.in', stagger: 0.015 }, '+=0.1')
          .to(spans, { scaleY: 0, duration: 0.45, ease: 'power4.inOut', stagger: 0.05 }, '-=0.25')
          .add(() => {
            panels.current?.classList.remove('is-on');
            label?.replaceChildren();
          });
      });
    },
    [navigate, destination, lang],
  );

  /* Every route change starts at the top with focus on the new page's title. A change
     the curtain did not cover (the browser's back and forward buttons) gets the second
     half of it, so it never lands as a bare cut. */
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    scrollToTop();
    const h1 = document.querySelector<HTMLElement>('main h1');
    if (h1) {
      h1.setAttribute('tabindex', '-1');
      h1.focus({ preventScroll: true });
    }
    setAnnounce(`${ui.opened}: ${document.title}`);
    if (!ownNavigation.current && !prefersReducedMotion() && panels.current) {
      void loadMotion().then(({ gsap }) => {
        const spans = panels.current?.querySelectorAll(':scope > span');
        if (!spans) return;
        panels.current!.classList.add('is-on');
        gsap.fromTo(
          spans,
          { scaleY: 1, transformOrigin: 'top' },
          {
            scaleY: 0,
            duration: 0.45,
            ease: 'power4.inOut',
            stagger: 0.05,
            onComplete: () => panels.current?.classList.remove('is-on'),
          },
        );
      });
    }
    ownNavigation.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const value = useMemo<SiteContextValue>(
    () => ({ introDone, finishIntro, active, setActive, go }),
    [introDone, finishIntro, active, go],
  );

  const onHome = location.pathname === '/';

  return (
    <SiteContext.Provider value={value}>
      <div className="site">
        <SkipLink targetId="main">{ui.skip}</SkipLink>
        <Loader label={ui.loading} />
        <ShaderCanvas light={light} />
        <div className="progress" aria-hidden="true" hidden={!onHome}>
          <div className="progress__bar" style={{ width: `${((active + 1) / WORKS.length) * 100}%` }} />
        </div>
        <Cursor />

        <nav className="nav" aria-label={content.meta.name}>
          <Magnetic strength={0.3}>
            <Link
              className="nav__name"
              to="/"
              onClick={(e) => {
                e.preventDefault();
                if (onHome) {
                  void loadMotion().then(({ lenis }) => (lenis ? lenis.scrollTo(0) : window.scrollTo({ top: 0, behavior: 'smooth' })));
                } else go('/');
              }}
            >
              <span className="sr-only">{content.meta.name}</span>
              <span className="roll" aria-hidden="true" data-namesplit="">
                <SplitText text={content.meta.name} lang={lang} />
              </span>
            </Link>
          </Magnetic>
        </nav>

        <div className="top-actions">
          <button
            className="pill pill--round"
            type="button"
            lang={lang === 'ar' ? 'en' : 'ar'}
            aria-label={lang === 'ar' ? ui.toEn : ui.toAr}
            onClick={toggleLanguage}
          >
            <RollText text={lang === 'ar' ? 'EN' : 'ع'} lang={lang === 'ar' ? 'en' : 'ar'} />
          </button>
          <button
            className="pill pill--round"
            type="button"
            aria-label={light ? ui.toDark : ui.toLight}
            aria-pressed={light}
            onClick={(e) => {
              // The theme provider runs the switch as a view transition; here the new
              // theme is told to open as a circle from this button (site.css).
              const r = e.currentTarget.getBoundingClientRect();
              const root = document.documentElement;
              root.style.setProperty('--vx', `${r.left + r.width / 2}px`);
              root.style.setProperty('--vy', `${r.top + r.height / 2}px`);
              toggle();
            }}
          >
            <Moon />
          </button>
          <Link
            className="pill"
            to="/cv"
            aria-label={ui.cvLabel}
            onClick={(e) => {
              e.preventDefault();
              go('/cv');
            }}
          >
            <RollText text={ui.cv} lang={lang} />
            <Chevron className="chev" />
          </Link>
        </div>

        <main id="main" tabIndex={-1}>
          <Outlet />
        </main>

        <div className="curtain" ref={panels} aria-hidden="true">
          <p className="curtain__label" />
          <span />
          <span />
          <span />
          <span />
          <span />
        </div>
        <p className="sr-only" aria-live="polite">
          {announce}
        </p>
      </div>
    </SiteContext.Provider>
  );
}
