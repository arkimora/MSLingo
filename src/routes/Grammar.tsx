import { loadContent } from '../content/loader';
import { Library } from 'lucide-react';

export default function Grammar() {
  const { grammar } = loadContent();

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

      {grammar.length === 0 ? (
        <p className="text-center text-ink-400 dark:text-ink-300 py-16">npm run sync:mnsl ажиллуулсны дараа агуулга гарч ирнэ.</p>
      ) : (
        <div className="divide-y rule border rule rounded-md overflow-hidden">
          {grammar.map((topic) => (
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
      )}
    </div>
  );
}
