import { createElement } from 'react';
import type { CSSProperties, ElementType, ReactNode } from 'react';
import { useReveal } from '@/app/hooks/useReveal';

export interface RevealProps {
  children: ReactNode;
  /** Which element to render — the reveal is a behaviour, not a box. */
  as?: ElementType;
  /** Stagger index: the stylesheet turns it into a transition delay. */
  index?: number;
  /** `wipe` clips its children up from the baseline instead of raising the block. */
  variant?: 'fade' | 'rise' | 'wipe';
  className?: string;
  style?: CSSProperties;
  id?: string;
  'aria-labelledby'?: string;
  'aria-hidden'?: boolean;
  role?: string;
}

const VARIANT_CLASS: Record<NonNullable<RevealProps['variant']>, string> = {
  fade: 'rv',
  rise: 'rv rv--rise',
  wipe: 'rv rv--wipe',
};

/**
 * Reveal-on-enter, as a wrapper.
 *
 * It only adds two classes: the element's own styling stays in the stylesheet, and the
 * reduced-motion layer can switch every reveal off in one rule. Passing `as` keeps the
 * document semantic — a revealed section is still a `<section>`, a revealed list item
 * still an `<li>`.
 */
export function Reveal({
  children,
  as = 'div',
  index,
  variant = 'fade',
  className,
  style,
  ...rest
}: RevealProps) {
  const [ref, isIn] = useReveal<HTMLElement>();

  const classes = [VARIANT_CLASS[variant], isIn ? 'is-in' : null, className]
    .filter(Boolean)
    .join(' ');

  return createElement(
    as,
    {
      ref,
      className: classes,
      style: index === undefined ? style : ({ ...style, '--i': index } as CSSProperties),
      ...rest,
    },
    children,
  );
}
