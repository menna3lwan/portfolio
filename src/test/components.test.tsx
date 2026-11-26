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
import ExperienceDetail from '@/routes/ExperienceDetail';
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
              <Route path="experience/:id" element={<ExperienceDetail />} />
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

  it('keeps a run of Latin words together inside Arabic text', () => {
    expect(splitUnits('Cellula Technologies', 'ar').parts).toEqual(['Cellula Technologies']);
    expect(splitUnits('XPER — نظام ERP', 'ar').parts).toEqual(['XPER', '—', 'نظام', 'ERP']);
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
    const contact = screen.getByRole('region', { name: 'Contact' });
    expect(within(contact).getByText('menna3lwan@gmail.com')).toBeInTheDocument();
  });

  it('renders in Arabic with the same five works', () => {
    const { container } = site('/', 'ar');
    expect(container.querySelectorAll('.item')).toHaveLength(5);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('مطوّرة');
  });
});

describe('experience and about', () => {
  it('previews every role as a link to its own detail page, with a two-line summary', () => {
    site('/');
    const xp = screen.getByRole('region', { name: 'Experience' });
    const items = siteCopy('en').experience.items;
    const links = within(xp).getAllByRole('link');
    for (const item of items) {
      const link = links.find((a) => a.getAttribute('href') === `/experience/${item.id}`);
      expect(link, item.id).toBeDefined();
      expect(link).toHaveAccessibleName(new RegExp(item.org.split(' ')[0] ?? item.org));
      // The two-line summary is shown on the preview, the full points are not.
      expect(link).toHaveTextContent(item.summary);
      expect(link).not.toHaveTextContent(item.points[0] ?? '§none');
    }
  });

  it('keeps Elevate in the words the CV uses, and links its works', () => {
    site('/');
    const elevate = siteCopy('en').experience.items.find((i) => i.org === 'Elevate')!;
    expect(elevate.role).toBe('Advanced Flutter Development Intern');
    expect(elevate.type).toBe('Internship / training program');
    expect(elevate.when).toBe('Jun 2026 – Present');
    expect(elevate.works).toEqual(['flower-app', 'tracking-app']);
  });

  it('keeps the earlier roles the CV leaves out, in their original words', () => {
    const orgs = siteCopy('en').experience.items.map((i) => i.org);
    expect(orgs).toEqual([
      'XPER — ERP',
      'Elevate',
      'NTI',
      'Dragons',
      'Cellula Technologies',
      'Hen Lehen',
      'Fuzetek',
      'Digital Egypt Pioneers Initiative (DEPI)',
      'Almentor',
      'Mindset',
    ]);
    const almentor = siteCopy('en').experience.items.find((i) => i.org === 'Almentor')!;
    expect([almentor.role, almentor.when, almentor.type]).toEqual(['Coding Instructor', 'Feb 2024 – Dec 2024', 'Teaching']);
  });

  it('has the same roles in Arabic', () => {
    expect(siteCopy('ar').experience.items.map((i) => i.when.length > 0)).toHaveLength(siteCopy('en').experience.items.length);
  });

  it('describes the XPER work with the ownership Menna confirmed', () => {
    const xper = siteCopy('en').experience.items.find((i) => i.id === 'xper')!;
    const all = xper.points.join(' ');
    // Built end to end: CRM, the offline engine, Flutter Web, token/session.
    expect(all).toMatch(/Flutter Web/);
    expect(all).toMatch(/token and session/i);
    expect(all).toMatch(/UUID/);
    expect(all).toMatch(/Sembast/);
    // Paymob and Firebase are a contribution, never claimed as sole work.
    expect(all).toMatch(/contributed to the Paymob/i);
    expect(all).not.toMatch(/Integrated the Paymob gateway end to end/i);
  });

  it('reads the About statement once to assistive technology', () => {
    site('/');
    const about = screen.getByRole('region', { name: 'About' });
    expect(within(about).getAllByText(siteCopy('en').about.statement)).toHaveLength(1);
    expect(within(about).getByText('Egypt')).toBeInTheDocument();
  });
});

describe('an experience detail page', () => {
  it.each(siteCopy('en').experience.items.map((i) => i.id))('renders %s with its full account', (id) => {
    const item = siteCopy('en').experience.items.find((i) => i.id === id)!;
    site(`/experience/${id}`);
    expect(screen.getByRole('heading', { level: 1 })).toHaveAccessibleName(new RegExp(item.org.split(' ')[0] ?? item.org));
    // The full points live here, not on the home preview.
    for (const point of item.points) expect(screen.getByText(point)).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: siteCopy('en').experience.what })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: siteCopy('en').ui.back })).toHaveAttribute('href', '/');
  });

  it('shows the not-found view for an unknown id', () => {
    site('/experience/nope');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(siteCopy('en').ui.notFound);
  });
});

describe('the menu', () => {
  it('opens as a dialog, lists the sections, and closes on Escape', async () => {
    site('/');
    const button = screen.getByRole('button', { name: siteCopy('en').nav.openMenu });
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('dialog')).toBeNull();
    await userEvent.click(button);
    const dialog = screen.getByRole('dialog', { name: siteCopy('en').nav.label });
    const names = within(dialog).getAllByRole('link').map((a) => a.getAttribute('href'));
    expect(names.slice(0, 5)).toEqual(['/#works', '/#skills', '/#experience', '/#about', '/#contact']);
    await userEvent.keyboard('{Escape}');
    expect(screen.getByRole('button', { name: siteCopy('en').nav.openMenu })).toHaveAttribute('aria-expanded', 'false');
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
