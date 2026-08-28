/**
 * Pure XP → level conversion helper. No side effects, no imports from store.
 * Used by both the app (store.ts re-exports) and unit tests.
 */
export function xpToLevel(xp: number): {
  level: number;
  intoLevel: number;
  nextLevelAt: number;
} {
  let level = 1;
  let remaining = xp;
  let threshold = 100;
  while (remaining >= threshold) {
    remaining -= threshold;
    level += 1;
    threshold = level % 5 === 0 ? threshold * 2 : threshold;
  }
  return { level, intoLevel: remaining, nextLevelAt: threshold };
}
