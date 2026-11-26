import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/app/hooks/useAppContext';
import { useMotion } from '@/app/motion/runtime';
import { prefersReducedMotion } from '@/app/viewTransition';
import { siteCopy } from '@/content/site';
import { Magnetic } from '@/components/site/Magnetic';
import { ArrowUpRightLong } from '@/components/site/icons';
import { useSite } from '@/components/site/site-context';
import { RollText } from '@/components/site/SplitText';

/**
 * The reference's contact: an outlined "Get in touch" pill that fills on hover and four
 * magnetic links with drawn underlines. The address is also shown as text with a Copy
 * button, so it can be used where a mail link does not open anything.
 */
export function Contact() {
  const { content, lang, dir } = useLanguage();
  const ui = siteCopy(lang).ui;
  const { go } = useSite();
  const runtime = useMotion();
  const section = useRef<HTMLElement>(null);
  const address = useRef<HTMLElement>(null);
  const [copied, setCopied] = useState(false);
  const email = content.meta.email;

  useEffect(() => {
    const el = section.current;
    if (!el || !runtime || prefersReducedMotion()) return;
    const { gsap } = runtime;
    const rtl = dir === 'rtl';
    const ctx = gsap.context(() => {
      gsap.fromTo('.git', { opacity: 0, x: rtl ? 150 : -150 }, { opacity: 1, x: 0, ease: 'power4.out', duration: 2.5, scrollTrigger: { trigger: '.git', start: 'top bottom' } });
      gsap.fromTo('.git .roll :is(.char, .word)', { yPercent: 120 }, { yPercent: 0, stagger: 0.03, ease: 'power4.out', duration: 1.6, delay: 0.3, scrollTrigger: { trigger: '.git', start: 'top bottom' } });
      gsap.fromTo('.mail', { opacity: 0, y: 20 }, { opacity: 1, y: 0, ease: 'power3.out', duration: 1.2, delay: 0.8, scrollTrigger: { trigger: '.git', start: 'top bottom' } });
      gsap.fromTo('.ul', { opacity: 0, y: 50 }, { opacity: 1, y: 0, stagger: 0.02, ease: 'power4.out', duration: 2.5, delay: 1, scrollTrigger: { trigger: '.ul', start: 'top bottom' } });
    }, el);
    return () => ctx.revert();
  }, [runtime, dir]);

  const copy = () => {
    const done = () => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    };
    const select = () => {
      if (!address.current) return;
      const range = document.createRange();
      range.selectNodeContents(address.current);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
    };
    try {
      void navigator.clipboard.writeText(email).then(done, select);
    } catch {
      select();
    }
  };

  const links: readonly (readonly [string, string, boolean])[] = [
    ['LinkedIn', content.meta.linkedin, true],
    ['GitHub', content.meta.github, true],
    [ui.cv, '/cv', false],
  ];

  return (
    <section className="contact" id="contact" aria-labelledby="contact-title">
      <h2 className="sr-only" id="contact-title">
        {siteCopy(lang).nav.sections.find(([id]) => id === 'contact')?.[1]}
      </h2>
      <div className="contact__left">
        <Magnetic strength={0.4} className="block" innerStyle={{ display: 'block' }}>
          <a className="git" href={`mailto:${email}`} data-fill="">
            <RollText text={ui.touch} lang={lang} />
          </a>
        </Magnetic>
        <p className="mail">
          <code ref={address}>{email}</code>
          <button type="button" onClick={copy}>
            {copied ? ui.copied : ui.copy}
          </button>
        </p>
      </div>
      <div className="contact__right">
        {links.map(([label, href, external]) => (
          <Magnetic key={label} strength={0.3}>
            {external ? (
              <a className="ul" href={href} target="_blank" rel="noopener noreferrer">
                <RollText text={label} lang={lang} />
                <ArrowUpRightLong />
                <span className="sr-only"> {ui.newTab}</span>
              </a>
            ) : (
              <Link
                className="ul"
                to={href}
                onClick={(e) => {
                  e.preventDefault();
                  go(href);
                }}
              >
                <RollText text={label} lang={lang} />
                <ArrowUpRightLong />
              </Link>
            )}
          </Magnetic>
        ))}
      </div>
    </section>
  );
}
