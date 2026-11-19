import { useEffect, useRef } from 'react';
import { useLanguage } from '@/app/hooks/useAppContext';
import { loadMotion } from '@/app/motion/runtime';
import { prefersReducedMotion } from '@/app/viewTransition';
import { siteCopy } from '@/content/site';
import type { SectionId } from '@/content/site';
import { RollText } from './SplitText';
import { ArrowUpRightLong } from './icons';

const pad = (n: number) => String(n).padStart(2, '0');

interface MenuProps {
  readonly open: boolean;
  readonly current: SectionId | null;
  readonly onClose: () => void;
  readonly onPick: (id: SectionId) => void;
}

/**
 * The site menu: the page's five panels close over everything from the bottom — the same
 * gesture as the page curtain — and the sections rise into them, set as large as the
 * project titles, numbered like the works. Choosing one lifts the panels away while the
 * page carries on to that section.
 *
 * A modal dialog: focus moves to the first section, Tab stays inside, Escape closes, and
 * focus returns to the menu button. Under reduced motion it opens and closes at once.
 */
export function Menu({ open, current, onClose, onPick }: MenuProps) {
  const { content, lang } = useLanguage();
  const nav = siteCopy(lang).nav;
  const root = useRef<HTMLDivElement>(null);
  const shown = useRef(false);

  // Closed, the menu is out of the tab order and the accessibility tree.
  useEffect(() => {
    if (root.current) root.current.inert = !open;
  }, [open]);

  // Open and close: panels, then the list; out in reverse.
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    if (open === shown.current) return;
    shown.current = open;
    const reduced = prefersReducedMotion();
    if (open) el.classList.add('is-open');
    if (reduced) {
      if (!open) el.classList.remove('is-open');
      return;
    }
    let cancelled = false;
    void loadMotion().then(({ gsap }) => {
      if (cancelled) return;
      const panels = el.querySelectorAll('.menu__panels span');
      const names = el.querySelectorAll('.menu__name .roll :is(.char, .word)');
      const rest = el.querySelectorAll('.menu__n, .menu__foot > *');
      gsap.killTweensOf([panels, names, rest]);
      if (open) {
        gsap
          .timeline()
          .fromTo(panels, { scaleY: 0, transformOrigin: 'bottom' }, { scaleY: 1, duration: 0.6, ease: 'power4.inOut', stagger: 0.05 })
          .fromTo(names, { yPercent: 110 }, { yPercent: 0, duration: 0.9, ease: 'power4.out', stagger: 0.012 }, 0.35)
          .fromTo(rest, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out', stagger: 0.04 }, 0.55);
      } else {
        gsap
          .timeline({ onComplete: () => el.classList.remove('is-open') })
          .to(rest, { opacity: 0, duration: 0.25, ease: 'sine.in' }, 0)
          .to(names, { yPercent: -110, duration: 0.45, ease: 'power3.in', stagger: 0.006 }, 0)
          .set(panels, { transformOrigin: 'top' })
          .to(panels, { scaleY: 0, duration: 0.6, ease: 'power4.inOut', stagger: 0.05 }, 0.25);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [open]);

  // Focus, the Tab loop and Escape while open.
  useEffect(() => {
    const el = root.current;
    if (!open || !el) return;
    const opener = document.activeElement as HTMLElement | null;
    const focusables = () =>
      [...el.querySelectorAll<HTMLElement>('a[href], button:not([disabled])')].filter((f) => f.offsetParent !== null);
    window.setTimeout(() => focusables()[0]?.focus({ preventScroll: true }), 50);
    const toggle = document.querySelector<HTMLElement>('[aria-controls="site-menu"]');
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;
      // Tab cycles through the menu and its button (which is how it closes) and never
      // reaches the page beneath.
      const list = [...focusables(), ...(toggle ? [toggle] : [])];
      if (list.length === 0) return;
      e.preventDefault();
      const at = list.indexOf(document.activeElement as HTMLElement);
      const next = at < 0 ? 0 : (at + (e.shiftKey ? -1 : 1) + list.length) % list.length;
      list[next]?.focus();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      (toggle ?? opener)?.focus({ preventScroll: true });
    };
  }, [open, onClose]);

  return (
    <div
      className="menu"
      id="site-menu"
      ref={root}
      role="dialog"
      aria-modal="true"
      aria-label={nav.label}
      aria-hidden={!open}
    >
      <div className="menu__panels" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
        <span />
      </div>
      <nav className="menu__body" aria-label={nav.label}>
        <ol className="menu__list">
          {nav.sections.map(([id, name], i) => (
            <li key={id}>
              <a
                className={`menu__link${current === id ? ' is-current' : ''}`}
                href={`/#${id}`}
                aria-current={current === id ? 'location' : undefined}
                tabIndex={open ? 0 : -1}
                onClick={(e) => {
                  e.preventDefault();
                  onPick(id);
                }}
              >
                <span className="menu__n" aria-hidden="true">
                  {pad(i + 1)}
                </span>
                <span className="menu__name">
                  <RollText text={name} lang={lang} />
                </span>
              </a>
            </li>
          ))}
        </ol>
        <div className="menu__foot">
          <p className="menu__label">{nav.elsewhere}</p>
          <a className="menu__ext" href={`mailto:${content.meta.email}`} tabIndex={open ? 0 : -1}>
            <bdi>{content.meta.email}</bdi>
          </a>
          {(
            [
              ['LinkedIn', content.meta.linkedin],
              ['GitHub', content.meta.github],
            ] as const
          ).map(([label, href]) => (
            <a key={label} className="menu__ext" href={href} target="_blank" rel="noopener noreferrer" tabIndex={open ? 0 : -1}>
              <RollText text={label} lang="en" />
              <ArrowUpRightLong />
              <span className="sr-only"> {siteCopy(lang).ui.newTab}</span>
            </a>
          ))}
        </div>
      </nav>
    </div>
  );
}
