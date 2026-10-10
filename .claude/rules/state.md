---
paths:
  - "src/store/**"
  - "src/lib/**"
  - "src/data/**"
  - "src/app/**"
---

# State and data

- `src/store/state.ts` — `State`, `Action`, `reducer` (pure). Persisted state has `version`; bump `STATE_VERSION` when the shape changes incompatibly.
- `src/store/AppStore.tsx` — provider (AsyncStorage persistence, hydration), `useStore()` → `{ state, dispatch, sendMessage }`.
- `useNow()` is the demo-aware clock: always use it instead of `Date.now()` in UI.
- `src/lib/selectors.ts` — all derived data (feed, room queue, matches, chat list/status, album, pending surveys, stats). New derived logic goes here, not in screens.
- `src/lib/time.ts` — dates, countdowns, counters in the current language, hand-rolled (no `Intl` locale data under Hermes).
- `src/data/types.ts` — domain model; `src/data/mock.ts` — bilingual demo data (live bindings switched by language), dates relative to app start.
