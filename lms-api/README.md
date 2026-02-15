# LMS API - Complete Project Summary

## 📋 Project Overview

**Project Name:** Learning Management System REST API  
**Version:** 1.0  
**Language:** PHP 8.0+  
**Database:** MySQL 8.0+  
**Architecture:** MVC with Repository Pattern  
**Authentication:** JWT (JSON Web Tokens)

### Purpose

A comprehensive RESTful API for managing educational institutions, including student enrollment, course management, assessments, attendance tracking, and administrative functions.

---

## 🏗️ Project Structure

```
lms-api/
├── config/                      # Configuration files
│   ├── cors.php                 # CORS settings
│   ├── database.php             # Database connection config
│   └── jwt.php                  # JWT authentication config
│
├── public/                      # Public web root
│   └── index.php                # Application entry point
│
├── src/                         # Application source code
│   ├── Config/                  # Runtime configuration
│   │   └── Database.php         # Database connection singleton
│   │
│   ├── Controllers/             # API endpoint handlers (26 controllers)
│   │   ├── AcademicYearController.php
│   │   ├── AnnouncementController.php
│   │   ├── AssessmentCategoryController.php
│   │   ├── AssessmentController.php
│   │   ├── AssignmentController.php
│   │   ├── AttendanceController.php
│   │   ├── AuthController.php
│   │   ├── ClassController.php
│   │   ├── ClassSubjectController.php
│   │   ├── CourseController.php
│   │   ├── CourseSectionController.php
│   │   ├── ErrorLogController.php
│   │   ├── GradeLevelController.php
│   │   ├── GradeScaleController.php
│   │   ├── InstitutionController.php
│   │   ├── LoginActivityController.php
│   │   ├── MessageController.php
│   │   ├── NotificationController.php
│   │   ├── ParentController.php
│   │   ├── ParentStudentController.php
│   │   ├── PermissionController.php
│   │   ├── ProgramController.php
│   │   ├── QuizController.php
│   │   ├── ResultController.php
│   │   ├── RoleController.php
│   │   ├── SemesterController.php
│   │   ├── StudentController.php
│   │   ├── SubjectController.php
│   │   ├── TeacherController.php
│   │   ├── TeacherSubjectController.php
│   │   └── UserController.php
│   │
│   ├── Middleware/              # Request interceptors
│   │   ├── AuthMiddleware.php   # JWT authentication
│   │   ├── ErrorHandler.php     # Global error/exception handler
│   │   └── RoleMiddleware.php   # Role-based access control
│   │
│   ├── Repositories/            # Database access layer (20+ repositories)
│   │   ├── AcademicYearRepository.php
│   │   ├── AnnouncementRepository.php
│   │   ├── AssessmentCategoryRepository.php
│   │   ├── AssessmentRepository.php
│   │   ├── AssignmentRepository.php
│   │   ├── AttendanceRepository.php
│   │   ├── ClassRepository.php
│   │   ├── ClassSubjectRepository.php
│   │   ├── CourseMaterialRepository.php
│   │   ├── CourseRepository.php
│   │   ├── CourseReviewRepository.php
│   │   ├── CourseScheduleRepository.php
│   │   ├── CourseSectionRepository.php
│   │   ├── ErrorLogRepository.php
│   │   ├── GradeLevelRepository.php
│   │   ├── GradeScaleRepository.php
│   │   ├── InstitutionRepository.php
│   │   ├── LoginActivityRepository.php
│   │   ├── MessageRepository.php
│   │   ├── NotificationRepository.php
│   │   ├── ParentRepository.php
│   │   ├── ParentStudentRepository.php
│   │   ├── PermissionRepository.php
│   │   ├── ProgramRepository.php
│   │   ├── QuizRepository.php
│   │   ├── ResultRepository.php
│   │   └── [more repositories...]
│   │
│   ├── Routes/                  # API route definitions
│   │   └── api.php              # All API routes
│   │
│   └── Utils/                   # Helper classes
│       ├── JWTHandler.php       # JWT token generation/validation
│       ├── Response.php         # Standardized API responses
│       └── Validator.php        # Input validation utility
│
├── storage/                     # File storage
│   └── uploads/                 # Uploaded files
│
├── vendor/                      # Composer dependencies
│   ├── firebase/php-jwt         # JWT library
│   ├── vlucas/phpdotenv         # Environment variables
│   └── [other packages...]
│
├── .env                         # Environment configuration
├── .htaccess                    # Apache URL rewriting
├── composer.json                # PHP dependencies
├── setup.sql                    # Sample data initialization
├── API_ENDPOINTS_MAP.md         # Complete API documentation
├── postman_collection.json      # Postman testing collection
└── README.md                    # Installation & usage guide
```

