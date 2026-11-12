# FE2 Implementation Plan

_Revised 2026-11-11 after a full repository re-analysis. Supersedes the earlier draft of this file, which contained several factual errors (see §A.1)._

Status: **ANALYSIS COMPLETE — AWAITING APPROVAL. No application code has been changed.**

---

## A. Executive Summary

**Project status.** This is not a scaffold. The frontend is a mature Next.js 16 app that is already integrated end-to-end with a **live backend** (auth, user, appointment, mood, admin, AI and messaging services behind a Kong gateway at `https://api.mindora.rw`). ~65 real endpoints are wired through a clean service layer (`src/lib/*-api.ts` → `src/hooks/use*.ts` → components). `frontend.md` and `CHANGELOG.md` document this history in detail.

**FE2 status.** Most FE2 surfaces already exist and are API-backed:

| Area | Reality |
|---|---|
| Appointment booking | **Real, working flow** in `BookingDialog` (session type → date → slot → confirm, 409 conflict handling) — but only reachable from the logged-in `/therapy` page. The public `/therapists` directory and `/appointments/book/[id]` still run on **mock** therapist data and dead-end at a "coming soon" placeholder. |
| Therapist dashboard | Real: schedule (confirm/complete), dashboard stats, availability + time off, patients list. Loading/error/empty states present. |
| Admin dashboard | Real: overview analytics, detailed analytics, users, therapist applications (approve/reject/request-info), alerts, audit log, moderation. |
| Chatbot | Real: `/reflect` → `POST /api/v1/ai/chat` via backend (no secrets in frontend). History, optimistic send, typing state, 429 countdown, retry, delete-history. |
| Crisis (P0) | **Partial.** Chat renders an inline "Safety notice" when `crisisLevel === 5`. **There is no global crisis overlay, no reusable trigger, and the number 112 appears nowhere in the codebase.** |
| Responsive | **Biggest structural gap.** All three authenticated layouts use a fixed 220px sidebar with no mobile collapse — on a 375px phone the content area is ~155px wide. |

**Biggest gaps**
1. No immediate, prominent crisis response with **112** (P0).
2. Authenticated layouts (patient / therapist / admin) are unusable on phones.
3. Public therapist directory + booking page are disconnected from the real booking flow.
4. `/admin/moderation` never renders reports — only loading/error/empty branches exist.

**Biggest risks (need human decisions — see §I)**
- **Conflicting crisis-line numbers in production code**: `AppSidebar.tsx` dials `0783974066`; `Sidebar.tsx` (dead) and `welcome/page.tsx` dial `+250 783 974 068`. One is wrong. Safety-critical.
- **No `package-lock.json` is committed**, but CI (`.github/workflows/ci.yml`) and the `Dockerfile` both run `npm ci`, which fails without a lockfile.
- README is stale (claims Axios, Zustand, `src/store/`, `src/providers/` — none exist).

**Recommended starting point:** Step 1 — global crisis overlay with 112, triggered from the existing `crisisLevel === 5` signal.

### A.1 Corrections to the previous draft
| Previous draft said | Actual |
|---|---|
| State: "Zustand (global)" | Zustand is **not installed**. Global state = React Context (`AuthContext`) + TanStack Query. |
| Create `src/store/useCrisisStore.ts` | `src/store/` doesn't exist; adding Zustand would be a new dependency. Use a React Context instead (matches `AuthContext` pattern). |
| Booking is "UI placeholder" | A full real booking flow exists (`BookingDialog`). Only the public entry point is a placeholder. |
| Propose `crisisDetected: boolean` contract | Backend already returns `crisisLevel: 0–5`; level 5 = safety interstitial (documented in `src/types/domain.ts`). No new contract needed for chat. |
| Mount overlay in `src/app/layout.tsx` | Mount inside `src/lib/providers.tsx` (client component, already wraps the whole tree). |

---

## B. Repository Architecture Summary

