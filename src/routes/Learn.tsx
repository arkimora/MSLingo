import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, ChevronRight } from 'lucide-react';
import { loadContent, type ContentBundle } from '../content/loader';
import { progress } from '../lib/progress/store';
import { reviewCard, newSignMastery } from '../lib/srs';
import { LearnSkeleton } from '../components/Skeleton';

const LESSON_SIZE = 5;

export default function Learn() {
  const [content, setContent] = useState<ContentBundle | null>(null);
  const [session, setSession] = useState<{
    queue: number[];
    current: number;
    phase: 'question' | 'answer';
    choices: number[];
    selected: number | null;
    correct: boolean;
    xp: number;
  } | null>(null);
  const [emptyState, setEmptyState] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const c = await loadContent();
      setContent(c);
    })();
  }, []);

  const startSession = useCallback(async (signs: ContentBundle['signs']) => {
    const newIds = await progress.newSigns(LESSON_SIZE);
    if (newIds.length === 0) {
      setEmptyState(true);
      return;
    }
    const shuffled = [...newIds].sort(() => Math.random() - 0.5);
    const sign = signs.find((s) => s.id === shuffled[0]);
    if (!sign) {
      setEmptyState(true);
      return;
    }
    setSession({
      queue: shuffled,
      current: 0,
      phase: 'question',
      choices: buildChoices(signs, sign.id),
      selected: null,
      correct: false,
      xp: 0,
    });
  }, []);

  useEffect(() => {
    if (content && !session && !emptyState) {
      void startSession(content.signs);
    }
  }, [content, session, emptyState, startSession]);

  function buildChoices(signs: ContentBundle['signs'], correctId: number): number[] {
    const others = signs
      .filter((s) => s.id !== correctId)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map((s) => s.id);
    return [...others, correctId].sort(() => Math.random() - 0.5);
  }

  const handleSelect = useCallback((choiceId: number) => {
    if (!session || session.phase !== 'question' || !content) return;
    const sign = content.signs.find((s) => s.id === session.queue[session.current]);
    if (!sign) return;
    const correct = choiceId === sign.id;
    setSession((prev) => prev ? { ...prev, selected: choiceId, correct, phase: 'answer' } : null);
  }, [session, content]);

  const handleContinue = useCallback(async () => {
    if (!session || !content) return;
    const sign = content.signs.find((s) => s.id === session.queue[session.current]);
    if (!sign) return;
    const earnedXp = session.correct ? 10 : 0;

    const mastery = await progress.getMastery(sign.id) ?? newSignMastery(sign.id);
    const rating = session.correct ? 3 : 1;
    const { mastery: updated } = reviewCard(mastery, rating);
    await progress.upsertMastery(updated);
    await progress.logReview({
      signId: sign.id,
      rating,
      reviewedAt: new Date().toISOString(),
      prevState: mastery.state,
      newState: updated.state,
    });

    if (session.correct) {
      const profile = await progress.getProfile();
      await progress.updateProfile({
        xp: profile.xp + earnedXp,
        dailyGoalProgress: profile.dailyGoalProgress + earnedXp,
      });
    }

    const next = session.current + 1;
    if (next >= session.queue.length) {
      const profile = await progress.getProfile();
      await progress.updateProfile({ totalSignsLearned: profile.totalSignsLearned + session.queue.length });
      setSession(null);
      navigate('/profile');
      return;
    }

    const nextSign = content.signs.find((s) => s.id === session.queue[next]);
    if (!nextSign) return;
    setSession((prev) => prev ? {
      ...prev,
      current: next,
      phase: 'question',
      selected: null,
      correct: false,
      xp: prev.xp + earnedXp,
      choices: buildChoices(content.signs, nextSign.id),
    } : null);
  }, [session, content, navigate]);

  if (!content) return <LearnSkeleton />;

  if (emptyState) {
    return (
      <div className="text-center py-20 space-y-3">
        <h1 className="text-2xl font-semibold tracking-tight">Шинэ дохио байхгүй</h1>
        <p className="text-ink-500 dark:text-ink-200">Өнөөдөр бүх шинэ дохио үзсэн. Дахин үзэх хэсгээс хичээлээ үргэлжлүүлээрэй.</p>
        <button
          onClick={() => navigate('/review')}
          className="mt-4 px-5 py-2.5 rounded-md bg-ink-800 text-parchment-50 font-medium hover:bg-ink-700 dark:bg-brass-600 dark:text-ink-900 dark:hover:bg-brass-500 transition"
        >
          Дахин үзэх рүү очих
        </button>
      </div>
    );
  }

  if (!session) return <LearnSkeleton />;

  const sign = content.signs.find((s) => s.id === session.queue[session.current])!;
  const progress_ = session.current + 1;

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="space-y-2">
        <div className="flex justify-between text-xs uppercase tracking-wider">
          <span className="text-ink-500 dark:text-ink-200">Хичээл <span className="font-serif tabular-nums text-ink-800 dark:text-parchment-50">{progress_}/{session.queue.length}</span></span>
          <span className="text-brass-700 dark:text-brass-400 font-mono tabular-nums">+{session.xp} XP</span>
        </div>
        <div className="h-px bg-ink-100 dark:bg-ink-700 relative overflow-hidden">
          <div
            className="h-full bg-ink-800 dark:bg-brass-500 transition-all duration-500"
            style={{ width: `${(progress_ / session.queue.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="rounded-md border rule overflow-hidden bg-parchment-50/30 dark:bg-ink-800/30">
        <div className="px-5 py-3 border-b rule">
          <p className="text-xs uppercase tracking-wider text-ink-500 dark:text-ink-200 text-center">Асуулт</p>
          <p className="font-semibold tracking-tight text-center mt-1">Энэ дохио ямар утгатай вэ?</p>
        </div>
        <video
          src={sign.primaryMedia.url}
          poster={sign.primaryMedia.posterUrl}
          autoPlay
          muted
          loop
          playsInline
          controls
          className="w-full aspect-video bg-black"
          aria-label="Дохионы видео"
        />
        <div className="p-4 space-y-2">
          {session.choices.map((choiceId) => {
            const choiceSign = content.signs.find((s) => s.id === choiceId)!;
            const isSelected = session.selected === choiceId;
            const isCorrect = choiceId === sign.id;
            return (
              <button
                key={choiceId}
                onClick={() => handleSelect(choiceId)}
                disabled={session.phase === 'answer'}
                className={`w-full text-left px-4 py-3 rounded-md border font-medium transition focus-ring ${
                  session.phase === 'answer'
                    ? isCorrect
                      ? 'border-ink-800 bg-ink-50 dark:bg-ink-700/50 dark:border-brass-500 text-ink-800 dark:text-parchment-50'
                      : isSelected
                        ? 'border-red-700 bg-red-50/50 dark:bg-red-900/20 dark:border-red-400 text-red-800 dark:text-red-200 line-through opacity-80'
                        : 'border rule opacity-40'
                    : 'border rule hover:border-ink-700 hover:bg-ink-50 dark:hover:border-brass-500 dark:hover:bg-ink-800 text-ink-700 dark:text-parchment-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>{choiceSign.headword}</span>
                  {session.phase === 'answer' && isCorrect && <CheckCircle className="h-4 w-4 text-ink-800 dark:text-brass-400" />}
                  {session.phase === 'answer' && isSelected && !isCorrect && <XCircle className="h-4 w-4 text-red-700 dark:text-red-400" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {session.phase === 'answer' && (
        <div className="space-y-3">
          <div className={`rounded-md p-4 border ${
            session.correct
              ? 'border-ink-800 bg-ink-50 dark:bg-ink-800/50 dark:border-brass-500'
              : 'border-red-700 bg-red-50/50 dark:bg-red-900/20 dark:border-red-400'
          }`}>
            <p className="font-semibold text-lg tracking-tight">
              {session.correct ? 'Зөв. +10 XP' : 'Буруу.'}
            </p>
            {!session.correct && (
              <p className="text-sm mt-1 text-ink-600 dark:text-ink-200">
                Зөв хариулт: <span className="font-medium text-ink-800 dark:text-parchment-50">{sign.headword}</span>
              </p>
            )}
          </div>
          <button
            onClick={handleContinue}
            className="w-full flex items-center justify-center gap-2 bg-ink-800 text-parchment-50 font-medium py-3 rounded-md hover:bg-ink-700 dark:bg-brass-600 dark:text-ink-900 dark:hover:bg-brass-500 transition focus-ring"
          >
            {progress_ < session.queue.length ? 'Дараах' : 'Хичээл дуусгах'}
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
