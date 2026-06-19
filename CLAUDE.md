# CLAUDE.md

## Commands

```bash
npm run dev          # start Vite dev server (http://localhost:5173)
npm run build        # production build
npm test             # run unit tests once (Vitest)
npm run test:watch   # run tests in watch mode
npm run lint         # ESLint

# TypeScript check — MUST use tsconfig.app.json, NOT the bare tsc command.
# The root tsconfig.json is a project-references file with files:[] and checks nothing.
npx tsc -p tsconfig.app.json --noEmit
```

## Architecture

**Stack:** React 19 · Vite 6 · TypeScript · MUI v9 · Day.js · Vitest

**State:** `SchedulingsContext` (Context + useReducer) persisted to `localStorage`.
The reducer is initialised with a lazy-init function — **not** a `useEffect` — to avoid
a StrictMode double-mount bug where the save effect would overwrite storage before the
load effect could read it.

**Three views** toggled via `ToggleButtonGroup` in `SchedulingsPage`:
- `SchedulingTable` — tabular list with edit/delete
- `SchedulingTimeline` — linear horizontal time axis (month-based)
- `SchedulingNonLinearTimeline` — event-driven axis: equal spacing between real event dates (starts/ends), immune to extreme date ranges like 9998-12-31

## Key files

| Path | Purpose |
|------|---------|
| `src/types/scheduling.ts` | Core `Scheduling` and `SchedulingDraft` types |
| `src/constants.ts` | Shared constants (e.g. `DEFAULT_END_DATE`) |
| `src/context/SchedulingsContext.tsx` | Global state, CRUD actions, localStorage persistence |
| `src/utils/timeline.ts` | Pure `addToTimeline` / `removeFromTimeline` algorithms |
| `src/utils/timeline.test.ts` | Unit tests for the timeline algorithms (16 tests) |
| `src/data/countries.ts` | Fixed list of ISO 3166-1 alpha-2 countries |
| `src/data/languages.ts` | Fixed list of BCP 47 language tags |
| `src/data/demoSchedulings.ts` | Named demo data sets loaded via the "Demo data" dropdown |
| `docs/SCHEDULING_CONCEPT.md` | Domain concept: normalization rules, operation algorithms, examples |

## Domain concept

A **Scheduling** defines a distribution window: which countries can show content and in which
languages, for a given date range. Key invariant: all countries within one scheduling share
**exactly the same language set**.

Operations that change the timeline (`addToTimeline`, `removeFromTimeline`) automatically
split and merge existing schedulings to maintain this invariant. See
`docs/SCHEDULING_CONCEPT.md` for detailed rules and examples.

## MUI v9 gotchas

System props (`alignItems`, `justifyContent`, `flexWrap`, `display`, `fontWeight`, etc.)
**are not accepted directly** on MUI components in v9 — they must go inside `sx`:

```tsx
// ✗ MUI v8 style — TypeScript error in v9
<Stack direction="row" alignItems="center" mb={2}>

// ✓ v9 style
<Stack direction="row" sx={{ alignItems: 'center', mb: 2 }}>
```

`Autocomplete.renderTags` was removed in v9. Use `slotProps={{ chip: { size: 'small' } }}`
and format the label via `getOptionLabel` instead.

## Testing

Tests live next to source files (`*.test.ts`). Run with `npm test`.
Test helpers strip `id` / `createdAt` / `updatedAt` before asserting — only date ranges,
countries, and languages are compared.
