import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { SiteHeader } from './SiteHeader';
import { SkipLink } from './SkipLink';
import { useLanguage } from '@/app/hooks/useAppContext';
import { usePointerGlow } from '@/app/hooks/usePointerGlow';

/**
 * The shell every page-level route renders inside: the skip link, the masthead bar, and
 * the page-wide pointer highlight. The CV route deliberately sits outside it, because it
 * is a full-height document viewer with a chrome of its own.
 */
export function AppLayout() {
  const { content, t } = useLanguage();
  const location = useLocation();
  usePointerGlow();

  // A hash arriving with a navigation (for example `/#work` from the CV route) has to be
  // resolved after the target route has painted.
  useEffect(() => {
    if (!location.hash) {
      // a route change with no target starts at the top
      if (location.key !== 'default') window.scrollTo({ top: 0 });
      return;
    }
    const id = location.hash.slice(1);
    const frame = requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ block: 'start' });
    });
    return () => cancelAnimationFrame(frame);
    // location.key changes on every navigation, so clicking the same section twice
    // scrolls to it twice rather than going quiet after the first.
  }, [location.hash, location.pathname, location.key]);

  return (
    <>
      <SkipLink targetId="main">{(content.ui.skip as string) || t.skipToContent}</SkipLink>
      <SiteHeader />
      <main id="main">
        <Outlet />
      </main>
    </>
  );
}
