# Ghana SHS LMS - Frontend Development Plan (5 Stages)

**Project:** Ghana Senior High School Learning Management System - Frontend  
**Version:** 1.0  
**Created:** March 4, 2026  
**Total Pages to Build:** 70 pages  
**Timeline:** 12-14 weeks  
**Approach:** 5-Stage Progressive Development

---

## 📋 Table of Contents

- [Overview](#overview)
- [Development Philosophy](#development-philosophy)
- [Stage 1: Foundation & Authentication](#stage-1-foundation--authentication-2-weeks)
- [Stage 2: Core Management](#stage-2-core-management-3-weeks)
- [Stage 3: Academic Operations](#stage-3-academic-operations-3-weeks)
- [Stage 4: Assessment & Reporting](#stage-4-assessment--reporting-3-weeks)
- [Stage 5: Communication & Polish](#stage-5-communication--polish-2-3-weeks)
- [Success Metrics](#success-metrics)
- [Risk Management](#risk-management)

---

## 🎯 Overview

This document outlines the 5-stage approach to building the Ghana SHS LMS frontend from the current state (25 incomplete pages) to a fully functional system (95 complete pages).

### Current Status

- **Existing Pages:** 25 (70% incomplete/need enhancement)
- **Pages to Create:** 70
- **Total Target:** 95 fully functional pages

### Development Stages

| Stage | Focus Area             | Duration  | Pages | Deliverable                       |
| ----- | ---------------------- | --------- | ----- | --------------------------------- |
| **1** | Foundation & Auth      | 2 weeks   | 10    | Working login & dashboards        |
| **2** | Core Management        | 3 weeks   | 20    | Student/Teacher/Class management  |
| **3** | Academic Operations    | 3 weeks   | 20    | Attendance, Schedule, Materials   |
| **4** | Assessment & Reporting | 3 weeks   | 15    | Assignments, Grades, Reports      |
| **5** | Communication & Polish | 2-3 weeks | 30    | Messages, Analytics, Final polish |

---

## 💡 Development Philosophy

### Progressive Enhancement

Each stage builds upon the previous, ensuring:

- ✅ Working software at end of each stage
- ✅ Testable deliverables
- ✅ Incremental value delivery
- ✅ Early feedback opportunities

### Quality Gates

Every stage must pass:

- ✅ All API integrations working
- ✅ No console errors
- ✅ Responsive design verified
- ✅ Role-based access enforced
- ✅ User acceptance testing passed

### Technology Stack

- **Frontend:** HTML5, CSS3, JavaScript (ES6+)
- **UI Framework:** Tailwind CSS 3.x (via CDN for development)
- **JavaScript Libraries:** Chart.js, DataTables
- **API Communication:** Fetch API
- **Export:** jsPDF, XLSX
- **Icons:** Font Awesome 6.4.0
- **Backend API:** REST API (http://127.0.0.1:8000/api)

---

## 🚀 STAGE 1: Foundation & Authentication (2 weeks)

### Objective

Build a solid foundation with working authentication and basic dashboards for all roles.

### Deliverables

- ✅ Secure authentication system
- ✅ Role-based login and redirect
- ✅ Functional dashboards with live data
- ✅ Common components (sidebar, header, footer)

---

### Week 1: Authentication & Infrastructure

#### 📝 Tasks

**Day 1-2: Core Configuration**

- [x] **Configure API Integration**
  - Update `assets/js/config.js` with production-ready settings
  - Set up environment variables for dev/staging/production
  - Configure CORS handling
- [x] **Build Authentication Module**
  - Complete `assets/js/auth.js`
    - Login/logout functions
    - Token management (storage, refresh)
    - Session timeout handling
    - Role-based redirects
- [x] **Enhance API Client**
  - Complete `assets/js/api.js`
    - HTTP methods (GET, POST, PUT, DELETE)
    - Error handling and retry logic
    - Request/response interceptors
    - Loading state management

**Day 3-4: Authentication Pages**

- [x] **Fix Login Page** (`login.html`)
  - Form validation (client-side)
  - API integration for login endpoint
  - Error message display
  - Remember me functionality
  - Loading spinner on submit
- [x] **Enhance Forgot Password** (`forgot-password.html`)
  - Email validation
  - API integration
  - Success/error feedback
- [x] **Complete Reset Password** (`reset-password.html`)
  - Token validation
  - Password strength indicator
  - Confirm password matching
  - API integration

**Day 5: Common Components**

- [x] **Create Reusable Components**
  - Navigation sidebar template
  - Header with user menu
  - Breadcrumb component
  - Loading spinner
  - Toast notifications (success/error/warning)
  - Modal dialog template
  - Data table template
- [x] **Build Utility Functions** (`assets/js/utils.js`)
  - Date formatting
  - Number formatting
  - Form validation helpers
  - Ghana WAEC grade converter (A1-F9)
  - Export to PDF/Excel helpers

---

### Week 2: Dashboards for All Roles

#### 📝 Tasks

**Day 1: Super Admin Dashboard**

- [x] **Complete** `superadmin/dashboard.html`
  - [x] Total institutions widget
  - [x] Total users by role widget
  - [x] Active subscriptions widget
  - [x] System health indicators
  - [x] Recent activities list
  - [x] Quick action buttons
  - [x] Charts: User growth, Institution growth

**Day 2: Admin Dashboard**

- [x] **Complete** `admin/dashboard.html`
  - [x] Total students widget (with growth % badge)
  - [x] Total teachers widget (with growth % badge)
  - [x] Total classes widget (with growth % badge)
  - [x] Attendance rate (today/week) — `AttendanceRepository::getDailyRateByInstitution()` + `getWeeklyRateByInstitution()`, wired to `DashboardController::adminStats()`
  - [x] Upcoming exams widget — `AssessmentRepository::countUpcomingByInstitution()` (published exams due within 7 days)
  - [x] Pending tasks widget — `UserRepository::countInactiveByInstitution()` (accounts awaiting activation)
  - [x] Recent activities (stacked list via `AdminActivityAPI`)
  - [x] Charts: Enrollment trend (rolling 12-month), Student distribution by program

**Day 3: Teacher Dashboard**

- [x] **Complete** `teacher/dashboard.html`
  - [x] Today's classes widget — `AttendanceRepository::countTodayScheduleByTeacher()` via `course_schedules`
  - [x] Pending assignments to grade — `AssignmentRepository::countPendingGradesByTeacher()` (status='submitted')
  - [x] Attendance summary — `AttendanceRepository::getDailyRateByTeacher()` + `getWeeklyRateByTeacher()`
  - [x] Upcoming assessments — `AssessmentRepository::countUpcomingByTeacher()` (next 7 days)
  - [x] Recent student submissions — `AssignmentRepository::getRecentSubmissionsByTeacher()` (5 most recent ungraded)
  - [x] Quick actions (take attendance, grade assignment, create assignment, view schedule)
  - [x] Charts: Class performance (bar, avg score per course), Attendance trends (rolling 12-month line)

**Day 4: Student Dashboard**

- [x] **Complete** `student/dashboard.html`
  - Today's classes widget
  - Pending assignments widget
  - Recent grades widget
  - Upcoming assessments
  - Attendance percentage widget
  - Recent announcements
  - Charts: Grade trends by subject

**Day 5: Parent Dashboard**

[x] **Complete** `parent/dashboard.html`

- Children selector (if multiple)
- Selected child's overview
- Recent grades widget
- Attendance summary
- Upcoming events for child
- Pending fee status (if applicable, with fallback when not configured)
- Charts: Child's performance trends

---

### ✅ Stage 1 Acceptance Criteria

**Functional Requirements:**

- [x] Users can log in with correct credentials
- [x] Invalid login shows appropriate error
- [x] Users are redirected to correct dashboard based on role
- [x] All dashboards load with live data from API
- [x] Widgets display accurate real-time statistics
- [x] Charts render correctly with proper data
- [x] Logout works and clears session
- [x] Session timeout redirects to login

**Technical Requirements:**

- [x] No console errors on any page
- [x] All API calls use proper authentication
- [x] Token is stored securely
- [x] Loading indicators show during API calls
- [x] Error messages display user-friendly text
- [x] Responsive design works on mobile/tablet/desktop

**Testing:**

- [x] Test with all 5 user roles
- [x] Test with invalid credentials
- [x] Test session timeout
- [x] Test logout from all dashboards
- [x] Cross-browser testing (Chrome, Firefox, Safari, Edge)

---

## 🏫 STAGE 2: Core Management (3 weeks)

### Objective

Build the foundational data management pages for students, teachers, classes, and programs.

### Deliverables

- ✅ Complete CRUD for students, teachers, classes
- ✅ Bulk import/export functionality
- ✅ User profile management
- ✅ Role and permission management

---

### Week 3: Student & Teacher Management

#### 📝 Tasks

**Day 1-2: Student Management**

- [x] **Enhance** `admin/students.html`
  - Student list with DataTables (search, filter, sort, pagination)
  - Filter by class, program, grade level, status
  - Add student button → modal form
  - Edit student → modal form
  - View student details → dedicated page
  - Bulk import from CSV
  - Export to Excel/PDF
  - Activate/deactivate students
- [x] **Create** `admin/student-details.html`
  - Personal information tab
  - Academic history tab
  - Attendance record tab
  - Grade history tab
  - Parent/guardian information
  - Enrollment history
  - Edit button

**Day 3-4: Teacher Management**

- [x] **Enhance** `admin/teachers.html`
  - [x] Teacher list with DataTables
  - [x] Filter by department, subject, status
  - [x] Add teacher → modal form
  - [x] Edit teacher → modal form
  - [x] View teacher details → dedicated page
  - [x] Assign teacher to subject(s) per class section
    - "Assign" button on teacher list row opens a modal in `admin/page/teachers.html`
    - Modal fetches all subjects from DB → populates a subject `<select>` dropdown
    - Modal fetches all class sections → renders a checkbox list per class
    - On subject change, auto-ticks checkboxes for classes already assigned to that subject+teacher combo (`autoCheckClassesBySubject()`)
    - On open, current assignments are shown in a "Current Assignments" panel (subject + class pair, with × remove button)
    - "Apply" saves via `POST /api/class-subjects` with `class_id`, `subject_id`, `teacher_id`, `academic_year_id`, `semester_id`, `start_date`, `end_date`
    - Academic year and semester are auto-detected from `GET /api/academic-years/current` + `GET /api/semesters/current`
    - Remove assignment via `DELETE /api/class-subjects/{course_id}`
    - Duplicate assignments return 400 and are handled gracefully
  - [x] View teacher schedule
  - [x] Export teacher list
- [x] **Create** `admin/teacher-details.html`
  - [x] Personal information tab
  - [x] Class-subject assignments tab _(e.g. "SHS 1 Gen Art A — English", "SHS 2 Gen Science B — English & French")_
    - List all (class section, subject) pairs assigned to this teacher
    - Add new assignment: pick subject → pick class section(s)
    - Remove individual class-subject assignment
  - [x] Schedule/timetable tab
  - [x] Performance metrics (optional)
    - Tab in `admin/teacher-details.html` — only visible if data exists
    - Fetch from `GET /api/teachers/{uuid}/performance` (to be built)
    - Display: average student scores per subject taught (bar chart via Chart.js)
    - Display: attendance rate across all classes (percentage ring / gauge)
    - Display: assignment submission rate — how many students submitted vs. total per assignment
    - Display: grade distribution per subject (A1–F9 breakdown bar chart)
    - All charts use Chart.js; data grouped by current semester (use `S.currentTerm`)
    - Show "No performance data available yet" placeholder if no records
  - [x] Edit button

**Day 5: Profile Pages**

- [x] **Enhance** `admin/myprofile.html`
  - View/edit personal information
  - Change password
  - Upload profile photo
  - Notification preferences
  - Session management
- [x] **Enhance** `teacher/myprofile.html`
  - Similar to admin profile
  - Professional details (qualifications, subjects)
- [x] **Enhance** `student/myprofile.html`
  - Personal information
  - Emergency contacts
  - Parent/guardian details
- [x] **Enhance** `parent/myprofile.html`
  - Personal information
  - Linked children
  - Contact preferences

---

### Week 4: Class & Program Management

#### 📝 Tasks

**Day 1-2: Classes**

- [x] **Enhance** `admin/classes.html` _(implemented as `admin/page/departments.html`)_
  - Class list with filtering
  - Create class → modal form
  - Edit/delete class
  - Assigned class rooms
  - View class roster
  - Class capacity management
  - Student enrollment to class
- [x] **Create** `admin/class-details.html`
  - Class information
  - Student roster (with photos)
  - Assigned subjects
  - Class schedule
  - Performance statistics

**Day 2-3: Programs & Subjects**

- [x] **Enhance** `admin/programs.html` _(combined in `admin/page/departments.html`)_
  - Programs list (General Science, Arts, Business, etc.)
  - Create/edit/delete programs
  - Program subjects (core and elective)
  - Active/inactive status
- [x] **Enhance** `admin/subjects.html` _(implemented as `admin/page/courses.html`)_
  - Subject list with DataTables
  - Create/edit/Delete subjects
  - Subject codes (Ghana syllabus)
  - Assign subject to class sections (creates class-subject record per section)
  - Assign a teacher to a subject _for a specific class section_ (not globally)
  - Core vs elective marking

**Day 4: Teacher Pages**

- [x] **Create** `teacher/my-classes.html`
  - List of classes teaching
  - Class roster for each class
  - Student count per class
  - Class schedule link
  - Quick actions (take attendance, grade submission, etc)
- [x] **Create** `teacher/my-subjects.html`
  - List of subjects teaching
  - Subject information (syllabus, curriculum, Image)
  - Classes assigned per subject
  - Learning objectives
  - Subject schedule

**Day 5: Student Pages**

- [x] **Create** `student/my-classes.html`
  - List of enrolled classes/subjects
  - Class details (teacher, schedule)
  - Subject progress indicator
- [x] **Create** `student/my-subjects.html`
  - Subject list with details
  - Teacher information
  - Subject schedule
  - Current grade in subject
  - Performance trend

---

### Week 5: Users, Roles & Parent Management

#### 📝 Tasks

**Day 1-2: User Management**

- [x] **Enhance** `admin/users.html`
  - User list with role filter
  - Create user → modal form
  - Edit user
  - Assign roles
  - Activate/deactivate users
  - Reset password
  - View user activity
  - import users
- [x] **Enhance** `superadmin/roles.html`
  - [x] Role list
  - [x] import roles
  - [x] Create/edit/delete roles
  - [x] Permission assignment
  - [x] Users with role count
  - [x] Default permissions per role
  - [x] Create/edit role permissions → modal form with permission checkboxes
- [x] **Redesign** `superadmin/users.html`
  - Platform-wide user list (list only admins from all institutions)
  - Filter by institution
  - Super admin management
  - Bulk operations

**Day 3: Parent Management**

- [x] **Create** `parent/my-children.html`
  - List of linked children/wards
  - Child selector/switcher
  - Child profile overview
  - Current class and program
  - Academic standing
  - Quick links (grades, attendance)
- [x] **Create** `admin/parents.html` (if not exists)
  - Parent list
  - Add/edit/delete parent
  - Link parent to students
  - Parent contact information
  - Communication preferences

**Day 4-5: Institution Management (Super Admin)**

- [x] **Redesign** `superadmin/institutions.html`
  - Institution list with search/filter
  - Add institution → comprehensive form
  - Edit institution details
  - Delete institution details
  - View institution dashboard
  - Activate/deactivate institution
  - Subscription management link
  - Admin assignment
- [x] **Create** `superadmin/institution-details.html`
  - Institution profile
  - Statistics (students, teachers, classes)
  - Active subscription
  - Payment history
  - Admin users
  - Activity log

---

### ✅ Stage 2 Acceptance Criteria

**Functional Requirements:**

- [x] Can create, read, update, delete students
- [x] Can create, read, update, delete teachers
- [x] Can create and manage classes
- [x] Can assign teachers to classes/subjects
- [x] Can enroll students in classes
- [x] Bulk import works for students (CSV)
- [x] Export to Excel/PDF works
- [x] Parents can view linked children
- [x] User roles and permissions enforced

**Technical Requirements:**

- [x] All forms validate input
- [x] DataTables work with pagination, search, sort
- [x] Modal forms open and close properly
- [x] File uploads work (CSV, profile photos)
- [x] Success/error messages show appropriately
- [x] No data loss on page refresh

**Testing:**

- [x] CRUD operations for all entities
- [x] Role-based access (teacher can't access admin pages)
- [x] Data integrity (cascading deletes, relationships)
- [x] Bulk operations (import/export)

---

## 📚 STAGE 3: Academic Operations (3 weeks)

### Objective

Implement attendance tracking, timetables, and course materials management.

### Deliverables

- ✅ Attendance marking and monitoring
- ✅ Timetable/schedule viewing and management
- ✅ Course materials upload and download
- ✅ School calendar and events

---

### Week 6: Attendance System

#### 📝 Tasks

**Day 1-2: Admin Attendance**

- [x] **Create** `admin/attendance.html`
  - [x] Daily attendance overview dashboard
  - [x] Attendance by class widget
  - [x] Attendance by date selector
  - [x] Absent students list
  - [x] Late arrivals list
  - [x] Attendance statistics (today, week, month)
  - [x] Attendance trends chart
  - [x] Export attendance reports (CSV, PDF)
  - [x] Filter by class, date range
  - [x] Parent notification for absences (auto/manual)

**Day 2-3: Teacher Attendance**

- [x] **Create** `teacher/attendance.html`
  - Select class and subject
  - Date selector (defaults to today)
  - Student list with attendance marking
  - Status options: Present, Absent, Late, Excused
  - Bulk mark (all present/absent)
  - Submit attendance
  - View past attendance (read-only)
  - Attendance statistics per class
  - Export class attendance (CSV, PDF)
  - [x] Import attendance from CSV (for offline marking)

**Day 4: Student Attendance**

- [x] **Create** `student/attendance.html`
  - [x] Overall attendance percentage
  - [x] Attendance calendar view
  - [x] Attendance by subject
  - [x] Present/Absent/Late breakdown
  - [x] Attendance trends chart
  - [x] Absence reasons (if recorded)
  - [x] Monthly attendance summary
  - [x] Export attendance report (PDF)

**Day 5: Parent Attendance**

- [x] **Create** `parent/attendance.html`
  - [x] Child selector (if multiple)
  - [x] Child's overall attendance
  - [x] Attendance calendar
  - [x] Absence alerts/notifications
  - [x] Attendance by subject
  - [x] Attendance trends
  - [x] Compare with class average
  - [x] Download attendance report (PDF)

---

### Week 7: Timetable & Schedule

#### 📝 Tasks

**Day 1-2: Admin Timetable**

- [x] **Create** `admin/timetable.html`
  - [x] Timetable management dashboard
  - [x] Create timetable for semester
  - [x] Class-based view
  - [x] Teacher-based view
  - [x] Period configuration (time slots)
  - [x] Assign subjects to periods
  - [x] Assign teachers to periods
  - [x] Room/venue allocation
  - [x] Conflict detection (teacher double-booking)
  - [x] Publish/unpublish timetable
  - [x] Export timetable to PDF
  - [x] Print-friendly view

**Day 2-3: Teacher Timetable**

- [x] **Create** `teacher/timetable.html` _(implemented as `teacher/page/timetable.html` + `teacher/js/timetable.js`)_
  - Teacher's personal timetable
  - Weekly view (Mon-Sun)
  - Daily view
  - Semester view
  - Filter by week
  - Show assigned classes and rooms
  - Color-coded by subject
  - Today's classes highlighted
  - Export personal timetable
  - Print-friendly view (browser print)
  - Sync to calendar (optional)

**Day 3-4: Student Timetable**

- [x] **Create** `student/timetable.html` _(implemented as `student/page/timetable.html` + `student/js/timetable.js`)_
  - Student's class timetable
  - Weekly view (Mon-Sun)
  - Daily view
  - Period details (subject, teacher, room)
  - Current period highlighted (if in session)
  - Next class indicator
  - Export timetable to PDF (CSV, PDF)
  - Print view
  - Sync to calendar (optional)

**Day 4-5: Parent & Calendar**

- [x] **Create** `parent/timetable.html` _(implemented as `parent/page/timetable.html` + `parent/js/timetable.js`)_
  - Child selector
  - Child's timetable view
  - Weekly schedule
  - Daily schedule
  - Export and print
- [x] **Create** `common/calendar.html` _(implemented as `common/calendar.html` + `common/js/calendar.js`, wired in admin/teacher/student/parent dashboards)_
  - School calendar with academic events
  - Semester dates(start/end)
  - Exam periods
  - Holidays and breaks
  - School events (sports day, speech day)
  - Month/week view
  - Filter by event type
  - Add personal events (role-based)
  - Export calendar
  - Sync to calendar (optional)

---

### Week 8: Course Materials & Content

#### 📝 Tasks

**Day 1-2: Teacher Materials**

- [x] **Create** `teacher/course-materials.html` _(implemented as `teacher/page/course-materials.html` + `teacher/js/course-materials.js`)_
  - Materials list by subject
  - Upload materials (PDF, Word, PowerPoint, etc.)
  - Organize by topic/unit/week
  - Edit material details (title, description)
  - Share with classes
  - Set access permissions (view/download)
  - Track student downloads
  - Delete materials
  - File size validation
  - Allowed file types check
- [x] **Create** `teacher/lesson-plans.html` _(implemented as `teacher/page/lesson-plans.html` + `teacher/js/lesson-plans.js`)_
  - Lesson plan list
  - Create lesson plan
  - Weekly lesson plans
  - Learning objectives
  - Activities and resources
  - Assessment methods
  - Notes section
  - Link to course materials
  - Export lesson plans

**Day 3-4: Student Materials**

- [x] **Create** `student/course-materials.html` _(implemented as `student/page/course-materials.html` + `student/js/course-materials.js`)_
  - Materials by subject
  - Filter by topic/week
  - Search materials
  - Preview materials (if supported)
  - Download materials
  - Recently uploaded materials
  - Download history
  - Bookmarks/favorites

**Day 5: Admin & Parent**

- [x] **Create** `admin/course-materials.html` (optional) _(implemented as `admin/page/course-materials.html` + `admin/js/course-materials.js`)_
  - Overview of all materials
  - Materials by class/subject
  - Storage usage statistics
  - Approve/moderate materials
- [x] **Update** `parent/performance.html` foundation _(implemented as `parent/page/performance.html` + `parent/js/performance.js`)_
  - Prepare performance tracking structure
  - Link to materials child has accessed

---

### ✅ Stage 3 Acceptance Criteria

**Functional Requirements:**

- [x] Teachers can mark attendance for their classes
- [x] Students can view their attendance records
- [x] Parents can monitor child's attendance
- [x] Admins can generate attendance reports
- [x] Timetables display correctly for all roles
- [x] Teachers can upload course materials
- [x] Students can download course materials
- [x] School calendar shows all events

**Technical Requirements:**

- [x] File uploads work with size/type validation
- [x] Timetable conflicts are detected
- [x] Attendance data saves correctly
- [x] Calendar integrates with academic year/semester
- [x] PDF export works for timetables
- [x] Download tracking works for materials

**Testing:**

- [x] Mark attendance for multiple classes
- [x] Upload various file types
- [x] View timetable on mobile devices
- [x] Export attendance reports
- [x] Calendar events display correctly

---

## 📝 STAGE 4: Assessment & Reporting (3 weeks)

### Objective

Build the complete assessment, grading, and reporting system with Ghana WAEC compliance.

### Deliverables

- ✅ Assignment creation and submission
- ✅ Quiz creation and taking
- ✅ Assessment management
- ✅ Grade entry and calculation (WAEC scale)
- ✅ Report card generation

---

### Week 9: Assignments & Assessments

#### 📝 Tasks

**Day 1-2: Teacher Assignments**

- [x] **Enhance** `teacher/assignments.html`
  - [x] Assignment list (all classes/subjects)
  - [x] Create assignment form:
    - [x] Title and description
    - [x] Select class and subject
    - [x] Due date and time
    - [x] Upload instructions/attachments
    - [x] Total points/marks
    - [x] Submission type (file upload, text, both)
  - [x] Edit / delete assignment
  - [x] View assignment details
- [x] **Created** `teacher/js/assignments.js`
  - [x] Full CRUD operations (Create, Read, Update, Delete)
  - [x] Load teacher's class/subject list from API
  - [x] Display assignments with filtering and search
  - [x] Form validation and error handling
  - [x] Statistics dashboard (total, active, draft, pending)
  - [x] API integration with proper authentication
- [x] **Create** `teacher/submissions.html`
  - [x] View submissions list
  - [x] Download all submissions (ZIP)
  - [x] Grade submissions interface
  - [x] Provide feedback
  - [x] Publish grades
  - [x] Assignment analytics (submission rate)
  - [x] Late submission indicators
  - [x] View individual submission details
- [x] **Created** `teacher/js/submissions.js`
  - [x] Grade submission API integration
  - [x] Publish grades functionality
  - [x] Download submissions (bulk and individual)
  - [x] Submission analytics and statistics
  - [x] Feedback management
  - [x] Late submission detection

**Day 2-3: Student Assignments**

- [x] **Create** `student/assignments.html`
  - Assignment list by status:
    - Pending (not submitted)
    - Submitted (awaiting grade)
    - Graded (with feedback)
  - Filter by subject
  - View assignment details
  - Upload submission
  - Submit assignment
  - View grade and feedback
  - Late submission indicator
  - Download assignment instructions

**Day 3-4: Assessment Management**

- [x] **Create** `admin/assessments.html` _(implemented as `admin/page/assessments.html` + `admin/js/assessments.js`)_
  - ⚠️ Admin cannot create or give assignments — only teachers can
  - Assessment categories management (configure, not assign)
    - Class Test (CA)
    - Mid-term Exam
    - End-of-term Exam
    - Project/Assignment
    - Classwork
  - Weight/percentage per category (school-wide config)
  - Assessment schedule overview (read-only view of what teachers have created)
  - Upcoming assessments by class (read-only)
  - Assessment calendar (read-only)
- [x] **Create** `teacher/assessments.html` _(implemented as `teacher/page/assessments.html` + `teacher/js/assessments.js`)_
  - Teacher Assessment Management Guide (implemented)
    - Filter section with:
      - Class/Subject combo box
      - Assessment Categories combo box (checkbox multi-select)
      - Submit button to load students and scores
    - Institution logo shown in center before filters are applied
    - On submit:
      - Logo is hidden
      - Search bar + score table are displayed
      - Student list loads for selected class/subject
      - Selected categories render as table columns
    - Score table columns:
      - Student Name
      - One or more assessment category columns (dynamic)
      - Max score input under each category header
    - Max score controls editability:
      - Teacher enters `max_score` first per category
      - Score input validates against `0..max_score`
      - Invalid entries are highlighted with feedback
    - Auto Assessment modal per category:
      - Header icon opens modal: "Auto Assessment"
      - Description: "Select one to Auto fill the Assessment mode"
      - Single-select list (radio) of graded assignment/quiz sources
      - Select button auto-fills matching student scores
      - Teacher can review/edit after auto-fill
    - Save & publish workflow:
      - Save All stores as draft
      - Publish validates and marks scores as published
    - Import/Export (implemented):
      - CSV template download
      - CSV import with row-level validation and feedback
      - Result popup with inserted vs not inserted rows (table format)
      - CSV export and PDF export (frontend PDF/fallback)
    - Data scope safeguards:
      - Teacher ownership check on class-subject
      - Current academic year + current semester enforced in backend

**Day 4-5: Student & Parent Assessment Views**

- [x] **Update** `parent/assignments.html` _(implemented as `parent/page/assignments.html` + `parent/js/assignments.js`)_
  - Child's pending assignments
  - Submitted assignments
  - Graded assignments with scores
  - Assignment completion rate

---

### Week 10: Quizzes & Online Assessments

#### 📝 Tasks

**Day 1-2: Teacher Quiz Creation**

- [x] **Create** `teacher/page/quizzes.html` + `teacher/js/quizzes.js`
  - [x] Quiz list
  - [x] Create quiz form:
    - [x] Quiz title and description
    - [x] Select class and subject (course)
    - [x] Select Section (if applicable)
    - [x] Time limit
    - [x] Total points
    - [x] Available from/to dates
    - [x] Shuffle questions
    - [x] Show results immediately
    - [x] Number of attempts allowed

- [x] **Create** `teacher/page/quiz-details.html` + `teacher/js/quiz-details.js`
  - [x] Quiz information
  - [x] Question list
  - [x] Quiz settings (time limit, attempts, etc)
  - [x] Preview quiz
  - [x] Publish/unpublish quiz
  - [x] View results and analytics
  - [x] Export quiz questions (PDF)
  - [x] Export quiz results (PDF, CSV)

- [x] **Create** `teacher/page/quiz-questions.html` + `teacher/js/quiz-questions.js`
  - [x] List of questions for the quiz
  - [x] Create questions
  - [x] Edit/delete questions
  - [x] View question details
  - [x] Reorder questions (drag and drop)
  - [x] Question bank:
    - [x] Multiple choice questions
    - [x] True/False questions
    - [x] Short answer (text)
    - [x] Essay questions
  - [x] Add questions:
    - [x] Question text
    - [x] Question image (optional)
    - [x] Options (A, B, C, D)
    - [x] Correct answer
    - [x] Points per question
    - [x] Explanation (optional)
  - [x] Preview quiz
  - [x] Publish quiz
  - [x] View results and analytics
  - [x] Export quiz results

**Day 3-4: Student Quiz Taking**

- [x] **Create** `student/quizzes.html`
  - Available quizzes list
  - Quiz details (title, duration, totalpoints, Number of attempts allowed, Time limit, Available from/to dates etc.)
  - Start quiz button
  - Take quiz interface:
    - Question navigation
    - Timer countdown
    - Answer selection
    - Save draft
    - Submit quiz
    - Warning before time expires
  - View results (if allowed)
  - Review answers (if allowed)
  - Quiz history
  - Score statistics

**Day 5: Admin & Parent Views**

- [x] **Create** `admin/quizzes.html`
  - All quizzes overview
  - Quiz statistics by class
  - Average scores
  - Completion rates
- [x] **Update** `parent/performance.html`
  - Add quiz results section
  - Quiz scores by subject
  - Completion status

---

### Week 11: Grades & Report Cards

#### 📝 Tasks

**Day 1-2: Grade Entry & Management**

- [ ] **Enhance** `teacher/grades.html`
      good but the design for the grade is like this
      the the teacher
- SELECT Class / Subject and active term (academic year + semester)
- SELECT grade category to use
- Show student roster with row-level grade entry and validation
- Convert marks to the selected grade category with clear boundary display
- Support bulk actions: fill, clear, and import prepared grade values
- Save as draft (teacher work in progress)
- Submit for admin approval (not final publish)
- academic_yearDisplay submission status: draft, pending approval, approved/published
- Show class analytics: average, highest, lowest, pass rate
- Render grade distribution chart (A1-F9)
- Export current view and approved results to Excel/PDF
- check the grade category

- [x] **Create** `admin/management-grades.html`
  - add/edit/delete grading catergory
  - view Grading Scale
  - Grade overview
  - Grade scales management
  - Grade boundaries configuration
- [x] **Create** `admin/grades.html`
  - **Objective:** Single admin workspace to review, approve, reject, and publish teacher-submitted grades by class, subject, and term.
  - **Primary users:** Admin only (read-only for non-admin roles).
  - **Data policy:** No hardcoded values in UI logic (terms, classes, subjects, statuses, grade bands, weights, labels, IDs). All options and rules must come from API/config.
  - **Page sections:**
    - Top filter bar: academic year, semester, class, subject, teacher, submission status (all loaded dynamically from API).
    - KPI cards: counts grouped by status values returned by backend (not fixed status names in frontend).
    - Submission queue table: class, subject, teacher, submitted at, students graded, completion %, status, actions.
    - Review drawer/modal: student grade sheet preview, category weights, score-to-grade mapping, anomalies (missing or outlier scores), and rule source metadata.
    - Analytics panel: class average, highest, lowest, pass rate, and grade distribution using active grade scale bands from backend.
    - Audit trail panel: who submitted, who approved/rejected, timestamps, admin comments.
  - **Core workflows:**
    - Open queue -> filter to class/subject/term -> inspect submission details.
    - Click `Compare Performance` button -> navigate to `admin/grade/comparison-performance.html` with current filter state passed as query params.
    - Approve submission (moves to approved state; keeps publish as separate action).
    - Reject submission with mandatory reason (returns to teacher for correction).
    - Publish approved grades (sets visible-to-students/parents state and report visibility).
    - Bulk actions: approve selected, reject selected (with reason), export selected rows.
  - **Validation and guardrails:**
    - Block approve when required categories/weights are incomplete according to active term configuration from backend.
    - Block publish if submission is not approved.
    - Show clear warnings for students without complete marks.
    - Confirm modal before reject/publish to prevent accidental actions.
  - **API integration plan:**
    - Fetch queue and filters from assessments/grade reports endpoints (term-scoped), including dynamic lookup values.
    - Approve endpoint updates approval state only.
    - Reject endpoint stores reason and resets workflow state to teacher correction.
    - Publish endpoint marks final visibility and updates published timestamp.
    - Analytics endpoint (or computed frontend fallback) returns averages + grade-band counts keyed by active scale config.
  - **Exports:**
    - Queue export (CSV/Excel): status and workflow metadata.
    - Approved/published grade sheet export (Excel/PDF): student-level rows + summary metrics.
  - **Done checklist:**
    - Admin can approve/reject teacher submissions per class-subject-term.
    - Admin can publish only approved submissions.
    - Analytics and WAEC distribution render correctly.
    - Audit trail entries are visible after each decision.
    - No console errors; works on desktop and mobile breakpoints.

- [x] **Create** `admin/grade/comparison-performance.html`
  - Class performance comparison
  - Subject performance comparison
  - Entry point: top-right `Compare Performance` button on `admin/grades.html`

**Day 3-4: Grade Reports**

- [x] **Create** `teacher/reports.html` _(implemented as `teacher/page/reports.html` + `teacher/js/reports.js`)_
  - Class-Subject performance reports
  - Class-Subject analysis
  - Student progress reports
  - Generate report cards
  - Export to PDF
  - Print-friendly view
  - Semester summary reports
- [x] **Create** `admin/reports.html` _(implemented as `admin/page/reports.html` + `admin/js/reports.js`)_
  - School-wide reports
  - Academic performance by class
  - Academic performance by program
  - Semester reports
  - Annual reports
  - WASSCE preparation reports
  - Student progress tracking
  - Teacher performance (optional)
  - Attendance reports
  - Enrollment reports
  - Custom report builder
  - Schedule automated reports
  - Export all reports (PDF/Excel)

**Day 5: Student & Parent Grade Views**

- [x] **Enhance** `student/grades.html`
  - Current grades by subject
  - Semester grades
  - Grade trends chart
  - Grade calculation (if applicable)
  - Class ranking (if enabled)
  - Download report card
  - Print report card
- [x] **Complete** `parent/performance.html`
  - Child's academic performance
  - Grades by subject 
  - Grade trends over time
  - Progress tracking
  - Comparison with class average
  - Strengths and weaknesses
  - Download report card
  - Historical reports(previous semesters/years)

---

### ✅ Stage 4 Acceptance Criteria

**Functional Requirements:**

- [ ] Teachers can create and manage assignments
- [ ] Students can submit assignments
- [ ] Teachers can grade assignments
- [ ] Teachers can create quizzes with multiple question types
- [ ] Students can take quizzes
- [ ] Quizzes auto-grade multiple choice questions
- [ ] Teachers can enter grades using school grade scale
- [ ] Report cards generate with correct Ghana format
- [ ] Parents can view child's grades and reports

**Technical Requirements:**

- [ ] File uploads work for assignments
- [ ] Quiz timer functions correctly
- [ ] Grades calculate correctly (CA 40% + Exam 60%)
- [ ] WAEC grade conversion (marks to A1-F9) works
- [ ] PDF report cards generate with proper formatting
- [ ] Excel export works for grade sheets

**Ghana WAEC Compliance:**

- [ ] Grading scale A1-F9 implemented
- [ ] Grade boundaries configurable (75-100=A1, 70-74=B2, etc.)
- [ ] Report cards show subject-wise grades
- [ ] Continuous assessment (CA) vs exam split
- [ ] Class position/ranking (optional)

**Testing:**

- [ ] Create and submit assignments
- [ ] Take a timed quiz
- [ ] Enter grades for a full class
- [ ] Generate and download report card
- [ ] Verify grade calculations

---

## 💬 STAGE 5: Communication & Polish (2-3 weeks)

### Objective

Complete messaging, announcements, analytics, and final polish for production readiness.

### Deliverables

- ✅ Internal messaging system
- ✅ Announcements and notifications
- ✅ Events management
- ✅ Analytics dashboards
- ✅ Help and support
- ✅ Super admin advanced features
- ✅ Production-ready polish

---

### Week 12: Communication Systems

#### 📝 Tasks

**Day 1-2: Messaging System (All Roles)**

- [x] **Complete** `admin/messages.html`
  - Room-based inbox with direct and group conversations
  - Compose modal for new chats with recipient filters and search
  - Reply, forward, delete, and mark-read actions in thread view
  - Attachment support, message search, unread handling, and polling refresh
  - Bulk chat support for eligible users and groups
- [x] **Complete** `teacher/messages.html`
  - Same room-based chat experience as admin
  - Direct chat to students, classmates, parents, and admin users
  - Read receipts, periodic refresh, and filtered recipient lookup
- [x] **Complete** `student/messages.html`
  - Inbox for direct and group chats
  - Send to teachers and classmates only
  - Reply flow, unread divider behavior, and periodic refresh
- [x] **Complete** `parent/messages.html`
  - Inbox for direct and group chats
  - Send to teachers and admin users only
  - Linked-child-aware chat list, reply flow, and periodic refresh

**Day 3-4: Announcements & Events**

- [ ] **Create** `admin/announcements.html`
  - Announcement list
  - Create announcement:
    - Title and content
    - Target audience (all, students, teachers, parents, class)
    - Priority (normal, urgent)
    - Publish date
    - Expiry date
    - Attach files
  - Edit announcement
  - Delete announcement
  - Publish/unpublish
  - View analytics (read count)
- [ ] **Create** `admin/events.html`
  - Event list
  - Create event:
    - Event name
    - Description
    - Event type (exam, sports, holiday, etc.)
    - Date and time
    - Venue
    - Target audience
    - Reminders
  - Edit/delete events
  - Calendar view
  - Export events
- [ ] **Create** `teacher/announcements.html`
  - Post class announcements
  - View school announcements
  - Target specific classes
- [ ] **Create** Role-specific announcement views:
  - `student/announcements.html`
  - `parent/announcements.html`
  - `parent/events.html`

**Day 5: Notifications Enhancement**

- [ ] **Enhance** `notifications.html`
  - Notification center
  - Unread notifications badge
  - Notification types:
    - New assignment
    - Grade posted
    - Message received
    - Announcement
    - Event reminder
    - Attendance alert
  - Mark as read
  - Mark all as read
  - Delete notification
  - Filter by type
  - Real-time updates (polling or WebSocket)

---

### Week 13: Analytics & Advanced Features

#### 📝 Tasks

**Day 1-2: Analytics & Performance**

- [ ] **Create** `teacher/analytics.html`
  - Class performance analytics
  - Subject performance trends
  - Student progress charts
  - Assessment analytics
  - Attendance trends
  - Assignment submission rates
  - Grade distribution
  - Weak areas identification
  - Visual charts (Chart.js)
- [ ] **Create** `admin/analytics.html`
  - School-wide analytics
  - Enrollment trends
  - Academic performance by program
  - Attendance statistics
  - Teacher performance metrics
  - Class comparisons
  - Year-over-year comparisons
  - Export analytics reports

**Day 2-3: Super Admin Advanced Features**

- [ ] **Create** `superadmin/subscriptions.html`
  - Subscription plans list
  - Create/edit plans
  - Active subscriptions
  - Expired subscriptions
  - Assign subscription to institution
  - Subscription renewal
  - Payment tracking
  - Invoice generation
  - Usage quotas and limits
- [ ] **Create** `superadmin/reports.html`
  - Platform-wide reports
  - Institution performance
  - User growth analytics
  - Revenue reports
  - Subscription analytics
  - System usage reports
  - Export reports
- [ ] **Create** `superadmin/activity-logs.html` _(implemented as `superadmin/page/logs.html`)_
  - User login activity (all institutions)
  - System activity logs
  - Security events
  - Filter by institution, user, date, action
  - Export logs
- [ ] **Create** `superadmin/api-management.html` 🔒 _(implemented as `superadmin/page/api.html`)_
  - API keys management
  - Create/revoke API keys
  - Third-party integrations
  - Webhook configurations
  - API usage monitoring
  - Rate limiting settings
- [ ] **Create** `superadmin/platform-announcements.html` 🔒
  - Platform-wide announcements
  - Send to all institutions
  - Broadcast messages
  - System notifications

**Day 4: Admin Settings & Logs**

- [ ] **Create** `admin/settings.html`
  - Institution information
  - School logo upload
  - Academic year settings
  - Semester dates
  - Notification preferences
  - SMS/Email gateway config
  - Integration settings
  - Backup settings
- [ ] **Create** `admin/system-logs.html`
  - Login activity (institution users)
  - User activity logs
  - System errors
  - Audit trail
  - Export logs

**Day 5: Exams Management**

- [ ] **Create** `admin/exams.html`
  - Exam schedule
  - Create exam timetable
  - Invigilation assignments
  - Exam halls allocation
  - WASSCE mock exams
  - Internal assessments
  - Exam results aggregation

---

### Week 14: Final Polish & Production Prep

#### 📝 Tasks

**Day 1: Help & Support**

- [ ] **Create** `common/help.html`
  - User guides by role
  - FAQs
  - Video tutorials
  - Feature documentation
  - Contact support
  - Troubleshooting
- [ ] **Create** `common/support.html`
  - Submit support ticket
  - Ticket list
  - Ticket status tracking
  - Knowledge base search

**Day 2-3: Responsive Design & Browser Testing**

- [ ] **Mobile Optimization**
  - Test all pages on mobile devices
  - Fix layout issues
  - Ensure tables are mobile-friendly
  - Optimize navigation for small screens
  - Test touch interactions
- [ ] **Cross-Browser Testing**
  - Test on Chrome
  - Test on Firefox
  - Test on Safari
  - Test on Edge
  - Fix compatibility issues
- [ ] **Performance Optimization**
  - Minimize CSS/JS files
  - Optimize images
  - Enable caching
  - Lazy load images
  - Reduce API calls
  - Add loading skeletons

**Day 4-5: Security & Final Checklist**

- [ ] **Security Hardening**
  - CSRF protection on all forms
  - XSS prevention (sanitize inputs)
  - SQL injection prevention (backend)
  - Rate limiting on login
  - Session timeout enforcement
  - Secure token storage
  - Role-based access enforcement
  - Audit trail for sensitive actions
- [ ] **Final Testing**
  - Test all user journeys
  - Test error scenarios
  - Test edge cases
  - Verify all API integrations
  - Check all export functions
  - Verify print layouts
  - Test file uploads/downloads
- [ ] **Documentation**
  - Update README
  - Document API endpoints used
  - Create user manuals
  - Create admin guide
  - Document deployment process
- [ ] **Production Prep**
  - Environment configuration
  - Update API URLs for production
  - Enable production mode
  - Disable debug logging
  - Configure error reporting
  - Setup monitoring
  - Prepare backup strategy

---

### ✅ Stage 5 Acceptance Criteria

**Functional Requirements:**

- [ ] Users can send and receive messages
- [ ] Announcements reach target audiences
- [ ] Events display on calendar
- [ ] Notifications work in real-time
- [ ] Analytics charts display data correctly
- [ ] Super admin can manage subscriptions
- [ ] Help documentation is accessible
- [ ] Support ticket system works

**Technical Requirements:**

- [ ] All pages are responsive (mobile, tablet, desktop)
- [ ] No console errors across all browsers
- [ ] Page load times under 3 seconds
- [ ] All exports work (PDF, Excel)
- [ ] File uploads handle errors gracefully
- [ ] Security measures implemented

**Production Readiness:**

- [ ] All features tested end-to-end
- [ ] Performance optimized
- [ ] Security hardened
- [ ] Documentation complete
- [ ] Deployment guide ready
- [ ] Backup strategy in place

---

## 📊 Success Metrics

### Quantitative Metrics

**Development Progress:**

- [ ] 95 pages completed (100%)
- [ ] All API endpoints integrated
- [ ] Zero critical bugs
- [ ] Less than 5 minor bugs

**Performance:**

- [ ] Page load time < 3 seconds
- [ ] API response time < 1 second
- [ ] 99% uptime
- [ ] Mobile responsiveness score > 85%

**Quality:**

- [ ] Cross-browser compatibility (4 browsers)
- [ ] Responsive design (3 breakpoints)
- [ ] Accessibility score > 80% (WCAG 2.1)
- [ ] Code coverage > 70% (if testing)

### Qualitative Metrics

**User Experience:**

- Intuitive navigation
- Clear error messages
- Consistent design language
- Fast and responsive

**Functionality:**

- All CRUD operations work
- Role-based access enforced
- Ghana WAEC compliance
- Export features functional

---

## ⚠️ Risk Management

### High-Priority Risks

| Risk                      | Impact   | Mitigation                                  |
| ------------------------- | -------- | ------------------------------------------- |
| **API changes**           | High     | Maintain API documentation, version control |
| **Browser compatibility** | Medium   | Early cross-browser testing                 |
| **Data loss**             | High     | Implement auto-save, confirm before delete  |
| **Security breach**       | Critical | Regular security audits, input validation   |
| **Performance issues**    | Medium   | Optimize queries, lazy loading, caching     |

### Contingency Plans

**If Behind Schedule:**

- Prioritize P1 features
- Defer P3-P4 features to post-launch
- Increase team resources
- Extend timeline by 1 week

**If Technical Blockers:**

- Document blockers immediately
- Seek alternative solutions
- Escalate to stakeholders
- Adjust scope if necessary

**If Quality Issues:**

- Extend testing phase
- Fix critical bugs first
- Plan post-launch patches
- Gather user feedback early

---

## 📋 Final Checklist

Before marking each stage complete:

### Stage Completion Criteria

- [ ] All pages in stage are created
- [ ] All API integrations work
- [ ] No console errors
- [ ] Responsive design verified
- [ ] Cross-browser tested
- [ ] User acceptance testing passed
- [ ] Documentation updated
- [ ] Code reviewed (if team)
- [ ] Deployed to staging
- [ ] Stakeholder approval

### Production Deployment Checklist

- [ ] All 5 stages completed
- [ ] Final testing passed
- [ ] Security audit completed
- [ ] Performance benchmarks met
- [ ] Backup strategy tested
- [ ] Rollback plan ready
- [ ] Monitoring configured
- [ ] Error logging enabled
- [ ] SSL certificate installed
- [ ] DNS configured
- [ ] User training completed
- [ ] Support documentation ready
- [ ] Launch announcement prepared

---

## 🎯 Next Steps

1. **Review this plan** with stakeholders
2. **Set up development environment**
3. **Begin Stage 1, Week 1, Day 1**
4. **Track progress** daily
5. **Hold weekly reviews**
6. **Adjust timeline** as needed

---

**Good luck with the development!** 🚀

---

**Document Version:** 1.0  
**Created:** March 4, 2026  
**Total Duration:** 12-14 weeks  
**Total Pages:** 95 (25 existing + 70 new)  
**Stages:** 5 progressive stages  
**Approach:** Incremental delivery with quality gates
