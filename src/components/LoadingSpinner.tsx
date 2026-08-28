import type { FC } from 'react';

interface Props {
  label?: string;
}

/**
 * Accessible loading spinner — use `role="status"` and `aria-live` so screen readers
 * announce the label without blocking them from reading the rest of the page.
 */
export const LoadingSpinner: FC<Props> = ({ label = 'Ачаалж байна...' }) => (
  <div
    role="status"
    aria-live="polite"
    aria-label={label}
    className="flex flex-col items-center justify-center min-h-[40vh] gap-4"
  >
    <div
      className="h-8 w-8 rounded-full border-2 border-ink-200 border-t-ink-800
        dark:border-ink-700 dark:border-t-brass-500 animate-spin"
    />
    <p className="text-sm text-ink-400 dark:text-ink-300">{label}</p>
  </div>
);
