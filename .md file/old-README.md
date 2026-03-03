# LMS REST API

A comprehensive RESTful API for a Learning Management System (LMS) built with PHP 8.0+ and MySQL.

## Features

- **Authentication & Authorization**: JWT-based authentication with role-based access control
- **User Management**: Users, Students, Teachers with role-based permissions
- **Course Management**: Create, update, manage courses and enrollments
- **Assessment System**: Exams, quizzes, assignments with submission and grading
- **Attendance Tracking**: Mark and track student attendance with statistics
- **Material Management**: Course materials and resources
- **Notifications**: System notifications for users
- **Reporting**: Analytics and progress tracking
- **Login Activity Tracking**: Automatic logging of all login attempts (success/failure)
- **Error Logging**: Automatic exception and error tracking with severity levels

## System Requirements

- PHP 8.0 or higher
- MySQL 8.0 or higher
- Apache/Nginx web server
- Composer (PHP dependency manager)

## Installation

### 1. Install Composer

If you don't have Composer installed:

- Download from: https://getcomposer.org/download/
- Or use the installer: https://getcomposer.org/Composer-Setup.exe (for Windows)

### 2. Install Dependencies

```bash
cd d:\db\lms-api
composer install
```

### 3. Configure Environment

The `.env` file is already created. Update these values:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=lms
DB_USERNAME=root
DB_PASSWORD=your_password

# JWT Configuration
JWT_SECRET=your-secure-random-secret-key-change-this
JWT_ISSUER=lms-api
JWT_AUDIENCE=lms-client

# Application
APP_NAME="LMS API"
APP_ENV=development
APP_URL=http://localhost
```

### 4. Set Up Database

**IMPORTANT**: Use the new API-compatible database schema file.

1. Import the schema (creates database automatically):

```bash
# Using MySQL command line
mysql -u root -p < d:\db\database_lms_api.sql

# Or use MySQL Workbench/phpMyAdmin to import d:\db\database_lms_api.sql
```

2. Run initial setup (creates sample users and data):

```bash
mysql -u root -p lms < d:\db\lms-api\setup.sql
```

The setup script creates these default accounts:

| Role    | Username | Email           | Password |
| ------- | -------- | --------------- | -------- |
| Admin   | admin    | admin@lms.com   | password |
| Teacher | teacher1 | teacher@lms.com | password |
| Student | student1 | student@lms.com | password |

It also creates:

- 1 sample course (CS101 - Introduction to Computer Science)
- 1 enrollment (student1 enrolled in CS101)
- 1 sample assessment (Midterm Exam)

### 5. Configure Web Server

#### Apache

The `.htaccess` file is already configured. Make sure:

1. `mod_rewrite` is enabled
2. `AllowOverride All` is set for the directory
3. Document root points to `d:\db\lms-api\public`

Example Apache VirtualHost:

```apache
<VirtualHost *:80>
    ServerName lms-api.local
    DocumentRoot "d:/db/lms-api/public"

    <Directory "d:/db/lms-api/public">
        AllowOverride All
        Require all granted
    </Directory>
</VirtualHost>
```

#### Nginx

Example Nginx configuration:

```nginx
server {
    listen 80;
    server_name lms-api.local;
    root d:/db/lms-api/public;
    index index.php;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        fastcgi_pass 127.0.0.1:9000;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
    }
}
```

## API Usage

### Base URL

```
http://localhost/api
```

or if you set up virtual host:

```
http://lms-api.local/api
```

### Authentication

Most endpoints require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your-token>
```

### Example API Calls

#### Register a New User

```bash
POST /api/auth/register
Content-Type: application/json

{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "password123",
  "first_name": "John",
  "last_name": "Doe"
}
```

#### Login

```bash
POST /api/auth/login
Content-Type: application/json

{
  "login": "admin@lms.com",
  "password": "password"
}
```

Response:

```json
{
  "status": "success",
  "data": {
    "user": {
      "user_id": 1,
      "username": "admin",
      "email": "admin@lms.com",
      "roles": ["admin"]
    },
    "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
    "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
    "token_type": "Bearer"
  }
}
```

#### Get Current User

```bash
GET /api/auth/me
Authorization: Bearer <token>
```

#### Get All Courses

```bash
GET /api/courses?page=1&limit=20
Authorization: Bearer <token>
```

#### Create a Course (Admin/Teacher)

```bash
POST /api/courses
Authorization: Bearer <token>
Content-Type: application/json

{
  "course_code": "CS101",
  "course_name": "Introduction to Computer Science",
  "description": "Basic computer science concepts",
  "teacher_id": 1,
  "credits": 3,
  "duration_weeks": 16,
  "status": "active"
}
```

#### Enroll Student in Course

```bash
POST /api/students/{student_id}/enroll
Authorization: Bearer <token>
Content-Type: application/json

{
  "course_id": 1
}
```

#### Mark Attendance

```bash
POST /api/attendance
Authorization: Bearer <token>
Content-Type: application/json

{
  "student_id": 1,
  "course_id": 1,
  "attendance_date": "2024-01-15",
  "status": "present",
  "remarks": ""
}
```

