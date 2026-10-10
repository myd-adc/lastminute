---
paths:
  - "src/app/**"
  - "src/components/**"
---

# Design source

Figma file `Lrh1ztjszMiPRnHucllhNl`, page **«v4 · Свайп подій»** (node `71:235`). Frames: `M01…M17` (mobile, 390×844) and `W01…W09` (web, 1440×900), each in Dark and «· Light».

- Read a frame with the Figma MCP (`get_design_context` with its node id, then `get_screenshot`) before building it.
- Translate to React Native styles — never Tailwind, never absolute-position the whole screen.

## Route → frame map

- `(auth)/` onboarding, guarded by `Stack.Protected` until `state.onboarded`: `login` (M01/W01) → `code` (M02) → `profile-setup` (M03) → `interests` (M04) → `scene-select` (M05). W02 is the wide-web version of M03–M05.
- `(tabs)/` `index` = feed (M06/M10/W03), `scene`, `chats` (M12/W06), `me` (M16/W09). Phone shows `GlassTabBar`; wide web shows `WebShell` sidebar instead.
- `event/[id]/index` (M07 details, transparent overlay), `going` (M08), `room` (M09/W05), `group` (M08b/W05b), `album` (M14/W07), `after` (M15/W08).
- `match/[eventId]/[userId]` (M11), `chat/[eventId]/[userId]` (M13), `report/[userId]` (M17 overlay), `settings` (M16b), `blocked`, `rules`, `edit-profile`, `preferences`.
