import { useRef } from 'react';
import { useReveal } from '@/app/hooks/useReveal';
import { usePointerLean } from '@/app/hooks/usePointerLean';
import { useLanguage } from '@/app/hooks/useAppContext';
import { asset } from '@/site.config';

/** The marks composed around the frame. Each carries its own parallax factor, and none
 *  of them makes a claim — they are software punctuation, not credentials. */
/* The drift factors are roughly half what they were. The group should read as having
   depth when the page moves, not as parts travelling at different speeds. */
const MARKS = [
  { className: 'mark mark--angle mono', par: 11, text: '</>' },
  { className: 'mark mark--brace mono', par: -9, text: '{ }' },
  { className: 'mark mark--chip mono', par: 13, text: 'Flutter' },
  { className: 'mark mark--semi mono', par: -7, text: 'Dart;' },
] as const;

/**
 * The portrait.
 *
 * The frame is a fixed arch; the photograph is cropped by a scale about a chosen focal
 * point rather than by resizing the box, so the composition holds at every width. The
 * marks sit in the frame's margin, never over the face, and the whole group leans with
 * the pointer so it reads as a composition rather than as stickers on a photo.
 */
export function Portrait() {
  const { content } = useLanguage();
  const [revealRef, isIn] = useReveal<HTMLElement>();
  const tiltRef = useRef<HTMLElement>(null);
  usePointerLean(tiltRef);

  // One node, two behaviours: the reveal observer and the pointer lean share it.
  const setRefs = (node: HTMLElement | null) => {
    (revealRef as React.MutableRefObject<HTMLElement | null>).current = node;
    (tiltRef as React.MutableRefObject<HTMLElement | null>).current = node;
  };

  return (
    <figure
      ref={setRefs}
      className={`hero__portrait rv${isIn ? ' is-in' : ''}`}
      style={{ '--i': 2 } as React.CSSProperties}
    >
      <div className="hero__arch" data-par="7">
        <img
          src={asset('img/portrait-grad.webp')}
          srcSet={
            `${asset('img/portrait-grad-464w.webp')} 464w, ` +
            `${asset('img/portrait-grad-640w.webp')} 640w, ` +
            `${asset('img/portrait-grad.webp')} 880w`
          }
          sizes="(max-width: 520px) 70vw, (max-width: 899px) 62vw, (max-width: 1400px) 17vw, 232px"
          width={880}
          height={1100}
          alt={content.meta.name}
          loading="eager"
          fetchPriority="high"
          decoding="async"
        />
      </div>
      {MARKS.map((mark) => (
        <span key={mark.text} className={mark.className} data-par={mark.par} aria-hidden="true">
          {mark.text}
        </span>
      ))}
      <i className="mark__corner mark__corner--tl" data-par="5" aria-hidden="true" />
      <i className="mark__corner mark__corner--br" data-par="-5" aria-hidden="true" />
    </figure>
  );
}
