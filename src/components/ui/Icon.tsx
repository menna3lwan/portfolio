import type { ReactElement } from 'react';

/** The icon set, drawn once as paths on a shared 24-grid stroke frame. */
export type IconName =
  | 'github'
  | 'linkedin'
  | 'mail'
  | 'doc'
  | 'out'
  | 'plus'
  | 'copy'
  | 'sun'
  | 'moon'
  | 'menu'
  | 'back'
  | 'download'
  | 'print'
  | 'minus'
  | 'fit'
  | 'prev'
  | 'next'
  | 'fullscreen'
  | 'fullscreenExit'
  | 'warn'
  | 'file';

const PATHS: Readonly<Record<IconName, ReactElement>> = {
  github: (
    <path d="M9 19c-4 1.3-4-2.2-5.6-2.7M15 21v-3.6a3 3 0 0 0-.9-2.4c2.9-.3 6-1.4 6-6.4A4.9 4.9 0 0 0 18.8 5a4.6 4.6 0 0 0-.1-3.4S17.5 1.2 15 2.9a12.3 12.3 0 0 0-6.4 0C6.1 1.2 5 1.6 5 1.6A4.6 4.6 0 0 0 4.9 5 4.9 4.9 0 0 0 3.6 8.6c0 5 3 6.1 5.9 6.4a3 3 0 0 0-.9 2.3V21" />
  ),
  linkedin: (
    <>
      <rect x="3.5" y="3.5" width="17" height="17" rx="2.5" />
      <path d="M8 10.5V17M8 7.4v.1M12 17v-3.6a2 2 0 0 1 4 0V17" />
    </>
  ),
  mail: (
    <>
      <rect x="3" y="5.5" width="18" height="13" rx="2" />
      <path d="M3.6 6.8 12 13l8.4-6.2" />
    </>
  ),
  doc: (
    <>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5" />
    </>
  ),
  out: <path d="M7 17 17 7M9 7h8v8" />,
  plus: <path d="M12 5v14M5 12h14" />,
  copy: (
    <>
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15h-.5A1.5 1.5 0 0 1 3 13.5v-9A1.5 1.5 0 0 1 4.5 3h9A1.5 1.5 0 0 1 15 4.5V5" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4.2" />
      <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.2 5.2l1.4 1.4M17.4 17.4l1.4 1.4M18.8 5.2l-1.4 1.4M6.6 17.4l-1.4 1.4" />
    </>
  ),
  moon: <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  back: <path d="M19 12H5M11 6l-6 6 6 6" />,
  download: <path d="M12 4v12m0 0-5-5m5 5 5-5M5 20h14" />,
  print: (
    <>
      <path d="M7 9V3h10v6M7 17H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2" />
      <path d="M7 14h10v7H7z" />
    </>
  ),
  minus: <path d="M5 12h14" />,
  fit: <path d="M3 5v14M21 5v14M7 12h10M10 9l-3 3 3 3M14 9l3 3-3 3" />,
  prev: <path d="M15 6l-6 6 6 6" />,
  next: <path d="M9 6l6 6-6 6" />,
  fullscreen: <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />,
  fullscreenExit: <path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" />,
  warn: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5v5.5M12 16.5h.01" />
    </>
  ),
  file: (
    <>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5M9 13h6M9 17h4" />
    </>
  ),
};

export interface IconProps {
  name: IconName;
  /** Mirrors the glyph on an RTL page — for the directional ones only. */
  flip?: boolean;
  className?: string;
}

export function Icon({ name, flip = false, className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={[flip ? 'flip' : null, className].filter(Boolean).join(' ') || undefined}
    >
      {PATHS[name]}
    </svg>
  );
}
