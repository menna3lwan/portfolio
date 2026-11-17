import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { LanguageProvider } from '@/app/providers/LanguageProvider';
import { loadContent } from '@/content';
import { ThemeProvider } from '@/app/providers/ThemeProvider';
import { MarkedText } from '@/features/whoami/MarkedText';
import { ScreenPreview } from '@/features/preview/ScreenPreview';
import { Disclosure } from '@/components/ui/Disclosure';
import { ScopeBody } from '@/features/work/scope';
import { ExperienceSection } from '@/features/experience/ExperienceSection';
import { OpenSourceEntry } from '@/features/work/OpenSourceEntry';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { AppEntry } from '@/features/work/AppEntry';
import { listedApplications } from '@/content';
import EN from '@/content/content.en.json';
import { MemoryRouter } from 'react-router-dom';
import type { Shot } from '@/data/previews';

// the Arabic content is a separate chunk; load it before any Arabic case renders
await loadContent('ar');

const wrap = (ui: ReactElement, lang: 'en' | 'ar' = 'en') => {
  try {
    window.localStorage.setItem('lang', lang);
  } catch {
    /* blocked store */
  }
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  return render(
    <LanguageProvider>
      <ThemeProvider>{ui}</ThemeProvider>
    </LanguageProvider>,
  );
};

describe('MarkedText', () => {
  it('marks a known phrase and leaves the sentence otherwise intact', () => {
    const text = 'I studied Computer Science and Artificial Intelligence at Benha.';
    const { container } = wrap(<p>{<MarkedText text={text} />}</p>);
    expect(container.textContent).toBe(text);
    const marks = container.querySelectorAll('mark.hl');
    expect(marks).toHaveLength(1);
    expect(marks[0]).toHaveTextContent('Computer Science and Artificial Intelligence');
  });

  it('marks nothing when no phrase is present', () => {
    const { container } = wrap(<p>{<MarkedText text="An unrelated sentence." />}</p>);
    expect(container.querySelectorAll('mark.hl')).toHaveLength(0);
    expect(container.textContent).toBe('An unrelated sentence.');
  });

  it('never alters the wording it marks', () => {
    const text = 'where state lives and nothing else';
    const { container } = wrap(<p>{<MarkedText text={text} />}</p>);
    expect(container.textContent).toBe(text);
  });
});

describe('ScreenPreview', () => {
  const one: Shot[] = [{ file: 'img/cut/a.webp', width: 858, height: 1209, label: 'Home' }];
  const two: Shot[] = [
    ...one,
    { file: 'img/cut/b.webp', width: 900, height: 1000, label: 'Detail' },
  ];

  it('renders a single shot with no switcher', () => {
    const { container } = wrap(<ScreenPreview shots={one} name="Movie App" />);
    expect(container.querySelectorAll('.stage__shot')).toHaveLength(1);
    expect(container.querySelector('[role="tablist"]')).toBeNull();
  });

  it('takes the active shot’s own aspect ratio', () => {
    const { container } = wrap(<ScreenPreview shots={one} name="Movie App" />);
    const body = container.querySelector('.stage__body') as HTMLElement;
    expect(body.style.getPropertyValue('--ar')).toBe('858 / 1209');
  });

  it('renders a tablist when an application has more than one screen', () => {
    wrap(<ScreenPreview shots={two} name="Flowrist" />);
    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(2);
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
    expect(tabs[1]).toHaveAttribute('aria-selected', 'false');
  });

  it('switches the active screen and the frame ratio on click', async () => {
    const user = userEvent.setup();
    const { container } = wrap(<ScreenPreview shots={two} name="Flowrist" />);
    await user.click(screen.getAllByRole('tab')[1]!);
    const body = container.querySelector('.stage__body') as HTMLElement;
    expect(body.style.getPropertyValue('--ar')).toBe('900 / 1000');
    expect(container.querySelectorAll('.stage__shot.is-on')).toHaveLength(1);
    expect(screen.getAllByRole('tab')[1]).toHaveAttribute('aria-selected', 'true');
  });

  it('moves along the tablist with the arrow keys', async () => {
    const user = userEvent.setup();
    wrap(<ScreenPreview shots={two} name="Flowrist" />);
    const tabs = screen.getAllByRole('tab');
    tabs[0]!.focus();
    await user.keyboard('{ArrowRight}');
    expect(tabs[1]).toHaveAttribute('aria-selected', 'true');
    await user.keyboard('{ArrowLeft}');
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
  });

  it('reverses the arrow keys on an Arabic page', async () => {
    const user = userEvent.setup();
    wrap(<ScreenPreview shots={two} name="Flowrist" />, 'ar');
    const tabs = screen.getAllByRole('tab');
    tabs[0]!.focus();
    // right-arrow in RTL means "the previous one", so it wraps to the end
    await user.keyboard('{ArrowRight}');
    expect(tabs[1]).toHaveAttribute('aria-selected', 'true');
    await user.keyboard('{ArrowLeft}');
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
  });

  it('keeps exactly one screen described to assistive technology', () => {
    const { container } = wrap(<ScreenPreview shots={two} name="Flowrist" />);
    const shots = [...container.querySelectorAll('.stage__shot')];
    expect(shots.filter((s) => !s.hasAttribute('aria-hidden'))).toHaveLength(1);
  });
});

