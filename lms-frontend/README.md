# Ghana SHS LMS - Frontend Development Guide

**Project:** Ghana Senior High School Learning Management System  
**Version:** 1.0  
**Last Updated:** March 4, 2026  
**Backend API:** [lms-api](../lms-api)  
**Database:** MariaDB 10.4.32  
**Specification:** [Ghana-SHS-LMS-Pages-Specification.md](../.md%20file/Ghana-SHS-LMS-Pages-Specification.md)

---

## 📋 Table of Contents

- [Project Overview](#project-overview)
- [Current Status](#current-status)
- [Page Inventory](#page-inventory)
- [Development Roadmap](#development-roadmap)
- [File Structure](#file-structure)
- [Development Guidelines](#development-guidelines)
- [API Integration](#api-integration)
- [Getting Started](#getting-started)

---

## 🎯 Project Overview

This is the web-based frontend for Ghana Senior High School Learning Management System. It provides role-based interfaces for:

- **Super Admin** - Platform management across multiple institutions
- **Admin** - Institution-level management
- **Teacher** - Class, assignment, and grading management
- **Student** - Learning, assignments, and grade viewing
- **Parent** - Monitor children's academic progress

### Key Features

- ✅ Role-based access control
- ✅ Ghana WAEC grading scale (A1-F9)
- ✅ SHS-specific programs (General Science, Arts, Business, etc.)
- ✅ Attendance tracking
- ✅ Assignment & assessment management
- ✅ Real-time notifications
- ✅ PDF/Excel export for reports

---

## 📊 Current Status

### ✅ Completed (25 pages - 70% need enhancement)

**Authentication:**
- `index.html` - Landing page
- `login.html` - User login
- `forgot-password.html` - Password recovery
- `reset-password.html` - Password reset

**Super Admin:**
- `superadmin/dashboard.html` ⚠️ (incomplete)
- `superadmin/institutions.html` ✅
- `superadmin/users.html` ✅
- `superadmin/system-settings.html` ✅
- `superadmin/roles.html` ✅

**Admin:**
- `admin/dashboard.html` ⚠️ (incomplete)
- `admin/students.html` ✅
- `admin/teachers.html` ✅
- `admin/classes.html` ✅
- `admin/programs.html` ✅
- `admin/subjects.html` ✅
- `admin/users.html` ✅
- `admin/myprofile.html` ✅

**Teacher:**
- `teacher/dashboard.html` ⚠️ (incomplete)
- `teacher/students.html` ✅
- `teacher/assignments.html` ✅
- `teacher/grades.html` ✅
- `teacher/myprofile.html` ✅

**Student:**
- `student/dashboard.html` ⚠️ (incomplete)
- `student/grades.html` ✅
- `student/myprofile.html` ✅

**Parent:**
- `parent/dashboard.html` ⚠️ (incomplete)
- `parent/myprofile.html` ✅

**Common:**
- `notifications.html` ✅
- `messages.html` ✅
- `privacy-policy.html` ✅
- `terms.html` ✅

### ❌ To Be Created (70 pages)

See [Page Inventory](#page-inventory) below for complete list.

---

## 📄 Page Inventory

### 🔴 Super Admin Pages (10 total)

| # | Page | File Path | Status | Priority |
|---|------|-----------|--------|----------|
| 1 | Dashboard Overview | `superadmin/dashboard.html` | ⚠️ Incomplete | P1 |
| 2 | Institutions | `superadmin/institutions.html` | ✅ Done | P1 |
| 3 | Platform Users | `superadmin/users.html` | ✅ Done | P1 |
| 4 | System Settings 🔒 | `superadmin/system-settings.html` | ✅ Done | P2 |
| 5 | Roles & Permissions | `superadmin/roles.html` | ✅ Done | P1 |
| 6 | **Subscriptions & Billing** | `superadmin/subscriptions.html` | ❌ **Create** | P4 |
| 7 | **Reports & Analytics** | `superadmin/reports.html` | ❌ **Create** | P3 |
| 8 | **Activity Logs** | `superadmin/activity-logs.html` | ❌ **Create** | P2 |
| 9 | **API Management** 🔒 | `superadmin/api-management.html` | ❌ **Create** | P4 |
| 10 | **Platform Announcements** 🔒 | `superadmin/platform-announcements.html` | ❌ **Create** | P4 |

🔒 = Requires elevated permissions/security

---

### 🟢 Admin Pages (18 total)

| # | Page | File Path | Status | Priority |
|---|------|-----------|--------|----------|
| 1 | Dashboard Overview | `admin/dashboard.html` | ⚠️ Incomplete | P1 |
| 2 | Students Management | `admin/students.html` | ✅ Done | P1 |
| 3 | Teachers Management | `admin/teachers.html` | ✅ Done | P1 |
| 4 | Classes & Programs | `admin/classes.html`, `programs.html` | ✅ Done | P1 |
| 5 | Subjects Management | `admin/subjects.html` | ✅ Done | P1 |
| 6 | **Attendance Management** | `admin/attendance.html` | ❌ **Create** | P1 |
| 7 | **Grades & Assessments** | `admin/grades.html`, `assessments.html` | ❌ **Create** | P2 |
| 8 | **Reports & Analytics** | `admin/reports.html` | ❌ **Create** | P2 |
| 9 | **Timetable/Schedule** | `admin/timetable.html` | ❌ **Create** | P2 |
| 10 | **Exams Management** | `admin/exams.html` | ❌ **Create** | P2 |
| 11 | **Events & Announcements** | `admin/events.html`, `announcements.html` | ❌ **Create** | P3 |
| 12 | **Messages/Communication** | `admin/messages.html` | ❌ **Create** | P3 |
| 13 | **Institution Settings** | `admin/settings.html` | ❌ **Create** | P2 |
| 14 | **System Logs** | `admin/system-logs.html` | ❌ **Create** | P3 |
| 15 | Users & Roles | `admin/users.html`, `roles.html` | ✅ Done | P1 |
| 16 | My Profile | `admin/myprofile.html` | ✅ Done | P1 |

---

### 🟡 Teacher Pages (16 total)

| # | Page | File Path | Status | Priority |
|---|------|-----------|--------|----------|
| 1 | Dashboard Overview | `teacher/dashboard.html` | ⚠️ Incomplete | P1 |
| 2 | **My Classes** | `teacher/my-classes.html` | ❌ **Create** | P1 |
| 3 | **My Subjects** | `teacher/my-subjects.html` | ❌ **Create** | P1 |
| 4 | Students | `teacher/students.html` | ✅ Done | P1 |
| 5 | **Attendance** | `teacher/attendance.html` | ❌ **Create** | P1 |
| 6 | Assignments | `teacher/assignments.html` | ✅ Done | P1 |
| 7 | **Assessments & Grading** | `teacher/assessments.html` | ❌ **Create** | P2 |
| 8 | **Quizzes** | `teacher/quizzes.html` | ❌ **Create** | P2 |
| 9 | **Course Materials** | `teacher/course-materials.html` | ❌ **Create** | P2 |
| 10 | **Lesson Plans** | `teacher/lesson-plans.html` | ❌ **Create** | P3 |
| 11 | **Schedule/Timetable** | `teacher/timetable.html` | ❌ **Create** | P1 |
| 12 | **Grade Reports** | `teacher/reports.html` | ❌ **Create** | P2 |
| 13 | Grades | `teacher/grades.html` | ✅ Done | P1 |
| 14 | **Messages** | `teacher/messages.html` | ❌ **Create** | P3 |
| 15 | **Announcements** | `teacher/announcements.html` | ❌ **Create** | P3 |
| 16 | **Performance Analytics** | `teacher/analytics.html` | ❌ **Create** | P3 |
| 17 | My Profile | `teacher/myprofile.html` | ✅ Done | P1 |

---

### 🔵 Student Pages (15 total)

| # | Page | File Path | Status | Priority |
|---|------|-----------|--------|----------|
| 1 | Dashboard Overview | `student/dashboard.html` | ⚠️ Incomplete | P1 |
| 2 | **My Classes** | `student/my-classes.html` | ❌ **Create** | P1 |
| 3 | **My Subjects** | `student/my-subjects.html` | ❌ **Create** | P1 |
| 4 | **Assignments** | `student/assignments.html` | ❌ **Create** | P1 |
| 5 | **Assessments & Quizzes** | `student/assessments.html`, `quizzes.html` | ❌ **Create** | P2 |
| 6 | My Grades | `student/grades.html` | ✅ Done | P1 |
| 7 | **Attendance** | `student/attendance.html` | ❌ **Create** | P1 |
| 8 | **Course Materials** | `student/course-materials.html` | ❌ **Create** | P2 |
| 9 | **Schedule/Timetable** | `student/timetable.html` | ❌ **Create** | P1 |
| 10 | **Exams** | `student/exams.html` | ❌ **Create** | P2 |
| 11 | **Messages** | `student/messages.html` | ❌ **Create** | P3 |
| 12 | **Announcements** | `student/announcements.html` | ❌ **Create** | P3 |
| 13 | My Profile | `student/myprofile.html` | ✅ Done | P1 |

---

### 🟣 Parent Pages (13 total)

| # | Page | File Path | Status | Priority |
|---|------|-----------|--------|----------|
| 1 | Dashboard Overview | `parent/dashboard.html` | ⚠️ Incomplete | P1 |
| 2 | **My Children/Wards** | `parent/my-children.html` | ❌ **Create** | P1 |
| 3 | **Academic Performance** | `parent/performance.html` | ❌ **Create** | P1 |
| 4 | **Attendance** | `parent/attendance.html` | ❌ **Create** | P1 |
| 5 | **Assignments & Assessments** | `parent/assignments.html` | ❌ **Create** | P2 |
| 6 | **Schedule/Timetable** | `parent/timetable.html` | ❌ **Create** | P1 |
| 7 | **Teachers** | `parent/teachers.html` | ❌ **Create** | P2 |
| 8 | **Messages** | `parent/messages.html` | ❌ **Create** | P3 |
| 9 | **Announcements & Events** | `parent/announcements.html`, `events.html` | ❌ **Create** | P3 |
| 10 | My Profile | `parent/myprofile.html` | ✅ Done | P1 |

---

### 🌐 Common Pages (5 total)

| # | Page | File Path | Status | Priority |
|---|------|-----------|--------|----------|
| 1 | Login/Authentication | `login.html`, `forgot-password.html`, `reset-password.html` | ✅ Done | P1 |
| 2 | Notifications Center | `notifications.html` | ✅ Done | P1 |
| 3 | Messages | `messages.html` | ✅ Done | P1 |
| 4 | **Calendar/Events** | `common/calendar.html` | ❌ **Create** | P2 |
| 5 | **Help & Support** | `common/help.html`, `support.html` | ❌ **Create** | P3 |

---

## 🚀 Development Roadmap

### **Phase 1: Core Pages (High Priority)** - Weeks 1-4
**Goal:** Working MVP with basic functionality

**Week 1-2: Authentication & Dashboards**
- [ ] Fix/enhance `login.html` with proper API integration
- [ ] Complete all `dashboard.html` files with real data widgets
- [ ] Implement role-based redirects after login
- [ ] Test authentication flow end-to-end

**Week 3-4: Student & Class Management**
- [ ] Admin: Complete `students.html`, `teachers.html`, `classes.html`
- [ ] Teacher: Create `my-classes.html`, `my-subjects.html`
- [ ] Student: Create `my-classes.html`, `my-subjects.html`
- [ ] Parent: Create `my-children.html`

**Expected Deliverable:** Users can log in, see their dashboard, and view basic class/student information.

---

### **Phase 2: Attendance & Scheduling** - Weeks 5-6
**Goal:** Attendance tracking and timetable viewing

**Week 5: Attendance Management**
- [ ] Admin: Create `attendance.html` (overview & reports)
- [ ] Teacher: Create `attendance.html` (mark attendance)
- [ ] Student: Create `attendance.html` (view records)
- [ ] Parent: Create `attendance.html` (monitor children)

**Week 6: Schedules & Timetables**
- [ ] Admin: Create `timetable.html` (manage schedules)
- [ ] Teacher: Create `timetable.html` (view teaching schedule)
- [ ] Student: Create `timetable.html` (view class schedule)
- [ ] Parent: Create `timetable.html` (view children's schedule)
- [ ] Common: Create `calendar.html` (school calendar)

**Expected Deliverable:** Attendance tracking is functional, timetables are viewable.

---

### **Phase 3: Assignments & Assessments** - Weeks 7-8
**Goal:** Assignment submission and grading system

**Week 7: Assignments**
- [ ] Teacher: Enhance `assignments.html` (create, manage)
- [ ] Student: Create `assignments.html` (view, submit)
- [ ] Parent: Create `assignments.html` (monitor)
- [ ] Implement file upload for submissions

**Week 8: Assessments & Quizzes**
- [ ] Admin: Create `assessments.html`, `exams.html`
- [ ] Teacher: Create `assessments.html`, `quizzes.html`
- [ ] Student: Create `assessments.html`, `quizzes.html` (take quizzes)
- [ ] Implement quiz-taking interface with timer

**Expected Deliverable:** Teachers can assign work, students can submit, basic grading works.

---

### **Phase 4: Grades & Reports** - Weeks 9-10
**Goal:** Complete grading and reporting system

**Week 9: Grading System**
- [ ] Admin: Create `grades.html` (overview & grade scales)
- [ ] Teacher: Enhance `grades.html`, create `reports.html`
- [ ] Student: Enhance `grades.html` (view all grades)
- [ ] Parent: Create `performance.html` (view children's grades)
- [ ] Implement Ghana WAEC grading scale (A1-F9)

**Week 10: Reports & Analytics**
- [ ] Admin: Create `reports.html` (institutional reports)
- [ ] Teacher: Create `analytics.html` (class performance)
- [ ] Implement PDF export for report cards
- [ ] Implement Excel export for grade sheets

**Expected Deliverable:** Complete grading system with WAEC scale, printable reports.

---

### **Phase 5: Communication & Materials** - Weeks 11-12
**Goal:** Internal messaging and course materials

**Week 11: Messages & Announcements**
- [ ] Admin: Create `messages.html`, `announcements.html`
- [ ] Teacher: Create `messages.html`, `announcements.html`
- [ ] Student: Create `messages.html`, `announcements.html`
- [ ] Parent: Create `messages.html`, `announcements.html`
- [ ] Implement real-time notification system

**Week 12: Course Materials**
- [ ] Teacher: Create `course-materials.html` (upload materials)
- [ ] Teacher: Create `lesson-plans.html`
- [ ] Student: Create `course-materials.html` (download)
- [ ] Implement file upload/download system

**Expected Deliverable:** Internal messaging works, teachers can share materials.

---

### **Phase 6: Advanced Features** - Weeks 13-14
**Goal:** Polish and advanced admin features

**Week 13: Admin Features**
- [ ] Admin: Complete `settings.html`, `system-logs.html`
- [ ] Admin: Create `events.html`
- [ ] Super Admin: Create `subscriptions.html`, `reports.html`
- [ ] Implement bulk operations (CSV import)

**Week 14: Final Polish**
- [ ] Super Admin: Create `activity-logs.html`, `api-management.html`
- [ ] Common: Create `help.html`, `support.html`
- [ ] Responsive design fixes
- [ ] Performance optimization
- [ ] Security hardening
- [ ] Cross-browser testing

**Expected Deliverable:** Fully functional LMS ready for deployment.

---

## 📁 File Structure

```
lms-frontend/
├── index.html                      # Landing page
├── login.html                      # Login page
├── forgot-password.html            # Password recovery
├── reset-password.html             # Password reset
├── notifications.html              # Notifications center
├── messages.html                   # Messages (global)
├── privacy-policy.html             # Privacy policy
├── terms.html                      # Terms of service
│
├── assets/
│   ├── css/
│   │   ├── style.css              # Global styles
│   │   ├── login.css              # Login page styles
│   │   └── dashboard.css          # Dashboard styles
│   │
│   ├── js/
│   │   ├── config.js              # API configuration
│   │   ├── api.js                 # API client
│   │   ├── auth.js                # Authentication logic
│   │   ├── utils.js               # Utility functions
│   │   └── main.js                # Main application logic
│   │
│   ├── img/                       # Images
│   └── libs/                      # Third-party libraries
│       ├── bootstrap/
│       ├── jquery/
│       ├── datatables/
│       ├── chart.js/
│       ├── jspdf/
│       └── xlsx/
│
├── superadmin/
│   ├── dashboard.html
│   ├── institutions.html
│   ├── users.html
│   ├── roles.html
│   ├── system-settings.html
│   ├── subscriptions.html         # TO CREATE
│   ├── reports.html               # TO CREATE
│   ├── activity-logs.html         # TO CREATE
│   ├── api-management.html        # TO CREATE
│   ├── platform-announcements.html # TO CREATE
│   │
│   ├── css/
│   │   └── system.css
│   └── js/
│       ├── institutions.js
│       └── roles.js
│
├── admin/
│   ├── dashboard.html
│   ├── students.html
│   ├── teachers.html
│   ├── classes.html
│   ├── programs.html
│   ├── subjects.html
│   ├── users.html
│   ├── roles.html
│   ├── myprofile.html
│   ├── attendance.html            # TO CREATE
│   ├── grades.html                # TO CREATE
│   ├── assessments.html           # TO CREATE
│   ├── reports.html               # TO CREATE
│   ├── timetable.html             # TO CREATE
│   ├── exams.html                 # TO CREATE
│   ├── events.html                # TO CREATE
│   ├── announcements.html         # TO CREATE
│   ├── messages.html              # TO CREATE
│   ├── settings.html              # TO CREATE
│   ├── system-logs.html           # TO CREATE
│   │
│   ├── css/                       # Empty - TO POPULATE
│   └── js/
│       ├── myprofile.js
│       └── settings.js
│
├── teacher/
│   ├── dashboard.html
│   ├── students.html
│   ├── assignments.html
│   ├── grades.html
│   ├── myprofile.html
│   ├── my-classes.html            # TO CREATE
│   ├── my-subjects.html           # TO CREATE
│   ├── attendance.html            # TO CREATE
│   ├── assessments.html           # TO CREATE
│   ├── quizzes.html               # TO CREATE
│   ├── course-materials.html      # TO CREATE
│   ├── lesson-plans.html          # TO CREATE
│   ├── timetable.html             # TO CREATE
│   ├── reports.html               # TO CREATE
│   ├── messages.html              # TO CREATE
│   ├── announcements.html         # TO CREATE
│   ├── analytics.html             # TO CREATE
│   │
│   ├── css/                       # Empty - TO POPULATE
│   └── js/                        # Empty - TO POPULATE
│
├── student/
│   ├── dashboard.html
│   ├── grades.html
│   ├── myprofile.html
│   ├── my-classes.html            # TO CREATE
│   ├── my-subjects.html           # TO CREATE
│   ├── assignments.html           # TO CREATE
│   ├── assessments.html           # TO CREATE
│   ├── quizzes.html               # TO CREATE
│   ├── attendance.html            # TO CREATE
│   ├── course-materials.html      # TO CREATE
│   ├── timetable.html             # TO CREATE
│   ├── exams.html                 # TO CREATE
│   ├── messages.html              # TO CREATE
│   ├── announcements.html         # TO CREATE
│   │
│   ├── css/                       # Empty - TO POPULATE
│   └── js/                        # Empty - TO POPULATE
│
├── parent/
│   ├── dashboard.html
│   ├── myprofile.html
│   ├── my-children.html           # TO CREATE
│   ├── performance.html           # TO CREATE
│   ├── attendance.html            # TO CREATE
│   ├── assignments.html           # TO CREATE
│   ├── timetable.html             # TO CREATE
│   ├── teachers.html              # TO CREATE
│   ├── messages.html              # TO CREATE
│   ├── announcements.html         # TO CREATE
│   ├── events.html                # TO CREATE
│   │
│   ├── css/                       # Empty - TO POPULATE
│   └── js/                        # Empty - TO POPULATE
│
└── common/                        # TO CREATE
    ├── calendar.html              # School calendar
    ├── help.html                  # Help documentation
    └── support.html               # Support ticket system
```

---

## 💻 Development Guidelines

### 1. **Code Standards**

**HTML:**
- Use semantic HTML5 elements
- Include ARIA labels for accessibility
- Maintain consistent indentation (2 spaces)
- Add comments for complex sections

**CSS:**
- Use BEM methodology for class naming
- Mobile-first responsive design
- Use CSS variables for theming
- Minimize inline styles

**JavaScript:**
- Use ES6+ features
- Avoid global variables
- Use async/await for API calls
- Add error handling for all API requests
- Comment complex logic

### 2. **Naming Conventions**

**Files:**
- Lowercase with hyphens: `my-classes.html`, `course-materials.html`
- JavaScript: camelCase for functions, PascalCase for classes
- CSS: kebab-case for classes, camelCase for IDs

**Variables:**
```javascript
// Good
const apiBaseUrl = CONFIG.API_BASE_URL;
const userData = getUserData();
const studentList = fetchStudents();

// Bad
const URL = 'http://...';
const data = fetch();
const x = getStuff();
```

### 3. **API Integration Pattern**

```javascript
// Example: Fetch students
async function loadStudents() {
    try {
        showLoader();
        const response = await API.get('/students');
        
        if (response.success) {
            renderStudentsTable(response.data);
        } else {
            showError('Failed to load students');
        }
    } catch (error) {
        console.error('Error:', error);
        showError('Network error. Please try again.');
    } finally {
        hideLoader();
    }
}
```

### 4. **Required Components**

Every page should include:
- ✅ Navigation/sidebar
- ✅ Breadcrumbs
- ✅ Page title and description
- ✅ Loading indicators
- ✅ Error messages
- ✅ Success/confirmation messages
- ✅ Logout link
- ✅ User profile menu

### 5. **Responsive Breakpoints**

```css
/* Mobile */
@media (max-width: 767px) { }

/* Tablet */
@media (min-width: 768px) and (max-width: 1023px) { }

/* Desktop */
@media (min-width: 1024px) { }
```

### 6. **Security Checklist**

- [ ] Sanitize all user inputs
- [ ] Validate forms on client and server
- [ ] Use HTTPS for all API calls
- [ ] Implement CSRF protection
- [ ] Store tokens securely (httpOnly cookies preferred)
- [ ] Add rate limiting for API requests
- [ ] Implement session timeout
- [ ] Log out on token expiry

---

## 🔌 API Integration

### Configuration

**File:** `assets/js/config.js`

```javascript
const CONFIG = {
    API_BASE_URL: 'http://localhost:8000/api',  // Update for production
    TOKEN_KEY: 'lms_auth_token',
    USER_KEY: 'lms_user_data',
    REFRESH_TOKEN_KEY: 'lms_refresh_token',
    
    // File upload limits
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    ALLOWED_FILE_TYPES: ['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.jpg', '.png'],
    
    // Pagination
    DEFAULT_PAGE_SIZE: 20,
    
    // Session
    SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutes
};
```

### Authentication Flow

**File:** `assets/js/auth.js`

```javascript
const Auth = {
    // Login
    async login(username, password) {
        const response = await API.post('/auth/login', { login: username, password });
        if (response.success) {
            localStorage.setItem(CONFIG.TOKEN_KEY, response.data.access_token);
            localStorage.setItem(CONFIG.USER_KEY, JSON.stringify(response.data.user));
            return response.data;
        }
        throw new Error(response.message);
    },
    
    // Get current user
    getUser() {
        const userJson = localStorage.getItem(CONFIG.USER_KEY);
        return userJson ? JSON.parse(userJson) : null;
    },
    
    // Check if authenticated
    isAuthenticated() {
        return !!localStorage.getItem(CONFIG.TOKEN_KEY);
    },
    
    // Logout
    logout() {
        localStorage.removeItem(CONFIG.TOKEN_KEY);
        localStorage.removeItem(CONFIG.USER_KEY);
        window.location.href = '/login.html';
    },
    
    // Redirect based on role
    redirectToDashboard(user) {
        const roleMap = {
            'super_admin': '/superadmin/dashboard.html',
            'admin': '/admin/dashboard.html',
            'teacher': '/teacher/dashboard.html',
            'student': '/student/dashboard.html',
            'parent': '/parent/dashboard.html'
        };
        
        const role = user.roles?.[0] || 'student';
        window.location.href = roleMap[role] || '/login.html';
    }
};
```

### API Client

**File:** `assets/js/api.js`

```javascript
const API = {
    async request(method, endpoint, data = null) {
        const token = localStorage.getItem(CONFIG.TOKEN_KEY);
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };
        
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        const options = {
            method,
            headers,
            body: data ? JSON.stringify(data) : null
        };
        
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}${endpoint}`, options);
            
            // Handle unauthorized
            if (response.status === 401) {
                Auth.logout();
                return;
            }
            
            const result = await response.json();
            return result;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },
    
    get(endpoint) {
        return this.request('GET', endpoint);
    },
    
    post(endpoint, data) {
        return this.request('POST', endpoint, data);
    },
    
    put(endpoint, data) {
        return this.request('PUT', endpoint, data);
    },
    
    delete(endpoint) {
        return this.request('DELETE', endpoint);
    }
};
```

### Common API Endpoints

```javascript
// Students
GET    /api/students
POST   /api/students
GET    /api/students/{id}
PUT    /api/students/{id}
DELETE /api/students/{id}

// Teachers
GET    /api/teachers
POST   /api/teachers
GET    /api/teachers/{id}
PUT    /api/teachers/{id}

// Classes
GET    /api/classes
POST   /api/classes
GET    /api/classes/{id}

// Assignments
GET    /api/assignments
POST   /api/assignments
GET    /api/assignments/{id}
PUT    /api/assignments/{id}

// Attendance
GET    /api/attendance
POST   /api/attendance
GET    /api/attendance/class/{classId}

// Grades
GET    /api/results
POST   /api/results
GET    /api/grade-reports

// Messages
GET    /api/messages/inbox
GET    /api/messages/sent
POST   /api/messages

// Notifications
GET    /api/notifications
PUT    /api/notifications/{id}/read
```

---

## 🚀 Getting Started

### Prerequisites

- Modern web browser (Chrome, Firefox, Safari, Edge)
- Code editor (VS Code recommended)
- Backend API running on `http://localhost:8000`
- MariaDB database with test data

### Setup

1. **Clone/Navigate to Frontend:**
   ```bash
   cd d:/db/lms-frontend
   ```

2. **Configure API Base URL:**
   - Edit `assets/js/config.js`
   - Update `API_BASE_URL` to your backend URL

3. **Start Local Server:**
   ```bash
   # Option 1: Python
   python -m http.server 3000
   
   # Option 2: Node.js
   npx http-server -p 3000
   
   # Option 3: PHP
   php -S localhost:3000
   ```

4. **Open Browser:**
   ```
   http://localhost:3000
   ```

5. **Test Login:**
   - Super Admin: `superadmin` / `password`
   - Admin: `admin` / `password`
   - Teacher: `kofi.mensah` / `password`
   - Student: `kwame.osei` / `password`
   - Parent: `yaw.osei` / `password`

### Development Workflow

1. **Pick a page from the roadmap**
2. **Create HTML structure** (copy from similar existing page)
3. **Add CSS** (in role-specific CSS folder)
4. **Implement JavaScript** (API calls, event handlers)
5. **Test in browser** (all breakpoints)
6. **Test API integration** (check Network tab)
7. **Add error handling**
8. **Test with different roles**
9. **Commit changes**

### Testing Checklist

- [ ] Page loads without errors
- [ ] API calls work correctly
- [ ] Loading indicators show during API calls
- [ ] Error messages display properly
- [ ] Success messages display on actions
- [ ] Forms validate correctly
- [ ] Tables paginate properly
- [ ] Export functions work (PDF/Excel)
- [ ] Responsive on mobile/tablet
- [ ] Works in Chrome, Firefox, Safari, Edge
- [ ] Role-based access enforced
- [ ] Logout works correctly

---

## 📚 Resources

### Documentation
- [API Documentation](../lms-api/API.md)
- [Database Schema](../.sql%20file/lms.sql)
- [Page Specification](../.md%20file/Ghana-SHS-LMS-Pages-Specification.md)

### Libraries Used
- **Bootstrap 5** - UI framework
- **jQuery** - DOM manipulation
- **DataTables** - Table features
- **Chart.js** - Charts and graphs
- **jsPDF** - PDF generation
- **XLSX** - Excel export
- **SweetAlert2** - Beautiful alerts
- **Moment.js** - Date/time formatting

### Ghana Education Resources
- [WAEC Grading System](https://www.waecgh.org/)
- [Ghana Education Service](https://ges.gov.gh/)

---

## 🐛 Common Issues

### Issue: 401 Unauthorized on API calls
**Solution:** Check if token is stored correctly and included in Authorization header.

### Issue: CORS errors
**Solution:** Ensure backend has CORS enabled for frontend URL.

### Issue: Blank dashboard after login
**Solution:** Check if role-based redirect is working in `auth.js`.

### Issue: Tables not loading data
**Solution:** Check API response format matches expected structure.

### Issue: File upload fails
**Solution:** Check file size limits and allowed file types.

---

## 📞 Support

For questions or issues:
- Check existing pages for examples
- Review API documentation
- Check browser console for errors
- Review backend logs

---

## 📝 Notes

- **Priority Legend:**
  - **P1** = Phase 1 (Core/Essential)
  - **P2** = Phase 2 (Important)
  - **P3** = Phase 3 (Nice to have)
  - **P4** = Phase 4 (Future enhancement)

- **Status Legend:**
  - ✅ = Complete and functional
  - ⚠️ = Exists but needs enhancement
  - ❌ = Needs to be created

---

**Last Updated:** March 4, 2026  
**Total Pages:** 95 (25 existing, 70 to create)  
**Estimated Completion:** 14-16 weeks (full-time development)
