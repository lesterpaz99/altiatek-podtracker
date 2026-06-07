# AltiaTek Pod Tracker — V3 "Calm Green" Design Handoff

**Audience:** Claude Code, working in the `altiatek-podtracker` Expo/React Native repo.
**Goal:** Retrofit the existing frontend to the V3 visual design, and build the
remaining screens in the same system. This is a **presentation-layer change** — do
**not** touch auth, PKCE, SecureStore, ServiceNow REST logic, or the data model.

---

## 0. How to use this doc

1. Read this whole file first, plus `CLAUDE.md` and `SPEC.md`.
2. Apply changes in the order in §13.
3. After each screen: `npx tsc --noEmit` must pass. Keep the existing code style
   (tab indentation, `@/` alias, `ThemedText`/`ThemedView`, `StyleSheet.create`,
   `Spacing` tokens, `useTheme()`/`useColorScheme()`).
4. Reuse what's installed before adding deps: **react-native-reanimated** (animations),
   **expo-glass-effect** (frosted tab bar), **expo-symbols** (SF Symbols icons),
   **expo-image**. Only add a package if a feature truly needs it (called out below).

---

## 1. Scope of the visual change

| Screen / file | Action |
|---|---|
| `src/constants/theme.ts` | **Edit** — adopt the V3 palette + add a few tokens |
| `src/app/(auth)/login.tsx` | **Restyle** — branded emerald hero + form area (keep OAuth wiring) |
| `src/app/(app)/today.tsx` | **Restyle** — header, chips, status-line cards with new state treatment, dashed "Add status line" row |
| `src/app/(app)/add-status-line.tsx` | **Build** — full form as a modal sheet + the Voice→AI fill feature |
| `src/app/(app)/create-header.tsx` | **Build/restyle** — same card system |
| Bottom tabs + History + Profile | **New & optional** — see §10; beyond current MVP, build when ready |

The design language: **calm, single-green system. One emerald primary, lime only as
a brand spark. No yellow "in progress" pills. A live green pulse dot for in-progress,
a green check for completed. Generous white cards, soft shadows, rounded 20px.**

---

## 2. Design language (the system)

- **One primary green** (emerald). Lime (`#A9DB1B`) appears **only** as the small
  skewed brand mark next to "ALTIATEK" — never as a fill or button.
- **Status is expressed by an indicator, not a colored pill:**
  - *In progress* → a small **green pulsing dot** + the plain words "In progress"
    (secondary text color). No yellow, no pill.
  - *Completed* → a small **filled green circle with a white check** + "Completed"
    in green. Card is very slightly de-emphasized (opacity ~0.94).
- **Effort** is shown as a right-aligned **big number + "EFFORT" caption** on each
  card. It is *effort invested*, not completion — never render it as a progress bar.
- **Flags** (At risk / Needs help / Blocked) are small rounded pills with icons:
  amber for At risk, green for Needs help, red for Blocked.
- **Cards:** `backgroundElement`, radius **20**, 1px hairline border (dark) or soft
  shadow (light). No left-accent bars. (The current `today.tsx` uses a bottom accent
  bar — remove it in favor of the pulse/check indicator.)
- **Add action:** the **first item** of Today's list is a full-width **gray dashed
  rounded button** "＋ Add status line" (not a floating FAB).

---

## 3. Tokens — edits to `src/constants/theme.ts`

Your file already has the right shape. Update/extend `Colors` like this. Values that
**change** are marked ←; the rest are **new** keys (add them).

