import { Link } from 'react-router-dom';
import { Icon } from './Icon';
import type { SocialTarget } from './socialTargets';
import { useLanguage } from '@/app/hooks/useAppContext';
import { socialTargets } from './socialTargets';


/** The row of square social tiles. External addresses open in a new tab; the CV is a route. */
export function SocialLinks({
  targets,
  className = 'social social--md',
}: {
  targets: readonly SocialTarget[];
  className?: string;
}) {
  return (
    <div className={className}>
      {targets.map((target) =>
        target.internal ? (
          <Link key={target.label} className="social__link" to={target.href} aria-label={target.label}>
            <Icon name={target.icon} />
          </Link>
        ) : (
          <a
            key={target.label}
            className="social__link"
            href={target.href}
            aria-label={target.label}
            {...(target.href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
          >
            <Icon name={target.icon} />
          </a>
        ),
      )}
    </div>
  );
}

/** The hero's variant: the same tiles, plus a labelled CV action at the end of the row. */
export function HeroSocialLinks() {
  const { content, t } = useLanguage();
  const targets = socialTargets(content.meta, t.cv, false);
  return (
    <>
      {targets.map((target) => (
        <a
          key={target.label}
          className="social__link"
          href={target.href}
          aria-label={target.label}
          {...(target.href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        >
          <Icon name={target.icon} />
        </a>
      ))}
      <Link className="social__link social__link--cv" to="/cv">
        <Icon name="doc" />
        <span>{t.cv}</span>
      </Link>
    </>
  );
}
