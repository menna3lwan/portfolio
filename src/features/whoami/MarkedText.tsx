import { Fragment } from 'react';
import { useLanguage } from '@/app/hooks/useAppContext';
import { WHOAMI_MARKS } from '@/i18n/strings';

/**
 * Her own phrases, lifted.
 *
 * The marks are exact substrings of her own sentences, so the wording is never altered —
 * only marked. React renders the segments as real nodes rather than injected markup, so
 * there is no HTML string to escape and nothing can be injected through the content.
 */
export function MarkedText({ text }: { text: string }) {
  const { lang } = useLanguage();
  const phrases = WHOAMI_MARKS[lang];

  // Split on the first occurrence of each phrase, left to right, keeping the order of
  // the sentence intact.
  let segments: Array<{ text: string; marked: boolean }> = [{ text, marked: false }];
  for (const phrase of phrases) {
    const next: typeof segments = [];
    let used = false;
    for (const segment of segments) {
      if (used || segment.marked) {
        next.push(segment);
        continue;
      }
      const at = segment.text.indexOf(phrase);
      if (at === -1) {
        next.push(segment);
        continue;
      }
      used = true;
      if (at > 0) next.push({ text: segment.text.slice(0, at), marked: false });
      next.push({ text: phrase, marked: true });
      const rest = segment.text.slice(at + phrase.length);
      if (rest) next.push({ text: rest, marked: false });
    }
    segments = next;
  }

  return (
    <>
      {segments.map((segment, i) =>
        segment.marked ? (
          <mark key={i} className="hl">
            {segment.text}
          </mark>
        ) : (
          <Fragment key={i}>{segment.text}</Fragment>
        ),
      )}
    </>
  );
}