```ts
export const Colors = {
  light: {
    text: '#0E1B17',              // ← was #000000 (greener near-black)
    textSecondary: '#56655F',     // ← greener gray
    textTertiary: '#90A09A',      // NEW — meta / captions
    background: '#F1F4F3',        // ← was #F2F2F7 (faint green tint)
    backgroundTop: '#F9FBFA',     // NEW — top of the screen gradient
    backgroundElement: '#FFFFFF', // (same) card bg
    backgroundSelected: '#EAEEEC',// ← track / chip fill
    accent: '#0EA56B',            // ← was #4A8729 (V3 emerald primary)
    accentForeground: '#FFFFFF',
    accentSoft: '#E3F5EC',        // NEW — soft accent tint (avatar, AI tag, pulse halo)
    brand: '#A9DB1B',             // NEW — lime spark, brand mark ONLY
    separator: 'rgba(13,32,26,0.08)', // ← softer hairline
    fieldBorder: 'rgba(13,32,26,0.16)', // NEW — input borders
    danger: '#D6453C',
    dangerSubtle: '#FCEBE9',      // ← warn/over-allocated bg
    warning: '#B8860B',           // ← amber text (At risk / Verify)
    warningSubtle: '#FBF1DA',     // ← amber bg
    success: '#0E9C5F',
    successSubtle: '#E3F5EC',
    // Flag badges — per-flag now (was one amber for all)
    flagRiskBg: '#FBF1DA',  flagRiskText: '#B8860B',
    flagHelpBg: '#E3F5EC',  flagHelpText: '#0EA56B',
    flagBlockBg: '#FCEBE9', flagBlockText: '#D6453C',
    // Frosted tab bar
    tabBar: 'rgba(249,251,250,0.82)',
    tabIdle: '#9AA9A3',
  },
  dark: {
    text: '#ECF3EF',              // ←
    textSecondary: '#97A69F',     // ←
    textTertiary: '#69786F',      // NEW
    background: '#0A130F',        // ← was #000000
    backgroundTop: '#0E1A15',     // NEW
    backgroundElement: '#15211B', // ← was #1C1C1E
    backgroundSelected: 'rgba(255,255,255,0.10)',
    accent: '#1FC57E',            // ← V3 emerald (dark)
    accentForeground: '#04140C',
    accentSoft: 'rgba(31,197,126,0.13)', // NEW
    brand: '#B6E62A',             // NEW
    separator: 'rgba(255,255,255,0.08)',
    fieldBorder: 'rgba(255,255,255,0.16)', // NEW
    danger: '#FF6F64',
    dangerSubtle: 'rgba(255,111,100,0.12)',
    warning: '#E7B14B',
    warningSubtle: 'rgba(231,177,75,0.13)',
    success: '#4BD07E',
    successSubtle: 'rgba(75,208,126,0.13)',
    flagRiskBg: 'rgba(231,177,75,0.13)',  flagRiskText: '#E7B14B',
    flagHelpBg: 'rgba(31,197,126,0.13)',  flagHelpText: '#1FC57E',
    flagBlockBg: 'rgba(255,111,100,0.12)', flagBlockText: '#FF6F64',
    tabBar: 'rgba(14,26,21,0.82)',
    tabIdle: '#69786F',
  },
} as const;
```

