/**
 * Text split for the rise-in entrance: Latin into characters, as the reference does;
 * Arabic into words, because separating Arabic letters breaks their joining.
 *
 * Latin characters are grouped by word in an unbreakable span, so a line can only wrap
 * between words — never inside one. Every unit carries its position as `--i`, which the
 * hover roll uses to stagger.
 *
 * The split copy is decorative (`aria-hidden`); the caller keeps a plain-text copy for
 * assistive technology beside it.
 */
import type { CSSProperties } from 'react';
import { isLatin, splitUnits } from './split';

const at = (i: number) => ({ '--i': i }) as CSSProperties;

export function SplitText({ text, lang }: { text: string; lang: string }) {
  const { unit, parts } = splitUnits(text, lang);
  if (unit === 'word') {
    return (
      <>
        {parts.map((word, i) => (
          <span key={i}>
            {i > 0 && ' '}
            <span className="word" style={at(i)} dir={isLatin(word) ? 'ltr' : undefined}>
              {word}
            </span>
          </span>
        ))}
      </>
    );
  }
  let n = 0;
  const words = parts.join('').split(' ');
  // Latin text keeps its left-to-right order inside an Arabic page: the unbreakable word
  // boxes are atomic, and would otherwise be laid out right to left.
  return (
    <span dir="ltr">
      {words.map((word, w) => (
        <span key={w}>
          {w > 0 && ' '}
          <span className="w">
            {[...word].map((ch, i) => (
              <span className="char" key={i} style={at(n++)}>
                {ch}
              </span>
            ))}
          </span>
        </span>
      ))}
    </span>
  );
}

/**
 * A label that rolls on hover: each character slides up and its copy (a text shadow one
 * line below) slides into place, staggered. Read by assistive technology as plain text.
 */
export function RollText({ text, lang }: { text: string; lang: string }) {
  return (
    <>
      <span className="sr-only">{text}</span>
      <span className="roll" aria-hidden="true">
        <SplitText text={text} lang={lang} />
      </span>
    </>
  );
}
