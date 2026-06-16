/* ----------------------------------------------------------------------------
   Light/dark theme. Default follows the OS; the toggle stores an explicit
   choice and reflects it as a `data-theme` attribute on <html>.
---------------------------------------------------------------------------- */

export type Theme = 'light' | 'dark';
const KEY = 'cube-theme';

export function storedTheme(): Theme | null {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'light' || v === 'dark' ? v : null;
  } catch {
    return null;
  }
}

export function systemTheme(): Theme {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function effectiveTheme(): Theme {
  return storedTheme() ?? systemTheme();
}

function applyTheme(theme: Theme | null): void {
  const el = document.documentElement;
  if (theme) el.setAttribute('data-theme', theme);
  else el.removeAttribute('data-theme');
}

export function setTheme(theme: Theme): void {
  try {
    localStorage.setItem(KEY, theme);
  } catch {
    // ignore storage failures (private mode, etc.)
  }
  applyTheme(theme);
}

/** Apply any stored preference at startup (call before first paint). */
export function initTheme(): void {
  applyTheme(storedTheme());
}
