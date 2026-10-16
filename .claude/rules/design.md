---
paths:
  - "src/app/**"
  - "src/components/**"
---

# Design source

Figma file `Lrh1ztjszMiPRnHucllhNl`, page **«v4 · EN»** (node `93:500`) is the main design. Frames: `M01…M22` (mobile, 390×844) and `W01…W09` (web, 1440×900), each in Dark and «· Light». Sign-in is @username or e-mail + password; sign-up and password reset confirm the address with a 6-digit code (M01–M02b, W01–W01b).

- Read a frame with the Figma MCP (`get_design_context` with its node id, then `get_screenshot`) before building it.
- Translate to React Native styles — never Tailwind, never absolute-position the whole screen.

## Route → frame map

- `(auth)/` onboarding, guarded by `Stack.Protected` until `state.onboarded`: `login` (M01/W01: @username or e-mail + password) · `signup` (M01b/W01b: e-mail + password) → `code?mode=signup` (M02) → `profile-setup` (M03) → `about` (M04b: year of birth + spoken languages; no frame yet) → `interests` (M04, last step). «Продовжити з Google» (above the e-mail form on M01/M01b/W01/W01b) returns to `auth-callback`, then restores the account or starts at `profile-setup`. «Забув пароль?»: `reset` (M01c) → `code?mode=reset` (M02) → `new-password` (M02b). W02 is the wide-web version of M03–M04.
- `(tabs)/` `index` = feed (M06/M10/W03), `communities` (M18), `chats` (M12/W06), `me` (M16/W09). Phone shows `GlassTabBar`; wide web shows `WebShell` sidebar instead.
- `event/[id]/index` (M07 details, transparent overlay), `going` (M08), `room` (M09/W05), `group` (M08b/W05b), `album` (M14/W07), `after` (M15/W08).
- `community/[id]/index` (M19 join, M19b creator view), `community/new` (M20), `community/[id]/new-event` (M21), `community/[id]/settings` (M22). No wide-web frames yet: they reuse the phone layout in a 640–720 pt column.
- `event/new` — a personal event, the same M21 form (`components/community/EventForm.tsx`) without a community behind it. No frame of its own yet.
- `match/[eventId]/[userId]` (M11), `chat/[eventId]/[userId]` (M13), `report/[userId]` (M17 overlay), `settings` (M16b), `blocked`, `rules`, `edit-profile`, `preferences`.
