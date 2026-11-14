import { Reveal } from '@/components/ui/Reveal';
import { Disclosure } from '@/components/ui/Disclosure';
import { StatGrid } from '@/components/ui/StatGrid';
import { LabelledBlock } from '@/components/ui/lists';
import { StatusBadge } from '@/components/ui/Badge';
import { Icon } from '@/components/ui/Icon';
import { useLanguage } from '@/app/hooks/useAppContext';

/** The open-source pull request, in the same scaffold as an application. */
export function OpenSourceEntry({ position }: { position: number }) {
  const { content, t } = useLanguage();
  const { pluto, team = [], label } = content.openSource;
  const x = content.ui.x ?? {};

  const sections = [
    { key: 'problem', heading: x.problem ?? t.problem, body: pluto.problem },
    { key: 'fix', heading: x.fix ?? t.fix, body: pluto.fix },
    { key: 'tests', heading: x.tests ?? t.tests, body: pluto.tests },
    { key: 'origin', heading: x.origin ?? t.origin, body: pluto.origin },
  ].filter((section) => Boolean(section.body));

  const fileCount = (pluto.size ?? '').split('·')[0]?.trim() || '—';

  return (
    <Reveal as="li" className="exp-list__item">
      <article className="card exp">
        <header className="exp__head">
          <div className="exp__heading">
            <h3 className="exp__company display">
              <span className="no">{String(position).padStart(2, '0')}</span>
              {pluto.name}
            </h3>
            <p className="exp__meta mono">
              <span>{pluto.repo}</span>
              <span>{pluto.pr}</span>
              {pluto.size && <span>{pluto.size}</span>}
            </p>
          </div>
          <div className="exp__badges">
            <StatusBadge status={pluto.status} />
          </div>
        </header>

        <p className="exp__summary">{pluto.title}</p>

        <LabelledBlock label={t.numbers}>
          <StatGrid stats={[{ label: t.sFiles, value: fileCount }]} />
        </LabelledBlock>

        <Disclosure title={t.dDetail} count={sections.length}>
          {sections.length > 0
            ? sections.map((section) => (
                <div key={section.key} className="chal">
                  <b>{section.heading}</b>
                  <p>{section.body}</p>
                </div>
              ))
            : null}
        </Disclosure>

        <Disclosure title={label ?? (x.team ?? 'Team')} count={team.length}>
          {team.length > 0
            ? team.map((member) => (
                <div key={member.name} className="chal">
                  <b>{member.name}</b>
                  <p>{member.what}</p>
                  {member.status && <p className="out">{member.status}</p>}
                </div>
              ))
            : null}
        </Disclosure>

        <div className="exp__links">
          <a className="btn" href={pluto.url} target="_blank" rel="noopener noreferrer">
            {pluto.repo} {pluto.pr}
            <Icon name="out" />
          </a>
        </div>
      </article>
    </Reveal>
  );
}
