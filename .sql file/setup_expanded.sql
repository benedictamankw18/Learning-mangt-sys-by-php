-- =========================================
-- LMS API - EXPANDED Setup Script with 5+ entries per table
-- Run this AFTER importing database_lms_api.sql
-- Ghana Senior High School (SHS) System
-- =========================================

USE lms;

SET FOREIGN_KEY_CHECKS=0;

-- =========================================
-- CLEAR EXISTING DATA (Optional - Uncomment to reset)
-- =========================================
DELETE FROM quiz_submission_answers;
DELETE FROM quiz_submissions;
DELETE FROM quiz_question_options;
DELETE FROM quiz_questions;
DELETE FROM quizzes;
DELETE FROM assignment_submissions;
DELETE FROM assignments;
DELETE FROM assessment_submissions;
DELETE FROM assessments;
DELETE FROM course_materials;
DELETE FROM course_sections;
DELETE FROM course_content_order;
DELETE FROM course_content;
DELETE FROM course_schedules;
DELETE FROM course_reviews;
DELETE FROM course_enrollments;
DELETE FROM class_subjects;
DELETE FROM attendance;
DELETE FROM teacher_subjects;
DELETE FROM grade_report_details;
DELETE FROM grade_reports;
DELETE FROM parent_students;
DELETE FROM parents;
DELETE FROM students;
DELETE FROM teachers;
DELETE FROM messages;
DELETE FROM notifications;
DELETE FROM events;
DELETE FROM announcements;
DELETE FROM user_activity;
DELETE FROM login_activity;
DELETE FROM error_logs;
DELETE FROM user_roles;
DELETE FROM users WHERE is_super_admin = 0;
DELETE FROM classes;
DELETE FROM programs;
DELETE FROM semesters;
DELETE FROM academic_years;
DELETE FROM subjects;
DELETE FROM grade_levels;
DELETE FROM grade_scales;
DELETE FROM assessment_categories;
DELETE FROM institution_settings;
DELETE FROM institutions;
DELETE FROM system_settings;
DELETE FROM role_permissions WHERE role_id > 5;
DELETE FROM permissions WHERE permission_id > 8;
DELETE FROM roles WHERE role_id > 5;

-- =========================================
-- ROLES (5 entries)
-- =========================================
INSERT IGNORE INTO roles (role_name, description) VALUES
('super_admin', 'Platform Super Administrator - Manages all institutions'),
('admin', 'Institution Administrator - Manages single institution'),
('teacher', 'Teacher/Instructor'),
('student', 'Student'),
('parent', 'Parent/Guardian');

-- =========================================
-- PERMISSIONS (10+ entries)
-- =========================================
INSERT IGNORE INTO permissions (permission_name, description) VALUES
('manage_institutions', 'Create, update, delete institutions (Super Admin only)'),
('manage_subscriptions', 'Manage institution subscriptions (Super Admin only)'),
('view_all_institutions', 'View all institutions on platform (Super Admin only)'),
('manage_users', 'Create, update, delete users'),
('manage_courses', 'Create, update, delete class subjects'),
('manage_assessments', 'Create, update, grade assessments'),
('view_reports', 'View system reports and analytics'),
('manage_attendance', 'Mark and manage attendance'),
('manage_grades', 'Input and modify student grades'),
('view_students', 'View student information'),
('manage_announcements', 'Create and manage announcements'),
('send_messages', 'Send messages to other users');

-- =========================================
-- ROLE PERMISSIONS (Assignments)
-- =========================================
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT 
    (SELECT role_id FROM roles WHERE role_name = 'super_admin'),
    permission_id
FROM permissions;

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT 
    (SELECT role_id FROM roles WHERE role_name = 'admin'),
    permission_id
FROM permissions
WHERE permission_name NOT IN ('manage_institutions', 'manage_subscriptions', 'view_all_institutions');

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT 
    (SELECT role_id FROM roles WHERE role_name = 'teacher'),
    permission_id
FROM permissions
WHERE permission_name IN ('manage_courses', 'manage_assessments', 'manage_attendance', 'manage_grades', 'view_students', 'send_messages');

-- =========================================
-- ASSESSMENT CATEGORIES (5 entries)
-- =========================================
INSERT IGNORE INTO assessment_categories (category_name, weight_percentage, description) VALUES
('Quiz', 15.00, 'Short quizzes and tests'),
('Assignment', 20.00, 'Homework and take-home assignments'),
('Class Work', 10.00, 'In-class activities and participation'),
('Midterm', 25.00, 'Mid-term examination'),
('Final', 30.00, 'Final examination');

-- =========================================
-- GRADE SCALES (Ghana WAEC - 9 entries)
-- =========================================
-- GRADE SCALES (Ghana WAEC - 9 entries)
-- =========================================
INSERT IGNORE INTO grade_scales (institution_id, grade, min_score, max_score, grade_point, remark) VALUES
(NULL, 'A1', 80, 100, 1, 'Excellent'),
(NULL, 'B2', 70, 79, 2, 'Very Good'),
(NULL, 'B3', 65, 69, 3, 'Good'),
(NULL, 'C4', 60, 64, 4, 'Credit'),
(NULL, 'C5', 55, 59, 5, 'Credit'),
(NULL, 'C6', 50, 54, 6, 'Credit'),
(NULL, 'D7', 45, 49, 7, 'Pass'),
(NULL, 'E8', 40, 44, 8, 'Pass'),
(NULL, 'F9', 0, 39, 9, 'Fail');

-- =========================================
-- SYSTEM SETTINGS (JSON structure)
-- =========================================
INSERT INTO system_settings (settings_id, settings, updated_at) VALUES
(1, '{
    "site_name": "Ghana SHS LMS",
    "site_url": "https://ghanashslms.edu.gh",
    "app_version": "1.0.0",
    "timezone": "Africa/Accra",
    "default_language": "en",
    "date_format": "Y-m-d",
    "time_format": "H:i:s",
    "max_upload_size": "10485760",
    "session_timeout": "3600",
    "allow_registration": 1,
    "require_verification": 1,
    "smtp_host": "smtp.ghanashslms.edu.gh",
    "smtp_port": 587,
    "smtp_username": "noreply@ghanashslms.edu.gh",
    "from_address": "noreply@ghanashslms.edu.gh",
    "from_name": "Ghana SHS LMS",
    "enable_notifications": 1,
    "enable_email_notifications": 1,
    "enable_sms_notifications": 0,
    "maintenance_mode": 0,
    "ga_id": "",
    "integrations_note": "",
    "updated_at": "2024-09-01 08:00:00"
}', '2024-09-01 08:00:00')
ON DUPLICATE KEY UPDATE 
    settings = VALUES(settings),
    updated_at = VALUES(updated_at);

-- =========================================
-- PLATFORM SUPER ADMIN
-- =========================================
INSERT IGNORE INTO users (uuid, institution_id, username, email, password_hash, first_name, last_name, phone_number, is_super_admin, is_active)
VALUES (UUID(), NULL, 'superadmin', 'superadmin@ghslms.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Platform', 'Super Administrator', '+233 30 000 0000', 1, 1);

SET @superadmin_user_id = LAST_INSERT_ID();
SET @superadmin_user_id = IF(@superadmin_user_id = 0, (SELECT user_id FROM users WHERE username = 'superadmin' LIMIT 1), @superadmin_user_id);

SET @superadmin_role_id = (SELECT role_id FROM roles WHERE role_name = 'super_admin' LIMIT 1);

INSERT IGNORE INTO user_roles (user_id, role_id) 
VALUES (@superadmin_user_id, @superadmin_role_id);

-- =========================================
-- INSTITUTIONS (5 entries)
-- =========================================
INSERT INTO institutions (uuid, institution_code, institution_name, institution_type, email, phone, address, city, state, country, status)
VALUES 
(UUID(), 'ACCRASHS', 'Accra Senior High School', 'shs', 'info@accrashs.edu.gh', '+233 30 222 1111', 'Independence Avenue', 'Accra', 'Greater Accra', 'Ghana', 'active'),
(UUID(), 'KUMASHS', 'Kumasi Senior High School', 'shs', 'info@kumashs.edu.gh', '+233 32 222 2222', 'Asafo Road', 'Kumasi', 'Ashanti', 'Ghana', 'active'),
(UUID(), 'CCASHS', 'Cape Coast Senior High School', 'shs', 'info@ccashs.edu.gh', '+233 33 222 3333', 'Commercial Road', 'Cape Coast', 'Central', 'Ghana', 'active'),
(UUID(), 'TAMASHS', 'Tamale Senior High School', 'shs', 'info@tamashs.edu.gh', '+233 37 222 4444', 'Hospital Road', 'Tamale', 'Northern', 'Ghana', 'active'),
(UUID(), 'HOSHS', 'Ho Senior High School', 'shs', 'info@hoshs.edu.gh', '+233 36 222 5555', 'Volta Street', 'Ho', 'Volta', 'Ghana', 'active');

SET @institution_id = 1;
SET @institution2_id = 2;
SET @institution3_id = 3;
SET @institution4_id = 4;
SET @institution5_id = 5;

