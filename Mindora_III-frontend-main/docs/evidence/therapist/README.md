# Therapist dashboard fixes evidence (Step 6)

Captured against the local dev server with every API response mocked (no real backend). The therapist role token is faked; all names and ids are made up.

## Schedule

Patient name (from the patients list), session type, start and end time, status and actions. At 375px the name keeps a minimum width and the status and buttons wrap below it.

![Schedule with data at 375px](schedule-375.png)

![Schedule with data at 1280px](schedule-1280.png)

Empty:

![Schedule empty at 375px](schedule-empty-375.png)

![Schedule empty at 1280px](schedule-empty-1280.png)

## Dashboard

![Dashboard with data at 375px](dashboard-375.png)

![Dashboard with data at 1280px](dashboard-1280.png)

Empty:

![Dashboard empty at 375px](dashboard-empty-375.png)

![Dashboard empty at 1280px](dashboard-empty-1280.png)

## Patients

At 375px the fixed-width columns (which overflowed) become a stacked card per patient.

![Patients with data at 375px](patients-375.png)

![Patients with data at 1280px](patients-1280.png)

Empty:

![Patients empty at 375px](patients-empty-375.png)

![Patients empty at 1280px](patients-empty-1280.png)

Loading and error states are covered by `src/app/therapist/therapist-pages.test.tsx`. The Playwright run also asserted data, empty and error states at 375, 768 and 1280, no horizontal overflow, and (dashboard error) no misleading zero stats: 66 checks passed.