| Concern | Actual implementation |
|---|---|
| Framework | Next.js **16.2.9**, App Router, Turbopack dev (`next dev --turbopack`) |
| Language | TypeScript 5, React **19.2.4** |
| Routing | File-based, route groups: `(public)`, `(auth)`, `(app)` (patient), `(triage)`, plus `therapist/`, `admin/`, `welcome/`, `oauth/` |
| Styling | Tailwind CSS **v4** (`@tailwindcss/postcss`), tokens in `src/app/globals.css` (`mindora-purple`, `mindora-sidebar`, …), shadcn-style primitives in `src/components/ui/` built on `@base-ui/react` + Radix |
| Server state | TanStack Query v5 (`src/lib/providers.tsx`; 30s staleTime, no retry on 401) |
| Client/global state | React Context only — `src/contexts/AuthContext.tsx`. **No Zustand.** |
| API layer | Single `fetch` choke point: `apiFetch` / `apiUpload` in `src/lib/api.ts` (base URL `NEXT_PUBLIC_API_URL`, bearer token, silent 401→refresh→retry, typed `ApiError {status, fieldErrors, body}`). One `src/lib/<service>-api.ts` per backend service; one `src/hooks/use<Service>.ts` per service. Components never call `apiFetch` directly. |
| Realtime | `socket.io-client` via `src/lib/messaging-socket.ts` (`NEXT_PUBLIC_SOCKET_URL`) |
| Auth | Access token in memory only (`api.ts`), refresh token in HttpOnly cookie. `RouteGuard` (`src/components/auth/RouteGuard.tsx`) gates layouts by role: `PATIENT` → `(app)`, `THERAPIST` → `therapist/`, `ADMIN` → `admin/`. Server authorizes every call regardless. |
| Forms | react-hook-form + zod |
| Feedback | `sonner` toasts (mounted in `providers.tsx`), inline banners |
| Charts | recharts (admin analytics, mood) |
| Tests | Jest 30 + Testing Library (jsdom). 14 test files (lib helpers + admin dialogs + signup form). |
| CI / Deploy | GitHub Actions (lint, type-check, test, build, docker on `main`); multi-stage `Dockerfile`; `docker-compose.yml` |

**Important directories**
```
src/app/            routes (route groups listed above)
src/components/ui/  primitives: button, card, dialog, badge, input, select, textarea, avatar, progress…
src/components/<feature>/  feature components (therapy, therapist, admin, reflect, layout, …)
src/lib/            api.ts, <service>-api.ts, pure helpers (+ co-located *.test.ts), mock-data/
src/hooks/          TanStack Query hooks per service
src/types/domain.ts all backend request/response types (single source of truth)
src/contexts/       AuthContext
```

---

## C. Current Feature Inventory

### C.1 Route inventory

Status key: **Live** = real API, working · **Mock** = static mock data · **Stub** = placeholder text · **Static** = content page, no data.

