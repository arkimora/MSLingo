import { useEffect, useState } from 'react';
import { loadFingerspelling } from '../content/loader';
import { Hand, X } from 'lucide-react';
import { GridSkeleton } from '../components/Skeleton';
import type { FingerspellingEntry } from '../content/schema';

export default function Fingerspelling() {
  const [entries, setEntries] = useState<FingerspellingEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<FingerspellingEntry | null>(null);

  useEffect(() => {
    loadFingerspelling()
      .then(setEntries)
      .catch((e) => setError(e instanceof Error ? e.message : 'Ачааллаж чадсангүй'));
  }, []);

  // Close modal on Escape
  useEffect(() => {
    if (!selected) return;
    const handler = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') setSelected(null);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selected]);

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
    <>
      <div className="space-y-6 max-w-4xl mx-auto">
        <header className="border-b rule pb-6">
          <p className="text-xs uppercase tracking-[0.25em] text-brass-700 dark:text-brass-400 mb-2">Хуруу</p>
          <h1 className="text-3xl font-semibold tracking-tight text-ink-800 dark:text-parchment-50 flex items-center gap-3">
            <Hand className="h-7 w-7 text-ink-700 dark:text-parchment-100" />
            Хурууны үсэг
          </h1>
          <p className="text-sm text-ink-500 dark:text-ink-200 mt-2">
            Монгол хурууны үсгээр дохио. Дарж үзэх. Эх сурвалж: mnsl.mn.
          </p>
        </header>

        {entries.length === 0 ? (
          <p className="text-center text-ink-400 dark:text-ink-300 py-16">
            Хурууны үсгийн мэдээлэл хараахан бэлэн болоогүй байна.
          </p>
        ) : (
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-px bg-ink-100 dark:bg-ink-700 border rule rounded-md overflow-hidden">
            {entries.map((entry) => (
              <button
                key={entry.letter}
                onClick={() => setSelected(entry)}
                className="bg-parchment-50 dark:bg-ink-800 text-center hover:brightness-90 dark:hover:brightness-110 transition focus:outline-none focus:ring-2 focus:ring-brass-600 focus:z-10"
                aria-label={`Хурууны ${entry.letter}`}
              >
                {entry.media.posterUrl ? (
                  <img
                    src={entry.media.posterUrl}
                    alt={`Хурууны ${entry.letter}`}
                    className="w-full aspect-square object-contain bg-black"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full aspect-square bg-ink-200 dark:bg-ink-600" />
                )}
                <p className="py-2 font-serif text-lg font-semibold text-ink-800 dark:text-parchment-50">{entry.letter}</p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Video modal */}
      {selected && (
        <VideoModal
          entry={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}

function VideoModal({ entry, onClose }: { entry: FingerspellingEntry; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Хурууны ${entry.letter}`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-ink-900/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-sm rounded-md overflow-hidden bg-black border border-ink-700 shadow-2xl">
        <video
          key={entry.media.id}
          src={entry.media.url}
          poster={entry.media.posterUrl}
          autoPlay
          muted
          loop
          playsInline
          controls
          preload="auto"
          className="w-full aspect-video"
        />
        <button
          onClick={onClose}
          className="absolute top-2 right-2 p-1.5 rounded-full bg-ink-900/70 text-parchment-50 hover:bg-ink-900 transition"
          aria-label="Хаах"
        >
          <X className="h-4 w-4" />
        </button>
        <p className="py-3 text-center font-serif text-2xl font-semibold text-parchment-50 bg-ink-800">
          {entry.letter}
        </p>
      </div>
    </div>
  );
}
