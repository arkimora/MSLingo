import { useEffect, useState } from 'react';
import { loadContent, type ContentBundle } from '../content/loader';
import { Hand } from 'lucide-react';
import { GridSkeleton } from '../components/Skeleton';

export default function Fingerspelling() {
  const [content, setContent] = useState<ContentBundle | null>(null);

  useEffect(() => {
    void loadContent().then(setContent);
  }, []);

  if (!content) {
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

      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-px bg-ink-100 dark:bg-ink-700 border rule rounded-md overflow-hidden">
        {content.fingerspelling.map((entry) => (
          <div
            key={entry.letter}
            className="bg-parchment-50 dark:bg-ink-800 text-center"
          >
            {entry.media.posterUrl && (
              <img
                src={entry.media.posterUrl}
                alt={`Хурууны ${entry.letter}`}
                className="w-full aspect-square object-contain bg-parchment-100 dark:bg-ink-900"
                loading="lazy"
              />
            )}
            {entry.media.url && (
              <video
                src={entry.media.url}
                poster={entry.media.posterUrl}
                autoPlay
                muted
                loop
                playsInline
                controls
                className="w-full aspect-square"
                aria-label={`Хурууны ${entry.letter}`}
              />
            )}
            <p className="py-2 font-serif text-lg font-semibold text-ink-800 dark:text-parchment-50">{entry.letter}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
