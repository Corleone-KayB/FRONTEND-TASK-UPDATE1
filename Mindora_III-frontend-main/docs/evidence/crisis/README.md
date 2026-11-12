# Crisis overlay evidence

All responses were mocked with Playwright `page.route` (patient session, `/ai/chat` returning `crisisLevel: 5`). No real backend was contacted.

- `crisis-overlay-375.png` — phone (375x667): full-screen overlay, 112 button, crisis line and "I'm safe right now" all in view.
- `crisis-overlay-768.png` — tablet (768x1024): centered dialog over the blurred chat; sidebar shows its "Emergency: 112" button.
- `crisis-overlay-1280.png` — desktop (1280x800): centered dialog over the blurred chat.
- `chat-inline-notice-375.png` — phone: transcript after dismissing the overlay, with the inline safety notice and its 112 link. The fixed-width sidebar squeezes the chat at this width (existing layout, not part of this change).

## Checks (all PASS)
- PASS: at 375px, 112 button visible without scrolling
- PASS: at 375px, crisis line visible without scrolling
- PASS: 112 button href is `tel:112`; crisis line shows +250 783 974 066
- PASS: tel: buttons at least 44px tall (56px and 48px)
- PASS: "I'm safe right now" closes the overlay
- PASS: inline notice contains a 112 link
- PASS: a second crisis reply reopens the overlay
