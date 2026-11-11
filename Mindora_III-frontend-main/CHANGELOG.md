# Changelog

Notable frontend changes, newest first. Working log, not a public release
changelog — entries describe what changed and why.

## 2026-09-29 — Admin document viewer: fixed a real popup-blocking bug, found while verifying the backend's S3 → MongoDB migration

### Fixed — `handleViewDocument` (admin therapist-application detail page) opened a popup that could silently never navigate

`Mindora_V3`'s therapist-application document storage moved from S3 to
MongoDB GridFS this pass (backend-only change, no API contract change:
`GET .../documents/:docId` still returns `{ url, fileName, mimeType,
expiresIn }`). Live end-to-end verification of that migration — clicking
"View" on a real document as an admin, in a real browser, not just curl —
surfaced a real, pre-existing bug in this page unrelated to the storage
backend itself:

`handleViewDocument` called `window.open(doc.url, ...)` _after_ `await
fetchTherapistApplication(...)`. Browsers (Chromium included) only treat
`window.open()` as an authorized user-gesture popup when it's called
synchronously within the click's own call stack — once an `await` comes
first, it's fair game to block, and blocked here meant the button just
did nothing with no error surfaced anywhere.

Fixed with the standard pattern: open a blank tab synchronously (still
inside the click), keep the handle, and set its `location.href` once the
fetch resolves. First attempt at this fix had its own bug, caught before
shipping: passing the `"noopener"` window feature to the initial
`window.open()` call makes it return `null` (the entire point of
`noopener` is severing the reference back to the caller) - a null handle
meant the code fell straight through to the exact same broken post-await
`window.open()` call this was meant to replace. Fixed by opening without
`noopener` to get a real handle, then setting `tab.opener = null` by hand
afterward to get the same security property without losing the handle.

Live-verified end-to-end against the real GridFS-backed download route
through Kong: click → tab opens → navigates to the signed download URL →
correct file loads. One test wrinkle worth recording, not a code issue:
verifying this via Playwright initially looked broken specifically for
PDF documents (tab stuck on `about:blank` forever, no errors) — isolated
down to Chromium's built-in PDF viewer, which Playwright's page-tracking
doesn't observe as a normal navigation (confirmed by testing the identical
flow against a JPEG document instead, which navigated correctly on the
first poll). A real user's browser still opens the PDF normally; this is
purely a test-observability gap, not a bug, and doesn't need a workaround
in the app code - only worth knowing if a future verification pass sees
the same "stuck on blank" symptom against a PDF specifically.

## 2026-09-25 (final — pre-handoff QA pass)

### Fixed — signup's Terms/Privacy checkbox started pre-checked

`SignupForm.tsx`'s `useForm` had `terms: true` as its default value, so the
"I agree to Mindora's Terms and Privacy Notice" checkbox rendered already
checked on page load — a user could hit "Create my space" without ever
affirmatively agreeing to anything. Not just a UX nit: for a platform
handling health data, a pre-ticked consent checkbox isn't valid consent.
Changed the default to `false`. Added `SignupForm.test.tsx` (new, 3
tests) as a regression guard: checkbox starts unchecked, submission is
blocked with a visible validation error until it's checked, and a single
real click both registers and allows submission.

While investigating, re-tested the "Radix Checkbox's first click doesn't
register" quirk flagged (but explicitly not fixed) during earlier
`/run`-skill browser verification. Under a realistic interaction pattern —
a short pause after page load before clicking, same as an actual human
would do, not a script racing the click against hydration — one real
click on the checkbox now (and reliably) registers correctly, both in this
new Jest test and in a fresh live Playwright check. Concluded this was a
hydration-timing artifact specific to a script clicking immediately on
page load, not a defect in the component or a real user-facing bug — no
code change was needed for it beyond the default-value fix above, and
this doesn't need a "wake-up click" workaround in future verification
scripts.

### Verified — full pre-handoff pass, every layer

Before sending to the PO: full backend suite across all 9 services
(`@mindora/*`, not just the 5 touched this build-out) — 15/15 tasks
green, no pre-existing failures anywhere in the repo. Frontend
`type-check`/`lint`/`test` — 15 suites, 84 tests, 0 errors, same 5
pre-existing warnings as every prior milestone. Mobile (`mindora-v3`)
`type-check` and `expo lint` — both clean (no test suite exists for that
app; out of scope to build one from scratch in this pass).