---

## 🗄️ Database Architecture

### Database: `lms` (MySQL)

**Total Tables:** 50

### Core Tables

#### 1. **Authentication & Users**

- `users` - User accounts (students, teachers, admins, parents)
- `roles` - User roles (admin, teacher, student, parent)
- `permissions` - System permissions
- `role_permissions` - Role-permission mappings
- `user_roles` - User-role assignments
- `user_activity_logs` - User action logging
- `login_activity` - Login/logout tracking (✅ auto-logged)
- `error_logs` - System error tracking (✅ auto-logged)

#### 2. **Institution Management**

- `institutions` - Educational institutions (schools, universities)
- `institution_settings` - Institution-specific configurations
- `grade_levels` - Academic grade levels (K-12, University)
- `programs` - Academic programs/departments

#### 3. **Academic Structure**

- `academic_years` - School/academic years
- `semesters` - Academic semesters/terms
- `classes` - Class/section groupings
- `subjects` - Academic subjects
- `class_subjects` - Subject assignments to classes
- `teacher_subjects` - Teacher-subject assignments

#### 4. **User Profiles**

- `students` - Student-specific data
- `teachers` - Teacher-specific data
- `parents` - Parent/guardian information
- `parent_students` - Parent-child relationships

#### 5. **Course Management**

- `courses` - Course catalog
- `course_sections` - Course sections/offerings
- `enrollments` - Student course enrollments
- `course_materials` - Course resources/materials
- `course_schedules` - Class schedules
- `course_reviews` - Student course reviews

#### 6. **Assessments**

- `assessment_categories` - Assessment types (quiz, exam, assignment)
- `assessments` - All assessments
- `assignments` - Assignment details
- `assignment_submissions` - Student submissions
- `quizzes` - Quiz definitions
- `quiz_questions` - Quiz question bank
- `quiz_submissions` - Quiz attempts
- `quiz_submission_answers` - Individual answers
- `results` - Assessment results

#### 7. **Grading**

- `grade_scales` - Grading scales
- `grade_scale_ranges` - Grade boundaries (A, B, C, etc.)

#### 8. **Attendance**

- `attendance` - Daily attendance records

#### 9. **Communication**

- `messages` - User messaging system
- `notifications` - System notifications
- `announcements` - Institution-wide announcements

---

## 🎯 Controllers & Features

### 1. **AuthController** - Authentication & Authorization

**File:** `src/Controllers/AuthController.php`

**Features:**

- ✅ User registration with auto role assignment
- ✅ Login with email or username
- ✅ **Auto login activity tracking** (success/failure)
- ✅ **Auto logout tracking** (updates logout timestamp)
- ✅ JWT token generation (access + refresh)
- ✅ Token refresh
- ✅ Password reset (email token-based)
- ✅ Change password (authenticated users)
- ✅ Get current user profile

**Key Methods:**

- `register()` - Create new user account
- `login()` - Authenticate and issue tokens
- `logout()` - End session and log logout time
- `refresh()` - Renew access token
- `me()` - Get authenticated user info
- `forgotPassword()` - Initiate password reset
- `resetPassword()` - Complete password reset
- `changePassword()` - Update user password

---

### 2. **StudentController** - Student Management

**File:** `src/Controllers/StudentController.php`

**Features:**

- Get all students (paginated)
- Get student by ID
- Create new student
- Update student information
- Delete student
- Get student's enrolled courses
- Enroll student in course
- Unenroll from course

---

### 3. **TeacherController** - Teacher Management

**File:** `src/Controllers/TeacherController.php`

**Features:**

- Get all teachers
- Get teacher by ID
- Create teacher profile
- Update teacher info
- Delete teacher
- Get teacher's assigned subjects
- Assign subject to teacher
- Get teacher's courses

---

### 4. **CourseController** - Course Management

**File:** `src/Controllers/CourseController.php`

**Features:**

- List all courses (with filters)
- Get course details
- Create course (admin/teacher)
- Update course
- Delete/archive course
- Get enrolled students
- Get course materials
- Get course assessments
- Get course schedule

---

