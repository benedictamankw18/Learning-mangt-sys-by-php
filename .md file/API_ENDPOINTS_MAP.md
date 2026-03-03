# Ghana SHS LMS API Endpoints Map

## Overview

This document provides a comprehensive mapping of all API endpoints for the Ghana Senior High School Learning Management System.

## Base URL

```
http://your-domain.com/api
```

## Authentication

Most endpoints require authentication via JWT token in the `Authorization` header:

```
Authorization: Bearer <your-jwt-token>
```

---

## 🏛️ Institution Management (Super Admin + Admin)

### Institutions

| Method | Endpoint                        | Controller                           | Description                             | Auth Required |
| ------ | ------------------------------- | ------------------------------------ | --------------------------------------- | ------------- |
| GET    | `/institutions`                 | InstitutionController@index          | Get all institutions (Super Admin only) | ✓             |
| GET    | `/institutions/{id}`            | InstitutionController@show           | Get single institution                  | ✓             |
| POST   | `/institutions`                 | InstitutionController@create         | Create institution (Super Admin only)   | ✓             |
| PUT    | `/institutions/{id}`            | InstitutionController@update         | Update institution                      | ✓             |
| DELETE | `/institutions/{id}`            | InstitutionController@delete         | Delete institution (Super Admin only)   | ✓             |
| GET    | `/institutions/{id}/statistics` | InstitutionController@getStatistics  | Get institution statistics              | ✓             |
| GET    | `/institutions/{id}/users`      | InstitutionController@getUsers       | Get institution users                   | ✓             |
| GET    | `/institutions/{id}/programs`   | InstitutionController@getPrograms    | Get institution programs                | ✓             |
| GET    | `/institutions/{id}/classes`    | InstitutionController@getClasses     | Get institution classes                 | ✓             |
| PUT    | `/institutions/{id}/status`     | InstitutionController@updateStatus   | Update institution status (Super Admin) | ✓             |
| GET    | `/institutions/{id}/settings`   | InstitutionController@getSettings    | Get institution settings (Admin)        | ✓             |
| PUT    | `/institutions/{id}/settings`   | InstitutionController@updateSettings | Update institution settings (Admin)     | ✓             |

**Institution Settings Fields (26 configurable options):**

**Branding:**

- `school_name` - Institution display name
- `motto` - School motto
- `logo_url` - Logo URL

**Theme:**

- `primary_color` - Primary theme color (hex)
- `secondary_color` - Secondary theme color (hex)
- `accent_color` - Accent color (hex)

**Localization:**

- `timezone` - Timezone (e.g., Africa/Accra)
- `date_format` - Date format (e.g., d/m/Y)
- `time_format` - Time format (e.g., H:i)
- `currency_code` - Currency code (e.g., GHS)
- `language_code` - Language code (e.g., en)

**Academic:**

- `grading_system` - Grading system type (percentage, letter, points)
- `min_passing_grade` - Minimum passing grade
- `max_students_per_class` - Maximum class capacity
- `academic_year_start_month` - Academic year start month (1-12)

**Registration & Features:**

- `allow_student_registration` - Allow student self-registration (boolean)
- `require_email_verification` - Require email verification (boolean)
- `enable_notifications` - Enable notification system (boolean)
- `enable_attendance_tracking` - Enable attendance tracking (boolean)

**Social Media:**

- `facebook_url` - Facebook page URL
- `twitter_url` - Twitter profile URL
- `instagram_url` - Instagram profile URL
- `linkedin_url` - LinkedIn page URL
- `youtube_url` - YouTube channel URL

---

## 🎓 Programs (Courses of Study)

**Ghana SHS Programs:** General Arts, General Science, Business, Visual Arts, Home Economics, Agriculture, Technical

| Method | Endpoint                 | Controller                          | Description                      | Auth Required |
| ------ | ------------------------ | ----------------------------------- | -------------------------------- | ------------- |
| GET    | `/programs`              | ProgramController@index             | Get all programs with pagination | ✓             |
| GET    | `/programs/active`       | ProgramController@getActivePrograms | Get active programs only         | ✓             |
| GET    | `/programs/{id}`         | ProgramController@show              | Get single program               | ✓             |
| POST   | `/programs`              | ProgramController@create            | Create new program               | ✓             |
| PUT    | `/programs/{id}`         | ProgramController@update            | Update program                   | ✓             |
| DELETE | `/programs/{id}`         | ProgramController@delete            | Delete program                   | ✓             |
| GET    | `/programs/{id}/classes` | ProgramController@getClasses        | Get classes in a program         | ✓             |

