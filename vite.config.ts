import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

/* The deployment's root path.

   An origin deploy (a custom domain, Netlify, Vercel) serves the site from "/". GitHub
   Pages serves a project site from the repository's subpath instead —
   https://menna3lwan.github.io/portfolio/ — and every absolute asset URL has to carry it,
   so the build takes it from VITE_BASE rather than hard-coding either shape. The value is
   normalised to a leading and trailing slash, which is what Vite and React Router expect. */
const pathBase = (() => {
  const raw = (process.env.VITE_BASE ?? '/').trim() || '/';
  const withLead = raw.startsWith('/') ? raw : `/${raw}`;
  return withLead.endsWith('/') ? withLead : `${withLead}/`;
})();

export default defineConfig(() => ({
  // Path routing needs absolute asset URLs: a relative "./assets/app.js" would resolve
  // against /work/flower-app/ and 404. The hash build keeps relative URLs so it can run
  // from any directory, including straight off disk.
  base: process.env.VITE_ROUTER === 'hash' ? './' : pathBase,
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    target: 'es2020',
    cssCodeSplit: false,
    // Never inline a font. A data: URI font cannot be cached on its own, it inflates the
    // render-blocking stylesheet by a third, and it would force the page's CSP to allow
    // `data:` in font-src — three costs for no benefit.
    assetsInlineLimit: (filePath: string) => !filePath.endsWith('.woff2'),
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          motion: ['framer-motion'],
        },
      },
    },
  },
  server: { port: 5181, strictPort: false },
  preview: { port: 4181, strictPort: false },
}));
