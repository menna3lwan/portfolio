import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Icon } from '@/components/ui/Icon';
import { BrandMark } from '@/components/ui/BrandMark';
import { NAV_IDS, NAV_ITEMS } from './navigation';
import { useLanguage, useTheme } from '@/app/hooks/useAppContext';
import { useSectionSpy } from '@/app/hooks/useSectionSpy';
import { useScrollMotion } from '@/app/hooks/useScrollMotion';

/**
 * The masthead bar.
 *
 * It owns the reading-progress rule, the section indicator, the language and theme
 * toggles, and the mobile sheet. Section links are plain hashes so the browser's own
 * smooth scrolling does the work on the home route; from any other route they navigate
 * home first and then scroll.
 */
export function SiteHeader() {
  const { content, t, lang, toggleLanguage } = useLanguage();
  const { resolved, toggleTheme } = useTheme();
  const location = useLocation();
  const progressRef = useRef<HTMLSpanElement>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const sheetId = useId();

  const onHome = location.pathname === '/';
  useScrollMotion(progressRef);
  const activeSection = useSectionSpy(NAV_IDS, onHome);

  const closeSheet = useCallback(() => setSheetOpen(false), []);

  // The sheet covers the page, so the document behind it must not scroll with it.
  useEffect(() => {
    document.documentElement.classList.toggle('locked', sheetOpen);
    return () => document.documentElement.classList.remove('locked');
  }, [sheetOpen]);

  useEffect(() => {
    if (!sheetOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeSheet();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [sheetOpen, closeSheet]);

  useEffect(() => {
    closeSheet();
  }, [location.pathname, closeSheet]);


  return (
    <>
      <header className="site-header">
        <span className="progress" ref={progressRef} aria-hidden="true" />
        <div className="container site-header__inner">
          <Link className="site-header__brand" to="/" onClick={closeSheet}>
            <BrandMark className="site-header__mark" />
            <span className="site-header__name">{content.meta.name}</span>
          </Link>

          <nav className="site-header__nav" aria-label={t.navMainLabel}>
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.id}
                to={`/#${item.id}`}
                onClick={closeSheet}
                className={activeSection === item.id ? 'is-active' : undefined}
                aria-current={activeSection === item.id ? 'true' : undefined}
              >
                {t[item.key]}
              </Link>
            ))}
            <span className="site-header__pages">
              <Link className="cv-link" to="/cv">
                <span className="cv-link__doc" aria-hidden="true">
                  <Icon name="doc" />
                </span>
                <span className="cv-link__label">{t.cv}</span>
                <span className="cv-link__arrow" aria-hidden="true">
                  <Icon name="out" />
                </span>
              </Link>
            </span>
          </nav>

          <div className="site-header__tools">
            <button
              type="button"
              className="icon-btn icon-btn--lang"
              onClick={toggleLanguage}
              aria-label={(content.ui.lang as string) || 'Language'}
            >
              {lang === 'ar' ? 'EN' : 'ع'}
            </button>
            <button
              type="button"
              className="icon-btn"
              onClick={toggleTheme}
              aria-label={(content.ui.theme as string) || t.theme}
              aria-pressed={resolved === 'dark'}
            >
              <Icon name={resolved === 'dark' ? 'sun' : 'moon'} />
            </button>
            <Link className="btn btn--solid site-header__ask" to="/#contact" onClick={closeSheet}>
              <Icon name="mail" />
              <span>{t.ask}</span>
            </Link>
            <button
              type="button"
              className="icon-btn menu-btn"
              aria-expanded={sheetOpen}
              aria-controls={sheetId}
              aria-label={(content.ui.menu as string) || t.menu}
              onClick={() => setSheetOpen((open) => !open)}
            >
              <Icon name="menu" />
            </button>
          </div>
        </div>
      </header>

      <div className={`sheet${sheetOpen ? ' is-open' : ''}`} id={sheetId}>
        <div className="container">
          <nav aria-label={t.navMenuLabel}>
            {NAV_ITEMS.map((item, i) => (
              <Link key={item.id} to={`/#${item.id}`} onClick={closeSheet}>
                <span>{t[item.key]}</span>
                <span className="mono">{String(i + 1).padStart(2, '0')}</span>
              </Link>
            ))}
            <Link to="/cv" onClick={closeSheet}>
              <span>{t.cv}</span>
              <span className="mono" aria-hidden="true">
                ↗
              </span>
            </Link>
          </nav>
        </div>
      </div>
    </>
  );
}
