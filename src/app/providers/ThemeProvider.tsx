import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { store } from '@/app/storage';
import { ThemeContext } from './theme-context';
import type { ThemeChoice, ThemeContextValue } from './theme-context';


const DARK_QUERY = '(prefers-color-scheme: dark)';

const readStored = (): ThemeChoice => {
  const stored = store.get('theme');
  return stored === 'dark' || stored === 'light' ? stored : 'system';
};

const systemPrefersDark = (): boolean =>
  typeof window !== 'undefined' && window.matchMedia(DARK_QUERY).matches;

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [choice, setChoice] = useState<ThemeChoice>(readStored);
  const [systemDark, setSystemDark] = useState<boolean>(systemPrefersDark);

  // Only an explicit choice writes data-theme; `system` removes it so the media query in
  // the token layer takes over, exactly as the prototype behaved.
  useEffect(() => {
    const root = document.documentElement;
    if (choice === 'system') delete root.dataset.theme;
    else root.dataset.theme = choice;
  }, [choice]);

  useEffect(() => {
    const mq = window.matchMedia(DARK_QUERY);
    const onChange = (event: MediaQueryListEvent) => setSystemDark(event.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const resolved: 'light' | 'dark' =
    choice === 'system' ? (systemDark ? 'dark' : 'light') : choice;

  const setTheme = useCallback((next: ThemeChoice) => {
    setChoice(next);
    if (next === 'system') store.set('theme', '');
    else store.set('theme', next);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(resolved === 'dark' ? 'light' : 'dark');
  }, [resolved, setTheme]);

  const value = useMemo<ThemeContextValue>(
    () => ({ choice, resolved, setTheme, toggleTheme }),
    [choice, resolved, setTheme, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
