import { lazy, Suspense } from 'react';
import { BrowserRouter, HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { LanguageProvider } from '@/app/providers/LanguageProvider';
import { ThemeProvider } from '@/app/providers/ThemeProvider';
import { AppLayout } from '@/components/layout/AppLayout';
import { ErrorBoundary } from '@/components/layout/ErrorBoundary';
import { RouteFallback } from '@/components/layout/RouteFallback';
import Home from '@/routes/Home';
import { ROUTER_MODE } from '@/site.config';

/* The two secondary routes are split out of the main bundle: the CV route carries the
   whole viewer bridge and most visitors never open it. */
const CaseStudy = lazy(() => import('@/routes/CaseStudy'));
const ExperienceDetail = lazy(() => import('@/routes/ExperienceDetail'));
const Cv = lazy(() => import('@/routes/Cv'));

/**
 * Routing.
 *
 * The deployed site uses real paths: `/work/flower-app` is a URL a search engine can
 * index, a sitemap can list and a canonical tag can point at, which the hash form is not.
 * The build emits a static document per route and the host rewrites anything else to the
 * application, so a deep link and a reload both work.
 *
 * `VITE_ROUTER=hash` switches to the hash form for a host that cannot rewrite unknown
 * paths — a preview artifact, or opening the build straight off disk.
 */
const Router = ROUTER_MODE === 'hash' ? HashRouter : BrowserRouter;

/**
 * The path the application is mounted at.
 *
 * On an origin deploy this is empty and every route is rooted at "/". On GitHub Pages the
 * site lives under the repository's subpath, so the router has to strip "/portfolio" from
 * the incoming location and add it back to every `<Link>` — otherwise "/experience/nti"
 * would be looked up as a route and never match. Vite writes the same value into
 * BASE_URL, so the two can never drift apart. The hash build is served from a directory
 * rather than an origin root and carries no basename at all.
 */
const BASENAME =
  ROUTER_MODE === 'hash' ? undefined : import.meta.env.BASE_URL.replace(/\/+$/, '') || undefined;

export default function App() {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <ErrorBoundary>
          <Router basename={BASENAME}>
            <Suspense fallback={<RouteFallback />}>
              <Routes>
                <Route element={<AppLayout />}>
                  <Route index element={<Home />} />
                  <Route path="work/:id" element={<CaseStudy />} />
                  <Route path="experience/:id" element={<ExperienceDetail />} />
                  <Route path="cv" element={<Cv />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Route>
              </Routes>
            </Suspense>
          </Router>
        </ErrorBoundary>
      </ThemeProvider>
    </LanguageProvider>
  );
}