### 5. **AttendanceController** - Attendance Tracking

**File:** `src/Controllers/AttendanceController.php`

**Features:**

- Mark individual attendance
- Bulk mark attendance
- Get student attendance records
- Get attendance statistics
- Get course attendance for specific date
- Filter by date range

---

### 6. **AssessmentController** - Assessment Management

**File:** `src/Controllers/AssessmentController.php`

**Features:**

- Create assessments (quiz, exam, assignment)
- Update assessment details
- Delete assessment
- Get all assessments
- Get assessment by ID
- Filter by course/category
- Submit assessment (student)
- Get submissions (teacher)
- Grade submissions

---

### 7. **AssignmentController** - Assignment Handling

**File:** `src/Controllers/AssignmentController.php`

**Features:**

- Create assignments
- Update assignments
- Delete assignments
- Submit assignments
- Grade submissions
- Get submission history
- Late submission tracking

---

### 8. **QuizController** - Quiz System

**File:** `src/Controllers/QuizController.php`

**Features:**

- Create quizzes
- Add questions
- Update quizzes
- Delete quizzes
- Take quiz (student)
- Auto-grading
- Time limits
- Multiple attempts
- Question randomization

---

### 9. **GradeScaleController** - Grading System

**File:** `src/Controllers/GradeScaleController.php`

**Features:**

- Define grading scales
- Set grade ranges (A: 90-100, B: 80-89, etc.)
- Institution-specific scales
- Multiple grading systems

---

### 10. **InstitutionController** - Institution Settings

**File:** `src/Controllers/InstitutionController.php`

**Features:**

- Create institutions
- Update institution info
- Get all institutions
- Get institution by ID
- Institution settings management
- Multi-institution support

---

### 11. **AcademicYearController** - Academic Year Management

**File:** `src/Controllers/AcademicYearController.php`

**Features:**

- Create academic years
- Set active year
- Get all years
- Update year details

---

### 12. **SemesterController** - Semester Management

**File:** `src/Controllers/SemesterController.php`

**Features:**

- Create semesters
- Set active semester
- Get all semesters
- Link to academic years

---

### 13. **ClassController** - Class/Section Management

**File:** `src/Controllers/ClassController.php`

**Features:**

- Create classes
- Assign students
- Assign teachers
- Get class roster
- Update class details

---

### 14. **SubjectController** - Subject Management

**File:** `src/Controllers/SubjectController.php`

**Features:**

- Create subjects
- Update subjects
- Get all subjects
- Assign to classes/teachers

---

### 15. **MessageController** - Messaging System

**File:** `src/Controllers/MessageController.php`

**Features:**

- Send messages
- View inbox
- View sent messages
- Mark as read
- Delete messages
- Search messages

---

### 16. **NotificationController** - Notification System

**File:** `src/Controllers/NotificationController.php`

**Features:**

- Create notifications
- Get user notifications
- Mark as read
- Delete notifications
- Bulk operations

---

### 17. **AnnouncementController** - Announcements

**File:** `src/Controllers/AnnouncementController.php`

**Features:**

- Create announcements
- Update announcements
- Get all announcements
- Filter by institution/target audience
- Pin important announcements

---

### 18. **LoginActivityController** - Login Tracking ✅ NEW

**File:** `src/Controllers/LoginActivityController.php`

**Features:**

- ✅ View all login activities (admin)
- ✅ Get user login history
- ✅ Get recent logins
- ✅ Get failed login attempts
- ✅ Filter by date range
- ✅ Security monitoring

**Key Endpoints:**

- `GET /api/login-activity` - All activities (admin)
- `GET /api/login-activity/user/{id}` - User history
- `GET /api/login-activity/user/{id}/recent` - Recent logins
- `GET /api/login-activity/failed` - Failed attempts

---

### 19. **ErrorLogController** - Error Monitoring ✅ NEW

**File:** `src/Controllers/ErrorLogController.php`

**Features:**

- ✅ View all error logs (admin)
- ✅ Get error by ID
- ✅ Filter by severity (critical, error, warning, info)
- ✅ Get unresolved errors
- ✅ Mark errors as resolved
- ✅ Manual error creation

**Key Endpoints:**

- `GET /api/error-logs` - All errors (admin)
- `POST /api/error-logs/show` - Get by ID
- `GET /api/error-logs/unresolved` - Unresolved only
- `GET /api/error-logs/severity/{level}` - By severity
- `POST /api/error-logs/{id}/resolve` - Mark resolved

