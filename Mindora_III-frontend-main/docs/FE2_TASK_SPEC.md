# Mindora — FE2 Task Specification & Acceptance Checklist

## DOCUMENT PURPOSE

This document defines the implementation responsibilities, expected behavior, acceptance criteria, and testing requirements for the **FE2 developer**.

This specification must be used together with:

- `CLAUDE.md`
- `docs/FE2_IMPLEMENTATION_PLAN.md`

## IMPORTANT PRIORITY RULE

The repository's existing architecture remains the source of truth.

Before implementing anything:

1. Read `CLAUDE.md`.
2. Read `docs/FE2_IMPLEMENTATION_PLAN.md`.
3. Inspect the relevant existing code.
4. Reuse existing components and patterns where appropriate.
5. Avoid duplicating functionality already implemented.

Do not invent a completely separate architecture if the existing repository already provides an appropriate solution.

---

# FE2 RESPONSIBILITIES

FE2 is primarily responsible for:

1. Appointment Booking UI
2. Therapist Dashboard
3. Admin Dashboard
4. Chatbot UI
5. Crisis/Emergency Response UI
6. Responsive design and testing of FE2-related pages

Backend developers may not yet be available.

Therefore, implementation must clearly distinguish between:

- UI that can be completed immediately
- Mocked functionality
- Backend integration points
- Functionality blocked by missing backend APIs

---

# PRIORITY 0 — CRISIS / EMERGENCY RESPONSE

## PRIORITY

**P0 — CRITICAL**

This feature must receive special attention during planning and implementation.

---

## GOAL

The application must be capable of immediately displaying a supportive crisis/emergency response when the system identifies a high-risk situation.

The exact risk detection logic may be implemented by backend/chatbot services.

FE2 is responsible for ensuring that the frontend can correctly respond when a crisis state is returned or triggered.

---

## REQUIRED USER EXPERIENCE

The intended flow is:

```text
User message or interaction
        ↓
System detects high-risk/crisis condition
        ↓
Frontend receives crisis indicator
        ↓
IMMEDIATELY DISPLAY CRISIS RESPONSE
        ↓
Clearly display emergency number 112
        ↓
Backend escalation continues independently
```

The frontend must **not wait** for:

- Email delivery
- SMS delivery
- Phone calls
- Notification completion
- Other escalation workflows

before showing the user immediate crisis guidance.

---

## FRONTEND REQUIREMENTS

Create or reuse a crisis response UI that:

- Is immediately visible when triggered
- Clearly communicates that the user should seek immediate help
- Clearly displays **112**
- Is easy to understand
- Works on mobile devices
- Is visually prominent
- Is accessible
- Can be triggered through a reusable state/prop/service response
- Does not depend on notification completion

---

## IMPLEMENTATION REQUIREMENTS

The implementation should support a future backend response conceptually similar to:

```text
{
  "message": "...",
  "crisisDetected": true
}
```

The exact backend response format must not be assumed.

Once BE3 provides the actual contract, adapt the integration accordingly.

Until then:

- Keep the crisis UI reusable.
- Keep triggering logic isolated.
- Do not hardcode backend assumptions throughout unrelated components.

---

## ACCEPTANCE CRITERIA

The crisis feature is acceptable when:

- [ ] Crisis UI can be triggered reliably.
- [ ] The user-facing response appears immediately.
- [ ] **112** is clearly visible.
- [ ] The interface works on mobile.
- [ ] The interface works on desktop.
- [ ] The UI is understandable and visually prominent.
- [ ] The frontend does not wait for notification workflows.
- [ ] Integration points are documented for BE3.

---

# FEATURE 1 — APPOINTMENT BOOKING

## GOAL

Allow a user to complete an appointment booking flow through a clear and intuitive interface.

The exact backend business rules must follow the contracts provided by the backend team.

---

## EXPECTED USER FLOW

```text
View Therapists
        ↓
Select Therapist
        ↓
View Available Dates/Slots
        ↓
Select Date
        ↓
Select Available Time
        ↓
Review Booking
        ↓
Confirm Booking
        ↓
Success or Error State
```

