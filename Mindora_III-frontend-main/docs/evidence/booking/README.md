# Booking flow evidence

All API responses were mocked with Playwright `page.route` (patient session, one therapist, generated slots). No real backend was contacted. The red "1 Issue" badge in some screenshots is the Next.js dev overlay reacting to the app's own `console.error` logging of the mocked failure.

- `review-375.png` / `review-1280.png` — review step: therapist, session type, date, time, Back and Confirm.
- `success-375.png` / `success-1280.png` — success screen: "Booking requested", pending therapist confirmation, Done.
- `conflict-375.png` / `conflict-1280.png` — mocked 409 `SLOT_TAKEN`: back on slot selection with the server's message, chosen time cleared.
- `no-slots-375.png` / `no-slots-1280.png` — empty state when the therapist has no availability at all.
- `error-375.png` / `error-1280.png` — mocked 500: error on the review step with Try again.

The network-failure state ("Could not reach the server") was also run at both widths and passed, but is covered by unit tests rather than a screenshot.
