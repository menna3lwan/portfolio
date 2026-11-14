/** localStorage, but never load-bearing: a blocked or full store must not break the page. */
export const store = {
  get(key: string): string | null {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key: string, value: string): void {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      /* private mode, blocked site data, or a full quota — the page works without it */
    }
  },
};
