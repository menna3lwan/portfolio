/** Latin splits into characters, as the reference does; Arabic into words, because
 *  separating Arabic letters breaks their joining. */
const ARABIC = /[؀-ۿ]/;
const LATIN = /[A-Za-z0-9]/;

export const isLatin = (part: string): boolean => LATIN.test(part) && !ARABIC.test(part);

/**
 * In word mode, a run of Latin words stays together as one unit ("Cellula Technologies",
 * "Tracking App"): split word boxes are atomic, and inside a right-to-left line separate
 * Latin boxes would be laid out in reverse.
 */
export function splitUnits(text: string, lang: string): { unit: 'char' | 'word'; parts: string[] } {
  if (lang === 'ar' || ARABIC.test(text)) {
    const parts: string[] = [];
    for (const token of text.split(' ')) {
      const last = parts[parts.length - 1];
      if (last !== undefined && isLatin(token) && isLatin(last)) parts[parts.length - 1] = `${last} ${token}`;
      else parts.push(token);
    }
    return { unit: 'word', parts };
  }
  return { unit: 'char', parts: [...text] };
}
