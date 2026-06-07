# Claude Code — Build Prompt: Retrofit PodTracker to the V3 "Calm Green" Design

> Paste this whole file to Claude Code as your kickoff prompt (or commit it to the repo
> and say "follow CLAUDE-CODE-PROMPT.md"). It was written after reading the **actual**
> `lesterpaz99/altiatek-podtracker` source, so the file/symbol names below match what's
> really in the repo — not the older `SPEC.md` assumptions. Where the two disagree,
> **this file and the running code win**; see §6 "Known mismatches with SPEC.md".

---

## 0. Mission

Retrofit the existing Expo / React Native / TypeScript frontend to the **V3 "Calm Green"**
visual design, and build the remaining screens in that same system. This is a
**presentation-layer change**. Do **not** touch auth, PKCE, SecureStore, the ServiceNow
REST layer, or the data model — only how things look.

You have three reference documents and a set of screenshots (see §1). Read them before
writing code.

---

## 1. Setup — files to add to the repo first

Add these to the repo (suggested location `design/`) so you can read them, then commit:

```
design/
├── V3-DESIGN-HANDOFF.md          ← the authoritative visual spec (read in full)
└── screenshots/
    ├── 01-login-light.png        Login — branded emerald hero + form sheet
    ├── 02-login-dark.png         Login — dark
    ├── 03-today-light.png        Today — utilization, dashed add row, in-progress card
    ├── 04-today-dark.png         Today — dark
    ├── 05-history.png            History — grouped past lines (new screen)
    ├── 06-profile.png            Profile — identity + "This month" stats (new screen)
    ├── 07-add-sheet.png          Add status line — modal sheet, empty form
    ├── 08-voice-recording.png    Voice → AI: recording (waveform, live transcript, Stop & fill)
    └── 09-voice-done.png         Voice → AI: filled ("Filled N fields", Verify tags)
```

> `V3-DESIGN-HANDOFF.md` is the file titled **"AltiaTek PodTracker - V3 Design Handoff"**
> from the designer. It contains the full token table, per-screen specs, the Voice→AI flow,
> and the animation notes. **Read it top-to-bottom before step 2.** The screenshots are the
> pixel target for each state — match them.

Also re-read the repo's own `CLAUDE.md` and `SPEC.md` for backend/field truth.

---

## 2. What's already in the repo (verified)

**Stack:** Expo (managed, SDK 56), TypeScript (strict), expo-router (file-based),
expo-secure-store for tokens, React Context + hooks, native `fetch`. ServiceNow REST
Table API is the only backend — **do not build a new one.**

**Already built:**
- `src/constants/theme.ts` — `Colors.light`/`Colors.dark`, `Spacing` (half=2, one=4, two=8,
  three=16, four=24, five=32, six=64), `Fonts`, `BottomTabInset`, `MaxContentWidth`.
  Today's accent is `#4A8729` (older chartreuse-green) with state-pill + accent-bar tokens.
- `src/app/(auth)/login.tsx` — centered-logo layout. Uses `useAuth().startOAuth`,
  `isLoading`, `authError`. Button text "Sign in with AltiaTek". **Single OAuth path.**
- `src/app/(app)/today.tsx` — already fairly built: `StatusChip`, `IndicatorRow`
  (needs-attention + utilization), `StatusLineCard` with a colored `StatePill` and a
  **bottom accent bar**. Fetches via `fetchTodayHeader(session.accessToken, podMember.sysId)`
  then `fetchStatusLines(session.accessToken, header.sys_id)`.
- `src/components/` — `themed-text.tsx` (`ThemedText` with `type` variants: `title`,
  `subtitle`, `label`, `small`, `smallBold`, `caption`, …), `themed-view.tsx`, plus
  `use-theme.ts` (`useTheme()`) and `use-color-scheme.ts` (`useColorScheme()`).
- `src/services/servicenow.ts` — `fetchTodayHeader`, `fetchStatusLines`, types
  `PodMemberStatus`, `StatusLine` (note: line booleans come back as **strings**, e.g.
  `item.u_at_risk === 'true'`). `src/services/config.ts`, `src/context/auth-context.tsx`.

