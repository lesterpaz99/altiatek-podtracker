# AltiaTek Pod Tracker Mobile — MVP Specification

## 1. Purpose

Mobile (Expo / React Native / iOS) companion to the existing AltiaTek Pod Tracker
web tool. Lets pod members log their daily status from a phone without opening a
browser. Writes to the **same** ServiceNow backend as the production web portal.

---

## 2. MVP Scope

### In scope
| Step | Screen | What happens |
|------|--------|--------------|
| 1 | Login | Microsoft OAuth 2.0 + PKCE → access token stored in SecureStore |
| 2 | Today | Check whether today's `u_pod_member_status` header exists for the logged-in member |
| 2a | Today (no header) | Show "Create Today's Header" CTA |
| 2b | Today (header exists) | List all `u_pod_status_line` children for that header |
| 3 | Create Header | POST `u_pod_member_status` (fields auto-populated from user profile) |
| 4 | Add Status Line | Full form POST `u_pod_status_line` including task picker |
| 5 | Save | Persist to ServiceNow; on success return to Today and reload lines |

### Out of scope (explicit)
- Edit or delete existing status lines
- Derived metrics: Utilization %, "needs attention" flags
- Editing an already-created header
- Offline mode / local draft queue
- Task search beyond a simple 20-result text query (no pagination, no facet filters)
- Android platform (MVP is iOS only)
- Push notifications

---

## 3. Tech Stack

| Concern | Choice |
|---------|--------|
| Framework | Expo (managed), SDK 56 |
| Language | TypeScript (strict) |
| Routing | expo-router (file-based) |
| Auth | expo-auth-session + expo-web-browser (PKCE) |
| Token storage | expo-secure-store (never AsyncStorage) |
| State | React Context + hooks — no Redux/Zustand |
| HTTP | native `fetch` (no Axios) |
| Build target (MVP) | Expo Go on iOS |

**Packages to add** (not yet in package.json):
```
expo-auth-session   # ~14.x for Expo 56
expo-secure-store   # ~14.x for Expo 56
```

---

## 4. Authentication

### 4.1 Primary path — Microsoft OAuth 2.0 + PKCE

The Microsoft access token is forwarded directly to ServiceNow as a Bearer token
(federated SSO). One login covers both systems.

**Flow:**
1. App calls `AuthSession.makeRedirectUri({ useProxy: true })` to build the
   Expo-proxy redirect URI.
2. App opens the Microsoft authorize URL in `WebBrowser.openAuthSessionAsync`.
3. User authenticates with Microsoft credentials in the browser.
4. Browser redirects to the Expo proxy, which deep-links the auth code back to
   Expo Go.
5. App exchanges the code + PKCE verifier for tokens at the MS token endpoint.
6. `msAccessToken` and `msRefreshToken` are stored in `expo-secure-store`.
7. All subsequent ServiceNow REST requests carry `Authorization: Bearer {msAccessToken}`.

**Scopes:** `openid profile email offline_access`

**PKCE:** `code_challenge_method: S256` — no client secret is ever included.

### 4.2 Fallback path — ServiceNow Basic Auth

If the Azure / SSO integration is not yet configured:
- Login screen exposes a collapsible "Use ServiceNow credentials" section.
- User enters ServiceNow username + password.
- App stores `base64(user:pass)` in SecureStore under key `sn_basic`.
- All REST requests carry `Authorization: Basic {credential}`.
- `AuthContext` tracks `authMethod: 'ms_sso' | 'sn_basic'` so the API
  service emits the correct header.

### 4.3 Session restore

On cold start, `AuthProvider` reads SecureStore before rendering any screen.
`isLoading: true` prevents redirect logic from firing during this window,
eliminating the login-screen flash for users with a valid saved token.

### 4.4 Sign-out

Deletes all SecureStore keys (`ms_access_token`, `ms_refresh_token`,
`ms_token_expires_at`, `sn_basic`) and nulls the session in context.

---

## 5. User Identity Resolution

After a valid session is established, the app queries ServiceNow once to resolve
the member's identity. This runs in `(app)/_layout.tsx` and the result is stored
in `AuthContext.podMember`.

**Step A — Resolve sys_user by email:**
```
GET /api/now/table/sys_user
  ?sysparm_query=email={preferred_username_from_ms_token}
  &sysparm_fields=sys_id,name,email
  &sysparm_limit=1
```
The `preferred_username` claim is read directly from the decoded MS JWT
(`id_token` or access token). No Microsoft Graph call is made.

**Step B — Resolve u_pod_member from sys_user:**
```
GET /api/now/table/u_pod_member
  ?sysparm_query=u_user={sys_user.sys_id}
  &sysparm_fields=sys_id,u_pod,u_team,u_user,u_display_name
  &sysparm_limit=1
```

