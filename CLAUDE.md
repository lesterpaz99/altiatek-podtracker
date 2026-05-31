@AGENTS.md

# AltiaTek Pod Tracker — Mobile

Mobile (Expo / React Native) version of the existing production web tool
"AltiaTek Pod Tracker". Reaches feature parity for daily status capture against
the SAME backend: ServiceNow, via the REST Table API. Do NOT build a new backend.

## Stack

- Expo (managed), TypeScript, expo-router
- expo-auth-session + expo-web-browser (OAuth 2.0 Authorization Code + PKCE)
- expo-secure-store for tokens (NEVER AsyncStorage for tokens)
- React Context + hooks only; no extra state library

## Commands

- Start: `npx expo start`
- Typecheck: `npx tsc --noEmit` <- run after any series of changes; must pass

## Security (non-negotiable)

- Public OAuth client: NO client secret in the app.
- All ServiceNow config from env/config files, never hardcoded.
- Tokens only in expo-secure-store.

## ServiceNow backend (real schema)

Instance base URL lives in config as SERVICENOW_BASE_URL (https://altiatekllcdemo1.service-now.com/).

Header table `u_pod_member_status` (one per member+pod+day, number PODSTATxxxx):
u_date, u_pod (ref), u_team (ref), u_pod_member (ref), u_number (read-only)

Line table `u_pod_status_line` (children; link via u_parent -> header sys_id):
u_assignment (ref to `task`), u_no_task (bool), u_assignment_name (string),
u_current_focus (string, required), u_item_name (string, required),
u_assignment_type (choice), u_state (choice),
u_at_risk / u_needs_help / u_blocked (bool),
u_target_date (date, required), u_time_percent (int, required),
u_notes (string, required)
On insert, also set u_pod, u_team, u_pod_member, u_date copied from the parent.

Assignment behaviour (match web portal): u_assignment is a `task` reference picker
by default; when u_no_task is checked, hide the picker and show a free-text input
writing to u_assignment_name (leave u_assignment empty).

## Gotcha to confirm

A ServiceNow Business Rule may auto-populate inherited fields on line insert.
If duplicate-field errors appear on POST, that's the likely cause — flag it, don't guess.
