import type { CSSProperties, ReactElement } from 'react';
import type { ScopeEntry, ScopeGroup, ScopeStatus } from '@/content/types';
import { useLanguage } from '@/app/hooks/useAppContext';

/* The status vocabulary carries the distinctions the content was written to preserve —
   what shipped, what the team built, what runs on mock data, what is only planned — so
   each one is shown rather than flattened into an undifferentiated list. */
const MARKS: Readonly<Record<ScopeStatus, ReactElement>> = {
  done: (
    <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 8.5l3.2 3.2L13 5" />
    </svg>
  ),
  team: (
    <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="6" r="2.4" />
      <path d="M1.8 13.2a4.4 4.4 0 018.4 0" />
      <path d="M11 4.2a2.2 2.2 0 010 4.1M12.4 13.2a4 4 0 00-1.1-2.6" />
    </svg>
  ),
  mock: (
    <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round">
      <rect x="2.2" y="3.2" width="11.6" height="9.6" rx="1.6" strokeDasharray="2.6 2" />
      <path d="M5.4 7.6h5.2M5.4 10h3" />
    </svg>
  ),
  planned: (
    <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round">
      <circle cx="8" cy="8" r="5.6" strokeDasharray="2.4 2.2" />
    </svg>
  ),
  partial: (
    <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" strokeWidth={1.7}>
      <circle cx="8" cy="8" r="5.6" />
      <path d="M8 2.4a5.6 5.6 0 010 11.2z" fill="currentColor" stroke="none" />
    </svg>
  ),
};

const TAG_KEY = {
  team: 'tag_team',
  mock: 'tag_mock',
  planned: 'tag_planned',
  partial: 'tag_partial',
} as const;

function readEntry(entry: ScopeEntry): { text: string; status: ScopeStatus } {
  if (Array.isArray(entry)) {
    const status = entry[1];
    return { text: entry[0], status: status && status in MARKS ? status : 'done' };
  }
  return { text: typeof entry === 'string' ? entry : '', status: 'done' };
}

function ScopeItem({ entry, index }: { entry: ScopeEntry; index: number }) {
  const { t } = useLanguage();
  const { text, status } = readEntry(entry);
  return (
    <li className={`scope__item scope__item--${status}`} style={{ '--n': Math.min(index, 9) } as CSSProperties}>
      <span className="scope__mark" aria-hidden="true">
        {MARKS[status]}
      </span>
      <span className="scope__text">{text}</span>
      {status !== 'done' && <span className="scope__tag">{t[TAG_KEY[status]]}</span>}
    </li>
  );
}

/** Scope, grouped and honest about status. */
export function ScopeBody({ groups }: { groups: readonly ScopeGroup[] }) {
  if (groups.length === 0) return null;
  return (
    <>
      {groups.map((group, g) => (
        <div key={group.title ?? group.label ?? group.name ?? g} className="layer scope__group">
          <b>{group.title ?? group.label ?? group.name ?? ''}</b>
          <ul className="scope__list">
            {(group.items ?? []).map((entry, i) => (
              <ScopeItem key={`${g}-${i}`} entry={entry} index={i} />
            ))}
          </ul>
        </div>
      ))}
    </>
  );
}
