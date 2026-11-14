import { Reveal } from '@/components/ui/Reveal';
import { ChipList, LabelledBlock, WinList } from '@/components/ui/lists';
import { OutlineBadge } from '@/components/ui/Badge';
import { useLanguage } from '@/app/hooks/useAppContext';
import type { ExperienceItem } from '@/content/types';

function RoleEntry({ item, position }: { item: ExperienceItem; position: number }) {
  const { t } = useLanguage();
  return (
    <Reveal as="li" className="exp-list__item" index={Math.min(position - 1, 4)}>
      <article className="card exp">
        <header className="exp__head">
          <div className="exp__heading">
            <h3 className="exp__company display">
              <span className="no">{String(position).padStart(2, '0')}</span>
              {item.org}
            </h3>
            <p className="exp__meta mono">
              <span>{item.role}</span>
              <span>{item.when}</span>
              {item.type && <span>{item.type}</span>}
            </p>
          </div>
        </header>
        {(item.points ?? []).length > 0 && (
          <LabelledBlock label={t.wins}>
            <WinList items={item.points ?? []} />
          </LabelledBlock>
        )}
        {(item.skills ?? []).length > 0 && (
          <LabelledBlock label={t.stack}>
            <ChipList items={item.skills ?? []} />
          </LabelledBlock>
        )}
      </article>
    </Reveal>
  );
}

/**
 * Chapter 03 — where I have worked.
 *
 * Roles, then the degree, then the skills wall that closes the chapter. XPER ERP belongs
 * here, as a role, and not among the project cards.
 */
export function ExperienceSection() {
  const { content, t, lang } = useLanguage();
  const { experience, education, skills } = content;

  const kicker =
    lang === 'ar'
      ? `${experience.items.length} أدوار · درجة في علوم الحاسب والذكاء الاصطناعي`
      : `${experience.items.length} roles · one Computer Science & AI degree`;

  return (
    <section className="section" id="experience" aria-labelledby="xp-h">
      <div className="container">
        <Reveal as="header" className="section-head">
          <span className="eyebrow">{t.xpEyebrow}</span>
          <Reveal as="h2" variant="wipe" className="section-head__title display" id="xp-h">
            <span>
              {t.xpTitle[0]} <span className="accent">{t.xpTitle[1]}</span>
            </span>
          </Reveal>
          <p className="section-head__kicker">{kicker}</p>
        </Reveal>

        <ol className="exp-list">
          {experience.items.map((item, i) => (
            <RoleEntry key={`${item.org}-${item.when}`} item={item} position={i + 1} />
          ))}

          <Reveal as="li" className="exp-list__item">
            <article className="card exp">
              <header className="exp__head">
                <div className="exp__heading">
                  <h3 className="exp__company display">
                    <span className="no">{String(experience.items.length + 1).padStart(2, '0')}</span>
                    {education.school}
                  </h3>
                  <p className="exp__meta mono">
                    <span>{education.degree}</span>
                    <span>{education.when}</span>
                  </p>
                </div>
                <div className="exp__badges">
                  <OutlineBadge label={education.label} />
                </div>
              </header>
              {(education.points ?? []).length > 0 && (
                <LabelledBlock label={t.wins}>
                  <WinList items={education.points ?? []} />
                </LabelledBlock>
              )}
            </article>
          </Reveal>

          <Reveal as="li" className="exp-list__item">
            <article className="card exp">
              <header className="exp__head">
                <div className="exp__heading">
                  <h3 className="exp__company display">{skills.title}</h3>
                  <p className="exp__meta mono">
                    <span>{skills.label}</span>
                    <span>{t.items(skills.groups.length)}</span>
                  </p>
                </div>
              </header>
              <div>
                {skills.groups.map((group) => (
                  <div key={group.label} className="layer">
                    <b>{group.label}</b>
                    <ChipList items={group.items.map((item) => item.skill)} />
                  </div>
                ))}
              </div>
            </article>
          </Reveal>
        </ol>
      </div>
    </section>
  );
}
