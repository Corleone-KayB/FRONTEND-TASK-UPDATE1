# Admin fixes evidence (Step 5)

Captured against the local dev server with every API response mocked (no real backend). Admin role token is faked; no real data.

## Moderation with reports

At 375px the report text wraps, the post id breaks instead of overflowing, and the reason field and buttons wrap onto their own lines.

![Moderation with reports at 375px](moderation-reports-375.png)

At 1280px.

![Moderation with reports at 1280px](moderation-reports-1280.png)

## Moderation empty

![Moderation empty at 375px](moderation-empty-375.png)

![Moderation empty at 1280px](moderation-empty-1280.png)

## Main admin page

Nine stat tiles (the loading skeleton now also shows nine). A field the backend reports as null reads "Unavailable".

![Main admin page at 375px](admin-main-375.png)

![Main admin page at 1280px](admin-main-1280.png)

Error and loading states for moderation, alerts, applications and the main page are covered by `src/app/admin/admin-pages.test.tsx`. The Playwright run also asserted error and empty states and no horizontal overflow at 375 and 1280 for all four pages.
