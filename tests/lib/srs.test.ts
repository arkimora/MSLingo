import { describe, it, expect, vi } from 'vitest';

vi.mock('ts-fsrs', () => {
  const mockCard = {
    state: 0,
    due: new Date(),
    stability: 0,
    difficulty: 0,
    reviews: 0,
    lapses: 0,
  };
  return {
    fsrs: vi.fn(() => ({
      repeat: vi.fn(() => ({
        [1]: { card: { ...mockCard, state: 0 } },
        [2]: { card: { ...mockCard, state: 1 } },
        [3]: { card: { ...mockCard, state: 2 } },
        [4]: { card: { ...mockCard, state: 3 } },
      })),
    })),
    Rating: { Manual: 0, Again: 1, Hard: 2, Good: 3, Easy: 4 },
    createEmptyCard: vi.fn(() => ({ ...mockCard })),
    State: { New: 0, Learning: 1, Review: 2, Relearning: 3 },
  };
});

import { reviewCard, newSignMastery } from '@/lib/srs';

describe('newSignMastery', () => {
  it('creates a new mastery entry', () => {
    const m = newSignMastery(42);
    expect(m.signId).toBe(42);
    expect(m.state).toBe('new');
    expect(m.reviewCount).toBe(0);
    expect(m.correctCount).toBe(0);
    expect(m.incorrectCount).toBe(0);
    expect(m.fsrsCard).not.toBeNull();
    expect(m.lastReviewedAt).toBeNull();
    expect(m.nextReviewAt).toBeNull();
  });
});

describe('reviewCard', () => {
  it('increments review count on Good rating', () => {
    const m = newSignMastery(1);
    const { mastery: updated } = reviewCard(m, 3 as any);
    expect(updated.reviewCount).toBe(1);
    expect(updated.correctCount).toBe(1);
  });

  it('increments incorrect count on Again rating', () => {
    const m = newSignMastery(1);
    const { mastery: updated } = reviewCard(m, 1 as any);
    expect(updated.reviewCount).toBe(1);
    expect(updated.incorrectCount).toBe(1);
    expect(updated.correctCount).toBe(0);
  });

  it('sets lastReviewedAt', () => {
    const before = Date.now();
    const m = newSignMastery(1);
    const { mastery: updated } = reviewCard(m, 3 as any);
    expect(updated.lastReviewedAt).toBeTruthy();
    expect(new Date(updated.lastReviewedAt!).getTime()).toBeGreaterThanOrEqual(before);
  });

  it('preserves signId across updates', () => {
    const m = newSignMastery(99);
    const { mastery: updated } = reviewCard(m, 3 as any);
    expect(updated.signId).toBe(99);
  });
});
