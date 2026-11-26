import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import type { CSSProperties } from 'react';
import { Icon } from '@/components/ui/Icon';
import { useLanguage } from '@/app/hooks/useAppContext';
import { useDocumentMeta } from '@/app/hooks/useDocumentMeta';
import { useMotion } from '@/app/motion/runtime';
import { prefersReducedMotion } from '@/app/viewTransition';
import { cvDescription, cvTitle } from '@/seo/meta';
import { siteCopy } from '@/content/site';
import { cvStrings, format } from '@/features/cv/cvStrings';
import { useViewerBridge } from '@/features/cv/useViewerBridge';
import { useFullscreen } from '@/features/cv/useFullscreen';
import { fitText } from '@/features/home/fitText';
import { RollText, SplitText } from '@/components/site/SplitText';
import { ArrowBack, ArrowUpRightLong, Asterisk } from '@/components/site/icons';
import { useSite } from '@/components/site/site-context';
import { useSiteTheme } from '@/components/site/useSiteTheme';
import { asset } from '@/site.config';

const PDF = asset('Menna-Elwan-CV.pdf');

/**
 * The CV page, inside the portfolio's own frame: the name and pills, the menu, the cursor
 * and the page curtain all carry over. It is built like a project page — the title set
 * huge and rising letter by letter, the facts in the label voice, the actions as the
 * site's pills — and the document sits on a stage shaped like the works' cards, opening
 * from an inset as it arrives, with its controls floating over it in one glass pill.
 *
 * The PDF itself is untouched. It is shown by the self-contained PDF.js viewer in an
 * iframe, which reports page, zoom and progress back; this page owns everything around
 * it: the controls, the progress line, the fallback, full screen, and the keyboard
 * shortcuts (the viewer handles its own once focus is inside it).
 */
