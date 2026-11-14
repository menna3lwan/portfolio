import { Link } from 'react-router-dom';
import type { AppRecord } from '@/content/types';
import { Reveal } from '@/components/ui/Reveal';
import { Disclosure } from '@/components/ui/Disclosure';
import { StatGrid } from '@/components/ui/StatGrid';
import { ChipList, LabelledBlock, TickList, WinList } from '@/components/ui/lists';
import { ClassificationBadge, StatusBadge } from '@/components/ui/Badge';
import { Icon } from '@/components/ui/Icon';
import { ScreenPreview } from '@/features/preview/ScreenPreview';
import { useLanguage } from '@/app/hooks/useAppContext';
import { ScopeBody } from './scope';
import { useAppEntry } from './useAppEntry';

export interface AppEntryProps {
  record: AppRecord;
  /** One-based position in the chapter; drawn as the entry's number. */
  position: number;
  /** On the case-study route the entry is the whole page: the folds open and the title
   *  stops linking to itself. */
  standalone?: boolean;
}

/**
 * One application, in the repeated entry scaffold: head, badges, summary, the device
 * preview, by-the-numbers, key wins, the case-study folds, the stack and the links.
 */
export function AppEntry({ record: input, position, standalone = false }: AppEntryProps) {
  const { t } = useLanguage();
  const entry = useAppEntry(input);
  const { record } = entry;

  const heading = (
    <>
      <span className="no">{String(position).padStart(2, '0')}</span>
      {record.name}
    </>
  );

  return (
    <article className="card exp">
      <header className="exp__head">
        <div className="exp__heading">
          <h3 className="exp__company display">
            {standalone ? (
              heading
            ) : (
              <Link to={`/work/${record.id}`} aria-label={`${record.name} — ${t.readCase}`}>
                {heading}
              </Link>
            )}
          </h3>
          {entry.meta.length > 0 && (
            <p className="exp__meta mono">
              {entry.meta.map((part) => (
                <span key={part}>{part}</span>
              ))}
            </p>
          )}
        </div>
        {(entry.classification || entry.status) && (
          <div className="exp__badges">
            {entry.classification && <ClassificationBadge label={t.freelance} />}
            {entry.status && <StatusBadge status={entry.status} />}
          </div>
        )}
      </header>

      <p className="exp__summary">{record.summary}</p>

      <ScreenPreview shots={entry.shots} name={record.name} eager={standalone} />

      {entry.stats.length > 0 && (
        <LabelledBlock label={t.numbers}>
          <StatGrid stats={entry.stats} />
        </LabelledBlock>
      )}

      {entry.highlights.length > 0 && (
        <LabelledBlock label={t.wins}>
          <WinList items={entry.highlights} />
        </LabelledBlock>
      )}

      <Disclosure title={t.dScope} count={entry.scopeCount} defaultOpen={standalone}>
        {entry.scope.length > 0 ? <ScopeBody groups={entry.scope} /> : null}
      </Disclosure>

      <Disclosure title={t.dArch} count={entry.layers.length} defaultOpen={standalone}>
        {entry.layers.length > 0 || entry.decisions.length > 0 ? (
          <>
            {entry.layers.map((layer) => (
              <div key={layer.name} className="layer">
                <b>{layer.name}</b>
                <ul>
                  {(layer.items ?? []).map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
            {entry.decisions.length > 0 && (
              <LabelledBlock label={t.sDecisions}>
                <TickList items={entry.decisions} />
              </LabelledBlock>
            )}
          </>
        ) : null}
      </Disclosure>

      <Disclosure title={t.dChal} count={entry.challenges.length} defaultOpen={standalone}>
        {entry.challenges.length > 0
          ? entry.challenges.map((challenge) => (
              <div key={challenge.title} className="chal">
                <b>{challenge.title}</b>
                {challenge.problem && <p>{challenge.problem}</p>}
                {challenge.outcome && <p className="out">{challenge.outcome}</p>}
              </div>
            ))
          : null}
      </Disclosure>

      <Disclosure title={t.dQuality} count={entry.qualityItems.length} defaultOpen={standalone}>
        {entry.qualityItems.length > 0 ? <TickList items={entry.qualityItems} /> : null}
      </Disclosure>

      {entry.stack.length > 0 && (
        <LabelledBlock label={t.stack}>
          <ChipList items={entry.stack} />
        </LabelledBlock>
      )}

      {entry.links.length > 0 && (
        <div className="exp__links">
          {entry.links.map(([label, href]) => (
            <a key={href} className="btn" href={href} target="_blank" rel="noopener noreferrer">
              {label}
              <Icon name="out" />
            </a>
          ))}
        </div>
      )}
    </article>
  );
}

/** The same entry as a list item inside a chapter. */
export function AppEntryItem({ record, position }: { record: AppRecord; position: number }) {
  return (
    <Reveal as="li" className="exp-list__item" index={Math.min(position - 1, 4)}>
      <AppEntry record={record} position={position} />
    </Reveal>
  );
}
