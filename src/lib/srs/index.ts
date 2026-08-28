/**
 * FSRS-based spaced repetition for sign mastery.
 *
 * This wraps `ts-fsrs` so the rest of the app doesn't import it directly.
 * We track per-sign (and per-variant, in the future) scheduling.
 */
import { fsrs, Rating, type Card, type Rating as RatingT, createEmptyCard, State } from 'ts-fsrs';
import type { SignMastery } from '../progress/store';

const scheduler = fsrs();

export function emptyCard(): Card {
  return createEmptyCard();
}

/**
 * Grade a sign review and return the updated card + the new state.
 */
export function reviewCard(
  mastery: SignMastery,
  rating: RatingT,
  now: Date = new Date(),
): { mastery: SignMastery; log: { rating: RatingT; reviewedAt: string; prevState: SignMastery['state']; newState: SignMastery['state'] } } {
  const card = mastery.fsrsCard ?? emptyCard();
  const result = scheduler.repeat(card, now);
  // ts-fsrs 5.x: result is a Record keyed by Rating, but the IPreview type
  // doesn't include Manual. Cast through unknown.
  const lookup = result as unknown as Partial<Record<Rating, { card: Card }>>;
  const updated = lookup[rating] ?? lookup[Rating.Good];
  if (!updated) {
    throw new Error(`FSRS returned no schedule for rating ${rating}`);
  }
  const prevState = mastery.state;
  const newState = stateFromCard(updated.card);

  return {
    mastery: {
      ...mastery,
      state: newState,
      fsrsCard: updated.card,
      lastReviewedAt: now.toISOString(),
      nextReviewAt: updated.card.due.toISOString(),
      reviewCount: mastery.reviewCount + 1,
      correctCount: mastery.correctCount + (rating !== 1 ? 1 : 0),
      incorrectCount: mastery.incorrectCount + (rating === 1 ? 1 : 0),
    },
    log: {
      rating,
      reviewedAt: now.toISOString(),
      prevState,
      newState,
    },
  };
}

function stateFromCard(card: Card): SignMastery['state'] {
  switch (card.state) {
    case State.New: return 'new';
    case State.Learning: return 'learning';
    case State.Review: return 'review';
    case State.Relearning: return 'learning';
    default: return 'new';
  }
}

export function newSignMastery(signId: number): SignMastery {
  const card = emptyCard();
  return {
    signId,
    state: 'new',
    fsrsCard: card,
    lastReviewedAt: null,
    nextReviewAt: null,
    reviewCount: 0,
    correctCount: 0,
    incorrectCount: 0,
  };
}
