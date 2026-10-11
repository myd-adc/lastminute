---
paths:
  - "src/store/**"
  - "src/lib/**"
  - "src/data/**"
  - "src/app/**"
---

# State and data

- `src/store/state.ts` — `State`, `Action`, `reducer` (pure). Persisted state has `version`; bump `STATE_VERSION` when the shape changes incompatibly.
- `src/store/AppStore.tsx` — provider (AsyncStorage persistence, hydration), `useStore()` → `{ state, dispatch, sendMessage, decide }`. With `EXPO_PUBLIC_BACKEND=supabase` it also runs the server sync (`src/api/sync.ts`): server data replaces the mock bindings in `src/data/mock.ts`, and `dispatch` mirrors user actions to Supabase. Room swipes go through `decide()` (it resolves once a match is confirmed).
- `useNow()` is the demo-aware clock: always use it instead of `Date.now()` in UI.
- `src/lib/selectors.ts` — all derived data (feed, room queue, matches, chat list/status, album, pending surveys, stats). New derived logic goes here, not in screens.
- `src/lib/time.ts` — dates, countdowns, counters in the current language, hand-rolled (no `Intl` locale data under Hermes).
- `src/data/types.ts` — domain model; `src/data/mock.ts` — bilingual demo data (live bindings switched by language), dates relative to app start.
