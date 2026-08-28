import { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, BookOpen } from 'lucide-react';
import { loadContent, type ContentBundle } from '../content/loader';
import { search, buildSearchIndex } from '../lib/search';
import type { Sign } from '../content/schema';
import { DictionarySkeleton } from '../components/Skeleton';

const MONGOLIAN_ALPHABET = [
  'А', 'Б', 'В', 'Г', 'Д', 'Е', 'Ё', 'Ж', 'З', 'И', 'Й', 'К', 'Л', 'М',
  'Н', 'О', 'Ө', 'П', 'Р', 'С', 'Т', 'У', 'Ү', 'Ф', 'Х', 'Ц', 'Ч', 'Ш',
  'Щ', 'Ъ', 'Ы', 'Ь', 'Э', 'Ю', 'Я',
];

export default function Dictionary() {
  const [content, setContent] = useState<ContentBundle | null>(null);
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'topic'>('all');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [searchParams] = useSearchParams();

  useEffect(() => {
    (async () => {
      const c = await loadContent();
      buildSearchIndex();
      setContent(c);
      const t = searchParams.get('topic');
      if (t) {
        setActiveTab('topic');
        setSelectedTopic(t);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const filtered = useMemo<Sign[]>(() => {
    if (!content) return [];
    if (activeTab === 'topic' && selectedTopic) {
      return content.signs.filter((s) => s.topics.includes(selectedTopic));
    }
    if (query.trim()) {
      const hits = search(query);
      const ids = new Set(hits.map((h) => h.id));
      return content.signs.filter((s) => ids.has(s.id));
    }
    return content.signs;
  }, [activeTab, selectedTopic, query, content]);

  const grouped = useMemo(() => {
    const g: Record<string, Sign[]> = {};
    for (const s of filtered) {
      const letter = s.headword[0]?.toUpperCase() ?? '#';
      if (!g[letter]) g[letter] = [];
      g[letter].push(s);
    }
    return g;
  }, [filtered]);

  const sortedLetters = Object.keys(grouped).sort((a, b) => {
    const ai = MONGOLIAN_ALPHABET.indexOf(a);
    const bi = MONGOLIAN_ALPHABET.indexOf(b);
    if (ai === -1 && bi === -1) return a.localeCompare(b);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });

  if (!content) return <DictionarySkeleton />;

  return (
    <div className="space-y-6">
      <header className="border-b rule pb-6">
        <p className="text-xs uppercase tracking-[0.25em] text-brass-700 dark:text-brass-400 mb-2">Толь</p>
        <h1 className="text-3xl font-semibold tracking-tight text-ink-800 dark:text-parchment-50 flex items-center gap-3">
          <BookOpen className="h-7 w-7 text-ink-700 dark:text-parchment-100" />
          Толь бичиг
        </h1>
        <p className="text-sm text-ink-500 dark:text-ink-200 mt-2">
          {content.signs.length.toLocaleString()} дохио. Эх сурвалж: mnsl.mn.
        </p>
      </header>

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-300 dark:text-ink-300" />
        <input
          type="search"
          placeholder="Дохио хайх..."
          value={query}
          onChange={(e) => { setQuery(e.target.value); setActiveTab('all'); }}
          className="w-full pl-10 pr-4 py-2.5 rounded-md border rule bg-parchment-50 dark:bg-ink-800 text-ink-800 dark:text-parchment-50 placeholder-ink-300 dark:placeholder-ink-300 focus:outline-none focus:ring-2 focus:ring-brass-600 focus:border-transparent"
        />
      </div>

      <div className="flex gap-6 border-b rule">
        {([
          { id: 'all' as const, label: 'Бүгд' },
          { id: 'topic' as const, label: 'Сэдвээр' },
        ]).map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setQuery(''); }}
            className={`pb-3 -mb-px text-sm font-medium tracking-wide transition-colors border-b-2 ${
              activeTab === tab.id
                ? 'border-ink-800 text-ink-800 dark:border-brass-500 dark:text-brass-400'
                : 'border-transparent text-ink-400 dark:text-ink-300 hover:text-ink-700 dark:hover:text-parchment-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'topic' && (
        <div className="flex flex-wrap gap-1.5">
          {content.topics.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelectedTopic(t.id === selectedTopic ? '' : t.id)}
              className={`px-3 py-1.5 rounded-md text-sm border transition ${
                t.id === selectedTopic
                  ? 'bg-ink-800 text-parchment-50 border-ink-800 dark:bg-brass-600 dark:text-ink-900 dark:border-brass-600'
                  : 'border rule text-ink-600 dark:text-ink-200 hover:border-brass-400 dark:hover:border-brass-500 hover:text-ink-800 dark:hover:text-parchment-50'
              }`}
            >
              {t.name}
              {t.count !== undefined && <span className="ml-1.5 opacity-60 tabular-nums">{t.count}</span>}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 && (
        <p className="text-center text-ink-400 dark:text-ink-300 py-16">"{query}"-т тохирсон дохио олдсонгүй.</p>
      )}

      {activeTab === 'all' && !query && Object.keys(grouped).length > 0 && (
        <div className="space-y-8">
          {sortedLetters.map((letter) => (
            <section key={letter}>
              <h2 className="text-xl font-serif font-semibold text-ink-300 dark:text-ink-300 mb-3 sticky top-16 bg-parchment-50/95 dark:bg-ink-900/95 py-2 backdrop-blur">
                {letter}
              </h2>
              <ul className="divide-y rule">
                {grouped[letter].map((s) => (
                  <SignListItem key={s.id} sign={s} />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      {activeTab === 'topic' && (
        <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-ink-100 dark:bg-ink-700 border rule rounded-md overflow-hidden">
          {filtered.map((s) => (
            <SignListItem key={s.id} sign={s} compact />
          ))}
        </ul>
      )}

      {query && filtered.length > 0 && (
        <ul className="divide-y rule border rule rounded-md overflow-hidden">
          {filtered.map((s) => (
            <SignListItem key={s.id} sign={s} />
          ))}
        </ul>
      )}
    </div>
  );
}

function SignListItem({ sign, compact = false }: { sign: Sign; compact?: boolean }) {
  return (
    <li>
      <Link
        to={`/dictionary/${sign.id}`}
        className="flex items-center gap-3 px-4 py-3 hover:bg-ink-50 dark:hover:bg-ink-800 transition"
      >
        {sign.primaryMedia.posterUrl && !compact && (
          <img
            src={sign.primaryMedia.posterUrl}
            alt=""
            className="h-10 w-10 object-cover rounded border rule flex-shrink-0 bg-ink-100 dark:bg-ink-700"
            loading="lazy"
          />
        )}
        <div className="min-w-0 flex-1">
          <p className="font-medium truncate text-ink-800 dark:text-parchment-50">{sign.headword}</p>
          {!compact && sign.meanings.length > 1 && (
            <p className="text-sm text-ink-500 dark:text-ink-200 truncate">
              {sign.meanings.slice(1).join(', ')}
            </p>
          )}
        </div>
        <span className="text-xs font-serif tabular-nums text-ink-300 dark:text-ink-300">#{sign.id}</span>
      </Link>
    </li>
  );
}
