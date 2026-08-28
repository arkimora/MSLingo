import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ArrowRight, Flame, BookOpen, RotateCcw, GraduationCap } from 'lucide-react';
import { loadMeta } from '../content/loader';
import { progress } from '../lib/progress/store';
import { HomeSkeleton } from '../components/Skeleton';

export default function Home() {
  const [meta, setMeta] = useState<{ signs: number; topics: number } | null>(null);
  const [stats, setStats] = useState({ dueCount: 0, learned: 0, xp: 0, streak: 0 });

  useEffect(() => {
    (async () => {
      const m = await loadMeta();
      setMeta({ signs: m.statistics.signs, topics: m.statistics.topics });
      const profile = await progress.getProfile();
      const due = await progress.dueForReview();
      setStats({
        dueCount: due.length,
        learned: profile.totalSignsLearned,
        xp: profile.xp,
        streak: profile.streakDays,
      });
    })();
  }, []);

  if (!meta) return <HomeSkeleton />;

  return (
    <div className="space-y-10">
      {/* Hero */}
      <section className="border-b rule pb-10">
        <p className="text-xs uppercase tracking-[0.25em] text-brass-700 dark:text-brass-400 mb-3">№ I</p>
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-ink-800 dark:text-parchment-50 text-balance">
          Монгол дохионы хэл
        </h1>
        <p className="mt-4 text-lg text-ink-500 dark:text-ink-200 max-w-2xl text-balance">
          mnsl.mn-ийн толь бичгээс бүтэцтэйгээр суралц.{' '}
          <span className="text-ink-700 dark:text-parchment-50 font-medium">
            {meta.signs.toLocaleString()} дохио, {meta.topics} сэдэв.
          </span>
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link
            to="/learn"
            className="inline-flex items-center gap-2 bg-ink-800 text-parchment-50 font-medium px-5 py-2.5 rounded-md hover:bg-ink-700 transition focus-ring dark:bg-brass-600 dark:text-ink-900 dark:hover:bg-brass-500"
          >
            <GraduationCap className="h-4 w-4" />
            Суралцаж эхлэх
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/review"
            className="inline-flex items-center gap-2 border rule text-ink-700 dark:text-parchment-50 font-medium px-5 py-2.5 rounded-md hover:bg-ink-50 dark:hover:bg-ink-800 transition focus-ring"
          >
            <RotateCcw className="h-4 w-4" />
            Дахин үзэх
            {stats.dueCount > 0 && (
              <span className="ml-1 bg-brass-100 dark:bg-brass-900/50 text-brass-800 dark:text-brass-200 px-2 py-0.5 rounded-full text-xs font-semibold tabular-nums">
                {stats.dueCount}
              </span>
            )}
          </Link>
        </div>
      </section>

      {/* Stats — editorial 3-column */}
      <section className="grid sm:grid-cols-3 gap-px bg-ink-100 dark:bg-ink-700 border rule rounded-xl overflow-hidden">
        <StatTile icon={Flame} label="Стреак" value={stats.streak} unit="өдөр" />
        <StatTile icon={GraduationCap} label="Суралцсан" value={stats.learned} unit="дохио" />
        <StatTile icon={BookOpen} label="Нийт" value={meta.signs} unit="дохио" />
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between border-b rule pb-3">
          <h2 className="text-2xl font-semibold tracking-tight text-ink-800 dark:text-parchment-50">Хурдан хандалт</h2>
          <p className="text-xs uppercase tracking-wider text-ink-400 dark:text-ink-300">Бүлэг</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-ink-100 dark:bg-ink-700 border rule rounded-xl overflow-hidden">
          <QuickLink to="/dictionary" title="Толь бичиг" desc="1,398+ дохио хайх, үзэх" index="01" />
          <QuickLink to="/fingerspelling" title="Хурууны үсэг" desc="Монгол цагаан толгойн дохио" index="02" />
          <QuickLink to="/numbers" title="Тоо" desc="Тоон дохио сурах" index="03" />
          <QuickLink to="/grammar" title="Дүрэм" desc="MSL дүрэм, бүтэц" index="04" />
          <QuickLink to="/info" title="Мэдээлэл" desc="MSL ба сонсголгүйн соёл" index="05" />
          <QuickLink to="/profile" title="Миний ахиц" desc="XP, стреак, амжилт" index="06" />
        </div>
      </section>
    </div>
  );
}

function StatTile({ icon: Icon, label, value, unit }: { icon: typeof Flame; label: string; value: number; unit: string }) {
  return (
    <div className="bg-parchment-50 dark:bg-ink-800 p-6 flex items-start justify-between">
      <div>
        <p className="text-xs uppercase tracking-wider text-ink-400 dark:text-ink-300 mb-2">{label}</p>
        <p className="text-4xl font-serif tabular-nums text-ink-800 dark:text-parchment-50 leading-none">{value}</p>
        <p className="text-xs text-ink-400 dark:text-ink-300 mt-1">{unit}</p>
      </div>
      <Icon className="h-5 w-5 text-brass-600 dark:text-brass-400 mt-1" />
    </div>
  );
}

function QuickLink({ to, title, desc, index }: { to: string; title: string; desc: string; index: string }) {
  return (
    <Link
      to={to}
      className="group bg-parchment-50 dark:bg-ink-800 p-5 hover:bg-parchment-100 dark:hover:bg-ink-700 transition"
    >
      <div className="flex items-baseline justify-between mb-3">
        <span className="text-xs font-serif tabular-nums text-ink-300 dark:text-ink-300">{index}</span>
        <ArrowRight className="h-4 w-4 text-ink-300 group-hover:text-brass-700 group-hover:translate-x-0.5 transition" />
      </div>
      <p className="font-semibold text-ink-800 dark:text-parchment-50">{title}</p>
      <p className="text-sm text-ink-500 dark:text-ink-200 mt-1">{desc}</p>
    </Link>
  );
}
