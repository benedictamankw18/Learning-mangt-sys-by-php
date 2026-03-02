# Ghana Senior High School LMS - Page Specifications by User Role

**Document Version:** 1.0  
**Last Updated:** March 2, 2026  
**Database Reference:** lms (1).sql

---

## Table of Contents

1. [Super Admin Pages](#1-super-admin-pages)
2. [Admin Pages](#2-admin-institution-administrator-pages)
3. [Teacher Pages](#3-teacher-pages)
4. [Student Pages](#4-student-pages)
5. [Parent/Guardian Pages](#5-parentguardian-pages)
6. [Common Pages (All Roles)](#6-common-pages-all-roles)
7. [Database Entities Reference](#7-database-entities-reference)

---

## 1. Super Admin Pages

**Role:** Platform Super Administrator - Manages multiple institutions across the platform  
**Permissions:** Full system access, manage all institutions, subscriptions, platform-wide settings

### ⚠️ Security Tiers

Super Admin pages are divided into two security tiers:

**🟢 Standard Access (All Super Admins)**

- Overview Dashboard
- Institutions Management
- Subscriptions & Billing
- Reports & Analytics
- Activity Logs
- My Profile

**🔴 Restricted Access (Requires Elevated Permissions)**

The following pages require additional authentication or special permissions:

1. **Platform Users** (#1.4) - Manage super admin accounts
2. **System Settings** (#1.5) - Platform-wide configuration
3. **API Management** (#1.8) - Manage API access and integrations
4. **Messages/Announcements** (#1.9) - Platform-wide communication

**Restriction Method Options:**

- Master admin code/PIN entry
- Two-factor authentication challenge
- Separate "Master Admin" role with elevated privileges
- Time-based access tokens
- IP whitelist for critical operations

### Dashboard Pages

#### 1.1 Overview Dashboard

- **Purpose:** Platform-wide statistics and health monitoring
- **Key Metrics:**
  - Total institutions on platform
  - Total users (breakdown by role)
  - Active subscriptions
  - System health indicators
  - Recent institution registrations
  - Platform usage statistics
- **Database Tables:** institutions, users, user_roles, system_settings

#### 1.2 Institutions Management

- **Purpose:** Manage all schools on the platform
- **Features:**
  - List all institutions (search, filter, sort)
  - Create new institution
  - Edit institution details
  - View institution profile (students, teachers, capacity)
  - Activate/deactivate institutions
  - Assign institution administrators
  - Monitor institution activity
- **Database Tables:** institutions, users, academic_years, classes

#### 1.3 Subscriptions & Billing

- **Purpose:** Manage institution subscriptions and payments
- **Features:**
  - Subscription plans management
  - View active/expired subscriptions
  - Payment history
  - Invoice generation
  - Subscription renewal
  - Usage limits and quotas
  - Billing alerts
- **Database Tables:** institution_settings (related fields needed)

#### 1.4 Platform Users 🔴 RESTRICTED ACCESS

- **Purpose:** Manage super admin accounts
- **Security Level:** Requires elevated permissions/authentication
- **Restriction Reason:** Prevents unauthorized creation/modification of super admin accounts
- **Features:**
  - List all super admins
  - Create/edit super admin accounts
  - Role and permission management
  - Access control
  - User activity monitoring
- **Database Tables:** users, roles, user_roles, permissions, role_permissions

#### 1.5 System Settings 🔴 RESTRICTED ACCESS

- **Purpose:** Platform-wide configuration
- **Security Level:** Requires elevated permissions/authentication
- **Restriction Reason:** Critical system settings that affect all institutions
- **Features:**
  - General settings (platform name, logo, contact)
  - Email/SMS gateway configuration
  - Default academic year settings
  - Ghana Education Service integration
  - System maintenance mode
  - Backup and restore
  - Database management
- **Database Tables:** system_settings, institution_settings

#### 1.6 Reports & Analytics

- **Purpose:** Platform-wide reporting
- **Features:**
  - Institution performance reports
  - User growth analytics
  - System usage reports
  - Revenue reports
  - Subscription analytics
  - Export to PDF/Excel
- **Database Tables:** All tables (aggregated data)

#### 1.7 Activity Logs

- **Purpose:** Monitor all system activities
- **Features:**
  - User login activity (all institutions)
  - Error logs
  - System activity logs
  - Security events
  - Filter by institution, user, date
- **Database Tables:** login_activity, error_logs, user_activity

#### 1.8 API Management 🔴 RESTRICTED ACCESS

- **Purpose:** Manage API access and integrations
- **Security Level:** Requires elevated permissions/authentication
- **Restriction Reason:** API keys and integrations can compromise entire platform security
- **Features:**
  - API keys management
  - Third-party integrations
  - Webhook configurations
  - API usage monitoring
  - Rate limiting
- **Database Tables:** system_settings (API-related fields)

#### 1.9 Messages/Announcements 🔴 RESTRICTED ACCESS

- **Purpose:** Platform-wide communication
- **Security Level:** Requires elevated permissions/authentication
- **Restriction Reason:** Prevents platform-wide spam and unauthorized mass communications to all institutions
- **Features:**
  - Send announcements to all institutions
  - Broadcast messages
  - News updates
  - System notifications
- **Database Tables:** announcements, notifications

#### 1.10 My Profile

- **Purpose:** Super admin personal settings
- **Features:**
  - Personal information
  - Password change
  - Two-factor authentication
  - Session management
  - Activity history
- **Database Tables:** users, login_activity, user_activity

---

## 2. Admin (Institution Administrator) Pages

**Role:** Institution Administrator - Manages a single school  
**Permissions:** Manage users, courses, attendance, reports (within institution)

### Dashboard Pages

#### 2.1 Dashboard Overview

- **Purpose:** School-wide overview and quick stats
- **Key Metrics:**
  - Total students, teachers, parents
  - Active classes and subjects
  - Attendance rate (today, this week, this month)
  - Upcoming exams/assessments
  - Recent activities
  - Pending tasks (submissions, approvals)
- **Database Tables:** students, teachers, classes, attendance, assessments

#### 2.2 Students Management

- **Purpose:** Manage all student records
- **Features:**
  - Student list (search, filter by class/program/year)
  - Add new student (single/bulk upload)
  - Edit student profile
  - Student details (personal info, parent info, academic history)
  - Student enrollment status
  - Transfer/withdraw students
  - Generate student ID cards
  - Import/export student data
- **Database Tables:** students, users, classes, programs, grade_levels, parent_students

#### 2.3 Teachers Management

- **Purpose:** Manage teaching staff
- **Features:**
  - Teacher list (search, filter by department/subject)
  - Add new teacher
  - Edit teacher profile
  - Assign subjects to teachers
  - View teacher schedule
  - Teacher performance metrics
  - Import/export teacher data
- **Database Tables:** teachers, users, subjects, teacher_subjects, class_subjects

#### 2.4 Classes & Programs

- **Purpose:** Manage academic programs and class structure
- **Features:**
  - Programs list (General Science, General Arts, Business, etc.)
  - Class list (SHS 1A, SHS 1B, etc.)
  - Create/edit classes
  - Assign class teachers
  - Student enrollment to classes
  - Class capacity management
  - Program-specific settings
- **Database Tables:** classes, programs, grade_levels, students, teachers

#### 2.5 Subjects Management

- **Purpose:** Manage subject offerings
- **Features:**
  - Subject list (core and elective subjects)
  - Create/edit subjects
  - Subject codes (Ghana syllabus codes)
  - Assign subjects to classes
  - Assign teachers to subjects
  - Subject schedules
- **Database Tables:** subjects, class_subjects, teacher_subjects

#### 2.6 Attendance Management

- **Purpose:** Monitor and manage student attendance
- **Features:**
  - Daily attendance overview
  - Attendance by class
  - Attendance statistics
  - Absent students report
  - Late arrivals tracking
  - Attendance trends
  - Parent notifications for absences
  - Export attendance reports
- **Database Tables:** attendance, students, classes, notifications

#### 2.7 Grades & Assessments

- **Purpose:** Grade scales and assessment configuration
- **Features:**
  - Ghana WAEC grading scale (A1-F9)
  - Grade scale management
  - Assessment categories (Class Test, Mid-term, End-of-term,Classwork)
  - Assessment scheduling
  - Grade reports overview
  - WASSCE preparation tracking
  - Publish/unpublish grades
- **Database Tables:** grade_scales, assessment_categories, assessments, results, grade_reports

#### 2.8 Reports & Analytics

- **Purpose:** Comprehensive school reports
- **Features:**
  - Academic performance reports
  - Attendance summary reports
  - Student progress reports
  - WASSCE preparation reports
  - Class performance analytics
  - Teacher statistics
  - Semester reports
  - Export to PDF/Excel
  - Scheduled automated reports
- **Database Tables:** All tables (aggregated data)

#### 2.9 Timetable/Schedule

- **Purpose:** Manage school timetable
- **Features:**
  - Semester timetable by class
  - Weekly timetable by class
  - Teacher schedules
  - Room allocation
  - Period management
  - Exam timetable
  - Calendar view
  - Publish timetable
- **Database Tables:** course_schedules, classes, subjects, teachers

#### 2.10 Exams Management

- **Purpose:** Organize examinations
- **Features:**
  - Exam scheduling
  - Exam timetable creation
  - Invigilation assignments
  - Exam halls allocation
  - WASSCE mock exams
  - Internal assessments
- **Database Tables:** assessments, quizzes, course_schedules

#### 2.11 Events & Announcements

- **Purpose:** School events and communication
- **Features:**
  - Create announcements
  - School calendar/events
  - Target audience (students, teachers, parents, all)
  - Event management (sports day, speech day, etc.)
  - Notice board
- **Database Tables:** events, announcements, notifications

#### 2.12 Messages/Communication

- **Purpose:** Internal messaging system
- **Features:**
  - Inbox/sent messages
  - Compose messages
  - Send to individuals/groups
  - Bulk SMS/Email
  - Parent communication
  - Read receipts
- **Database Tables:** messages, notifications

#### 2.15 Institution Settings

- **Purpose:** School-specific configuration
- **Features:**
  - School information (name, logo, contact)
  - Academic year settings
  - Semester dates
  - School calendar
  - Notification preferences
  - Integration settings (SMS gateway, email)
- **Database Tables:** institutions, institution_settings, academic_years, semesters

#### 2.16 Users & Roles

- **Purpose:** User management and permissions
- **Features:**
  - User list (all roles)
  - Create admin users
  - Role management
  - Permission settings
  - Security settings (2FA, password policies)
  - Session management
- **Database Tables:** users, roles, user_roles, permissions, role_permissions

#### 2.17 System Logs

- **Purpose:** Activity monitoring
- **Features:**
  - Login activity
  - User activity logs
  - System errors
  - Audit trail
- **Database Tables:** login_activity, user_activity, error_logs

#### 2.18 My Profile

- **Purpose:** Admin personal settings
- **Features:**
  - Personal information
  - Password change
  - Two-factor authentication
  - Session management
  - Activity history
  - Notification preferences
- **Database Tables:** users, login_activity, user_activity

---

## 3. Teacher Pages

**Role:** Teacher/Instructor  
**Permissions:** Manage courses, assessments, attendance (for assigned classes)

### Dashboard Pages

#### 3.1 Dashboard Overview

- **Purpose:** Teacher's daily overview
- **Key Metrics:**
  - Today's classes
  - Pending assignments to grade
  - Attendance summary
  - Upcoming assessments
  - Student submissions
  - Quick actions
- **Database Tables:** classes, assignments, attendance, assessments, assignment_submissions

#### 3.2 My Classes

- **Purpose:** View assigned classes
- **Features:**
  - List of classes teaching
  - Class rosters
  - Student list per class
  - Class performance overview
  - Class attendance
- **Database Tables:** classes, class_subjects, teacher_subjects, students

#### 3.3 My Subjects

- **Purpose:** Manage assigned subjects
- **Features:**
  - Subject list
  - Subject materials/resources
  - Syllabus/curriculum
  - Learning objectives
  - Subject schedule
- **Database Tables:** subjects, teacher_subjects, class_subjects

#### 3.4 Students

- **Purpose:** View student information
- **Features:**
  - Student profiles (in teacher's classes)
  - Student performance tracking
  - Contact information
  - Attendance records
  - Grade history
- **Database Tables:** students, classes, results, attendance

#### 3.5 Attendance

- **Purpose:** Mark and manage attendance
- **Features:**
  - Take daily attendance
  - View attendance history
  - Attendance statistics per class
  - Mark absent/present/late/excused
  - Bulk attendance marking
  - Export attendance
- **Database Tables:** attendance, students, classes, class_subjects

#### 3.6 Assignments

- **Purpose:** Create and manage assignments
- **Features:**
  - Create new assignment
  - Assignment list
  - Set due dates
  - Upload instructions/materials
  - View submissions
  - Grade submissions
  - Provide feedback
  - Download submissions
  - Plagiarism check (optional)
- **Database Tables:** assignments, assignment_submissions, course_materials

#### 3.7 Assessments & Grading

- **Purpose:** Create assessments and enter grades
- **Features:**
  - Create assessments (class tests, exams)
  - Assessment schedule
  - Grade entry (Ghana WAEC scale: A1-F9)
  - Continuous assessment tracking
  - Grade calculations
  - Grade publishing
  - Assessment analytics
  - Grade reports generation
- **Database Tables:** assessments, assessment_categories, assessment_submissions, results, grade_scales

#### 3.8 Quizzes

- **Purpose:** Create and manage online quizzes
- **Features:**
  - Create quiz
  - Question bank
  - Multiple choice/True-False/Essay questions
  - Time limits
  - Auto-grading
  - Quiz results
  - Analytics
- **Database Tables:** quizzes, quiz_questions, quiz_question_options, quiz_submissions, quiz_submission_answers

#### 3.9 Course Materials/Resources

- **Purpose:** Upload and share learning materials
- **Features:**
  - Upload files (PDF, Word, PowerPoint, etc.)
  - Organize by topics/units
  - Share with students
  - Video links
  - External resources
  - Download tracking
- **Database Tables:** course_materials, course_content

#### 3.10 Lesson Plans

- **Purpose:** Manage lesson planning
- **Features:**
  - Create lesson plans
  - Weekly plans
  - Learning objectives
  - Activities
  - Resources needed
  - Notes
- **Database Tables:** course_content, course_content_order

#### 3.11 Schedule/Timetable

- **Purpose:** View teaching schedule
- **Features:**
  - Teacher semester timetable
  - Weekly timetable
  - Daily schedule
  - Class periods
  - Room assignments
  - Calendar view
  - Upcoming classes
  - Export to PDF
- **Database Tables:** course_schedules, classes, subjects

#### 3.12 Grade Reports

- **Purpose:** Generate student reports
- **Features:**
  - Individual student reports
  - Class performance reports
  - Subject analysis
  - Progress tracking
  - Export to PDF
- **Database Tables:** grade_reports, grade_report_details, results

#### 3.13 Messages

- **Purpose:** Communication with students and parents
- **Features:**
  - Inbox/sent messages
  - Compose messages
  - Message students
  - Message parents
  - Message admin
  - Class announcements
- **Database Tables:** messages, notifications

#### 3.14 Announcements

- **Purpose:** Class announcements
- **Features:**
  - Post class announcements
  - View school announcements
  - Target specific classes
- **Database Tables:** announcements, notifications

#### 3.15 Performance Analytics

- **Purpose:** Analyze student performance
- **Features:**
  - Class performance trends
  - Subject analytics
  - Student progress charts
  - Comparative analysis
  - Weak areas identification
- **Database Tables:** results, assessments, grade_reports

#### 3.16 My Profile

- **Purpose:** Teacher personal settings
- **Features:**
  - Personal information
  - Professional details (qualifications, subjects)
  - Password change
  - Profile photo
  - Contact information
  - Notification preferences
- **Database Tables:** teachers, users, teacher_subjects

---

## 4. Student Pages

**Role:** Student  
**Permissions:** View courses, submit assignments, view grades

### Dashboard Pages

#### 4.1 Dashboard Overview

- **Purpose:** Student's personalized dashboard
- **Key Metrics:**
  - Today's classes
  - Pending assignments
  - Recent grades
  - Upcoming assessments
  - Attendance summary
  - Announcements
- **Database Tables:** classes, assignments, assessments, results, attendance

#### 4.2 My Classes

- **Purpose:** View enrolled classes
- **Features:**
  - List of enrolled subjects
  - Class details
  - Teachers information
  - Class schedule
  - Classmates
  - Subject progress
- **Database Tables:** class_subjects, classes, subjects, teachers, students

#### 4.3 My Subjects

- **Purpose:** Subject-specific content
- **Features:**
  - Subject overview
  - Learning materials
  - Course content/modules
  - Subject teachers
  - Subject schedule
  - Performance in subject
- **Database Tables:** subjects, class_subjects, course_content, course_materials

#### 4.4 Assignments

- **Purpose:** View and submit assignments
- **Features:**
  - Assignment list (pending, submitted, graded)
  - View assignment details
  - Submit assignment
  - Upload files
  - View grades and feedback
  - Assignment deadlines
  - Submission status
- **Database Tables:** assignments, assignment_submissions

#### 4.5 Assessments & Quizzes

- **Purpose:** Take assessments and quizzes
- **Features:**
  - Upcoming assessments
  - Take online quiz
  - View quiz results
  - Assessment schedule
  - Past assessments
- **Database Tables:** assessments, quizzes, quiz_submissions, quiz_submission_answers

#### 4.6 My Grades

- **Purpose:** View academic performance
- **Features:**
  - Current grades by subject
  - Grade history
  - Ghana WAEC scale (A1-F9)
  - Average (if applicable)
  - Semester reports
  - Progress tracking
  - Grade breakdown (CA, exams)
  - Download report cards
- **Database Tables:** results, assessments, grade_reports, grade_report_details, grade_scales

#### 4.7 Attendance

- **Purpose:** View attendance records
- **Features:**
  - Overall attendance percentage
  - Attendance by subject
  - Present/Absent/Late records
  - Attendance trends
  - Excused absences
- **Database Tables:** attendance, class_subjects

#### 4.8 Course Materials

- **Purpose:** Access learning resources
- **Features:**
  - View/download materials
  - Notes and handouts
  - Video lessons
  - Reference materials
  - Organized by subject/topic
- **Database Tables:** course_materials, course_content

#### 4.9 Schedule/Timetable

- **Purpose:** View class schedule
- **Features:**
  - Semester timetable
  - Weekly timetable
  - Daily schedule
  - Exam timetable
  - Calendar view
  - Class reminders
- **Database Tables:** course_schedules, classes, subjects

#### 4.10 Exams

- **Purpose:** Exam information
- **Features:**
  - Upcoming exams
  - Exam timetable
  - Exam venues
  - Results
  - WASSCE preparation materials
- **Database Tables:** assessments, results

#### 4.11 Messages

- **Purpose:** Communication
- **Features:**
  - Inbox/sent messages
  - Message teachers
  - Reply to messages
  - Class group messages
- **Database Tables:** messages, notifications

#### 4.12 Announcements

- **Purpose:** View announcements
- **Features:**
  - School announcements
  - Class announcements
  - Subject announcements
  - Events and news
- **Database Tables:** announcements, events

#### 4.15 My Profile

- **Purpose:** Student personal settings
- **Features:**
  - Personal information
  - Student ID details
  - Program and class info
  - Password change
  - Profile photo
  - Contact information
  - Parent/guardian details
  - Emergency contacts
- **Database Tables:** students, users, parents, parent_students, classes

---

## 5. Parent/Guardian Pages

**Role:** Parent/Guardian  
**Permissions:** View student data (for linked students only)

### Dashboard Pages

#### 5.1 Dashboard Overview

- **Purpose:** Parent's overview for ward(s)
- **Key Metrics:**
  - Student(s) information
  - Recent grades
  - Attendance summary
  - Upcoming events
  - Fee status (if applicable)
  - Recent announcements
- **Database Tables:** students, parent_students, results, attendance

#### 5.2 My Children/Wards

- **Purpose:** View linked students
- **Features:**
  - List of children/wards
  - Switch between multiple students
  - Student profile overview
  - Academic performance
  - Current class/program
- **Database Tables:** students, parent_students, classes, programs

#### 5.3 Academic Performance

- **Purpose:** Monitor student grades
- **Features:**
  - Current grades by subject
  - Grade trends
  - Report cards
  - Semester reports
  - Subject performance
  - Progress tracking
  - Comparison with class average
  - Download reports
- **Database Tables:** results, grade_reports, grade_report_details, assessments

#### 5.4 Attendance

- **Purpose:** Monitor student attendance
- **Features:**
  - Overall attendance percentage
  - Attendance by subject
  - Attendance calendar
  - Absence notifications
  - Late arrivals
  - Trends and patterns
- **Database Tables:** attendance, classes

#### 5.5 Assignments & Assessments

- **Purpose:** Track student work
- **Features:**
  - Pending assignments
  - Submitted assignments
  - Grades on assignments
  - Upcoming assessments
  - Assessment results
- **Database Tables:** assignments, assignment_submissions, assessments, assessment_submissions

#### 5.6 Schedule/Timetable

- **Purpose:** View student schedule
- **Features:**
  - Semester timetable
  - Weekly timetable
  - Daily classes
  - Exam timetable
  - Calendar view
- **Database Tables:** course_schedules, classes, subjects

#### 5.7 Teachers

- **Purpose:** View teachers information
- **Features:**
  - List of student's teachers
  - Teacher profiles
  - Subject teachers
  - Contact information
  - Class teachers
- **Database Tables:** teachers, class_subjects, teacher_subjects

#### 5.9 Messages

- **Purpose:** Communication with school
- **Features:**
  - Inbox/sent messages
  - Message teachers
  - Message class teacher
  - Message school admin
  - Read receipts
- **Database Tables:** messages, notifications

#### 5.10 Announcements & Events

- **Purpose:** Stay informed
- **Features:**
  - School announcements
  - Class announcements
  - School events
  - Important dates
  - Parent-teacher meeting schedules
- **Database Tables:** announcements, events

#### 5.13 My Profile

- **Purpose:** Parent personal settings
- **Features:**
  - Personal information
  - Contact details
  - Password change
  - Notification preferences
  - Emergency contact backup
  - Linked students
- **Database Tables:** parents, users, parent_students

---

## 6. Common Pages (All Roles)

These pages are accessible to all authenticated users with appropriate variations:

### 6.1 Login/Authentication

- Login page
- Forgot password
- Reset password
- Two-factor authentication
- Session management

### 6.2 Notifications Center

- System notifications
- Unread notifications
- Notification history
- Notification preferences
- Mark as read
- **Database Tables:** notifications

### 6.3 Calendar/Events

- School calendar
- Academic calendar
- Personal calendar
- Event creation (role-based)
- Event reminders
- **Database Tables:** events, academic_years, semesters

### 6.4 Help & Support

- FAQs
- User guides
- Video tutorials
- Contact support
- Submit ticket
- Knowledge base

### 6.5 Settings (Personal)

- Account settings
- Privacy settings
- Notification preferences
- Display preferences
- Security settings

---

## 7. Database Entities Reference

### Core Tables and Their Page Usage

| Table Name                 | Super Admin | Admin | Teacher | Student | Parent |
| -------------------------- | ----------- | ----- | ------- | ------- | ------ |
| **academic_years**         | ✓           | ✓     | ✓       | ✓       | ✓      |
| **announcements**          | ✓           | ✓     | ✓       | ✓       | ✓      |
| **assessments**            | ✓           | ✓     | ✓       | ✓       | -      |
| **assessment_categories**  | ✓           | ✓     | ✓       | -       | -      |
| **assessment_submissions** | ✓           | ✓     | ✓       | ✓       | ✓      |
| **assignments**            | ✓           | ✓     | ✓       | ✓       | ✓      |
| **assignment_submissions** | ✓           | ✓     | ✓       | ✓       | ✓      |
| **attendance**             | ✓           | ✓     | ✓       | ✓       | ✓      |
| **classes**                | ✓           | ✓     | ✓       | ✓       | ✓      |
| **class_subjects**         | ✓           | ✓     | ✓       | ✓       | ✓      |
| **course_content**         | ✓           | ✓     | ✓       | ✓       | -      |
| **course_materials**       | ✓           | ✓     | ✓       | ✓       | -      |
| **course_schedules**       | ✓           | ✓     | ✓       | ✓       | ✓      |
| **events**                 | ✓           | ✓     | ✓       | ✓       | ✓      |
| **grade_levels**           | ✓           | ✓     | ✓       | ✓       | ✓      |
| **grade_reports**          | ✓           | ✓     | ✓       | ✓       | ✓      |
| **grade_report_details**   | ✓           | ✓     | ✓       | ✓       | ✓      |
| **grade_scales**           | ✓           | ✓     | ✓       | ✓       | ✓      |
| **institutions**           | ✓           | ✓     | -       | -       | -      |
| **institution_settings**   | ✓           | ✓     | -       | -       | -      |
| **login_activity**         | ✓           | ✓     | ✓       | ✓       | ✓      |
| **messages**               | ✓           | ✓     | ✓       | ✓       | ✓      |
| **notifications**          | ✓           | ✓     | ✓       | ✓       | ✓      |
| **parents**                | ✓           | ✓     | -       | -       | ✓      |
| **parent_students**        | ✓           | ✓     | -       | ✓       | ✓      |
| **permissions**            | ✓           | ✓     | -       | -       | -      |
| **programs**               | ✓           | ✓     | ✓       | ✓       | ✓      |
| **quizzes**                | ✓           | ✓     | ✓       | ✓       | -      |
| **quiz_questions**         | ✓           | ✓     | ✓       | -       | -      |
| **quiz_submissions**       | ✓           | ✓     | ✓       | ✓       | ✓      |
| **results**                | ✓           | ✓     | ✓       | ✓       | ✓      |
| **roles**                  | ✓           | ✓     | -       | -       | -      |
| **role_permissions**       | ✓           | ✓     | -       | -       | -      |
| **semesters**              | ✓           | ✓     | ✓       | ✓       | ✓      |
| **students**               | ✓           | ✓     | ✓       | ✓       | ✓      |
| **subjects**               | ✓           | ✓     | ✓       | ✓       | ✓      |
| **system_settings**        | ✓           | -     | -       | -       | -      |
| **teachers**               | ✓           | ✓     | ✓       | -       | ✓      |
| **teacher_subjects**       | ✓           | ✓     | ✓       | ✓       | ✓      |
| **users**                  | ✓           | ✓     | ✓       | ✓       | ✓      |
| **user_activity**          | ✓           | ✓     | ✓       | ✓       | ✓      |
| **user_roles**             | ✓           | ✓     | -       | -       | -      |

---

## 8. Ghana SHS-Specific Features

### 8.1 Programs (Mandatory)

All Ghana SHS must support these programs:

- **General Science** (GSCI)
- **General Arts** (GART)
- **Business** (BUS)
- **Visual Arts** (VART)
- **Home Economics** (HECO)
- **Agriculture** (AGRI)
- **Technical/Vocational** (TECH)

### 8.2 Grade Levels

- **SHS 1** (Form 1)
- **SHS 2** (Form 2)
- **SHS 3** (Form 3)

### 8.3 Ghana WAEC Grading Scale (A1-F9)

| Grade | Mark Range | Interpretation | University Admission |
| ----- | ---------- | -------------- | -------------------- |
| A1    | 75-100%    | Excellent      | ✓ Pass (Credit)      |
| B2    | 70-74%     | Very Good      | ✓ Pass (Credit)      |
| B3    | 65-69%     | Good           | ✓ Pass (Credit)      |
| C4    | 60-64%     | Credit         | ✓ Pass (Credit)      |
| C5    | 55-59%     | Credit         | ✓ Pass (Credit)      |
| C6    | 50-54%     | Credit         | ✓ Pass (Credit)      |
| D7    | 45-49%     | Pass           | ✗ Not accepted       |
| E8    | 40-44%     | Pass           | ✗ Not accepted       |
| F9    | 0-39%      | Fail           | ✗ Fail               |

### 8.4 Semseter System-based

- **Semseter 1:**
- **Semseter 2:**

### 8.5 Core Subjects (All Programs)

1. English Language
2. Mathematics (Core)
3. Integrated Science
4. Social Studies

### 8.6 Assessment Structure

- **Continuous Assessment (CA):** 30-40%
  - Class Tests
  - Assignments
  - Projects
  - Mid-term Exams
- **End-of-Term Exam:** 60-70%
- **WASSCE Preparation:** Mock exams in SHS 3

### 8.7 Reporting

- **Progress Reports:** Mid-term
- **Terminal Reports:** End of term
- **Annual Reports:** End of academic year
- **WASSCE Preparation Results:** SHS 3 final exams

---

## 9. Implementation Priority

### Phase 1: Core Pages (High Priority)

**All Roles:**

- Dashboard Overview
- My Profile
- Authentication pages

**Admin:**

- Students Management
- Teachers Management
- Classes & Programs
- Subjects Management
- Attendance Management
- Settings

**Teacher:**

- My Classes
- Attendance
- Assignments
- Grading
- Schedule

**Student:**

- My Subjects
- Assignments
- My Grades
- Attendance
- Schedule

**Parent:**

- My Children
- Academic Performance
- Attendance

### Phase 2: Academic Features (Medium Priority)

- Assessments & Grading
- Grade Reports
- Course Materials
- Quizzes
- Exams Management
- Analytics

### Phase 3: Communication & Extras (Lower Priority)

- Messages
- Announcements
- Events
- Library
- Finance/Fees

### Phase 4: Advanced Features

- API Management
- Advanced Analytics
- Third-party Integrations

---

## 10. Technical Notes

### 10.1 Data Access Rules

- **Super Admin:** Can see all institutions
- **Admin:** Can see only their institution
- **Teacher:** Can see only assigned classes/students
- **Student:** Can see only their own data
- **Parent:** Can see only linked children's data

### 10.2 Security Considerations

- Role-based access control (RBAC)
- Two-factor authentication (optional)
- Session management
- Password policies
- Audit trails
- Data encryption

### 10.3 Performance Optimization

- Pagination for large datasets
- Caching frequently accessed data
- Lazy loading
- Efficient database queries
- CDN for static assets

---

## Document History

| Version | Date          | Changes                                          | Author |
| ------- | ------------- | ------------------------------------------------ | ------ |
| 1.0     | March 2, 2026 | Initial specification based on database analysis | System |

---

**End of Document**