**Query Parameters:**

- `institution_id` - Filter by institution
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)

---

## 📊 Grade Levels

**Ghana SHS Levels:** SHS 1, SHS 2, SHS 3

| Method | Endpoint                     | Controller                                | Description                       | Auth Required |
| ------ | ---------------------------- | ----------------------------------------- | --------------------------------- | ------------- |
| GET    | `/grade-levels`              | GradeLevelController@index                | Get all grade levels              | ✓             |
| GET    | `/grade-levels/active`       | GradeLevelController@getActiveGradeLevels | Get active grade levels (ordered) | ✓             |
| GET    | `/grade-levels/{id}`         | GradeLevelController@show                 | Get single grade level            | ✓             |
| POST   | `/grade-levels`              | GradeLevelController@create               | Create grade level                | ✓             |
| PUT    | `/grade-levels/{id}`         | GradeLevelController@update               | Update grade level                | ✓             |
| DELETE | `/grade-levels/{id}`         | GradeLevelController@delete               | Delete grade level                | ✓             |
| GET    | `/grade-levels/{id}/classes` | GradeLevelController@getClasses           | Get classes in a grade level      | ✓             |

**Query Parameters:**

- `institution_id` - Filter by institution
- `page` - Page number
- `limit` - Items per page

---

## 🏫 Classes (Homeroom Classes)

**Examples:** SHS 1 Art 1, SHS 2 Science 2, SHS 3 Business 1

| Method | Endpoint                       | Controller                       | Description                  | Auth Required |
| ------ | ------------------------------ | -------------------------------- | ---------------------------- | ------------- |
| GET    | `/classes`                     | ClassController@index            | Get all classes              | ✓             |
| GET    | `/classes/{id}`                | ClassController@show             | Get single class             | ✓             |
| POST   | `/classes`                     | ClassController@create           | Create new class             | ✓             |
| PUT    | `/classes/{id}`                | ClassController@update           | Update class                 | ✓             |
| DELETE | `/classes/{id}`                | ClassController@delete           | Delete class                 | ✓             |
| GET    | `/classes/{id}/students`       | ClassController@getStudents      | Get students in class        | ✓             |
| GET    | `/classes/{id}/class-subjects` | ClassController@getClassSubjects | Get subjects taught to class | ✓             |
| GET    | `/classes/{id}/schedule`       | ClassController@getSchedule      | Get class timetable          | ✓             |
| POST   | `/classes/{id}/assign-teacher` | ClassController@assignTeacher    | Assign homeroom teacher      | ✓             |

**Query Parameters:**

- `institution_id` - Filter by institution
- `program_id` - Filter by program
- `grade_level_id` - Filter by grade level
- `page` - Page number
- `limit` - Items per page

---

## 📚 Class Subjects (Teaching Instances)

**What is a Class Subject?** A subject taught to a specific class (e.g., "English taught to SHS 1 Art 1")

| Method | Endpoint                              | Controller                                 | Description              | Auth Required |
| ------ | ------------------------------------- | ------------------------------------------ | ------------------------ | ------------- |
| GET    | `/class-subjects`                     | ClassSubjectController@index               | Get all class subjects   | ✓             |
| GET    | `/class-subjects/{id}`                | ClassSubjectController@show                | Get single class subject | ✓             |
| POST   | `/class-subjects`                     | ClassSubjectController@create              | Create class subject     | ✓             |
| PUT    | `/class-subjects/{id}`                | ClassSubjectController@update              | Update class subject     | ✓             |
| DELETE | `/class-subjects/{id}`                | ClassSubjectController@delete              | Delete class subject     | ✓             |
| GET    | `/class-subjects/{id}/students`       | ClassSubjectController@getEnrolledStudents | Get enrolled students    | ✓             |
| GET    | `/class-subjects/{id}/materials`      | ClassSubjectController@getMaterials        | Get materials            | ✓             |
| POST   | `/class-subjects/{id}/materials`      | ClassSubjectController@createMaterial      | Add material             | ✓             |
| GET    | `/class-subjects/{id}/assessments`    | ClassSubjectController@getAssessments      | Get assessments          | ✓             |
| GET    | `/class-subjects/{id}/schedules`      | ClassSubjectController@getSchedules        | Get schedules            | ✓             |
| POST   | `/class-subjects/{id}/schedules`      | ClassSubjectController@createSchedule      | Create schedule          | ✓             |
| POST   | `/class-subjects/{id}/assign-teacher` | ClassSubjectController@assignTeacher       | Assign teacher           | ✓             |

