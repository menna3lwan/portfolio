import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/app/hooks/useAppContext';
import { useMotion } from '@/app/motion/runtime';
import { prefersReducedMotion } from '@/app/viewTransition';
import { findWork, siteCopy } from '@/content/site';
import { RollText, SplitText } from '@/components/site/SplitText';
import { ArrowRight, Asterisk } from '@/components/site/icons';
import { useSite } from '@/components/site/site-context';

const pad = (n: number) => String(n).padStart(2, '0');

/**
 * Experience, from the final CV, in the works section's voice: the same asterisk title
 * and index rule, each role a full-width row — number, organisation set large, role, and
 * dates in the mono face. A row opens in place to show what was done there, the tools,
 * and the selected works that came out of it. Education, the DEPI ranking and the
 * open-source contribution sit underneath in the project pages' label voice.
 *
 * Rows are disclosure buttons (aria-expanded / aria-controls); a closed row's details are
 * inert, so they are neither focusable nor read.
 */
export function Experience() {
  const { lang, dir } = useLanguage();
  const xp = siteCopy(lang).experience;
  const { go } = useSite();
  const runtime = useMotion();
  const section = useRef<HTMLElement>(null);
  const [open, setOpen] = useState(0);

  // Closed details leave the tab order and the accessibility tree.
  useEffect(() => {
    section.current?.querySelectorAll<HTMLElement>('.xp__panel').forEach((panel, i) => {
      panel.inert = i !== open;
    });
  }, [open, lang]);

  useEffect(() => {
    const el = section.current;
    if (!el || !runtime || prefersReducedMotion()) return;
    const { gsap, ScrollTrigger } = runtime;
    const rtl = dir === 'rtl';
    const ctx = gsap.context(() => {
      gsap.fromTo('.split-title__ast', { rotation: -180, scale: 0 }, { rotation: 0, scale: 1, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 80%' } });
      gsap.fromTo('.split-title .mask :is(.char, .word)', { yPercent: 110 }, { yPercent: 0, duration: 1, stagger: 0.025, ease: 'power4.out', scrollTrigger: { trigger: el, start: 'top 80%' } });
      // Each row draws its rule across, then its name rises into place under it.
      gsap.set('.xp__rule', { scaleX: 0, transformOrigin: rtl ? 'right center' : 'left center' });
      gsap.set('.xp__org .roll :is(.char, .word)', { yPercent: 110 });
      gsap.set('.xp__n, .xp__role, .xp__when, .xp__plus', { opacity: 0, y: 14 });
      ScrollTrigger.batch('.xp__row', {
        start: 'top 88%',
        once: true,
        onEnter: (rows) => {
          rows.forEach((row, k) => {
            const at = k * 0.09;
            gsap.to(row.querySelector('.xp__rule'), { scaleX: 1, duration: 1.1, ease: 'expo.inOut', delay: at });
            gsap.to(row.querySelectorAll('.xp__org .roll :is(.char, .word)'), { yPercent: 0, duration: 1.1, stagger: 0.018, ease: 'power4.out', delay: at + 0.25 });
            gsap.to(row.querySelectorAll('.xp__n, .xp__role, .xp__when, .xp__plus'), { opacity: 1, y: 0, duration: 0.9, stagger: 0.05, ease: 'power3.out', delay: at + 0.4 });
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
        {xp.items.map((item, i) => {
          const isOpen = open === i;
          return (
            <li key={item.org} className={`xp__row${isOpen ? ' is-open' : ''}`}>
              <span className="xp__rule" aria-hidden="true" />
              <h3 className="xp__head">
                <button
                  type="button"
                  className="xp__toggle"
                  id={`xp-head-${i}`}
                  aria-expanded={isOpen}
                  aria-controls={`xp-panel-${i}`}
                  onClick={() => setOpen(isOpen ? -1 : i)}
                >
                  <span className="xp__n" aria-hidden="true">
                    {pad(i + 1)}
                  </span>
                  <span className="xp__main">
                    <span className="xp__org">
                      <RollText text={item.org} lang={lang} />
                    </span>
                    <span className="xp__role">{item.role}</span>
                  </span>
                  <span className="xp__when">
                    <bdi>{item.when}</bdi>
                  </span>
                  <span className="xp__plus" aria-hidden="true" />
                  <span className="sr-only">, {isOpen ? xp.shut : xp.open}</span>
                </button>
              </h3>
              <div className="xp__panel" id={`xp-panel-${i}`} role="region" aria-labelledby={`xp-head-${i}`}>
                <div className="xp__inner">
                  <div className="xp__detail">
                    <p className="xp__type">{item.type}</p>
                    <ul className="xp__points">
                      {item.points.map((point) => (
                        <li key={point}>{point}</li>
                      ))}
                    </ul>
                    <ul className="xp__tags">
                      {item.tags.map((tag) => (
                        <li key={tag} className="tag">
                          <bdi>{tag}</bdi>
                        </li>
                      ))}
                    </ul>
                    {item.works && item.works.length > 0 && (
                      <p className="xp__works">
                        {item.works.map((id) => {
                          const work = findWork(id);
                          if (!work) return null;
                          return (
                            <Link
                              key={id}
                              className="xp__work"
                              to={`/work/${id}`}
                              onClick={(e) => {
                                if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
                                e.preventDefault();
                                go(`/work/${id}`);
                              }}
                            >
                              <span className="xp__work-label">{xp.project}</span>
                              <RollText text={work[lang].title} lang={lang} />
                              <ArrowRight className="xp__work-arrow" />
                            </Link>
                          );
                        })}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </li>
          );
        })}
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
