/**
 * PWA install / update banner.
 * Avoids the vite-plugin-pwa virtual module import (subpath not exported in 0.21.x).
 */
import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

export function InstallBanner() {
  const [needsRefresh, setNeedsRefresh] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.ready.then((reg) => {
      reg.addEventListener('updatefound', () => {
        const sw = reg.active;
        if (sw?.state === 'installed') {
          setNeedsRefresh(true);
        }
      });
    });
  }, []);

  if (!needsRefresh || dismissed) return null;

  const handleUpdate = () => {
    navigator.serviceWorker.ready.then((reg) => {
      void reg.update();
      setDismissed(true);
    });
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-20 sm:bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 z-50 rounded-md bg-parchment-50 dark:bg-ink-800 border rule shadow-lg p-4 flex items-start gap-3"
    >
      <Download className="h-4 w-4 text-brass-700 dark:text-brass-400 mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-ink-800 dark:text-parchment-50">Апп шинэчлэгдлээ</p>
        <p className="text-xs text-ink-500 dark:text-ink-200 mt-0.5">
          Шинэ хувилбар ачаалж, дараах аппыг ашиглах боломжтой.
        </p>
        <div className="flex gap-2 mt-3">
          <button
            onClick={handleUpdate}
            className="px-3 py-1.5 rounded-md bg-ink-800 text-parchment-50 text-xs font-medium hover:bg-ink-700 dark:bg-brass-600 dark:text-ink-900 dark:hover:bg-brass-500 transition focus-ring"
          >
            Шинэчлэх
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="px-3 py-1.5 rounded-md border rule text-ink-700 dark:text-parchment-50 text-xs font-medium hover:bg-ink-50 dark:hover:bg-ink-700 transition focus-ring"
          >
            Дараа нь
          </button>
        </div>
      </div>
      <button
        onClick={() => setDismissed(true)}
        aria-label="Хаах"
        className="text-ink-300 hover:text-ink-700 dark:hover:text-parchment-50 transition shrink-0"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
