import { useCallback, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { Reveal } from '@/components/ui/Reveal';
import { useLanguage } from '@/app/hooks/useAppContext';
import type { Shot } from '@/data/previews';
import { PREVIEW_SIZES } from '@/data/previews';

export interface ScreenPreviewProps {
  shots: readonly Shot[];
  /** The application's name, used for the image's alternative text and the tablist label. */
  name: string;
  /** The lead shot renders eagerly on a case-study route, where it is the page's subject. */
  eager?: boolean;
}

/**
 * The borderless device preview.
 *
 * Each interface concept already carries its own device or browser render, so the
 * preview stands on the page itself — no surface colour, no border, no shadow, no radius.
 * Every screen is in the DOM from the start and the switcher only changes which one is on
 * top, so switching costs no request and nothing can shift. The frame takes the active
 * screen's own aspect ratio, which is what keeps the letterbox figure at zero for every
 * screen rather than only the lead one.
 */
export function ScreenPreview({ shots, name, eager = false }: ScreenPreviewProps) {
  const { isRtl } = useLanguage();
  const [active, setActive] = useState(0);
  const buttonsRef = useRef<Array<HTMLButtonElement | null>>([]);

  const lead = shots[active] ?? shots[0];

  /** Arrow keys walk the tablist, and reverse under RTL — which is what an Arabic reader
   *  expects, since "next" follows the reading direction, not the key's name. */
  const onKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
      const step = (event.key === 'ArrowRight') === isRtl ? -1 : 1;
      const next = (active + step + shots.length) % shots.length;
      event.preventDefault();
      setActive(next);
      buttonsRef.current[next]?.focus();
    },
    [active, shots.length, isRtl],
  );

  if (shots.length === 0 || !lead) return null;

  return (
    <div className="screens-block">
      <Reveal className="preview">
        <div className="stage">
          <div
            className="stage__body"
            style={{ '--ar': `${lead.width} / ${lead.height}` } as CSSProperties}
          >
            {shots.map((shot, i) => (
              <img
                key={shot.file}
                className={`stage__shot${i === active ? ' is-on' : ''}`}
                src={shot.file}
                srcSet={shot.srcSet}
                sizes={PREVIEW_SIZES}
                width={shot.width}
                height={shot.height}
                loading={eager && i === 0 ? 'eager' : 'lazy'}
                fetchPriority={eager && i === 0 ? 'high' : undefined}
                decoding="async"
                alt={i === active ? name : ''}
                aria-hidden={i === active ? undefined : true}
              />
            ))}
          </div>
        </div>

        {shots.length > 1 && (
          <div className="switch" role="tablist" aria-label={name} onKeyDown={onKeyDown}>
            {shots.map((shot, i) => (
              <button
                key={shot.file}
                ref={(node) => {
                  buttonsRef.current[i] = node;
                }}
                type="button"
                role="tab"
                className={`switch__btn${i === active ? ' is-on' : ''}`}
                aria-selected={i === active}
                tabIndex={i === active ? 0 : -1}
                onClick={() => setActive(i)}
              >
                <span
                  className="switch__thumb"
                  style={{ '--ar': `${shot.width} / ${shot.height}` } as CSSProperties}
                >
                  <img
                    src={shot.file}
                    srcSet={shot.srcSet}
                    sizes="88px"
                    width={shot.width}
                    height={shot.height}
                    loading="lazy"
                    decoding="async"
                    alt=""
                  />
                </span>
                <span className="switch__label mono">{shot.label}</span>
              </button>
            ))}
          </div>
        )}
      </Reveal>
    </div>
  );
}
