import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AppEntry } from '@/features/work/AppEntry';
import { Icon } from '@/components/ui/Icon';
import { listedApplications } from '@/content';
import { useLanguage } from '@/app/hooks/useAppContext';
import { useDocumentMeta } from '@/app/hooks/useDocumentMeta';
import { caseDescription, caseTitle } from '@/seo/meta';

/**
 * One application's case study, deep-linkable.
 *
 * It renders the same entry component the chapter does, with its folds open — so the
 * design is the approved one and there is no second presentation of the same material to
 * keep in step. The previous and next links follow the chapter's own order.
 */
export default function CaseStudy() {
  const { id } = useParams<{ id: string }>();
  const { content, t, lang } = useLanguage();
  const apps = listedApplications(content);
  const index = apps.findIndex((app) => app.id === id);
  const record = index >= 0 ? apps[index] : undefined;

  useDocumentMeta({
    title: record ? caseTitle(record, content) : `${t.caseNotFound} · ${content.meta.name}`,
    description: record ? caseDescription(record) : t.caseNotFoundBody,
    path: record ? `/work/${record.id}` : '/work',
    lang,
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  if (!record) {
    return (
      <section className="container case-page">
        <div className="case-page__missing">
          <h1 className="display">{t.caseNotFound}</h1>
          <p>{t.caseNotFoundBody}</p>
          <Link className="btn" to="/#work">
            <Icon name="back" flip />
            {t.backToWork}
          </Link>
        </div>
      </section>
    );
  }

  const previous = index > 0 ? apps[index - 1] : undefined;
  const next = index < apps.length - 1 ? apps[index + 1] : undefined;

  return (
    <section className="container case-page">
      <Link className="case-page__crumb" to="/#work">
        <Icon name="back" flip />
        <span>{t.backToWork}</span>
      </Link>

      <ol className="case-page__list">
        <li>
          <AppEntry record={record} position={index + 1} standalone />
        </li>
      </ol>

      <nav className="case-page__nav" aria-label={t.inChapter}>
        {previous ? (
          <Link className="btn" to={`/work/${previous.id}`}>
            <Icon name="prev" flip />
            {previous.name}
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link className="btn" to={`/work/${next.id}`}>
            {next.name}
            <Icon name="next" flip />
          </Link>
        )}
      </nav>
    </section>
  );
}