---

### 20. **ParentController** - Parent Management

**File:** `src/Controllers/ParentController.php`

**Features:**

- Create parent accounts
- Link to students
- View child's records
- Access grades/attendance

---

### 21-26. **Additional Controllers**

- `RoleController` - Role management
- `PermissionController` - Permission management
- `UserController` - User administration
- `ProgramController` - Academic programs
- `GradeLevelController` - Grade levels
- `ResultController` - Assessment results

---

## 🔐 Middleware Components

### 1. **AuthMiddleware** - JWT Authentication

**File:** `src/Middleware/AuthMiddleware.php`

**Functionality:**

- Validates JWT tokens from Authorization header
- Decodes token payload
- Retrieves user from database
- Injects user data into request
- Returns 401 for invalid/expired tokens

**Usage:**

```php
// Protect route
$router->get('/protected', [Controller::class, 'method'], ['auth']);
```

---

### 2. **RoleMiddleware** - Role-based Access Control

**File:** `src/Middleware/RoleMiddleware.php`

**Functionality:**

- Checks user's assigned roles
- Enforces role requirements
- Returns 403 for insufficient permissions
- Supports multiple role requirements

**Usage:**

```php
// Admin only
$router->post('/admin-only', [Controller::class, 'method'], ['auth', 'role:admin']);

// Admin or Teacher
$router->post('/staff', [Controller::class, 'method'], ['auth', 'role:admin,teacher']);
```

---

### 3. **ErrorHandler** - Global Exception Handler ✅ NEW

**File:** `src/Middleware/ErrorHandler.php`

**Functionality:**

- ✅ Catches all uncaught exceptions
- ✅ Automatically logs to `error_logs` table
- ✅ Captures stack trace, source file, line number
- ✅ Determines severity level
- ✅ Logs user, IP, timestamp
- ✅ Returns appropriate HTTP status codes
- ✅ Environment-aware error messages

**Severity Mapping:**

- `critical` - Fatal errors (E_ERROR, E_CORE_ERROR)
- `error` - Runtime exceptions
- `warning` - E_WARNING, E_CORE_WARNING
- `info` - E_NOTICE, E_DEPRECATED

**Usage:**

```php
// In public/index.php
use App\Middleware\ErrorHandler;

$errorHandler = new ErrorHandler();
$errorHandler->register();

// Wrap application
$errorHandler->wrap(function() {
    // All exceptions auto-logged
});
```

---

## 📊 Repositories (Data Access Layer)

### Repository Pattern Benefits:

- Separation of concerns
- Reusable database queries
- Easier testing
- Consistent error handling

### Key Repositories:

#### **LoginActivityRepository** ✅ NEW

**File:** `src/Repositories/LoginActivityRepository.php`

**Methods:**

- `create($data)` - Create login record
- `getAll($filters)` - Get all activities (paginated)
- `getUserLoginHistory($userId)` - User's login history
- `getRecentLogins($userId, $limit)` - Recent logins
- `getFailedAttempts($userId, $hours)` - Failed attempts
- `logLogout($userId)` - Update logout timestamp
- `count($filters)` - Count records

---

#### **ErrorLogRepository** ✅ NEW

**File:** `src/Repositories/ErrorLogRepository.php`

**Methods:**

- `create($data)` - Create error log
- `getAll($filters)` - Get all errors (paginated)
- `findById($id)` - Get single error
- `getBySeverity($level)` - Filter by severity
- `getUnresolved()` - Unresolved errors only
- `markResolved($id, $resolvedBy)` - Mark as resolved
- `count($filters)` - Count errors

---

#### **UserRepository**

**Methods:**

- `findById($id)` - Get user by ID
- `findByEmail($email)` - Get by email
- `findByUsername($username)` - Get by username
- `create($data)` - Create user
- `update($id, $data)` - Update user
- `assignRole($userId, $roleId)` - Assign role
- `getRoleByName($name)` - Get role ID
- `logActivity($userId, $action, $details)` - Legacy logging

---

#### **CourseRepository**

**Methods:**

- `getAll($filters)` - List courses
- `findById($id)` - Get course
- `create($data)` - New course
- `update($id, $data)` - Update course
- `delete($id)` - Archive course
- `getEnrolledStudents($id)` - Students in course
- `getMaterials($id)` - Course materials
- `getAssessments($id)` - Course assessments

