-- =========================================
-- LMS REST API Database Schema
-- MySQL 8.0+ compatible
-- Designed for Senior High Schools (SHS) in Ghana
-- =========================================

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";

-- Drop existing database if needed
-- DROP DATABASE IF EXISTS lms;

-- Create database
DROP DATABASE IF EXISTS lms;

CREATE DATABASE IF NOT EXISTS lms CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- USE lms;

-- =========================================
-- INSTITUTIONS (Multi-Tenancy)
-- =========================================

CREATE TABLE institutions (
    institution_id INT AUTO_INCREMENT PRIMARY KEY,
    institution_code VARCHAR(20) UNIQUE NOT NULL,
    institution_name VARCHAR(200) NOT NULL,
    institution_type VARCHAR(50) DEFAULT 'shs', -- 'shs' (Senior High School), 'jhs', 'primary'
    email VARCHAR(100),
    phone VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100) DEFAULT 'Ghana',
    postal_code VARCHAR(20),
    website VARCHAR(200),
    status VARCHAR(20) DEFAULT 'active', -- active, inactive, suspended
    subscription_plan VARCHAR(50), -- free, basic, premium, enterprise
    subscription_expires_at DATE,
    max_students INT DEFAULT 500,
    max_teachers INT DEFAULT 50,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_institution_code (institution_code),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE institution_settings (
    setting_id INT AUTO_INCREMENT PRIMARY KEY,
    institution_id INT NOT NULL,
    school_name VARCHAR(200), -- Display name (can be different from institution_name)
    motto VARCHAR(300),
    description TEXT,
    vision TEXT,
    mission TEXT,
    logo_url VARCHAR(500),
    banner_url VARCHAR(500),
    theme_primary_color VARCHAR(20) DEFAULT '#1976d2',
    theme_secondary_color VARCHAR(20) DEFAULT '#dc004e',
    timezone VARCHAR(50) DEFAULT 'Africa/Accra',
    academic_year_start_month INT DEFAULT 9, -- September
    academic_year_end_month INT DEFAULT 6, -- June
    grading_system VARCHAR(20) DEFAULT 'percentage', -- percentage, gpa, letter
    locale VARCHAR(10) DEFAULT 'en_US',
    currency VARCHAR(10) DEFAULT 'GHS',
    date_format VARCHAR(20) DEFAULT 'Y-m-d',
    time_format VARCHAR(20) DEFAULT 'H:i:s',
    allow_parent_registration BOOLEAN DEFAULT 1,
    allow_student_self_enrollment BOOLEAN DEFAULT 0,
    require_email_verification BOOLEAN DEFAULT 1,
    custom_css TEXT,
    custom_footer TEXT,
    social_facebook VARCHAR(200),
    social_twitter VARCHAR(200),
    social_instagram VARCHAR(200),
    social_linkedin VARCHAR(200),
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT FK_institution_settings FOREIGN KEY (institution_id) REFERENCES institutions(institution_id) ON DELETE CASCADE,
    UNIQUE KEY unique_institution (institution_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================
-- ROLES & PERMISSIONS
-- =========================================

CREATE TABLE roles (
    role_id INT AUTO_INCREMENT PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE permissions (
    permission_id INT AUTO_INCREMENT PRIMARY KEY,
    permission_name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE role_permissions (
    role_permission_id INT AUTO_INCREMENT PRIMARY KEY,
    role_id INT NOT NULL,
    permission_id INT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT FK_role_permissions_role FOREIGN KEY (role_id) REFERENCES roles(role_id) ON DELETE CASCADE,
    CONSTRAINT FK_role_permissions_permission FOREIGN KEY (permission_id) REFERENCES permissions(permission_id) ON DELETE CASCADE,
    UNIQUE KEY unique_role_permission (role_id, permission_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================
-- USERS
-- =========================================

CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    institution_id INT, -- NULL for super admins who manage all institutions
    username VARCHAR(50) NOT NULL,
    email VARCHAR(100),
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone_number VARCHAR(20),
    address TEXT,
    date_of_birth DATE,
    is_super_admin BOOLEAN DEFAULT 0, -- Platform-level administrator
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL,
    CONSTRAINT FK_users_institution FOREIGN KEY (institution_id) REFERENCES institutions(institution_id) ON DELETE CASCADE,
    UNIQUE KEY unique_username_institution (username, institution_id),
    UNIQUE KEY unique_email_institution (email, institution_id),
    INDEX idx_institution (institution_id),
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_is_super_admin (is_super_admin),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE user_roles (
    user_role_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    role_id INT NOT NULL,
    assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT FK_user_roles_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT FK_user_roles_role FOREIGN KEY (role_id) REFERENCES roles(role_id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_role (user_id, role_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================
-- PASSWORD RESET TOKENS
-- =========================================

CREATE TABLE password_reset_tokens (
    token_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token VARCHAR(100) NOT NULL UNIQUE,
    expiry_date DATETIME NOT NULL,
    is_active BOOLEAN DEFAULT 1 NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    used_at DATETIME NULL,
    ip_address VARCHAR(50),
    user_agent TEXT,
    CONSTRAINT FK_password_reset_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_token (token),
    INDEX idx_user_id (user_id),
    INDEX idx_expiry_date (expiry_date),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================
-- USER ACTIVITY & SESSIONS
-- =========================================

CREATE TABLE user_activity (
    activity_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    activity_type VARCHAR(50) NOT NULL,
    activity_details TEXT,
    ip_address VARCHAR(50),
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT FK_user_activity_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_activity_type (activity_type),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE login_activity (
    login_activity_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    login_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    logout_time DATETIME,
    ip_address VARCHAR(50),
    user_agent TEXT,
    is_successful BOOLEAN DEFAULT 1,
    failure_reason VARCHAR(200),
    CONSTRAINT FK_login_activity_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_login_time (login_time),
    INDEX idx_is_successful (is_successful)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE error_logs (
    error_log_id INT AUTO_INCREMENT PRIMARY KEY,
    error_message TEXT,
    stack_trace TEXT,
    source VARCHAR(200),
    severity_level VARCHAR(20),
    user_id INT,
    ip_address VARCHAR(50),
    is_resolved BOOLEAN DEFAULT 0,
    resolved_by INT,
    resolved_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT FK_error_logs_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL,
    CONSTRAINT FK_error_logs_resolved_by FOREIGN KEY (resolved_by) REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX idx_severity_level (severity_level),
    INDEX idx_is_resolved (is_resolved),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================
-- ACADEMIC STRUCTURE
-- =========================================

CREATE TABLE academic_years (
    academic_year_id INT AUTO_INCREMENT PRIMARY KEY,
    institution_id INT NOT NULL,
    year_name VARCHAR(20) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_current BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT FK_academic_years_institution FOREIGN KEY (institution_id) REFERENCES institutions(institution_id) ON DELETE CASCADE,
    UNIQUE KEY unique_year_institution (year_name, institution_id),
    INDEX idx_institution_id (institution_id),
    INDEX idx_is_current (is_current),
    INDEX idx_year_name (year_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE semesters (
    semester_id INT AUTO_INCREMENT PRIMARY KEY,
    institution_id INT NOT NULL,
    academic_year_id INT NOT NULL,
    semester_name VARCHAR(20) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_current BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT FK_semesters_institution FOREIGN KEY (institution_id) REFERENCES institutions(institution_id) ON DELETE CASCADE,
    CONSTRAINT FK_semesters_academic_year FOREIGN KEY (academic_year_id) REFERENCES academic_years(academic_year_id) ON DELETE CASCADE,
    INDEX idx_institution_id (institution_id),
    INDEX idx_academic_year_id (academic_year_id),
    INDEX idx_is_current (is_current)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- SUBJECTS: Core subjects (is_core=1) are mandatory for all students (e.g., Math, English, Science)
-- Elective subjects (is_core=0) are optional and may be dropped by some classes (e.g., ICT, E-Chemistry)
CREATE TABLE subjects (
    subject_id INT AUTO_INCREMENT PRIMARY KEY,
    institution_id INT NOT NULL,
    subject_code VARCHAR(20) NOT NULL,
    subject_name VARCHAR(200) NOT NULL,
    description TEXT,
    credits INT DEFAULT 3,
    is_core BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT FK_subjects_institution FOREIGN KEY (institution_id) REFERENCES institutions(institution_id) ON DELETE CASCADE,
    UNIQUE KEY unique_subject_code_institution (subject_code, institution_id),
    INDEX idx_institution_id (institution_id),
    INDEX idx_subject_code (subject_code),
    INDEX idx_is_core (is_core)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================
-- GRADE LEVELS
-- =========================================
-- Defines the grade/form levels available in an institution
-- For Ghana SHS: SHS 1, SHS 2, SHS 3
-- For other systems: Form 1-6, Year 7-13, etc.

CREATE TABLE grade_levels (
    grade_level_id INT AUTO_INCREMENT PRIMARY KEY,
    institution_id INT NOT NULL,
    grade_level_code VARCHAR(20) NOT NULL, -- SHS1, SHS2, SHS3
    grade_level_name VARCHAR(50) NOT NULL, -- SHS 1, SHS 2, SHS 3
    level_order INT NOT NULL, -- 1, 2, 3 (for sorting)
    description TEXT,
    status VARCHAR(20) DEFAULT 'active', -- active, inactive
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT FK_grade_levels_institution FOREIGN KEY (institution_id) REFERENCES institutions(institution_id) ON DELETE CASCADE,
    UNIQUE KEY unique_grade_code_institution (grade_level_code, institution_id),
    UNIQUE KEY unique_grade_order_institution (institution_id, level_order),
    INDEX idx_institution_id (institution_id),
    INDEX idx_grade_level_code (grade_level_code),
    INDEX idx_level_order (level_order),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================
-- PROGRAMS
-- =========================================
-- Defines the academic programs offered by the institution (what students enroll in for 3 years)
-- For Ghana SHS: General Arts, General Science, Business, Visual Arts, Home Economics, Agriculture, Technical
-- Note: In Ghana SHS, "program" is the course of study, NOT individual subjects

CREATE TABLE programs (
    program_id INT AUTO_INCREMENT PRIMARY KEY,
    institution_id INT NOT NULL,
    program_code VARCHAR(20) NOT NULL, -- GART, GSCI, BUS, VART, etc.
    program_name VARCHAR(100) NOT NULL, -- General Arts, General Science, Business, etc.
    description TEXT,
    duration_years INT DEFAULT 3, -- For SHS: 3 years
    status VARCHAR(20) DEFAULT 'active', -- active, inactive
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT FK_programs_institution FOREIGN KEY (institution_id) REFERENCES institutions(institution_id) ON DELETE CASCADE,
    UNIQUE KEY unique_program_code_institution (program_code, institution_id),
    INDEX idx_institution_id (institution_id),
    INDEX idx_program_code (program_code),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================
-- CLASSES (Homeroom Classes/Sections)
-- =========================================
-- Represents a homeroom class/section (e.g., "1 Art 1", "2 Science 2")
-- A class is a group of students in the same program, grade level, and section
-- Multiple subjects are taught to the same class

CREATE TABLE classes (
    class_id INT AUTO_INCREMENT PRIMARY KEY,
    institution_id INT NOT NULL,
    program_id INT NOT NULL, -- The program (General Arts, General Science, etc.)
    grade_level_id INT NOT NULL,
    class_code VARCHAR(50) NOT NULL,
    class_name VARCHAR(200) NOT NULL,
    section VARCHAR(50) NOT NULL, -- Section identifier (e.g., "1", "2", "A", "B")
    academic_year_id INT NOT NULL,
    class_teacher_id INT, -- Homeroom/Form teacher
    max_students INT DEFAULT 40,
    room_number VARCHAR(50),
    status VARCHAR(20) DEFAULT 'active', -- active, inactive, completed
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT FK_classes_institution FOREIGN KEY (institution_id) REFERENCES institutions(institution_id) ON DELETE CASCADE,
    CONSTRAINT FK_classes_program FOREIGN KEY (program_id) REFERENCES programs(program_id) ON DELETE CASCADE,
    CONSTRAINT FK_classes_grade_level FOREIGN KEY (grade_level_id) REFERENCES grade_levels(grade_level_id) ON DELETE CASCADE,
    CONSTRAINT FK_classes_academic_year FOREIGN KEY (academic_year_id) REFERENCES academic_years(academic_year_id) ON DELETE CASCADE,
    CONSTRAINT FK_classes_teacher FOREIGN KEY (class_teacher_id) REFERENCES teachers(teacher_id) ON DELETE SET NULL,
    UNIQUE KEY unique_class_code_institution (class_code, institution_id),
    UNIQUE KEY unique_class_composition (institution_id, program_id, grade_level_id, section, academic_year_id),
    INDEX idx_institution_id (institution_id),
    INDEX idx_program_id (program_id),
    INDEX idx_grade_level_id (grade_level_id),
    INDEX idx_class_code (class_code),
    INDEX idx_section (section),
    INDEX idx_academic_year_id (academic_year_id),
    INDEX idx_class_teacher_id (class_teacher_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================
-- STUDENTS
-- =========================================

CREATE TABLE students (
    student_id INT AUTO_INCREMENT PRIMARY KEY,
    institution_id INT NOT NULL,
    user_id INT NOT NULL UNIQUE,
    class_id INT, -- Links student to their homeroom class
    student_id_number VARCHAR(50) NOT NULL,
    enrollment_date DATE,
    gender VARCHAR(10),
    date_of_birth DATE,
    parent_name VARCHAR(200),
    parent_phone VARCHAR(20),
    parent_email VARCHAR(100),
    emergency_contact VARCHAR(20),
    status VARCHAR(20) DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT FK_students_institution FOREIGN KEY (institution_id) REFERENCES institutions(institution_id) ON DELETE CASCADE,
    CONSTRAINT FK_students_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT FK_students_class FOREIGN KEY (class_id) REFERENCES classes(class_id) ON DELETE SET NULL,
    UNIQUE KEY unique_student_id_institution (student_id_number, institution_id),
    INDEX idx_institution_id (institution_id),
    INDEX idx_class_id (class_id),
    INDEX idx_student_id_number (student_id_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE parents (
    parent_id INT AUTO_INCREMENT PRIMARY KEY,
    institution_id INT NOT NULL,
    user_id INT UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20),
    email VARCHAR(100),
    occupation VARCHAR(100),
    address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT FK_parents_institution FOREIGN KEY (institution_id) REFERENCES institutions(institution_id) ON DELETE CASCADE,
    CONSTRAINT FK_parents_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX idx_institution_id (institution_id),
    INDEX idx_phone (phone_number),
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE parent_students (
    parent_student_id INT AUTO_INCREMENT PRIMARY KEY,
    parent_id INT NOT NULL,
    student_id INT NOT NULL,
    relationship_type VARCHAR(50) DEFAULT 'Parent',
    is_primary_contact BOOLEAN DEFAULT 0,
    can_pickup BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT FK_parent_students_parent FOREIGN KEY (parent_id) REFERENCES parents(parent_id) ON DELETE CASCADE,
    CONSTRAINT FK_parent_students_student FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
    UNIQUE KEY unique_parent_student (parent_id, student_id),
    INDEX idx_parent_id (parent_id),
    INDEX idx_student_id (student_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================
-- TEACHERS
-- =========================================

CREATE TABLE teachers (
    teacher_id INT AUTO_INCREMENT PRIMARY KEY,
    institution_id INT NOT NULL,
    user_id INT NOT NULL UNIQUE,
    employee_id VARCHAR(50) NOT NULL,
    department VARCHAR(100),
    specialization VARCHAR(100),
    hire_date DATE,
    employment_end_date DATE,
    qualification VARCHAR(200),
    years_of_experience INT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT FK_teachers_institution FOREIGN KEY (institution_id) REFERENCES institutions(institution_id) ON DELETE CASCADE,
    CONSTRAINT FK_teachers_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    UNIQUE KEY unique_employee_id_institution (employee_id, institution_id),
    INDEX idx_institution_id (institution_id),
    INDEX idx_employee_id (employee_id),
    INDEX idx_department (department),
    INDEX idx_employment_end_date (employment_end_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- TEACHER_SUBJECTS: Represents which subjects a teacher is qualified/assigned to teach
-- This is a general qualification/assignment. The specific class assignments are in the class_subjects table.
-- Example: Kofi can be assigned to teach English (teacher_subjects record),
-- then teach it to multiple classes via separate class_subjects records.
CREATE TABLE teacher_subjects (
    teacher_subject_id INT AUTO_INCREMENT PRIMARY KEY,
    teacher_id INT NOT NULL,
    subject_id INT NOT NULL,
    assigned_date DATE DEFAULT (CURRENT_DATE),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT FK_teacher_subjects_teacher FOREIGN KEY (teacher_id) REFERENCES teachers(teacher_id) ON DELETE CASCADE,
    CONSTRAINT FK_teacher_subjects_subject FOREIGN KEY (subject_id) REFERENCES subjects(subject_id) ON DELETE CASCADE,
    INDEX idx_teacher_id (teacher_id),
    INDEX idx_subject_id (subject_id),
    INDEX idx_teacher_subject (teacher_id, subject_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- GRADE SCALES: Defines the grading rubric (A, B, C, D, F) with score ranges and GPA points
-- GHANA SHS GRADING SCALE
-- Ghana uses A1-F9 grading system:
-- A1 (80-100), B2 (70-79), B3 (65-69), C4 (60-64), C5 (55-59), C6 (50-54)
-- D7 (45-49), E8 (40-44), F9 (0-39)
CREATE TABLE grade_scales (
    grade_scale_id INT AUTO_INCREMENT PRIMARY KEY,
    institution_id INT,
    grade VARCHAR(5) NOT NULL, -- A1, B2, B3, C4, C5, C6, D7, E8, F9
    min_score DECIMAL(5,2) NOT NULL,
    max_score DECIMAL(5,2) NOT NULL,
    grade_point DECIMAL(3,2),
    remark VARCHAR(50), -- Excellent, Very Good, Good, Credit, Pass, Fail
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT FK_grade_scales_institution FOREIGN KEY (institution_id) REFERENCES institutions(institution_id) ON DELETE CASCADE,
    INDEX idx_institution_id (institution_id),
    INDEX idx_grade (grade),
    INDEX idx_score_range (min_score, max_score)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================
-- CLASS SUBJECTS (Subject Teachings)
-- =========================================
-- In Ghana SHS terminology:
--   - PROGRAM = General Arts, General Science, Business (in programs table) - the course of study
--   - SUBJECT = English, Math, Biology, etc. (in subjects table) - core and elective subjects
--   - CLASS SUBJECT = A subject taught to a specific class
-- 
-- Example: "English taught to SHS 1 Art 1" where:
--   - class_id: Links to the class (which has program, grade_level, section)
--   - subject_id: The subject being taught (English, Math, etc.)
--   - teacher_id: The specific teacher assigned (only ONE teacher per class-subject)
-- Constraint: Only ONE teacher can teach a specific subject to a specific class.
-- But the same teacher can teach the same subject to different classes.
--
-- Note: Primary key is 'course_id' for database compatibility with existing references

CREATE TABLE class_subjects (
    course_id INT AUTO_INCREMENT PRIMARY KEY, -- Using 'course_id' for DB compatibility
    institution_id INT NOT NULL,
    class_id INT NOT NULL, -- Links to the class/section
    subject_id INT NOT NULL,
    teacher_id INT,
    academic_year_id INT,
    semester_id INT,
    duration_weeks INT DEFAULT 16,
    start_date DATE,
    end_date DATE,
    status VARCHAR(20) DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT FK_class_subjects_institution FOREIGN KEY (institution_id) REFERENCES institutions(institution_id) ON DELETE CASCADE,
    CONSTRAINT FK_class_subjects_class FOREIGN KEY (class_id) REFERENCES classes(class_id) ON DELETE CASCADE,
    CONSTRAINT FK_class_subjects_subject FOREIGN KEY (subject_id) REFERENCES subjects(subject_id) ON DELETE CASCADE,
    CONSTRAINT FK_class_subjects_teacher FOREIGN KEY (teacher_id) REFERENCES teachers(teacher_id) ON DELETE SET NULL,
    CONSTRAINT FK_class_subjects_academic_year FOREIGN KEY (academic_year_id) REFERENCES academic_years(academic_year_id) ON DELETE SET NULL,
    CONSTRAINT FK_class_subjects_semester FOREIGN KEY (semester_id) REFERENCES semesters(semester_id) ON DELETE SET NULL,
    UNIQUE KEY unique_class_subject_year (institution_id, class_id, subject_id, academic_year_id, semester_id),
    INDEX idx_institution_id (institution_id),
    INDEX idx_class_id (class_id),
    INDEX idx_subject_id (subject_id),
    INDEX idx_teacher_id (teacher_id),
    INDEX idx_academic_year_id (academic_year_id),
    INDEX idx_semester_id (semester_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================
-- CLASS SUBJECT ENROLLMENTS
-- =========================================
-- Links students to class subjects (which subjects each student is taking)
-- Students enroll in subjects being taught to their assigned class
-- but the system allows flexibility for special cases (e.g., advanced placement)

CREATE TABLE course_enrollments (
    enrollment_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    course_id INT NOT NULL,
    enrollment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    completion_date DATETIME,
    status VARCHAR(20) DEFAULT 'active',
    progress_percentage DECIMAL(5,2) DEFAULT 0.00,
    final_grade VARCHAR(2),
    CONSTRAINT FK_enrollments_student FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
    CONSTRAINT FK_enrollments_course FOREIGN KEY (course_id) REFERENCES class_subjects(course_id) ON DELETE CASCADE,
    UNIQUE KEY unique_enrollment (student_id, course_id),
    INDEX idx_student_id (student_id),
    INDEX idx_course_id (course_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================
-- CLASS SUBJECT SCHEDULES
-- =========================================
-- Defines when each class subject meets (timetable)

CREATE TABLE course_schedules (
    schedule_id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NOT NULL,
    day_of_week VARCHAR(20) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    room VARCHAR(50),
    is_recurring BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT FK_schedules_course FOREIGN KEY (course_id) REFERENCES class_subjects(course_id) ON DELETE CASCADE,
    INDEX idx_course_id (course_id),
    UNIQUE KEY unique_course_schedules (course_id, day_of_week, start_time, end_time),
    INDEX idx_day_of_week (day_of_week)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================
-- CLASS SUBJECT SECTIONS (Organize lessons/weeks)
-- =========================================
-- Organizes class subject content into sections (e.g., Week 1, Week 2, Topic 1, etc.)

CREATE TABLE course_sections (
    course_sections_id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NOT NULL,
    section_name VARCHAR(100) NOT NULL,
    description TEXT,
    order_index INT DEFAULT 0,
    is_active BOOLEAN DEFAULT 1,
    created_by INT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT FK_course_sections_course FOREIGN KEY (course_id) REFERENCES class_subjects(course_id) ON DELETE CASCADE,
    CONSTRAINT FK_course_sections_creator FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX idx_course_id (course_id),
    INDEX idx_order_index (order_index),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================
-- CLASS SUBJECT MATERIALS
-- =========================================
-- Learning materials for each class subject

CREATE TABLE course_materials (
    material_id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NOT NULL,
    section_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    material_type VARCHAR(50),
    file_name VARCHAR(255),
    file_path VARCHAR(500),
    file_size BIGINT,
    external_link VARCHAR(500),
    order_index INT DEFAULT 0,
    is_required BOOLEAN DEFAULT 0,
    is_active BOOLEAN DEFAULT 1,
    uploaded_by INT,
    status VARCHAR(50) DEFAULT 'active',
    tags VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT FK_materials_course FOREIGN KEY (course_id) REFERENCES class_subjects(course_id) ON DELETE CASCADE,
    CONSTRAINT FK_materials_section FOREIGN KEY (section_id) REFERENCES course_sections(course_sections_id) ON DELETE CASCADE,
    CONSTRAINT FK_materials_uploader FOREIGN KEY (uploaded_by) REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX idx_course_id (course_id),
    INDEX idx_section_id (section_id),
    INDEX idx_material_type (material_type),
    INDEX idx_is_active (is_active),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================
-- ASSESSMENTS
-- =========================================

CREATE TABLE assessment_categories (
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL,
    weight_percentage DECIMAL(5,2) NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_category_name (category_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE assessments (
    assessment_id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NOT NULL,
    category_id INT,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    assessment_type VARCHAR(50) NOT NULL,
    max_score DECIMAL(10,2) DEFAULT 100.00,
    passing_score DECIMAL(10,2) DEFAULT 60.00,
    due_date DATETIME,
    duration_minutes INT,
    is_published BOOLEAN DEFAULT 0,
    weight_percentage DECIMAL(5,2),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT FK_assessments_course FOREIGN KEY (course_id) REFERENCES class_subjects(course_id) ON DELETE CASCADE,
    CONSTRAINT FK_assessments_category FOREIGN KEY (category_id) REFERENCES assessment_categories(category_id) ON DELETE SET NULL,
    INDEX idx_course_id (course_id),
    INDEX idx_category_id (category_id),
    INDEX idx_assessment_type (assessment_type),
    INDEX idx_due_date (due_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================
-- ASSESSMENT SUBMISSIONS
-- =========================================

CREATE TABLE assessment_submissions (
    submission_id INT AUTO_INCREMENT PRIMARY KEY,
    assessment_id INT NOT NULL,
    student_id INT NOT NULL,
    submission_text TEXT,
    file_path VARCHAR(500),
    score DECIMAL(10,2),
    feedback TEXT,
    status VARCHAR(20) DEFAULT 'draft',
    submitted_at DATETIME,
    graded_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT FK_submissions_assessment FOREIGN KEY (assessment_id) REFERENCES assessments(assessment_id) ON DELETE CASCADE,
    CONSTRAINT FK_submissions_student FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
    INDEX idx_assessment_id (assessment_id),
    INDEX idx_student_id (student_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================
-- ATTENDANCE
-- =========================================

CREATE TABLE attendance (
    attendance_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    course_id INT NOT NULL,
    attendance_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL,
    remarks TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT FK_attendance_student FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
    CONSTRAINT FK_attendance_course FOREIGN KEY (course_id) REFERENCES class_subjects(course_id) ON DELETE CASCADE,
    UNIQUE KEY unique_attendance (student_id, course_id, attendance_date),
    INDEX idx_student_id (student_id),
    INDEX idx_course_id (course_id),
    INDEX idx_attendance_date (attendance_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================
-- RESULTS (Final Grades)
-- =========================================

CREATE TABLE results (
    result_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    course_id INT NOT NULL,
    subject_id INT,
    semester_id INT,
    class_score DECIMAL(5,2),
    exam_score DECIMAL(5,2),
    total_score DECIMAL(5,2),
    grade VARCHAR(2),
    grade_point DECIMAL(3,2),
    remark VARCHAR(50),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT FK_results_student FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
    CONSTRAINT FK_results_course FOREIGN KEY (course_id) REFERENCES class_subjects(course_id) ON DELETE CASCADE,
    CONSTRAINT FK_results_subject FOREIGN KEY (subject_id) REFERENCES subjects(subject_id) ON DELETE SET NULL,
    CONSTRAINT FK_results_semester FOREIGN KEY (semester_id) REFERENCES semesters(semester_id) ON DELETE SET NULL,
    UNIQUE KEY unique_student_course_semester (student_id, course_id, semester_id),
    INDEX idx_student_id (student_id),
    INDEX idx_course_id (course_id),
    INDEX idx_subject_id (subject_id),
    INDEX idx_semester_id (semester_id),
    INDEX idx_grade (grade)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================
-- CLASS SUBJECT REVIEWS
-- =========================================
-- Student feedback/reviews for class subjects

CREATE TABLE course_reviews (
    review_id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NOT NULL,
    student_id INT NOT NULL,
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    review_text TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT FK_reviews_course FOREIGN KEY (course_id) REFERENCES class_subjects(course_id) ON DELETE CASCADE,
    CONSTRAINT FK_reviews_student FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
    UNIQUE KEY unique_review (course_id, student_id),
    INDEX idx_course_id (course_id),
    INDEX idx_rating (rating)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================
-- NOTIFICATIONS
-- =========================================

CREATE TABLE notifications (
    notification_id INT AUTO_INCREMENT PRIMARY KEY,
    sender_id INT NOT NULL,
    user_id INT, -- Nullable for broadcast notifications
    target_role VARCHAR(50), -- 'all', 'admin', 'teacher', 'student', 'parent' for broadcast
    course_id INT, -- For class subject-specific notifications (teachers to students in a class subject)
    title VARCHAR(200) NOT NULL,
    message TEXT,
    notification_type VARCHAR(50),
    is_read BOOLEAN DEFAULT 0,
    link VARCHAR(500),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    read_at DATETIME,
    CONSTRAINT FK_notifications_sender FOREIGN KEY (sender_id) REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT FK_notifications_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT FK_notifications_course FOREIGN KEY (course_id) REFERENCES class_subjects(course_id) ON DELETE CASCADE,
    INDEX idx_sender_id (sender_id),
    INDEX idx_user_id (user_id),
    INDEX idx_target_role (target_role),
    INDEX idx_course_id (course_id),
    INDEX idx_is_read (is_read),
    INDEX idx_created_at (created_at),
    CONSTRAINT chk_notification_target CHECK (
        (user_id IS NOT NULL AND target_role IS NULL) OR
        (user_id IS NULL AND target_role IS NOT NULL)
    )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================
-- ANNOUNCEMENTS
-- =========================================

CREATE TABLE announcements (
    announcement_id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    content TEXT,
    author_id INT,
    target_role VARCHAR(50),
    is_published BOOLEAN DEFAULT 0,
    published_at DATETIME,
    expires_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT FK_announcements_author FOREIGN KEY (author_id) REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX idx_target_role (target_role),
    INDEX idx_is_published (is_published),
    INDEX idx_published_at (published_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================
-- CLASS SUBJECT CONTENT
-- =========================================
-- Learning content for each class subject

CREATE TABLE course_content (
    course_content_id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NOT NULL,
    section_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    content_text TEXT,
    description TEXT,
    content_type VARCHAR(50) DEFAULT 'lesson', -- lesson, topic, article, etc.
    is_active BOOLEAN DEFAULT 1,
    created_by INT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT FK_course_content_course FOREIGN KEY (course_id) REFERENCES class_subjects(course_id) ON DELETE CASCADE,
    CONSTRAINT FK_course_content_section FOREIGN KEY (section_id) REFERENCES course_sections(course_sections_id) ON DELETE CASCADE,
    CONSTRAINT FK_course_content_creator FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX idx_course_content_course (course_id),
    INDEX idx_course_content_section (section_id),
    INDEX idx_course_content_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================
-- COURSE CONTENT ORDER
-- =========================================

CREATE TABLE course_content_order (
    course_content_order_id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NOT NULL,
    course_section_id INT NOT NULL,
    course_content_id INT,
    material_id INT,
    order_index INT NOT NULL DEFAULT 0,
    item_type VARCHAR(20) NOT NULL, -- 'content' or 'material'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT FK_content_order_course FOREIGN KEY (course_id) REFERENCES class_subjects(course_id) ON DELETE CASCADE,
    CONSTRAINT FK_content_order_section FOREIGN KEY (course_section_id) REFERENCES course_sections(course_sections_id) ON DELETE CASCADE,
    CONSTRAINT FK_content_order_content FOREIGN KEY (course_content_id) REFERENCES course_content(course_content_id) ON DELETE CASCADE,
    CONSTRAINT FK_content_order_material FOREIGN KEY (material_id) REFERENCES course_materials(material_id) ON DELETE CASCADE,
    INDEX idx_content_order_course (course_id),
    INDEX idx_content_order_section (course_section_id),
    INDEX idx_content_order_index (order_index),
    CONSTRAINT chk_content_or_material CHECK (
        (course_content_id IS NOT NULL AND material_id IS NULL AND item_type = 'content') OR
        (course_content_id IS NULL AND material_id IS NOT NULL AND item_type = 'material')
    )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================
-- MESSAGES
-- =========================================

CREATE TABLE messages (
    message_id INT AUTO_INCREMENT PRIMARY KEY,
    sender_id INT NOT NULL,
    receiver_id INT NOT NULL,
    course_id INT,
    subject VARCHAR(200),
    message_text TEXT NOT NULL,
    is_read BOOLEAN DEFAULT 0,
    parent_message_id INT, -- For threading/replies
    sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    read_at DATETIME,
    CONSTRAINT FK_messages_sender FOREIGN KEY (sender_id) REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT FK_messages_receiver FOREIGN KEY (receiver_id) REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT FK_messages_course FOREIGN KEY (course_id) REFERENCES class_subjects(course_id) ON DELETE SET NULL,
    CONSTRAINT FK_messages_parent FOREIGN KEY (parent_message_id) REFERENCES messages(message_id) ON DELETE SET NULL,
    INDEX idx_messages_sender (sender_id),
    INDEX idx_messages_receiver (receiver_id),
    INDEX idx_messages_course (course_id),
    INDEX idx_messages_read (is_read),
    INDEX idx_messages_sent_at (sent_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================
-- ASSIGNMENTS
-- =========================================

CREATE TABLE assignments (
    assignment_id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NOT NULL,
    section_id INT,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    file_path VARCHAR(500),
    max_score DECIMAL(10,2) DEFAULT 100.00,
    passing_score DECIMAL(10,2) DEFAULT 60.00,
    rubric TEXT,
    submission_type VARCHAR(50) DEFAULT 'both',
    due_date DATETIME,
    status VARCHAR(20) DEFAULT 'draft',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT FK_assignments_course FOREIGN KEY (course_id) REFERENCES class_subjects(course_id) ON DELETE CASCADE,
    CONSTRAINT FK_assignments_section FOREIGN KEY (section_id) REFERENCES course_sections(course_sections_id) ON DELETE SET NULL,
    INDEX idx_course_id (course_id),
    INDEX idx_section_id (section_id),
    INDEX idx_due_date (due_date),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================
-- ASSIGNMENT SUBMISSIONS
-- =========================================

CREATE TABLE assignment_submissions (
    submission_id INT AUTO_INCREMENT PRIMARY KEY,
    assignment_id INT NOT NULL,
    student_id INT NOT NULL,
    course_id INT NOT NULL,
    submission_text TEXT,
    submission_file VARCHAR(500),
    score DECIMAL(10,2),
    feedback TEXT,
    graded_by INT,
    graded_at DATETIME,
    status VARCHAR(20) DEFAULT 'draft',
    submitted_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT FK_assignment_submissions_assignment FOREIGN KEY (assignment_id) REFERENCES assignments(assignment_id) ON DELETE CASCADE,
    CONSTRAINT FK_assignment_submissions_student FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
    CONSTRAINT FK_assignment_submissions_course FOREIGN KEY (course_id) REFERENCES class_subjects(course_id) ON DELETE CASCADE,
    CONSTRAINT FK_assignment_submissions_grader FOREIGN KEY (graded_by) REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX idx_assignment_id (assignment_id),
    INDEX idx_student_id (student_id),
    INDEX idx_course_id (course_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================
-- QUIZZES
-- =========================================

CREATE TABLE quizzes (
    quiz_id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NOT NULL,
    section_id INT,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    duration_minutes INT NOT NULL,
    max_attempts INT DEFAULT 1,
    status VARCHAR(20) DEFAULT 'draft',
    quiz_type VARCHAR(20) DEFAULT 'graded',
    is_activated BOOLEAN DEFAULT 0,
    show_results VARCHAR(20) DEFAULT 'after_end',
    start_date DATETIME,
    end_date DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT FK_quizzes_course FOREIGN KEY (course_id) REFERENCES class_subjects(course_id) ON DELETE CASCADE,
    CONSTRAINT FK_quizzes_section FOREIGN KEY (section_id) REFERENCES course_sections(course_sections_id) ON DELETE SET NULL,
    INDEX idx_course_id (course_id),
    INDEX idx_section_id (section_id),
    INDEX idx_status (status),
    INDEX idx_is_activated (is_activated),
    INDEX idx_start_date (start_date),
    INDEX idx_end_date (end_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================
-- QUIZ QUESTIONS
-- =========================================

CREATE TABLE quiz_questions (
    question_id INT AUTO_INCREMENT PRIMARY KEY,
    quiz_id INT NOT NULL,
    question_text TEXT NOT NULL,
    question_type VARCHAR(50) NOT NULL,
    points INT DEFAULT 1,
    difficulty VARCHAR(20),
    explanation TEXT,
    correct_answer VARCHAR(500),
    order_index INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT FK_quiz_questions_quiz FOREIGN KEY (quiz_id) REFERENCES quizzes(quiz_id) ON DELETE CASCADE,
    INDEX idx_quiz_id (quiz_id),
    INDEX idx_question_type (question_type),
    INDEX idx_order_index (order_index)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================
-- QUIZ QUESTION OPTIONS
-- =========================================

CREATE TABLE quiz_question_options (
    option_id INT AUTO_INCREMENT PRIMARY KEY,
    question_id INT NOT NULL,
    option_label VARCHAR(5) NOT NULL,
    option_text VARCHAR(500) NOT NULL,
    is_correct BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT FK_quiz_options_question FOREIGN KEY (question_id) REFERENCES quiz_questions(question_id) ON DELETE CASCADE,
    INDEX idx_question_id (question_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================
-- QUIZ SUBMISSIONS
-- =========================================

CREATE TABLE quiz_submissions (
    submission_id INT AUTO_INCREMENT PRIMARY KEY,
    quiz_id INT NOT NULL,
    student_id INT NOT NULL,
    attempt INT DEFAULT 1,
    score DECIMAL(10,2),
    max_score DECIMAL(10,2),
    status VARCHAR(50) DEFAULT 'in_progress',
    duration_minutes INT,
    submitted_at DATETIME,
    graded_at DATETIME,
    graded_by INT,
    comments TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT FK_quiz_submissions_quiz FOREIGN KEY (quiz_id) REFERENCES quizzes(quiz_id) ON DELETE CASCADE,
    CONSTRAINT FK_quiz_submissions_student FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
    CONSTRAINT FK_quiz_submissions_grader FOREIGN KEY (graded_by) REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX idx_quiz_id (quiz_id),
    INDEX idx_student_id (student_id),
    INDEX idx_status (status),
    INDEX idx_attempt (attempt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================
-- QUIZ SUBMISSION ANSWERS
-- =========================================

CREATE TABLE quiz_submission_answers (
    submission_answer_id INT AUTO_INCREMENT PRIMARY KEY,
    submission_id INT NOT NULL,
    question_id INT NOT NULL,
    answer TEXT,
    is_correct BOOLEAN,
    points_earned DECIMAL(10,2),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT FK_quiz_answers_submission FOREIGN KEY (submission_id) REFERENCES quiz_submissions(submission_id) ON DELETE CASCADE,
    CONSTRAINT FK_quiz_answers_question FOREIGN KEY (question_id) REFERENCES quiz_questions(question_id) ON DELETE CASCADE,
    INDEX idx_submission_id (submission_id),
    INDEX idx_question_id (question_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================
-- EVENTS & CALENDAR
-- =========================================

CREATE TABLE events (
    event_id INT AUTO_INCREMENT PRIMARY KEY,
    institution_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    event_type VARCHAR(50), -- holiday, exam, meeting, deadline, assembly, sports, etc.
    start_date DATETIME NOT NULL,
    end_date DATETIME,
    all_day BOOLEAN DEFAULT 0,
    location VARCHAR(200),
    target_role VARCHAR(50), -- all, admin, teacher, student, parent
    course_id INT, -- For course-specific events
    created_by INT,
    is_recurring BOOLEAN DEFAULT 0,
    recurrence_pattern VARCHAR(100), -- daily, weekly, monthly, yearly
    is_published BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT FK_events_institution FOREIGN KEY (institution_id) REFERENCES institutions(institution_id) ON DELETE CASCADE,
    CONSTRAINT FK_events_course FOREIGN KEY (course_id) REFERENCES class_subjects(course_id) ON DELETE CASCADE,
    CONSTRAINT FK_events_creator FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX idx_institution_id (institution_id),
    INDEX idx_event_dates (start_date, end_date),
    INDEX idx_event_type (event_type),
    INDEX idx_target_role (target_role),
    INDEX idx_course_id (course_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================
-- GRADE REPORTS & TRANSCRIPTS
-- =========================================

CREATE TABLE grade_reports (
    report_id INT AUTO_INCREMENT PRIMARY KEY,
    institution_id INT NOT NULL,
    student_id INT NOT NULL,
    academic_year_id INT NOT NULL,
    semester_id INT,
    report_type VARCHAR(50) DEFAULT 'semester', -- semester, annual, transcript
    gpa DECIMAL(4,2),
    cgpa DECIMAL(4,2), -- Cumulative GPA
    total_credits INT,
    credits_earned INT,
    class_rank INT,
    total_students INT, -- In class for ranking
    attendance_percentage DECIMAL(5,2),
    teacher_comment TEXT,
    principal_comment TEXT,
    conduct_grade VARCHAR(10), -- Excellent, Good, Fair, Poor
    effort_grade VARCHAR(10),
    report_card_url VARCHAR(500), -- PDF URL
    generated_at DATETIME,
    generated_by INT,
    is_published BOOLEAN DEFAULT 0,
    published_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT FK_grade_reports_institution FOREIGN KEY (institution_id) REFERENCES institutions(institution_id) ON DELETE CASCADE,
    CONSTRAINT FK_grade_reports_student FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
    CONSTRAINT FK_grade_reports_year FOREIGN KEY (academic_year_id) REFERENCES academic_years(academic_year_id) ON DELETE CASCADE,
    CONSTRAINT FK_grade_reports_semester FOREIGN KEY (semester_id) REFERENCES semesters(semester_id) ON DELETE SET NULL,
    CONSTRAINT FK_grade_reports_generator FOREIGN KEY (generated_by) REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX idx_institution_id (institution_id),
    INDEX idx_student_id (student_id),
    INDEX idx_academic_year (academic_year_id),
    INDEX idx_semester (semester_id),
    INDEX idx_report_type (report_type),
    UNIQUE KEY unique_student_semester_report (student_id, academic_year_id, semester_id, report_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE grade_report_details (
    report_detail_id INT AUTO_INCREMENT PRIMARY KEY,
    report_id INT NOT NULL,
    course_id INT NOT NULL,
    subject_name VARCHAR(100),
    teacher_name VARCHAR(200),
    credits INT,
    total_score DECIMAL(10,2),
    percentage DECIMAL(5,2),
    letter_grade VARCHAR(5),
    grade_point DECIMAL(4,2),
    remarks TEXT,
    position_in_class INT, -- Position in that subject
    class_average DECIMAL(5,2),
    highest_score DECIMAL(10,2),
    lowest_score DECIMAL(10,2),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT FK_report_details_report FOREIGN KEY (report_id) REFERENCES grade_reports(report_id) ON DELETE CASCADE,
    CONSTRAINT FK_report_details_course FOREIGN KEY (course_id) REFERENCES class_subjects(course_id) ON DELETE CASCADE,
    INDEX idx_report_id (report_id),
    INDEX idx_course_id (course_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================
-- INDEXES FOR PERFORMANCE
-- =========================================

-- Additional composite indexes for common queries
CREATE INDEX idx_user_active ON users(is_active, created_at);
CREATE INDEX idx_course_teacher_status ON class_subjects(teacher_id, status);
CREATE INDEX idx_enrollment_student_status ON course_enrollments(student_id, status);
CREATE INDEX idx_submission_assessment_student ON assessment_submissions(assessment_id, student_id);
CREATE INDEX idx_attendance_date_range ON attendance(student_id, attendance_date);

-- =========================================
-- VIEWS
-- =========================================

CREATE VIEW vw_student_courses AS
SELECT 
    s.student_id,
    s.student_id_number,
    cls.class_id,
    cls.class_code,
    cls.class_name,
    p.program_id,
    p.program_code,
    p.program_name as class_program,
    gl.grade_level_id,
    gl.grade_level_code,
    gl.grade_level_name as class_grade_level,
    cls.section as class_section,
    u.first_name,
    u.last_name,
    u.email,
    c.course_id,
    sub.subject_id,
    sub.subject_name,
    sub.subject_code,
    sub.is_core,
    ce.enrollment_date,
    ce.status as enrollment_status,
    ce.progress_percentage,
    ce.final_grade,
    t.teacher_id,
    ut.first_name as teacher_first_name,
    ut.last_name as teacher_last_name
FROM students s
INNER JOIN users u ON s.user_id = u.user_id
LEFT JOIN classes cls ON s.class_id = cls.class_id
LEFT JOIN programs p ON cls.program_id = p.program_id
LEFT JOIN grade_levels gl ON cls.grade_level_id = gl.grade_level_id
INNER JOIN course_enrollments ce ON s.student_id = ce.student_id
INNER JOIN class_subjects c ON ce.course_id = c.course_id
LEFT JOIN subjects sub ON c.subject_id = sub.subject_id
LEFT JOIN teachers t ON c.teacher_id = t.teacher_id
LEFT JOIN users ut ON t.user_id = ut.user_id
WHERE u.deleted_at IS NULL AND ce.status = 'active';

CREATE VIEW vw_teacher_courses AS
SELECT 
    t.teacher_id,
    t.employee_id,
    u.first_name,
    u.last_name,
    u.email,
    c.course_id,
    cls.class_id,
    cls.class_code,
    cls.class_name,
    p.program_id,
    p.program_code,
    p.program_name as class_program,
    gl.grade_level_id,
    gl.grade_level_code,
    gl.grade_level_name as class_grade_level,
    cls.section as class_section,
    sub.subject_id,
    sub.subject_name,
    sub.subject_code,
    sub.is_core,
    c.status,
    c.start_date,
    c.end_date,
    COUNT(DISTINCT ce.student_id) as enrolled_students
FROM teachers t
INNER JOIN users u ON t.user_id = u.user_id
INNER JOIN class_subjects c ON t.teacher_id = c.teacher_id
LEFT JOIN classes cls ON c.class_id = cls.class_id
LEFT JOIN programs p ON cls.program_id = p.program_id
LEFT JOIN grade_levels gl ON cls.grade_level_id = gl.grade_level_id
LEFT JOIN subjects sub ON c.subject_id = sub.subject_id
LEFT JOIN course_enrollments ce ON c.course_id = ce.course_id AND ce.status = 'active'
WHERE u.deleted_at IS NULL
GROUP BY t.teacher_id, c.course_id;

CREATE VIEW vw_classes AS
SELECT 
    cls.class_id,
    cls.class_code,
    cls.class_name,
    p.program_id,
    p.program_code,
    p.program_name,
    gl.grade_level_id,
    gl.grade_level_code,
    gl.grade_level_name,
    gl.level_order,
    cls.section,
    cls.room_number,
    cls.max_students,
    cls.status,
    i.institution_id,
    i.institution_name,
    ay.academic_year_id,
    ay.year_name,
    t.teacher_id as class_teacher_id,
    u.first_name as class_teacher_first_name,
    u.last_name as class_teacher_last_name,
    u.email as class_teacher_email,
    COUNT(DISTINCT s.student_id) as total_students,
    COUNT(DISTINCT CASE WHEN s.status = 'active' THEN s.student_id END) as active_students
FROM classes cls
INNER JOIN institutions i ON cls.institution_id = i.institution_id
INNER JOIN programs p ON cls.program_id = p.program_id
INNER JOIN grade_levels gl ON cls.grade_level_id = gl.grade_level_id
INNER JOIN academic_years ay ON cls.academic_year_id = ay.academic_year_id
LEFT JOIN teachers t ON cls.class_teacher_id = t.teacher_id
LEFT JOIN users u ON t.user_id = u.user_id
LEFT JOIN students s ON cls.class_id = s.class_id
GROUP BY cls.class_id;

CREATE VIEW vw_user_roles AS
SELECT 
    u.user_id,
    u.username,
    u.email,
    u.first_name,
    u.last_name,
    u.is_active,
    GROUP_CONCAT(r.role_name ORDER BY r.role_name SEPARATOR ',') as roles,
    GROUP_CONCAT(p.permission_name ORDER BY p.permission_name SEPARATOR ',') as permissions
FROM users u
LEFT JOIN user_roles ur ON u.user_id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.role_id
LEFT JOIN role_permissions rp ON r.role_id = rp.role_id
LEFT JOIN permissions p ON rp.permission_id = p.permission_id
WHERE u.deleted_at IS NULL
GROUP BY u.user_id;

-- =========================================
-- TRIGGERS
-- =========================================

DELIMITER $$

-- Trigger to create notification when student enrolls in course
CREATE TRIGGER after_enrollment_insert
AFTER INSERT ON course_enrollments
FOR EACH ROW
BEGIN
    DECLARE student_user_id INT;
    DECLARE class_subject_name VARCHAR(200);
    
    SELECT user_id INTO student_user_id FROM students WHERE student_id = NEW.student_id;
    SELECT class_subject_name INTO class_subject_name FROM class_subjects WHERE course_id = NEW.course_id;
    
    INSERT INTO notifications (user_id, title, message, notification_type)
    VALUES (
        student_user_id,
        'Course Enrollment',
        CONCAT('You have been enrolled in ', class_subject_name),
        'enrollment'
    );
END$$

-- Trigger to create notification when assessment is graded
CREATE TRIGGER after_submission_graded
AFTER UPDATE ON assessment_submissions
FOR EACH ROW
BEGIN
    DECLARE student_user_id INT;
    DECLARE assessment_title VARCHAR(200);
    
    IF NEW.graded_at IS NOT NULL AND OLD.graded_at IS NULL THEN
        SELECT user_id INTO student_user_id FROM students WHERE student_id = NEW.student_id;
        SELECT title INTO assessment_title FROM assessments WHERE assessment_id = NEW.assessment_id;
        
        INSERT INTO notifications (user_id, title, message, notification_type)
        VALUES (
            student_user_id,
            'Assessment Graded',
            CONCAT('Your submission for "', assessment_title, '" has been graded. Score: ', NEW.score),
            'grading'
        );
    END IF;
END$$

DELIMITER ;

