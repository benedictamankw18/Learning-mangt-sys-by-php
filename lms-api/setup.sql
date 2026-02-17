-- =========================================
-- LMS API - Initial Setup Script
-- Run this AFTER importing database_lms_api.sql
-- Ghana Senior High School (SHS) System
-- =========================================

USE lms;

-- =========================================
-- IMPORTANT: HOW TO USE THIS SCRIPT
-- =========================================
-- If running for the FIRST TIME: Run as-is
-- If RE-RUNNING: Uncomment the DELETE statements below to clear existing data
-- Or manually delete data from phpMyAdmin before running

-- Uncomment these lines to clear existing data (USE WITH CAUTION):
-- DELETE FROM quiz_submission_answers;
-- DELETE FROM quiz_submissions;
-- DELETE FROM quiz_question_options;
-- DELETE FROM quiz_questions;
-- DELETE FROM quizzes;
-- DELETE FROM assignment_submissions;
-- DELETE FROM assignments;
-- DELETE FROM course_materials;
-- DELETE FROM course_sections;
-- DELETE FROM assessments;
-- DELETE FROM course_enrollments;
-- DELETE FROM class_subjects;
-- DELETE FROM classes;
-- DELETE FROM subjects;
-- DELETE FROM grade_levels;
-- DELETE FROM programs;
-- DELETE FROM semesters;
-- DELETE FROM academic_years;
-- DELETE FROM grade_scales;
-- DELETE FROM students;
-- DELETE FROM teachers;
-- DELETE FROM user_roles;
-- DELETE FROM users WHERE institution_id IS NOT NULL; -- Keep super admin
-- DELETE FROM institution_settings;
-- DELETE FROM institutions;
-- DELETE FROM role_permissions;
-- DELETE FROM permissions;
-- DELETE FROM roles;

-- =========================================
-- SEED DATA (Required - DO NOT COMMENT OUT)
-- =========================================
-- Insert default roles, permissions, and system settings
-- These are required for the application to function

-- Insert default roles (skip if already exist)
INSERT IGNORE INTO roles (role_name, description) VALUES
('super_admin', 'Platform Super Administrator - Manages all institutions'),
('admin', 'Institution Administrator - Manages single institution'),
('teacher', 'Teacher/Instructor'),
('student', 'Student'),
('parent', 'Parent/Guardian');

-- Insert sample permissions (skip if already exist)
INSERT IGNORE INTO permissions (permission_name, description) VALUES
('manage_institutions', 'Create, update, delete institutions (Super Admin only)'),
('manage_subscriptions', 'Manage institution subscriptions (Super Admin only)'),
('view_all_institutions', 'View all institutions on platform (Super Admin only)'),
('manage_users', 'Create, update, delete users'),
('manage_courses', 'Create, update, delete class subjects'),
('manage_assessments', 'Create, update, grade assessments'),
('view_reports', 'View system reports and analytics'),
('manage_attendance', 'Mark and manage attendance');

-- Assign ALL permissions to super_admin role
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
    (SELECT role_id FROM roles WHERE role_name = 'super_admin'),
    permission_id
FROM permissions;

-- Assign all permissions to admin role (except platform-level ones)
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
    (SELECT role_id FROM roles WHERE role_name = 'admin'),
    permission_id
FROM permissions
WHERE permission_name NOT IN ('manage_institutions', 'manage_subscriptions', 'view_all_institutions');

-- Assign limited permissions to teacher role
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
    (SELECT role_id FROM roles WHERE role_name = 'teacher'),
    permission_id
FROM permissions
WHERE permission_name IN ('manage_courses', 'manage_assessments', 'manage_attendance');

-- Insert default assessment categories (skip if already exist)
INSERT IGNORE INTO assessment_categories (category_name, weight_percentage, description) VALUES
('Quiz', 15.00, 'Short quizzes and tests'),
('Assignment', 20.00, 'Homework and take-home assignments'),
('Midterm', 25.00, 'Mid-term examination'),
('Final', 40.00, 'Final examination');

-- =========================================
-- SAMPLE DATA (Optional - can be commented out)
-- =========================================
-- The following creates sample institution and test users