Live end-to-end smoke test in a real browser across all three roles
against the running backend: patient (signup → today → check-in →
therapy/browse → messages → reflect → settings → notification bell),
therapist (schedule → dashboard → availability → patients → settings →
notification bell), and admin (users → therapist applications list →
application detail → analytics → notification bell). Specifically
re-verified the admin review dialogs added in Milestone 7's test pass
(Approve/Reject/Request-info) against a real `SUBMITTED` application in
the running app, not just their unit tests — reject correctly requires a
non-empty reason before the button enables. Zero unexpected console
errors, zero crashes, zero broken layouts across all of the above; the
only console errors seen anywhere were the already-understood, pre-
existing ones (the initial silent-refresh-attempt 401 on first page load
before any session cookie exists, and a `GET /users/me` 404 for a test
account that was SQL-promoted to THERAPIST/ADMIN directly rather than
through the real approval flow, which correctly shows a "Could not load
your profile" banner rather than crashing).

## 2026-09-25 (latest — testing + deployment review, Milestone 7 of the production build-out)

### Added — test coverage for admin review-action dialogs and a small extraction

Following the exact RTL pattern already established by
`RejectApplicationDialog.test.tsx` (mock the mutation hook, assert
disabled/enabled state and the exact payload sent):

- `src/components/admin/RequestInfoDialog.test.tsx` (new, 3 tests) — note
  required and trimmed before the mutation fires, matching Reject's reason
  requirement.
- `src/components/admin/ApproveApplicationDialog.test.tsx` (new, 3 tests)
  — no confirmation-text gate (unlike Reject/RequestInfo, Approve needs no
  free text), confirms it calls the mutation with just the applicationId
  and surfaces the mutation's own error message on failure.
- `src/components/admin/SuspendTherapistDialog.test.tsx` (new, 2 tests) —
  covers both branches of this one dialog (`action: "suspend"` vs.
  `"reactivate"`), confirming each calls its own distinct mutation hook
  with the reason, and that they don't cross-fire.

Also extracted `NotificationBell.tsx`'s inline `formatRelativeTime` into
`src/lib/format-relative-time.ts` specifically so it could be unit-tested
in isolation (`format-relative-time.test.ts`, new, 5 tests) — same reason
`public-paths.ts` was pulled out of `proxy.ts` in Milestone 5. Writing the
test caught a minor rounding quirk worth knowing about, not a bug: a
timestamp exactly 30 seconds old rounds to "1m ago" rather than "just
now" (`Math.round(30000 / 60000)` rounds `0.5` up) — acceptable for a
coarse relative-time label, but the test had to target 10s instead of 30s
to assert the "just now" branch correctly.

Full suite after this pass: 14 test files, 81 tests, all green;
`type-check` and `lint` both clean (same 5 pre-existing warnings as every
prior milestone, no new ones).

## 2026-09-25 (even later — patient/mobile polish, Milestone 6 of the production build-out)

### Added — in-app notification bell (patient, therapist, admin sidebars)

New `src/components/notifications/NotificationBell.tsx`, wired into all
three existing sidebars (`AppSidebar`, `TherapistSidebar`, `AdminSidebar`)
next to the logo. Backed by notification-service's new
`GET/PUT /api/v1/notifications*` endpoints (`src/lib/notifications-api.ts`,
`src/hooks/useNotifications.ts` — `useNotifications()` polls every 30s
since there's no websocket for this feed). Unread-count badge (capped
"9+"), hand-built dropdown panel — no Popover component exists in this
repo yet, and installing one wasn't worth it for a single panel; styled to
match the sidebars' existing neumorphic dark theme rather than looking
like a generic default. Clicking a notification marks it read; a header
"Mark all read" button clears the whole badge. Live-verified in a real
browser as both a patient and a therapist account: badge, empty state,
mark-read, and mark-all-read all confirmed against a running backend
through Kong.

### Added — Settings page: profile + notification preferences

First UI for `src/lib/user-api.ts`'s `updateProfile`/
`updateNotificationPreferences`/`fetchUserPreferences` wrappers, which had
existed unused since an earlier milestone. One shared
`src/components/settings/SettingsForm.tsx` mounted at two routes —
`(app)/settings` (patient) and `therapist/settings` (therapist) — since
the backend endpoints work identically for both roles and the form has no
role-specific fields. Profile section (display name, bio) uses plain
`useState` rather than react-hook-form, matching this app's other simple
forms; deliberately avoids syncing server data into local state via a
`useEffect` (would trip the `react-hooks/set-state-in-effect` lint rule
under this repo's React Compiler config) by treating `null` local state as
"not yet edited, fall back to server value." Only fields the user actually
changed are sent, matching the backend's partial-update contract.
Notification preferences render as three hand-built toggle switches (no
Switch component installed here either) that save immediately on click,
each with its own pending state. New "Settings" nav entry added to
`AppSidebar` and `TherapistSidebar` (not `AdminSidebar` — admin settings
are a separate, out-of-scope concern).

Live-verified end-to-end in a real browser: edited and saved a display
name + bio as a patient, confirmed a "Saved." confirmation, reloaded the
page and confirmed the new name persisted (round-tripped through the real
backend, not just local state); toggled a notification preference and
confirmed its value flipped. Also verified the page degrades correctly
for an account with no `TherapistProfile` row yet (a `GET
/api/v1/users/me` 404) — shows a clear "Could not load your profile."
banner with blank-but-still-editable inputs, rather than crashing; this
was an edge case hit only by directly SQL-promoting a test account to
THERAPIST to bypass the real application-approval flow for testing
speed, not something the real approve flow (which always provisions a
profile) would ever produce.

## 2026-09-25 (later)

### Added — `src/proxy.ts`, a fail-closed edge session gate

First middleware/proxy this app has ever had (`frontend.md` flagged the
Next.js 16 `middleware.ts` → `proxy.ts` rename as something to watch for
"if you add any" — confirmed via the installed `next@16.2.9`'s own
constants and Next's docs that `proxy.ts` + `export default function
proxy()` is the current, non-deprecated convention here, not
`middleware.ts`). Closes a real, specific gap the original audit flagged:
`RouteGuard` (`components/auth/RouteGuard.tsx`) only ever redirected
client-side, after the page's JS had already loaded — a fully logged-out
visitor hitting a protected URL directly still got the full page shell and
JS bundle first. The proxy now redirects before any of that, at the edge.

Deliberately narrow in what it checks: only whether the `refreshToken`
httpOnly cookie is _present_ — not which role the session belongs to. The
access token (which carries role) lives only in browser memory, never in a
cookie, specifically to keep it out of reach of anything but this tab's
own JS; giving the proxy role information would mean adding a new
role-carrying cookie, a real security-architecture tradeoff that wasn't
this pass's call to make unilaterally. Role-specific gating (e.g. a
PATIENT hitting `/admin`) still happens exactly as before, client-side in
`RouteGuard`, backed by the backend's own independent enforcement (the
actual security boundary regardless of anything the frontend does).

Fail-closed by design: a small explicit allowlist of public routes
(`src/lib/public-paths.ts`, pure/tested in isolation since `proxy.ts`
itself imports `next/server` and can't be unit-tested without extra Jest
environment setup) — everything _not_ on that list requires a session.
New protected routes need no changes here; only new genuinely-public
routes need adding to the allowlist, which is the safer direction to be
wrong in.

Live-verified end-to-end in a real browser: unauthenticated visit to
`/admin/analytics` → redirected to `/login?returnUrl=%2Fadmin%2Fanalytics`
→ logging in from there lands back on `/admin/analytics` (reuses the exact
`returnUrl` param `LoginForm`/`SignupForm` already read and validate via
`lib/booking.ts`'s `safeReturnUrl`, no new redirect-target validation
needed) → confirmed an authenticated admin hitting a THERAPIST-only page
still gets correctly bounced to their own dashboard by the existing
`RouteGuard` + a real 403 from the backend, not by the proxy (which only
ever checks session presence) — all three layers doing their own job
without interfering with each other.

## 2026-09-25

### Fixed — the Schedule page (`/therapist`, the default post-login landing for every therapist) has been silently broken this whole time

`useTherapistSchedule` (`hooks/useAppointments.ts`) called
`fetchTherapistSchedule({ date, limit: 100 })`, but appointment-service's
`therapistScheduleQuerySchema` caps `limit` at 50 and 400s above that —
found live while browser-testing the new therapist dashboard/availability/
patients pages below: every navigation back to `/therapist` threw a
`Validation failed` console error and the page never rendered any
appointments. Pre-existing, not introduced by this session's other changes
— confirmed by testing before and after fixing it. Fixed by requesting
`limit: 50`; live-verified the Schedule page now actually shows appointments.

### Added — therapist workspace: dashboard, availability, patients pages

Three new pages under `/therapist/`: `dashboard` (today's sessions, pending/
upcoming/patient-count stat cards), `availability` (weekly working-hours
grid + time-off list, backed by appointment-service's new
`TherapistSchedule`/`TherapistWorkingHours`/`TherapistTimeOff` API), and
`patients` (paginated list of patients the therapist has an actual
appointment relationship with — never a raw platform-wide list). New
`lib/availability.ts` helper module for the working-hours grid's flat-list
↔ per-day-state conversion. Sidebar (`TherapistSidebar.tsx`) gains three
nav entries; existing `Schedule` entry and `/therapist/page.tsx` untouched.
Live-verified end-to-end in a real browser against a running backend:
configured a real weekly schedule (toggled a day on, saved, confirmed it
persisted on reload and via a direct API check), confirmed the patient list
correctly resolves a real patient's name, confirmed dashboard counts.

### Added — admin Analytics page: real charts over admin-service's new `GET /analytics/detailed`

New `/admin/analytics`, separate from the existing Overview page (which
keeps its flat stat cards, untouched) — a date-range picker (Today/7d/30d/
90d/This year/Custom) driving three sections (users, therapist
applications, appointments/sessions), each with stat tiles plus recharts
line/bar charts. First real use of `recharts` in this repo (installed but
zero-imported before this). Followed the `dataviz` skill for form/color/
interaction decisions — notably: single-series charts use one hue, not a
rainbow per category (that's a magnitude comparison, not an identity one);
the only multi-series chart (session trend, 4 simultaneous status lines)
uses the categorical palette; no donut/pie anywhere, per the skill's form
guidance; legend text stays neutral-colored rather than tinted per-series.
New `lib/analytics-date-range.ts` (pure, tested: preset boundary math +
sparse-trend zero-filling for gap-free lines). Live-verified against real
seeded data: default 30-day range correctly excluded a since-future-dated
test appointment; widening to a custom range covering it made it appear
correctly in both the status-breakdown bar and the session-trend line.

## 2026-08-24

### Fixed — Dev-mode navigation took a couple of seconds on every route switch

`package.json`. Measured directly rather than guessed: hitting every sidebar
route twice each showed 0.27–1.6s per request, with **second visits sometimes
slower than the first** — ruling out simple first-visit compile cost and
pointing at steady-state per-request overhead in `next dev`'s dev pipeline.
Client-side navigation itself was already correct (sidebar links use
`next/link`; auth bootstrap runs once at the root layout, not per navigation —
both checked before landing on this).

The `dev` script had never opted into Turbopack, so it was running on
webpack — the slower of Next's two dev compilers. Next 16.2.9 supports
Turbopack for dev as a stable option with nothing in `next.config.ts` that
conflicts with it.

```diff
-    "dev": "next dev",
+    "dev": "next dev --turbopack",
```

Re-measured the same routes after switching: 0.16–0.61s, consistently, no
more 1s+ outliers — roughly 2–4x faster and far more even. This is dev-mode
overhead specifically; a production build (`next build && next start`) has no
equivalent cost.

### Fixed — `Date.now()` called during render in `today/page.tsx`

`src/app/(app)/today/page.tsx`. The `nextSession` memo called `Date.now()`
directly inside its callback to filter out past appointments — an ESLint
`react-hooks/purity` **error** (`Cannot call impure function during render`),
not just a style nit: React's render function can run more than once per
commit (Strict Mode, the compiler), so an impure read taken during render can
disagree with itself between invocations.

There was a real bug riding along with the lint violation: the memo's
dependency array was `[appointmentData]` only, not time, so a session that
quietly passed into the past kept showing as "next" until the appointments
list happened to refetch for an unrelated reason.

```diff
+  const [now] = useState(() => Date.now());
+
   const nextSession = useMemo(() => {
-    const now = Date.now();
     return (
       (appointmentData?.appointments ?? [])
-        .filter((a) => a.status === "PENDING" || a.status === "CONFIRMED")
+        .filter(
+          (a) =>
+            (a.status === "PENDING" || a.status === "CONFIRMED") &&
+            new Date(a.slotStart).getTime() > now
+        )
         .sort(...)[0] ?? null
     );
-  }, [appointmentData]);
+  }, [appointmentData, now]);
```

`now` is taken once via a `useState` lazy initializer (React's sanctioned
escape hatch for a one-time impure read) rather than called fresh each render,
and is now a real memo dependency. Verified against the installed linter
directly, not from memory: `npx eslint` on the file went from 1 error to 0;
full-project `npm run lint` and `npm run type-check` both clean afterward (4
pre-existing warnings remain — react-hook-form/React Compiler notices and
`<img>` vs `next/image` suggestions — informational, not errors).
