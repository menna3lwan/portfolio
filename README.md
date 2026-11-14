# Menna Elwan — Portfolio

The production portfolio: React + TypeScript + Vite.

```bash
npm install
npm run dev        # http://localhost:5181
npm run verify     # typecheck -> lint -> tests -> production build
npm run build      # -> dist/
npm run preview    # serve dist/
```

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

## Routing

Hash-based (`#/`, `#/work/:id`, `#/cv`), so every route is deep-linkable from any static host with
no server configuration. On a host that can rewrite paths, swap `HashRouter` for `BrowserRouter`
in `src/App.tsx`.

## The CV viewer

`public/cv-viewer/` is a self-contained PDF.js build loaded in an iframe and driven over
`postMessage`. `pdf.worker.min.js` is the real worker; `pdf.worker.min.js.b64` is the fallback the
viewer decodes on hosts that will not serve the raw file.