---

#### **Other Repositories:**

- `AssessmentRepository` - Assessment CRUD
- `AttendanceRepository` - Attendance operations
- `EnrollmentRepository` - Course enrollments
- `GradeRepository` - Grading operations
- `NotificationRepository` - Notifications
- `MessageRepository` - Messaging
- [20+ more repositories...]

---

## 🛠️ Utility Classes

### 1. **JWTHandler**

**File:** `src/Utils/JWTHandler.php`

**Methods:**

- `generateAccessToken($payload)` - Create short-lived token (1 hour)
- `generateRefreshToken($userId)` - Create long-lived token (7 days)
- `validateToken($token)` - Verify and decode token
- `getTokenPayload($token)` - Extract payload without validation

**Configuration:**

```env
JWT_SECRET=your-secret-key
JWT_ISSUER=lms-api
JWT_AUDIENCE=lms-client
```

---

### 2. **Response**

**File:** `src/Utils/Response.php`

**Methods:**

- `success($data, $code=200)` - Success response
- `error($message, $code=400)` - Error response
- `validationError($errors)` - Validation errors (422)
- `unauthorized($message)` - 401 response
- `forbidden($message)` - 403 response
- `notFound($message)` - 404 response
- `serverError($message)` - 500 response

**Response Format:**

```json
{
  "status": "success|error",
  "data": {},
  "message": "",
  "errors": {},
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "total_pages": 5
  }
}
```

---

### 3. **Validator**

**File:** `src/Utils/Validator.php`

**Methods:**

- `required($fields)` - Required fields
- `email($field)` - Email validation
- `min($field, $length)` - Minimum length
- `max($field, $length)` - Maximum length
- `numeric($field)` - Numeric validation
- `in($field, $values)` - Allowed values
- `fails()` - Check validation status
- `getErrors()` - Get error messages

**Usage:**

```php
$validator = new Validator($data);
$validator->required(['email', 'password'])
          ->email('email')
          ->min('password', 8);

if ($validator->fails()) {
    Response::validationError($validator->getErrors());
}
```

---

## 🔄 Automatic Features

### ✅ Login Activity Tracking (Automatic)

**Triggered On:**

1. **Successful Login**
   - Creates record with `is_successful = 1`
   - Captures: user_id, IP, user agent, timestamp

2. **Failed Login (Invalid Credentials)**
   - Creates record with `is_successful = 0`
   - Failure reason: "Invalid credentials"
   - Captures IP and user agent for security

3. **Failed Login (Inactive Account)**
   - Creates record with `is_successful = 0`
   - Failure reason: "Account is inactive"

4. **Logout**
   - Updates most recent login record
   - Sets `logout_time` to current timestamp

**Implementation:**

```php
// In AuthController::login()
$this->loginActivityRepo->create([
    'user_id' => $user['user_id'],
    'login_time' => date('Y-m-d H:i:s'),
    'ip_address' => $_SERVER['REMOTE_ADDR'] ?? null,
    'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? null,
    'is_successful' => 1,
    'failure_reason' => null
]);
```

---

### ✅ Error Logging (Automatic)

**Triggered On:**

- Any uncaught exception
- PHP errors (converted to exceptions)
- Fatal errors during shutdown

**Captured Data:**

- Error message
- Full stack trace
- Source file and line number
- Severity level (critical/error/warning/info)
- User ID (if authenticated)
- IP address
- Timestamp
- Request details

**Implementation:**

```php
// In ErrorHandler::handleException()
$this->errorLogRepo->create([
    'user_id' => $_SESSION['user_id'] ?? null,
    'error_message' => $exception->getMessage(),
    'stack_trace' => $exception->getTraceAsString(),
    'source' => $exception->getFile() . ':' . $exception->getLine(),
    'severity_level' => $this->getSeverityLevel($exception),
    'ip_address' => $_SERVER['REMOTE_ADDR'] ?? null,
    'is_resolved' => 0
]);
```

---

## 📡 API Endpoints Summary

**Total Endpoints:** 210+

### Authentication (8 endpoints)

- POST `/api/auth/register`
- POST `/api/auth/login`
- POST `/api/auth/logout`
- POST `/api/auth/refresh`
- GET `/api/auth/me`
- POST `/api/auth/change-password`
- POST `/api/auth/forgot-password`
- POST `/api/auth/reset-password`

### Students (7 endpoints)

