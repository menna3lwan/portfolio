import type { CSSProperties } from 'react';
import { useCountUp } from '@/app/hooks/useCountUp';

export interface Stat {
  readonly label: string;
  readonly value: string;
}

function StatCell({ label, value, index }: Stat & { index: number }) {
  const [ref, shown] = useCountUp<HTMLElement>(value);
  return (
    <div className="stat" style={{ '--n': Math.min(index, 9) } as CSSProperties}>
      <dt className="stat__label">{label}</dt>
      <dd ref={ref as React.RefObject<HTMLElement>} className="stat__num display">
        {shown}
      </dd>
    </div>
  );
}

/**
 * By the numbers.
 *
 * Every figure here counts something the content documents — layers, highlights, stack
 * entries, decisions, challenges — and is labelled as the thing it counts. Nothing is
 * estimated and nothing is a metric about outcomes.
 */
export function StatGrid({ stats }: { stats: readonly Stat[] }) {
  if (stats.length === 0) return null;
  return (
    <dl className="stat-grid">
      {stats.map((stat, i) => (
        <StatCell key={stat.label} label={stat.label} value={stat.value} index={i} />
      ))}
    </dl>
  );
}