-- =========================================
-- CREATE PLATFORM SUPER ADMIN
-- =========================================

-- Super Admin User (Platform Owner/Operator)
-- Username: superadmin
-- Password: password
-- This user can manage ALL institutions on the platform
INSERT IGNORE INTO users (institution_id, username, email, password_hash, first_name, last_name, phone_number, is_super_admin, is_active)
VALUES (NULL, 'superadmin', 'superadmin@ghslms.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Platform', 'Super Administrator', '+233 30 000 0000', 1, 1);

-- Get user_id (works whether INSERT happened or was ignored)
SET @superadmin_user_id = LAST_INSERT_ID();
SET @superadmin_user_id = IF(@superadmin_user_id = 0,
    (SELECT user_id FROM users WHERE username = 'superadmin' LIMIT 1),
    @superadmin_user_id);

SET @superadmin_role_id = (SELECT role_id FROM roles WHERE role_name = 'super_admin' LIMIT 1);

INSERT IGNORE INTO user_roles (user_id, role_id) 
VALUES (@superadmin_user_id, @superadmin_role_id);

-- =========================================
-- CREATE SAMPLE GHANA SHS INSTITUTION
-- =========================================

INSERT IGNORE INTO institutions (
    institution_code, 
    institution_name, 
    institution_type,
    email, 
    phone, 
    address,
    city,
    state,
    country,
    postal_code,
    website,
    status,
    subscription_plan,
    subscription_expires_at,
    max_students,
    max_teachers
) VALUES (
    'ACCRA-SHS-001',
    'Accra Senior High School',
    'shs',
    'admin@accrashs.edu.gh',
    '+233 30 222 1234',
    'P.O. Box 123, Accra',
    'Accra',
    'Greater Accra',
    'Ghana',
    'GA-123-4567',
    'https://www.accrashs.edu.gh',
    'active',
    'premium',
    '2026-12-31',
    1500,
    100
);

-- Get institution_id (works whether INSERT happened or was ignored)
SET @institution_id = LAST_INSERT_ID();
SET @institution_id = IF(@institution_id = 0, 
    (SELECT institution_id FROM institutions WHERE institution_code = 'ACCRA-SHS-001' LIMIT 1), 
    @institution_id);

-- =========================================
-- CREATE INSTITUTION SETTINGS
-- =========================================

INSERT INTO institution_settings (
    institution_id,
    school_name,
    motto,
    description,
    vision,
    mission,
    logo_url,
    theme_primary_color,
    theme_secondary_color,
    timezone,
    academic_year_start_month,
    academic_year_end_month,
    grading_system,
    locale,
    currency,
    date_format,
    time_format,
    allow_parent_registration,
    allow_student_self_enrollment,
    require_email_verification
) VALUES (
    @institution_id,
    'Accra Senior High School',
    'Excellence Through Knowledge',
    'A leading Senior High School in Accra, Ghana, committed to academic excellence and holistic development.',
    'To be the premier institution for secondary education in Ghana, producing well-rounded graduates.',
    'To provide quality education that empowers students to excel academically and contribute positively to society.',
    '/uploads/institutions/accra-shs/logo.png',
    '#006B3F', -- Ghana flag green
    '#FCD116', -- Ghana flag gold
    'Africa/Accra',
    9, -- September
    6, -- June
    'ghana_waec', -- Ghana WAEC grading system
    'en_GH',
    'GHS',
    'Y-m-d',
    'H:i:s',
    1,
    0,
    1
);

-- =========================================
-- CREATE GHANA GRADING SCALE (A1 - F9)
-- =========================================

INSERT INTO grade_scales (institution_id, grade, min_score, max_score, grade_point, remark) VALUES
(@institution_id, 'A1', 80.00, 100.00, 4.00, 'Excellent'),
(@institution_id, 'B2', 70.00, 79.99, 3.50, 'Very Good'),
(@institution_id, 'B3', 65.00, 69.99, 3.00, 'Good'),
(@institution_id, 'C4', 60.00, 64.99, 2.50, 'Credit'),
(@institution_id, 'C5', 55.00, 59.99, 2.00, 'Credit'),
(@institution_id, 'C6', 50.00, 54.99, 1.50, 'Credit'),
(@institution_id, 'D7', 45.00, 49.99, 1.00, 'Pass'),
(@institution_id, 'E8', 40.00, 44.99, 0.50, 'Pass'),
(@institution_id, 'F9', 0.00, 39.99, 0.00, 'Fail');

