## Plan: Common Calendar Page

Build `common/calendar.html` as a shared calendar experience backed by existing events APIs (`/events`, `/events/calendar`, `/events/upcoming`, `/events/academic-calendar`) and semester/year metadata. Implement Month/Week views, event-type filters, export + sync (.ics), and role-gated personal event creation from one frontend module that can be embedded by role dashboards.

**Steps**
1. Baseline and scope lock: confirm role dashboards using dynamic `page/` loader and decide first host page(s) for calendar entry (recommended: admin, teacher, student, parent dashboards in parallel after core page works).
2. Create frontend API wrappers for events: add `EventAPI` methods in `lms-frontend/assets/js/api.js` using existing endpoints from `API_ENDPOINTS` (index, calendar, upcoming, academic-calendar, CRUD).
3. Add missing endpoint constants if needed in `lms-frontend/assets/js/config.js` (events root, calendar, upcoming, academic-calendar, event-by-id, event-by-type).
4. Build `lms-frontend/common/calendar.html` UI shell: toolbar (month/week toggle), date navigation, filter chips/select, event legend, event list modal/panel, add-event modal (role-gated), export and sync actions.
5. Build `lms-frontend/common/js/calendar.js` state + render engine: calendar grid generation, week strip rendering, event bucket mapping by date range, event overlap display rules, and filter pipeline.
6. Data integration: fetch current semester/year (`ACADEMIC_YEAR_CURRENT`, `SEMESTER_CURRENT`) and event datasets (`events/calendar` for month scope, fallback to `events` range query), normalize payload fields (`event_type`, `start_date`, `end_date`, `all_day`, `is_recurring`).
7. Implement event type filters and role behavior: show all school events for all roles; enable “Add personal event” only for allowed roles (admin/teacher/student/parent per policy) and post via `EventAPI.create` with safe defaults.
8. Implement export: CSV export of currently filtered visible events and optional PDF list (reuse jsPDF+autoTable pattern from timetable pages).
9. Implement sync (.ics): generate RFC5545 file for filtered visible events; include recurring rule only when source event indicates recurrence and recurrence pattern is available.
10. Wire into dashboards: add nav item and page script loading in target role dashboards, using existing hash-based dynamic loader pattern.
11. Hardening and UX: loading/empty/error states, timezone-safe date formatting, escaped content rendering, optimistic updates after create/edit/delete.
12. Verification: API success/error path tests, responsive checks (mobile + desktop), and manual acceptance against the plan checklist items.

**Relevant files**
- `d:/db/lms-api/src/Routes/api.php` — reuse existing event routes (`/events*`) and semester/year routes.
- `d:/db/lms-api/src/Controllers/EventController.php` — reuse methods `index`, `getCalendar`, `getUpcoming`, `getAcademicCalendar`, `create`, `update`, `delete`.
- `d:/db/lms-api/src/Repositories/EventRepository.php` — existing date-range and calendar query behavior to align frontend params.
- `d:/db/lms-frontend/assets/js/config.js` — add/verify event endpoint constants.
- `d:/db/lms-frontend/assets/js/api.js` — add `EventAPI` wrapper block.
- `d:/db/lms-frontend/common/calendar.html` — new shared page markup.
- `d:/db/lms-frontend/common/js/calendar.js` — new shared calendar logic.
- `d:/db/lms-frontend/{role}/dashboard.html` — add nav route + script include for calendar host roles.

**Verification**
1. Open calendar page and confirm Month and Week views render without console errors.
2. Confirm filter by `event_type` updates both calendar cells and event list.
3. Verify semester dates and academic period markers appear from current semester/year APIs.
4. Create a personal event (allowed role): ensure it persists and appears immediately.
5. Export visible events to CSV/PDF and verify file contents reflect current filters.
6. Download `.ics` and import into Google/Outlook calendar; verify date/time and recurrence behavior.
7. Switch viewport to mobile and validate navigation, filters, and modal usability.

**Decisions**
- Reuse existing backend event APIs; no backend schema change required for initial delivery.
- Build `common` page + JS once, then mount in multiple role dashboards.
- Phase 1 includes create/edit/delete personal events only if role policy is approved; otherwise read-only launch first.

**Further Considerations**
1. Recurrence completeness: current events schema has `recurrence_pattern`; if patterns are inconsistent, ship first with non-recurring export and add robust RRULE mapping in phase 2.
2. Permissions: decide exact roles allowed to add personal events before wiring create/update/delete buttons.
3. Performance: for large institutions, prefer server-range queries by visible window over loading all events at once.