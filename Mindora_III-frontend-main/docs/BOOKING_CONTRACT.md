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