**Backward Compatibility:** All `/courses/*` endpoints still work and map to ClassSubjectController

**Query Parameters:**

- `institution_id` - Filter by institution
- `class_id` - Filter by class
- `subject_id` - Filter by subject
- `teacher_id` - Filter by teacher
- `page` - Page number
- `limit` - Items per page

---

## 👨‍🎓 Students

| Method | Endpoint                            | Controller                           | Description                 | Auth Required |
| ------ | ----------------------------------- | ------------------------------------ | --------------------------- | ------------- |
| GET    | `/students`                         | StudentController@index              | Get all students            | ✓             |
| GET    | `/students/{id}`                    | StudentController@show               | Get single student          | ✓             |
| POST   | `/students`                         | StudentController@create             | Create student              | ✓             |
| PUT    | `/students/{id}`                    | StudentController@update             | Update student              | ✓             |
| DELETE | `/students/{id}`                    | StudentController@delete             | Delete student              | ✓             |
| GET    | `/students/{id}/courses`            | StudentController@getEnrolledCourses | Get enrolled class subjects | ✓             |
| POST   | `/students/enroll`                  | StudentController@enrollInCourse     | Enroll in class subject     | ✓             |
| DELETE | `/students/{id}/courses/{courseId}` | StudentController@unenrollFromCourse | Unenroll from class subject | ✓             |

---

## 👨‍🏫 Teachers

| Method | Endpoint                  | Controller                    | Description                  | Auth Required |
| ------ | ------------------------- | ----------------------------- | ---------------------------- | ------------- |
| GET    | `/teachers`               | TeacherController@index       | Get all teachers             | ✓             |
| GET    | `/teachers/{id}`          | TeacherController@show        | Get single teacher           | ✓             |
| POST   | `/teachers`               | TeacherController@create      | Create teacher               | ✓             |
| PUT    | `/teachers/{id}`          | TeacherController@update      | Update teacher               | ✓             |
| DELETE | `/teachers/{id}`          | TeacherController@delete      | Delete teacher               | ✓             |
| GET    | `/teachers/{id}/courses`  | TeacherController@getCourses  | Get teacher's class subjects | ✓             |
| GET    | `/teachers/{id}/schedule` | TeacherController@getSchedule | Get teacher schedule         | ✓             |

---

## 📖 Subjects (Core & Elective)

| Method | Endpoint         | Controller                        | Description            | Auth Required |
| ------ | ---------------- | --------------------------------- | ---------------------- | ------------- |
| GET    | `/subjects`      | SubjectController@index           | Get all subjects       | ✓             |
| GET    | `/subjects/core` | SubjectController@getCoreSubjects | Get core subjects only | ✓             |
| GET    | `/subjects/{id}` | SubjectController@show            | Get single subject     | ✓             |
| POST   | `/subjects`      | SubjectController@create          | Create subject         | ✓             |
| PUT    | `/subjects/{id}` | SubjectController@update          | Update subject         | ✓             |
| DELETE | `/subjects/{id}` | SubjectController@delete          | Delete subject         | ✓             |

---

## 👥 User Management

| Method | Endpoint                     | Controller                 | Description           | Auth Required |
| ------ | ---------------------------- | -------------------------- | --------------------- | ------------- |
| GET    | `/users`                     | UserController@index       | Get all users         | ✓             |
| GET    | `/users/{id}`                | UserController@show        | Get single user       | ✓             |
| POST   | `/users`                     | UserController@create      | Create user           | ✓             |
| PUT    | `/users/{id}`                | UserController@update      | Update user           | ✓             |
| DELETE | `/users/{id}`                | UserController@delete      | Delete user           | ✓             |
| POST   | `/users/{id}/roles`          | UserController@assignRole  | Assign role to user   | ✓             |
| DELETE | `/users/{id}/roles/{roleId}` | UserController@removeRole  | Remove role from user | ✓             |
| GET    | `/users/{id}/activity`       | UserController@getActivity | Get user activity log | ✓             |

