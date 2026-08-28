import { loadContent } from '../content/loader';
import { Info as InfoIcon, ExternalLink } from 'lucide-react';

export default function Info() {
  const { meta } = loadContent();

  const sections = [
    { label: 'Харилцаа ба жам ёсны хэл', url: 'https://mnsl.mn/мэдээлэл/харилцаа-ба-жам-ёсны-хэл/' },
    { label: 'Дохионы хэл ба ярианы хэл', url: 'https://mnsl.mn/мэдээлэл/дохионы-хэл-ба-ярианы-хэл/' },
    { label: 'Сонсголгүй хүмүүс ба дохионы хэлнүүд', url: 'https://mnsl.mn/мэдээлэл/сонсголгүй-хүмүүс-ба-дохионы-хэлнүүд/' },
    { label: 'Дохионы хэлний хэрэглээ ба хувилбар', url: 'https://mnsl.mn/мэдээлэл/дохионы-хэлний-хэрэглээ-ба-хувилбар/' },
    { label: 'Сонсголгүйн соёл', url: 'https://mnsl.mn/мэдээлэл/сонсголгүйн-соёл/' },
    { label: 'Монгол дохионы хэлний хөгжлийн түүх', url: 'https://mnsl.mn/мэдээлэл/монгол-дохионы-хэлний-хөгжлийн-түүх/' },
    { label: 'Талархал', url: 'https://mnsl.mn/мэдээлэл/талархал/' },
  ];

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <header className="border-b rule pb-6">
        <p className="text-xs uppercase tracking-[0.25em] text-brass-700 dark:text-brass-400 mb-2">Мэдээлэл</p>
        <h1 className="text-3xl font-semibold tracking-tight text-ink-800 dark:text-parchment-50 flex items-center gap-3">
          <InfoIcon className="h-7 w-7 text-ink-700 dark:text-parchment-100" />
          Мэдээлэл
        </h1>
        <p className="text-sm text-ink-500 dark:text-ink-200 mt-2 max-w-prose">
          Монгол дохионы хэл, сонсголгүйн соёл, түүх. Эх сурвалж: mnsl.mn.
        </p>
      </header>

      <section>
        <p className="text-xs uppercase tracking-wider text-ink-400 dark:text-ink-300 mb-3">Бүлэг</p>
        <ul className="divide-y rule border rule rounded-md overflow-hidden">
          {sections.map((s, i) => (
            <li key={s.url}>
              <a
                href={s.url}
                target="_blank"
                rel="noreferrer noopener"
                className="flex items-center gap-4 px-5 py-4 hover:bg-ink-50 dark:hover:bg-ink-800 transition group"
              >
                <span className="font-serif tabular-nums text-xs text-ink-300 dark:text-ink-300 w-6 shrink-0">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="font-medium text-ink-800 dark:text-parchment-50 group-hover:text-brass-700 dark:group-hover:text-brass-400 transition">
                  {s.label}
                </span>
                <ExternalLink className="ml-auto h-3.5 w-3.5 text-ink-300 group-hover:text-brass-600 transition" />
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section className="border-t rule pt-6 text-sm text-ink-500 dark:text-ink-200">
        <p className="text-xs uppercase tracking-wider mb-2 text-ink-700 dark:text-parchment-50">Агуулгын талаар</p>
        <p className="leading-relaxed">
          Бүх мэдээлэл нь{' '}
          <a className="underline underline-offset-2 hover:text-brass-700 dark:hover:text-brass-400" href="https://mnsl.mn" target="_blank" rel="noreferrer">
            mnsl.mn
          </a>
          -ийн эх сурвалж бөгөөд MSLingo нь хуулбарлан харуулж байна.
          {meta.statistics.signs > 0 && (
            <> Одоогоор {meta.statistics.signs.toLocaleString()} дохио, {meta.statistics.topics} сэдэвтэй.</>
          )}
        </p>
        <p className="mt-1 text-xs text-ink-400 dark:text-ink-300 tabular-nums">
          Импортлогдсон: {new Date(meta.importedAt).toLocaleDateString('mn-MN')}.
        </p>
      </section>
    </div>
  );
}