describe('Disclosure', () => {
  it('shows the item count and opens on click', async () => {
    const user = userEvent.setup();
    const { container } = wrap(
      <Disclosure title="Scope" count={3}>
        <p>Body copy</p>
      </Disclosure>,
    );
    const details = container.querySelector('details') as HTMLDetailsElement;
    expect(within(details).getByText('3 items')).toBeInTheDocument();
    expect(details.open).toBe(false);
    await user.click(within(details).getByText('Scope'));
    expect(details.open).toBe(true);
  });

  it('renders nothing when it has no body', () => {
    const { container } = wrap(<Disclosure title="Scope" count={0} />);
    expect(container.querySelector('details')).toBeNull();
  });

  it('can start open, which is what the case-study route needs', () => {
    const { container } = wrap(
      <Disclosure title="Scope" count={1} defaultOpen>
        <p>Body</p>
      </Disclosure>,
    );
    expect((container.querySelector('details') as HTMLDetailsElement).open).toBe(true);
  });
});

describe('ScopeBody', () => {
  it('tags everything except a completed item', () => {
    const { container } = wrap(
      <ScopeBody
        groups={[
          {
            title: 'Identity',
            items: [
              ['Shipped feature', 'done'],
              ['Built by the team', 'team'],
              ['Runs on mock data', 'mock'],
              ['Not built yet', 'planned'],
            ],
          },
        ]}
      />,
    );
    expect(container.querySelectorAll('.scope__item')).toHaveLength(4);
    const tags = [...container.querySelectorAll('.scope__tag')].map((t) => t.textContent);
    expect(tags).toEqual(['Team', 'Mock data', 'Planned']);
    expect(container.querySelector('.scope__item--done .scope__tag')).toBeNull();
  });

  it('treats a bare string as a completed item', () => {
    const { container } = wrap(<ScopeBody groups={[{ title: 'X', items: ['Plain line'] }]} />);
    expect(container.querySelector('.scope__item--done')).not.toBeNull();
  });
});

/**
 * The entry number is a graphic, not part of the name. Left in the accessible name it ran
 * straight into it — "01XPER ERP" — because the span is inline and carries no separator.
 */
describe('entry numbers', () => {
  it.each([
    ['the experience chapter', <ExperienceSection key="x" />],
    ['the open-source entry', <OpenSourceEntry key="o" position={10} />],
  ])('keeps the number out of the heading in %s', (_label, ui) => {
    const { container } = wrap(ui);
    const numbers = container.querySelectorAll('.no');
    expect(numbers.length).toBeGreaterThan(0);
    for (const n of numbers) expect(n).toHaveAttribute('aria-hidden', 'true');

    for (const heading of container.querySelectorAll('h3')) {
      const name = [...heading.childNodes]
        .filter((node) => !(node instanceof HTMLElement && node.getAttribute('aria-hidden')))
        .map((node) => node.textContent ?? '')
        .join('')
        .trim();
      expect(name).not.toMatch(/^\d{2}\S/);
      expect(name.length).toBeGreaterThan(0);
    }
  });
});

/**
 * A case study is a page about one project; in the chapter it is one entry among ten.
 * The heading level has to follow that, or the nine case-study routes have no <h1> and
 * their outline starts at level three — which is what they did.
 */
describe('the case-study heading level', () => {
  const render = (standalone: boolean) =>
    wrap(
      <MemoryRouter>
        <AppEntry record={listedApplications(EN as never)[0]!} position={1} standalone={standalone} />
      </MemoryRouter>,
    ).container;

  it('is an h1 on the case-study route', () => {
    const c = render(true);
    expect(c.querySelector('h1')).not.toBeNull();
    expect(c.querySelector('h1')).toHaveClass('exp__company');
    expect(c.querySelector('h3')).toBeNull();
  });

  it('is an h3 inside the chapter, under that chapter’s h2', () => {
    const c = render(false);
    expect(c.querySelector('h3')).not.toBeNull();
    expect(c.querySelector('h1')).toBeNull();
  });

  it('carries the same styling either way', () => {
    expect(render(true).querySelector('.exp__company')?.className).toBe(
      render(false).querySelector('.exp__company')?.className,
    );
  });
});

describe('SiteHeader', () => {
  it('gives the two navigation landmarks names of their own', () => {
    const { container } = wrap(
      <MemoryRouter>
        <SiteHeader />
      </MemoryRouter>,
    );
    const labels = [...container.querySelectorAll('nav')].map((n) => n.getAttribute('aria-label'));
    expect(labels).toHaveLength(2);
    expect(new Set(labels).size).toBe(2);
    // and neither of them is a section name borrowed from the links inside it
    expect(labels).not.toContain('Work');
  });
});
