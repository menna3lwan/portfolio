/* =============================================================================
   After `vite build`: the static head for every route, robots.txt and sitemap.xml.

   Why a static file per route rather than leaving it all to the application: social
   scrapers (Facebook, LinkedIn, Slack, X) do not run JavaScript, so a title and preview
   card set by React is invisible to them. Emitting the real <head> for each route — and
   nothing else, no prerendered body — gives every shared link its correct card with no
   hydration risk at all. Search crawlers run the application and see the full page; the
   visitor's browser loads the same bundle it always did.

   Nothing here invents a domain. Without VITE_SITE_URL the canonical, og:url and sitemap
   are omitted and the build says so, because a canonical pointing at a guessed address
   is worse than none.
   ========================================================================== */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { routes, SOCIAL_IMAGE } from './routes.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const dist = join(here, '..', 'dist');
const siteUrl = (process.env.VITE_SITE_URL ?? '').trim().replace(/\/+$/, '');
const hashRouting = process.env.VITE_ROUTER === 'hash';

/* The repository subpath the site is served from, with no trailing slash ('' at an origin
   root, '/portfolio' on GitHub Pages). Anything this file writes as an absolute URL has to
   carry it, or it resolves against the origin and 404s. It mirrors VITE_BASE, the same
   value Vite rewrote into the asset URLs. */
const basePath = hashRouting
  ? ''
  : `/${(process.env.VITE_BASE ?? '').trim().replace(/^\/+|\/+$/g, '')}`.replace(/^\/$/, '');

if (!existsSync(join(dist, 'index.html'))) {
  console.error('[postbuild] dist/index.html is missing — run vite build first');
  process.exit(1);
}

const shell = readFileSync(join(dist, 'index.html'), 'utf8');
const escape = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// the root keeps its trailing slash, which is the canonical form for an origin
const absolute = (path) => (siteUrl ? `${siteUrl}${path}` : null);

/** Replace the shell's own head tags with this route's, keeping everything else. */
function headFor({ path, title, description }) {
  const url = absolute(path);
  const tags = [
    `<title>${escape(title)}</title>`,
    `<meta name="description" content="${escape(description)}">`,
    url ? `<link rel="canonical" href="${escape(url)}">` : null,
    '',
    `<meta property="og:type" content="${path === '/' ? 'profile' : 'article'}">`,
    `<meta property="og:site_name" content="Menna Elwan">`,
    `<meta property="og:title" content="${escape(title)}">`,
    `<meta property="og:description" content="${escape(description)}">`,
    `<meta property="og:locale" content="en_US">`,
    `<meta property="og:locale:alternate" content="ar_EG">`,
    url ? `<meta property="og:url" content="${escape(url)}">` : null,
    siteUrl ? `<meta property="og:image" content="${escape(`${siteUrl}/${SOCIAL_IMAGE}`)}">` : null,
    siteUrl ? `<meta property="og:image:width" content="1200">` : null,
    siteUrl ? `<meta property="og:image:height" content="630">` : null,
    siteUrl ? `<meta property="og:image:alt" content="${escape(title)}">` : null,
    '',
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${escape(title)}">`,
    `<meta name="twitter:description" content="${escape(description)}">`,
    siteUrl ? `<meta name="twitter:image" content="${escape(`${siteUrl}/${SOCIAL_IMAGE}`)}">` : null,
  ].filter((line) => line !== null);
  return tags.join('\n');
}

function pageFor(route) {
  // the shell carries a placeholder block the generator replaces, so the two never
  // disagree about which tags belong to the route
  const marker = /<!--seo-->[\s\S]*?<!--\/seo-->/;
  if (!marker.test(shell)) {
    console.error('[postbuild] the <!--seo--> block is missing from index.html');
    process.exit(1);
  }
  return shell.replace(marker, `<!--seo-->\n${headFor(route)}\n<!--/seo-->`);
}

const list = routes('en');

// 1 — the home page replaces dist/index.html; every other route gets its own directory,
//     which most static hosts serve without any rewrite rule at all.
for (const route of list) {
  const html = pageFor(route);
  if (route.path === '/') {
    writeFileSync(join(dist, 'index.html'), html);
    continue;
  }
  if (hashRouting) continue; // a hash build serves every route from the one shell
  const dir = join(dist, route.path.replace(/^\//, ''));
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'), html);
}

// 2 — the no-rewrite fallback. A host that serves this for an unknown path still lands
//     the visitor on the right route; one that rewrites to index.html never reaches it.
if (!hashRouting) {
  writeFileSync(
    join(dist, '404.html'),
    // the redirect is an external file, so the page's CSP need not allow inline script
    pageFor(list[0]).replace(
      '</head>',
      `<script src="${basePath}/spa-redirect.js"></script>\n</head>`,
    ),
  );
}

// 3 — robots.txt
const robots = [
  'User-agent: *',
  'Allow: /',
  '',
  '# the PDF.js viewer is a frame of the CV page, not a page of its own',
  `Disallow: ${basePath}/cv-viewer/`,
  '',
  siteUrl ? `Sitemap: ${siteUrl}/sitemap.xml` : '# Sitemap: set VITE_SITE_URL at build time to emit this line',
  '',
].join('\n');
writeFileSync(join(dist, 'robots.txt'), robots);

// 4 — sitemap.xml, only when there is a real origin to put in it
if (siteUrl && !hashRouting) {
  const today = new Date().toISOString().slice(0, 10);
  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...list.map((route) =>
      [
        '  <url>',
        `    <loc>${escape(absolute(route.path))}</loc>`,
        `    <lastmod>${today}</lastmod>`,
        `    <changefreq>${route.changefreq}</changefreq>`,
        `    <priority>${route.priority}</priority>`,
        // no hreflang alternates: both languages are served from this one URL
        '  </url>',
      ].join('\n'),
    ),
    '</urlset>',
    '',
  ].join('\n');
  writeFileSync(join(dist, 'sitemap.xml'), xml);
}

const mode = hashRouting ? 'hash routing' : 'path routing';
console.log(
  `[postbuild] ${mode}: ${hashRouting ? 1 : list.length} static page(s), robots.txt` +
    (siteUrl && !hashRouting ? `, sitemap.xml (${list.length} URLs)` : ''),
);
if (!siteUrl) {
  console.warn(
    '[postbuild] VITE_SITE_URL is not set — canonical, og:url, og:image and sitemap.xml were\n' +
      '            omitted rather than pointed at a guessed domain. Set it for the real deploy.',
  );
}
