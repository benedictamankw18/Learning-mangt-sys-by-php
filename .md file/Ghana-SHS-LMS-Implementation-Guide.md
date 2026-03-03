# Ghana Senior High School LMS - Implementation Guide

**Document Version:** 1.0  
**Last Updated:** March 2, 2026  
**Reference:** Ghana-SHS-LMS-Pages-Specification.md  
**Database:** lms (1).sql

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Prerequisites & Technology Stack](#2-prerequisites--technology-stack)
3. [Project Structure Setup](#3-project-structure-setup)
4. [Database Implementation](#4-database-implementation)
5. [Backend API Development](#5-backend-api-development)
6. [Authentication & Authorization](#6-authentication--authorization)
7. [Frontend Implementation by Role](#7-frontend-implementation-by-role)
8. [Ghana-Specific Features Implementation](#8-ghana-specific-features-implementation)
9. [Security Implementation](#9-security-implementation)
10. [Testing Strategy](#10-testing-strategy)
11. [Deployment Guide](#11-deployment-guide)
12. [Maintenance & Updates](#12-maintenance--updates)

---

## 1. Project Overview

### 1.1 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT LAYER                            │
├──────────────┬──────────────┬──────────────┬────────────────┤
│ Super Admin  │    Admin     │   Teacher    │ Student/Parent │
│  Dashboard   │  Dashboard   │  Dashboard   │   Dashboard    │
└──────┬───────┴──────┬───────┴──────┬───────┴────────┬───────┘
       │              │              │                │
       └──────────────┴──────────────┴────────────────┘
                           │
       ┌───────────────────┴───────────────────┐
       │         API GATEWAY / ROUTING         │
       └───────────────────┬───────────────────┘
                           │
       ┌───────────────────┴───────────────────┐
       │       BUSINESS LOGIC LAYER             │
       ├────────────────────────────────────────┤
       │  - Authentication Service              │
       │  - User Management Service             │
       │  - Academic Management Service         │
       │  - Assessment Service                  │
       │  - Communication Service               │
       │  - Notification Service                │
       │  - Reporting Service                   │
       └───────────────────┬───────────────────┘
                           │
       ┌───────────────────┴───────────────────┐
       │         DATA ACCESS LAYER              │
       └───────────────────┬───────────────────┘
                           │
       ┌───────────────────┴───────────────────┐
       │          DATABASE (MySQL)              │
       │         54 Tables - lms (1).sql        │
       └────────────────────────────────────────┘
```

### 1.2 Implementation Phases

| Phase       | Focus Area                       | Duration  | Pages    |
| ----------- | -------------------------------- | --------- | -------- |
| **Phase 1** | Core Authentication & Dashboards | 4-6 weeks | 15 pages |
| **Phase 2** | Academic Management              | 6-8 weeks | 25 pages |
| **Phase 3** | Communication & Reporting        | 4-6 weeks | 18 pages |
| **Phase 4** | Advanced Features & Polish       | 4-6 weeks | 14 pages |

**Total Estimated Timeline:** 18-26 weeks (4.5-6.5 months)

---

## 2. Prerequisites & Technology Stack

### 2.1 Required Software

#### Development Environment

```bash
# Required installations
Node.js >= 18.x
MySQL >= 8.0
PHP >= 8.1 (if using Laravel)
Git >= 2.30
Visual Studio Code or similar IDE
Postman or similar API testing tool
```

#### Recommended Stack

**Option A: MERN Stack (Recommended)**

```
Frontend:  React 18+ with TypeScript
Backend:   Node.js + Express.js
Database:  MySQL 8.0
ORM:       Sequelize or TypeORM
Auth:      JWT + Passport.js
```

**Option B: Laravel Stack**

```
Frontend:  Vue.js 3 or React 18
Backend:   Laravel 10+
Database:  MySQL 8.0
Auth:      Laravel Sanctum + Fortify
```

**Option C: Current Setup (PHP + Vanilla JS)**

```
Frontend:  HTML5 + CSS3 + Vanilla JavaScript
Backend:   PHP 8.1+ (Procedural or OOP)
Database:  MySQL 8.0
Auth:      Custom PHP Sessions
```

### 2.2 Third-Party Services

```yaml
Required Services:
  - Email Service: SendGrid, AWS SES, or Mailgun
  - SMS Gateway: Hubtel (Ghana), Twilio, or Africa's Talking
  - Cloud Storage: AWS S3, Cloudinary, or Google Cloud Storage
  - Payment Gateway: Paystack (Ghana), Flutterwave (optional for fees)

Optional Services:
  - Analytics: Google Analytics, Mixpanel
  - Error Tracking: Sentry, Rollbar
  - CDN: Cloudflare, AWS CloudFront
  - Backup: AWS Backup, Google Cloud Backup
```

### 2.3 Development Tools

```bash
# Package managers
npm or yarn (Node.js)
Composer (PHP)

# Version control
Git + GitHub/GitLab/Bitbucket

# API testing
Postman or Insomnia

# Database management
MySQL Workbench, phpMyAdmin, or DBeaver

# Code quality
ESLint (JavaScript)
PHPStan or Psalm (PHP)
Prettier (Code formatting)
```

---

## 3. Project Structure Setup

### 3.1 Directory Structure

#### Option A: Monorepo Structure (MERN)

```
ghana-shs-lms/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.js
│   │   │   ├── auth.js
│   │   │   └── app.js
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   ├── Student.js
│   │   │   ├── Teacher.js
│   │   │   ├── Institution.js
│   │   │   └── ... (51 more models)
│   │   ├── controllers/
│   │   │   ├── auth.controller.js
│   │   │   ├── user.controller.js
│   │   │   ├── student.controller.js
│   │   │   ├── teacher.controller.js
│   │   │   ├── attendance.controller.js
│   │   │   ├── assessment.controller.js
│   │   │   └── ... (15+ controllers)
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   ├── superadmin.routes.js
│   │   │   ├── admin.routes.js
│   │   │   ├── teacher.routes.js
│   │   │   ├── student.routes.js
│   │   │   └── parent.routes.js
│   │   ├── middleware/
│   │   │   ├── auth.middleware.js
│   │   │   ├── rbac.middleware.js
│   │   │   ├── validation.middleware.js
│   │   │   └── error.middleware.js
│   │   ├── services/
│   │   │   ├── email.service.js
│   │   │   ├── sms.service.js
│   │   │   ├── notification.service.js
│   │   │   └── upload.service.js
│   │   ├── utils/
│   │   │   ├── logger.js
│   │   │   ├── helpers.js
│   │   │   └── constants.js
│   │   └── app.js
│   ├── tests/
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/
│   │   │   │   ├── Header.jsx
│   │   │   │   ├── Sidebar.jsx
│   │   │   │   ├── Footer.jsx
│   │   │   │   ├── Button.jsx
│   │   │   │   ├── Modal.jsx
│   │   │   │   └── Table.jsx
│   │   │   ├── auth/
│   │   │   ├── superadmin/
│   │   │   ├── admin/
│   │   │   ├── teacher/
│   │   │   ├── student/
│   │   │   └── parent/
│   │   ├── pages/
│   │   │   ├── superadmin/
│   │   │   │   ├── Dashboard.jsx
│   │   │   │   ├── Institutions.jsx
│   │   │   │   ├── PlatformUsers.jsx
│   │   │   │   └── ... (10 pages)
│   │   │   ├── admin/
│   │   │   │   ├── Dashboard.jsx
│   │   │   │   ├── Students.jsx
│   │   │   │   ├── Teachers.jsx
│   │   │   │   └── ... (18 pages)
│   │   │   ├── teacher/
│   │   │   │   └── ... (16 pages)
│   │   │   ├── student/
│   │   │   │   └── ... (15 pages)
│   │   │   └── parent/
│   │   │       └── ... (13 pages)
│   │   ├── hooks/
│   │   ├── context/
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── utils/
│   │   ├── styles/
│   │   │   ├── global.css
│   │   │   └── variables.css
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
├── database/
│   ├── migrations/
│   ├── seeders/
│   ├── lms (1).sql
│   └── README.md
├── docs/
│   ├── Ghana-SHS-LMS-Pages-Specification.md
│   ├── Ghana-SHS-LMS-Implementation-Guide.md
│   └── API-Documentation.md
├── .gitignore
├── README.md
└── docker-compose.yml (optional)
```

#### Option B: Current Structure (PHP + Vanilla JS)

```
lms-frontend/
├── superadmin/
│   ├── page/
│   ├── js/
│   ├── css/
│   ├── dashboard.html
│   └── index.html
├── admin/
│   ├── page/
│   │   ├── attendance.html
│   │   ├── grades.html
│   │   ├── reports.html
│   │   ├── settings.html
│   │   ├── myprofile.html
│   │   ├── users.html
│   │   ├── courses.html
│   │   ├── institutions.html
│   │   └── departments.html
│   ├── js/
│   │   ├── settings.js
│   │   ├── myprofile.js
│   │   └── dashboard.js
│   ├── admin.css
│   ├── dashboard.html
│   └── index.html
├── teacher/
│   ├── page/
│   ├── js/
│   ├── css/
│   └── dashboard.html
├── student/
│   ├── page/
│   ├── js/
│   ├── css/
│   └── dashboard.html
├── parent/
│   ├── page/
│   ├── js/
│   ├── css/
│   └── dashboard.html
└── assets/
    ├── images/
    ├── fonts/
    └── icons/

lms-backend/ (PHP)
├── api/
│   ├── auth/
│   ├── superadmin/
│   ├── admin/
│   ├── teacher/
│   ├── student/
│   └── parent/
├── config/
│   ├── database.php
│   └── config.php
├── models/
├── controllers/
├── middleware/
└── index.php
```

### 3.2 Initialize Project

#### For MERN Stack

```bash
# Create project directory
mkdir ghana-shs-lms
cd ghana-shs-lms

# Initialize backend
mkdir backend
cd backend
npm init -y
npm install express mysql2 sequelize jsonwebtoken bcryptjs dotenv cors helmet express-validator
npm install -D nodemon

# Initialize frontend
cd ..
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install axios react-router-dom @tanstack/react-query zustand
npm install -D @types/react @types/react-dom

# Initialize Git
cd ..
git init
echo "node_modules/\n.env\ndist/\nbuild/" > .gitignore
```

#### For Laravel Stack

```bash
# Create Laravel project
composer create-project laravel/laravel ghana-shs-lms
cd ghana-shs-lms

# Install dependencies
composer require laravel/sanctum spatie/laravel-permission
npm install vue@next vue-router@4 axios
```

#### For Current PHP Setup

```bash
# Already exists, just organize
cd lms-frontend
# Create missing directories for each role
```

---

## 4. Database Implementation

### 4.1 Import Database Schema

```bash
# Step 1: Create database
mysql -u root -p

CREATE DATABASE ghana_shs_lms CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'lms_user'@'localhost' IDENTIFIED BY 'secure_password_here';
GRANT ALL PRIVILEGES ON ghana_shs_lms.* TO 'lms_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;

# Step 2: Import schema
mysql -u lms_user -p ghana_shs_lms < "d:/db/lms (1).sql"

# Step 3: Verify import
mysql -u lms_user -p ghana_shs_lms -e "SHOW TABLES;"
```

### 4.2 Database Seeding

Create seed data for testing:

```sql
-- File: database/seeders/001_institutions.sql

-- Ghana SHS Programs
INSERT INTO programs (name, code, description, created_at) VALUES
('General Science', 'GSCI', 'Science-focused program', NOW()),
('General Arts', 'GART', 'Arts and humanities program', NOW()),
('Business', 'BUS', 'Business and commerce program', NOW()),
('Visual Arts', 'VART', 'Visual arts program', NOW()),
('Home Economics', 'HECO', 'Home economics program', NOW()),
('Agriculture', 'AGRI', 'Agricultural science program', NOW()),
('Technical/Vocational', 'TECH', 'Technical and vocational training', NOW());

-- Grade Levels
INSERT INTO grade_levels (name, level, description, created_at) VALUES
('SHS 1', 1, 'Form 1 - First year', NOW()),
('SHS 2', 2, 'Form 2 - Second year', NOW()),
('SHS 3', 3, 'Form 3 - Final year', NOW());

-- Ghana WAEC Grading Scale
INSERT INTO grade_scales (grade, min_score, max_score, interpretation, gpa, created_at) VALUES
('A1', 75, 100, 'Excellent', 4.0, NOW()),
('B2', 70, 74, 'Very Good', 3.5, NOW()),
('B3', 65, 69, 'Good', 3.0, NOW()),
('C4', 60, 64, 'Credit', 2.5, NOW()),
('C5', 55, 59, 'Credit', 2.0, NOW()),
('C6', 50, 54, 'Credit', 1.5, NOW()),
('D7', 45, 49, 'Pass', 1.0, NOW()),
('E8', 40, 44, 'Pass', 0.5, NOW()),
('F9', 0, 39, 'Fail', 0.0, NOW());

-- Assessment Categories
INSERT INTO assessment_categories (name, weight, description, created_at) VALUES
('Class Test', 15, 'Regular class tests', NOW()),
('Assignment', 10, 'Homework and assignments', NOW()),
('Project', 10, 'Class projects', NOW()),
('Mid-term Exam', 15, 'Mid-semester examination', NOW()),
('End-of-term Exam', 50, 'Final term examination', NOW());

-- Roles
INSERT INTO roles (name, description, created_at) VALUES
('super_admin', 'Platform Super Administrator', NOW()),
('admin', 'Institution Administrator', NOW()),
('teacher', 'Teacher/Instructor', NOW()),
('student', 'Student', NOW()),
('parent', 'Parent/Guardian', NOW());

-- Permissions
INSERT INTO permissions (name, description, created_at) VALUES
('manage_users', 'Create, edit, delete users', NOW()),
('manage_courses', 'Manage courses and subjects', NOW()),
('manage_attendance', 'Mark and view attendance', NOW()),
('manage_assessments', 'Create and grade assessments', NOW()),
('view_reports', 'View reports and analytics', NOW()),
('manage_institution', 'Manage institution settings', NOW()),
('manage_platform', 'Manage platform-wide settings', NOW()),
('view_own_data', 'View own academic data', NOW());

-- Sample Institution
INSERT INTO institutions (name, code, address, region, phone, email, logo, status, created_at) VALUES
('Achimota School', 'ACH', 'Achimota, Accra', 'Greater Accra', '0302400801', 'info@achimota.edu.gh', NULL, 'active', NOW());

-- Get the institution ID
SET @institution_id = LAST_INSERT_ID();

-- Academic Year
INSERT INTO academic_years (institution_id, year_name, start_date, end_date, is_current, created_at) VALUES
(@institution_id, '2025/2026', '2025-09-01', '2026-08-31', 1, NOW());

-- Get academic year ID
SET @academic_year_id = LAST_INSERT_ID();

-- Semesters
INSERT INTO semesters (academic_year_id, semester_name, start_date, end_date, is_current, created_at) VALUES
(@academic_year_id, 'Semester 1', '2025-09-01', '2025-12-20', 1, NOW()),
(@academic_year_id, 'Semester 2', '2026-01-05', '2026-04-15', 0, NOW()),
(@academic_year_id, 'Semester 3', '2026-05-01', '2026-08-31', 0, NOW());

-- Core Subjects (All Programs)
INSERT INTO subjects (institution_id, name, code, type, description, created_at) VALUES
(@institution_id, 'English Language', 'ENG', 'core', 'Core English', NOW()),
(@institution_id, 'Mathematics (Core)', 'MATH', 'core', 'Core Mathematics', NOW()),
(@institution_id, 'Integrated Science', 'SCI', 'core', 'Core Science', NOW()),
(@institution_id, 'Social Studies', 'SOC', 'core', 'Core Social Studies', NOW());

-- Sample Admin User
INSERT INTO users (username, email, password, role, status, created_at) VALUES
('admin', 'admin@achimota.edu.gh', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 'active', NOW());
-- Password: password (hashed with bcrypt)

SET @admin_user_id = LAST_INSERT_ID();

-- Link admin to role
INSERT INTO user_roles (user_id, role_id) VALUES
(@admin_user_id, (SELECT id FROM roles WHERE name = 'admin'));
```

### 4.3 Run Seeders

```bash
# Import all seed files
mysql -u lms_user -p ghana_shs_lms < database/seeders/001_institutions.sql
mysql -u lms_user -p ghana_shs_lms < database/seeders/002_subjects.sql
mysql -u lms_user -p ghana_shs_lms < database/seeders/003_users.sql
```

---

## 5. Backend API Development

### 5.1 API Structure & Endpoints

#### Authentication Endpoints

```
POST   /api/auth/register          - Register new user
POST   /api/auth/login             - Login
POST   /api/auth/logout            - Logout
POST   /api/auth/forgot-password   - Request password reset
POST   /api/auth/reset-password    - Reset password
POST   /api/auth/verify-2fa        - Verify 2FA code
GET    /api/auth/me                - Get current user
PUT    /api/auth/update-profile    - Update profile
PUT    /api/auth/change-password   - Change password
```

#### Super Admin Endpoints

```
GET    /api/superadmin/dashboard              - Dashboard stats
GET    /api/superadmin/institutions           - List institutions
POST   /api/superadmin/institutions           - Create institution
GET    /api/superadmin/institutions/:id       - Get institution
PUT    /api/superadmin/institutions/:id       - Update institution
DELETE /api/superadmin/institutions/:id       - Delete institution
POST   /api/superadmin/institutions/bulk-upload - Bulk import institution

GET    /api/superadmin/platform-users         - List super admins (🔴 RESTRICTED)
POST   /api/superadmin/platform-users         - Create super admin (🔴 RESTRICTED)
POST   /api/superadmin/platform-users/bulk-upload - Bulk import super admin (🔴 RESTRICTED)
POST   /api/superadmin/verify-access          - Verify elevated access

GET    /api/superadmin/subscriptions          - List subscriptions
GET    /api/superadmin/reports                - Platform reports
GET    /api/superadmin/activity-logs          - Activity logs
```

#### Admin Endpoints

```
GET    /api/admin/dashboard                   - Dashboard stats
GET    /api/admin/students                    - List students
POST   /api/admin/students                    - Add student
GET    /api/admin/students/:id                - Get student
PUT    /api/admin/students/:id                - Update student
DELETE /api/admin/students/:id                - Delete student
POST   /api/admin/students/bulk-upload        - Bulk import students

GET    /api/admin/teachers                    - List teachers
POST   /api/admin/teachers                    - Add teacher
GET    /api/admin/teachers/:id                - Get teacher
PUT    /api/admin/teachers/:id                - Update teacher
POST   /api/admin/teachers/bulk-upload        - Bulk import teacher


GET    /api/admin/classes                     - List classes
POST   /api/admin/classes                     - Create class
POST   /api/admin/classes/bulk-upload         - Bulk import class
GET    /api/admin/attendance                  - Attendance overview
GET    /api/admin/grades                      - Grades overview
GET    /api/admin/reports                     - Institution reports
```

#### Teacher Endpoints

```
GET    /api/teacher/dashboard                 - Dashboard stats
GET    /api/teacher/classes                   - My classes
GET    /api/teacher/students                  - My students
POST   /api/teacher/attendance                - Mark attendance
POST   /api/teacher/attendance/bulk-upload    - Bulk import attendance
GET    /api/teacher/assignments               - My assignments
POST   /api/teacher/assignments               - Create assignment
POST   /api/teacher/assignments/bulk-upload   - Bulk import assignment
POST   /api/teacher/assessments               - Create assessment
POST   /api/teacher/assessments/bulk-upload   - Bulk import assessment
POST   /api/teacher/grades                    - Submit grades
POST   /api/teacher/grades//bulk-upload       - Bulk import grades
```

#### Student Endpoints

```
GET    /api/student/dashboard                 - Dashboard stats
GET    /api/student/classes                   - My classes
GET    /api/student/assignments               - My assignments
POST   /api/student/assignments/:id/submit    - Submit assignment
GET    /api/student/grades                    - My grades
GET    /api/student/attendance                - My attendance
GET    /api/student/materials                 - Course materials
```

#### Parent Endpoints

```
GET    /api/parent/dashboard                  - Dashboard stats
GET    /api/parent/children                   - My children
GET    /api/parent/children/:id/grades        - Child's grades
GET    /api/parent/children/:id/attendance    - Child's attendance
GET    /api/parent/children/:id/assignments   - Child's assignments
```

### 5.2 Sample Controller Implementation (Node.js)

```javascript
// File: backend/src/controllers/student.controller.js

const { Student, User, Class, Result } = require("../models");
const { validationResult } = require("express-validator");

class StudentController {
  // Get all students (Admin only)
  async getAllStudents(req, res) {
    try {
      const { page = 1, limit = 20, class_id, program, search } = req.query;
      const offset = (page - 1) * limit;

      // Build query
      const where = { institution_id: req.user.institution_id };
      if (class_id) where.class_id = class_id;
      if (program) where.program_id = program;
      if (search) {
        where[Op.or] = [
          { first_name: { [Op.like]: `%${search}%` } },
          { last_name: { [Op.like]: `%${search}%` } },
          { student_id: { [Op.like]: `%${search}%` } },
        ];
      }

      const students = await Student.findAndCountAll({
        where,
        include: [
          { model: User, attributes: ["id", "email", "status"] },
          { model: Class, attributes: ["id", "name"] },
        ],
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [["created_at", "DESC"]],
      });

      res.json({
        success: true,
        data: students.rows,
        pagination: {
          total: students.count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(students.count / limit),
        },
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Create new student
  async createStudent(req, res) {
    try {
      // Validate input
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const {
        first_name,
        last_name,
        email,
        date_of_birth,
        gender,
        class_id,
        program_id,
        phone,
      } = req.body;

      // Create user account
      const user = await User.create({
        username: email.split("@")[0],
        email,
        password: await bcrypt.hash("DefaultPassword123", 10),
        role: "student",
        status: "active",
      });

      // Generate student ID
      const student_id = await this.generateStudentID(req.user.institution_id);

      // Create student record
      const student = await Student.create({
        user_id: user.id,
        institution_id: req.user.institution_id,
        student_id,
        first_name,
        last_name,
        date_of_birth,
        gender,
        class_id,
        program_id,
        phone,
        status: "active",
      });

      res.status(201).json({
        success: true,
        message: "Student created successfully",
        data: student,
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Helper function to generate student ID
  async generateStudentID(institution_id) {
    const year = new Date().getFullYear();
    const count = await Student.count({ where: { institution_id } });
    return `STU${year}${String(count + 1).padStart(4, "0")}`;
  }
}

module.exports = new StudentController();
```

### 5.3 Sample Route Implementation

```javascript
// File: backend/src/routes/admin.routes.js

const express = require("express");
const router = express.Router();
const studentController = require("../controllers/student.controller");
const { authenticate, authorize } = require("../middleware/auth.middleware");
const { validateStudent } = require("../middleware/validation.middleware");

// All routes require authentication and admin role
router.use(authenticate);
router.use(authorize(["admin"]));

// Student routes
router.get("/students", studentController.getAllStudents);
router.post("/students", validateStudent, studentController.createStudent);
router.get("/students/:id", studentController.getStudent);
router.put("/students/:id", validateStudent, studentController.updateStudent);
router.delete("/students/:id", studentController.deleteStudent);

// Bulk operations
router.post("/students/bulk-upload", studentController.bulkUploadStudents);

module.exports = router;
```

---

## 6. Authentication & Authorization

### 6.1 JWT Implementation (Node.js)

```javascript
// File: backend/src/middleware/auth.middleware.js

const jwt = require("jsonwebtoken");
const { User, Role } = require("../models");

// Authenticate user
exports.authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No token provided",
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user
    const user = await User.findByPk(decoded.id, {
      include: [{ model: Role }],
    });

    if (!user || user.status !== "active") {
      return res.status(401).json({
        success: false,
        message: "Invalid token or user inactive",
      });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: "Invalid token",
    });
  }
};

// Authorize based on roles
exports.authorize = (roles = []) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }
    next();
  };
};

// Restrict to institution (data isolation)
exports.restrictToInstitution = (req, res, next) => {
  if (req.user.role === "super_admin") {
    return next(); // Super admin can access all
  }

  // Check if accessing own institution's data
  if (
    req.params.institution_id &&
    req.params.institution_id != req.user.institution_id
  ) {
    return res.status(403).json({
      success: false,
      message: "Access denied to this institution",
    });
  }

  next();
};

// Super Admin Restricted Access (🔴)
exports.requireElevatedAccess = async (req, res, next) => {
  try {
    if (req.user.role !== "super_admin") {
      return res.status(403).json({
        success: false,
        message: "Super admin access required",
      });
    }

    // Check for access token in headers
    const accessToken = req.headers["x-elevated-access"];

    if (!accessToken) {
      return res.status(403).json({
        success: false,
        message: "Elevated access token required",
        requiresElevation: true,
      });
    }

    // Verify elevated access (could be 2FA, PIN, etc.)
    const isValid = await verifyElevatedAccess(req.user.id, accessToken);

    if (!isValid) {
      return res.status(403).json({
        success: false,
        message: "Invalid elevated access token",
      });
    }

    next();
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
```

### 6.2 Login Implementation

```javascript
// File: backend/src/controllers/auth.controller.js

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { User } = require("../models");

class AuthController {
  async login(req, res) {
    try {
      const { email, password } = req.body;

      // Find user
      const user = await User.findOne({ where: { email } });

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Invalid credentials",
        });
      }

      // Check password
      const isValid = await bcrypt.compare(password, user.password);

      if (!isValid) {
        return res.status(401).json({
          success: false,
          message: "Invalid credentials",
        });
      }

      // Check if 2FA is enabled
      if (user.two_factor_enabled) {
        // Generate temp token for 2FA verification
        const tempToken = jwt.sign(
          { id: user.id, requires2FA: true },
          process.env.JWT_SECRET,
          { expiresIn: "5m" },
        );

        return res.json({
          success: true,
          requires2FA: true,
          tempToken,
        });
      }

      // Generate JWT token
      const token = jwt.sign(
        { id: user.id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || "24h" },
      );

      // Log login activity
      await this.logLoginActivity(user.id, req);

      res.json({
        success: true,
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          institution_id: user.institution_id,
        },
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async logLoginActivity(userId, req) {
    const { LoginActivity } = require("../models");
    await LoginActivity.create({
      user_id: userId,
      ip_address: req.ip,
      user_agent: req.headers["user-agent"],
      status: "success",
    });
  }
}

module.exports = new AuthController();
```

---

## 7. Frontend Implementation by Role

### 7.1 Super Admin Pages (10 pages)

#### Page 1: Overview Dashboard

**File:** `frontend/src/pages/superadmin/Dashboard.jsx`

**Features to Implement:**

- Total institutions count
- Total users breakdown (by role)
- Active subscriptions count
- System health indicators
- Recent institution registrations table
- Platform usage charts

**API Calls:**

```javascript
GET / api / superadmin / dashboard;
```

**Key Components:**

- StatCard (for metrics)
- LineChart (usage trends)
- RecentActivityTable
- SystemHealthIndicator

---

#### Page 2: Institutions Management

**File:** `frontend/src/pages/superadmin/Institutions.jsx`

**Features:**

- Search and filter institutions
- Create new institution (modal/form)
- Edit institution details
- Activate/deactivate institutions
- View institution profile
- Assign administrators

**API Calls:**

```javascript
GET    /api/superadmin/institutions?page=1&limit=20&search=
POST   /api/superadmin/institutions
PUT    /api/superadmin/institutions/:id
DELETE /api/superadmin/institutions/:id
```

---

#### Page 4: Platform Users (🔴 RESTRICTED)

**File:** `frontend/src/pages/superadmin/PlatformUsers.jsx`

**Special Implementation:**

```javascript
// Add elevated access verification before page loads
useEffect(() => {
  const verifyAccess = async () => {
    try {
      // Show PIN/2FA modal
      const accessToken = await showElevatedAccessModal();

      // Store token for API calls
      setElevatedToken(accessToken);

      // Fetch data with elevated token
      fetchPlatformUsers();
    } catch (error) {
      // Redirect if access denied
      navigate("/superadmin/dashboard");
    }
  };

  verifyAccess();
}, []);
```

**Features:**

- List all super admins
- Create super admin (with email verification)
- Edit permissions
- View activity logs
- Deactivate accounts

---

### 7.2 Admin Pages (18 pages)

#### Page 1: Dashboard Overview

**File:** `frontend/src/pages/admin/Dashboard.jsx` OR `lms-frontend/admin/page/dashboard.html`

**Current Status:** ✅ Exists (dashboard.html with dynamic loading)

**Features to Add:**

- Real API integration instead of static data
- Live attendance rate calculation
- Upcoming exams countdown
- Pending tasks notifications

**API Integration:**

```javascript
// File: lms-frontend/admin/js/dashboard.js
async function loadDashboardStats() {
  try {
    const response = await fetch("/api/admin/dashboard", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    const data = await response.json();

    // Update UI with real data
    document.getElementById("total-students").textContent =
      data.stats.total_students;
    document.getElementById("total-teachers").textContent =
      data.stats.total_teachers;
    document.getElementById("attendance-rate").textContent =
      data.stats.attendance_rate + "%";
  } catch (error) {
    console.error("Error loading dashboard:", error);
  }
}

// Call on page load
document.addEventListener("DOMContentLoaded", loadDashboardStats);
document.addEventListener("page:loaded", (e) => {
  if (e.detail.page === "dashboard") loadDashboardStats();
});
```

---

#### Page 2: Students Management

**File:** `lms-frontend/admin/page/students.html` (needs creation)

**HTML Structure:**

```html
<div class="students-page">
  <div class="page-header">
    <h1>Students Management</h1>
    <div class="actions">
      <button class="btn btn-primary" id="addStudentBtn">
        <i class="icon-plus"></i> Add Student
      </button>
      <button class="btn btn-secondary" id="bulkUploadBtn">
        <i class="icon-upload"></i> Bulk Upload
      </button>
    </div>
  </div>

  <div class="filters">
    <input type="text" id="searchStudent" placeholder="Search students..." />
    <select id="filterClass">
      <option value="">All Classes</option>
    </select>
    <select id="filterProgram">
      <option value="">All Programs</option>
    </select>
  </div>

  <div class="students-table">
    <table>
      <thead>
        <tr>
          <th>Student ID</th>
          <th>Name</th>
          <th>Class</th>
          <th>Program</th>
          <th>Gender</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody id="studentsTableBody">
        <!-- Populated by JS -->
      </tbody>
    </table>
  </div>

  <div class="pagination" id="studentsPagination"></div>
</div>

<!-- Add Student Modal -->
<div id="addStudentModal" class="modal">
  <div class="modal-content">
    <h2>Add New Student</h2>
    <form id="addStudentForm">
      <div class="form-row">
        <div class="form-group">
          <label>First Name *</label>
          <input type="text" name="first_name" required />
        </div>
        <div class="form-group">
          <label>Last Name *</label>
          <input type="text" name="last_name" required />
        </div>
      </div>
      <!-- More fields... -->
      <div class="form-actions">
        <button type="submit" class="btn btn-primary">Add Student</button>
        <button type="button" class="btn btn-secondary" onclick="closeModal()">
          Cancel
        </button>
      </div>
    </form>
  </div>
</div>
```

**JavaScript:**

```javascript
// File: lms-frontend/admin/js/students.js

function initializeStudentsPage() {
  let currentPage = 1;

  // Load students
  async function loadStudents() {
    const search = document.getElementById("searchStudent").value;
    const classId = document.getElementById("filterClass").value;
    const program = document.getElementById("filterProgram").value;

    const response = await fetch(
      `/api/admin/students?page=${currentPage}&search=${search}&class_id=${classId}&program=${program}`,
      { headers: { Authorization: `Bearer ${getToken()}` } },
    );

    const data = await response.json();
    renderStudentsTable(data.data);
    renderPagination(data.pagination);
  }

  // Render table
  function renderStudentsTable(students) {
    const tbody = document.getElementById("studentsTableBody");
    tbody.innerHTML = students
      .map(
        (student) => `
      <tr>
        <td>${student.student_id}</td>
        <td>${student.first_name} ${student.last_name}</td>
        <td>${student.Class?.name || "N/A"}</td>
        <td>${student.Program?.name || "N/A"}</td>
        <td>${student.gender}</td>
        <td><span class="badge ${student.status}">${student.status}</span></td>
        <td>
          <button onclick="viewStudent(${student.id})">View</button>
          <button onclick="editStudent(${student.id})">Edit</button>
        </td>
      </tr>
    `,
      )
      .join("");
  }

  // Add student form submission
  document
    .getElementById("addStudentForm")
    .addEventListener("submit", async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);

      const response = await fetch("/api/admin/students", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getToken()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(Object.fromEntries(formData)),
      });

      if (response.ok) {
        closeModal();
        loadStudents();
        showNotification("Student added successfully", "success");
      }
    });

  // Initialize
  loadStudents();
}

// Initialize on page load
document.addEventListener("DOMContentLoaded", initializeStudentsPage);
document.addEventListener("page:loaded", (e) => {
  if (e.detail.page === "students") initializeStudentsPage();
});
```

---

#### Page 6: Attendance Management

**File:** `lms-frontend/admin/page/attendance.html`

**Current Status:** ✅ Exists (placeholder needs full implementation)

**Features:**

- Daily attendance overview (all classes)
- Attendance by class view
- Attendance statistics (present %, absent %, late %)
- Absent students report
- Export attendance reports
- Send notifications to parents

---

#### Page 7: Grades & Assessments

**File:** `lms-frontend/admin/page/grades.html`

**Current Status:** ✅ Exists (placeholder needs full implementation)

**Features:**

- Ghana WAEC grading scale display (A1-F9)
- Assessment categories management
- Grade reports overview
- Publish/unpublish grades
- WASSCE preparation tracking

---

### 7.3 Teacher Pages (16 pages)

#### Page 1: Dashboard

**File:** `lms-frontend/teacher/page/dashboard.html`

**Features:**

- Today's classes schedule
- Pending assignments to grade (count)
- Recent student submissions
- Quick attendance marking
- Upcoming assessments

---

#### Page 5: Attendance

**File:** `lms-frontend/teacher/page/attendance.html`

**Features:**

- Take attendance for today's class
- Bulk mark attendance
- View attendance history
- Export class attendance

**Implementation:**

```javascript
// Attendance marking interface
function initializeAttendance() {
  // Load today's classes
  async function loadTodayClasses() {
    const response = await fetch("/api/teacher/classes/today", {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    const classes = await response.json();
    renderClassSelector(classes);
  }

  // Mark attendance
  async function markAttendance(classId) {
    const students = await fetchClassStudents(classId);

    // Render attendance grid
    const grid = students
      .map(
        (student) => `
      <div class="attendance-row">
        <span>${student.name}</span>
        <div class="attendance-options">
          <label>
            <input type="radio" name="attendance_${student.id}" value="present" checked>
            Present
          </label>
          <label>
            <input type="radio" name="attendance_${student.id}" value="absent">
            Absent
          </label>
          <label>
            <input type="radio" name="attendance_${student.id}" value="late">
            Late
          </label>
        </div>
      </div>
    `,
      )
      .join("");

    document.getElementById("attendanceGrid").innerHTML = grid;
  }

  // Submit attendance
  async function submitAttendance() {
    const attendanceData = [];
    // Collect all radio button values
    // POST to /api/teacher/attendance
  }
}
```

---

### 7.4 Student Pages (15 pages)

#### Page 6: My Grades

**File:** `lms-frontend/student/page/grades.html`

**Features:**

- Current grades by subject
- Grade breakdown (CA + Exam)
- Ghana WAEC scale display
- Progress charts
- Download report card

**Implementation:**

```javascript
async function loadMyGrades() {
  const response = await fetch("/api/student/grades", {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  const grades = await response.json();

  // Render grades table
  grades.forEach((grade) => {
    const row = `
      <tr>
        <td>${grade.subject_name}</td>
        <td>${grade.ca_score} (${grade.ca_percentage}%)</td>
        <td>${grade.exam_score} (${grade.exam_percentage}%)</td>
        <td>${grade.total_score}</td>
        <td><span class="grade ${grade.grade}">${grade.grade}</span></td>
        <td>${grade.grade_interpretation}</td>
      </tr>
    `;
  });
}
```

---

### 7.5 Parent Pages (13 pages)

#### Page 3: Academic Performance

**File:** `lms-frontend/parent/page/performance.html`

**Features:**

- Select child (if multiple)
- Current grades by subject
- Grade trends (charts)
- Comparison with class average
- Download report cards

---

## 8. Ghana-Specific Features Implementation

### 8.1 WAEC Grading Scale Calculator

```javascript
// File: utils/grading.js

const WAEC_SCALE = [
  {
    grade: "A1",
    min: 75,
    max: 100,
    interpretation: "Excellent",
    gpa: 4.0,
    credit: true,
  },
  {
    grade: "B2",
    min: 70,
    max: 74,
    interpretation: "Very Good",
    gpa: 3.5,
    credit: true,
  },
  {
    grade: "B3",
    min: 65,
    max: 69,
    interpretation: "Good",
    gpa: 3.0,
    credit: true,
  },
  {
    grade: "C4",
    min: 60,
    max: 64,
    interpretation: "Credit",
    gpa: 2.5,
    credit: true,
  },
  {
    grade: "C5",
    min: 55,
    max: 59,
    interpretation: "Credit",
    gpa: 2.0,
    credit: true,
  },
  {
    grade: "C6",
    min: 50,
    max: 54,
    interpretation: "Credit",
    gpa: 1.5,
    credit: true,
  },
  {
    grade: "D7",
    min: 45,
    max: 49,
    interpretation: "Pass",
    gpa: 1.0,
    credit: false,
  },
  {
    grade: "E8",
    min: 40,
    max: 44,
    interpretation: "Pass",
    gpa: 0.5,
    credit: false,
  },
  {
    grade: "F9",
    min: 0,
    max: 39,
    interpretation: "Fail",
    gpa: 0.0,
    credit: false,
  },
];

function calculateGrade(score) {
  const gradeInfo = WAEC_SCALE.find((g) => score >= g.min && score <= g.max);
  return gradeInfo || WAEC_SCALE[WAEC_SCALE.length - 1]; // Default to F9
}

function calculateGPA(grades) {
  if (grades.length === 0) return 0;
  const totalGPA = grades.reduce((sum, grade) => sum + grade.gpa, 0);
  return (totalGPA / grades.length).toFixed(2);
}

function isUniversityEligible(grades) {
  // Need at least 6 credits (A1-C6) including core subjects
  const credits = grades.filter((g) => g.credit).length;
  return credits >= 6;
}

module.exports = {
  calculateGrade,
  calculateGPA,
  isUniversityEligible,
  WAEC_SCALE,
};
```

### 8.2 Ghana Regions Dropdown

```javascript
const GHANA_REGIONS = [
  "Greater Accra",
  "Ashanti",
  "Western",
  "Eastern",
  "Central",
  "Volta",
  "Northern",
  "Upper East",
  "Upper West",
  "Brong-Ahafo",
  "Savannah",
  "Bono East",
  "Ahafo",
  "Western North",
  "North East",
  "Oti",
];

// Render in forms
function renderRegionDropdown(selectElement) {
  selectElement.innerHTML = GHANA_REGIONS.map(
    (region) => `<option value="${region}">${region}</option>`,
  ).join("");
}
```

### 8.3 SMS Integration (Hubtel - Ghana)

```javascript
// File: backend/src/services/sms.service.js

const axios = require("axios");

class SMSService {
  constructor() {
    this.apiKey = process.env.HUBTEL_API_KEY;
    this.apiSecret = process.env.HUBTEL_API_SECRET;
    this.senderId = process.env.HUBTEL_SENDER_ID || "SchoolSMS";
    this.baseURL = "https://smsc.hubtel.com/v1/messages/send";
  }

  async sendSMS(phone, message) {
    try {
      // Format Ghana phone number
      const formattedPhone = this.formatGhanaPhone(phone);

      const response = await axios.get(this.baseURL, {
        params: {
          clientsecret: this.apiSecret,
          clientid: this.apiKey,
          from: this.senderId,
          to: formattedPhone,
          content: message,
        },
      });

      return {
        success: true,
        messageId: response.data.MessageId,
      };
    } catch (error) {
      console.error("SMS Error:", error);
      return { success: false, error: error.message };
    }
  }

  formatGhanaPhone(phone) {
    // Convert to international format
    let formatted = phone.replace(/\s/g, "");

    if (formatted.startsWith("0")) {
      formatted = "233" + formatted.substring(1);
    }

    if (!formatted.startsWith("233")) {
      formatted = "233" + formatted;
    }

    return formatted;
  }

  // Send attendance notification to parent
  async sendAttendanceAlert(student, status, date) {
    const message = `${student.name} was marked ${status} on ${date}. - ${student.institution_name}`;
    return this.sendSMS(student.parent_phone, message);
  }

  // Send grade notification
  async sendGradeNotification(student, subject, grade) {
    const message = `${student.name} scored ${grade} in ${subject}. View full report at [link]. - ${student.institution_name}`;
    return this.sendSMS(student.parent_phone, message);
  }
}

module.exports = new SMSService();
```

---

## 9. Security Implementation

### 9.1 Super Admin Elevated Access (🔴)

#### Backend Implementation

```javascript
// File: backend/src/services/elevatedAccess.service.js

const crypto = require("crypto");
const { ElevatedAccessToken } = require("../models");

class ElevatedAccessService {
  // Generate access token (master PIN method)
  async generateAccessToken(userId, pin) {
    // Verify PIN (stored in user record or separate table)
    const user = await User.findByPk(userId);

    if (!user || !user.master_pin) {
      throw new Error("Master PIN not set");
    }

    const isValid = await bcrypt.compare(pin, user.master_pin);

    if (!isValid) {
      throw new Error("Invalid PIN");
    }

    // Generate token (valid for 15 minutes)
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await ElevatedAccessToken.create({
      user_id: userId,
      token,
      expires_at: expiresAt,
      used: false,
    });

    return token;
  }

  // Verify access token
  async verifyAccessToken(userId, token) {
    const record = await ElevatedAccessToken.findOne({
      where: {
        user_id: userId,
        token,
        used: false,
        expires_at: { [Op.gt]: new Date() },
      },
    });

    if (!record) {
      return false;
    }

    // Mark as used (one-time use)
    await record.update({ used: true });

    return true;
  }

  // Generate 2FA code
  async generate2FACode(userId) {
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Store in cache (Redis) or database with 5-minute expiry
    await this.store2FACode(userId, code);

    // Send via SMS/Email
    const user = await User.findByPk(userId);
    await smsService.sendSMS(user.phone, `Your verification code is: ${code}`);

    return true;
  }
}

module.exports = new ElevatedAccessService();
```

#### Frontend Implementation

```javascript
// File: frontend/src/components/ElevatedAccessModal.jsx

import React, { useState } from "react";

function ElevatedAccessModal({ onSuccess, onCancel }) {
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/superadmin/verify-access", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getToken()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ pin }),
      });

      if (response.ok) {
        const { accessToken } = await response.json();
        onSuccess(accessToken);
      } else {
        setError("Invalid PIN. Please try again.");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal elevated-access">
        <div className="modal-header">
          <h2>🔐 Elevated Access Required</h2>
          <p>This page requires additional authentication</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Master PIN</label>
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="Enter your master PIN"
              maxLength="6"
              required
            />
          </div>

          {error && <div className="error">{error}</div>}

          <div className="modal-actions">
            <button type="submit" disabled={loading}>
              {loading ? "Verifying..." : "Verify"}
            </button>
            <button type="button" onClick={onCancel}>
              Cancel
            </button>
          </div>
        </form>

        <div className="help-text">
          Need help? Contact your system administrator.
        </div>
      </div>
    </div>
  );
}

export default ElevatedAccessModal;
```

### 9.2 Data Encryption

```javascript
// File: backend/src/utils/encryption.js

const crypto = require("crypto");

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY; // 32 bytes
const IV_LENGTH = 16;

function encrypt(text) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(
    "aes-256-cbc",
    Buffer.from(ENCRYPTION_KEY),
    iv,
  );
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString("hex") + ":" + encrypted.toString("hex");
}

function decrypt(text) {
  const parts = text.split(":");
  const iv = Buffer.from(parts.shift(), "hex");
  const encryptedText = Buffer.from(parts.join(":"), "hex");
  const decipher = crypto.createDecipheriv(
    "aes-256-cbc",
    Buffer.from(ENCRYPTION_KEY),
    iv,
  );
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

module.exports = { encrypt, decrypt };
```

### 9.3 Rate Limiting

```javascript
// File: backend/src/middleware/rateLimit.middleware.js

const rateLimit = require("express-rate-limit");

// General API rate limit
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: "Too many requests, please try again later",
});

// Login rate limit (stricter)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 login attempts
  message: "Too many login attempts, please try again later",
});

// Super admin restricted actions
const restrictedLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: "Rate limit exceeded for sensitive operations",
});

module.exports = { apiLimiter, loginLimiter, restrictedLimiter };
```

---

## 10. Testing Strategy

### 10.1 Unit Tests

```javascript
// File: backend/tests/unit/grading.test.js

const { calculateGrade, calculateGPA } = require("../../src/utils/grading");

describe("WAEC Grading System", () => {
  test("should return A1 for score 85", () => {
    const grade = calculateGrade(85);
    expect(grade.grade).toBe("A1");
    expect(grade.interpretation).toBe("Excellent");
    expect(grade.credit).toBe(true);
  });

  test("should return F9 for score 25", () => {
    const grade = calculateGrade(25);
    expect(grade.grade).toBe("F9");
    expect(grade.credit).toBe(false);
  });

  test("should calculate GPA correctly", () => {
    const grades = [{ gpa: 4.0 }, { gpa: 3.5 }, { gpa: 3.0 }];
    const gpa = calculateGPA(grades);
    expect(gpa).toBe("3.50");
  });
});
```

### 10.2 Integration Tests

```javascript
// File: backend/tests/integration/auth.test.js

const request = require("supertest");
const app = require("../../src/app");

describe("Authentication", () => {
  test("POST /api/auth/login - should login successfully", async () => {
    const response = await request(app).post("/api/auth/login").send({
      email: "admin@achimota.edu.gh",
      password: "password",
    });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("token");
    expect(response.body).toHaveProperty("user");
  });

  test("POST /api/auth/login - should fail with invalid credentials", async () => {
    const response = await request(app).post("/api/auth/login").send({
      email: "admin@achimota.edu.gh",
      password: "wrongpassword",
    });

    expect(response.status).toBe(401);
  });
});
```

### 10.3 End-to-End Tests (Cypress)

```javascript
// File: frontend/cypress/e2e/admin/students.cy.js

describe("Students Management", () => {
  beforeEach(() => {
    // Login as admin
    cy.login("admin@achimota.edu.gh", "password");
    cy.visit("/admin/students");
  });

  it("should display students list", () => {
    cy.get(".students-table tbody tr").should("have.length.at.least", 1);
  });

  it("should add new student", () => {
    cy.get("#addStudentBtn").click();
    cy.get("#addStudentModal").should("be.visible");

    cy.get('input[name="first_name"]').type("Kofi");
    cy.get('input[name="last_name"]').type("Mensah");
    cy.get('input[name="email"]').type("kofi.mensah@example.com");
    cy.get('select[name="gender"]').select("Male");
    cy.get('select[name="class_id"]').select("SHS 1A");

    cy.get("#addStudentForm").submit();

    cy.contains("Student added successfully").should("be.visible");
  });

  it("should search students", () => {
    cy.get("#searchStudent").type("Kofi");
    cy.get(".students-table tbody tr").should("contain", "Kofi");
  });
});
```

---

## 11. Deployment Guide

### 11.1 Server Requirements

```yaml
Production Server Specifications:
  OS: Ubuntu 22.04 LTS or higher
  CPU: 4+ cores
  RAM: 8GB minimum, 16GB recommended
  Storage: 100GB SSD minimum

Software Stack:
  - Node.js 18+ (if using MERN)
  - MySQL 8.0
  - Nginx (reverse proxy & static files)
  - PM2 (process manager)
  - SSL Certificate (Let's Encrypt)
```

### 11.2 Deployment Steps

#### Step 1: Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install MySQL
sudo apt install mysql-server -y
sudo mysql_secure_installation

# Install Nginx
sudo apt install nginx -y

# Install PM2
sudo npm install -g pm2
```

#### Step 2: Database Setup

```bash
# Create database
sudo mysql -u root -p

CREATE DATABASE ghana_shs_lms;
CREATE USER 'lms_user'@'localhost' IDENTIFIED BY 'strong_password';
GRANT ALL PRIVILEGES ON ghana_shs_lms.* TO 'lms_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;

# Import schema
mysql -u lms_user -p ghana_shs_lms < /path/to/lms.sql
```

#### Step 3: Deploy Backend

```bash
# Clone repository
cd /var/www
git clone https://github.com/your-repo/ghana-shs-lms.git
cd ghana-shs-lms/backend

# Install dependencies
npm install --production

# Create .env file
cat > .env << EOF
NODE_ENV=production
PORT=5000
DB_HOST=localhost
DB_USER=lms_user
DB_PASSWORD=strong_password
DB_NAME=ghana_shs_lms
JWT_SECRET=$(openssl rand -base64 32)
ENCRYPTION_KEY=$(openssl rand -hex 32)
EOF

# Start with PM2
pm2 start src/app.js --name lms-api
pm2 save
pm2 startup
```

#### Step 4: Deploy Frontend

```bash
cd /var/www/ghana-shs-lms/frontend

# Build production files
npm run build

# Copy to Nginx directory
sudo cp -r dist/* /var/www/html/lms/
```

#### Step 5: Configure Nginx

```nginx
# File: /etc/nginx/sites-available/lms

server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Frontend
    location / {
        root /var/www/html/lms;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/lms /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Setup SSL
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### 11.3 Environment Variables

```bash
# Backend .env
NODE_ENV=production
PORT=5000

# Database
DB_HOST=localhost
DB_USER=lms_user
DB_PASSWORD=your_secure_password
DB_NAME=ghana_shs_lms

# JWT
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=24h

# Encryption
ENCRYPTION_KEY=your_32_byte_encryption_key

# Email (SendGrid)
SENDGRID_API_KEY=your_sendgrid_api_key
EMAIL_FROM=noreply@yourdomain.com

# SMS (Hubtel)
HUBTEL_API_KEY=your_hubtel_api_key
HUBTEL_API_SECRET=your_hubtel_api_secret
HUBTEL_SENDER_ID=YourSchool

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_DIR=/var/www/uploads

# URLs
FRONTEND_URL=https://yourdomain.com
BACKEND_URL=https://yourdomain.com/api
```

### 11.4 Backup Strategy

```bash
# Create backup script
# File: /root/backup-lms.sh

#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/root/backups"

# Database backup
mysqldump -u lms_user -p'password' ghana_shs_lms > $BACKUP_DIR/db_$DATE.sql

# Files backup
tar -czf $BACKUP_DIR/files_$DATE.tar.gz /var/www/uploads

# Keep only last 30 days
find $BACKUP_DIR -name "*.sql" -mtime +30 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete

# Add to crontab (daily at 2 AM)
# crontab -e
# 0 2 * * * /root/backup-lms.sh
```

---

## 12. Maintenance & Updates

### 12.1 Monitoring

```bash
# Install monitoring tools
npm install -g pm2-logrotate
pm2 install pm2-logrotate

# View logs
pm2 logs lms-api
pm2 monit

# Setup error tracking (Sentry)
npm install @sentry/node
```

### 12.2 Database Maintenance

```sql
-- Optimize tables monthly
OPTIMIZE TABLE students;
OPTIMIZE TABLE attendance;
OPTIMIZE TABLE results;

-- Clean old login activity (keep 90 days)
DELETE FROM login_activity WHERE created_at < DATE_SUB(NOW(), INTERVAL 90 DAY);

-- Clean old notifications (keep 30 days)
DELETE FROM notifications WHERE created_at < DATE_SUB(NOW(), INTERVAL 30 DAY) AND is_read = 1;
```

### 12.3 Update Procedure

```bash
# Pull latest code
cd /var/www/ghana-shs-lms
git pull origin main

# Update backend
cd backend
npm install
pm2 restart lms-api

# Update frontend
cd ../frontend
npm run build
sudo cp -r dist/* /var/www/html/lms/

# Run database migrations if any
npm run migrate
```

---

## 13. Quick Reference

### 13.1 Default Credentials (Change Immediately!)

```
Super Admin:
  Email: superadmin@platform.com
  Password: SuperAdmin@2026

Admin (Sample School):
  Email: admin@achimota.edu.gh
  Password: Admin@2026

Teacher (Sample):
  Email: teacher@achimota.edu.gh
  Password: Teacher@2026
```

### 13.2 Common Commands

```bash
# Backend
npm run dev          # Start development server
npm run test         # Run tests
npm run migrate      # Run migrations
npm run seed         # Seed database

# Frontend
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build

# PM2
pm2 status           # Check status
pm2 restart lms-api  # Restart API
pm2 logs lms-api     # View logs
pm2 monit            # Monitor resources
```

### 13.3 Troubleshooting

| Issue                      | Solution                                           |
| -------------------------- | -------------------------------------------------- |
| Cannot connect to database | Check MySQL service: `sudo systemctl status mysql` |
| JWT token invalid          | Check JWT_SECRET in .env matches                   |
| File upload fails          | Check permissions on upload directory              |
| 502 Bad Gateway            | Check if API is running: `pm2 status`              |
| CORS errors                | Check CORS settings in backend config              |

---

## Document History

| Version | Date          | Changes                      | Author |
| ------- | ------------- | ---------------------------- | ------ |
| 1.0     | March 2, 2026 | Initial implementation guide | System |

---

**Next Steps:**

1. ✅ Review this implementation guide
2. ⏳ Set up development environment
3. ⏳ Import and configure database
4. ⏳ Start with Phase 1 (Core pages)
5. ⏳ Implement authentication
6. ⏳ Build out role-specific dashboards
7. ⏳ Test and deploy

**End of Implementation Guide**
