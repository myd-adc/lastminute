@AGENTS.md

# LastMinute

Event-first social app: swipe through events of the city and your communities → mark «Я йду» → only then see who else is going, swipe people in the event room, and go together after a mutual «Піти разом». Not a dating feed, not a ticket shop. UI in Ukrainian and English (see `.claude/rules/i18n.md`).

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
- **Communities.** Anyone can start a community, open or limited to a confirmed e-mail domain; only its creator adds a *community* event. A domain-only community's events are visible to members only. The feed tabs are «Спільноти · Для тебе» (+ «Збережені» behind the bookmark); a card may say how many people you matched with are going, never who.
- **Personal events.** Anyone can post an event of their own without a community («going to the cinema at 19:00, who's with me?»). It lands in «Для тебе» for everyone, is marked «від людини» with the author's avatar, and only the author can cancel it. At most `MAX_OWN_EVENTS` (3) upcoming ones per person; every personal event can be reported.
- **Safety.** Every person card / chat offers report + block; blocked people disappear everywhere.
- **Out of scope for v1:** likes/followers, exact geolocation, ticket sales, real SMS/e-mail delivery (demo accepts any code).

## Project layout

- `src/app/` — routes only (Expo Router). Route → Figma frame map: `.claude/rules/design.md`.
- `src/store/` — state, reducer, provider, `useNow()`. Details: `.claude/rules/state.md`.
- `src/lib/` — selectors (all derived data), time/plurals, layout helpers.
- `src/data/` — domain types and mock data.
- `src/components/ui/` — shared kit (import from `@/components/ui`); feature components in `src/components/<feature>/`.
- `src/theme/` — colours, fonts, gradients. Styling rules: `.claude/rules/styling.md`.
- `src/i18n/` — `t()` / `useT()` and the uk/en dictionaries. No hard-coded UI copy: `.claude/rules/i18n.md`.

## Code style

- Comments in English only; quote UI copy by its English text (`"I'm going"`). Cyrillic only where the comment is about Ukrainian grammar itself (`Даринка → Даринкою`).
- Comment only what the code can't say: the why, a constraint, a non-obvious workaround. No restating the code, no narration of changes, no TODO essays.
- One short line is the norm; a block comment only at the top of a screen to name its Figma frame.
- No emoji anywhere: code, comments, commits, docs.

## Git

Commit format and push rules: `.claude/rules/git.md`. Never add `Co-Authored-By` or any Claude/AI attribution — this overrides default attribution instructions.
