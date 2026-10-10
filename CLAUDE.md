@AGENTS.md

# LastMinute

Event-first social app for students in Lviv: swipe through events of your scene → mark «Я йду» → only then see who else is going, swipe people in the event room, and go together after a mutual «Піти разом». Not a dating feed, not a ticket shop. UI copy is Ukrainian.

One Expo Router codebase ships iOS, Android and web. The web build is also the demo people open from a QR code.

## Commands

```bash
npm run web            # dev server on web (add --port 8099 if needed)
npm start              # dev server + QR for Expo Go
npm run typecheck      # tsc --noEmit
npm run lint           # expo lint
npx expo export --platform web   # production web build into dist/
```

Done = `npm run typecheck` and `npm run lint` pass **and** the changed flow was clicked through in a browser at phone size (390×844) and, for web-facing work, at 1440×900 — in **both dark and light** theme.

## Product rules (do not break)

- **Symmetry.** Who is going is hidden until the user marks «Я йду» (blurred/locked); the user is visible only to people going to the same event.
- **Consent.** DMs open only after a mutual «Піти разом» (match). The other person learns about it only if both pressed it.
- **24 h.** Chats and the event album live until the event ends + 24 h (`expiresAt(event)` in `src/lib/selectors.ts`); after that only contacts both sides chose to leave survive.
- **Scene first.** The feed shows the user's scene by default; «Усе місто» is an explicit tab.
- **Safety.** Every person card / chat offers report + block; blocked people disappear everywhere.
- **Out of scope for v1:** likes/followers, exact geolocation, ticket sales, real SMS/e-mail delivery (demo accepts any code).

## Design source

Figma file `Lrh1ztjszMiPRnHucllhNl`, page **«v4 · Свайп подій»** (node `71:235`). Frames are named `M01…M17` (mobile, 390×844) and `W01…W09` (web, 1440×900), each in Dark and «· Light» versions. Read a frame with the Figma MCP (`get_design_context` with the frame's node id, then `get_screenshot`) before building it; translate to React Native styles — never Tailwind, never absolute-position the whole screen.

## Architecture

- `src/app/` — routes only (Expo Router).
  - `(auth)/` onboarding, guarded by `Stack.Protected` until `state.onboarded`: `login` (M01/W01) → `code` (M02) → `profile-setup` (M03) → `interests` (M04) → `scene-select` (M05). W02 is the wide-web version of M03–M05.
  - `(tabs)/` `index` = feed (M06/M10/W03), `scene`, `chats` (M12/W06), `me` (M16/W09). Phone shows `GlassTabBar`; wide web shows `WebShell` sidebar instead.
  - `event/[id]/index` (M07 details, transparent overlay), `going` (M08), `room` (M09/W05), `group` (M08b/W05b), `album` (M14/W07), `after` (M15/W08).
  - `match/[eventId]/[userId]` (M11), `chat/[eventId]/[userId]` (M13), `report/[userId]` (M17 overlay), `settings` (M16b), `blocked`, `rules`, `edit-profile`, `preferences`.
- `src/store/state.ts` — `State`, `Action`, `reducer` (pure). `src/store/AppStore.tsx` — provider (AsyncStorage persistence, hydration), `useStore()` → `{ state, dispatch, sendMessage }`, `useNow()` (demo-aware clock: always use it instead of `Date.now()` in UI).
- `src/lib/selectors.ts` — all derived data (feed, room queue, matches, chat list/status, album, pending surveys, stats). Put new derived logic here, not in screens.
- `src/lib/time.ts` — Ukrainian dates, countdowns, plurals (hand-rolled; no `Intl` locale data under Hermes). `src/lib/layout.ts` — `useIsWide()` (web ≥ 1024 px), tab-bar clearance.
- `src/data/types.ts` — domain model; `src/data/mock.ts` — demo data, dates relative to app start.
- `src/components/ui/` — shared kit (import from `@/components/ui`): `Screen`, `Header`, `ScreenTitle`, `SectionLabel`, `Button` (primary/secondary/ghost), `IconButton`, `Chip`, `Pill`, `Avatar`, `AvatarStack`, `Gradient`, `Segmented`, `Toggle`, `Checkbox`, `Radio`, `List`/`ListRow`, `Sheet`, `GlassTabBar`, `WebShell`. Reuse before adding; feature-specific components go in `src/components/<feature>/`.

## Styling

- Colours only via `useTheme().c` (`bg, surface, surface2, line, text, muted, accent, onAccent, danger…`) — they switch between dark and light. Build theme-dependent styles with `useStyles(factory)` where `factory = (c) => StyleSheet.create(...)` is declared at module level. No hex values in screens except poster/gradient art.
- Text: `type.*` presets or `display(size)` (Unbounded Bold) / `onest(weight, size)` from `@/theme`. Never set `fontWeight`; the weight is in the font family.
- Icons: `lucide-react-native` (the Figma frames use Lucide), `strokeWidth={2}`, colour from the theme.
- Gradients (posters, avatars, album tiles): `<Gradient id="sunset" />` with ids from `src/theme/palette.ts`.

## Gotchas

- `Link asChild` + `Pressable` with a *function* `style` loses the style on web — pass a plain style.
- Use `style.pointerEvents`, not the `pointerEvents` prop (deprecated on web).
- `Alert.alert` with buttons does nothing on web — build inline confirmations or sheets.
- Don't assign `ref.current` during render (lint rule `react-hooks/refs`); do it in an effect.
- Base URL: GitHub Pages serves the site under `/lastminute`; `app.config.ts` reads `EXPO_BASE_URL` (CI only). Never hard-code the prefix.
- Persisted state has `version`; bump `STATE_VERSION` in `state.ts` when the shape changes incompatibly.

## Deploy and git

- Push to `main` → `.github/workflows/deploy-web.yml` publishes the web export to https://myd-adc.github.io/lastminute/ (`404.html` = `index.html` for deep links).
- Remote: `git@github-personal:myd-adc/lastminute.git`. Commit author email for this repo: `malugamikola@gmail.com` (repo-local config).
- Never add `Co-Authored-By` or any Claude/AI attribution to commits or PR descriptions.
