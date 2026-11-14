import type { Status } from '@/content/types';

/** `ok` reads as live and carries the dot; anything else is a dashed outline. */
const toneClass = (tone?: string) => (tone === 'ok' ? 'badge--live' : 'badge--outline');

export function StatusBadge({ status }: { status: Status }) {
  return <span className={`badge ${toneClass(status.tone)}`}>{status.text}</span>;
}

export function ClassificationBadge({ label }: { label: string }) {
  return <span className="badge badge--class">{label}</span>;
}

export function OutlineBadge({ label }: { label: string }) {
  return <span className="badge badge--outline">{label}</span>;
}