---

## 🔐 Authentication

| Method | Endpoint                | Controller                    | Description            | Auth Required |
| ------ | ----------------------- | ----------------------------- | ---------------------- | ------------- |
| POST   | `/auth/register`        | AuthController@register       | Register new user      | ✗             |
| POST   | `/auth/login`           | AuthController@login          | Login                  | ✗             |
| POST   | `/auth/refresh`         | AuthController@refresh        | Refresh JWT token      | ✗             |
| POST   | `/auth/forgot-password` | AuthController@forgotPassword | Request password reset | ✗             |
| POST   | `/auth/reset-password`  | AuthController@resetPassword  | Reset password         | ✗             |
| GET    | `/auth/me`              | AuthController@me             | Get current user       | ✓             |
| POST   | `/auth/logout`          | AuthController@logout         | Logout                 | ✓             |
| POST   | `/auth/change-password` | AuthController@changePassword | Change password        | ✓             |

### Password Reset Flow

The password reset feature uses a secure token-based system with the following workflow:

#### 1. Request Password Reset

**Endpoint:** `POST /auth/forgot-password`

**Request:**

```json
{
  "email": "user@example.com"
}
```

**Response (Development Mode):**

```json
{
  "data": {
    "message": "Password reset token generated successfully",
    "token": "a1b2c3d4e5f6...64-char-token",
    "expires_in": "60 minutes",
    "reset_url": "https://yourdomain.com/reset-password?token=..."
  }
}
```

**Response (Production Mode):**

```json
{
  "data": {
    "message": "If your email exists in our system, you will receive a password reset link shortly"
  }
}
```

**Features:**

- Generates secure 64-character hexadecimal token
- Token expires after 60 minutes
- Deactivates any existing active tokens for the user
- Logs password reset requests for audit trail
- Returns token in development/local environment for testing
- Returns generic message in production (security best practice)

#### 2. Reset Password

**Endpoint:** `POST /auth/reset-password`

**Request:**

```json
{
  "token": "a1b2c3d4e5f6...64-char-token",
  "password": "newSecurePassword123"
}
```

**Response (Success):**

```json
{
  "data": {
    "message": "Password reset successful. You can now login with your new password"
  }
}
```

**Response (Invalid/Expired Token):**

```json
{
  "error": "Invalid or expired reset token",
  "code": 400
}
```

**Features:**

- Validates token exists and is active
- Checks token has not expired
- Ensures token has not been used previously
- Updates password with bcrypt hashing
- Marks token as used (prevents reuse)
- Logs password reset completion
- Minimum password length: 8 characters

#### 3. Change Password (Authenticated)

**Endpoint:** `POST /auth/change-password`

**Request:**

```json
{
  "current_password": "oldPassword123",
  "new_password": "newSecurePassword123"
}
```

**Response (Success):**

```json
{
  "data": {
    "message": "Password changed successfully"
  }
}
```

**Response (Incorrect Current Password):**

```json
{
  "error": "Current password is incorrect",
  "code": 400
}
```

**Features:**

- Requires authentication (Bearer token)
- Verifies current password before changing
- Minimum new password length: 8 characters

### Database Schema: password_reset_tokens

| Column      | Type         | Description                         |
| ----------- | ------------ | ----------------------------------- |
| token_id    | INT (PK)     | Auto-increment primary key          |
| user_id     | INT (FK)     | Foreign key to users table          |
| token       | VARCHAR(100) | Unique 64-character reset token     |
| expiry_date | DATETIME     | Token expiration timestamp          |
| is_active   | BOOLEAN      | Token active status                 |
| created_at  | DATETIME     | Token creation timestamp            |
| used_at     | DATETIME     | Timestamp when token was used       |
| ip_address  | VARCHAR(50)  | IP address that requested the token |
| user_agent  | TEXT         | User agent string for security      |

### Security Features

✅ Cryptographically secure token generation (random_bytes)  
✅ Token expiration (60 minutes default)  
✅ One-time use tokens (marked as used after password reset)  
✅ Automatic deactivation of old tokens  
✅ IP address and user agent tracking  
✅ Activity logging for audit trail  
✅ Generic responses in production (prevents email enumeration)  
✅ Bcrypt password hashing  
✅ Token cleanup mechanism for expired/used tokens

---

## 🎯 Assessments

