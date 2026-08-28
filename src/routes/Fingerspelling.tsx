import { useEffect, useState } from 'react';
import { loadFingerspelling } from '../content/loader';
import { Hand } from 'lucide-react';
import { GridSkeleton } from '../components/Skeleton';
import type { FingerspellingEntry } from '../content/schema';

export default function Fingerspelling() {
  const [entries, setEntries] = useState<FingerspellingEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadFingerspelling()
      .then(setEntries)
      .catch((e) => setError(e instanceof Error ? e.message : 'Ачааллаж чадсангүй'));
  }, []);

  if (error) {
    return (
      <div className="text-center py-20 space-y-3">
        <p className="text-ink-500 dark:text-ink-200">Ачааллаж чадсангүй</p>
        <p className="text-xs font-mono text-ink-300">{error}</p>
        <button onClick={() => window.location.reload()} className="text-brass-700 dark:text-brass-400 hover:underline">
          Дахин оролдох
        </button>
      </div>
    );
  }

  if (!entries) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <header className="border-b rule pb-6">
          <p className="text-xs uppercase tracking-[0.25em] text-brass-700 dark:text-brass-400 mb-2">Хуруу</p>
          <h1 className="text-3xl font-semibold tracking-tight text-ink-800 dark:text-parchment-50 flex items-center gap-3">
            <Hand className="h-7 w-7 text-ink-700 dark:text-parchment-100" />
            Хурууны үсэг
          </h1>
        </header>
        <GridSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <header className="border-b rule pb-6">
        <p className="text-xs uppercase tracking-[0.25em] text-brass-700 dark:text-brass-400 mb-2">Хуруу</p>
        <h1 className="text-3xl font-semibold tracking-tight text-ink-800 dark:text-parchment-50 flex items-center gap-3">
          <Hand className="h-7 w-7 text-ink-700 dark:text-parchment-100" />
          Хурууны үсэг
        </h1>
        <p className="text-sm text-ink-500 dark:text-ink-200 mt-2">
          Монгол хурууны үсгээр дохио. Эх сурвалж: mnsl.mn.
        </p>
      </header>

      {entries.length === 0 ? (
        <p className="text-center text-ink-400 dark:text-ink-300 py-16">
          Хурууны үсгийн мэдээлэл хараахан бэлэн болоогүй байна.
        </p>
      ) : (
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-px bg-ink-100 dark:bg-ink-700 border rule rounded-md overflow-hidden">
          {entries.map((entry) => (
            <div
              key={entry.letter}
              className="bg-parchment-50 dark:bg-ink-800 text-center"
            >
              {entry.media.url && (
                <video
                  key={`v-${entry.media.id}`}
                  src={entry.media.url}
                  poster={entry.media.posterUrl}
                  autoPlay
                  muted
                  loop
                  playsInline
                  controls
                  preload="metadata"
                  className="w-full aspect-square object-contain bg-black"
                  aria-label={`Хурууны ${entry.letter}`}
                />
              )}
              <p className="py-2 font-serif text-lg font-semibold text-ink-800 dark:text-parchment-50">{entry.letter}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