The resulting `PodMember` object (`sysId`, `podSysId`, `teamSysId`,
`displayName`, `userSysId`, `email`) is the source of truth for all
subsequent API calls. Users belong to exactly one pod — no pod-selector UI
is needed.

---

## 6. Screens and Routes

```
src/app/
├── _layout.tsx                  Root: wraps in <AuthProvider>; renders <Slot>
├── (auth)/
│   ├── _layout.tsx              Stack, no header; redirects authenticated users to /(app)/today
│   └── login.tsx                Login screen
└── (app)/
    ├── _layout.tsx              Stack; redirects unauthenticated to /(auth)/login; resolves identity
    ├── today.tsx                Today screen
    ├── create-header.tsx        Create today's header
    └── add-status-line.tsx      Add status line form
```

### 6.1 `(auth)/login.tsx`
- "Sign in with Microsoft" primary button.
- Collapsible "Use ServiceNow credentials" fallback with username/password fields.
- `ActivityIndicator` while auth in-flight.
- Inline error display on failure.

### 6.2 `(app)/today.tsx`
- Calls `useTodayHeader()` on mount.
- **Loading state:** `ActivityIndicator`.
- **No header:** Empty state + "Create Today's Header" button → navigate to
  `create-header`.
- **Header exists:** Shows header metadata (date, pod name, PODSTAT number,
  member display name) followed by a `FlatList` of status lines from
  `useStatusLines(headerSysId)`.
- Floating "＋" button (visible only when header exists) → navigate to
  `add-status-line`.

