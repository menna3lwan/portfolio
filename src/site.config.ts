/* =============================================================================
   The one place the deployment's own facts live.

   `VITE_SITE_URL` is supplied by the build, never guessed here: a canonical URL or a
   sitemap entry pointing at a domain nobody confirmed is worse than none at all, so when
   it is missing the build omits those tags rather than inventing an address.
   ========================================================================== */

const raw = (import.meta.env.VITE_SITE_URL ?? '').trim();

/** The deployment's origin with no trailing slash, or null when it was not supplied. */
export const SITE_URL: string | null = raw ? raw.replace(/\/+$/, '') : null;

/** True once a real domain is configured; the SEO tags key off this. */
export const HAS_SITE_URL = SITE_URL !== null;

/** An absolute URL for a route, or null while the domain is unconfirmed. */
export const absoluteUrl = (path: string): string | null =>
  SITE_URL === null ? null : `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;

/** Routing mode. Path routing is the deployed default — it is what makes the per-route
 *  canonical URLs and the sitemap mean anything. The hash build exists for hosts that
 *  cannot rewrite unknown paths to the app (a preview artifact, a file:// open). */
export const ROUTER_MODE: 'browser' | 'hash' =
  import.meta.env.VITE_ROUTER === 'hash' ? 'hash' : 'browser';

/**
 * A URL for a file in `public/`.
 *
 * Every asset reference goes through this. A bare relative path would resolve against
 * the current route — `img/cut/x.webp` becomes `/work/flower-app/img/cut/x.webp` and
 * 404s — and a hard-coded leading slash would break the hash build, which is served from
 * a directory rather than an origin root. Vite's BASE_URL is correct for both.
 */
export const asset = (path: string): string =>
  `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`;

export const SOCIAL_IMAGE = 'social-card.png';
export const SOCIAL_IMAGE_SIZE = { width: 1200, height: 630 } as const;
