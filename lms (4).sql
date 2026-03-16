-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Mar 15, 2026 at 05:51 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET FOREIGN_KEY_CHECKS=0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `lms`
--
CREATE DATABASE IF NOT EXISTS `lms` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `lms`;

-- --------------------------------------------------------

--
-- Table structure for table `academic_years`
--
-- Creation: Mar 03, 2026 at 08:58 PM
--

DROP TABLE IF EXISTS `academic_years`;
CREATE TABLE IF NOT EXISTS `academic_years` (
  `academic_year_id` int(11) NOT NULL AUTO_INCREMENT,
  `institution_id` int(11) NOT NULL,
  `year_name` varchar(20) NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `is_current` tinyint(1) DEFAULT 0,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`academic_year_id`),
  UNIQUE KEY `unique_year_institution` (`year_name`,`institution_id`),
  KEY `idx_institution_id` (`institution_id`),
  KEY `idx_is_current` (`is_current`),
  KEY `idx_year_name` (`year_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `admins`
--
-- Creation: Mar 10, 2026 at 10:07 PM
-- Last update: Mar 15, 2026 at 03:28 AM
--

DROP TABLE IF EXISTS `admins`;
CREATE TABLE IF NOT EXISTS `admins` (
  `admin_id` int(11) NOT NULL,
  `uuid` char(36) NOT NULL,
  `institution_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `employee_id` varchar(50) NOT NULL,
  `department` varchar(100) DEFAULT NULL,
  `hire_date` date DEFAULT NULL,
  `employment_end_date` date DEFAULT NULL,
  `qualification` varchar(200) DEFAULT NULL,
  `specialization` varchar(100) DEFAULT NULL,
  `bio` text DEFAULT NULL,
  `alternative_email` varchar(100) DEFAULT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'active',
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`admin_id`),
  UNIQUE KEY `user_id` (`user_id`),
  UNIQUE KEY `unique_employee_id_institution` (`employee_id`,`institution_id`),
  UNIQUE KEY `uuid` (`uuid`),
  KEY `idx_admins_institution_id` (`institution_id`),
  KEY `idx_admins_employee_id` (`employee_id`),
  KEY `idx_admins_status` (`status`),
  KEY `idx_admins_uuid` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `admin_activity`
--
-- Creation: Mar 08, 2026 at 07:49 AM
-- Last update: Mar 15, 2026 at 03:55 AM
--