**Not built yet (you will create these):**
- `src/app/(app)/create-header.tsx`
- `src/app/(app)/add-status-line.tsx`  ← the big one (form + Voice→AI)
- Bottom tab bar + `src/app/(app)/history.tsx` + `src/app/(app)/profile.tsx` (V3-new, optional)

**AuthContext surface you may read (do not modify the context):**
`session` (has `accessToken`), `podMember` (`sysId`, `displayName`, …), `startOAuth()`,
`isLoading`, `authError`, `signOut()`. The Today header exposes `header.u_pod.display_value`
and `header.u_number`.

---

## 3. The design in one paragraph

Calm, **single-green** system. **One emerald primary** (`#0EA56B` light / `#1FC57E` dark);
**lime** (`#A9DB1B`) appears **only** as the small skewed brand mark next to "ALTIATEK" —
never as a fill or button. **Status is an indicator, not a colored pill:** in-progress = a
small **green pulsing dot** + plain "In progress" text (no yellow, no pill); completed = a
**filled green circle with a white check** + "Completed". **Effort** is a right-aligned big
number + "EFFORT" caption (effort invested — never a progress bar). Flags (At risk / Needs
help / Blocked) are small icon pills (amber / green / red). Cards: white, radius **20**,
soft shadow (light) or hairline border (dark), **no left/bottom accent bars**. The Add
action is the **first list item** — a full-width gray **dashed** "＋ Add status line" row
(not a floating button). Both light and dark must look right; drive everything off
`useTheme()`.

---

## 4. Tokens — edit `src/constants/theme.ts` first

Apply the palette in **§3 of `V3-DESIGN-HANDOFF.md`** (it lists every light/dark value and
marks which keys change vs. which are new). Highlights:

- `accent` → `#0EA56B` (light) / `#1FC57E` (dark); add `accentSoft`, `brand` (lime),
  `textTertiary`, `backgroundTop`, `fieldBorder`, per-flag tokens
  (`flagRiskBg/Text`, `flagHelpBg/Text`, `flagBlockBg/Text`), `tabBar`, `tabIdle`.
- Greener neutrals: `text` `#0E1B17`, `textSecondary` `#56655F`, `background` `#F1F4F3`.
- Card radius constant is **20**.
- Once `today.tsx` no longer uses them, drop `stateOpenBg/Text`, `stateWipBg/Text`,
  `stateDoneBg/Text`, `accentBar`, `accentBarDanger` (the V3 card has no colored state
  pill or accent bar). Leave `Spacing`, `Fonts`, `BottomTabInset`, `MaxContentWidth`.

After this edit, confirm the existing screens still compile (`npx tsc --noEmit`).

---

## 5. Build order (each step: `npx tsc --noEmit` must pass)

Follow **§13 of the handoff doc**; the per-screen detail is in §6–§11 there. Summary:

1. **Tokens** (`theme.ts`) — §4 above.
2. **Login restyle** (`(auth)/login.tsx`) — emerald gradient hero + faint hex outlines +
   skewed lime brand mark + "PodTracker" + tagline; white form sheet (28px top radius,
   overlaps hero ~26px) with one primary **"Continue with AltiaTek SSO"** button wired to the
   existing `startOAuth`. Keep `isLoading`/`authError` exactly. Match `01/02-login-*.png`.
   *(Low-risk confidence check — do this first.)*
3. **Today restyle** (`(app)/today.tsx`) — keep all data fetching. Replace `StatePill` +
   bottom `accentBar` with the **pulse-dot / green-check** indicator; right-aligned **effort**
   number; per-flag pills; utilization card (red + "Over-allocated" pill when >100%); only
   show a needs-attention chip when count > 0; **dashed "＋ Add status line"** as the first
   list item → navigates to `add-status-line`. 44px initials avatar (tap → menu later).
   Match `03/04-today-*.png`.
4. **Create Header** (`(app)/create-header.tsx`) + **Add Status Line**
   (`(app)/add-status-line.tsx`) as a **modal** (`presentation: 'modal'` in the `(app)` Stack).
   Full form mapping 1:1 to `u_pod_status_line` (handoff §8 table + `SPEC.md` §6.4/§8.4),
   including the `u_no_task` task-picker branch. POST per `SPEC.md`, respecting the
   Business-Rule gotcha in `CLAUDE.md`. Match `07-add-sheet.png`. This gets create working
   end-to-end against ServiceNow **before** voice.
