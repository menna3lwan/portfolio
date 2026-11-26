# Deployment

The build is ready to deploy. It has **not** been deployed: that needs a hosting account
and a domain decision, neither of which exist yet. What is outstanding is listed at the
bottom.

---

## Which platform

All three candidates host this build correctly — it is a static bundle with one rewrite
rule — so the choice comes down to what each one costs and where it serves from.

| | Cloudflare Pages | Netlify | Vercel |
|---|---|---|---|
| Free bandwidth | **unlimited** | 100 GB / month | 100 GB / month |
| Free builds | 500 / month | 300 build-minutes / month | generous, soft-limited |
| Edge presence in Egypt | **yes, Cairo** | nearest POP is in Europe | nearest POP is in Europe |
| Custom domain + TLS | free | free | free |
| Config already in the repo | `public/_headers`, `public/_redirects` | `netlify.toml` | `vercel.json` |
| Terms | no use restriction | no use restriction | Hobby plan is **non-commercial only** |

**Recommended: Cloudflare Pages.**

- Most of the audience for this site is in Egypt, and Cloudflare is the only one of the
  three with an edge location there. For a portfolio, first-visit latency to a recruiter
  opening a link is the metric that actually matters.
- Unlimited bandwidth means a post that does well never produces a bill or a throttle.
- Vercel's Hobby plan forbids commercial use. A personal portfolio is fine today, but it
  becomes ambiguous the moment freelance services are advertised on it — and freelancing
  is already part of the professional history the site describes.

**Netlify** is the easiest to drive by hand and a good second choice; its config is
committed too, so switching is a matter of pointing it at the repository.

---

## Setting it up on Cloudflare Pages

1. Push the repository to GitHub (see the open items below).
2. Cloudflare dashboard → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**,
   and pick the repository.
3. Build settings:
   - Framework preset: **Vite**
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Node version: **20** or newer
4. **Settings → Environment variables**, for both Production and Preview:

   ```
   VITE_SITE_URL = https://<the final domain>
   ```

   This is the one value that must be right. Canonical URLs, `og:url`, the social-card
   URL and `sitemap.xml` are all built from it. Without it the build still succeeds, and
   deliberately omits those tags rather than pointing them at a guessed address.
5. Deploy. Then **Custom domains** → add the domain and follow the DNS instructions.
6. Re-deploy after setting the domain, so the canonical URLs and sitemap are generated
   against the final address rather than the `*.pages.dev` one.

### Netlify

`netlify.toml` already carries the build command, the publish directory, the rewrite and
the headers. Add `VITE_SITE_URL` under **Site settings → Environment variables**.

### Vercel

`vercel.json` already carries the build, the rewrite and the headers. Add `VITE_SITE_URL`
under **Settings → Environment Variables**.

---

## After the first deploy

Check, in this order:

1. `/`, one case study (`/work/flower-app`), and `/cv` all load **and survive a reload** —
   that is what proves the rewrite is working.
2. `/robots.txt` names the sitemap, and `/sitemap.xml` lists 11 URLs on the real domain.
3. View source on a case study: `<title>`, `<meta name="description">`, `canonical` and
   `og:*` are that route's, not the home page's.
4. Paste a case-study URL into a LinkedIn or Slack message box and confirm the card shows
   the right title and the social image.
5. The CV page reaches the document and pages through it. If it does not, the host is
   refusing `pdf.worker.min.js`; the viewer's base64 fallback should take over, and the
   browser console will say which path it took.
6. Switch to Arabic and confirm the layout flips to RTL and stays flipped after a reload.
7. Submit the sitemap in Google Search Console.

---

## How routing works, and why

The deployed build uses **real paths**, not hash fragments: `/work/flower-app` is a URL a
search engine can index, a sitemap can list and a canonical tag can point at. A hash
route is none of those things.

Three mechanisms keep that working on a static host:

1. **Every known route is a real document.** `npm run build` writes
   `dist/work/<id>/index.html` and `dist/cv/index.html`, each with its own `<head>`. Most
   hosts serve those without any configuration at all.
2. **A rewrite catches everything else**, so an unknown path still reaches the
   application rather than the host's own 404.
3. **`404.html` is the fallback** for a host that can do neither. It carries a one-line
   script that restores the requested path before the application boots.

`npm run build:preview` produces a hash-routed build instead, for a host that cannot
rewrite at all, or for opening the build straight off disk. It is not the deployable
artefact: it has no per-route documents and no sitemap.

---

## Still needed, and from whom

| | |
|---|---|
| **The domain** | No domain has been chosen, and none was invented. Until `VITE_SITE_URL` is set, canonical tags, `og:url`, the social-card URL and `sitemap.xml` are omitted. A platform subdomain (`*.pages.dev`, `*.netlify.app`) works perfectly well if a custom domain is not wanted yet — but it only exists after the first deploy, so the first build will need a second one afterwards. |
| **A hosting account** | Cloudflare, Netlify or Vercel. Deploying needs the account itself; it cannot be done on someone's behalf. |
| **Where the repository should live** | The GitHub repository the project is synced from is `menna3lwan/Menna-s-Portfolio-`, which currently holds the Flutter project. The React project needs either its own repository, or a decision to replace the contents of that one. **Nothing has been pushed anywhere.** |
| **GitHub access** | The push has to come from a machine signed in to the account. The local repository is complete and ready; see the migration steps in the project's infrastructure note. |