| Method | Endpoint                            | Controller                           | Description           | Auth Required |
| ------ | ----------------------------------- | ------------------------------------ | --------------------- | ------------- |
| GET    | `/assessments`                      | AssessmentController@index           | Get all assessments   | ✓             |
| GET    | `/assessments/{id}`                 | AssessmentController@show            | Get single assessment | ✓             |
| POST   | `/assessments`                      | AssessmentController@create          | Create assessment     | ✓             |
| PUT    | `/assessments/{id}`                 | AssessmentController@update          | Update assessment     | ✓             |
| DELETE | `/assessments/{id}`                 | AssessmentController@delete          | Delete assessment     | ✓             |
| POST   | `/assessments/{id}/submit`          | AssessmentController@submit          | Submit assessment     | ✓             |
| GET    | `/assessments/{id}/submissions`     | AssessmentController@getSubmissions  | Get submissions       | ✓             |
| POST   | `/submissions/{submissionId}/grade` | AssessmentController@gradeSubmission | Grade submission      | ✓             |

---

## 📅 Attendance

| Method | Endpoint                                 | Controller                                | Description                  | Auth Required |
| ------ | ---------------------------------------- | ----------------------------------------- | ---------------------------- | ------------- |
| GET    | `/students/{studentId}/attendance`       | AttendanceController@getStudentAttendance | Get student attendance       | ✓             |
| GET    | `/courses/{courseId}/attendance`         | AttendanceController@getCourseAttendance  | Get class subject attendance | ✓             |
| GET    | `/students/{studentId}/attendance/stats` | AttendanceController@getAttendanceStats   | Get attendance statistics    | ✓             |
| POST   | `/attendance`                            | AttendanceController@markAttendance       | Mark attendance              | ✓             |
| POST   | `/attendance/bulk`                       | AttendanceController@bulkMarkAttendance   | Bulk mark attendance         | ✓             |
| PUT    | `/attendance/{id}`                       | AttendanceController@update               | Update attendance            | ✓             |
| DELETE | `/attendance/{id}`                       | AttendanceController@delete               | Delete attendance            | ✓             |

---

## 📝 Results

| Method | Endpoint                        | Controller                         | Description               | Auth Required |
| ------ | ------------------------------- | ---------------------------------- | ------------------------- | ------------- |
| GET    | `/students/{studentId}/results` | ResultController@getStudentResults | Get student results       | ✓             |
| GET    | `/courses/{courseId}/results`   | ResultController@getCourseResults  | Get class subject results | ✓             |
| GET    | `/results/{id}`                 | ResultController@show              | Get single result         | ✓             |
| POST   | `/results`                      | ResultController@create            | Create result             | ✓             |
| PUT    | `/results/{id}`                 | ResultController@update            | Update result             | ✓             |
| DELETE | `/results/{id}`                 | ResultController@delete            | Delete result             | ✓             |

---

## 📆 Academic Years & Semesters

### Academic Years

| Method | Endpoint                  | Controller                        | Description               | Auth Required |
| ------ | ------------------------- | --------------------------------- | ------------------------- | ------------- |
| GET    | `/academic-years`         | AcademicYearController@index      | Get all academic years    | ✓             |
| GET    | `/academic-years/current` | AcademicYearController@getCurrent | Get current academic year | ✓             |
| GET    | `/academic-years/{id}`    | AcademicYearController@show       | Get single academic year  | ✓             |
| POST   | `/academic-years`         | AcademicYearController@create     | Create academic year      | ✓             |
| PUT    | `/academic-years/{id}`    | AcademicYearController@update     | Update academic year      | ✓             |
| DELETE | `/academic-years/{id}`    | AcademicYearController@delete     | Delete academic year      | ✓             |

### Semesters

| Method | Endpoint             | Controller                    | Description          | Auth Required |
| ------ | -------------------- | ----------------------------- | -------------------- | ------------- |
| GET    | `/semesters`         | SemesterController@index      | Get all semesters    | ✓             |
| GET    | `/semesters/current` | SemesterController@getCurrent | Get current semester | ✓             |
| GET    | `/semesters/{id}`    | SemesterController@show       | Get single semester  | ✓             |
| POST   | `/semesters`         | SemesterController@create     | Create semester      | ✓             |
| PUT    | `/semesters/{id}`    | SemesterController@update     | Update semester      | ✓             |
| DELETE | `/semesters/{id}`    | SemesterController@delete     | Delete semester      | ✓             |

