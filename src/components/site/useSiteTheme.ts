import { useTheme } from '@/app/hooks/useAppContext';

/** The site's own theme resolution: dark unless light was chosen explicitly. */
export function useSiteTheme(): { light: boolean; toggle: () => void } {
  const { choice, setTheme } = useTheme();
  const light = choice === 'light';
  return { light, toggle: () => setTheme(light ? 'dark' : 'light') };
}
