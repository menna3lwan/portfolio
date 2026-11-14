import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import type { CSSProperties } from 'react';
import { Icon } from '@/components/ui/Icon';
import { BrandMark } from '@/components/ui/BrandMark';
import { SkipLink } from '@/components/layout/SkipLink';
import { useLanguage, useTheme } from '@/app/hooks/useAppContext';
import { useDocumentMeta } from '@/app/hooks/useDocumentMeta';
import { cvDescription, cvTitle } from '@/seo/meta';
import { cvStrings, format } from '@/features/cv/cvStrings';
import { useViewerBridge } from '@/features/cv/useViewerBridge';
import { useFullscreen } from '@/features/cv/useFullscreen';
import { asset } from '@/site.config';

const PDF = asset('Menna-Elwan-CV.pdf');

/**
 * The CV route.
 *
 * It hosts the self-contained PDF.js viewer in an iframe and owns everything around it:
 * the document toolbar, the page and zoom state reflected back from the viewer, the
 * progress hairline, the fallback panel, full screen, and the host-side keyboard
 * shortcuts (the viewer handles its own once focus is inside it).
 */
export default function Cv() {
  const { content, lang, dir, toggleLanguage } = useLanguage();
  const { resolved, toggleTheme } = useTheme();
  const frameRef = useRef<HTMLIFrameElement>(null);
  const t = cvStrings(content);
  const [announcement, setAnnouncement] = useState('');
  const announceTimer = useRef(0);
  const fullscreen = useFullscreen();

  const { state, send, retry, src } = useViewerBridge({
    frameRef,
    pdf: new URL(PDF, window.location.href).href,
    theme: resolved,
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
    if (transient) {
      announceTimer.current = window.setTimeout(() => setAnnouncement(''), 4000);
    }
  }, []);

  useEffect(() => () => window.clearTimeout(announceTimer.current), []);

  useEffect(() => {
    if (state.status === 'loading') announce(t.loading);
    else if (state.status === 'ready') announce(format(t.loaded, { total: state.total }), true);
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
      if (event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target && /INPUT|TEXTAREA|SELECT/.test(target.tagName)) return;
      const mod = event.ctrlKey || event.metaKey;
      const rtl = lang === 'ar';
      const simple: Record<string, 'zoomIn' | 'zoomOut' | 'fitWidth'> = {
        '+': 'zoomIn',
        '=': 'zoomIn',
        '-': 'zoomOut',
        _: 'zoomOut',
        '0': 'fitWidth',
      };
      let cmd = simple[event.key];
      if (!cmd && !mod && event.key === 'ArrowRight') cmd = rtl ? undefined : undefined;
      if (!cmd && !mod && (event.key === 'ArrowRight' || event.key === 'ArrowLeft')) {
        const forward = (event.key === 'ArrowRight') !== rtl;
        event.preventDefault();
        send(forward ? 'next' : 'prev');
        return;
      }
      if (!cmd && mod && (event.key === 'p' || event.key === 'P')) {
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
  }, [ready, lang, send]);

  const targetLang = lang === 'ar' ? 'en' : 'ar';
  const uiLang = (content.ui.lang as string) || '';

  return (
    <div className="cv-page">
      <SkipLink targetId="cv-frame">{t.viewer}</SkipLink>

      <header className="cv-bar">
        <div className="wrap cv-bar__in">
          <Link className="cv-brand" to="/">
            <BrandMark className="cv-brand__logo" />
            <b>{content.meta.name}</b>
          </Link>
          <button
            type="button"
            className="icon-btn cv-lang-btn"
            onClick={toggleLanguage}
            aria-label={uiLang || 'Language'}
            title={uiLang}
          >
            <span className="full" lang={targetLang}>
              {targetLang === 'ar' ? 'العربية' : 'English'}
            </span>
            <span className="short" lang={targetLang} aria-hidden="true">
              {targetLang === 'ar' ? 'ع' : 'EN'}
            </span>
          </button>
          <button
            type="button"
            className="icon-btn"
            onClick={toggleTheme}
            aria-label={(content.ui.theme as string) || 'Theme'}
            aria-pressed={resolved === 'dark'}
          >
            <Icon name={resolved === 'dark' ? 'sun' : 'moon'} />
          </button>
        </div>
      </header>

      <main className="cv-main">
        <section className="wrap cv-head" aria-labelledby="cv-title">
          <Link className="cv-back" to="/">
            <Icon name="back" flip />
            <span>{t.back}</span>
          </Link>
          <div className="cv-head__row">
            <div>
              <h1 className="cv-title" id="cv-title">
                {t.title}
                <span className="dot" aria-hidden="true">
                  .
                </span>
              </h1>
              <p className="cv-meta">
                <span className="who">{content.meta.name}</span>
                <span>{t.updated}</span>
                {lang === 'ar' && <span>{t.docLang}</span>}
                <span>{t.fileInfo}</span>
              </p>
            </div>
            <div className="cv-actions">
              <a
                className="cv-btn cv-btn--primary"
                href={PDF}
                download="Menna-Elwan-CV.pdf"
                aria-label={t.download}
              >
                <Icon name="download" />
                <span className="cv-full-l">{t.download}</span>
                <span className="cv-short-l" aria-hidden="true">
                  {t.downloadShort}
                </span>
              </a>
              <button
                type="button"
                className="cv-btn"
                onClick={() => send('print')}
                disabled={!ready}
                aria-busy={state.printing}
              >
                <Icon name="print" />
                <span>{t.print}</span>
              </button>
            </div>
          </div>
        </section>

        <div className="wrap cv-stage-wrap">
          <div className="cv-stage" data-state={state.status}>
            <div className="cv-toolbar" role="group" aria-label={t.toolbar} title={t.shortcuts}>
              <div className="cv-group">
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => send('zoomOut')}
                  disabled={!ready || !state.canZoomOut}
                  aria-label={t.zoomOut}
                  title={`${t.zoomOut} (−)`}
                >
                  <Icon name="minus" />
                </button>
                <button
                  type="button"
                  className="cv-pct"
                  onClick={() => send('auto')}
                  disabled={!ready}
                  /* WCAG 2.5.3: the visible text has to open the accessible name, or a
                     voice-control user saying "click 100%" cannot reach this button. */
                  aria-label={
                    ready && state.percent != null
                      ? `${state.percent}% · ${t.resetZoom}`
                      : t.resetZoom
                  }
                >
                  {ready && state.percent != null ? `${state.percent}%` : ''}
                </button>
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => send('zoomIn')}
                  disabled={!ready || !state.canZoomIn}
                  aria-label={t.zoomIn}
                  title={`${t.zoomIn} (+)`}
                >
                  <Icon name="plus" />
                </button>
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => send('fitWidth')}
                  disabled={!ready}
                  aria-pressed={ready && state.mode === 'fit'}
                  aria-label={t.fitWidth}
                  title={`${t.fitWidth} (0)`}
                >
                  <Icon name="fit" />
                </button>
              </div>

              <span className="cv-sep" aria-hidden="true" />

              <div className="cv-group">
                <button
                  type="button"
                  className="icon-btn cv-page-step"
                  onClick={() => send('prev')}
                  disabled={!ready || state.page <= 1}
                  aria-label={t.prev}
                  title={t.prev}
                >
                  <Icon name="prev" flip />
                </button>
                <span className="cv-pages">
                  <span className="full">
                    {ready ? format(t.page, { n: state.page, total: state.total }) : ''}
                  </span>
                  <span className="short" aria-hidden="true">
                    {ready ? format(t.pageShort, { n: state.page, total: state.total }) : ''}
                  </span>
                </span>
                <button
                  type="button"
                  className="icon-btn cv-page-step"
                  onClick={() => send('next')}
                  disabled={!ready || state.page >= state.total}
                  aria-label={t.next}
                  title={t.next}
                >
                  <Icon name="next" flip />
                </button>
              </div>

              <span className="cv-status" role="status" aria-live="polite">
                {announcement}
              </span>

              <div className="cv-tool-end">
                <a
                  className="icon-btn cv-dl-tool"
                  href={PDF}
                  download="Menna-Elwan-CV.pdf"
                  aria-label={t.download}
                  title={t.download}
                >
                  <Icon name="download" />
                </a>
                {fullscreen.supported && (
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={fullscreen.toggle}
                    aria-pressed={fullscreen.active}
                    aria-label={fullscreen.active ? t.exitFullscreen : t.fullscreen}
                    title={fullscreen.active ? t.exitFullscreen : t.fullscreen}
                  >
                    <Icon name={fullscreen.active ? 'fullscreenExit' : 'fullscreen'} />
                  </button>
                )}
              </div>

              <span
                className={`cv-progress${state.progress >= 1 ? ' is-done' : ''}`}
                style={{ '--p': state.progress } as CSSProperties}
                aria-hidden="true"
              />
            </div>

            <div className="cv-viewer" data-state={state.status}>
              <iframe
                id="cv-frame"
                ref={frameRef}
                src={src}
                title={t.viewer}
                allow="fullscreen"
              />
              {failed && (
                <div className="cv-fallback">
                  <div className="cv-fallback__card">
                    <span className="ic" aria-hidden="true">
                      <Icon name={state.status === 'error' ? 'warn' : 'file'} />
                    </span>
                    <h2>{state.status === 'error' ? t.error : t.title}</h2>
                    <p>{state.status === 'error' ? t.errorBody : t.unsupported}</p>
                    <div className="cv-actions">
                      {state.status === 'error' && (
                        <button type="button" className="cv-btn cv-btn--primary" onClick={retry}>
                          {t.retry}
                        </button>
                      )}
                      <a className="cv-btn" href={PDF} download="Menna-Elwan-CV.pdf">
                        <Icon name="download" />
                        <span>{t.download}</span>
                      </a>
                      <a className="cv-btn" href={PDF} target="_blank" rel="noopener noreferrer">
                        <span>{t.openPdf}</span>
                        <span aria-hidden="true">↗</span>
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