#### Bulk Mark Attendance

```bash
POST /api/attendance/bulk
Authorization: Bearer <token>
Content-Type: application/json

{
  "course_id": 1,
  "attendance_date": "2024-01-15",
  "students": [
    {"student_id": 1, "status": "present"},
    {"student_id": 2, "status": "absent"},
    {"student_id": 3, "status": "late", "remarks": "Traffic"}
  ]
}
```

## Available Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout (requires auth)
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/me` - Get current user (requires auth)
- `POST /api/auth/change-password` - Change password (requires auth)
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token

### Students

- `GET /api/students` - List all students
- `GET /api/students/{id}` - Get student details
- `POST /api/students` - Create student (admin only)
- `PUT /api/students/{id}` - Update student
- `GET /api/students/{id}/courses` - Get enrolled courses
- `POST /api/students/{id}/enroll` - Enroll in course
- `DELETE /api/students/{id}/courses/{courseId}` - Unenroll from course

### Courses

- `GET /api/courses` - List all courses
- `GET /api/courses/{id}` - Get course details
- `POST /api/courses` - Create course (admin/teacher)
- `PUT /api/courses/{id}` - Update course (admin/teacher)
- `DELETE /api/courses/{id}` - Archive course (admin)
- `GET /api/courses/{id}/students` - Get enrolled students
- `GET /api/courses/{id}/materials` - Get course materials
- `GET /api/courses/{id}/assessments` - Get course assessments

### Assessments

- `GET /api/assessments?course_id={id}` - List assessments
- `GET /api/assessments/{id}` - Get assessment details
- `POST /api/assessments` - Create assessment (admin/teacher)
- `PUT /api/assessments/{id}` - Update assessment (admin/teacher)
- `DELETE /api/assessments/{id}` - Delete assessment (admin/teacher)
- `POST /api/assessments/{id}/submit` - Submit assessment (student)
- `GET /api/assessments/{id}/submissions` - Get all submissions (teacher)
- `POST /api/submissions/{id}/grade` - Grade submission (teacher)

### Attendance

- `GET /api/students/{id}/attendance` - Get student attendance
- `GET /api/students/{id}/attendance/stats` - Get attendance statistics
- `GET /api/courses/{id}/attendance?date=YYYY-MM-DD` - Get course attendance
- `POST /api/attendance` - Mark attendance (admin/teacher)
- `POST /api/attendance/bulk` - Bulk mark attendance (admin/teacher)

### Login Activity (Admin/Self)

- `GET /api/login-activity` - Get all login activities (admin only)
- `GET /api/login-activity/user/{id}` - Get user's login history
- `GET /api/login-activity/user/{id}/recent` - Get recent logins
- `GET /api/login-activity/failed` - Get failed login attempts

### Error Logs (Admin)

- `GET /api/error-logs` - Get all error logs (admin only)
- `POST /api/error-logs/show` - Get error log by ID
- `GET /api/error-logs/unresolved` - Get unresolved errors
- `GET /api/error-logs/severity/{level}` - Get errors by severity
- `POST /api/error-logs/{id}/resolve` - Mark error as resolved
- `POST /api/error-logs` - Create error log manually

## Response Format

### Success Response

```json
{
  "status": "success",
  "data": {}
}
```

### Paginated Response

```json
{
  "status": "success",
  "data": [],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "total_pages": 5
  }
}
```

### Error Response

```json
{
  "status": "error",
  "message": "Error message",
  "errors": {}
}
```

## Roles & Permissions

### Roles

- **Admin**: Full system access
- **Teacher**: Manage own courses, assessments, view students
- **Student**: View courses, submit assessments, view own records
- **Parent**: View child's records (partial implementation)

### Access Control

- Routes are protected by authentication middleware
- Role-based access is enforced at controller level
- Teachers can only manage their own courses
- Students can only view their own records

## Development

### Directory Structure

```
lms-api/
├── config/           # Configuration files
├── public/           # Public directory (document root)
│   └── index.php     # Application entry point
├── src/
│   ├── Controllers/  # API controllers
│   ├── Middleware/   # Authentication, authorization & error handling
│   ├── Repositories/ # Database access layer
│   ├── Routes/       # Route definitions
│   └── Utils/        # Utility classes
├── storage/          # File uploads, logs
├── .env              # Environment configuration
├── .htaccess         # Apache rewrite rules
└── composer.json     # PHP dependencies
```

### Adding New Endpoints

1. Create controller in `src/Controllers/`
2. Create repository in `src/Repositories/` (if needed)
3. Add routes in `src/Routes/api.php`
4. Controllers automatically have access to authenticated user

### Error Handling

- All errors are logged to PHP error log
- **Automatic Error Logging**: Exceptions are automatically logged to database via ErrorHandler middleware
- Development mode shows detailed errors
- Production mode shows generic error messages
- Use `Response` utility class for consistent responses
- **Error Severity Levels**: Errors are categorized (critical, error, warning, info)
- **Admin Error Dashboard**: View and resolve errors via API endpoints

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt hashing for passwords
- **SQL Injection Prevention**: PDO prepared statements
- **CORS Configuration**: Configurable cross-origin requests
- **Input Validation**: Server-side validation on all inputs
- **Role-Based Access**: Middleware enforces permissions
- **Activity Logging**: User actions are logged
- **Login Tracking**: All login attempts tracked (successful and failed)
- **Error Monitoring**: Automatic exception logging with severity levels
- **Session Security**: Auto-logout tracking and IP address logging

## Testing

Test the API using tools like:

- **Postman**: https://www.postman.com/
- **Insomnia**: https://insomnia.rest/
- **cURL**: Command-line testing
- **HTTPie**: https://httpie.io/

Example with cURL:

```bash
# Login
curl -X POST http://localhost/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"login":"admin@lms.com","password":"password"}'