---

## REQUIRED UI STATES

The booking flow should support:

### Loading

Examples:

- Loading therapists
- Loading availability
- Submitting booking

### Empty

Examples:

- No therapists available
- No available appointment slots

### Error

Examples:

- Failed to load therapists
- Failed to load availability
- Booking failed
- Selected slot is no longer available

### Success

Clearly communicate successful booking completion.

---

## DOUBLE-BOOKING / CONFLICT HANDLING

The frontend must not assume it is the ultimate authority on slot availability.

The backend should handle final booking conflicts.

If the backend reports that a slot is no longer available:

```text
Booking attempt
        ↓
Backend returns conflict/unavailable response
        ↓
Show clear message
        ↓
Refresh or reload available slots
        ↓
Allow user to choose another slot
```

The exact error response must follow the actual backend contract.

---

## MOCK IMPLEMENTATION

While BE2 is unavailable:

- Mock therapists may be used.
- Mock availability may be used.
- Mock booking success/error states may be used.

However:

- Mock data must be isolated.
- Do not scatter fake data throughout page components.
- Use the existing service architecture where available.

Preferred structure:

```text
UI
↓
Service/API abstraction
↓
Mock implementation
```

Later:

```text
UI
↓
Same service/API abstraction
↓
Real backend API
```

---

## ACCEPTANCE CRITERIA

- [ ] User can view/select a therapist.
- [ ] User can select a date.
- [ ] User can view/select available times.
- [ ] Selected appointment details are clearly displayed.
- [ ] Confirmation flow exists.
- [ ] Loading state exists.
- [ ] Empty state exists.
- [ ] Error state exists.
- [ ] Conflict handling is prepared.
- [ ] Mobile layout works.
- [ ] Desktop layout works.
- [ ] Backend integration points are documented.

---

# FEATURE 2 — THERAPIST DASHBOARD

## GOAL

Provide an organized interface for therapist-specific information and workflows.

The actual available functionality must be based on the existing repository and backend requirements.

Do not invent unnecessary features.

---

## ANALYSIS FIRST

Before implementation, determine whether the repository already provides:

- Therapist routes
- Dashboard layout
- Appointment information
- Schedule components
- Existing reusable cards
- Tables
- Calendar components
- Authentication/role guards

Reuse existing functionality where appropriate.

---

## EXPECTED AREAS

Depending on the actual system requirements and available APIs, the therapist dashboard may include:

- Upcoming appointments
- Today's schedule
- Appointment information
- Patient/session-related information

Only implement functionality supported by the project requirements.

---

## REQUIRED STATES

Every data-driven dashboard section should consider:

- Loading
- Empty
- Error
- Success/content

---

## ACCEPTANCE CRITERIA

- [ ] Correct therapist-facing route exists or is integrated.
- [ ] Dashboard follows the project's existing design language.
- [ ] Existing reusable components are used where appropriate.
- [ ] Data sections support loading states.
- [ ] Empty states are handled.
- [ ] Errors are handled.
- [ ] Mobile layout works.
- [ ] Tablet layout works.
- [ ] Desktop layout works.

---

# FEATURE 3 — ADMIN DASHBOARD

## GOAL

Provide the required administrative interface based on actual project requirements.

---

## ANALYSIS FIRST

Before implementing:

- Inspect existing admin routes.
- Inspect role/authorization handling.
- Inspect existing dashboard components.
- Inspect existing data tables.
- Inspect approval-related functionality.

Do not duplicate existing administrative functionality.

---

## POSSIBLE AREAS

Depending on actual requirements and backend support, the admin dashboard may include:

- User information/statistics
- Patient information/statistics
- Therapist information/statistics
- Pending therapist approvals
- Administrative actions

Only implement functionality that is supported by the project requirements.

---

## BACKEND INTEGRATION

Administrative actions such as:

- Approve
- Reject
- Update
- Delete

must not be treated as fully implemented without backend support.

Until APIs are available:

- Build the UI where appropriate.
- Clearly isolate mock behavior.
- Document required backend contracts.

---