5. **Voice → AI fill** on the Add sheet — compact "✦ Voice" pill → recording (waveform +
   live transcript + "Stop & fill") → processing → fields populate with **✦ AI** tags and
   amber **Verify** tags on Target date + Effort; editing a field clears its tag; nothing
   auto-submits. Match `08/09-voice-*.png`. **This is beyond the current MVP — flag it as
   such.** STT needs a dev build (Expo Go has none): record (`expo-av`) or
   `@react-native-voice/voice`, send transcript to an LLM that returns strict JSON, parse
   into fields. Keep the transcript in one swappable piece of state, and always fall back to
   manual entry if STT/LLM is unavailable. Schema + rules in handoff §8.
6. **Edit mode** — the pencil on a Today card opens the same sheet pre-filled; footer reads
   "Save changes". *(SPEC lists edit as out-of-scope — treat as an additive enhancement.)*
7. **Tabs + History + Profile** (optional, V3-new) — frosted bottom tab bar (Today / History
   / Profile), avatar menu (See profile / Sign out). Match `05-history.png`, `06-profile.png`.

**Libraries:** prefer what's installable for SDK 56 — `react-native-reanimated` (pulse dot,
waveform, sheet entrance), `expo-linear-gradient` (login hero), `expo-glass-effect` (frosted
tab bar), `expo-symbols` (SF Symbols icons), `expo-image`. Add a package only when a feature
truly needs it.

---

## 6. Known mismatches with SPEC.md (follow the code + this file)

1. **Auth is single-path in the code.** `SPEC.md` §4 describes Microsoft OAuth **and** a
   ServiceNow Basic fallback (`signInWithMicrosoft` / `signInWithBasic`). The shipped code
   uses one `startOAuth()` (ServiceNow OAuth 2.0 + PKCE) and `session.accessToken`. The V3
   design is built for the **single SSO path** — keep it. Do not add a Microsoft button or a
   Basic-auth section.
2. **Utilization, needs-attention, and Edit are in.** `SPEC.md` §2 lists Utilization %,
   "needs attention" flags, and edit/delete as **out of scope**, but `today.tsx` already
   implements utilization + needs-attention and the V3 design includes them plus Edit. Treat
   them as **adopted** — keep/restyle them; don't remove working features to match the old
   scope table.
3. **Line booleans are strings.** `StatusLine` flag fields come back as `'true'`/`'false'`
   strings from `sysparm_display_value=true`. Compare with `=== 'true'`.
4. **Don't rename ServiceNow fields/queries.** Field names (`u_*`), the `u_parent` link, and
   the Table API queries are backend truth — leave them exactly as in `servicenow.ts` /
   `SPEC.md`.

---

## 7. Guardrails (non-negotiable)

- **Presentation only.** Do not modify `auth-context.tsx`, `services/servicenow.ts`,
  `services/config.ts`, PKCE/SecureStore logic, or any ServiceNow field name/query.
- Keep repo conventions: **tab indentation**, `@/` import alias, `ThemedText`/`ThemedView`,
  `useTheme()`/`useColorScheme()`, `StyleSheet.create` with `Spacing` tokens.
- `npx tsc --noEmit` must pass after every screen.
- **Light and dark** must both look right — never hardcode a hex that should be a token.
- No new colors outside the token table; **no lime as a fill**; **no yellow "in progress"
  pill**; **effort is never a progress bar**.
- Animations: respect `AccessibilityInfo.isReduceMotionEnabled`; make any sheet/entrance
  animation's resting state visible (never stuck hidden); no infinite decorative loops on
  cards.

## 8. Acceptance

A reviewer comparing the running app (light + dark) to `design/screenshots/` should see a
faithful match: emerald hero login, pulse-dot/check Today cards with right-aligned effort and
a dashed add row, the modal Add sheet, and the Voice→AI fill with AI/Verify tags — with auth
and ServiceNow writes still working end-to-end (a line created on the phone appears in the
ServiceNow record for the same member/day, per `SPEC.md` §12).
