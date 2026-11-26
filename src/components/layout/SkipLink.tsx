import { useCallback } from 'react';

/**
 * Skip to content.
 *
 * It keeps a real `href` so it reads as a link and works on middle-click, but it moves
 * focus itself rather than letting the browser resolve the fragment: under a hash router
 * the browser changing `#` would be read as a route change. Focus, not just scroll, is
 * the point — a skip link that only scrolls leaves the keyboard where it was.
 */
export function SkipLink({ targetId, children }: { targetId: string; children: React.ReactNode }) {
  const onClick = useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault();
      const target = document.getElementById(targetId);
      if (!target) return;
      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
      target.scrollIntoView({ block: 'start' });
    },
    [targetId],
  );

  return (
    <a className="skip" href={`#${targetId}`} onClick={onClick}>
      {children}
    </a>
  );
}
