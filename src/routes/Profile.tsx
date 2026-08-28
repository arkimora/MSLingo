import { useState, useEffect } from 'react';
import { Flame, Star, TrendingUp, BookOpen, Trophy } from 'lucide-react';
import { progress, xpToLevel, type UserProfile } from '../lib/progress/store';
import { loadMeta } from '../content/loader';
import { LoadingSpinner } from '../components/LoadingSpinner';

export default function Profile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [meta, setMeta] = useState<{ statistics: { signs: number; topics: number; examples: number }; importedAt: string } | null>(null);
  const [achievements, setAchievements] = useState<{ id: string; unlockedAt: string }[]>([]);

  useEffect(() => {
    (async () => {
      const [p, m] = await Promise.all([
        progress.getProfile(),
        loadMeta(),
      ]);
      setProfile(p);
      setMeta({ statistics: m.statistics, importedAt: m.importedAt });
      const a = await progress.listAchievements();
      setAchievements(a);
    })();
  }, []);

  if (!profile || !meta) return <LoadingSpinner />;

  const { level, intoLevel, nextLevelAt } = xpToLevel(profile.xp);
  const percent = Math.round((intoLevel / nextLevelAt) * 100);

  return (
    <div className="space-y-10 max-w-2xl mx-auto">
      <header className="border-b rule pb-6">
        <p className="text-xs uppercase tracking-[0.25em] text-brass-700 dark:text-brass-400 mb-2">Профайл</p>
        <h1 className="text-3xl font-semibold tracking-tight text-ink-800 dark:text-parchment-50">
          Миний ахиц
        </h1>
        <p className="text-sm text-ink-500 dark:text-ink-200 mt-2 max-w-prose">
          Локал профайл — өгөгдөл таны төхөөрөмж дээр хадгаллагдсан.
        </p>
      </header>

      {/* Level card */}
      <section className="rounded-md border rule p-6 bg-ink-50 dark:bg-ink-800/40">
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-xs uppercase tracking-wider text-ink-400 dark:text-ink-300">Түвшин</p>
            <p className="font-serif text-5xl font-semibold text-ink-800 dark:text-parchment-50 leading-none mt-1 tabular-nums">{level}</p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-wider text-ink-400 dark:text-ink-300">Нийт XP</p>
            <p className="font-mono text-2xl text-brass-700 dark:text-brass-400 tabular-nums">{profile.xp.toLocaleString()}</p>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-ink-500 dark:text-ink-200 tabular-nums">
            <span>{intoLevel.toLocaleString()} / {nextLevelAt.toLocaleString()} XP</span>
            <span>{percent}%</span>
          </div>
          <div className="h-1 bg-ink-200 dark:bg-ink-700 overflow-hidden">
            <div
              className="h-full bg-ink-800 dark:bg-brass-500 transition-all duration-700"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-2 gap-px bg-ink-100 dark:bg-ink-700 border rule rounded-md overflow-hidden">
        <Stat icon={Flame} label="Стреак" value={`${profile.streakDays}`} unit="өдөр" accent />
        <Stat icon={TrendingUp} label="Өнөөдөр" value={`${profile.dailyGoalProgress}`} unit="XP" />
        <Stat icon={BookOpen} label="Суралцсан" value={`${profile.totalSignsLearned}`} unit="дохио" />
        <Stat icon={Star} label="Нийт" value={`${profile.xp.toLocaleString()}`} unit="XP" />
      </section>

      {/* Daily goal */}
      <section className="border rule rounded-md p-5">
        <div className="flex justify-between items-baseline mb-3">
          <p className="text-xs uppercase tracking-wider text-ink-500 dark:text-ink-200">Өдөр тутмын зорилго</p>
          <p className="font-mono text-sm tabular-nums text-ink-700 dark:text-parchment-50">
            {profile.dailyGoalProgress} / {profile.dailyGoalXp}
          </p>
        </div>
        <div className="h-1.5 bg-ink-100 dark:bg-ink-700 overflow-hidden">
          <div
            className={`h-full transition-all duration-700 ${
              profile.dailyGoalProgress >= profile.dailyGoalXp
                ? 'bg-ink-800 dark:bg-brass-500'
                : 'bg-brass-600 dark:bg-brass-400'
            }`}
            style={{ width: `${Math.min(100, (profile.dailyGoalProgress / profile.dailyGoalXp) * 100)}%` }}
          />
        </div>
        {profile.dailyGoalProgress >= profile.dailyGoalXp && (
          <p className="mt-3 text-sm text-brass-700 dark:text-brass-400 font-medium">
            Зорилго биеллээ.
          </p>
        )}
      </section>

      {/* Achievements */}
      <section className="border rule rounded-md">
        <div className="flex items-center gap-2 px-5 py-3 border-b rule">
          <Trophy className="h-4 w-4 text-brass-600 dark:text-brass-400" />
          <p className="text-xs uppercase tracking-wider font-semibold text-ink-700 dark:text-parchment-50">Амжилтууд</p>
        </div>
        <div className="p-5">
          {achievements.length === 0 ? (
            <p className="text-sm text-ink-400 dark:text-ink-300 text-center py-4">Одоогоор ямар ч амжилт байхгүй.</p>
          ) : (
            <ul className="divide-y rule">
              {achievements.map((a) => (
                <li key={a.id} className="flex items-center gap-3 py-2.5">
                  <Trophy className="h-3.5 w-3.5 text-brass-500 shrink-0" />
                  <span className="text-sm text-ink-700 dark:text-parchment-50">{a.id}</span>
                  <span className="ml-auto text-xs text-ink-400 dark:text-ink-300 tabular-nums">
                    {new Date(a.unlockedAt).toLocaleDateString('mn-MN')}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Source info */}
      <section className="border-t rule pt-6 text-xs text-ink-400 dark:text-ink-300">
        <p className="uppercase tracking-wider mb-2">Агуулгын мэдээ</p>
        <ul className="grid grid-cols-2 sm:grid-cols-4 gap-3 tabular-nums">
          <li><span className="text-ink-300 dark:text-ink-300">Дохио</span> <span className="text-ink-700 dark:text-parchment-50">{meta.statistics.signs.toLocaleString()}</span></li>
          <li><span className="text-ink-300 dark:text-ink-300">Сэдэв</span> <span className="text-ink-700 dark:text-parchment-50">{meta.statistics.topics}</span></li>
          <li><span className="text-ink-300 dark:text-ink-300">Жишээ</span> <span className="text-ink-700 dark:text-parchment-50">{meta.statistics.examples}</span></li>
          <li><span className="text-ink-300 dark:text-ink-300">Импорт</span> <span className="text-ink-700 dark:text-parchment-50">{new Date(meta.importedAt).toLocaleDateString('mn-MN')}</span></li>
        </ul>
      </section>
    </div>
  );
}

function Stat({ icon: Icon, label, value, unit, accent }: { icon: typeof Flame; label: string; value: string; unit: string; accent?: boolean }) {
  return (
    <div className="bg-parchment-50 dark:bg-ink-800 p-5">
      <div className="flex items-start justify-between mb-2">
        <p className="text-xs uppercase tracking-wider text-ink-400 dark:text-ink-300">{label}</p>
        <Icon className={`h-3.5 w-3.5 ${accent ? 'text-brass-600 dark:text-brass-400' : 'text-ink-300 dark:text-ink-300'}`} />
      </div>
      <p className="font-serif text-2xl font-semibold text-ink-800 dark:text-parchment-50 tabular-nums leading-none">{value}</p>
      <p className="text-xs text-ink-400 dark:text-ink-300 mt-1">{unit}</p>
    </div>
  );
}
