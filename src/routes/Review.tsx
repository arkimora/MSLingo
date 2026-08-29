import { useState, useEffect, useCallback } from 'react';
import { CheckCircle2, ChevronRight, Meh, Smile, XCircle } from 'lucide-react';
import { progress } from '../lib/progress/store';
import { reviewCard, newSignMastery } from '../lib/srs';
import { findSign, type Sign } from '../content/loader';
import type { Rating } from 'ts-fsrs';
import { LearnSkeleton } from '../components/Skeleton';

const RATING_BUTTONS: { rating: Rating; label: string; icon: typeof Meh }[] = [
  { rating: 1, label: 'Хүнд', icon: XCircle },
  { rating: 2, label: 'Дундаж', icon: Meh },
  { rating: 3, label: 'Амархан', icon: Smile },
];

export default function Review() {
  const [queue, setQueue] = useState<number[]>([]);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sign, setSign] = useState<Sign | null>(null);
  const [phase, setPhase] = useState<'question' | 'answer'>('question');
  const [selectedRating, setSelectedRating] = useState<Rating | null>(null);

  const loadSign = useCallback(async (id: number) => {
    const found = await findSign(id);
    setSign(found ?? null);
  }, []);

  useEffect(() => {
    (async () => {
      const due = await progress.dueForReview();
      const ids = due.map((m) => m.signId);
      setQueue(ids);
      setLoading(false);
      if (ids.length > 0) {
        await loadSign(ids[0]);
      }
    })();
  }, [loadSign]);

  const handleRating = useCallback(async (rating: Rating) => {
    if (!sign) return;
    setSelectedRating(rating);
    const mastery = await progress.getMastery(sign.id) ?? newSignMastery(sign.id);
    const { mastery: updated, log } = reviewCard(mastery, rating);
    await progress.upsertMastery(updated);
    await progress.logReview({
      signId: sign.id,
      rating,
      reviewedAt: new Date().toISOString(),
      prevState: log.prevState,
      newState: log.newState,
    });
    setPhase('answer');
  }, [sign]);

  const handleNext = useCallback(async () => {
    const nextIdx = current + 1;
    if (nextIdx >= queue.length) {
      setQueue([]);
      return;
    }
    setCurrent(nextIdx);
    setPhase('question');
    setSelectedRating(null);
    await loadSign(queue[nextIdx]);
  }, [current, queue, loadSign]);

  if (loading) return <LearnSkeleton />;

  if (queue.length === 0 || !sign) {
    return (
      <div className="text-center py-20 space-y-4">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full border-2 border-ink-800 dark:border-brass-500">
          <CheckCircle2 className="h-7 w-7 text-ink-800 dark:text-brass-500" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">Дахин үзэх зүйл байхгүй</h1>
        <p className="text-ink-500 dark:text-ink-200">Өнөөдөр бүх дохио дахин үзэгдсэн.</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="space-y-2">
        <div className="flex justify-between text-xs uppercase tracking-wider">
          <span className="text-ink-500 dark:text-ink-200">Дахин үзэх <span className="font-serif tabular-nums text-ink-800 dark:text-parchment-50">{current + 1}/{queue.length}</span></span>
        </div>
        <div className="h-px bg-ink-100 dark:bg-ink-700 relative overflow-hidden">
          <div
            className="h-full bg-ink-800 dark:bg-brass-500 transition-all"
            style={{ width: `${((current + 1) / queue.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="rounded-md border rule overflow-hidden bg-parchment-50/30 dark:bg-ink-800/30">
        <video
          key={sign.primaryMedia.url}
          src={sign.primaryMedia.url}
          poster={sign.primaryMedia.posterUrl}
          autoPlay
          muted
          loop
          playsInline
          controls
          preload="auto"
          className="w-full aspect-video bg-black"
          aria-label="Дохионы видео"
        />
        <div className="px-6 py-5 text-center">
          <p className="text-2xl font-semibold tracking-tight text-ink-800 dark:text-parchment-50">{sign.headword}</p>
          {sign.meanings.length > 1 && (
            <p className="text-ink-500 dark:text-ink-200 mt-1 text-sm italic">{sign.meanings.slice(1).join(', ')}</p>
          )}
        </div>
      </div>

      {phase === 'answer' && selectedRating !== null && (
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-wider text-ink-500 dark:text-ink-200 text-center">
            Үнэлгээ: <span className="text-ink-800 dark:text-parchment-50 font-semibold normal-case">{RATING_BUTTONS.find((b) => b.rating === selectedRating)?.label}</span>
          </p>
          <button
            onClick={handleNext}
            className="w-full py-3 rounded-md bg-ink-800 text-parchment-50 font-medium hover:bg-ink-700 dark:bg-brass-600 dark:text-ink-900 dark:hover:bg-brass-500 transition focus-ring"
          >
            {current + 1 >= queue.length ? 'Дахин үзэх дуусгах' : 'Дараах'}
            <ChevronRight className="inline h-4 w-4 ml-1" />
          </button>
        </div>
      )}

      {phase === 'question' && (
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-wider text-ink-500 dark:text-ink-200 text-center">Дохиог хэрхэн санаж байна?</p>
          <div className="grid grid-cols-3 gap-2">
            {RATING_BUTTONS.map(({ rating, label, icon: Icon }) => (
              <button
                key={rating}
                onClick={() => { void handleRating(rating); }}
                className="py-4 rounded-md border rule font-medium transition focus-ring flex flex-col items-center gap-2 hover:border-ink-700 hover:bg-ink-50 dark:hover:border-brass-500 dark:hover:bg-ink-800 text-ink-700 dark:text-parchment-50"
              >
                <Icon className="h-5 w-5" />
                <span className="text-sm">{label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
