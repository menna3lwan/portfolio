/* =============================================================================
   Writes public/cv-viewer/vendor/pdfjs/pdf.worker.min.js from its base64 source.

   The worker is vendored as base64 because its minified bytes include ESC and other
   control characters, which some static hosts and publishing pipelines refuse to serve.
   The viewer can decode it at runtime, but that path depends on a HEAD probe for the raw
   file — and a host that answers that probe while failing the real request leaves the CV
   page unable to open at all. Decoding at build time makes the ordinary path work
   everywhere; the runtime fallback stays for hosts that reject the file outright.

   The decoded file is git-ignored: one source of truth, no 1.3 MB duplicate in history.
   ========================================================================== */
import { readFileSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const dir = join(here, '..', 'public', 'cv-viewer', 'vendor', 'pdfjs');
const source = join(dir, 'pdf.worker.min.js.b64');
const target = join(dir, 'pdf.worker.min.js');

if (!existsSync(source)) {
  console.error(`[pdf-worker] missing ${source} — the CV viewer cannot work without it`);
  process.exit(1);
}

if (existsSync(target) && statSync(target).mtimeMs >= statSync(source).mtimeMs) {
  process.exit(0); // already current
}

const bytes = Buffer.from(readFileSync(source, 'utf8').replace(/\s+/g, ''), 'base64');
if (bytes.length < 100_000) {
  console.error(`[pdf-worker] decoded only ${bytes.length} bytes — the source looks truncated`);
  process.exit(1);
}
writeFileSync(target, bytes);
console.log(`[pdf-worker] wrote ${(bytes.length / 1024).toFixed(0)} kB to pdf.worker.min.js`);
