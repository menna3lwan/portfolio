import { useEffect, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useLanguage } from '@/app/hooks/useAppContext';
import { useDocumentMeta } from '@/app/hooks/useDocumentMeta';
import { useMotion } from '@/app/motion/runtime';
import { prefersReducedMotion } from '@/app/viewTransition';
import { findWork, siteCopy } from '@/content/site';
import { workDescription, workTitle } from '@/seo/meta';
import { asset } from '@/site.config';
import { RollText, SplitText } from '@/components/site/SplitText';
import { ArrowBack, ArrowUpRightLong } from '@/components/site/icons';
import { useSite } from '@/components/site/site-context';
import { fitText } from '@/features/home/fitText';

const pad = (n: number) => String(n).padStart(2, '0');

/**
 * A project page, as the reference builds its own: the name set huge and character by
 * character, then a sticky column — About, and the role, challenge, architecture and
 * what was built that Menna asked for, in the same label voice — then Type and a
 * numbered Stack, beside tall pictures; "Back to home" at the foot.
 */
export default function CaseStudy() {
  const { id } = useParams<{ id: string }>();
  const { content, lang, dir } = useLanguage();
  const ui = siteCopy(lang).ui;
  const work = findWork(id);
  const text = work?.[lang];
  const { go } = useSite();
  const runtime = useMotion();
  const page = useRef<HTMLDivElement>(null);

  useDocumentMeta({
    title: text ? workTitle(text.title, content) : `${ui.notFound} · ${content.meta.name}`,
    description: text ? workDescription(text.about) : ui.notFound,
    path: work ? `/work/${work.id}` : '/work',
    lang,
  });

  useEffect(() => {
    const el = page.current;
    if (!el) return;
    const title = el.querySelector<HTMLElement>('.p-title');
    // Fit now, again once Archivo Black has loaded (the fallback is narrower), and on resize.
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
      // The name rises letter by letter (the reference's entrance), each letter turning
      // up from a slight lean, under the glow that settles in behind it.
      gsap.fromTo(
        '[data-split] .char, [data-split] .word',
        { y: 100, rotation: 6, opacity: 0 },
        { y: 0, rotation: 0, opacity: 1, duration: 2, stagger: 0.02, ease: 'power4.out' },
      );
      // ...and drifts up and dims as the page scrolls past it.
      gsap.to('.p-title', { yPercent: -18, opacity: 0.25, ease: 'none', scrollTrigger: { trigger: '.p-hero', start: 'top top', end: 'bottom top', scrub: 1 } });

      // The text column reveals block by block as each one reaches the lower third.
      gsap.set('.p-text > *', { opacity: 0, y: 40 });
      ScrollTrigger.batch('.p-text > *', {
        start: 'top 88%',
        once: true,
        onEnter: (batch) => gsap.to(batch, { opacity: 1, y: 0, duration: 1.2, stagger: 0.12, ease: 'power3.out' }),
      });
      // The numbered stack and the type chips step in one after another.
      ScrollTrigger.batch('.stack > *, .tags > *', {
        start: 'top 92%',
        once: true,
        onEnter: (batch) => gsap.fromTo(batch, { opacity: 0, x: dir === 'rtl' ? -24 : 24 }, { opacity: 1, x: 0, duration: 0.8, stagger: 0.06, ease: 'power3.out', delay: 0.2 }),
      });

      // Each picture opens upward from its lower edge, settling from 1.3×, then moves a
      // little slower than the page.
      el.querySelectorAll<HTMLElement>('.g-img').forEach((frame) => {
        const img = frame.querySelector('img');
        gsap.fromTo(frame, { clipPath: 'inset(100% 0% 0% 0% round 16px)' }, { clipPath: 'inset(0% 0% 0% 0% round 16px)', duration: 1.4, ease: 'expo.inOut', scrollTrigger: { trigger: frame, start: 'top 85%' } });
        if (!img) return;
        gsap.fromTo(img, { scale: 1.3 }, { scale: 1, duration: 1.8, ease: 'expo.out', scrollTrigger: { trigger: frame, start: 'top 85%' } });
        gsap.fromTo(img, { yPercent: -3 }, { yPercent: 3, ease: 'none', scrollTrigger: { trigger: frame, start: 'top bottom', end: 'bottom top', scrub: true } });
      });

      gsap.fromTo('.p-back .back', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: '.p-back', start: 'top 95%' } });
    }, el);
    return () => {
      cleanup();
      ctx.revert();
    };
  }, [runtime, id, lang, dir]);

  const home = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    go('/');
  };

  if (!work || !text) {
    return (
      <div className="p-missing">
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
    <div ref={page} key={`${work.id}-${lang}`}>
      <section className="p-hero">
        <h1 className="p-title" tabIndex={-1}>
          <span className="sr-only">{text.title}</span>
          <span aria-hidden="true" data-split="">
            <SplitText text={text.title} lang={lang} />
          </span>
        </h1>
      </section>
      <section className="p-body">
        <div className="p-grid">
          <div className="p-text">
            <div>
              <h2 className="p-label">{ui.about}</h2>
              <p className="p-desc project-desc">{text.about}</p>
            </div>
            <div className="tag-item">
              <h2 className="p-label sm">{ui.role}</h2>
              <p className="p-para">{text.role}</p>
            </div>
            <div className="tag-item">
              <h2 className="p-label sm">{ui.challenge}</h2>
              <p className="p-para">{text.challenge}</p>
            </div>
            <div className="tag-item">
              <h2 className="p-label sm">{ui.architecture}</h2>
              <p className="p-para">{text.architecture}</p>
            </div>
            <div className="tag-item">
              <h2 className="p-label sm">{ui.built}</h2>
              <ul className="p-list">
                {text.built.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="p-label sm">{ui.type}</h2>
              <div className="tags">
                {text.tags.map((tag) => (
                  <span className="tag tag-item" key={tag}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <h2 className="p-label sm">{ui.stack}</h2>
              <div className="stack">
                {work.stack.map((item, i) => (
                  <div className="tag-item" key={item}>
                    <span className="n">{pad(i + 1)}</span>
                    <span className="t">
                      <bdi>{item}</bdi>
                    </span>
                  </div>
                ))}
              </div>
            </div>
            {work.code && (
              <div className="p-linkrow">
                <a className="p-link project-link" href={work.code} target="_blank" rel="noopener noreferrer" data-fill="">
                  <RollText text={ui.code} lang={lang} />
                  <ArrowUpRightLong />
                  <span className="sr-only"> {ui.newTab}</span>
                </a>
              </div>
            )}
          </div>
          <div className="gallery">
            {work.gallery.map((src, i) => (
              <div className="g-img" key={src}>
                <img
                  src={asset(src)}
                  alt={`${text.title} — ${i + 1}`}
                  width={1200}
                  height={1400}
                  loading={i === 0 ? 'eager' : 'lazy'}
                  decoding="async"
                />
              </div>
            ))}
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
