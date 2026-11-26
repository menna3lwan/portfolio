import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Loader } from '@/components/site/Loader';
import { SiteContext } from '@/components/site/site-context';
import type { SiteContextValue } from '@/components/site/site-context';
import { AIN_PATH, M_PATH } from '@/components/site/logoPaths';

vi.mock('@/app/motion/runtime', () => ({
  loadMotion: () => new Promise(() => {}),
  useMotion: () => null,
  scrollToTop: () => {},
}));

const site = (finishIntro = vi.fn()): SiteContextValue => ({
  introDone: false,
  finishIntro,
  active: 0,
  setActive: () => {},
  go: () => {},
});

const mount = (path: string, value: SiteContextValue) =>
  render(
    <SiteContext.Provider value={value}>
      <MemoryRouter initialEntries={[path]}>
        <Loader label="Loading" />
      </MemoryRouter>
    </SiteContext.Provider>,
  );

describe('the logo splash', () => {
  it('builds the logo from two vector letters, made apart and then assembled', () => {
    window.sessionStorage.removeItem('site-visited');
    const { container } = mount('/', site());
    expect(container.querySelector('.loader')).toHaveAttribute('aria-hidden', 'true');
    // No raster anywhere: the letters are paths.
    expect(container.querySelectorAll('.loader image, .loader img')).toHaveLength(0);
    const m = container.querySelector('.splash__m');
    const ain = container.querySelector('.splash__ain');
    expect(m?.querySelector('.splash__m-fill')?.getAttribute('d')).toBe(M_PATH);
    expect(m?.querySelector('.splash__m-outline')).not.toBeNull();
    expect(ain?.querySelector('.splash__ain-shape')).toHaveAttribute('mask', 'url(#splash-pen)');
    expect(ain?.querySelector('.splash__ain-shape path')?.getAttribute('d')).toBe(AIN_PATH);
    expect(container.querySelectorAll('mask .splash__pen')).toHaveLength(2);
    // The Ain is drawn over the M, as in the artwork.
    expect(m!.compareDocumentPosition(ain!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('does not show once seen this session, and releases the hero at once', () => {
    window.sessionStorage.setItem('site-visited', '1');
    const finishIntro = vi.fn();
    const { container } = mount('/', site(finishIntro));
    expect(container.querySelector('.loader')).toBeNull();
    expect(finishIntro).toHaveBeenCalled();
  });

  it('does not show under reduced motion', () => {
    window.sessionStorage.removeItem('site-visited');
    const original = window.matchMedia;
    window.matchMedia = ((query: string) => ({ ...original(query), matches: query.includes('reduce') })) as typeof window.matchMedia;
    const { container } = mount('/', site());
    expect(container.querySelector('.loader')).toBeNull();
    window.matchMedia = original;
  });

  it('only opens the home page', () => {
    window.sessionStorage.removeItem('site-visited');
    const { container } = mount('/work/hen-lehen', site());
    expect(container.querySelector('.loader')).toBeNull();
  });
});
