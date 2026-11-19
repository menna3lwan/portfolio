import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Loader } from '@/components/site/Loader';
import { SiteContext } from '@/components/site/site-context';
import type { SiteContextValue } from '@/components/site/site-context';

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
  it('forms the logo from its own two layers on a first visit to the home page', () => {
    window.sessionStorage.removeItem('site-visited');
    const { container } = mount('/', site());
    const splash = container.querySelector('.loader');
    expect(splash).toHaveAttribute('aria-hidden', 'true');
    const images = [...container.querySelectorAll('image')].map((i) => i.getAttribute('class'));
    // four pieces of the M, the masked Ain, and the finished logo it gives way to
    expect(images).toEqual(['splash__piece', 'splash__piece', 'splash__piece', 'splash__piece', 'splash__ain', 'splash__final']);
    expect(container.querySelectorAll('mask .splash__stroke')).toHaveLength(2);
    expect(container.querySelector('.splash__ain')).toHaveAttribute('mask', 'url(#splash-ain)');
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
