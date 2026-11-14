import { createContext } from 'react';
import type { Content, Language } from '@/content/types';
import type { Strings } from '@/i18n/strings';

export interface LanguageContextValue {
  lang: Language;
  dir: 'ltr' | 'rtl';
  isRtl: boolean;
  content: Content;
  t: Strings;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
}

/** Its own module, so the provider file exports a component and nothing else. */
export const LanguageContext = createContext<LanguageContextValue | null>(null);
