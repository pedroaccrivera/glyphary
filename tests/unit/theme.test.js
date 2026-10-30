import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  MODES,
  THEME_KEY,
  applyTheme,
  currentMode,
  nextMode,
  normalizeMode,
  resolveTheme,
} from '../../src/ui/theme.js';

const setSystemDark = (dark) => {
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({
      matches: dark,
      media: '(prefers-color-scheme: dark)',
      addEventListener() {},
      removeEventListener() {},
    })),
  );
};

/** jsdom in this setup does not expose a working localStorage, so stub one. */
const makeStorage = () => {
  const map = new Map();
  return {
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => map.set(key, String(value)),
    removeItem: (key) => map.delete(key),
    clear: () => map.clear(),
    key: (index) => Array.from(map.keys())[index] ?? null,
    get length() {
      return map.size;
    },
  };
};

describe('theme modes', () => {
  beforeEach(() => {
    document.documentElement.dataset.theme = 'light';
    document.documentElement.dataset.themeMode = 'auto';
    vi.stubGlobal('localStorage', makeStorage());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('exposes the three modes', () => {
    expect(MODES).toEqual(['auto', 'light', 'dark']);
  });

  it('normalizeMode only accepts known values', () => {
    expect(normalizeMode('dark')).toBe('dark');
    expect(normalizeMode('sepia')).toBeNull();
    expect(normalizeMode(null)).toBeNull();
  });

  it('cycles auto → light → dark → auto', () => {
    expect(nextMode('auto')).toBe('light');
    expect(nextMode('light')).toBe('dark');
    expect(nextMode('dark')).toBe('auto');
  });

  it('resolves auto from the system preference', () => {
    setSystemDark(true);
    expect(resolveTheme('auto')).toBe('dark');
    setSystemDark(false);
    expect(resolveTheme('auto')).toBe('light');
  });

  it('light and dark are explicit, whatever the system says', () => {
    setSystemDark(true);
    expect(resolveTheme('light')).toBe('light');
    setSystemDark(false);
    expect(resolveTheme('dark')).toBe('dark');
  });

  it('applies the resolved theme and persists the chosen mode', () => {
    setSystemDark(true);
    expect(applyTheme('light')).toBe('light');
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(document.documentElement.dataset.themeMode).toBe('light');
    expect(window.localStorage.getItem(THEME_KEY)).toBe('light');
    expect(currentMode()).toBe('light');
  });

  it('can apply without persisting (used by the system listener)', () => {
    setSystemDark(true);
    applyTheme('dark', { persist: false });
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(window.localStorage.getItem(THEME_KEY)).toBeNull();
  });

  it('falls back to auto for unknown modes', () => {
    setSystemDark(false);
    applyTheme('neon');
    expect(document.documentElement.dataset.themeMode).toBe('auto');
    expect(document.documentElement.dataset.theme).toBe('light');
  });
});
