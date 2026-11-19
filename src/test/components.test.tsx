import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { LanguageProvider } from '@/app/providers/LanguageProvider';
import { ThemeProvider } from '@/app/providers/ThemeProvider';
import { loadContent } from '@/content';
import { AppLayout } from '@/components/layout/AppLayout';
import { RollText, SplitText } from '@/components/site/SplitText';
import { splitUnits } from '@/components/site/split';
import Home from '@/routes/Home';
import CaseStudy from '@/routes/CaseStudy';
import { siteCopy, WORKS } from '@/content/site';

// The animation runtime is a browser concern; the tests check the finished page.
vi.mock('@/app/motion/runtime', () => ({
  loadMotion: () => new Promise(() => {}),
  useMotion: () => null,
  scrollToTop: () => {},
}));

await loadContent('ar');

const site = (path: string, lang: 'en' | 'ar' = 'en'): ReturnType<typeof render> => {
  try {
    window.localStorage.setItem('lang', lang);
    window.sessionStorage.setItem('site-visited', '1');
  } catch {
    /* blocked store */
  }
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  const ui: ReactElement = (
    <LanguageProvider>
      <ThemeProvider>
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route element={<AppLayout />}>
              <Route index element={<Home />} />
              <Route path="work/:id" element={<CaseStudy />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </ThemeProvider>
    </LanguageProvider>
  );
  return render(ui);
};

describe('SplitText', () => {
  it('splits Latin into characters, as the reference does', () => {
    expect(splitUnits('Hen Lehen', 'en')).toEqual({ unit: 'char', parts: [...'Hen Lehen'] });
  });

  it('splits Arabic into words, so letters keep their joining', () => {
    expect(splitUnits('هُنَّ لَهُنَّ', 'ar')).toEqual({ unit: 'word', parts: ['هُنَّ', 'لَهُنَّ'] });
    // Arabic text is detected even on an English page
    expect(splitUnits('مطوّرة برمجيات', 'en').unit).toBe('word');
  });

  it('renders every character of the original text', () => {
    const { container } = render(
      <p>
        <SplitText text="Software" lang="en" />
      </p>,
    );
    expect(container.textContent).toBe('Software');
    expect(container.querySelectorAll('.char')).toHaveLength(8);
  });
});

describe('SplitText word boxes', () => {
  it('keeps each Latin word in one unbreakable box, in left-to-right order', () => {
    const { container } = render(
      <p>
        <SplitText text="Hen Lehen" lang="en" />
      </p>,
    );
    // Split by character, but a line can only break between words.
    const words = [...container.querySelectorAll('.w')].map((w) => w.textContent);
    expect(words).toEqual(['Hen', 'Lehen']);
    expect(container.querySelector('[dir="ltr"]')).not.toBeNull();
  });

  it('numbers characters across words for the staggered roll', () => {
    const { container } = render(
      <p>
        <SplitText text="ab cd" lang="en" />
      </p>,
    );
    const order = [...container.querySelectorAll<HTMLElement>('.char')].map((c) => c.style.getPropertyValue('--i'));
    expect(order).toEqual(['0', '1', '2', '3']);
  });
});

describe('RollText', () => {
  it('gives assistive technology the label once, and hides the rolling copy', () => {
    render(
      <a href="/cv">
        <RollText text="Get in touch" lang="en" />
      </a>,
    );
    expect(screen.getByRole('link', { name: 'Get in touch' })).toBeInTheDocument();
    expect(document.querySelector('.roll')).toHaveAttribute('aria-hidden', 'true');
  });
});

describe('the home page', () => {
  it('has one h1 that names her and her positioning', () => {
    site('/');
    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1).toHaveTextContent('Menna Elwan');
    expect(h1).toHaveTextContent('Software Developer');
    expect(h1).toHaveTextContent('Flutter');
  });

  it('lists the five selected works, each linking to its page', () => {
    site('/');
    const works = screen.getByRole('region', { name: siteCopy('en').ui.selected });
    for (const work of WORKS) {
      const links = within(works).getAllByRole('link', { name: new RegExp(work.en.title) });
      expect(links.some((a) => a.getAttribute('href') === `/work/${work.id}`)).toBe(true);
    }
    expect(within(works).getAllByRole('link', { name: /^View project/ })).toHaveLength(5);
  });

  it('makes the hovered entry the active one', async () => {
    const { container } = site('/');
    const entries = container.querySelectorAll<HTMLElement>('.item');
    expect(entries[0]).toHaveClass('is-active');
    await userEvent.hover(entries[2]!);
    expect(entries[2]).toHaveClass('is-active');
    expect(entries[0]).not.toHaveClass('is-active');
    expect(container.querySelector('.counter__num')).toHaveTextContent('03');
  });

  it('offers the skills to assistive technology as text', () => {
    site('/');
    const skills = screen.getByRole('region', { name: siteCopy('en').ui.skills });
    for (const s of siteCopy('en').skills) expect(skills).toHaveTextContent(s.word);
  });

  it('links the CV to its own page and shows the address as text', () => {
    site('/');
    const cvLinks = screen.getAllByRole('link').filter((a) => a.getAttribute('href') === '/cv');
    expect(cvLinks.length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('menna3lwan@gmail.com')).toBeInTheDocument();
  });

  it('renders in Arabic with the same five works', () => {
    const { container } = site('/', 'ar');
    expect(container.querySelectorAll('.item')).toHaveLength(5);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('مطوّرة');
  });
});

describe('a project page', () => {
  it.each(WORKS.map((w) => w.id))('renders %s with every section', (id) => {
    const work = WORKS.find((w) => w.id === id)!;
    site(`/work/${id}`);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(work.en.title);
    const ui = siteCopy('en').ui;
    for (const label of [ui.about, ui.role, ui.challenge, ui.architecture, ui.built, ui.type, ui.stack]) {
      expect(screen.getByRole('heading', { level: 2, name: label })).toBeInTheDocument();
    }
    expect(screen.getByRole('link', { name: ui.back })).toHaveAttribute('href', '/');
  });

  it('says so when the project does not exist', () => {
    site('/work/nope');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(siteCopy('en').ui.notFound);
  });
});
