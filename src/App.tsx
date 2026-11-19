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

export default function App() {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <ErrorBoundary>
          <Router>
            <Suspense fallback={<RouteFallback />}>
              <Routes>
                <Route element={<AppLayout />}>
                  <Route index element={<Home />} />
                  <Route path="work/:id" element={<CaseStudy />} />
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
