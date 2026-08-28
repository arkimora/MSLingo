import { useParams, Link } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Heart, ExternalLink } from 'lucide-react';
import { loadContent, findSign, findTopic, signNeighbors } from '../content/loader';
import { progress } from '../lib/progress/store';
import type { Sign } from '../content/schema';
import { SignDetailSkeleton } from '../components/Skeleton';

export default function SignDetail() {
  const { id } = useParams<{ id: string }>();
  const [sign, setSign] = useState<Sign | null>(null);
  const [prev, setPrev] = useState<Sign | null>(null);
  const [next, setNext] = useState<Sign | null>(null);
  const [isFav, setIsFav] = useState(false);
  const [loading, setLoading] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    (async () => {
      if (!id) return;
      const numId = Number(id);
      const found = await findSign(numId);
      setSign(found ?? null);
      if (found) {
        const neighbors = await signNeighbors(found.id);
        if (neighbors.prev) setPrev(neighbors.prev);
        if (neighbors.next) setNext(neighbors.next);
        const favs = await progress.listFavorites();
        setIsFav(favs.includes(found.id));
      }
      setLoading(false);
    })();
  }, [id]);

  const handleFav = async () => {
    if (!sign) return;
    const faved = await progress.toggleFavorite(sign.id);
    setIsFav(faved);
  };

  if (loading) return <SignDetailSkeleton />;

  if (!sign) {
    return (
      <div className="text-center py-20 space-y-3">
        <h1 className="text-2xl font-semibold tracking-tight">Дохио олдсонгүй</h1>
        <p className="text-ink-500 dark:text-ink-200 font-mono text-sm">ID: {id}</p>
        <Link to="/dictionary" className="inline-block text-brass-700 dark:text-brass-400 hover:underline">Толь руу буцах</Link>
      </div>
    );
  }

  const topicLinks = sign.topics.map(async (t) => {
    const topic = await findTopic(t);
    return { slug: t, name: topic?.name ?? t };
  });

  return (
    <article className="space-y-8 max-w-3xl mx-auto">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-ink-400 dark:text-ink-300">
        <Link to="/dictionary" className="hover:text-ink-700 dark:hover:text-parchment-50">Толь</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="font-serif tabular-nums">№ {sign.id}</span>
      </div>

      <header className="border-b rule pb-6 flex items-start justify-between gap-6">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight text-ink-800 dark:text-parchment-50">
            {sign.headword}
          </h1>
          {sign.traditionalScript && (
            <p className="text-lg text-ink-500 dark:text-ink-200 mt-2" dir="ltr">{sign.traditionalScript}</p>
          )}
          {sign.meanings.length > 1 && (
            <p className="text-ink-500 dark:text-ink-200 mt-3 italic">
              {sign.meanings.join(' · ')}
            </p>
          )}
        </div>
        <button
          onClick={handleFav}
          className="mt-1 p-2 rounded-md hover:bg-ink-50 dark:hover:bg-ink-800 transition focus-ring"
          aria-label={isFav ? 'Хадгалахаас хасах' : 'Хадгалах'}
        >
          <Heart className={`h-5 w-5 transition-colors ${isFav ? 'fill-ink-800 text-ink-800 dark:fill-brass-500 dark:text-brass-500' : 'text-ink-300'}`} />
        </button>
      </header>

      <div className="rounded-md overflow-hidden bg-black aspect-video">
        <video
          ref={videoRef}
          key={sign.primaryMedia.url}
          src={sign.primaryMedia.url}
          poster={sign.primaryMedia.posterUrl}
          autoPlay
          muted
          loop
          playsInline
          controls
          className="w-full h-full object-contain"
          aria-label={`${sign.headword} дохионы видео`}
        />
      </div>

      {sign.topics.length > 0 && (
        <section>
          <p className="text-xs uppercase tracking-wider text-ink-400 dark:text-ink-300 mb-3">Сэдэв</p>
          <div className="flex flex-wrap gap-1.5">
            {sign.topics.map((slug) => (
              <Link
                key={slug}
                to={`/dictionary?topic=${encodeURIComponent(slug)}`}
                className="px-3 py-1 rounded-md border rule text-sm text-ink-600 dark:text-ink-200 hover:border-brass-400 hover:text-ink-800 dark:hover:text-parchment-50 dark:hover:border-brass-500 transition"
              >
                {slug}
              </Link>
            ))}
          </div>
        </section>
      )}

      {([
        { label: 'Гарын хэлбэр', items: sign.components.handshape },
        { label: 'Байрлал', items: sign.components.location },
        { label: 'Хөдөлгөөн', items: sign.components.movement },
        { label: 'Алганы чиглэл', items: sign.components.palmOrientation },
        { label: 'Амны хөдөлгөөн', items: sign.components.nonManualMarkers },
      ] as const).some(({ items }) => items.length > 0) && (
        <section>
          <p className="text-xs uppercase tracking-wider text-ink-400 dark:text-ink-300 mb-3">Дохионы бүтэц</p>
          <dl className="divide-y border rule rounded-md overflow-hidden">
            {([
              { label: 'Гарын хэлбэр', items: sign.components.handshape },
              { label: 'Байрлал', items: sign.components.location },
              { label: 'Хөдөлгөөн', items: sign.components.movement },
              { label: 'Алганы чиглэл', items: sign.components.palmOrientation },
              { label: 'Амны хөдөлгөөн', items: sign.components.nonManualMarkers },
            ] as const).map(({ label, items }) => items.length > 0 && (
              <div key={label} className="grid grid-cols-[10rem_1fr] gap-4 px-4 py-3 bg-parchment-50/30 dark:bg-ink-800/30">
                <dt className="text-xs uppercase tracking-wider text-ink-400 dark:text-ink-300 self-center">{label}</dt>
                <dd className="flex flex-wrap gap-1.5">
                  {items.map((c) => (
                    <span key={`${label}-${c.slug}`} className="px-2.5 py-0.5 rounded border rule text-sm text-ink-700 dark:text-parchment-50 font-mono">
                      {c.name}
                    </span>
                  ))}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {sign.variants.length > 0 && (
        <section className="space-y-3">
          {sign.variants.map((v) => (
            <div key={v.type}>
              <p className="text-xs uppercase tracking-wider text-ink-400 dark:text-ink-300 mb-2">
                {v.type === 'different_sign_same_meaning' ? 'Дохио өөр, утга адил' : 'Дохио ижил, утга өөр'}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {v.relatedSignIds.map((rid) => (
                  <Link
                    key={rid}
                    to={`/dictionary/${rid}`}
                    className="px-3 py-1.5 rounded-md border rule text-sm hover:border-ink-700 hover:text-ink-800 dark:hover:border-brass-500 dark:hover:text-parchment-50 transition"
                  >
                    #{rid}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </section>
      )}

      {sign.examples.length > 0 && (
        <section>
          <p className="text-xs uppercase tracking-wider text-ink-400 dark:text-ink-300 mb-3">Жишээ өгүүлбэр</p>
          <ul className="space-y-3">
            {sign.examples.map((ex) => (
              <li key={ex.id} className="rounded-md border rule overflow-hidden">
                {ex.video && (
                  <video
                    src={ex.video.url}
                    poster={ex.video.posterUrl}
                    controls
                    muted
                    playsInline
                    className="w-full aspect-video bg-black"
                    aria-label="Жишээ өгүүлбэрийн видео"
                  />
                )}
                <div className="px-4 py-3">
                  <p className="font-medium">{ex.mongolian}</p>
                  {ex.mslGloss && <p className="text-sm text-ink-500 dark:text-ink-200 mt-1 font-mono">{ex.mslGloss}</p>}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <nav aria-label="Dictionary navigation" className="flex justify-between border-t rule pt-4">
        {prev ? (
          <Link to={`/dictionary/${prev.id}`} className="flex items-center gap-2 text-sm text-ink-500 dark:text-ink-200 hover:text-ink-800 dark:hover:text-parchment-50 transition">
            <ChevronLeft className="h-4 w-4" />
            <span className="max-w-[10rem] truncate">{prev.headword}</span>
          </Link>
        ) : <span />}
        {next ? (
          <Link to={`/dictionary/${next.id}`} className="flex items-center gap-2 text-sm text-ink-500 dark:text-ink-200 hover:text-ink-800 dark:hover:text-parchment-50 transition">
            <span className="max-w-[10rem] truncate">{next.headword}</span>
            <ChevronRight className="h-4 w-4" />
          </Link>
        ) : <span />}
      </nav>

      <a
        href={sign.sourceUrl}
        target="_blank"
        rel="noreferrer noopener"
        className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider text-ink-400 dark:text-ink-300 hover:text-brass-700 dark:hover:text-brass-400 transition"
      >
        <ExternalLink className="h-3.5 w-3.5" />
        mnsl.mn дээр үзэх
      </a>
    </article>
  );
}
