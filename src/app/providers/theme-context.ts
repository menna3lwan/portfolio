import { createContext } from 'react';

/** `system` means: follow prefers-color-scheme, which is the page's default state. */
export type ThemeChoice = 'system' | 'light' | 'dark';

export interface ThemeContextValue {
  /** What the viewer chose. */
  choice: ThemeChoice;
  /** What is actually on screen once the system preference is resolved. */
  resolved: 'light' | 'dark';
  setTheme: (choice: ThemeChoice) => void;
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);
