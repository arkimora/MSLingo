import { useEffect, useState } from 'react';
import { loadContent, type ContentBundle } from '../content/loader';
import { Library } from 'lucide-react';
import { Skeleton, SkeletonLine } from '../components/Skeleton';

export default function Grammar() {
  const [content, setContent] = useState<ContentBundle | null>(null);

  useEffect(() => {
    void loadContent().then(setContent);
  }, []);

  if (!content) {
    return (
      <div className="space-y-6 max-w-3xl mx-auto">
        <header className="border-b rule pb-6 space-y-3">
          <Skeleton className="h-3 w-16 rounded" />
          <Skeleton className="h-9 w-32 rounded" />
          <SkeletonLine className="w-72" />
        </header>
        <div className="border rule rounded-md overflow-hidden">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="px-5 py-4 border-b rule last:border-b-0 space-y-2">
              <Skeleton className="h-5 w-48 rounded" />
              <SkeletonLine className="w-full" />
              <SkeletonLine className="w-3/4" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <header className="border-b rule pb-6">
        <p className="text-xs uppercase tracking-[0.25em] text-brass-700 dark:text-brass-400 mb-2">Дүрэм</p>
        <h1 className="text-3xl font-semibold tracking-tight text-ink-800 dark:text-parchment-50 flex items-center gap-3">
          <Library className="h-7 w-7 text-ink-700 dark:text-parchment-100" />
          Дүрэм
        </h1>
        <p className="text-sm text-ink-500 dark:text-ink-200 mt-2">
          Монгол дохионы хэлний дүрэм, бүтэц, амны хөдөлгөөн. Эх сурвалж: mnsl.mn.
        </p>
      </header>

      <div className="divide-y rule border rule rounded-md overflow-hidden">
        {content.grammar.map((topic) => (
          <a
            key={topic.id}
            href={topic.sourceUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="block px-5 py-4 hover:bg-ink-50 dark:hover:bg-ink-800 transition"
          >
            <h2 className="font-semibold text-ink-800 dark:text-parchment-50">{topic.title}</h2>
            <p className="text-sm text-ink-500 dark:text-ink-200 mt-1 line-clamp-2">
              {topic.body.replace(/<[^>]+>/g, '').slice(0, 200)}…
            </p>
          </a>
        ))}
      </div>
    </div>
  );
}