### 6.3 `(app)/create-header.tsx`
- Displays the auto-populated values (today's date, pod name, member name).
- No user-editable fields.
- Single "Create Header" CTA → POST, then `router.back()` (Today refetches).

### 6.4 `(app)/add-status-line.tsx`

Full form. All required fields must be non-empty before submit is enabled.

| Field | Type | Notes |
|-------|------|-------|
| `u_no_task` | Toggle (Switch) | OFF → show TaskPicker; ON → show free-text u_assignment_name input |
| `u_assignment` | Task reference (via TaskPicker) | sys_id of selected task; hidden when u_no_task=true |
| `u_assignment_name` | TextInput | Shown only when u_no_task=true |
| `u_current_focus` | TextInput | Required |
| `u_item_name` | TextInput | Required |
| `u_assignment_type` | Picker/Select | Choice values — TBD (see §11 ServiceNow confirms) |
| `u_state` | Picker/Select | Choice values — TBD (see §11 ServiceNow confirms) |
| `u_at_risk` | Checkbox/Switch | Bool |
| `u_needs_help` | Checkbox/Switch | Bool |
| `u_blocked` | Checkbox/Switch | Bool |
| `u_target_date` | Date picker | Required; YYYY-MM-DD |
| `u_time_percent` | Numeric input (0–100) | Required; integer |
| `u_notes` | Multiline TextInput | Required |

On success → `router.back()` to Today; Today refetches lines.

---

## 7. Task Reference Picker

Component: `src/components/task-picker.tsx`
Hook: `src/hooks/use-task-search.ts`

**UX:**
1. TextInput with placeholder "Search tasks…"
2. User types ≥2 characters → hook debounces 400 ms → fires GET request.
3. Results displayed in an overlay `FlatList` (≤20 rows). Each row: `{number} — {short_description}`.
4. Tap a row → task selected, list closes, keyboard dismissed.
5. Selected state shows task number + description in a non-editable row with an "×" clear button.
6. In-flight requests are cancelled via `AbortController` when a new query fires.

**ServiceNow query:**
```
GET /api/now/table/task
  ?sysparm_query=nameLIKE{q}^ORshort_descriptionLIKE{q}^active=true
  &sysparm_fields=sys_id,number,short_description,sys_class_name
  &sysparm_limit=20
```

---

## 8. ServiceNow API Design

Base URL in config: `SERVICENOW_BASE_URL` (default `https://altiatekllcdemo1.service-now.com`).

All calls: `GET|POST /api/now/table/{table}` with:
```
Authorization: Bearer {msAccessToken}   # or Basic {credential}
Accept: application/json
Content-Type: application/json          # on POST
```

### 8.1 Today's header — check

```
GET /api/now/table/u_pod_member_status
  ?sysparm_query=u_pod_member={podMember.sysId}^u_date={YYYY-MM-DD}
  &sysparm_fields=sys_id,u_number,u_date,u_pod,u_team,u_pod_member
  &sysparm_limit=1
```

Empty `result[]` → no header today.

### 8.2 Today's header — create

```
POST /api/now/table/u_pod_member_status
{
  "u_date":       "YYYY-MM-DD",
  "u_pod":        "{podMember.podSysId}",
  "u_team":       "{podMember.teamSysId}",
  "u_pod_member": "{podMember.sysId}"
}
```

### 8.3 Status lines — list

```
GET /api/now/table/u_pod_status_line
  ?sysparm_query=u_parent={header.sys_id}
  &sysparm_fields=sys_id,u_item_name,u_current_focus,u_state,u_assignment_type,
                  u_at_risk,u_needs_help,u_blocked,u_target_date,u_time_percent,
                  u_notes,u_assignment,u_no_task,u_assignment_name
  &sysparm_display_value=true
```

`sysparm_display_value=true` returns reference fields as `{value, display_value}`.

### 8.4 Status line — create

```
POST /api/now/table/u_pod_status_line
{
  "u_parent":           "{header.sys_id}",
  "u_current_focus":    "...",
  "u_item_name":        "...",
  "u_assignment_type":  "...",
  "u_state":            "...",
  "u_at_risk":          false,
  "u_needs_help":       false,
  "u_blocked":          false,
  "u_target_date":      "YYYY-MM-DD",
  "u_time_percent":     50,
  "u_notes":            "...",

  // Task-ref path (u_no_task = false):
  "u_no_task":          false,
  "u_assignment":       "{task.sys_id}",

  // OR no-task path (u_no_task = true):
  "u_no_task":          true,
  "u_assignment_name":  "..."

  // u_pod, u_team, u_pod_member, u_date are intentionally omitted.
  // A Business Rule is expected to copy them from the parent header.
  // If a 400/duplicate-field error appears, add them (see CLAUDE.md §Gotcha).
}
```

---

## 9. File Structure

```
src/
├── app/
│   ├── _layout.tsx
│   ├── (auth)/
│   │   ├── _layout.tsx
│   │   └── login.tsx
│   └── (app)/
│       ├── _layout.tsx
│       ├── today.tsx
│       ├── create-header.tsx
│       └── add-status-line.tsx
├── context/
│   ├── auth-context.tsx           AuthContext, AuthProvider, useAuth
│   └── servicenow-context.tsx     ServiceNowContext, provider, useSN
├── services/
│   ├── auth.ts                    PKCE helpers, token storage, MS token flow
│   ├── servicenow.ts              All REST Table API calls (typed)
│   └── config.ts                  Env/config values (EXPO_PUBLIC_ prefix)
├── hooks/
│   ├── use-today-header.ts        Fetches today's u_pod_member_status
│   ├── use-status-lines.ts        Fetches u_pod_status_line children
│   └── use-task-search.ts         Debounced task search
└── components/
    └── task-picker.tsx            Task reference picker component
```

### `src/services/config.ts` shape

```typescript
export const Config = {
  SERVICENOW_BASE_URL: process.env.EXPO_PUBLIC_SERVICENOW_BASE_URL
    ?? 'https://altiatekllcdemo1.service-now.com',
  MS_TENANT_ID:  process.env.EXPO_PUBLIC_MS_TENANT_ID  ?? '',
  MS_CLIENT_ID:  process.env.EXPO_PUBLIC_MS_CLIENT_ID  ?? '',
  MS_SCOPES:     ['openid', 'profile', 'email', 'offline_access'],
} as const;
```

A `.env` file at the project root holds real values and is gitignored.
`app.config.ts` (replacing `app.json`) reads `.env` and injects values as
`EXPO_PUBLIC_*` variables.

### `AuthContext` shape

```typescript
type AuthMethod = 'ms_sso' | 'sn_basic';

type PodMember = {
  sysId:       string;   // u_pod_member sys_id
  podSysId:    string;   // u_pod reference sys_id
  teamSysId:   string;   // u_team reference sys_id
  userSysId:   string;   // sys_user sys_id
  displayName: string;
  email:       string;
};

type Session = {
  authMethod:         AuthMethod;
  msAccessToken?:     string;
  msRefreshToken?:    string;
  msTokenExpiresAt?:  number;   // epoch ms
  snBasicCredential?: string;   // base64(user:pass)
};

type AuthContextValue = {
  session:             Session | null;
  podMember:           PodMember | null;
  isLoading:           boolean;   // true during SecureStore restore
  isResolvingIdentity: boolean;   // true during sys_user + u_pod_member query
  signInWithMicrosoft: () => Promise<void>;
  signInWithBasic:     (username: string, password: string) => Promise<void>;
  signOut:             () => Promise<void>;
  resolveIdentity:     () => Promise<void>;
};
```

---

## 10. Azure App Registration — What to Configure

> **Status:** To be confirmed. Microsoft OAuth may be replaced by ServiceNow
> Basic Auth if SSO is not already configured in the tenant. The steps below
> apply when Microsoft OAuth is used.

### 10.1 Create the App Registration

1. Open Azure Portal → **Entra ID** → **App registrations** → **New registration**.
2. Name: `AltiaTek Pod Tracker Mobile`
3. Supported account types: **Accounts in this organizational directory only (Single tenant)**
4. Redirect URI platform: **Mobile and desktop applications**
5. Redirect URI value:
   ```
   https://auth.expo.io/@<expo-account-username>/altiatek-podtracker
   ```
   Replace `<expo-account-username>` with the Expo account owner's username.
   This is the Expo-hosted proxy URI required for Expo Go.

### 10.2 Note the identifiers

After creation, copy:
- **Application (client) ID** → `EXPO_PUBLIC_MS_CLIENT_ID` in `.env`
- **Directory (tenant) ID** → `EXPO_PUBLIC_MS_TENANT_ID` in `.env`

### 10.3 API Permissions

Under **API permissions → Add a permission**:
- **Microsoft Graph** → Delegated → `openid`, `profile`, `email`, `offline_access`
- No client secret is created (public client).

### 10.4 Native client setting

Under **Authentication → Advanced settings**, ensure:
- "Allow public client flows" = **Yes**

### 10.5 ServiceNow SSO scope (if applicable)

If AltiaTek has registered ServiceNow as an API application in Entra
(enabling the MS token to be accepted directly by ServiceNow REST), add:
- **API permissions → Add a permission → APIs my organization uses →**
  search for the ServiceNow application → add the relevant delegated scope.

Ask the ServiceNow admin: *"Is the ServiceNow REST API registered in Entra and
does it honor Microsoft Bearer tokens directly?"*

---

## 11. ServiceNow — Confirms Required Before Development

| # | Question | Why it matters |
|---|----------|----------------|
| 11a | Does ServiceNow accept the Microsoft access token as a Bearer on REST calls (Option A), or must the app first exchange the MS token at a ServiceNow OIDC endpoint (Option B)? | Determines whether the SSO path is a single-step or two-step auth |
| 11b | Is the link field on `u_pod_status_line` that points to the parent header named `u_parent`? | Ensures the GET query and POST body use the correct field name |
| 11c | What are the valid `value`/`label` pairs for `u_assignment_type` and `u_state`? Run: `GET /api/now/table/sys_choice?sysparm_query=name=u_pod_status_line^element=u_state` | Required to build the form dropdowns; add results to CLAUDE.md |
| 11d | Does a Business Rule auto-populate `u_pod`, `u_team`, `u_pod_member`, `u_date` on `u_pod_status_line` insert? | If yes, do NOT send those fields in the POST body (duplicate-field error — see CLAUDE.md §Gotcha) |
| 11e | Does `preferred_username` from the MS token match the `email` field on `sys_user`, or a different field (e.g., `user_name`)? | Required for the sys_user resolution query in §5 |
| 11f | Is the `task` table accessible to regular user roles via REST Table API? | Required for the task search feature |

Add confirmed answers to CLAUDE.md before implementation begins.

---

## 12. End-to-End Verification

### Goal
A status line created from the mobile app must appear in the production
ServiceNow instance for the same member and day.

### Steps

1. **Log in on device** using the Expo Go build (`npx expo start`).
2. Confirm the Today screen loads and shows the current date with the correct
   pod name.
3. If no header exists, tap "Create Today's Header" and confirm success.
4. Tap "＋" → fill in the Add Status Line form → tap Save.
5. Confirm the new line appears in the Today screen list immediately.
6. Open a browser and navigate to:
   ```
   https://altiatekllcdemo1.service-now.com/
   ```
7. Navigate to **Pod Tracker → Pod Member Status** (or the equivalent module)
   and open today's record for the same member.
8. Verify the child `u_pod_status_line` record is present with matching
   field values (`u_item_name`, `u_current_focus`, `u_notes`, etc.).
9. Verify no duplicate inherited-field errors appear in the ServiceNow
   System Log.

---

## 13. Security Requirements (non-negotiable)

- No client secret in the app binary.
- All config values (`SERVICENOW_BASE_URL`, `MS_CLIENT_ID`, `MS_TENANT_ID`)
  in `.env` (gitignored) and accessed via `EXPO_PUBLIC_*`.
- Tokens stored **only** in `expo-secure-store` — never `AsyncStorage`.
- PKCE (`S256`) required for the OAuth flow.
- Token refresh must happen transparently before expiry; expired tokens trigger
  silent re-authentication where possible, or redirect to login.