---

## 🔔 Notifications & Announcements

### Notifications

| Method | Endpoint                      | Controller                            | Description             | Auth Required |
| ------ | ----------------------------- | ------------------------------------- | ----------------------- | ------------- |
| GET    | `/notifications`              | NotificationController@index          | Get all notifications   | ✓             |
| GET    | `/notifications/unread-count` | NotificationController@getUnreadCount | Get unread count        | ✓             |
| GET    | `/notifications/{id}`         | NotificationController@show           | Get single notification | ✓             |
| POST   | `/notifications`              | NotificationController@create         | Create notification     | ✓             |
| PUT    | `/notifications/read-all`     | NotificationController@markAllAsRead  | Mark all as read        | ✓             |
| PUT    | `/notifications/{id}/read`    | NotificationController@markAsRead     | Mark as read            | ✓             |
| DELETE | `/notifications/read`         | NotificationController@deleteAllRead  | Delete all read         | ✓             |
| DELETE | `/notifications/{id}`         | NotificationController@delete         | Delete notification     | ✓             |

### Announcements

| Method | Endpoint              | Controller                    | Description             | Auth Required |
| ------ | --------------------- | ----------------------------- | ----------------------- | ------------- |
| GET    | `/announcements`      | AnnouncementController@index  | Get all announcements   | ✓             |
| GET    | `/announcements/{id}` | AnnouncementController@show   | Get single announcement | ✓             |
| POST   | `/announcements`      | AnnouncementController@create | Create announcement     | ✓             |
| PUT    | `/announcements/{id}` | AnnouncementController@update | Update announcement     | ✓             |
| DELETE | `/announcements/{id}` | AnnouncementController@delete | Delete announcement     | ✓             |

---

## 🛡️ Roles & Permissions

### Roles

| Method | Endpoint                                 | Controller                      | Description          | Auth Required |
| ------ | ---------------------------------------- | ------------------------------- | -------------------- | ------------- |
| GET    | `/roles`                                 | RoleController@index            | Get all roles        | ✓             |
| GET    | `/roles/{id}`                            | RoleController@show             | Get single role      | ✓             |
| POST   | `/roles`                                 | RoleController@create           | Create role          | ✓             |
| PUT    | `/roles/{id}`                            | RoleController@update           | Update role          | ✓             |
| DELETE | `/roles/{id}`                            | RoleController@delete           | Delete role          | ✓             |
| GET    | `/roles/{id}/permissions`                | RoleController@getPermissions   | Get role permissions | ✓             |
| POST   | `/roles/{id}/permissions`                | RoleController@assignPermission | Assign permission    | ✓             |
| DELETE | `/roles/{id}/permissions/{permissionId}` | RoleController@removePermission | Remove permission    | ✓             |

### Permissions

| Method | Endpoint            | Controller                  | Description           | Auth Required |
| ------ | ------------------- | --------------------------- | --------------------- | ------------- |
| GET    | `/permissions`      | PermissionController@index  | Get all permissions   | ✓             |
| GET    | `/permissions/{id}` | PermissionController@show   | Get single permission | ✓             |
| POST   | `/permissions`      | PermissionController@create | Create permission     | ✓             |
| PUT    | `/permissions/{id}` | PermissionController@update | Update permission     | ✓             |
| DELETE | `/permissions/{id}` | PermissionController@delete | Delete permission     | ✓             |

---

## 👪 Parents

| Method | Endpoint                 | Controller                   | Description           | Auth Required |
| ------ | ------------------------ | ---------------------------- | --------------------- | ------------- |
| GET    | `/parents`               | ParentController@index       | Get all parents       | ✓             |
| GET    | `/parents/{id}`          | ParentController@show        | Get single parent     | ✓             |
| GET    | `/parents/{id}/students` | ParentController@getStudents | Get parent's students | ✓             |
| POST   | `/parents`               | ParentController@create      | Create parent         | ✓             |
| PUT    | `/parents/{id}`          | ParentController@update      | Update parent         | ✓             |
| DELETE | `/parents/{id}`          | ParentController@delete      | Delete parent         | ✓             |

---

## 📊 Grade Scales & Assessment Categories

### Grade Scales

