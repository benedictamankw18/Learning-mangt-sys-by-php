---
name: activity-tracking
description: >
  Implement role-based activity tracking in the LMS. Use when: logging what a user did
  (teacher created assignment, student submitted quiz, parent viewed grade), displaying
  a profile activity feed, building an audit trail page, or wiring activity to a dashboard.
  Covers the full stack: DB table → Repository → Controller → Route → config.js → api.js → Frontend JS.
argument-hint: 'Role to implement activity tracking for, e.g. "teacher" or "student"'
---

# Activity Tracking – Implementation Guide

## What already exists (do NOT recreate)

| Role | DB Table | Repository | Controller | Routes | config.js | api.js |
|---|---|---|---|---|---|---|
| admin | `admin_activity` | `AdminActivityRepository.php` | `AdminActivityController.php` | ✅ | ✅ | ✅ |
| superadmin | `superadmin_activity` | `SuperadminActivityRepository.php` | `SuperadminActivityController.php` | ✅ | ✅ | ✅ |
| teacher | `teacher_activity` | `TeacherActivityRepository.php` | `TeacherActivityController.php` | ✅ | ✅ (`TeacherActivityAPI`) | ✅ |
| student | `student_activity` | `StudentActivityRepository.php` | `StudentActivityController.php` | ✅ | ✅ (`StudentActivityAPI`) | ✅ |
| parent | `parent_activity` | `ParentActivityRepository.php` | `ParentActivityController.php` | ✅ | ✅ (`ParentActivityAPI`) | ✅ |

All tables auto-purge records older than 90 days via a MySQL nightly event (`evt_purge_activity_logs`).

---

## Architecture overview

```
DB table ──► Repository (SQL) ──► Controller (HTTP layer) ──► Route entry
                                                                    │
                    Frontend: config.js (endpoints) ◄──────────────┘
                              api.js (API object)
                              {role}.js / page JS (call .log(), render feed)
```

---

## Part 1 — Backend

### 1a. DB table schema (reference)

All `*_activity` tables share this schema:

```sql
CREATE TABLE teacher_activity (
    activity_id    INT AUTO_INCREMENT PRIMARY KEY,
    uuid           CHAR(36)     NOT NULL UNIQUE,
    institution_id INT          NOT NULL,
    performed_by   INT          NOT NULL,           -- users.user_id
    activity_type  VARCHAR(100) NOT NULL,           -- e.g. 'assignment_created'
    description    TEXT         NOT NULL,
    entity_type    VARCHAR(50)  NULL,               -- e.g. 'assignment', 'quiz'
    entity_id      INT          NULL,               -- ID of the affected record
    meta           JSON         NULL,               -- extra data (key/value)
    ip_address     VARCHAR(45)  NULL,
    user_agent     TEXT         NULL,
    severity       ENUM('info','warning','critical') NOT NULL DEFAULT 'info',
    created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_institution (institution_id),
    INDEX idx_performed_by (performed_by),
    INDEX idx_activity_type (activity_type),
    INDEX idx_severity (severity),
    INDEX idx_created_at (created_at)
);
```

The 90-day purge trigger fires on every INSERT:

```sql
CREATE TRIGGER trg_teacher_activity_purge
AFTER INSERT ON teacher_activity
FOR EACH ROW
    DELETE FROM teacher_activity WHERE created_at < DATE_SUB(NOW(), INTERVAL 90 DAY);
```

### 1b. Repository (`lms-api/src/Repositories/`)

File: `TeacherActivityRepository.php` (already created — use as template for new roles)

Key methods:

| Method | Purpose |
|---|---|
| `create(array $data): int` | Insert a new activity row, returns new `activity_id` |
| `getAllByInstitution(int $institutionId, array $filters, int $limit, int $offset): array` | Paginated list, supports filters |
| `countByInstitution(int $institutionId, array $filters): int` | Total count for pagination |
| `getRecent(int $institutionId, int $limit): array` | Latest N records |
| `getByType(int $institutionId, string $type, int $limit, int $offset): array` | Filter by `activity_type` |
| `getBySeverity(int $institutionId, string $severity, int $limit, int $offset): array` | Filter by severity |
| `getByPerformer(int $institutionId, int $userId, int $limit, int $offset): array` | Filter by `performed_by` |
| `getStats(int $institutionId): array` | Counts grouped by type and severity |
| `deleteOlderThan(int $days): int` | Manual cleanup, returns rows deleted |

