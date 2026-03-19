# Common Calendar Page Implementation Plan

## REUSABLE FILES & SYMBOLS

### Backend API (Fully Ready)
- **EventController**: [lms-api/src/Controllers/EventController.php](lms-api/src/Controllers/EventController.php)
  - `index()`: GET /events with filters (institution_id, type, start_date, end_date, pagination)
  - `getCalendar()`: GET /events/calendar with month param (Y-m format)
  - `getUpcoming()`: GET /events/upcoming 
  - `getAcademicCalendar()`: GET /events/academic-calendar
  - `getByType()`: GET /events/type/{type}
  - `create()`, `update()`, `delete()` for admin features
  
- **EventRepository**: [lms-api/src/Repositories/EventRepository.php](lms-api/src/Repositories/EventRepository.php)
  - Methods: getAll(), getCalendar(), getUpcoming(), getByType(), getAcademicCalendar()
  - Event types: 'school', 'academic', 'sports', 'cultural', 'exam', 'holiday', 'meeting', 'other'

- **Events Table Schema** (events table)
  - event_id, uuid, institution_id, title, description, event_type
  - start_date, end_date, all_day, location, target_role (role-based access)
  - course_id, created_by, is_recurring, recurrence_pattern, is_published

### Frontend API Configuration

**Missing** - Need to add to [lms-frontend/assets/js/config.js](lms-frontend/assets/js/config.js) API_ENDPOINTS:
```
EVENTS: '/api/events',
EVENT_BY_ID: (id) => `/api/events/${id}`,
EVENTS_CALENDAR: (month) => `/api/events/calendar?month=${month}`,
EVENTS_UPCOMING: '/api/events/upcoming',
EVENTS_ACADEMIC_CALENDAR: '/api/events/academic-calendar',
EVENTS_BY_TYPE: (type) => `/api/events/type/${type}`,
```

Academic Year/Semester endpoints (already present):
- `ACADEMIC_YEAR_CURRENT`: '/api/academic-years/current'
- `SEMESTER_CURRENT`: '/api/semesters/current'

### Reusable Frontend Patterns

**1. Timetable Template** (month/week view pattern)
  - [lms-frontend/teacher/page/timetable.html](lms-frontend/teacher/page/timetable.html) - Structure reference
  - [lms-frontend/teacher/js/timetable.js](lms-frontend/teacher/js/timetable.js#L500-L700) - .ics sync implementation

**2. Attendance Filter Pattern** (filter/export/stats)
  - [lms-frontend/admin/page/attendance.html](lms-frontend/admin/page/attendance.html) - Filter UI structure
  - [lms-frontend/admin/js/attendance.js](lms-frontend/admin/js/attendance.js#L1-L100) - Filter logic bindings

**3. .ics Calendar Sync**
  - [lms-frontend/teacher/js/timetable.js](lms-frontend/teacher/js/timetable.js#L540-L565) - downloadIcsForWeek()
  - Structure: BEGIN:VCALENDAR → VEVENT blocks → RRULE for recurring
  - Blob download pattern (lines 557-565)

**4. PDF/CSV Export**
  - [lms-frontend/teacher/js/timetable.js](lms-frontend/teacher/js/timetable.js#L569-L606) - exportPdf() using jsPDF
  - Fallback to CSV if jsPDF unavailable

## MISSING PIECES TO CREATE

1. **Admin Endpoints** - No backend permission checks (need role-based access for add/edit/delete)
   
2. **Frontend Structure** - Doesn't exist yet:
   - `lms-frontend/common/page/calendar.html` (main page)
   - `lms-frontend/common/js/calendar.js` (logic)
   - `lms-frontend/common/css/calendar.css` (styling - or via Tailwind classes)

3. **Common Folder Integration** - Currently no `/common` folder in frontend
   - Need to establish common page routing in main dashboard
   - Determine which roles access the common calendar

4. **Role-Based Visibility** - Need to implement:
   - target_role field filtering from backend
   - Personal events vs. institutional events
   - Edit permissions (admin only? or by creator?)

## IMPLEMENTATION CONSTRAINTS & RISKS

1. **Date Format Mismatch** - Events table uses datetime; calendar needs YYYY-MM-DD filtering
   - Risk: getCalendar() uses parameter logic (month='2024-03')
   - Mitigated: Backend handles month parsing → ISO ranges

2. **Recurring Events** - is_recurring=1 + recurrence_pattern stored but getCalendar() doesn't expand
   - Risk: .ics sync must manually compute RRULE; calendar view may not show individual occurrences
   - Action: Use getUpcoming() for simple views, or expand recurrence in JS

3. **No Multi-Week Request** - getCalendar() fetches by month only
   - Risk: Timetable can load by week; calendar must always fetch full month
   - OK for MVP: Month view is standard; caching/pagination handled in JS

4. **Target Role Filtering** - Backend supports target_role but no route param
   - Risk: Frontend must filter results by role (or add backend filter param)
   - Action: Fetch all, filter in JS by Auth.getUser().role

5. **Academic Year Context** - No academic_year_id in events table
   - Risk: Calendar can't auto-filter by academic year
   - Workaround: Use start_date/end_date ranges aligned with academic year

6. **Permission Gaps**:
   - EventController.create/update/delete have no role checks beyond auth
   - No "created_by" authorization (anyone can edit any event)
   - Action: Add admin/creator-only checks if adding event management UI

## CONCRETE NEXT STEPS

1. Add EVENTS endpoints to config.js
2. Create folder structure: `common/page/` + `common/js/` + `common/css/`
3. Create `calendar.html` with:
   - Header: title + month/year picker
   - Stats cards (like attendance): Upcoming events count
   - Month grid view (or week tabs like timetable)
   - Filters: event type, role visibility, date range
4. Create `calendar.js` with:
   - loadCalendarData() → API call to getCalendar()
   - renderMonthView() → grid layout
   - .ics download (adapt from teacher timetable)
   - CSV/PDF export (reuse attendance patterns)
5. Establish role access: which roles see common calendar?
6. Test with recurring events if getUpcoming() shows duplicates
