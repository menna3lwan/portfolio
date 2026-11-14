import { Reveal } from '@/components/ui/Reveal';
import { AppEntryItem } from './AppEntry';
import { OpenSourceEntry } from './OpenSourceEntry';
import { listedApplications } from '@/content';
import { useLanguage } from '@/app/hooks/useAppContext';

/**
 * Chapter 02 — what I have built.
 *
 * The census in the kicker is counted at render from the content itself, so adding or
 * removing an application corrects the number and the entry numbering together; neither
 * is typed in anywhere.
 */
export function WorkSection() {
  const { content, t, lang } = useLanguage();
  const apps = listedApplications(content);
  const flows = content.architecture.flows.length;

  const kicker =
    lang === 'ar'
      ? `${apps.length} تطبيقات · ${flows} بنى معمارية · مساهمة مفتوحة المصدر واحدة`
      : `${apps.length} applications · ${flows} documented architectures · 1 open-source contribution`;

  return (
    <section className="section" id="work" aria-labelledby="work-h">
      <div className="container">
        <Reveal as="header" className="section-head">
          <span className="eyebrow">{t.workEyebrow}</span>
          <Reveal as="h2" variant="wipe" className="section-head__title display" id="work-h">
            <span>
              {t.workTitle[0]} <span className="accent">{t.workTitle[1]}</span>
            </span>
          </Reveal>
          <p className="section-head__kicker">{kicker}</p>
        </Reveal>

        <ol className="exp-list">
          {apps.map((app, i) => (
            <AppEntryItem key={app.id} record={app} position={i + 1} />
          ))}
          <OpenSourceEntry position={apps.length + 1} />
        </ol>
      </div>
    </section>
  );
}