The table alias in SQL must match the role (`ta` for teacher, `sa` for student, `pa` for parent). This is used in JOINs:

```php
$sql = "SELECT ta.*, CONCAT(u.first_name, ' ', u.last_name) AS performer_name
        FROM {$this->table} ta
        LEFT JOIN users u ON ta.performed_by = u.user_id
        WHERE ta.institution_id = :institution_id";
```

### 1c. Controller (`lms-api/src/Controllers/`)

File: `TeacherActivityController.php` (already created — use as template)

Endpoints implemented per controller:

| Method | Route | Controller method |
|---|---|---|
| GET | `/teacher-activity` | `index()` — paginated list + filters |
| POST | `/teacher-activity` | `store()` — log a new activity |
| GET | `/teacher-activity/{id}` | `show()` — single record |
| GET | `/teacher-activity/recent` | `recent()` — last N activities |
| GET | `/teacher-activity/type/{type}` | `byType()` |
| GET | `/teacher-activity/severity/{severity}` | `bySeverity()` |
| GET | `/teacher-activity/performer/{userId}` | `byPerformer()` |
| GET | `/teacher-activity/stats` | `stats()` |
| DELETE | `/teacher-activity/cleanup` | `cleanup()` |

**Role guard pattern** (check role before every action):

```php
private function requireAdmin(array $user): bool
{
    if (empty($user['role']) || $user['role'] !== 'teacher') {
        Response::forbidden('Teacher access required');
        return false;
    }
    return true;
}
```

Change `'teacher'` to `'student'` / `'parent'` / `'admin'` as needed.

**`store()` required body fields:**

```json
{
  "activity_type": "assignment_created",
  "description": "Created assignment: Chapter 3 Quiz",
  "entity_type": "assignment",
  "entity_id": 42,
  "severity": "info",
  "meta": { "title": "Chapter 3 Quiz" }
}
```

Only `activity_type` and `description` are required. All others are optional.

### 1d. Routes (`lms-api/src/Routes/api.php`)

All 9 routes per role are already registered (lines ~404–434). Pattern:

```php
// Teacher Activity routes
'GET /teacher-activity'                       => ['controller' => 'TeacherActivityController', 'method' => 'index',       'auth' => true],
'GET /teacher-activity/recent'                => ['controller' => 'TeacherActivityController', 'method' => 'recent',      'auth' => true],
'GET /teacher-activity/stats'                 => ['controller' => 'TeacherActivityController', 'method' => 'stats',       'auth' => true],
'GET /teacher-activity/type/{type}'           => ['controller' => 'TeacherActivityController', 'method' => 'byType',      'auth' => true],
'GET /teacher-activity/severity/{severity}'   => ['controller' => 'TeacherActivityController', 'method' => 'bySeverity',  'auth' => true],
'GET /teacher-activity/performer/{userId}'    => ['controller' => 'TeacherActivityController', 'method' => 'byPerformer', 'auth' => true],
'GET /teacher-activity/{id}'                  => ['controller' => 'TeacherActivityController', 'method' => 'show',        'auth' => true],
'POST /teacher-activity'                      => ['controller' => 'TeacherActivityController', 'method' => 'store',       'auth' => true],
'DELETE /teacher-activity/cleanup'            => ['controller' => 'TeacherActivityController', 'method' => 'cleanup',     'auth' => true],
```

> **Route order matters** — specific paths (`/recent`, `/stats`, `/type/{type}`) must appear before the wildcard `/teacher-activity/{id}` in the array.

---

## Part 2 — Frontend

### 2a. Endpoint constants (`lms-frontend/assets/js/config.js`)

Already added for teacher/student/parent. Pattern (8 constants per role):