| Method | Endpoint             | Controller                  | Description            | Auth Required |
| ------ | -------------------- | --------------------------- | ---------------------- | ------------- |
| GET    | `/grade-scales`      | GradeScaleController@index  | Get all grade scales   | ✓             |
| GET    | `/grade-scales/{id}` | GradeScaleController@show   | Get single grade scale | ✓             |
| POST   | `/grade-scales`      | GradeScaleController@create | Create grade scale     | ✓             |
| PUT    | `/grade-scales/{id}` | GradeScaleController@update | Update grade scale     | ✓             |
| DELETE | `/grade-scales/{id}` | GradeScaleController@delete | Delete grade scale     | ✓             |

### Assessment Categories

| Method | Endpoint                      | Controller                          | Description         | Auth Required |
| ------ | ----------------------------- | ----------------------------------- | ------------------- | ------------- |
| GET    | `/assessment-categories`      | AssessmentCategoryController@index  | Get all categories  | ✓             |
| GET    | `/assessment-categories/{id}` | AssessmentCategoryController@show   | Get single category | ✓             |
| POST   | `/assessment-categories`      | AssessmentCategoryController@create | Create category     | ✓             |
| PUT    | `/assessment-categories/{id}` | AssessmentCategoryController@update | Update category     | ✓             |
| DELETE | `/assessment-categories/{id}` | AssessmentCategoryController@delete | Delete category     | ✓             |

---

## Ghana SHS Terminology Guide

| Term              | Description                      | Example                                 |
| ----------------- | -------------------------------- | --------------------------------------- |
| **Program**       | Course of study (3 years)        | General Arts, General Science, Business |
| **Grade Level**   | Year within the program          | SHS 1, SHS 2, SHS 3                     |
| **Class**         | Homeroom class/section           | SHS 1 Art 1, SHS 2 Science 2            |
| **Subject**       | Core or elective subject         | English, Math, Biology, Chemistry       |
| **Class Subject** | Subject taught to specific class | English taught to SHS 1 Art 1           |

---

## 📱 Messages (Private Messaging)

| Method | Endpoint                          | Controller                        | Description                | Auth Required |
| ------ | --------------------------------- | --------------------------------- | -------------------------- | ------------- |
| GET    | `/messages/inbox`                 | MessageController@getInbox        | Get inbox messages         | ✓             |
| GET    | `/messages/sent`                  | MessageController@getSent         | Get sent messages          | ✓             |
| GET    | `/messages/{id}`                  | MessageController@show            | Get single message         | ✓             |
| POST   | `/messages`                       | MessageController@send            | Send message               | ✓             |
| PUT    | `/messages/{id}/read`             | MessageController@markAsRead      | Mark message as read       | ✓             |
| DELETE | `/messages/{id}`                  | MessageController@delete          | Delete message             | ✓             |
| GET    | `/messages/unread-count`          | MessageController@getUnreadCount  | Get unread message count   | ✓             |
| GET    | `/messages/conversation/{userId}` | MessageController@getConversation | Get conversation with user | ✓             |

**Query Parameters:**

- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)

**Features:**

- User-to-user private messaging
- Message threading via `parent_message_id`
- Auto-mark as read when viewing
- Course context linking
- Sender/receiver authorization

---

## 🔐 Login Activity (Security Audit)

| Method | Endpoint                     | Controller                                | Description                    | Auth Required |
| ------ | ---------------------------- | ----------------------------------------- | ------------------------------ | ------------- |
| GET    | `/login-activity`            | LoginActivityController@index             | Get all login activity (Admin) | ✓             |
| GET    | `/login-activity/my-history` | LoginActivityController@getMyHistory      | Get my login history           | ✓             |
| GET    | `/login-activity/recent`     | LoginActivityController@getRecent         | Get recent logins (Admin)      | ✓             |
| GET    | `/login-activity/failed`     | LoginActivityController@getFailedAttempts | Get failed login attempts      | ✓             |
| GET    | `/users/{id}/login-activity` | LoginActivityController@getUserHistory    | Get user's login history       | ✓             |

**Query Parameters:**

- `page` - Page number
- `limit` - Items per page
- `user_id` - Filter by user (Admin only)
- `is_successful` - Filter by success status (0 or 1)
- `from_date` - Filter from date (Y-m-d)
- `to_date` - Filter to date (Y-m-d)
- `hours` - Filter failed attempts by hours (default: 24)

**Features:**

