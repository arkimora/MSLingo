import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Sliders, Eye, Volume2, Type, Target } from 'lucide-react';
import { progress, type Settings } from '../lib/progress/store';
import { ThemeSwitcher } from '../components/ThemeSwitcher';

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);

  useEffect(() => {
    progress.getSettings().then(setSettings);
  }, []);

  async function update(patch: Partial<Settings>) {
    if (!settings) return;
    const next = await progress.updateSettings(patch);
    setSettings(next);
    if ('reducedMotion' in patch) {
      window.dispatchEvent(new CustomEvent('mslingo:settings-changed', { detail: patch }));
    }
  }

  if (!settings) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="h-8 w-8 rounded-full border-2 border-ink-200 border-t-brass-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <header className="border-b rule pb-6">
        <p className="text-xs uppercase tracking-[0.2em] text-ink-400 dark:text-ink-300 mb-2">Тохиргоо</p>
        <h1 className="text-3xl font-semibold tracking-tight text-ink-800 dark:text-parchment-50">
          Тохиргоо
        </h1>
        <p className="text-sm text-ink-500 dark:text-ink-300 mt-2 max-w-prose">
          Аппын хараа, дуу, сэдэв. Бүх тохиргоо локал хадгаллагдана — серверт илгээгдэхгүй.
        </p>
      </header>

      <Section icon={Eye} title="Хараа" description="Өнгө, текст, дэлгэцийн тохиргоо">
        <div className="rounded-xl border rule p-5 space-y-4">
          <div>
            <p className="font-medium text-ink-800 dark:text-parchment-50">Харааны горим</p>
            <p className="text-sm text-ink-400 dark:text-ink-300 mb-3">Цайвар эсвэл бараан, эсвэл системийн тохиргоог дагах</p>
            <ThemeSwitcher
              value={settings.theme}
              onChange={(t) => update({ theme: t })}
            />
          </div>
        </div>
      </Section>

      <Section icon={Volume2} title="Хичээл" description="Видео болон хөдөлгөөний тохиргоо">
        <SettingToggle
          label="Видео автоматаар тоглуулах"
          description="Дохионы видеог автоматаар тоглуулах"
          checked={settings.autoplayVideos}
          onChange={(v) => update({ autoplayVideos: v })}
        />
        <SettingToggle
          label="Хөдөлгөөн багасгах"
          description="Анимаци болон шилжилтийг багасгах"
          checked={settings.reducedMotion}
          onChange={(v) => update({ reducedMotion: v })}
        />
      </Section>

      <Section icon={Type} title="Текст" description="Бичгийн харагдац">
        <SettingToggle
          label="Монгол цагаан толгой харуулах"
          description="Традицион монгол бичгийг дохионы хуудсанд харуулах"
          checked={settings.showMongolianScript}
          onChange={(v) => update({ showMongolianScript: v })}
        />
      </Section>

      <Section icon={Target} title="Зорилго" description="Өдөр тутмын ахицын зорилго">
        <div className="rounded-xl border rule p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="font-medium text-ink-800 dark:text-parchment-50">Өдөр тутмын дахин үзэх зорилго</p>
              <p className="text-sm text-ink-400 dark:text-ink-300">XP нэгжээр</p>
            </div>
            <span className="font-semibold text-2xl font-serif text-brass-700 dark:text-brass-400 tabular-nums">{settings.dailyReviewGoal}</span>
          </div>
          <input
            type="range"
            min="5"
            max="100"
            step="5"
            value={settings.dailyReviewGoal}
            onChange={(e) => update({ dailyReviewGoal: Number(e.target.value) })}
            className="w-full accent-brass-600"
          />
          <div className="flex justify-between text-xs text-ink-400 dark:text-ink-300 mt-1 tabular-nums">
            <span>5 XP</span>
            <span>100 XP</span>
          </div>
        </div>
      </Section>
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: typeof Sliders;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-md bg-ink-50 dark:bg-ink-800 border rule flex items-center justify-center">
          <Icon className="h-4 w-4 text-ink-500 dark:text-ink-200" />
        </div>
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-700 dark:text-parchment-50">
            {title}
          </h2>
          <p className="text-xs text-ink-400 dark:text-ink-300">{description}</p>
        </div>
      </div>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function SettingToggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="rounded-xl border rule p-4 flex items-center justify-between bg-parchment-50/50 dark:bg-ink-800/30">
      <div>
        <p className="font-medium text-ink-800 dark:text-parchment-50">{label}</p>
        <p className="text-sm text-ink-400 dark:text-ink-300 mt-0.5">{description}</p>
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only peer"
        />
        <div
          className={`w-11 h-6 rounded-full transition-colors peer-focus:ring-2 peer-focus:ring-brass-500 peer-focus:ring-offset-2 dark:peer-focus:ring-offset-ink-900
          ${checked
            ? 'bg-ink-800 dark:bg-brass-600'
            : 'bg-ink-100 dark:bg-ink-700'
          }`}
        >
          <div
            className={`absolute top-0.5 left-0.5 bg-parchment-50 rounded-full h-5 w-5 shadow transition-transform ${
              checked ? 'translate-x-5' : ''
            }`}
          />
        </div>
      </label>
    </div>
  );
}