```js
// Teacher Activity
TEACHER_ACTIVITY:                '/api/teacher-activity',
TEACHER_ACTIVITY_BY_ID:          (id)       => `/api/teacher-activity/${id}`,
TEACHER_ACTIVITY_RECENT:         '/api/teacher-activity/recent',
TEACHER_ACTIVITY_STATS:          '/api/teacher-activity/stats',
TEACHER_ACTIVITY_BY_TYPE:        (type)     => `/api/teacher-activity/type/${type}`,
TEACHER_ACTIVITY_BY_SEVERITY:    (severity) => `/api/teacher-activity/severity/${severity}`,
TEACHER_ACTIVITY_BY_PERFORMER:   (userId)   => `/api/teacher-activity/performer/${userId}`,
TEACHER_ACTIVITY_CLEANUP:        '/api/teacher-activity/cleanup',
```

### 2b. API object (`lms-frontend/assets/js/api.js`)

Already added: `TeacherActivityAPI`, `StudentActivityAPI`, `ParentActivityAPI`. Pattern:

```js
const TeacherActivityAPI = {
    getAll:         (params)           => API.get(API_ENDPOINTS.TEACHER_ACTIVITY, params),
    getById:        (id)               => API.get(API_ENDPOINTS.TEACHER_ACTIVITY_BY_ID(id)),
    getRecent:      (params)           => API.get(API_ENDPOINTS.TEACHER_ACTIVITY_RECENT, params),
    getStats:       ()                 => API.get(API_ENDPOINTS.TEACHER_ACTIVITY_STATS),
    getByType:      (type, params)     => API.get(API_ENDPOINTS.TEACHER_ACTIVITY_BY_TYPE(type), params),
    getBySeverity:  (severity, params) => API.get(API_ENDPOINTS.TEACHER_ACTIVITY_BY_SEVERITY(severity), params),
    getByPerformer: (userId, params)   => API.get(API_ENDPOINTS.TEACHER_ACTIVITY_BY_PERFORMER(userId), params),
    log:            (data)             => API.post(API_ENDPOINTS.TEACHER_ACTIVITY, data),
    cleanup:        (params)           => API.delete(API_ENDPOINTS.TEACHER_ACTIVITY_CLEANUP + (params ? '?' + new URLSearchParams(params).toString() : '')),
};
```

---

## Part 3 — Using it in a JS page

### 3a. Log an activity (fire-and-forget)

Call `TeacherActivityAPI.log()` immediately after any significant action succeeds. Do **not** await it if it would block UX — wrap it in a background async IIFE:

```js
// After successfully creating an assignment
const newAssignment = await AssignmentAPI.create(formData);
if (newAssignment?.data) {
    // Non-blocking fire and forget
    TeacherActivityAPI.log({
        activity_type: 'assignment_created',
        description:   `Created assignment: "${newAssignment.data.title}"`,
        entity_type:   'assignment',
        entity_id:     newAssignment.data.id,
        severity:      'info',
        meta:          { title: newAssignment.data.title, course_id: courseId }
    }).catch(() => {}); // silently ignore log failures
}
```

### 3b. Display a recent activity feed

```js
async function loadActivityFeed(limit = 10) {
    const list = document.getElementById('activityFeed');
    if (!list) return;

    try {
        const response = await TeacherActivityAPI.getRecent({ limit });
        const activities = response?.data ?? [];

        if (!activities.length) {
            list.innerHTML = '<p class="text-secondary text-center">No recent activity</p>';
            return;
        }

        list.innerHTML = activities.map(item => `
            <div class="activity-item">
                <div class="activity-icon bg-gradient-${severityColor(item.severity)}">
                    <i class="fas ${activityIcon(item.activity_type)}"></i>
                </div>
                <div class="activity-details">
                    <p class="activity-title">${escHtml(item.description)}</p>
                    <p class="activity-meta">${escHtml(item.performer_name)} — ${getRelativeTime(item.created_at)}</p>
                </div>
            </div>
        `).join('');
    } catch (err) {
        console.error('Failed to load activity feed:', err);
        list.innerHTML = '<p class="text-secondary text-center">Failed to load activity</p>';
    }
}

function severityColor(severity) {
    return { info: 'blue', warning: 'orange', critical: 'red' }[severity] ?? 'blue';
}

function activityIcon(type) {
    const map = {
        assignment_created:  'fa-file-alt',
        quiz_submitted:      'fa-check-circle',
        grade_submitted:     'fa-star',
        attendance_marked:   'fa-clipboard-check',
        login:               'fa-sign-in-alt',
        course_viewed:       'fa-book-open',
        message_sent:        'fa-envelope',
        report_downloaded:   'fa-download',
        default:             'fa-info-circle',
    };
    return map[type] ?? map.default;
}

function escHtml(str) {
    if (!str) return '';
    const d = document.createElement('div');
    d.textContent = String(str);
    return d.innerHTML;
}
```

