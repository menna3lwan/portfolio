/* The reference's own glyphs, redrawn as inline SVG (paths copied from its markup where
   it uses inline SVG; the asterisk drawn to match its 25×29 icon). All decorative. */

export const Asterisk = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <g stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
      <path d="M12 2.5v19" />
      <path d="M2.5 12h19" />
      <path d="M5.3 5.3l13.4 13.4" />
      <path d="M18.7 5.3L5.3 18.7" />
    </g>
  </svg>
);

export const ArrowRight = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const ArrowUpRight = ({ size = 12 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M7 17L17 7M17 7H7M17 7V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const ArrowUp = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M12 19V5M12 5L5 12M12 5L19 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const ArrowUpRightLong = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M18.3646 5.63623H11.2939M18.3646 5.63623L18.3643 12.7073M18.3646 5.63623L5.63672 18.3642"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const ArrowBack = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M8 8L4.70711 11.2929C4.31658 11.6834 4.31658 12.3166 4.70711 12.7071L8 16M5 12L19 12"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

export const Chevron = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
  </svg>
);

export const Moon = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M12 3a9 9 0 1 0 9 9 7 7 0 0 1-9-9Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
  </svg>
);
