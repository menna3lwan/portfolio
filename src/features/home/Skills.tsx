import { useEffect, useRef } from 'react';
import { useLanguage } from '@/app/hooks/useAppContext';
import { useMotion } from '@/app/motion/runtime';
import { prefersReducedMotion } from '@/app/viewTransition';
import { siteCopy } from '@/content/site';
import { fitText } from './fitText';

/**
 * The reference's skills reel: one size of word, right-aligned in the right half, each
 * filling as its centre crosses the centre of the screen (a 1-second scrub), while a
 * fixed, rotated quote beside the column changes to the word just reached and leaves
 * when the works begin.
 */
export function Skills() {
  const { lang, dir } = useLanguage();
  const copy = siteCopy(lang);
  const runtime = useMotion();
  const section = useRef<HTMLElement>(null);
  const citation = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const el = section.current;
    if (!el) return;
    const words = () => el.querySelectorAll<HTMLElement>('.word-fill');
    fitText(words());
    let timer = 0;
    const onResize = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        fitText(words());
        runtime?.ScrollTrigger.refresh();
      }, 150);
    };
    window.addEventListener('resize', onResize);
    void document.fonts?.ready.then(() => fitText(words()));
    return () => {
      window.removeEventListener('resize', onResize);
      window.clearTimeout(timer);
    };
  }, [runtime, lang]);

  useEffect(() => {
    const el = section.current;
    const quote = citation.current;
    if (!el || !quote || !runtime) return;
    const { gsap, ScrollTrigger } = runtime;
    const reduced = prefersReducedMotion();
    const rtl = dir === 'rtl';
    const filled = rtl ? '100%' : '0%';
    const skills = siteCopy(lang).skills;

    const show = (i: number) => {
      const text = skills[i - 1]?.quote ?? skills[i]?.quote ?? '';
      quote.textContent = `‟ ${text} "`;
      if (i === 0) gsap.to(quote, { opacity: 0, y: 20, duration: 1, overwrite: true });
      else if (reduced) gsap.set(quote, { opacity: 1, y: 0 });
      else gsap.fromTo(quote, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 2, ease: 'power4.out', overwrite: true });
    };

    const ctx = gsap.context(() => {
      el.querySelectorAll<HTMLElement>('.word-fill').forEach((word) => {
        const id = Number(word.dataset.i);
        const triggers = { onEnter: () => show(id), onLeaveBack: () => show(id - 1) };
        if (reduced) {
          word.style.backgroundPositionX = filled;
          ScrollTrigger.create({ trigger: word, start: 'center center', end: 'center center', ...triggers });
          return;
        }
        // Each word rises a little into place on its way up the screen.
        gsap.fromTo(word, { y: 60, opacity: 0.2 }, { y: 0, opacity: 1, ease: 'none', scrollTrigger: { trigger: word, start: 'top bottom', end: 'top 70%', scrub: 0.5 } });
        gsap.to(word, {
          backgroundPositionX: filled,
          ease: 'none',
          scrollTrigger: { trigger: word, start: 'center center', end: 'center center', scrub: 1, ...triggers },
        });
      });
      // The column leans with the speed of the scroll and straightens as it settles — the
      // words feel carried by the page rather than pinned to it.
      if (!reduced) {
        const column = el.querySelector<HTMLElement>('.words');
        if (column) {
          const skew = gsap.quickTo(column, 'skewY', { duration: 0.5, ease: 'power3.out' });
          ScrollTrigger.create({
            trigger: el,
            start: 'top bottom',
            end: 'bottom top',
            onUpdate: (self) => skew(gsap.utils.clamp(-6, 6, self.getVelocity() / -400)),
            onLeave: () => skew(0),
            onLeaveBack: () => skew(0),
          });
        }
      }
      // An element, not a selector: selectors inside gsap.context are scoped to this section.
      const works = document.getElementById('portfolio-section');
      if (works) ScrollTrigger.create({
        trigger: works,
        start: 'top center',
        end: 'top center',
        onEnter: () => gsap.to(quote, { opacity: 0, y: 20, duration: 0.1, overwrite: true }),
      });
    }, el);
    return () => ctx.revert();
  }, [runtime, lang, dir]);

  return (
    <section className="skills" ref={section} aria-labelledby="skills-title">
      <h2 className="sr-only" id="skills-title">
        {copy.ui.skills}
      </h2>
      <ul className="sr-only">
        {copy.skills.map((s) => (
          <li key={s.word}>
            {s.word} — {s.quote}
          </li>
        ))}
      </ul>
      <div className="skills__aside" aria-hidden="true">
        <div className="citation-box">
          <p className="citation" ref={citation} />
        </div>
      </div>
      <div className="words" aria-hidden="true">
        {copy.skills.map((s, i) => (
          <p className="word-fill" key={s.word} data-i={i + 1}>
            {s.word}
          </p>
        ))}
      </div>
    </section>
  );
}
