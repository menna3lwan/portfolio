/** Latin splits into characters, as the reference does; Arabic into words, because
 *  separating Arabic letters breaks their joining. */
const ARABIC = /[؀-ۿ]/;

export function splitUnits(text: string, lang: string): { unit: 'char' | 'word'; parts: string[] } {
  if (lang === 'ar' || ARABIC.test(text)) return { unit: 'word', parts: text.split(' ') };
  return { unit: 'char', parts: [...text] };
}
