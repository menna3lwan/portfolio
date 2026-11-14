import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig(() => ({
  // Path routing needs absolute asset URLs: a relative "./assets/app.js" would resolve
  // against /work/flower-app/ and 404. The hash build keeps relative URLs so it can run
  // from any directory, including straight off disk.
  base: process.env.VITE_ROUTER === 'hash' ? './' : '/',
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