### 3c. Paginated activity list (audit page)

```js
let currentPage = 1;

async function loadActivities(page = 1) {
    const params = {
        page,
        limit: 25,
        severity:      document.getElementById('filterSeverity')?.value || undefined,
        activity_type: document.getElementById('filterType')?.value    || undefined,
        start_date:    document.getElementById('filterFrom')?.value    || undefined,
        end_date:      document.getElementById('filterTo')?.value      || undefined,
    };
    // Remove undefined keys
    Object.keys(params).forEach(k => params[k] === undefined && delete params[k]);

    const response = await TeacherActivityAPI.getAll(params);
    const { activities, pagination } = response?.data ?? {};

    renderTable(activities ?? []);
    renderPagination(pagination);
}

document.getElementById('filterBtn')?.addEventListener('click', () => {
    currentPage = 1;
    loadActivities(1);
});
```

### 3d. Stats / dashboard widget

```js
async function loadActivityStats() {
    const response = await TeacherActivityAPI.getStats();
    const stats = response?.data ?? {};

    document.getElementById('totalActivities').textContent  = stats.total ?? 0;
    document.getElementById('totalInfo').textContent        = stats.by_severity?.info     ?? 0;
    document.getElementById('totalWarning').textContent     = stats.by_severity?.warning  ?? 0;
    document.getElementById('totalCritical').textContent    = stats.by_severity?.critical ?? 0;
}
```

---

## Part 4 — Recommended activity_type conventions

Use consistent snake_case strings. Suggested values per role:

### Teacher
| `activity_type` | When to fire |
|---|---|
| `login` | After successful JWT decode on teacher pages |
| `assignment_created` | After `AssignmentAPI.create()` succeeds |
| `assignment_updated` | After `AssignmentAPI.update()` succeeds |
| `grade_submitted` | After grading a submission |
| `attendance_marked` | After `AttendanceAPI.create()` succeeds |
| `material_uploaded` | After a file upload to a course |
| `quiz_created` | After `QuizAPI.create()` succeeds |
| `course_content_published` | After publishing course content |

### Student
| `activity_type` | When to fire |
|---|---|
| `login` | On student page load with valid token |
| `assignment_submitted` | After `AssignmentAPI.submit()` succeeds |
| `quiz_submitted` | After `QuizAPI.submitQuiz()` succeeds |
| `quiz_started` | After `QuizAPI.startQuiz()` succeeds |
| `course_viewed` | When a student opens a course detail page |
| `material_downloaded` | When a student downloads a course file |

### Parent
| `activity_type` | When to fire |
|---|---|
| `login` | On parent page load with valid token |
| `grade_viewed` | When parent opens a grade report |
| `report_downloaded` | When parent downloads a report card |
| `message_sent` | After `MessageAPI.send()` succeeds |
| `attendance_viewed` | When parent checks a child's attendance |

---

## Part 5 — Adding to a new role (step-by-step checklist)

If a new role is introduced:

- [ ] 1. Create DB table (copy schema, change table name and alias)
- [ ] 2. Add 90-day purge trigger and update `evt_purge_activity_logs` event
- [ ] 3. Copy `TeacherActivityRepository.php`, change: `$table`, `$primaryKey`, alias (`ta` → new alias) in all SQL strings
- [ ] 4. Copy `TeacherActivityController.php`, change: class name, `use` import, `requireAdmin()` role string, `error_log` prefixes
- [ ] 5. Add 9 route entries to `api.php` after the last existing activity block
- [ ] 6. Add 8 endpoint constants to `config.js` (copy the `TEACHER_ACTIVITY_*` block, rename prefix)
- [ ] 7. Add the API object to `api.js` (copy `TeacherActivityAPI`, rename)
- [ ] 8. Wire `.log()` calls into the role's JS pages at action points
- [ ] 9. Wire `.getRecent()` into the role's dashboard feed
