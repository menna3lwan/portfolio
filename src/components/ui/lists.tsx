import type { CSSProperties } from 'react';

/** The staggered index every animated list child carries. */
const n = (index: number): CSSProperties => ({ '--n': Math.min(index, 9) }) as CSSProperties;

export function TickList({ items }: { items: readonly string[] }) {
  if (items.length === 0) return null;
  return (
    <ul className="ticklist">
      {items.map((item, i) => (
        <li key={`${i}-${item.slice(0, 24)}`}>{item}</li>
      ))}
    </ul>
  );
}

export function WinList({ items }: { items: readonly string[] }) {
  if (items.length === 0) return null;
  return (
    <ul className="win-list">
      {items.map((item, i) => (
        <li key={`${i}-${item.slice(0, 24)}`} style={n(i)}>
          {item}
        </li>
      ))}
    </ul>
  );
}

export function ChipList({ items }: { items: readonly string[] }) {
  if (items.length === 0) return null;
  return (
    <ul className="chip-list">
      {items.map((item, i) => (
        <li key={`${i}-${item}`} className="chip" style={n(i)}>
          {item}
        </li>
      ))}
    </ul>
  );
}

/** A labelled block: the small mono heading plus whatever it introduces. */
export function LabelledBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="block-label">{label}</p>
      {children}
    </div>
  );
}