- GET `/api/students`
- GET `/api/students/{id}`
- POST `/api/students`
- PUT `/api/students/{id}`
- GET `/api/students/{id}/courses`
- POST `/api/students/{id}/enroll`
- DELETE `/api/students/{id}/courses/{courseId}`

### Courses (8 endpoints)

- GET `/api/courses`
- GET `/api/courses/{id}`
- POST `/api/courses`
- PUT `/api/courses/{id}`
- DELETE `/api/courses/{id}`
- GET `/api/courses/{id}/students`
- GET `/api/courses/{id}/materials`
- GET `/api/courses/{id}/assessments`

### Assessments (8 endpoints)

- GET `/api/assessments`
- GET `/api/assessments/{id}`
- POST `/api/assessments`
- PUT `/api/assessments/{id}`
- DELETE `/api/assessments/{id}`
- POST `/api/assessments/{id}/submit`
- GET `/api/assessments/{id}/submissions`
- POST `/api/submissions/{id}/grade`

### Attendance (5 endpoints)

- GET `/api/students/{id}/attendance`
- GET `/api/students/{id}/attendance/stats`
- GET `/api/courses/{id}/attendance`
- POST `/api/attendance`
- POST `/api/attendance/bulk`

### Login Activity (4 endpoints) ✅ NEW

- GET `/api/login-activity`
- GET `/api/login-activity/user/{id}`
- GET `/api/login-activity/user/{id}/recent`
- GET `/api/login-activity/failed`

### Error Logs (6 endpoints) ✅ NEW

- GET `/api/error-logs`
- POST `/api/error-logs/show`
- GET `/api/error-logs/unresolved`
- GET `/api/error-logs/severity/{level}`
- POST `/api/error-logs/{id}/resolve`
- POST `/api/error-logs`

### Additional Endpoints

- Teachers (10+)
- Parents (8+)
- Classes (12+)
- Subjects (8+)
- Quizzes (15+)
- Assignments (10+)
- Messages (12+)
- Notifications (8+)
- Announcements (6+)
- Institutions (10+)
- Academic Years (6+)
- Semesters (6+)
- Grade Scales (8+)
- Roles & Permissions (15+)
- Programs (6+)

**See `API_ENDPOINTS_MAP.md` for complete documentation**

---

## ⚙️ Configuration Files

### 1. **.env** - Environment Variables

```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=lms
DB_USERNAME=root
DB_PASSWORD=

# JWT
JWT_SECRET=your-secret-key
JWT_ISSUER=lms-api
JWT_AUDIENCE=lms-client

# App
APP_NAME="LMS API"
APP_ENV=development
APP_URL=http://localhost
```

### 2. **composer.json** - PHP Dependencies

```json
{
  "require": {
    "php": ">=8.0",
    "firebase/php-jwt": "^6.0",
    "vlucas/phpdotenv": "^5.0",
    "phpmailer/phpmailer": "^6.0"
  },
  "autoload": {
    "psr-4": {
      "App\\": "src/"
    }
  }
}
```

### 3. **.htaccess** - Apache Rewrite Rules

```apache
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ index.php [QSA,L]
```

### 4. **public/index.php** - Application Entry Point

```php
// Load dependencies
require_once __DIR__ . '/../vendor/autoload.php';

// Load environment variables
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/..');
$dotenv->load();

// Set CORS headers
require_once __DIR__ . '/../config/cors.php';

// Load routes
require_once __DIR__ . '/../src/Routes/api.php';
```

---

## 🚀 Installation & Setup

### Prerequisites

- PHP 8.0+
- MySQL 8.0+
- Composer
- Apache/Nginx

### Step 1: Install Dependencies

```bash
cd d:\db\lms-api
composer install
```

### Step 2: Configure Environment

Update `.env` with your database credentials:

```env
DB_HOST=localhost
DB_DATABASE=lms
DB_USERNAME=root
DB_PASSWORD=your_password
JWT_SECRET=generate-random-secret
```

### Step 3: Create Database

```bash
# Import schema
mysql -u root -p < d:\db\database_lms_api.sql

# Import sample data
mysql -u root -p lms < d:\db\lms-api\setup.sql
```

### Step 4: Configure Web Server

**Apache:**

- Point document root to `d:\db\lms-api\public`
- Enable `mod_rewrite`
- Set `AllowOverride All`

**PHP Built-in Server (Development):**