# Get courses (replace TOKEN)
curl http://localhost/api/courses \
  -H "Authorization: Bearer TOKEN"
```

## Troubleshooting

### Database Connection Issues

- Check MySQL is running
- Verify credentials in `.env`
- Ensure database exists and schema is imported

### 500 Internal Server Error

- Check PHP error logs
- Ensure all dependencies are installed (`composer install`)
- Verify file permissions (storage/ should be writable)

### Authentication Not Working

- Verify JWT_SECRET is set in `.env`
- Check token is sent in Authorization header
- Ensure user exists and is active

### Routes Not Working

- Apache: Check `mod_rewrite` is enabled
- Check `.htaccess` file exists in public/
- Verify document root is set to public/ directory

## Automatic Logging Features

### Login Activity Tracking

The system automatically tracks all login attempts (successful and failed):

**Tracked Information:**

- User ID (if available)
- Login timestamp
- Logout timestamp (when user logs out)
- IP address
- User agent (browser/device info)
- Success/failure status
- Failure reason (if failed)

**Automatic Tracking:**

- ✅ **Successful login**: Creates record with `is_successful = 1`
- ✅ **Failed login (invalid credentials)**: Creates record with `is_successful = 0` and failure reason
- ✅ **Failed login (inactive account)**: Creates record with failure reason "Account is inactive"
- ✅ **Logout**: Updates the most recent login record with logout timestamp

**API Endpoints:**

```bash
# Get all login activities (Admin only)
GET /api/login-activity?page=1&limit=20
Authorization: Bearer <token>

# Get user's login history
GET /api/login-activity/user/{user_id}?page=1&limit=20
Authorization: Bearer <token>

# Get failed login attempts
GET /api/login-activity/failed?hours=24
Authorization: Bearer <token>

# Get recent logins for a user
GET /api/login-activity/user/{user_id}/recent?limit=5
Authorization: Bearer <token>
```

### Error Logging

The system automatically logs all errors and exceptions:

**Using Error Handler Middleware:**

Add to your `public/index.php` (before routing):

```php
use App\Middleware\ErrorHandler;

$errorHandler = new ErrorHandler();
$errorHandler->register();

// Then wrap your application code
$errorHandler->wrap(function() {
    // Your application code here
    // All exceptions will be automatically logged
});
```

**Tracked Information:**

- Error message
- Stack trace
- Source file and line number
- Severity level (critical, error, warning, info)
- User ID (if logged in)
- IP address
- Timestamp

**Severity Levels:**

- `critical`: Fatal errors (E_ERROR, E_CORE_ERROR, E_COMPILE_ERROR, E_PARSE)
- `error`: Runtime errors and exceptions
- `warning`: Runtime warnings (E_WARNING, E_CORE_WARNING)
- `info`: Notices and deprecations (E_NOTICE, E_DEPRECATED)

**API Endpoints:**

```bash
# Get all error logs (Admin only)
GET /api/error-logs?page=1&limit=20
Authorization: Bearer <token>

# Get error log by ID
POST /api/error-logs/show
Authorization: Bearer <token>
Content-Type: application/json

{
  "id": 1
}

# Get unresolved errors
GET /api/error-logs/unresolved?page=1&limit=20
Authorization: Bearer <token>

# Get errors by severity
GET /api/error-logs/severity/{level}?page=1&limit=20
# Levels: critical, error, warning, info
Authorization: Bearer <token>

# Mark error as resolved (Admin only)
POST /api/error-logs/{id}/resolve
Authorization: Bearer <token>

# Create error log manually (if needed)
POST /api/error-logs
Authorization: Bearer <token>
Content-Type: application/json

{
  "error_message": "Something went wrong",
  "stack_trace": "...",
  "source": "file.php:123",
  "severity_level": "error"
}
```

### Environment-Specific Behavior

**Development Mode** (`APP_ENV=development`):

- Detailed error messages shown in API responses
- Full stack traces visible
- Errors logged to both database and PHP error log

**Production Mode** (`APP_ENV=production`):

- Generic error messages shown ("An unexpected error occurred")
- Detailed errors hidden from users
- All errors still logged to database for admin review

## License

This project is for educational purposes.

## Support

For issues or questions, please check:

1. PHP error logs
2. MySQL error logs
3. Browser console for client-side issues
