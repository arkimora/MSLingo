import { NavLink, Link } from 'react-router-dom';
import type { ReactNode } from 'react';
import { Home, Book, GraduationCap, RotateCcw, User, Hand, Hash, Library, Settings as SettingsIcon } from 'lucide-react';

const nav = [
  { to: '/', label: 'Эхлэл', icon: Home, end: true },
  { to: '/learn', label: 'Сурах', icon: GraduationCap },
  { to: '/review', label: 'Дахин үзэх', icon: RotateCcw },
  { to: '/dictionary', label: 'Толь', icon: Book },
  { to: '/fingerspelling', label: 'Хурууны үсэг', icon: Hand },
  { to: '/numbers', label: 'Тоо', icon: Hash },
  { to: '/grammar', label: 'Дүрэм', icon: Library },
];

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-full flex flex-col">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:rounded-md focus:bg-ink-800 focus:text-parchment-50 focus:outline-none focus:ring-2 focus:ring-brass-600"
      >
        Skip to main content
      </a>
      <header className="sticky top-0 z-30 bg-parchment-50/85 dark:bg-ink-900/85 backdrop-blur border-b rule">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-4">
          <Link
            to="/"
            className="flex items-center gap-2.5 font-semibold text-ink-800 dark:text-parchment-50 tracking-tight"
          >
            <span
              aria-hidden
              className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-ink-800 dark:bg-brass-700 text-parchment-50 dark:text-ink-900 text-base font-serif font-bold"
            >
              М
            </span>
            <span className="text-lg">MSLingo</span>
          </Link>

          <nav aria-label="Үндсэн цэс" className="ml-auto hidden md:flex items-center gap-1">
            {nav.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-md text-sm font-medium inline-flex items-center gap-1.5 transition-colors ${
                    isActive
                      ? 'bg-ink-800 text-parchment-50 dark:bg-brass-700 dark:text-ink-900'
                      : 'text-ink-500 hover:text-ink-800 hover:bg-ink-50 dark:text-ink-200 dark:hover:text-parchment-50 dark:hover:bg-ink-800'
                  }`
                }
              >
                <Icon className="h-4 w-4" />
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto md:ml-2 flex items-center gap-1">
            <Link
              to="/profile"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium text-ink-500 hover:text-ink-800 hover:bg-ink-50 dark:text-ink-200 dark:hover:text-parchment-50 dark:hover:bg-ink-800"
              aria-label="Миний ахиц"
            >
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Профайл</span>
            </Link>
            <Link
              to="/settings"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium text-ink-500 hover:text-ink-800 hover:bg-ink-50 dark:text-ink-200 dark:hover:text-parchment-50 dark:hover:bg-ink-800"
              aria-label="Тохиргоо"
            >
              <SettingsIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Тохиргоо</span>
            </Link>
          </div>
        </div>
      </header>

      <main id="main-content" tabIndex={-1} className="flex-1 max-w-6xl w-full mx-auto px-4 py-6 focus:outline-none">
        {children}
      </main>

      <nav aria-label="Доод цэс" className="md:hidden sticky bottom-0 z-30 bg-parchment-50 dark:bg-ink-900 border-t rule">
        <ul className="grid grid-cols-7 text-[10px]">
          {nav.map(({ to, label, icon: Icon, end }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-0.5 py-2 ${
                    isActive ? 'text-ink-800 dark:text-brass-400' : 'text-ink-400 dark:text-ink-300'
                  }`
                }
              >
                <Icon className="h-5 w-5" />
                <span>{label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <footer className="border-t rule py-5 text-center text-xs text-ink-400 dark:text-ink-300 space-y-1">
        <p>
          Монгол дохионы хэлийг сурах. Эх сурвалж:{' '}
          <a className="underline underline-offset-2 hover:text-brass-700 dark:hover:text-brass-400" href="https://mnsl.mn" rel="noreferrer noopener" target="_blank">
            mnsl.mn
          </a>
          .
        </p>
        <p>
          <a className="underline underline-offset-2 hover:text-brass-700 dark:hover:text-brass-400" href="https://arkimora.vercel.app" rel="noreferrer noopener" target="_blank">
            arkimora.vercel.app
          </a>
        </p>
      </footer>
    </div>
  );
}