DROP TABLE IF EXISTS `admin_activity`;
CREATE TABLE IF NOT EXISTS `admin_activity` (
  `activity_id` int(11) NOT NULL AUTO_INCREMENT,
  `uuid` char(36) NOT NULL,
  `institution_id` int(11) NOT NULL COMMENT 'Institution the admin belongs to',
  `performed_by` int(11) NOT NULL COMMENT 'user_id of the admin who performed the action',
  `activity_type` varchar(50) NOT NULL COMMENT 'e.g. student_enrolled, teacher_added, class_created, login, update, delete',
  `description` varchar(500) NOT NULL COMMENT 'Human-readable summary shown in the dashboard activity list',
  `entity_type` varchar(50) DEFAULT NULL COMMENT 'Type of resource affected: student, teacher, class, course, user, etc.',
  `entity_id` int(11) DEFAULT NULL COMMENT 'Primary key of the affected entity (optional)',
  `meta` varchar(255) DEFAULT NULL COMMENT 'Extra context shown in the activity list subtitle (e.g. student name, class name)',
  `ip_address` varchar(50) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `severity` enum('info','warning','critical') NOT NULL DEFAULT 'info',
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`activity_id`),
  UNIQUE KEY `uuid` (`uuid`),
  KEY `idx_institution_id` (`institution_id`),
  KEY `idx_performed_by` (`performed_by`),
  KEY `idx_activity_type` (`activity_type`),
  KEY `idx_entity` (`entity_type`,`entity_id`),
  KEY `idx_severity` (`severity`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tracks all meaningful actions performed by institution admins';

-- --------------------------------------------------------

--
-- Table structure for table `announcements`
--
-- Creation: Mar 03, 2026 at 08:58 PM
--

DROP TABLE IF EXISTS `announcements`;
CREATE TABLE IF NOT EXISTS `announcements` (
  `announcement_id` int(11) NOT NULL AUTO_INCREMENT,
  `uuid` char(36) NOT NULL,
  `title` varchar(200) NOT NULL,
  `content` text DEFAULT NULL,
  `author_id` int(11) DEFAULT NULL,
  `target_role` varchar(50) DEFAULT NULL,
  `is_published` tinyint(1) DEFAULT 0,
  `published_at` datetime DEFAULT NULL,
  `expires_at` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`announcement_id`),
  UNIQUE KEY `uuid` (`uuid`),
  UNIQUE KEY `uuid_2` (`uuid`),
  UNIQUE KEY `uuid_3` (`uuid`),
  KEY `FK_announcements_author` (`author_id`),
  KEY `idx_target_role` (`target_role`),
  KEY `idx_is_published` (`is_published`),
  KEY `idx_published_at` (`published_at`),
  KEY `idx_announcements_uuid` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `assessments`
--
-- Creation: Mar 03, 2026 at 08:58 PM
--

DROP TABLE IF EXISTS `assessments`;
CREATE TABLE IF NOT EXISTS `assessments` (
  `assessment_id` int(11) NOT NULL AUTO_INCREMENT,
  `course_id` int(11) NOT NULL,
  `category_id` int(11) DEFAULT NULL,
  `title` varchar(200) NOT NULL,
  `description` text DEFAULT NULL,
  `assessment_type` varchar(50) NOT NULL,
  `max_score` decimal(10,2) DEFAULT 100.00,
  `passing_score` decimal(10,2) DEFAULT 60.00,
  `due_date` datetime DEFAULT NULL,
  `duration_minutes` int(11) DEFAULT NULL,
  `is_published` tinyint(1) DEFAULT 0,
  `weight_percentage` decimal(5,2) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`assessment_id`),
  KEY `idx_course_id` (`course_id`),
  KEY `idx_category_id` (`category_id`),
  KEY `idx_assessment_type` (`assessment_type`),
  KEY `idx_due_date` (`due_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `assessment_categories`
--
-- Creation: Mar 03, 2026 at 08:58 PM
--

DROP TABLE IF EXISTS `assessment_categories`;
CREATE TABLE IF NOT EXISTS `assessment_categories` (
  `category_id` int(11) NOT NULL AUTO_INCREMENT,
  `category_name` varchar(100) NOT NULL,
  `weight_percentage` decimal(5,2) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`category_id`),
  KEY `idx_category_name` (`category_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `assessment_submissions`
--
-- Creation: Mar 03, 2026 at 08:58 PM
--

DROP TABLE IF EXISTS `assessment_submissions`;
CREATE TABLE IF NOT EXISTS `assessment_submissions` (
  `submission_id` int(11) NOT NULL AUTO_INCREMENT,
  `assessment_id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `submission_text` text DEFAULT NULL,
  `file_path` varchar(500) DEFAULT NULL,
  `score` decimal(10,2) DEFAULT NULL,
  `feedback` text DEFAULT NULL,
  `status` varchar(20) DEFAULT 'draft',
  `submitted_at` datetime DEFAULT NULL,
  `graded_at` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`submission_id`),
  KEY `idx_assessment_id` (`assessment_id`),
  KEY `idx_student_id` (`student_id`),
  KEY `idx_status` (`status`),
  KEY `idx_submission_assessment_student` (`assessment_id`,`student_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Triggers `assessment_submissions`
--
DROP TRIGGER IF EXISTS `after_submission_graded`;
DELIMITER $$
CREATE TRIGGER `after_submission_graded` AFTER UPDATE ON `assessment_submissions` FOR EACH ROW BEGIN
    DECLARE student_user_id INT;
    DECLARE assessment_title VARCHAR(200);
    
    IF NEW.graded_at IS NOT NULL AND OLD.graded_at IS NULL THEN
        SELECT user_id INTO student_user_id FROM students WHERE student_id = NEW.student_id;
        SELECT title INTO assessment_title FROM assessments WHERE assessment_id = NEW.assessment_id;
        
        INSERT INTO notifications (uuid, sender_id, user_id, title, message, notification_type)
        VALUES (
            UUID(),
            0,
            student_user_id,
            'Assessment Graded',
            CONCAT('Your submission for "', assessment_title, '" has been graded. Score: ', NEW.score),
            'grading'
        );
    END IF;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `assignments`
--
-- Creation: Mar 03, 2026 at 08:58 PM
--

DROP TABLE IF EXISTS `assignments`;
CREATE TABLE IF NOT EXISTS `assignments` (
  `assignment_id` int(11) NOT NULL AUTO_INCREMENT,
  `uuid` char(36) NOT NULL,
  `course_id` int(11) NOT NULL,
  `section_id` int(11) DEFAULT NULL,
  `title` varchar(200) NOT NULL,
  `description` text DEFAULT NULL,
  `file_path` varchar(500) DEFAULT NULL,
  `max_score` decimal(10,2) DEFAULT 100.00,
  `passing_score` decimal(10,2) DEFAULT 60.00,
  `rubric` text DEFAULT NULL,
  `submission_type` varchar(50) DEFAULT 'both',
  `due_date` datetime DEFAULT NULL,
  `status` varchar(20) DEFAULT 'draft',
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`assignment_id`),
  UNIQUE KEY `uuid` (`uuid`),
  UNIQUE KEY `uuid_2` (`uuid`),
  UNIQUE KEY `uuid_3` (`uuid`),
  KEY `idx_course_id` (`course_id`),
  KEY `idx_section_id` (`section_id`),
  KEY `idx_due_date` (`due_date`),
  KEY `idx_status` (`status`),
  KEY `idx_assignments_uuid` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `assignment_submissions`
--
-- Creation: Mar 03, 2026 at 08:58 PM
--

DROP TABLE IF EXISTS `assignment_submissions`;
CREATE TABLE IF NOT EXISTS `assignment_submissions` (
  `submission_id` int(11) NOT NULL AUTO_INCREMENT,
  `assignment_id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `course_id` int(11) NOT NULL,
  `submission_text` text DEFAULT NULL,
  `submission_file` varchar(500) DEFAULT NULL,
  `score` decimal(10,2) DEFAULT NULL,
  `feedback` text DEFAULT NULL,
  `graded_by` int(11) DEFAULT NULL,
  `graded_at` datetime DEFAULT NULL,
  `status` varchar(20) DEFAULT 'draft',
  `submitted_at` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`submission_id`),
  KEY `FK_assignment_submissions_grader` (`graded_by`),
  KEY `idx_assignment_id` (`assignment_id`),
  KEY `idx_student_id` (`student_id`),
  KEY `idx_course_id` (`course_id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `attendance`
--
-- Creation: Mar 03, 2026 at 08:58 PM
--

DROP TABLE IF EXISTS `attendance`;
CREATE TABLE IF NOT EXISTS `attendance` (
  `attendance_id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) NOT NULL,
  `course_id` int(11) NOT NULL,
  `attendance_date` date NOT NULL,
  `status` varchar(20) NOT NULL,
  `remarks` text DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`attendance_id`),
  UNIQUE KEY `unique_attendance` (`student_id`,`course_id`,`attendance_date`),
  KEY `idx_student_id` (`student_id`),
  KEY `idx_course_id` (`course_id`),
  KEY `idx_attendance_date` (`attendance_date`),
  KEY `idx_attendance_date_range` (`student_id`,`attendance_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `classes`
--
-- Creation: Mar 03, 2026 at 08:58 PM
--

DROP TABLE IF EXISTS `classes`;
CREATE TABLE IF NOT EXISTS `classes` (
  `class_id` int(11) NOT NULL AUTO_INCREMENT,
  `uuid` char(36) NOT NULL,
  `institution_id` int(11) NOT NULL,
  `program_id` int(11) NOT NULL,
  `grade_level_id` int(11) NOT NULL,
  `class_code` varchar(50) NOT NULL,
  `class_name` varchar(200) NOT NULL,
  `section` varchar(50) NOT NULL,
  `academic_year_id` int(11) NOT NULL,
  `class_teacher_id` int(11) DEFAULT NULL,
  `max_students` int(11) DEFAULT 40,
  `room_number` varchar(50) DEFAULT NULL,
  `status` varchar(20) DEFAULT 'active',
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`class_id`),
  UNIQUE KEY `unique_class_code_institution` (`class_code`,`institution_id`),
  UNIQUE KEY `unique_class_composition` (`institution_id`,`program_id`,`grade_level_id`,`section`,`academic_year_id`),
  UNIQUE KEY `uuid` (`uuid`),
  UNIQUE KEY `uuid_2` (`uuid`),
  UNIQUE KEY `uuid_3` (`uuid`),
  KEY `idx_institution_id` (`institution_id`),
  KEY `idx_program_id` (`program_id`),
  KEY `idx_grade_level_id` (`grade_level_id`),
  KEY `idx_class_code` (`class_code`),
  KEY `idx_section` (`section`),
  KEY `idx_academic_year_id` (`academic_year_id`),
  KEY `idx_class_teacher_id` (`class_teacher_id`),
  KEY `idx_status` (`status`),
  KEY `idx_classes_uuid` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `class_subjects`
--
-- Creation: Mar 03, 2026 at 08:58 PM
--

DROP TABLE IF EXISTS `class_subjects`;
CREATE TABLE IF NOT EXISTS `class_subjects` (
  `course_id` int(11) NOT NULL AUTO_INCREMENT,
  `institution_id` int(11) NOT NULL,
  `class_id` int(11) NOT NULL,
  `subject_id` int(11) NOT NULL,
  `teacher_id` int(11) DEFAULT NULL,
  `academic_year_id` int(11) DEFAULT NULL,
  `semester_id` int(11) DEFAULT NULL,
  `duration_weeks` int(11) DEFAULT 16,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `status` varchar(20) DEFAULT 'active',
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`course_id`),
  UNIQUE KEY `unique_class_subject_year` (`institution_id`,`class_id`,`subject_id`,`academic_year_id`,`semester_id`),
  KEY `idx_institution_id` (`institution_id`),
  KEY `idx_class_id` (`class_id`),
  KEY `idx_subject_id` (`subject_id`),
  KEY `idx_teacher_id` (`teacher_id`),
  KEY `idx_academic_year_id` (`academic_year_id`),
  KEY `idx_semester_id` (`semester_id`),
  KEY `idx_status` (`status`),
  KEY `idx_course_teacher_status` (`teacher_id`,`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `course_content`
--
-- Creation: Mar 03, 2026 at 08:58 PM
--

DROP TABLE IF EXISTS `course_content`;
CREATE TABLE IF NOT EXISTS `course_content` (
  `course_content_id` int(11) NOT NULL AUTO_INCREMENT,
  `uuid` char(36) NOT NULL,
  `course_id` int(11) NOT NULL,
  `section_id` int(11) NOT NULL,
  `title` varchar(200) NOT NULL,
  `content_text` text DEFAULT NULL,
  `description` text DEFAULT NULL,
  `content_type` varchar(50) DEFAULT 'lesson',
  `is_active` tinyint(1) DEFAULT 1,
  `created_by` int(11) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`course_content_id`),
  UNIQUE KEY `uuid` (`uuid`),
  UNIQUE KEY `uuid_2` (`uuid`),
  UNIQUE KEY `uuid_3` (`uuid`),
  KEY `FK_course_content_creator` (`created_by`),
  KEY `idx_course_content_course` (`course_id`),
  KEY `idx_course_content_section` (`section_id`),
  KEY `idx_course_content_active` (`is_active`),
  KEY `idx_course_content_uuid` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `course_content_order`
--
-- Creation: Mar 03, 2026 at 08:58 PM
--

DROP TABLE IF EXISTS `course_content_order`;
CREATE TABLE IF NOT EXISTS `course_content_order` (
  `course_content_order_id` int(11) NOT NULL AUTO_INCREMENT,
  `course_id` int(11) NOT NULL,
  `course_section_id` int(11) NOT NULL,
  `course_content_id` int(11) DEFAULT NULL,
  `material_id` int(11) DEFAULT NULL,
  `order_index` int(11) NOT NULL DEFAULT 0,
  `item_type` varchar(20) NOT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`course_content_order_id`),
  KEY `FK_content_order_content` (`course_content_id`),
  KEY `FK_content_order_material` (`material_id`),
  KEY `idx_content_order_course` (`course_id`),
  KEY `idx_content_order_section` (`course_section_id`),
  KEY `idx_content_order_index` (`order_index`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `course_enrollments`
--
-- Creation: Mar 03, 2026 at 08:58 PM
--

DROP TABLE IF EXISTS `course_enrollments`;
CREATE TABLE IF NOT EXISTS `course_enrollments` (
  `enrollment_id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) NOT NULL,
  `course_id` int(11) NOT NULL,
  `enrollment_date` datetime DEFAULT current_timestamp(),
  `completion_date` datetime DEFAULT NULL,
  `status` varchar(20) DEFAULT 'active',
  `progress_percentage` decimal(5,2) DEFAULT 0.00,
  `final_grade` varchar(2) DEFAULT NULL,
  PRIMARY KEY (`enrollment_id`),
  UNIQUE KEY `unique_enrollment` (`student_id`,`course_id`),
  KEY `idx_student_id` (`student_id`),
  KEY `idx_course_id` (`course_id`),
  KEY `idx_status` (`status`),
  KEY `idx_enrollment_student_status` (`student_id`,`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Triggers `course_enrollments`
--
DROP TRIGGER IF EXISTS `after_enrollment_insert`;
DELIMITER $$
CREATE TRIGGER `after_enrollment_insert` AFTER INSERT ON `course_enrollments` FOR EACH ROW BEGIN
    DECLARE student_user_id INT;
    DECLARE class_subject_name VARCHAR(200);
    
    SELECT user_id INTO student_user_id FROM students WHERE student_id = NEW.student_id;
    SELECT class_subject_name INTO class_subject_name FROM class_subjects WHERE course_id = NEW.course_id;
    
    INSERT INTO notifications (uuid, sender_id, user_id, title, message, notification_type)
    VALUES (
        UUID(),
        0,
        student_user_id,
        'Course Enrollment',
        CONCAT('You have been enrolled in ', class_subject_name),
        'enrollment'
    );
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `course_materials`
--
-- Creation: Mar 03, 2026 at 08:58 PM
--

DROP TABLE IF EXISTS `course_materials`;
CREATE TABLE IF NOT EXISTS `course_materials` (
  `material_id` int(11) NOT NULL AUTO_INCREMENT,
  `course_id` int(11) NOT NULL,
  `section_id` int(11) NOT NULL,
  `title` varchar(200) NOT NULL,
  `description` text DEFAULT NULL,
  `material_type` varchar(50) DEFAULT NULL,
  `file_name` varchar(255) DEFAULT NULL,
  `file_path` varchar(500) DEFAULT NULL,
  `file_size` bigint(20) DEFAULT NULL,
  `external_link` varchar(500) DEFAULT NULL,
  `order_index` int(11) DEFAULT 0,
  `is_required` tinyint(1) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `uploaded_by` int(11) DEFAULT NULL,
  `status` varchar(50) DEFAULT 'active',
  `tags` varchar(255) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`material_id`),
  KEY `FK_materials_uploader` (`uploaded_by`),
  KEY `idx_course_id` (`course_id`),
  KEY `idx_section_id` (`section_id`),
  KEY `idx_material_type` (`material_type`),
  KEY `idx_is_active` (`is_active`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `course_reviews`
--
-- Creation: Mar 03, 2026 at 08:58 PM
--

DROP TABLE IF EXISTS `course_reviews`;
CREATE TABLE IF NOT EXISTS `course_reviews` (
  `review_id` int(11) NOT NULL AUTO_INCREMENT,
  `course_id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `rating` int(11) NOT NULL CHECK (`rating` between 1 and 5),
  `review_text` text DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`review_id`),
  UNIQUE KEY `unique_review` (`course_id`,`student_id`),
  KEY `FK_reviews_student` (`student_id`),
  KEY `idx_course_id` (`course_id`),
  KEY `idx_rating` (`rating`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `course_schedules`
--
-- Creation: Mar 03, 2026 at 08:58 PM
--

DROP TABLE IF EXISTS `course_schedules`;
CREATE TABLE IF NOT EXISTS `course_schedules` (
  `schedule_id` int(11) NOT NULL AUTO_INCREMENT,
  `course_id` int(11) NOT NULL,
  `day_of_week` varchar(20) NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `room` varchar(50) DEFAULT NULL,
  `is_recurring` tinyint(1) DEFAULT 1,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`schedule_id`),
  UNIQUE KEY `unique_course_schedules` (`course_id`,`day_of_week`,`start_time`,`end_time`),
  KEY `idx_course_id` (`course_id`),
  KEY `idx_day_of_week` (`day_of_week`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `course_sections`
--
-- Creation: Mar 03, 2026 at 08:58 PM
--

DROP TABLE IF EXISTS `course_sections`;
CREATE TABLE IF NOT EXISTS `course_sections` (
  `course_sections_id` int(11) NOT NULL AUTO_INCREMENT,
  `course_id` int(11) NOT NULL,
  `section_name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `order_index` int(11) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `created_by` int(11) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`course_sections_id`),
  KEY `FK_course_sections_creator` (`created_by`),
  KEY `idx_course_id` (`course_id`),
  KEY `idx_order_index` (`order_index`),
  KEY `idx_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `error_logs`
--
-- Creation: Mar 03, 2026 at 08:58 PM
--

DROP TABLE IF EXISTS `error_logs`;
CREATE TABLE IF NOT EXISTS `error_logs` (
  `error_log_id` int(11) NOT NULL AUTO_INCREMENT,
  `error_message` text DEFAULT NULL,
  `stack_trace` text DEFAULT NULL,
  `source` varchar(200) DEFAULT NULL,
  `severity_level` varchar(20) DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL,
  `ip_address` varchar(50) DEFAULT NULL,
  `is_resolved` tinyint(1) DEFAULT 0,
  `resolved_by` int(11) DEFAULT NULL,
  `resolved_at` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`error_log_id`),
  KEY `FK_error_logs_user` (`user_id`),
  KEY `FK_error_logs_resolved_by` (`resolved_by`),
  KEY `idx_severity_level` (`severity_level`),
  KEY `idx_is_resolved` (`is_resolved`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `events`
--
-- Creation: Mar 03, 2026 at 08:58 PM
--

DROP TABLE IF EXISTS `events`;
CREATE TABLE IF NOT EXISTS `events` (
  `event_id` int(11) NOT NULL AUTO_INCREMENT,
  `uuid` char(36) NOT NULL,
  `institution_id` int(11) NOT NULL,
  `title` varchar(200) NOT NULL,
  `description` text DEFAULT NULL,
  `event_type` varchar(50) DEFAULT NULL,
  `start_date` datetime NOT NULL,
  `end_date` datetime DEFAULT NULL,
  `all_day` tinyint(1) DEFAULT 0,
  `location` varchar(200) DEFAULT NULL,
  `target_role` varchar(50) DEFAULT NULL,
  `course_id` int(11) DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `is_recurring` tinyint(1) DEFAULT 0,
  `recurrence_pattern` varchar(100) DEFAULT NULL,
  `is_published` tinyint(1) DEFAULT 1,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`event_id`),
  UNIQUE KEY `uuid` (`uuid`),
  UNIQUE KEY `uuid_2` (`uuid`),
  UNIQUE KEY `uuid_3` (`uuid`),
  KEY `FK_events_creator` (`created_by`),
  KEY `idx_institution_id` (`institution_id`),
  KEY `idx_event_dates` (`start_date`,`end_date`),
  KEY `idx_event_type` (`event_type`),
  KEY `idx_target_role` (`target_role`),
  KEY `idx_course_id` (`course_id`),
  KEY `idx_events_uuid` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `grade_levels`
--
-- Creation: Mar 03, 2026 at 08:58 PM
--

DROP TABLE IF EXISTS `grade_levels`;
CREATE TABLE IF NOT EXISTS `grade_levels` (
  `grade_level_id` int(11) NOT NULL AUTO_INCREMENT,
  `institution_id` int(11) NOT NULL,
  `grade_level_code` varchar(20) NOT NULL,
  `grade_level_name` varchar(50) NOT NULL,
  `level_order` int(11) NOT NULL,
  `description` text DEFAULT NULL,
  `status` varchar(20) DEFAULT 'active',
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`grade_level_id`),
  UNIQUE KEY `unique_grade_code_institution` (`grade_level_code`,`institution_id`),
  UNIQUE KEY `unique_grade_order_institution` (`institution_id`,`level_order`),
  KEY `idx_institution_id` (`institution_id`),
  KEY `idx_grade_level_code` (`grade_level_code`),
  KEY `idx_level_order` (`level_order`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `grade_reports`
--
-- Creation: Mar 03, 2026 at 08:58 PM
--

DROP TABLE IF EXISTS `grade_reports`;
CREATE TABLE IF NOT EXISTS `grade_reports` (
  `report_id` int(11) NOT NULL AUTO_INCREMENT,
  `uuid` char(36) NOT NULL,
  `institution_id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `academic_year_id` int(11) NOT NULL,
  `semester_id` int(11) DEFAULT NULL,
  `report_type` varchar(50) DEFAULT 'semester',
  `gpa` decimal(4,2) DEFAULT NULL,
  `cgpa` decimal(4,2) DEFAULT NULL,
  `total_credits` int(11) DEFAULT NULL,
  `credits_earned` int(11) DEFAULT NULL,
  `class_rank` int(11) DEFAULT NULL,
  `total_students` int(11) DEFAULT NULL,
  `attendance_percentage` decimal(5,2) DEFAULT NULL,
  `teacher_comment` text DEFAULT NULL,
  `principal_comment` text DEFAULT NULL,
  `conduct_grade` varchar(10) DEFAULT NULL,
  `effort_grade` varchar(10) DEFAULT NULL,
  `report_card_url` varchar(500) DEFAULT NULL,
  `generated_at` datetime DEFAULT NULL,
  `generated_by` int(11) DEFAULT NULL,
  `is_published` tinyint(1) DEFAULT 0,
  `published_at` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`report_id`),
  UNIQUE KEY `uuid` (`uuid`),
  UNIQUE KEY `unique_student_semester_report` (`student_id`,`academic_year_id`,`semester_id`,`report_type`),
  KEY `FK_grade_reports_generator` (`generated_by`),
  KEY `idx_institution_id` (`institution_id`),
  KEY `idx_student_id` (`student_id`),
  KEY `idx_academic_year` (`academic_year_id`),
  KEY `idx_semester` (`semester_id`),
  KEY `idx_report_type` (`report_type`),
  KEY `idx_grade_reports_uuid` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `grade_report_details`
--
-- Creation: Mar 03, 2026 at 08:58 PM
--

DROP TABLE IF EXISTS `grade_report_details`;
CREATE TABLE IF NOT EXISTS `grade_report_details` (
  `report_detail_id` int(11) NOT NULL AUTO_INCREMENT,
  `report_id` int(11) NOT NULL,
  `course_id` int(11) NOT NULL,
  `subject_name` varchar(100) DEFAULT NULL,
  `teacher_name` varchar(200) DEFAULT NULL,
  `credits` int(11) DEFAULT NULL,
  `total_score` decimal(10,2) DEFAULT NULL,
  `percentage` decimal(5,2) DEFAULT NULL,
  `letter_grade` varchar(5) DEFAULT NULL,
  `grade_point` decimal(4,2) DEFAULT NULL,
  `remarks` text DEFAULT NULL,
  `position_in_class` int(11) DEFAULT NULL,
  `class_average` decimal(5,2) DEFAULT NULL,
  `highest_score` decimal(10,2) DEFAULT NULL,
  `lowest_score` decimal(10,2) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`report_detail_id`),
  KEY `idx_report_id` (`report_id`),
  KEY `idx_course_id` (`course_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `grade_scales`
--
-- Creation: Mar 03, 2026 at 08:58 PM
--

DROP TABLE IF EXISTS `grade_scales`;
CREATE TABLE IF NOT EXISTS `grade_scales` (
  `grade_scale_id` int(11) NOT NULL AUTO_INCREMENT,
  `institution_id` int(11) DEFAULT NULL,
  `grade` varchar(5) NOT NULL,
  `min_score` decimal(5,2) NOT NULL,
  `max_score` decimal(5,2) NOT NULL,
  `grade_point` decimal(3,2) DEFAULT NULL,
  `remark` varchar(50) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`grade_scale_id`),
  KEY `idx_institution_id` (`institution_id`),
  KEY `idx_grade` (`grade`),
  KEY `idx_score_range` (`min_score`,`max_score`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `institutions`
--
-- Creation: Mar 03, 2026 at 08:58 PM
-- Last update: Mar 15, 2026 at 02:40 AM
--

DROP TABLE IF EXISTS `institutions`;
CREATE TABLE IF NOT EXISTS `institutions` (
  `institution_id` int(11) NOT NULL AUTO_INCREMENT,
  `uuid` char(36) NOT NULL,
  `institution_code` varchar(20) NOT NULL,
  `institution_name` varchar(200) NOT NULL,
  `institution_type` varchar(50) DEFAULT 'shs',
  `email` varchar(100) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `state` varchar(100) DEFAULT NULL,
  `country` varchar(100) DEFAULT 'Ghana',
  `postal_code` varchar(20) DEFAULT NULL,
  `website` varchar(200) DEFAULT NULL,
  `status` varchar(20) DEFAULT 'active',
  `subscription_plan` varchar(50) DEFAULT NULL,
  `subscription_expires_at` date DEFAULT NULL,
  `max_students` int(11) DEFAULT 500,
  `max_teachers` int(11) DEFAULT 50,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`institution_id`),
  UNIQUE KEY `institution_code` (`institution_code`),
  UNIQUE KEY `uuid` (`uuid`),
  UNIQUE KEY `uuid_2` (`uuid`),
  UNIQUE KEY `uuid_3` (`uuid`),
  KEY `idx_institution_code` (`institution_code`),
  KEY `idx_status` (`status`),
  KEY `idx_institutions_uuid` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `institution_settings`
--
-- Creation: Mar 03, 2026 at 08:58 PM
-- Last update: Mar 15, 2026 at 02:40 AM
--

DROP TABLE IF EXISTS `institution_settings`;
CREATE TABLE IF NOT EXISTS `institution_settings` (
  `setting_id` int(11) NOT NULL AUTO_INCREMENT,
  `institution_id` int(11) NOT NULL,
  `school_name` varchar(200) DEFAULT NULL,
  `motto` varchar(300) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `vision` text DEFAULT NULL,
  `mission` text DEFAULT NULL,
  `logo_url` varchar(500) DEFAULT NULL,
  `banner_url` varchar(500) DEFAULT NULL,
  `theme_primary_color` varchar(20) DEFAULT '#1976d2',
  `theme_secondary_color` varchar(20) DEFAULT '#dc004e',
  `timezone` varchar(50) DEFAULT 'Africa/Accra',
  `academic_year_start_month` int(11) DEFAULT 9,
  `academic_year_end_month` int(11) DEFAULT 6,
  `grading_system` varchar(20) DEFAULT 'percentage',
  `locale` varchar(10) DEFAULT 'en_US',
  `currency` varchar(10) DEFAULT 'GHS',
  `date_format` varchar(20) DEFAULT 'Y-m-d',
  `time_format` varchar(20) DEFAULT 'H:i:s',
  `allow_parent_registration` tinyint(1) DEFAULT 1,
  `allow_student_self_enrollment` tinyint(1) DEFAULT 0,
  `require_email_verification` tinyint(1) DEFAULT 1,
  `custom_css` text DEFAULT NULL,
  `custom_footer` text DEFAULT NULL,
  `social_facebook` varchar(200) DEFAULT NULL,
  `social_twitter` varchar(200) DEFAULT NULL,
  `social_instagram` varchar(200) DEFAULT NULL,
  `social_linkedin` varchar(200) DEFAULT NULL,
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`setting_id`),
  UNIQUE KEY `unique_institution` (`institution_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `login_activity`
--
-- Creation: Mar 03, 2026 at 08:58 PM
-- Last update: Mar 15, 2026 at 04:34 AM
--

DROP TABLE IF EXISTS `login_activity`;
CREATE TABLE IF NOT EXISTS `login_activity` (
  `login_activity_id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `login_time` datetime DEFAULT current_timestamp(),
  `logout_time` datetime DEFAULT NULL,
  `ip_address` varchar(50) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `is_successful` tinyint(1) DEFAULT 1,
  `failure_reason` varchar(200) DEFAULT NULL,
  PRIMARY KEY (`login_activity_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_login_time` (`login_time`),
  KEY `idx_is_successful` (`is_successful`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `messages`
--
-- Creation: Mar 03, 2026 at 08:58 PM
--

DROP TABLE IF EXISTS `messages`;
CREATE TABLE IF NOT EXISTS `messages` (
  `message_id` int(11) NOT NULL AUTO_INCREMENT,
  `uuid` char(36) NOT NULL,
  `sender_id` int(11) NOT NULL,
  `receiver_id` int(11) NOT NULL,
  `course_id` int(11) DEFAULT NULL,
  `subject` varchar(200) DEFAULT NULL,
  `message_text` text NOT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  `parent_message_id` int(11) DEFAULT NULL,
  `sent_at` datetime DEFAULT current_timestamp(),
  `read_at` datetime DEFAULT NULL,
  PRIMARY KEY (`message_id`),
  UNIQUE KEY `uuid` (`uuid`),
  UNIQUE KEY `uuid_2` (`uuid`),
  UNIQUE KEY `uuid_3` (`uuid`),
  KEY `FK_messages_parent` (`parent_message_id`),
  KEY `idx_messages_sender` (`sender_id`),
  KEY `idx_messages_receiver` (`receiver_id`),
  KEY `idx_messages_course` (`course_id`),
  KEY `idx_messages_read` (`is_read`),
  KEY `idx_messages_sent_at` (`sent_at`),
  KEY `idx_messages_uuid` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--
-- Creation: Mar 03, 2026 at 08:58 PM
--

DROP TABLE IF EXISTS `notifications`;
CREATE TABLE IF NOT EXISTS `notifications` (
  `notification_id` int(11) NOT NULL AUTO_INCREMENT,
  `uuid` char(36) NOT NULL,
  `sender_id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `target_role` varchar(50) DEFAULT NULL,
  `course_id` int(11) DEFAULT NULL,
  `title` varchar(200) NOT NULL,
  `message` text DEFAULT NULL,
  `notification_type` varchar(50) DEFAULT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  `link` varchar(500) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `read_at` datetime DEFAULT NULL,
  PRIMARY KEY (`notification_id`),
  UNIQUE KEY `uuid` (`uuid`),
  UNIQUE KEY `uuid_2` (`uuid`),
  UNIQUE KEY `uuid_3` (`uuid`),
  KEY `idx_sender_id` (`sender_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_target_role` (`target_role`),
  KEY `idx_course_id` (`course_id`),
  KEY `idx_is_read` (`is_read`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_notifications_uuid` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `parents`
--
-- Creation: Mar 14, 2026 at 08:44 PM
-- Last update: Mar 14, 2026 at 11:29 PM
--

DROP TABLE IF EXISTS `parents`;
CREATE TABLE IF NOT EXISTS `parents` (
  `parent_id` int(11) NOT NULL AUTO_INCREMENT,
  `institution_id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `guardian_id` varchar(50) DEFAULT NULL,
  `occupation` varchar(100) DEFAULT NULL,
  `prefers_email_notifications` tinyint(1) NOT NULL DEFAULT 1,
  `prefers_sms_notifications` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`parent_id`),
  UNIQUE KEY `user_id` (`user_id`),
  UNIQUE KEY `guardian_id` (`guardian_id`),
  UNIQUE KEY `parent_id` (`parent_id`,`institution_id`,`user_id`,`guardian_id`) USING BTREE,
  KEY `idx_institution_id` (`institution_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `parent_activity`
--
-- Creation: Mar 11, 2026 at 08:36 PM
--

DROP TABLE IF EXISTS `parent_activity`;
CREATE TABLE IF NOT EXISTS `parent_activity` (
  `activity_id` int(11) NOT NULL AUTO_INCREMENT,
  `uuid` char(36) NOT NULL,
  `institution_id` int(11) NOT NULL COMMENT 'Institution the parent belongs to (via their child)',
  `performed_by` int(11) NOT NULL COMMENT 'user_id of the parent who performed the action',
  `activity_type` varchar(50) NOT NULL COMMENT 'e.g. grade_viewed, attendance_viewed, announcement_read, message_sent, login, logout',
  `description` varchar(500) NOT NULL COMMENT 'Human-readable summary shown in the activity list',
  `entity_type` varchar(50) DEFAULT NULL COMMENT 'Type of resource affected: student, grade, attendance, announcement, etc.',
  `entity_id` int(11) DEFAULT NULL COMMENT 'Primary key of the affected entity (optional)',
  `meta` varchar(255) DEFAULT NULL COMMENT 'Extra context: child name, subject, class, etc.',
  `ip_address` varchar(50) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `severity` enum('info','warning','critical') NOT NULL DEFAULT 'info',
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`activity_id`),
  UNIQUE KEY `uuid` (`uuid`),
  KEY `idx_pa_institution_id` (`institution_id`),
  KEY `idx_pa_performed_by` (`performed_by`),
  KEY `idx_pa_activity_type` (`activity_type`),
  KEY `idx_pa_entity` (`entity_type`,`entity_id`),
  KEY `idx_pa_severity` (`severity`),
  KEY `idx_pa_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tracks all meaningful actions performed by parents';

--
-- Triggers `parent_activity`
--
DROP TRIGGER IF EXISTS `trg_parent_activity_purge`;
DELIMITER $$
CREATE TRIGGER `trg_parent_activity_purge` AFTER INSERT ON `parent_activity` FOR EACH ROW BEGIN
  DELETE FROM `parent_activity`
  WHERE `created_at` < (NOW() - INTERVAL 90 DAY);
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `parent_students`
--
-- Creation: Mar 03, 2026 at 08:58 PM
-- Last update: Mar 14, 2026 at 08:22 PM
--

DROP TABLE IF EXISTS `parent_students`;
CREATE TABLE IF NOT EXISTS `parent_students` (
  `parent_student_id` int(11) NOT NULL AUTO_INCREMENT,
  `parent_id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `relationship_type` varchar(50) DEFAULT 'Parent',
  `is_primary_contact` tinyint(1) DEFAULT 0,
  `can_pickup` tinyint(1) DEFAULT 1,
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`parent_student_id`),
  UNIQUE KEY `unique_parent_student` (`parent_id`,`student_id`),
  KEY `idx_parent_id` (`parent_id`),
  KEY `idx_student_id` (`student_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `password_reset_tokens`
--
-- Creation: Mar 03, 2026 at 08:58 PM
-- Last update: Mar 15, 2026 at 04:11 AM
--

DROP TABLE IF EXISTS `password_reset_tokens`;
CREATE TABLE IF NOT EXISTS `password_reset_tokens` (
  `token_id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `token` varchar(100) NOT NULL,
  `expiry_date` datetime NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `used_at` datetime DEFAULT NULL,
  `ip_address` varchar(50) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  PRIMARY KEY (`token_id`),
  UNIQUE KEY `token` (`token`),
  KEY `idx_token` (`token`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_expiry_date` (`expiry_date`),
  KEY `idx_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `permissions`
--
-- Creation: Mar 03, 2026 at 08:58 PM
-- Last update: Mar 14, 2026 at 09:30 AM
--

DROP TABLE IF EXISTS `permissions`;
CREATE TABLE IF NOT EXISTS `permissions` (
  `permission_id` int(11) NOT NULL AUTO_INCREMENT,
  `permission_name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`permission_id`),
  UNIQUE KEY `permission_name` (`permission_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `programs`
--
-- Creation: Mar 03, 2026 at 08:58 PM
--

DROP TABLE IF EXISTS `programs`;
CREATE TABLE IF NOT EXISTS `programs` (
  `program_id` int(11) NOT NULL AUTO_INCREMENT,
  `institution_id` int(11) NOT NULL,
  `program_code` varchar(20) NOT NULL,
  `program_name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `duration_years` int(11) DEFAULT 3,
  `status` varchar(20) DEFAULT 'active',
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`program_id`),
  UNIQUE KEY `unique_program_code_institution` (`program_code`,`institution_id`),
  KEY `idx_institution_id` (`institution_id`),
  KEY `idx_program_code` (`program_code`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `quizzes`
--
-- Creation: Mar 03, 2026 at 08:58 PM
--

DROP TABLE IF EXISTS `quizzes`;
CREATE TABLE IF NOT EXISTS `quizzes` (
  `quiz_id` int(11) NOT NULL AUTO_INCREMENT,
  `course_id` int(11) NOT NULL,
  `section_id` int(11) DEFAULT NULL,
  `title` varchar(200) NOT NULL,
  `description` text DEFAULT NULL,
  `duration_minutes` int(11) NOT NULL,
  `max_attempts` int(11) DEFAULT 1,
  `status` varchar(20) DEFAULT 'draft',
  `quiz_type` varchar(20) DEFAULT 'graded',
  `is_activated` tinyint(1) DEFAULT 0,
  `show_results` varchar(20) DEFAULT 'after_end',
  `start_date` datetime DEFAULT NULL,
  `end_date` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`quiz_id`),
  KEY `idx_course_id` (`course_id`),
  KEY `idx_section_id` (`section_id`),
  KEY `idx_status` (`status`),
  KEY `idx_is_activated` (`is_activated`),
  KEY `idx_start_date` (`start_date`),
  KEY `idx_end_date` (`end_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `quiz_questions`
--
-- Creation: Mar 03, 2026 at 08:58 PM
--

DROP TABLE IF EXISTS `quiz_questions`;
CREATE TABLE IF NOT EXISTS `quiz_questions` (
  `question_id` int(11) NOT NULL AUTO_INCREMENT,
  `quiz_id` int(11) NOT NULL,
  `question_text` text NOT NULL,
  `question_type` varchar(50) NOT NULL,
  `points` int(11) DEFAULT 1,
  `difficulty` varchar(20) DEFAULT NULL,
  `explanation` text DEFAULT NULL,
  `correct_answer` varchar(500) DEFAULT NULL,
  `order_index` int(11) DEFAULT 0,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`question_id`),
  KEY `idx_quiz_id` (`quiz_id`),
  KEY `idx_question_type` (`question_type`),
  KEY `idx_order_index` (`order_index`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `quiz_question_options`
--
-- Creation: Mar 03, 2026 at 08:58 PM
--

DROP TABLE IF EXISTS `quiz_question_options`;
CREATE TABLE IF NOT EXISTS `quiz_question_options` (
  `option_id` int(11) NOT NULL AUTO_INCREMENT,
  `question_id` int(11) NOT NULL,
  `option_label` varchar(5) NOT NULL,
  `option_text` varchar(500) NOT NULL,
  `is_correct` tinyint(1) DEFAULT 0,
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`option_id`),
  KEY `idx_question_id` (`question_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `quiz_submissions`
--
-- Creation: Mar 03, 2026 at 08:58 PM
--

DROP TABLE IF EXISTS `quiz_submissions`;
CREATE TABLE IF NOT EXISTS `quiz_submissions` (
  `submission_id` int(11) NOT NULL AUTO_INCREMENT,
  `quiz_id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `attempt` int(11) DEFAULT 1,
  `score` decimal(10,2) DEFAULT NULL,
  `max_score` decimal(10,2) DEFAULT NULL,
  `status` varchar(50) DEFAULT 'in_progress',
  `duration_minutes` int(11) DEFAULT NULL,
  `submitted_at` datetime DEFAULT NULL,
  `graded_at` datetime DEFAULT NULL,
  `graded_by` int(11) DEFAULT NULL,
  `comments` text DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`submission_id`),
  KEY `FK_quiz_submissions_grader` (`graded_by`),
  KEY `idx_quiz_id` (`quiz_id`),
  KEY `idx_student_id` (`student_id`),
  KEY `idx_status` (`status`),
  KEY `idx_attempt` (`attempt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `quiz_submission_answers`
--
-- Creation: Mar 03, 2026 at 08:58 PM
--

DROP TABLE IF EXISTS `quiz_submission_answers`;
CREATE TABLE IF NOT EXISTS `quiz_submission_answers` (
  `submission_answer_id` int(11) NOT NULL AUTO_INCREMENT,
  `submission_id` int(11) NOT NULL,
  `question_id` int(11) NOT NULL,
  `answer` text DEFAULT NULL,
  `is_correct` tinyint(1) DEFAULT NULL,
  `points_earned` decimal(10,2) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`submission_answer_id`),
  KEY `idx_submission_id` (`submission_id`),
  KEY `idx_question_id` (`question_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `results`
--
-- Creation: Mar 03, 2026 at 08:58 PM
--

DROP TABLE IF EXISTS `results`;
CREATE TABLE IF NOT EXISTS `results` (
  `result_id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) NOT NULL,
  `course_id` int(11) NOT NULL,
  `subject_id` int(11) DEFAULT NULL,
  `semester_id` int(11) DEFAULT NULL,
  `class_score` decimal(5,2) DEFAULT NULL,
  `exam_score` decimal(5,2) DEFAULT NULL,
  `total_score` decimal(5,2) DEFAULT NULL,
  `grade` varchar(2) DEFAULT NULL,
  `grade_point` decimal(3,2) DEFAULT NULL,
  `remark` varchar(50) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`result_id`),
  UNIQUE KEY `unique_student_course_semester` (`student_id`,`course_id`,`semester_id`),
  KEY `idx_student_id` (`student_id`),
  KEY `idx_course_id` (`course_id`),
  KEY `idx_subject_id` (`subject_id`),
  KEY `idx_semester_id` (`semester_id`),
  KEY `idx_grade` (`grade`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `roles`
--
-- Creation: Mar 03, 2026 at 08:58 PM
-- Last update: Mar 14, 2026 at 01:54 PM
--

DROP TABLE IF EXISTS `roles`;
CREATE TABLE IF NOT EXISTS `roles` (
  `role_id` int(11) NOT NULL AUTO_INCREMENT,
  `role_name` varchar(50) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`role_id`),
  UNIQUE KEY `role_name` (`role_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `role_permissions`
--
-- Creation: Mar 03, 2026 at 08:58 PM
-- Last update: Mar 14, 2026 at 09:04 AM
--

DROP TABLE IF EXISTS `role_permissions`;
CREATE TABLE IF NOT EXISTS `role_permissions` (
  `role_permission_id` int(11) NOT NULL AUTO_INCREMENT,
  `role_id` int(11) NOT NULL,
  `permission_id` int(11) NOT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`role_permission_id`),
  UNIQUE KEY `unique_role_permission` (`role_id`,`permission_id`),
  KEY `FK_role_permissions_permission` (`permission_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `schema_migrations`
--
-- Creation: Mar 03, 2026 at 08:58 PM
--

DROP TABLE IF EXISTS `schema_migrations`;
CREATE TABLE IF NOT EXISTS `schema_migrations` (
  `version` varchar(50) NOT NULL,
  `description` varchar(255) NOT NULL,
  `applied_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `applied_by` varchar(100) DEFAULT 'admin',
  `execution_time_ms` int(11) DEFAULT NULL,
  `success` tinyint(1) DEFAULT 1,
  `notes` text DEFAULT NULL,
  PRIMARY KEY (`version`),
  KEY `idx_applied_at` (`applied_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `semesters`
--
-- Creation: Mar 03, 2026 at 08:58 PM
--

DROP TABLE IF EXISTS `semesters`;
CREATE TABLE IF NOT EXISTS `semesters` (
  `semester_id` int(11) NOT NULL AUTO_INCREMENT,
  `institution_id` int(11) NOT NULL,
  `academic_year_id` int(11) NOT NULL,
  `semester_name` varchar(20) NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `is_current` tinyint(1) DEFAULT 0,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`semester_id`),
  KEY `idx_institution_id` (`institution_id`),
  KEY `idx_academic_year_id` (`academic_year_id`),
  KEY `idx_is_current` (`is_current`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `students`
--
-- Creation: Mar 11, 2026 at 06:00 PM
-- Last update: Mar 15, 2026 at 03:55 AM
--

DROP TABLE IF EXISTS `students`;
CREATE TABLE IF NOT EXISTS `students` (
  `student_id` int(11) NOT NULL AUTO_INCREMENT,
  `uuid` char(36) NOT NULL,
  `institution_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `class_id` int(11) DEFAULT NULL,
  `student_id_number` varchar(50) NOT NULL,
  `alternative_email` varchar(100) DEFAULT NULL COMMENT 'alternative_email',
  `enrollment_date` date DEFAULT NULL,
  `gender` varchar(10) DEFAULT NULL,
  `date_of_birth` date DEFAULT NULL,
  `parent_name` varchar(200) DEFAULT NULL,
  `parent_phone` varchar(20) DEFAULT NULL,
  `parent_email` varchar(100) DEFAULT NULL,
  `emergency_contact` varchar(20) DEFAULT NULL,
  `status` varchar(20) DEFAULT 'active',
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`student_id`),
  UNIQUE KEY `user_id` (`user_id`),
  UNIQUE KEY `unique_student_id_institution` (`student_id_number`,`institution_id`),
  UNIQUE KEY `uuid` (`uuid`),
  UNIQUE KEY `uuid_2` (`uuid`),
  UNIQUE KEY `uuid_3` (`uuid`),
  KEY `idx_institution_id` (`institution_id`),
  KEY `idx_class_id` (`class_id`),
  KEY `idx_student_id_number` (`student_id_number`),
  KEY `idx_students_uuid` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `student_activity`
--
-- Creation: Mar 11, 2026 at 08:38 PM
--

DROP TABLE IF EXISTS `student_activity`;
CREATE TABLE IF NOT EXISTS `student_activity` (
  `activity_id` int(11) NOT NULL AUTO_INCREMENT,
  `uuid` char(36) NOT NULL,
  `institution_id` int(11) NOT NULL COMMENT 'Institution the student belongs to',
  `performed_by` int(11) NOT NULL COMMENT 'user_id of the student who performed the action',
  `activity_type` varchar(50) NOT NULL COMMENT 'e.g. assignment_submitted, material_viewed, grade_viewed, login, logout, attendance_checked',
  `description` varchar(500) NOT NULL COMMENT 'Human-readable summary shown in the activity list',
  `entity_type` varchar(50) DEFAULT NULL COMMENT 'Type of resource affected: assignment, material, grade, course, etc.',
  `entity_id` int(11) DEFAULT NULL COMMENT 'Primary key of the affected entity (optional)',
  `meta` varchar(255) DEFAULT NULL COMMENT 'Extra context: subject name, assignment title, score, etc.',
  `ip_address` varchar(50) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `severity` enum('info','warning','critical') NOT NULL DEFAULT 'info',
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`activity_id`),
  UNIQUE KEY `uuid` (`uuid`),
  KEY `idx_sa_institution_id` (`institution_id`),
  KEY `idx_sa_performed_by` (`performed_by`),
  KEY `idx_sa_activity_type` (`activity_type`),
  KEY `idx_sa_entity` (`entity_type`,`entity_id`),
  KEY `idx_sa_severity` (`severity`),
  KEY `idx_sa_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tracks all meaningful actions performed by students';

--
-- Triggers `student_activity`
--
DROP TRIGGER IF EXISTS `trg_student_activity_purge`;
DELIMITER $$
CREATE TRIGGER `trg_student_activity_purge` AFTER INSERT ON `student_activity` FOR EACH ROW BEGIN
  DELETE FROM `student_activity`
  WHERE `created_at` < (NOW() - INTERVAL 90 DAY);
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `subjects`
--
-- Creation: Mar 09, 2026 at 07:02 AM
--

DROP TABLE IF EXISTS `subjects`;
CREATE TABLE IF NOT EXISTS `subjects` (
  `subject_id` int(11) NOT NULL AUTO_INCREMENT,
  `uuid` char(36) NOT NULL,
  `institution_id` int(11) NOT NULL,
  `subject_code` varchar(20) NOT NULL,
  `subject_name` varchar(200) NOT NULL,
  `description` text DEFAULT NULL,
  `credits` int(11) DEFAULT 3,
  `is_core` tinyint(1) DEFAULT 0,
  `image` varchar(500) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`subject_id`),
  UNIQUE KEY `unique_subject_code_institution` (`subject_code`,`institution_id`),
  UNIQUE KEY `uuid` (`uuid`),
  UNIQUE KEY `uuid_2` (`uuid`),
  UNIQUE KEY `uuid_3` (`uuid`),
  KEY `idx_institution_id` (`institution_id`),
  KEY `idx_subject_code` (`subject_code`),
  KEY `idx_is_core` (`is_core`),
  KEY `idx_subjects_uuid` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `subscription_plans`
--
-- Creation: Mar 15, 2026 at 12:40 AM
-- Last update: Mar 15, 2026 at 12:40 AM
--

DROP TABLE IF EXISTS `subscription_plans`;
CREATE TABLE IF NOT EXISTS `subscription_plans` (
  `plan_id` int(11) NOT NULL AUTO_INCREMENT,
  `plan_name` varchar(100) NOT NULL,
  `amount` decimal(12,2) NOT NULL DEFAULT 0.00,
  `currency` varchar(10) NOT NULL DEFAULT 'GHS',
  `duration_months` int(11) NOT NULL DEFAULT 12,
  `max_students` int(11) NOT NULL DEFAULT 0,
  `max_teachers` int(11) NOT NULL DEFAULT 0,
  `features_json` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`features_json`)),
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`plan_id`),
  UNIQUE KEY `uq_subscription_plans_name` (`plan_name`),
  KEY `idx_subscription_plans_active_sort` (`is_active`,`sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `superadmin_activity`
--
-- Creation: Mar 08, 2026 at 05:36 AM
-- Last update: Mar 15, 2026 at 02:40 AM
--

DROP TABLE IF EXISTS `superadmin_activity`;
CREATE TABLE IF NOT EXISTS `superadmin_activity` (
  `activity_id` int(11) NOT NULL AUTO_INCREMENT,
  `uuid` char(36) NOT NULL,
  `performed_by` int(11) NOT NULL COMMENT 'user_id of the super admin who performed the action',
  `activity_type` varchar(50) NOT NULL COMMENT 'e.g. institution_created, admin_created, user_created, backup, update, security, login',
  `description` varchar(500) NOT NULL COMMENT 'Human-readable summary shown in the dashboard activity list',
  `entity_type` varchar(50) DEFAULT NULL COMMENT 'Type of resource affected: institution, user, role, system, etc.',
  `entity_id` int(11) DEFAULT NULL COMMENT 'Primary key of the affected entity (optional)',
  `meta` varchar(255) DEFAULT NULL COMMENT 'Extra context shown in the activity list subtitle (e.g. institution name, username)',
  `ip_address` varchar(50) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `severity` enum('info','warning','critical') NOT NULL DEFAULT 'info',
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`activity_id`),
  UNIQUE KEY `uuid` (`uuid`),
  KEY `idx_performed_by` (`performed_by`),
  KEY `idx_activity_type` (`activity_type`),
  KEY `idx_entity` (`entity_type`,`entity_id`),
  KEY `idx_severity` (`severity`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tracks all meaningful actions performed by super admins';

-- --------------------------------------------------------

--
-- Table structure for table `system_settings`
--
-- Creation: Mar 03, 2026 at 08:58 PM
--

DROP TABLE IF EXISTS `system_settings`;
CREATE TABLE IF NOT EXISTS `system_settings` (
  `settings_id` int(11) NOT NULL AUTO_INCREMENT,
  `settings` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`settings`)),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`settings_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `teachers`
--
-- Creation: Mar 11, 2026 at 04:03 PM
-- Last update: Mar 15, 2026 at 03:52 AM
--

DROP TABLE IF EXISTS `teachers`;
CREATE TABLE IF NOT EXISTS `teachers` (
  `teacher_id` int(11) NOT NULL AUTO_INCREMENT,
  `uuid` char(36) NOT NULL,
  `institution_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `employee_id` varchar(50) NOT NULL,
  `program_id` int(11) DEFAULT NULL,
  `specialization` varchar(100) DEFAULT NULL,
  `alternative_email` varchar(100) DEFAULT NULL COMMENT 'teaher_alternative_email',
  `bio` text DEFAULT NULL COMMENT 'bio of teacher',
  `hire_date` date DEFAULT NULL,
  `employment_end_date` date DEFAULT NULL,
  `qualification` varchar(200) DEFAULT NULL,
  `years_of_experience` int(11) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`teacher_id`),
  UNIQUE KEY `user_id` (`user_id`),
  UNIQUE KEY `unique_employee_id_institution` (`employee_id`,`institution_id`),
  UNIQUE KEY `uuid` (`uuid`),
  UNIQUE KEY `uuid_2` (`uuid`),
  UNIQUE KEY `uuid_3` (`uuid`),
  KEY `idx_institution_id` (`institution_id`),
  KEY `idx_employee_id` (`employee_id`),
  KEY `idx_employment_end_date` (`employment_end_date`),
  KEY `idx_teachers_uuid` (`uuid`),
  KEY `idx_program_id` (`program_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `teacher_activity`
--
-- Creation: Mar 11, 2026 at 08:42 PM
--

DROP TABLE IF EXISTS `teacher_activity`;
CREATE TABLE IF NOT EXISTS `teacher_activity` (
  `activity_id` int(11) NOT NULL AUTO_INCREMENT,
  `uuid` char(36) NOT NULL,
  `institution_id` int(11) NOT NULL COMMENT 'Institution the teacher belongs to',
  `performed_by` int(11) NOT NULL COMMENT 'user_id of the teacher who performed the action',
  `activity_type` varchar(50) NOT NULL COMMENT 'e.g. grade_added, assignment_created, attendance_marked, material_uploaded, login, logout',
  `description` varchar(500) NOT NULL COMMENT 'Human-readable summary shown in the activity list',
  `entity_type` varchar(50) DEFAULT NULL COMMENT 'Type of resource affected: student, class, course, assignment, grade, etc.',
  `entity_id` int(11) DEFAULT NULL COMMENT 'Primary key of the affected entity (optional)',
  `meta` varchar(255) DEFAULT NULL COMMENT 'Extra context: student name, class name, subject, etc.',
  `ip_address` varchar(50) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `severity` enum('info','warning','critical') NOT NULL DEFAULT 'info',
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`activity_id`),
  UNIQUE KEY `uuid` (`uuid`),
  KEY `idx_ta_institution_id` (`institution_id`),
  KEY `idx_ta_performed_by` (`performed_by`),
  KEY `idx_ta_activity_type` (`activity_type`),
  KEY `idx_ta_entity` (`entity_type`,`entity_id`),
  KEY `idx_ta_severity` (`severity`),
  KEY `idx_ta_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tracks all meaningful actions performed by teachers';

--
-- Triggers `teacher_activity`
--
DROP TRIGGER IF EXISTS `trg_teacher_activity_purge`;
DELIMITER $$
CREATE TRIGGER `trg_teacher_activity_purge` AFTER INSERT ON `teacher_activity` FOR EACH ROW BEGIN
  DELETE FROM `teacher_activity`
  WHERE `created_at` < (NOW() - INTERVAL 90 DAY);
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `teacher_subjects`
--
-- Creation: Mar 03, 2026 at 08:58 PM
--

DROP TABLE IF EXISTS `teacher_subjects`;
CREATE TABLE IF NOT EXISTS `teacher_subjects` (
  `teacher_subject_id` int(11) NOT NULL AUTO_INCREMENT,
  `teacher_id` int(11) NOT NULL,
  `subject_id` int(11) NOT NULL,
  `assigned_date` date DEFAULT curdate(),
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`teacher_subject_id`),
  KEY `idx_teacher_id` (`teacher_id`),
  KEY `idx_subject_id` (`subject_id`),
  KEY `idx_teacher_subject` (`teacher_id`,`subject_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--
-- Creation: Mar 11, 2026 at 03:18 AM
-- Last update: Mar 15, 2026 at 04:35 AM
--

DROP TABLE IF EXISTS `users`;
CREATE TABLE IF NOT EXISTS `users` (
  `user_id` int(11) NOT NULL AUTO_INCREMENT,
  `uuid` char(36) NOT NULL,
  `institution_id` int(11) DEFAULT NULL,
  `username` varchar(50) NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `password_hash` varchar(255) NOT NULL,
  `first_name` varchar(100) DEFAULT NULL,
  `last_name` varchar(100) DEFAULT NULL,
  `phone_number` varchar(20) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `region` varchar(100) DEFAULT NULL,
  `date_of_birth` date DEFAULT NULL,
  `title` varchar(10) DEFAULT NULL,
  `gender` varchar(10) DEFAULT NULL,
  `is_super_admin` tinyint(1) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` datetime DEFAULT NULL,
  `profile_photo` varchar(500) DEFAULT NULL,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `uuid` (`uuid`),
  UNIQUE KEY `uuid_2` (`uuid`),
  UNIQUE KEY `uuid_3` (`uuid`),
  UNIQUE KEY `unique_username_institution` (`username`,`institution_id`),
  UNIQUE KEY `unique_email_institution` (`email`,`institution_id`),
  KEY `idx_institution` (`institution_id`),
  KEY `idx_username` (`username`),
  KEY `idx_email` (`email`),
  KEY `idx_is_super_admin` (`is_super_admin`),
  KEY `idx_is_active` (`is_active`),
  KEY `idx_user_active` (`is_active`,`created_at`),
  KEY `idx_users_uuid` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `user_activity`
--
-- Creation: Mar 03, 2026 at 08:58 PM
-- Last update: Mar 15, 2026 at 04:35 AM
--

DROP TABLE IF EXISTS `user_activity`;
CREATE TABLE IF NOT EXISTS `user_activity` (
  `activity_id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `activity_type` varchar(50) NOT NULL,
  `activity_details` text DEFAULT NULL,
  `ip_address` varchar(50) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`activity_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_activity_type` (`activity_type`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `user_roles`
--
-- Creation: Mar 13, 2026 at 05:48 AM
-- Last update: Mar 15, 2026 at 03:52 AM
--

DROP TABLE IF EXISTS `user_roles`;
CREATE TABLE IF NOT EXISTS `user_roles` (
  `user_role_id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `role_id` int(11) NOT NULL,
  `assigned_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`user_role_id`),
  UNIQUE KEY `unique_user_role` (`user_id`,`role_id`),
  UNIQUE KEY `user_role_id` (`user_role_id`),
  UNIQUE KEY `unique_user_id` (`user_id`) USING BTREE,
  KEY `FK_user_roles_role` (`role_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Stand-in structure for view `vw_classes`
-- (See below for the actual view)
--
DROP VIEW IF EXISTS `vw_classes`;
CREATE TABLE IF NOT EXISTS `vw_classes` (
`class_id` int(11)
,`class_code` varchar(50)
,`class_name` varchar(200)
,`program_id` int(11)
,`program_code` varchar(20)
,`program_name` varchar(100)
,`grade_level_id` int(11)
,`grade_level_code` varchar(20)
,`grade_level_name` varchar(50)
,`level_order` int(11)
,`section` varchar(50)
,`room_number` varchar(50)
,`max_students` int(11)
,`status` varchar(20)
,`institution_id` int(11)
,`institution_name` varchar(200)
,`academic_year_id` int(11)
,`year_name` varchar(20)
,`class_teacher_id` int(11)
,`class_teacher_first_name` varchar(100)
,`class_teacher_last_name` varchar(100)
,`class_teacher_email` varchar(100)
,`total_students` bigint(21)
,`active_students` bigint(21)
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `vw_student_courses`
-- (See below for the actual view)
--
DROP VIEW IF EXISTS `vw_student_courses`;
CREATE TABLE IF NOT EXISTS `vw_student_courses` (
`student_id` int(11)
,`student_id_number` varchar(50)
,`class_id` int(11)
,`class_code` varchar(50)
,`class_name` varchar(200)
,`program_id` int(11)
,`program_code` varchar(20)
,`class_program` varchar(100)
,`grade_level_id` int(11)
,`grade_level_code` varchar(20)
,`class_grade_level` varchar(50)
,`class_section` varchar(50)
,`first_name` varchar(100)
,`last_name` varchar(100)
,`email` varchar(100)
,`course_id` int(11)
,`subject_id` int(11)
,`subject_name` varchar(200)
,`subject_code` varchar(20)
,`is_core` tinyint(1)
,`enrollment_date` datetime
,`enrollment_status` varchar(20)
,`progress_percentage` decimal(5,2)
,`final_grade` varchar(2)
,`teacher_id` int(11)
,`teacher_first_name` varchar(100)
,`teacher_last_name` varchar(100)
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `vw_teacher_courses`
-- (See below for the actual view)
--
DROP VIEW IF EXISTS `vw_teacher_courses`;
CREATE TABLE IF NOT EXISTS `vw_teacher_courses` (
`teacher_id` int(11)
,`employee_id` varchar(50)
,`first_name` varchar(100)
,`last_name` varchar(100)
,`email` varchar(100)
,`course_id` int(11)
,`class_id` int(11)
,`class_code` varchar(50)
,`class_name` varchar(200)
,`program_id` int(11)
,`program_code` varchar(20)
,`class_program` varchar(100)
,`grade_level_id` int(11)
,`grade_level_code` varchar(20)
,`class_grade_level` varchar(50)
,`class_section` varchar(50)
,`subject_id` int(11)
,`subject_name` varchar(200)
,`subject_code` varchar(20)
,`is_core` tinyint(1)
,`status` varchar(20)
,`start_date` date
,`end_date` date
,`enrolled_students` bigint(21)
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `vw_user_roles`
-- (See below for the actual view)
--
DROP VIEW IF EXISTS `vw_user_roles`;
CREATE TABLE IF NOT EXISTS `vw_user_roles` (
`user_id` int(11)
,`username` varchar(50)
,`email` varchar(100)
,`first_name` varchar(100)
,`last_name` varchar(100)
,`is_active` tinyint(1)
,`roles` mediumtext
,`permissions` mediumtext
);

-- --------------------------------------------------------

--
-- Structure for view `vw_classes`
--
DROP TABLE IF EXISTS `vw_classes`;

DROP VIEW IF EXISTS `vw_classes`;
CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vw_classes`  AS SELECT `cls`.`class_id` AS `class_id`, `cls`.`class_code` AS `class_code`, `cls`.`class_name` AS `class_name`, `p`.`program_id` AS `program_id`, `p`.`program_code` AS `program_code`, `p`.`program_name` AS `program_name`, `gl`.`grade_level_id` AS `grade_level_id`, `gl`.`grade_level_code` AS `grade_level_code`, `gl`.`grade_level_name` AS `grade_level_name`, `gl`.`level_order` AS `level_order`, `cls`.`section` AS `section`, `cls`.`room_number` AS `room_number`, `cls`.`max_students` AS `max_students`, `cls`.`status` AS `status`, `i`.`institution_id` AS `institution_id`, `i`.`institution_name` AS `institution_name`, `ay`.`academic_year_id` AS `academic_year_id`, `ay`.`year_name` AS `year_name`, `t`.`teacher_id` AS `class_teacher_id`, `u`.`first_name` AS `class_teacher_first_name`, `u`.`last_name` AS `class_teacher_last_name`, `u`.`email` AS `class_teacher_email`, count(distinct `s`.`student_id`) AS `total_students`, count(distinct case when `s`.`status` = 'active' then `s`.`student_id` end) AS `active_students` FROM (((((((`classes` `cls` join `institutions` `i` on(`cls`.`institution_id` = `i`.`institution_id`)) join `programs` `p` on(`cls`.`program_id` = `p`.`program_id`)) join `grade_levels` `gl` on(`cls`.`grade_level_id` = `gl`.`grade_level_id`)) join `academic_years` `ay` on(`cls`.`academic_year_id` = `ay`.`academic_year_id`)) left join `teachers` `t` on(`cls`.`class_teacher_id` = `t`.`teacher_id`)) left join `users` `u` on(`t`.`user_id` = `u`.`user_id`)) left join `students` `s` on(`cls`.`class_id` = `s`.`class_id`)) GROUP BY `cls`.`class_id` ;

-- --------------------------------------------------------

--
-- Structure for view `vw_student_courses`
--
DROP TABLE IF EXISTS `vw_student_courses`;

DROP VIEW IF EXISTS `vw_student_courses`;
CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vw_student_courses`  AS SELECT `s`.`student_id` AS `student_id`, `s`.`student_id_number` AS `student_id_number`, `cls`.`class_id` AS `class_id`, `cls`.`class_code` AS `class_code`, `cls`.`class_name` AS `class_name`, `p`.`program_id` AS `program_id`, `p`.`program_code` AS `program_code`, `p`.`program_name` AS `class_program`, `gl`.`grade_level_id` AS `grade_level_id`, `gl`.`grade_level_code` AS `grade_level_code`, `gl`.`grade_level_name` AS `class_grade_level`, `cls`.`section` AS `class_section`, `u`.`first_name` AS `first_name`, `u`.`last_name` AS `last_name`, `u`.`email` AS `email`, `c`.`course_id` AS `course_id`, `sub`.`subject_id` AS `subject_id`, `sub`.`subject_name` AS `subject_name`, `sub`.`subject_code` AS `subject_code`, `sub`.`is_core` AS `is_core`, `ce`.`enrollment_date` AS `enrollment_date`, `ce`.`status` AS `enrollment_status`, `ce`.`progress_percentage` AS `progress_percentage`, `ce`.`final_grade` AS `final_grade`, `t`.`teacher_id` AS `teacher_id`, `ut`.`first_name` AS `teacher_first_name`, `ut`.`last_name` AS `teacher_last_name` FROM (((((((((`students` `s` join `users` `u` on(`s`.`user_id` = `u`.`user_id`)) left join `classes` `cls` on(`s`.`class_id` = `cls`.`class_id`)) left join `programs` `p` on(`cls`.`program_id` = `p`.`program_id`)) left join `grade_levels` `gl` on(`cls`.`grade_level_id` = `gl`.`grade_level_id`)) join `course_enrollments` `ce` on(`s`.`student_id` = `ce`.`student_id`)) join `class_subjects` `c` on(`ce`.`course_id` = `c`.`course_id`)) left join `subjects` `sub` on(`c`.`subject_id` = `sub`.`subject_id`)) left join `teachers` `t` on(`c`.`teacher_id` = `t`.`teacher_id`)) left join `users` `ut` on(`t`.`user_id` = `ut`.`user_id`)) WHERE `u`.`deleted_at` is null AND `ce`.`status` = 'active' ;

-- --------------------------------------------------------

--
-- Structure for view `vw_teacher_courses`
--
DROP TABLE IF EXISTS `vw_teacher_courses`;

DROP VIEW IF EXISTS `vw_teacher_courses`;
CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vw_teacher_courses`  AS SELECT `t`.`teacher_id` AS `teacher_id`, `t`.`employee_id` AS `employee_id`, `u`.`first_name` AS `first_name`, `u`.`last_name` AS `last_name`, `u`.`email` AS `email`, `c`.`course_id` AS `course_id`, `cls`.`class_id` AS `class_id`, `cls`.`class_code` AS `class_code`, `cls`.`class_name` AS `class_name`, `p`.`program_id` AS `program_id`, `p`.`program_code` AS `program_code`, `p`.`program_name` AS `class_program`, `gl`.`grade_level_id` AS `grade_level_id`, `gl`.`grade_level_code` AS `grade_level_code`, `gl`.`grade_level_name` AS `class_grade_level`, `cls`.`section` AS `class_section`, `sub`.`subject_id` AS `subject_id`, `sub`.`subject_name` AS `subject_name`, `sub`.`subject_code` AS `subject_code`, `sub`.`is_core` AS `is_core`, `c`.`status` AS `status`, `c`.`start_date` AS `start_date`, `c`.`end_date` AS `end_date`, count(distinct `ce`.`student_id`) AS `enrolled_students` FROM (((((((`teachers` `t` join `users` `u` on(`t`.`user_id` = `u`.`user_id`)) join `class_subjects` `c` on(`t`.`teacher_id` = `c`.`teacher_id`)) left join `classes` `cls` on(`c`.`class_id` = `cls`.`class_id`)) left join `programs` `p` on(`cls`.`program_id` = `p`.`program_id`)) left join `grade_levels` `gl` on(`cls`.`grade_level_id` = `gl`.`grade_level_id`)) left join `subjects` `sub` on(`c`.`subject_id` = `sub`.`subject_id`)) left join `course_enrollments` `ce` on(`c`.`course_id` = `ce`.`course_id` and `ce`.`status` = 'active')) WHERE `u`.`deleted_at` is null GROUP BY `t`.`teacher_id`, `c`.`course_id` ;

-- --------------------------------------------------------

--
-- Structure for view `vw_user_roles`
--
DROP TABLE IF EXISTS `vw_user_roles`;

DROP VIEW IF EXISTS `vw_user_roles`;
CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vw_user_roles`  AS SELECT `u`.`user_id` AS `user_id`, `u`.`username` AS `username`, `u`.`email` AS `email`, `u`.`first_name` AS `first_name`, `u`.`last_name` AS `last_name`, `u`.`is_active` AS `is_active`, group_concat(`r`.`role_name` order by `r`.`role_name` ASC separator ',') AS `roles`, group_concat(`p`.`permission_name` order by `p`.`permission_name` ASC separator ',') AS `permissions` FROM ((((`users` `u` left join `user_roles` `ur` on(`u`.`user_id` = `ur`.`user_id`)) left join `roles` `r` on(`ur`.`role_id` = `r`.`role_id`)) left join `role_permissions` `rp` on(`r`.`role_id` = `rp`.`role_id`)) left join `permissions` `p` on(`rp`.`permission_id` = `p`.`permission_id`)) WHERE `u`.`deleted_at` is null GROUP BY `u`.`user_id` ;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `academic_years`
--
ALTER TABLE `academic_years`
  ADD CONSTRAINT `FK_academic_years_institution` FOREIGN KEY (`institution_id`) REFERENCES `institutions` (`institution_id`) ON DELETE CASCADE;

--
-- Constraints for table `admins`
--
ALTER TABLE `admins`
  ADD CONSTRAINT `FK_admins_institution` FOREIGN KEY (`institution_id`) REFERENCES `institutions` (`institution_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `FK_admins_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `admin_activity`
--
ALTER TABLE `admin_activity`
  ADD CONSTRAINT `FK_admin_activity_institution` FOREIGN KEY (`institution_id`) REFERENCES `institutions` (`institution_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `FK_admin_activity_user` FOREIGN KEY (`performed_by`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `announcements`
--
ALTER TABLE `announcements`
  ADD CONSTRAINT `FK_announcements_author` FOREIGN KEY (`author_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL;

--
-- Constraints for table `assessments`
--
ALTER TABLE `assessments`
  ADD CONSTRAINT `FK_assessments_category` FOREIGN KEY (`category_id`) REFERENCES `assessment_categories` (`category_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `FK_assessments_course` FOREIGN KEY (`course_id`) REFERENCES `class_subjects` (`course_id`) ON DELETE CASCADE;

--
-- Constraints for table `assessment_submissions`
--
ALTER TABLE `assessment_submissions`
  ADD CONSTRAINT `FK_submissions_assessment` FOREIGN KEY (`assessment_id`) REFERENCES `assessments` (`assessment_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `FK_submissions_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`student_id`) ON DELETE CASCADE;

--
-- Constraints for table `assignments`
--
ALTER TABLE `assignments`
  ADD CONSTRAINT `FK_assignments_course` FOREIGN KEY (`course_id`) REFERENCES `class_subjects` (`course_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `FK_assignments_section` FOREIGN KEY (`section_id`) REFERENCES `course_sections` (`course_sections_id`) ON DELETE SET NULL;

--
-- Constraints for table `assignment_submissions`
--
ALTER TABLE `assignment_submissions`
  ADD CONSTRAINT `FK_assignment_submissions_assignment` FOREIGN KEY (`assignment_id`) REFERENCES `assignments` (`assignment_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `FK_assignment_submissions_course` FOREIGN KEY (`course_id`) REFERENCES `class_subjects` (`course_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `FK_assignment_submissions_grader` FOREIGN KEY (`graded_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `FK_assignment_submissions_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`student_id`) ON DELETE CASCADE;

--
-- Constraints for table `attendance`
--
ALTER TABLE `attendance`
  ADD CONSTRAINT `FK_attendance_course` FOREIGN KEY (`course_id`) REFERENCES `class_subjects` (`course_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `FK_attendance_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`student_id`) ON DELETE CASCADE;

--
-- Constraints for table `classes`
--
ALTER TABLE `classes`
  ADD CONSTRAINT `FK_classes_academic_year` FOREIGN KEY (`academic_year_id`) REFERENCES `academic_years` (`academic_year_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `FK_classes_grade_level` FOREIGN KEY (`grade_level_id`) REFERENCES `grade_levels` (`grade_level_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `FK_classes_institution` FOREIGN KEY (`institution_id`) REFERENCES `institutions` (`institution_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `FK_classes_program` FOREIGN KEY (`program_id`) REFERENCES `programs` (`program_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `FK_classes_teacher` FOREIGN KEY (`class_teacher_id`) REFERENCES `teachers` (`teacher_id`) ON DELETE SET NULL;

--
-- Constraints for table `class_subjects`
--
ALTER TABLE `class_subjects`
  ADD CONSTRAINT `FK_class_subjects_academic_year` FOREIGN KEY (`academic_year_id`) REFERENCES `academic_years` (`academic_year_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `FK_class_subjects_class` FOREIGN KEY (`class_id`) REFERENCES `classes` (`class_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `FK_class_subjects_institution` FOREIGN KEY (`institution_id`) REFERENCES `institutions` (`institution_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `FK_class_subjects_semester` FOREIGN KEY (`semester_id`) REFERENCES `semesters` (`semester_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `FK_class_subjects_subject` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`subject_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `FK_class_subjects_teacher` FOREIGN KEY (`teacher_id`) REFERENCES `teachers` (`teacher_id`) ON DELETE SET NULL;

--
-- Constraints for table `course_content`
--
ALTER TABLE `course_content`
  ADD CONSTRAINT `FK_course_content_course` FOREIGN KEY (`course_id`) REFERENCES `class_subjects` (`course_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `FK_course_content_creator` FOREIGN KEY (`created_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `FK_course_content_section` FOREIGN KEY (`section_id`) REFERENCES `course_sections` (`course_sections_id`) ON DELETE CASCADE;

--
-- Constraints for table `course_content_order`
--
ALTER TABLE `course_content_order`
  ADD CONSTRAINT `FK_content_order_content` FOREIGN KEY (`course_content_id`) REFERENCES `course_content` (`course_content_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `FK_content_order_course` FOREIGN KEY (`course_id`) REFERENCES `class_subjects` (`course_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `FK_content_order_material` FOREIGN KEY (`material_id`) REFERENCES `course_materials` (`material_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `FK_content_order_section` FOREIGN KEY (`course_section_id`) REFERENCES `course_sections` (`course_sections_id`) ON DELETE CASCADE;

--
-- Constraints for table `course_enrollments`
--
ALTER TABLE `course_enrollments`
  ADD CONSTRAINT `FK_enrollments_course` FOREIGN KEY (`course_id`) REFERENCES `class_subjects` (`course_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `FK_enrollments_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`student_id`) ON DELETE CASCADE;

--
-- Constraints for table `course_materials`
--
ALTER TABLE `course_materials`
  ADD CONSTRAINT `FK_materials_course` FOREIGN KEY (`course_id`) REFERENCES `class_subjects` (`course_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `FK_materials_section` FOREIGN KEY (`section_id`) REFERENCES `course_sections` (`course_sections_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `FK_materials_uploader` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL;

--
-- Constraints for table `course_reviews`
--
ALTER TABLE `course_reviews`
  ADD CONSTRAINT `FK_reviews_course` FOREIGN KEY (`course_id`) REFERENCES `class_subjects` (`course_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `FK_reviews_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`student_id`) ON DELETE CASCADE;

--
-- Constraints for table `course_schedules`
--
ALTER TABLE `course_schedules`
  ADD CONSTRAINT `FK_schedules_course` FOREIGN KEY (`course_id`) REFERENCES `class_subjects` (`course_id`) ON DELETE CASCADE;

--
-- Constraints for table `course_sections`
--
ALTER TABLE `course_sections`
  ADD CONSTRAINT `FK_course_sections_course` FOREIGN KEY (`course_id`) REFERENCES `class_subjects` (`course_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `FK_course_sections_creator` FOREIGN KEY (`created_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL;

--
-- Constraints for table `error_logs`
--
ALTER TABLE `error_logs`
  ADD CONSTRAINT `FK_error_logs_resolved_by` FOREIGN KEY (`resolved_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `FK_error_logs_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL;

--
-- Constraints for table `events`
--
ALTER TABLE `events`
  ADD CONSTRAINT `FK_events_course` FOREIGN KEY (`course_id`) REFERENCES `class_subjects` (`course_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `FK_events_creator` FOREIGN KEY (`created_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `FK_events_institution` FOREIGN KEY (`institution_id`) REFERENCES `institutions` (`institution_id`) ON DELETE CASCADE;

--
-- Constraints for table `grade_levels`
--
ALTER TABLE `grade_levels`
  ADD CONSTRAINT `FK_grade_levels_institution` FOREIGN KEY (`institution_id`) REFERENCES `institutions` (`institution_id`) ON DELETE CASCADE;

--
-- Constraints for table `grade_reports`
--
ALTER TABLE `grade_reports`
  ADD CONSTRAINT `FK_grade_reports_generator` FOREIGN KEY (`generated_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `FK_grade_reports_institution` FOREIGN KEY (`institution_id`) REFERENCES `institutions` (`institution_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `FK_grade_reports_semester` FOREIGN KEY (`semester_id`) REFERENCES `semesters` (`semester_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `FK_grade_reports_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`student_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `FK_grade_reports_year` FOREIGN KEY (`academic_year_id`) REFERENCES `academic_years` (`academic_year_id`) ON DELETE CASCADE;

--
-- Constraints for table `grade_report_details`
--
ALTER TABLE `grade_report_details`
  ADD CONSTRAINT `FK_report_details_course` FOREIGN KEY (`course_id`) REFERENCES `class_subjects` (`course_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `FK_report_details_report` FOREIGN KEY (`report_id`) REFERENCES `grade_reports` (`report_id`) ON DELETE CASCADE;

--
-- Constraints for table `grade_scales`
--
ALTER TABLE `grade_scales`
  ADD CONSTRAINT `FK_grade_scales_institution` FOREIGN KEY (`institution_id`) REFERENCES `institutions` (`institution_id`) ON DELETE CASCADE;

--
-- Constraints for table `institution_settings`
--
ALTER TABLE `institution_settings`
  ADD CONSTRAINT `FK_institution_settings` FOREIGN KEY (`institution_id`) REFERENCES `institutions` (`institution_id`) ON DELETE CASCADE;

--
-- Constraints for table `login_activity`
--
ALTER TABLE `login_activity`
  ADD CONSTRAINT `FK_login_activity_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL;

--
-- Constraints for table `messages`
--
ALTER TABLE `messages`
  ADD CONSTRAINT `FK_messages_course` FOREIGN KEY (`course_id`) REFERENCES `class_subjects` (`course_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `FK_messages_parent` FOREIGN KEY (`parent_message_id`) REFERENCES `messages` (`message_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `FK_messages_receiver` FOREIGN KEY (`receiver_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `FK_messages_sender` FOREIGN KEY (`sender_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `FK_notifications_course` FOREIGN KEY (`course_id`) REFERENCES `class_subjects` (`course_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `FK_notifications_sender` FOREIGN KEY (`sender_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `FK_notifications_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `parents`
--
ALTER TABLE `parents`
  ADD CONSTRAINT `FK_parents_institution` FOREIGN KEY (`institution_id`) REFERENCES `institutions` (`institution_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `FK_parents_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL;

--
-- Constraints for table `parent_activity`
--
ALTER TABLE `parent_activity`
  ADD CONSTRAINT `parent_activity_ibfk_1` FOREIGN KEY (`performed_by`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `parent_activity_ibfk_2` FOREIGN KEY (`institution_id`) REFERENCES `institutions` (`institution_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `parent_students`
--
ALTER TABLE `parent_students`
  ADD CONSTRAINT `FK_parent_students_parent` FOREIGN KEY (`parent_id`) REFERENCES `parents` (`parent_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `FK_parent_students_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`student_id`) ON DELETE CASCADE;

--
-- Constraints for table `password_reset_tokens`
--
ALTER TABLE `password_reset_tokens`
  ADD CONSTRAINT `FK_password_reset_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `programs`
--
ALTER TABLE `programs`
  ADD CONSTRAINT `FK_programs_institution` FOREIGN KEY (`institution_id`) REFERENCES `institutions` (`institution_id`) ON DELETE CASCADE;

--
-- Constraints for table `quizzes`
--
ALTER TABLE `quizzes`
  ADD CONSTRAINT `FK_quizzes_course` FOREIGN KEY (`course_id`) REFERENCES `class_subjects` (`course_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `FK_quizzes_section` FOREIGN KEY (`section_id`) REFERENCES `course_sections` (`course_sections_id`) ON DELETE SET NULL;

--
-- Constraints for table `quiz_questions`
--
ALTER TABLE `quiz_questions`
  ADD CONSTRAINT `FK_quiz_questions_quiz` FOREIGN KEY (`quiz_id`) REFERENCES `quizzes` (`quiz_id`) ON DELETE CASCADE;

--
-- Constraints for table `quiz_question_options`
--
ALTER TABLE `quiz_question_options`
  ADD CONSTRAINT `FK_quiz_options_question` FOREIGN KEY (`question_id`) REFERENCES `quiz_questions` (`question_id`) ON DELETE CASCADE;

--
-- Constraints for table `quiz_submissions`
--
ALTER TABLE `quiz_submissions`
  ADD CONSTRAINT `FK_quiz_submissions_grader` FOREIGN KEY (`graded_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `FK_quiz_submissions_quiz` FOREIGN KEY (`quiz_id`) REFERENCES `quizzes` (`quiz_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `FK_quiz_submissions_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`student_id`) ON DELETE CASCADE;

--
-- Constraints for table `quiz_submission_answers`
--
ALTER TABLE `quiz_submission_answers`
  ADD CONSTRAINT `FK_quiz_answers_question` FOREIGN KEY (`question_id`) REFERENCES `quiz_questions` (`question_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `FK_quiz_answers_submission` FOREIGN KEY (`submission_id`) REFERENCES `quiz_submissions` (`submission_id`) ON DELETE CASCADE;

--
-- Constraints for table `results`
--
ALTER TABLE `results`
  ADD CONSTRAINT `FK_results_course` FOREIGN KEY (`course_id`) REFERENCES `class_subjects` (`course_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `FK_results_semester` FOREIGN KEY (`semester_id`) REFERENCES `semesters` (`semester_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `FK_results_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`student_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `FK_results_subject` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`subject_id`) ON DELETE SET NULL;

--
-- Constraints for table `role_permissions`
--
ALTER TABLE `role_permissions`
  ADD CONSTRAINT `FK_role_permissions_permission` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`permission_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `FK_role_permissions_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`role_id`) ON DELETE CASCADE;

--
-- Constraints for table `semesters`
--
ALTER TABLE `semesters`
  ADD CONSTRAINT `FK_semesters_academic_year` FOREIGN KEY (`academic_year_id`) REFERENCES `academic_years` (`academic_year_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `FK_semesters_institution` FOREIGN KEY (`institution_id`) REFERENCES `institutions` (`institution_id`) ON DELETE CASCADE;

--
-- Constraints for table `students`
--
ALTER TABLE `students`
  ADD CONSTRAINT `FK_students_class` FOREIGN KEY (`class_id`) REFERENCES `classes` (`class_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `FK_students_institution` FOREIGN KEY (`institution_id`) REFERENCES `institutions` (`institution_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `FK_students_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `student_activity`
--
ALTER TABLE `student_activity`
  ADD CONSTRAINT `student_activity_ibfk_1` FOREIGN KEY (`performed_by`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `student_activity_ibfk_2` FOREIGN KEY (`institution_id`) REFERENCES `institutions` (`institution_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `subjects`
--
ALTER TABLE `subjects`
  ADD CONSTRAINT `FK_subjects_institution` FOREIGN KEY (`institution_id`) REFERENCES `institutions` (`institution_id`) ON DELETE CASCADE;

--
-- Constraints for table `superadmin_activity`
--
ALTER TABLE `superadmin_activity`
  ADD CONSTRAINT `FK_superadmin_activity_user` FOREIGN KEY (`performed_by`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `teachers`
--
ALTER TABLE `teachers`
  ADD CONSTRAINT `FK_teachers_institution` FOREIGN KEY (`institution_id`) REFERENCES `institutions` (`institution_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `FK_teachers_program` FOREIGN KEY (`program_id`) REFERENCES `programs` (`program_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `FK_teachers_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `teacher_activity`
--
ALTER TABLE `teacher_activity`
  ADD CONSTRAINT `teacher_activity_ibfk_1` FOREIGN KEY (`performed_by`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `teacher_activity_ibfk_2` FOREIGN KEY (`institution_id`) REFERENCES `institutions` (`institution_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `teacher_subjects`
--
ALTER TABLE `teacher_subjects`
  ADD CONSTRAINT `FK_teacher_subjects_subject` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`subject_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `FK_teacher_subjects_teacher` FOREIGN KEY (`teacher_id`) REFERENCES `teachers` (`teacher_id`) ON DELETE CASCADE;

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `FK_users_institution` FOREIGN KEY (`institution_id`) REFERENCES `institutions` (`institution_id`) ON DELETE CASCADE;

--
-- Constraints for table `user_activity`
--
ALTER TABLE `user_activity`
  ADD CONSTRAINT `FK_user_activity_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `user_roles`
--
ALTER TABLE `user_roles`
  ADD CONSTRAINT `FK_user_roles_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`role_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `FK_user_roles_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;
SET FOREIGN_KEY_CHECKS=1;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