> You can drop the old `stateOpenBg/Text`, `stateWipBg/Text`, `stateDoneBg/Text`,
> `accentBar`, `accentBarDanger` keys once `today.tsx` stops using them (the V3 card
> doesn't use colored state pills or accent bars). Leave `Spacing`, `Fonts`,
> `BottomTabInset`, `MaxContentWidth` as-is. The card radius constant is **20**.

---

## 4. Typography (map to existing `ThemedText` types)

Use the existing `type` variants — they already match the system closely:

| Use | `ThemedText type` | Notes |
|---|---|---|
| Screen greeting / titles | `title` | "Good evening, Lester", "Sign in" |
| Card project / work-item name | `label` (bump weight to 700) | 17px |
| Body / focus / notes | `small` | 13px, `textSecondary` |
| Card section labels, meta, captions | `caption` | uppercase for "EFFORT", "TODAY'S LINES" |
| Big effort number | inline style 22/800, `text` color | right-aligned |
| Big utilization number | inline style 30/800, `danger` when >100% |

Keep `Fonts.rounded` for titles (your `title`/`subtitle` already use it).

---

## 5. Icons & motion libraries

- **Icons:** use `expo-symbols` (`SymbolView`) for SF Symbols where possible
  (mic = `mic.fill`, target/calendar/person/clock, checkmark = `checkmark`,
  plus = `plus`). For the pod hexagon and the skewed lime mark, draw with `View`s
  (the mark is just a skewed rounded rect: `transform:[{skewX:'-12deg'}]`).
- **Motion:** `react-native-reanimated` for the pulse dot, the recorder waveform, and
  the modal sheet entrance.
- **Frosted tab bar:** `expo-glass-effect` (`GlassView`) for the translucent blur.

---

## 6. Screen — `(auth)/login.tsx` (restyle, keep all auth wiring)

Keep `useAuth().startOAuth`, `isLoading`, `authError` exactly as they are. Only the
layout/visuals change from "centered logo" to **hero + form**:

- **Top hero (~358px, flex 0):** full-bleed emerald gradient.
  - Light gradient: `#12A86E → #0A6E48` (158°). Dark: `#0F7E52 → #063A26`.
    Use `expo-linear-gradient` (add it — `expo-linear-gradient` for SDK 56) or a
    layered View fallback.
  - Faint **hexagon outlines** (white, opacity ~0.06–0.07) as decoration; one small
    hex in `brand` lime at ~0.5 opacity.
  - Brand row: skewed `brand` lime bar (8×18, `skewX(-12deg)`) + "ALTIATEK"
    (white 0.92, 13px/700, letterSpacing 0.5, uppercase).
  - Title "PodTracker" — white, 44px/800, letterSpacing -1.4.
  - Tagline "Log your day. Track effort across every pod." — white 0.82, 16px/500.
- **Form area (flex 1):** `background`, rounded **28px top corners**, overlaps the
  hero by ~26px (negative margin).
  - "Sign in" (`title`-ish, 23/800) + helper "Use your AltiaTek work account to continue."
  - Primary button (height 54, radius 15, `accent` bg, `accentForeground` text):
    shield/lock icon + **"Continue with AltiaTek SSO"** → `onPress={startOAuth}`.
  - While `isLoading`: show `ActivityIndicator` in the button's place.
  - `authError` inline (danger), centered.
  - Helper line: "Trouble signing in? **Contact IT**" (Contact IT in `accent`).
  - Footer pinned bottom: "PodTracker v{version} · AltiaTek Internal" (`textTertiary`, small).
- **No Microsoft/second button.** Single SSO path only.

---

## 7. Screen — `(app)/today.tsx` (restyle)

Keep all data fetching (`fetchTodayHeader`, `fetchStatusLines`, `useAuth`) unchanged.
Restyle the presentational pieces:

### Header
- Brand row: skewed lime mark + "ALTIATEK PODTRACKER" (`textSecondary`, 12.5/700, uppercase).
- Greeting `Good {period}, {first}` (`title`, 28/800) + date (`textTertiary`).
- Right: a **44px circular avatar** with initials (`accentSoft` bg, 2px `accent` ring,
  `accent` text). Tapping it opens a small menu (See profile / Sign out) — see §10.
  Until tabs exist, keep your current "Sign out" pill if you prefer.

### Status chip
- Single chip only. When today's header exists → green "Status logged today"
  (`successSubtle`/`success`, check icon). **Remove the "0 lines need attention" chip
  when the count is 0** — only show a needs-attention chip when count > 0.

### Utilization card
- A full-width card (radius 20). Big number = sum of `u_time_percent` across **active
  (non-completed)** lines, e.g. "150%". When > 100% color it `danger` and show a small
  "Over-allocated" pill (`dangerSubtle`/`danger`). Subtitle "Utilization across N active
  lines". A small 70px meter on the right with "cap 100%" caption.

### Section header
- "Today's status" (label/700, 19px) on the left, "N lines" (`textTertiary`) on the right.

### Status line card — the important redesign
Replace `StatePill` + bottom `accentBar` with the V3 treatment. Card layout:

1. **Top row:** status indicator + status text + dot separator + line code (`u_number`
   or task number, `textTertiary`) + a pencil (edit) icon on the right.
   - In progress (`resolveState` → `open`/`in_progress`): **green pulse dot** +
     "In progress" (`textSecondary`, plain — no pill).
   - Completed: **filled `accent` circle w/ white check** + "Completed" (`success`).
2. **Body row:** left = work item name (`label`/700, 17px) then focus (`small`,
   `textSecondary`, `numberOfLines` ok); right = **effort** (`{u_time_percent}` 22/800)
   over "EFFORT" caption (`textTertiary`, uppercase).
3. **Flags** (if any): pills using the per-flag tokens (At risk amber, Needs help green,
   Blocked red), icon + label.
4. **Meta row:** target date (calendar/target icon + `u_target_date`; for completed show
   "✓ Done · {date}") and pod (hexagon icon + pod name). All `textTertiary`, 12.5/500.
- Completed cards: border `successSubtle`, opacity ~0.94.

### Add row
- The **first list item** is a full-width **dashed** button (1.5px dashed
  `fieldBorder`-gray, radius 20, min-height 64): "＋ Add status line" in
  `textSecondary`. `onPress` → navigate to `add-status-line` (see §8).

---

## 8. Screen — `(app)/add-status-line.tsx` (build) + Voice→AI

This is the big one. Per `SPEC.md` it's a full form POSTing `u_pod_status_line`.
Present it as a **modal** so it reads like a bottom sheet:

- In `(app)/_layout.tsx` Stack, add
  `<Stack.Screen name="add-status-line" options={{ presentation: 'modal' }} />`
  (and the same for an `edit-status-line` route, or reuse one route with a param).
- Sheet chrome: grab handle, header with **title** ("Add status line" / "Edit status
  line" + the line code when editing), a compact **Voice** button, and a close ✕.
  Sticky footer with **Cancel** + primary **Add line** / **Save changes**.

### Form fields (map 1:1 to `u_pod_status_line`, per SPEC §6.4)
| Label | Field | Control |
|---|---|---|
| Assignment * | `u_assignment` (task ref) | Task picker (SPEC §7). "No task?" toggle → free-text `u_assignment_name` |
| Current focus * | `u_current_focus` | multiline TextInput |
| Work item name * | `u_item_name` | TextInput |
| Assignment type | `u_assignment_type` | Select (choices via SPEC §11c) |
| State | `u_state` | Select |
| At risk / Needs help / Blocked | `u_at_risk`/`u_needs_help`/`u_blocked` | checkboxes |
| Target date * | `u_target_date` | date picker (YYYY-MM-DD) |
| Effort % * | `u_time_percent` | numeric select 0–100 |
| Notes / Next Steps * | `u_notes` | multiline TextInput |

Inputs: height 46, radius 12, `fieldBorder`, `backgroundElement`. Labels 13.5/700 with
the field's tag on the right (see below).

### Voice → AI fill (NEW feature, beyond MVP — flag it as such)
A compact **"✦ Voice"** pill lives in the sheet header. The flow:

1. **idle:** tap Voice.
2. **recording (inline expand):** a card appears at the top of the form with an
   animated **waveform** (Reanimated bars), a timer, a **live transcript** that streams
   in, and **Stop & fill** / Cancel. The header pill turns red ("Listening").
3. **processing:** brief spinner + "Understanding your update…".
4. **done:** the form fields **populate** (stagger them in). Show a green summary panel:
   "Filled N fields from your voice", the **"You said…"** transcript, and **Re-record /
   Clear**. AI-filled fields get a small **✦ AI** tag (accent); the two voice gets wrong
   most — **Target date** and **Effort %** — get an amber **Verify** tag. Editing a field
   clears its tag. **Nothing auto-submits** — the user reviews and taps Add line.

**Implementation notes / integration points:**
- **Speech-to-text:** Expo Go has no built-in STT. Use a dev build + a library
  (`@react-native-voice/voice`) or record audio (`expo-av`) and send to a transcription
  API. Keep the transcript in one piece of state so the source is swappable.
- **Parsing:** send the transcript to an LLM with a strict JSON instruction and parse the
  result into the form fields. Suggested schema:
  ```json
  { "work": "", "focus": "", "effort": 50, "atRisk": false, "needsHelp": false,
    "blocked": false, "targetDate": "YYYY-MM-DD", "notes": "", "state": "In progress" }
  ```
  Rules: never invent a task code (leave Assignment for the user); use empty/null when
  unsure; flag `targetDate` + `effort` as "verify".
- Always have a graceful fallback (if STT/LLM unavailable, the user just fills manually).

### Submit
POST exactly as `SPEC.md` §8.4 (respect the `u_no_task` branch and the Business-Rule
gotcha in `CLAUDE.md`). On success `router.back()`; Today refetches.

### Edit mode
The pencil on a Today card opens this same sheet pre-filled; footer button reads
**Save changes**. (Note: SPEC currently lists edit as out-of-scope — treat edit as an
additive enhancement; ship Add first.)

---

## 9. Screen — `(app)/create-header.tsx` (build/restyle)

Per SPEC §6.3: show auto-populated date / pod / member in a single V3 card (radius 20,
`backgroundElement`) and one primary **"Create today's header"** button (`accent`).
No editable fields. POST per SPEC §8.2, then `router.back()`.

---

## 10. NEW & optional — bottom tabs + History + Profile

The V3 design introduces a **frosted bottom tab bar** (Today / History / Profile) and
two new screens. These are **beyond the current MVP** — build when you're ready; they're
specced here so they stay in-system.

- **Tabs:** convert `(app)/_layout.tsx` to `Tabs` (expo-router) or add a custom bar using
  `expo-glass-effect`. Active = `accent` + 700 weight; idle = `tabIdle`. Icons via
  expo-symbols (today=`calendar`, history=`clock.arrow.circlepath`, profile=`person`).
- **Profile menu** (from the avatar tap on Today): small popover with **See profile**
  (→ Profile tab) and **Sign out** (red → `useAuth().signOut`).
- **History** (`(app)/history.tsx`): past status lines grouped by day with date headers;
  compact cards (code, work item, focus, effort). Data: query `u_pod_status_line` /
  headers across recent days for the member.
- **Profile** (`(app)/profile.tsx`): identity card (avatar, `podMember.displayName`,
  role, pod), a "This month" stats grid (lines logged, avg effort, active days, pods),
  and a red **Sign out** button.

---

## 11. Animations (Reanimated)

- **Pulse dot:** a halo `View` that scales 1→2.8 and fades 0.55→0 on a ~2.1s loop;
  solid dot on top. Gate on `prefers-reduced-motion` equivalent (respect
  `AccessibilityInfo.isReduceMotionEnabled`).
- **Waveform:** ~22 bars, each `scaleY` looping with staggered delay.
- **Modal sheet:** slide up from bottom (Reanimated) — but make the **resting state
  visible** so it never gets stuck hidden if a frame is dropped.
- Keep entrance animations off for completed/static content; no infinite decorative loops
  on cards.

---

## 12. Guardrails

- **Do not modify** `auth-context.tsx`, `services/servicenow.ts`, `services/config.ts`,
  PKCE/SecureStore logic, or the ServiceNow field names/queries. Presentation only.
- Preserve conventions: `@/` alias, `ThemedText`/`ThemedView`, `useTheme()`,
  tab indentation, `StyleSheet.create` with `Spacing`.
- `npx tsc --noEmit` must pass after each screen.
- Light **and** dark must both look right (drive everything off `useTheme()`).
- No new colors outside the token table; no lime as a fill; no yellow "in progress" pill;
  effort is never a progress bar.

---

## 13. Suggested implementation order

1. **Tokens** (`theme.ts`) — palette + new keys. Verify existing screens still compile.
2. **Login** restyle (self-contained, low risk, great confidence check).
3. **Today** restyle — status-line card redesign (pulse/check, effort, flags), dashed
   add row, header + chips + utilization.
4. **Create Header** (if not built) + **Add Status Line** form (no voice yet) → end-to-end
   create flow working against ServiceNow.
5. **Voice → AI** on the Add sheet (dev build + STT + LLM parse), with fallback.
6. **Edit** mode (reuse the sheet).
7. **Tabs + History + Profile** (optional, when scoped).

---

*Reference: the interactive V3 mockup (HTML) demonstrates every state — login (light/dark),
Today with in-progress + completed lines, the Add/Edit sheet, the Voice→AI flow
(idle/recording/processing/done with AI + Verify tags), History, and Profile. Ask the
designer for screenshots of any state you want to match pixel-for-pixel.*
