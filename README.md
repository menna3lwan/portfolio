# Menna Elwan — Portfolio

The production portfolio: React + TypeScript + Vite.

```bash
npm install
npm run dev            # http://localhost:5181
npm run verify         # typecheck -> lint -> tests -> production build
npm run build          # -> dist/  (the deployable artefact)
npm run preview        # serve dist/
npm run build:pages    # the exact build GitHub Pages receives (base /portfolio/)
npm run preview:pages  # serve it at http://localhost:4181/portfolio/
npm run build:preview  # hash-routed variant, for hosts that cannot rewrite paths
```

**Live site:** <https://menna3lwan.github.io/portfolio/> — published by
[`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml) on every push to `main`.
See [Deploying to GitHub Pages](#deploying-to-github-pages) below, and
**[DEPLOYMENT.md](./DEPLOYMENT.md)** for other hosts.

The build takes two values from the environment, and guesses neither:

| Variable | Why |
|---|---|
| `VITE_BASE` | The path the site is served from. `/` at an origin root; `/portfolio/` on GitHub Pages, where it has to reach every asset URL *and* the router's basename. |
| `VITE_SITE_URL` | The public origin. Canonical URLs, `og:url`, the social card and `sitemap.xml` derive from it, and are omitted rather than guessed when it is absent. |

## How it is organised

| Path | What lives there |
|---|---|
| `src/content/` | `content.{en,ar}.json` — the verified record of the repository and profile survey — and the interfaces that describe it. **The source of truth for every fact on the page.** |
| `src/data/corrections.ts` | Corrections applied on top of the content without editing it, each with its justification beside it. |
| `src/data/previews.ts` | The measured size of every screen concept; an application's preview is named by its own content record, so a mismatch is not expressible. |
| `src/i18n/strings.ts` | The shell's own chrome (chapter kickers, block labels), in both languages. |
| `src/styles/` | The design system, in cascade layers: `tokens, base, atoms, components, hover, motion`. `tokens.css` is the only file allowed to name a colour, a size, a radius, a duration or a curve — see below. |
| `src/features/` | One folder per section of the page. |
| `src/app/hooks/` | The motion and interaction primitives — reveal, scroll, parallax, pointer, count-up. |

## The design system

Everything lives in `src/styles/tokens.css`. Nothing outside it names a colour, a size, a
radius, a duration or a curve.

| Scale | Steps | Notes |
|---|---|---|
| **Colour** | 15 semantic tokens | one declaration each, both themes inside it via `light-dark()` |
| **Type** | 9 text + 11 display | labels are set 1px apart on purpose; body sizes are not |
| **Spacing** | 19, 2px-based | `--space-0-5` … `--space-23` |
| **Radius** | 5 + `pill` + `round` | |
| **Line height** | 9, incl. a 3-step display ramp | the larger the type, the tighter it is set |
| **Letter spacing** | 6 | `--tracking-display` is the display face's own figure, distinct from `none` |
| **Control height** | 4 — 28 / 32 / 40 / 44 | 44 is the WCAG 2.5.5 enhanced target size |
| **Motion** | 4 durations, 3 curves, 2 intensities | the base scale; `creative.css` adds seven named moments on top |
| **Breakpoints** | 5 — 400 / 560 / 680 / 900 / 1024 | not tokens: custom properties cannot be used in a media query |

Two things are worth knowing before editing it.

**The scales were derived from the design, not imposed on it.** Every step is a value the
approved design already used. A conventional 4px spacing grid was measured against the
page first and rejected: it would have moved 2,686 of the 3,141 spacing applications.

**Arabic is a token override, not a second stylesheet.** The label voice — `--f-label`,
`--weight-label`, `--case-label` and the tracking tokens — and every size step are
re-pointed once in the `[lang='ar']` block. Arabic labels run about 1.12× the Latin and
Arabic display about 0.72×, because the family changes from JetBrains Mono and Bebas Neue
to IBM Plex Sans Arabic. One rule therefore serves both languages, and a new component
needs no `[lang='ar']` rule at all unless it is doing something genuinely
language-specific.

Three literals are deliberate and should stay: `.sr-only`'s `-1px` margin, the brand
mark's `-5px` optical nudge, and the `1px` hairline between the Who-am-I facets. None of
them is spacing.

## Motion

`motion.css` is how things arrive. `creative.css` holds the seven signature moments —
the masthead setting itself, the card-to-case-study morph, the theme's ink sweep, the
preview's depth on hover, the code window running, the Who-am-I rule being drawn by
scroll, and the ink column of reading progress.

**No animation library.** Each candidate was built and measured rather than read about:

| | gzipped delta |
|---|---|
| Motion `layoutId` (shared element) | **+50.0 KB** — and `LazyMotion` saves nothing, because layout projection *is* the library |
| GSAP core + ScrollTrigger | +44.5 KB |
| GSAP core alone | +27.2 KB |
| Lenis | +5.4 KB |
| **what shipped** | **+1.14 KB** |

The two platform features cover the same ground for nothing: same-document **view
transitions** (Baseline since 2025-10-14) do the shared-element morph and the theme
sweep, and **CSS scroll-driven animations** run the scroll work on the compositor with
no JavaScript at all. The scroll work sits behind `@supports (animation-timeline: view())`
— Chrome and Edge 115+, Safari 26+, around 83% — and everything falls back to the
IntersectionObserver reveals that were already there.

Two rules worth keeping:

- **A `view-transition-name` is attached only for the duration of one navigation.** Two
  elements holding the same name when a snapshot is taken make the transition fail
  outright, so the chapter marks the card being opened and takes the mark back when the
  transition finishes.
- **`animation-duration` cannot stop a scroll-driven animation**, because it has no
  duration. The reduced-motion contract therefore also returns every timeline to `auto`.

## Rules this project holds itself to

- Never invent experience, achievements, metrics or project features. Every stat counts something
  the content documents and is labelled as the thing it counts.
- Distinguish shipped work from team work, mock data, partial and planned — that is what the scope
  status vocabulary is for.
- Corrections remove what is no longer true; they do not assert replacements that cannot be
  verified.

`npm test` enforces several of these directly.

## Routing and SEO

Real paths: `/`, `/work/:id`, `/experience/:id`, `/cv`. The build writes a static document for each one,
carrying that route's own title, description, canonical URL and social tags — social
scrapers do not run JavaScript, so a head set by React is invisible to them. A rewrite
catches unknown paths, and `404.html` covers hosts that can do neither.

`scripts/routes.mjs` generates those documents and the sitemap. It carries its own copy
of the title and description formulas because it cannot import the application's
TypeScript; `src/test/seo.test.ts` imports both and asserts they agree.

There is no `hreflang`: both languages are served from the same URL and switched in the
page, so there is no alternate address to point at. The pair is declared through
`og:locale` / `og:locale:alternate`, and `<html lang>` and `dir` follow the choice.

## Deploying to GitHub Pages

The site is published at **<https://menna3lwan.github.io/portfolio/>** — a *project* page,
so it is served from the repository's subpath rather than the domain root. That one fact
drives the whole configuration.

### What the subpath changes

| Concern | How it is handled |
|---|---|
| Asset URLs | `VITE_BASE=/portfolio/` becomes Vite's `base`, so every emitted `src`/`href` is `/portfolio/assets/…`. Files in `public/` are reached through `asset()` in `src/site.config.ts`, which prefixes `import.meta.env.BASE_URL` — never a bare `/`. |
| Router | `src/App.tsx` passes `basename` to the router, derived from the same `BASE_URL`. Without it `/portfolio/experience/nti` would be looked up as a route and never match. |
| Plain `<a>` links | The menu's section links are real document links, not router links, so they call `asset('#works')` themselves. A bare `/#works` would leave the project subpath entirely. |
| Deep links | `scripts/postbuild.mjs` writes a real `index.html` for every route, so GitHub Pages serves `/portfolio/experience/nti/` as a file — no rewrite rule needed. `404.html` catches anything else and hands the path back to the router. |
| Jekyll | `public/.nojekyll` stops GitHub Pages from stripping underscore-prefixed paths. |

### First-time setup

1. Push the repository to GitHub as **`portfolio`** with `main` as the default branch.
2. **Settings → Pages → Build and deployment → Source: GitHub Actions.** Do *not* pick
   "Deploy from a branch" — the workflow publishes an artifact, not a `gh-pages` branch.
3. Push to `main` (or run the workflow from the **Actions** tab). The `deploy` job prints
   the live URL when it finishes.

### The workflow

[`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml) runs on every push to
`main`: `npm ci` → `typecheck` → `lint` → `test` → `build:pages` → upload → deploy. Each
step must pass for the next to run, so a build that fails verification never reaches the
live site. It needs no secrets: `permissions: pages: write, id-token: write` is what
authorises the deploy.

### Verifying a Pages build locally

`npm run preview:pages` serves `dist/` at `http://localhost:4181/portfolio/`, the same
path the live site uses. Note that Vite's preview server falls back to `index.html` for
unknown paths and GitHub Pages does not — so a deep link that works in preview but relies
on that rewrite would still break live. The per-route documents written by `postbuild` are
what make deep links work without any rewrite.

### Moving to a custom domain

Set `VITE_BASE=/` and `VITE_SITE_URL=https://your-domain`, add the domain under
Settings → Pages, and commit a `CNAME` file into `public/`. Nothing else changes.

## The CV viewer

`public/cv-viewer/` is a self-contained PDF.js build loaded in an iframe and driven over
`postMessage`. `pdf.worker.min.js` is the real worker; `pdf.worker.min.js.b64` is the fallback the
viewer decodes on hosts that will not serve the raw file.

## Performance notes

- The four font families are **self-hosted**. From Google's CDN they cost a DNS lookup, a
  TLS handshake and a render-blocking stylesheet on a third origin before a single glyph
  could be requested. All four are SIL OFL; see `src/assets/fonts/OFL.txt`.
- **Arabic content is a separate chunk.** Both languages together are 292 kB of JSON;
  English is bundled, Arabic is fetched the first time it is actually asked for.
- Images carry `srcset` at the widths their boxes actually request. Regenerate with
  `python3 scripts/make-image-variants.py` after changing a source image.
- Fonts are never inlined as `data:` URIs — it would inflate the render-blocking
  stylesheet, defeat caching, and force `data:` into the page's `font-src`.

Measured with Lighthouse on the production build: **100 / 100 / 100 / 100** on desktop,
**92 / 100 / 100 / 100** on throttled mobile.

## History

Version control was introduced after the implementation was complete, so the twelve
commits on `main` group the work by concern rather than recording it as it happened.
Everything from this point is recorded normally.