-- =========================================
-- INSTITUTION SETTINGS (5 entries - one per institution)
-- =========================================
INSERT INTO institution_settings (
    institution_id, school_name, motto, description, vision, mission,
    logo_url, theme_primary_color, theme_secondary_color, timezone,
    academic_year_start_month, academic_year_end_month, grading_system,
    locale, currency, date_format, time_format,
    allow_parent_registration, allow_student_self_enrollment, require_email_verification
)
VALUES 
(
    @institution_id, 
    'Accra Senior High School', 
    'Excellence Through Knowledge',
    'A leading Senior High School in Accra, Ghana, committed to academic excellence and holistic development.',
    'To be the premier institution for secondary education in Ghana, producing well-rounded graduates.',
    'To provide quality education that empowers students to excel academically and contribute positively to society.',
    '/uploads/institutions/accra-shs/logo.png',
    '#006B3F', '#FCD116', 'Africa/Accra',
    9, 6, 'ghana_waec',
    'en_GH', 'GHS', 'Y-m-d', 'H:i:s',
    1, 0, 1
),
(
    @institution2_id,
    'Kumasi Senior High School',
    'Knowledge is Power',
    'Premier institution in the Ashanti Region dedicated to nurturing future leaders.',
    'To be recognized as a center of excellence in secondary education across West Africa.',
    'Empowering students with knowledge, skills, and character for global competitiveness.',
    '/uploads/institutions/kumasi-shs/logo.png',
    '#C8102E', '#FCD116', 'Africa/Accra',
    9, 6, 'ghana_waec',
    'en_GH', 'GHS', 'Y-m-d', 'H:i:s',
    1, 0, 1
),
(
    @institution3_id,
    'Cape Coast Senior High School',
    'Discipline and Hard Work',
    'Historic institution in Cape Coast fostering academic excellence since establishment.',
    'To maintain our legacy of excellence while embracing modern educational practices.',
    'Developing disciplined, hardworking students who excel in all spheres of life.',
    '/uploads/institutions/capecoast-shs/logo.png',
    '#0047AB', '#FFFFFF', 'Africa/Accra',
    9, 6, 'ghana_waec',
    'en_GH', 'GHS', 'Y-m-d', 'H:i:s',
    1, 0, 1
),
(
    @institution4_id,
    'Tamale Senior High School',
    'Service and Dedication',
    'Leading the way in quality education in Northern Ghana.',
    'To be the educational beacon of Northern Ghana, inspiring excellence.',
    'Providing comprehensive education that prepares students for leadership and service.',
    '/uploads/institutions/tamale-shs/logo.png',
    '#228B22', '#FFD700', 'Africa/Accra',
    9, 6, 'ghana_waec',
    'en_GH', 'GHS', 'Y-m-d', 'H:i:s',
    1, 0, 1
),
(
    @institution5_id,
    'Ho Senior High School',
    'Unity and Progress',
    'Excellence in education for the Volta Region and beyond.',
    'To cultivate a community of learners committed to excellence and innovation.',
    'Nurturing talents and building character for national development.',
    '/uploads/institutions/ho-shs/logo.png',
    '#006400', '#FFFFFF', 'Africa/Accra',
    9, 6, 'ghana_waec',
    'en_GH', 'GHS', 'Y-m-d', 'H:i:s',
    1, 0, 1
);

-- =========================================
-- ACADEMIC YEARS (5 entries)
-- =========================================
INSERT INTO academic_years (institution_id, year_name, start_date, end_date, is_current)
VALUES 
(@institution_id, '2024-2025', '2024-09-01', '2025-06-30', 1),
(@institution_id, '2023-2024', '2023-09-01', '2024-06-30', 0),
(@institution_id, '2022-2023', '2022-09-01', '2023-06-30', 0),
(@institution_id, '2021-2022', '2021-09-01', '2022-06-30', 0),
(@institution_id, '2020-2021', '2020-09-01', '2021-06-30', 0);

SET @academic_year_id = (SELECT academic_year_id FROM academic_years WHERE year_name = '2024-2025' AND institution_id = @institution_id LIMIT 1);

-- =========================================
-- SEMESTERS (6 entries - 3 per year for 2 years)
-- =========================================
INSERT INTO semesters (institution_id, academic_year_id, semester_name, start_date, end_date, is_current)
VALUES 
(@institution_id, @academic_year_id, 'First Term', '2024-09-01', '2024-12-20', 1),
(@institution_id, @academic_year_id, 'Second Term', '2025-01-06', '2025-04-10', 0),
(@institution_id, @academic_year_id, 'Third Term', '2025-04-28', '2025-06-30', 0),
(@institution_id, @academic_year_id - 1, 'FirstTerm', '2023-09-01', '2023-12-20', 0),
(@institution_id, @academic_year_id - 1, 'Second Term', '2024-01-08', '2024-04-12', 0),
(@institution_id, @academic_year_id - 1, 'Third Term', '2024-04-29', '2024-06-28', 0);

SET @semester1_id = (SELECT semester_id FROM semesters WHERE semester_name = 'First Term' AND academic_year_id = @academic_year_id LIMIT 1);

-- =========================================
-- GRADE LEVELS (6 entries - SHS 1, 2, 3 for 2 institutions)
-- =========================================
INSERT INTO grade_levels (institution_id, grade_level_name, grade_level_code, level_order, description)
VALUES 
(@institution_id, 'SHS 1', 'SHS1', 1, 'Senior High School Year 1'),
(@institution_id, 'SHS 2', 'SHS2', 2, 'Senior High School Year 2'),
(@institution_id, 'SHS 3', 'SHS3', 3, 'Senior High School Year 3'),
(@institution2_id, 'SHS 1', 'SHS1', 1, 'Senior High School Year 1'),
(@institution2_id, 'SHS 2', 'SHS2', 2, 'Senior High School Year 2'),
(@institution2_id, 'SHS 3', 'SHS3', 3, 'Senior High School Year 3');

SET @shs1_level_id = (SELECT grade_level_id FROM grade_levels WHERE grade_level_code = 'SHS1' AND institution_id = @institution_id LIMIT 1);
SET @shs2_level_id = (SELECT grade_level_id FROM grade_levels WHERE grade_level_code = 'SHS2' AND institution_id = @institution_id LIMIT 1);
SET @shs3_level_id = (SELECT grade_level_id FROM grade_levels WHERE grade_level_code = 'SHS3' AND institution_id = @institution_id LIMIT 1);

-- =========================================
-- PROGRAMS (6 entries)
-- =========================================
INSERT INTO programs (institution_id, program_name, program_code, description, duration_years, status)
VALUES 
(@institution_id, 'General Arts', 'ARTS', 'General Arts Program', 3, 'active'),
(@institution_id, 'General Science', 'SCI', 'General Science Program', 3, 'active'),
(@institution_id, 'Business', 'BUS', 'Business Program', 3, 'active'),
(@institution_id, 'Visual Arts', 'VA', 'Visual Arts Program', 3, 'active'),
(@institution_id, 'Home Economics', 'HOMEC', 'Home Economics Program', 3, 'active'),
(@institution_id, 'Agricultural Science', 'AGRIC', 'Agricultural Science Program', 3, 'active');

SET @arts_program_id = (SELECT program_id FROM programs WHERE program_code = 'ARTS' AND institution_id = @institution_id LIMIT 1);
SET @science_program_id = (SELECT program_id FROM programs WHERE program_code = 'SCI' AND institution_id = @institution_id LIMIT 1);
SET @business_program_id = (SELECT program_id FROM programs WHERE program_code = 'BUS' AND institution_id = @institution_id LIMIT 1);

-- =========================================
-- SUBJECTS (20 entries - Core and Electives)
-- =========================================
INSERT INTO subjects (uuid, institution_id, subject_code, subject_name, description, is_core)
VALUES 
-- Core Subjects (4)
(UUID(), @institution_id, 'ENG', 'English Language', 'Core English Language', 1),
(UUID(), @institution_id, 'MATH-C', 'Mathematics (Core)', 'Core Mathematics', 1),
(UUID(), @institution_id, 'INT-SCI', 'Integrated Science', 'Integrated Science', 1),
(UUID(), @institution_id, 'SOC-ST', 'Social Studies', 'Social Studies', 1),

-- Arts Electives (5)
(UUID(), @institution_id, 'LIT', 'Literature in English', 'Literature in English', 0),
(UUID(), @institution_id, 'HIST', 'History', 'History', 0),
(UUID(), @institution_id, 'GEOG', 'Geography', 'Geography', 0),
(UUID(), @institution_id, 'CRS', 'Christian Religious Studies', 'Christian Religious Studies', 0),
(UUID(), @institution_id, 'ECON', 'Economics', 'Economics', 0),

-- Science Electives (5)
(UUID(), @institution_id, 'PHY', 'Physics', 'Physics', 0),
(UUID(), @institution_id, 'CHEM', 'Chemistry', 'Chemistry', 0),
(UUID(), @institution_id, 'BIO', 'Biology', 'Biology', 0),
(UUID(), @institution_id, 'MATH-E', 'Elective Mathematics', 'Elective Mathematics', 0),
(UUID(), @institution_id, 'ICT', 'Information Technology', 'Information Technology', 0),

-- Business Electives (5)
(UUID(), @institution_id, 'BUS-MGT', 'Business Management', 'Business Management', 0),
(UUID(), @institution_id, 'ACCT', 'Accounting', 'Accounting', 0),
(UUID(), @institution_id, 'COST', 'Costing', 'Costing', 0),
(UUID(), @institution_id, 'FIN-ACCT', 'Financial Accounting', 'Financial Accounting', 0),
(UUID(), @institution_id, 'ECON-BUS', 'Economics', 'Economics for Business', 0);

-- Get subject IDs
SET @english_subject_id = (SELECT subject_id FROM subjects WHERE subject_code = 'ENG' AND institution_id = @institution_id LIMIT 1);
SET @math_subject_id = (SELECT subject_id FROM subjects WHERE subject_code = 'MATH-C' AND institution_id = @institution_id LIMIT 1);
SET @biology_subject_id = (SELECT subject_id FROM subjects WHERE subject_code = 'BIO' AND institution_id = @institution_id LIMIT 1);
SET @physics_subject_id = (SELECT subject_id FROM subjects WHERE subject_code = 'PHY' AND institution_id = @institution_id LIMIT 1);
SET @chemistry_subject_id = (SELECT subject_id FROM subjects WHERE subject_code = 'CHEM' AND institution_id = @institution_id LIMIT 1);
SET @literature_subject_id = (SELECT subject_id FROM subjects WHERE subject_code = 'LIT' AND institution_id = @institution_id LIMIT 1);
SET @history_subject_id = (SELECT subject_id FROM subjects WHERE subject_code = 'HIST' AND institution_id = @institution_id LIMIT 1);

