/** Theme handling: auto (system), light and dark, persisted in localStorage. */

import { STRINGS } from '../lib/strings.js';

export const THEME_KEY = 'glyphary:theme';
export const MODES = ['auto', 'light', 'dark'];

export const THEME_LABELS = {
  auto: STRINGS.theme.auto,
  light: STRINGS.theme.light,
  dark: STRINGS.theme.dark,
};

const media = () => window.matchMedia('(prefers-color-scheme: dark)');

export const normalizeMode = (value) => (MODES.includes(value) ? value : null);

export const currentMode = () => normalizeMode(document.documentElement.dataset.themeMode) || 'auto';

export const resolveTheme = (mode) => (mode === 'dark' || (mode === 'auto' && media().matches) ? 'dark' : 'light');

export const applyTheme = (mode, { persist = true } = {}) => {
  const safe = normalizeMode(mode) || 'auto';
  const root = document.documentElement;
  root.dataset.themeMode = safe;
  root.dataset.theme = resolveTheme(safe);
  if (persist) {
    try {
      window.localStorage.setItem(THEME_KEY, safe);
    } catch (error) {
      // file:// and private mode may block storage; the theme still applies.
    }
  }
  return safe;
};

export const nextMode = (mode) => MODES[(MODES.indexOf(mode) + 1) % MODES.length];

/** Wires the top bar toggle: click cycles Auto → Light → Dark. */
export const createThemeToggle = (button, label) => {
  const sync = () => {
    const mode = currentMode();
    const text = STRINGS.theme.title(THEME_LABELS[mode]);
    button.dataset.mode = mode;
    button.setAttribute('aria-label', text);
    button.title = text;
    if (label) label.textContent = THEME_LABELS[mode];
  };

  button.addEventListener('click', () => {
    applyTheme(nextMode(currentMode()));
    sync();
  });

  const query = media();
  const onChange = () => {
    if (currentMode() === 'auto') applyTheme('auto', { persist: false });
    sync();
  };
  if (typeof query.addEventListener === 'function') query.addEventListener('change', onChange);
  else if (typeof query.addListener === 'function') query.addListener(onChange);

  sync();
  return { sync };
};
