---
paths:
  - "src/app/**"
  - "src/components/**"
  - "src/theme/**"
---

# Styling and UI

- Colours only via `useTheme().c` (`bg, surface, surface2, line, text, muted, accent, onAccent, danger…`) — they switch between dark and light. Theme-dependent styles: `useStyles(factory)` with `factory = (c) => StyleSheet.create(...)` declared at module level. No hex values in screens except poster/gradient art.
- Text: `type.*` presets or `display(size)` (Unbounded Bold) / `onest(weight, size)` from `@/theme`. Never set `fontWeight`; the weight is in the font family.
- Icons: `lucide-react-native`, `strokeWidth={2}`, colour from the theme.
- Gradients (posters, avatars, album tiles): `<Gradient id="sunset" />` with ids from `src/theme/palette.ts`.
- Shared kit in `src/components/ui/`: `Screen`, `Header`, `ScreenTitle`, `SectionLabel`, `Button` (primary/secondary/ghost), `IconButton`, `Chip`, `Pill`, `Avatar`, `AvatarStack`, `Gradient`, `Segmented`, `Toggle`, `Checkbox`, `Radio`, `List`/`ListRow`, `Sheet`, `GlassTabBar`, `WebShell`. Reuse before adding.
- `useIsWide()` from `src/lib/layout.ts` (web ≥ 1024 px) switches phone vs wide-web layout; it also gives tab-bar clearance.

## Web gotchas

- `Link asChild` + `Pressable` with a *function* `style` loses the style on web — pass a plain style.
- Use `style.pointerEvents`, not the `pointerEvents` prop (deprecated on web).
- `Alert.alert` with buttons does nothing on web — build inline confirmations or sheets.
- Don't assign `ref.current` during render (lint rule `react-hooks/refs`); do it in an effect.
- GitHub Pages serves the site under `/lastminute`; `app.config.ts` reads `EXPO_BASE_URL` (CI only). Never hard-code the prefix.