export default function Cv() {
  const { content, lang, dir } = useLanguage();
  const { light } = useSiteTheme();
  const ui = siteCopy(lang).ui;
  const { go } = useSite();
  const runtime = useMotion();
  const page = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const t = cvStrings(content);
  const [announcement, setAnnouncement] = useState('');
  const announceTimer = useRef(0);
  const fullscreen = useFullscreen(stageRef);

  const { state, send, retry, src } = useViewerBridge({
    frameRef,
    pdf: new URL(PDF, window.location.href).href,
    theme: light ? 'light' : 'dark',
    dir,
    labels: { region: t.viewer, page: t.page, link: t.link },
  });

  const ready = state.status === 'ready';
  const failed = state.status === 'error' || state.status === 'unsupported';

  useDocumentMeta({
    title: cvTitle(content, t.title),
    description: cvDescription(content, lang),
    path: '/cv',
    lang,
  });

  /** Status text is both visible and the polite live region; transient messages clear. */
  const announce = useCallback((text: string, transient = false) => {
    window.clearTimeout(announceTimer.current);
    setAnnouncement(text);
    if (transient) announceTimer.current = window.setTimeout(() => setAnnouncement(''), 4000);
  }, []);

  useEffect(() => () => window.clearTimeout(announceTimer.current), []);

  useEffect(() => {
    if (state.status === 'loading') announce(t.loading);
    else if (state.status === 'ready') announce(state.total === 1 ? t.loadedOne : format(t.loaded, { total: state.total }), true);
    else if (state.status === 'error') announce(t.error);
    else if (state.status === 'unsupported') announce(t.unsupported);
  }, [state.status, state.total, announce, t]);

  useEffect(() => {
    if (state.printing) announce(t.printing, true);
  }, [state.printing, announce, t.printing]);

  // Host-side shortcuts, only while the document is actually usable.
  useEffect(() => {
    if (!ready) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.altKey || document.documentElement.classList.contains('menu-open')) return;
      const target = event.target as HTMLElement | null;
      if (target && /INPUT|TEXTAREA|SELECT/.test(target.tagName)) return;
      const mod = event.ctrlKey || event.metaKey;
      const simple: Record<string, 'zoomIn' | 'zoomOut' | 'fitWidth'> = {
        '+': 'zoomIn',
        '=': 'zoomIn',
        '-': 'zoomOut',
        _: 'zoomOut',
        '0': 'fitWidth',
      };
      const cmd = mod ? undefined : simple[event.key];
      if (!mod && (event.key === 'ArrowRight' || event.key === 'ArrowLeft')) {
        const forward = (event.key === 'ArrowRight') !== (dir === 'rtl');
        event.preventDefault();
        send(forward ? 'next' : 'prev');
        return;
      }
      if (mod && (event.key === 'p' || event.key === 'P')) {
        event.preventDefault();
        send('print');
        return;
      }
      if (!cmd) return;
      event.preventDefault();
      send(cmd);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [ready, dir, send]);

  // The title fits its column word by word; the page arrives as the project pages do.
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
    const { gsap } = runtime;
    const ctx = gsap.context(() => {
      gsap.fromTo('.cvp__eyebrow', { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 1, ease: 'power3.out', delay: 0.1 });
      gsap.fromTo(
        '[data-split] .char, [data-split] .word',
        { y: 100, rotation: 6, opacity: 0 },
        { y: 0, rotation: 0, opacity: 1, duration: 2, stagger: 0.02, ease: 'power4.out' },
      );
      gsap.fromTo('.cvp__meta li, .cvp__actions > *', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 1, stagger: 0.07, ease: 'power3.out', delay: 0.45 });
      // The stage opens from an inset window, like the works' cards, and its controls rise.
      gsap.fromTo(
        '.cvp__stage',
        { clipPath: 'inset(10% 6% 0% 6% round 40px)', y: 60 },
        { clipPath: 'inset(0% 0% 0% 0% round 24px)', y: 0, duration: 1.6, ease: 'expo.out', delay: 0.55, clearProps: 'clipPath' },
      );
      gsap.fromTo('.cvp__tools', { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 1, ease: 'power3.out', delay: 1.2 });
      gsap.fromTo('.cvp .p-back .back', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: '.cvp .p-back', start: 'top 95%' } });
    }, el);
    return () => {
      cleanup();
      ctx.revert();
    };
  }, [runtime, lang]);

  const home = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    go('/');
  };

  const pages = ready ? format(t.page, { n: state.page, total: state.total }) : '';

  return (
    <div className="cvp" ref={page}>
      <section className="p-hero cvp__hero" aria-labelledby="cv-title">
        <p className="cvp__eyebrow">
          <Asterisk className="split-title__ast" />
          <span>{content.meta.name}</span>
        </p>
        <h1 className="p-title" id="cv-title" tabIndex={-1}>
          <span className="sr-only">{t.title}</span>
          <span aria-hidden="true" data-split="">
            <SplitText text={t.title} lang={lang} />
          </span>
        </h1>
        <div className="cvp__bar">
          <ul className="cvp__meta">
            <li>{t.updated}</li>
            {lang === 'ar' && <li>{t.docLang}</li>}
            <li>
              <bdi>{t.fileInfo}</bdi>
            </li>
          </ul>
          <div className="cvp__actions">
            <a className="cvp__btn cvp__btn--solid" href={PDF} download="Menna-Elwan-CV.pdf" data-fill="">
              <Icon name="download" />
              <RollText text={t.download} lang={lang} />
            </a>
            <button
              type="button"
              className="cvp__btn"
              onClick={() => send('print')}
              disabled={!ready}
              aria-busy={state.printing}
              data-fill=""
            >
              <Icon name="print" />
              <RollText text={t.print} lang={lang} />
            </button>
            <a className="cvp__btn cvp__btn--ghost" href={PDF} target="_blank" rel="noopener noreferrer">
              <RollText text={t.openPdf} lang={lang} />
              <ArrowUpRightLong />
              <span className="sr-only"> {ui.newTab}</span>
            </a>
          </div>
        </div>
      </section>

      <section className="cvp__wrap" aria-label={t.viewer}>
        <div className="cvp__stage" ref={stageRef} data-state={state.status}>
          <span
            className={`cvp__progress${state.progress >= 1 ? ' is-done' : ''}`}
            style={{ '--p': state.progress } as CSSProperties}
            aria-hidden="true"
          />
          <div className="cvp__viewer">
            <iframe id="cv-frame" ref={frameRef} src={src} title={t.viewer} allow="fullscreen" />
            {failed && (
              <div className="cvp__fallback">
                <div className="cvp__fallback-card">
                  <Icon name={state.status === 'error' ? 'warn' : 'file'} />
                  <h2>{state.status === 'error' ? t.error : t.title}</h2>
                  <p>{state.status === 'error' ? t.errorBody : t.unsupported}</p>
                  <div className="cvp__actions">
                    {state.status === 'error' && (
                      <button type="button" className="cvp__btn cvp__btn--solid" onClick={retry} data-fill="">
                        <RollText text={t.retry} lang={lang} />
                      </button>
                    )}
                    <a className="cvp__btn" href={PDF} download="Menna-Elwan-CV.pdf" data-fill="">
                      <Icon name="download" />
                      <RollText text={t.download} lang={lang} />
                    </a>
                    <a className="cvp__btn cvp__btn--ghost" href={PDF} target="_blank" rel="noopener noreferrer">
                      <RollText text={t.openPdf} lang={lang} />
                      <ArrowUpRightLong />
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="cvp__tools" role="group" aria-label={t.toolbar} title={t.shortcuts}>
            <button
              type="button"
              className="cvp__tool"
              onClick={() => send('zoomOut')}
              disabled={!ready || !state.canZoomOut}
              aria-label={t.zoomOut}
              title={`${t.zoomOut} (−)`}
            >
              <Icon name="minus" />
            </button>
            <button
              type="button"
              className="cvp__pct"
              onClick={() => send('auto')}
              disabled={!ready}
              /* WCAG 2.5.3: the visible text opens the accessible name, so a voice-control
                 user saying "click 100%" reaches this button. */
              aria-label={ready && state.percent != null ? `${state.percent}% · ${t.resetZoom}` : t.resetZoom}
            >
              {ready && state.percent != null ? `${state.percent}%` : '—'}
            </button>
            <button
              type="button"
              className="cvp__tool"
              onClick={() => send('zoomIn')}
              disabled={!ready || !state.canZoomIn}
              aria-label={t.zoomIn}
              title={`${t.zoomIn} (+)`}
            >
              <Icon name="plus" />
            </button>
            <button
              type="button"
              className="cvp__tool cvp__fit"
              onClick={() => send('fitWidth')}
              disabled={!ready}
              aria-pressed={ready && state.mode === 'fit'}
              aria-label={t.fitWidth}
              title={`${t.fitWidth} (0)`}
            >
              <Icon name="fit" />
            </button>

            <span className="cvp__sep" aria-hidden="true" />

            <button
              type="button"
              className="cvp__tool cvp__step"
              onClick={() => send('prev')}
              disabled={!ready || state.page <= 1}
              aria-label={t.prev}
              title={t.prev}
            >
              <Icon name="prev" flip />
            </button>
            <span className="cvp__pages">
              <span className="full">{pages}</span>
              <span className="short" aria-hidden="true">
                {ready ? format(t.pageShort, { n: state.page, total: state.total }) : ''}
              </span>
            </span>
            <button
              type="button"
              className="cvp__tool cvp__step"
              onClick={() => send('next')}
              disabled={!ready || state.page >= state.total}
              aria-label={t.next}
              title={t.next}
            >
              <Icon name="next" flip />
            </button>

            {fullscreen.supported && (
              <>
                <span className="cvp__sep" aria-hidden="true" />
                <button
                  type="button"
                  className="cvp__tool"
                  onClick={fullscreen.toggle}
                  aria-pressed={fullscreen.active}
                  aria-label={fullscreen.active ? t.exitFullscreen : t.fullscreen}
                  title={fullscreen.active ? t.exitFullscreen : t.fullscreen}
                >
                  <Icon name={fullscreen.active ? 'fullscreenExit' : 'fullscreen'} />
                </button>
              </>
            )}
          </div>
        </div>
        <div className="cvp__under">
          <p className="cvp__status" role="status" aria-live="polite">
            {announcement}
          </p>
          <p className="cvp__hint">{t.shortcuts}</p>
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
