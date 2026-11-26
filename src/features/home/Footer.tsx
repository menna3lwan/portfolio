import { useLanguage } from '@/app/hooks/useAppContext';
import { loadMotion, scrollToTop } from '@/app/motion/runtime';
import { prefersReducedMotion } from '@/app/viewTransition';
import { ArrowUp } from '@/components/site/icons';

/**
 * The page's closing line. Until now the site ended on the contact links and then simply
 * stopped, leaving a tall band of empty ground with nothing to say the document had
 * finished — and no way back up from the bottom of a page this long.
 *
 * It says only what is already true elsewhere in the content: the name, the year, the
 * colophon line that ships in both languages, and a way back to the top. Nothing here is
 * new copy.
 */
export function Footer() {
  const { content } = useLanguage();
  const year = new Date().getFullYear();

  const toTop = () => {
    if (prefersReducedMotion()) {
      scrollToTop();
      return;
    }
    void loadMotion().then(({ lenis }) => {
      if (lenis) lenis.scrollTo(0, { duration: 1.1 });
      else window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  };

  return (
    <footer className="foot">
      <div className="foot__rule" aria-hidden="true" />
      <div className="foot__row">
        <div className="foot__id">
          <span className="foot__name">{content.meta.name}</span>
          <span className="foot__year">
            © <bdi>{year}</bdi>
          </span>
        </div>
        <p className="foot__built">{content.footer.built}</p>
        <button type="button" className="foot__top" onClick={toTop}>
          <span>{content.ui.top ?? 'Back to top'}</span>
          <span className="foot__top-icon" aria-hidden="true">
            <ArrowUp />
          </span>
        </button>
      </div>
    </footer>
  );
}
