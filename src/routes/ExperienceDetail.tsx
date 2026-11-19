import { useEffect, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useLanguage } from '@/app/hooks/useAppContext';
import { useDocumentMeta } from '@/app/hooks/useDocumentMeta';
import { useMotion } from '@/app/motion/runtime';
import { prefersReducedMotion } from '@/app/viewTransition';
import { findExperience, findWork, siteCopy } from '@/content/site';
import { experienceDescription, experienceTitle } from '@/seo/meta';
import { RollText, SplitText } from '@/components/site/SplitText';
import { ArrowBack, ArrowRight } from '@/components/site/icons';
import { useSite } from '@/components/site/site-context';
import { fitText } from '@/features/home/fitText';

/**
 * An experience's detail page, in the project pages' language: the organisation set huge
 * and rising letter by letter, a kicker of role · dates · type, then a sticky column
 * (the type, the stack, the works it produced) beside the full account of what was done.
 * "Back to home" at the foot, behind the same curtain as the rest of the site.
 */
export default function ExperienceDetail() {
  const { id } = useParams<{ id: string }>();
  const { content, lang, dir } = useLanguage();
  const xp = siteCopy(lang).experience;
  const ui = siteCopy(lang).ui;
  const item = findExperience(lang, id);
  const { go } = useSite();
  const runtime = useMotion();
  const page = useRef<HTMLDivElement>(null);

  useDocumentMeta({
    title: item ? experienceTitle(item.org, content) : `${ui.notFound} · ${content.meta.name}`,
    description: item ? experienceDescription(item.summary) : ui.notFound,
    path: item ? `/experience/${item.id}` : '/experience',
    lang,
  });

  useEffect(() => {
    const el = page.current;
    if (!el) return;
    const title = el.querySelector<HTMLElement>('.p-title');
    const fit = () => title && fitText([title]);
    fit();
    let alive = true;
    if (title) void document.fonts?.load(getComputedStyle(title).font).then(() => alive && fit(), () => undefined);
    window.addEventListener('resize', fit);
    const cleanup = () => {
      alive = false;
      window.removeEventListener('resize', fit);
    };
    if (!runtime || prefersReducedMotion()) return cleanup;
    const { gsap, ScrollTrigger } = runtime;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '[data-split] .char, [data-split] .word',
        { y: 100, rotation: 6, opacity: 0 },
        { y: 0, rotation: 0, opacity: 1, duration: 2, stagger: 0.02, ease: 'power4.out' },
      );
      gsap.fromTo('.xpd__meta > *', { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 1, stagger: 0.06, ease: 'power3.out', delay: 0.3 });
      gsap.to('.p-title', { yPercent: -18, opacity: 0.25, ease: 'none', scrollTrigger: { trigger: '.p-hero', start: 'top top', end: 'bottom top', scrub: 1 } });

      gsap.set('.xpd__point, .xpd__aside > *', { opacity: 0, y: 36 });
      ScrollTrigger.batch('.xpd__aside > *', {
        start: 'top 90%',
        once: true,
        onEnter: (batch) => gsap.to(batch, { opacity: 1, y: 0, duration: 1, stagger: 0.1, ease: 'power3.out' }),
      });
      ScrollTrigger.batch('.xpd__point', {
        start: 'top 90%',
        once: true,
        onEnter: (batch) => gsap.to(batch, { opacity: 1, y: 0, duration: 1.1, stagger: 0.12, ease: 'power3.out' }),
      });
      ScrollTrigger.batch('.xpd__tags > *', {
        start: 'top 95%',
        once: true,
        onEnter: (batch) => gsap.fromTo(batch, { opacity: 0, x: dir === 'rtl' ? -20 : 20 }, { opacity: 1, x: 0, duration: 0.7, stagger: 0.05, ease: 'power3.out' }),
      });
      gsap.fromTo('.p-back .back', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: '.p-back', start: 'top 95%' } });
    }, el);
    return () => {
      cleanup();
      ctx.revert();
    };
  }, [runtime, id, lang, dir]);

  const home = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    go('/');
  };

  if (!item) {
    return (
      <div className="xpd p-missing">
        <h1 className="p-title">{ui.notFound}</h1>
        <div className="p-back">
          <Link className="back" to="/" onClick={home} data-fill="">
            <ArrowBack />
            <RollText text={ui.back} lang={lang} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="xpd" ref={page} key={`${item.id}-${lang}`}>
      <section className="p-hero xpd__hero">
        <h1 className="p-title" tabIndex={-1}>
          <span className="sr-only">
            {item.org} — {item.role}
          </span>
          <span aria-hidden="true" data-split="">
            <SplitText text={item.org} lang={lang} />
          </span>
        </h1>
        <p className="xpd__meta" aria-hidden="true">
          <span className="xpd__role">{item.role}</span>
          <span className="xpd__sep">·</span>
          <span className="xpd__when">
            <bdi>{item.when}</bdi>
          </span>
          <span className="xpd__sep">·</span>
          <span className="xpd__type">{item.type}</span>
        </p>
      </section>

      <section className="p-body">
        <div className="xpd__grid">
          <aside className="xpd__aside">
            <div>
              <h2 className="p-label sm">{ui.type}</h2>
              <p className="xpd__aside-val">{item.type}</p>
              <p className="xpd__aside-val xpd__aside-when">
                <bdi>{item.when}</bdi>
              </p>
            </div>
            <div>
              <h2 className="p-label sm">{xp.tech}</h2>
              <ul className="xpd__tags">
                {item.tags.map((tag) => (
                  <li key={tag} className="tag">
                    <bdi>{tag}</bdi>
                  </li>
                ))}
              </ul>
            </div>
            {item.works && item.works.length > 0 && (
              <div>
                <h2 className="p-label sm">{xp.project}</h2>
                <ul className="xpd__works">
                  {item.works.map((workId) => {
                    const work = findWork(workId);
                    if (!work) return null;
                    return (
                      <li key={workId}>
                        <Link
                          className="xp__work"
                          to={`/work/${workId}`}
                          onClick={(e) => {
                            if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
                            e.preventDefault();
                            go(`/work/${workId}`);
                          }}
                        >
                          <RollText text={work[lang].title} lang={lang} />
                          <ArrowRight className="xp__work-arrow" />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </aside>

          <div className="xpd__main">
            <h2 className="p-label">{xp.what}</h2>
            <ul className="xpd__points">
              {item.points.map((point) => (
                <li className="xpd__point" key={point}>
                  {point}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <div className="p-back">
        <Link className="back" to="/" onClick={home} data-fill="">
          <ArrowBack />
          <RollText text={ui.back} lang={lang} />
        </Link>
      </div>
    </div>
  );
}
