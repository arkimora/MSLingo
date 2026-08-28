import {
  createContext,
  useContext,
  useEffect,
  useState,
  type FC,
  type ReactNode,
} from 'react';
import { progress } from '@/lib/progress/store';

export const MotionContext = createContext<boolean>(false);

/** Read the current reduced-motion preference from context. */
export function useReducedMotion(): boolean {
  return useContext(MotionContext);
}

interface Props {
  children: ReactNode;
}

/**
 * Reads the `reducedMotion` setting from IndexedDB on mount and applies a
 * global CSS rule to kill animations/transition durations when enabled.
 *
 * Also listens for the `mslingo:settings-changed` custom event so the
 * toggle in Settings takes effect immediately without a page reload.
 */
export const MotionGuard: FC<Props> = ({ children }) => {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    progress.getSettings().then((s) => setReduced(s.reducedMotion));

    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ reducedMotion: boolean }>).detail;
      setReduced(detail.reducedMotion);
    };
    window.addEventListener('mslingo:settings-changed', handler);
    return () => window.removeEventListener('mslingo:settings-changed', handler);
  }, []);

  return (
    <MotionContext.Provider value={reduced}>
      {reduced && (
        <style>{`*,*::before,*::after{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important}`}</style>
      )}
      {children}
    </MotionContext.Provider>
  );
};
