import type { ReactNode } from 'react';
import { Icon } from './Icon';
import { useLanguage } from '@/app/hooks/useAppContext';

export interface DisclosureProps {
  title: string;
  /** How many items the body holds; shown beside the title, never estimated. */
  count: number;
  children?: ReactNode;
  /** Open on first render — the case-study route uses this. */
  defaultOpen?: boolean;
}

/**
 * A fold. Built on `<details>`, so it works before hydration, is keyboard-operable for
 * free, and — critically — its contents stay in the accessibility tree and in the DOM,
 * which is what lets find-in-page and the QA sweeps reach closed case studies.
 */
export function Disclosure({ title, count, children, defaultOpen = false }: DisclosureProps) {
  const { t } = useLanguage();
  if (!children) return null;

  return (
    <details className="disclosure" open={defaultOpen}>
      <summary>
        <span className="disclosure__icon">
          <Icon name="plus" />
        </span>
        <span className="disclosure__title">{title}</span>
        <span className="disclosure__count">{t.items(count)}</span>
      </summary>
      <div className="disclosure__body">{children}</div>
    </details>
  );
}