| Route | Component | User | Status | FE2 relevance |
|---|---|---|---|---|
| `/` | `(public)/page.tsx` | Public | Static (mock marketing content), redirects if authed | Low |
| `/welcome` | `welcome/page.tsx` | Public | Static alt landing; shows crisis line `+250 783 974 068` | Medium (crisis number) |
| `/about` | `(public)/about/page.tsx` | Public | Static | Low |
| `/business` | `(public)/business/page.tsx` | Public | Static (mock content) | Low |
| `/contact` | → redirect `/support` | Public | Redirect | Low |
| `/support` | `(public)/support/page.tsx` | Public | Static + form; "In crisis?" copy, no number | Medium (crisis) |
| `/tests`, `/tests/[id]`, `/tests/[id]/result` | `TestQuiz`, `TestResult` | Public | Mock (self-assessment, localStorage) | Low |
| `/therapists` | `TherapistDirectory` | Public | **Mock** therapists | **High** (booking entry) |
| `/therapists/[id]` | `(public)/therapists/[id]/page.tsx` | Public | **Mock** therapist profile + `BookNowButton` | **High** |
| `/get-matched` | `GetMatchedFlow` | Public | **Mock** therapists | Medium |
| `/login` | `LoginForm` | Public | Live | Low |
| `/signup` | `SignupForm` | Public | Live | Low |
| `/register` | `(auth)/register/page.tsx` | Public | **Stub** ("coming soon") | Low (FE1) |
| `/oauth/success` | `oauth/success/page.tsx` | Public | Live | Low |
| `/home` | → redirect `/today` | Patient | Redirect | Low |
| `/today` | `today/page.tsx` | Patient | Live (streak, next session, mood) | Low |
| `/check-in` | `CheckInForm` etc. | Patient | Live | Low |
| `/therapy` | `(app)/therapy/page.tsx` + `BookingDialog` | Patient | **Live** — therapist list, book, cancel, rate | **High** |
| `/appointments/book/[id]` | `(app)/appointments/book/[id]/page.tsx` | Patient | **Stub + Mock** — "booking will connect soon" | **High** |
| `/messages` | `MessagesView` | Patient | Live (socket; flagged unverified in `frontend.md`) | Low |
| `/reflect` | `ReflectChat` | Patient | **Live** AI chat, inline crisis notice at level 5 | **High** (chatbot + crisis) |
| `/settings` | `SettingsForm` | Patient | Live | Low |
| `/therapist-application`, `/new` | `TherapistApplicationForm` | Patient | Live | Low |
| `/therapist` | `therapist/page.tsx` | Therapist | **Live** schedule, date filter, confirm/complete, mood report | **High** |
| `/therapist/dashboard` | `therapist/dashboard/page.tsx` | Therapist | **Live** stats + today's sessions | **High** |
| `/therapist/availability` | `therapist/availability/page.tsx` + `TimeOffDialog` | Therapist | **Live** working hours + time off | **High** |
| `/therapist/patients` | `therapist/patients/page.tsx` | Therapist | **Live** paginated patients | **High** |
| `/therapist/settings` | `SettingsForm` | Therapist | Live | Low |
| `/admin` | `admin/page.tsx` | Admin | **Live** platform stats | **High** |
| `/admin/analytics` | `admin/analytics/page.tsx` | Admin | **Live** charts, date ranges | **High** |
| `/admin/users` | `admin/users/page.tsx` + `SuspendUserDialog` | Admin | **Live** | **High** |
| `/admin/therapist-applications`, `/[id]` | list + detail + approve/reject/request-info dialogs | Admin | **Live** (pending approvals) | **High** |
| `/admin/alerts` | `admin/alerts/page.tsx` | Admin | **Live** `AI_CRISIS` / `MOOD_CONCERN` alerts, resolve | **High** |
| `/admin/audit-log` | `admin/audit-log/page.tsx` | Admin | **Live** | Medium |
| `/admin/moderation` | `admin/moderation/page.tsx` | Admin | **Partial** — reports never rendered (bug) | Medium |
| `not-found`, `error`, `global-error`, `(app)/error` | boundaries | All | Present | Low |

### C.2 Component inventory (FE2-relevant)