```bash
cd d:\db\lms-api\public
php -S localhost:8000
```

### Step 5: Test Installation

```bash
# Test database connection
php test_db.php

# Test login
php test_login.php

# Or use Postman with postman_collection.json
```

---

## 🔐 Security Features

### 1. **Authentication**

- ✅ JWT-based stateless authentication
- ✅ Access tokens (1 hour expiry)
- ✅ Refresh tokens (7 days expiry)
- ✅ Secure password hashing (bcrypt)

### 2. **Authorization**

- ✅ Role-based access control (RBAC)
- ✅ Permission-based authorization
- ✅ Middleware enforcement
- ✅ Resource ownership validation

### 3. **Data Protection**

- ✅ PDO prepared statements (SQL injection prevention)
- ✅ Input validation on all endpoints
- ✅ XSS prevention
- ✅ CORS configuration

### 4. **Monitoring & Logging**

- ✅ **Automatic login activity tracking**
- ✅ **Automatic error logging**
- ✅ User activity logs
- ✅ IP address logging
- ✅ Failed login attempt tracking

### 5. **Best Practices**

- ✅ Environment-based configuration
- ✅ Secure token storage
- ✅ HTTPS enforcement (production)
- ✅ Rate limiting (recommended)

---

## 📈 Testing

### Included Test Files

1. `test_db.php` - Database connection test
2. `test_login.php` - Authentication test
3. `postman_collection.json` - Complete API test suite

### Using Postman Collection

1. Import `postman_collection.json` into Postman
2. Set environment variables:
   - `base_url` = http://localhost/api
   - `access_token` = (auto-populated after login)
3. Test all 210+ endpoints

### Default Test Accounts

| Role    | Username | Password | Email           |
| ------- | -------- | -------- | --------------- |
| Admin   | admin    | password | admin@lms.com   |
| Teacher | teacher1 | password | teacher@lms.com |
| Student | student1 | password | student@lms.com |

---

## 📚 Documentation Files

### 1. **README.md** - Installation & Usage Guide

- Quick start guide
- Installation instructions
- API usage examples
- Troubleshooting

### 2. **API_ENDPOINTS_MAP.md** - Complete API Reference

- All 210+ endpoints documented
- Request/response examples
- Authentication requirements
- Role permissions

### 3. **PROJECT_SUMMARY.md** (This File)

- Complete project overview
- Architecture documentation
- Feature list
- Technical specifications

### 4. **postman_collection.json** - API Test Collection

- Pre-configured requests
- Environment variables
- Test scenarios
- Example payloads

---

## 🎯 Key Features Implemented

### ✅ Core Features

- [x] User authentication (JWT)
- [x] Role-based authorization
- [x] Student management
- [x] Teacher management
- [x] Course management
- [x] Assessment system (quizzes, exams, assignments)
- [x] Grading system
- [x] Attendance tracking
- [x] Enrollment management
- [x] Multi-institution support

### ✅ Communication Features

- [x] Messaging system
- [x] Notifications
- [x] Announcements
- [x] Parent-teacher communication

### ✅ Administrative Features

- [x] Institution settings
- [x] Academic year management
- [x] Semester management
- [x] Grade levels & programs
- [x] Class/section management
- [x] Subject management

### ✅ Security & Monitoring

- [x] **Automatic login activity tracking**
- [x] **Automatic error logging**
- [x] User activity logs
- [x] Failed login monitoring
- [x] Error severity classification
- [x] Admin error dashboard

### ✅ Advanced Features

- [x] Password reset via email
- [x] Token refresh mechanism
- [x] Bulk attendance marking
- [x] Course materials management
- [x] Assessment categories
- [x] Grade scale customization
- [x] Course reviews
- [x] Paginated responses

---

## 📊 Statistics

### Code Metrics

- **Controllers:** 26
- **Repositories:** 20+
- **Middleware:** 3
- **Utils:** 3
- **API Endpoints:** 210+
- **Database Tables:** 50
- **Lines of Code:** ~15,000+

### Technology Stack

- **Backend:** PHP 8.0+
- **Database:** MySQL 8.0+
- **Authentication:** JWT (firebase/php-jwt)
- **Architecture:** MVC + Repository Pattern
- **API Style:** RESTful
- **Environment:** Dotenv (vlucas/phpdotenv)

---

## 🔄 System Flow

### 1. **Request Flow**

