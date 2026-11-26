import logoLight from '@/assets/logo.webp';
import logoDark from '@/assets/logo-dark.webp';
import { useTheme } from '@/app/hooks/useAppContext';

/**
 * The wordmark's glyph.
 *
 * It is an `<img>` rather than a CSS background so the two files are real build inputs —
 * hashed, preloadable and resolved by the bundler — instead of a url() that has to be
 * right relative to wherever the stylesheet happens to land.
 */
export function BrandMark({ className }: { className: string }) {
  const { resolved } = useTheme();
  return (
    <img
      className={className}
      src={resolved === 'dark' ? logoDark : logoLight}
      width={297}
      height={320}
      alt=""
      aria-hidden="true"
      decoding="async"
    />
  );
}
