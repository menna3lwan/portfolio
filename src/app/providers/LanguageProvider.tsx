import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { Content, Language } from '@/content/types';
import { englishContent, loadContent, peekContent } from '@/content';
import { STRINGS } from '@/i18n/strings';
import { store } from '@/app/storage';
import { commitWithTransition, prefersReducedMotion } from '@/app/viewTransition';
import { LanguageContext } from './language-context';
import type { LanguageContextValue } from './language-context';

const readStored = (): Language => (store.get('lang') === 'ar' ? 'ar' : 'en');

export function LanguageProvider({ children }: { children: ReactNode }) {
  const initial = readStored();
  const [lang, setLang] = useState<Language>(initial);
  const [content, setContent] = useState<Content | null>(() => peekContent(initial));

  // First load only: if the stored language is Arabic, its chunk has to arrive before
  // anything can render. Switching afterwards goes through setLanguage, which preloads.
  useEffect(() => {
    if (content) return;
    let cancelled = false;
    void loadContent(lang).then((loaded) => {
      if (!cancelled) setContent(loaded);
    });
    return () => {
      cancelled = true;
    };
  }, [lang, content]);

  // Layout effect, not effect: the direction flip has to be part of the same commit the
  // view transition captures, or the snapshot shows the old layout with the new text.
  useLayoutEffect(() => {
    const root = document.documentElement;
    root.lang = lang;
    root.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [lang]);

  /**
   * Change language as one cross-fade.
   *
   * The content is loaded *before* the commit, so the switch is a single frame rather
   * than a flash of one language followed by the other.
   */
  const setLanguage = useCallback(
    (next: Language) => {
      if (next === lang) return;
      store.set('lang', next);
      const apply = (loaded: Content) =>
        commitWithTransition(() => {
          setLang(next);
          setContent(loaded);
        }, !prefersReducedMotion());

      const ready = peekContent(next);
      if (ready) apply(ready);
      else void loadContent(next).then(apply);
    },
    [lang],
  );

  const toggleLanguage = useCallback(() => {
    setLanguage(lang === 'ar' ? 'en' : 'ar');
  }, [lang, setLanguage]);

  const value = useMemo<LanguageContextValue>(
    () => ({
      lang,
      dir: lang === 'ar' ? 'rtl' : 'ltr',
      isRtl: lang === 'ar',
      content: content ?? englishContent(),
      t: STRINGS[lang],
      setLanguage,
      toggleLanguage,
    }),
    [lang, content, setLanguage, toggleLanguage],
  );

  // Only ever null on a first load that opened straight into Arabic. The page background
  // is already painted by the stylesheet, so this is a held frame, not a blank one.
  if (!content) return null;

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}
