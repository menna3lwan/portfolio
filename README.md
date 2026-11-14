# Menna Elwan — Portfolio

The production portfolio: React + TypeScript + Vite.

```bash
npm install
npm run dev            # http://localhost:5181
npm run verify         # typecheck -> lint -> tests -> production build
npm run build          # -> dist/  (the deployable artefact)
npm run preview        # serve dist/
npm run build:preview  # hash-routed variant, for hosts that cannot rewrite paths
```

Deploying: see **[DEPLOYMENT.md](./DEPLOYMENT.md)**. The one value the build needs is
`VITE_SITE_URL`, set in the hosting platform's environment — canonical URLs, `og:url`,
the social card and `sitemap.xml` are all derived from it, and are omitted rather than
guessed when it is absent.

## How it is organised

| Path | What lives there |
|---|---|
| `src/content/` | `content.{en,ar}.json` — the verified record of the repository and profile survey — and the interfaces that describe it. **The source of truth for every fact on the page.** |
| `src/data/corrections.ts` | Corrections applied on top of the content without editing it, each with its justification beside it. |
| `src/data/previews.ts` | The measured size of every screen concept; an application's preview is named by its own content record, so a mismatch is not expressible. |
| `src/i18n/strings.ts` | The shell's own chrome (chapter kickers, block labels), in both languages. |
| `src/styles/` | The design system, in cascade layers: `tokens, base, atoms, components, hover, motion`. |
| `src/features/` | One folder per section of the page. |
| `src/app/hooks/` | The motion and interaction primitives — reveal, scroll, parallax, pointer, count-up. |

## Rules this project holds itself to

- Never invent experience, achievements, metrics or project features. Every stat counts something
  the content documents and is labelled as the thing it counts.
- Distinguish shipped work from team work, mock data, partial and planned — that is what the scope
  status vocabulary is for.
- Corrections remove what is no longer true; they do not assert replacements that cannot be
  verified.

`npm test` enforces several of these directly.

## Routing and SEO

Real paths: `/`, `/work/:id`, `/cv`. The build writes a static document for each one,
carrying that route's own title, description, canonical URL and social tags — social
scrapers do not run JavaScript, so a head set by React is invisible to them. A rewrite
catches unknown paths, and `404.html` covers hosts that can do neither.

`scripts/routes.mjs` generates those documents and the sitemap. It carries its own copy
of the title and description formulas because it cannot import the application's
TypeScript; `src/test/seo.test.ts` imports both and asserts they agree.

There is no `hreflang`: both languages are served from the same URL and switched in the
page, so there is no alternate address to point at. The pair is declared through
`og:locale` / `og:locale:alternate`, and `<html lang>` and `dir` follow the choice.

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