## ACCEPTANCE CRITERIA

- [ ] Admin UI follows existing architecture.
- [ ] Existing role protection is respected.
- [ ] Dashboard is responsive.
- [ ] Loading states exist where needed.
- [ ] Empty states exist where needed.
- [ ] Errors are handled.
- [ ] Backend dependencies are documented.

---

# FEATURE 4 — CHATBOT UI

## GOAL

Create or improve a responsive and user-friendly chatbot interface.

---

## REQUIRED STRUCTURE

The chatbot UI should support concepts such as:

```text
Chat Interface
├── Header
├── Message List
├── User Messages
├── Assistant/Bot Messages
├── Typing/Loading Indicator
└── Message Input
```

Adapt these concepts to the repository's actual component structure.

---

## EXPECTED USER FLOW

```text
User enters message
        ↓
User message appears immediately
        ↓
Message is sent to chatbot service
        ↓
Loading/typing state appears
        ↓
Response appears
```

---

## REQUIRED STATES

The chatbot should support:

### Normal

Messages display correctly.

### Loading

A clear response/loading indicator is shown.

### Error

The user receives a helpful error message if communication fails.

### Crisis

If the backend/service identifies a crisis condition:

```text
Chat interaction
        ↓
Crisis indicator received
        ↓
Immediate crisis response UI
```

---

## SECURITY REQUIREMENT

The frontend must not expose sensitive chatbot API credentials.

The intended architecture is:

```text
Frontend
    ↓
Application backend/proxy
    ↓
External chatbot/AI service
```

Do not embed secret keys in frontend code.

---

## ACCEPTANCE CRITERIA

- [ ] User can enter a message.
- [ ] User messages display correctly.
- [ ] Bot responses display correctly.
- [ ] Loading/typing state exists.
- [ ] Errors are handled.
- [ ] Crisis state can trigger the crisis UI.
- [ ] No sensitive API keys are exposed.
- [ ] Mobile layout works.
- [ ] Desktop layout works.
- [ ] Backend integration requirements are documented.

---

# FEATURE 5 — RESPONSIVE DESIGN

## REQUIREMENT

Responsive design must be implemented continuously rather than postponed until the final stage.

---

## TARGET VIEWPORTS

At minimum, test:

### Mobile

Approximately:

```text
375px width
```

### Tablet

Approximately:

```text
768px width
```

### Desktop/Laptop

Approximately:

```text
1280px and above
```

Use the actual project's supported breakpoints where they exist.

---

## CHECK FOR

### Navigation

- Does it fit?
- Does it collapse appropriately?
- Are actions accessible?

### Forms

- Are inputs usable?
- Are buttons visible?
- Is text readable?

### Dashboards

- Do cards stack appropriately?
- Do tables overflow correctly?
- Is important information visible?

### Appointment Booking

- Are therapist cards usable?
- Is date selection usable?
- Are time slots easy to tap?
- Is the confirmation view readable?

### Chatbot

- Does the message list fit?
- Is the input visible?
- Does the keyboard/input area behave reasonably on mobile?

### Crisis UI

- Is emergency information immediately visible?
- Is **112** prominent?
- Are actions easy to access?

---

## ACCEPTANCE CRITERIA

- [ ] No critical horizontal overflow.
- [ ] Navigation works on mobile.
- [ ] Forms work on small screens.
- [ ] Appointment booking works on mobile.
- [ ] Dashboards remain usable.
- [ ] Chatbot remains usable.
- [ ] Crisis UI remains prominent and usable.
- [ ] Desktop layouts remain intact.

---

# BACKEND INTEGRATION REQUIREMENTS

## IMPORTANT RULE

Do not invent confirmed backend endpoints.

Until backend developers provide contracts, document required APIs as:

**PROPOSED — PENDING BACKEND CONFIRMATION**

---

# BE2 — EXPECTED INTEGRATION AREAS

FE2 may require backend support for:

## Therapists

Potential needs:

- Retrieve therapist list
- Retrieve therapist details

## Availability

Potential needs:

- Retrieve available dates
- Retrieve available appointment slots