-- =========================================
-- CREATE ACADEMIC YEAR AND SEMESTERS
-- =========================================

INSERT INTO academic_years (institution_id, year_name, start_date, end_date, is_current)
VALUES (@institution_id, '2024-2025', '2024-09-01', '2025-06-30', 1);

SET @academic_year_id = LAST_INSERT_ID();

INSERT INTO semesters (institution_id, academic_year_id, semester_name, start_date, end_date, is_current) VALUES
(@institution_id, @academic_year_id, 'First Semester', '2024-09-01', '2024-12-20', 1),
(@institution_id, @academic_year_id, 'Second Semester', '2025-01-06', '2025-04-15', 0);

SET @semester1_id = (SELECT semester_id FROM semesters WHERE semester_name = 'First Semester' AND academic_year_id = @academic_year_id LIMIT 1);

-- =========================================
-- CREATE GHANA SHS PROGRAMS
-- =========================================

INSERT INTO programs (institution_id, program_code, program_name, description, duration_years, status) VALUES
(@institution_id, 'GART', 'General Arts', 'General Arts programme focuses on humanities, languages, and social sciences', 3, 'active'),
(@institution_id, 'GSCI', 'General Science', 'General Science programme focuses on pure sciences and mathematics', 3, 'active'),
(@institution_id, 'BUS', 'Business', 'Business programme focuses on commerce, accounting, and economics', 3, 'active');

SET @program_arts_id = (SELECT program_id FROM programs WHERE program_code = 'GART' AND institution_id = @institution_id LIMIT 1);
SET @program_science_id = (SELECT program_id FROM programs WHERE program_code = 'GSCI' AND institution_id = @institution_id LIMIT 1);

-- =========================================
-- CREATE GHANA SHS GRADE LEVELS
-- =========================================

INSERT INTO grade_levels (institution_id, grade_level_code, grade_level_name, level_order, description, status) VALUES
(@institution_id, 'SHS1', 'SHS 1', 1, 'Senior High School Year 1', 'active'),
(@institution_id, 'SHS2', 'SHS 2', 2, 'Senior High School Year 2', 'active'),
(@institution_id, 'SHS3', 'SHS 3', 3, 'Senior High School Year 3', 'active');

SET @grade_level_1_id = (SELECT grade_level_id FROM grade_levels WHERE grade_level_code = 'SHS1' AND institution_id = @institution_id LIMIT 1);
SET @grade_level_2_id = (SELECT grade_level_id FROM grade_levels WHERE grade_level_code = 'SHS2' AND institution_id = @institution_id LIMIT 1);
SET @grade_level_3_id = (SELECT grade_level_id FROM grade_levels WHERE grade_level_code = 'SHS3' AND institution_id = @institution_id LIMIT 1);

-- =========================================
-- CREATE GHANA SHS SUBJECTS
-- =========================================

-- Core Subjects (Mandatory for all students)
INSERT INTO subjects (institution_id, subject_code, subject_name, description, credits, is_core) VALUES
(@institution_id, 'CORE-ENG', 'Core English', 'English Language - Core Subject', 4, 1),
(@institution_id, 'CORE-MATH', 'Core Mathematics', 'Mathematics - Core Subject', 4, 1),
(@institution_id, 'CORE-SCI', 'Integrated Science', 'Science - Core Subject', 3, 1),
(@institution_id, 'CORE-SOC', 'Social Studies', 'Social Studies - Core Subject', 2, 1);

-- General Arts Electives
INSERT INTO subjects (institution_id, subject_code, subject_name, description, credits, is_core) VALUES
(@institution_id, 'ELEC-LIT', 'Literature in English', 'Elective Literature', 3, 0),
(@institution_id, 'ELEC-HIST', 'History', 'Elective History', 3, 0),
(@institution_id, 'ELEC-GEOG', 'Geography', 'Elective Geography', 3, 0),
(@institution_id, 'ELEC-CRS', 'Christian Religious Studies', 'Elective CRS', 3, 0),
(@institution_id, 'ELEC-ECON', 'Economics', 'Elective Economics', 3, 0);

