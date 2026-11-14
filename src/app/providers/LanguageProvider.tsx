import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { Content, Language } from '@/content/types';
import { englishContent, loadContent, peekContent } from '@/content';
import { STRINGS } from '@/i18n/strings';
import { store } from '@/app/storage';
import { LanguageContext } from './language-context';
import type { LanguageContextValue } from './language-context';

const readStored = (): Language => (store.get('lang') === 'ar' ? 'ar' : 'en');

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Language>(readStored);
  // The content the page is currently rendered from. It trails `lang` by exactly one
  // chunk fetch the first time Arabic is chosen, and never afterwards — which is what
  // keeps the switch from flashing a half-translated page.
  const [content, setContent] = useState<Content | null>(() => peekContent(readStored()));

  useEffect(() => {
    const ready = peekContent(lang);
    if (ready) {
      setContent(ready);
      return;
    }
    let cancelled = false;
    void loadContent(lang).then((loaded) => {
      if (!cancelled) setContent(loaded);
    });
    return () => {
      cancelled = true;
    };
  }, [lang]);

  // The document element carries both lang and dir: the whole stylesheet keys its Arabic
  // overrides off [lang="ar"], and every logical property keys its side off [dir]. It
  // follows the content actually on screen, not the language that is still loading.
  const shown: Language = content && content === peekContent('ar') ? 'ar' : 'en';
  useEffect(() => {
    const root = document.documentElement;
    root.lang = shown;
    root.dir = shown === 'ar' ? 'rtl' : 'ltr';
  }, [shown]);

  const setLanguage = useCallback((next: Language) => {
    setLang(next);
    store.set('lang', next);
  }, []);

  const toggleLanguage = useCallback(() => {
    setLang((current) => {
      const next: Language = current === 'ar' ? 'en' : 'ar';
      store.set('lang', next);
      return next;
    });
  }, []);

  const value = useMemo<LanguageContextValue>(
    () => ({
      lang: shown,
      dir: shown === 'ar' ? 'rtl' : 'ltr',
      isRtl: shown === 'ar',
      content: content ?? englishContent(),
      t: STRINGS[shown],
      setLanguage,
      toggleLanguage,
    }),
    [shown, content, setLanguage, toggleLanguage],
  );

  // Only ever null on a first load that opened straight into Arabic; the page background
  // is already painted by the stylesheet, so this is a held frame, not a blank one.
  if (!content) return null;

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}