## Booking

Potential needs:

- Create appointment
- Handle unavailable/conflict response

## Dashboard Data

Potential needs:

- Therapist appointments
- Therapist schedules
- Relevant dashboard information

The actual contracts must be confirmed with BE2.

---

# QUESTIONS FOR BE2

Before final integration, obtain answers to:

1. What are the exact endpoint URLs?
2. What authentication is required?
3. What does each request body look like?
4. What does each successful response look like?
5. What error format is used?
6. How are appointment conflicts represented?
7. How is therapist availability represented?
8. What timezone format is used?
9. Which dashboard data is currently available?

---

# BE3 — EXPECTED INTEGRATION AREAS

FE2 may require backend support for:

- Chatbot communication
- Secure chatbot proxy
- Crisis/risk indicators
- Escalation-related frontend responses

---

# QUESTIONS FOR BE3

Before final integration, obtain answers to:

1. What endpoint should the chatbot UI call?
2. What authentication is required?
3. What request format should messages use?
4. What response format is returned?
5. How is a crisis/risk condition represented?
6. Can crisis information arrive in the same chatbot response?
7. What error responses should the frontend handle?
8. Are notifications/escalations asynchronous from the frontend response?

---

# DEVELOPMENT ORDER

Unless repository analysis reveals a better dependency order, use the following priority:

## PHASE 1 — FOUNDATION

- Understand existing architecture.
- Reuse existing components.
- Establish required UI/service abstractions.
- Avoid unnecessary dependencies.

---

## PHASE 2 — CRISIS/P0 UI

- Ensure crisis UI exists or is implemented.
- Ensure 112 is clearly displayed.
- Ensure crisis UI can be triggered independently.
- Test on mobile and desktop.

---

## PHASE 3 — APPOINTMENT BOOKING UI

- Therapist selection
- Date selection
- Time-slot selection
- Booking summary
- Loading/empty/error states
- Mock service integration

---

## PHASE 4 — CHATBOT UI

- Message interface
- User messages
- Bot messages
- Loading state
- Error state
- Crisis integration point

---

## PHASE 5 — THERAPIST DASHBOARD

Implement only the functionality supported by the actual repository requirements and available APIs.

---

## PHASE 6 — ADMIN DASHBOARD

Implement only the functionality supported by the actual repository requirements and available APIs.

---

## PHASE 7 — RESPONSIVE AND INTEGRATION TESTING

Test all FE2 work continuously across:

- Mobile
- Tablet
- Desktop

Then integrate real backend APIs when available.

---

# DEFINITION OF DONE

A feature is considered complete only when:

## Code

- [ ] Implementation follows existing architecture.
- [ ] Existing components are reused where appropriate.
- [ ] No unnecessary duplication exists.
- [ ] No sensitive secrets are exposed.

## Functionality

- [ ] Main user flow works.
- [ ] Loading states work.
- [ ] Error states work.
- [ ] Empty states work where appropriate.

## Responsive Design

- [ ] Mobile works.
- [ ] Tablet works.
- [ ] Desktop works.

## Integration

- [ ] Backend dependencies are documented.
- [ ] Mock implementations are clearly isolated.
- [ ] Real API integration can replace mocks without rewriting UI.

## Crisis Feature

- [ ] Crisis UI appears immediately when triggered.
- [ ] **112** is clearly displayed.
- [ ] Notification workflows do not block the user-facing response.

---

# FINAL IMPLEMENTATION RULE

For every feature:

```text
INSPECT EXISTING CODE
        ↓
UNDERSTAND EXISTING ARCHITECTURE
        ↓
REUSE WHERE POSSIBLE
        ↓
IMPLEMENT MINIMUM REQUIRED CHANGE
        ↓
RUN APPLICATION
        ↓
TEST FEATURE
        ↓
TEST RESPONSIVENESS
        ↓
DOCUMENT BACKEND DEPENDENCIES
        ↓
VERIFY NOTHING ELSE BROKE
```

Do not mark a feature complete based only on the existence of code.

A feature must be functioning and tested according to the available environment and integration capabilities.