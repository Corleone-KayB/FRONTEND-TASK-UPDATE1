# Booking contract (FE2 Step 3)

Status of every statement below. Nothing here was tested against the real backend.

## APPROVED by Kwizera Boss; BE2 server side not confirmed

**409 "slot just taken" response** on `POST /api/v1/appointments`:

```json
{ "error": "SLOT_TAKEN", "message": "<friendly text>", "availableSlots": [ ... ] }
```

- `availableSlots` is optional.
- The frontend reads only string fields. It shows `message` when `error === "SLOT_TAKEN"` and `message` is a non-blank string.
- Status-only fallback: if the body is missing, malformed or different, the UI shows its own friendly text ("That slot was just booked by someone else - please pick another time.") and refetches the slots. The refetch happens in every 409 case.
- `availableSlots` is accepted but **not consumed**: the refetched `GET .../availability/:therapistId` stays the single source of truth.

## Already in the repo (existing code, unchanged by this step)

- `GET /api/v1/appointments/availability/:therapistId` returns `{ therapistId, slots: [{ slotStart, slotEnd }] }` (`src/lib/appointments-api.ts`).
- `POST /api/v1/appointments` takes `{ therapistId, slotStart, slotEnd, sessionType }` and returns the created appointment (`BookedAppointment`). `fetchAvailability` / `bookAppointment` are unchanged.
- `apiFetch` throws `ApiError` with the HTTP status. A network failure (no response) becomes `ApiError` with status `0`.

## PROPOSED (frontend assumptions, not confirmed by BE2)

- A newly booked appointment is `PENDING` until the therapist confirms. The success screen says "pending therapist confirmation" (taken from the existing comment on `bookAppointment`).
- Sessions last 50 minutes; the review step shows `slotStart - slotEnd` as returned.
- Non-409 4xx responses carry a user-safe `message`, which is shown as-is. 5xx text is never shown.
- No client-side retry or idempotency key: a retry after a network error could duplicate a booking if the first request actually reached the server. Needs a BE2 answer (idempotency key, or does the server reject the duplicate slot with 409?).
- A 409 that is *not* a slot conflict (other business rule) would currently be shown as "slot taken". Needs a BE2 answer if other 409 reasons exist.

## How the frontend sees it

`submitBooking()` in `src/lib/appointments-api.ts` never throws. It returns one of:
`success` (appointment), `conflict` (optional message) or `error` (`network` flag, optional message). Components never inspect HTTP status codes.

## Public booking entry (FE2 Step 4)

Nothing here was tested against the real backend; browser checks used mocked responses.

### Already in the repo (verified, not changed)

- `GET /api/v1/users/therapists` returns **401 without a login** (verified 2026-11-11). BE2 has not said whether it will be opened.

### PROPOSED / frontend assumptions (not confirmed by BE2)

- **Public list is a stop-gap.** `getPublicTherapists(isAuthenticated)` (`src/lib/public-therapists-api.ts`) returns the real list when logged in and the static **mock** directory (`src/lib/mock-data/therapists.ts`) when logged out. Mock therapists are samples only; their ids are not real user ids and are never sent to the booking APIs. When BE2 opens the endpoint, the mock branch is deleted and nothing else changes.
- **Errors never fall back to mock.** If the real call fails for a logged-in user the page shows an error with "Try again", not mock data.
- **Id mapping.** Booking uses `TherapistProfile.userId` (as `fetchAvailability` / `bookAppointment` already do). `/therapists/[id]` and `/appointments/book/[id]` take that `userId`.
- **Live profile fields.** Only `userName`, `specialisation`, `bio`, `languages`, `photoUrl` are shown. Rating, price, gender, "nearest time" and availability flags do not exist on the profile and are left unset, not invented. The availability / date / duration / gender filters are hidden for live data (they read mock-only fields).
- **Bio paragraphs.** A live `bio` is split into paragraphs on blank lines. `online: true` is assumed because bookings are VIDEO/AUDIO only.
- **Photos.** Live `photoUrl` values are rendered without Next image optimisation (`unoptimized`) because their host is unknown to `next.config`. Needs the real photo host from BE2/BE3 if optimisation is wanted.
- **Public profile of a real therapist, logged out.** There is no by-id endpoint (`GET /users/therapists/:userId` is only proposed), so a logged-out visitor opening a real id sees "Therapist not found" with links to the list and to login (return path = that profile).
- **Book flow.** "Book Now" while logged out goes to `/login?returnUrl=/appointments/book/<id>` (was `/signup`); login validates the path with `safeReturnUrl`. While logged in it goes straight to `/appointments/book/<id>`, which opens the real `BookingDialog`. Closing the dialog goes to `/therapy`.
- **Mock id after login.** A mock therapist id is not in the real list, so booking it after login shows "Therapist not found" with a link back. This is expected until the real list is public.
- **Not accepting patients.** The list only returns `isAcceptingPatients: true`, so a therapist who stopped accepting patients looks the same as an unknown id ("Therapist not found").
- The `/therapists` header ("N therapists on Mindora") still counts the mock list.

### Questions for BE2

1. Will `GET /users/therapists` be opened to anonymous callers (or a public variant)? Which fields are safe to expose?
2. Will there be a by-id endpoint for a single therapist profile?
3. Which host serves `photoUrl`?
