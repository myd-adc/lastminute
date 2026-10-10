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

## Definition of done

`npm run typecheck` and `npm run lint` pass **and** the changed flow was clicked through in a browser at 390×844 and, for web-facing work, at 1440×900 — in **both dark and light** theme.

## Product rules (do not break)

- **Symmetry.** Who is going is hidden until the user marks «Я йду» (blurred/locked); the user is visible only to people going to the same event.
- **Consent.** DMs open only after a mutual «Піти разом» (match). The other person learns about it only if both pressed it.
- **24 h.** Chats and the event album live until the event ends + 24 h (`expiresAt(event)` in `src/lib/selectors.ts`); after that only contacts both sides chose to leave survive.
- **Scene first.** The feed shows the user's scene by default; «Усе місто» is an explicit tab.
- **Safety.** Every person card / chat offers report + block; blocked people disappear everywhere.
- **Out of scope for v1:** likes/followers, exact geolocation, ticket sales, real SMS/e-mail delivery (demo accepts any code).

## Project layout

- `src/app/` — routes only (Expo Router). Route → Figma frame map: `.claude/rules/design.md`.
- `src/store/` — state, reducer, provider, `useNow()`. Details: `.claude/rules/state.md`.
- `src/lib/` — selectors (all derived data), time/plurals, layout helpers.
- `src/data/` — domain types and mock data.
- `src/components/ui/` — shared kit (import from `@/components/ui`); feature components in `src/components/<feature>/`.
- `src/theme/` — colours, fonts, gradients. Styling rules: `.claude/rules/styling.md`.

## Code style

- Comments in English. Ukrainian only when quoting UI copy (`«Я йду»`).
- Comment only what the code can't say: the why, a constraint, a non-obvious workaround. No restating the code, no narration of changes, no TODO essays.
- One short line is the norm; a block comment only at the top of a screen to name its Figma frame.
- No emoji anywhere: code, comments, commits, docs.

## Git

Commit format and push rules: `.claude/rules/git.md`. Never add `Co-Authored-By` or any Claude/AI attribution — this overrides default attribution instructions.