-- General Science Electives
INSERT INTO subjects (institution_id, subject_code, subject_name, description, credits, is_core) VALUES
(@institution_id, 'ELEC-BIO', 'Elective Biology', 'Biology - Science Elective', 4, 0),
(@institution_id, 'ELEC-CHEM', 'Elective Chemistry', 'Chemistry - Science Elective', 4, 0),
(@institution_id, 'ELEC-PHYS', 'Elective Physics', 'Physics - Science Elective', 4, 0),
(@institution_id, 'ELEC-EMATH', 'Elective Mathematics', 'Advanced Mathematics', 4, 0);

-- Business/Technical Electives
INSERT INTO subjects (institution_id, subject_code, subject_name, description, credits, is_core) VALUES
(@institution_id, 'ELEC-ACC', 'Financial Accounting', 'Elective Accounting', 3, 0),
(@institution_id, 'ELEC-BUS', 'Business Management', 'Elective Business', 3, 0),
(@institution_id, 'ELEC-ICT', 'Information Technology', 'ICT Elective', 3, 0);

-- =========================================
-- CREATE HOMEROOM CLASSES
-- =========================================

-- SHS 1 General Arts Class 1
INSERT INTO classes (institution_id, program_id, grade_level_id, class_code, class_name, section, academic_year_id, max_students, status)
VALUES (@institution_id, @program_arts_id, @grade_level_1_id, '1ART1', 'SHS 1 Art 1', 'A', @academic_year_id, 40, 'active');

SET @class_1art1_id = LAST_INSERT_ID();

-- SHS 1 General Science Class 2
INSERT INTO classes (institution_id, program_id, grade_level_id, class_code, class_name, section, academic_year_id, max_students, status)
VALUES (@institution_id, @program_science_id, @grade_level_1_id, '1SCI2', 'SHS 1 Science 2', 'B', @academic_year_id, 40, 'active');

SET @class_1sci2_id = LAST_INSERT_ID();

-- =========================================
-- CREATE ADMIN USER
-- =========================================

-- Admin user
-- Username: admin
-- Password: password
INSERT INTO users (institution_id, username, email, password_hash, first_name, last_name, phone_number, is_active)
VALUES (@institution_id, 'admin', 'admin@accrashs.edu.gh', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'System', 'Administrator', '+233 24 000 0000', 1);

SET @admin_user_id = LAST_INSERT_ID();
SET @admin_role_id = (SELECT role_id FROM roles WHERE role_name = 'admin' LIMIT 1);

INSERT INTO user_roles (user_id, role_id) 
VALUES (@admin_user_id, @admin_role_id);

-- =========================================
-- CREATE TEACHER USERS
-- =========================================

