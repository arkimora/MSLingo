/**
 * Theme switcher — three-card radio group with visual previews.
 */
import { Sun, Moon, Monitor } from 'lucide-react';
import { setTheme } from './ThemeProvider';
import type { Settings } from '@/lib/progress/store';

interface Option {
  value: Settings['theme'];
  label: string;
  desc: string;
  icon: typeof Sun;
  preview: { bg: string; card: string; text: string; accent: string };
}

const OPTIONS: Option[] = [
  {
    value: 'light',
    label: 'Дэнлүүтэй',
    desc: 'Цайвар дэвсгэр, гэрэлтэй',
    icon: Sun,
    preview: { bg: '#fdfcf8', card: '#ffffff', text: '#18171a', accent: '#634c25' },
  },
  {
    value: 'dark',
    label: 'Хүмүүнлэг',
    desc: 'Бараан дэвсгэр, нүдэнд тухтай',
    icon: Moon,
    preview: { bg: '#0e0d10', card: '#18171a', text: '#e8e6e1', accent: '#cdb682' },
  },
  {
    value: 'system',
    label: 'Систем',
    desc: 'Төхөөрөмжийн тохиргоог дагана',
    icon: Monitor,
    preview: { bg: 'linear-gradient(135deg, #fdfcf8 50%, #0e0d10 50%)', card: '#ffffff', text: '#18171a', accent: '#634c25' },
  },
];

export function ThemeSwitcher({ value, onChange }: { value: Settings['theme']; onChange: (v: Settings['theme']) => void }) {
  return (
    <div role="radiogroup" aria-label="Харааны горим" className="grid grid-cols-3 gap-2">
      {OPTIONS.map((opt) => {
        const selected = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={async () => {
              onChange(opt.value);
              await setTheme(opt.value);
            }}
            className={`group relative flex flex-col items-center gap-2 p-3 rounded-xl border transition focus-ring ${
              selected
                ? 'border-brass-700 bg-brass-50 dark:bg-brass-900/20 dark:border-brass-500'
                : 'border-ink-100 dark:border-ink-700 hover:border-brass-400 dark:hover:border-brass-600 bg-white dark:bg-ink-800'
            }`}
          >
            <div
              aria-hidden
              className="w-full aspect-[16/10] rounded-md overflow-hidden border border-ink-100 dark:border-ink-700 relative"
              style={{ background: opt.preview.bg }}
            >
              <div
                className="absolute top-1.5 left-1.5 right-1.5 h-2 rounded-sm"
                style={{ backgroundColor: opt.preview.accent }}
              />
              <div
                className="absolute top-5 left-1.5 right-1.5 bottom-1.5 rounded-sm p-1.5"
                style={{ backgroundColor: opt.preview.card, color: opt.preview.text }}
              >
                <div className="h-1 w-2/3 rounded-sm" style={{ backgroundColor: opt.preview.text, opacity: 0.3 }} />
                <div className="h-1 w-1/2 rounded-sm mt-1" style={{ backgroundColor: opt.preview.text, opacity: 0.2 }} />
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <opt.icon className={`h-4 w-4 ${selected ? 'text-brass-700 dark:text-brass-400' : 'text-ink-400 dark:text-ink-300'}`} />
              <span className={`text-sm font-semibold ${selected ? 'text-brass-800 dark:text-brass-200' : 'text-ink-700 dark:text-ink-100'}`}>
                {opt.label}
              </span>
            </div>
            <span className="text-[10px] text-ink-400 dark:text-ink-300 text-center leading-tight">{opt.desc}</span>
          </button>
        );
      })}
    </div>
  );
}
