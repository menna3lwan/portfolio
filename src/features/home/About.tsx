import { useEffect, useRef } from 'react';
import { useLanguage } from '@/app/hooks/useAppContext';
import { useMotion } from '@/app/motion/runtime';
import { prefersReducedMotion } from '@/app/viewTransition';
import { siteCopy } from '@/content/site';
import logoOnDark from '@/assets/logo-dark.webp';
import logoOnLight from '@/assets/logo.webp';
import { SplitText } from '@/components/site/SplitText';
import { Asterisk } from '@/components/site/icons';
import { useSiteTheme } from '@/components/site/useSiteTheme';

/**
 * About: one statement, set large, that reads itself in as the page scrolls — each word
 * brightening from the unfilled grey as it reaches the reading line, the way the skills
 * fill — beside the logo, with four plain facts underneath on ruled lines.
 */
export function About() {
  const { lang, dir } = useLanguage();
  const about = siteCopy(lang).about;
  const { light } = useSiteTheme();
  const runtime = useMotion();
  const section = useRef<HTMLElement>(null);
  const words = about.statement.split(' ');

  useEffect(() => {
    const el = section.current;
    if (!el || !runtime || prefersReducedMotion()) return;
    const { gsap } = runtime;
    const rtl = dir === 'rtl';
    const ctx = gsap.context(() => {
      gsap.fromTo('.split-title__ast', { rotation: -180, scale: 0 }, { rotation: 0, scale: 1, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 80%' } });
      gsap.fromTo('.split-title .mask :is(.char, .word)', { yPercent: 110 }, { yPercent: 0, duration: 1, stagger: 0.025, ease: 'power4.out', scrollTrigger: { trigger: el, start: 'top 80%' } });
      // The statement reads in word by word, tied to the scroll.
      gsap.fromTo(
        '.about__w',
        { opacity: 0.14 },
        { opacity: 1, ease: 'none', stagger: 0.08, scrollTrigger: { trigger: '.about__statement', start: 'top 78%', end: 'bottom 52%', scrub: 0.6 } },
      );
      // The mark settles in with a slow turn, then drifts very slightly with the page.
      gsap.fromTo('.about__mark', { opacity: 0, rotation: rtl ? 8 : -8, scale: 0.9, y: 30 }, { opacity: 1, rotation: 0, scale: 1, y: 0, duration: 1.6, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 75%' } });
      gsap.to('.about__mark', { yPercent: -18, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } });
      gsap.set('.about__rule', { scaleX: 0, transformOrigin: rtl ? 'right center' : 'left center' });
      gsap.to('.about__rule', { scaleX: 1, duration: 1.1, stagger: 0.1, ease: 'expo.inOut', scrollTrigger: { trigger: '.about__facts', start: 'top 88%' } });
      gsap.fromTo('.about__fact :is(dt, dd)', { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.9, stagger: 0.06, ease: 'power3.out', delay: 0.3, scrollTrigger: { trigger: '.about__facts', start: 'top 88%' } });
    }, el);
    return () => ctx.revert();
  }, [runtime, dir, lang]);

  return (
    <section className="about" id="about" ref={section} aria-labelledby="about-title">
      <div className="about__head">
        <div className="split-title">
          <Asterisk className="split-title__ast" />
          <h2 id="about-title" tabIndex={-1}>
            <span className="sr-only">{about.label}</span>
            <span className="mask" aria-hidden="true">
              <SplitText text={about.label} lang={lang} />
            </span>
          </h2>
        </div>
        <img
          className="about__mark"
          src={light ? logoOnLight : logoOnDark}
          width={297}
          height={320}
          alt=""
          aria-hidden="true"
          loading="lazy"
          decoding="async"
        />
      </div>
      <div className="about__body">
        <p className="about__statement">
          <span className="sr-only">{about.statement}</span>
          <span aria-hidden="true">
            {words.map((word, i) => (
              <span key={i}>
                <span className="about__w">{word}</span>{' '}
              </span>
            ))}
          </span>
        </p>
        <dl className="about__facts">
          {about.facts.map(([label, value]) => (
            <div key={label} className="about__fact">
              <span className="about__rule" aria-hidden="true" />
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