-- Teacher 1: Kofi Mensah (English Teacher - General Arts)
-- Username: kofi.mensah
-- Password: password
INSERT INTO users (institution_id, username, email, password_hash, first_name, last_name, phone_number, is_active)
VALUES (@institution_id, 'kofi.mensah', 'kofi.mensah@accrashs.edu.gh', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Kofi', 'Mensah', '+233 24 111 1111', 1);

SET @teacher1_user_id = LAST_INSERT_ID();
SET @teacher_role_id = (SELECT role_id FROM roles WHERE role_name = 'teacher' LIMIT 1);

INSERT INTO user_roles (user_id, role_id) 
VALUES (@teacher1_user_id, @teacher_role_id);

INSERT INTO teachers (institution_id, user_id, employee_id, department, specialization, hire_date)
VALUES (@institution_id, @teacher1_user_id, 'EMP-2024-00001', 'Languages', 'English Language', '2020-09-01');

SET @teacher1_id = LAST_INSERT_ID();

-- Teacher 2: Ama Asante (Biology Teacher - General Science)
-- Username: ama.asante
-- Password: password
INSERT INTO users (institution_id, username, email, password_hash, first_name, last_name, phone_number, is_active)
VALUES (@institution_id, 'ama.asante', 'ama.asante@accrashs.edu.gh', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Ama', 'Asante', '+233 24 222 2222', 1);

SET @teacher2_user_id = LAST_INSERT_ID();

INSERT INTO user_roles (user_id, role_id) 
VALUES (@teacher2_user_id, @teacher_role_id);

INSERT INTO teachers (institution_id, user_id, employee_id, department, specialization, hire_date)
VALUES (@institution_id, @teacher2_user_id, 'EMP-2024-00002', 'Sciences', 'Biology', '2021-09-01');

SET @teacher2_id = LAST_INSERT_ID();

-- =========================================
-- CREATE STUDENT USERS
-- =========================================

-- Student 1: Kwame Osei (General Science - SHS 1)
-- Username: kwame.osei
-- Password: password
INSERT INTO users (institution_id, username, email, password_hash, first_name, last_name, phone_number, date_of_birth, is_active)
VALUES (@institution_id, 'kwame.osei', 'kwame.osei@student.accrashs.edu.gh', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Kwame', 'Osei', '+233 24 333 3333', '2009-03-15', 1);

SET @student1_user_id = LAST_INSERT_ID();
SET @student_role_id = (SELECT role_id FROM roles WHERE role_name = 'student' LIMIT 1);

INSERT INTO user_roles (user_id, role_id) 
VALUES (@student1_user_id, @student_role_id);

INSERT INTO students (institution_id, user_id, class_id, student_id_number, enrollment_date, gender, date_of_birth, status)
VALUES (@institution_id, @student1_user_id, @class_1sci2_id, 'STU-2024-00001', '2024-09-01', 'Male', '2009-03-15', 'active');

SET @student1_id = LAST_INSERT_ID();

-- Student 2: Abena Adjei (General Arts - SHS 1)
-- Username: abena.adjei
-- Password: password
INSERT INTO users (institution_id, username, email, password_hash, first_name, last_name, phone_number, date_of_birth, is_active)
VALUES (@institution_id, 'abena.adjei', 'abena.adjei@student.accrashs.edu.gh', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Abena', 'Adjei', '+233 24 444 4444', '2009-07-22', 1);

SET @student2_user_id = LAST_INSERT_ID();

INSERT INTO user_roles (user_id, role_id) 
VALUES (@student2_user_id, @student_role_id);

INSERT INTO students (institution_id, user_id, class_id, student_id_number, enrollment_date, gender, date_of_birth, status)
VALUES (@institution_id, @student2_user_id, @class_1art1_id, 'STU-2024-00002', '2024-09-01', 'Female', '2009-07-22', 'active');

SET @student2_id = LAST_INSERT_ID();

-- =========================================
-- CREATE PARENT USER
-- =========================================

-- Parent: Yaw Osei (Parent of Kwame Osei - Student 1)
-- Username: yaw.osei
-- Password: password
USE lms;

SET @institution_id = 1;
SET @student1_id = (SELECT student_id FROM students WHERE student_id_number = 'STU-2024-00001' LIMIT 1);
SET @parent_role_id = (SELECT role_id FROM roles WHERE role_name = 'parent' LIMIT 1);

INSERT INTO users (institution_id, username, email, password_hash, first_name, last_name, phone_number, is_active)
VALUES (@institution_id, 'yaw.osei', 'yaw.osei@parent.accrashs.edu.gh', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Yaw', 'Osei', '+233 24 555 5555', 1);

SET @parent_user_id = LAST_INSERT_ID();

INSERT INTO user_roles (user_id, role_id) VALUES (@parent_user_id, @parent_role_id);

INSERT INTO parents (institution_id, user_id, email, phone_number, address, occupation)
VALUES (@institution_id, @parent_user_id, 'yaw.osei@parent.accrashs.edu.gh', '+233 24 555 5555', 'Accra, Ghana', 'Engineer');

SET @parent_id = LAST_INSERT_ID();

INSERT INTO parent_students (parent_id, student_id, relationship_type, is_primary_contact, can_pickup)
VALUES (@parent_id, @student1_id, 'Father', 1, 1);

-- =========================================
-- CREATE CLASS SUBJECTS (Teaching Instances)
-- =========================================

SET @english_subject_id = (SELECT subject_id FROM subjects WHERE subject_code = 'CORE-ENG' LIMIT 1);
SET @biology_subject_id = (SELECT subject_id FROM subjects WHERE subject_code = 'ELEC-BIO' LIMIT 1);

-- Class Subject 1: Core English taught to SHS 1 Art 1
INSERT INTO class_subjects (
    institution_id,
    class_id,
    subject_id,
    teacher_id,
    academic_year_id,
    semester_id,
    duration_weeks, 
    start_date, 
    end_date, 
    status
)
VALUES (
    @institution_id,
    @class_1art1_id,
    @english_subject_id,
    @teacher1_id,
    @academic_year_id,
    @semester1_id,
    14,
    '2024-09-01',
    '2024-12-20',
    'active'
);

SET @class_subject1_id = LAST_INSERT_ID();

-- Class Subject 2: Elective Biology taught to SHS 1 Science 2
INSERT INTO class_subjects (
    institution_id,
    class_id,
    subject_id,
    teacher_id,
    academic_year_id,
    semester_id,
    duration_weeks, 
    start_date, 
    end_date, 
    status
)
VALUES (
    @institution_id,
    @class_1sci2_id,
    @biology_subject_id,
    @teacher2_id,
    @academic_year_id,
    @semester1_id,
    14,
    '2024-09-01',
    '2024-12-20',
    'active'
);

SET @class_subject2_id = LAST_INSERT_ID();

-- =========================================
-- ENROLL STUDENTS IN CLASS SUBJECTS
-- =========================================

-- Enroll Kwame (Science student) in Biology class subject
INSERT INTO course_enrollments (student_id, course_id, enrollment_date, status, progress_percentage)
VALUES (@student1_id, @class_subject2_id, '2024-09-01', 'active', 0.00);

-- Enroll Abena (Arts student) in English class subject
INSERT INTO course_enrollments (student_id, course_id, enrollment_date, status, progress_percentage)
VALUES (@student2_id, @class_subject1_id, '2024-09-01', 'active', 0.00);

-- =========================================
-- CREATE SAMPLE ASSESSMENT
-- =========================================

INSERT INTO assessments (course_id, title, description, assessment_type, max_score, passing_score, due_date, is_published)
VALUES (
    @class_subject2_id,
    'Mid-Semester Biology Test',
    'Covers cell biology and genetics topics',
    'exam',
    100.00,
    50.00,
    '2024-11-15 10:00:00',
    1
);

-- =========================================
-- CREATE COURSE SECTIONS (Biology Class Subject)
-- =========================================

INSERT INTO course_sections (course_id, section_name, description, order_index, is_active, created_by)
VALUES 
    (@class_subject2_id, 'Week 1: Introduction to Biology', 'Basic concepts of living organisms and cells', 1, 1, @teacher2_user_id),
    (@class_subject2_id, 'Week 2: Cell Structure', 'Understanding cell components and functions', 2, 1, @teacher2_user_id),
    (@class_subject2_id, 'Week 3: Genetics', 'Introduction to heredity and DNA', 3, 1, @teacher2_user_id);

SET @section1_id = (SELECT course_sections_id FROM course_sections WHERE course_id = @class_subject2_id AND order_index = 1 LIMIT 1);
SET @section2_id = (SELECT course_sections_id FROM course_sections WHERE course_id = @class_subject2_id AND order_index = 2 LIMIT 1);

-- =========================================
-- CREATE COURSE MATERIALS (Biology)
-- =========================================

INSERT INTO course_materials (course_id, section_id, title, description, material_type, file_name, file_path, is_required, is_active, uploaded_by, status)
VALUES 
    (@class_subject2_id, @section1_id, 'Biology Syllabus 2024-2025', 'Complete course outline for SHS 1 Biology', 'pdf', 'biology-syllabus.pdf', '/uploads/courses/bio-1sci2/syllabus.pdf', 1, 1, @teacher2_user_id, 'active'),
    (@class_subject2_id, @section1_id, 'Introduction to Living Organisms', 'Video lecture on characteristics of life', 'video', 'living-organisms.mp4', '/uploads/courses/bio-1sci2/living-organisms.mp4', 1, 1, @teacher2_user_id, 'active'),
    (@class_subject2_id, @section2_id, 'Cell Structure Guide', 'Detailed notes on cell organelles', 'pdf', 'cell-structure.pdf', '/uploads/courses/bio-1sci2/cell-structure.pdf', 1, 1, @teacher2_user_id, 'active');

-- =========================================
-- CREATE ASSIGNMENT (Biology)
-- =========================================

INSERT INTO assignments (course_id, section_id, title, description, max_score, passing_score, rubric, submission_type, due_date, status)
VALUES (
    @class_subject2_id,
    @section2_id,
    'Cell Diagram and Functions',
    'Draw and label a plant cell diagram, explaining the function of each organelle',
    50.00,
    25.00,
    'Criteria:\n- Accurate diagram (15 pts)\n- Correct labels (15 pts)\n- Clear explanations (15 pts)\n- Presentation (5 pts)',
    'both',
    '2024-09-22 23:59:59',
    'active'
);

SET @assignment_id = LAST_INSERT_ID();

-- =========================================
-- CREATE QUIZ (Biology)
-- =========================================

INSERT INTO quizzes (course_id, section_id, title, description, duration_minutes, max_attempts, status, quiz_type, is_activated, show_results, start_date, end_date)
VALUES (
    @class_subject2_id,
    @section2_id,
    'Cell Biology Quiz',
    'Test your knowledge on cell structure and functions',
    45,
    2,
    'active',
    'graded',
    1,
    'after_end',
    '2024-09-23 08:00:00',
    '2024-09-30 23:59:59'
);

SET @quiz_id = LAST_INSERT_ID();

-- =========================================
-- CREATE QUIZ QUESTIONS (Biology)
-- =========================================

-- Question 1: Multiple Choice
INSERT INTO quiz_questions (quiz_id, question_text, question_type, points, difficulty, explanation, order_index)
VALUES (
    @quiz_id,
    'Which organelle is known as the "powerhouse of the cell"?',
    'multiple_choice',
    5,
    'easy',
    'Mitochondria generate ATP through cellular respiration.',
    1
);

SET @question1_id = LAST_INSERT_ID();

INSERT INTO quiz_question_options (question_id, option_label, option_text, is_correct)
VALUES 
    (@question1_id, 'A', 'Nucleus', 0),
    (@question1_id, 'B', 'Mitochondria', 1),
    (@question1_id, 'C', 'Ribosome', 0),
    (@question1_id, 'D', 'Chloroplast', 0);

-- Question 2: True/False
INSERT INTO quiz_questions (quiz_id, question_text, question_type, points, difficulty, explanation, correct_answer, order_index)
VALUES (
    @quiz_id,
    'Plant cells have cell walls while animal cells do not.',
    'true_false',
    3,
    'easy',
    'Plant cells have rigid cell walls made of cellulose, which animal cells lack.',
    'True',
    2
);

SET @question2_id = LAST_INSERT_ID();

INSERT INTO quiz_question_options (question_id, option_label, option_text, is_correct)
VALUES 
    (@question2_id, 'T', 'True', 1),
    (@question2_id, 'F', 'False', 0);

-- Question 3: Multiple Choice
INSERT INTO quiz_questions (quiz_id, question_text, question_type, points, difficulty, explanation, order_index)
VALUES (
    @quiz_id,
    'What is the function of the cell membrane?',
    'multiple_choice',
    5,
    'medium',
    'The cell membrane controls what enters and exits the cell, acting as a selective barrier.',
    3
);

SET @question3_id = LAST_INSERT_ID();

INSERT INTO quiz_question_options (question_id, option_label, option_text, is_correct)
VALUES 
    (@question3_id, 'A', 'Protein synthesis', 0),
    (@question3_id, 'B', 'Controls what enters and exits the cell', 1),
    (@question3_id, 'C', 'Energy production', 0),
    (@question3_id, 'D', 'Photosynthesis', 0);

-- =========================================
-- CREATE SAMPLE ASSIGNMENT SUBMISSION
-- =========================================

INSERT INTO assignment_submissions (assignment_id, student_id, course_id, submission_text, submission_file, status, submitted_at)
VALUES (
    @assignment_id,
    @student1_id,
    @class_subject2_id,
    'Plant Cell Diagram:\nNucleus - Controls cell activities\nMitochondria - Energy production\nChloroplast - Photosynthesis\nCell Wall - Protection and support\nVacuole - Storage',
    '/uploads/submissions/kwame_cell_diagram.pdf',
    'submitted',
    '2024-09-21 16:30:00'
);

-- =========================================
-- CREATE SAMPLE QUIZ SUBMISSION
-- =========================================

INSERT INTO quiz_submissions (quiz_id, student_id, attempt, score, max_score, status, duration_minutes, submitted_at)
VALUES (
    @quiz_id,
    @student1_id,
    1,
    13.00,
    13.00,
    'completed',
    35,
    '2024-09-24 10:30:00'
);

SET @quiz_submission_id = LAST_INSERT_ID();

-- Record student's answers
INSERT INTO quiz_submission_answers (submission_id, question_id, answer, is_correct, points_earned)
VALUES 
    (@quiz_submission_id, @question1_id, 'B', 1, 5.00),
    (@quiz_submission_id, @question2_id, 'True', 1, 3.00),
    (@quiz_submission_id, @question3_id, 'B', 1, 5.00);

-- =========================================
-- DISPLAY CREATED ACCOUNTS
-- =========================================

SELECT 
    u.user_id,
    u.username,
    u.email,
    u.first_name,
    u.last_name,
    GROUP_CONCAT(r.role_name ORDER BY r.role_name SEPARATOR ', ') as roles,
    'password' as default_password,
    u.is_active
FROM users u
LEFT JOIN user_roles ur ON u.user_id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.role_id
WHERE u.deleted_at IS NULL
GROUP BY u.user_id
ORDER BY u.user_id;

-- =========================================
-- CONFIRMATION MESSAGE
-- =========================================

SELECT 
    'Ghana SHS LMS API Setup Completed!' as status,
    '1 platform super admin created' as super_admin,
    '1 institution created (Accra SHS)' as institution,
    'Ghana WAEC grading scale (A1-F9)' as grading,
    '6 institution users (1 admin, 2 teachers, 2 students, 1 parent)' as users,
    '3 programs (General Arts, Science, Business)' as programs,
    '3 grade levels (SHS 1, 2, 3)' as grade_levels,
    '2 homeroom classes (1 Art 1, 1 Science 2)' as classes,
    '15 subjects (4 core + 11 electives)' as subjects,
    '2 class subjects created (English, Biology)' as class_subjects,
    '3 course sections per class subject' as sections,
    '3 course materials uploaded' as materials,
    '1 assignment created' as assignments,
    '1 quiz with 3 questions created' as quizzes,
    '2 students enrolled in classes' as class_enrollments,
    '2 students enrolled in class subjects' as subject_enrollments,
    '2 student submissions (quiz + assignment)' as submissions;

SELECT 
    '=== LOGIN CREDENTIALS (Ghana SHS) ===' as info UNION ALL
SELECT '' UNION ALL
SELECT '>>> PLATFORM SUPER ADMIN (Manages ALL Schools):' UNION ALL
SELECT 'Super Admin:     username=superadmin    | password=password | email=superadmin@ghslms.com' UNION ALL
SELECT '' UNION ALL
SELECT '>>> ACCRA SHS INSTITUTION USERS:' UNION ALL
SELECT 'Admin:           username=admin         | password=password | email=admin@accrashs.edu.gh' UNION ALL
SELECT 'Teacher (Kofi):  username=kofi.mensah   | password=password | email=kofi.mensah@accrashs.edu.gh' UNION ALL
SELECT 'Teacher (Ama):   username=ama.asante    | password=password | email=ama.asante@accrashs.edu.gh' UNION ALL
SELECT 'Student (Kwame): username=kwame.osei    | password=password | email=kwame.osei@student.accrashs.edu.gh' UNION ALL
SELECT 'Student (Abena): username=abena.adjei   | password=password | email=abena.adjei@student.accrashs.edu.gh' UNION ALL
SELECT 'Parent (Yaw):    username=yaw.osei      | password=password | email=yaw.osei@parent.accrashs.edu.gh';
