# MSLingo — Claude Code context

## Project

Offline Mongolian Sign Language learning app. Source of truth: [mnsl.mn](https://mnsl.mn). No invented content. All sign data is pulled from the public mnsl.mn WordPress REST API and bundled at build time.

## Stack

- **Vite 6** + **React 19** + **TypeScript** ~5.6
- **Tailwind CSS v4** — CSS-first via `@theme {}` in `src/styles/index.css` (NOT the JS config)
- **vite-plugin-pwa** + **Workbox** — service worker caching of mnsl.mn media on demand
- **Dexie.js** — IndexedDB for local progress, mastery, reviews, achievements, settings
- **ts-fsrs** — FSRS spaced repetition algorithm
- **FlexSearch** — local full-text search over the bundled sign dictionary
- **React Router 7** — routing
- **Zod** — content package schema validation
- **Vitest** — unit tests
- **Playwright** — E2E tests

## Design tokens — Editorial palette

Defined in `src/styles/index.css` under `@theme {}`. All tokens are CSS variables consumed by Tailwind v4.

| Token            | Anchor     | Role                                |
| ---------------- | ---------- | ----------------------------------- |
| `brass-*`        | `#634c25`  | Accent, CTA, selected state (700)   |
| `ink-*`          | `#18171a`  | Text (800) and dark bg (900)        |
| `parchment-*`    | `#fdfcf8`  | Light bg (50) and dark text (50)    |
| `primary-*`      | `= brass`  | Legacy alias — DO NOT use, prefer `brass-*` |

NEVER use `primary-*` or `sand-*` — those are the deprecated teal palette removed in v0.2. If you see them, replace with `brass-*` / `ink-*` / `parchment-*`.

## Architectural rules

1. **No invented MSL content.** Every sign, meaning, example, grammar point must come from mnsl.mn. If a value is missing in the source, hide the UI element — don't fake it.
2. **Sign variants are first-class.** Multiple valid signs for the same meaning are normal; `SignComponentRef` (`{slug, name}`) is the canonical reference type, not raw icon URLs.
3. **Content is bundled at build time** in `content/msl/*.json`. The `src/content/loader.ts` validates at runtime with Zod and caches the result.
4. **Local-first.** No accounts, no analytics, no cloud sync. The `LocalProgressStore` is the only persistence layer. A `CloudProgressStore` could be added later by implementing the same `ProgressStore` interface.
5. **Event-driven theme.** No polling. Theme uses `matchMedia` for system preference + `BroadcastChannel` for cross-tab sync + `localStorage` as a write-through cache.

## Key files

```
src/
  routes/         Page components (no Layout — wraps in App.tsx)
  components/     Shared UI (Layout, ErrorBoundary, LoadingSpinner, MotionGuard)
  lib/
    progress/     LocalProgressStore (Dexie) + xpToLevel helper
    srs/          ts-fsrs wrapper (reviewCard, newSignMastery)
    search/       FlexSearch index (buildSearchIndex, search)
  content/
    schema.ts     Zod schemas (Sign, Topic, SignComponentRef, ...)
    loader.ts     loadContent() / findSign() / findTopic() / signNeighbors()
  styles/index.css  CSS-first design tokens (@theme {})

content/msl/      Versioned, read-only content package
  signs.json
  topics.json
  grammar.json
  fingerspelling.json
  numbers.json
  meta.json

scripts/
  sync-mnsl.ts      Fetch signs + topics from mnsl.mn REST API
  extract-info.ts   Fetch grammar/info pages
  validate-msl.ts   Zod-validate the content package
```

## Sync pipeline

```bash
npm run sync:mnsl          # scripts/sync-mnsl.ts — populates signs.json
npm run extract:info       # scripts/extract-info.ts — populates grammar.json
npm run validate:msl       # scripts/validate-msl.ts — Zod validation
npm run build              # bundles content into dist/
```

## Testing

```bash
npm run test               # Vitest unit tests (tests/lib/)
npm run test:e2e           # Playwright E2E (tests/e2e/)
npx tsc --noEmit           # Typecheck
```

CI: `.github/workflows/ci.yml` runs typecheck + unit + e2e + build on every push.
