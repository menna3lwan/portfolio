import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/app/hooks/useAppContext';
import { useMotion } from '@/app/motion/runtime';
import { prefersReducedMotion } from '@/app/viewTransition';
import { siteCopy } from '@/content/site';
import { RollText, SplitText } from '@/components/site/SplitText';
import { ArrowRight, Asterisk } from '@/components/site/icons';
import { useSite } from '@/components/site/site-context';

const pad = (n: number) => String(n).padStart(2, '0');

/**
 * Experience — the whole journey, in the works section's voice: the asterisk title and
 * the index rule, each role a full-width row. The home page shows only a preview of each
 * role — its number, organisation set large, title, and a two-line summary of what made
 * it matter — with an arrow that carries the visitor into the full account on its own
 * detail page (/experience/:id), behind the same curtain as the rest of the site.
 * Education, the DEPI ranking and the open-source contribution sit underneath in the
 * project pages' label voice.
 *
 * Each row is a single link, so it is reached and opened the same way by pointer and by
 * keyboard.
 */
export function Experience() {
  const { lang, dir } = useLanguage();
  const xp = siteCopy(lang).experience;
  const { go } = useSite();
  const runtime = useMotion();
  const section = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = section.current;
    if (!el || !runtime || prefersReducedMotion()) return;
    const { gsap, ScrollTrigger } = runtime;
    const rtl = dir === 'rtl';
    const ctx = gsap.context(() => {
      gsap.fromTo('.split-title__ast', { rotation: -180, scale: 0 }, { rotation: 0, scale: 1, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 80%' } });
      gsap.fromTo('.split-title .mask :is(.char, .word)', { yPercent: 110 }, { yPercent: 0, duration: 1, stagger: 0.025, ease: 'power4.out', scrollTrigger: { trigger: el, start: 'top 80%' } });
      // Each row draws its rule across, then its name rises into place, then the rest
      // (number, role, summary, date, arrow) settles in under it.
      gsap.set('.xp__rule', { scaleX: 0, transformOrigin: rtl ? 'right center' : 'left center' });
      gsap.set('.xp__org .roll :is(.char, .word)', { yPercent: 110 });
      gsap.set('.xp__n, .xp__role, .xp__summary, .xp__when, .xp__arrow', { opacity: 0, y: 14 });
      ScrollTrigger.batch('.xp__row', {
        start: 'top 88%',
        once: true,
        onEnter: (rows) => {
          rows.forEach((row, k) => {
            const at = k * 0.09;
            gsap.to(row.querySelector('.xp__rule'), { scaleX: 1, duration: 1.1, ease: 'expo.inOut', delay: at });
            gsap.to(row.querySelectorAll('.xp__org .roll :is(.char, .word)'), { yPercent: 0, duration: 1.1, stagger: 0.018, ease: 'power4.out', delay: at + 0.25 });
            gsap.to(row.querySelectorAll('.xp__n, .xp__role, .xp__summary, .xp__when, .xp__arrow'), { opacity: 1, y: 0, duration: 0.9, stagger: 0.05, ease: 'power3.out', delay: at + 0.4 });
          });
        },
      });
      gsap.fromTo('.xp__more > *', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 1, stagger: 0.12, ease: 'power3.out', scrollTrigger: { trigger: '.xp__more', start: 'top 88%' } });
    }, el);
    return () => ctx.revert();
  }, [runtime, dir, lang]);

  return (
    <section className="xp" id="experience" ref={section} aria-labelledby="xp-title">
      <div className="split-title">
        <Asterisk className="split-title__ast" />
        <h2 id="xp-title" tabIndex={-1}>
          <span className="sr-only">{xp.label}</span>
          <span className="mask" aria-hidden="true">
            <SplitText text={xp.label} lang={lang} />
          </span>
        </h2>
      </div>

      <ol className="xp__list">
        {xp.items.map((item, i) => (
          <li key={item.id} className="xp__row">
            <span className="xp__rule" aria-hidden="true" />
            <Link
              className="xp__link"
              to={`/experience/${item.id}`}
              onClick={(e) => {
                if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
                e.preventDefault();
                go(`/experience/${item.id}`);
              }}
            >
              <span className="xp__n" aria-hidden="true">
                {pad(i + 1)}
              </span>
              <span className="xp__main">
                <h3 className="xp__org">
                  <RollText text={item.org} lang={lang} />
                </h3>
                <span className="xp__role">{item.role}</span>
                <span className="xp__summary">{item.summary}</span>
              </span>
              <span className="xp__when">
                <bdi>{item.when}</bdi>
              </span>
              <span className="xp__arrow" aria-hidden="true">
                <ArrowRight />
              </span>
            </Link>
          </li>
        ))}
      </ol>

      <div className="xp__more">
        {xp.more.map((entry) => (
          <div key={entry.label} className="xp__fact">
            <p className="p-label sm">{entry.label}</p>
            <p className="xp__fact-title">{entry.title}</p>
            <p className="xp__fact-text">{entry.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