```
Client Request
    ↓
public/index.php (Entry Point)
    ↓
CORS Headers Applied
    ↓
Route Matching (src/Routes/api.php)
    ↓
Middleware Chain
    ├─ AuthMiddleware (if protected)
    ├─ RoleMiddleware (if role required)
    └─ ErrorHandler (global)
    ↓
Controller Method
    ↓
Repository (Database Access)
    ↓
Response::success() or Response::error()
    ↓
JSON Response
```

### 2. **Authentication Flow**

```
POST /api/auth/login
    ↓
AuthController::login()
    ↓
UserRepository::findByEmail/Username()
    ↓
Password Verification
    ↓
JWTHandler::generateAccessToken()
    ↓
LoginActivityRepository::create() ✅ AUTO-LOGGED
    ↓
Return tokens + user data
```

### 3. **Error Handling Flow**

```
Exception Thrown
    ↓
ErrorHandler::handleException()
    ↓
ErrorLogRepository::create() ✅ AUTO-LOGGED
    ↓
Determine Severity Level
    ↓
Log to Database + File (dev mode)
    ↓
Return JSON Error Response
```

---

## 🛣️ Roadmap & Future Enhancements

### Potential Additions

- [ ] Real-time notifications (WebSocket)
- [ ] File upload for assignments
- [ ] Video conferencing integration
- [ ] Mobile app API endpoints
- [ ] Analytics dashboard
- [ ] Report generation (PDF)
- [ ] Email notifications
- [ ] SMS notifications
- [ ] Calendar integration
- [ ] Forum/discussion boards
- [ ] Gradebook export
- [ ] Attendance reports
- [ ] Performance analytics

---

## 📞 Support & Maintenance

### Logging Locations

- **Error Logs:** Database `error_logs` table + PHP error log
- **Login Activity:** Database `login_activity` table
- **User Activity:** Database `user_activity_logs` table

### Monitoring Endpoints (Admin Only)

- `GET /api/error-logs` - System errors
- `GET /api/login-activity/failed` - Failed logins
- `GET /api/error-logs/unresolved` - Unresolved errors

### Common Issues

1. **Database connection failed**
   - Check `.env` credentials
   - Verify MySQL is running
   - Ensure database exists

2. **Token expired**
   - Use refresh token endpoint
   - Re-login if refresh token expired

3. **Permission denied**
   - Check user role assignments
   - Verify middleware configuration

---

## 📄 License

This project is for educational purposes.

---

## 👥 Roles & Permissions

### Admin

- Full system access
- User management
- Institution settings
- View all logs
- System configuration

### Teacher

- View assigned courses
- Create assessments
- Grade submissions
- Mark attendance
- View student records
- Communicate with students/parents

### Student

- View enrolled courses
- Submit assessments
- View grades
- View attendance
- Communicate with teachers
- Access course materials

### Parent

- View child's records
- View grades
- View attendance
- Communicate with teachers
- Access announcements

---

## 🎓 Use Cases

### 1. **K-12 Schools**

- Student enrollment
- Grade book management
- Parent-teacher communication
- Attendance tracking
- Report cards

### 2. **Universities**

- Course registration
- Online assessments
- Grade management
- Multi-department support
- Academic year tracking

### 3. **Training Centers**

- Course offerings
- Student progress tracking
- Certificate management
- Assessment system

### 4. **Online Learning Platforms**

- Course catalog
- Student enrollments
- Quiz system
- Progress tracking

---

## 🔍 Quick Reference

### Environment Variables

```env
DB_HOST, DB_PORT, DB_DATABASE, DB_USERNAME, DB_PASSWORD
JWT_SECRET, JWT_ISSUER, JWT_AUDIENCE
APP_NAME, APP_ENV, APP_URL
```

### Key Directories

```
/public     - Web root
/src        - Application code
/config     - Configuration
/storage    - File uploads
/vendor     - Dependencies
```

### Important Files

```
.env                      - Environment config
composer.json             - Dependencies
setup.sql                 - Sample data
API_ENDPOINTS_MAP.md      - Full API docs
postman_collection.json   - API tests
```

### Default Credentials

```
Admin:   admin@lms.com / password
Teacher: teacher@lms.com / password
Student: student@lms.com / password
```

---

**Project Version:** 1.0  
**Last Updated:** February 15, 2026  
**Total Files:** 100+  
**Total Features:** 50+  
**API Endpoints:** 210+  
**Database Tables:** 50

---
