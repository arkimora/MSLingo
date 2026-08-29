# MSLingo

> 🌐 **[Монгол хэл дээр унших](README.mn.md)**

**Offline Mongolian Sign Language (MSL) learning app** — built around the linguistic content of https://mnsl.mn.

## What it is

A Duolingo-inspired learning app for Монгол дохионы хэл. **No accounts. No cloud. No invented content.** Every sign, meaning, example, and grammar point comes from mnsl.mn.

## Quick start

```bash
npm install
npm run dev          # dev server on http://localhost:5173
```

The app starts with an empty content package. To populate it with real MSL content from mnsl.mn:

```bash
npm run sync:mnsl          # fetch all signs + topics from mnsl.mn
npm run extract:info       # fetch info/grammar pages
npm run validate:msl       # verify integrity
npm run build              # production build
```

## Architecture

- **Vite 6 + React 19 + TypeScript** — modern, fast dev loop
- **vite-plugin-pwa** — installable, offline-capable. Caches mnsl.mn media on demand via Workbox.
- **Dexie.js** — local IndexedDB for user progress, mastery, reviews, favorites, achievements
- **ts-fsrs** — FSRS spaced repetition algorithm
- **FlexSearch** — local full-text search over ~1,400 signs
- **Zod** — content package schema validation (build-time and runtime)
- **Tailwind CSS v4** — CSS-first design tokens via `@theme {}` in `src/styles/index.css`

### Layout

```
src/
  components/      Layout, ErrorBoundary, LoadingSpinner, MotionGuard, Theme*
  content/         Zod schemas + loader
  lib/
    progress/      Dexie-backed local progress store
    srs/           FSRS wrapper
    search/        FlexSearch index
  routes/          Home, Dictionary, SignDetail, Learn, Review,
                   Fingerspelling, Numbers, Grammar, Info, Profile, Settings

content/msl/       Versioned, read-only content package
  signs.json       1,398 signs (mnsl.mn)
  topics.json      85 topics
  grammar.json     8 grammar / info pages
  fingerspelling.json  Mongolian Cyrillic alphabet fingerspelling
  numbers.json     Cardinal/ordinal numbers
  meta.json        Import date, source version, statistics

scripts/
  sync-mnsl.ts       Import signs + topics from mnsl.mn REST API
  extract-info.ts    Import grammar/info pages from mnsl.mn
  validate-msl.ts    Zod-validate the content package

tests/
  lib/            Unit tests (Vitest) — srs, progress, schema
  e2e/            Playwright E2E — home, dictionary, settings, profile

.github/workflows/  CI (ci.yml) — typecheck, unit, e2e, build
```

## Design tokens

Editorial palette — restrained, never loud.

| Token | Anchor | Role |
|---|---|---|
| `brass-*` | `#634c25` (700) | Accent, CTA, selected state |
| `ink-*` | `#18171a` (800) | Body text (light) / dark surface (dark) |
| `parchment-*` | `#fdfcf8` (50) | Light bg (light) / text (dark) |

All tokens live in `src/styles/index.css` under `@theme {}`. NEVER use `primary-*` or `sand-*` — those are the deprecated teal palette. The PWA manifest theme_color (`#634c25`) and `<meta name="theme-color">` match the `brass-700` token.

## Linguistic accuracy

This app is a thin layer over mnsl.mn. The hard rules:

- **We do not invent signs, meanings, examples, or grammar.** If something is missing from the source, the corresponding UI element is not shown.
- **Sign variants are first-class data.** Multiple valid signs for the same meaning are accepted as correct in exercises.
- **The five components of a sign** (handshape, location, movement, palm orientation, non-manual) are preserved where the source provides them.
- **Traditional Mongolian script** is preserved alongside Cyrillic.
- **Source attribution** is shown on every sign detail page and in the app footer.

See `MNSL_SOURCE_MAP.md` for the full site investigation that this app is built on.

## Testing

```bash
npm run test               # Vitest unit tests
npm run test:e2e           # Playwright E2E (requires dev server)
npx tsc --noEmit           # Typecheck
```

CI runs all three on every push — see `.github/workflows/ci.yml`.

## Deployment

The app is a PWA — Vite 6 + `vite-plugin-pwa` (Workbox). It is deployed to Vercel via the standard `vercel deploy` flow; `vercel.json` adds a long `Cache-Control: immutable` header for the bundled content JSON and a SPA rewrite to `index.html`. The service worker caches the bundled `content/msl/*.json` and on-demand mnsl.mn media, so the app is fully usable offline after the first visit.

To install on a phone, open the deployed URL in Chrome/Edge/Safari and use **Add to Home Screen** — it launches as a standalone app with the editorial palette as theme color.

## Why no accounts / cloud

The user explicitly requested a local-first architecture. Progress lives in IndexedDB. The content package is bundled with the app. A `CloudProgressStore` can be added later by implementing the `ProgressStore` interface in `src/lib/progress/store.ts`.

## Privacy

We don't collect anything. There are no analytics. The service worker only caches mnsl.mn resources (per their URL patterns) for offline use.

## License & attribution

- **Code**: MIT — see [LICENSE](./LICENSE)
- **MSL content**: © mnsl.mn — used with attribution. Every sign page links back to the original mnsl.mn page.
- **Fonts**: System fonts only (Inter / Georgia fallback)

## Contributing

See [CLAUDE.md](./CLAUDE.md) for the project context (design tokens, architecture, sync pipeline). Bug reports welcome via GitHub Issues.