| Component | Location | Purpose | Reuse decision |
|---|---|---|---|
| `Dialog` + parts | `src/components/ui/dialog.tsx` | base-ui dialog (focus trap, Esc, ARIA) | **Reuse** for crisis overlay |
| `Button`, `Card`, `Badge`, `Input`, `Select`, `Textarea`, `Avatar` | `src/components/ui/` | Primitives | Reuse everywhere; do not duplicate |
| `BookingDialog` | `src/components/therapy/` | Full real booking flow | **Reuse** from public/booking page; extend with review step + success state |
| `TherapistCard` (therapy) | `src/components/therapy/TherapistCard.tsx` | Real `TherapistProfile` card | Reuse for real directory |
| `TherapistCard` / `TherapistAvatar` (public) | `src/components/therapists/TherapistCard.tsx` | **Mock** `Therapist` shape | Keep for now; replace usage when public directory goes live |
| `TherapistDirectory` | `src/components/therapists/` | Mock-backed filterable directory | Extend to accept real data |
| `GetStartedDialog` | `src/components/therapy/` | Book vs. chat choice | Reuse |
| `AppointmentRow`, `CancelDialog`, `RateDialog` | `src/components/therapy/` | Patient appointments | Reuse |
| `NextSessionCard` | `src/components/home/` | Next appointment | Reuse |
| `MoodReportDialog`, `TimeOffDialog` | `src/components/therapist/` | Therapist tools | Reuse |
| `AppSidebar` | `src/components/layout/` | Patient nav + crisis block | **Modify** (mobile drawer, 112) |
| `TherapistSidebar` | `src/components/layout/` | Therapist nav | **Modify** (mobile drawer) |
| `AdminSidebar` | `src/components/admin/` | Admin nav | **Modify** (mobile drawer) |
| `Sidebar`, `AppLayout` | `src/components/layout/` | **Dead code** (documented in `frontend.md`) | Leave; flag for deletion (not FE2's call) |
| `ReflectChat` | `src/components/reflect/` | AI chat | **Modify** (fire crisis trigger) |
| Admin dialogs (Approve/Reject/RequestInfo/Suspend*) | `src/components/admin/` | Admin actions, tested | Reuse |
| `RouteGuard` | `src/components/auth/` | Role gating | Do not modify |

### C.3 API / service layer

**Confirmed existing APIs (already wired, live backend)** — grouped by service file:

- `appointments-api.ts`: `GET /users/therapists`, `GET /appointments/availability/:therapistId`, `GET /appointments/mine`, `POST /appointments` (409 on taken slot), `PUT /appointments/:id/cancel|confirm|complete`, `POST /appointments/:id/rate`, `GET /appointments/schedule`, `GET /appointments/dashboard`, `GET|PUT /appointments/availability`, `GET|POST /appointments/time-off`, `DELETE /appointments/time-off/:id`, `GET /appointments/patients`
- `ai-api.ts`: `POST /ai/chat` → `{response, crisisLevel 0–5, sessionId}` (429 with `retryAfterSeconds`), `GET|DELETE /ai/history`
- `admin-api.ts`: analytics (+detailed), users (suspend/reactivate), therapists (suspend/reactivate), therapist-applications (list/detail/approve/reject/request-info/notes/documents), alerts (+resolve), audit-log, moderation queue/decrypt/resolve
- `mood-api.ts`, `messaging-api.ts` + socket, `notifications-api.ts`, `user-api.ts`, `auth-api.ts`, `therapist-application-api.ts`

All paths are prefixed `/api/v1`. No secrets in the frontend: the only env vars are the two `NEXT_PUBLIC_*` base URLs.

**Mock data (isolated in `src/lib/mock-data/`)**: `therapists.ts` (public directory/profile/booking/get-matched), `public.ts` (marketing copy), `tests.ts` (self-assessments).

**APIs FE2 needs that are NOT available / not confirmed**
- Public (unauthenticated) therapist list / profile — `GET /users/therapists` is currently called only from authenticated pages; whether it works without a token is **unverified**.
- A therapist-by-id endpoint (`GET /users/therapists/:id`) — not present in the code.
- Crisis signals from sources other than chat (e.g., mood check-in) — none exist.
- Patient names for therapist views — therapist pages currently show `Patient 1a2b3c4d` (truncated ID); no name field in `BookedAppointment`.

---

## D. FE2 Gap Analysis

| Feature | Current status | Existing implementation | Missing work | Backend dependency | Priority |
|---|---|---|---|---|---|
| Crisis response UI | PARTIALLY COMPLETE | Inline level-5 notice in `ReflectChat.tsx`; static crisis-line card in `AppSidebar.tsx` | Global overlay that opens immediately; **112** displayed prominently with `tel:112`; reusable trigger (context); mobile-first layout; a11y (alertdialog role, focus, large tap targets); 112 in sidebar card | None for chat (contract exists: `crisisLevel === 5`). Other triggers would need BE3. | **P0** |
| Responsive authenticated layouts | NOT STARTED | Fixed `w-[220px]` sidebars in 3 layouts | Mobile top bar + slide-in drawer below `lg`; crisis/112 reachable on mobile | None | **P1** |
| Appointment booking — public entry | UI ONLY (mock) | `/therapists`, `/therapists/[id]`, `/appointments/book/[id]` on mock data | Route `/appointments/book/[id]` to real therapist + real `BookingDialog` flow; handle unknown therapist | Needs: is `GET /users/therapists` public? is there a by-id endpoint? (BE2) | P1 |
| Appointment booking — flow | PARTIALLY COMPLETE | `BookingDialog`: type → date → slot → confirm, loading text, empty day, 409 → refetch | Review/summary step before confirm; explicit success state (currently just closes); availability fetch **error** state (currently silent); "no availability at all" empty state | None (live) | P1 |
| Chatbot UI | COMPLETE (functional) | `ReflectChat` with history, typing, errors, 429, retry | Fire global crisis trigger on level 5; mobile padding/height check | None | P2 (part of Step 1) |
| Therapist dashboard | PARTIALLY COMPLETE | 4 live pages with states | Mobile layout (via sidebar fix); patient display name (shows truncated ID) | Patient name in appointment payload (BE2) | P3 |
| Admin dashboard | PARTIALLY COMPLETE | 8 live pages | `/admin/moderation` doesn't render reports; overview skeleton shows 8 tiles for 9 stats; mobile layout (via sidebar fix) | None (queue endpoint + type exist in `admin-api.ts`) | P3 |
| Responsive — pages/dialogs | NOT VERIFIED | Pages use `px-6 lg:px-10`, auto-fit grids | Verify at 375 / 768 / 1280 after layout fix; fix overflow on list rows | None | P2 |

---

## E. Recommended Implementation Order

1. **Crisis overlay + 112 (P0).** Highest risk to users; no backend work needed because `crisisLevel === 5` already exists. Self-contained: one context, one component, one hook-up in `ReflectChat`, one mount in `providers.tsx`.
2. **Mobile navigation for the three authenticated layouts.** Blocks every other responsive check — dashboards, booking and chat can't be judged on mobile while the sidebar eats 60% of the screen. Also makes the crisis card reachable on phones.
3. **Booking flow polish in `BookingDialog`.** Review step, success state, availability error and empty states. Live API, so it's testable for real immediately.
4. **Public booking entry point (`/appointments/book/[id]`).** Depends on step 3 and on BE2 answers about public therapist access; can fall back to sending authed users to `/therapy` with the dialog open.
5. **Admin moderation fix + small dashboard fixes.** Small, independent bug fixes.
6. **Responsive verification pass** across all FE2 pages at 375 / 768 / 1280, fixing what's found.
7. **Docs**: update this plan's status column after each step.

---

## F. Exact File-Level Plan

### Step 1 — Crisis overlay (P0)

**New**
- `src/contexts/CrisisContext.tsx`
  - `CrisisProvider` + `useCrisis()` → `{ isOpen, trigger(source, message?), dismiss() }`. Pure client state; **no network calls**, so it opens synchronously when triggered.
  - Mirrors the existing `AuthContext` pattern (no new dependency).
- `src/components/crisis/CrisisOverlay.tsx`
  - Built on existing `ui/dialog.tsx`. Full-screen on mobile, centered card on desktop.
  - Large **"Call 112"** button (`tel:112`), secondary Mindora crisis line (number pending §I decision), supportive copy, shows the backend's clinical message verbatim when provided.
  - `role="alertdialog"`, labelled heading, initial focus on the 112 button, ≥48px tap targets, high contrast; dismissible ("I'm safe right now") so it never traps the user.
- `src/components/crisis/CrisisOverlay.test.tsx` — renders 112, `tel:112` href, opens on trigger, dismisses.
- `src/lib/crisis.ts` (+ `crisis.test.ts`) — `isCrisisResponse(r: { crisisLevel: number })` = `crisisLevel >= 5`, the **single** place the threshold lives (so a BE3 contract change touches one line).

**Modify**
- `src/lib/providers.tsx` — wrap children in `CrisisProvider` and mount `<CrisisOverlay />` next to `<Toaster />`. Additive only.
- `src/components/reflect/ReflectChat.tsx` — in the existing `onSuccess`, call `trigger("ai-chat", data.response)` when `isCrisisResponse(data)`. Keep the inline transcript notice (history playback still needs it); add a 112 line inside it. **Do not** trigger on history load (would re-alarm on every visit).
- `src/components/layout/AppSidebar.tsx` — add an explicit "Emergency: 112" line/button to the existing crisis card; fix the crisis-line number per §I.

### Step 2 — Mobile navigation

**New**
- `src/components/layout/MobileNavShell.tsx` — shared wrapper: renders a top bar (logo, menu button, emergency button for patients) below `lg`, and opens the given sidebar as a slide-in drawer; on `lg+` renders the sidebar inline exactly as today. Built with existing `Dialog`/Tailwind; no new dependency.

**Modify**
- `src/app/(app)/layout.tsx`, `src/app/therapist/layout.tsx`, `src/app/admin/layout.tsx` — wrap the sidebar in `MobileNavShell`. `RouteGuard` untouched.
- `AppSidebar.tsx`, `TherapistSidebar.tsx`, `AdminSidebar.tsx` — accept an optional `onNavigate` to close the drawer after a link click; make width `w-full` inside the drawer. Desktop appearance unchanged.

### Step 3 — Booking flow polish

**Modify**
- `src/components/therapy/BookingDialog.tsx`
  - Add availability **error** state (`useAvailability` `isError`) with retry.
  - Add "no availability in the next N days" empty state (currently renders empty date strip).
  - Add a **review step** (therapist, date, time, session type, 50-min duration) before the final confirm.
  - Add a **success state** (confirmation + "status: pending therapist confirmation") instead of silently closing.
  - Keep existing 409 handling.
- `src/components/therapy/BookingDialog.test.tsx` (new) — mock `@/hooks/useAppointments`; cover loading, empty, error, 409, success.

### Step 4 — Public booking entry

**Modify**
- `src/app/(app)/appointments/book/[id]/page.tsx` — replace placeholder: resolve therapist via real `useTherapists` (or a by-id endpoint if BE2 provides one), open `BookingDialog`; not-found state if the id isn't returned. Remove `generateStaticParams` over mock data.
- `src/components/therapists/TherapistDirectory.tsx`, `src/app/(public)/therapists/**` — **only after BE2 confirms public access**: switch from `mock-data/therapists` to `useTherapists`. Until then, leave on mock (it's isolated already).

### Step 5 — Admin fixes

**Modify**
- `src/app/admin/moderation/page.tsx` — render the `reports` list using the existing `useModerationQueue` / `useResolveModerationReport` hooks in `useAdmin.ts`. `ModerationReport` is currently a non-exported interface in `src/lib/admin-api.ts` — move it to `src/types/domain.ts` (matching the repo convention) so the page can type it.
- `src/app/admin/page.tsx` — skeleton count 8 → 9.

### Step 6 — Responsive pass
Files touched only as found (row layouts in `therapist/patients`, `admin/users`, `admin/therapist-applications`, `AppointmentRow`, `BookingDialog` date strip, `ReflectChat` padding).

---

## G. Backend Integration Contract Requirements

### G.1 Chat crisis signal — **CONFIRMED (exists in repo)**
- `POST /api/v1/ai/chat` → `{ response: string, crisisLevel: 0–5, sessionId: string|null }`. Level 5 = fixed clinical copy, provider not called. Levels 1–4 "being redefined — don't branch UI" (`src/types/domain.ts`).
- Auth: patient bearer token. Errors: 400 `{error}`, 429 `{retryAfterSeconds}`, 502.
- **Questions for BE3**
  1. Is escalation (admin alert, notifications) fully async from the chat response? (The frontend shows the overlay on response receipt regardless.)
  2. Will levels 1–4 ever require a lighter UI (e.g., banner)? If so, what thresholds?
  3. Any other services (mood check-in) that will emit a crisis indicator to the client? Same `crisisLevel` shape?
  4. Is the level-5 copy's "we can help connect you" line going to get an endpoint/action?

### G.2 Public therapist access — **PROPOSED**
- Purpose: let logged-out users browse real therapists on `/therapists` and `/therapists/[id]`.
- Request: `GET /api/v1/users/therapists` without `Authorization`; `GET /api/v1/users/therapists/:userId` (proposed).
- Response: existing `TherapistProfile` shape.
- **Verified 2026-11-11:** `GET /api/v1/users/therapists` without a token returns **401** — it is currently auth-only.
- **Questions for BE2**: Can the list endpoint (or a public variant) be opened to anonymous users? Is there / will there be a by-id endpoint? Which fields are safe to expose publicly? If the answer is "no", the product fallback is to require login before browsing (decision §I.4).

### G.3 Booking — **CONFIRMED (exists in repo)**, clarifications needed
- `GET /appointments/availability/:therapistId?from&to` → `{therapistId, slots[]}`; `POST /appointments` → `BookedAppointment` (PENDING), 409 on conflict.
- **Questions for BE2**: Default `from/to` window when omitted? Timezone of returned slots (UTC ISO assumed)? Max bookings per patient / per-day limit, and its error code? Is the 409 body structured (e.g., reason code)?

### G.4 Patient display names for therapists — **PROPOSED**
- Purpose: replace `Patient 1a2b3c4d` in schedule/dashboard.
- Proposed: add `patientName` to `BookedAppointment` in `/appointments/schedule` and `/appointments/dashboard`, or confirm `/appointments/patients` returns names.
- **Question for BE2**: Is exposing patient name to their own therapist acceptable under the privacy model?

---

## H. Testing Plan

Existing tooling: Jest + Testing Library (`npm test`), `npm run type-check`, `npm run lint`, `npm run build`. Browser checks via devtools device emulation at **375×812 (mobile), 768×1024 (tablet), 1280×800 (desktop)**.

| Feature | Happy path | Loading | Error | Empty | Responsive | Integration (live backend) |
|---|---|---|---|---|---|---|
| Crisis overlay | Trigger → overlay visible on the same render, 112 button has `tel:112`, dismiss works | n/a (no network) | Overlay still opens if chat request later fails? (n/a — only on success) | n/a | Full-screen at 375; no scroll needed to see 112; tap target ≥48px | Send a level-5 message to `/ai/chat` on staging; confirm overlay; confirm admin `/admin/alerts` gets `AI_CRISIS` independently |
| Mobile nav | Open drawer, navigate, drawer closes | n/a | n/a | n/a | Drawer <1024px, inline ≥1024px; no horizontal scroll | n/a |
| Booking dialog | Type → date → slot → review → confirm → success | "Loading open slots…" | Availability fetch fails → message + retry; generic POST error | Day with no slots; therapist with no availability | Date strip scrolls on 375; dialog fits viewport | Book real slot; 409 by booking same slot from two sessions |
| Public booking page | Valid id → dialog | spinner | unknown id → not-found | n/a | 375/768/1280 | Pending BE2 (G.2) |
| Chat | Send, receive, history | Thinking indicator | 429 countdown, 502 retry | Empty transcript prompt | Composer visible above mobile keyboard | Already live |
| Therapist pages | Confirm / complete appointment | skeleton/text | error banner | "no sessions" | Rows wrap at 375 | Live |
| Admin pages | Approve application, resolve alert, moderation list | skeleton | error banner, 503 moderation | empty lists | Rows wrap at 375 | Live |

Regression: run full `npm test`, `type-check`, `lint`, `build` after every step.

---

## I. Decisions Requiring Human Attention

1. **Which Mindora crisis-line number is correct?** `0783974066` (AppSidebar) vs `+250 783 974 068` (welcome page, dead Sidebar). `frontend.md` says the change was to `+250 783 974 068`, suggesting `AppSidebar` has a typo — **needs confirmation before shipping.**
2. **Overlay dismissal**: allow immediate dismiss, or require an explicit acknowledgement ("I'm safe right now")? Plan assumes explicit-but-instant acknowledgement.
3. **Lockfile**: CI/Docker run `npm ci`, which fails without a committed lockfile. `npm install` today generated `package-lock.json` locally — commit it? Outside FE2 scope; flag to the team.
6. **Test accounts**: need patient, therapist and admin credentials on the live backend (or a staging backend) to browser-verify authenticated FE2 pages.
4. **Public directory**: keep on mock until BE2 confirms public access (plan default), or require login to browse?
5. **Dead code** (`Sidebar.tsx`, `AppLayout.tsx`) and stale README — FE1/team call; not touched by this plan.

---

## J. Environment Run Results (2026-11-11)

Environment: Windows 11, Node v24.11.1, npm 11.11.1. No `.env.local` — app uses the default `NEXT_PUBLIC_API_URL=https://api.mindora.rw` (live).

| Check | Result |
|---|---|
| `npm install` | ✅ exit 0. 28 audit vulnerabilities reported (1 low, 24 moderate, 2 high, 1 critical) — not investigated, pre-existing. Generated a `package-lock.json` (none was committed). |
| `npm run type-check` | ✅ 0 errors |
| `npm run lint` | ✅ 0 errors, 5 warnings (pre-existing: `react-hooks/incompatible-library` on RHF `watch()` in `TherapistApplicationForm.tsx`; `@next/next/no-img-element` in `AppointmentRow.tsx`, `therapy/TherapistCard.tsx`, …) |
| `npm test` | ✅ 14 suites, 81 tests passed |
| `npm run build` | ✅ Compiled; 51 static pages generated |
| `npm run dev` | ✅ Ready in ~1.8s on http://localhost:3000 |
| Route smoke test (curl) | ✅ All 20 sampled routes return 200; unknown route returns 404. Authenticated routes return the `RouteGuard` shell (client-side redirect to `/login`). |
| Backend reachability | ✅ `api.mindora.rw` responds. **`GET /api/v1/users/therapists` returns 401 without a token** — the public directory cannot use it as-is (see G.2). |

**Warnings / environment notes**
- Turbopack warns about multiple lockfiles: a stray `C:\Users\USER\Downloads\package-lock.json` (outside the repo) makes Next infer the wrong workspace root. Local-machine issue — delete that stray file or set `turbopack.root`; no repo change needed.
- `/appointments/book/[id]` only prerenders the single mock therapist id (`nsengiyumva-athanase`); any real therapist `userId` resolves to not-found. Confirms Step 4.
- **Not verified in a real browser yet**: authenticated pages (patient/therapist/admin) need test credentials for each role against the live backend. Responsive findings in §D are from code inspection (fixed `w-[220px]` sidebars), to be confirmed visually during Step 2.
