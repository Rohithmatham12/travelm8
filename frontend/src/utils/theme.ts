type Theme = 'light' | 'dark';
const KEY = 'tm8-theme';

export function getStoredTheme(): Theme | null {
  return localStorage.getItem(KEY) as Theme | null;
}

export function getSystemTheme(): Theme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function getEffectiveTheme(): Theme {
  return getStoredTheme() ?? getSystemTheme();
}

export function applyTheme(theme: Theme): void {
  document.documentElement.setAttribute('data-theme', theme);
}

export function initTheme(): void {
  applyTheme(getEffectiveTheme());
}

export function toggleTheme(): Theme {
  const next: Theme = getEffectiveTheme() === 'dark' ? 'light' : 'dark';
  localStorage.setItem(KEY, next);
  applyTheme(next);
  return next;
}
