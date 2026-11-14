import { useContext } from 'react';
import { LanguageContext } from '@/app/providers/language-context';
import type { LanguageContextValue } from '@/app/providers/language-context';
import { ThemeContext } from '@/app/providers/theme-context';
import type { ThemeContextValue } from '@/app/providers/theme-context';

export function useLanguage(): LanguageContextValue {
  const value = useContext(LanguageContext);
  if (!value) throw new Error('useLanguage must be used inside <LanguageProvider>');
  return value;
}

export function useTheme(): ThemeContextValue {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('useTheme must be used inside <ThemeProvider>');
  return value;
}
