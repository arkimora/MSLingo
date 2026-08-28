/**
 * Theme management.
 *
 * Three themes: 'light' | 'dark' | 'system'
 *   - 'system' uses `prefers-color-scheme` media query (no .dark class)
 *   - 'light' / 'dark' toggle the .dark class on <html>
 *
 * Subscribes to:
 *   - system color-scheme changes (only matters when theme === 'system')
 *   - cross-tab settings changes via BroadcastChannel
 *   - localStorage changes (Storage event) for tabs without BroadcastChannel
 *
 * Persists the chosen theme to IndexedDB via progress.updateSettings().
 * No polling — fully event-driven.
 */
import { useEffect } from 'react';
import { progress, type Settings } from '@/lib/progress/store';

const STORAGE_KEY = 'mslingo:theme';

function getSystemPref(): 'light' | 'dark' {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme: Settings['theme']) {
  const root = document.documentElement;
  if (theme === 'system') {
    root.classList.toggle('dark', getSystemPref() === 'dark');
  } else {
    root.classList.toggle('dark', theme === 'dark');
  }
}

/**
 * Hook: synchronise the document's theme class with the persisted setting.
 * Call once near the root of the app.
 */
export function useThemeSync() {
  useEffect(() => {
    let cancelled = false;

    function readAndApply() {
      if (cancelled) return;
      // Read from localStorage first (fast sync path), fall back to IndexedDB.
      const cached = localStorage.getItem(STORAGE_KEY) as Settings['theme'] | null;
      applyTheme(cached ?? 'system');
    }

    readAndApply();

    // Always hydrate from the source of truth on mount.
    void progress.getSettings().then((s) => {
      if (cancelled) return;
      localStorage.setItem(STORAGE_KEY, s.theme);
      applyTheme(s.theme);
    });

    // Watch system preference changes (only matters when theme === 'system')
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onSystemChange = () => {
      const cached = localStorage.getItem(STORAGE_KEY) as Settings['theme'] | null;
      if ((cached ?? 'system') === 'system') applyTheme('system');
    };
    mq.addEventListener('change', onSystemChange);

    // Watch cross-tab updates via BroadcastChannel
    let bc: BroadcastChannel | null = null;
    if ('BroadcastChannel' in window) {
      bc = new BroadcastChannel('mslingo-theme');
      bc.onmessage = (e) => {
        const next = e.data as Settings['theme'];
        localStorage.setItem(STORAGE_KEY, next);
        applyTheme(next);
      };
    }

    return () => {
      cancelled = true;
      mq.removeEventListener('change', onSystemChange);
      bc?.close();
    };
  }, []);
}

/**
 * Persist a new theme setting, broadcast to other tabs, and apply locally.
 * No React state needed — the ThemeSync hook will pick this up.
 */
export async function setTheme(theme: Settings['theme']) {
  localStorage.setItem(STORAGE_KEY, theme);
  applyTheme(theme);
  await progress.updateSettings({ theme });
  if ('BroadcastChannel' in window) {
    new BroadcastChannel('mslingo-theme').postMessage(theme);
  }
}