-- =========================================
-- USERS - ADMIN (5 entries - 1 per institution)
-- =========================================
INSERT INTO users (uuid, institution_id, username, email, password_hash, first_name, last_name, phone_number, is_active)
VALUES 
(UUID(), @institution_id, 'admin', 'admin@accrashs.edu.gh', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Justice', 'Mensah', '+233 30 111 1001', 1),
(UUID(), @institution2_id, 'admin2', 'admin@kumashs.edu.gh', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Akosua', 'Agyemang', '+233 32 111 2001', 1),
(UUID(), @institution3_id, 'admin3', 'admin@ccashs.edu.gh', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Kwesi', 'Atta', '+233 33 111 3001', 1),
(UUID(), @institution4_id, 'admin4', 'admin@tamashs.edu.gh', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Alhassan', 'Mohammed', '+233 37 111 4001', 1),
(UUID(), @institution5_id, 'admin5', 'admin@hoshs.edu.gh', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Elikem', 'Agbeko', '+233 36 111 5001', 1);

SET @admin_user_id = (SELECT user_id FROM users WHERE username = 'admin' LIMIT 1);
SET @admin_role_id = (SELECT role_id FROM roles WHERE role_name = 'admin' LIMIT 1);

INSERT INTO user_roles (user_id, role_id) VALUES 
(@admin_user_id, @admin_role_id),
(@admin_user_id + 1, @admin_role_id),
(@admin_user_id + 2, @admin_role_id),
(@admin_user_id + 3, @admin_role_id),
(@admin_user_id + 4, @admin_role_id);

-- =========================================
-- USERS - TEACHERS (10 entries)
-- =========================================
INSERT INTO users (uuid, institution_id, username, email, password_hash, first_name, last_name, phone_number, is_active)
VALUES 
(UUID(), @institution_id, 'kofi.mensah', 'kofi.mensah@accrashs.edu.gh', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Kofi', 'Mensah', '+233 24 111 1111', 1),
(UUID(), @institution_id, 'ama.asante', 'ama.asante@accrashs.edu.gh', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Ama', 'Asante', '+233 24 111 1112', 1),
(UUID(), @institution_id, 'kwabena.owusu', 'kwabena.owusu@accrashs.edu.gh', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Kwabena', 'Owusu', '+233 24 111 1113', 1),
(UUID(), @institution_id, 'abena.boateng', 'abena.boateng@accrashs.edu.gh', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Abena', 'Boateng', '+233 24 111 1114', 1),
(UUID(), @institution_id, 'yaw.frimpong', 'yaw.frimpong@accrashs.edu.gh', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Yaw', 'Frimpong', '+233 24 111 1115', 1),
(UUID(), @institution_id, 'akosua.darko', 'akosua.darko@accrashs.edu.gh', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Akosua', 'Darko', '+233 24 111 1116', 1),
(UUID(), @institution_id, 'kwame.appiah', 'kwame.appiah@accrashs.edu.gh', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Kwame', 'Appiah', '+233 24 111 1117', 1),
(UUID(), @institution_id, 'efua.amoah', 'efua.amoah@accrashs.edu.gh', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Efua', 'Amoah', '+233 24 111 1118', 1),
(UUID(), @institution2_id, 'kwasi.boadu', 'kwasi.boadu@kumashs.edu.gh', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Kwasi', 'Boadu', '+233 24 112 1111', 1),
(UUID(), @institution2_id, 'adwoa.sarpong', 'adwoa.sarpong@kumashs.edu.gh', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Adwoa', 'Sarpong', '+233 24 112 1112', 1);

SET @teacher1_user_id = (SELECT user_id FROM users WHERE username = 'kofi.mensah' LIMIT 1);
SET @teacher_role_id = (SELECT role_id FROM roles WHERE role_name = 'teacher' LIMIT 1);

INSERT INTO user_roles (user_id, role_id) 
SELECT user_id, @teacher_role_id 
FROM users 
WHERE username IN ('kofi.mensah', 'ama.asante', 'kwabena.owusu', 'abena.boateng', 'yaw.frimpong', 
                   'akosua.darko', 'kwame.appiah', 'efua.amoah', 'kwasi.boadu', 'adwoa.sarpong');

-- =========================================
-- TEACHERS (10 entries)
-- =========================================
INSERT INTO teachers (uuid, institution_id, user_id, employee_id, qualification, specialization, hire_date)
VALUES 
(UUID(), @institution_id, @teacher1_user_id, 'T-2024-001', 'Masters in English', 'English Language', '2020-09-01'),
(UUID(), @institution_id, @teacher1_user_id + 1, 'T-2024-002', 'Masters in Biology', 'Biology', '2019-09-01'),
(UUID(), @institution_id, @teacher1_user_id + 2, 'T-2024-003', 'BSc Mathematics', 'Mathematics', '2021-09-01'),
(UUID(), @institution_id, @teacher1_user_id + 3, 'T-2024-004', 'MSc Physics', 'Physics', '2018-09-01'),
(UUID(), @institution_id, @teacher1_user_id + 4, 'T-2024-005', 'BSc Chemistry', 'Chemistry', '2020-09-01'),
(UUID(), @institution_id, @teacher1_user_id + 5, 'T-2024-006', 'BA History', 'History', '2022-09-01'),
(UUID(), @institution_id, @teacher1_user_id + 6, 'T-2024-007', 'BA Literature', 'Literature', '2021-09-01'),
(UUID(), @institution_id, @teacher1_user_id + 7, 'T-2024-008', 'BSc Economics', 'Economics', '2019-09-01'),
(UUID(), @institution2_id, @teacher1_user_id + 8, 'T-2024-009', 'MSc Computer Science', 'ICT', '2020-09-01'),
(UUID(), @institution2_id, @teacher1_user_id + 9, 'T-2024-010', 'BA Geography', 'Geography', '2021-09-01');

SET @teacher1_id = (SELECT teacher_id FROM teachers WHERE employee_id = 'T-2024-001' LIMIT 1);
SET @teacher2_id = (SELECT teacher_id FROM teachers WHERE employee_id = 'T-2024-002' LIMIT 1);
SET @teacher3_id = (SELECT teacher_id FROM teachers WHERE employee_id = 'T-2024-003' LIMIT 1);
SET @teacher4_id = (SELECT teacher_id FROM teachers WHERE employee_id = 'T-2024-004' LIMIT 1);
SET @teacher5_id = (SELECT teacher_id FROM teachers WHERE employee_id = 'T-2024-005' LIMIT 1);

-- =========================================
-- CLASSES (10 entries - Multiple streams)
-- =========================================
INSERT INTO classes (uuid, institution_id, program_id, grade_level_id, class_code, class_name, section, academic_year_id, class_teacher_id, max_students, status)
VALUES 
(UUID(), @institution_id, @arts_program_id, @shs1_level_id, 'SHS1-ARTS-A', 'SHS 1 General Arts A', 'A', @academic_year_id, @teacher1_id, 40, 'active'),
(UUID(), @institution_id, @arts_program_id, @shs1_level_id, 'SHS1-ARTS-B', 'SHS 1 General Arts B', 'B', @academic_year_id, @teacher6_id, 40, 'active'),
(UUID(), @institution_id, @science_program_id, @shs1_level_id, 'SHS1-SCI-A', 'SHS 1 General Science A', 'A', @academic_year_id, @teacher2_id, 35, 'active'),
(UUID(), @institution_id, @science_program_id, @shs1_level_id, 'SHS1-SCI-B', 'SHS 1 General Science B', 'B', @academic_year_id, @teacher3_id, 35, 'active'),
(UUID(), @institution_id, @business_program_id, @shs1_level_id, 'SHS1-BUS-A', 'SHS 1 Business A', 'A', @academic_year_id, @teacher8_id, 38, 'active'),
(UUID(), @institution_id, @arts_program_id, @shs2_level_id, 'SHS2-ARTS-A', 'SHS 2 General Arts A', 'A', @academic_year_id, @teacher7_id, 40, 'active'),
(UUID(), @institution_id, @science_program_id, @shs2_level_id, 'SHS2-SCI-A', 'SHS 2 General Science A', 'A', @academic_year_id, @teacher4_id, 35, 'active'),
(UUID(), @institution_id, @arts_program_id, @shs3_level_id, 'SHS3-ARTS-A', 'SHS 3 General Arts A', 'A', @academic_year_id, @teacher6_id, 42, 'active'),
(UUID(), @institution_id, @science_program_id, @shs3_level_id, 'SHS3-SCI-A', 'SHS 3 General Science A', 'A', @academic_year_id, @teacher5_id, 36, 'active'),
(UUID(), @institution_id, @business_program_id, @shs3_level_id, 'SHS3-BUS-A', 'SHS 3 Business A', 'A', @academic_year_id, @teacher8_id, 40, 'active');

SET @class_1art_a_id = (SELECT class_id FROM classes WHERE class_code = 'SHS1-ARTS-A' LIMIT 1);
SET @class_1art_b_id = (SELECT class_id FROM classes WHERE class_code = 'SHS1-ARTS-B' LIMIT 1);
SET @class_1sci_a_id = (SELECT class_id FROM classes WHERE class_code = 'SHS1-SCI-A' LIMIT 1);
SET @class_1sci_b_id = (SELECT class_id FROM classes WHERE class_code = 'SHS1-SCI-B' LIMIT 1);
SET @class_1bus_a_id = (SELECT class_id FROM classes WHERE class_code = 'SHS1-BUS-A' LIMIT 1);

-- =========================================
-- USERS - STUDENTS (20 entries)
-- =========================================
INSERT INTO users (uuid, institution_id, username, email, password_hash, first_name, last_name, phone_number, is_active)
VALUES 
(UUID(), @institution_id, 'kwame.osei', 'kwame.osei@student.accrashs.edu.gh', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Kwame', 'Osei', '+233 55 111 2001', 1),
(UUID(), @institution_id, 'abena.adjei', 'abena.adjei@student.accrashs.edu.gh', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Abena', 'Adjei', '+233 55 111 2002', 1),
(UUID(), @institution_id, 'kofi.addo', 'kofi.addo@student.accrashs.edu.gh', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Kofi', 'Addo', '+233 55 111 2003', 1),
(UUID(), @institution_id, 'ama.boakye', 'ama.boakye@student.accrashs.edu.gh', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Ama', 'Boakye', '+233 55 111 2004', 1),
(UUID(), @institution_id, 'kwabena.nyarko', 'kwabena.nyarko@student.accrashs.edu.gh', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Kwabena', 'Nyarko', '+233 55 111 2005', 1),
(UUID(), @institution_id, 'akosua.mensah', 'akosua.mensah@student.accrashs.edu.gh', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Akosua', 'Mensah', '+233 55 111 2006', 1),
(UUID(), @institution_id, 'yaw.owusu', 'yaw.owusu@student.accrashs.edu.gh', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Yaw', 'Owusu', '+233 55 111 2007', 1),
(UUID(), @institution_id, 'efua.asare', 'efua.asare@student.accrashs.edu.gh', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Efua', 'Asare', '+233 55 111 2008', 1),
(UUID(), @institution_id, 'kwesi.boateng', 'kwesi.boateng@student.accrashs.edu.gh', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Kwesi', 'Boateng', '+233 55 111 2009', 1),
(UUID(), @institution_id, 'adwoa.ofori', 'adwoa.ofori@student.accrashs.edu.gh', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Adwoa', 'Ofori', '+233 55 111 2010', 1),
(UUID(), @institution_id, 'kojo.agyemang', 'kojo.agyemang@student.accrashs.edu.gh', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Kojo', 'Agyemang', '+233 55 111 2011', 1),
(UUID(), @institution_id, 'afua.darko', 'afua.darko@student.accrashs.edu.gh', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Afua', 'Darko', '+233 55 111 2012', 1),
(UUID(), @institution_id, 'kwame.frimpong', 'kwame.frimpong@student.accrashs.edu.gh', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Kwame', 'Frimpong', '+233 55 111 2013', 1),
(UUID(), @institution_id, 'abena.appiah', 'abena.appiah@student.accrashs.edu.gh', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Abena', 'Appiah', '+233 55 111 2014', 1),
(UUID(), @institution_id, 'kofi.amoah', 'kofi.amoah@student.accrashs.edu.gh', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Kofi', 'Amoah', '+233 55 111 2015', 1),
(UUID(), @institution_id, 'ama.sarpong', 'ama.sarpong@student.accrashs.edu.gh', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Ama', 'Sarpong', '+233 55 111 2016', 1),
(UUID(), @institution_id, 'yaw.boadu', 'yaw.boadu@student.accrashs.edu.gh', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Yaw', 'Boadu', '+233 55 111 2017', 1),
(UUID(), @institution_id, 'akosua.atta', 'akosua.atta@student.accrashs.edu.gh', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Akosua', 'Atta', '+233 55 111 2018', 1),
(UUID(), @institution2_id, 'kwasi.mohammed', 'kwasi.mohammed@student.kumashs.edu.gh', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Kwasi', 'Mohammed', '+233 55 112 2001', 1),
(UUID(), @institution2_id, 'afua.agbeko', 'afua.agbeko@student.kumashs.edu.gh', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Afua', 'Agbeko', '+233 55 112 2002', 1);

SET @student1_user_id = (SELECT user_id FROM users WHERE username = 'kwame.osei' LIMIT 1);
SET @student_role_id = (SELECT role_id FROM roles WHERE role_name = 'student' LIMIT 1);

INSERT INTO user_roles (user_id, role_id) 
SELECT user_id, @student_role_id 
FROM users 
WHERE username IN ('kwame.osei', 'abena.adjei', 'kofi.addo', 'ama.boakye', 'kwabena.nyarko',
                   'akosua.mensah', 'yaw.owusu', 'efua.asare', 'kwesi.boateng', 'adwoa.ofori',
                   'kojo.agyemang', 'afua.darko', 'kwame.frimpong', 'abena.appiah', 'kofi.amoah',
                   'ama.sarpong', 'yaw.boadu', 'akosua.atta', 'kwasi.mohammed', 'afua.agbeko');

-- =========================================
-- STUDENTS (20 entries)
-- =========================================
INSERT INTO students (uuid, institution_id, user_id, class_id, student_id_number, enrollment_date, gender, date_of_birth, status)
VALUES 
(UUID(), @institution_id, @student1_user_id, @class_1sci_a_id, 'ASHS-2024-0001', '2024-09-01', 'Male', '2009-03-15', 'active'),
(UUID(), @institution_id, @student1_user_id + 1, @class_1art_a_id, 'ASHS-2024-0002', '2024-09-01', 'Female', '2009-05-20', 'active'),
(UUID(), @institution_id, @student1_user_id + 2, @class_1sci_a_id, 'ASHS-2024-0003', '2024-09-01', 'Male', '2009-01-10', 'active'),
(UUID(), @institution_id, @student1_user_id + 3, @class_1art_a_id, 'ASHS-2024-0004', '2024-09-01', 'Female', '2009-07-25', 'active'),
(UUID(), @institution_id, @student1_user_id + 4, @class_1sci_b_id, 'ASHS-2024-0005', '2024-09-01', 'Male', '2009-02-14', 'active'),
(UUID(), @institution_id, @student1_user_id + 5, @class_1art_b_id, 'ASHS-2024-0006', '2024-09-01', 'Female', '2009-06-30', 'active'),
(UUID(), @institution_id, @student1_user_id + 6, @class_1bus_a_id, 'ASHS-2024-0007', '2024-09-01', 'Male', '2009-04-18', 'active'),
(UUID(), @institution_id, @student1_user_id + 7, @class_1art_a_id, 'ASHS-2024-0008', '2024-09-01', 'Female', '2009-08-05', 'active'),
(UUID(), @institution_id, @student1_user_id + 8, @class_1sci_a_id, 'ASHS-2024-0009', '2024-09-01', 'Male', '2009-11-22', 'active'),
(UUID(), @institution_id, @student1_user_id + 9, @class_1art_b_id, 'ASHS-2024-0010', '2024-09-01', 'Female', '2009-09-12', 'active'),
(UUID(), @institution_id, @student1_user_id + 10, @class_1sci_b_id, 'ASHS-2024-0011', '2024-09-01', 'Male', '2009-10-08', 'active'),
(UUID(), @institution_id, @student1_user_id + 11, @class_1bus_a_id, 'ASHS-2024-0012', '2024-09-01', 'Female', '2009-12-01', 'active'),
(UUID(), @institution_id, @student1_user_id + 12, @class_1sci_a_id, 'ASHS-2024-0013', '2024-09-01', 'Male', '2009-03-28', 'active'),
(UUID(), @institution_id, @student1_user_id + 13, @class_1art_a_id, 'ASHS-2024-0014', '2024-09-01', 'Female', '2009-05-16', 'active'),
(UUID(), @institution_id, @student1_user_id + 14, @class_1sci_b_id, 'ASHS-2024-0015', '2024-09-01', 'Male', '2009-07-04', 'active'),
(UUID(), @institution_id, @student1_user_id + 15, @class_1art_b_id, 'ASHS-2024-0016', '2024-09-01', 'Female', '2009-02-19', 'active'),
(UUID(), @institution_id, @student1_user_id + 16, @class_1bus_a_id, 'ASHS-2024-0017', '2024-09-01', 'Male', '2009-06-11', 'active'),
(UUID(), @institution_id, @student1_user_id + 17, @class_1sci_a_id, 'ASHS-2024-0018', '2024-09-01', 'Female', '2009-04-23', 'active'),
(UUID(), @institution2_id, @student1_user_id + 18, NULL, 'KSHS-2024-0001', '2024-09-01', 'Male', '2009-08-14', 'active'),
(UUID(), @institution2_id, @student1_user_id + 19, NULL, 'KSHS-2024-0002', '2024-09-01', 'Female', '2009-10-27', 'active');

SET @student1_id = (SELECT student_id FROM students WHERE student_id_number = 'ASHS-2024-0001' LIMIT 1);
SET @student2_id = (SELECT student_id FROM students WHERE student_id_number = 'ASHS-2024-0002' LIMIT 1);
SET @student3_id = (SELECT student_id FROM students WHERE student_id_number = 'ASHS-2024-0003' LIMIT 1);
SET @student4_id = (SELECT student_id FROM students WHERE student_id_number = 'ASHS-2024-0004' LIMIT 1);
SET @student5_id = (SELECT student_id FROM students WHERE student_id_number = 'ASHS-2024-0005' LIMIT 1);

-- =========================================
-- USERS - PARENTS (10 entries)
-- =========================================
INSERT INTO users (uuid, institution_id, username, email, password_hash, first_name, last_name, phone_number, is_active)
VALUES 
(UUID(), @institution_id, 'yaw.osei', 'yaw.osei@parent.accrashs.edu.gh', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Yaw', 'Osei', '+233 24 555 5555', 1),
(UUID(), @institution_id, 'akua.adjei', 'akua.adjei@parent.accrashs.edu.gh', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Akua', 'Adjei', '+233 24 555 5556', 1),
(UUID(), @institution_id, 'emmanuel.addo', 'emmanuel.addo@parent.accrashs.edu.gh', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Emmanuel', 'Addo', '+233 24 555 5557', 1),
(UUID(), @institution_id, 'patience.boakye', 'patience.boakye@parent.accrashs.edu.gh', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Patience', 'Boakye', '+233 24 555 5558', 1),
(UUID(), @institution_id, 'samuel.nyarko', 'samuel.nyarko@parent.accrashs.edu.gh', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Samuel', 'Nyarko', '+233 24 555 5559', 1),
(UUID(), @institution_id, 'grace.mensah', 'grace.mensah@parent.accrashs.edu.gh', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Grace', 'Mensah', '+233 24 555 5560', 1),
(UUID(), @institution_id, 'peter.owusu', 'peter.owusu@parent.accrashs.edu.gh', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Peter', 'Owusu', '+233 24 555 5561', 1),
(UUID(), @institution_id, 'mary.asare', 'mary.asare@parent.accrashs.edu.gh', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Mary', 'Asare', '+233 24 555 5562', 1),
(UUID(), @institution_id, 'joseph.boateng', 'joseph.boateng@parent.accrashs.edu.gh', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Joseph', 'Boateng', '+233 24 555 5563', 1),
(UUID(), @institution_id, 'elizabeth.ofori', 'elizabeth.ofori@parent.accrashs.edu.gh', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Elizabeth', 'Ofori', '+233 24 555 5564', 1);

SET @parent1_user_id = (SELECT user_id FROM users WHERE username = 'yaw.osei' LIMIT 1);
SET @parent_role_id = (SELECT role_id FROM roles WHERE role_name = 'parent' LIMIT 1);

INSERT INTO user_roles (user_id, role_id) 
SELECT user_id, @parent_role_id 
FROM users 
WHERE username IN ('yaw.osei', 'akua.adjei', 'emmanuel.addo', 'patience.boakye', 'samuel.nyarko',
                   'grace.mensah', 'peter.owusu', 'mary.asare', 'joseph.boateng', 'elizabeth.ofori');

-- =========================================
-- PARENTS (10 entries)
-- =========================================
INSERT INTO parents (institution_id, user_id, first_name, last_name, phone_number, email, occupation, address)
VALUES 
(@institution_id, @parent1_user_id, 'Yaw', 'Osei', '+233 24 555 5555', 'yaw.osei@parent.accrashs.edu.gh', 'Engineer', 'East Legon, Accra'),
(@institution_id, @parent1_user_id + 1, 'Akua', 'Adjei', '+233 24 555 5556', 'akua.adjei@parent.accrashs.edu.gh', 'Nurse', 'Osu, Accra'),
(@institution_id, @parent1_user_id + 2, 'Emmanuel', 'Addo', '+233 24 555 5557', 'emmanuel.addo@parent.accrashs.edu.gh', 'Teacher', 'Tema, Accra'),
(@institution_id, @parent1_user_id + 3, 'Patience', 'Boakye', '+233 24 555 5558', 'patience.boakye@parent.accrashs.edu.gh', 'Accountant', 'Spintex, Accra'),
(@institution_id, @parent1_user_id + 4, 'Samuel', 'Nyarko', '+233 24 555 5559', 'samuel.nyarko@parent.accrashs.edu.gh', 'Business Owner', 'Madina, Accra'),
(@institution_id, @parent1_user_id + 5, 'Grace', 'Mensah', '+233 24 555 5560', 'grace.mensah@parent.accrashs.edu.gh', 'Doctor', 'Dansoman, Accra'),
(@institution_id, @parent1_user_id + 6, 'Peter', 'Owusu', '+233 24 555 5561', 'peter.owusu@parent.accrashs.edu.gh', 'Lawyer', 'Kaneshie, Accra'),
(@institution_id, @parent1_user_id + 7, 'Mary', 'Asare', '+233 24 555 5562', 'mary.asare@parent.accrashs.edu.gh', 'Banker', 'Achimota, Accra'),
(@institution_id, @parent1_user_id + 8, 'Joseph', 'Boateng', '+233 24 555 5563', 'joseph.boateng@parent.accrashs.edu.gh', 'Architect', 'Labone, Accra'),
(@institution_id, @parent1_user_id + 9, 'Elizabeth', 'Ofori', '+233 24 555 5564', 'elizabeth.ofori@parent.accrashs.edu.gh', 'Civil Servant', 'South Labadi, Accra');

SET @parent1_id = (SELECT parent_id FROM parents WHERE email = 'yaw.osei@parent.accrashs.edu.gh' LIMIT 1);
SET @parent2_id = (SELECT parent_id FROM parents WHERE email = 'akua.adjei@parent.accrashs.edu.gh' LIMIT 1);

-- =========================================
-- PARENT-STUDENT RELATIONSHIPS (15 entries)
-- =========================================
INSERT INTO parent_students (parent_id, student_id, relationship_type, is_primary_contact, can_pickup)
VALUES 
(@parent1_id, @student1_id, 'Father', 1, 1),
(@parent2_id, @student2_id, 'Mother', 1, 1),
(@parent1_id + 2, @student3_id, 'Father', 1, 1),
(@parent1_id + 3, @student4_id, 'Mother', 1, 1),
(@parent1_id + 4, @student5_id, 'Father', 1, 1),
(@parent1_id + 5, @student1_id + 5, 'Mother', 1, 1),
(@parent1_id + 6, @student1_id + 6, 'Father', 1, 1),
(@parent1_id + 7, @student1_id + 7, 'Mother', 1, 1),
(@parent1_id + 8, @student1_id + 8, 'Father', 1, 1),
(@parent1_id + 9, @student1_id + 9, 'Mother', 1, 1),
(@parent2_id, @student1_id, 'Mother', 0, 1),
(@parent1_id, @student2_id, 'Father', 0, 0),
(@parent1_id + 3, @student5_id, 'Guardian', 0, 1),
(@parent1_id + 4, @student3_id, 'Guardian', 0, 1),
(@parent1_id + 5, @student4_id, 'Guardian', 0, 0);

-- =========================================
-- CLASS SUBJECTS (15 entries - subjects taught in classes)
-- =========================================
INSERT INTO class_subjects (institution_id, class_id, subject_id, teacher_id, academic_year_id, semester_id, duration_weeks, start_date, end_date, status)
VALUES 
-- SHS 1 Arts A subjects
(@institution_id, @class_1art_a_id, @english_subject_id, @teacher1_id, @academic_year_id, @semester1_id, 14, '2024-09-01', '2024-12-20', 'active'),
(@institution_id, @class_1art_a_id, @math_subject_id, @teacher3_id, @academic_year_id, @semester1_id, 14, '2024-09-01', '2024-12-20', 'active'),
(@institution_id, @class_1art_a_id, @literature_subject_id, @teacher7_id, @academic_year_id, @semester1_id, 14, '2024-09-01', '2024-12-20', 'active'),
(@institution_id, @class_1art_a_id, @history_subject_id, @teacher6_id, @academic_year_id, @semester1_id, 14, '2024-09-01', '2024-12-20', 'active'),

-- SHS 1 Science A subjects
(@institution_id, @class_1sci_a_id, @english_subject_id, @teacher1_id, @academic_year_id, @semester1_id, 14, '2024-09-01', '2024-12-20', 'active'),
(@institution_id, @class_1sci_a_id, @math_subject_id, @teacher3_id, @academic_year_id, @semester1_id, 14, '2024-09-01', '2024-12-20', 'active'),
(@institution_id, @class_1sci_a_id, @biology_subject_id, @teacher2_id, @academic_year_id, @semester1_id, 14, '2024-09-01', '2024-12-20', 'active'),
(@institution_id, @class_1sci_a_id, @physics_subject_id, @teacher4_id, @academic_year_id, @semester1_id, 14, '2024-09-01', '2024-12-20', 'active'),
(@institution_id, @class_1sci_a_id, @chemistry_subject_id, @teacher5_id, @academic_year_id, @semester1_id, 14, '2024-09-01', '2024-12-20', 'active'),

-- SHS 1 Science B subjects
(@institution_id, @class_1sci_b_id, @english_subject_id, @teacher1_id, @academic_year_id, @semester1_id, 14, '2024-09-01', '2024-12-20', 'active'),
(@institution_id, @class_1sci_b_id, @biology_subject_id, @teacher2_id, @academic_year_id, @semester1_id, 14, '2024-09-01', '2024-12-20', 'active'),
(@institution_id, @class_1sci_b_id, @physics_subject_id, @teacher4_id, @academic_year_id, @semester1_id, 14, '2024-09-01', '2024-12-20', 'active'),

-- SHS 1 Arts B subjects
(@institution_id, @class_1art_b_id, @english_subject_id, @teacher1_id, @academic_year_id, @semester1_id, 14, '2024-09-01', '2024-12-20', 'active'),
(@institution_id, @class_1art_b_id, @literature_subject_id, @teacher7_id, @academic_year_id, @semester1_id, 14, '2024-09-01', '2024-12-20', 'active'),
(@institution_id, @class_1art_b_id, @history_subject_id, @teacher6_id, @academic_year_id, @semester1_id, 14, '2024-09-01', '2024-12-20', 'active');

SET @class_subject1_id = (SELECT course_id FROM class_subjects WHERE class_id = @class_1art_a_id AND subject_id = @english_subject_id LIMIT 1);
SET @class_subject2_id = (SELECT course_id FROM class_subjects WHERE class_id = @class_1sci_a_id AND subject_id = @biology_subject_id LIMIT 1);
SET @class_subject3_id = (SELECT course_id FROM class_subjects WHERE class_id = @class_1sci_a_id AND subject_id = @physics_subject_id LIMIT 1);

-- =========================================
-- COURSE ENROLLMENTS (30+ entries - students enrolled in subjects)
-- =========================================
INSERT INTO course_enrollments (student_id, course_id, enrollment_date, status, progress_percentage)
SELECT s.student_id, cs.course_id, '2024-09-01', 'active', 15.00
FROM students s
INNER JOIN class_subjects cs ON s.class_id = cs.class_id
WHERE s.institution_id = @institution_id
AND s.student_id <= @student1_id + 17
LIMIT 50;

-- =========================================
-- COURSE SCHEDULES (20 entries - timetable)
-- =========================================
INSERT INTO course_schedules (course_id, day_of_week, start_time, end_time, room, is_recurring)
VALUES 
(@class_subject1_id, 'Monday', '08:00:00', '09:30:00', 'Room A101', 1),
(@class_subject1_id, 'Wednesday', '08:00:00', '09:30:00', 'Room A101', 1),
(@class_subject1_id, 'Friday', '10:00:00', '11:30:00', 'Room A101', 1),
(@class_subject2_id, 'Tuesday', '08:00:00', '09:30:00', 'Lab B201', 1),
(@class_subject2_id, 'Thursday', '08:00:00', '09:30:00', 'Lab B201', 1),
(@class_subject2_id, 'Friday', '13:00:00', '14:30:00', 'Lab B201', 1),
(@class_subject3_id, 'Monday', '10:00:00', '11:30:00', 'Lab B301', 1),
(@class_subject3_id, 'Wednesday', '10:00:00', '11:30:00', 'Lab B301', 1),
(@class_subject3_id + 1, 'Tuesday', '10:00:00', '11:30:00', 'Room A201', 1),
(@class_subject3_id + 1, 'Thursday', '10:00:00', '11:30:00', 'Room A201', 1),
(@class_subject3_id + 2, 'Monday', '13:00:00', '14:30:00', 'Lab B401', 1),
(@class_subject3_id + 2, 'Wednesday', '13:00:00', '14:30:00', 'Lab B401', 1),
(@class_subject3_id + 3, 'Tuesday', '13:00:00', '14:30:00', 'Room A301', 1),
(@class_subject3_id + 3, 'Friday', '08:00:00', '09:30:00', 'Room A301', 1),
(@class_subject3_id + 4, 'Monday', '08:00:00', '09:30:00', 'Hall 1', 1),
(@class_subject3_id + 5, 'Wednesday', '13:00:00', '14:30:00', 'Room A401', 1),
(@class_subject3_id + 6, 'Thursday', '13:00:00', '14:30:00', 'Lab B101', 1),
(@class_subject3_id + 7, 'Friday', '10:00:00', '11:30:00', 'Lab B201', 1),
(@class_subject3_id + 8, 'Tuesday', '08:00:00', '09:30:00', 'Room C101', 1),
(@class_subject3_id + 9, 'Thursday', '10:00:00', '11:30:00', 'Room C201', 1);

-- =========================================
-- ASSIGNMENTS (10 entries)
-- =========================================
INSERT INTO assignments (uuid, course_id, title, description, due_date, max_score, status)
VALUES 
(UUID(), @class_subject1_id, 'Essay Writing - My First Day', 'Write a 500-word essay about your first day at school', '2024-09-15 23:59:59', 20, 'active'),
(UUID(), @class_subject1_id, 'Grammar Exercise Set 1', 'Complete exercises on page 25-30', '2024-09-22 23:59:59', 15, 'active'),
(UUID(), @class_subject2_id, 'Cell Structure Diagram', 'Draw and label a plant cell', '2024-09-18 23:59:59', 25, 'active'),
(UUID(), @class_subject2_id, 'Photosynthesis Report', 'Write a detailed report on photosynthesis', '2024-10-01 23:59:59', 30, 'active'),
(UUID(), @class_subject3_id, 'Newton Laws  Problems', 'Solve problems 1-10 from textbook', '2024-09-20 23:59:59', 20, 'active'),
(UUID(), @class_subject3_id + 1, 'Math Problem Set 1', 'Algebra questions from chapter 2', '2024-09-25 23:59:59', 20, 'active'),
(UUID(), @class_subject3_id + 2, 'Chemistry Lab Report', 'Write lab report on acid-base titration', '2024-09-30 23:59:59', 35, 'active'),
(UUID(), @class_subject3_id + 3, 'Historical Essay', 'Essay on Ghana Independence', '2024-10-05 23:59:59', 25, 'active'),
(UUID(), @class_subject3_id + 4, 'Literature Analysis', 'Analyze a Shakespearean sonnet', '2024-10-10 23:59:59', 30, 'active'),
(UUID(), @class_subject3_id + 5, 'Math Quiz Preparation', 'Review chapters 1-3 for quiz', '2024-09-28 23:59:59', 10, 'active');

SET @assignment1_id = (SELECT assignment_id FROM assignments WHERE title = 'Essay Writing - My First Day' LIMIT 1);

-- =========================================
-- QUIZZES (8 entries)
-- =========================================
INSERT INTO quizzes (course_id, title, description, duration_minutes, quiz_type, status, start_date, end_date)
VALUES 
(@class_subject1_id, 'English Grammar Quiz 1', 'Basic grammar and parts of speech', 30, 'graded', 'active', '2024-09-16 08:00:00', '2024-09-16 23:59:59'),
(@class_subject2_id, 'Cell Biology Quiz', 'Test on cell structure and function', 45, 'graded', 'active', '2024-09-19 08:00:00', '2024-09-19 23:59:59'),
(@class_subject3_id, 'Physics Mechanics Quiz', 'Newton laws and motion', 40, 'graded', 'active', '2024-09-23 08:00:00', '2024-09-23 23:59:59'),
(@class_subject3_id + 1, 'Algebra Basics Quiz', 'Linear equations and inequalities', 35, 'graded', 'active', '2024-09-26 08:00:00', '2024-09-26 23:59:59'),
(@class_subject3_id + 2, 'Chemical Reactions Quiz', 'Types of chemical reactions', 40, 'graded', 'active', '2024-10-02 08:00:00', '2024-10-02 23:59:59'),
(@class_subject3_id + 3, 'Ghana History Quiz', 'Pre-colonial to independence', 30, 'graded', 'active', '2024-10-07 08:00:00', '2024-10-07 23:59:59'),
(@class_subject3_id + 4, 'Poetry Analysis Quiz', 'Literary devices and themes', 35, 'graded', 'active', '2024-10-12 08:00:00', '2024-10-12 23:59:59'),
(@class_subject3_id + 5, 'Calculus Introduction Quiz', 'Limits and derivatives basics', 45, 'graded', 'active', '2024-10-15 08:00:00', '2024-10-15 23:59:59');

SET @quiz1_id = (SELECT quiz_id FROM quizzes WHERE title = 'English Grammar Quiz 1' LIMIT 1);
SET @quiz2_id = (SELECT quiz_id FROM quizzes WHERE title = 'Cell Biology Quiz' LIMIT 1);

-- =========================================
-- QUIZ QUESTIONS (20 entries - distributed across quizzes)
-- =========================================
INSERT INTO quiz_questions (quiz_id, question_text, question_type, points, correct_answer, order_index)
VALUES 
(@quiz1_id, 'What is a noun?', 'multiple_choice', 2, 'a', 1),
(@quiz1_id, 'Identify the verb in: "She runs quickly"', 'multiple_choice', 2, 'b', 2),
(@quiz1_id, 'Which is an adjective?', 'multiple_choice', 2, 'c', 3),
(@quiz1_id, 'What is a pronoun?', 'multiple_choice', 2, 'a', 4),
(@quiz1_id, 'Identify the adverb', 'multiple_choice', 2, 'd', 5),

(@quiz2_id, 'What is the powerhouse of the cell?', 'multiple_choice', 5, 'a', 1),
(@quiz2_id, 'Which organelle controls cell activities?', 'multiple_choice', 5, 'b', 2),
(@quiz2_id, 'What is the function of chloroplasts?', 'multiple_choice', 5, 'c', 3),
(@quiz2_id, 'What surrounds the cell?', 'multiple_choice', 5, 'a', 4),
(@quiz2_id, 'What stores genetic information?', 'multiple_choice', 5, 'd', 5),

(@quiz2_id + 1, 'State Newton first law', 'short_answer', 6, NULL, 1),
(@quiz2_id + 1, 'What is the formula for force?', 'multiple_choice', 6, 'a', 2),
(@quiz2_id + 1, 'Define acceleration', 'short_answer', 6, NULL, 3),
(@quiz2_id + 1, 'Calculate: F = ma when m=5kg, a=2m/s²', 'multiple_choice', 6, 'b', 4),
(@quiz2_id + 1, 'What is inertia?', 'short_answer', 6, NULL, 5),

(@quiz2_id + 2, 'Solve: 2x + 5 = 15', 'multiple_choice', 4, 'a', 1),
(@quiz2_id + 2, 'What is x in: 3x = 21?', 'multiple_choice', 4, 'c', 2),
(@quiz2_id + 2, 'Simplify: 4x + 3x', 'multiple_choice', 4, 'b', 3),
(@quiz2_id + 2, 'Factorize: x² - 9', 'multiple_choice', 4, 'd', 4),
(@quiz2_id + 2, 'Expand: (x+3)(x-2)', 'short_answer', 4, NULL, 5);

-- =========================================
-- QUIZ QUESTION OPTIONS (40+ entries)
-- =========================================
INSERT INTO quiz_question_options (question_id, option_label, option_text, is_correct)
SELECT 
    qq.question_id,
    CASE qo.option_num
        WHEN 1 THEN 'A'
        WHEN 2 THEN 'B'
        WHEN 3 THEN 'C'
        WHEN 4 THEN 'D'
    END as option_label,
    CASE qo.option_num
        WHEN 1 THEN 'A person, place, or thing'
        WHEN 2 THEN 'An action word'
        WHEN 3 THEN 'A describing word'
        WHEN 4 THEN 'A connecting word'
    END as option_text,
    CASE WHEN qo.option_num = 1 THEN 1 ELSE 0 END as is_correct
FROM quiz_questions qq
CROSS JOIN (SELECT 1 as option_num UNION SELECT 2 UNION SELECT 3 UNION SELECT 4) qo
WHERE qq.quiz_id = @quiz1_id AND qq.order_index = 1;

INSERT INTO quiz_question_options (question_id, option_label, option_text, is_correct)
SELECT 
    qq.question_id,
    CASE qo.option_num
        WHEN 1 THEN 'A'
        WHEN 2 THEN 'B'
        WHEN 3 THEN 'C'
        WHEN 4 THEN 'D'
    END as option_label,
    CASE qo.option_num
        WHEN 1 THEN 'She'
        WHEN 2 THEN 'runs'
        WHEN 3 THEN 'quickly'
        WHEN 4 THEN 'None'
    END as option_text,
    CASE WHEN qo.option_num = 2 THEN 1 ELSE 0 END as is_correct
FROM quiz_questions qq
CROSS JOIN (SELECT 1 as option_num UNION SELECT 2 UNION SELECT 3 UNION SELECT 4) qo
WHERE qq.quiz_id = @quiz1_id AND qq.order_index = 2;

INSERT INTO quiz_question_options (question_id, option_label, option_text, is_correct)
SELECT 
    qq.question_id,
    CASE qo.option_num
        WHEN 1 THEN 'A'
        WHEN 2 THEN 'B'
        WHEN 3 THEN 'C'
        WHEN 4 THEN 'D'
    END as option_label,
    CASE qo.option_num
        WHEN 1 THEN 'Mitochondria'
        WHEN 2 THEN 'Nucleus'
        WHEN 3 THEN 'Ribosome'
        WHEN 4 THEN 'Vacuole'
    END as option_text,
    CASE WHEN qo.option_num = 1 THEN 1 ELSE 0 END as is_correct
FROM quiz_questions qq
CROSS JOIN (SELECT 1 as option_num UNION SELECT 2 UNION SELECT 3 UNION SELECT 4) qo
WHERE qq.quiz_id = @quiz2_id AND qq.order_index = 1;

-- =========================================
-- ANNOUNCEMENTS (8 entries)
-- =========================================
INSERT INTO announcements (uuid, title, content, author_id, target_role, is_published, published_at, expires_at)
VALUES 
(UUID(), 'Welcome to New Academic Year', 'We welcome all students to the 2024-2025 academic year. Classes begin September 1st.', @admin_user_id, NULL, 1, '2024-08-25 08:00:00', '2024-09-10 23:59:59'),
(UUID(), 'First Term Schedule', 'First term runs from September 1 to December 20. Midterm exams: October 28-November 1.', @admin_user_id, NULL, 1, '2024-08-26 09:00:00', '2024-09-15 23:59:59'),
(UUID(), 'Sports Day Announcement', 'Annual sports day will be held on November 15. All students must participate.', @admin_user_id, 'student', 1, '2024-10-01 10:00:00', '2024-11-20 23:59:59'),
(UUID(), 'Parent-Teacher Conference', 'PTA meeting scheduled for October 20 at 2:00 PM in the school hall.', @admin_user_id, 'parent', 1, '2024-10-05 08:00:00', '2024-10-22 23:59:59'),
(UUID(), 'Library Hours Extended', 'Library will now close at 8:00 PM on weekdays to accommodate exam preparation.', @admin_user_id, 'student', 1, '2024-10-10 12:00:00', '2024-12-20 23:59:59'),
(UUID(), 'Midterm Exam Timetable Released', 'Check your student portal for the complete midterm examination timetable.', @admin_user_id, 'student', 1, '2024-10-15 08:00:00', '2024-11-05 23:59:59'),
(UUID(), 'Teacher Training Workshop', 'Mandatory workshop on modern teaching methods - Saturday, November 5.', @admin_user_id, 'teacher', 1, '2024-10-20 09:00:00', '2024-11-06 23:59:59'),
(UUID(), 'School Closing Date', 'First term ends December 20. Second term resumes January 6, 2025.', @admin_user_id, NULL, 1, '2024-11-01 10:00:00', '2024-12-25 23:59:59');

-- =========================================
-- EVENTS (10 entries)
-- =========================================
INSERT INTO events (uuid, institution_id, title, description, event_type, start_date, end_date, location, created_by, all_day, is_published)
VALUES 
(UUID(), @institution_id, 'First Day of School', 'Academic year 2024-2025 begins', 'academic', '2024-09-01 08:00:00', '2024-09-01 17:00:00', 'School Campus', @admin_user_id, 1, 1),
(UUID(), @institution_id, 'Independence Day Celebration', 'Ghana Independence Day celebration', 'holiday', '2025-03-06 09:00:00', '2025-03-06 14:00:00', 'School Grounds', @admin_user_id, 0, 1),
(UUID(), @institution_id, 'Midterm Examinations', 'First term midterm exams', 'examination', '2024-10-28 08:00:00', '2024-11-01 17:00:00', 'Examination Halls', @admin_user_id, 0, 1),
(UUID(), @institution_id, 'Sports Day', 'Annual inter-house sports competition', 'sports', '2024-11-15 08:00:00', '2024-11-15 17:00:00', 'Sports Complex', @admin_user_id, 1, 1),
(UUID(), @institution_id, 'Science Fair', 'Students showcase science projects', 'academic', '2024-11-22 09:00:00', '2024-11-22 15:00:00', 'Science Laboratory Block', @teacher2_id, 0, 1),
(UUID(), @institution_id, 'PTA Meeting', 'Parent-Teacher Association meeting', 'meeting', '2024-10-20 14:00:00', '2024-10-20 16:00:00', 'School Hall', @admin_user_id, 0, 1),
(UUID(), @institution_id, 'Career Day', 'Career guidance and counseling', 'other', '2024-11-08 09:00:00', '2024-11-08 15:00:00', 'School Hall', @admin_user_id, 0, 1),
(UUID(), @institution_id, 'Cultural Festival', 'Celebration of Ghanaian culture', 'cultural', '2024-12-06 09:00:00', '2024-12-06 16:00:00', 'School Grounds', @admin_user_id, 0, 1),
(UUID(), @institution_id, 'End of Term Exams', 'First term final examinations', 'examination', '2024-12-09 08:00:00', '2024-12-19 17:00:00', 'Examination Halls', @admin_user_id, 0, 1),
(UUID(), @institution_id, 'Prize Giving Day', 'Awards ceremony for outstanding students', 'academic', '2024-12-20 10:00:00', '2024-12-20 14:00:00', 'School Hall', @admin_user_id, 0, 1);

-- =========================================
-- NOTIFICATIONS (15 entries)
-- =========================================
INSERT INTO notifications (uuid, sender_id, user_id, title, message, notification_type, is_read, created_at)
VALUES 
(UUID(), @admin_user_id, @student1_user_id, 'Welcome to LMS', 'Welcome to Accra SHS Learning Management System', 'system', 0, '2024-09-01 08:00:00'),
(UUID(), @teacher1_user_id, @student1_user_id, 'Assignment Due Soon', 'Essay Writing assignment due in 2 days', 'assignment', 0, '2024-09-13 10:00:00'),
(UUID(), @admin_user_id, @student2_user_id, 'New Announcement', 'Sports Day announced for November 15', 'announcement', 1, '2024-10-01 11:00:00'),
(UUID(), @teacher2_user_id, @student3_user_id, 'Quiz Available', 'Biology Quiz now available - due today', 'quiz', 0, '2024-09-19 08:00:00'),
(UUID(), @admin_user_id, @teacher1_user_id, 'New Student Enrollment', '5 new students added to your class', 'system', 1, '2024-09-02 09:00:00'),
(UUID(), @admin_user_id, @teacher2_user_id, 'Assignment Submissions', '12 students submitted Biology assignment', 'assignment', 0, '2024-09-18 15:00:00'),
(UUID(), @teacher2_user_id, @parent1_user_id, 'Academic Progress', 'Your child scored 85% in recent quiz', 'grade', 0, '2024-09-20 16:00:00'),
(UUID(), @admin_user_id, @parent1_user_id, 'PTA Meeting Reminder', 'PTA meeting scheduled for Oct 20', 'event', 0, '2024-10-15 10:00:00'),
(UUID(), @teacher1_user_id, @student4_user_id, 'Grade Posted', 'Your essay has been graded - 18/20', 'grade', 0, '2024-09-22 14:00:00'),
(UUID(), @admin_user_id, @student5_user_id, 'Upcoming Exam', 'Midterm exams start October 28', 'announcement', 0, '2024-10-20 09:00:00'),
(UUID(), @admin_user_id, @teacher3_user_id, 'Schedule Change', 'Math class moved to Room B205', 'system', 1, '2024-09-10 08:30:00'),
(UUID(), @admin_user_id, @student1_user_id + 5, 'Library Notice', 'Library hours extended til 8PM', 'announcement', 0, '2024-10-10 12:30:00'),
(UUID(), @teacher7_user_id, @student1_user_id + 6, 'Assignment Reminder', 'History essay due tomorrow', 'assignment', 0, '2024-10-04 18:00:00'),
(UUID(), @admin_user_id, @teacher4_user_id, 'Lab Equipment Arrived', 'New physics lab equipment ready for use', 'system', 0, '2024-09-25 11:00:00'),
(UUID(), @admin_user_id, @admin_user_id, 'System Update', 'LMS will undergo maintenance this weekend', 'system', 1, '2024-10-12 16:00:00');

-- =========================================
-- MESSAGES (12 entries)
-- =========================================
INSERT INTO messages (uuid, sender_id, receiver_id, subject, message_text, is_read, sent_at)
VALUES 
(UUID(), @teacher1_user_id, @student1_user_id, 'Essay Feedback', 'Great work on your essay. Keep it up!', 1, '2024-09-16 14:00:00'),
(UUID(), @student1_user_id, @teacher1_user_id, 'Question about assignment', 'Can I get an extension for the next assignment?', 1, '2024-09-17 10:00:00'),
(UUID(), @parent1_user_id, @teacher1_user_id, 'Child Progress Inquiry', 'How is Kwame doing in your class?', 0, '2024-09-18 16:00:00'),
(UUID(), @teacher2_user_id, @student3_user_id, 'Lab Report Issue', 'Please resubmit your lab report with corrections', 0, '2024-09-19 11:00:00'),
(UUID(), @admin_user_id, @teacher3_user_id, 'Meeting Reminder', 'Department meeting tomorrow at 3PM', 1, '2024-09-20 09:00:00'),
(UUID(), @student2_user_id, @teacher7_user_id, 'Book Recommendation', 'Any additional reading materials for literature?', 0, '2024-09-21 15:00:00'),
(UUID(), @teacher4_user_id, @student1_user_id + 8, 'Physics  Problem Help', 'Visit me during office hours for extra help', 1, '2024-09-22 12:00:00'),
(UUID(), @parent2_user_id, @admin_user_id, 'Fees Payment Query', 'Question about second term fees', 0, '2024-09-23 10:30:00'),
(UUID(), @teacher1_user_id, @teacher7_user_id, 'Collaboration Idea', 'Let coordinate interdisciplinary project', 1, '2024-09-24 13:00:00'),
(UUID(), @student4_user_id, @student1_user_id, 'Study Group', 'Want to join our history study group?', 0, '2024-09-25 18:00:00'),
(UUID(), @admin_user_id, @parent1_user_id, 'PTA Meeting', 'Looking forward to seeing you at the PTA meeting', 0, '2024-10-01 09:00:00'),
(UUID(), @teacher5_user_id, @student5_user_id, 'Chemistry Lab Safety', 'Review lab safety rules before next class', 0, '2024-10-03 14:00:00');

-- =========================================
-- ATTENDANCE (50+ entries - sample attendance records)
-- =========================================
INSERT INTO attendance (student_id, course_id, attendance_date, status, remarks)
SELECT 
    s.student_id,
    @class_subject1_id as course_id,
    DATE_ADD('2024-09-01', INTERVAL day_num DAY) as attendance_date,
    CASE 
        WHEN RAND() < 0.95 THEN 'present'
        WHEN RAND() < 0.03 THEN 'absent'
        ELSE 'late'
    END as status,
    NULL as remarks
FROM students s
CROSS JOIN (
    SELECT 0 as day_num UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION
    SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10 UNION SELECT 11
) days
WHERE s.class_id IS NOT NULL 
AND s.student_id <= @student1_id + 10
LIMIT 100;

-- =========================================
-- LOGIN ACTIVITY (20 entries)
-- =========================================
INSERT INTO login_activity (user_id, login_time, ip_address, user_agent, is_successful, logout_time)
VALUES 
(@student1_user_id, '2024-09-01 07:45:00', '192.168.1.101', 'Mozilla/5.0 (Windows NT 10.0)', 1, '2024-09-01 16:00:00'),
(@student1_user_id, '2024-09-02 08:00:00', '192.168.1.101', 'Mozilla/5.0 (Windows NT 10.0)', 1, '2024-09-02 15:30:00'),
(@teacher1_user_id, '2024-09-01 07:30:00', '192.168.1.50', 'Mozilla/5.0 (Windows NT 10.0)', 1, '2024-09-01 17:00:00'),
(@admin_user_id, '2024-09-01 07:00:00', '192.168.1.10', 'Mozilla/5.0 (Windows NT 10.0)', 1, '2024-09-01 18:00:00'),
(@student2_user_id, '2024-09-01 08:15:00', '192.168.1.102', 'Mozilla/5.0 (iPhone)', 1, '2024-09-01 14:00:00'),
(@parent1_user_id, '2024-09-01 20:00:00', '41.189.45.23', 'Mozilla/5.0 (Android)', 1, '2024-09-01 20:30:00'),
(@student3_user_id, '2024-09-02 07:50:00', '192.168.1.103', 'Mozilla/5.0 (Windows NT 10.0)', 1, NULL),
(@teacher2_user_id, '2024-09-02 07:35:00', '192.168.1.51', 'Mozilla/5.0 (Macintosh)', 1, '2024-09-02 16:30:00'),
(@student1_user_id, '2024-09-01 08:05:00', '192.168.1.101', 'Mozilla/5.0 (Windows NT 10.0)', 0, NULL),
(@student4_user_id, '2024-09-02 08:20:00', '192.168 .1.104', 'Mozilla/5.0 (iPhone)', 1, '2024-09-02 15:00:00'),
(@teacher3_user_id, '2024-09-03 07:40:00', '192.168.1.52', 'Mozilla/5.0 (Windows NT 10.0)', 1, '2024-09-03 16:00:00'),
(@student5_user_id, '2024-09-03 08:10:00', '192.168.1.105', 'Mozilla/5.0 (Android)', 1, NULL),
(@admin_user_id, '2024-09-03 06:55:00', '192.168.1.10', 'Mozilla/5.0 (Windows NT 10.0)', 1, '2024-09-03 17:30:00'),
(@parent2_user_id, '2024-09-02 19:00:00', '41.189.45.24', 'Mozilla/5.0 (Android)', 1, '2024-09-02 19:45:00'),
(@teacher4_user_id, '2024-09-04 07:25:00', '192.168.1.53', 'Mozilla/5.0 (Windows NT 10.0)', 1, '2024-09-04 17:00:00'),
(@student1_user_id + 5, '2024-09-04 08:05:00', '192.168.1.106', 'Mozilla/5.0 (iPhone)', 1, '2024-09-04 14:30:00'),
(@teacher5_user_id, '2024-09-05 07:30:00', '192.168.1.54', 'Mozilla/5.0 (Macintosh)', 1, '2024-09-05 16:45:00'),
(@student1_user_id + 6, '2024-09-05 08:00:00', '192.168.1.107', 'Mozilla/5.0 (Windows NT 10.0)', 1, NULL),
(@parent1_user_id, '2024-09-05 20:15:00', '41.189.45.23', 'Mozilla/5.0 (Android)', 1, '2024-09-05 21:00:00'),
(@superadmin_user_id, '2024-09-01 06:00:00', '10.0.0.5', 'Mozilla/5.0 (Windows NT 10.0)', 1, '2024-09-01 19:00:00');

SET FOREIGN_KEY_CHECKS=1;

-- =========================================
-- COMPLETION SUMMARY
-- =========================================
SELECT 
    '=== EXPANDED SETUP COMPLETED ===' as status UNION ALL
SELECT '' UNION ALL
SELECT '>>> SYSTEM CONFIGURATION:' UNION ALL
SELECT CONCAT('Roles: ', COUNT(*), ' entries') FROM roles UNION ALL
SELECT CONCAT('Permissions: ', COUNT(*), ' entries') FROM permissions UNION ALL
SELECT CONCAT('Grade Scales: ', COUNT(*), ' entries') FROM grade_scales UNION ALL
SELECT '' UNION ALL
SELECT '>>> INSTITUTIONS & STRUCTURE:' UNION ALL
SELECT CONCAT('Institutions: ', COUNT(*), ' entries') FROM institutions UNION ALL
SELECT CONCAT('Academic Years: ', COUNT(*), ' entries') FROM academic_years UNION ALL
SELECT CONCAT('Semesters: ', COUNT(*), ' entries') FROM semesters UNION ALL
SELECT CONCAT('Grade Levels: ', COUNT(*), ' entries') FROM grade_levels UNION ALL
SELECT CONCAT('Programs: ', COUNT(*), ' entries') FROM programs UNION ALL
SELECT CONCAT('Subjects: ', COUNT(*), ' entries') FROM subjects UNION ALL
SELECT '' UNION ALL
SELECT '>>> CLASSES & USERS:' UNION ALL
SELECT CONCAT('Classes: ', COUNT(*), ' entries') FROM classes UNION ALL
SELECT CONCAT('Users: ', COUNT(*), ' entries') FROM users UNION ALL
SELECT CONCAT('Teachers: ', COUNT(*), ' entries') FROM teachers UNION ALL
SELECT CONCAT('Students: ', COUNT(*), ' entries') FROM students UNION ALL
SELECT CONCAT('Parents: ', COUNT(*), ' entries') FROM parents UNION ALL
SELECT CONCAT('Parent-Student Links: ', COUNT(*), ' entries') FROM parent_students UNION ALL
SELECT '' UNION ALL
SELECT '>>> COURSES & ENROLLMENT:' UNION ALL
SELECT CONCAT('Class Subjects: ', COUNT(*), ' entries') FROM class_subjects UNION ALL
SELECT CONCAT('Course Enrollments: ', COUNT(*), ' entries') FROM course_enrollments UNION ALL
SELECT CONCAT('Course Schedules: ', COUNT(*), ' entries') FROM course_schedules UNION ALL
SELECT '' UNION ALL
SELECT '>>> ASSESSMENTS:' UNION ALL
SELECT CONCAT('Assignments: ', COUNT(*), ' entries') FROM assignments UNION ALL
SELECT CONCAT('Quizzes: ', COUNT(*), ' entries') FROM quizzes UNION ALL
SELECT CONCAT('Quiz Questions: ', COUNT(*), ' entries') FROM quiz_questions UNION ALL
SELECT CONCAT('Quiz Options: ', COUNT(*), ' entries') FROM quiz_question_options UNION ALL
SELECT '' UNION ALL
SELECT '>>> COMMUNICATION & TRACKING:' UNION ALL
SELECT CONCAT('Announcements: ', COUNT(*), ' entries') FROM announcements UNION ALL
SELECT CONCAT('Events: ', COUNT(*), ' entries') FROM events UNION ALL
SELECT CONCAT('Messages: ', COUNT(*), ' entries') FROM messages UNION ALL
SELECT CONCAT('Notifications: ', COUNT(*), ' entries') FROM notifications UNION ALL
SELECT CONCAT('Attendance Records: ', COUNT(*), ' entries') FROM attendance UNION ALL
SELECT CONCAT('Login Activity: ', COUNT(*), ' entries') FROM login_activity;

SELECT 
    '=== KEY LOGIN CREDENTIALS ===' as info UNION ALL
SELECT '' UNION ALL
SELECT '>>> PLATFORM ADMIN:' UNION ALL
SELECT 'Username: superadmin | Password: password | Email: superadmin@ghslms.com' UNION ALL
SELECT '' UNION ALL
SELECT '>>> ACCRA SHS (Institution 1):' UNION ALL
SELECT 'Admin: admin | password | admin@accrashs.edu.gh' UNION ALL
SELECT 'Teacher: kofi.mensah | password | kofi.mensah@accrashs.edu.gh' UNION ALL
SELECT 'Teacher: ama.asante | password | ama.asante@accrashs.edu.gh' UNION ALL
SELECT 'Student: kwame.osei | password | kwame.osei@student.accrashs.edu.gh' UNION ALL
SELECT 'Student: abena.adjei | password | abena.adjei@student.accrashs.edu.gh' UNION ALL
SELECT 'Parent: yaw.osei | password | yaw.osei@parent.accrashs.edu.gh';

COMMIT;
