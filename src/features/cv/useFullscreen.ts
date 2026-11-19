import { useCallback, useEffect, useState } from 'react';
import type { RefObject } from 'react';

interface LegacyDocument extends Document {
  webkitFullscreenEnabled?: boolean;
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void>;
}

interface LegacyElement extends HTMLElement {
  webkitRequestFullscreen?: () => Promise<void>;
}

/** Full screen on the given element (the document's stage) or, failing that, the whole
 *  document, with the WebKit-prefixed fallback still wired. */
export function useFullscreen(target?: RefObject<HTMLElement | null>): {
  supported: boolean;
  active: boolean;
  toggle: () => void;
} {
  const doc = typeof document === 'undefined' ? null : (document as LegacyDocument);
  const supported = Boolean(doc && (doc.fullscreenEnabled || doc.webkitFullscreenEnabled));
  const [active, setActive] = useState(false);

  useEffect(() => {
    const onChange = () => {
      const d = document as LegacyDocument;
      const on = Boolean(d.fullscreenElement || d.webkitFullscreenElement);
      setActive(on);
      document.documentElement.classList.toggle('is-fs', on);
    };
    document.addEventListener('fullscreenchange', onChange);
    document.addEventListener('webkitfullscreenchange', onChange);
    onChange();
    return () => {
      document.removeEventListener('fullscreenchange', onChange);
      document.removeEventListener('webkitfullscreenchange', onChange);
      document.documentElement.classList.remove('is-fs');
    };
  }, []);

  const toggle = useCallback(() => {
    const d = document as LegacyDocument;
    const root = (target?.current ?? document.documentElement) as LegacyElement;
    if (d.fullscreenElement || d.webkitFullscreenElement) {
      const exit = d.exitFullscreen ?? d.webkitExitFullscreen;
      void exit?.call(d);
      return;
    }
    const request = root.requestFullscreen ?? root.webkitRequestFullscreen;
    if (request) void Promise.resolve(request.call(root)).catch(() => undefined);
  }, [target]);

  return { supported, active, toggle };
}