- Login/logout tracking
- Failed login attempt monitoring
- IP address and user agent logging
- Session management
- Security anomaly detection

---

## 🐛 Error Logs (Admin Monitoring)

| Method | Endpoint                          | Controller                       | Description                  | Auth Required         |
| ------ | --------------------------------- | -------------------------------- | ---------------------------- | --------------------- |
| GET    | `/error-logs`                     | ErrorLogController@index         | Get all error logs           | ✓ (Admin/Super Admin) |
| GET    | `/error-logs/{id}`                | ErrorLogController@show          | Get single error log         | ✓ (Admin/Super Admin) |
| POST   | `/error-logs`                     | ErrorLogController@create        | Create error log             | ✓ (Admin/Super Admin) |
| PUT    | `/error-logs/{id}/resolve`        | ErrorLogController@markResolved  | Mark error as resolved       | ✓ (Admin/Super Admin) |
| DELETE | `/error-logs/{id}`                | ErrorLogController@delete        | Delete error log             | ✓ (Admin/Super Admin) |
| GET    | `/error-logs/unresolved`          | ErrorLogController@getUnresolved | Get unresolved errors        | ✓ (Admin/Super Admin) |
| GET    | `/error-logs/severity/{severity}` | ErrorLogController@getBySeverity | Get errors by severity level | ✓ (Admin/Super Admin) |

**Query Parameters:**

- `page` - Page number
- `limit` - Items per page
- `severity_level` - Filter by severity (critical, error, warning, info, debug)
- `is_resolved` - Filter by resolution status (0 or 1)
- `source` - Filter by error source
- `from_date` - Filter from date (Y-m-d)
- `to_date` - Filter to date (Y-m-d)

**Severity Levels:**

- `critical` - System-critical errors
- `error` - Application errors
- `warning` - Warning messages
- `info` - Informational messages
- `debug` - Debug information

**Features:**

- Centralized error logging
- Stack trace storage
- Severity classification
- Resolution tracking (who fixed, when)
- Metadata/context storage (JSON)
- IP address and user tracking
- Admin-only access

---

## Response Format

### Success Response

```json
{
  "data": {...},
  "pagination": {
    "current_page": 1,
    "per_page": 20,
    "total": 100,
    "total_pages": 5
  }
}
```

### Error Response

```json
{
  "error": "Error message",
  "code": 404
}
```

---

## Common Query Parameters

| Parameter        | Type    | Description                | Example             |
| ---------------- | ------- | -------------------------- | ------------------- |
| `page`           | integer | Page number for pagination | `?page=2`           |
| `limit`          | integer | Items per page (max 100)   | `?limit=50`         |
| `institution_id` | integer | Filter by institution      | `?institution_id=1` |
| `program_id`     | integer | Filter by program          | `?program_id=3`     |
| `grade_level_id` | integer | Filter by grade level      | `?grade_level_id=2` |
| `class_id`       | integer | Filter by class            | `?class_id=5`       |
| `subject_id`     | integer | Filter by subject          | `?subject_id=10`    |
| `teacher_id`     | integer | Filter by teacher          | `?teacher_id=25`    |

---

## Total Endpoints

- **Authentication:** 8 endpoints
- **Institutions:** 12 endpoints (including settings)
- **Programs:** 7 endpoints
- **Grade Levels:** 7 endpoints
- **Classes:** 9 endpoints
- **Class Subjects:** 25+ endpoints
- **Students:** 8 endpoints
- **Teachers:** 7 endpoints
- **Subjects:** 6 endpoints
- **Users:** 8 endpoints
- **Assessments:** 9 endpoints
- **Attendance:** 7 endpoints
- **Results:** 6 endpoints
- **Academic Years & Semesters:** 12 endpoints
- **Notifications & Announcements:** 13 endpoints
- **Roles & Permissions:** 13 endpoints
- **Parents:** 6 endpoints
- **Messages:** 8 endpoints
- **Login Activity:** 5 endpoints
- **Error Logs:** 7 endpoints
- **Other:** 10 endpoints

**Total: 210+ API Endpoints**

---

**Generated:** February 15, 2026  
**Version:** 1.2 (Ghana SHS Multi-tenant LMS with Messages, Login Activity & Error Logs)  
**Schema:** 50 Tables with Programs, Grade Levels, Classes, Class Subjects, Messages, Login Activity, and Error Logs
