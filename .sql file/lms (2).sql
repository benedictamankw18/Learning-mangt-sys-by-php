-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Mar 10, 2026 at 11:08 PM
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
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `academic_years`
--

INSERT INTO `academic_years` (`academic_year_id`, `institution_id`, `year_name`, `start_date`, `end_date`, `is_current`, `created_at`, `updated_at`) VALUES
(17, 1, '2024-2025', '2024-09-01', '2025-06-30', 1, '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(18, 1, '2023-2024', '2023-09-01', '2024-06-30', 0, '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(19, 1, '2022-2023', '2022-09-01', '2023-06-30', 0, '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(20, 1, '2021-2022', '2021-09-01', '2022-06-30', 0, '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(21, 1, '2020-2021', '2020-09-01', '2021-06-30', 0, '2026-03-03 21:21:31', '2026-03-03 21:21:31');

-- --------------------------------------------------------

--
-- Table structure for table `admins`
--
-- Creation: Mar 10, 2026 at 10:07 PM
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

--
-- Dumping data for table `admins`
--

INSERT INTO `admins` (`admin_id`, `uuid`, `institution_id`, `user_id`, `employee_id`, `department`, `hire_date`, `employment_end_date`, `qualification`, `specialization`, `bio`, `alternative_email`, `status`, `created_at`, `updated_at`) VALUES
(1, 'f55d0001-1746-11f1-8ccc-10653022c2a0', 1, 147, 'A-2024-001', 'Administration', '2020-09-01', NULL, 'MBA Education Management', NULL, NULL, NULL, 'active', '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(2, 'f55d0002-1746-11f1-8ccc-10653022c2a0', 2, 148, 'A-2024-002', 'Administration', '2019-09-01', NULL, 'MSc Educational Leadership', NULL, NULL, NULL, 'active', '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(3, 'f55d0003-1746-11f1-8ccc-10653022c2a0', 3, 149, 'A-2024-003', 'Administration', '2021-09-01', NULL, 'BA Education Administration', NULL, NULL, NULL, 'active', '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(4, 'f55d0004-1746-11f1-8ccc-10653022c2a0', 4, 150, 'A-2024-004', 'Administration', '2018-09-01', NULL, 'MBA Educational Management', NULL, NULL, NULL, 'active', '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(5, 'f55d0005-1746-11f1-8ccc-10653022c2a0', 5, 151, 'A-2024-005', 'Administration', '2022-09-01', NULL, 'BSc Education', NULL, NULL, NULL, 'active', '2026-03-03 21:21:31', '2026-03-03 21:21:31');

-- --------------------------------------------------------

--
-- Table structure for table `admin_activity`
--
-- Creation: Mar 08, 2026 at 07:49 AM
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
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tracks all meaningful actions performed by institution admins';

--
-- Dumping data for table `admin_activity`
--

INSERT INTO `admin_activity` (`activity_id`, `uuid`, `institution_id`, `performed_by`, `activity_type`, `description`, `entity_type`, `entity_id`, `meta`, `ip_address`, `user_agent`, `severity`, `created_at`) VALUES
(1, 'd42afd6e-0332-4640-9c3a-c6dbe77acfc6', 1, 147, 'student_enrolled', 'Enrolled student Kwame Osei into Form 1A', 'student', 1, 'Kwame Osei', '::1', 'PostmanRuntime/7.52.0', 'info', '2026-03-08 08:30:33');

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
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `announcements`
--

INSERT INTO `announcements` (`announcement_id`, `uuid`, `title`, `content`, `author_id`, `target_role`, `is_published`, `published_at`, `expires_at`, `created_at`, `updated_at`) VALUES
(1, 'f5e2b3c2-1746-11f1-8ccc-10653022c2a0', 'Welcome to New Academic Year', 'We welcome all students to the 2024-2025 academic year. Classes begin September 1st.', 147, NULL, 1, '2024-08-25 08:00:00', '2024-09-10 23:59:59', '2026-03-03 21:21:32', '2026-03-03 21:21:32'),
(2, 'f5e3ae08-1746-11f1-8ccc-10653022c2a0', 'First Term Schedule', 'First term runs from September 1 to December 20. Midterm exams: October 28-November 1.', 147, NULL, 1, '2024-08-26 09:00:00', '2024-09-15 23:59:59', '2026-03-03 21:21:32', '2026-03-03 21:21:32'),
(3, 'f5e3b346-1746-11f1-8ccc-10653022c2a0', 'Sports Day Announcement', 'Annual sports day will be held on November 15. All students must participate.', 147, 'student', 1, '2024-10-01 10:00:00', '2024-11-20 23:59:59', '2026-03-03 21:21:32', '2026-03-03 21:21:32'),
(4, 'f5e3b72c-1746-11f1-8ccc-10653022c2a0', 'Parent-Teacher Conference', 'PTA meeting scheduled for October 20 at 2:00 PM in the school hall.', 147, 'parent', 1, '2024-10-05 08:00:00', '2024-10-22 23:59:59', '2026-03-03 21:21:32', '2026-03-03 21:21:32'),
(5, 'f5e3ba20-1746-11f1-8ccc-10653022c2a0', 'Library Hours Extended', 'Library will now close at 8:00 PM on weekdays to accommodate exam preparation.', 147, 'student', 1, '2024-10-10 12:00:00', '2024-12-20 23:59:59', '2026-03-03 21:21:32', '2026-03-03 21:21:32'),
(6, 'f5e3bd2d-1746-11f1-8ccc-10653022c2a0', 'Midterm Exam Timetable Released', 'Check your student portal for the complete midterm examination timetable.', 147, 'student', 1, '2024-10-15 08:00:00', '2024-11-05 23:59:59', '2026-03-03 21:21:32', '2026-03-03 21:21:32'),
(7, 'f5e3bfde-1746-11f1-8ccc-10653022c2a0', 'Teacher Training Workshop', 'Mandatory workshop on modern teaching methods - Saturday, November 5.', 147, 'teacher', 1, '2024-10-20 09:00:00', '2024-11-06 23:59:59', '2026-03-03 21:21:32', '2026-03-03 21:21:32'),
(8, 'f5e3c263-1746-11f1-8ccc-10653022c2a0', 'School Closing Date', 'First term ends December 20. Second term resumes January 6, 2025.', 147, NULL, 1, '2024-11-01 10:00:00', '2024-12-25 23:59:59', '2026-03-03 21:21:32', '2026-03-03 21:21:32');

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
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `assessment_categories`
--

INSERT INTO `assessment_categories` (`category_id`, `category_name`, `weight_percentage`, `description`, `created_at`, `updated_at`) VALUES
(20, 'Quiz', 15.00, 'Short quizzes and tests', '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(21, 'Assignment', 20.00, 'Homework and take-home assignments', '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(22, 'Class Work', 10.00, 'In-class activities and participation', '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(23, 'Midterm', 25.00, 'Mid-term examination', '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(24, 'Final', 30.00, 'Final examination', '2026-03-03 21:21:31', '2026-03-03 21:21:31');

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
) ENGINE=InnoDB AUTO_INCREMENT=42 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `assignments`
--

INSERT INTO `assignments` (`assignment_id`, `uuid`, `course_id`, `section_id`, `title`, `description`, `file_path`, `max_score`, `passing_score`, `rubric`, `submission_type`, `due_date`, `status`, `created_at`, `updated_at`) VALUES
(32, 'f5b9f76d-1746-11f1-8ccc-10653022c2a0', 48, NULL, 'Essay Writing - My First Day', 'Write a 500-word essay about your first day at school', NULL, 20.00, 60.00, NULL, 'both', '2024-09-15 23:59:59', 'active', '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(33, 'f5bd81f0-1746-11f1-8ccc-10653022c2a0', 48, NULL, 'Grammar Exercise Set 1', 'Complete exercises on page 25-30', NULL, 15.00, 60.00, NULL, 'both', '2024-09-22 23:59:59', 'active', '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(34, 'f5bd8749-1746-11f1-8ccc-10653022c2a0', 54, NULL, 'Cell Structure Diagram', 'Draw and label a plant cell', NULL, 25.00, 60.00, NULL, 'both', '2027-09-01 13:59:59', 'active', '2026-03-03 21:21:31', '2026-03-09 06:04:12'),
(35, 'f5bd8b3e-1746-11f1-8ccc-10653022c2a0', 54, NULL, 'Photosynthesis Report', 'Write a detailed report on photosynthesis', NULL, 30.00, 60.00, NULL, 'both', '2024-10-01 23:59:59', 'active', '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(36, 'f5bd8e99-1746-11f1-8ccc-10653022c2a0', 55, NULL, 'Newton Laws  Problems', 'Solve problems 1-10 from textbook', NULL, 20.00, 60.00, NULL, 'both', '2024-09-20 23:59:59', 'active', '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(37, 'f5bd91b3-1746-11f1-8ccc-10653022c2a0', 56, NULL, 'Math Problem Set 1', 'Algebra questions from chapter 2', NULL, 20.00, 60.00, NULL, 'both', '2024-09-25 23:59:59', 'active', '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(38, 'f5bd944f-1746-11f1-8ccc-10653022c2a0', 57, NULL, 'Chemistry Lab Report', 'Write lab report on acid-base titration', NULL, 35.00, 60.00, NULL, 'both', '2024-09-30 23:59:59', 'active', '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(39, 'f5bd96dd-1746-11f1-8ccc-10653022c2a0', 58, NULL, 'Historical Essay', 'Essay on Ghana Independence', NULL, 25.00, 60.00, NULL, 'both', '2024-10-05 23:59:59', 'active', '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(40, 'f5bd99bd-1746-11f1-8ccc-10653022c2a0', 59, NULL, 'Literature Analysis', 'Analyze a Shakespearean sonnet', NULL, 30.00, 60.00, NULL, 'both', '2024-10-10 23:59:59', 'active', '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(41, 'f5bd9c43-1746-11f1-8ccc-10653022c2a0', 60, NULL, 'Math Quiz Preparation', 'Review chapters 1-3 for quiz', NULL, 10.00, 60.00, NULL, 'both', '2024-09-28 23:59:59', 'active', '2026-03-03 21:21:31', '2026-03-03 21:21:31');

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
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB AUTO_INCREMENT=101 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `attendance`
--

INSERT INTO `attendance` (`attendance_id`, `student_id`, `course_id`, `attendance_date`, `status`, `remarks`, `created_at`, `updated_at`) VALUES
(1, 64, 48, '2026-02-02', 'present', NULL, '2026-03-03 21:21:32', '2026-03-08 14:22:10'),
(2, 66, 48, '2025-09-08', 'present', NULL, '2026-03-03 21:21:32', '2026-03-08 14:23:39'),
(3, 70, 48, '2025-09-01', 'present', NULL, '2026-03-03 21:21:32', '2026-03-08 14:23:28'),
(4, 68, 48, '2024-09-01', 'present', NULL, '2026-03-03 21:21:32', '2026-03-03 21:21:32'),
(5, 72, 48, '2024-09-01', 'present', NULL, '2026-03-03 21:21:32', '2026-03-03 21:21:32'),
(6, 63, 48, '2024-09-01', 'present', NULL, '2026-03-03 21:21:32', '2026-03-03 21:21:32'),
(7, 65, 48, '2024-09-01', 'late', NULL, '2026-03-03 21:21:32', '2026-03-03 21:21:32'),
(8, 71, 48, '2024-09-01', 'present', NULL, '2026-03-03 21:21:32', '2026-03-03 21:21:32'),
(9, 67, 48, '2024-09-01', 'present', NULL, '2026-03-03 21:21:32', '2026-03-03 21:21:32'),
(10, 73, 48, '2024-09-01', 'present', NULL, '2026-03-03 21:21:32', '2026-03-03 21:21:32'),
(11, 69, 48, '2024-09-01', 'present', NULL, '2026-03-03 21:21:32', '2026-03-03 21:21:32'),
(12, 64, 48, '2024-09-02', 'present', NULL, '2026-03-03 21:21:32', '2026-03-03 21:21:32'),
(13, 66, 48, '2024-09-02', 'present', NULL, '2026-03-03 21:21:32', '2026-03-03 21:21:32'),
(14, 70, 48, '2024-09-02', 'present', NULL, '2026-03-03 21:21:32', '2026-03-03 21:21:32'),
(15, 68, 48, '2024-09-02', 'present', NULL, '2026-03-03 21:21:32', '2026-03-03 21:21:32'),
(16, 72, 48, '2024-09-02', 'present', NULL, '2026-03-03 21:21:32', '2026-03-03 21:21:32'),
(17, 63, 48, '2024-09-02', 'present', NULL, '2026-03-03 21:21:32', '2026-03-03 21:21:32'),
(18, 65, 48, '2024-09-02', 'late', NULL, '2026-03-03 21:21:32', '2026-03-03 21:21:32'),
(19, 71, 48, '2024-09-02', 'present', NULL, '2026-03-03 21:21:32', '2026-03-03 21:21:32'),
(20, 67, 48, '2024-09-02', 'present', NULL, '2026-03-03 21:21:32', '2026-03-03 21:21:32'),
(21, 73, 48, '2024-09-02', 'present', NULL, '2026-03-03 21:21:32', '2026-03-03 21:21:32'),
(22, 69, 48, '2024-09-02', 'present', NULL, '2026-03-03 21:21:32', '2026-03-03 21:21:32'),
(23, 64, 48, '2024-09-03', 'present', NULL, '2026-03-03 21:21:32', '2026-03-03 21:21:32'),
(24, 66, 48, '2024-09-03', 'present', NULL, '2026-03-03 21:21:32', '2026-03-03 21:21:32'),
(25, 70, 48, '2024-09-03', 'present', NULL, '2026-03-03 21:21:32', '2026-03-03 21:21:32'),
(26, 68, 48, '2024-09-03', 'present', NULL, '2026-03-03 21:21:32', '2026-03-03 21:21:32'),
(27, 72, 48, '2024-09-03', 'present', NULL, '2026-03-03 21:21:32', '2026-03-03 21:21:32'),
(28, 63, 48, '2024-09-03', 'late', NULL, '2026-03-03 21:21:32', '2026-03-03 21:21:32'),
(29, 65, 48, '2024-09-03', 'present', NULL, '2026-03-03 21:21:32', '2026-03-03 21:21:32'),
(30, 71, 48, '2024-09-03', 'present', NULL, '2026-03-03 21:21:32', '2026-03-03 21:21:32'),
(31, 67, 48, '2024-09-03', 'present', NULL, '2026-03-03 21:21:32', '2026-03-03 21:21:32'),
(32, 73, 48, '2024-09-03', 'present', NULL, '2026-03-03 21:21:32', '2026-03-03 21:21:32'),
(33, 69, 48, '2024-09-03', 'present', NULL, '2026-03-03 21:21:32', '2026-03-03 21:21:32'),
(34, 64, 48, '2024-09-04', 'present', NULL, '2026-03-03 21:21:32', '2026-03-03 21:21:32'),
(35, 66, 48, '2024-09-04', 'present', NULL, '2026-03-03 21:21:32', '2026-03-03 21:21:32'),
(36, 70, 48, '2024-09-04', 'present', NULL, '2026-03-03 21:21:32', '2026-03-03 21:21:32'),
(37, 68, 48, '2024-09-04', 'present', NULL, '2026-03-03 21:21:32', '2026-03-03 21:21:32'),
(38, 72, 48, '2024-09-04', 'present', NULL, '2026-03-03 21:21:32', '2026-03-03 21:21:32'),
(39, 63, 48, '2024-09-04', 'present', NULL, '2026-03-03 21:21:32', '2026-03-03 21:21:32'),
(40, 65, 48, '2024-09-04', 'present', NULL, '2026-03-03 21:21:32', '2026-03-03 21:21:32'),
(41, 71, 48, '2024-09-04', 'present', NULL, '2026-03-03 21:21:32', '2026-03-03 21:21:32'),
(42, 67, 48, '2024-09-04', 'present', NULL, '2026-03-03 21:21:32', '2026-03-03 21:21:32'),
(43, 73, 48, '2024-09-04', 'present', NULL, '2026-03-03 21:21:32', '2026-03-03 21:21:32'),
(44, 69, 48, '2024-09-04', 'present', NULL, '2026-03-03 21:21:32', '2026-03-03 21:21:32'),
(45, 64, 48, '2024-09-05', 'late', NULL, '2026-03-03 21:21:32', '2026-03-03 21:21:32'),
(46, 66, 48, '2024-09-05', 'present', NULL, '2026-03-03 21:21:32', '2026-03-03 21:21:32'),
(47, 70, 48, '2024-09-05', 'present', NULL, '2026-03-03 21:21:32', '2026-03-03 21:21:32'),
(48, 68, 48, '2024-09-05', 'present', NULL, '2026-03-03 21:21:32', '2026-03-03 21:21:32'),
(49, 72, 48, '2024-09-05', 'present', NULL, '2026-03-03 21:21:32', '2026-03-03 21:21:32'),
(50, 63, 48, '2024-09-05', 'present', NULL, '2026-03-03 21:21:32', '2026-03-03 21:21:32'),
(51, 65, 48, '2024-09-05', 'present', NULL, '2026-03-03 21:21:32', '2026-03-03 21:21:32'),
(52, 71, 48, '2024-09-05', 'present', NULL, '2026-03-03 21:21:32', '2026-03-03 21:21:32'),
(53, 67, 48, '2024-09-05', 'present', NULL, '2026-03-03 21:21:32', '2026-03-03 21:21:32'),
(54, 73, 48, '2024-09-05', 'present', NULL, '2026-03-03 21:21:32', '2026-03-03 21:21:32'),
(55, 69, 48, '2024-09-05', 'present', NULL, '2026-03-03 21:21:32', '2026-03-03 21:21:32'),
(56, 64, 48, '2024-09-08', 'present', NULL, '2026-03-03 21:21:32', '2026-03-03 21:21:32'),
(57, 66, 48, '2024-09-08', 'present', NULL, '2026-03-03 21:21:32', '2026-03-03 21:21:32'),
(58, 70, 48, '2024-09-08', 'present', NULL, '2026-03-03 21:21:32', '2026-03-03 21:21:32'),
(59, 68, 48, '2024-09-08', 'present', NULL, '2026-03-03 21:21:32', '2026-03-03 21:21:32'),
(60, 72, 48, '2024-09-08', 'present', NULL, '2026-03-03 21:21:32', '2026-03-03 21:21:32'),
(61, 63, 48, '2024-09-08', 'present', NULL, '2026-03-03 21:21:32', '2026-03-03 21:21:32'),
(62, 65, 48, '2024-09-08', 'present', NULL, '2026-03-03 21:21:32', '2026-03-03 21:21:32'),
(63, 71, 48, '2024-09-08', 'present', NULL, '2026-03-03 21:21:32', '2026-03-03 21:21:32'),
(64, 67, 48, '2024-09-08', 'present', NULL, '2026-03-03 21:21:32', '2026-03-03 21:21:32'),
(65, 73, 48, '2024-09-08', 'present', NULL, '2026-03-03 21:21:32', '2026-03-03 21:21:32'),
(66, 69, 48, '2024-09-08', 'present', NULL, '2026-03-03 21:21:32', '2026-03-03 21:21:32'),
(67, 64, 48, '2024-09-09', 'present', NULL, '2026-03-03 21:21:32', '2026-03-03 21:21:32'),
(68, 66, 48, '2024-09-09', 'present', NULL, '2026-03-03 21:21:32', '2026-03-03 21:21:32'),
(69, 70, 48, '2024-09-09', 'present', NULL, '2026-03-03 21:21:32', '2026-03-03 21:21:32'),
(70, 68, 48, '2024-09-09', 'present', NULL, '2026-03-03 21:21:32', '2026-03-03 21:21:32'),
(71, 72, 48, '2024-09-09', 'present', NULL, '2026-03-03 21:21:32', '2026-03-03 21:21:32'),
(72, 63, 48, '2024-09-09', 'present', NULL, '2026-03-03 21:21:32', '2026-03-03 21:21:32'),
(73, 65, 48, '2024-09-09', 'present', NULL, '2026-03-03 21:21:32', '2026-03-03 21:21:32'),
(74, 71, 48, '2024-09-09', 'present', NULL, '2026-03-03 21:21:32', '2026-03-03 21:21:32'),
(75, 67, 48, '2024-09-09', 'present', NULL, '2026-03-03 21:21:32', '2026-03-03 21:21:32'),
(76, 73, 48, '2024-09-09', 'present', NULL, '2026-03-03 21:21:32', '2026-03-03 21:21:32'),
(77, 69, 48, '2024-09-09', 'present', NULL, '2026-03-03 21:21:32', '2026-03-03 21:21:32'),
(78, 64, 48, '2024-09-10', 'present', NULL, '2026-03-03 21:21:32', '2026-03-03 21:21:32'),
(79, 66, 48, '2024-09-10', 'present', NULL, '2026-03-03 21:21:32', '2026-03-03 21:21:32'),
(80, 70, 48, '2024-09-10', 'present', NULL, '2026-03-03 21:21:32', '2026-03-03 21:21:32'),
(81, 68, 48, '2024-09-10', 'present', NULL, '2026-03-03 21:21:32', '2026-03-03 21:21:32'),
(82, 72, 48, '2024-09-10', 'present', NULL, '2026-03-03 21:21:32', '2026-03-03 21:21:32'),
(83, 63, 48, '2024-09-10', 'present', NULL, '2026-03-03 21:21:32', '2026-03-03 21:21:32'),
(84, 65, 48, '2024-09-10', 'present', NULL, '2026-03-03 21:21:32', '2026-03-03 21:21:32'),
(85, 71, 48, '2024-09-10', 'present', NULL, '2026-03-03 21:21:32', '2026-03-03 21:21:32'),
(86, 67, 48, '2024-09-10', 'present', NULL, '2026-03-03 21:21:32', '2026-03-03 21:21:32'),
(87, 73, 48, '2024-09-10', 'present', NULL, '2026-03-03 21:21:32', '2026-03-03 21:21:32'),
(88, 69, 48, '2024-09-10', 'late', NULL, '2026-03-03 21:21:32', '2026-03-03 21:21:32'),
(89, 64, 48, '2024-09-11', 'present', NULL, '2026-03-03 21:21:32', '2026-03-03 21:21:32'),
(90, 66, 48, '2024-09-11', 'present', NULL, '2026-03-03 21:21:32', '2026-03-03 21:21:32'),
(91, 70, 48, '2024-09-11', 'present', NULL, '2026-03-03 21:21:32', '2026-03-03 21:21:32'),
(92, 68, 48, '2024-09-11', 'present', NULL, '2026-03-03 21:21:32', '2026-03-03 21:21:32'),
(93, 72, 48, '2024-09-11', 'present', NULL, '2026-03-03 21:21:32', '2026-03-03 21:21:32'),
(94, 63, 48, '2024-09-11', 'present', NULL, '2026-03-03 21:21:32', '2026-03-03 21:21:32'),
(95, 65, 48, '2024-09-11', 'present', NULL, '2026-03-03 21:21:32', '2026-03-03 21:21:32'),
(96, 71, 48, '2024-09-11', 'present', NULL, '2026-03-03 21:21:32', '2026-03-03 21:21:32'),
(97, 67, 48, '2024-09-11', 'late', NULL, '2026-03-03 21:21:32', '2026-03-03 21:21:32'),
(98, 73, 48, '2024-09-11', 'present', NULL, '2026-03-03 21:21:32', '2026-03-03 21:21:32'),
(99, 69, 48, '2024-09-11', 'present', NULL, '2026-03-03 21:21:32', '2026-03-03 21:21:32'),
(100, 64, 48, '2024-09-12', 'present', NULL, '2026-03-03 21:21:32', '2026-03-03 21:21:32');

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
) ENGINE=InnoDB AUTO_INCREMENT=43 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `classes`
--

INSERT INTO `classes` (`class_id`, `uuid`, `institution_id`, `program_id`, `grade_level_id`, `class_code`, `class_name`, `section`, `academic_year_id`, `class_teacher_id`, `max_students`, `room_number`, `status`, `created_at`, `updated_at`) VALUES
(33, 'f5685ff7-1746-11f1-8ccc-10653022c2a0', 1, 22, 22, 'SHS1-ARTS-A', 'SHS 1 General Arts A', 'A', 17, 33, 40, NULL, 'active', '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(34, 'f56875aa-1746-11f1-8ccc-10653022c2a0', 1, 22, 22, 'SHS1-ARTS-B', 'SHS 1 General Arts B', 'B', 17, NULL, 40, NULL, 'active', '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(35, 'f5687f4e-1746-11f1-8ccc-10653022c2a0', 1, 23, 22, 'SHS1-SCI-A', 'SHS 1 General Science A', 'A', 17, 34, 35, NULL, 'active', '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(36, 'f56884f0-1746-11f1-8ccc-10653022c2a0', 1, 23, 22, 'SHS1-SCI-B', 'SHS 1 General Science B', 'B', 17, 35, 35, NULL, 'active', '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(37, 'f5688aa2-1746-11f1-8ccc-10653022c2a0', 1, 24, 22, 'SHS1-BUS-A', 'SHS 1 Business A', 'A', 17, NULL, 38, NULL, 'active', '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(38, 'f5689021-1746-11f1-8ccc-10653022c2a0', 1, 22, 23, 'SHS2-ARTS-A', 'SHS 2 General Arts A', 'A', 17, NULL, 40, NULL, 'active', '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(39, 'f568960c-1746-11f1-8ccc-10653022c2a0', 1, 23, 23, 'SHS2-SCI-A', 'SHS 2 General Science A', 'A', 17, 36, 35, NULL, 'active', '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(40, 'f5689eed-1746-11f1-8ccc-10653022c2a0', 1, 22, 24, 'SHS3-ARTS-A', 'SHS 3 General Arts A', 'A', 17, NULL, 42, NULL, 'active', '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(41, 'f568a349-1746-11f1-8ccc-10653022c2a0', 1, 23, 24, 'SHS3-SCI-A', 'SHS 3 General Science A', 'A', 17, 37, 36, NULL, 'active', '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(42, 'f568a6ce-1746-11f1-8ccc-10653022c2a0', 1, 24, 24, 'SHS3-BUS-A', 'SHS 3 Business A', 'A', 17, NULL, 40, NULL, 'active', '2026-03-03 21:21:31', '2026-03-03 21:21:31');

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
) ENGINE=InnoDB AUTO_INCREMENT=63 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `class_subjects`
--

INSERT INTO `class_subjects` (`course_id`, `institution_id`, `class_id`, `subject_id`, `teacher_id`, `academic_year_id`, `semester_id`, `duration_weeks`, `start_date`, `end_date`, `status`, `created_at`, `updated_at`) VALUES
(48, 1, 33, 74, 33, 17, 21, 14, '2024-09-01', '2024-12-20', 'active', '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(49, 1, 33, 75, 35, 17, 21, 14, '2024-09-01', '2024-12-20', 'active', '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(50, 1, 33, 78, NULL, 17, 21, 14, '2024-09-01', '2024-12-20', 'active', '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(51, 1, 33, 79, NULL, 17, 21, 14, '2024-09-01', '2024-12-20', 'active', '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(52, 1, 35, 74, 33, 17, 21, 14, '2024-09-01', '2024-12-20', 'active', '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(53, 1, 35, 75, 58, 17, 21, 14, '2024-09-01', '2024-12-20', 'active', '2026-03-03 21:21:31', '2026-03-10 15:16:56'),
(54, 1, 35, 85, 34, 17, 21, 14, '2024-09-01', '2024-12-20', 'active', '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(55, 1, 35, 83, 36, 17, 21, 14, '2024-09-01', '2024-12-20', 'active', '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(56, 1, 35, 84, 37, 17, 21, 14, '2024-09-01', '2024-12-20', 'active', '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(57, 1, 36, 74, 33, 17, 21, 14, '2024-09-01', '2024-12-20', 'active', '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(58, 1, 36, 85, 34, 17, 21, 14, '2024-09-01', '2024-12-20', 'active', '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(59, 1, 36, 83, 58, 17, 21, 14, '2024-09-01', '2024-12-20', 'active', '2026-03-03 21:21:31', '2026-03-10 15:16:26'),
(60, 1, 34, 74, 33, 17, 21, 14, '2024-09-01', '2024-12-20', 'active', '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(61, 1, 34, 78, NULL, 17, 21, 14, '2024-09-01', '2024-12-20', 'active', '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(62, 1, 34, 79, NULL, 17, 21, 14, '2024-09-01', '2024-12-20', 'active', '2026-03-03 21:21:31', '2026-03-03 21:21:31');

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
) ENGINE=InnoDB AUTO_INCREMENT=242 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `course_enrollments`
--

INSERT INTO `course_enrollments` (`enrollment_id`, `student_id`, `course_id`, `enrollment_date`, `completion_date`, `status`, `progress_percentage`, `final_grade`) VALUES
(192, 63, 52, '2026-03-01 00:00:00', NULL, 'inactive', 15.00, NULL),
(193, 63, 53, '2024-09-01 00:00:00', NULL, 'active', 15.00, NULL),
(194, 63, 54, '2024-09-01 00:00:00', NULL, 'active', 15.00, NULL),
(195, 63, 55, '2024-09-01 00:00:00', NULL, 'active', 15.00, NULL),
(196, 63, 56, '2024-09-01 00:00:00', NULL, 'active', 15.00, NULL),
(197, 64, 48, '2024-09-01 00:00:00', NULL, 'active', 15.00, NULL),
(198, 64, 49, '2024-09-01 00:00:00', NULL, 'active', 15.00, NULL),
(199, 64, 50, '2024-09-01 00:00:00', NULL, 'active', 15.00, NULL),
(200, 64, 51, '2024-09-01 00:00:00', NULL, 'active', 15.00, NULL),
(201, 65, 52, '2024-09-01 00:00:00', NULL, 'active', 15.00, NULL),
(202, 65, 53, '2024-09-01 00:00:00', NULL, 'active', 15.00, NULL),
(203, 65, 54, '2026-03-03 00:00:00', NULL, 'active', 15.00, NULL),
(204, 65, 55, '2024-09-01 00:00:00', NULL, 'active', 15.00, NULL),
(205, 65, 56, '2024-09-01 00:00:00', NULL, 'active', 15.00, NULL),
(206, 66, 48, '2024-09-01 00:00:00', NULL, 'active', 15.00, NULL),
(207, 66, 49, '2024-09-01 00:00:00', NULL, 'active', 15.00, NULL),
(208, 66, 50, '2026-03-04 00:00:00', NULL, 'active', 15.00, NULL),
(209, 66, 51, '2024-09-01 00:00:00', NULL, 'active', 15.00, NULL),
(210, 67, 57, '2024-09-01 00:00:00', NULL, 'active', 15.00, NULL),
(211, 67, 58, '2024-09-01 00:00:00', NULL, 'active', 15.00, NULL),
(212, 67, 59, '2026-03-03 00:00:00', NULL, 'active', 15.00, NULL),
(213, 68, 60, '2024-09-01 00:00:00', NULL, 'active', 15.00, NULL),
(214, 68, 61, '2024-09-01 00:00:00', NULL, 'active', 15.00, NULL),
(215, 68, 62, '2024-09-01 00:00:00', NULL, 'active', 15.00, NULL),
(216, 70, 48, '2024-09-01 00:00:00', NULL, 'active', 15.00, NULL),
(217, 70, 49, '2024-09-01 00:00:00', NULL, 'active', 15.00, NULL),
(218, 70, 50, '2024-09-01 00:00:00', NULL, 'active', 15.00, NULL),
(219, 70, 51, '2024-09-01 00:00:00', NULL, 'active', 15.00, NULL),
(220, 71, 52, '2024-09-01 00:00:00', NULL, 'active', 15.00, NULL),
(221, 71, 53, '2024-09-01 00:00:00', NULL, 'active', 15.00, NULL),
(222, 71, 54, '2024-09-01 00:00:00', NULL, 'active', 15.00, NULL),
(223, 71, 55, '2024-09-01 00:00:00', NULL, 'active', 15.00, NULL),
(224, 71, 56, '2024-09-01 00:00:00', NULL, 'active', 15.00, NULL),
(225, 72, 60, '2024-09-01 00:00:00', NULL, 'active', 15.00, NULL),
(226, 72, 61, '2024-09-01 00:00:00', NULL, 'active', 15.00, NULL),
(227, 72, 62, '2024-09-01 00:00:00', NULL, 'active', 15.00, NULL),
(228, 73, 57, '2024-09-01 00:00:00', NULL, 'active', 15.00, NULL),
(229, 73, 58, '2024-09-01 00:00:00', NULL, 'active', 15.00, NULL),
(230, 73, 59, '2024-09-01 00:00:00', NULL, 'active', 15.00, NULL),
(231, 75, 52, '2024-09-01 00:00:00', NULL, 'active', 15.00, NULL),
(232, 75, 53, '2024-09-01 00:00:00', NULL, 'active', 15.00, NULL),
(233, 75, 54, '2024-09-01 00:00:00', NULL, 'active', 15.00, NULL),
(234, 75, 55, '2024-09-01 00:00:00', NULL, 'active', 15.00, NULL),
(235, 75, 56, '2024-09-01 00:00:00', NULL, 'active', 15.00, NULL),
(236, 76, 48, '2024-09-01 00:00:00', NULL, 'active', 15.00, NULL),
(237, 76, 49, '2024-09-01 00:00:00', NULL, 'active', 15.00, NULL),
(238, 76, 50, '2024-09-01 00:00:00', NULL, 'active', 15.00, NULL),
(239, 76, 51, '2024-09-01 00:00:00', NULL, 'active', 15.00, NULL),
(240, 77, 57, '2024-09-01 00:00:00', NULL, 'active', 15.00, NULL),
(241, 77, 58, '2024-09-01 00:00:00', NULL, 'active', 15.00, NULL);

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
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB AUTO_INCREMENT=81 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `course_schedules`
--

INSERT INTO `course_schedules` (`schedule_id`, `course_id`, `day_of_week`, `start_time`, `end_time`, `room`, `is_recurring`, `created_at`, `updated_at`) VALUES
(61, 48, 'Monday', '08:00:00', '09:30:00', 'Room A101', 1, '2026-03-03 21:21:31', '2026-03-09 04:29:02'),
(62, 48, 'Wednesday', '08:00:00', '09:30:00', 'Room A101', 1, '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(63, 48, 'Friday', '10:00:00', '11:30:00', 'Room A101', 1, '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(64, 54, 'Tuesday', '08:00:00', '09:30:00', 'Lab B201', 1, '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(65, 54, 'Thursday', '08:00:00', '09:30:00', 'Lab B201', 1, '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(66, 54, 'Friday', '13:00:00', '14:30:00', 'Lab B201', 1, '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(67, 55, 'Monday', '10:00:00', '11:30:00', 'Lab B301', 1, '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(68, 55, 'Wednesday', '10:00:00', '11:30:00', 'Lab B301', 1, '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(69, 56, 'Tuesday', '10:00:00', '11:30:00', 'Room A201', 1, '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(70, 56, 'Thursday', '10:00:00', '11:30:00', 'Room A201', 1, '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(71, 57, 'Monday', '13:00:00', '14:30:00', 'Lab B401', 1, '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(72, 57, 'Wednesday', '13:00:00', '14:30:00', 'Lab B401', 1, '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(73, 58, 'Tuesday', '13:00:00', '14:30:00', 'Room A301', 1, '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(74, 58, 'Friday', '08:00:00', '09:30:00', 'Room A301', 1, '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(75, 59, 'Monday', '08:00:00', '09:30:00', 'Hall 1', 1, '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(76, 60, 'Wednesday', '13:00:00', '14:30:00', 'Room A401', 1, '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(77, 61, 'Thursday', '13:00:00', '14:30:00', 'Lab B101', 1, '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(78, 62, 'Friday', '10:00:00', '11:30:00', 'Lab B201', 1, '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(79, 63, 'Tuesday', '08:00:00', '09:30:00', 'Room C101', 1, '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(80, 64, 'Thursday', '10:00:00', '11:30:00', 'Room C201', 1, '2026-03-03 21:21:31', '2026-03-03 21:21:31');

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
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `events`
--

INSERT INTO `events` (`event_id`, `uuid`, `institution_id`, `title`, `description`, `event_type`, `start_date`, `end_date`, `all_day`, `location`, `target_role`, `course_id`, `created_by`, `is_recurring`, `recurrence_pattern`, `is_published`, `created_at`, `updated_at`) VALUES
(1, 'f5e5e8ad-1746-11f1-8ccc-10653022c2a0', 1, 'First Day of School', 'Academic year 2024-2025 begins', 'academic', '2024-09-01 08:00:00', '2024-09-01 17:00:00', 1, 'School Campus', NULL, NULL, 147, 0, NULL, 1, '2026-03-03 21:21:32', '2026-03-03 21:21:32'),
(2, 'f5e698a1-1746-11f1-8ccc-10653022c2a0', 1, 'Independence Day Celebration', 'Ghana Independence Day celebration', 'holiday', '2025-03-06 09:00:00', '2025-03-06 14:00:00', 0, 'School Grounds', NULL, NULL, 147, 0, NULL, 1, '2026-03-03 21:21:32', '2026-03-03 21:21:32'),
(3, 'f5e69e62-1746-11f1-8ccc-10653022c2a0', 1, 'Midterm Examinations', 'First term midterm exams', 'examination', '2024-10-28 08:00:00', '2024-11-01 17:00:00', 0, 'Examination Halls', NULL, NULL, 147, 0, NULL, 1, '2026-03-03 21:21:32', '2026-03-03 21:21:32'),
(4, 'f5e6a20d-1746-11f1-8ccc-10653022c2a0', 1, 'Sports Day', 'Annual inter-house sports competition', 'sports', '2024-11-15 08:00:00', '2024-11-15 17:00:00', 1, 'Sports Complex', NULL, NULL, 147, 0, NULL, 1, '2026-03-03 21:21:32', '2026-03-03 21:21:32'),
(5, 'f5e6a59b-1746-11f1-8ccc-10653022c2a0', 1, 'Science Fair', 'Students showcase science projects', 'academic', '2024-11-22 09:00:00', '2024-11-22 15:00:00', 0, 'Science Laboratory Block', NULL, NULL, 34, 0, NULL, 1, '2026-03-03 21:21:32', '2026-03-03 21:21:32'),
(6, 'f5e6a939-1746-11f1-8ccc-10653022c2a0', 1, 'PTA Meeting', 'Parent-Teacher Association meeting', 'meeting', '2024-10-20 14:00:00', '2024-10-20 16:00:00', 0, 'School Hall', NULL, NULL, 147, 0, NULL, 1, '2026-03-03 21:21:32', '2026-03-03 21:21:32'),
(7, 'f5e6ac6f-1746-11f1-8ccc-10653022c2a0', 1, 'Career Day', 'Career guidance and counseling', 'other', '2024-11-08 09:00:00', '2024-11-08 15:00:00', 0, 'School Hall', NULL, NULL, 147, 0, NULL, 1, '2026-03-03 21:21:32', '2026-03-03 21:21:32'),
(8, 'f5e6afa1-1746-11f1-8ccc-10653022c2a0', 1, 'Cultural Festival', 'Celebration of Ghanaian culture', 'cultural', '2024-12-06 09:00:00', '2024-12-06 16:00:00', 0, 'School Grounds', NULL, NULL, 147, 0, NULL, 1, '2026-03-03 21:21:32', '2026-03-03 21:21:32'),
(9, 'f5e6b2ed-1746-11f1-8ccc-10653022c2a0', 1, 'End of Term Exams', 'First term final examinations', 'examination', '2024-12-09 08:00:00', '2024-12-19 17:00:00', 0, 'Examination Halls', NULL, NULL, 147, 0, NULL, 1, '2026-03-03 21:21:32', '2026-03-03 21:21:32'),
(10, 'f5e6b5fc-1746-11f1-8ccc-10653022c2a0', 1, 'Prize Giving Day', 'Awards ceremony for outstanding students', 'academic', '2024-12-20 10:00:00', '2024-12-20 14:00:00', 0, 'School Hall', NULL, NULL, 147, 0, NULL, 1, '2026-03-03 21:21:32', '2026-03-03 21:21:32');

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
) ENGINE=InnoDB AUTO_INCREMENT=28 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `grade_levels`
--

INSERT INTO `grade_levels` (`grade_level_id`, `institution_id`, `grade_level_code`, `grade_level_name`, `level_order`, `description`, `status`, `created_at`, `updated_at`) VALUES
(22, 1, 'SHS1', 'SHS 1', 1, 'Senior High School Year 1', 'active', '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(23, 1, 'SHS2', 'SHS 2', 2, 'Senior High School Year 2', 'active', '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(24, 1, 'SHS3', 'SHS 3', 3, 'Senior High School Year 3', 'active', '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(25, 2, 'SHS1', 'SHS 1', 1, 'Senior High School Year 1', 'active', '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(26, 2, 'SHS2', 'SHS 2', 2, 'Senior High School Year 2', 'active', '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(27, 2, 'SHS3', 'SHS 3', 3, 'Senior High School Year 3', 'active', '2026-03-03 21:21:31', '2026-03-03 21:21:31');

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
) ENGINE=InnoDB AUTO_INCREMENT=46 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `grade_scales`
--

INSERT INTO `grade_scales` (`grade_scale_id`, `institution_id`, `grade`, `min_score`, `max_score`, `grade_point`, `remark`, `created_at`) VALUES
(37, NULL, 'A1', 80.00, 100.00, 1.00, 'Excellent', '2026-03-03 21:21:31'),
(38, NULL, 'B2', 70.00, 79.00, 2.00, 'Very Good', '2026-03-03 21:21:31'),
(39, NULL, 'B3', 65.00, 69.00, 3.00, 'Good', '2026-03-03 21:21:31'),
(40, NULL, 'C4', 60.00, 64.00, 4.00, 'Credit', '2026-03-03 21:21:31'),
(41, NULL, 'C5', 55.00, 59.00, 5.00, 'Credit', '2026-03-03 21:21:31'),
(42, NULL, 'C6', 50.00, 54.00, 6.00, 'Credit', '2026-03-03 21:21:31'),
(43, NULL, 'D7', 45.00, 49.00, 7.00, 'Pass', '2026-03-03 21:21:31'),
(44, NULL, 'E8', 40.00, 44.00, 8.00, 'Pass', '2026-03-03 21:21:31'),
(45, NULL, 'F9', 0.00, 39.00, 9.00, 'Fail', '2026-03-03 21:21:31');

-- --------------------------------------------------------

--
-- Table structure for table `institutions`
--
-- Creation: Mar 03, 2026 at 08:58 PM
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
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `institutions`
--

INSERT INTO `institutions` (`institution_id`, `uuid`, `institution_code`, `institution_name`, `institution_type`, `email`, `phone`, `address`, `city`, `state`, `country`, `postal_code`, `website`, `status`, `subscription_plan`, `subscription_expires_at`, `max_students`, `max_teachers`, `created_at`, `updated_at`) VALUES
(1, 'f541726b-1746-11f1-8ccc-10653022c2a0', 'ACCRASHS', 'Accra Senior High School', 'shs', 'info@accrashs.edu.gh', '+233 30 222 1111', 'Independence Avenue', 'Accra', 'Greater Accra', 'Ghana', NULL, NULL, 'active', 'Premium', NULL, 500, 50, '2026-03-03 21:21:31', '2026-03-08 06:52:07'),
(2, 'f5418554-1746-11f1-8ccc-10653022c2a0', 'KUMASHS', 'Kumasi Senior High School', 'shs', 'info@kumashs.edu.gh', '+233 32 222 2222', 'Asafo Road', 'Kumasi', 'Ashanti', 'Ghana', NULL, NULL, 'active', 'Basic', '2030-03-31', 500, 50, '2026-03-03 21:21:31', '2026-03-08 06:52:07'),
(3, 'f5418874-1746-11f1-8ccc-10653022c2a0', 'CCASHS', 'Cape Coast Senior High School', 'shs', 'info@ccashs.edu.gh', '+233 33 222 3333', 'Commercial Road', 'Cape Coast', 'Central', 'Ghana', NULL, NULL, 'active', NULL, NULL, 500, 50, '2026-03-03 21:21:31', '2026-03-08 06:52:07'),
(4, 'f5418b00-1746-11f1-8ccc-10653022c2a0', 'TAMASHS', 'Tamale Senior High School', 'shs', 'info@tamashs.edu.gh', '+233 37 222 4444', 'Hospital Road', 'Tamale', 'Northern', 'Ghana', NULL, NULL, 'active', 'Standard', NULL, 500, 50, '2026-03-03 21:21:31', '2026-03-08 06:52:07'),
(5, 'f5418d84-1746-11f1-8ccc-10653022c2a0', 'HOSHS', 'Ho Senior High School', 'shs', 'info@hoshs.edu.gh', '+233 36 222 5555', 'Volta Street', 'Ho', 'Volta', 'Ghana', NULL, NULL, 'active', NULL, NULL, 500, 50, '2026-03-03 21:21:31', '2026-03-08 06:52:07'),
(22, '9c759353-0a64-455d-bcc7-b1658868b1cc', 'ASHS', 'Accra Senior High School', 'public', 'info@accrashs.edu.gh', '+233-20-123-4567', 'Accra, Greater Accra Region', NULL, NULL, 'Ghana', NULL, 'https://accrashs.edu.gh', 'active', 'free', NULL, 500, 50, '2026-03-08 07:00:41', '2026-03-08 07:00:41');

-- --------------------------------------------------------

--
-- Table structure for table `institution_settings`
--
-- Creation: Mar 03, 2026 at 08:58 PM
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
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `institution_settings`
--

INSERT INTO `institution_settings` (`setting_id`, `institution_id`, `school_name`, `motto`, `description`, `vision`, `mission`, `logo_url`, `banner_url`, `theme_primary_color`, `theme_secondary_color`, `timezone`, `academic_year_start_month`, `academic_year_end_month`, `grading_system`, `locale`, `currency`, `date_format`, `time_format`, `allow_parent_registration`, `allow_student_self_enrollment`, `require_email_verification`, `custom_css`, `custom_footer`, `social_facebook`, `social_twitter`, `social_instagram`, `social_linkedin`, `updated_at`) VALUES
(17, 1, 'Accra Senior High School', 'Excellence Through Knowledge', 'A leading Senior High School in Accra, Ghana, committed to academic excellence and holistic development.', 'To be the premier institution for secondary education in Ghana, producing well-rounded graduates.', 'To provide quality education that empowers students to excel academically and contribute positively to society.', '/uploads/institutions/accra-shs/logo.png', NULL, '#006B3F', '#FCD116', 'Africa/Accra', 9, 6, 'ghana_waec', 'en_GH', 'GHS', 'Y-m-d', 'H:i:s', 1, 0, 1, NULL, NULL, NULL, NULL, NULL, NULL, '2026-03-03 21:21:31'),
(18, 2, 'Kumasi Senior High School', 'Knowledge is Power', 'Premier institution in the Ashanti Region dedicated to nurturing future leaders.', 'To be recognized as a center of excellence in secondary education across West Africa.', 'Empowering students with knowledge, skills, and character for global competitiveness.', '/uploads/institutions/kumasi-shs/logo.png', NULL, '#C8102E', '#FCD116', 'Africa/Accra', 9, 6, 'ghana_waec', 'en_GH', 'GHS', 'Y-m-d', 'H:i:s', 1, 0, 1, NULL, NULL, NULL, NULL, NULL, NULL, '2026-03-03 21:21:31'),
(19, 3, 'Cape Coast Senior High School', 'Discipline and Hard Work', 'Historic institution in Cape Coast fostering academic excellence since establishment.', 'To maintain our legacy of excellence while embracing modern educational practices.', 'Developing disciplined, hardworking students who excel in all spheres of life.', '/uploads/institutions/capecoast-shs/logo.png', NULL, '#0047AB', '#FFFFFF', 'Africa/Accra', 9, 6, 'ghana_waec', 'en_GH', 'GHS', 'Y-m-d', 'H:i:s', 1, 0, 1, NULL, NULL, NULL, NULL, NULL, NULL, '2026-03-03 21:21:31'),
(20, 4, 'Tamale Senior High School', 'Service and Dedication', 'Leading the way in quality education in Northern Ghana.', 'To be the educational beacon of Northern Ghana, inspiring excellence.', 'Providing comprehensive education that prepares students for leadership and service.', '/uploads/institutions/tamale-shs/logo.png', NULL, '#228B22', '#FFD700', 'Africa/Accra', 9, 6, 'ghana_waec', 'en_GH', 'GHS', 'Y-m-d', 'H:i:s', 1, 0, 1, NULL, NULL, NULL, NULL, NULL, NULL, '2026-03-03 21:21:31'),
(21, 5, 'Ho Senior High School', 'Unity and Progress', 'Excellence in education for the Volta Region and beyond.', 'To cultivate a community of learners committed to excellence and innovation.', 'Nurturing talents and building character for national development.', '/uploads/institutions/ho-shs/logo.png', NULL, '#006400', '#FFFFFF', 'Africa/Accra', 9, 6, 'ghana_waec', 'en_GH', 'GHS', 'Y-m-d', 'H:i:s', 1, 0, 1, NULL, NULL, NULL, NULL, NULL, NULL, '2026-03-03 21:21:31'),
(22, 22, 'Accra Senior High School', NULL, NULL, NULL, NULL, NULL, NULL, '#1976d2', '#dc004e', 'Africa/Accra', 9, 6, 'percentage', 'en_US', 'GHS', 'Y-m-d', 'H:i:s', 1, 0, 1, NULL, NULL, NULL, NULL, NULL, NULL, '2026-03-08 07:00:41');

-- --------------------------------------------------------

--
-- Table structure for table `login_activity`
--
-- Creation: Mar 03, 2026 at 08:58 PM
-- Last update: Mar 10, 2026 at 09:19 PM
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
) ENGINE=InnoDB AUTO_INCREMENT=281 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `login_activity`
--

INSERT INTO `login_activity` (`login_activity_id`, `user_id`, `login_time`, `logout_time`, `ip_address`, `user_agent`, `is_successful`, `failure_reason`) VALUES
(144, 1, '2026-03-08 06:27:27', '2026-03-08 05:28:14', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', 1, NULL),
(145, 1, '2026-03-08 06:28:27', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', 1, NULL),
(146, 188, '2026-03-08 07:08:48', NULL, '::1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.26100.7920', 1, NULL),
(147, 152, '2026-03-08 07:08:49', NULL, '::1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.26100.7920', 1, NULL),
(148, 162, '2026-03-08 07:08:49', NULL, '::1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.26100.7920', 1, NULL),
(149, 182, '2026-03-08 07:08:49', NULL, '::1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.26100.7920', 1, NULL),
(150, 1, '2026-03-08 07:08:51', NULL, '::1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.26100.7920', 0, 'Invalid credentials'),
(151, 188, '2026-03-08 07:10:24', NULL, '::1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.26100.7920', 1, NULL),
(152, 152, '2026-03-08 07:10:25', NULL, '::1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.26100.7920', 1, NULL),
(153, 162, '2026-03-08 07:10:25', NULL, '::1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.26100.7920', 1, NULL),
(154, 182, '2026-03-08 07:10:25', NULL, '::1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.26100.7920', 1, NULL),
(155, 1, '2026-03-08 07:10:26', NULL, '::1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.26100.7920', 0, 'Invalid credentials'),
(156, 188, '2026-03-08 07:11:35', NULL, '::1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.26100.7920', 1, NULL),
(157, 152, '2026-03-08 07:11:36', NULL, '::1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.26100.7920', 1, NULL),
(158, 162, '2026-03-08 07:11:36', NULL, '::1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.26100.7920', 1, NULL),
(159, 182, '2026-03-08 07:11:36', NULL, '::1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.26100.7920', 1, NULL),
(160, 1, '2026-03-08 07:11:37', '2026-03-08 06:13:35', '::1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.26100.7920', 0, 'Invalid credentials'),
(161, 1, '2026-03-08 07:13:39', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', 0, 'Invalid credentials'),
(162, 1, '2026-03-08 07:13:43', '2026-03-08 06:19:31', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', 1, NULL),
(163, 1, '2026-03-08 07:19:51', NULL, '::1', 'PostmanRuntime/7.52.0', 1, NULL),
(164, 1, '2026-03-08 07:22:54', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', 0, 'Invalid credentials'),
(165, 1, '2026-03-08 07:22:59', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', 1, NULL),
(166, 1, '2026-03-08 07:27:44', NULL, '::1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.26100.7920', 0, 'Invalid credentials'),
(167, 1, '2026-03-08 07:29:02', NULL, '::1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.26100.7920', 1, NULL),
(168, 152, '2026-03-08 07:29:03', NULL, '::1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.26100.7920', 1, NULL),
(169, 162, '2026-03-08 07:29:03', NULL, '::1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.26100.7920', 1, NULL),
(170, 182, '2026-03-08 07:29:03', NULL, '::1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.26100.7920', 1, NULL),
(171, 1, '2026-03-08 07:29:05', NULL, '::1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.26100.7920', 0, 'Invalid credentials'),
(172, 1, '2026-03-08 07:33:17', NULL, '::1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.26100.7920', 1, NULL),
(173, 152, '2026-03-08 07:33:17', NULL, '::1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.26100.7920', 1, NULL),
(174, 162, '2026-03-08 07:33:17', NULL, '::1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.26100.7920', 1, NULL),
(175, 182, '2026-03-08 07:33:17', NULL, '::1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.26100.7920', 1, NULL),
(176, 1, '2026-03-08 07:33:19', NULL, '::1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.26100.7920', 0, 'Invalid credentials'),
(177, 1, '2026-03-08 07:53:34', NULL, '::1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.26100.7920', 1, NULL),
(178, 152, '2026-03-08 07:53:34', NULL, '::1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.26100.7920', 1, NULL),
(179, 162, '2026-03-08 07:53:34', NULL, '::1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.26100.7920', 1, NULL),
(180, 182, '2026-03-08 07:53:35', NULL, '::1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.26100.7920', 1, NULL),
(181, 1, '2026-03-08 07:53:36', '2026-03-08 07:10:16', '::1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.26100.7920', 0, 'Invalid credentials'),
(182, 147, '2026-03-08 08:10:22', '2026-03-08 07:30:00', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', 1, NULL),
(183, 152, '2026-03-08 08:22:00', NULL, '::1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.26100.7920', 1, NULL),
(184, 152, '2026-03-08 08:22:00', NULL, '::1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.26100.7920', 1, NULL),
(185, 162, '2026-03-08 08:22:00', NULL, '::1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.26100.7920', 1, NULL),
(186, 182, '2026-03-08 08:22:00', NULL, '::1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.26100.7920', 1, NULL),
(187, 1, '2026-03-08 08:22:02', NULL, '::1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.26100.7920', 0, 'Invalid credentials'),
(188, 1, '2026-03-08 08:30:08', '2026-03-08 07:32:33', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', 1, NULL),
(189, 147, '2026-03-08 08:32:40', '2026-03-08 07:34:40', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', 1, NULL),
(190, 152, '2026-03-08 08:34:47', '2026-03-08 07:35:04', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', 1, NULL),
(191, 162, '2026-03-08 08:35:14', '2026-03-08 07:35:30', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', 1, NULL),
(192, 182, '2026-03-08 08:35:34', '2026-03-08 07:35:54', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', 1, NULL),
(193, 147, '2026-03-08 08:35:59', '2026-03-08 07:36:08', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', 1, NULL),
(194, 1, '2026-03-08 08:36:12', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', 0, 'Invalid credentials'),
(195, 1, '2026-03-08 08:36:18', '2026-03-08 07:36:36', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', 1, NULL),
(196, 1, '2026-03-08 08:36:43', '2026-03-08 07:38:14', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', 1, NULL),
(197, 147, '2026-03-08 08:42:43', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', 1, NULL),
(198, 152, '2026-03-08 09:01:58', NULL, '::1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.26100.7920', 1, NULL),
(199, 147, '2026-03-08 09:01:58', NULL, '::1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.26100.7920', 1, NULL),
(200, 1, '2026-03-08 09:01:59', NULL, '::1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.26100.7920', 0, 'Invalid credentials'),
(201, 152, '2026-03-08 09:02:00', NULL, '::1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.26100.7920', 1, NULL),
(202, 162, '2026-03-08 09:02:00', NULL, '::1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.26100.7920', 1, NULL),
(203, 182, '2026-03-08 09:02:00', NULL, '::1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.26100.7920', 1, NULL),
(204, 1, '2026-03-08 09:02:02', NULL, '::1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.26100.7920', 0, 'Invalid credentials'),
(205, 1, '2026-03-08 09:23:37', NULL, '::1', 'PostmanRuntime/7.52.0', 0, 'Invalid credentials'),
(206, 1, '2026-03-08 09:23:57', NULL, '::1', 'PostmanRuntime/7.52.0', 1, NULL),
(207, 147, '2026-03-08 09:24:19', '2026-03-08 08:29:55', '::1', 'PostmanRuntime/7.52.0', 1, NULL),
(208, 147, '2026-03-08 09:30:03', '2026-03-08 09:02:11', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', 1, NULL),
(209, 147, '2026-03-08 10:02:16', '2026-03-08 09:02:25', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', 1, NULL),
(210, 1, '2026-03-08 10:02:29', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', 0, 'Invalid credentials'),
(211, 1, '2026-03-08 10:02:35', '2026-03-08 09:27:38', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', 1, NULL),
(212, 1, '2026-03-08 10:28:55', '2026-03-08 09:29:30', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', 1, NULL),
(213, 147, '2026-03-08 10:29:35', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', 1, NULL),
(214, 147, '2026-03-08 11:37:04', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', 1, NULL),
(215, 147, '2026-03-08 13:17:19', '2026-03-08 12:18:25', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', 1, NULL),
(216, 152, '2026-03-08 13:18:31', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', 1, NULL),
(217, 162, '2026-03-08 14:22:40', '2026-03-08 13:22:52', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', 1, NULL),
(218, 152, '2026-03-08 14:22:58', '2026-03-08 14:11:38', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', 1, NULL),
(219, 152, '2026-03-08 15:13:46', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', 1, NULL),
(220, 152, '2026-03-09 05:26:39', '2026-03-09 04:30:24', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', 1, NULL),
(221, 162, '2026-03-09 05:30:29', '2026-03-09 05:11:35', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', 1, NULL),
(222, 152, '2026-03-09 06:12:01', '2026-03-09 05:12:15', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', 1, NULL),
(223, 162, '2026-03-09 06:12:19', '2026-03-09 05:37:22', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', 1, NULL),
(224, 162, '2026-03-09 06:41:38', '2026-03-09 06:08:09', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', 1, NULL),
(225, 162, '2026-03-09 07:08:17', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', 1, NULL),
(226, 152, '2026-03-09 08:12:40', '2026-03-09 07:12:55', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', 1, NULL),
(227, 147, '2026-03-09 08:13:03', '2026-03-09 07:13:27', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', 1, NULL),
(228, 152, '2026-03-09 08:13:32', '2026-03-09 07:24:19', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', 1, NULL),
(229, 162, '2026-03-09 08:24:28', '2026-03-09 07:40:27', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', 1, NULL),
(230, 182, '2026-03-09 08:40:36', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', 1, NULL),
(231, 147, '2026-03-09 08:42:58', NULL, '::1', 'PostmanRuntime/7.52.0', 1, NULL),
(232, 182, '2026-03-09 09:42:01', '2026-03-09 09:03:33', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', 1, NULL),
(233, 1, '2026-03-09 10:03:50', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', 0, 'Invalid credentials'),
(234, 1, '2026-03-09 10:08:25', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', 1, NULL),
(235, 162, '2026-03-09 14:04:05', '2026-03-09 13:04:22', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', 1, NULL),
(236, 182, '2026-03-09 14:04:26', '2026-03-09 13:05:06', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', 1, NULL),
(237, 162, '2026-03-09 14:05:10', '2026-03-09 13:05:39', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', 1, NULL),
(238, 152, '2026-03-09 14:05:44', '2026-03-09 13:07:08', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', 1, NULL),
(239, 147, '2026-03-09 14:07:12', '2026-03-09 13:07:41', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', 1, NULL),
(240, 1, '2026-03-09 14:07:46', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', 0, 'Invalid credentials'),
(241, 1, '2026-03-09 14:07:52', '2026-03-09 13:49:44', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', 1, NULL),
(242, 147, '2026-03-09 14:53:47', '2026-03-09 14:21:31', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', 1, NULL),
(243, 162, '2026-03-09 15:21:38', '2026-03-09 14:21:52', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', 1, NULL),
(244, 162, '2026-03-09 15:22:03', '2026-03-09 14:22:16', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', 1, NULL),
(245, 147, '2026-03-09 15:22:24', '2026-03-09 14:55:34', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', 1, NULL),
(246, 152, '2026-03-09 16:02:10', '2026-03-09 15:02:26', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', 1, NULL),
(247, 147, '2026-03-09 16:02:40', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', 1, NULL),
(248, 147, '2026-03-09 17:46:35', '2026-03-09 17:11:37', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', 1, NULL),
(249, 147, '2026-03-09 18:29:00', '2026-03-09 17:29:37', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', 1, NULL),
(250, 147, '2026-03-09 18:29:40', '2026-03-09 17:30:46', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', 1, NULL),
(251, 182, '2026-03-09 18:30:51', '2026-03-09 17:31:00', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', 1, NULL),
(252, 147, '2026-03-09 18:31:04', '2026-03-09 17:31:52', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', 1, NULL),
(253, 182, '2026-03-09 18:32:05', '2026-03-09 17:36:18', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', 1, NULL),
(254, 147, '2026-03-09 18:36:23', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', 1, NULL),
(255, 147, '2026-03-09 18:38:14', NULL, '::1', 'PostmanRuntime/7.52.0', 1, NULL),
(256, 147, '2026-03-09 19:50:56', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', 1, NULL),
(257, 147, '2026-03-09 20:52:42', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', 1, NULL),
(258, 147, '2026-03-09 22:45:03', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', 1, NULL),
(259, 147, '2026-03-09 23:48:46', '2026-03-09 23:35:38', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', 1, NULL),
(260, 1, '2026-03-10 00:35:46', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', 0, 'Invalid credentials'),
(261, 1, '2026-03-10 00:35:51', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', 0, 'Invalid credentials'),
(262, 1, '2026-03-10 00:35:57', '2026-03-09 23:38:52', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', 1, NULL),
(263, 147, '2026-03-10 00:38:58', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', 1, NULL),
(264, 147, '2026-03-10 06:03:30', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', 1, NULL),
(265, 147, '2026-03-10 07:33:38', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', 1, NULL),
(266, 147, '2026-03-10 07:47:18', NULL, '::1', 'PostmanRuntime/7.52.0', 1, NULL),
(267, 147, '2026-03-10 08:34:27', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', 1, NULL),
(268, 232, '2026-03-10 09:53:35', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', 0, 'Account is inactive'),
(269, 147, '2026-03-10 09:53:45', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', 1, NULL),
(270, 147, '2026-03-10 10:16:56', NULL, '::1', 'PostmanRuntime/7.52.0', 1, NULL),
(271, 147, '2026-03-10 12:19:19', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', 1, NULL),
(272, 147, '2026-03-10 14:44:36', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', 1, NULL),
(273, 147, '2026-03-10 16:21:30', NULL, '::1', 'PostmanRuntime/7.52.0', 1, NULL),
(274, 147, '2026-03-10 16:59:05', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', 1, NULL),
(275, 147, '2026-03-10 18:02:41', '2026-03-10 17:54:39', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', 1, NULL),
(276, 1, '2026-03-10 19:08:46', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', 0, 'Invalid credentials'),
(277, 147, '2026-03-10 19:08:53', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', 1, NULL),
(278, 1, '2026-03-10 19:14:18', NULL, '::1', 'PostmanRuntime/7.52.0', 0, 'Invalid credentials'),
(279, 147, '2026-03-10 19:14:40', '2026-03-10 19:07:11', '::1', 'PostmanRuntime/7.52.0', 1, NULL),
(280, 147, '2026-03-10 22:19:41', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', 1, NULL);

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
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `messages`
--

INSERT INTO `messages` (`message_id`, `uuid`, `sender_id`, `receiver_id`, `course_id`, `subject`, `message_text`, `is_read`, `parent_message_id`, `sent_at`, `read_at`) VALUES
(2, 'f5eca6e0-1746-11f1-8ccc-10653022c2a0', 152, 162, NULL, 'Essay Feedback', 'Great work on your essay. Keep it up!', 1, NULL, '2024-09-16 14:00:00', NULL),
(3, 'f5edab05-1746-11f1-8ccc-10653022c2a0', 162, 152, NULL, 'Question about assignment', 'Can I get an extension for the next assignment?', 1, NULL, '2024-09-17 10:00:00', NULL),
(4, 'f5edafa4-1746-11f1-8ccc-10653022c2a0', 182, 152, NULL, 'Child Progress Inquiry', 'How is Kwame doing in your class?', 0, NULL, '2024-09-18 16:00:00', NULL),
(5, 'f5edb2b7-1746-11f1-8ccc-10653022c2a0', 0, 0, NULL, 'Lab Report Issue', 'Please resubmit your lab report with corrections', 0, NULL, '2024-09-19 11:00:00', NULL),
(6, 'f5edb658-1746-11f1-8ccc-10653022c2a0', 147, 0, NULL, 'Meeting Reminder', 'Department meeting tomorrow at 3PM', 1, NULL, '2024-09-20 09:00:00', NULL),
(7, 'f5edba81-1746-11f1-8ccc-10653022c2a0', 0, 0, NULL, 'Book Recommendation', 'Any additional reading materials for literature?', 0, NULL, '2024-09-21 15:00:00', NULL),
(8, 'f5edbd84-1746-11f1-8ccc-10653022c2a0', 0, 170, NULL, 'Physics  Problem Help', 'Visit me during office hours for extra help', 1, NULL, '2024-09-22 12:00:00', NULL),
(9, 'f5edc063-1746-11f1-8ccc-10653022c2a0', 0, 147, NULL, 'Fees Payment Query', 'Question about second term fees', 0, NULL, '2024-09-23 10:30:00', NULL),
(10, 'f5edc356-1746-11f1-8ccc-10653022c2a0', 152, 0, NULL, 'Collaboration Idea', 'Let coordinate interdisciplinary project', 1, NULL, '2024-09-24 13:00:00', NULL),
(11, 'f5edc63f-1746-11f1-8ccc-10653022c2a0', 0, 162, NULL, 'Study Group', 'Want to join our history study group?', 0, NULL, '2024-09-25 18:00:00', NULL),
(12, 'f5edc90f-1746-11f1-8ccc-10653022c2a0', 147, 182, NULL, 'PTA Meeting', 'Looking forward to seeing you at the PTA meeting', 0, NULL, '2024-10-01 09:00:00', NULL),
(13, 'f5edcbbb-1746-11f1-8ccc-10653022c2a0', 0, 0, NULL, 'Chemistry Lab Safety', 'Review lab safety rules before next class', 0, NULL, '2024-10-03 14:00:00', NULL);

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
) ENGINE=InnoDB AUTO_INCREMENT=218 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `notifications`
--

INSERT INTO `notifications` (`notification_id`, `uuid`, `sender_id`, `user_id`, `target_role`, `course_id`, `title`, `message`, `notification_type`, `is_read`, `link`, `created_at`, `read_at`) VALUES
(153, 'f5acc736-1746-11f1-8ccc-10653022c2a0', 0, 162, NULL, NULL, 'Course Enrollment', NULL, 'enrollment', 0, NULL, '2026-03-03 21:21:31', NULL),
(154, 'f5aceb00-1746-11f1-8ccc-10653022c2a0', 0, 162, NULL, NULL, 'Course Enrollment', NULL, 'enrollment', 0, NULL, '2026-03-03 21:21:31', NULL),
(155, 'f5acf7bd-1746-11f1-8ccc-10653022c2a0', 0, 162, NULL, NULL, 'Course Enrollment', NULL, 'enrollment', 0, NULL, '2026-03-03 21:21:31', NULL),
(156, 'f5ad0240-1746-11f1-8ccc-10653022c2a0', 0, 162, NULL, NULL, 'Course Enrollment', NULL, 'enrollment', 0, NULL, '2026-03-03 21:21:31', NULL),
(157, 'f5ad5bb0-1746-11f1-8ccc-10653022c2a0', 0, 162, NULL, NULL, 'Course Enrollment', NULL, 'enrollment', 0, NULL, '2026-03-03 21:21:31', NULL),
(158, 'f5ad6f50-1746-11f1-8ccc-10653022c2a0', 0, 163, NULL, NULL, 'Course Enrollment', NULL, 'enrollment', 0, NULL, '2026-03-03 21:21:31', NULL),
(159, 'f5ad8317-1746-11f1-8ccc-10653022c2a0', 0, 163, NULL, NULL, 'Course Enrollment', NULL, 'enrollment', 0, NULL, '2026-03-03 21:21:31', NULL),
(160, 'f5ad913a-1746-11f1-8ccc-10653022c2a0', 0, 163, NULL, NULL, 'Course Enrollment', NULL, 'enrollment', 0, NULL, '2026-03-03 21:21:31', NULL),
(161, 'f5ad9e52-1746-11f1-8ccc-10653022c2a0', 0, 163, NULL, NULL, 'Course Enrollment', NULL, 'enrollment', 0, NULL, '2026-03-03 21:21:31', NULL),
(162, 'f5ae1c46-1746-11f1-8ccc-10653022c2a0', 0, 164, NULL, NULL, 'Course Enrollment', NULL, 'enrollment', 0, NULL, '2026-03-03 21:21:31', NULL),
(163, 'f5ae2adc-1746-11f1-8ccc-10653022c2a0', 0, 164, NULL, NULL, 'Course Enrollment', NULL, 'enrollment', 0, NULL, '2026-03-03 21:21:31', NULL),
(164, 'f5ae40a8-1746-11f1-8ccc-10653022c2a0', 0, 164, NULL, NULL, 'Course Enrollment', NULL, 'enrollment', 0, NULL, '2026-03-03 21:21:31', NULL),
(165, 'f5ae5261-1746-11f1-8ccc-10653022c2a0', 0, 164, NULL, NULL, 'Course Enrollment', NULL, 'enrollment', 0, NULL, '2026-03-03 21:21:31', NULL),
(166, 'f5ae608f-1746-11f1-8ccc-10653022c2a0', 0, 164, NULL, NULL, 'Course Enrollment', NULL, 'enrollment', 0, NULL, '2026-03-03 21:21:31', NULL),
(167, 'f5ae6f25-1746-11f1-8ccc-10653022c2a0', 0, 165, NULL, NULL, 'Course Enrollment', NULL, 'enrollment', 0, NULL, '2026-03-03 21:21:31', NULL),
(168, 'f5ae7f02-1746-11f1-8ccc-10653022c2a0', 0, 165, NULL, NULL, 'Course Enrollment', NULL, 'enrollment', 0, NULL, '2026-03-03 21:21:31', NULL),
(169, 'f5ae8e93-1746-11f1-8ccc-10653022c2a0', 0, 165, NULL, NULL, 'Course Enrollment', NULL, 'enrollment', 0, NULL, '2026-03-03 21:21:31', NULL),
(170, 'f5af0b95-1746-11f1-8ccc-10653022c2a0', 0, 165, NULL, NULL, 'Course Enrollment', NULL, 'enrollment', 0, NULL, '2026-03-03 21:21:31', NULL),
(171, 'f5af1c76-1746-11f1-8ccc-10653022c2a0', 0, 166, NULL, NULL, 'Course Enrollment', NULL, 'enrollment', 0, NULL, '2026-03-03 21:21:31', NULL),
(172, 'f5af3059-1746-11f1-8ccc-10653022c2a0', 0, 166, NULL, NULL, 'Course Enrollment', NULL, 'enrollment', 0, NULL, '2026-03-03 21:21:31', NULL),
(173, 'f5b0249b-1746-11f1-8ccc-10653022c2a0', 0, 166, NULL, NULL, 'Course Enrollment', NULL, 'enrollment', 0, NULL, '2026-03-03 21:21:31', NULL),
(174, 'f5b034ba-1746-11f1-8ccc-10653022c2a0', 0, 167, NULL, NULL, 'Course Enrollment', NULL, 'enrollment', 0, NULL, '2026-03-03 21:21:31', NULL),
(175, 'f5b04c3b-1746-11f1-8ccc-10653022c2a0', 0, 167, NULL, NULL, 'Course Enrollment', NULL, 'enrollment', 0, NULL, '2026-03-03 21:21:31', NULL),
(176, 'f5b0591a-1746-11f1-8ccc-10653022c2a0', 0, 167, NULL, NULL, 'Course Enrollment', NULL, 'enrollment', 0, NULL, '2026-03-03 21:21:31', NULL),
(177, 'f5b066c9-1746-11f1-8ccc-10653022c2a0', 0, 169, NULL, NULL, 'Course Enrollment', NULL, 'enrollment', 0, NULL, '2026-03-03 21:21:31', NULL),
(178, 'f5b072df-1746-11f1-8ccc-10653022c2a0', 0, 169, NULL, NULL, 'Course Enrollment', NULL, 'enrollment', 0, NULL, '2026-03-03 21:21:31', NULL),
(179, 'f5b0d217-1746-11f1-8ccc-10653022c2a0', 0, 169, NULL, NULL, 'Course Enrollment', NULL, 'enrollment', 0, NULL, '2026-03-03 21:21:31', NULL),
(180, 'f5b0e337-1746-11f1-8ccc-10653022c2a0', 0, 169, NULL, NULL, 'Course Enrollment', NULL, 'enrollment', 0, NULL, '2026-03-03 21:21:31', NULL),
(181, 'f5b0f8a0-1746-11f1-8ccc-10653022c2a0', 0, 170, NULL, NULL, 'Course Enrollment', NULL, 'enrollment', 0, NULL, '2026-03-03 21:21:31', NULL),
(182, 'f5b10900-1746-11f1-8ccc-10653022c2a0', 0, 170, NULL, NULL, 'Course Enrollment', NULL, 'enrollment', 0, NULL, '2026-03-03 21:21:31', NULL),
(183, 'f5b11661-1746-11f1-8ccc-10653022c2a0', 0, 170, NULL, NULL, 'Course Enrollment', NULL, 'enrollment', 0, NULL, '2026-03-03 21:21:31', NULL),
(184, 'f5b12320-1746-11f1-8ccc-10653022c2a0', 0, 170, NULL, NULL, 'Course Enrollment', NULL, 'enrollment', 0, NULL, '2026-03-03 21:21:31', NULL),
(185, 'f5b12f5c-1746-11f1-8ccc-10653022c2a0', 0, 170, NULL, NULL, 'Course Enrollment', NULL, 'enrollment', 0, NULL, '2026-03-03 21:21:31', NULL),
(186, 'f5b13c4e-1746-11f1-8ccc-10653022c2a0', 0, 171, NULL, NULL, 'Course Enrollment', NULL, 'enrollment', 0, NULL, '2026-03-03 21:21:31', NULL),
(187, 'f5b14843-1746-11f1-8ccc-10653022c2a0', 0, 171, NULL, NULL, 'Course Enrollment', NULL, 'enrollment', 0, NULL, '2026-03-03 21:21:31', NULL),
(188, 'f5b21bea-1746-11f1-8ccc-10653022c2a0', 0, 171, NULL, NULL, 'Course Enrollment', NULL, 'enrollment', 0, NULL, '2026-03-03 21:21:31', NULL),
(189, 'f5b22a40-1746-11f1-8ccc-10653022c2a0', 0, 172, NULL, NULL, 'Course Enrollment', NULL, 'enrollment', 0, NULL, '2026-03-03 21:21:31', NULL),
(190, 'f5b2365a-1746-11f1-8ccc-10653022c2a0', 0, 172, NULL, NULL, 'Course Enrollment', NULL, 'enrollment', 0, NULL, '2026-03-03 21:21:31', NULL),
(191, 'f5b2429e-1746-11f1-8ccc-10653022c2a0', 0, 172, NULL, NULL, 'Course Enrollment', NULL, 'enrollment', 0, NULL, '2026-03-03 21:21:31', NULL),
(192, 'f5b2c3a0-1746-11f1-8ccc-10653022c2a0', 0, 174, NULL, NULL, 'Course Enrollment', NULL, 'enrollment', 0, NULL, '2026-03-03 21:21:31', NULL),
(193, 'f5b2e372-1746-11f1-8ccc-10653022c2a0', 0, 174, NULL, NULL, 'Course Enrollment', NULL, 'enrollment', 0, NULL, '2026-03-03 21:21:31', NULL),
(194, 'f5b36765-1746-11f1-8ccc-10653022c2a0', 0, 174, NULL, NULL, 'Course Enrollment', NULL, 'enrollment', 0, NULL, '2026-03-03 21:21:31', NULL),
(195, 'f5b379d3-1746-11f1-8ccc-10653022c2a0', 0, 174, NULL, NULL, 'Course Enrollment', NULL, 'enrollment', 0, NULL, '2026-03-03 21:21:31', NULL),
(196, 'f5b388dd-1746-11f1-8ccc-10653022c2a0', 0, 174, NULL, NULL, 'Course Enrollment', NULL, 'enrollment', 0, NULL, '2026-03-03 21:21:31', NULL),
(197, 'f5b41bf7-1746-11f1-8ccc-10653022c2a0', 0, 175, NULL, NULL, 'Course Enrollment', NULL, 'enrollment', 0, NULL, '2026-03-03 21:21:31', NULL),
(198, 'f5b42b8f-1746-11f1-8ccc-10653022c2a0', 0, 175, NULL, NULL, 'Course Enrollment', NULL, 'enrollment', 0, NULL, '2026-03-03 21:21:31', NULL),
(199, 'f5b43ac4-1746-11f1-8ccc-10653022c2a0', 0, 175, NULL, NULL, 'Course Enrollment', NULL, 'enrollment', 0, NULL, '2026-03-03 21:21:31', NULL),
(200, 'f5b54598-1746-11f1-8ccc-10653022c2a0', 0, 175, NULL, NULL, 'Course Enrollment', NULL, 'enrollment', 0, NULL, '2026-03-03 21:21:31', NULL),
(201, 'f5b591ba-1746-11f1-8ccc-10653022c2a0', 0, 176, NULL, NULL, 'Course Enrollment', NULL, 'enrollment', 0, NULL, '2026-03-03 21:21:31', NULL),
(202, 'f5b5e9b8-1746-11f1-8ccc-10653022c2a0', 0, 176, NULL, NULL, 'Course Enrollment', NULL, 'enrollment', 0, NULL, '2026-03-03 21:21:31', NULL),
(203, 'f5e90872-1746-11f1-8ccc-10653022c2a0', 147, 162, NULL, NULL, 'Welcome to LMS', 'Welcome to Accra SHS Learning Management System', 'system', 0, NULL, '2024-09-01 08:00:00', NULL),
(204, 'f5ea4a57-1746-11f1-8ccc-10653022c2a0', 152, 162, NULL, NULL, 'Assignment Due Soon', 'Essay Writing assignment due in 2 days', 'assignment', 0, NULL, '2024-09-13 10:00:00', NULL),
(205, 'f5ea4f08-1746-11f1-8ccc-10653022c2a0', 147, NULL, NULL, NULL, 'New Announcement', 'Sports Day announced for November 15', 'announcement', 1, NULL, '2024-10-01 11:00:00', NULL),
(206, 'f5ea525f-1746-11f1-8ccc-10653022c2a0', 0, NULL, NULL, NULL, 'Quiz Available', 'Biology Quiz now available - due today', 'quiz', 0, NULL, '2024-09-19 08:00:00', NULL),
(207, 'f5ea6374-1746-11f1-8ccc-10653022c2a0', 147, 152, NULL, NULL, 'New Student Enrollment', '5 new students added to your class', 'system', 1, NULL, '2024-09-02 09:00:00', NULL),
(208, 'f5ea66a5-1746-11f1-8ccc-10653022c2a0', 147, NULL, NULL, NULL, 'Assignment Submissions', '12 students submitted Biology assignment', 'assignment', 0, NULL, '2024-09-18 15:00:00', NULL),
(209, 'f5ea69d5-1746-11f1-8ccc-10653022c2a0', 0, 182, NULL, NULL, 'Academic Progress', 'Your child scored 85% in recent quiz', 'grade', 0, NULL, '2024-09-20 16:00:00', NULL),
(210, 'f5ea6d14-1746-11f1-8ccc-10653022c2a0', 147, 182, NULL, NULL, 'PTA Meeting Reminder', 'PTA meeting scheduled for Oct 20', 'event', 0, NULL, '2024-10-15 10:00:00', NULL),
(211, 'f5ea701e-1746-11f1-8ccc-10653022c2a0', 152, NULL, NULL, NULL, 'Grade Posted', 'Your essay has been graded - 18/20', 'grade', 0, NULL, '2024-09-22 14:00:00', NULL),
(212, 'f5ea73e3-1746-11f1-8ccc-10653022c2a0', 147, NULL, NULL, NULL, 'Upcoming Exam', 'Midterm exams start October 28', 'announcement', 0, NULL, '2024-10-20 09:00:00', NULL),
(213, 'f5ea7920-1746-11f1-8ccc-10653022c2a0', 147, NULL, NULL, NULL, 'Schedule Change', 'Math class moved to Room B205', 'system', 1, NULL, '2024-09-10 08:30:00', NULL),
(214, 'f5ea7cca-1746-11f1-8ccc-10653022c2a0', 147, 167, NULL, NULL, 'Library Notice', 'Library hours extended til 8PM', 'announcement', 0, NULL, '2024-10-10 12:30:00', NULL),
(215, 'f5ea8076-1746-11f1-8ccc-10653022c2a0', 0, 168, NULL, NULL, 'Assignment Reminder', 'History essay due tomorrow', 'assignment', 0, NULL, '2024-10-04 18:00:00', NULL),
(216, 'f5ea841c-1746-11f1-8ccc-10653022c2a0', 147, NULL, NULL, NULL, 'Lab Equipment Arrived', 'New physics lab equipment ready for use', 'system', 0, NULL, '2024-09-25 11:00:00', NULL),
(217, 'f5ea87ee-1746-11f1-8ccc-10653022c2a0', 147, 147, NULL, NULL, 'System Update', 'LMS will undergo maintenance this weekend', 'system', 1, NULL, '2024-10-12 16:00:00', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `parents`
--
-- Creation: Mar 03, 2026 at 08:58 PM
--

DROP TABLE IF EXISTS `parents`;
CREATE TABLE IF NOT EXISTS `parents` (
  `parent_id` int(11) NOT NULL AUTO_INCREMENT,
  `institution_id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `phone_number` varchar(20) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `occupation` varchar(100) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`parent_id`),
  UNIQUE KEY `user_id` (`user_id`),
  KEY `idx_institution_id` (`institution_id`),
  KEY `idx_phone` (`phone_number`),
  KEY `idx_email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=42 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `parents`
--

INSERT INTO `parents` (`parent_id`, `institution_id`, `user_id`, `first_name`, `last_name`, `phone_number`, `email`, `occupation`, `address`, `created_at`, `updated_at`) VALUES
(32, 1, 182, 'Yaw', 'Osei', '+233 24 555 5555', 'yaw.osei@parent.accrashs.edu.gh', 'Engineer', 'East Legon, Accra', '2026-03-03 21:21:31', '2026-03-09 08:00:53'),
(33, 1, 183, 'Akua', 'Adjei', '+233 24 555 5556', 'akua.adjei@parent.accrashs.edu.gh', 'Nurse', 'Osu, Accra', '2026-03-03 21:21:31', '2026-03-09 08:01:23'),
(34, 1, 184, 'Emmanuel', 'Addo', '+233 24 555 5557', 'emmanuel.addo@parent.accrashs.edu.gh', 'Teacher', 'Tema, Accra', '2026-03-03 21:21:31', '2026-03-09 08:01:40'),
(35, 1, 185, 'Patience', 'Boakye', '+233 24 555 5558', 'patience.boakye@parent.accrashs.edu.gh', 'Accountant', 'Spintex, Accra', '2026-03-03 21:21:31', '2026-03-09 08:02:16'),
(36, 1, 186, 'Samuel', 'Nyarko', '+233 24 555 5559', 'samuel.nyarko@parent.accrashs.edu.gh', 'Business Owner', 'Madina, Accra', '2026-03-03 21:21:31', '2026-03-09 08:02:32'),
(37, 1, 187, 'Grace', 'Mensah', '+233 24 555 5560', 'grace.mensah@parent.accrashs.edu.gh', 'Doctor', 'Dansoman, Accra', '2026-03-03 21:21:31', '2026-03-09 08:02:50'),
(38, 1, 188, 'Peter', 'Owusu', '+233 24 555 5561', 'peter.owusu@parent.accrashs.edu.gh', 'Lawyer', 'Kaneshie, Accra', '2026-03-03 21:21:31', '2026-03-09 08:03:07'),
(39, 1, 189, 'Mary', 'Asare', '+233 24 555 5562', 'mary.asare@parent.accrashs.edu.gh', 'Banker', 'Achimota, Accra', '2026-03-03 21:21:31', '2026-03-09 08:03:18'),
(40, 3, 190, 'Joseph', 'Boateng', '+233 24 555 5563', 'joseph.boateng@parent.accrashs.edu.gh', 'Architect', 'Labone, Accra', '2026-03-03 21:21:31', '2026-03-09 08:04:36'),
(41, 1, 191, 'Elizabeth', 'Ofori', '+233 24 555 5564', 'elizabeth.ofori@parent.accrashs.edu.gh', 'Civil Servant', 'South Labadi, Accra', '2026-03-03 21:21:31', '2026-03-09 08:05:04');

-- --------------------------------------------------------

--
-- Table structure for table `parent_students`
--
-- Creation: Mar 03, 2026 at 08:58 PM
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
) ENGINE=InnoDB AUTO_INCREMENT=62 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `parent_students`
--

INSERT INTO `parent_students` (`parent_student_id`, `parent_id`, `student_id`, `relationship_type`, `is_primary_contact`, `can_pickup`, `created_at`) VALUES
(47, 32, 63, 'Father', 1, 1, '2026-03-03 21:21:31'),
(48, 33, 64, 'Mother', 1, 1, '2026-03-03 21:21:31'),
(49, 34, 65, 'Father', 1, 1, '2026-03-03 21:21:31'),
(50, 35, 66, 'Mother', 1, 1, '2026-03-03 21:21:31'),
(51, 36, 67, 'Father', 1, 1, '2026-03-03 21:21:31'),
(52, 37, 68, 'Mother', 1, 1, '2026-03-03 21:21:31'),
(53, 38, 69, 'Father', 1, 1, '2026-03-03 21:21:31'),
(54, 39, 70, 'Mother', 1, 1, '2026-03-03 21:21:31'),
(55, 40, 71, 'Father', 1, 1, '2026-03-03 21:21:31'),
(56, 41, 72, 'Mother', 1, 1, '2026-03-03 21:21:31'),
(57, 33, 63, 'Mother', 0, 1, '2026-03-03 21:21:31'),
(58, 32, 64, 'Father', 0, 0, '2026-03-03 21:21:31'),
(59, 35, 67, 'Guardian', 0, 1, '2026-03-03 21:21:31'),
(60, 36, 65, 'Guardian', 0, 1, '2026-03-03 21:21:31'),
(61, 37, 66, 'Guardian', 0, 0, '2026-03-03 21:21:31');

-- --------------------------------------------------------

--
-- Table structure for table `password_reset_tokens`
--
-- Creation: Mar 03, 2026 at 08:58 PM
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
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `password_reset_tokens`
--

INSERT INTO `password_reset_tokens` (`token_id`, `user_id`, `token`, `expiry_date`, `is_active`, `created_at`, `used_at`, `ip_address`, `user_agent`) VALUES
(1, 1, 'e909c354050db27519124850c421969a692c1d6aa15afb611d858667e3369fe8', '2026-03-06 08:42:19', 0, '2026-03-06 06:42:19', NULL, '127.0.0.1', 'Mozilla/5.0 (iPhone; CPU iPhone OS 10_3_1 like Mac OS X) AppleWebKit/603.1.30 (KHTML, like Gecko) Version/15.0 Mobile/14E304 Safari/602.1'),
(2, 1, '34fc9368a8b1c5eebbf315fb99c1d209fb93a97a3513df590640662b62bfbbc2', '2026-03-06 09:06:52', 0, '2026-03-06 07:06:52', NULL, '127.0.0.1', 'Thunder Client (https://www.thunderclient.com)'),
(3, 1, '997b811b8779b174aaf64df73a0527fb3535f48a98851b046fb4049049a07a03', '2026-03-06 09:42:23', 0, '2026-03-06 07:42:23', NULL, '127.0.0.1', 'Mozilla/5.0 (iPhone; CPU iPhone OS 10_3_1 like Mac OS X) AppleWebKit/603.1.30 (KHTML, like Gecko) Version/15.0 Mobile/14E304 Safari/602.1'),
(4, 1, '0b1b42d99dec7e577bc5f8f6a4d7b51fbc61bcf79fef8f65cdd770dbda42d779', '2026-03-06 09:50:53', 0, '2026-03-06 07:50:53', NULL, '127.0.0.1', 'Mozilla/5.0 (iPhone; CPU iPhone OS 10_3_1 like Mac OS X) AppleWebKit/603.1.30 (KHTML, like Gecko) Version/15.0 Mobile/14E304 Safari/602.1'),
(5, 1, 'ddb5be36e57acbe5d9487c9a77fe9de5f9e82e72ced952af83b05b12cb71fe97', '2026-03-06 11:21:57', 0, '2026-03-06 09:21:57', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0'),
(6, 1, '4b182c42be8e5b248666fb262f107929f504e1a3e784a02ceee0bf4ebc11f199', '2026-03-06 11:32:56', 0, '2026-03-06 09:32:56', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0'),
(7, 1, '434f13a3776c5b9c8eab8a495bd0ba26fcfa0676393b75c1d15697d9bd6be178', '2026-03-06 11:50:32', 0, '2026-03-06 09:50:32', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0'),
(8, 1, '663209103ef673048cbae985300a4ba82c32b4b8703215c86b4355317db9802c', '2026-03-06 12:03:46', 0, '2026-03-06 10:03:46', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0'),
(9, 1, '5f52c7b42afaf3c33ab2342ef1256c103a1dbaecdc418e38f3124a0e4b0ed8d9', '2026-03-06 12:08:28', 0, '2026-03-06 10:08:28', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0'),
(10, 1, 'bba596fd31397e29d70d5647c3ab468734548151cf0b99124eb63f287697762c', '2026-03-06 12:11:04', 0, '2026-03-06 10:11:04', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0'),
(11, 1, '2444c17fdf81459e9f7c54e3a98bd194b77c8e462801a89f4f75303f5a50c5ec', '2026-03-06 12:16:48', 0, '2026-03-06 10:16:48', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0'),
(12, 1, '23c7123140eb12e424e7c25adf2eace4b9d32ae0542ca4f5da1ef7752423665e', '2026-03-06 12:20:41', 0, '2026-03-06 10:20:41', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0'),
(13, 1, '8c921a1ae67517c94ca7fe97038755f1c6312cba723b0b94f60a4d8490a9f461', '2026-03-06 12:30:56', 0, '2026-03-06 10:30:56', '2026-03-06 10:32:28', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0'),
(14, 1, 'c282fd36b1de94f88f97e2d84c3f8f58598812c28135ffdcf197c80d0874a7b1', '2026-03-09 11:04:18', 0, '2026-03-09 09:04:18', '2026-03-09 09:08:07', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0');

-- --------------------------------------------------------

--
-- Table structure for table `permissions`
--
-- Creation: Mar 03, 2026 at 08:58 PM
--

DROP TABLE IF EXISTS `permissions`;
CREATE TABLE IF NOT EXISTS `permissions` (
  `permission_id` int(11) NOT NULL AUTO_INCREMENT,
  `permission_name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`permission_id`),
  UNIQUE KEY `permission_name` (`permission_name`)
) ENGINE=InnoDB AUTO_INCREMENT=49 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `permissions`
--

INSERT INTO `permissions` (`permission_id`, `permission_name`, `description`, `created_at`) VALUES
(1, 'manage_institutions', 'Create, update, delete institutions (Super Admin only)', '2026-03-01 18:17:08'),
(2, 'manage_subscriptions', 'Manage institution subscriptions (Super Admin only)', '2026-03-01 18:17:08'),
(3, 'view_all_institutions', 'View all institutions on platform (Super Admin only)', '2026-03-01 18:17:08'),
(4, 'manage_users', 'Create, update, delete users', '2026-03-01 18:17:08'),
(5, 'manage_courses', 'Create, update, delete class subjects', '2026-03-01 18:17:08'),
(6, 'manage_assessments', 'Create, update, grade assessments', '2026-03-01 18:17:08'),
(7, 'view_reports', 'View system reports and analytics', '2026-03-01 18:17:08'),
(8, 'manage_attendance', 'Mark and manage attendance', '2026-03-01 18:17:08'),
(45, 'manage_grades', 'Input and modify student grades', '2026-03-03 21:21:30'),
(46, 'view_students', 'View student information', '2026-03-03 21:21:30'),
(47, 'manage_announcements', 'Create and manage announcements', '2026-03-03 21:21:30'),
(48, 'send_messages', 'Send messages to other users', '2026-03-03 21:21:30');

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
) ENGINE=InnoDB AUTO_INCREMENT=28 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `programs`
--

INSERT INTO `programs` (`program_id`, `institution_id`, `program_code`, `program_name`, `description`, `duration_years`, `status`, `created_at`, `updated_at`) VALUES
(22, 1, 'ARTS', 'General Arts', 'General Arts Program', 3, 'active', '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(23, 1, 'SCI', 'General Science', 'General Science Program', 3, 'active', '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(24, 1, 'BUS', 'Business', 'Business Program', 3, 'active', '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(25, 1, 'VA', 'Visual Arts', 'Visual Arts Program', 3, 'active', '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(26, 1, 'HOMEC', 'Home Economics', 'Home Economics Program', 3, 'active', '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(27, 1, 'AGRIC', 'Agricultural Science', 'Agricultural Science Program', 3, 'active', '2026-03-03 21:21:31', '2026-03-03 21:21:31');

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
) ENGINE=InnoDB AUTO_INCREMENT=34 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `quizzes`
--

INSERT INTO `quizzes` (`quiz_id`, `course_id`, `section_id`, `title`, `description`, `duration_minutes`, `max_attempts`, `status`, `quiz_type`, `is_activated`, `show_results`, `start_date`, `end_date`, `created_at`, `updated_at`) VALUES
(26, 48, NULL, 'English Grammar Quiz 1', 'Basic grammar and parts of speech', 30, 1, 'active', 'graded', 0, 'after_end', '2024-09-16 08:00:00', '2024-09-16 23:59:59', '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(27, 54, NULL, 'Cell Biology Quiz', 'Test on cell structure and function', 45, 1, 'active', 'graded', 0, 'after_end', '2024-09-19 08:00:00', '2024-09-19 23:59:59', '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(28, 55, NULL, 'Physics Mechanics Quiz', 'Newton laws and motion', 40, 1, 'active', 'graded', 0, 'after_end', '2024-09-23 08:00:00', '2024-09-23 23:59:59', '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(29, 56, NULL, 'Algebra Basics Quiz', 'Linear equations and inequalities', 35, 1, 'active', 'graded', 0, 'after_end', '2024-09-26 08:00:00', '2024-09-26 23:59:59', '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(30, 57, NULL, 'Chemical Reactions Quiz', 'Types of chemical reactions', 40, 1, 'active', 'graded', 0, 'after_end', '2024-10-02 08:00:00', '2024-10-02 23:59:59', '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(31, 58, NULL, 'Ghana History Quiz', 'Pre-colonial to independence', 30, 1, 'active', 'graded', 0, 'after_end', '2024-10-07 08:00:00', '2024-10-07 23:59:59', '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(32, 59, NULL, 'Poetry Analysis Quiz', 'Literary devices and themes', 35, 1, 'active', 'graded', 0, 'after_end', '2024-10-12 08:00:00', '2024-10-12 23:59:59', '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(33, 60, NULL, 'Calculus Introduction Quiz', 'Limits and derivatives basics', 45, 1, 'active', 'graded', 0, 'after_end', '2024-10-15 08:00:00', '2024-10-15 23:59:59', '2026-03-03 21:21:31', '2026-03-03 21:21:31');

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
) ENGINE=InnoDB AUTO_INCREMENT=64 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `quiz_questions`
--

INSERT INTO `quiz_questions` (`question_id`, `quiz_id`, `question_text`, `question_type`, `points`, `difficulty`, `explanation`, `correct_answer`, `order_index`, `created_at`, `updated_at`) VALUES
(44, 26, 'What is a noun?', 'multiple_choice', 2, NULL, NULL, 'a', 1, '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(45, 26, 'Identify the verb in: \"She runs quickly\"', 'multiple_choice', 2, NULL, NULL, 'b', 2, '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(46, 26, 'Which is an adjective?', 'multiple_choice', 2, NULL, NULL, 'c', 3, '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(47, 26, 'What is a pronoun?', 'multiple_choice', 2, NULL, NULL, 'a', 4, '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(48, 26, 'Identify the adverb', 'multiple_choice', 2, NULL, NULL, 'd', 5, '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(49, 27, 'What is the powerhouse of the cell?', 'multiple_choice', 5, NULL, NULL, 'a', 1, '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(50, 27, 'Which organelle controls cell activities?', 'multiple_choice', 5, NULL, NULL, 'b', 2, '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(51, 27, 'What is the function of chloroplasts?', 'multiple_choice', 5, NULL, NULL, 'c', 3, '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(52, 27, 'What surrounds the cell?', 'multiple_choice', 5, NULL, NULL, 'a', 4, '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(53, 27, 'What stores genetic information?', 'multiple_choice', 5, NULL, NULL, 'd', 5, '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(54, 28, 'State Newton first law', 'short_answer', 6, NULL, NULL, NULL, 1, '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(55, 28, 'What is the formula for force?', 'multiple_choice', 6, NULL, NULL, 'a', 2, '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(56, 28, 'Define acceleration', 'short_answer', 6, NULL, NULL, NULL, 3, '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(57, 28, 'Calculate: F = ma when m=5kg, a=2m/s²', 'multiple_choice', 6, NULL, NULL, 'b', 4, '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(58, 28, 'What is inertia?', 'short_answer', 6, NULL, NULL, NULL, 5, '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(59, 29, 'Solve: 2x + 5 = 15', 'multiple_choice', 4, NULL, NULL, 'a', 1, '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(60, 29, 'What is x in: 3x = 21?', 'multiple_choice', 4, NULL, NULL, 'c', 2, '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(61, 29, 'Simplify: 4x + 3x', 'multiple_choice', 4, NULL, NULL, 'b', 3, '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(62, 29, 'Factorize: x² - 9', 'multiple_choice', 4, NULL, NULL, 'd', 4, '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(63, 29, 'Expand: (x+3)(x-2)', 'short_answer', 4, NULL, NULL, NULL, 5, '2026-03-03 21:21:31', '2026-03-03 21:21:31');

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
) ENGINE=InnoDB AUTO_INCREMENT=29 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `quiz_question_options`
--

INSERT INTO `quiz_question_options` (`option_id`, `question_id`, `option_label`, `option_text`, `is_correct`, `created_at`) VALUES
(11, 44, 'A', 'A person, place, or thing', 1, '2026-03-03 21:21:32'),
(12, 44, 'B', 'An action word', 0, '2026-03-03 21:21:32'),
(13, 44, 'C', 'A describing word', 0, '2026-03-03 21:21:32'),
(14, 44, 'D', 'A connecting word', 0, '2026-03-03 21:21:32'),
(18, 45, 'A', 'She', 0, '2026-03-03 21:21:32'),
(19, 45, 'B', 'runs', 1, '2026-03-03 21:21:32'),
(20, 45, 'C', 'quickly', 0, '2026-03-03 21:21:32'),
(21, 45, 'D', 'None', 0, '2026-03-03 21:21:32'),
(25, 49, 'A', 'Mitochondria', 1, '2026-03-03 21:21:32'),
(26, 49, 'B', 'Nucleus', 0, '2026-03-03 21:21:32'),
(27, 49, 'C', 'Ribosome', 0, '2026-03-03 21:21:32'),
(28, 49, 'D', 'Vacuole', 0, '2026-03-03 21:21:32');

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
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `roles`
--

INSERT INTO `roles` (`role_id`, `role_name`, `description`, `created_at`, `updated_at`) VALUES
(1, 'super_admin', 'Platform Super Administrator - Manages all institutions', '2026-03-01 18:17:07', '2026-03-01 18:17:07'),
(2, 'admin', 'Institution Administrator - Manages single institution', '2026-03-01 18:17:07', '2026-03-01 18:17:07'),
(3, 'teacher', 'Teacher/Instructor', '2026-03-01 18:17:07', '2026-03-01 18:17:07'),
(4, 'student', 'Student', '2026-03-01 18:17:07', '2026-03-01 18:17:07'),
(5, 'parent', 'Parent/Guardian', '2026-03-01 18:17:07', '2026-03-01 18:17:07');

-- --------------------------------------------------------

--
-- Table structure for table `role_permissions`
--
-- Creation: Mar 03, 2026 at 08:58 PM
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
) ENGINE=InnoDB AUTO_INCREMENT=94 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `role_permissions`
--

INSERT INTO `role_permissions` (`role_permission_id`, `role_id`, `permission_id`, `created_at`) VALUES
(1, 1, 6, '2026-03-01 18:17:08'),
(2, 1, 8, '2026-03-01 18:17:08'),
(3, 1, 5, '2026-03-01 18:17:08'),
(4, 1, 1, '2026-03-01 18:17:08'),
(5, 1, 2, '2026-03-01 18:17:08'),
(6, 1, 4, '2026-03-01 18:17:08'),
(7, 1, 3, '2026-03-01 18:17:08'),
(8, 1, 7, '2026-03-01 18:17:08'),
(16, 2, 6, '2026-03-01 18:17:08'),
(17, 2, 8, '2026-03-01 18:17:08'),
(18, 2, 5, '2026-03-01 18:17:08'),
(19, 2, 4, '2026-03-01 18:17:08'),
(20, 2, 7, '2026-03-01 18:17:08'),
(23, 3, 6, '2026-03-01 18:17:08'),
(24, 3, 8, '2026-03-01 18:17:08'),
(25, 3, 5, '2026-03-01 18:17:08'),
(26, 1, 11, '2026-03-03 20:59:25'),
(27, 1, 9, '2026-03-03 20:59:25'),
(28, 1, 12, '2026-03-03 20:59:25'),
(29, 1, 10, '2026-03-03 20:59:25'),
(33, 2, 11, '2026-03-03 20:59:25'),
(34, 2, 9, '2026-03-03 20:59:25'),
(35, 2, 12, '2026-03-03 20:59:25'),
(36, 2, 10, '2026-03-03 20:59:25'),
(40, 3, 9, '2026-03-03 20:59:25'),
(41, 3, 12, '2026-03-03 20:59:25'),
(42, 3, 10, '2026-03-03 20:59:25'),
(43, 1, 23, '2026-03-03 21:02:44'),
(44, 1, 21, '2026-03-03 21:02:44'),
(45, 1, 24, '2026-03-03 21:02:44'),
(46, 1, 22, '2026-03-03 21:02:44'),
(50, 2, 23, '2026-03-03 21:02:44'),
(51, 2, 21, '2026-03-03 21:02:44'),
(52, 2, 24, '2026-03-03 21:02:44'),
(53, 2, 22, '2026-03-03 21:02:44'),
(57, 3, 21, '2026-03-03 21:02:44'),
(58, 3, 24, '2026-03-03 21:02:44'),
(59, 3, 22, '2026-03-03 21:02:44'),
(60, 1, 35, '2026-03-03 21:03:05'),
(61, 1, 33, '2026-03-03 21:03:05'),
(62, 1, 36, '2026-03-03 21:03:05'),
(63, 1, 34, '2026-03-03 21:03:05'),
(67, 2, 35, '2026-03-03 21:03:05'),
(68, 2, 33, '2026-03-03 21:03:05'),
(69, 2, 36, '2026-03-03 21:03:05'),
(70, 2, 34, '2026-03-03 21:03:05'),
(74, 3, 33, '2026-03-03 21:03:05'),
(75, 3, 36, '2026-03-03 21:03:05'),
(76, 3, 34, '2026-03-03 21:03:05'),
(77, 1, 47, '2026-03-03 21:21:31'),
(78, 1, 45, '2026-03-03 21:21:31'),
(79, 1, 48, '2026-03-03 21:21:31'),
(80, 1, 46, '2026-03-03 21:21:31'),
(84, 2, 47, '2026-03-03 21:21:31'),
(85, 2, 45, '2026-03-03 21:21:31'),
(86, 2, 48, '2026-03-03 21:21:31'),
(87, 2, 46, '2026-03-03 21:21:31'),
(91, 3, 45, '2026-03-03 21:21:31'),
(92, 3, 48, '2026-03-03 21:21:31'),
(93, 3, 46, '2026-03-03 21:21:31');

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

--
-- Dumping data for table `schema_migrations`
--

INSERT INTO `schema_migrations` (`version`, `description`, `applied_at`, `applied_by`, `execution_time_ms`, `success`, `notes`) VALUES
('000', 'Initial database schema', '2026-03-03 03:14:23', 'system', NULL, 1, 'Base schema from lms (1).sql');

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
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `semesters`
--

INSERT INTO `semesters` (`semester_id`, `institution_id`, `academic_year_id`, `semester_name`, `start_date`, `end_date`, `is_current`, `created_at`, `updated_at`) VALUES
(21, 1, 17, 'First Term', '2024-09-01', '2024-12-20', 1, '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(22, 1, 17, 'Second Term', '2025-01-06', '2025-04-10', 0, '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(23, 1, 17, 'Third Term', '2025-04-28', '2025-06-30', 0, '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(24, 1, 16, 'FirstTerm', '2023-09-01', '2023-12-20', 0, '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(25, 1, 16, 'Second Term', '2024-01-08', '2024-04-12', 0, '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(26, 1, 16, 'Third Term', '2024-04-29', '2024-06-28', 0, '2026-03-03 21:21:31', '2026-03-03 21:21:31');

-- --------------------------------------------------------

--
-- Table structure for table `students`
--
-- Creation: Mar 03, 2026 at 08:58 PM
--

DROP TABLE IF EXISTS `students`;
CREATE TABLE IF NOT EXISTS `students` (
  `student_id` int(11) NOT NULL AUTO_INCREMENT,
  `uuid` char(36) NOT NULL,
  `institution_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `class_id` int(11) DEFAULT NULL,
  `student_id_number` varchar(50) NOT NULL,
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
) ENGINE=InnoDB AUTO_INCREMENT=122 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `students`
--

INSERT INTO `students` (`student_id`, `uuid`, `institution_id`, `user_id`, `class_id`, `student_id_number`, `enrollment_date`, `gender`, `date_of_birth`, `parent_name`, `parent_phone`, `parent_email`, `emergency_contact`, `status`, `created_at`, `updated_at`) VALUES
(63, 'f58350f7-1746-11f1-8ccc-10653022c2a0', 1, 162, 35, 'ASHS-2024-0001', '2025-05-03', 'male', '2009-03-15', 'Kwame Mom', '0232323234', 'benedictamankwa@gsdsd.sdsd', '0541232734', 'active', '2026-03-03 21:21:31', '2026-03-09 22:08:00'),
(64, 'f5836bbd-1746-11f1-8ccc-10653022c2a0', 1, 163, 33, 'ASHS-2024-0002', '2026-03-03', 'Female', '2009-05-20', NULL, NULL, NULL, NULL, 'active', '2026-03-03 21:21:31', '2026-03-09 22:08:00'),
(65, 'f5837514-1746-11f1-8ccc-10653022c2a0', 1, 164, 35, 'ASHS-2024-0003', '2026-03-03', 'Male', '2009-01-10', NULL, NULL, NULL, NULL, 'active', '2026-03-03 21:21:31', '2026-03-09 22:08:01'),
(66, 'f583778f-1746-11f1-8ccc-10653022c2a0', 1, 165, 33, 'ASHS-2024-0004', '2026-03-03', 'Female', '2009-07-25', NULL, NULL, NULL, NULL, 'active', '2026-03-03 21:21:31', '2026-03-09 22:08:01'),
(67, 'f584599e-1746-11f1-8ccc-10653022c2a0', 1, 166, 36, 'ASHS-2024-0005', '2025-05-03', 'Male', '2009-02-14', NULL, NULL, NULL, NULL, 'active', '2026-03-03 21:21:31', '2026-03-09 22:08:01'),
(68, 'f5845b9e-1746-11f1-8ccc-10653022c2a0', 1, 167, 34, 'ASHS-2024-0006', '2026-03-03', 'Female', '2009-06-30', NULL, NULL, NULL, NULL, 'active', '2026-03-03 21:21:31', '2026-03-09 22:08:01'),
(69, 'f5845cea-1746-11f1-8ccc-10653022c2a0', 1, 168, 37, 'ASHS-2024-0007', '2026-03-03', 'Male', '2009-04-18', NULL, NULL, NULL, NULL, 'active', '2026-03-03 21:21:31', '2026-03-09 22:08:01'),
(70, 'f5845e2e-1746-11f1-8ccc-10653022c2a0', 1, 169, 33, 'ASHS-2024-0008', '2026-03-03', 'Female', '2009-08-05', NULL, NULL, NULL, NULL, 'active', '2026-03-03 21:21:31', '2026-03-09 22:08:01'),
(71, 'f58460d1-1746-11f1-8ccc-10653022c2a0', 1, 170, 35, 'ASHS-2024-0009', '2026-03-03', 'Male', '2009-11-22', NULL, NULL, NULL, NULL, 'active', '2026-03-03 21:21:31', '2026-03-09 22:08:01'),
(72, 'f5846258-1746-11f1-8ccc-10653022c2a0', 1, 171, 34, 'ASHS-2024-0010', '2026-03-03', 'Female', '2009-09-12', NULL, NULL, NULL, NULL, 'active', '2026-03-03 21:21:31', '2026-03-09 22:08:01'),
(73, 'f58463da-1746-11f1-8ccc-10653022c2a0', 1, 172, 36, 'ASHS-2024-0011', '2026-03-03', 'Male', '2009-10-08', NULL, NULL, NULL, NULL, 'active', '2026-03-03 21:21:31', '2026-03-09 22:08:01'),
(74, 'f584655f-1746-11f1-8ccc-10653022c2a0', 1, 173, 37, 'ASHS-2024-0012', '2025-05-03', 'Female', '2009-12-01', NULL, NULL, NULL, NULL, 'active', '2026-03-03 21:21:31', '2026-03-09 22:08:01'),
(75, 'f58466ef-1746-11f1-8ccc-10653022c2a0', 1, 174, 35, 'ASHS-2024-0013', '2026-03-03', 'Male', '2009-03-28', NULL, NULL, NULL, NULL, 'active', '2026-03-03 21:21:31', '2026-03-09 22:08:01'),
(76, 'f5846874-1746-11f1-8ccc-10653022c2a0', 1, 175, 33, 'ASHS-2024-0014', '2025-05-03', 'Female', '2009-05-16', NULL, NULL, NULL, NULL, 'active', '2026-03-03 21:21:31', '2026-03-09 22:08:01'),
(77, 'f58469ef-1746-11f1-8ccc-10653022c2a0', 1, 176, 36, 'ASHS-2024-0015', '2025-05-03', 'Male', '2009-07-04', NULL, NULL, NULL, NULL, 'active', '2026-03-03 21:21:31', '2026-03-09 22:08:01'),
(78, 'f5846b59-1746-11f1-8ccc-10653022c2a0', 1, 177, 34, 'ASHS-2024-0016', '2026-03-03', 'Female', '2009-02-19', NULL, NULL, NULL, NULL, 'active', '2026-03-03 21:21:31', '2026-03-09 22:08:02'),
(79, 'f5846cdb-1746-11f1-8ccc-10653022c2a0', 1, 178, 37, 'ASHS-2024-0017', '2026-03-03', 'Male', '2009-06-11', NULL, NULL, NULL, NULL, 'active', '2026-03-03 21:21:31', '2026-03-09 22:08:02'),
(80, 'f5846e55-1746-11f1-8ccc-10653022c2a0', 1, 179, 35, 'ASHS-2024-0018', '2026-03-03', 'Female', '2009-04-23', NULL, NULL, NULL, NULL, 'active', '2026-03-03 21:21:31', '2026-03-09 22:08:18'),
(81, 'f5846fe4-1746-11f1-8ccc-10653022c2a0', 2, 180, NULL, 'KSHS-2024-0001', '2026-03-03', 'Male', '2009-08-14', NULL, NULL, NULL, NULL, 'active', '2026-03-03 21:21:31', '2026-03-08 08:55:21'),
(82, 'f584716f-1746-11f1-8ccc-10653022c2a0', 2, 181, NULL, 'KSHS-2024-0002', '2025-05-03', 'Female', '2009-10-27', NULL, NULL, NULL, NULL, 'active', '2026-03-03 21:21:31', '2026-03-08 09:42:54'),
(83, '1b88a5ba-1bf5-4f47-9843-41bec47d07d3', 1, 192, 39, 'ASHS-2026-0001', '2026-03-09', 'female', NULL, NULL, NULL, NULL, NULL, 'active', '2026-03-09 21:51:27', '2026-03-09 22:08:00'),
(84, '59e8023a-1b52-4d90-9c23-a8401cf59f22', 1, 194, NULL, 'ASHS-2026-0002', '2026-03-09', NULL, NULL, NULL, NULL, 'benedictamankwa9@gmail.com', NULL, 'withdrawn', '2026-03-09 22:06:52', '2026-03-09 23:24:01'),
(85, 'e64ec54e-0482-4a07-8665-21859b1d276c', 1, 195, NULL, 'ASHS-2026-0003', '2026-03-09', NULL, NULL, NULL, NULL, 'nethunterghana@gmail.com', NULL, 'withdrawn', '2026-03-09 22:07:30', '2026-03-09 23:24:01'),
(105, '40dbbff2-2aed-4d4e-89b8-634900c09c7b', 1, 215, NULL, 'ASHS-2026-0004', '2024-09-01', 'male', '2007-09-14', 'Mrs. Darko', '0244200004', 'darko.parent@gmail.com', NULL, 'withdrawn', '2026-03-09 23:17:54', '2026-03-09 23:24:00'),
(106, '59539fda-cc98-4093-b6be-d2d669a27e29', 1, 216, NULL, 'ASHS-2026-0005', '2024-09-01', 'female', '2008-01-30', 'Mr. Frimpong', '0244200005', 'frimpong.parent@gmail.com', NULL, 'withdrawn', '2026-03-09 23:17:54', '2026-03-09 23:24:00'),
(107, 'dfdc6202-6141-492f-b9c5-873d5a84f68d', 1, 217, NULL, 'ASHS-2026-0006', '2024-09-01', 'male', '2007-07-19', 'Mrs. Mensah', '0244200006', 'mensah.parent@gmail.com', NULL, 'withdrawn', '2026-03-09 23:17:54', '2026-03-09 23:24:01'),
(108, '5d27b523-a296-4e4c-b7fc-b7c8c28da337', 1, 218, NULL, 'ASHS-2026-0007', '2024-09-01', 'female', '2008-04-22', 'Mr. Amponsah', '0244200007', 'amponsah.parent@gmail.com', NULL, 'withdrawn', '2026-03-09 23:17:54', '2026-03-09 23:24:01'),
(109, 'ab68b657-271e-4ec9-be14-5ef5a719e77a', 1, 219, NULL, 'ASHS-2026-0008', '2024-09-01', 'male', '2007-12-05', 'Mrs. Adjei', '0244200008', 'adjei.parent@gmail.com', NULL, 'withdrawn', '2026-03-09 23:17:55', '2026-03-09 23:24:00'),
(110, '2214235b-2252-4096-9ed3-a59811da9151', 1, 220, NULL, 'ASHS-2026-0009', '2024-09-01', 'female', '2008-08-17', 'Mr. Nkrumah', '0244200009', 'nkrumah.parent@gmail.com', NULL, 'withdrawn', '2026-03-09 23:17:55', '2026-03-09 23:24:00'),
(111, '718f3534-f91b-4d99-8aeb-8b465d057bf3', 1, 221, NULL, 'ASHS-2026-0010', '2024-09-01', 'male', '2007-05-03', 'Mrs. Ofori', '0244200010', 'ofori.parent@gmail.com', NULL, 'withdrawn', '2026-03-09 23:17:55', '2026-03-09 23:24:00'),
(112, '2fd352ca-f8d1-4349-9d02-0029422f9587', 1, 222, NULL, 'ASHS-2026-0011', '2024-09-01', 'female', '2008-02-14', 'Mr. Asare', '0244210011', 'asare.parent@gmail.com', NULL, 'withdrawn', '2026-03-09 23:22:51', '2026-03-09 23:24:00'),
(113, 'ad7080e1-adf9-4a8c-b4ff-b9d62b5754d8', 1, 223, NULL, 'ASHS-2026-0012', '2024-09-01', 'male', '2007-10-09', 'Mrs. Boateng', '0244210012', 'boateng2.parent@gmail.com', NULL, 'withdrawn', '2026-03-09 23:22:51', '2026-03-09 23:24:00'),
(114, 'd4a83bb8-f917-4c8c-a5cb-a6f6efc7ea4f', 1, 224, NULL, 'ASHS-2026-0013', '2024-09-01', 'female', '2008-07-21', 'Mr. Osei', '0244210013', 'osei.parent@gmail.com', NULL, 'withdrawn', '2026-03-09 23:22:52', '2026-03-09 23:23:59'),
(115, '7889d98c-ddf9-4cff-a271-7e1dfd96dd66', 1, 225, NULL, 'ASHS-2026-0014', '2024-09-01', 'male', '2007-04-16', 'Mrs. Agyei', '0244210014', 'agyei.parent@gmail.com', NULL, 'withdrawn', '2026-03-09 23:22:52', '2026-03-09 23:24:00'),
(116, 'af974722-083f-4d4f-9839-6356be63e2d2', 1, 226, NULL, 'ASHS-2026-0015', '2024-09-01', 'female', '2008-11-03', 'Mr. Adusei', '0244210015', 'adusei.parent@gmail.com', NULL, 'withdrawn', '2026-03-09 23:22:52', '2026-03-09 23:24:00'),
(117, 'ba606b63-afe6-446b-a774-c0b07b2d8d32', 1, 227, NULL, 'ASHS-2026-0016', '2024-09-01', 'male', '2007-08-27', 'Mrs. Quansah', '0244210016', 'quansah.parent@gmail.com', NULL, 'withdrawn', '2026-03-09 23:22:52', '2026-03-09 23:24:00'),
(118, 'fa607265-7573-4010-b5e5-a4eb4d8de69a', 1, 228, NULL, 'ASHS-2026-0017', '2024-09-01', 'female', '2008-05-11', 'Mr. Tetteh', '0244210017', 'tetteh.parent@gmail.com', NULL, 'withdrawn', '2026-03-09 23:22:52', '2026-03-09 23:24:00'),
(119, 'b1de86ab-4b48-48ab-ab12-5c4ac6f45619', 1, 229, NULL, 'ASHS-2026-0018', '2024-09-01', 'male', '2007-01-30', 'Mrs. Donkor', '0244210018', 'donkor.parent@gmail.com', NULL, 'inactive', '2026-03-09 23:22:53', '2026-03-09 23:24:19'),
(120, '0d5995fd-221f-4be6-91f1-9245d08f17eb', 1, 230, NULL, 'ASHS-2026-0019', '2024-09-01', 'female', '2008-09-06', 'Mr. Appiah', '0244210019', 'appiah.parent@gmail.com', NULL, 'withdrawn', '2026-03-09 23:22:53', '2026-03-09 23:23:59'),
(121, 'd64358b6-081d-4767-9ddb-50f456a7986f', 1, 231, NULL, 'ASHS-2026-0020', '2024-09-01', 'male', '2007-06-22', 'Mrs. Barimah', '0244210020', 'barimah.parent@gmail.com', NULL, 'withdrawn', '2026-03-09 23:22:53', '2026-03-09 23:23:59');

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
) ENGINE=InnoDB AUTO_INCREMENT=94 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `subjects`
--

INSERT INTO `subjects` (`subject_id`, `uuid`, `institution_id`, `subject_code`, `subject_name`, `description`, `credits`, `is_core`, `image`, `created_at`, `updated_at`) VALUES
(74, 'f554a373-1746-11f1-8ccc-10653022c2a0', 1, 'ENG', 'English Language', 'Core English Language', 3, 1, NULL, '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(75, 'f554b5f4-1746-11f1-8ccc-10653022c2a0', 1, 'MATH-C', 'Mathematics (Core)', 'Core Mathematics', 3, 1, NULL, '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(76, 'f554ba2b-1746-11f1-8ccc-10653022c2a0', 1, 'INT-SCI', 'Integrated Science', 'Integrated Science', 3, 1, NULL, '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(77, 'f554bcec-1746-11f1-8ccc-10653022c2a0', 1, 'SOC-ST', 'Social Studies', 'Social Studies', 3, 1, NULL, '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(78, 'f554bf85-1746-11f1-8ccc-10653022c2a0', 1, 'LIT', 'Literature in English', 'Literature in English', 3, 0, NULL, '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(79, 'f554c226-1746-11f1-8ccc-10653022c2a0', 1, 'HIST', 'History', 'History', 3, 0, NULL, '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(80, 'f554c473-1746-11f1-8ccc-10653022c2a0', 1, 'GEOG', 'Geography', 'Geography', 3, 0, NULL, '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(81, 'f554c6a8-1746-11f1-8ccc-10653022c2a0', 1, 'CRS', 'Christian Religious Studies', 'Christian Religious Studies', 3, 0, NULL, '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(82, 'f554c94a-1746-11f1-8ccc-10653022c2a0', 1, 'ECON', 'Economics', 'Economics', 3, 0, NULL, '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(83, 'f554cbac-1746-11f1-8ccc-10653022c2a0', 1, 'PHY', 'Physics', 'Physics', 3, 0, NULL, '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(84, 'f554ce13-1746-11f1-8ccc-10653022c2a0', 1, 'CHEM', 'Chemistry', 'Chemistry', 3, 0, NULL, '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(85, 'f554d060-1746-11f1-8ccc-10653022c2a0', 1, 'BIO', 'Biology', 'Biology', 3, 0, NULL, '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(86, 'f554d2bb-1746-11f1-8ccc-10653022c2a0', 1, 'MATH-E', 'Elective Mathematics', 'Elective Mathematics', 3, 0, NULL, '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(87, 'f554d527-1746-11f1-8ccc-10653022c2a0', 1, 'ICT', 'Information Technology', 'Information Technology', 3, 0, NULL, '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(88, 'f554d77b-1746-11f1-8ccc-10653022c2a0', 1, 'BUS-MGT', 'Business Management', 'Business Management', 3, 0, NULL, '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(89, 'f554d9ca-1746-11f1-8ccc-10653022c2a0', 1, 'ACCT', 'Accounting', 'Accounting', 3, 0, NULL, '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(90, 'f5554e65-1746-11f1-8ccc-10653022c2a0', 1, 'COST', 'Costing', 'Costing', 3, 0, NULL, '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(91, 'f55550f5-1746-11f1-8ccc-10653022c2a0', 1, 'FIN-ACCT', 'Financial Accounting', 'Financial Accounting', 3, 0, NULL, '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(92, 'f55552dd-1746-11f1-8ccc-10653022c2a0', 1, 'ECON-BUS', 'Economics', 'Economics for Business', 3, 0, NULL, '2026-03-03 21:21:31', '2026-03-03 21:21:31');

-- --------------------------------------------------------

--
-- Table structure for table `superadmin_activity`
--
-- Creation: Mar 08, 2026 at 05:36 AM
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
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tracks all meaningful actions performed by super admins';

--
-- Dumping data for table `superadmin_activity`
--

INSERT INTO `superadmin_activity` (`activity_id`, `uuid`, `performed_by`, `activity_type`, `description`, `entity_type`, `entity_id`, `meta`, `ip_address`, `user_agent`, `severity`, `created_at`) VALUES
(1, 'd3cc5561-d0dd-42a7-be3e-dc53e0415efd', 1, 'institution_created', 'Created new institution: Kumasi SHS', 'institution', 1, 'Kumasi SHS', '::1', 'PostmanRuntime/7.52.0', 'info', '2026-03-08 06:58:33');

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
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `system_settings`
--

INSERT INTO `system_settings` (`settings_id`, `settings`, `updated_at`) VALUES
(1, '{\r\n    \"site_name\": \"Ghana SHS LMS\",\r\n    \"site_url\": \"https://ghanashslms.edu.gh\",\r\n    \"app_version\": \"1.0.0\",\r\n    \"timezone\": \"Africa/Accra\",\r\n    \"default_language\": \"en\",\r\n    \"date_format\": \"Y-m-d\",\r\n    \"time_format\": \"H:i:s\",\r\n    \"max_upload_size\": \"10485760\",\r\n    \"session_timeout\": \"3600\",\r\n    \"allow_registration\": 1,\r\n    \"require_verification\": 1,\r\n    \"smtp_host\": \"smtp.ghanashslms.edu.gh\",\r\n    \"smtp_port\": 587,\r\n    \"smtp_username\": \"noreply@ghanashslms.edu.gh\",\r\n    \"from_address\": \"noreply@ghanashslms.edu.gh\",\r\n    \"from_name\": \"Ghana SHS LMS\",\r\n    \"enable_notifications\": 1,\r\n    \"enable_email_notifications\": 1,\r\n    \"enable_sms_notifications\": 0,\r\n    \"maintenance_mode\": 0,\r\n    \"ga_id\": \"\",\r\n    \"integrations_note\": \"\",\r\n    \"updated_at\": \"2024-09-01 08:00:00\"\r\n}', '2024-09-01 08:00:00');

-- --------------------------------------------------------

--
-- Table structure for table `teachers`
--
-- Creation: Mar 10, 2026 at 05:28 AM
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
) ENGINE=InnoDB AUTO_INCREMENT=64 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `teachers`
--

INSERT INTO `teachers` (`teacher_id`, `uuid`, `institution_id`, `user_id`, `employee_id`, `program_id`, `specialization`, `hire_date`, `employment_end_date`, `qualification`, `years_of_experience`, `created_at`, `updated_at`) VALUES
(33, 'f563c306-1746-11f1-8ccc-10653022c2a0', 1, 152, 'T-2024-001', 22, 'English Language', '2026-03-01', NULL, 'Masters in English', 2, '2026-03-03 21:21:31', '2026-03-10 08:55:27'),
(34, 'f563d91a-1746-11f1-8ccc-10653022c2a0', 1, 153, 'T-2024-002', 23, 'Biology', '2019-09-01', NULL, 'Masters in Biology', NULL, '2026-03-03 21:21:31', '2026-03-10 05:30:51'),
(35, 'f563de68-1746-11f1-8ccc-10653022c2a0', 1, 154, 'T-2024-003', 23, 'Mathematics', '2021-09-01', NULL, 'BSc Mathematics', NULL, '2026-03-03 21:21:31', '2026-03-10 05:31:06'),
(36, 'f563e2b7-1746-11f1-8ccc-10653022c2a0', 1, 155, 'T-2024-004', 23, 'Physics', '2018-09-01', NULL, 'MSc Physics', NULL, '2026-03-03 21:21:31', '2026-03-10 05:31:18'),
(37, 'f563e6cd-1746-11f1-8ccc-10653022c2a0', 1, 156, 'T-2024-005', 23, 'Chemistry', '2020-09-01', NULL, 'BSc Chemistry', NULL, '2026-03-03 21:21:31', '2026-03-10 05:31:29'),
(38, 'f563ea9d-1746-11f1-8ccc-10653022c2a0', 1, 157, 'T-2024-006', 22, 'History', '2022-09-01', NULL, 'BA History', NULL, '2026-03-03 21:21:31', '2026-03-10 05:31:37'),
(39, 'f563ee21-1746-11f1-8ccc-10653022c2a0', 1, 158, 'T-2024-007', 22, 'Literature', '2021-09-01', NULL, 'BA Literature', NULL, '2026-03-03 21:21:31', '2026-03-10 05:32:06'),
(40, 'f5647f97-1746-11f1-8ccc-10653022c2a0', 1, 159, 'T-2024-008', 23, 'Economics', '2019-09-01', NULL, 'BSc Economics', NULL, '2026-03-03 21:21:31', '2026-03-10 06:12:46'),
(41, 'f56483c9-1746-11f1-8ccc-10653022c2a0', 2, 160, 'T-2024-009', 23, 'ICT', '2020-09-01', NULL, 'MSc Computer Science', NULL, '2026-03-03 21:21:31', '2026-03-10 05:32:34'),
(42, 'f564869e-1746-11f1-8ccc-10653022c2a0', 2, 161, 'T-2024-010', 23, 'Geography', '2021-09-01', NULL, 'BA Geography', NULL, '2026-03-03 21:21:31', '2026-03-10 05:32:27'),
(43, '902a9cf1-6814-4638-85ec-5d0e1db94f80', 1, 232, 'ASHS-T-2026-0001', 26, 'SCI', '2026-03-10', '2026-03-10', 'dssd', 2, '2026-03-10 07:20:32', '2026-03-10 07:22:25'),
(45, '4608e6f4-f005-4b97-be73-c9e1919620f5', 1, 234, 'TCH-2026-0001', NULL, 'Biology', '2026-01-15', NULL, 'M.Sc.', 5, '2026-03-10 07:43:04', '2026-03-10 07:43:04'),
(46, '4c923404-57cf-4888-8e35-1ff070f7b13d', 1, 235, 'TCH-2026-0002', NULL, 'Biology', '2026-01-15', NULL, 'M.Sc.', 5, '2026-03-10 07:43:04', '2026-03-10 07:43:04'),
(47, '77dbb56e-8697-4004-9526-0a328fe38b15', 1, 236, 'TCH-2026-0003', NULL, 'Biology', '2026-01-15', NULL, 'M.Sc.', 5, '2026-03-10 07:43:04', '2026-03-10 07:43:04'),
(48, '048a2705-3142-478f-8c24-0f2d5d8485c4', 1, 237, 'TCH-2026-0004', NULL, 'Biology', '2026-01-15', NULL, 'M.Sc.', 5, '2026-03-10 07:43:04', '2026-03-10 07:43:04'),
(49, '01b62b4f-aace-40ab-963d-a9894443525f', 1, 238, 'TCH-2026-0005', NULL, 'Biology', '2026-01-15', NULL, 'M.Sc.', 5, '2026-03-10 07:43:05', '2026-03-10 07:43:05'),
(50, '2d0dd916-7f82-4620-ba1f-c2b2791517c7', 1, 239, 'TCH-2026-0006', NULL, 'Biology', '2026-01-15', NULL, 'M.Sc.', 5, '2026-03-10 07:43:05', '2026-03-10 07:43:05'),
(51, 'e488575b-39b4-4cca-9c0f-04a4c7fe03b8', 1, 240, 'TCH-2026-0007', NULL, 'Biology', '2026-01-15', NULL, 'M.Sc.', 5, '2026-03-10 07:43:05', '2026-03-10 07:43:05'),
(52, '7a382a0a-2525-49c4-822e-60b9addecae7', 1, 241, 'TCH-2026-0008', NULL, 'Biology', '2026-01-15', NULL, 'M.Sc.', 5, '2026-03-10 07:43:05', '2026-03-10 07:43:05'),
(53, '3483ef55-9190-47ea-8424-ae90b327a6dc', 1, 242, 'TCH-2026-0009', NULL, 'Biology', '2026-01-15', NULL, 'M.Sc.', 5, '2026-03-10 07:43:05', '2026-03-10 07:43:05'),
(54, '0778918c-3865-4a52-b1ab-9b8aebdf9ff4', 1, 243, 'TCH-2026-0010', NULL, 'Biology', '2026-01-15', NULL, 'M.Sc.', 5, '2026-03-10 07:43:05', '2026-03-10 07:43:05'),
(55, '3f20192d-4f11-4a58-a27b-e2ec7b5d7429', 1, 244, 'TCH-2026-0011', NULL, 'Biology', '2026-01-15', NULL, 'M.Sc.', 5, '2026-03-10 07:43:05', '2026-03-10 07:43:05'),
(56, '3f87a544-81a7-4a85-9fc2-097935363d89', 1, 245, 'TCH-2026-0012', NULL, 'Biology', '2026-01-15', NULL, 'M.Sc.', 5, '2026-03-10 07:43:05', '2026-03-10 07:43:05'),
(57, '84886a3b-1d09-4526-ae6f-6db76d36ad3a', 1, 246, 'TCH-2026-0013', NULL, 'Biology', '2026-01-15', NULL, 'M.Sc.', 5, '2026-03-10 07:43:05', '2026-03-10 07:43:05'),
(58, '4a61a30f-259f-4dd1-b3fe-1129f679d852', 1, 247, 'TCH-2026-0014', NULL, 'Biology', '2026-01-15', '2026-03-10', 'M.Sc.', 5, '2026-03-10 07:43:06', '2026-03-10 08:09:14'),
(59, '04796520-f31e-4c77-8d42-4349d35def9a', 1, 248, 'TCH-2026-0015', NULL, 'Biology', '2026-01-15', '2026-03-10', 'M.Sc.', 5, '2026-03-10 07:43:06', '2026-03-10 08:09:14'),
(60, '6bfc1390-7e3e-4522-aeef-0693b8dacb7c', 1, 249, 'TCH-2026-0016', NULL, 'Biology', '2026-01-16', '2026-03-10', 'M.Sc.', 5, '2026-03-10 07:43:06', '2026-03-10 08:09:14'),
(61, '1cf9c9a3-03b0-41b6-9505-ede01e17e1dd', 1, 250, 'yyy', NULL, NULL, '2026-03-10', NULL, NULL, NULL, '2026-03-10 07:43:06', '2026-03-10 07:44:19'),
(62, '99ba8fb9-c414-4252-982e-c59dcab4be4a', 1, 251, 'TCH-2026-0019', NULL, 'Biology', '2026-01-19', NULL, 'M.Sc.', 5, '2026-03-10 07:43:06', '2026-03-10 07:43:06'),
(63, '3117b998-b4d0-4950-b972-6cd5982a27a5', 1, 252, 'TCH-2026-0020', NULL, 'Biology', '2026-01-15', NULL, 'M.Sc.', 5, '2026-03-10 07:43:06', '2026-03-10 07:43:06');

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
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `teacher_subjects`
--

INSERT INTO `teacher_subjects` (`teacher_subject_id`, `teacher_id`, `subject_id`, `assigned_date`, `created_at`) VALUES
(3, 33, 83, '2026-03-10', '2026-03-10 09:15:59'),
(4, 33, 75, '2026-03-10', '2026-03-10 09:20:27'),
(5, 58, 87, '2026-03-10', '2026-03-10 11:21:55'),
(6, 58, 77, '2026-03-10', '2026-03-10 13:55:43');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--
-- Creation: Mar 10, 2026 at 09:59 PM
-- Last update: Mar 10, 2026 at 09:59 PM
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
) ENGINE=InnoDB AUTO_INCREMENT=253 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`user_id`, `uuid`, `institution_id`, `username`, `email`, `password_hash`, `first_name`, `last_name`, `phone_number`, `address`, `city`, `region`, `date_of_birth`, `title`, `gender`, `is_super_admin`, `is_active`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, '1bfe8992-16ae-11f1-9c28-10653022c2a0', NULL, 'superadmin', 'benedictamankwa18@gmail.com', '$2y$10$CAU/aeWxSNiY8Af7vaQn0.dy2ibLA/zvSLxGoBaT5pWN0kzLdl36O', 'Platform', 'Super Administrator', '+233 30 000 0000', NULL, NULL, NULL, NULL, NULL, NULL, 1, 1, '2025-12-04 21:21:31', '2026-03-09 09:08:07', NULL),
(8, 'def42c78-1743-11f1-8ccc-10653022c2a0', NULL, 'superadmin', 'superadmin@ghslms.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Platform', 'Super Administrator', '+233 30 000 0000', NULL, NULL, NULL, NULL, NULL, NULL, 1, 1, '2025-12-04 21:21:31', '2026-03-08 09:07:21', NULL),
(54, '55d2f602-1744-11f1-8ccc-10653022c2a0', NULL, 'superadmin', 'superadmin@ghslms.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Platform', 'Super Administrator', '+233 30 000 0000', NULL, NULL, NULL, NULL, NULL, NULL, 1, 1, '2025-12-04 21:21:31', '2026-03-08 09:07:21', NULL),
(100, '627dbb2e-1744-11f1-8ccc-10653022c2a0', NULL, 'superadmin', 'superadmin@ghslms.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Platform', 'Super Administrator', '+233 30 000 0000', NULL, NULL, NULL, NULL, NULL, NULL, 1, 1, '2025-12-04 21:21:31', '2026-03-08 09:07:21', NULL),
(146, 'f53e889e-1746-11f1-8ccc-10653022c2a0', NULL, 'superadmin', 'superadmin@ghslms.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Platform', 'Super Administrator', '+233 30 000 0000', NULL, NULL, NULL, NULL, NULL, NULL, 1, 1, '2026-03-01 21:21:31', '2026-03-08 09:27:46', NULL),
(147, 'f55bd9f1-1746-11f1-8ccc-10653022c2a0', 1, 'admin', 'admin@accrashs.edu.gh', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Justice', 'Mensah', '+233 30 111 1001', NULL, NULL, NULL, NULL, NULL, NULL, 0, 1, '2025-12-04 21:21:31', '2026-03-08 09:07:21', NULL),
(148, 'f55bed57-1746-11f1-8ccc-10653022c2a0', 2, 'admin2', 'admin@kumashs.edu.gh', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Akosua', 'Agyemang', '+233 32 111 2001', NULL, NULL, NULL, NULL, NULL, NULL, 0, 1, '2025-12-04 21:21:31', '2026-03-08 09:07:21', NULL),
(149, 'f55bf3bc-1746-11f1-8ccc-10653022c2a0', 3, 'admin3', 'admin@ccashs.edu.gh', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Kwesi', 'Atta', '+233 33 111 3001', NULL, NULL, NULL, NULL, NULL, NULL, 0, 1, '2025-12-04 21:21:31', '2026-03-08 09:07:21', NULL),
(150, 'f55bf8f7-1746-11f1-8ccc-10653022c2a0', 4, 'admin4', 'admin@tamashs.edu.gh', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Alhassan', 'Mohammed', '+233 37 111 4001', NULL, NULL, NULL, NULL, NULL, NULL, 0, 1, '2025-12-04 21:21:31', '2026-03-08 09:07:21', NULL),
(151, 'f55c96d5-1746-11f1-8ccc-10653022c2a0', 5, 'admin5', 'admin@hoshs.edu.gh', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Elikem', 'Agbeko', '+233 36 111 5001', NULL, NULL, NULL, NULL, NULL, NULL, 0, 1, '2025-12-04 21:21:31', '2026-03-08 09:07:21', NULL),
(152, 'f56106d8-1746-11f1-8ccc-10653022c2a0', 1, 'kofi.mensah', 'kofi.mensah@accrashs.edu.gh', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Kofi', 'Mensah', '+233 24 111 1111', 'South campus', NULL, NULL, NULL, NULL, NULL, 0, 1, '2025-12-04 21:21:31', '2026-03-10 08:55:27', NULL),
(153, 'f5617797-1746-11f1-8ccc-10653022c2a0', 1, 'ama.asante', 'ama.asante@accrashs.edu.gh', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Ama', 'Asante', '+233 24 111 1112', NULL, NULL, NULL, NULL, NULL, NULL, 0, 1, '2025-02-04 21:21:31', '2026-03-08 09:28:10', NULL),
(154, 'f5617b21-1746-11f1-8ccc-10653022c2a0', 1, 'kwabena.owusu', 'kwabena.owusu@accrashs.edu.gh', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Kwabena', 'Owusu', '+233 24 111 1113', NULL, NULL, NULL, NULL, NULL, NULL, 0, 1, '2025-12-04 21:21:31', '2026-03-08 09:07:21', NULL),
(155, 'f5617dc9-1746-11f1-8ccc-10653022c2a0', 1, 'abena.boateng', 'abena.boateng@accrashs.edu.gh', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Abena', 'Boateng', '+233 24 111 1114', NULL, NULL, NULL, NULL, NULL, NULL, 0, 1, '2025-12-04 21:21:31', '2026-03-08 09:07:21', NULL),
(156, 'f561800e-1746-11f1-8ccc-10653022c2a0', 1, 'yaw.frimpong', 'yaw.frimpong@accrashs.edu.gh', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Yaw', 'Frimpong', '+233 24 111 1115', NULL, NULL, NULL, NULL, NULL, NULL, 0, 1, '2025-12-04 21:21:31', '2026-03-08 09:07:21', NULL),
(157, 'f5618275-1746-11f1-8ccc-10653022c2a0', 1, 'akosua.darko', 'akosua.darko@accrashs.edu.gh', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Akosua', 'Darko', '+233 24 111 1116', NULL, NULL, NULL, NULL, NULL, NULL, 0, 1, '2025-12-04 21:21:31', '2026-03-08 09:07:21', NULL),
(158, 'f5618577-1746-11f1-8ccc-10653022c2a0', 1, 'kwame.appiah', 'kwame.appiah@accrashs.edu.gh', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Kwame', 'Appiah', '+233 24 111 1117', NULL, NULL, NULL, NULL, NULL, NULL, 0, 1, '2025-12-04 21:21:31', '2026-03-08 09:07:21', NULL),
(159, 'f56188e6-1746-11f1-8ccc-10653022c2a0', 1, 'efua.amoah', 'efua.amoah@accrashs.edu.gh', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Efua', 'Amoah', '+233 24 111 1118', NULL, NULL, NULL, NULL, NULL, NULL, 0, 1, '2025-12-04 21:21:31', '2026-03-08 09:07:21', NULL),
(160, 'f5618bfa-1746-11f1-8ccc-10653022c2a0', 2, 'kwasi.boadu', 'kwasi.boadu@kumashs.edu.gh', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Kwasi', 'Boadu', '+233 24 112 1111', NULL, NULL, NULL, NULL, NULL, NULL, 0, 1, '2026-01-05 21:21:31', '2026-03-08 09:28:30', NULL),
(161, 'f5618fc7-1746-11f1-8ccc-10653022c2a0', 2, 'adwoa.sarpong', 'adwoa.sarpong@kumashs.edu.gh', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Adwoa', 'Sarpong', '+233 24 112 1112', NULL, NULL, NULL, NULL, NULL, NULL, 0, 1, '2025-12-04 21:21:31', '2026-03-08 09:07:21', NULL),
(162, 'f56feb3f-1746-11f1-8ccc-10653022c2a0', 1, 'kwame.osei', 'kwame.osei@student.accrashs.edu.gh', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Kwame', 'Osei', '+233 55 111 2001', 'Tema', NULL, NULL, '2014-11-01', NULL, NULL, 0, 1, '2025-12-04 21:21:31', '2026-03-09 22:08:00', NULL),
(163, 'f570186d-1746-11f1-8ccc-10653022c2a0', 1, 'abena.adjei', 'abena.adjei@student.accrashs.edu.gh', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Abena', 'Adjei', '+233 55 111 2002', NULL, NULL, NULL, NULL, NULL, NULL, 0, 1, '2025-12-04 21:21:31', '2026-03-09 22:08:00', NULL),
(164, 'f5701c21-1746-11f1-8ccc-10653022c2a0', 1, 'kofi.addo', 'kofi.addo@student.accrashs.edu.gh', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Kofi', 'Addo', '+233 55 111 2003', NULL, NULL, NULL, NULL, NULL, NULL, 0, 1, '2026-03-01 21:21:31', '2026-03-09 22:08:01', NULL),
(165, 'f5701efa-1746-11f1-8ccc-10653022c2a0', 1, 'ama.boakye', 'ama.boakye@student.accrashs.edu.gh', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Ama', 'Boakye', '+233 55 111 2004', NULL, NULL, NULL, NULL, NULL, NULL, 0, 1, '2025-12-04 21:21:31', '2026-03-09 22:08:01', NULL),
(166, 'f570218e-1746-11f1-8ccc-10653022c2a0', 1, 'kwabena.nyarko', 'kwabena.nyarko@student.accrashs.edu.gh', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Kwabena', 'Nyarko', '+233 55 111 2005', NULL, NULL, NULL, NULL, NULL, NULL, 0, 1, '2025-12-04 21:21:31', '2026-03-09 22:08:01', NULL),
(167, 'f5702415-1746-11f1-8ccc-10653022c2a0', 1, 'akosua.mensah', 'akosua.mensah@student.accrashs.edu.gh', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Akosua', 'Mensah', '+233 55 111 2006', NULL, NULL, NULL, NULL, NULL, NULL, 0, 1, '2025-12-04 21:21:31', '2026-03-09 22:08:01', NULL),
(168, 'f57025ee-1746-11f1-8ccc-10653022c2a0', 1, 'yaw.owusu', 'yaw.owusu@student.accrashs.edu.gh', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Yaw', 'Owusu', '+233 55 111 2007', NULL, NULL, NULL, NULL, NULL, NULL, 0, 1, '2025-12-04 21:21:31', '2026-03-09 22:08:01', NULL),
(169, 'f57027a8-1746-11f1-8ccc-10653022c2a0', 1, 'efua.asare', 'efua.asare@student.accrashs.edu.gh', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Efua', 'Asare', '+233 55 111 2008', NULL, NULL, NULL, NULL, NULL, NULL, 0, 1, '2025-12-04 21:21:31', '2026-03-09 22:08:01', NULL),
(170, 'f5702949-1746-11f1-8ccc-10653022c2a0', 1, 'kwesi.boateng', 'kwesi.boateng@student.accrashs.edu.gh', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Kwesi', 'Boateng', '+233 55 111 2009', NULL, NULL, NULL, NULL, NULL, NULL, 0, 1, '2025-12-04 21:21:31', '2026-03-09 22:08:01', NULL),
(171, 'f5702bcd-1746-11f1-8ccc-10653022c2a0', 1, 'adwoa.ofori', 'adwoa.ofori@student.accrashs.edu.gh', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Adwoa', 'Ofori', '+233 55 111 2010', NULL, NULL, NULL, NULL, NULL, NULL, 0, 1, '2025-12-04 21:21:31', '2026-03-09 22:08:01', NULL),
(172, 'f5702e1f-1746-11f1-8ccc-10653022c2a0', 1, 'kojo.agyemang', 'kojo.agyemang@student.accrashs.edu.gh', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Kojo', 'Agyemang', '+233 55 111 2011', NULL, NULL, NULL, NULL, NULL, NULL, 0, 1, '2025-12-04 21:21:31', '2026-03-09 22:08:01', NULL),
(173, 'f570303a-1746-11f1-8ccc-10653022c2a0', 1, 'afua.darko', 'afua.darko@student.accrashs.edu.gh', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Afua', 'Darko', '+233 55 111 2012', NULL, NULL, NULL, NULL, NULL, NULL, 0, 1, '2025-12-04 21:21:31', '2026-03-09 22:08:01', NULL),
(174, 'f5703293-1746-11f1-8ccc-10653022c2a0', 1, 'kwame.frimpong', 'kwame.frimpong@student.accrashs.edu.gh', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Kwame', 'Frimpong', '+233 55 111 2013', NULL, NULL, NULL, NULL, NULL, NULL, 0, 1, '2025-12-04 21:21:31', '2026-03-09 22:08:01', NULL),
(175, 'f5703513-1746-11f1-8ccc-10653022c2a0', 1, 'abena.appiah', 'abena.appiah@student.accrashs.edu.gh', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Abena', 'Appiah', '+233 55 111 2014', NULL, NULL, NULL, NULL, NULL, NULL, 0, 1, '2025-12-04 21:21:31', '2026-03-09 22:08:01', NULL),
(176, 'f570370e-1746-11f1-8ccc-10653022c2a0', 1, 'kofi.amoah', 'kofi.amoah@student.accrashs.edu.gh', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Kofi', 'Amoah', '+233 55 111 2015', NULL, NULL, NULL, NULL, NULL, NULL, 0, 1, '2025-12-04 21:21:31', '2026-03-09 22:08:01', NULL),
(177, 'f570397e-1746-11f1-8ccc-10653022c2a0', 1, 'ama.sarpong', 'ama.sarpong@student.accrashs.edu.gh', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Ama', 'Sarpong', '+233 55 111 2016', NULL, NULL, NULL, NULL, NULL, NULL, 0, 1, '2025-12-04 21:21:31', '2026-03-09 22:08:02', NULL),
(178, 'f5703c1a-1746-11f1-8ccc-10653022c2a0', 1, 'yaw.boadu', 'yaw.boadu@student.accrashs.edu.gh', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Yaw', 'Boadu', '+233 55 111 2017', NULL, NULL, NULL, NULL, NULL, NULL, 0, 1, '2025-12-04 21:21:31', '2026-03-09 22:08:02', NULL),
(179, 'f57460aa-1746-11f1-8ccc-10653022c2a0', 1, 'akosua.atta', 'akosua.atta@student.accrashs.edu.gh', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Akosua', 'Atta', '+233 55 111 2018', NULL, NULL, NULL, NULL, NULL, NULL, 0, 1, '2025-12-04 21:21:31', '2026-03-09 22:08:18', NULL),
(180, 'f57472dd-1746-11f1-8ccc-10653022c2a0', 2, 'kwasi.mohammed', 'kwasi.mohammed@student.kumashs.edu.gh', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Kwasi', 'Mohammed', '+233 55 112 2001', NULL, NULL, NULL, NULL, NULL, NULL, 0, 1, '2025-12-04 21:21:31', '2026-03-08 09:07:21', NULL),
(181, 'f5756c83-1746-11f1-8ccc-10653022c2a0', 2, 'afua.agbeko', 'afua.agbeko@student.kumashs.edu.gh', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Afua', 'Agbeko', '+233 55 112 2002', NULL, NULL, NULL, NULL, NULL, NULL, 0, 1, '2025-12-04 21:21:31', '2026-03-08 09:07:21', NULL),
(182, 'f5893d8e-1746-11f1-8ccc-10653022c2a0', 1, 'yaw.osei', 'yaw.osei@parent.accrashs.edu.gh', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Yaw', 'Osei', '+233 24 555 5555', NULL, NULL, NULL, NULL, NULL, NULL, 0, 1, '2025-12-04 21:21:31', '2026-03-08 09:07:21', NULL),
(183, 'f5895666-1746-11f1-8ccc-10653022c2a0', 1, 'akua.adjei', 'akua.adjei@parent.accrashs.edu.gh', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Akua', 'Adjei', '+233 24 555 5556', NULL, NULL, NULL, NULL, NULL, NULL, 0, 1, '2025-12-04 21:21:31', '2026-03-08 09:07:21', NULL),
(184, 'f5895a04-1746-11f1-8ccc-10653022c2a0', 1, 'emmanuel.addo', 'emmanuel.addo@parent.accrashs.edu.gh', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Emmanuel', 'Addo', '+233 24 555 5557', NULL, NULL, NULL, NULL, NULL, NULL, 0, 1, '2025-12-04 21:21:31', '2026-03-08 09:07:21', NULL),
(185, 'f5895ca7-1746-11f1-8ccc-10653022c2a0', 1, 'patience.boakye', 'patience.boakye@parent.accrashs.edu.gh', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Patience', 'Boakye', '+233 24 555 5558', NULL, NULL, NULL, NULL, NULL, NULL, 0, 1, '2025-12-04 21:21:31', '2026-03-08 09:07:21', NULL),
(186, 'f5896754-1746-11f1-8ccc-10653022c2a0', 1, 'samuel.nyarko', 'samuel.nyarko@parent.accrashs.edu.gh', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Samuel', 'Nyarko', '+233 24 555 5559', NULL, NULL, NULL, NULL, NULL, NULL, 0, 1, '2025-12-04 21:21:31', '2026-03-08 09:07:21', NULL),
(187, 'f5896b77-1746-11f1-8ccc-10653022c2a0', 1, 'grace.mensah', 'grace.mensah@parent.accrashs.edu.gh', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Grace', 'Mensah', '+233 24 555 5560', NULL, NULL, NULL, NULL, NULL, NULL, 0, 1, '2025-12-04 21:21:31', '2026-03-08 09:07:21', NULL),
(188, 'f5896f23-1746-11f1-8ccc-10653022c2a0', 1, 'peter.owusu', 'peter.owusu@parent.accrashs.edu.gh', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Peter', 'Owusu', '+233 24 555 5561', NULL, NULL, NULL, NULL, NULL, NULL, 0, 1, '2025-12-04 21:21:31', '2026-03-08 09:07:21', NULL),
(189, 'f58972c5-1746-11f1-8ccc-10653022c2a0', 1, 'mary.asare', 'mary.asare@parent.accrashs.edu.gh', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Mary', 'Asare', '+233 24 555 5562', NULL, NULL, NULL, NULL, NULL, NULL, 0, 1, '2025-12-04 21:21:31', '2026-03-08 09:07:21', NULL),
(190, 'f589767e-1746-11f1-8ccc-10653022c2a0', 3, 'joseph.boateng', 'joseph.boateng@parent.accrashs.edu.gh', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Joseph', 'Boateng', '+233 24 555 5563', NULL, NULL, NULL, NULL, NULL, NULL, 0, 1, '2025-12-04 21:21:31', '2026-03-09 08:04:10', NULL),
(191, 'f5897ade-1746-11f1-8ccc-10653022c2a0', 1, 'elizabeth.ofori', 'elizabeth.ofori@parent.accrashs.edu.gh', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Elizabeth', 'Ofori', '+233 24 555 5564', NULL, NULL, NULL, NULL, NULL, NULL, 0, 1, '2025-12-04 21:21:31', '2026-03-08 09:07:21', NULL),
(192, '16915edc-c68d-4ca7-a03c-74489c190c1d', 1, 'superadmin', 'benedictamankwa18@gmail.com', '$2y$10$TLvTH/nLKUlruSjJj4crlujCopGiw9Faa5nBQXxNPlmSJVp8H7R/O', 'University', 'Education, Winneba (Winneba) BENEDICT OSEI AMANKWA', '0594500785', NULL, NULL, NULL, NULL, NULL, NULL, 0, 1, '2026-03-09 21:51:27', '2026-03-09 22:08:00', NULL),
(194, 'd6defd6d-3dff-4ca4-b2f6-5a5285bc5bb5', 1, '212ewewewe', 'benedictamankwa9@gmail.com', '$2y$10$fEMvz0.EDCQeWBWtmAsyDumZ/e.KXqquI2vfD2Jtv0G7ULYyDl1bC', 'BENEDICT OSEI', 'AMANKWA', '0550030318', NULL, NULL, NULL, NULL, NULL, NULL, 0, 1, '2026-03-09 22:06:52', '2026-03-09 22:06:52', NULL),
(195, 'a4c27bd6-7fde-4f8e-b861-9bade903b61b', 1, 'superadmin12221', 'nethunterghana@gmail.com', '$2y$10$.IUP.C1JWVHW.YUvOzsXBO0FCJ1bk7lR67h9G8skC5TYwrXDoTl36', 'n3thun3r', 'n3thun3r', '0594500785', NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, '2026-03-09 22:07:30', '2026-03-09 22:40:04', NULL),
(196, '115214ed-4a7a-44bd-851c-d041a986447d', 1, 'kwame.mensah', 'kwame.mensah@school.edu.gh', '$2y$10$XNY7QoGr3E1q9hoCTyQ.HumsvOEdAXQnjWQNDn7Y8SkIshzKK3ljq', 'Kwame', 'Mensah', '0244123456', NULL, NULL, NULL, '2008-05-15', NULL, NULL, 0, 1, '2026-03-09 22:41:47', '2026-03-09 22:41:47', NULL),
(197, '5ac918f2-b23c-48fb-8dee-55d0ad3b7f6b', 1, 'kwame1.mensah', 'kwame1.mensah@school.edu.gh', '$2y$10$oUPIKvOp3MX9NAgpGVZTu.DQXvCEzCr3mhQPOh6YSsiY13HKnuHOO', 'Kwame1', 'Mensah', '244123456', NULL, NULL, NULL, '0000-00-00', NULL, NULL, 0, 1, '2026-03-09 22:50:29', '2026-03-09 22:50:29', NULL),
(198, '415d4a86-3be1-42f0-afe3-76c804dda18b', 1, 'kwame2.mensah', 'kwame2.mensah@school.edu.gh', '$2y$10$8IceZCT142Uy9QyxVn3eqONV/SAsCPDBG5Z8JfFw4nacN5EvspTym', 'Kwame2', 'Mensah', '244123456', NULL, NULL, NULL, '0000-00-00', NULL, NULL, 0, 1, '2026-03-09 22:50:29', '2026-03-09 22:50:29', NULL),
(199, '71fa67c3-1431-4d87-914d-e5b9a1b56cb4', 1, 'kwame3.mensah', 'kwame3.mensah@school.edu.gh', '$2y$10$1enyc8cxm6tf7gR8ehANBupL2UlgVuQbUtlSQ8JbvVq0g69p7S/U.', 'Kwame3', 'Mensah', '244123456', NULL, NULL, NULL, '0000-00-00', NULL, NULL, 0, 1, '2026-03-09 22:50:29', '2026-03-09 22:50:29', NULL),
(200, 'ea6ffa7b-4200-4c32-87c8-23cbbdf561be', 1, 'kwame4.mensah', 'kwame4.mensah@school.edu.gh', '$2y$10$iV0sH6.Xsn8xz0MZO/T2qu0cbYvzieUYfLCa.VYIGlS6S3JHIOJC2', 'Kwame4', 'Mensah', '244123456', NULL, NULL, NULL, '0000-00-00', NULL, NULL, 0, 1, '2026-03-09 22:50:29', '2026-03-09 22:50:29', NULL),
(201, '8169e18b-1a79-4db3-bef5-80bb7a03df31', 1, 'kwame5.mensah', 'kwame5.mensah@school.edu.gh', '$2y$10$xEOMbqbQzBW2F4g3310h.e2Px/sfBvttfkMknnH7.zV1NFUF7dd26', 'Kwame5', 'Mensah', '244123456', NULL, NULL, NULL, '0000-00-00', NULL, NULL, 0, 1, '2026-03-09 22:50:30', '2026-03-09 22:50:30', NULL),
(202, 'af73dd18-c3a3-4851-b0f7-833168d9cafb', 1, 'kwame6.mensah', 'kwame6.mensah@school.edu.gh', '$2y$10$aZKCa/5qF7KevRsnutHmdugiDNa45Y4eT8ZfEV1d0FOo0e1go7QOq', 'Kwame6', 'Mensah', '244123456', NULL, NULL, NULL, '0000-00-00', NULL, NULL, 0, 1, '2026-03-09 22:50:30', '2026-03-09 22:50:30', NULL),
(203, '71d8450a-3936-41a2-aade-fe38926e21cb', 1, 'kwame7.mensah', 'kwame7.mensah@school.edu.gh', '$2y$10$q7WATFLofxlIgOQq89MNbeH0clRu.t84cBjibqNPQ9b5zhTLrmEfK', 'Kwame7', 'Mensah', '244123456', NULL, NULL, NULL, '0000-00-00', NULL, NULL, 0, 1, '2026-03-09 22:50:30', '2026-03-09 22:50:30', NULL),
(204, 'e9d6b06e-5bbc-45bc-9c94-2ea526ed67b3', 1, 'kwame8.mensah', 'kwame8.mensah@school.edu.gh', '$2y$10$FzoL8RvjtmXhDxDHiIO5buWxSMLZvVltc/SeVYnCq4JzX0hlzlWDm', 'Kwame8', 'Mensah', '244123456', NULL, NULL, NULL, '0000-00-00', NULL, NULL, 0, 1, '2026-03-09 22:50:30', '2026-03-09 22:50:30', NULL),
(205, 'c54ce17e-9938-4e1d-8259-68ad8170a92a', 1, 'kwame9.mensah', 'kwame9.mensah@school.edu.gh', '$2y$10$iEBwZ41p85X0zL7uhUL73Oi8J8wF7drY2nIPFUMhnBGpa5srXfk4m', 'Kwame9', 'Mensah', '244123456', NULL, NULL, NULL, '0000-00-00', NULL, NULL, 0, 1, '2026-03-09 22:50:31', '2026-03-09 22:50:31', NULL),
(206, '439031a0-5451-4c95-baf2-7ebb50a4cc43', 1, 'kwame10.mensah', 'kwame10.mensah@school.edu.gh', '$2y$10$pEoIXbnaXv/C6wAvJ2QsiupZKqXZzicVrq1y.HdaLmM1PIc3fL8vm', 'Kwame10', 'Mensah', '244123456', NULL, NULL, NULL, '0000-00-00', NULL, NULL, 0, 1, '2026-03-09 22:50:31', '2026-03-09 22:50:31', NULL),
(207, '62d61b27-e178-41c5-bdd2-59f9e3381f87', 1, 'kwame11.mensah', 'kwame11.mensah@school.edu.gh', '$2y$10$LEz/ZxEt.iR23zKhl6LW1.RRicFmEhlR3OHPhbI0lS7WF7R5Uh37i', 'Kwame11', 'Mensah', '244123456', NULL, NULL, NULL, '0000-00-00', NULL, NULL, 0, 1, '2026-03-09 22:50:31', '2026-03-09 22:50:31', NULL),
(208, 'b997d8fb-783e-4c4a-874a-3fff0c8c171c', 1, 'kwame12.mensah', 'kwame12.mensah@school.edu.gh', '$2y$10$dlcKSZoqSY79M8Ij/sHA.ObdBBDki2Cut7cyYTGwq7VOAspYm6tGm', 'Kwame12', 'Mensah', '244123456', NULL, NULL, NULL, '0000-00-00', NULL, NULL, 0, 1, '2026-03-09 22:50:31', '2026-03-09 22:50:31', NULL),
(209, '7aef785b-91c8-4fc8-a234-a675ae7da834', 1, 'kwame13.mensah', 'kwame13.mensah@school.edu.gh', '$2y$10$oMq9LVjpa0bHVdh.3Noyke/8lHHmgLvsbc5efEbDVUi.Ae6xXkTly', 'Kwame13', 'Mensah', '244123456', NULL, NULL, NULL, '0000-00-00', NULL, NULL, 0, 1, '2026-03-09 22:50:31', '2026-03-09 22:50:31', NULL),
(210, 'e39d9287-d378-42d2-a68d-f15d65adbfd8', 1, 'kwame14.mensah', 'kwame14.mensah@school.edu.gh', '$2y$10$s2oyo2AlD5pLke0xPJ5xoeqz9IE6e4qxqtVQZmG4DxewFQXcEX/WC', 'Kwame14', 'Mensah', '244123456', NULL, NULL, NULL, '0000-00-00', NULL, NULL, 0, 1, '2026-03-09 22:50:32', '2026-03-09 22:50:32', NULL),
(211, '37e99e79-4a92-470b-9a1a-4d0d5b09b8bf', 1, 'kwame15.mensah', 'kwame15.mensah@school.edu.gh', '$2y$10$9CON1XIuvT6.gay4tF8sHOOF8vOsX4iwSCjE0OpPMVvTGNus0BpIS', 'Kwame15', 'Mensah', '244123456', NULL, NULL, NULL, '0000-00-00', NULL, NULL, 0, 1, '2026-03-09 22:50:32', '2026-03-09 22:50:32', NULL),
(212, '42f13855-2589-41b1-8d9a-aeb26b49b6f8', 1, 'ama.owusu', 'ama.owusu@school.edu.gh', '$2y$10$cszqb7stUZ2Q5oUCD9YHmuJd6AZZbo7do9S3UamwjXZcHPPGPq44O', 'Ama', 'Owusu', '0244100001', NULL, NULL, NULL, '2008-03-12', NULL, NULL, 0, 1, '2026-03-09 23:17:53', '2026-03-09 23:17:53', NULL),
(213, '3dbce357-0e96-4db9-bccc-b4f288cab391', 1, 'kofi.asante', 'kofi.asante@school.edu.gh', '$2y$10$dN7oDoNuUqIUXMzaePb5V.l5y6Vajmeu8AmwEKNyYLV1Pe5j22bJy', 'Kofi', 'Asante', '0244100002', NULL, NULL, NULL, '2007-11-25', NULL, NULL, 0, 1, '2026-03-09 23:17:53', '2026-03-09 23:17:53', NULL),
(214, '421f1aae-55c6-4749-ac40-1daea189da75', 1, 'akosua.boateng', 'akosua.boateng@school.edu.gh', '$2y$10$Yl18N97DBiK1p3BY9SPfR.iDWVAakSnZ//vM.HrYw5uhHTfpUdcz2', 'Akosua', 'Boateng', '0244100003', NULL, NULL, NULL, '2008-06-08', NULL, NULL, 0, 1, '2026-03-09 23:17:53', '2026-03-09 23:17:53', NULL),
(215, '768418f2-32e8-4da9-aa06-a62530ddca2a', 1, 'yaw.darko', 'yaw.darko@school.edu.gh', '$2y$10$0yJcPQEriU89hfBDOaXed.VdfHNJmbowzbWIgx8EL3e7kZI/zC1gm', 'Yaw', 'Darko', '0244100004', NULL, NULL, NULL, '2007-09-14', NULL, NULL, 0, 1, '2026-03-09 23:17:54', '2026-03-09 23:17:54', NULL),
(216, 'e6ae46dc-cd07-490b-a72a-6fd3267aba25', 1, 'abena.frimpong', 'abena.frimpong@school.edu.gh', '$2y$10$M12rX8oCiWfyBcpi1XPS0ewBAYoFDdjd9LuduQsMPHmQU/NdaeesC', 'Abena', 'Frimpong', '0244100005', NULL, NULL, NULL, '2008-01-30', NULL, NULL, 0, 1, '2026-03-09 23:17:54', '2026-03-09 23:17:54', NULL),
(217, '394c8725-3b70-41df-afbc-0ed8ca0a25bc', 1, 'kweku.mensah', 'kweku.mensah@school.edu.gh', '$2y$10$BGEkZOoedrv7mL1wjhlWdeKX/tS/Gn3dBgL8OXWuDHN592vnls1OC', 'Kweku', 'Mensah', '0244100006', NULL, NULL, NULL, '2007-07-19', NULL, NULL, 0, 1, '2026-03-09 23:17:54', '2026-03-09 23:17:54', NULL),
(218, '23a5fdbf-175d-46bb-b6a1-9fefaaeeaf0c', 1, 'adwoa.amponsah', 'adwoa.amponsah@school.edu.gh', '$2y$10$9LMLIvvul9mEokpbKTbR0.qg8KCMODeVz6Px2CrH0v6IPRwpquAJm', 'Adwoa', 'Amponsah', '0244100007', NULL, NULL, NULL, '2008-04-22', NULL, NULL, 0, 1, '2026-03-09 23:17:54', '2026-03-09 23:17:54', NULL),
(219, '88348fcf-85d7-484f-8ba7-4bd8c2295c5f', 1, 'kwame.adjei', 'kwame.adjei@school.edu.gh', '$2y$10$/GHTA/rdpt5eUtl2GwLj.u8p13xJ2ReiMbffm4rY.K/O8ef4fvh1G', 'Kwame', 'Adjei', '0244100008', NULL, NULL, NULL, '2007-12-05', NULL, NULL, 0, 1, '2026-03-09 23:17:55', '2026-03-09 23:17:55', NULL),
(220, 'bfea707b-7827-4462-a206-a38ee179a916', 1, 'efua.nkrumah', 'efua.nkrumah@school.edu.gh', '$2y$10$RGgVJwrE0rMmPaAHUpnOPeWmCq5BzSWcnWaur3n4oy0dbpoUReHk.', 'Efua', 'Nkrumah', '0244100009', NULL, NULL, NULL, '2008-08-17', NULL, NULL, 0, 1, '2026-03-09 23:17:55', '2026-03-09 23:17:55', NULL),
(221, 'e3ea4532-77d4-4d94-8349-45883b4d2246', 1, 'kojo.ofori', 'kojo.ofori@school.edu.gh', '$2y$10$tdobNEDhjD72gR8h.ZsTkO.E6b.od/V8tsbByXRfQgytL4UkyzGJa', 'Kojo', 'Ofori', '0244100010', NULL, NULL, NULL, '2007-05-03', NULL, NULL, 0, 1, '2026-03-09 23:17:55', '2026-03-09 23:17:55', NULL),
(222, '4c3cf172-04ad-46b4-bb77-8da4a0f30128', 1, 'afia.asare', 'afia.asare@school.edu.gh', '$2y$10$PtdbRPljYvbklgznf16AEe3PRlT0Uym3UsWe9WRbh0qY/2LrUraIq', 'Afia', 'Asare', '0244110011', NULL, NULL, NULL, '2008-02-14', NULL, NULL, 0, 1, '2026-03-09 23:22:51', '2026-03-09 23:22:51', NULL),
(223, 'd8d142b6-87c3-4b3a-9f38-1ced2aa9aaed', 1, 'nana.boateng', 'nana.boateng@school.edu.gh', '$2y$10$EobKyzBWPiIdHSkCzBQ1ieflMpOsCfh7aKazgCqygeG2hCiqffJ2C', 'Nana', 'Boateng', '0244110012', NULL, NULL, NULL, '2007-10-09', NULL, NULL, 0, 1, '2026-03-09 23:22:51', '2026-03-09 23:22:51', NULL),
(224, '242166ba-7331-44fe-97d9-9400057e061c', 1, 'serwaa.osei', 'serwaa.osei@school.edu.gh', '$2y$10$YcCg865JXxz/j7VDp59E7.2HWod3jt2mSyu7CWaShh.lCXwATYZXu', 'Serwaa', 'Osei', '0244110013', NULL, NULL, NULL, '2008-07-21', NULL, NULL, 0, 1, '2026-03-09 23:22:52', '2026-03-09 23:22:52', NULL),
(225, 'c1370a61-5883-4628-9753-fb031f08bb86', 1, 'kwabena.agyei', 'kwabena.agyei@school.edu.gh', '$2y$10$ZLTz6499pDtYkqVS.kQwI.P/vaYMOxqNDHg1hcA9iDYf3lNrCFr2O', 'Kwabena', 'Agyei', '0244110014', NULL, NULL, NULL, '2007-04-16', NULL, NULL, 0, 1, '2026-03-09 23:22:52', '2026-03-09 23:22:52', NULL),
(226, '8faafb91-f57d-4321-8735-f415b36fcdd2', 1, 'maame.adusei', 'maame.adusei@school.edu.gh', '$2y$10$lzWy/QoxH1VvTlhnEYo/v.69kMtuDE402aPf.LbNwaS0c8SqX5/8S', 'Maame', 'Adusei', '0244110015', NULL, NULL, NULL, '2008-11-03', NULL, NULL, 0, 1, '2026-03-09 23:22:52', '2026-03-09 23:22:52', NULL),
(227, '93bb2943-8465-4d3f-9822-c1b9a8997804', 1, 'fiifi.quansah', 'fiifi.quansah@school.edu.gh', '$2y$10$FfuRafoZns3RkNIImWTGJeMKinlfoCALlxje9uJI8AqWQJdOSiiB6', 'Fiifi', 'Quansah', '0244110016', NULL, NULL, NULL, '2007-08-27', NULL, NULL, 0, 1, '2026-03-09 23:22:52', '2026-03-09 23:22:52', NULL),
(228, '258e1cd6-94cf-4140-ae41-adb6dfd7c5a6', 1, 'akua.tetteh', 'akua.tetteh@school.edu.gh', '$2y$10$S73Ds6/V5MLLfnCouXijcet0hzwiDCO5fHNcOlKognCMArto2iZWK', 'Akua', 'Tetteh', '0244110017', NULL, NULL, NULL, '2008-05-11', NULL, NULL, 0, 1, '2026-03-09 23:22:52', '2026-03-09 23:22:52', NULL),
(229, '8090fbf4-44d7-4a12-8e12-c9c56cb7368d', 1, 'kobbina.donkor', 'kobbina.donkor@school.edu.gh', '$2y$10$DutGPmoZoYZ9RZmBKfnme.fjghE1fFtuTlk3xGwYFGmxPBkGgcRlO', 'Kobbina', 'Donkor', '0244110018', NULL, NULL, NULL, '2007-01-30', NULL, NULL, 0, 1, '2026-03-09 23:22:53', '2026-03-09 23:22:53', NULL),
(230, '044f3dc5-e4ec-49f3-93b3-8a0fbe024ab0', 1, 'yaa.appiah', 'yaa.appiah@school.edu.gh', '$2y$10$e2V60Ic.IEIpW4wQVkUu3.mqmcHGv7GNUUjgXWvKUfKbzUyjKVC6e', 'Yaa', 'Appiah', '0244110019', NULL, NULL, NULL, '2008-09-06', NULL, NULL, 0, 1, '2026-03-09 23:22:53', '2026-03-09 23:22:53', NULL),
(231, 'ea5a396d-dd3e-4dcb-b5d1-7f8c72081128', 1, 'ekow.barimah', 'ekow.barimah@school.edu.gh', '$2y$10$riwM7fhATP9NiOaB.zEPKO/bjJYH2HAY/Ns28.aAHKK0OVEr.YLq2', 'Ekow', 'Barimah', '0244110020', NULL, NULL, NULL, '2007-06-22', NULL, NULL, 0, 1, '2026-03-09 23:22:53', '2026-03-09 23:22:53', NULL),
(232, '2273185d-931f-4d0f-be77-8c44bab3a708', 1, 'benedictosei.amankwa', 'benedictamankwa9@gmail.comee', '$2y$10$xMprgxYMflMGCaKqn2LPB.hlpWYPlzrR1GLeoALueeUEfh/6xBCRu', 'BENEDICT OSEI', 'AMANKWA', '+233550030318', 'Ashiaman', NULL, NULL, NULL, NULL, NULL, 0, 0, '2026-03-10 07:20:32', '2026-03-10 07:22:25', NULL),
(233, '96463c8d-7282-4b8b-ada3-bf6ef1a34055', 1, 'jane.smith', 'jane.smith@school.com', '$2y$10$fh7QCQ/CtbuTGkum2piOIePWRmTGgPcBwFNhD9rhOlTtvkOKxjEgK', 'Jane', 'Smith', '+1234567890', '123 Main St', NULL, NULL, NULL, NULL, NULL, 0, 1, '2026-03-10 07:24:42', '2026-03-10 07:24:42', NULL),
(234, '4f79c1d9-cf46-4b69-b4d1-3ceb6ae5596d', 1, 'jane.smith1', 'jane.smith@school.com1', '$2y$10$hJX6PJsr/yNz8Y9ku84JuuFBe1OYSPNmueII69Uw1MtzzL9iJKcXy', 'Jane', 'Smith', '1234567890', '123 Main St', NULL, NULL, NULL, NULL, NULL, 0, 1, '2026-03-10 07:43:04', '2026-03-10 07:43:04', NULL),
(235, '7b87aec0-ca89-4370-825f-f09b2c22585b', 1, 'jane.smith2', 'jane.smith@school.com2', '$2y$10$7ldQ8As3tRaAvu1Fiy0Lu.EqshYW0MvXP.kAGJSa7Ok/1SvjiMgli', 'Jane', 'Smith', '1234567890', '123 Main St', NULL, NULL, NULL, NULL, NULL, 0, 1, '2026-03-10 07:43:04', '2026-03-10 07:43:04', NULL),
(236, '22cdd3db-06c3-435b-ae49-f914b9bbd800', 1, 'jane.smith3', 'jane.smith@school.com3', '$2y$10$HWVmhXpDIiURUiQXnQY59O2hKUC46.tF1nhT.t7XN.rV/9b2E1Xkq', 'Jane', 'Smith', '1234567890', '123 Main St', NULL, NULL, NULL, NULL, NULL, 0, 1, '2026-03-10 07:43:04', '2026-03-10 07:43:04', NULL),
(237, '594d0aa3-9107-42eb-a661-54097e555ba5', 1, 'jane.smith4', 'jane.smith@school.com4', '$2y$10$wSieEdxUiolHCordc.hUv.RTnUlwjj0P0F/cc/2fCIfFufrBxJRuO', 'Jane', 'Smith', '1234567890', '123 Main St', NULL, NULL, NULL, NULL, NULL, 0, 1, '2026-03-10 07:43:04', '2026-03-10 07:43:04', NULL),
(238, '94c9e61a-ffef-4521-bff8-4265adbdff28', 1, 'jane.smith5', 'jane.smith@school.com5', '$2y$10$Tn29ngdM5qFGAWT6rjAzFuxU.83D.uhl9Ec74BKdw0X3q3bw4vUq2', 'Jane', 'Smith', '1234567890', '123 Main St', NULL, NULL, NULL, NULL, NULL, 0, 1, '2026-03-10 07:43:05', '2026-03-10 07:43:05', NULL),
(239, '07d4ad91-4e4c-45cb-9791-187d25aef72a', 1, 'jane.smith6', 'jane.smith@school.com6', '$2y$10$CYkBOQRNzmZO3ksoKgBhHu6byf1RnTUBs5aOQxgsvu5lBHku5Pe82', 'Jane', 'Smith', '1234567890', '123 Main St', NULL, NULL, NULL, NULL, NULL, 0, 1, '2026-03-10 07:43:05', '2026-03-10 07:43:05', NULL),
(240, 'ee67e847-1c26-4058-a31d-bebcfeff15d0', 1, 'jane.smith7', 'jane.smith@school.com7', '$2y$10$KbjO/CPC1kxAiaFNv7Pom.64pmu8rGOOacwx1L/Bw8u9H0vqhFXPq', 'Jane', 'Smith', '1234567890', '123 Main St', NULL, NULL, NULL, NULL, NULL, 0, 1, '2026-03-10 07:43:05', '2026-03-10 07:43:05', NULL),
(241, 'f5185132-deee-4443-b72b-b434fd1ebd97', 1, 'jane.smith8', 'jane.smith@school.com8', '$2y$10$xBjavyIjBNIJl0eZgIBRGOBYHDnPblk2VwNY6e8L65vV3ytIPL.wO', 'Jane', 'Smith', '1234567890', '123 Main St', NULL, NULL, NULL, NULL, NULL, 0, 1, '2026-03-10 07:43:05', '2026-03-10 07:43:05', NULL),
(242, '242c80a9-7be4-4c00-97e2-196f3ad81629', 1, 'jane.smith9', 'jane.smith@school.com9', '$2y$10$TnMuUb3qv4Aj8fcgTkTmzOt22RdPe2AyV4QEguwccrXVlDZAn.O8m', 'Jane', 'Smith', '1234567890', '123 Main St', NULL, NULL, NULL, NULL, NULL, 0, 1, '2026-03-10 07:43:05', '2026-03-10 07:43:05', NULL),
(243, 'c88f1603-f060-428b-8c2f-a42de5f5264d', 1, 'jane.smith10', 'jane.smith@school.com10', '$2y$10$uN5Oc843.XApC3xmeLCxROvC/hozwXf9rBR2McJwKSnQVIHoJfSli', 'Jane', 'Smith', '1234567890', '123 Main St', NULL, NULL, NULL, NULL, NULL, 0, 1, '2026-03-10 07:43:05', '2026-03-10 07:43:05', NULL),
(244, 'b88c3da7-f8eb-4007-b314-774020ec74fa', 1, 'jane.smith11', 'jane.smith@school.com11', '$2y$10$ujykPBnIDE6dFBGOtRPZT.fU57uXo6bFohFjnsdhu.o15/KMHpof.', 'Jane', 'Smith', '1234567890', '123 Main St', NULL, NULL, NULL, NULL, NULL, 0, 1, '2026-03-10 07:43:05', '2026-03-10 07:43:05', NULL),
(245, '315ee268-22e4-40d3-8694-13a23cddd50c', 1, 'jane.smith12', 'jane.smith@school.com12', '$2y$10$xBBnppQ8Q.b298XvovmN1.wR9g/MNHUPu2tq921rm3elsEGJRysNS', 'Jane', 'Smith', '1234567890', '123 Main St', NULL, NULL, NULL, NULL, NULL, 0, 1, '2026-03-10 07:43:05', '2026-03-10 07:43:05', NULL),
(246, 'd87d1ff1-0e61-4fd3-9274-14a5ea51b8bd', 1, 'jane.smith13', 'jane.smith@school.com13', '$2y$10$eYhC0zT9CcQoB9U3Iu.L7OV4qBPgA3nDj3X2d3mQWIDrA51auGcfW', 'Jane', 'Smith', '1234567890', '123 Main St', NULL, NULL, NULL, NULL, NULL, 0, 1, '2026-03-10 07:43:05', '2026-03-10 07:43:05', NULL),
(247, 'bef75289-0a8f-42b3-966b-f7880c1b5640', 1, 'jane.smith14', 'jane.smith@school.com14', '$2y$10$sN2um49PwxpLqPwLrMx.4eDAjLXHgxWP0rJCJ/trNsPrAisn6YRHe', 'Jane', 'Smith', '1234567890', '123 Main St', NULL, NULL, NULL, NULL, NULL, 0, 1, '2026-03-10 07:43:06', '2026-03-10 07:43:06', NULL),
(248, '60a1c60f-8ecb-4097-a425-2c404acef8aa', 1, 'jane.smith15', 'jane.smith@school.com15', '$2y$10$qqIEuNKdXBLKDm2dTkV6Ye/SO7JpcfBa60wkPJwGtPQJevNyszKBq', 'Jane', 'Smith', '1234567890', '123 Main St', NULL, NULL, NULL, NULL, NULL, 0, 1, '2026-03-10 07:43:06', '2026-03-10 07:43:06', NULL),
(249, '616e5c71-b6b4-4479-b614-51015ba823ec', 1, 'jane.smith16', 'jane.smith@school.com16', '$2y$10$TLbQ/JePNF0yNiZiGcDZG.U3r.XSEHBxX8KSbrPAjVvCJMhYuYJYO', 'Jane', 'Smith', '1234567890', '123 Main St', NULL, NULL, NULL, NULL, NULL, 0, 1, '2026-03-10 07:43:06', '2026-03-10 07:43:06', NULL),
(250, '21330c9d-10d9-426b-9eab-d62566b14979', 1, 'jane.smith18', 'jane.smith@school.com18', '$2y$10$pyeotKpujxaJSQ1FYs1rVen2cZpcVWap1oVmbqXhAwvQnprY1dVv2', 'Jane', 'Smith', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 1, '2026-03-10 07:43:06', '2026-03-10 07:43:06', NULL),
(251, 'ae1f52a5-71ed-4846-bf23-99219a03a027', 1, 'jane.smith19', 'jane.smith@school.com21', '$2y$10$8rFrr.g8rNmh/ZJw9tN6v./F1VPdW2jTCZYqy1tT2.4bSHsHoirIC', 'Jane', 'Smith', '1234567893', '126 Main St', NULL, NULL, NULL, NULL, NULL, 0, 1, '2026-03-10 07:43:06', '2026-03-10 07:43:06', NULL),
(252, 'a1d882e9-8d67-4437-b02b-612264e28a96', 1, 'jane.smith20', 'jane.smith@school.com23', '$2y$10$/uD/nIThhaUuBsFypXr8Yue3SpNQuwz5ckHLUGgJ.Hi.8tiEvtJKa', 'Jane', 'Smith', '1234567890', '123 Main St', NULL, NULL, NULL, NULL, NULL, 0, 1, '2026-03-10 07:43:06', '2026-03-10 07:43:06', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `user_activity`
--
-- Creation: Mar 03, 2026 at 08:58 PM
-- Last update: Mar 10, 2026 at 10:07 PM
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
) ENGINE=InnoDB AUTO_INCREMENT=4920 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `user_activity`
--

INSERT INTO `user_activity` (`activity_id`, `user_id`, `activity_type`, `activity_details`, `ip_address`, `user_agent`, `created_at`) VALUES
(696, 1, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-03 21:22:27'),
(697, 1, 'api_access', '{\"endpoint\":\"\\/api\\/academic-years\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:22:27'),
(698, 1, 'api_access', '{\"endpoint\":\"\\/api\\/academic-years\\/current\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:22:27'),
(699, 1, 'api_access', '{\"endpoint\":\"\\/api\\/announcements\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:22:27'),
(700, 1, 'api_access', '{\"endpoint\":\"\\/api\\/assessments?course_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:22:27'),
(701, 1, 'api_access', '{\"endpoint\":\"\\/api\\/assessment-categories\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:22:27'),
(702, 1, 'api_access', '{\"endpoint\":\"\\/api\\/auth\\/me\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:22:27'),
(703, 1, 'api_access', '{\"endpoint\":\"\\/api\\/classes\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:22:28'),
(704, 1, 'api_access', '{\"endpoint\":\"\\/api\\/class-subjects\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:22:28'),
(705, 1, 'api_access', '{\"endpoint\":\"\\/api\\/courses\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:22:28'),
(706, 1, 'api_access', '{\"endpoint\":\"\\/api\\/course-content\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:22:28'),
(707, 1, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:22:28'),
(708, 152, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-03 21:22:28'),
(709, 152, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/teacher\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:22:28'),
(710, 162, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-03 21:22:28'),
(711, 162, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/student\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:22:28'),
(712, 182, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-03 21:22:29'),
(713, 182, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/parent\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:22:29'),
(714, 1, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/superadmin\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:22:29'),
(715, 1, 'api_access', '{\"endpoint\":\"\\/api\\/error-logs\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:22:29'),
(716, 1, 'api_access', '{\"endpoint\":\"\\/api\\/error-logs\\/unresolved\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:22:29'),
(717, 1, 'api_access', '{\"endpoint\":\"\\/api\\/events\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:22:29'),
(718, 1, 'api_access', '{\"endpoint\":\"\\/api\\/events\\/upcoming\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:22:29'),
(719, 1, 'api_access', '{\"endpoint\":\"\\/api\\/events\\/calendar\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:22:29'),
(720, 1, 'api_access', '{\"endpoint\":\"\\/api\\/events\\/academic-calendar\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:22:29'),
(721, 1, 'api_access', '{\"endpoint\":\"\\/api\\/grade-levels\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:22:29'),
(722, 1, 'api_access', '{\"endpoint\":\"\\/api\\/grade-levels\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:22:29'),
(723, 1, 'api_access', '{\"endpoint\":\"\\/api\\/grade-reports\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:22:29'),
(724, 1, 'api_access', '{\"endpoint\":\"\\/api\\/grade-reports\\/stats\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:22:29'),
(725, 1, 'api_access', '{\"endpoint\":\"\\/api\\/grade-scales\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:22:29'),
(726, 1, 'api_access', '{\"endpoint\":\"\\/api\\/institutions\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:22:30'),
(727, 1, 'api_access', '{\"endpoint\":\"\\/api\\/login-activity\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:22:30'),
(728, 1, 'api_access', '{\"endpoint\":\"\\/api\\/login-activity\\/my-history\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:22:30'),
(729, 1, 'api_access', '{\"endpoint\":\"\\/api\\/login-activity\\/recent\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:22:30'),
(730, 1, 'api_access', '{\"endpoint\":\"\\/api\\/login-activity\\/failed\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:22:30'),
(731, 1, 'api_access', '{\"endpoint\":\"\\/api\\/messages\\/inbox\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:22:30'),
(732, 1, 'api_access', '{\"endpoint\":\"\\/api\\/messages\\/sent\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:22:30'),
(733, 1, 'api_access', '{\"endpoint\":\"\\/api\\/messages\\/unread-count\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:22:30'),
(734, 1, 'api_access', '{\"endpoint\":\"\\/api\\/notifications\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:22:30'),
(735, 1, 'api_access', '{\"endpoint\":\"\\/api\\/notifications\\/summary\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:22:30'),
(736, 1, 'api_access', '{\"endpoint\":\"\\/api\\/notifications\\/unread-count\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:22:30'),
(737, 1, 'api_access', '{\"endpoint\":\"\\/api\\/parents\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:22:30'),
(738, 1, 'api_access', '{\"endpoint\":\"\\/api\\/programs\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:22:30'),
(739, 1, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:22:30'),
(740, 1, 'api_access', '{\"endpoint\":\"\\/api\\/roles\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:22:30'),
(741, 1, 'api_access', '{\"endpoint\":\"\\/api\\/permissions\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:22:30'),
(742, 1, 'api_access', '{\"endpoint\":\"\\/api\\/semesters\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:22:31'),
(743, 1, 'api_access', '{\"endpoint\":\"\\/api\\/semesters\\/current\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:22:31'),
(744, 1, 'api_access', '{\"endpoint\":\"\\/api\\/students\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:22:31'),
(745, 1, 'api_access', '{\"endpoint\":\"\\/api\\/subjects\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:22:31'),
(746, 1, 'api_access', '{\"endpoint\":\"\\/api\\/subjects\\/core\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:22:31'),
(747, 1, 'api_access', '{\"endpoint\":\"\\/api\\/subscriptions\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:22:31'),
(748, 1, 'api_access', '{\"endpoint\":\"\\/api\\/subscriptions\\/stats\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:22:31'),
(749, 1, 'api_access', '{\"endpoint\":\"\\/api\\/system\\/settings\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:22:31'),
(750, 1, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:22:31'),
(751, 1, 'api_access', '{\"endpoint\":\"\\/api\\/user-activity\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:22:31'),
(752, 1, 'api_access', '{\"endpoint\":\"\\/api\\/user-activity\\/recent\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:22:31'),
(753, 1, 'api_access', '{\"endpoint\":\"\\/api\\/user-activity\\/stats\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:22:31'),
(754, 1, 'api_access', '{\"endpoint\":\"\\/api\\/user-activity\\/audit-trail\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:22:31'),
(755, 1, 'api_access', '{\"endpoint\":\"\\/api\\/users\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:22:31'),
(756, 1, 'api_access', '{\"endpoint\":\"\\/api\\/superadmin\\/users\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:22:31'),
(757, 1, 'api_access', '{\"endpoint\":\"\\/api\\/academic-years\",\"method\":\"POST\"}', '::1', NULL, '2026-03-03 21:22:31'),
(758, 1, 'api_access', '{\"endpoint\":\"\\/api\\/subjects\",\"method\":\"POST\"}', '::1', NULL, '2026-03-03 21:22:31'),
(759, 1, 'api_access', '{\"endpoint\":\"\\/api\\/grade-scales\",\"method\":\"POST\"}', '::1', NULL, '2026-03-03 21:22:31'),
(760, 1, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-03 21:25:45'),
(761, 1, 'api_access', '{\"endpoint\":\"\\/api\\/academic-years\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:25:45'),
(762, 1, 'api_access', '{\"endpoint\":\"\\/api\\/academic-years\\/current\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:25:45'),
(763, 1, 'api_access', '{\"endpoint\":\"\\/api\\/announcements\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:25:45'),
(764, 1, 'api_access', '{\"endpoint\":\"\\/api\\/assessments?course_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:25:45'),
(765, 1, 'api_access', '{\"endpoint\":\"\\/api\\/assessment-categories\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:25:45'),
(766, 1, 'api_access', '{\"endpoint\":\"\\/api\\/auth\\/me\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:25:45'),
(767, 1, 'api_access', '{\"endpoint\":\"\\/api\\/classes\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:25:45'),
(768, 1, 'api_access', '{\"endpoint\":\"\\/api\\/class-subjects\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:25:45'),
(769, 1, 'api_access', '{\"endpoint\":\"\\/api\\/courses\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:25:45'),
(770, 1, 'api_access', '{\"endpoint\":\"\\/api\\/course-content\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:25:45'),
(771, 1, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:25:45'),
(772, 152, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-03 21:25:45'),
(773, 152, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/teacher\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:25:46'),
(774, 162, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-03 21:25:46'),
(775, 162, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/student\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:25:46'),
(776, 182, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-03 21:25:46'),
(777, 182, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/parent\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:25:46'),
(778, 1, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/superadmin\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:25:46'),
(779, 1, 'api_access', '{\"endpoint\":\"\\/api\\/error-logs\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:25:46'),
(780, 1, 'api_access', '{\"endpoint\":\"\\/api\\/error-logs\\/unresolved\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:25:46'),
(781, 1, 'api_access', '{\"endpoint\":\"\\/api\\/events\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:25:46'),
(782, 1, 'api_access', '{\"endpoint\":\"\\/api\\/events\\/upcoming\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:25:46'),
(783, 1, 'api_access', '{\"endpoint\":\"\\/api\\/events\\/calendar\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:25:46'),
(784, 1, 'api_access', '{\"endpoint\":\"\\/api\\/events\\/academic-calendar\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:25:46'),
(785, 1, 'api_access', '{\"endpoint\":\"\\/api\\/grade-levels\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:25:46'),
(786, 1, 'api_access', '{\"endpoint\":\"\\/api\\/grade-levels\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:25:47'),
(787, 1, 'api_access', '{\"endpoint\":\"\\/api\\/grade-reports\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:25:47'),
(788, 1, 'api_access', '{\"endpoint\":\"\\/api\\/grade-reports\\/stats\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:25:47'),
(789, 1, 'api_access', '{\"endpoint\":\"\\/api\\/grade-scales\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:25:47'),
(790, 1, 'api_access', '{\"endpoint\":\"\\/api\\/institutions\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:25:47'),
(791, 1, 'api_access', '{\"endpoint\":\"\\/api\\/login-activity\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:25:47'),
(792, 1, 'api_access', '{\"endpoint\":\"\\/api\\/login-activity\\/my-history\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:25:47'),
(793, 1, 'api_access', '{\"endpoint\":\"\\/api\\/login-activity\\/recent\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:25:47'),
(794, 1, 'api_access', '{\"endpoint\":\"\\/api\\/login-activity\\/failed\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:25:47'),
(795, 1, 'api_access', '{\"endpoint\":\"\\/api\\/messages\\/inbox\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:25:47'),
(796, 1, 'api_access', '{\"endpoint\":\"\\/api\\/messages\\/sent\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:25:47'),
(797, 1, 'api_access', '{\"endpoint\":\"\\/api\\/messages\\/unread-count\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:25:47'),
(798, 1, 'api_access', '{\"endpoint\":\"\\/api\\/notifications\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:25:47'),
(799, 1, 'api_access', '{\"endpoint\":\"\\/api\\/notifications\\/summary\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:25:47'),
(800, 1, 'api_access', '{\"endpoint\":\"\\/api\\/notifications\\/unread-count\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:25:47'),
(801, 1, 'api_access', '{\"endpoint\":\"\\/api\\/parents\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:25:47'),
(802, 1, 'api_access', '{\"endpoint\":\"\\/api\\/programs\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:25:47'),
(803, 1, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:25:47'),
(804, 1, 'api_access', '{\"endpoint\":\"\\/api\\/roles\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:25:48'),
(805, 1, 'api_access', '{\"endpoint\":\"\\/api\\/permissions\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:25:48'),
(806, 1, 'api_access', '{\"endpoint\":\"\\/api\\/semesters\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:25:48'),
(807, 1, 'api_access', '{\"endpoint\":\"\\/api\\/semesters\\/current\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:25:48'),
(808, 1, 'api_access', '{\"endpoint\":\"\\/api\\/students\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:25:48'),
(809, 1, 'api_access', '{\"endpoint\":\"\\/api\\/subjects\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:25:48'),
(810, 1, 'api_access', '{\"endpoint\":\"\\/api\\/subjects\\/core\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:25:48'),
(811, 1, 'api_access', '{\"endpoint\":\"\\/api\\/subscriptions\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:25:48'),
(812, 1, 'api_access', '{\"endpoint\":\"\\/api\\/subscriptions\\/stats\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:25:48'),
(813, 1, 'api_access', '{\"endpoint\":\"\\/api\\/system\\/settings\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:25:48'),
(814, 1, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:25:48'),
(815, 1, 'api_access', '{\"endpoint\":\"\\/api\\/user-activity\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:25:48'),
(816, 1, 'api_access', '{\"endpoint\":\"\\/api\\/user-activity\\/recent\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:25:48'),
(817, 1, 'api_access', '{\"endpoint\":\"\\/api\\/user-activity\\/stats\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:25:48'),
(818, 1, 'api_access', '{\"endpoint\":\"\\/api\\/user-activity\\/audit-trail\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:25:48'),
(819, 1, 'api_access', '{\"endpoint\":\"\\/api\\/users\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:25:48'),
(820, 1, 'api_access', '{\"endpoint\":\"\\/api\\/superadmin\\/users\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:25:49'),
(821, 1, 'api_access', '{\"endpoint\":\"\\/api\\/academic-years\",\"method\":\"POST\"}', '::1', NULL, '2026-03-03 21:25:49'),
(822, 1, 'api_access', '{\"endpoint\":\"\\/api\\/subjects\",\"method\":\"POST\"}', '::1', NULL, '2026-03-03 21:25:49'),
(823, 1, 'api_access', '{\"endpoint\":\"\\/api\\/grade-scales\",\"method\":\"POST\"}', '::1', NULL, '2026-03-03 21:25:49'),
(824, 147, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-03 21:28:16'),
(825, 147, 'api_access', '{\"endpoint\":\"\\/api\\/academic-years\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:28:16'),
(826, 147, 'api_access', '{\"endpoint\":\"\\/api\\/academic-years\\/current\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:28:16'),
(827, 147, 'api_access', '{\"endpoint\":\"\\/api\\/announcements\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:28:16'),
(828, 147, 'api_access', '{\"endpoint\":\"\\/api\\/assessments?course_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:28:16'),
(829, 147, 'api_access', '{\"endpoint\":\"\\/api\\/assessment-categories\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:28:16'),
(830, 147, 'api_access', '{\"endpoint\":\"\\/api\\/auth\\/me\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:28:16'),
(831, 147, 'api_access', '{\"endpoint\":\"\\/api\\/classes\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:28:17'),
(832, 147, 'api_access', '{\"endpoint\":\"\\/api\\/class-subjects\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:28:17'),
(833, 147, 'api_access', '{\"endpoint\":\"\\/api\\/courses\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:28:17'),
(834, 147, 'api_access', '{\"endpoint\":\"\\/api\\/course-content\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:28:17'),
(835, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:28:17'),
(836, 152, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-03 21:28:17'),
(837, 152, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/teacher\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:28:17'),
(838, 162, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-03 21:28:17'),
(839, 162, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/student\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:28:17'),
(840, 182, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-03 21:28:17'),
(841, 182, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/parent\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:28:18'),
(842, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/superadmin\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:28:18'),
(843, 147, 'api_access', '{\"endpoint\":\"\\/api\\/error-logs\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:28:18'),
(844, 147, 'api_access', '{\"endpoint\":\"\\/api\\/error-logs\\/unresolved\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:28:18'),
(845, 147, 'api_access', '{\"endpoint\":\"\\/api\\/events\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:28:18'),
(846, 147, 'api_access', '{\"endpoint\":\"\\/api\\/events\\/upcoming\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:28:18'),
(847, 147, 'api_access', '{\"endpoint\":\"\\/api\\/events\\/calendar\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:28:18'),
(848, 147, 'api_access', '{\"endpoint\":\"\\/api\\/events\\/academic-calendar\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:28:18'),
(849, 147, 'api_access', '{\"endpoint\":\"\\/api\\/grade-levels\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:28:18'),
(850, 147, 'api_access', '{\"endpoint\":\"\\/api\\/grade-levels\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:28:18'),
(851, 147, 'api_access', '{\"endpoint\":\"\\/api\\/grade-reports\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:28:18'),
(852, 147, 'api_access', '{\"endpoint\":\"\\/api\\/grade-reports\\/stats\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:28:18'),
(853, 147, 'api_access', '{\"endpoint\":\"\\/api\\/grade-scales\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:28:18'),
(854, 147, 'api_access', '{\"endpoint\":\"\\/api\\/institutions\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:28:18'),
(855, 147, 'api_access', '{\"endpoint\":\"\\/api\\/login-activity\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:28:18'),
(856, 147, 'api_access', '{\"endpoint\":\"\\/api\\/login-activity\\/my-history\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:28:18'),
(857, 147, 'api_access', '{\"endpoint\":\"\\/api\\/login-activity\\/recent\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:28:19'),
(858, 147, 'api_access', '{\"endpoint\":\"\\/api\\/login-activity\\/failed\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:28:19'),
(859, 147, 'api_access', '{\"endpoint\":\"\\/api\\/messages\\/inbox\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:28:19'),
(860, 147, 'api_access', '{\"endpoint\":\"\\/api\\/messages\\/sent\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:28:19'),
(861, 147, 'api_access', '{\"endpoint\":\"\\/api\\/messages\\/unread-count\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:28:19'),
(862, 147, 'api_access', '{\"endpoint\":\"\\/api\\/notifications\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:28:19'),
(863, 147, 'api_access', '{\"endpoint\":\"\\/api\\/notifications\\/summary\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:28:19'),
(864, 147, 'api_access', '{\"endpoint\":\"\\/api\\/notifications\\/unread-count\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:28:19'),
(865, 147, 'api_access', '{\"endpoint\":\"\\/api\\/parents\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:28:19'),
(866, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:28:19'),
(867, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:28:19'),
(868, 147, 'api_access', '{\"endpoint\":\"\\/api\\/roles\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:28:19'),
(869, 147, 'api_access', '{\"endpoint\":\"\\/api\\/permissions\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:28:20'),
(870, 147, 'api_access', '{\"endpoint\":\"\\/api\\/semesters\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:28:20'),
(871, 147, 'api_access', '{\"endpoint\":\"\\/api\\/semesters\\/current\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:28:20'),
(872, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:28:20'),
(873, 147, 'api_access', '{\"endpoint\":\"\\/api\\/subjects\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:28:20'),
(874, 147, 'api_access', '{\"endpoint\":\"\\/api\\/subjects\\/core\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:28:20'),
(875, 147, 'api_access', '{\"endpoint\":\"\\/api\\/subscriptions\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:28:20'),
(876, 147, 'api_access', '{\"endpoint\":\"\\/api\\/subscriptions\\/stats\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:28:20'),
(877, 147, 'api_access', '{\"endpoint\":\"\\/api\\/system\\/settings\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:28:20'),
(878, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:28:20'),
(879, 147, 'api_access', '{\"endpoint\":\"\\/api\\/user-activity\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:28:20'),
(880, 147, 'api_access', '{\"endpoint\":\"\\/api\\/user-activity\\/recent\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:28:20'),
(881, 147, 'api_access', '{\"endpoint\":\"\\/api\\/user-activity\\/stats\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:28:20'),
(882, 147, 'api_access', '{\"endpoint\":\"\\/api\\/user-activity\\/audit-trail\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:28:20'),
(883, 147, 'api_access', '{\"endpoint\":\"\\/api\\/users\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:28:21'),
(884, 147, 'api_access', '{\"endpoint\":\"\\/api\\/superadmin\\/users\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:28:21'),
(885, 147, 'api_access', '{\"endpoint\":\"\\/api\\/academic-years\",\"method\":\"POST\"}', '::1', NULL, '2026-03-03 21:28:21'),
(886, 147, 'api_access', '{\"endpoint\":\"\\/api\\/subjects\",\"method\":\"POST\"}', '::1', NULL, '2026-03-03 21:28:21'),
(887, 147, 'api_access', '{\"endpoint\":\"\\/api\\/grade-scales\",\"method\":\"POST\"}', '::1', NULL, '2026-03-03 21:28:21'),
(888, 147, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-03 21:34:32'),
(889, 147, 'api_access', '{\"endpoint\":\"\\/api\\/academic-years\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:34:32'),
(890, 147, 'api_access', '{\"endpoint\":\"\\/api\\/academic-years\\/current\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:34:32'),
(891, 147, 'api_access', '{\"endpoint\":\"\\/api\\/announcements\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:34:32'),
(892, 147, 'api_access', '{\"endpoint\":\"\\/api\\/assessments?course_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:34:32'),
(893, 147, 'api_access', '{\"endpoint\":\"\\/api\\/assessment-categories\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:34:32'),
(894, 147, 'api_access', '{\"endpoint\":\"\\/api\\/auth\\/me\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:34:33'),
(895, 147, 'api_access', '{\"endpoint\":\"\\/api\\/classes\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:34:33'),
(896, 147, 'api_access', '{\"endpoint\":\"\\/api\\/class-subjects\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:34:33'),
(897, 147, 'api_access', '{\"endpoint\":\"\\/api\\/courses\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:34:33'),
(898, 147, 'api_access', '{\"endpoint\":\"\\/api\\/course-content\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:34:33'),
(899, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:34:33'),
(900, 152, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-03 21:34:33'),
(901, 152, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/teacher\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:34:33'),
(902, 162, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-03 21:34:34'),
(903, 162, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/student\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:34:34'),
(904, 182, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-03 21:34:34'),
(905, 182, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/parent\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:34:34'),
(906, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/superadmin\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:34:34'),
(907, 147, 'api_access', '{\"endpoint\":\"\\/api\\/error-logs\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:34:34'),
(908, 147, 'api_access', '{\"endpoint\":\"\\/api\\/error-logs\\/unresolved\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:34:34'),
(909, 147, 'api_access', '{\"endpoint\":\"\\/api\\/events\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:34:34'),
(910, 147, 'api_access', '{\"endpoint\":\"\\/api\\/events\\/upcoming\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:34:34'),
(911, 147, 'api_access', '{\"endpoint\":\"\\/api\\/events\\/calendar\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:34:34'),
(912, 147, 'api_access', '{\"endpoint\":\"\\/api\\/events\\/academic-calendar\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:34:35'),
(913, 147, 'api_access', '{\"endpoint\":\"\\/api\\/grade-levels\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:34:35'),
(914, 147, 'api_access', '{\"endpoint\":\"\\/api\\/grade-levels\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:34:35'),
(915, 147, 'api_access', '{\"endpoint\":\"\\/api\\/grade-reports\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:34:35'),
(916, 147, 'api_access', '{\"endpoint\":\"\\/api\\/grade-reports\\/stats\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:34:35'),
(917, 147, 'api_access', '{\"endpoint\":\"\\/api\\/grade-scales\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:34:35'),
(918, 147, 'api_access', '{\"endpoint\":\"\\/api\\/institutions\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:34:35'),
(919, 147, 'api_access', '{\"endpoint\":\"\\/api\\/login-activity\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:34:35'),
(920, 147, 'api_access', '{\"endpoint\":\"\\/api\\/login-activity\\/my-history\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:34:35'),
(921, 147, 'api_access', '{\"endpoint\":\"\\/api\\/login-activity\\/recent\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:34:35'),
(922, 147, 'api_access', '{\"endpoint\":\"\\/api\\/login-activity\\/failed\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:34:35'),
(923, 147, 'api_access', '{\"endpoint\":\"\\/api\\/messages\\/inbox\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:34:35'),
(924, 147, 'api_access', '{\"endpoint\":\"\\/api\\/messages\\/sent\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:34:36'),
(925, 147, 'api_access', '{\"endpoint\":\"\\/api\\/messages\\/unread-count\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:34:36'),
(926, 147, 'api_access', '{\"endpoint\":\"\\/api\\/notifications\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:34:36'),
(927, 147, 'api_access', '{\"endpoint\":\"\\/api\\/notifications\\/summary\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:34:36'),
(928, 147, 'api_access', '{\"endpoint\":\"\\/api\\/notifications\\/unread-count\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:34:36'),
(929, 147, 'api_access', '{\"endpoint\":\"\\/api\\/parents\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:34:36'),
(930, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:34:36'),
(931, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:34:36'),
(932, 147, 'api_access', '{\"endpoint\":\"\\/api\\/roles\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:34:36'),
(933, 147, 'api_access', '{\"endpoint\":\"\\/api\\/permissions\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:34:36'),
(934, 147, 'api_access', '{\"endpoint\":\"\\/api\\/semesters\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:34:36'),
(935, 147, 'api_access', '{\"endpoint\":\"\\/api\\/semesters\\/current\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:34:37'),
(936, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:34:37'),
(937, 147, 'api_access', '{\"endpoint\":\"\\/api\\/subjects\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:34:37'),
(938, 147, 'api_access', '{\"endpoint\":\"\\/api\\/subjects\\/core\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:34:37'),
(939, 147, 'api_access', '{\"endpoint\":\"\\/api\\/subscriptions\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:34:37'),
(940, 147, 'api_access', '{\"endpoint\":\"\\/api\\/subscriptions\\/stats\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:34:37'),
(941, 147, 'api_access', '{\"endpoint\":\"\\/api\\/system\\/settings\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:34:37'),
(942, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:34:37'),
(943, 147, 'api_access', '{\"endpoint\":\"\\/api\\/user-activity\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:34:37'),
(944, 147, 'api_access', '{\"endpoint\":\"\\/api\\/user-activity\\/recent\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:34:37'),
(945, 147, 'api_access', '{\"endpoint\":\"\\/api\\/user-activity\\/stats\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:34:37'),
(946, 147, 'api_access', '{\"endpoint\":\"\\/api\\/user-activity\\/audit-trail\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:34:37'),
(947, 147, 'api_access', '{\"endpoint\":\"\\/api\\/users\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:34:37'),
(948, 147, 'api_access', '{\"endpoint\":\"\\/api\\/superadmin\\/users\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:34:38'),
(949, 147, 'api_access', '{\"endpoint\":\"\\/api\\/institutions\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:34:38'),
(950, 1, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-03 21:35:41'),
(951, 1, 'api_access', '{\"endpoint\":\"\\/api\\/academic-years\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:35:41'),
(952, 1, 'api_access', '{\"endpoint\":\"\\/api\\/academic-years\\/current\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:35:41'),
(953, 1, 'api_access', '{\"endpoint\":\"\\/api\\/announcements\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:35:41'),
(954, 1, 'api_access', '{\"endpoint\":\"\\/api\\/assessments?course_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:35:41'),
(955, 1, 'api_access', '{\"endpoint\":\"\\/api\\/assessment-categories\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:35:41'),
(956, 1, 'api_access', '{\"endpoint\":\"\\/api\\/auth\\/me\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:35:41'),
(957, 1, 'api_access', '{\"endpoint\":\"\\/api\\/classes\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:35:41'),
(958, 1, 'api_access', '{\"endpoint\":\"\\/api\\/class-subjects\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:35:41'),
(959, 1, 'api_access', '{\"endpoint\":\"\\/api\\/courses\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:35:41'),
(960, 1, 'api_access', '{\"endpoint\":\"\\/api\\/course-content\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:35:41'),
(961, 1, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:35:41'),
(962, 152, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-03 21:35:42'),
(963, 152, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/teacher\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:35:42'),
(964, 162, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-03 21:35:42'),
(965, 162, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/student\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:35:42'),
(966, 182, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-03 21:35:42'),
(967, 182, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/parent\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:35:42'),
(968, 1, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/superadmin\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:35:42'),
(969, 1, 'api_access', '{\"endpoint\":\"\\/api\\/error-logs\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:35:42'),
(970, 1, 'api_access', '{\"endpoint\":\"\\/api\\/error-logs\\/unresolved\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:35:42'),
(971, 1, 'api_access', '{\"endpoint\":\"\\/api\\/events\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:35:42'),
(972, 1, 'api_access', '{\"endpoint\":\"\\/api\\/events\\/upcoming\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:35:42'),
(973, 1, 'api_access', '{\"endpoint\":\"\\/api\\/events\\/calendar\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:35:43'),
(974, 1, 'api_access', '{\"endpoint\":\"\\/api\\/events\\/academic-calendar\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:35:43'),
(975, 1, 'api_access', '{\"endpoint\":\"\\/api\\/grade-levels\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:35:43'),
(976, 1, 'api_access', '{\"endpoint\":\"\\/api\\/grade-levels\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:35:43'),
(977, 1, 'api_access', '{\"endpoint\":\"\\/api\\/grade-reports\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:35:43'),
(978, 1, 'api_access', '{\"endpoint\":\"\\/api\\/grade-reports\\/stats\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:35:43'),
(979, 1, 'api_access', '{\"endpoint\":\"\\/api\\/grade-scales\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:35:43'),
(980, 1, 'api_access', '{\"endpoint\":\"\\/api\\/institutions\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:35:43'),
(981, 1, 'api_access', '{\"endpoint\":\"\\/api\\/login-activity\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:35:43'),
(982, 1, 'api_access', '{\"endpoint\":\"\\/api\\/login-activity\\/my-history\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:35:43'),
(983, 1, 'api_access', '{\"endpoint\":\"\\/api\\/login-activity\\/recent\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:35:43'),
(984, 1, 'api_access', '{\"endpoint\":\"\\/api\\/login-activity\\/failed\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:35:43'),
(985, 1, 'api_access', '{\"endpoint\":\"\\/api\\/messages\\/inbox\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:35:43'),
(986, 1, 'api_access', '{\"endpoint\":\"\\/api\\/messages\\/sent\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:35:43'),
(987, 1, 'api_access', '{\"endpoint\":\"\\/api\\/messages\\/unread-count\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:35:43'),
(988, 1, 'api_access', '{\"endpoint\":\"\\/api\\/notifications\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:35:44'),
(989, 1, 'api_access', '{\"endpoint\":\"\\/api\\/notifications\\/summary\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:35:44'),
(990, 1, 'api_access', '{\"endpoint\":\"\\/api\\/notifications\\/unread-count\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:35:44'),
(991, 1, 'api_access', '{\"endpoint\":\"\\/api\\/parents\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:35:44'),
(992, 1, 'api_access', '{\"endpoint\":\"\\/api\\/programs\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:35:44'),
(993, 1, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:35:44'),
(994, 1, 'api_access', '{\"endpoint\":\"\\/api\\/roles\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:35:44'),
(995, 1, 'api_access', '{\"endpoint\":\"\\/api\\/permissions\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:35:44'),
(996, 1, 'api_access', '{\"endpoint\":\"\\/api\\/semesters\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:35:44'),
(997, 1, 'api_access', '{\"endpoint\":\"\\/api\\/semesters\\/current\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:35:44'),
(998, 1, 'api_access', '{\"endpoint\":\"\\/api\\/students\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:35:44'),
(999, 1, 'api_access', '{\"endpoint\":\"\\/api\\/subjects\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:35:44'),
(1000, 1, 'api_access', '{\"endpoint\":\"\\/api\\/subjects\\/core\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:35:44'),
(1001, 1, 'api_access', '{\"endpoint\":\"\\/api\\/subscriptions\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:35:44'),
(1002, 1, 'api_access', '{\"endpoint\":\"\\/api\\/subscriptions\\/stats\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:35:44'),
(1003, 1, 'api_access', '{\"endpoint\":\"\\/api\\/system\\/settings\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:35:44'),
(1004, 1, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:35:45'),
(1005, 1, 'api_access', '{\"endpoint\":\"\\/api\\/user-activity\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:35:45'),
(1006, 1, 'api_access', '{\"endpoint\":\"\\/api\\/user-activity\\/recent\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:35:45'),
(1007, 1, 'api_access', '{\"endpoint\":\"\\/api\\/user-activity\\/stats\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:35:45'),
(1008, 1, 'api_access', '{\"endpoint\":\"\\/api\\/user-activity\\/audit-trail\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:35:45'),
(1009, 1, 'api_access', '{\"endpoint\":\"\\/api\\/users\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:35:45'),
(1010, 1, 'api_access', '{\"endpoint\":\"\\/api\\/superadmin\\/users\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:35:45'),
(1011, 1, 'api_access', '{\"endpoint\":\"\\/api\\/institutions\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:35:45'),
(1012, 147, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-03 21:37:23'),
(1013, 147, 'api_access', '{\"endpoint\":\"\\/api\\/academic-years\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:37:23'),
(1014, 147, 'api_access', '{\"endpoint\":\"\\/api\\/academic-years\\/current\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:37:24'),
(1015, 147, 'api_access', '{\"endpoint\":\"\\/api\\/announcements\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:37:24'),
(1016, 147, 'api_access', '{\"endpoint\":\"\\/api\\/assessments?course_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:37:24'),
(1017, 147, 'api_access', '{\"endpoint\":\"\\/api\\/assessment-categories\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:37:24'),
(1018, 147, 'api_access', '{\"endpoint\":\"\\/api\\/auth\\/me\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:37:24'),
(1019, 147, 'api_access', '{\"endpoint\":\"\\/api\\/classes\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:37:24'),
(1020, 147, 'api_access', '{\"endpoint\":\"\\/api\\/class-subjects\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:37:24'),
(1021, 147, 'api_access', '{\"endpoint\":\"\\/api\\/courses\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:37:24'),
(1022, 147, 'api_access', '{\"endpoint\":\"\\/api\\/course-content\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:37:24'),
(1023, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:37:24'),
(1024, 152, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-03 21:37:24'),
(1025, 152, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/teacher\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:37:25'),
(1026, 162, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-03 21:37:25'),
(1027, 162, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/student\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:37:25'),
(1028, 182, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-03 21:37:25'),
(1029, 182, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/parent\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:37:25'),
(1030, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/superadmin\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:37:25'),
(1031, 147, 'api_access', '{\"endpoint\":\"\\/api\\/error-logs\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:37:25'),
(1032, 147, 'api_access', '{\"endpoint\":\"\\/api\\/error-logs\\/unresolved\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:37:25'),
(1033, 147, 'api_access', '{\"endpoint\":\"\\/api\\/events\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:37:25'),
(1034, 147, 'api_access', '{\"endpoint\":\"\\/api\\/events\\/upcoming\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:37:25'),
(1035, 147, 'api_access', '{\"endpoint\":\"\\/api\\/events\\/calendar\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:37:25'),
(1036, 147, 'api_access', '{\"endpoint\":\"\\/api\\/events\\/academic-calendar\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:37:25'),
(1037, 147, 'api_access', '{\"endpoint\":\"\\/api\\/grade-levels\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:37:25'),
(1038, 147, 'api_access', '{\"endpoint\":\"\\/api\\/grade-levels\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:37:25'),
(1039, 147, 'api_access', '{\"endpoint\":\"\\/api\\/grade-reports\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:37:25'),
(1040, 147, 'api_access', '{\"endpoint\":\"\\/api\\/grade-reports\\/stats\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:37:26'),
(1041, 147, 'api_access', '{\"endpoint\":\"\\/api\\/grade-scales\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:37:26'),
(1042, 147, 'api_access', '{\"endpoint\":\"\\/api\\/institutions\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:37:26'),
(1043, 147, 'api_access', '{\"endpoint\":\"\\/api\\/login-activity\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:37:26'),
(1044, 147, 'api_access', '{\"endpoint\":\"\\/api\\/login-activity\\/my-history\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:37:26'),
(1045, 147, 'api_access', '{\"endpoint\":\"\\/api\\/login-activity\\/recent\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:37:26'),
(1046, 147, 'api_access', '{\"endpoint\":\"\\/api\\/login-activity\\/failed\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:37:26'),
(1047, 147, 'api_access', '{\"endpoint\":\"\\/api\\/messages\\/inbox\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:37:26'),
(1048, 147, 'api_access', '{\"endpoint\":\"\\/api\\/messages\\/sent\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:37:26'),
(1049, 147, 'api_access', '{\"endpoint\":\"\\/api\\/messages\\/unread-count\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:37:26'),
(1050, 147, 'api_access', '{\"endpoint\":\"\\/api\\/notifications\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:37:26'),
(1051, 147, 'api_access', '{\"endpoint\":\"\\/api\\/notifications\\/summary\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:37:26'),
(1052, 147, 'api_access', '{\"endpoint\":\"\\/api\\/notifications\\/unread-count\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:37:26'),
(1053, 147, 'api_access', '{\"endpoint\":\"\\/api\\/parents\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:37:26'),
(1054, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:37:26'),
(1055, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:37:27'),
(1056, 147, 'api_access', '{\"endpoint\":\"\\/api\\/roles\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:37:27'),
(1057, 147, 'api_access', '{\"endpoint\":\"\\/api\\/permissions\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:37:27'),
(1058, 147, 'api_access', '{\"endpoint\":\"\\/api\\/semesters\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:37:27'),
(1059, 147, 'api_access', '{\"endpoint\":\"\\/api\\/semesters\\/current\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:37:27'),
(1060, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:37:27'),
(1061, 147, 'api_access', '{\"endpoint\":\"\\/api\\/subjects\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:37:27'),
(1062, 147, 'api_access', '{\"endpoint\":\"\\/api\\/subjects\\/core\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:37:27'),
(1063, 147, 'api_access', '{\"endpoint\":\"\\/api\\/subscriptions\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:37:27'),
(1064, 147, 'api_access', '{\"endpoint\":\"\\/api\\/subscriptions\\/stats\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:37:27'),
(1065, 147, 'api_access', '{\"endpoint\":\"\\/api\\/system\\/settings\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:37:27'),
(1066, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:37:27'),
(1067, 147, 'api_access', '{\"endpoint\":\"\\/api\\/user-activity\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:37:27'),
(1068, 147, 'api_access', '{\"endpoint\":\"\\/api\\/user-activity\\/recent\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:37:28'),
(1069, 147, 'api_access', '{\"endpoint\":\"\\/api\\/user-activity\\/stats\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:37:28'),
(1070, 147, 'api_access', '{\"endpoint\":\"\\/api\\/user-activity\\/audit-trail\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:37:28'),
(1071, 147, 'api_access', '{\"endpoint\":\"\\/api\\/users\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:37:28'),
(1072, 147, 'api_access', '{\"endpoint\":\"\\/api\\/superadmin\\/users\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:37:28'),
(1073, 147, 'api_access', '{\"endpoint\":\"\\/api\\/institutions\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:37:28'),
(1074, 147, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-03 21:37:55'),
(1075, 147, 'api_access', '{\"endpoint\":\"\\/api\\/academic-years\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:37:55'),
(1076, 147, 'api_access', '{\"endpoint\":\"\\/api\\/academic-years\\/current\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:37:55'),
(1077, 147, 'api_access', '{\"endpoint\":\"\\/api\\/announcements\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:37:55'),
(1078, 147, 'api_access', '{\"endpoint\":\"\\/api\\/assessments?course_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:37:55'),
(1079, 147, 'api_access', '{\"endpoint\":\"\\/api\\/assessment-categories\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:37:55'),
(1080, 147, 'api_access', '{\"endpoint\":\"\\/api\\/auth\\/me\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:37:55'),
(1081, 147, 'api_access', '{\"endpoint\":\"\\/api\\/classes\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:37:55'),
(1082, 147, 'api_access', '{\"endpoint\":\"\\/api\\/class-subjects\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:37:55'),
(1083, 147, 'api_access', '{\"endpoint\":\"\\/api\\/courses\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:37:55'),
(1084, 147, 'api_access', '{\"endpoint\":\"\\/api\\/course-content\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:37:56'),
(1085, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:37:56'),
(1086, 152, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-03 21:37:56'),
(1087, 152, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/teacher\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:37:56'),
(1088, 162, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-03 21:37:56'),
(1089, 162, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/student\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:37:56'),
(1090, 182, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-03 21:37:56'),
(1091, 182, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/parent\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:37:56'),
(1092, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/superadmin\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:37:56'),
(1093, 147, 'api_access', '{\"endpoint\":\"\\/api\\/error-logs\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:37:56'),
(1094, 147, 'api_access', '{\"endpoint\":\"\\/api\\/error-logs\\/unresolved\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:37:56'),
(1095, 147, 'api_access', '{\"endpoint\":\"\\/api\\/events\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:37:57'),
(1096, 147, 'api_access', '{\"endpoint\":\"\\/api\\/events\\/upcoming\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:37:57'),
(1097, 147, 'api_access', '{\"endpoint\":\"\\/api\\/events\\/calendar\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:37:57'),
(1098, 147, 'api_access', '{\"endpoint\":\"\\/api\\/events\\/academic-calendar\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:37:57'),
(1099, 147, 'api_access', '{\"endpoint\":\"\\/api\\/grade-levels\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:37:57'),
(1100, 147, 'api_access', '{\"endpoint\":\"\\/api\\/grade-levels\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:37:57');
INSERT INTO `user_activity` (`activity_id`, `user_id`, `activity_type`, `activity_details`, `ip_address`, `user_agent`, `created_at`) VALUES
(1101, 147, 'api_access', '{\"endpoint\":\"\\/api\\/grade-reports\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:37:57'),
(1102, 147, 'api_access', '{\"endpoint\":\"\\/api\\/grade-reports\\/stats\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:37:57'),
(1103, 147, 'api_access', '{\"endpoint\":\"\\/api\\/grade-scales\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:37:57'),
(1104, 147, 'api_access', '{\"endpoint\":\"\\/api\\/institutions\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:37:57'),
(1105, 147, 'api_access', '{\"endpoint\":\"\\/api\\/login-activity\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:37:57'),
(1106, 147, 'api_access', '{\"endpoint\":\"\\/api\\/login-activity\\/my-history\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:37:57'),
(1107, 147, 'api_access', '{\"endpoint\":\"\\/api\\/login-activity\\/recent\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:37:57'),
(1108, 147, 'api_access', '{\"endpoint\":\"\\/api\\/login-activity\\/failed\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:37:57'),
(1109, 147, 'api_access', '{\"endpoint\":\"\\/api\\/messages\\/inbox\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:37:58'),
(1110, 147, 'api_access', '{\"endpoint\":\"\\/api\\/messages\\/sent\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:37:58'),
(1111, 147, 'api_access', '{\"endpoint\":\"\\/api\\/messages\\/unread-count\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:37:58'),
(1112, 147, 'api_access', '{\"endpoint\":\"\\/api\\/notifications\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:37:58'),
(1113, 147, 'api_access', '{\"endpoint\":\"\\/api\\/notifications\\/summary\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:37:58'),
(1114, 147, 'api_access', '{\"endpoint\":\"\\/api\\/notifications\\/unread-count\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:37:58'),
(1115, 147, 'api_access', '{\"endpoint\":\"\\/api\\/parents\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:37:58'),
(1116, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:37:58'),
(1117, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:37:58'),
(1118, 147, 'api_access', '{\"endpoint\":\"\\/api\\/roles\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:37:58'),
(1119, 147, 'api_access', '{\"endpoint\":\"\\/api\\/permissions\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:37:58'),
(1120, 147, 'api_access', '{\"endpoint\":\"\\/api\\/semesters\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:37:59'),
(1121, 147, 'api_access', '{\"endpoint\":\"\\/api\\/semesters\\/current\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:37:59'),
(1122, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:37:59'),
(1123, 147, 'api_access', '{\"endpoint\":\"\\/api\\/subjects\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:37:59'),
(1124, 147, 'api_access', '{\"endpoint\":\"\\/api\\/subjects\\/core\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:37:59'),
(1125, 147, 'api_access', '{\"endpoint\":\"\\/api\\/subscriptions\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:37:59'),
(1126, 147, 'api_access', '{\"endpoint\":\"\\/api\\/subscriptions\\/stats\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:37:59'),
(1127, 147, 'api_access', '{\"endpoint\":\"\\/api\\/system\\/settings\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:37:59'),
(1128, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:37:59'),
(1129, 147, 'api_access', '{\"endpoint\":\"\\/api\\/user-activity\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:37:59'),
(1130, 147, 'api_access', '{\"endpoint\":\"\\/api\\/user-activity\\/recent\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:37:59'),
(1131, 147, 'api_access', '{\"endpoint\":\"\\/api\\/user-activity\\/stats\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:37:59'),
(1132, 147, 'api_access', '{\"endpoint\":\"\\/api\\/user-activity\\/audit-trail\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:37:59'),
(1133, 147, 'api_access', '{\"endpoint\":\"\\/api\\/users\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:37:59'),
(1134, 147, 'api_access', '{\"endpoint\":\"\\/api\\/superadmin\\/users\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:38:00'),
(1135, 147, 'api_access', '{\"endpoint\":\"\\/api\\/institutions\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:38:00'),
(1136, 152, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-03 21:39:21'),
(1137, 152, 'api_access', '{\"endpoint\":\"\\/api\\/academic-years\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:39:21'),
(1138, 152, 'api_access', '{\"endpoint\":\"\\/api\\/academic-years\\/current\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:39:21'),
(1139, 152, 'api_access', '{\"endpoint\":\"\\/api\\/announcements\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:39:21'),
(1140, 152, 'api_access', '{\"endpoint\":\"\\/api\\/assessments?course_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:39:21'),
(1141, 152, 'api_access', '{\"endpoint\":\"\\/api\\/assessment-categories\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:39:21'),
(1142, 152, 'api_access', '{\"endpoint\":\"\\/api\\/auth\\/me\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:39:21'),
(1143, 152, 'api_access', '{\"endpoint\":\"\\/api\\/classes\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:39:21'),
(1144, 152, 'api_access', '{\"endpoint\":\"\\/api\\/class-subjects\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:39:21'),
(1145, 152, 'api_access', '{\"endpoint\":\"\\/api\\/courses\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:39:22'),
(1146, 152, 'api_access', '{\"endpoint\":\"\\/api\\/course-content\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:39:22'),
(1147, 152, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:39:22'),
(1148, 152, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-03 21:39:22'),
(1149, 152, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/teacher\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:39:22'),
(1150, 162, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-03 21:39:22'),
(1151, 162, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/student\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:39:22'),
(1152, 182, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-03 21:39:22'),
(1153, 182, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/parent\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:39:22'),
(1154, 152, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/superadmin\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:39:22'),
(1155, 152, 'api_access', '{\"endpoint\":\"\\/api\\/error-logs\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:39:22'),
(1156, 152, 'api_access', '{\"endpoint\":\"\\/api\\/error-logs\\/unresolved\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:39:23'),
(1157, 152, 'api_access', '{\"endpoint\":\"\\/api\\/events\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:39:23'),
(1158, 152, 'api_access', '{\"endpoint\":\"\\/api\\/events\\/upcoming\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:39:23'),
(1159, 152, 'api_access', '{\"endpoint\":\"\\/api\\/events\\/calendar\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:39:23'),
(1160, 152, 'api_access', '{\"endpoint\":\"\\/api\\/events\\/academic-calendar\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:39:23'),
(1161, 152, 'api_access', '{\"endpoint\":\"\\/api\\/grade-levels\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:39:23'),
(1162, 152, 'api_access', '{\"endpoint\":\"\\/api\\/grade-levels\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:39:23'),
(1163, 152, 'api_access', '{\"endpoint\":\"\\/api\\/grade-reports\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:39:23'),
(1164, 152, 'api_access', '{\"endpoint\":\"\\/api\\/grade-reports\\/stats\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:39:23'),
(1165, 152, 'api_access', '{\"endpoint\":\"\\/api\\/grade-scales\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:39:23'),
(1166, 152, 'api_access', '{\"endpoint\":\"\\/api\\/institutions\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:39:23'),
(1167, 152, 'api_access', '{\"endpoint\":\"\\/api\\/login-activity\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:39:23'),
(1168, 152, 'api_access', '{\"endpoint\":\"\\/api\\/login-activity\\/my-history\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:39:23'),
(1169, 152, 'api_access', '{\"endpoint\":\"\\/api\\/login-activity\\/recent\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:39:23'),
(1170, 152, 'api_access', '{\"endpoint\":\"\\/api\\/login-activity\\/failed\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:39:23'),
(1171, 152, 'api_access', '{\"endpoint\":\"\\/api\\/messages\\/inbox\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:39:24'),
(1172, 152, 'api_access', '{\"endpoint\":\"\\/api\\/messages\\/sent\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:39:24'),
(1173, 152, 'api_access', '{\"endpoint\":\"\\/api\\/messages\\/unread-count\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:39:24'),
(1174, 152, 'api_access', '{\"endpoint\":\"\\/api\\/notifications\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:39:24'),
(1175, 152, 'api_access', '{\"endpoint\":\"\\/api\\/notifications\\/summary\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:39:24'),
(1176, 152, 'api_access', '{\"endpoint\":\"\\/api\\/notifications\\/unread-count\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:39:24'),
(1177, 152, 'api_access', '{\"endpoint\":\"\\/api\\/parents\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:39:24'),
(1178, 152, 'api_access', '{\"endpoint\":\"\\/api\\/programs\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:39:24'),
(1179, 152, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:39:24'),
(1180, 152, 'api_access', '{\"endpoint\":\"\\/api\\/roles\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:39:24'),
(1181, 152, 'api_access', '{\"endpoint\":\"\\/api\\/permissions\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:39:24'),
(1182, 152, 'api_access', '{\"endpoint\":\"\\/api\\/semesters\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:39:24'),
(1183, 152, 'api_access', '{\"endpoint\":\"\\/api\\/semesters\\/current\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:39:24'),
(1184, 152, 'api_access', '{\"endpoint\":\"\\/api\\/students\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:39:24'),
(1185, 152, 'api_access', '{\"endpoint\":\"\\/api\\/subjects\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:39:25'),
(1186, 152, 'api_access', '{\"endpoint\":\"\\/api\\/subjects\\/core\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:39:25'),
(1187, 152, 'api_access', '{\"endpoint\":\"\\/api\\/subscriptions\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:39:25'),
(1188, 152, 'api_access', '{\"endpoint\":\"\\/api\\/subscriptions\\/stats\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:39:25'),
(1189, 152, 'api_access', '{\"endpoint\":\"\\/api\\/system\\/settings\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:39:25'),
(1190, 152, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:39:25'),
(1191, 152, 'api_access', '{\"endpoint\":\"\\/api\\/user-activity\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:39:25'),
(1192, 152, 'api_access', '{\"endpoint\":\"\\/api\\/user-activity\\/recent\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:39:25'),
(1193, 152, 'api_access', '{\"endpoint\":\"\\/api\\/user-activity\\/stats\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:39:25'),
(1194, 152, 'api_access', '{\"endpoint\":\"\\/api\\/user-activity\\/audit-trail\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:39:25'),
(1195, 152, 'api_access', '{\"endpoint\":\"\\/api\\/users\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:39:25'),
(1196, 152, 'api_access', '{\"endpoint\":\"\\/api\\/superadmin\\/users\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:39:25'),
(1197, 152, 'api_access', '{\"endpoint\":\"\\/api\\/institutions\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:39:25'),
(1198, 162, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-03 21:41:23'),
(1199, 162, 'api_access', '{\"endpoint\":\"\\/api\\/academic-years\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:41:23'),
(1200, 162, 'api_access', '{\"endpoint\":\"\\/api\\/academic-years\\/current\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:41:23'),
(1201, 162, 'api_access', '{\"endpoint\":\"\\/api\\/announcements\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:41:23'),
(1202, 162, 'api_access', '{\"endpoint\":\"\\/api\\/assessments?course_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:41:23'),
(1203, 162, 'api_access', '{\"endpoint\":\"\\/api\\/assessment-categories\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:41:24'),
(1204, 162, 'api_access', '{\"endpoint\":\"\\/api\\/auth\\/me\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:41:24'),
(1205, 162, 'api_access', '{\"endpoint\":\"\\/api\\/classes\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:41:24'),
(1206, 162, 'api_access', '{\"endpoint\":\"\\/api\\/class-subjects\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:41:24'),
(1207, 162, 'api_access', '{\"endpoint\":\"\\/api\\/courses\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:41:24'),
(1208, 162, 'api_access', '{\"endpoint\":\"\\/api\\/course-content\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:41:24'),
(1209, 162, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:41:24'),
(1210, 152, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-03 21:41:24'),
(1211, 152, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/teacher\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:41:24'),
(1212, 162, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-03 21:41:25'),
(1213, 162, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/student\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:41:25'),
(1214, 182, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-03 21:41:25'),
(1215, 182, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/parent\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:41:25'),
(1216, 162, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/superadmin\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:41:25'),
(1217, 162, 'api_access', '{\"endpoint\":\"\\/api\\/error-logs\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:41:25'),
(1218, 162, 'api_access', '{\"endpoint\":\"\\/api\\/error-logs\\/unresolved\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:41:25'),
(1219, 162, 'api_access', '{\"endpoint\":\"\\/api\\/events\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:41:25'),
(1220, 162, 'api_access', '{\"endpoint\":\"\\/api\\/events\\/upcoming\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:41:25'),
(1221, 162, 'api_access', '{\"endpoint\":\"\\/api\\/events\\/calendar\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:41:25'),
(1222, 162, 'api_access', '{\"endpoint\":\"\\/api\\/events\\/academic-calendar\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:41:25'),
(1223, 162, 'api_access', '{\"endpoint\":\"\\/api\\/grade-levels\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:41:25'),
(1224, 162, 'api_access', '{\"endpoint\":\"\\/api\\/grade-levels\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:41:25'),
(1225, 162, 'api_access', '{\"endpoint\":\"\\/api\\/grade-reports\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:41:26'),
(1226, 162, 'api_access', '{\"endpoint\":\"\\/api\\/grade-reports\\/stats\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:41:26'),
(1227, 162, 'api_access', '{\"endpoint\":\"\\/api\\/grade-scales\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:41:26'),
(1228, 162, 'api_access', '{\"endpoint\":\"\\/api\\/institutions\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:41:26'),
(1229, 162, 'api_access', '{\"endpoint\":\"\\/api\\/login-activity\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:41:26'),
(1230, 162, 'api_access', '{\"endpoint\":\"\\/api\\/login-activity\\/my-history\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:41:26'),
(1231, 162, 'api_access', '{\"endpoint\":\"\\/api\\/login-activity\\/recent\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:41:26'),
(1232, 162, 'api_access', '{\"endpoint\":\"\\/api\\/login-activity\\/failed\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:41:26'),
(1233, 162, 'api_access', '{\"endpoint\":\"\\/api\\/messages\\/inbox\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:41:26'),
(1234, 162, 'api_access', '{\"endpoint\":\"\\/api\\/messages\\/sent\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:41:27'),
(1235, 162, 'api_access', '{\"endpoint\":\"\\/api\\/messages\\/unread-count\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:41:27'),
(1236, 162, 'api_access', '{\"endpoint\":\"\\/api\\/notifications\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:41:27'),
(1237, 162, 'api_access', '{\"endpoint\":\"\\/api\\/notifications\\/summary\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:41:27'),
(1238, 162, 'api_access', '{\"endpoint\":\"\\/api\\/notifications\\/unread-count\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:41:27'),
(1239, 162, 'api_access', '{\"endpoint\":\"\\/api\\/parents\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:41:27'),
(1240, 162, 'api_access', '{\"endpoint\":\"\\/api\\/programs\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:41:27'),
(1241, 162, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:41:27'),
(1242, 162, 'api_access', '{\"endpoint\":\"\\/api\\/roles\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:41:27'),
(1243, 162, 'api_access', '{\"endpoint\":\"\\/api\\/permissions\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:41:27'),
(1244, 162, 'api_access', '{\"endpoint\":\"\\/api\\/semesters\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:41:27'),
(1245, 162, 'api_access', '{\"endpoint\":\"\\/api\\/semesters\\/current\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:41:27'),
(1246, 162, 'api_access', '{\"endpoint\":\"\\/api\\/students\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:41:27'),
(1247, 162, 'api_access', '{\"endpoint\":\"\\/api\\/subjects\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:41:27'),
(1248, 162, 'api_access', '{\"endpoint\":\"\\/api\\/subjects\\/core\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:41:28'),
(1249, 162, 'api_access', '{\"endpoint\":\"\\/api\\/subscriptions\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:41:28'),
(1250, 162, 'api_access', '{\"endpoint\":\"\\/api\\/subscriptions\\/stats\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:41:28'),
(1251, 162, 'api_access', '{\"endpoint\":\"\\/api\\/system\\/settings\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:41:28'),
(1252, 162, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:41:28'),
(1253, 162, 'api_access', '{\"endpoint\":\"\\/api\\/user-activity\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:41:29'),
(1254, 162, 'api_access', '{\"endpoint\":\"\\/api\\/user-activity\\/recent\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:41:29'),
(1255, 162, 'api_access', '{\"endpoint\":\"\\/api\\/user-activity\\/stats\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:41:29'),
(1256, 162, 'api_access', '{\"endpoint\":\"\\/api\\/user-activity\\/audit-trail\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:41:29'),
(1257, 162, 'api_access', '{\"endpoint\":\"\\/api\\/users\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:41:29'),
(1258, 162, 'api_access', '{\"endpoint\":\"\\/api\\/superadmin\\/users\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:41:30'),
(1259, 162, 'api_access', '{\"endpoint\":\"\\/api\\/institutions\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:41:30'),
(1260, 188, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-03 21:51:49'),
(1261, 188, 'api_access', '{\"endpoint\":\"\\/api\\/academic-years\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:51:49'),
(1262, 188, 'api_access', '{\"endpoint\":\"\\/api\\/academic-years\\/current\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:51:49'),
(1263, 188, 'api_access', '{\"endpoint\":\"\\/api\\/announcements\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:51:49'),
(1264, 188, 'api_access', '{\"endpoint\":\"\\/api\\/assessments?course_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:51:49'),
(1265, 188, 'api_access', '{\"endpoint\":\"\\/api\\/assessment-categories\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:51:49'),
(1266, 188, 'api_access', '{\"endpoint\":\"\\/api\\/auth\\/me\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:51:49'),
(1267, 188, 'api_access', '{\"endpoint\":\"\\/api\\/classes\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:51:49'),
(1268, 188, 'api_access', '{\"endpoint\":\"\\/api\\/class-subjects\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:51:49'),
(1269, 188, 'api_access', '{\"endpoint\":\"\\/api\\/courses\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:51:50'),
(1270, 188, 'api_access', '{\"endpoint\":\"\\/api\\/course-content\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:51:50'),
(1271, 188, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:51:50'),
(1272, 152, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-03 21:51:50'),
(1273, 152, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/teacher\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:51:50'),
(1274, 162, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-03 21:51:50'),
(1275, 162, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/student\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:51:50'),
(1276, 182, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-03 21:51:50'),
(1277, 182, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/parent\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:51:50'),
(1278, 188, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/superadmin\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:51:50'),
(1279, 188, 'api_access', '{\"endpoint\":\"\\/api\\/error-logs\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:51:51'),
(1280, 188, 'api_access', '{\"endpoint\":\"\\/api\\/error-logs\\/unresolved\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:51:51'),
(1281, 188, 'api_access', '{\"endpoint\":\"\\/api\\/events\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:51:51'),
(1282, 188, 'api_access', '{\"endpoint\":\"\\/api\\/events\\/upcoming\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:51:51'),
(1283, 188, 'api_access', '{\"endpoint\":\"\\/api\\/events\\/calendar\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:51:51'),
(1284, 188, 'api_access', '{\"endpoint\":\"\\/api\\/events\\/academic-calendar\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:51:51'),
(1285, 188, 'api_access', '{\"endpoint\":\"\\/api\\/grade-levels\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:51:51'),
(1286, 188, 'api_access', '{\"endpoint\":\"\\/api\\/grade-levels\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:51:51'),
(1287, 188, 'api_access', '{\"endpoint\":\"\\/api\\/grade-reports\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:51:51'),
(1288, 188, 'api_access', '{\"endpoint\":\"\\/api\\/grade-reports\\/stats\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:51:51'),
(1289, 188, 'api_access', '{\"endpoint\":\"\\/api\\/grade-scales\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:51:51'),
(1290, 188, 'api_access', '{\"endpoint\":\"\\/api\\/institutions\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:51:51'),
(1291, 188, 'api_access', '{\"endpoint\":\"\\/api\\/login-activity\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:51:51'),
(1292, 188, 'api_access', '{\"endpoint\":\"\\/api\\/login-activity\\/my-history\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:51:51'),
(1293, 188, 'api_access', '{\"endpoint\":\"\\/api\\/login-activity\\/recent\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:51:51'),
(1294, 188, 'api_access', '{\"endpoint\":\"\\/api\\/login-activity\\/failed\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:51:52'),
(1295, 188, 'api_access', '{\"endpoint\":\"\\/api\\/messages\\/inbox\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:51:52'),
(1296, 188, 'api_access', '{\"endpoint\":\"\\/api\\/messages\\/sent\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:51:52'),
(1297, 188, 'api_access', '{\"endpoint\":\"\\/api\\/messages\\/unread-count\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:51:52'),
(1298, 188, 'api_access', '{\"endpoint\":\"\\/api\\/notifications\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:51:52'),
(1299, 188, 'api_access', '{\"endpoint\":\"\\/api\\/notifications\\/summary\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:51:52'),
(1300, 188, 'api_access', '{\"endpoint\":\"\\/api\\/notifications\\/unread-count\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:51:52'),
(1301, 188, 'api_access', '{\"endpoint\":\"\\/api\\/parents\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:51:52'),
(1302, 188, 'api_access', '{\"endpoint\":\"\\/api\\/programs\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:51:52'),
(1303, 188, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:51:52'),
(1304, 188, 'api_access', '{\"endpoint\":\"\\/api\\/roles\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:51:52'),
(1305, 188, 'api_access', '{\"endpoint\":\"\\/api\\/permissions\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:51:52'),
(1306, 188, 'api_access', '{\"endpoint\":\"\\/api\\/semesters\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:51:52'),
(1307, 188, 'api_access', '{\"endpoint\":\"\\/api\\/semesters\\/current\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:51:52'),
(1308, 188, 'api_access', '{\"endpoint\":\"\\/api\\/students\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:51:52'),
(1309, 188, 'api_access', '{\"endpoint\":\"\\/api\\/subjects\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:51:52'),
(1310, 188, 'api_access', '{\"endpoint\":\"\\/api\\/subjects\\/core\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:51:53'),
(1311, 188, 'api_access', '{\"endpoint\":\"\\/api\\/subscriptions\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:51:53'),
(1312, 188, 'api_access', '{\"endpoint\":\"\\/api\\/subscriptions\\/stats\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:51:53'),
(1313, 188, 'api_access', '{\"endpoint\":\"\\/api\\/system\\/settings\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:51:53'),
(1314, 188, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:51:53'),
(1315, 188, 'api_access', '{\"endpoint\":\"\\/api\\/user-activity\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:51:53'),
(1316, 188, 'api_access', '{\"endpoint\":\"\\/api\\/user-activity\\/recent\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:51:53'),
(1317, 188, 'api_access', '{\"endpoint\":\"\\/api\\/user-activity\\/stats\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:51:53'),
(1318, 188, 'api_access', '{\"endpoint\":\"\\/api\\/user-activity\\/audit-trail\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:51:53'),
(1319, 188, 'api_access', '{\"endpoint\":\"\\/api\\/users\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:51:53'),
(1320, 188, 'api_access', '{\"endpoint\":\"\\/api\\/superadmin\\/users\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:51:53'),
(1321, 188, 'api_access', '{\"endpoint\":\"\\/api\\/institutions\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:51:53'),
(1322, 188, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-03 21:52:41'),
(1323, 188, 'api_access', '{\"endpoint\":\"\\/api\\/academic-years\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:52:41'),
(1324, 188, 'api_access', '{\"endpoint\":\"\\/api\\/academic-years\\/current\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:52:41'),
(1325, 188, 'api_access', '{\"endpoint\":\"\\/api\\/announcements\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:52:41'),
(1326, 188, 'api_access', '{\"endpoint\":\"\\/api\\/assessments?course_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:52:41'),
(1327, 188, 'api_access', '{\"endpoint\":\"\\/api\\/assessment-categories\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:52:41'),
(1328, 188, 'api_access', '{\"endpoint\":\"\\/api\\/auth\\/me\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:52:41'),
(1329, 188, 'api_access', '{\"endpoint\":\"\\/api\\/classes\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:52:41'),
(1330, 188, 'api_access', '{\"endpoint\":\"\\/api\\/class-subjects\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:52:41'),
(1331, 188, 'api_access', '{\"endpoint\":\"\\/api\\/courses\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:52:41'),
(1332, 188, 'api_access', '{\"endpoint\":\"\\/api\\/course-content\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:52:41'),
(1333, 188, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:52:41'),
(1334, 152, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-03 21:52:42'),
(1335, 152, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/teacher\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:52:42'),
(1336, 162, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-03 21:52:42'),
(1337, 162, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/student\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:52:42'),
(1338, 182, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-03 21:52:42'),
(1339, 182, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/parent\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:52:42'),
(1340, 188, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/superadmin\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:52:42'),
(1341, 188, 'api_access', '{\"endpoint\":\"\\/api\\/error-logs\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:52:42'),
(1342, 188, 'api_access', '{\"endpoint\":\"\\/api\\/error-logs\\/unresolved\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:52:42'),
(1343, 188, 'api_access', '{\"endpoint\":\"\\/api\\/events\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:52:42'),
(1344, 188, 'api_access', '{\"endpoint\":\"\\/api\\/events\\/upcoming\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:52:42'),
(1345, 188, 'api_access', '{\"endpoint\":\"\\/api\\/events\\/calendar\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:52:42'),
(1346, 188, 'api_access', '{\"endpoint\":\"\\/api\\/events\\/academic-calendar\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:52:42'),
(1347, 188, 'api_access', '{\"endpoint\":\"\\/api\\/grade-levels\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:52:43'),
(1348, 188, 'api_access', '{\"endpoint\":\"\\/api\\/grade-levels\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:52:43'),
(1349, 188, 'api_access', '{\"endpoint\":\"\\/api\\/grade-reports\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:52:43'),
(1350, 188, 'api_access', '{\"endpoint\":\"\\/api\\/grade-reports\\/stats\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:52:43'),
(1351, 188, 'api_access', '{\"endpoint\":\"\\/api\\/grade-scales\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:52:43'),
(1352, 188, 'api_access', '{\"endpoint\":\"\\/api\\/institutions\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:52:43'),
(1353, 188, 'api_access', '{\"endpoint\":\"\\/api\\/login-activity\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:52:43'),
(1354, 188, 'api_access', '{\"endpoint\":\"\\/api\\/login-activity\\/my-history\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:52:43'),
(1355, 188, 'api_access', '{\"endpoint\":\"\\/api\\/login-activity\\/recent\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:52:43'),
(1356, 188, 'api_access', '{\"endpoint\":\"\\/api\\/login-activity\\/failed\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:52:43'),
(1357, 188, 'api_access', '{\"endpoint\":\"\\/api\\/messages\\/inbox\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:52:43'),
(1358, 188, 'api_access', '{\"endpoint\":\"\\/api\\/messages\\/sent\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:52:43'),
(1359, 188, 'api_access', '{\"endpoint\":\"\\/api\\/messages\\/unread-count\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:52:43'),
(1360, 188, 'api_access', '{\"endpoint\":\"\\/api\\/notifications\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:52:43'),
(1361, 188, 'api_access', '{\"endpoint\":\"\\/api\\/notifications\\/summary\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:52:43'),
(1362, 188, 'api_access', '{\"endpoint\":\"\\/api\\/notifications\\/unread-count\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:52:43'),
(1363, 188, 'api_access', '{\"endpoint\":\"\\/api\\/parents\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:52:44'),
(1364, 188, 'api_access', '{\"endpoint\":\"\\/api\\/programs\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:52:44'),
(1365, 188, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:52:44'),
(1366, 188, 'api_access', '{\"endpoint\":\"\\/api\\/roles\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:52:44'),
(1367, 188, 'api_access', '{\"endpoint\":\"\\/api\\/permissions\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:52:44'),
(1368, 188, 'api_access', '{\"endpoint\":\"\\/api\\/semesters\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:52:44'),
(1369, 188, 'api_access', '{\"endpoint\":\"\\/api\\/semesters\\/current\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:52:44'),
(1370, 188, 'api_access', '{\"endpoint\":\"\\/api\\/students\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:52:44'),
(1371, 188, 'api_access', '{\"endpoint\":\"\\/api\\/subjects\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:52:44'),
(1372, 188, 'api_access', '{\"endpoint\":\"\\/api\\/subjects\\/core\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:52:44'),
(1373, 188, 'api_access', '{\"endpoint\":\"\\/api\\/subscriptions\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:52:44'),
(1374, 188, 'api_access', '{\"endpoint\":\"\\/api\\/subscriptions\\/stats\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:52:44'),
(1375, 188, 'api_access', '{\"endpoint\":\"\\/api\\/system\\/settings\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:52:44'),
(1376, 188, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:52:44'),
(1377, 188, 'api_access', '{\"endpoint\":\"\\/api\\/user-activity\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:52:44'),
(1378, 188, 'api_access', '{\"endpoint\":\"\\/api\\/user-activity\\/recent\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:52:44'),
(1379, 188, 'api_access', '{\"endpoint\":\"\\/api\\/user-activity\\/stats\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:52:45'),
(1380, 188, 'api_access', '{\"endpoint\":\"\\/api\\/user-activity\\/audit-trail\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:52:45'),
(1381, 188, 'api_access', '{\"endpoint\":\"\\/api\\/users\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:52:45'),
(1382, 188, 'api_access', '{\"endpoint\":\"\\/api\\/superadmin\\/users\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:52:45'),
(1383, 188, 'api_access', '{\"endpoint\":\"\\/api\\/institutions\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:52:45'),
(1384, 188, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-03 21:58:33'),
(1385, 188, 'api_access', '{\"endpoint\":\"\\/api\\/academic-years\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:58:33'),
(1386, 188, 'api_access', '{\"endpoint\":\"\\/api\\/academic-years\\/current\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:58:34'),
(1387, 188, 'api_access', '{\"endpoint\":\"\\/api\\/announcements\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:58:34'),
(1388, 188, 'api_access', '{\"endpoint\":\"\\/api\\/assessments?course_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:58:34'),
(1389, 188, 'api_access', '{\"endpoint\":\"\\/api\\/assessment-categories\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:58:34'),
(1390, 188, 'api_access', '{\"endpoint\":\"\\/api\\/auth\\/me\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:58:34'),
(1391, 188, 'api_access', '{\"endpoint\":\"\\/api\\/classes\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:58:34'),
(1392, 188, 'api_access', '{\"endpoint\":\"\\/api\\/class-subjects\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:58:34'),
(1393, 188, 'api_access', '{\"endpoint\":\"\\/api\\/courses\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:58:35'),
(1394, 188, 'api_access', '{\"endpoint\":\"\\/api\\/course-content\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:58:36'),
(1395, 188, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:58:36'),
(1396, 152, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-03 21:58:38'),
(1397, 152, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/teacher\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:58:39'),
(1398, 162, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-03 21:58:40'),
(1399, 162, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/student\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:58:40'),
(1400, 182, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-03 21:58:40'),
(1401, 182, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/parent\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:58:40'),
(1402, 188, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/superadmin\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:58:40'),
(1403, 188, 'api_access', '{\"endpoint\":\"\\/api\\/error-logs\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:58:40'),
(1404, 188, 'api_access', '{\"endpoint\":\"\\/api\\/error-logs\\/unresolved\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:58:40'),
(1405, 188, 'api_access', '{\"endpoint\":\"\\/api\\/events\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:58:42'),
(1406, 188, 'api_access', '{\"endpoint\":\"\\/api\\/events\\/upcoming\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:58:42'),
(1407, 188, 'api_access', '{\"endpoint\":\"\\/api\\/events\\/calendar\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:58:42'),
(1408, 188, 'api_access', '{\"endpoint\":\"\\/api\\/events\\/academic-calendar\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:58:43'),
(1409, 188, 'api_access', '{\"endpoint\":\"\\/api\\/grade-levels\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:58:43'),
(1410, 188, 'api_access', '{\"endpoint\":\"\\/api\\/grade-levels\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:58:43'),
(1411, 188, 'api_access', '{\"endpoint\":\"\\/api\\/grade-reports\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:58:43'),
(1412, 188, 'api_access', '{\"endpoint\":\"\\/api\\/grade-reports\\/stats\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:58:43'),
(1413, 188, 'api_access', '{\"endpoint\":\"\\/api\\/grade-scales\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:58:44'),
(1414, 188, 'api_access', '{\"endpoint\":\"\\/api\\/institutions\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:58:44'),
(1415, 188, 'api_access', '{\"endpoint\":\"\\/api\\/login-activity\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:58:44'),
(1416, 188, 'api_access', '{\"endpoint\":\"\\/api\\/login-activity\\/my-history\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:58:44'),
(1417, 188, 'api_access', '{\"endpoint\":\"\\/api\\/login-activity\\/recent\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:58:44'),
(1418, 188, 'api_access', '{\"endpoint\":\"\\/api\\/login-activity\\/failed\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:58:44'),
(1419, 188, 'api_access', '{\"endpoint\":\"\\/api\\/messages\\/inbox\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:58:44'),
(1420, 188, 'api_access', '{\"endpoint\":\"\\/api\\/messages\\/sent\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:58:44'),
(1421, 188, 'api_access', '{\"endpoint\":\"\\/api\\/messages\\/unread-count\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:58:44'),
(1422, 188, 'api_access', '{\"endpoint\":\"\\/api\\/notifications\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:58:44'),
(1423, 188, 'api_access', '{\"endpoint\":\"\\/api\\/notifications\\/summary\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:58:45'),
(1424, 188, 'api_access', '{\"endpoint\":\"\\/api\\/notifications\\/unread-count\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:58:45'),
(1425, 188, 'api_access', '{\"endpoint\":\"\\/api\\/parents\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:58:45'),
(1426, 188, 'api_access', '{\"endpoint\":\"\\/api\\/programs\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:58:45'),
(1427, 188, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:58:45'),
(1428, 188, 'api_access', '{\"endpoint\":\"\\/api\\/roles\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:58:45'),
(1429, 188, 'api_access', '{\"endpoint\":\"\\/api\\/permissions\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:58:45'),
(1430, 188, 'api_access', '{\"endpoint\":\"\\/api\\/semesters\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:58:45'),
(1431, 188, 'api_access', '{\"endpoint\":\"\\/api\\/semesters\\/current\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:58:45'),
(1432, 188, 'api_access', '{\"endpoint\":\"\\/api\\/students\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:58:46'),
(1433, 188, 'api_access', '{\"endpoint\":\"\\/api\\/subjects\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:58:46'),
(1434, 188, 'api_access', '{\"endpoint\":\"\\/api\\/subjects\\/core\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:58:46'),
(1435, 188, 'api_access', '{\"endpoint\":\"\\/api\\/subscriptions\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:58:46'),
(1436, 188, 'api_access', '{\"endpoint\":\"\\/api\\/subscriptions\\/stats\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:58:46'),
(1437, 188, 'api_access', '{\"endpoint\":\"\\/api\\/system\\/settings\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:58:46'),
(1438, 188, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:58:46'),
(1439, 188, 'api_access', '{\"endpoint\":\"\\/api\\/user-activity\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:58:46'),
(1440, 188, 'api_access', '{\"endpoint\":\"\\/api\\/user-activity\\/recent\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:58:47'),
(1441, 188, 'api_access', '{\"endpoint\":\"\\/api\\/user-activity\\/stats\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:58:47'),
(1442, 188, 'api_access', '{\"endpoint\":\"\\/api\\/user-activity\\/audit-trail\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:58:47'),
(1443, 188, 'api_access', '{\"endpoint\":\"\\/api\\/users\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:58:47'),
(1444, 188, 'api_access', '{\"endpoint\":\"\\/api\\/superadmin\\/users\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:58:47'),
(1445, 188, 'api_access', '{\"endpoint\":\"\\/api\\/institutions\",\"method\":\"GET\"}', '::1', NULL, '2026-03-03 21:58:48'),
(1446, 1, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-06 01:48:13'),
(1447, 1, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-06 02:05:31'),
(1448, 147, 'login', '{\"ip\":\"127.0.0.1\"}', '127.0.0.1', NULL, '2026-03-06 02:16:49'),
(1449, 1, 'login', '{\"ip\":\"127.0.0.1\"}', '127.0.0.1', NULL, '2026-03-06 02:26:35'),
(1450, 1, 'login', '{\"ip\":\"127.0.0.1\"}', '127.0.0.1', NULL, '2026-03-06 02:42:51'),
(1451, 1, 'login', '{\"ip\":\"127.0.0.1\"}', '127.0.0.1', NULL, '2026-03-06 03:08:56'),
(1452, 1, 'login', '{\"ip\":\"127.0.0.1\"}', '127.0.0.1', NULL, '2026-03-06 03:20:48'),
(1453, 1, 'login', '{\"ip\":\"127.0.0.1\"}', '127.0.0.1', NULL, '2026-03-06 03:20:49'),
(1454, 1, 'login', '{\"ip\":\"127.0.0.1\"}', '127.0.0.1', NULL, '2026-03-06 03:20:50'),
(1455, 1, 'login', '{\"ip\":\"127.0.0.1\"}', '127.0.0.1', NULL, '2026-03-06 03:59:02'),
(1456, 1, 'login', '{\"ip\":\"127.0.0.1\"}', '127.0.0.1', NULL, '2026-03-06 04:32:06'),
(1457, 1, 'login', '{\"ip\":\"127.0.0.1\"}', '127.0.0.1', NULL, '2026-03-06 04:35:27'),
(1458, 1, 'login', '{\"ip\":\"127.0.0.1\"}', '127.0.0.1', NULL, '2026-03-06 04:35:52'),
(1459, 1, 'login', '{\"ip\":\"127.0.0.1\"}', '127.0.0.1', NULL, '2026-03-06 04:37:46'),
(1460, 1, 'login', '{\"ip\":\"127.0.0.1\"}', '127.0.0.1', NULL, '2026-03-06 04:37:46'),
(1461, 1, 'login', '{\"ip\":\"127.0.0.1\"}', '127.0.0.1', NULL, '2026-03-06 04:38:24'),
(1462, 1, 'login', '{\"ip\":\"127.0.0.1\"}', '127.0.0.1', NULL, '2026-03-06 04:39:53'),
(1463, 147, 'login', '{\"ip\":\"127.0.0.1\"}', '127.0.0.1', NULL, '2026-03-06 04:43:45'),
(1464, 1, 'login', '{\"ip\":\"127.0.0.1\"}', '127.0.0.1', NULL, '2026-03-06 04:48:50'),
(1465, 1, 'login', '{\"ip\":\"127.0.0.1\"}', '127.0.0.1', NULL, '2026-03-06 04:56:31'),
(1466, 1, 'login', '{\"ip\":\"127.0.0.1\"}', '127.0.0.1', NULL, '2026-03-06 04:57:41'),
(1467, 1, 'login', '{\"ip\":\"127.0.0.1\"}', '127.0.0.1', NULL, '2026-03-06 04:59:50'),
(1468, 1, 'login', '{\"ip\":\"127.0.0.1\"}', '127.0.0.1', NULL, '2026-03-06 05:12:46'),
(1469, 1, 'login', '{\"ip\":\"127.0.0.1\"}', '127.0.0.1', NULL, '2026-03-06 05:17:26'),
(1470, 1, 'login', '{\"ip\":\"127.0.0.1\"}', '127.0.0.1', NULL, '2026-03-06 05:19:58'),
(1471, 1, 'login', '{\"ip\":\"127.0.0.1\"}', '127.0.0.1', NULL, '2026-03-06 05:22:26'),
(1472, 1, 'login', '{\"ip\":\"127.0.0.1\"}', '127.0.0.1', NULL, '2026-03-06 05:26:12'),
(1473, 1, 'login', '{\"ip\":\"127.0.0.1\"}', '127.0.0.1', NULL, '2026-03-06 05:28:03'),
(1474, 1, 'login', '{\"ip\":\"127.0.0.1\"}', '127.0.0.1', NULL, '2026-03-06 05:44:49'),
(1475, 1, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/superadmin\",\"method\":\"GET\"}', '127.0.0.1', NULL, '2026-03-06 05:44:52'),
(1476, 1, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/superadmin\",\"method\":\"GET\"}', '127.0.0.1', NULL, '2026-03-06 05:44:53'),
(1477, 1, 'api_access', '{\"endpoint\":\"\\/api\\/auth\\/logout\",\"method\":\"POST\"}', '127.0.0.1', NULL, '2026-03-06 05:45:28'),
(1478, 1, 'logout', '{\"ip\":\"127.0.0.1\"}', '127.0.0.1', NULL, '2026-03-06 05:45:28'),
(1479, 147, 'login', '{\"ip\":\"127.0.0.1\"}', '127.0.0.1', NULL, '2026-03-06 05:45:58'),
(1480, 1, 'login', '{\"ip\":\"127.0.0.1\"}', '127.0.0.1', NULL, '2026-03-06 05:48:31'),
(1481, 1, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/superadmin\",\"method\":\"GET\"}', '127.0.0.1', NULL, '2026-03-06 05:48:34'),
(1482, 1, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/superadmin\",\"method\":\"GET\"}', '127.0.0.1', NULL, '2026-03-06 05:48:35'),
(1483, 1, 'api_access', '{\"endpoint\":\"\\/api\\/auth\\/logout\",\"method\":\"POST\"}', '127.0.0.1', NULL, '2026-03-06 05:48:53'),
(1484, 1, 'logout', '{\"ip\":\"127.0.0.1\"}', '127.0.0.1', NULL, '2026-03-06 05:48:53'),
(1485, 1, 'login', '{\"ip\":\"127.0.0.1\"}', '127.0.0.1', NULL, '2026-03-06 06:11:21'),
(1486, 1, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/superadmin\",\"method\":\"GET\"}', '127.0.0.1', NULL, '2026-03-06 06:11:24'),
(1487, 1, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/superadmin\",\"method\":\"GET\"}', '127.0.0.1', NULL, '2026-03-06 06:11:25'),
(1488, 1, 'api_access', '{\"endpoint\":\"\\/api\\/institutions?page=1&per_page=10&limit=10&include_all=1&include_admins=1\",\"method\":\"GET\"}', '127.0.0.1', NULL, '2026-03-06 06:12:09'),
(1489, 1, 'login', '{\"ip\":\"127.0.0.1\"}', '127.0.0.1', NULL, '2026-03-06 06:26:20'),
(1490, 1, 'login', '{\"ip\":\"127.0.0.1\"}', '127.0.0.1', NULL, '2026-03-06 06:26:38'),
(1491, 1, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/superadmin\",\"method\":\"GET\"}', '127.0.0.1', NULL, '2026-03-06 06:26:40'),
(1492, 1, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/superadmin\",\"method\":\"GET\"}', '127.0.0.1', NULL, '2026-03-06 06:26:41'),
(1493, 1, 'api_access', '{\"endpoint\":\"\\/api\\/auth\\/logout\",\"method\":\"POST\"}', '127.0.0.1', NULL, '2026-03-06 06:26:56'),
(1494, 1, 'logout', '{\"ip\":\"127.0.0.1\"}', '127.0.0.1', NULL, '2026-03-06 06:26:56'),
(1495, 1, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/superadmin\",\"method\":\"GET\"}', '127.0.0.1', NULL, '2026-03-06 06:32:11'),
(1496, 1, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/superadmin\",\"method\":\"GET\"}', '127.0.0.1', NULL, '2026-03-06 06:36:25'),
(1497, 1, 'api_access', '{\"endpoint\":\"\\/api\\/auth\\/logout\",\"method\":\"POST\"}', '127.0.0.1', NULL, '2026-03-06 06:36:26'),
(1498, 1, 'logout', '{\"ip\":\"127.0.0.1\"}', '127.0.0.1', NULL, '2026-03-06 06:36:26'),
(1499, 1, 'password_reset_requested', '{\"ip\":\"127.0.0.1\",\"email\":\"benedictamankwa18@gmail.com\"}', '127.0.0.1', NULL, '2026-03-06 06:42:19'),
(1500, 1, 'password_reset_requested', '{\"ip\":\"127.0.0.1\",\"email\":\"benedictamankwa18@gmail.com\"}', '127.0.0.1', NULL, '2026-03-06 07:06:52'),
(1501, 1, 'password_reset_requested', '{\"ip\":\"127.0.0.1\",\"email\":\"benedictamankwa18@gmail.com\",\"email_sent\":true}', '127.0.0.1', NULL, '2026-03-06 07:42:27'),
(1502, 1, 'password_reset_requested', '{\"ip\":\"127.0.0.1\",\"email\":\"benedictamankwa18@gmail.com\",\"email_sent\":true}', '127.0.0.1', NULL, '2026-03-06 07:50:58'),
(1503, 1, 'password_reset_requested', '{\"ip\":\"127.0.0.1\",\"email\":\"benedictamankwa18@gmail.com\",\"email_sent\":true}', '127.0.0.1', NULL, '2026-03-06 09:22:02'),
(1504, 1, 'password_reset_requested', '{\"ip\":\"127.0.0.1\",\"email\":\"benedictamankwa18@gmail.com\",\"email_sent\":true}', '127.0.0.1', NULL, '2026-03-06 09:33:01'),
(1505, 1, 'password_reset_requested', '{\"ip\":\"127.0.0.1\",\"email\":\"benedictamankwa18@gmail.com\",\"email_sent\":true}', '127.0.0.1', NULL, '2026-03-06 09:50:37'),
(1506, 1, 'password_reset_requested', '{\"ip\":\"127.0.0.1\",\"email\":\"benedictamankwa18@gmail.com\",\"email_sent\":true}', '127.0.0.1', NULL, '2026-03-06 10:03:51');
INSERT INTO `user_activity` (`activity_id`, `user_id`, `activity_type`, `activity_details`, `ip_address`, `user_agent`, `created_at`) VALUES
(1507, 1, 'password_reset_requested', '{\"ip\":\"127.0.0.1\",\"email\":\"benedictamankwa18@gmail.com\",\"email_sent\":false}', '127.0.0.1', NULL, '2026-03-06 10:08:40'),
(1508, 1, 'password_reset_requested', '{\"ip\":\"127.0.0.1\",\"email\":\"benedictamankwa18@gmail.com\",\"email_sent\":true}', '127.0.0.1', NULL, '2026-03-06 10:11:10'),
(1509, 1, 'password_reset_requested', '{\"ip\":\"127.0.0.1\",\"email\":\"benedictamankwa18@gmail.com\",\"email_sent\":true}', '127.0.0.1', NULL, '2026-03-06 10:16:53'),
(1510, 1, 'password_reset_requested', '{\"ip\":\"127.0.0.1\",\"email\":\"benedictamankwa18@gmail.com\",\"email_sent\":true}', '127.0.0.1', NULL, '2026-03-06 10:20:47'),
(1511, 1, 'password_reset_requested', '{\"ip\":\"127.0.0.1\",\"email\":\"benedictamankwa18@gmail.com\",\"email_sent\":true}', '127.0.0.1', NULL, '2026-03-06 10:31:05'),
(1512, 1, 'password_reset_completed', '{\"ip\":\"127.0.0.1\"}', '127.0.0.1', NULL, '2026-03-06 10:32:28'),
(1513, 1, 'login', '{\"ip\":\"127.0.0.1\"}', '127.0.0.1', NULL, '2026-03-06 10:33:15'),
(1514, 1, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/superadmin\",\"method\":\"GET\"}', '127.0.0.1', NULL, '2026-03-06 10:33:19'),
(1515, 1, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/superadmin\",\"method\":\"GET\"}', '127.0.0.1', NULL, '2026-03-06 10:33:20'),
(1516, 1, 'api_access', '{\"endpoint\":\"\\/api\\/auth\\/logout\",\"method\":\"POST\"}', '127.0.0.1', NULL, '2026-03-06 10:33:38'),
(1517, 1, 'logout', '{\"ip\":\"127.0.0.1\"}', '127.0.0.1', NULL, '2026-03-06 10:33:38'),
(1518, 147, 'login', '{\"ip\":\"127.0.0.1\"}', '127.0.0.1', NULL, '2026-03-06 10:35:45'),
(1519, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin\",\"method\":\"GET\"}', '127.0.0.1', NULL, '2026-03-06 10:35:48'),
(1520, 147, 'api_access', '{\"endpoint\":\"\\/api\\/auth\\/logout\",\"method\":\"POST\"}', '127.0.0.1', NULL, '2026-03-06 10:36:11'),
(1521, 147, 'logout', '{\"ip\":\"127.0.0.1\"}', '127.0.0.1', NULL, '2026-03-06 10:36:11'),
(1522, 152, 'login', '{\"ip\":\"127.0.0.1\"}', '127.0.0.1', NULL, '2026-03-06 10:36:46'),
(1523, 152, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/teacher\",\"method\":\"GET\"}', '127.0.0.1', NULL, '2026-03-06 10:36:50'),
(1524, 152, 'api_access', '{\"endpoint\":\"\\/api\\/auth\\/logout\",\"method\":\"POST\"}', '127.0.0.1', NULL, '2026-03-06 10:37:00'),
(1525, 152, 'logout', '{\"ip\":\"127.0.0.1\"}', '127.0.0.1', NULL, '2026-03-06 10:37:00'),
(1526, 162, 'login', '{\"ip\":\"127.0.0.1\"}', '127.0.0.1', NULL, '2026-03-06 10:37:14'),
(1527, 162, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/student\",\"method\":\"GET\"}', '127.0.0.1', NULL, '2026-03-06 10:37:17'),
(1528, 162, 'api_access', '{\"endpoint\":\"\\/api\\/auth\\/logout\",\"method\":\"POST\"}', '127.0.0.1', NULL, '2026-03-06 10:38:22'),
(1529, 162, 'logout', '{\"ip\":\"127.0.0.1\"}', '127.0.0.1', NULL, '2026-03-06 10:38:22'),
(1530, 182, 'login', '{\"ip\":\"127.0.0.1\"}', '127.0.0.1', NULL, '2026-03-06 10:38:30'),
(1531, 182, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/parent\",\"method\":\"GET\"}', '127.0.0.1', NULL, '2026-03-06 10:38:33'),
(1532, 182, 'api_access', '{\"endpoint\":\"\\/api\\/auth\\/logout\",\"method\":\"POST\"}', '127.0.0.1', NULL, '2026-03-06 10:39:10'),
(1533, 182, 'logout', '{\"ip\":\"127.0.0.1\"}', '127.0.0.1', NULL, '2026-03-06 10:39:10'),
(1534, 1, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-08 00:34:51'),
(1535, 1, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/superadmin\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 00:34:54'),
(1536, 1, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/superadmin\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 00:34:55'),
(1537, 1, 'api_access', '{\"endpoint\":\"\\/api\\/auth\\/logout\",\"method\":\"POST\"}', '::1', NULL, '2026-03-08 00:35:41'),
(1538, 1, 'logout', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-08 00:35:41'),
(1539, 147, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-08 00:35:44'),
(1540, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 00:35:51'),
(1541, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 00:40:51'),
(1542, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 00:45:50'),
(1543, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 00:50:50'),
(1544, 1, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-08 05:11:17'),
(1545, 1, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/superadmin\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 05:11:19'),
(1546, 1, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/superadmin\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 05:11:20'),
(1547, 1, 'api_access', '{\"endpoint\":\"\\/api\\/institutions?page=1&per_page=10&limit=10&include_all=1&include_admins=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 05:11:30'),
(1548, 1, 'api_access', '{\"endpoint\":\"\\/api\\/institutions?page=1&per_page=10&limit=10&include_all=1&include_admins=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 05:11:37'),
(1549, 1, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/superadmin\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 05:16:19'),
(1550, 1, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/superadmin\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 05:16:53'),
(1551, 1, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/superadmin\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 05:16:53'),
(1552, 1, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/superadmin\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 05:19:33'),
(1553, 1, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/superadmin\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 05:19:34'),
(1554, 1, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/superadmin\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 05:19:55'),
(1555, 1, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/superadmin\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 05:19:55'),
(1556, 1, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/superadmin\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 05:20:05'),
(1557, 1, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/superadmin\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 05:20:06'),
(1558, 1, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/superadmin\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 05:21:43'),
(1559, 1, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/superadmin\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 05:21:43'),
(1560, 1, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/superadmin\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 05:22:16'),
(1561, 1, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/superadmin\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 05:22:17'),
(1562, 1, 'api_access', '{\"endpoint\":\"\\/api\\/auth\\/logout\",\"method\":\"POST\"}', '::1', NULL, '2026-03-08 05:25:49'),
(1563, 1, 'logout', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-08 05:25:49'),
(1564, 1, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-08 05:27:27'),
(1565, 1, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/superadmin\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 05:27:29'),
(1566, 1, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/superadmin\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 05:27:29'),
(1567, 1, 'api_access', '{\"endpoint\":\"\\/api\\/auth\\/logout\",\"method\":\"POST\"}', '::1', NULL, '2026-03-08 05:28:14'),
(1568, 1, 'logout', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-08 05:28:14'),
(1569, 1, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-08 05:28:27'),
(1570, 1, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/superadmin\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 05:28:28'),
(1571, 1, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/superadmin\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 05:28:28'),
(1572, 1, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/superadmin\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 05:33:29'),
(1573, 1, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/superadmin\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 05:38:29'),
(1574, 1, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/superadmin\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:06:24'),
(1575, 188, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-08 06:08:48'),
(1576, 188, 'api_access', '{\"endpoint\":\"\\/api\\/academic-years\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:08:48'),
(1577, 188, 'api_access', '{\"endpoint\":\"\\/api\\/academic-years\\/current\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:08:48'),
(1578, 188, 'api_access', '{\"endpoint\":\"\\/api\\/announcements\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:08:48'),
(1579, 188, 'api_access', '{\"endpoint\":\"\\/api\\/assessments?course_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:08:48'),
(1580, 188, 'api_access', '{\"endpoint\":\"\\/api\\/assessment-categories\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:08:48'),
(1581, 188, 'api_access', '{\"endpoint\":\"\\/api\\/auth\\/me\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:08:48'),
(1582, 188, 'api_access', '{\"endpoint\":\"\\/api\\/classes\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:08:48'),
(1583, 188, 'api_access', '{\"endpoint\":\"\\/api\\/class-subjects\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:08:49'),
(1584, 188, 'api_access', '{\"endpoint\":\"\\/api\\/courses\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:08:49'),
(1585, 188, 'api_access', '{\"endpoint\":\"\\/api\\/course-content\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:08:49'),
(1586, 188, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:08:49'),
(1587, 152, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-08 06:08:49'),
(1588, 152, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/teacher\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:08:49'),
(1589, 162, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-08 06:08:49'),
(1590, 162, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/student\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:08:49'),
(1591, 182, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-08 06:08:49'),
(1592, 182, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/parent\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:08:49'),
(1593, 188, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/superadmin\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:08:49'),
(1594, 188, 'api_access', '{\"endpoint\":\"\\/api\\/error-logs\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:08:49'),
(1595, 188, 'api_access', '{\"endpoint\":\"\\/api\\/error-logs\\/unresolved\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:08:49'),
(1596, 188, 'api_access', '{\"endpoint\":\"\\/api\\/events\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:08:49'),
(1597, 188, 'api_access', '{\"endpoint\":\"\\/api\\/events\\/upcoming\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:08:49'),
(1598, 188, 'api_access', '{\"endpoint\":\"\\/api\\/events\\/calendar\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:08:49'),
(1599, 188, 'api_access', '{\"endpoint\":\"\\/api\\/events\\/academic-calendar\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:08:49'),
(1600, 188, 'api_access', '{\"endpoint\":\"\\/api\\/grade-levels\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:08:49'),
(1601, 188, 'api_access', '{\"endpoint\":\"\\/api\\/grade-levels\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:08:49'),
(1602, 188, 'api_access', '{\"endpoint\":\"\\/api\\/grade-reports\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:08:50'),
(1603, 188, 'api_access', '{\"endpoint\":\"\\/api\\/grade-reports\\/stats\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:08:50'),
(1604, 188, 'api_access', '{\"endpoint\":\"\\/api\\/grade-scales\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:08:50'),
(1605, 188, 'api_access', '{\"endpoint\":\"\\/api\\/institutions\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:08:50'),
(1606, 188, 'api_access', '{\"endpoint\":\"\\/api\\/login-activity\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:08:50'),
(1607, 188, 'api_access', '{\"endpoint\":\"\\/api\\/login-activity\\/my-history\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:08:50'),
(1608, 188, 'api_access', '{\"endpoint\":\"\\/api\\/login-activity\\/recent\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:08:50'),
(1609, 188, 'api_access', '{\"endpoint\":\"\\/api\\/login-activity\\/failed\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:08:50'),
(1610, 188, 'api_access', '{\"endpoint\":\"\\/api\\/messages\\/inbox\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:08:50'),
(1611, 188, 'api_access', '{\"endpoint\":\"\\/api\\/messages\\/sent\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:08:50'),
(1612, 188, 'api_access', '{\"endpoint\":\"\\/api\\/messages\\/unread-count\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:08:50'),
(1613, 188, 'api_access', '{\"endpoint\":\"\\/api\\/notifications\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:08:50'),
(1614, 188, 'api_access', '{\"endpoint\":\"\\/api\\/notifications\\/summary\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:08:50'),
(1615, 188, 'api_access', '{\"endpoint\":\"\\/api\\/notifications\\/unread-count\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:08:50'),
(1616, 188, 'api_access', '{\"endpoint\":\"\\/api\\/parents\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:08:50'),
(1617, 188, 'api_access', '{\"endpoint\":\"\\/api\\/programs\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:08:50'),
(1618, 188, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:08:50'),
(1619, 188, 'api_access', '{\"endpoint\":\"\\/api\\/roles\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:08:51'),
(1620, 188, 'api_access', '{\"endpoint\":\"\\/api\\/permissions\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:08:51'),
(1621, 188, 'api_access', '{\"endpoint\":\"\\/api\\/semesters\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:08:51'),
(1622, 188, 'api_access', '{\"endpoint\":\"\\/api\\/semesters\\/current\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:08:51'),
(1623, 188, 'api_access', '{\"endpoint\":\"\\/api\\/students\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:08:51'),
(1624, 188, 'api_access', '{\"endpoint\":\"\\/api\\/subjects\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:08:51'),
(1625, 188, 'api_access', '{\"endpoint\":\"\\/api\\/subjects\\/core\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:08:51'),
(1626, 188, 'api_access', '{\"endpoint\":\"\\/api\\/subscriptions\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:08:51'),
(1627, 188, 'api_access', '{\"endpoint\":\"\\/api\\/subscriptions\\/stats\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:08:51'),
(1628, 188, 'api_access', '{\"endpoint\":\"\\/api\\/superadmin-activity?page=1&limit=25\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:08:51'),
(1629, 188, 'api_access', '{\"endpoint\":\"\\/api\\/superadmin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:08:51'),
(1630, 188, 'api_access', '{\"endpoint\":\"\\/api\\/superadmin-activity\\/stats\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:08:51'),
(1631, 188, 'api_access', '{\"endpoint\":\"\\/api\\/superadmin-activity\\/type\\/institution_created\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:08:51'),
(1632, 188, 'api_access', '{\"endpoint\":\"\\/api\\/superadmin-activity\\/severity\\/info\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:08:51'),
(1633, 188, 'api_access', '{\"endpoint\":\"\\/api\\/superadmin-activity\\/severity\\/warning\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:08:51'),
(1634, 188, 'api_access', '{\"endpoint\":\"\\/api\\/superadmin-activity\\/severity\\/critical\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:08:51'),
(1635, 188, 'api_access', '{\"endpoint\":\"\\/api\\/superadmin-activity\\/performer\\/1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:08:51'),
(1636, 188, 'api_access', '{\"endpoint\":\"\\/api\\/superadmin-activity\\/severity\\/invalid\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:08:51'),
(1637, 188, 'api_access', '{\"endpoint\":\"\\/api\\/superadmin-activity\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:08:51'),
(1638, 188, 'api_access', '{\"endpoint\":\"\\/api\\/system\\/settings\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:08:52'),
(1639, 188, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:08:52'),
(1640, 188, 'api_access', '{\"endpoint\":\"\\/api\\/user-activity\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:08:52'),
(1641, 188, 'api_access', '{\"endpoint\":\"\\/api\\/user-activity\\/recent\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:08:52'),
(1642, 188, 'api_access', '{\"endpoint\":\"\\/api\\/user-activity\\/stats\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:08:52'),
(1643, 188, 'api_access', '{\"endpoint\":\"\\/api\\/user-activity\\/audit-trail\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:08:52'),
(1644, 188, 'api_access', '{\"endpoint\":\"\\/api\\/users\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:08:52'),
(1645, 188, 'api_access', '{\"endpoint\":\"\\/api\\/superadmin\\/users\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:08:52'),
(1646, 188, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-08 06:10:24'),
(1647, 188, 'api_access', '{\"endpoint\":\"\\/api\\/academic-years\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:10:24'),
(1648, 188, 'api_access', '{\"endpoint\":\"\\/api\\/academic-years\\/current\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:10:24'),
(1649, 188, 'api_access', '{\"endpoint\":\"\\/api\\/announcements\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:10:24'),
(1650, 188, 'api_access', '{\"endpoint\":\"\\/api\\/assessments?course_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:10:24'),
(1651, 188, 'api_access', '{\"endpoint\":\"\\/api\\/assessment-categories\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:10:24'),
(1652, 188, 'api_access', '{\"endpoint\":\"\\/api\\/auth\\/me\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:10:24'),
(1653, 188, 'api_access', '{\"endpoint\":\"\\/api\\/classes\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:10:24'),
(1654, 188, 'api_access', '{\"endpoint\":\"\\/api\\/class-subjects\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:10:24'),
(1655, 188, 'api_access', '{\"endpoint\":\"\\/api\\/courses\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:10:24'),
(1656, 188, 'api_access', '{\"endpoint\":\"\\/api\\/course-content\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:10:25'),
(1657, 188, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:10:25'),
(1658, 152, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-08 06:10:25'),
(1659, 152, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/teacher\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:10:25'),
(1660, 162, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-08 06:10:25'),
(1661, 162, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/student\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:10:25'),
(1662, 182, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-08 06:10:25'),
(1663, 182, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/parent\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:10:25'),
(1664, 188, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/superadmin\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:10:25'),
(1665, 188, 'api_access', '{\"endpoint\":\"\\/api\\/error-logs\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:10:25'),
(1666, 188, 'api_access', '{\"endpoint\":\"\\/api\\/error-logs\\/unresolved\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:10:25'),
(1667, 188, 'api_access', '{\"endpoint\":\"\\/api\\/events\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:10:25'),
(1668, 188, 'api_access', '{\"endpoint\":\"\\/api\\/events\\/upcoming\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:10:25'),
(1669, 188, 'api_access', '{\"endpoint\":\"\\/api\\/events\\/calendar\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:10:25'),
(1670, 188, 'api_access', '{\"endpoint\":\"\\/api\\/events\\/academic-calendar\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:10:25'),
(1671, 188, 'api_access', '{\"endpoint\":\"\\/api\\/grade-levels\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:10:25'),
(1672, 188, 'api_access', '{\"endpoint\":\"\\/api\\/grade-levels\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:10:25'),
(1673, 188, 'api_access', '{\"endpoint\":\"\\/api\\/grade-reports\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:10:25'),
(1674, 188, 'api_access', '{\"endpoint\":\"\\/api\\/grade-reports\\/stats\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:10:25'),
(1675, 188, 'api_access', '{\"endpoint\":\"\\/api\\/grade-scales\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:10:25'),
(1676, 188, 'api_access', '{\"endpoint\":\"\\/api\\/institutions\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:10:25'),
(1677, 188, 'api_access', '{\"endpoint\":\"\\/api\\/login-activity\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:10:26'),
(1678, 188, 'api_access', '{\"endpoint\":\"\\/api\\/login-activity\\/my-history\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:10:26'),
(1679, 188, 'api_access', '{\"endpoint\":\"\\/api\\/login-activity\\/recent\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:10:26'),
(1680, 188, 'api_access', '{\"endpoint\":\"\\/api\\/login-activity\\/failed\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:10:26'),
(1681, 188, 'api_access', '{\"endpoint\":\"\\/api\\/messages\\/inbox\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:10:26'),
(1682, 188, 'api_access', '{\"endpoint\":\"\\/api\\/messages\\/sent\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:10:26'),
(1683, 188, 'api_access', '{\"endpoint\":\"\\/api\\/messages\\/unread-count\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:10:26'),
(1684, 188, 'api_access', '{\"endpoint\":\"\\/api\\/notifications\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:10:26'),
(1685, 188, 'api_access', '{\"endpoint\":\"\\/api\\/notifications\\/summary\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:10:26'),
(1686, 188, 'api_access', '{\"endpoint\":\"\\/api\\/notifications\\/unread-count\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:10:26'),
(1687, 188, 'api_access', '{\"endpoint\":\"\\/api\\/parents\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:10:26'),
(1688, 188, 'api_access', '{\"endpoint\":\"\\/api\\/programs\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:10:26'),
(1689, 188, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:10:26'),
(1690, 188, 'api_access', '{\"endpoint\":\"\\/api\\/roles\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:10:26'),
(1691, 188, 'api_access', '{\"endpoint\":\"\\/api\\/permissions\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:10:26'),
(1692, 188, 'api_access', '{\"endpoint\":\"\\/api\\/semesters\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:10:26'),
(1693, 188, 'api_access', '{\"endpoint\":\"\\/api\\/semesters\\/current\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:10:26'),
(1694, 188, 'api_access', '{\"endpoint\":\"\\/api\\/students\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:10:26'),
(1695, 188, 'api_access', '{\"endpoint\":\"\\/api\\/subjects\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:10:26'),
(1696, 188, 'api_access', '{\"endpoint\":\"\\/api\\/subjects\\/core\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:10:26'),
(1697, 188, 'api_access', '{\"endpoint\":\"\\/api\\/subscriptions\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:10:26'),
(1698, 188, 'api_access', '{\"endpoint\":\"\\/api\\/subscriptions\\/stats\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:10:26'),
(1699, 188, 'api_access', '{\"endpoint\":\"\\/api\\/superadmin-activity?page=1&limit=25\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:10:26'),
(1700, 188, 'api_access', '{\"endpoint\":\"\\/api\\/superadmin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:10:26'),
(1701, 188, 'api_access', '{\"endpoint\":\"\\/api\\/superadmin-activity\\/stats\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:10:26'),
(1702, 188, 'api_access', '{\"endpoint\":\"\\/api\\/superadmin-activity\\/type\\/institution_created\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:10:26'),
(1703, 188, 'api_access', '{\"endpoint\":\"\\/api\\/superadmin-activity\\/severity\\/info\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:10:26'),
(1704, 188, 'api_access', '{\"endpoint\":\"\\/api\\/superadmin-activity\\/severity\\/warning\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:10:26'),
(1705, 188, 'api_access', '{\"endpoint\":\"\\/api\\/superadmin-activity\\/severity\\/critical\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:10:26'),
(1706, 188, 'api_access', '{\"endpoint\":\"\\/api\\/superadmin-activity\\/performer\\/1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:10:27'),
(1707, 188, 'api_access', '{\"endpoint\":\"\\/api\\/superadmin-activity\",\"method\":\"POST\"}', '::1', NULL, '2026-03-08 06:10:27'),
(1708, 188, 'api_access', '{\"endpoint\":\"\\/api\\/superadmin-activity\\/severity\\/invalid\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:10:27'),
(1709, 188, 'api_access', '{\"endpoint\":\"\\/api\\/superadmin-activity\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:10:27'),
(1710, 188, 'api_access', '{\"endpoint\":\"\\/api\\/superadmin-activity\\/cleanup?days=9999\",\"method\":\"DELETE\"}', '::1', NULL, '2026-03-08 06:10:27'),
(1711, 188, 'api_access', '{\"endpoint\":\"\\/api\\/system\\/settings\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:10:27'),
(1712, 188, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:10:27'),
(1713, 188, 'api_access', '{\"endpoint\":\"\\/api\\/user-activity\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:10:27'),
(1714, 188, 'api_access', '{\"endpoint\":\"\\/api\\/user-activity\\/recent\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:10:27'),
(1715, 188, 'api_access', '{\"endpoint\":\"\\/api\\/user-activity\\/stats\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:10:27'),
(1716, 188, 'api_access', '{\"endpoint\":\"\\/api\\/user-activity\\/audit-trail\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:10:27'),
(1717, 188, 'api_access', '{\"endpoint\":\"\\/api\\/users\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:10:27'),
(1718, 188, 'api_access', '{\"endpoint\":\"\\/api\\/superadmin\\/users\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:10:27'),
(1719, 188, 'api_access', '{\"endpoint\":\"\\/api\\/institutions\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:10:27'),
(1720, 188, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-08 06:11:35'),
(1721, 188, 'api_access', '{\"endpoint\":\"\\/api\\/academic-years\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:11:35'),
(1722, 188, 'api_access', '{\"endpoint\":\"\\/api\\/academic-years\\/current\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:11:35'),
(1723, 188, 'api_access', '{\"endpoint\":\"\\/api\\/announcements\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:11:35'),
(1724, 188, 'api_access', '{\"endpoint\":\"\\/api\\/assessments?course_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:11:35'),
(1725, 188, 'api_access', '{\"endpoint\":\"\\/api\\/assessment-categories\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:11:35'),
(1726, 188, 'api_access', '{\"endpoint\":\"\\/api\\/auth\\/me\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:11:35'),
(1727, 188, 'api_access', '{\"endpoint\":\"\\/api\\/classes\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:11:36'),
(1728, 188, 'api_access', '{\"endpoint\":\"\\/api\\/class-subjects\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:11:36'),
(1729, 188, 'api_access', '{\"endpoint\":\"\\/api\\/courses\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:11:36'),
(1730, 188, 'api_access', '{\"endpoint\":\"\\/api\\/course-content\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:11:36'),
(1731, 188, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:11:36'),
(1732, 152, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-08 06:11:36'),
(1733, 152, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/teacher\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:11:36'),
(1734, 162, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-08 06:11:36'),
(1735, 162, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/student\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:11:36'),
(1736, 182, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-08 06:11:36'),
(1737, 182, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/parent\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:11:36'),
(1738, 188, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/superadmin\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:11:36'),
(1739, 188, 'api_access', '{\"endpoint\":\"\\/api\\/error-logs\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:11:36'),
(1740, 188, 'api_access', '{\"endpoint\":\"\\/api\\/error-logs\\/unresolved\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:11:36'),
(1741, 188, 'api_access', '{\"endpoint\":\"\\/api\\/events\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:11:36'),
(1742, 188, 'api_access', '{\"endpoint\":\"\\/api\\/events\\/upcoming\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:11:36'),
(1743, 188, 'api_access', '{\"endpoint\":\"\\/api\\/events\\/calendar\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:11:36'),
(1744, 188, 'api_access', '{\"endpoint\":\"\\/api\\/events\\/academic-calendar\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:11:36'),
(1745, 188, 'api_access', '{\"endpoint\":\"\\/api\\/grade-levels\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:11:36'),
(1746, 188, 'api_access', '{\"endpoint\":\"\\/api\\/grade-levels\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:11:36'),
(1747, 188, 'api_access', '{\"endpoint\":\"\\/api\\/grade-reports\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:11:36'),
(1748, 188, 'api_access', '{\"endpoint\":\"\\/api\\/grade-reports\\/stats\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:11:37'),
(1749, 188, 'api_access', '{\"endpoint\":\"\\/api\\/grade-scales\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:11:37'),
(1750, 188, 'api_access', '{\"endpoint\":\"\\/api\\/institutions\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:11:37'),
(1751, 188, 'api_access', '{\"endpoint\":\"\\/api\\/login-activity\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:11:37'),
(1752, 188, 'api_access', '{\"endpoint\":\"\\/api\\/login-activity\\/my-history\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:11:37'),
(1753, 188, 'api_access', '{\"endpoint\":\"\\/api\\/login-activity\\/recent\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:11:37'),
(1754, 188, 'api_access', '{\"endpoint\":\"\\/api\\/login-activity\\/failed\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:11:37'),
(1755, 188, 'api_access', '{\"endpoint\":\"\\/api\\/messages\\/inbox\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:11:37'),
(1756, 188, 'api_access', '{\"endpoint\":\"\\/api\\/messages\\/sent\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:11:37'),
(1757, 188, 'api_access', '{\"endpoint\":\"\\/api\\/messages\\/unread-count\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:11:37'),
(1758, 188, 'api_access', '{\"endpoint\":\"\\/api\\/notifications\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:11:37'),
(1759, 188, 'api_access', '{\"endpoint\":\"\\/api\\/notifications\\/summary\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:11:37'),
(1760, 188, 'api_access', '{\"endpoint\":\"\\/api\\/notifications\\/unread-count\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:11:37'),
(1761, 188, 'api_access', '{\"endpoint\":\"\\/api\\/parents\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:11:37'),
(1762, 188, 'api_access', '{\"endpoint\":\"\\/api\\/programs\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:11:37'),
(1763, 188, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:11:37'),
(1764, 188, 'api_access', '{\"endpoint\":\"\\/api\\/roles\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:11:37'),
(1765, 188, 'api_access', '{\"endpoint\":\"\\/api\\/permissions\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:11:37'),
(1766, 188, 'api_access', '{\"endpoint\":\"\\/api\\/semesters\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:11:37'),
(1767, 188, 'api_access', '{\"endpoint\":\"\\/api\\/semesters\\/current\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:11:37'),
(1768, 188, 'api_access', '{\"endpoint\":\"\\/api\\/students\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:11:37'),
(1769, 188, 'api_access', '{\"endpoint\":\"\\/api\\/subjects\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:11:37'),
(1770, 188, 'api_access', '{\"endpoint\":\"\\/api\\/subjects\\/core\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:11:37'),
(1771, 188, 'api_access', '{\"endpoint\":\"\\/api\\/subscriptions\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:11:37'),
(1772, 188, 'api_access', '{\"endpoint\":\"\\/api\\/subscriptions\\/stats\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:11:37'),
(1773, 188, 'api_access', '{\"endpoint\":\"\\/api\\/superadmin-activity?page=1&limit=25\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:11:37'),
(1774, 188, 'api_access', '{\"endpoint\":\"\\/api\\/superadmin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:11:37'),
(1775, 188, 'api_access', '{\"endpoint\":\"\\/api\\/superadmin-activity\\/stats\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:11:37'),
(1776, 188, 'api_access', '{\"endpoint\":\"\\/api\\/superadmin-activity\\/type\\/institution_created\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:11:37'),
(1777, 188, 'api_access', '{\"endpoint\":\"\\/api\\/superadmin-activity\\/severity\\/info\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:11:37'),
(1778, 188, 'api_access', '{\"endpoint\":\"\\/api\\/superadmin-activity\\/severity\\/warning\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:11:37'),
(1779, 188, 'api_access', '{\"endpoint\":\"\\/api\\/superadmin-activity\\/severity\\/critical\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:11:38'),
(1780, 188, 'api_access', '{\"endpoint\":\"\\/api\\/superadmin-activity\\/performer\\/1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:11:38'),
(1781, 188, 'api_access', '{\"endpoint\":\"\\/api\\/superadmin-activity\\/severity\\/invalid\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:11:38'),
(1782, 188, 'api_access', '{\"endpoint\":\"\\/api\\/superadmin-activity\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:11:38'),
(1783, 188, 'api_access', '{\"endpoint\":\"\\/api\\/system\\/settings\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:11:38'),
(1784, 188, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:11:38'),
(1785, 188, 'api_access', '{\"endpoint\":\"\\/api\\/user-activity\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:11:38'),
(1786, 188, 'api_access', '{\"endpoint\":\"\\/api\\/user-activity\\/recent\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:11:38'),
(1787, 188, 'api_access', '{\"endpoint\":\"\\/api\\/user-activity\\/stats\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:11:38'),
(1788, 188, 'api_access', '{\"endpoint\":\"\\/api\\/user-activity\\/audit-trail\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:11:38'),
(1789, 188, 'api_access', '{\"endpoint\":\"\\/api\\/users\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:11:38'),
(1790, 188, 'api_access', '{\"endpoint\":\"\\/api\\/superadmin\\/users\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:11:38'),
(1791, 1, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/superadmin\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:13:27'),
(1792, 1, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/superadmin\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:13:27'),
(1793, 1, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/superadmin\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:13:30'),
(1794, 1, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/superadmin\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:13:30'),
(1795, 1, 'api_access', '{\"endpoint\":\"\\/api\\/auth\\/logout\",\"method\":\"POST\"}', '::1', NULL, '2026-03-08 06:13:35'),
(1796, 1, 'logout', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-08 06:13:35'),
(1797, 1, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-08 06:13:43'),
(1798, 1, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/superadmin\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:13:44'),
(1799, 1, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/superadmin\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:13:44'),
(1800, 1, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/superadmin\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:18:44'),
(1801, 1, 'api_access', '{\"endpoint\":\"\\/api\\/auth\\/logout\",\"method\":\"POST\"}', '::1', NULL, '2026-03-08 06:19:31'),
(1802, 1, 'logout', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-08 06:19:31'),
(1803, 1, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-08 06:19:51'),
(1804, 1, 'api_access', '{\"endpoint\":\"\\/api\\/institutions?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:20:10'),
(1805, 1, 'api_access', '{\"endpoint\":\"\\/api\\/institutions?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:21:14'),
(1806, 1, 'api_access', '{\"endpoint\":\"\\/api\\/institutions\\/f541726b-1746-11f1-8ccc-10653022c2a0\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:21:53'),
(1807, 1, 'api_access', '{\"endpoint\":\"\\/api\\/institutions\\/f5418874-1746-11f1-8ccc-10653022c2a0\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:22:35'),
(1808, 1, 'api_access', '{\"endpoint\":\"\\/api\\/institutions?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:22:47'),
(1809, 1, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-08 06:22:59'),
(1810, 1, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/superadmin\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:23:01'),
(1811, 1, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/superadmin\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:23:01'),
(1812, 1, 'api_access', '{\"endpoint\":\"\\/api\\/institutions?page=1&per_page=10&limit=10&include_all=1&include_admins=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:23:06'),
(1813, 1, 'api_access', '{\"endpoint\":\"\\/api\\/institutions\\/17\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:23:13'),
(1814, 1, 'api_access', '{\"endpoint\":\"\\/api\\/institutions\\/17\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:23:15'),
(1815, 1, 'api_access', '{\"endpoint\":\"\\/api\\/institutions\\/17\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:23:38'),
(1816, 1, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-08 06:29:02'),
(1817, 1, 'api_access', '{\"endpoint\":\"\\/api\\/academic-years\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:29:02'),
(1818, 1, 'api_access', '{\"endpoint\":\"\\/api\\/academic-years\\/current\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:29:02'),
(1819, 1, 'api_access', '{\"endpoint\":\"\\/api\\/announcements\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:29:03'),
(1820, 1, 'api_access', '{\"endpoint\":\"\\/api\\/assessments?course_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:29:03'),
(1821, 1, 'api_access', '{\"endpoint\":\"\\/api\\/assessment-categories\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:29:03'),
(1822, 1, 'api_access', '{\"endpoint\":\"\\/api\\/auth\\/me\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:29:03'),
(1823, 1, 'api_access', '{\"endpoint\":\"\\/api\\/classes\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:29:03'),
(1824, 1, 'api_access', '{\"endpoint\":\"\\/api\\/class-subjects\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:29:03'),
(1825, 1, 'api_access', '{\"endpoint\":\"\\/api\\/courses\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:29:03'),
(1826, 1, 'api_access', '{\"endpoint\":\"\\/api\\/course-content\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:29:03'),
(1827, 1, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:29:03'),
(1828, 152, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-08 06:29:03'),
(1829, 152, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/teacher\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:29:03'),
(1830, 162, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-08 06:29:03'),
(1831, 162, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/student\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:29:03'),
(1832, 182, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-08 06:29:03'),
(1833, 182, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/parent\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:29:03'),
(1834, 1, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/superadmin\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:29:03'),
(1835, 1, 'api_access', '{\"endpoint\":\"\\/api\\/error-logs\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:29:03'),
(1836, 1, 'api_access', '{\"endpoint\":\"\\/api\\/error-logs\\/unresolved\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:29:03'),
(1837, 1, 'api_access', '{\"endpoint\":\"\\/api\\/events\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:29:03'),
(1838, 1, 'api_access', '{\"endpoint\":\"\\/api\\/events\\/upcoming\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:29:03'),
(1839, 1, 'api_access', '{\"endpoint\":\"\\/api\\/events\\/calendar\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:29:04'),
(1840, 1, 'api_access', '{\"endpoint\":\"\\/api\\/events\\/academic-calendar\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:29:04'),
(1841, 1, 'api_access', '{\"endpoint\":\"\\/api\\/grade-levels\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:29:04'),
(1842, 1, 'api_access', '{\"endpoint\":\"\\/api\\/grade-levels\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:29:04'),
(1843, 1, 'api_access', '{\"endpoint\":\"\\/api\\/grade-reports\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:29:04'),
(1844, 1, 'api_access', '{\"endpoint\":\"\\/api\\/grade-reports\\/stats\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:29:04'),
(1845, 1, 'api_access', '{\"endpoint\":\"\\/api\\/grade-scales\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:29:04'),
(1846, 1, 'api_access', '{\"endpoint\":\"\\/api\\/institutions\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:29:04'),
(1847, 1, 'api_access', '{\"endpoint\":\"\\/api\\/login-activity\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:29:04'),
(1848, 1, 'api_access', '{\"endpoint\":\"\\/api\\/login-activity\\/my-history\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:29:04'),
(1849, 1, 'api_access', '{\"endpoint\":\"\\/api\\/login-activity\\/recent\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:29:04'),
(1850, 1, 'api_access', '{\"endpoint\":\"\\/api\\/login-activity\\/failed\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:29:04'),
(1851, 1, 'api_access', '{\"endpoint\":\"\\/api\\/messages\\/inbox\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:29:04'),
(1852, 1, 'api_access', '{\"endpoint\":\"\\/api\\/messages\\/sent\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:29:04'),
(1853, 1, 'api_access', '{\"endpoint\":\"\\/api\\/messages\\/unread-count\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:29:04'),
(1854, 1, 'api_access', '{\"endpoint\":\"\\/api\\/notifications\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:29:04'),
(1855, 1, 'api_access', '{\"endpoint\":\"\\/api\\/notifications\\/summary\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:29:04'),
(1856, 1, 'api_access', '{\"endpoint\":\"\\/api\\/notifications\\/unread-count\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:29:04'),
(1857, 1, 'api_access', '{\"endpoint\":\"\\/api\\/parents\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:29:04'),
(1858, 1, 'api_access', '{\"endpoint\":\"\\/api\\/programs\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:29:04'),
(1859, 1, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:29:04'),
(1860, 1, 'api_access', '{\"endpoint\":\"\\/api\\/roles\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:29:04'),
(1861, 1, 'api_access', '{\"endpoint\":\"\\/api\\/permissions\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:29:04'),
(1862, 1, 'api_access', '{\"endpoint\":\"\\/api\\/semesters\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:29:04'),
(1863, 1, 'api_access', '{\"endpoint\":\"\\/api\\/semesters\\/current\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:29:04'),
(1864, 1, 'api_access', '{\"endpoint\":\"\\/api\\/students\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:29:04'),
(1865, 1, 'api_access', '{\"endpoint\":\"\\/api\\/subjects\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:29:04'),
(1866, 1, 'api_access', '{\"endpoint\":\"\\/api\\/subjects\\/core\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:29:05'),
(1867, 1, 'api_access', '{\"endpoint\":\"\\/api\\/subscriptions\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:29:05'),
(1868, 1, 'api_access', '{\"endpoint\":\"\\/api\\/subscriptions\\/stats\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:29:05'),
(1869, 1, 'api_access', '{\"endpoint\":\"\\/api\\/superadmin-activity?page=1&limit=25\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:29:05'),
(1870, 1, 'api_access', '{\"endpoint\":\"\\/api\\/superadmin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:29:05'),
(1871, 1, 'api_access', '{\"endpoint\":\"\\/api\\/superadmin-activity\\/stats\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:29:05'),
(1872, 1, 'api_access', '{\"endpoint\":\"\\/api\\/superadmin-activity\\/type\\/institution_created\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:29:05'),
(1873, 1, 'api_access', '{\"endpoint\":\"\\/api\\/superadmin-activity\\/severity\\/info\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:29:05'),
(1874, 1, 'api_access', '{\"endpoint\":\"\\/api\\/superadmin-activity\\/severity\\/warning\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:29:05'),
(1875, 1, 'api_access', '{\"endpoint\":\"\\/api\\/superadmin-activity\\/severity\\/critical\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:29:05'),
(1876, 1, 'api_access', '{\"endpoint\":\"\\/api\\/superadmin-activity\\/performer\\/1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:29:05'),
(1877, 1, 'api_access', '{\"endpoint\":\"\\/api\\/superadmin-activity\\/severity\\/invalid\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:29:05'),
(1878, 1, 'api_access', '{\"endpoint\":\"\\/api\\/superadmin-activity\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:29:05'),
(1879, 1, 'api_access', '{\"endpoint\":\"\\/api\\/system\\/settings\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:29:05'),
(1880, 1, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:29:05'),
(1881, 1, 'api_access', '{\"endpoint\":\"\\/api\\/user-activity\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:29:05'),
(1882, 1, 'api_access', '{\"endpoint\":\"\\/api\\/user-activity\\/recent\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:29:05'),
(1883, 1, 'api_access', '{\"endpoint\":\"\\/api\\/user-activity\\/stats\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:29:05'),
(1884, 1, 'api_access', '{\"endpoint\":\"\\/api\\/user-activity\\/audit-trail\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:29:05'),
(1885, 1, 'api_access', '{\"endpoint\":\"\\/api\\/users\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:29:05'),
(1886, 1, 'api_access', '{\"endpoint\":\"\\/api\\/superadmin\\/users\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:29:05'),
(1887, 1, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/superadmin\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:29:54'),
(1888, 1, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/superadmin\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:30:00'),
(1889, 1, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/superadmin\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:30:01'),
(1890, 1, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/superadmin\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:30:08'),
(1891, 1, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/superadmin\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:30:09'),
(1892, 1, 'api_access', '{\"endpoint\":\"\\/api\\/institutions?page=1&per_page=10&limit=10&include_all=1&include_admins=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:30:10'),
(1893, 1, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/superadmin\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:30:14'),
(1894, 1, 'api_access', '{\"endpoint\":\"\\/api\\/institutions?page=1&per_page=10&limit=10&include_all=1&include_admins=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:30:14'),
(1895, 1, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/superadmin\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:30:15'),
(1896, 1, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/superadmin\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:30:19'),
(1897, 1, 'api_access', '{\"endpoint\":\"\\/api\\/institutions?page=1&per_page=10&limit=10&include_all=1&include_admins=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:30:20'),
(1898, 1, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/superadmin\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:30:20');
INSERT INTO `user_activity` (`activity_id`, `user_id`, `activity_type`, `activity_details`, `ip_address`, `user_agent`, `created_at`) VALUES
(1899, 1, 'api_access', '{\"endpoint\":\"\\/api\\/institutions?page=1&per_page=25&limit=25&include_all=1&include_admins=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:30:40'),
(1900, 1, 'api_access', '{\"endpoint\":\"\\/api\\/roles\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:31:21'),
(1901, 1, 'api_access', '{\"endpoint\":\"\\/api\\/institutions\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:31:21'),
(1902, 1, 'api_access', '{\"endpoint\":\"\\/api\\/superadmin\\/users?page=1&per_page=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:31:21'),
(1903, 1, 'api_access', '{\"endpoint\":\"\\/api\\/institutions?page=1&per_page=25&limit=25&include_all=1&include_admins=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:31:52'),
(1904, 1, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-08 06:33:17'),
(1905, 1, 'api_access', '{\"endpoint\":\"\\/api\\/academic-years\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:33:17'),
(1906, 1, 'api_access', '{\"endpoint\":\"\\/api\\/academic-years\\/current\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:33:17'),
(1907, 1, 'api_access', '{\"endpoint\":\"\\/api\\/announcements\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:33:17'),
(1908, 1, 'api_access', '{\"endpoint\":\"\\/api\\/assessments?course_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:33:17'),
(1909, 1, 'api_access', '{\"endpoint\":\"\\/api\\/assessment-categories\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:33:17'),
(1910, 1, 'api_access', '{\"endpoint\":\"\\/api\\/auth\\/me\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:33:17'),
(1911, 1, 'api_access', '{\"endpoint\":\"\\/api\\/classes\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:33:17'),
(1912, 1, 'api_access', '{\"endpoint\":\"\\/api\\/class-subjects\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:33:17'),
(1913, 1, 'api_access', '{\"endpoint\":\"\\/api\\/courses\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:33:17'),
(1914, 1, 'api_access', '{\"endpoint\":\"\\/api\\/course-content\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:33:17'),
(1915, 1, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:33:17'),
(1916, 152, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-08 06:33:17'),
(1917, 152, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/teacher\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:33:17'),
(1918, 162, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-08 06:33:17'),
(1919, 162, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/student\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:33:17'),
(1920, 182, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-08 06:33:17'),
(1921, 182, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/parent\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:33:17'),
(1922, 1, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/superadmin\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:33:17'),
(1923, 1, 'api_access', '{\"endpoint\":\"\\/api\\/error-logs\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:33:17'),
(1924, 1, 'api_access', '{\"endpoint\":\"\\/api\\/error-logs\\/unresolved\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:33:18'),
(1925, 1, 'api_access', '{\"endpoint\":\"\\/api\\/events\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:33:18'),
(1926, 1, 'api_access', '{\"endpoint\":\"\\/api\\/events\\/upcoming\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:33:18'),
(1927, 1, 'api_access', '{\"endpoint\":\"\\/api\\/events\\/calendar\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:33:18'),
(1928, 1, 'api_access', '{\"endpoint\":\"\\/api\\/events\\/academic-calendar\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:33:18'),
(1929, 1, 'api_access', '{\"endpoint\":\"\\/api\\/grade-levels\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:33:18'),
(1930, 1, 'api_access', '{\"endpoint\":\"\\/api\\/grade-levels\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:33:18'),
(1931, 1, 'api_access', '{\"endpoint\":\"\\/api\\/grade-reports\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:33:18'),
(1932, 1, 'api_access', '{\"endpoint\":\"\\/api\\/grade-reports\\/stats\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:33:18'),
(1933, 1, 'api_access', '{\"endpoint\":\"\\/api\\/grade-scales\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:33:18'),
(1934, 1, 'api_access', '{\"endpoint\":\"\\/api\\/institutions\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:33:18'),
(1935, 1, 'api_access', '{\"endpoint\":\"\\/api\\/login-activity\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:33:18'),
(1936, 1, 'api_access', '{\"endpoint\":\"\\/api\\/login-activity\\/my-history\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:33:18'),
(1937, 1, 'api_access', '{\"endpoint\":\"\\/api\\/login-activity\\/recent\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:33:18'),
(1938, 1, 'api_access', '{\"endpoint\":\"\\/api\\/login-activity\\/failed\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:33:18'),
(1939, 1, 'api_access', '{\"endpoint\":\"\\/api\\/messages\\/inbox\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:33:18'),
(1940, 1, 'api_access', '{\"endpoint\":\"\\/api\\/messages\\/sent\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:33:18'),
(1941, 1, 'api_access', '{\"endpoint\":\"\\/api\\/messages\\/unread-count\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:33:18'),
(1942, 1, 'api_access', '{\"endpoint\":\"\\/api\\/notifications\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:33:18'),
(1943, 1, 'api_access', '{\"endpoint\":\"\\/api\\/notifications\\/summary\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:33:18'),
(1944, 1, 'api_access', '{\"endpoint\":\"\\/api\\/notifications\\/unread-count\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:33:18'),
(1945, 1, 'api_access', '{\"endpoint\":\"\\/api\\/parents\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:33:18'),
(1946, 1, 'api_access', '{\"endpoint\":\"\\/api\\/programs\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:33:18'),
(1947, 1, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:33:18'),
(1948, 1, 'api_access', '{\"endpoint\":\"\\/api\\/roles\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:33:18'),
(1949, 1, 'api_access', '{\"endpoint\":\"\\/api\\/permissions\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:33:18'),
(1950, 1, 'api_access', '{\"endpoint\":\"\\/api\\/semesters\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:33:18'),
(1951, 1, 'api_access', '{\"endpoint\":\"\\/api\\/semesters\\/current\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:33:18'),
(1952, 1, 'api_access', '{\"endpoint\":\"\\/api\\/students\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:33:19'),
(1953, 1, 'api_access', '{\"endpoint\":\"\\/api\\/subjects\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:33:19'),
(1954, 1, 'api_access', '{\"endpoint\":\"\\/api\\/subjects\\/core\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:33:19'),
(1955, 1, 'api_access', '{\"endpoint\":\"\\/api\\/subscriptions\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:33:19'),
(1956, 1, 'api_access', '{\"endpoint\":\"\\/api\\/subscriptions\\/stats\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:33:19'),
(1957, 1, 'api_access', '{\"endpoint\":\"\\/api\\/superadmin-activity?page=1&limit=25\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:33:19'),
(1958, 1, 'api_access', '{\"endpoint\":\"\\/api\\/superadmin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:33:19'),
(1959, 1, 'api_access', '{\"endpoint\":\"\\/api\\/superadmin-activity\\/stats\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:33:19'),
(1960, 1, 'api_access', '{\"endpoint\":\"\\/api\\/superadmin-activity\\/type\\/institution_created\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:33:19'),
(1961, 1, 'api_access', '{\"endpoint\":\"\\/api\\/superadmin-activity\\/severity\\/info\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:33:19'),
(1962, 1, 'api_access', '{\"endpoint\":\"\\/api\\/superadmin-activity\\/severity\\/warning\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:33:19'),
(1963, 1, 'api_access', '{\"endpoint\":\"\\/api\\/superadmin-activity\\/severity\\/critical\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:33:19'),
(1964, 1, 'api_access', '{\"endpoint\":\"\\/api\\/superadmin-activity\\/performer\\/1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:33:19'),
(1965, 1, 'api_access', '{\"endpoint\":\"\\/api\\/superadmin-activity\\/severity\\/invalid\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:33:19'),
(1966, 1, 'api_access', '{\"endpoint\":\"\\/api\\/superadmin-activity\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:33:19'),
(1967, 1, 'api_access', '{\"endpoint\":\"\\/api\\/system\\/settings\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:33:19'),
(1968, 1, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:33:19'),
(1969, 1, 'api_access', '{\"endpoint\":\"\\/api\\/user-activity\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:33:19'),
(1970, 1, 'api_access', '{\"endpoint\":\"\\/api\\/user-activity\\/recent\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:33:19'),
(1971, 1, 'api_access', '{\"endpoint\":\"\\/api\\/user-activity\\/stats\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:33:19'),
(1972, 1, 'api_access', '{\"endpoint\":\"\\/api\\/user-activity\\/audit-trail\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:33:19'),
(1973, 1, 'api_access', '{\"endpoint\":\"\\/api\\/users\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:33:19'),
(1974, 1, 'api_access', '{\"endpoint\":\"\\/api\\/superadmin\\/users\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:33:19'),
(1975, 1, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/superadmin\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:35:20'),
(1976, 1, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/superadmin\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:40:20'),
(1977, 1, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/superadmin\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:45:20'),
(1978, 1, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-08 06:53:34'),
(1979, 1, 'api_access', '{\"endpoint\":\"\\/api\\/academic-years\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:53:34'),
(1980, 1, 'api_access', '{\"endpoint\":\"\\/api\\/academic-years\\/current\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:53:34'),
(1981, 1, 'api_access', '{\"endpoint\":\"\\/api\\/announcements\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:53:34'),
(1982, 1, 'api_access', '{\"endpoint\":\"\\/api\\/assessments?course_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:53:34'),
(1983, 1, 'api_access', '{\"endpoint\":\"\\/api\\/assessment-categories\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:53:34'),
(1984, 1, 'api_access', '{\"endpoint\":\"\\/api\\/auth\\/me\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:53:34'),
(1985, 1, 'api_access', '{\"endpoint\":\"\\/api\\/classes\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:53:34'),
(1986, 1, 'api_access', '{\"endpoint\":\"\\/api\\/class-subjects\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:53:34'),
(1987, 1, 'api_access', '{\"endpoint\":\"\\/api\\/courses\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:53:34'),
(1988, 1, 'api_access', '{\"endpoint\":\"\\/api\\/course-content\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:53:34'),
(1989, 1, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:53:34'),
(1990, 152, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-08 06:53:34'),
(1991, 152, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/teacher\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:53:34'),
(1992, 162, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-08 06:53:34'),
(1993, 162, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/student\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:53:34'),
(1994, 182, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-08 06:53:35'),
(1995, 182, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/parent\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:53:35'),
(1996, 1, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/superadmin\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:53:35'),
(1997, 1, 'api_access', '{\"endpoint\":\"\\/api\\/error-logs\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:53:35'),
(1998, 1, 'api_access', '{\"endpoint\":\"\\/api\\/error-logs\\/unresolved\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:53:35'),
(1999, 1, 'api_access', '{\"endpoint\":\"\\/api\\/events\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:53:35'),
(2000, 1, 'api_access', '{\"endpoint\":\"\\/api\\/events\\/upcoming\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:53:35'),
(2001, 1, 'api_access', '{\"endpoint\":\"\\/api\\/events\\/calendar\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:53:35'),
(2002, 1, 'api_access', '{\"endpoint\":\"\\/api\\/events\\/academic-calendar\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:53:35'),
(2003, 1, 'api_access', '{\"endpoint\":\"\\/api\\/grade-levels\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:53:35'),
(2004, 1, 'api_access', '{\"endpoint\":\"\\/api\\/grade-levels\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:53:35'),
(2005, 1, 'api_access', '{\"endpoint\":\"\\/api\\/grade-reports\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:53:35'),
(2006, 1, 'api_access', '{\"endpoint\":\"\\/api\\/grade-reports\\/stats\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:53:35'),
(2007, 1, 'api_access', '{\"endpoint\":\"\\/api\\/grade-scales\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:53:35'),
(2008, 1, 'api_access', '{\"endpoint\":\"\\/api\\/institutions\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:53:35'),
(2009, 1, 'api_access', '{\"endpoint\":\"\\/api\\/login-activity\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:53:35'),
(2010, 1, 'api_access', '{\"endpoint\":\"\\/api\\/login-activity\\/my-history\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:53:35'),
(2011, 1, 'api_access', '{\"endpoint\":\"\\/api\\/login-activity\\/recent\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:53:35'),
(2012, 1, 'api_access', '{\"endpoint\":\"\\/api\\/login-activity\\/failed\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:53:35'),
(2013, 1, 'api_access', '{\"endpoint\":\"\\/api\\/messages\\/inbox\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:53:35'),
(2014, 1, 'api_access', '{\"endpoint\":\"\\/api\\/messages\\/sent\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:53:35'),
(2015, 1, 'api_access', '{\"endpoint\":\"\\/api\\/messages\\/unread-count\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:53:35'),
(2016, 1, 'api_access', '{\"endpoint\":\"\\/api\\/notifications\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:53:35'),
(2017, 1, 'api_access', '{\"endpoint\":\"\\/api\\/notifications\\/summary\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:53:35'),
(2018, 1, 'api_access', '{\"endpoint\":\"\\/api\\/notifications\\/unread-count\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:53:35'),
(2019, 1, 'api_access', '{\"endpoint\":\"\\/api\\/parents\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:53:35'),
(2020, 1, 'api_access', '{\"endpoint\":\"\\/api\\/programs\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:53:36'),
(2021, 1, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:53:36'),
(2022, 1, 'api_access', '{\"endpoint\":\"\\/api\\/roles\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:53:36'),
(2023, 1, 'api_access', '{\"endpoint\":\"\\/api\\/permissions\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:53:36'),
(2024, 1, 'api_access', '{\"endpoint\":\"\\/api\\/semesters\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:53:36'),
(2025, 1, 'api_access', '{\"endpoint\":\"\\/api\\/semesters\\/current\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:53:36'),
(2026, 1, 'api_access', '{\"endpoint\":\"\\/api\\/students\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:53:36'),
(2027, 1, 'api_access', '{\"endpoint\":\"\\/api\\/subjects\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:53:36'),
(2028, 1, 'api_access', '{\"endpoint\":\"\\/api\\/subjects\\/core\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:53:36'),
(2029, 1, 'api_access', '{\"endpoint\":\"\\/api\\/subscriptions\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:53:36'),
(2030, 1, 'api_access', '{\"endpoint\":\"\\/api\\/subscriptions\\/stats\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:53:36'),
(2031, 1, 'api_access', '{\"endpoint\":\"\\/api\\/superadmin-activity?page=1&limit=25\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:53:36'),
(2032, 1, 'api_access', '{\"endpoint\":\"\\/api\\/superadmin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:53:36'),
(2033, 1, 'api_access', '{\"endpoint\":\"\\/api\\/superadmin-activity\\/stats\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:53:36'),
(2034, 1, 'api_access', '{\"endpoint\":\"\\/api\\/superadmin-activity\\/type\\/institution_created\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:53:36'),
(2035, 1, 'api_access', '{\"endpoint\":\"\\/api\\/superadmin-activity\\/severity\\/info\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:53:36'),
(2036, 1, 'api_access', '{\"endpoint\":\"\\/api\\/superadmin-activity\\/severity\\/warning\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:53:36'),
(2037, 1, 'api_access', '{\"endpoint\":\"\\/api\\/superadmin-activity\\/severity\\/critical\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:53:36'),
(2038, 1, 'api_access', '{\"endpoint\":\"\\/api\\/superadmin-activity\\/performer\\/1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:53:37'),
(2039, 1, 'api_access', '{\"endpoint\":\"\\/api\\/superadmin-activity\\/severity\\/invalid\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:53:37'),
(2040, 1, 'api_access', '{\"endpoint\":\"\\/api\\/superadmin-activity\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:53:37'),
(2041, 1, 'api_access', '{\"endpoint\":\"\\/api\\/system\\/settings\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:53:37'),
(2042, 1, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:53:37'),
(2043, 1, 'api_access', '{\"endpoint\":\"\\/api\\/user-activity\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:53:37'),
(2044, 1, 'api_access', '{\"endpoint\":\"\\/api\\/user-activity\\/recent\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:53:37'),
(2045, 1, 'api_access', '{\"endpoint\":\"\\/api\\/user-activity\\/stats\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:53:37'),
(2046, 1, 'api_access', '{\"endpoint\":\"\\/api\\/user-activity\\/audit-trail\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:53:37'),
(2047, 1, 'api_access', '{\"endpoint\":\"\\/api\\/users\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:53:37'),
(2048, 1, 'api_access', '{\"endpoint\":\"\\/api\\/superadmin\\/users\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:53:37'),
(2049, 1, 'api_access', '{\"endpoint\":\"\\/api\\/institutions?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:53:46'),
(2050, 1, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/superadmin\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:54:28'),
(2051, 1, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/superadmin\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:54:37'),
(2052, 1, 'api_access', '{\"endpoint\":\"\\/api\\/institutions?page=1&per_page=25&limit=25&include_all=1&include_admins=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:54:38'),
(2053, 1, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/superadmin\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:54:38'),
(2054, 1, 'api_access', '{\"endpoint\":\"\\/api\\/roles\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:55:33'),
(2055, 1, 'api_access', '{\"endpoint\":\"\\/api\\/institutions\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:55:33'),
(2056, 1, 'api_access', '{\"endpoint\":\"\\/api\\/institutions?include_all=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:55:33'),
(2057, 1, 'api_access', '{\"endpoint\":\"\\/api\\/superadmin\\/users?page=1&per_page=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:55:33'),
(2058, 1, 'api_access', '{\"endpoint\":\"\\/api\\/superadmin-activity?page=1&limit=25\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:58:23'),
(2059, 1, 'api_access', '{\"endpoint\":\"\\/api\\/superadmin-activity\",\"method\":\"POST\"}', '::1', NULL, '2026-03-08 06:58:33'),
(2060, 1, 'api_access', '{\"endpoint\":\"\\/api\\/superadmin-activity?page=1&limit=25\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:58:50'),
(2061, 1, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/superadmin\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 06:59:38'),
(2062, 1, 'api_access', '{\"endpoint\":\"\\/api\\/institutions\",\"method\":\"POST\"}', '::1', NULL, '2026-03-08 07:00:41'),
(2063, 1, 'api_access', '{\"endpoint\":\"\\/api\\/superadmin-activity?page=1&limit=25\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 07:00:49'),
(2064, 1, 'api_access', '{\"endpoint\":\"\\/api\\/superadmin-activity\\/1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 07:03:34'),
(2065, 1, 'api_access', '{\"endpoint\":\"\\/api\\/superadmin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 07:03:44'),
(2066, 1, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/superadmin\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 07:05:29'),
(2067, 1, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/superadmin\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 07:05:41'),
(2068, 1, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/superadmin\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 07:05:42'),
(2069, 1, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/superadmin\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 07:05:52'),
(2070, 1, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/superadmin\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 07:05:52'),
(2071, 1, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/superadmin\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 07:06:38'),
(2072, 1, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/superadmin\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 07:06:44'),
(2073, 1, 'api_access', '{\"endpoint\":\"\\/api\\/superadmin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 07:06:44'),
(2074, 1, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/superadmin\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 07:06:56'),
(2075, 1, 'api_access', '{\"endpoint\":\"\\/api\\/superadmin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 07:06:56'),
(2076, 1, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/superadmin\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 07:06:57'),
(2077, 1, 'api_access', '{\"endpoint\":\"\\/api\\/superadmin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 07:06:57'),
(2078, 1, 'api_access', '{\"endpoint\":\"\\/api\\/auth\\/logout\",\"method\":\"POST\"}', '::1', NULL, '2026-03-08 07:10:16'),
(2079, 1, 'logout', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-08 07:10:16'),
(2080, 147, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-08 07:10:22'),
(2081, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 07:10:24'),
(2082, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 07:15:06'),
(2083, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 07:20:06'),
(2084, 152, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-08 07:22:00'),
(2085, 152, 'api_access', '{\"endpoint\":\"\\/api\\/academic-years\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 07:22:00'),
(2086, 152, 'api_access', '{\"endpoint\":\"\\/api\\/academic-years\\/current\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 07:22:00'),
(2087, 152, 'api_access', '{\"endpoint\":\"\\/api\\/announcements\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 07:22:00'),
(2088, 152, 'api_access', '{\"endpoint\":\"\\/api\\/assessments?course_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 07:22:00'),
(2089, 152, 'api_access', '{\"endpoint\":\"\\/api\\/assessment-categories\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 07:22:00'),
(2090, 152, 'api_access', '{\"endpoint\":\"\\/api\\/auth\\/me\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 07:22:00'),
(2091, 152, 'api_access', '{\"endpoint\":\"\\/api\\/classes\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 07:22:00'),
(2092, 152, 'api_access', '{\"endpoint\":\"\\/api\\/class-subjects\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 07:22:00'),
(2093, 152, 'api_access', '{\"endpoint\":\"\\/api\\/courses\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 07:22:00'),
(2094, 152, 'api_access', '{\"endpoint\":\"\\/api\\/course-content\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 07:22:00'),
(2095, 152, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 07:22:00'),
(2096, 152, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-08 07:22:00'),
(2097, 152, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/teacher\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 07:22:00'),
(2098, 162, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-08 07:22:00'),
(2099, 162, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/student\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 07:22:00'),
(2100, 182, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-08 07:22:00'),
(2101, 182, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/parent\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 07:22:01'),
(2102, 152, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/superadmin\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 07:22:01'),
(2103, 152, 'api_access', '{\"endpoint\":\"\\/api\\/error-logs\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 07:22:01'),
(2104, 152, 'api_access', '{\"endpoint\":\"\\/api\\/error-logs\\/unresolved\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 07:22:01'),
(2105, 152, 'api_access', '{\"endpoint\":\"\\/api\\/events\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 07:22:01'),
(2106, 152, 'api_access', '{\"endpoint\":\"\\/api\\/events\\/upcoming\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 07:22:01'),
(2107, 152, 'api_access', '{\"endpoint\":\"\\/api\\/events\\/calendar\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 07:22:01'),
(2108, 152, 'api_access', '{\"endpoint\":\"\\/api\\/events\\/academic-calendar\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 07:22:01'),
(2109, 152, 'api_access', '{\"endpoint\":\"\\/api\\/grade-levels\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 07:22:01'),
(2110, 152, 'api_access', '{\"endpoint\":\"\\/api\\/grade-levels\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 07:22:01'),
(2111, 152, 'api_access', '{\"endpoint\":\"\\/api\\/grade-reports\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 07:22:01'),
(2112, 152, 'api_access', '{\"endpoint\":\"\\/api\\/grade-reports\\/stats\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 07:22:01'),
(2113, 152, 'api_access', '{\"endpoint\":\"\\/api\\/grade-scales\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 07:22:01'),
(2114, 152, 'api_access', '{\"endpoint\":\"\\/api\\/institutions\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 07:22:01'),
(2115, 152, 'api_access', '{\"endpoint\":\"\\/api\\/login-activity\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 07:22:01'),
(2116, 152, 'api_access', '{\"endpoint\":\"\\/api\\/login-activity\\/my-history\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 07:22:01'),
(2117, 152, 'api_access', '{\"endpoint\":\"\\/api\\/login-activity\\/recent\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 07:22:01'),
(2118, 152, 'api_access', '{\"endpoint\":\"\\/api\\/login-activity\\/failed\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 07:22:01'),
(2119, 152, 'api_access', '{\"endpoint\":\"\\/api\\/messages\\/inbox\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 07:22:01'),
(2120, 152, 'api_access', '{\"endpoint\":\"\\/api\\/messages\\/sent\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 07:22:01'),
(2121, 152, 'api_access', '{\"endpoint\":\"\\/api\\/messages\\/unread-count\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 07:22:01'),
(2122, 152, 'api_access', '{\"endpoint\":\"\\/api\\/notifications\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 07:22:01'),
(2123, 152, 'api_access', '{\"endpoint\":\"\\/api\\/notifications\\/summary\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 07:22:01'),
(2124, 152, 'api_access', '{\"endpoint\":\"\\/api\\/notifications\\/unread-count\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 07:22:02'),
(2125, 152, 'api_access', '{\"endpoint\":\"\\/api\\/parents\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 07:22:02'),
(2126, 152, 'api_access', '{\"endpoint\":\"\\/api\\/programs\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 07:22:02'),
(2127, 152, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 07:22:02'),
(2128, 152, 'api_access', '{\"endpoint\":\"\\/api\\/roles\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 07:22:02'),
(2129, 152, 'api_access', '{\"endpoint\":\"\\/api\\/permissions\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 07:22:02'),
(2130, 152, 'api_access', '{\"endpoint\":\"\\/api\\/semesters\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 07:22:02'),
(2131, 152, 'api_access', '{\"endpoint\":\"\\/api\\/semesters\\/current\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 07:22:02'),
(2132, 152, 'api_access', '{\"endpoint\":\"\\/api\\/students\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 07:22:02'),
(2133, 152, 'api_access', '{\"endpoint\":\"\\/api\\/subjects\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 07:22:02'),
(2134, 152, 'api_access', '{\"endpoint\":\"\\/api\\/subjects\\/core\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 07:22:02'),
(2135, 152, 'api_access', '{\"endpoint\":\"\\/api\\/subscriptions\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 07:22:02'),
(2136, 152, 'api_access', '{\"endpoint\":\"\\/api\\/subscriptions\\/stats\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 07:22:02'),
(2137, 152, 'api_access', '{\"endpoint\":\"\\/api\\/superadmin-activity?page=1&limit=25\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 07:22:02'),
(2138, 152, 'api_access', '{\"endpoint\":\"\\/api\\/superadmin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 07:22:02'),
(2139, 152, 'api_access', '{\"endpoint\":\"\\/api\\/superadmin-activity\\/stats\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 07:22:02'),
(2140, 152, 'api_access', '{\"endpoint\":\"\\/api\\/superadmin-activity\\/type\\/institution_created\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 07:22:02'),
(2141, 152, 'api_access', '{\"endpoint\":\"\\/api\\/superadmin-activity\\/severity\\/info\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 07:22:02'),
(2142, 152, 'api_access', '{\"endpoint\":\"\\/api\\/superadmin-activity\\/severity\\/warning\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 07:22:02'),
(2143, 152, 'api_access', '{\"endpoint\":\"\\/api\\/superadmin-activity\\/severity\\/critical\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 07:22:03'),
(2144, 152, 'api_access', '{\"endpoint\":\"\\/api\\/superadmin-activity\\/performer\\/1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 07:22:03'),
(2145, 152, 'api_access', '{\"endpoint\":\"\\/api\\/superadmin-activity\\/severity\\/invalid\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 07:22:03'),
(2146, 152, 'api_access', '{\"endpoint\":\"\\/api\\/superadmin-activity\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 07:22:03'),
(2147, 152, 'api_access', '{\"endpoint\":\"\\/api\\/system\\/settings\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 07:22:03'),
(2148, 152, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 07:22:03'),
(2149, 152, 'api_access', '{\"endpoint\":\"\\/api\\/user-activity\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 07:22:03'),
(2150, 152, 'api_access', '{\"endpoint\":\"\\/api\\/user-activity\\/recent\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 07:22:03'),
(2151, 152, 'api_access', '{\"endpoint\":\"\\/api\\/user-activity\\/stats\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 07:22:03'),
(2152, 152, 'api_access', '{\"endpoint\":\"\\/api\\/user-activity\\/audit-trail\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 07:22:03'),
(2153, 152, 'api_access', '{\"endpoint\":\"\\/api\\/users\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 07:22:03'),
(2154, 152, 'api_access', '{\"endpoint\":\"\\/api\\/superadmin\\/users\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 07:22:03'),
(2155, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 07:23:38'),
(2156, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 07:28:38'),
(2157, 147, 'api_access', '{\"endpoint\":\"\\/api\\/auth\\/logout\",\"method\":\"POST\"}', '::1', NULL, '2026-03-08 07:30:00'),
(2158, 147, 'logout', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-08 07:30:00'),
(2159, 1, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-08 07:30:08'),
(2160, 1, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/superadmin\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 07:30:11'),
(2161, 1, 'api_access', '{\"endpoint\":\"\\/api\\/superadmin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 07:30:13'),
(2162, 1, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/superadmin\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 07:30:55'),
(2163, 1, 'api_access', '{\"endpoint\":\"\\/api\\/superadmin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 07:30:57'),
(2164, 1, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/superadmin\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 07:31:10'),
(2165, 1, 'api_access', '{\"endpoint\":\"\\/api\\/superadmin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 07:31:10'),
(2166, 1, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/superadmin\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 07:31:16'),
(2167, 1, 'api_access', '{\"endpoint\":\"\\/api\\/superadmin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 07:31:16'),
(2168, 1, 'api_access', '{\"endpoint\":\"\\/api\\/auth\\/logout\",\"method\":\"POST\"}', '::1', NULL, '2026-03-08 07:32:33'),
(2169, 1, 'logout', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-08 07:32:33'),
(2170, 147, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-08 07:32:40'),
(2171, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 07:32:42'),
(2172, 147, 'api_access', '{\"endpoint\":\"\\/api\\/auth\\/logout\",\"method\":\"POST\"}', '::1', NULL, '2026-03-08 07:34:40'),
(2173, 147, 'logout', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-08 07:34:40'),
(2174, 152, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-08 07:34:47'),
(2175, 152, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/teacher\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 07:34:49'),
(2176, 152, 'api_access', '{\"endpoint\":\"\\/api\\/auth\\/logout\",\"method\":\"POST\"}', '::1', NULL, '2026-03-08 07:35:04'),
(2177, 152, 'logout', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-08 07:35:04'),
(2178, 162, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-08 07:35:14'),
(2179, 162, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/student\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 07:35:16'),
(2180, 162, 'api_access', '{\"endpoint\":\"\\/api\\/auth\\/logout\",\"method\":\"POST\"}', '::1', NULL, '2026-03-08 07:35:30'),
(2181, 162, 'logout', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-08 07:35:30'),
(2182, 182, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-08 07:35:34'),
(2183, 182, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/parent\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 07:35:36'),
(2184, 182, 'api_access', '{\"endpoint\":\"\\/api\\/auth\\/logout\",\"method\":\"POST\"}', '::1', NULL, '2026-03-08 07:35:54'),
(2185, 182, 'logout', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-08 07:35:54'),
(2186, 147, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-08 07:35:59'),
(2187, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 07:36:02'),
(2188, 147, 'api_access', '{\"endpoint\":\"\\/api\\/auth\\/logout\",\"method\":\"POST\"}', '::1', NULL, '2026-03-08 07:36:08'),
(2189, 147, 'logout', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-08 07:36:08'),
(2190, 1, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-08 07:36:18'),
(2191, 1, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/superadmin\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 07:36:21'),
(2192, 1, 'api_access', '{\"endpoint\":\"\\/api\\/superadmin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 07:36:21'),
(2193, 1, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/superadmin\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 07:36:26'),
(2194, 1, 'api_access', '{\"endpoint\":\"\\/api\\/superadmin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 07:36:26'),
(2195, 1, 'api_access', '{\"endpoint\":\"\\/api\\/auth\\/logout\",\"method\":\"POST\"}', '::1', NULL, '2026-03-08 07:36:36'),
(2196, 1, 'logout', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-08 07:36:36'),
(2197, 1, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-08 07:36:43'),
(2198, 1, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/superadmin\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 07:36:45'),
(2199, 1, 'api_access', '{\"endpoint\":\"\\/api\\/superadmin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 07:36:46'),
(2200, 1, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/superadmin\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 07:36:55'),
(2201, 1, 'api_access', '{\"endpoint\":\"\\/api\\/superadmin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 07:36:55'),
(2202, 1, 'api_access', '{\"endpoint\":\"\\/api\\/auth\\/logout\",\"method\":\"POST\"}', '::1', NULL, '2026-03-08 07:38:14'),
(2203, 1, 'logout', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-08 07:38:14'),
(2204, 147, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-08 07:42:43'),
(2205, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 07:42:51'),
(2206, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 07:46:12'),
(2207, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 07:51:13'),
(2208, 152, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-08 08:01:58'),
(2209, 152, 'api_access', '{\"endpoint\":\"\\/api\\/academic-years\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 08:01:58'),
(2210, 152, 'api_access', '{\"endpoint\":\"\\/api\\/academic-years\\/current\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 08:01:58'),
(2211, 147, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-08 08:01:58'),
(2212, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity?page=1&limit=25\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 08:01:58'),
(2213, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 08:01:59'),
(2214, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/stats\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 08:01:59'),
(2215, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/type\\/student_enrolled\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 08:01:59'),
(2216, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/severity\\/info\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 08:01:59'),
(2217, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/severity\\/warning\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 08:01:59'),
(2218, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/severity\\/critical\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 08:01:59'),
(2219, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/performer\\/1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 08:01:59'),
(2220, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/severity\\/invalid\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 08:01:59'),
(2221, 152, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 08:01:59'),
(2222, 152, 'api_access', '{\"endpoint\":\"\\/api\\/announcements\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 08:01:59'),
(2223, 152, 'api_access', '{\"endpoint\":\"\\/api\\/assessments?course_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 08:01:59'),
(2224, 152, 'api_access', '{\"endpoint\":\"\\/api\\/assessment-categories\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 08:01:59'),
(2225, 152, 'api_access', '{\"endpoint\":\"\\/api\\/auth\\/me\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 08:01:59'),
(2226, 152, 'api_access', '{\"endpoint\":\"\\/api\\/classes\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 08:01:59'),
(2227, 152, 'api_access', '{\"endpoint\":\"\\/api\\/class-subjects\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 08:01:59'),
(2228, 152, 'api_access', '{\"endpoint\":\"\\/api\\/courses\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 08:01:59'),
(2229, 152, 'api_access', '{\"endpoint\":\"\\/api\\/course-content\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 08:01:59'),
(2230, 152, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 08:01:59'),
(2231, 152, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-08 08:02:00'),
(2232, 152, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/teacher\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 08:02:00'),
(2233, 162, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-08 08:02:00'),
(2234, 162, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/student\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 08:02:00'),
(2235, 182, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-08 08:02:00'),
(2236, 182, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/parent\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 08:02:00'),
(2237, 152, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/superadmin\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 08:02:00'),
(2238, 152, 'api_access', '{\"endpoint\":\"\\/api\\/error-logs\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 08:02:00'),
(2239, 152, 'api_access', '{\"endpoint\":\"\\/api\\/error-logs\\/unresolved\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 08:02:00'),
(2240, 152, 'api_access', '{\"endpoint\":\"\\/api\\/events\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 08:02:00'),
(2241, 152, 'api_access', '{\"endpoint\":\"\\/api\\/events\\/upcoming\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 08:02:00'),
(2242, 152, 'api_access', '{\"endpoint\":\"\\/api\\/events\\/calendar\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 08:02:00'),
(2243, 152, 'api_access', '{\"endpoint\":\"\\/api\\/events\\/academic-calendar\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 08:02:00'),
(2244, 152, 'api_access', '{\"endpoint\":\"\\/api\\/grade-levels\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 08:02:00'),
(2245, 152, 'api_access', '{\"endpoint\":\"\\/api\\/grade-levels\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 08:02:00'),
(2246, 152, 'api_access', '{\"endpoint\":\"\\/api\\/grade-reports\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 08:02:00'),
(2247, 152, 'api_access', '{\"endpoint\":\"\\/api\\/grade-reports\\/stats\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 08:02:00'),
(2248, 152, 'api_access', '{\"endpoint\":\"\\/api\\/grade-scales\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 08:02:01'),
(2249, 152, 'api_access', '{\"endpoint\":\"\\/api\\/institutions\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 08:02:01'),
(2250, 152, 'api_access', '{\"endpoint\":\"\\/api\\/login-activity\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 08:02:01'),
(2251, 152, 'api_access', '{\"endpoint\":\"\\/api\\/login-activity\\/my-history\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 08:02:01'),
(2252, 152, 'api_access', '{\"endpoint\":\"\\/api\\/login-activity\\/recent\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 08:02:01'),
(2253, 152, 'api_access', '{\"endpoint\":\"\\/api\\/login-activity\\/failed\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 08:02:01'),
(2254, 152, 'api_access', '{\"endpoint\":\"\\/api\\/messages\\/inbox\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 08:02:01'),
(2255, 152, 'api_access', '{\"endpoint\":\"\\/api\\/messages\\/sent\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 08:02:01'),
(2256, 152, 'api_access', '{\"endpoint\":\"\\/api\\/messages\\/unread-count\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 08:02:01'),
(2257, 152, 'api_access', '{\"endpoint\":\"\\/api\\/notifications\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 08:02:01'),
(2258, 152, 'api_access', '{\"endpoint\":\"\\/api\\/notifications\\/summary\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 08:02:01'),
(2259, 152, 'api_access', '{\"endpoint\":\"\\/api\\/notifications\\/unread-count\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 08:02:01'),
(2260, 152, 'api_access', '{\"endpoint\":\"\\/api\\/parents\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 08:02:01'),
(2261, 152, 'api_access', '{\"endpoint\":\"\\/api\\/programs\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 08:02:01'),
(2262, 152, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 08:02:01'),
(2263, 152, 'api_access', '{\"endpoint\":\"\\/api\\/roles\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 08:02:01'),
(2264, 152, 'api_access', '{\"endpoint\":\"\\/api\\/permissions\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 08:02:01'),
(2265, 152, 'api_access', '{\"endpoint\":\"\\/api\\/semesters\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 08:02:01'),
(2266, 152, 'api_access', '{\"endpoint\":\"\\/api\\/semesters\\/current\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 08:02:01'),
(2267, 152, 'api_access', '{\"endpoint\":\"\\/api\\/students\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 08:02:01'),
(2268, 152, 'api_access', '{\"endpoint\":\"\\/api\\/subjects\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 08:02:01'),
(2269, 152, 'api_access', '{\"endpoint\":\"\\/api\\/subjects\\/core\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 08:02:01'),
(2270, 152, 'api_access', '{\"endpoint\":\"\\/api\\/subscriptions\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 08:02:01'),
(2271, 152, 'api_access', '{\"endpoint\":\"\\/api\\/subscriptions\\/stats\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 08:02:01'),
(2272, 152, 'api_access', '{\"endpoint\":\"\\/api\\/superadmin-activity?page=1&limit=25\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 08:02:02'),
(2273, 152, 'api_access', '{\"endpoint\":\"\\/api\\/superadmin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 08:02:02'),
(2274, 152, 'api_access', '{\"endpoint\":\"\\/api\\/superadmin-activity\\/stats\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 08:02:02'),
(2275, 152, 'api_access', '{\"endpoint\":\"\\/api\\/superadmin-activity\\/type\\/institution_created\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 08:02:02'),
(2276, 152, 'api_access', '{\"endpoint\":\"\\/api\\/superadmin-activity\\/severity\\/info\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 08:02:02'),
(2277, 152, 'api_access', '{\"endpoint\":\"\\/api\\/superadmin-activity\\/severity\\/warning\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 08:02:02'),
(2278, 152, 'api_access', '{\"endpoint\":\"\\/api\\/superadmin-activity\\/severity\\/critical\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 08:02:02'),
(2279, 152, 'api_access', '{\"endpoint\":\"\\/api\\/superadmin-activity\\/performer\\/1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 08:02:02'),
(2280, 152, 'api_access', '{\"endpoint\":\"\\/api\\/superadmin-activity\\/severity\\/invalid\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 08:02:02'),
(2281, 152, 'api_access', '{\"endpoint\":\"\\/api\\/superadmin-activity\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 08:02:02'),
(2282, 152, 'api_access', '{\"endpoint\":\"\\/api\\/system\\/settings\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 08:02:02'),
(2283, 152, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 08:02:02'),
(2284, 152, 'api_access', '{\"endpoint\":\"\\/api\\/user-activity\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 08:02:02'),
(2285, 152, 'api_access', '{\"endpoint\":\"\\/api\\/user-activity\\/recent\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 08:02:02'),
(2286, 152, 'api_access', '{\"endpoint\":\"\\/api\\/user-activity\\/stats\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 08:02:02'),
(2287, 152, 'api_access', '{\"endpoint\":\"\\/api\\/user-activity\\/audit-trail\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 08:02:02'),
(2288, 152, 'api_access', '{\"endpoint\":\"\\/api\\/users\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 08:02:02'),
(2289, 152, 'api_access', '{\"endpoint\":\"\\/api\\/superadmin\\/users\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 08:02:02'),
(2290, 1, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-08 08:23:57'),
(2291, 1, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity?page=1&limit=25\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 08:24:07'),
(2292, 147, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-08 08:24:19');
INSERT INTO `user_activity` (`activity_id`, `user_id`, `activity_type`, `activity_details`, `ip_address`, `user_agent`, `created_at`) VALUES
(2293, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity?page=1&limit=25\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 08:24:29'),
(2294, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 08:29:55'),
(2295, 147, 'api_access', '{\"endpoint\":\"\\/api\\/auth\\/logout\",\"method\":\"POST\"}', '::1', NULL, '2026-03-08 08:29:55'),
(2296, 147, 'logout', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-08 08:29:55'),
(2297, 147, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-08 08:30:03'),
(2298, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 08:30:05'),
(2299, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 08:30:11'),
(2300, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 08:30:11'),
(2301, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\",\"method\":\"POST\"}', '::1', NULL, '2026-03-08 08:30:33'),
(2302, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 08:30:43'),
(2303, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 08:30:43'),
(2304, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 08:35:43'),
(2305, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 08:35:43'),
(2306, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 08:39:05'),
(2307, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 08:39:05'),
(2308, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 08:42:17'),
(2309, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 08:42:17'),
(2310, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 08:43:25'),
(2311, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 08:43:25'),
(2312, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 08:48:25'),
(2313, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 08:48:25'),
(2314, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 08:49:01'),
(2315, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 08:49:01'),
(2316, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 08:49:09'),
(2317, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 08:49:10'),
(2318, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 08:49:15'),
(2319, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 08:49:15'),
(2320, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 08:50:43'),
(2321, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 08:50:43'),
(2322, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 08:51:47'),
(2323, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 08:51:47'),
(2324, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 08:55:45'),
(2325, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 08:55:45'),
(2326, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 08:55:54'),
(2327, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 08:55:54'),
(2328, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 08:56:53'),
(2329, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 08:56:53'),
(2330, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 08:57:00'),
(2331, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 08:57:00'),
(2332, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 08:57:44'),
(2333, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 08:58:18'),
(2334, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 09:01:59'),
(2335, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 09:01:59'),
(2336, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 09:02:02'),
(2337, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 09:02:02'),
(2338, 147, 'api_access', '{\"endpoint\":\"\\/api\\/auth\\/logout\",\"method\":\"POST\"}', '::1', NULL, '2026-03-08 09:02:11'),
(2339, 147, 'logout', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-08 09:02:11'),
(2340, 147, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-08 09:02:16'),
(2341, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 09:02:19'),
(2342, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 09:02:19'),
(2343, 147, 'api_access', '{\"endpoint\":\"\\/api\\/auth\\/logout\",\"method\":\"POST\"}', '::1', NULL, '2026-03-08 09:02:25'),
(2344, 147, 'logout', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-08 09:02:25'),
(2345, 1, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-08 09:02:35'),
(2346, 1, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/superadmin\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 09:02:38'),
(2347, 1, 'api_access', '{\"endpoint\":\"\\/api\\/superadmin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 09:02:39'),
(2348, 1, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/superadmin\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 09:02:47'),
(2349, 1, 'api_access', '{\"endpoint\":\"\\/api\\/superadmin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 09:02:47'),
(2350, 1, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/superadmin\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 09:04:49'),
(2351, 1, 'api_access', '{\"endpoint\":\"\\/api\\/superadmin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 09:04:49'),
(2352, 1, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/superadmin\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 09:07:29'),
(2353, 1, 'api_access', '{\"endpoint\":\"\\/api\\/superadmin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 09:07:29'),
(2354, 1, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/superadmin\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 09:07:38'),
(2355, 1, 'api_access', '{\"endpoint\":\"\\/api\\/superadmin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 09:07:38'),
(2356, 1, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/superadmin\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 09:12:38'),
(2357, 1, 'api_access', '{\"endpoint\":\"\\/api\\/superadmin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 09:12:38'),
(2358, 1, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/superadmin\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 09:22:07'),
(2359, 1, 'api_access', '{\"endpoint\":\"\\/api\\/superadmin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 09:22:07'),
(2360, 1, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/superadmin\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 09:22:38'),
(2361, 1, 'api_access', '{\"endpoint\":\"\\/api\\/superadmin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 09:22:38'),
(2362, 1, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/superadmin\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 09:26:50'),
(2363, 1, 'api_access', '{\"endpoint\":\"\\/api\\/superadmin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 09:26:50'),
(2364, 1, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/superadmin\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 09:27:38'),
(2365, 1, 'api_access', '{\"endpoint\":\"\\/api\\/superadmin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 09:27:38'),
(2366, 1, 'api_access', '{\"endpoint\":\"\\/api\\/auth\\/logout\",\"method\":\"POST\"}', '::1', NULL, '2026-03-08 09:27:38'),
(2367, 1, 'logout', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-08 09:27:38'),
(2368, 1, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-08 09:28:55'),
(2369, 1, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/superadmin\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 09:28:58'),
(2370, 1, 'api_access', '{\"endpoint\":\"\\/api\\/superadmin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 09:28:59'),
(2371, 1, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/superadmin\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 09:29:01'),
(2372, 1, 'api_access', '{\"endpoint\":\"\\/api\\/superadmin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 09:29:01'),
(2373, 1, 'api_access', '{\"endpoint\":\"\\/api\\/auth\\/logout\",\"method\":\"POST\"}', '::1', NULL, '2026-03-08 09:29:30'),
(2374, 1, 'logout', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-08 09:29:30'),
(2375, 147, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-08 09:29:35'),
(2376, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 09:29:38'),
(2377, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 09:29:38'),
(2378, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 09:29:51'),
(2379, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 09:29:51'),
(2380, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 09:34:51'),
(2381, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 09:34:51'),
(2382, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 09:38:29'),
(2383, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 09:38:29'),
(2384, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 09:41:32'),
(2385, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 09:41:32'),
(2386, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 09:43:02'),
(2387, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 09:43:02'),
(2388, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 09:46:54'),
(2389, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 09:46:54'),
(2390, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 09:51:53'),
(2391, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 09:51:53'),
(2392, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 09:57:03'),
(2393, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 09:57:03'),
(2394, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 10:01:53'),
(2395, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 10:01:53'),
(2396, 147, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-08 10:37:04'),
(2397, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 10:37:07'),
(2398, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 10:37:08'),
(2399, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 10:42:06'),
(2400, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 10:42:06'),
(2401, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 10:47:06'),
(2402, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 10:47:06'),
(2403, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 10:49:17'),
(2404, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 10:49:17'),
(2405, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 10:50:36'),
(2406, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 10:50:36'),
(2407, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 10:55:35'),
(2408, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 10:55:35'),
(2409, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 11:09:54'),
(2410, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 11:09:54'),
(2411, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 11:10:00'),
(2412, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 11:10:00'),
(2413, 147, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-08 12:17:19'),
(2414, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 12:17:22'),
(2415, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 12:17:24'),
(2416, 147, 'api_access', '{\"endpoint\":\"\\/api\\/auth\\/logout\",\"method\":\"POST\"}', '::1', NULL, '2026-03-08 12:18:25'),
(2417, 147, 'logout', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-08 12:18:25'),
(2418, 152, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-08 12:18:31'),
(2419, 152, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/teacher\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 12:18:35'),
(2420, 152, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/teacher\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 12:28:34'),
(2421, 152, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/teacher\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 12:33:35'),
(2422, 152, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/teacher\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 12:39:33'),
(2423, 152, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/teacher\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 12:39:41'),
(2424, 152, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/teacher\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 12:44:41'),
(2425, 152, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/teacher\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 12:48:42'),
(2426, 152, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/teacher\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 12:49:10'),
(2427, 152, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/teacher\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 12:53:39'),
(2428, 152, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/teacher\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 12:58:01'),
(2429, 152, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/teacher\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 13:03:01'),
(2430, 152, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/teacher\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 13:08:01'),
(2431, 152, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/teacher\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 13:10:55'),
(2432, 152, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/teacher\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 13:15:55'),
(2433, 152, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/teacher\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 13:17:18'),
(2434, 152, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/teacher\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 13:17:31'),
(2435, 162, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-08 13:22:40'),
(2436, 162, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/student\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 13:22:43'),
(2437, 162, 'api_access', '{\"endpoint\":\"\\/api\\/auth\\/logout\",\"method\":\"POST\"}', '::1', NULL, '2026-03-08 13:22:52'),
(2438, 162, 'logout', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-08 13:22:52'),
(2439, 152, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-08 13:22:58'),
(2440, 152, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/teacher\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 13:23:02'),
(2441, 152, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/teacher\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 13:28:02'),
(2442, 152, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/teacher\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 13:33:02'),
(2443, 152, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/teacher\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 13:38:02'),
(2444, 152, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/teacher\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 13:43:02'),
(2445, 152, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/teacher\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 13:45:24'),
(2446, 152, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/teacher\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 13:46:38'),
(2447, 152, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/teacher\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 13:51:38'),
(2448, 152, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/teacher\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 13:56:38'),
(2449, 152, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/teacher\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 14:01:38'),
(2450, 152, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/teacher\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 14:06:38'),
(2451, 152, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/teacher\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 14:11:38'),
(2452, 152, 'api_access', '{\"endpoint\":\"\\/api\\/auth\\/logout\",\"method\":\"POST\"}', '::1', NULL, '2026-03-08 14:11:38'),
(2453, 152, 'logout', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-08 14:11:38'),
(2454, 152, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-08 14:13:46'),
(2455, 152, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/teacher\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 14:13:50'),
(2456, 152, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/teacher\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 14:18:49'),
(2457, 152, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/teacher\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 14:23:50'),
(2458, 152, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-09 04:26:39'),
(2459, 152, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/teacher\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 04:26:43'),
(2460, 152, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/teacher\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 04:29:09'),
(2461, 152, 'api_access', '{\"endpoint\":\"\\/api\\/auth\\/logout\",\"method\":\"POST\"}', '::1', NULL, '2026-03-09 04:30:24'),
(2462, 152, 'logout', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-09 04:30:24'),
(2463, 162, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-09 04:30:29'),
(2464, 162, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/student\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 04:30:30'),
(2465, 162, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/student\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 04:35:30'),
(2466, 162, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/student\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 04:40:30'),
(2467, 162, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/student\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 04:46:27'),
(2468, 162, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/student\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 04:46:35'),
(2469, 162, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/student\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 04:51:35'),
(2470, 162, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/student\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 04:56:35'),
(2471, 162, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/student\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 05:01:35'),
(2472, 162, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/student\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 05:06:35'),
(2473, 162, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/student\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 05:11:35'),
(2474, 162, 'api_access', '{\"endpoint\":\"\\/api\\/auth\\/logout\",\"method\":\"POST\"}', '::1', NULL, '2026-03-09 05:11:35'),
(2475, 162, 'logout', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-09 05:11:35'),
(2476, 152, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-09 05:12:01'),
(2477, 152, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/teacher\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 05:12:03'),
(2478, 152, 'api_access', '{\"endpoint\":\"\\/api\\/auth\\/logout\",\"method\":\"POST\"}', '::1', NULL, '2026-03-09 05:12:15'),
(2479, 152, 'logout', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-09 05:12:15'),
(2480, 162, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-09 05:12:19'),
(2481, 162, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/student\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 05:12:22'),
(2482, 162, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/student\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 05:17:21'),
(2483, 162, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/student\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 05:33:37'),
(2484, 162, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/student\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 05:37:21'),
(2485, 162, 'api_access', '{\"endpoint\":\"\\/api\\/auth\\/logout\",\"method\":\"POST\"}', '::1', NULL, '2026-03-09 05:37:22'),
(2486, 162, 'logout', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-09 05:37:22'),
(2487, 162, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-09 05:41:38'),
(2488, 162, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/student\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 05:41:40'),
(2489, 162, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/student\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 05:41:52'),
(2490, 162, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/student\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 05:46:51'),
(2491, 162, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/student\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 05:51:51'),
(2492, 162, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/student\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 05:56:51'),
(2493, 162, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/student\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 06:01:51'),
(2494, 162, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/student\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 06:08:09'),
(2495, 162, 'api_access', '{\"endpoint\":\"\\/api\\/auth\\/logout\",\"method\":\"POST\"}', '::1', NULL, '2026-03-09 06:08:09'),
(2496, 162, 'logout', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-09 06:08:09'),
(2497, 162, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-09 06:08:17'),
(2498, 162, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/student\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 06:08:20'),
(2499, 162, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/student\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 06:13:20'),
(2500, 162, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/student\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 06:18:20'),
(2501, 162, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/student\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 06:23:20'),
(2502, 162, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/student\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 06:23:56'),
(2503, 162, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/student\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 06:28:55'),
(2504, 162, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/student\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 06:33:55'),
(2505, 152, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-09 07:12:40'),
(2506, 152, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/teacher\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 07:12:43'),
(2507, 152, 'api_access', '{\"endpoint\":\"\\/api\\/auth\\/logout\",\"method\":\"POST\"}', '::1', NULL, '2026-03-09 07:12:55'),
(2508, 152, 'logout', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-09 07:12:55'),
(2509, 147, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-09 07:13:03'),
(2510, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 07:13:06'),
(2511, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 07:13:06'),
(2512, 147, 'api_access', '{\"endpoint\":\"\\/api\\/auth\\/logout\",\"method\":\"POST\"}', '::1', NULL, '2026-03-09 07:13:27'),
(2513, 147, 'logout', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-09 07:13:27'),
(2514, 152, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-09 07:13:32'),
(2515, 152, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/teacher\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 07:13:34'),
(2516, 152, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/teacher\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 07:18:34'),
(2517, 152, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/teacher\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 07:21:29'),
(2518, 152, 'api_access', '{\"endpoint\":\"\\/api\\/auth\\/logout\",\"method\":\"POST\"}', '::1', NULL, '2026-03-09 07:24:19'),
(2519, 152, 'logout', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-09 07:24:19'),
(2520, 162, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-09 07:24:28'),
(2521, 162, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/student\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 07:24:31'),
(2522, 162, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/student\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 07:24:59'),
(2523, 162, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/student\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 07:29:59'),
(2524, 162, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/student\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 07:34:59'),
(2525, 162, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/student\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 07:40:22'),
(2526, 162, 'api_access', '{\"endpoint\":\"\\/api\\/auth\\/logout\",\"method\":\"POST\"}', '::1', NULL, '2026-03-09 07:40:27'),
(2527, 162, 'logout', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-09 07:40:27'),
(2528, 182, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-09 07:40:36'),
(2529, 182, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/parent\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 07:40:41'),
(2530, 147, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-09 07:42:58'),
(2531, 182, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/parent\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 07:43:16'),
(2532, 182, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/parent\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 07:51:25'),
(2533, 182, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/parent\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 07:53:16'),
(2534, 182, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/parent\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 07:58:16'),
(2535, 182, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/parent\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 08:05:54'),
(2536, 182, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/parent\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 08:06:00'),
(2537, 182, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/parent\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 08:11:00'),
(2538, 182, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/parent\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 08:11:14'),
(2539, 182, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/parent\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 08:16:13'),
(2540, 182, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/parent\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 08:21:14'),
(2541, 182, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/parent\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 08:23:03'),
(2542, 182, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/parent\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 08:23:13'),
(2543, 182, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/parent\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 08:27:59'),
(2544, 182, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/parent\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 08:32:59'),
(2545, 182, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/parent\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 08:37:59'),
(2546, 182, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-09 08:42:01'),
(2547, 182, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/parent\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 08:42:04'),
(2548, 182, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/parent\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 08:47:04'),
(2549, 182, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/parent\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 08:58:51'),
(2550, 182, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/parent\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 09:02:04'),
(2551, 182, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/parent\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 09:03:03'),
(2552, 182, 'api_access', '{\"endpoint\":\"\\/api\\/auth\\/logout\",\"method\":\"POST\"}', '::1', NULL, '2026-03-09 09:03:33'),
(2553, 182, 'logout', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-09 09:03:33'),
(2554, 1, 'password_reset_requested', '{\"ip\":\"::1\",\"email\":\"benedictamankwa18@gmail.com\",\"email_sent\":true}', '::1', NULL, '2026-03-09 09:04:24'),
(2555, 1, 'password_reset_completed', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-09 09:08:07'),
(2556, 1, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-09 09:08:25'),
(2557, 1, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/superadmin\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 09:08:28'),
(2558, 1, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/superadmin\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 09:09:36'),
(2559, 1, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/superadmin\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 09:14:35'),
(2560, 1, 'api_access', '{\"endpoint\":\"\\/api\\/superadmin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 09:14:36'),
(2561, 1, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/superadmin\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 09:17:08'),
(2562, 1, 'api_access', '{\"endpoint\":\"\\/api\\/superadmin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 09:17:10'),
(2563, 1, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/superadmin\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 09:17:30'),
(2564, 1, 'api_access', '{\"endpoint\":\"\\/api\\/superadmin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 09:17:30'),
(2565, 1, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/superadmin\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 09:22:08'),
(2566, 1, 'api_access', '{\"endpoint\":\"\\/api\\/superadmin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 09:22:09'),
(2567, 1, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/superadmin\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 09:27:29'),
(2568, 1, 'api_access', '{\"endpoint\":\"\\/api\\/superadmin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 09:27:30'),
(2569, 162, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-09 13:04:05'),
(2570, 162, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/student\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 13:04:07'),
(2571, 162, 'api_access', '{\"endpoint\":\"\\/api\\/auth\\/logout\",\"method\":\"POST\"}', '::1', NULL, '2026-03-09 13:04:22'),
(2572, 162, 'logout', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-09 13:04:22'),
(2573, 182, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-09 13:04:26'),
(2574, 182, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/parent\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 13:04:28'),
(2575, 182, 'api_access', '{\"endpoint\":\"\\/api\\/auth\\/logout\",\"method\":\"POST\"}', '::1', NULL, '2026-03-09 13:05:06'),
(2576, 182, 'logout', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-09 13:05:06'),
(2577, 162, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-09 13:05:10'),
(2578, 162, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/student\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 13:05:12'),
(2579, 162, 'api_access', '{\"endpoint\":\"\\/api\\/auth\\/logout\",\"method\":\"POST\"}', '::1', NULL, '2026-03-09 13:05:39'),
(2580, 162, 'logout', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-09 13:05:39'),
(2581, 152, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-09 13:05:44'),
(2582, 152, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/teacher\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 13:05:45'),
(2583, 152, 'api_access', '{\"endpoint\":\"\\/api\\/auth\\/logout\",\"method\":\"POST\"}', '::1', NULL, '2026-03-09 13:07:08'),
(2584, 152, 'logout', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-09 13:07:08'),
(2585, 147, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-09 13:07:12'),
(2586, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 13:07:14'),
(2587, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 13:07:14'),
(2588, 147, 'api_access', '{\"endpoint\":\"\\/api\\/auth\\/logout\",\"method\":\"POST\"}', '::1', NULL, '2026-03-09 13:07:41'),
(2589, 147, 'logout', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-09 13:07:41'),
(2590, 1, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-09 13:07:52'),
(2591, 1, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/superadmin\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 13:07:53'),
(2592, 1, 'api_access', '{\"endpoint\":\"\\/api\\/superadmin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 13:07:54'),
(2593, 1, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/superadmin\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 13:12:42'),
(2594, 1, 'api_access', '{\"endpoint\":\"\\/api\\/superadmin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 13:12:43'),
(2595, 1, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/superadmin\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 13:12:52'),
(2596, 1, 'api_access', '{\"endpoint\":\"\\/api\\/superadmin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 13:12:53'),
(2597, 1, 'api_access', '{\"endpoint\":\"\\/api\\/institutions?page=1&per_page=10&limit=10&include_all=1&include_admins=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 13:12:56'),
(2598, 1, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/superadmin\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 13:13:58'),
(2599, 1, 'api_access', '{\"endpoint\":\"\\/api\\/institutions?page=1&per_page=10&limit=10&include_all=1&include_admins=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 13:13:59'),
(2600, 1, 'api_access', '{\"endpoint\":\"\\/api\\/superadmin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 13:14:00'),
(2601, 1, 'api_access', '{\"endpoint\":\"\\/api\\/roles\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 13:14:10'),
(2602, 1, 'api_access', '{\"endpoint\":\"\\/api\\/institutions\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 13:14:10'),
(2603, 1, 'api_access', '{\"endpoint\":\"\\/api\\/institutions?include_all=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 13:14:10'),
(2604, 1, 'api_access', '{\"endpoint\":\"\\/api\\/superadmin\\/users?page=1&per_page=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 13:14:10'),
(2605, 1, 'api_access', '{\"endpoint\":\"\\/api\\/institutions?page=1&per_page=10&limit=10&include_all=1&include_admins=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 13:14:14'),
(2606, 1, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/superadmin\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 13:14:29'),
(2607, 1, 'api_access', '{\"endpoint\":\"\\/api\\/superadmin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 13:14:30'),
(2608, 1, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/superadmin\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 13:18:58'),
(2609, 1, 'api_access', '{\"endpoint\":\"\\/api\\/superadmin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 13:18:59'),
(2610, 1, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/superadmin\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 13:23:58'),
(2611, 1, 'api_access', '{\"endpoint\":\"\\/api\\/superadmin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 13:23:59'),
(2612, 1, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/superadmin\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 13:28:58'),
(2613, 1, 'api_access', '{\"endpoint\":\"\\/api\\/superadmin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 13:28:59'),
(2614, 1, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/superadmin\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 13:49:42'),
(2615, 1, 'api_access', '{\"endpoint\":\"\\/api\\/superadmin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 13:49:43'),
(2616, 1, 'api_access', '{\"endpoint\":\"\\/api\\/auth\\/logout\",\"method\":\"POST\"}', '::1', NULL, '2026-03-09 13:49:44'),
(2617, 1, 'logout', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-09 13:49:44'),
(2618, 147, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-09 13:53:47'),
(2619, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 13:53:50'),
(2620, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 13:53:50'),
(2621, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 13:54:53'),
(2622, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 13:54:53'),
(2623, 147, 'api_access', '{\"endpoint\":\"\\/api\\/classes?limit=200\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 13:54:53'),
(2624, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 13:54:53'),
(2625, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 13:54:53'),
(2626, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 13:54:54'),
(2627, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 13:54:54'),
(2628, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 13:55:44'),
(2629, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 13:55:44'),
(2630, 147, 'api_access', '{\"endpoint\":\"\\/api\\/classes?limit=200\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 13:55:44'),
(2631, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 13:55:44'),
(2632, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 13:55:44'),
(2633, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 13:55:46'),
(2634, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 13:55:46'),
(2635, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 14:00:44'),
(2636, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 14:00:45'),
(2637, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 14:05:44'),
(2638, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 14:05:44'),
(2639, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20&class_id=35\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 14:07:59'),
(2640, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 14:07:59'),
(2641, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 14:08:00'),
(2642, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20&class_id=41\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 14:08:07'),
(2643, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 14:08:07'),
(2644, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 14:08:07'),
(2645, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20&class_id=38\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 14:08:11'),
(2646, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 14:08:11'),
(2647, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 14:08:11'),
(2648, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 14:08:14'),
(2649, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 14:08:14'),
(2650, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 14:08:14'),
(2651, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20&status=withdrawn\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 14:08:23'),
(2652, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 14:08:23'),
(2653, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 14:08:23'),
(2654, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 14:08:30'),
(2655, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 14:08:30'),
(2656, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 14:08:30'),
(2657, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 14:08:36'),
(2658, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 14:08:36'),
(2659, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 14:08:36'),
(2660, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 14:08:40'),
(2661, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 14:08:40'),
(2662, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 14:08:40'),
(2663, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20&search=w\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 14:09:42'),
(2664, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 14:09:42'),
(2665, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 14:09:42'),
(2666, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 14:09:44'),
(2667, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 14:09:44'),
(2668, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 14:09:44'),
(2669, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20&search=a\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 14:09:46'),
(2670, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 14:09:46'),
(2671, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 14:09:46'),
(2672, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 14:09:47'),
(2673, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 14:09:47'),
(2674, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 14:09:47'),
(2675, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20&search=A\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 14:09:52'),
(2676, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 14:09:52'),
(2677, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 14:09:52'),
(2678, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 14:10:44');
INSERT INTO `user_activity` (`activity_id`, `user_id`, `activity_type`, `activity_details`, `ip_address`, `user_agent`, `created_at`) VALUES
(2679, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 14:10:44'),
(2680, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 14:11:14'),
(2681, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 14:11:14'),
(2682, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 14:11:14'),
(2683, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/f58350f7-1746-11f1-8ccc-10653022c2a0\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 14:12:22'),
(2684, 147, 'api_access', '{\"endpoint\":\"\\/api\\/classes?limit=200\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 14:12:46'),
(2685, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 14:12:46'),
(2686, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 14:12:46'),
(2687, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 14:12:46'),
(2688, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 14:12:47'),
(2689, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/f58350f7-1746-11f1-8ccc-10653022c2a0\\/status\",\"method\":\"PUT\"}', '::1', NULL, '2026-03-09 14:12:56'),
(2690, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 14:12:56'),
(2691, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 14:12:56'),
(2692, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 14:12:56'),
(2693, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/f58350f7-1746-11f1-8ccc-10653022c2a0\\/status\",\"method\":\"PUT\"}', '::1', NULL, '2026-03-09 14:13:03'),
(2694, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 14:13:03'),
(2695, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 14:13:03'),
(2696, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 14:13:03'),
(2697, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 14:15:44'),
(2698, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 14:15:44'),
(2699, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 14:16:45'),
(2700, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 14:16:45'),
(2701, 147, 'api_access', '{\"endpoint\":\"\\/api\\/classes?limit=200\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 14:16:46'),
(2702, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 14:16:46'),
(2703, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 14:16:46'),
(2704, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 14:16:46'),
(2705, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 14:16:46'),
(2706, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 14:17:17'),
(2707, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 14:17:17'),
(2708, 147, 'api_access', '{\"endpoint\":\"\\/api\\/classes?limit=200\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 14:17:17'),
(2709, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 14:17:17'),
(2710, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 14:17:17'),
(2711, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 14:17:18'),
(2712, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 14:17:18'),
(2713, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/f5845b9e-1746-11f1-8ccc-10653022c2a0\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 14:19:21'),
(2714, 147, 'api_access', '{\"endpoint\":\"\\/api\\/classes?limit=200\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 14:19:30'),
(2715, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 14:19:30'),
(2716, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 14:19:30'),
(2717, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 14:19:30'),
(2718, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 14:19:30'),
(2719, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/f58350f7-1746-11f1-8ccc-10653022c2a0\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 14:19:34'),
(2720, 147, 'api_access', '{\"endpoint\":\"\\/api\\/classes?limit=200\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 14:20:11'),
(2721, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 14:20:11'),
(2722, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 14:20:12'),
(2723, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 14:20:12'),
(2724, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 14:20:12'),
(2725, 147, 'api_access', '{\"endpoint\":\"\\/api\\/auth\\/logout\",\"method\":\"POST\"}', '::1', NULL, '2026-03-09 14:21:30'),
(2726, 147, 'logout', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-09 14:21:31'),
(2727, 162, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-09 14:21:38'),
(2728, 162, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/student\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 14:21:41'),
(2729, 162, 'api_access', '{\"endpoint\":\"\\/api\\/auth\\/logout\",\"method\":\"POST\"}', '::1', NULL, '2026-03-09 14:21:52'),
(2730, 162, 'logout', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-09 14:21:52'),
(2731, 162, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-09 14:22:03'),
(2732, 162, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/student\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 14:22:06'),
(2733, 162, 'api_access', '{\"endpoint\":\"\\/api\\/auth\\/logout\",\"method\":\"POST\"}', '::1', NULL, '2026-03-09 14:22:16'),
(2734, 162, 'logout', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-09 14:22:16'),
(2735, 147, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-09 14:22:24'),
(2736, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 14:22:27'),
(2737, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 14:22:27'),
(2738, 147, 'api_access', '{\"endpoint\":\"\\/api\\/classes?limit=200\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 14:22:38'),
(2739, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 14:22:38'),
(2740, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 14:22:38'),
(2741, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 14:22:39'),
(2742, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 14:22:39'),
(2743, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20&search=Kwame+Osei\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 14:22:48'),
(2744, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 14:22:48'),
(2745, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 14:22:48'),
(2746, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20&search=Kwame\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 14:22:52'),
(2747, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 14:22:52'),
(2748, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 14:22:52'),
(2749, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20&search=Kwame\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 14:22:53'),
(2750, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 14:22:53'),
(2751, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 14:22:53'),
(2752, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20&search=Kwame.\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 14:22:55'),
(2753, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 14:22:55'),
(2754, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 14:22:55'),
(2755, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20&search=Kwame.os\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 14:22:57'),
(2756, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 14:22:57'),
(2757, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 14:22:57'),
(2758, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20&search=Kwame.osie\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 14:22:58'),
(2759, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 14:22:58'),
(2760, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 14:22:58'),
(2761, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20&search=Kwame.os\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 14:22:59'),
(2762, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 14:22:59'),
(2763, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 14:22:59'),
(2764, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20&search=Kwame.osei\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 14:23:01'),
(2765, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 14:23:01'),
(2766, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 14:23:01'),
(2767, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 14:25:13'),
(2768, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 14:25:14'),
(2769, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 14:25:14'),
(2770, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=10000\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 14:26:01'),
(2771, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20&search=k\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 14:26:20'),
(2772, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 14:26:20'),
(2773, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 14:26:20'),
(2774, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20&search=kwa\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 14:26:21'),
(2775, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 14:26:21'),
(2776, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 14:26:21'),
(2777, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=10000&search=kwa\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 14:26:23'),
(2778, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 14:27:27'),
(2779, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 14:27:28'),
(2780, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 14:31:11'),
(2781, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 14:31:12'),
(2782, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 14:31:12'),
(2783, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 14:32:27'),
(2784, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 14:32:28'),
(2785, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 14:37:27'),
(2786, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 14:37:28'),
(2787, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 14:55:33'),
(2788, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 14:55:33'),
(2789, 147, 'api_access', '{\"endpoint\":\"\\/api\\/auth\\/logout\",\"method\":\"POST\"}', '::1', NULL, '2026-03-09 14:55:34'),
(2790, 147, 'logout', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-09 14:55:34'),
(2791, 152, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-09 15:02:10'),
(2792, 152, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/teacher\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 15:02:13'),
(2793, 152, 'api_access', '{\"endpoint\":\"\\/api\\/auth\\/logout\",\"method\":\"POST\"}', '::1', NULL, '2026-03-09 15:02:26'),
(2794, 152, 'logout', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-09 15:02:26'),
(2795, 147, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-09 15:02:40'),
(2796, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 15:02:41'),
(2797, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 15:02:42'),
(2798, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 15:02:50'),
(2799, 147, 'api_access', '{\"endpoint\":\"\\/api\\/classes?limit=200\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 15:02:51'),
(2800, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 15:02:51'),
(2801, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 15:02:51'),
(2802, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 15:02:51'),
(2803, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/f5836bbd-1746-11f1-8ccc-10653022c2a0\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 15:02:57'),
(2804, 147, 'api_access', '{\"endpoint\":\"\\/api\\/classes?limit=200\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 15:03:09'),
(2805, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 15:03:09'),
(2806, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 15:03:09'),
(2807, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 15:03:09'),
(2808, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 15:03:09'),
(2809, 147, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-09 16:46:35'),
(2810, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 16:46:37'),
(2811, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 16:46:37'),
(2812, 147, 'api_access', '{\"endpoint\":\"\\/api\\/classes?limit=200\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 16:46:48'),
(2813, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 16:46:48'),
(2814, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 16:46:48'),
(2815, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 16:46:48'),
(2816, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 16:46:49'),
(2817, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20&search=K\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 16:47:01'),
(2818, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 16:47:01'),
(2819, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 16:47:01'),
(2820, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20&search=Kwa\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 16:47:08'),
(2821, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 16:47:08'),
(2822, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 16:47:08'),
(2823, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 16:50:16'),
(2824, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 16:50:16'),
(2825, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 16:50:16'),
(2826, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20&search=h\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 16:50:34'),
(2827, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 16:50:35'),
(2828, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 16:50:35'),
(2829, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20&search=hs\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 16:50:35'),
(2830, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 16:50:35'),
(2831, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 16:50:35'),
(2832, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20&search=hsj\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 16:50:37'),
(2833, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 16:50:37'),
(2834, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 16:50:37'),
(2835, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 16:50:43'),
(2836, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 16:50:43'),
(2837, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 16:50:43'),
(2838, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20&search=K\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 16:50:46'),
(2839, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 16:50:46'),
(2840, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 16:50:46'),
(2841, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20&search=Kwa\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 16:50:47'),
(2842, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 16:50:47'),
(2843, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 16:50:47'),
(2844, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20&search=Kwame\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 16:50:50'),
(2845, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 16:50:50'),
(2846, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 16:50:50'),
(2847, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20&search=Kwame\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 16:50:53'),
(2848, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 16:50:53'),
(2849, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 16:50:53'),
(2850, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20&search=Kwame+os\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 16:50:54'),
(2851, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 16:50:54'),
(2852, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 16:50:54'),
(2853, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20&search=Kwame+o\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 16:50:56'),
(2854, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 16:50:56'),
(2855, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 16:50:56'),
(2856, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20&search=Kwame\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 16:50:57'),
(2857, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 16:50:57'),
(2858, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 16:50:57'),
(2859, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20&search=Kwame+O\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 16:51:00'),
(2860, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 16:51:00'),
(2861, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 16:51:00'),
(2862, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20&search=Kwame+Os\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 16:51:03'),
(2863, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 16:51:03'),
(2864, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 16:51:03'),
(2865, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20&search=Kwame+Osie\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 16:51:03'),
(2866, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 16:51:03'),
(2867, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 16:51:03'),
(2868, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20&search=Kwame+O\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 16:51:05'),
(2869, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 16:51:05'),
(2870, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 16:51:05'),
(2871, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20&search=Kwame\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 16:51:06'),
(2872, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 16:51:06'),
(2873, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 16:51:06'),
(2874, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20&search=Kwame\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 16:51:06'),
(2875, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 16:51:06'),
(2876, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 16:51:06'),
(2877, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20&search=Kwame.\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 16:51:11'),
(2878, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 16:51:11'),
(2879, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 16:51:11'),
(2880, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20&search=Kwame.O\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 16:51:15'),
(2881, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 16:51:15'),
(2882, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 16:51:15'),
(2883, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20&search=Kwame.\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 16:51:17'),
(2884, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 16:51:17'),
(2885, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 16:51:17'),
(2886, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20&search=Kwame\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 16:51:18'),
(2887, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 16:51:18'),
(2888, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 16:51:18'),
(2889, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20&search=Kwam\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 16:51:19'),
(2890, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 16:51:20'),
(2891, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 16:51:20'),
(2892, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 16:51:20'),
(2893, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 16:51:20'),
(2894, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 16:51:20'),
(2895, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 16:51:36'),
(2896, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 16:51:36'),
(2897, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 16:56:37'),
(2898, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 16:56:37'),
(2899, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 17:01:37'),
(2900, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 17:01:37'),
(2901, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 17:06:37'),
(2902, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 17:06:37'),
(2903, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 17:11:37'),
(2904, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 17:11:37'),
(2905, 147, 'api_access', '{\"endpoint\":\"\\/api\\/auth\\/logout\",\"method\":\"POST\"}', '::1', NULL, '2026-03-09 17:11:37'),
(2906, 147, 'logout', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-09 17:11:37'),
(2907, 147, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-09 17:29:00'),
(2908, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 17:29:01'),
(2909, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 17:29:02'),
(2910, 147, 'api_access', '{\"endpoint\":\"\\/api\\/classes?limit=200\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 17:29:11'),
(2911, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 17:29:11'),
(2912, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 17:29:11'),
(2913, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 17:29:11'),
(2914, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 17:29:11'),
(2915, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 17:29:24'),
(2916, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 17:29:24'),
(2917, 147, 'api_access', '{\"endpoint\":\"\\/api\\/classes?limit=200\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 17:29:24'),
(2918, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 17:29:24'),
(2919, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 17:29:24'),
(2920, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 17:29:25'),
(2921, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 17:29:25'),
(2922, 147, 'api_access', '{\"endpoint\":\"\\/api\\/auth\\/logout\",\"method\":\"POST\"}', '::1', NULL, '2026-03-09 17:29:37'),
(2923, 147, 'logout', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-09 17:29:37'),
(2924, 147, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-09 17:29:40'),
(2925, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 17:29:42'),
(2926, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 17:29:42'),
(2927, 147, 'api_access', '{\"endpoint\":\"\\/api\\/classes?limit=200\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 17:29:45'),
(2928, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 17:29:45'),
(2929, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 17:29:45'),
(2930, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 17:29:45'),
(2931, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 17:29:45'),
(2932, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20&program_id=27\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 17:29:48'),
(2933, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 17:29:48'),
(2934, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 17:29:48'),
(2935, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20&program_id=24\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 17:29:52'),
(2936, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 17:29:52'),
(2937, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 17:29:52'),
(2938, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20&program_id=23\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 17:30:08'),
(2939, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 17:30:08'),
(2940, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 17:30:08'),
(2941, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 17:30:13'),
(2942, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 17:30:13'),
(2943, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 17:30:13'),
(2944, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 17:30:17'),
(2945, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 17:30:18'),
(2946, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 17:30:18'),
(2947, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 17:30:20'),
(2948, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 17:30:20'),
(2949, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 17:30:21'),
(2950, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/f58350f7-1746-11f1-8ccc-10653022c2a0\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 17:30:24'),
(2951, 147, 'api_access', '{\"endpoint\":\"\\/api\\/auth\\/logout\",\"method\":\"POST\"}', '::1', NULL, '2026-03-09 17:30:46'),
(2952, 147, 'logout', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-09 17:30:46'),
(2953, 182, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-09 17:30:51'),
(2954, 182, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/parent\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 17:30:53'),
(2955, 182, 'api_access', '{\"endpoint\":\"\\/api\\/auth\\/logout\",\"method\":\"POST\"}', '::1', NULL, '2026-03-09 17:31:00'),
(2956, 182, 'logout', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-09 17:31:00'),
(2957, 147, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-09 17:31:04'),
(2958, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 17:31:06'),
(2959, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 17:31:06'),
(2960, 147, 'api_access', '{\"endpoint\":\"\\/api\\/classes?limit=200\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 17:31:09'),
(2961, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 17:31:09'),
(2962, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 17:31:09'),
(2963, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 17:31:09'),
(2964, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 17:31:09'),
(2965, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/f58350f7-1746-11f1-8ccc-10653022c2a0\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 17:31:20'),
(2966, 147, 'api_access', '{\"endpoint\":\"\\/api\\/auth\\/logout\",\"method\":\"POST\"}', '::1', NULL, '2026-03-09 17:31:52'),
(2967, 147, 'logout', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-09 17:31:52'),
(2968, 182, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-09 17:32:05'),
(2969, 182, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/parent\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 17:32:07'),
(2970, 182, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/parent\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 17:33:14'),
(2971, 182, 'api_access', '{\"endpoint\":\"\\/api\\/auth\\/logout\",\"method\":\"POST\"}', '::1', NULL, '2026-03-09 17:36:18'),
(2972, 182, 'logout', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-09 17:36:18'),
(2973, 147, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-09 17:36:23'),
(2974, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 17:36:25'),
(2975, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 17:36:26'),
(2976, 147, 'api_access', '{\"endpoint\":\"\\/api\\/classes?limit=200\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 17:36:43'),
(2977, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 17:36:43'),
(2978, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 17:36:43'),
(2979, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 17:36:43'),
(2980, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 17:36:43'),
(2981, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/f58350f7-1746-11f1-8ccc-10653022c2a0\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 17:36:53'),
(2982, 147, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-09 17:38:14'),
(2983, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/f58350f7-1746-11f1-8ccc-10653022c2a0\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 17:38:56'),
(2984, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 17:41:26'),
(2985, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 17:41:26'),
(2986, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 17:42:32'),
(2987, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 17:42:33'),
(2988, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/f58350f7-1746-11f1-8ccc-10653022c2a0\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 17:42:33'),
(2989, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/f58350f7-1746-11f1-8ccc-10653022c2a0\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 17:44:58'),
(2990, 147, 'api_access', '{\"endpoint\":\"\\/api\\/classes?limit=200\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 17:47:20'),
(2991, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 17:47:20'),
(2992, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 17:47:20'),
(2993, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 17:47:20'),
(2994, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 17:47:20'),
(2995, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/f58350f7-1746-11f1-8ccc-10653022c2a0\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 17:47:31'),
(2996, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 17:47:32'),
(2997, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 17:47:32'),
(2998, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/f58350f7-1746-11f1-8ccc-10653022c2a0\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 17:49:22'),
(2999, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 17:49:38'),
(3000, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 17:49:38'),
(3001, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/f58350f7-1746-11f1-8ccc-10653022c2a0\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 17:49:38'),
(3002, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 17:54:38'),
(3003, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 17:54:38'),
(3004, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 17:55:07'),
(3005, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 17:55:07'),
(3006, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/f58350f7-1746-11f1-8ccc-10653022c2a0\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 17:55:08'),
(3007, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/f58350f7-1746-11f1-8ccc-10653022c2a0\\/courses\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 17:55:08'),
(3008, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/f58350f7-1746-11f1-8ccc-10653022c2a0\\/courses\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 17:57:36'),
(3009, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 18:00:08'),
(3010, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 18:00:08'),
(3011, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 18:05:07'),
(3012, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 18:05:07'),
(3013, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/f58350f7-1746-11f1-8ccc-10653022c2a0\\/courses\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 18:09:01'),
(3014, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 18:10:08'),
(3015, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 18:10:08'),
(3016, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 18:11:45'),
(3017, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 18:11:45'),
(3018, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/f58350f7-1746-11f1-8ccc-10653022c2a0\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 18:11:45'),
(3019, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/f58350f7-1746-11f1-8ccc-10653022c2a0\\/courses\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 18:11:46'),
(3020, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 18:15:11'),
(3021, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 18:15:11'),
(3022, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/f58350f7-1746-11f1-8ccc-10653022c2a0\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 18:15:11'),
(3023, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/f58350f7-1746-11f1-8ccc-10653022c2a0\\/courses\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 18:15:12'),
(3024, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 18:16:20'),
(3025, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 18:16:20'),
(3026, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/f58350f7-1746-11f1-8ccc-10653022c2a0\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 18:16:20'),
(3027, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/f58350f7-1746-11f1-8ccc-10653022c2a0\\/courses\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 18:16:21'),
(3028, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 18:16:50'),
(3029, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 18:16:50'),
(3030, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/f58350f7-1746-11f1-8ccc-10653022c2a0\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 18:16:50'),
(3031, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/f58350f7-1746-11f1-8ccc-10653022c2a0\\/courses\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 18:16:50'),
(3032, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 18:20:24'),
(3033, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 18:20:25'),
(3034, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/f58350f7-1746-11f1-8ccc-10653022c2a0\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 18:20:25'),
(3035, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/f58350f7-1746-11f1-8ccc-10653022c2a0\\/courses\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 18:20:25'),
(3036, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 18:21:30'),
(3037, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 18:21:30');
INSERT INTO `user_activity` (`activity_id`, `user_id`, `activity_type`, `activity_details`, `ip_address`, `user_agent`, `created_at`) VALUES
(3038, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/f58350f7-1746-11f1-8ccc-10653022c2a0\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 18:21:30'),
(3039, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/f58350f7-1746-11f1-8ccc-10653022c2a0\\/courses\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 18:21:31'),
(3040, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 18:26:30'),
(3041, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 18:26:30'),
(3042, 147, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-09 18:50:56'),
(3043, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 18:50:58'),
(3044, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 18:50:58'),
(3045, 147, 'api_access', '{\"endpoint\":\"\\/api\\/classes?limit=200\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 18:51:02'),
(3046, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 18:51:02'),
(3047, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 18:51:02'),
(3048, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 18:51:02'),
(3049, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 18:51:02'),
(3050, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/f58350f7-1746-11f1-8ccc-10653022c2a0\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 18:51:06'),
(3051, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/f58350f7-1746-11f1-8ccc-10653022c2a0\\/courses\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 18:51:06'),
(3052, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 18:51:23'),
(3053, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 18:51:24'),
(3054, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/f58350f7-1746-11f1-8ccc-10653022c2a0\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 18:51:24'),
(3055, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/f58350f7-1746-11f1-8ccc-10653022c2a0\\/courses\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 18:51:24'),
(3056, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/63\\/attendance\\/stats\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 18:51:24'),
(3057, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/f58350f7-1746-11f1-8ccc-10653022c2a0\\/status\",\"method\":\"PUT\"}', '::1', NULL, '2026-03-09 18:52:39'),
(3058, 147, 'api_access', '{\"endpoint\":\"\\/api\\/classes?limit=200\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 18:52:42'),
(3059, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 18:52:42'),
(3060, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 18:52:43'),
(3061, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 18:52:43'),
(3062, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 18:52:43'),
(3063, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/f58350f7-1746-11f1-8ccc-10653022c2a0\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 18:53:15'),
(3064, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/f58350f7-1746-11f1-8ccc-10653022c2a0\\/courses\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 18:53:15'),
(3065, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/63\\/attendance\\/stats\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 18:53:15'),
(3066, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/f58350f7-1746-11f1-8ccc-10653022c2a0\\/status\",\"method\":\"PUT\"}', '::1', NULL, '2026-03-09 18:53:19'),
(3067, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 18:56:24'),
(3068, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 18:56:24'),
(3069, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:01:24'),
(3070, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:01:24'),
(3071, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:06:24'),
(3072, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:06:24'),
(3073, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:11:10'),
(3074, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:11:11'),
(3075, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/f58350f7-1746-11f1-8ccc-10653022c2a0\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:11:11'),
(3076, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/f58350f7-1746-11f1-8ccc-10653022c2a0\\/courses\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:11:11'),
(3077, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/63\\/attendance\\/stats\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:11:11'),
(3078, 147, 'api_access', '{\"endpoint\":\"\\/api\\/classes?limit=200\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:11:46'),
(3079, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:11:46'),
(3080, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:11:47'),
(3081, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:11:47'),
(3082, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:11:47'),
(3083, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/f5836bbd-1746-11f1-8ccc-10653022c2a0\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:11:50'),
(3084, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/f5836bbd-1746-11f1-8ccc-10653022c2a0\\/courses\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:11:50'),
(3085, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/64\\/attendance\\/stats\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:11:50'),
(3086, 147, 'api_access', '{\"endpoint\":\"\\/api\\/classes?limit=200\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:12:04'),
(3087, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:12:04'),
(3088, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:12:04'),
(3089, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:12:04'),
(3090, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:12:04'),
(3091, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:12:15'),
(3092, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:12:15'),
(3093, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:12:15'),
(3094, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:12:17'),
(3095, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:12:17'),
(3096, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:12:17'),
(3097, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:12:19'),
(3098, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:12:20'),
(3099, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:12:20'),
(3100, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/f58350f7-1746-11f1-8ccc-10653022c2a0\\/status\",\"method\":\"PUT\"}', '::1', NULL, '2026-03-09 19:12:34'),
(3101, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:12:34'),
(3102, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:12:34'),
(3103, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:12:34'),
(3104, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:12:38'),
(3105, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:12:38'),
(3106, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:12:38'),
(3107, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:12:41'),
(3108, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:12:41'),
(3109, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:12:41'),
(3110, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/f58350f7-1746-11f1-8ccc-10653022c2a0\\/status\",\"method\":\"PUT\"}', '::1', NULL, '2026-03-09 19:12:46'),
(3111, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:12:46'),
(3112, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:12:46'),
(3113, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:12:46'),
(3114, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20&status=withdrawn\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:12:55'),
(3115, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:12:55'),
(3116, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:12:55'),
(3117, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:12:58'),
(3118, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:12:59'),
(3119, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:12:59'),
(3120, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/f5836bbd-1746-11f1-8ccc-10653022c2a0\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:13:10'),
(3121, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/f5836bbd-1746-11f1-8ccc-10653022c2a0\\/courses\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:13:10'),
(3122, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/64\\/attendance\\/stats\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:13:10'),
(3123, 147, 'api_access', '{\"endpoint\":\"\\/api\\/classes?limit=200\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:13:12'),
(3124, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:13:12'),
(3125, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:13:12'),
(3126, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:13:12'),
(3127, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:13:12'),
(3128, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/f5836bbd-1746-11f1-8ccc-10653022c2a0\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:13:19'),
(3129, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/f5836bbd-1746-11f1-8ccc-10653022c2a0\\/courses\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:13:19'),
(3130, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/64\\/attendance\\/stats\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:13:19'),
(3131, 147, 'api_access', '{\"endpoint\":\"\\/api\\/classes?limit=200\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:14:26'),
(3132, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:14:26'),
(3133, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:14:26'),
(3134, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:14:26'),
(3135, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:14:27'),
(3136, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/f58350f7-1746-11f1-8ccc-10653022c2a0\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:15:45'),
(3137, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/f58350f7-1746-11f1-8ccc-10653022c2a0\\/courses\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:15:45'),
(3138, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/63\\/attendance\\/stats\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:15:45'),
(3139, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:16:10'),
(3140, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:16:10'),
(3141, 147, 'api_access', '{\"endpoint\":\"\\/api\\/classes?limit=200\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:16:19'),
(3142, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:16:19'),
(3143, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:16:19'),
(3144, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:16:19'),
(3145, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:16:19'),
(3146, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:19:36'),
(3147, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:19:36'),
(3148, 147, 'api_access', '{\"endpoint\":\"\\/api\\/classes?limit=200\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:19:36'),
(3149, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:19:37'),
(3150, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:19:37'),
(3151, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:19:37'),
(3152, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:19:37'),
(3153, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:19:51'),
(3154, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:19:51'),
(3155, 147, 'api_access', '{\"endpoint\":\"\\/api\\/classes?limit=200\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:19:51'),
(3156, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:19:51'),
(3157, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:19:51'),
(3158, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:19:52'),
(3159, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:19:52'),
(3160, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/f5836bbd-1746-11f1-8ccc-10653022c2a0\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:20:01'),
(3161, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/f5836bbd-1746-11f1-8ccc-10653022c2a0\\/courses\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:20:01'),
(3162, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/64\\/attendance\\/stats\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:20:01'),
(3163, 147, 'api_access', '{\"endpoint\":\"\\/api\\/classes?limit=200\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:20:02'),
(3164, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:20:03'),
(3165, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:20:03'),
(3166, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:20:03'),
(3167, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:20:03'),
(3168, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:24:51'),
(3169, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:24:51'),
(3170, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/f58350f7-1746-11f1-8ccc-10653022c2a0\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:24:56'),
(3171, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/f58350f7-1746-11f1-8ccc-10653022c2a0\\/courses\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:24:56'),
(3172, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/63\\/attendance\\/stats\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:24:56'),
(3173, 147, 'api_access', '{\"endpoint\":\"\\/api\\/classes?limit=200\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:24:58'),
(3174, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:24:58'),
(3175, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:24:58'),
(3176, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:24:58'),
(3177, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:24:58'),
(3178, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/f5846cdb-1746-11f1-8ccc-10653022c2a0\",\"method\":\"DELETE\"}', '::1', NULL, '2026-03-09 19:26:28'),
(3179, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:26:28'),
(3180, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:26:28'),
(3181, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:26:28'),
(3182, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20&status=withdrawn\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:26:36'),
(3183, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:26:36'),
(3184, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:26:36'),
(3185, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:26:39'),
(3186, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:26:39'),
(3187, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:26:39'),
(3188, 147, 'api_access', '{\"endpoint\":\"\\/api\\/classes?limit=200\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:28:25'),
(3189, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:28:25'),
(3190, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:28:25'),
(3191, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:28:25'),
(3192, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:28:25'),
(3193, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:29:51'),
(3194, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:29:51'),
(3195, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:33:19'),
(3196, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:33:19'),
(3197, 147, 'api_access', '{\"endpoint\":\"\\/api\\/classes?limit=200\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:33:20'),
(3198, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:33:20'),
(3199, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:33:20'),
(3200, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:33:21'),
(3201, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:33:21'),
(3202, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:38:20'),
(3203, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:38:20'),
(3204, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:43:22'),
(3205, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:43:22'),
(3206, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:43:52'),
(3207, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:43:52'),
(3208, 147, 'api_access', '{\"endpoint\":\"\\/api\\/classes?limit=200\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:43:53'),
(3209, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:43:53'),
(3210, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:43:53'),
(3211, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:43:54'),
(3212, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:43:55'),
(3213, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:44:14'),
(3214, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:44:15'),
(3215, 147, 'api_access', '{\"endpoint\":\"\\/api\\/classes?limit=200\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:44:16'),
(3216, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:44:16'),
(3217, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:44:16'),
(3218, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:44:16'),
(3219, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:44:17'),
(3220, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:49:14'),
(3221, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:49:14'),
(3222, 147, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-09 19:52:42'),
(3223, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:52:44'),
(3224, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:52:44'),
(3225, 147, 'api_access', '{\"endpoint\":\"\\/api\\/classes?limit=200\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:52:51'),
(3226, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:52:51'),
(3227, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:52:51'),
(3228, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:52:51'),
(3229, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:52:51'),
(3230, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/f58350f7-1746-11f1-8ccc-10653022c2a0\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:52:56'),
(3231, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/f58350f7-1746-11f1-8ccc-10653022c2a0\\/courses\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:52:56'),
(3232, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/63\\/attendance\\/stats\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:52:56'),
(3233, 147, 'api_access', '{\"endpoint\":\"\\/api\\/classes?limit=200\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:53:13'),
(3234, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:53:13'),
(3235, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:53:13'),
(3236, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:53:13'),
(3237, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:53:13'),
(3238, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:57:45'),
(3239, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 19:57:45'),
(3240, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 20:02:45'),
(3241, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 20:02:45'),
(3242, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 20:05:48'),
(3243, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 20:05:48'),
(3244, 147, 'api_access', '{\"endpoint\":\"\\/api\\/classes?limit=200\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 20:05:48'),
(3245, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 20:05:48'),
(3246, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 20:05:48'),
(3247, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 20:05:49'),
(3248, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 20:05:49'),
(3249, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 20:10:48'),
(3250, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 20:10:48'),
(3251, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 20:15:48'),
(3252, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 20:15:48'),
(3253, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 20:21:32'),
(3254, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 20:21:32'),
(3255, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 20:21:38'),
(3256, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 20:21:38'),
(3257, 147, 'api_access', '{\"endpoint\":\"\\/api\\/classes?limit=200\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 20:21:39'),
(3258, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 20:21:39'),
(3259, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 20:21:39'),
(3260, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 20:21:39'),
(3261, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 20:21:39'),
(3262, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 20:22:03'),
(3263, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 20:22:04'),
(3264, 147, 'api_access', '{\"endpoint\":\"\\/api\\/classes?limit=200\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 20:22:05'),
(3265, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 20:22:05'),
(3266, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 20:22:05'),
(3267, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 20:22:07'),
(3268, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 20:22:07'),
(3269, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/f58350f7-1746-11f1-8ccc-10653022c2a0\",\"method\":\"PUT\"}', '::1', NULL, '2026-03-09 20:23:23'),
(3270, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 20:23:23'),
(3271, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 20:23:24'),
(3272, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 20:23:24'),
(3273, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/f58350f7-1746-11f1-8ccc-10653022c2a0\",\"method\":\"PUT\"}', '::1', NULL, '2026-03-09 20:23:39'),
(3274, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 20:23:39'),
(3275, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 20:23:39'),
(3276, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 20:23:39'),
(3277, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 20:27:02'),
(3278, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 20:27:02'),
(3279, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 20:29:37'),
(3280, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 20:29:37'),
(3281, 147, 'api_access', '{\"endpoint\":\"\\/api\\/classes?limit=200\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 20:29:39'),
(3282, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 20:29:39'),
(3283, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 20:29:39'),
(3284, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 20:29:39'),
(3285, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 20:29:40'),
(3286, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 20:34:37'),
(3287, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 20:34:37'),
(3288, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 20:36:57'),
(3289, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 20:36:57'),
(3290, 147, 'api_access', '{\"endpoint\":\"\\/api\\/classes?limit=200\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 20:36:58'),
(3291, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 20:36:59'),
(3292, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 20:36:59'),
(3293, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 20:36:59'),
(3294, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 20:36:59'),
(3295, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 20:41:56'),
(3296, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 20:41:56'),
(3297, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 20:42:03'),
(3298, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 20:42:04'),
(3299, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 20:42:04'),
(3300, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 20:42:04'),
(3301, 147, 'api_access', '{\"endpoint\":\"\\/api\\/classes?limit=200\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 20:42:04'),
(3302, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 20:42:05'),
(3303, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 20:42:05'),
(3304, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 20:47:03'),
(3305, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 20:47:03'),
(3306, 147, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-09 21:45:03'),
(3307, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 21:45:07'),
(3308, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 21:45:08'),
(3309, 147, 'api_access', '{\"endpoint\":\"\\/api\\/classes?limit=200\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 21:45:16'),
(3310, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 21:45:17'),
(3311, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 21:45:17'),
(3312, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 21:45:17'),
(3313, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 21:45:17'),
(3314, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 21:45:34'),
(3315, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 21:45:34'),
(3316, 147, 'api_access', '{\"endpoint\":\"\\/api\\/classes?limit=200\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 21:45:35'),
(3317, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 21:45:35'),
(3318, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 21:45:35'),
(3319, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 21:45:36'),
(3320, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 21:45:36'),
(3321, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/generate-id\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 21:45:39'),
(3322, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/generate-id\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 21:45:44'),
(3323, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 21:50:01'),
(3324, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 21:50:01'),
(3325, 147, 'api_access', '{\"endpoint\":\"\\/api\\/classes?limit=200\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 21:50:02'),
(3326, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 21:50:02'),
(3327, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 21:50:02'),
(3328, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 21:50:02'),
(3329, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 21:50:02'),
(3330, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/generate-id\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 21:50:08'),
(3331, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\",\"method\":\"POST\"}', '::1', NULL, '2026-03-09 21:51:26'),
(3332, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 21:51:27'),
(3333, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 21:51:27'),
(3334, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 21:51:27'),
(3335, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 21:55:01'),
(3336, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 21:55:01'),
(3337, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 21:55:31'),
(3338, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 21:55:31'),
(3339, 147, 'api_access', '{\"endpoint\":\"\\/api\\/classes?limit=200\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 21:55:32'),
(3340, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 21:55:32'),
(3341, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 21:55:32'),
(3342, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 21:55:32'),
(3343, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 21:55:33'),
(3344, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:03:40'),
(3345, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:03:40'),
(3346, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/generate-id\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:03:43'),
(3347, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:04:18'),
(3348, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:04:18'),
(3349, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:04:18'),
(3350, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:04:23'),
(3351, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:04:23'),
(3352, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:04:23'),
(3353, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/1b88a5ba-1bf5-4f47-9843-41bec47d07d3\",\"method\":\"PUT\"}', '::1', NULL, '2026-03-09 22:04:41'),
(3354, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:04:41'),
(3355, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:04:42'),
(3356, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:04:42'),
(3357, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:04:48'),
(3358, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:04:48'),
(3359, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:04:48'),
(3360, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/1b88a5ba-1bf5-4f47-9843-41bec47d07d3\\/status\",\"method\":\"PUT\"}', '::1', NULL, '2026-03-09 22:04:58'),
(3361, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/f58350f7-1746-11f1-8ccc-10653022c2a0\\/status\",\"method\":\"PUT\"}', '::1', NULL, '2026-03-09 22:04:58'),
(3362, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/f5836bbd-1746-11f1-8ccc-10653022c2a0\\/status\",\"method\":\"PUT\"}', '::1', NULL, '2026-03-09 22:04:58'),
(3363, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/f5837514-1746-11f1-8ccc-10653022c2a0\\/status\",\"method\":\"PUT\"}', '::1', NULL, '2026-03-09 22:04:58'),
(3364, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/f583778f-1746-11f1-8ccc-10653022c2a0\\/status\",\"method\":\"PUT\"}', '::1', NULL, '2026-03-09 22:04:58'),
(3365, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/f584599e-1746-11f1-8ccc-10653022c2a0\\/status\",\"method\":\"PUT\"}', '::1', NULL, '2026-03-09 22:04:58'),
(3366, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/f5845b9e-1746-11f1-8ccc-10653022c2a0\\/status\",\"method\":\"PUT\"}', '::1', NULL, '2026-03-09 22:04:58'),
(3367, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/f5845cea-1746-11f1-8ccc-10653022c2a0\\/status\",\"method\":\"PUT\"}', '::1', NULL, '2026-03-09 22:04:59'),
(3368, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/f5845e2e-1746-11f1-8ccc-10653022c2a0\\/status\",\"method\":\"PUT\"}', '::1', NULL, '2026-03-09 22:04:59'),
(3369, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/f58460d1-1746-11f1-8ccc-10653022c2a0\\/status\",\"method\":\"PUT\"}', '::1', NULL, '2026-03-09 22:04:59'),
(3370, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/f5846258-1746-11f1-8ccc-10653022c2a0\\/status\",\"method\":\"PUT\"}', '::1', NULL, '2026-03-09 22:04:59'),
(3371, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/f58463da-1746-11f1-8ccc-10653022c2a0\\/status\",\"method\":\"PUT\"}', '::1', NULL, '2026-03-09 22:04:59'),
(3372, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/f584655f-1746-11f1-8ccc-10653022c2a0\\/status\",\"method\":\"PUT\"}', '::1', NULL, '2026-03-09 22:04:59'),
(3373, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/f58466ef-1746-11f1-8ccc-10653022c2a0\\/status\",\"method\":\"PUT\"}', '::1', NULL, '2026-03-09 22:04:59'),
(3374, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/f5846874-1746-11f1-8ccc-10653022c2a0\\/status\",\"method\":\"PUT\"}', '::1', NULL, '2026-03-09 22:04:59'),
(3375, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/f58469ef-1746-11f1-8ccc-10653022c2a0\\/status\",\"method\":\"PUT\"}', '::1', NULL, '2026-03-09 22:04:59'),
(3376, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/f5846b59-1746-11f1-8ccc-10653022c2a0\\/status\",\"method\":\"PUT\"}', '::1', NULL, '2026-03-09 22:04:59'),
(3377, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/f5846cdb-1746-11f1-8ccc-10653022c2a0\\/status\",\"method\":\"PUT\"}', '::1', NULL, '2026-03-09 22:05:00'),
(3378, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/f5846e55-1746-11f1-8ccc-10653022c2a0\\/status\",\"method\":\"PUT\"}', '::1', NULL, '2026-03-09 22:05:00'),
(3379, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:05:00'),
(3380, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:05:00'),
(3381, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:05:00'),
(3382, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/1b88a5ba-1bf5-4f47-9843-41bec47d07d3\\/status\",\"method\":\"PUT\"}', '::1', NULL, '2026-03-09 22:05:25'),
(3383, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/f58350f7-1746-11f1-8ccc-10653022c2a0\\/status\",\"method\":\"PUT\"}', '::1', NULL, '2026-03-09 22:05:25'),
(3384, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/f5836bbd-1746-11f1-8ccc-10653022c2a0\\/status\",\"method\":\"PUT\"}', '::1', NULL, '2026-03-09 22:05:25');
INSERT INTO `user_activity` (`activity_id`, `user_id`, `activity_type`, `activity_details`, `ip_address`, `user_agent`, `created_at`) VALUES
(3385, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/f5837514-1746-11f1-8ccc-10653022c2a0\\/status\",\"method\":\"PUT\"}', '::1', NULL, '2026-03-09 22:05:26'),
(3386, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/f583778f-1746-11f1-8ccc-10653022c2a0\\/status\",\"method\":\"PUT\"}', '::1', NULL, '2026-03-09 22:05:26'),
(3387, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/f584599e-1746-11f1-8ccc-10653022c2a0\\/status\",\"method\":\"PUT\"}', '::1', NULL, '2026-03-09 22:05:26'),
(3388, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/f5845b9e-1746-11f1-8ccc-10653022c2a0\\/status\",\"method\":\"PUT\"}', '::1', NULL, '2026-03-09 22:05:26'),
(3389, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/f5845cea-1746-11f1-8ccc-10653022c2a0\\/status\",\"method\":\"PUT\"}', '::1', NULL, '2026-03-09 22:05:26'),
(3390, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/f5845e2e-1746-11f1-8ccc-10653022c2a0\\/status\",\"method\":\"PUT\"}', '::1', NULL, '2026-03-09 22:05:26'),
(3391, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/f58460d1-1746-11f1-8ccc-10653022c2a0\\/status\",\"method\":\"PUT\"}', '::1', NULL, '2026-03-09 22:05:26'),
(3392, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/f5846258-1746-11f1-8ccc-10653022c2a0\\/status\",\"method\":\"PUT\"}', '::1', NULL, '2026-03-09 22:05:26'),
(3393, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/f58463da-1746-11f1-8ccc-10653022c2a0\\/status\",\"method\":\"PUT\"}', '::1', NULL, '2026-03-09 22:05:26'),
(3394, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/f584655f-1746-11f1-8ccc-10653022c2a0\\/status\",\"method\":\"PUT\"}', '::1', NULL, '2026-03-09 22:05:26'),
(3395, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/f58466ef-1746-11f1-8ccc-10653022c2a0\\/status\",\"method\":\"PUT\"}', '::1', NULL, '2026-03-09 22:05:26'),
(3396, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/f5846874-1746-11f1-8ccc-10653022c2a0\\/status\",\"method\":\"PUT\"}', '::1', NULL, '2026-03-09 22:05:26'),
(3397, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/f58469ef-1746-11f1-8ccc-10653022c2a0\\/status\",\"method\":\"PUT\"}', '::1', NULL, '2026-03-09 22:05:26'),
(3398, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/f5846b59-1746-11f1-8ccc-10653022c2a0\\/status\",\"method\":\"PUT\"}', '::1', NULL, '2026-03-09 22:05:26'),
(3399, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/f5846cdb-1746-11f1-8ccc-10653022c2a0\\/status\",\"method\":\"PUT\"}', '::1', NULL, '2026-03-09 22:05:26'),
(3400, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/f5846e55-1746-11f1-8ccc-10653022c2a0\\/status\",\"method\":\"PUT\"}', '::1', NULL, '2026-03-09 22:05:26'),
(3401, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:05:27'),
(3402, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:05:27'),
(3403, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:05:27'),
(3404, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:05:30'),
(3405, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:05:31'),
(3406, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/1b88a5ba-1bf5-4f47-9843-41bec47d07d3\",\"method\":\"DELETE\"}', '::1', NULL, '2026-03-09 22:05:48'),
(3407, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/f58350f7-1746-11f1-8ccc-10653022c2a0\",\"method\":\"DELETE\"}', '::1', NULL, '2026-03-09 22:05:48'),
(3408, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/f5836bbd-1746-11f1-8ccc-10653022c2a0\",\"method\":\"DELETE\"}', '::1', NULL, '2026-03-09 22:05:48'),
(3409, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/f5837514-1746-11f1-8ccc-10653022c2a0\",\"method\":\"DELETE\"}', '::1', NULL, '2026-03-09 22:05:48'),
(3410, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/f583778f-1746-11f1-8ccc-10653022c2a0\",\"method\":\"DELETE\"}', '::1', NULL, '2026-03-09 22:05:49'),
(3411, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/f584599e-1746-11f1-8ccc-10653022c2a0\",\"method\":\"DELETE\"}', '::1', NULL, '2026-03-09 22:05:49'),
(3412, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/f5845b9e-1746-11f1-8ccc-10653022c2a0\",\"method\":\"DELETE\"}', '::1', NULL, '2026-03-09 22:05:49'),
(3413, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/f5845cea-1746-11f1-8ccc-10653022c2a0\",\"method\":\"DELETE\"}', '::1', NULL, '2026-03-09 22:05:49'),
(3414, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/f5845e2e-1746-11f1-8ccc-10653022c2a0\",\"method\":\"DELETE\"}', '::1', NULL, '2026-03-09 22:05:49'),
(3415, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/f58460d1-1746-11f1-8ccc-10653022c2a0\",\"method\":\"DELETE\"}', '::1', NULL, '2026-03-09 22:05:49'),
(3416, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/f5846258-1746-11f1-8ccc-10653022c2a0\",\"method\":\"DELETE\"}', '::1', NULL, '2026-03-09 22:05:49'),
(3417, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/f58463da-1746-11f1-8ccc-10653022c2a0\",\"method\":\"DELETE\"}', '::1', NULL, '2026-03-09 22:05:49'),
(3418, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/f584655f-1746-11f1-8ccc-10653022c2a0\",\"method\":\"DELETE\"}', '::1', NULL, '2026-03-09 22:05:49'),
(3419, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/f58466ef-1746-11f1-8ccc-10653022c2a0\",\"method\":\"DELETE\"}', '::1', NULL, '2026-03-09 22:05:49'),
(3420, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/f5846874-1746-11f1-8ccc-10653022c2a0\",\"method\":\"DELETE\"}', '::1', NULL, '2026-03-09 22:05:49'),
(3421, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/f58469ef-1746-11f1-8ccc-10653022c2a0\",\"method\":\"DELETE\"}', '::1', NULL, '2026-03-09 22:05:49'),
(3422, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/f5846b59-1746-11f1-8ccc-10653022c2a0\",\"method\":\"DELETE\"}', '::1', NULL, '2026-03-09 22:05:49'),
(3423, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/f5846cdb-1746-11f1-8ccc-10653022c2a0\",\"method\":\"DELETE\"}', '::1', NULL, '2026-03-09 22:05:50'),
(3424, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/f5846e55-1746-11f1-8ccc-10653022c2a0\",\"method\":\"DELETE\"}', '::1', NULL, '2026-03-09 22:05:50'),
(3425, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:05:50'),
(3426, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:05:50'),
(3427, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:05:50'),
(3428, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/generate-id\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:05:58'),
(3429, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\",\"method\":\"POST\"}', '::1', NULL, '2026-03-09 22:06:12'),
(3430, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\",\"method\":\"POST\"}', '::1', NULL, '2026-03-09 22:06:52'),
(3431, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:06:52'),
(3432, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:06:52'),
(3433, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:06:52'),
(3434, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/generate-id\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:07:14'),
(3435, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\",\"method\":\"POST\"}', '::1', NULL, '2026-03-09 22:07:30'),
(3436, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:07:30'),
(3437, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:07:30'),
(3438, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:07:31'),
(3439, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=2&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:07:36'),
(3440, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:07:36'),
(3441, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:07:36'),
(3442, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:07:38'),
(3443, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:07:39'),
(3444, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:07:39'),
(3445, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=2&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:07:45'),
(3446, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:07:45'),
(3447, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:07:45'),
(3448, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:07:48'),
(3449, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:07:48'),
(3450, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:07:48'),
(3451, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/e64ec54e-0482-4a07-8665-21859b1d276c\\/status\",\"method\":\"PUT\"}', '::1', NULL, '2026-03-09 22:08:00'),
(3452, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/59e8023a-1b52-4d90-9c23-a8401cf59f22\\/status\",\"method\":\"PUT\"}', '::1', NULL, '2026-03-09 22:08:00'),
(3453, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/1b88a5ba-1bf5-4f47-9843-41bec47d07d3\\/status\",\"method\":\"PUT\"}', '::1', NULL, '2026-03-09 22:08:00'),
(3454, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/f58350f7-1746-11f1-8ccc-10653022c2a0\\/status\",\"method\":\"PUT\"}', '::1', NULL, '2026-03-09 22:08:00'),
(3455, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/f5836bbd-1746-11f1-8ccc-10653022c2a0\\/status\",\"method\":\"PUT\"}', '::1', NULL, '2026-03-09 22:08:00'),
(3456, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/f5837514-1746-11f1-8ccc-10653022c2a0\\/status\",\"method\":\"PUT\"}', '::1', NULL, '2026-03-09 22:08:01'),
(3457, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/f583778f-1746-11f1-8ccc-10653022c2a0\\/status\",\"method\":\"PUT\"}', '::1', NULL, '2026-03-09 22:08:01'),
(3458, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/f584599e-1746-11f1-8ccc-10653022c2a0\\/status\",\"method\":\"PUT\"}', '::1', NULL, '2026-03-09 22:08:01'),
(3459, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/f5845b9e-1746-11f1-8ccc-10653022c2a0\\/status\",\"method\":\"PUT\"}', '::1', NULL, '2026-03-09 22:08:01'),
(3460, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/f5845cea-1746-11f1-8ccc-10653022c2a0\\/status\",\"method\":\"PUT\"}', '::1', NULL, '2026-03-09 22:08:01'),
(3461, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/f5845e2e-1746-11f1-8ccc-10653022c2a0\\/status\",\"method\":\"PUT\"}', '::1', NULL, '2026-03-09 22:08:01'),
(3462, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/f58460d1-1746-11f1-8ccc-10653022c2a0\\/status\",\"method\":\"PUT\"}', '::1', NULL, '2026-03-09 22:08:01'),
(3463, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/f5846258-1746-11f1-8ccc-10653022c2a0\\/status\",\"method\":\"PUT\"}', '::1', NULL, '2026-03-09 22:08:01'),
(3464, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/f58463da-1746-11f1-8ccc-10653022c2a0\\/status\",\"method\":\"PUT\"}', '::1', NULL, '2026-03-09 22:08:01'),
(3465, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/f584655f-1746-11f1-8ccc-10653022c2a0\\/status\",\"method\":\"PUT\"}', '::1', NULL, '2026-03-09 22:08:01'),
(3466, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/f58466ef-1746-11f1-8ccc-10653022c2a0\\/status\",\"method\":\"PUT\"}', '::1', NULL, '2026-03-09 22:08:01'),
(3467, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/f5846874-1746-11f1-8ccc-10653022c2a0\\/status\",\"method\":\"PUT\"}', '::1', NULL, '2026-03-09 22:08:01'),
(3468, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/f58469ef-1746-11f1-8ccc-10653022c2a0\\/status\",\"method\":\"PUT\"}', '::1', NULL, '2026-03-09 22:08:01'),
(3469, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/f5846b59-1746-11f1-8ccc-10653022c2a0\\/status\",\"method\":\"PUT\"}', '::1', NULL, '2026-03-09 22:08:02'),
(3470, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/f5846cdb-1746-11f1-8ccc-10653022c2a0\\/status\",\"method\":\"PUT\"}', '::1', NULL, '2026-03-09 22:08:02'),
(3471, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:08:02'),
(3472, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:08:02'),
(3473, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:08:02'),
(3474, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=2&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:08:05'),
(3475, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:08:05'),
(3476, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:08:05'),
(3477, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/f5846e55-1746-11f1-8ccc-10653022c2a0\\/status\",\"method\":\"PUT\"}', '::1', NULL, '2026-03-09 22:08:18'),
(3478, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=2&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:08:18'),
(3479, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:08:18'),
(3480, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:08:18'),
(3481, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20&program_id=27\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:08:24'),
(3482, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:08:24'),
(3483, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:08:24'),
(3484, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20&program_id=24\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:08:26'),
(3485, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:08:26'),
(3486, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:08:27'),
(3487, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20&program_id=26\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:08:32'),
(3488, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:08:32'),
(3489, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:08:32'),
(3490, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20&program_id=24\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:08:35'),
(3491, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:08:35'),
(3492, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:08:36'),
(3493, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:08:38'),
(3494, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:08:38'),
(3495, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:08:38'),
(3496, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=10000\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:08:55'),
(3497, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:10:31'),
(3498, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:10:31'),
(3499, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/generate-id\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:11:16'),
(3500, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\",\"method\":\"POST\"}', '::1', NULL, '2026-03-09 22:11:31'),
(3501, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:11:48'),
(3502, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:11:48'),
(3503, 147, 'api_access', '{\"endpoint\":\"\\/api\\/classes?limit=200\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:11:48'),
(3504, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:11:49'),
(3505, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:11:49'),
(3506, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:11:49'),
(3507, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:11:49'),
(3508, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:12:03'),
(3509, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:12:03'),
(3510, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:12:04'),
(3511, 147, 'api_access', '{\"endpoint\":\"\\/api\\/classes?limit=200\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:12:04'),
(3512, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:12:04'),
(3513, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:12:05'),
(3514, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:12:05'),
(3515, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/generate-id\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:12:06'),
(3516, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\",\"method\":\"POST\"}', '::1', NULL, '2026-03-09 22:12:13'),
(3517, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:12:28'),
(3518, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:12:28'),
(3519, 147, 'api_access', '{\"endpoint\":\"\\/api\\/classes?limit=200\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:12:29'),
(3520, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:12:29'),
(3521, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:12:29'),
(3522, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:12:30'),
(3523, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:12:30'),
(3524, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/generate-id\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:12:33'),
(3525, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\",\"method\":\"POST\"}', '::1', NULL, '2026-03-09 22:12:39'),
(3526, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:16:31'),
(3527, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:16:31'),
(3528, 147, 'api_access', '{\"endpoint\":\"\\/api\\/classes?limit=200\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:16:31'),
(3529, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:16:31'),
(3530, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:16:32'),
(3531, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:16:32'),
(3532, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:16:33'),
(3533, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/generate-id\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:16:36'),
(3534, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\",\"method\":\"POST\"}', '::1', NULL, '2026-03-09 22:16:47'),
(3535, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:19:55'),
(3536, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:19:56'),
(3537, 147, 'api_access', '{\"endpoint\":\"\\/api\\/classes?limit=200\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:19:58'),
(3538, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:19:58'),
(3539, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:19:58'),
(3540, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:19:59'),
(3541, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:19:59'),
(3542, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/generate-id\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:20:05'),
(3543, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:21:12'),
(3544, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:21:12'),
(3545, 147, 'api_access', '{\"endpoint\":\"\\/api\\/classes?limit=200\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:21:13'),
(3546, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:21:13'),
(3547, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:21:13'),
(3548, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:21:14'),
(3549, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:21:14'),
(3550, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/generate-id\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:21:29'),
(3551, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/generate-id\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:21:43'),
(3552, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\",\"method\":\"POST\"}', '::1', NULL, '2026-03-09 22:22:31'),
(3553, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:26:12'),
(3554, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:26:12'),
(3555, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:27:16'),
(3556, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:27:16'),
(3557, 147, 'api_access', '{\"endpoint\":\"\\/api\\/classes?limit=200\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:27:17'),
(3558, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:27:17'),
(3559, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:27:17'),
(3560, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:27:18'),
(3561, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:27:18'),
(3562, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/generate-id\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:27:26'),
(3563, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\",\"method\":\"POST\"}', '::1', NULL, '2026-03-09 22:27:41'),
(3564, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\",\"method\":\"POST\"}', '::1', NULL, '2026-03-09 22:30:25'),
(3565, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:32:15'),
(3566, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:32:15'),
(3567, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:33:31'),
(3568, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:33:31'),
(3569, 147, 'api_access', '{\"endpoint\":\"\\/api\\/classes?limit=200\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:33:32'),
(3570, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:33:32'),
(3571, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:33:33'),
(3572, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:33:33'),
(3573, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:33:33'),
(3574, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/generate-id\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:33:41'),
(3575, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\",\"method\":\"POST\"}', '::1', NULL, '2026-03-09 22:33:52'),
(3576, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\",\"method\":\"POST\"}', '::1', NULL, '2026-03-09 22:34:14'),
(3577, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\",\"method\":\"POST\"}', '::1', NULL, '2026-03-09 22:35:03'),
(3578, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:39:43'),
(3579, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:39:43'),
(3580, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:39:50'),
(3581, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:39:51'),
(3582, 147, 'api_access', '{\"endpoint\":\"\\/api\\/classes?limit=200\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:39:51'),
(3583, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:39:51'),
(3584, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:39:51'),
(3585, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:39:52'),
(3586, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:39:52'),
(3587, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/e64ec54e-0482-4a07-8665-21859b1d276c\\/status\",\"method\":\"PUT\"}', '::1', NULL, '2026-03-09 22:40:04'),
(3588, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:40:05'),
(3589, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:40:05'),
(3590, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:40:05'),
(3591, 147, 'api_access', '{\"endpoint\":\"\\/api\\/classes?limit=200\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:40:14'),
(3592, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:40:14'),
(3593, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:40:15'),
(3594, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:40:15'),
(3595, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:40:15'),
(3596, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\",\"method\":\"POST\"}', '::1', NULL, '2026-03-09 22:41:47'),
(3597, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:44:49'),
(3598, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:44:49'),
(3599, 147, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-09 22:48:46'),
(3600, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:48:50'),
(3601, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:48:50'),
(3602, 147, 'api_access', '{\"endpoint\":\"\\/api\\/classes?limit=200\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:48:58'),
(3603, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:48:59'),
(3604, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:48:59'),
(3605, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:48:59'),
(3606, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:48:59'),
(3607, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/generate-id\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:49:05'),
(3608, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\",\"method\":\"POST\"}', '::1', NULL, '2026-03-09 22:49:11'),
(3609, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\",\"method\":\"POST\"}', '::1', NULL, '2026-03-09 22:50:28'),
(3610, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\",\"method\":\"POST\"}', '::1', NULL, '2026-03-09 22:50:29'),
(3611, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\",\"method\":\"POST\"}', '::1', NULL, '2026-03-09 22:50:29'),
(3612, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\",\"method\":\"POST\"}', '::1', NULL, '2026-03-09 22:50:29'),
(3613, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\",\"method\":\"POST\"}', '::1', NULL, '2026-03-09 22:50:30'),
(3614, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\",\"method\":\"POST\"}', '::1', NULL, '2026-03-09 22:50:30'),
(3615, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\",\"method\":\"POST\"}', '::1', NULL, '2026-03-09 22:50:30'),
(3616, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\",\"method\":\"POST\"}', '::1', NULL, '2026-03-09 22:50:30'),
(3617, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\",\"method\":\"POST\"}', '::1', NULL, '2026-03-09 22:50:30'),
(3618, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\",\"method\":\"POST\"}', '::1', NULL, '2026-03-09 22:50:31'),
(3619, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\",\"method\":\"POST\"}', '::1', NULL, '2026-03-09 22:50:31'),
(3620, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\",\"method\":\"POST\"}', '::1', NULL, '2026-03-09 22:50:31'),
(3621, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\",\"method\":\"POST\"}', '::1', NULL, '2026-03-09 22:50:31'),
(3622, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\",\"method\":\"POST\"}', '::1', NULL, '2026-03-09 22:50:31'),
(3623, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\",\"method\":\"POST\"}', '::1', NULL, '2026-03-09 22:50:32'),
(3624, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:57:37'),
(3625, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:57:37'),
(3626, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:57:47'),
(3627, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:57:48'),
(3628, 147, 'api_access', '{\"endpoint\":\"\\/api\\/classes?limit=200\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:57:48'),
(3629, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:57:48'),
(3630, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:57:48'),
(3631, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:57:49'),
(3632, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:57:49'),
(3633, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:57:55'),
(3634, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:57:55'),
(3635, 147, 'api_access', '{\"endpoint\":\"\\/api\\/classes?limit=200\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:57:55'),
(3636, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:57:56'),
(3637, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:57:56'),
(3638, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:57:56'),
(3639, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 22:57:56'),
(3640, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\",\"method\":\"POST\"}', '::1', NULL, '2026-03-09 22:58:29'),
(3641, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\",\"method\":\"POST\"}', '::1', NULL, '2026-03-09 22:58:29'),
(3642, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\",\"method\":\"POST\"}', '::1', NULL, '2026-03-09 22:58:29'),
(3643, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\",\"method\":\"POST\"}', '::1', NULL, '2026-03-09 22:58:29'),
(3644, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\",\"method\":\"POST\"}', '::1', NULL, '2026-03-09 22:58:29'),
(3645, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\",\"method\":\"POST\"}', '::1', NULL, '2026-03-09 22:58:29'),
(3646, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\",\"method\":\"POST\"}', '::1', NULL, '2026-03-09 22:58:29'),
(3647, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\",\"method\":\"POST\"}', '::1', NULL, '2026-03-09 22:58:30'),
(3648, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\",\"method\":\"POST\"}', '::1', NULL, '2026-03-09 22:58:30'),
(3649, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\",\"method\":\"POST\"}', '::1', NULL, '2026-03-09 22:58:30'),
(3650, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\",\"method\":\"POST\"}', '::1', NULL, '2026-03-09 22:58:30'),
(3651, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\",\"method\":\"POST\"}', '::1', NULL, '2026-03-09 22:58:30'),
(3652, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\",\"method\":\"POST\"}', '::1', NULL, '2026-03-09 22:58:30'),
(3653, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\",\"method\":\"POST\"}', '::1', NULL, '2026-03-09 22:58:30'),
(3654, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\",\"method\":\"POST\"}', '::1', NULL, '2026-03-09 22:58:30'),
(3655, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 23:06:03'),
(3656, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 23:06:03'),
(3657, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 23:06:09'),
(3658, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 23:06:09'),
(3659, 147, 'api_access', '{\"endpoint\":\"\\/api\\/classes?limit=200\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 23:06:10'),
(3660, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 23:06:10'),
(3661, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 23:06:10'),
(3662, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 23:06:11'),
(3663, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 23:06:11'),
(3664, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/generate-id\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 23:06:16'),
(3665, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\",\"method\":\"POST\"}', '::1', NULL, '2026-03-09 23:06:29'),
(3666, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\",\"method\":\"POST\"}', '::1', NULL, '2026-03-09 23:06:29'),
(3667, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\",\"method\":\"POST\"}', '::1', NULL, '2026-03-09 23:06:29'),
(3668, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\",\"method\":\"POST\"}', '::1', NULL, '2026-03-09 23:06:29'),
(3669, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\",\"method\":\"POST\"}', '::1', NULL, '2026-03-09 23:06:29'),
(3670, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\",\"method\":\"POST\"}', '::1', NULL, '2026-03-09 23:06:29'),
(3671, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\",\"method\":\"POST\"}', '::1', NULL, '2026-03-09 23:06:29'),
(3672, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\",\"method\":\"POST\"}', '::1', NULL, '2026-03-09 23:06:29'),
(3673, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\",\"method\":\"POST\"}', '::1', NULL, '2026-03-09 23:06:29'),
(3674, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\",\"method\":\"POST\"}', '::1', NULL, '2026-03-09 23:06:30'),
(3675, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\",\"method\":\"POST\"}', '::1', NULL, '2026-03-09 23:06:30'),
(3676, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\",\"method\":\"POST\"}', '::1', NULL, '2026-03-09 23:06:30'),
(3677, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\",\"method\":\"POST\"}', '::1', NULL, '2026-03-09 23:06:30'),
(3678, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\",\"method\":\"POST\"}', '::1', NULL, '2026-03-09 23:06:30'),
(3679, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\",\"method\":\"POST\"}', '::1', NULL, '2026-03-09 23:06:30'),
(3680, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 23:11:09'),
(3681, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 23:11:09'),
(3682, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 23:12:36'),
(3683, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 23:12:36'),
(3684, 147, 'api_access', '{\"endpoint\":\"\\/api\\/classes?limit=200\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 23:12:38'),
(3685, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 23:12:39'),
(3686, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 23:12:39'),
(3687, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 23:12:40'),
(3688, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 23:12:40'),
(3689, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\",\"method\":\"POST\"}', '::1', NULL, '2026-03-09 23:13:21'),
(3690, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\",\"method\":\"POST\"}', '::1', NULL, '2026-03-09 23:13:21'),
(3691, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\",\"method\":\"POST\"}', '::1', NULL, '2026-03-09 23:13:22'),
(3692, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\",\"method\":\"POST\"}', '::1', NULL, '2026-03-09 23:13:22'),
(3693, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\",\"method\":\"POST\"}', '::1', NULL, '2026-03-09 23:13:22'),
(3694, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\",\"method\":\"POST\"}', '::1', NULL, '2026-03-09 23:13:22'),
(3695, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\",\"method\":\"POST\"}', '::1', NULL, '2026-03-09 23:13:22'),
(3696, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\",\"method\":\"POST\"}', '::1', NULL, '2026-03-09 23:13:22'),
(3697, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\",\"method\":\"POST\"}', '::1', NULL, '2026-03-09 23:13:22'),
(3698, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\",\"method\":\"POST\"}', '::1', NULL, '2026-03-09 23:13:22'),
(3699, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\",\"method\":\"POST\"}', '::1', NULL, '2026-03-09 23:13:22'),
(3700, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\",\"method\":\"POST\"}', '::1', NULL, '2026-03-09 23:13:22'),
(3701, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\",\"method\":\"POST\"}', '::1', NULL, '2026-03-09 23:13:22'),
(3702, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\",\"method\":\"POST\"}', '::1', NULL, '2026-03-09 23:13:22'),
(3703, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\",\"method\":\"POST\"}', '::1', NULL, '2026-03-09 23:13:22'),
(3704, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 23:17:35'),
(3705, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 23:17:35'),
(3706, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\",\"method\":\"POST\"}', '::1', NULL, '2026-03-09 23:17:53'),
(3707, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\",\"method\":\"POST\"}', '::1', NULL, '2026-03-09 23:17:53'),
(3708, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\",\"method\":\"POST\"}', '::1', NULL, '2026-03-09 23:17:53'),
(3709, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\",\"method\":\"POST\"}', '::1', NULL, '2026-03-09 23:17:54'),
(3710, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\",\"method\":\"POST\"}', '::1', NULL, '2026-03-09 23:17:54'),
(3711, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\",\"method\":\"POST\"}', '::1', NULL, '2026-03-09 23:17:54'),
(3712, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\",\"method\":\"POST\"}', '::1', NULL, '2026-03-09 23:17:54'),
(3713, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\",\"method\":\"POST\"}', '::1', NULL, '2026-03-09 23:17:54'),
(3714, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\",\"method\":\"POST\"}', '::1', NULL, '2026-03-09 23:17:55'),
(3715, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\",\"method\":\"POST\"}', '::1', NULL, '2026-03-09 23:17:55'),
(3716, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 23:17:55'),
(3717, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 23:17:55'),
(3718, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 23:17:55'),
(3719, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\",\"method\":\"POST\"}', '::1', NULL, '2026-03-09 23:21:08'),
(3720, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\",\"method\":\"POST\"}', '::1', NULL, '2026-03-09 23:21:09'),
(3721, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\",\"method\":\"POST\"}', '::1', NULL, '2026-03-09 23:21:09'),
(3722, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\",\"method\":\"POST\"}', '::1', NULL, '2026-03-09 23:21:09'),
(3723, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\",\"method\":\"POST\"}', '::1', NULL, '2026-03-09 23:21:09'),
(3724, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\",\"method\":\"POST\"}', '::1', NULL, '2026-03-09 23:21:09'),
(3725, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\",\"method\":\"POST\"}', '::1', NULL, '2026-03-09 23:21:09'),
(3726, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\",\"method\":\"POST\"}', '::1', NULL, '2026-03-09 23:21:09'),
(3727, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\",\"method\":\"POST\"}', '::1', NULL, '2026-03-09 23:21:09'),
(3728, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\",\"method\":\"POST\"}', '::1', NULL, '2026-03-09 23:21:09'),
(3729, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 23:22:35'),
(3730, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 23:22:35'),
(3731, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\",\"method\":\"POST\"}', '::1', NULL, '2026-03-09 23:22:51'),
(3732, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\",\"method\":\"POST\"}', '::1', NULL, '2026-03-09 23:22:51'),
(3733, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\",\"method\":\"POST\"}', '::1', NULL, '2026-03-09 23:22:51'),
(3734, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\",\"method\":\"POST\"}', '::1', NULL, '2026-03-09 23:22:52'),
(3735, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\",\"method\":\"POST\"}', '::1', NULL, '2026-03-09 23:22:52'),
(3736, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\",\"method\":\"POST\"}', '::1', NULL, '2026-03-09 23:22:52'),
(3737, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\",\"method\":\"POST\"}', '::1', NULL, '2026-03-09 23:22:52'),
(3738, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\",\"method\":\"POST\"}', '::1', NULL, '2026-03-09 23:22:52'),
(3739, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\",\"method\":\"POST\"}', '::1', NULL, '2026-03-09 23:22:53'),
(3740, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\",\"method\":\"POST\"}', '::1', NULL, '2026-03-09 23:22:53'),
(3741, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 23:22:53'),
(3742, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 23:22:53'),
(3743, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 23:22:53'),
(3744, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=2&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 23:23:35');
INSERT INTO `user_activity` (`activity_id`, `user_id`, `activity_type`, `activity_details`, `ip_address`, `user_agent`, `created_at`) VALUES
(3745, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 23:23:35'),
(3746, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 23:23:35'),
(3747, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 23:23:46'),
(3748, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 23:23:46'),
(3749, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 23:23:46'),
(3750, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/b1de86ab-4b48-48ab-ab12-5c4ac6f45619\",\"method\":\"DELETE\"}', '::1', NULL, '2026-03-09 23:23:59'),
(3751, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/0d5995fd-221f-4be6-91f1-9245d08f17eb\",\"method\":\"DELETE\"}', '::1', NULL, '2026-03-09 23:23:59'),
(3752, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/d64358b6-081d-4767-9ddb-50f456a7986f\",\"method\":\"DELETE\"}', '::1', NULL, '2026-03-09 23:23:59'),
(3753, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/d4a83bb8-f917-4c8c-a5cb-a6f6efc7ea4f\",\"method\":\"DELETE\"}', '::1', NULL, '2026-03-09 23:23:59'),
(3754, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/7889d98c-ddf9-4cff-a271-7e1dfd96dd66\",\"method\":\"DELETE\"}', '::1', NULL, '2026-03-09 23:24:00'),
(3755, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/af974722-083f-4d4f-9839-6356be63e2d2\",\"method\":\"DELETE\"}', '::1', NULL, '2026-03-09 23:24:00'),
(3756, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/ba606b63-afe6-446b-a774-c0b07b2d8d32\",\"method\":\"DELETE\"}', '::1', NULL, '2026-03-09 23:24:00'),
(3757, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/fa607265-7573-4010-b5e5-a4eb4d8de69a\",\"method\":\"DELETE\"}', '::1', NULL, '2026-03-09 23:24:00'),
(3758, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/2fd352ca-f8d1-4349-9d02-0029422f9587\",\"method\":\"DELETE\"}', '::1', NULL, '2026-03-09 23:24:00'),
(3759, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/ad7080e1-adf9-4a8c-b4ff-b9d62b5754d8\",\"method\":\"DELETE\"}', '::1', NULL, '2026-03-09 23:24:00'),
(3760, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/ab68b657-271e-4ec9-be14-5ef5a719e77a\",\"method\":\"DELETE\"}', '::1', NULL, '2026-03-09 23:24:00'),
(3761, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/2214235b-2252-4096-9ed3-a59811da9151\",\"method\":\"DELETE\"}', '::1', NULL, '2026-03-09 23:24:00'),
(3762, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/718f3534-f91b-4d99-8aeb-8b465d057bf3\",\"method\":\"DELETE\"}', '::1', NULL, '2026-03-09 23:24:00'),
(3763, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/40dbbff2-2aed-4d4e-89b8-634900c09c7b\",\"method\":\"DELETE\"}', '::1', NULL, '2026-03-09 23:24:00'),
(3764, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/59539fda-cc98-4093-b6be-d2d669a27e29\",\"method\":\"DELETE\"}', '::1', NULL, '2026-03-09 23:24:00'),
(3765, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/dfdc6202-6141-492f-b9c5-873d5a84f68d\",\"method\":\"DELETE\"}', '::1', NULL, '2026-03-09 23:24:01'),
(3766, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/5d27b523-a296-4e4c-b7fc-b7c8c28da337\",\"method\":\"DELETE\"}', '::1', NULL, '2026-03-09 23:24:01'),
(3767, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/e64ec54e-0482-4a07-8665-21859b1d276c\",\"method\":\"DELETE\"}', '::1', NULL, '2026-03-09 23:24:01'),
(3768, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/59e8023a-1b52-4d90-9c23-a8401cf59f22\",\"method\":\"DELETE\"}', '::1', NULL, '2026-03-09 23:24:01'),
(3769, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 23:24:01'),
(3770, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 23:24:01'),
(3771, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 23:24:01'),
(3772, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/b1de86ab-4b48-48ab-ab12-5c4ac6f45619\",\"method\":\"PUT\"}', '::1', NULL, '2026-03-09 23:24:19'),
(3773, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 23:24:19'),
(3774, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 23:24:19'),
(3775, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 23:24:19'),
(3776, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/b1de86ab-4b48-48ab-ab12-5c4ac6f45619\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 23:24:41'),
(3777, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/b1de86ab-4b48-48ab-ab12-5c4ac6f45619\\/courses\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 23:24:42'),
(3778, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/119\\/attendance\\/stats\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 23:24:42'),
(3779, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students\\/119\\/results\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 23:24:42'),
(3780, 147, 'api_access', '{\"endpoint\":\"\\/api\\/classes?limit=200\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 23:25:34'),
(3781, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 23:25:34'),
(3782, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 23:25:34'),
(3783, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 23:25:34'),
(3784, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 23:25:34'),
(3785, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20&status=withdrawn\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 23:25:48'),
(3786, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 23:25:48'),
(3787, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 23:25:48'),
(3788, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 23:25:52'),
(3789, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 23:25:53'),
(3790, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 23:25:53'),
(3791, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=10000\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 23:25:56'),
(3792, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20&search=ko\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 23:26:10'),
(3793, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 23:26:11'),
(3794, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 23:26:11'),
(3795, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20&search=koy\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 23:26:13'),
(3796, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 23:26:13'),
(3797, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 23:26:13'),
(3798, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20&search=ko\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 23:26:15'),
(3799, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 23:26:15'),
(3800, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 23:26:15'),
(3801, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20&search=kow\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 23:26:16'),
(3802, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 23:26:16'),
(3803, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 23:26:16'),
(3804, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 23:26:21'),
(3805, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 23:26:21'),
(3806, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 23:26:21'),
(3807, 147, 'api_access', '{\"endpoint\":\"\\/api\\/classes?limit=200\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 23:26:30'),
(3808, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 23:26:30'),
(3809, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 23:26:30'),
(3810, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 23:26:30'),
(3811, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 23:26:30'),
(3812, 147, 'api_access', '{\"endpoint\":\"\\/api\\/classes?limit=200\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 23:26:33'),
(3813, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 23:26:33'),
(3814, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 23:26:33'),
(3815, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 23:26:33'),
(3816, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 23:26:33'),
(3817, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 23:27:35'),
(3818, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 23:27:35'),
(3819, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 23:32:35'),
(3820, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 23:32:35'),
(3821, 147, 'logout', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-09 23:35:38'),
(3822, 1, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-09 23:35:57'),
(3823, 1, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/superadmin\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 23:36:00'),
(3824, 1, 'api_access', '{\"endpoint\":\"\\/api\\/superadmin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 23:36:00'),
(3825, 1, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/superadmin\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 23:36:06'),
(3826, 1, 'api_access', '{\"endpoint\":\"\\/api\\/superadmin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 23:36:06'),
(3827, 1, 'api_access', '{\"endpoint\":\"\\/api\\/roles?q=&page=1&per_page=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 23:38:43'),
(3828, 1, 'logout', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-09 23:38:52'),
(3829, 147, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-09 23:38:58'),
(3830, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 23:39:00'),
(3831, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 23:39:01'),
(3832, 147, 'api_access', '{\"endpoint\":\"\\/api\\/classes?limit=200\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 23:39:12'),
(3833, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 23:39:12'),
(3834, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 23:39:12'),
(3835, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 23:39:12'),
(3836, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 23:39:12'),
(3837, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 23:41:51'),
(3838, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 23:41:51'),
(3839, 147, 'api_access', '{\"endpoint\":\"\\/api\\/classes?limit=200\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 23:41:51'),
(3840, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 23:41:51'),
(3841, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 23:41:51'),
(3842, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 23:41:52'),
(3843, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 23:41:52'),
(3844, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 23:41:59'),
(3845, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 23:42:00'),
(3846, 147, 'api_access', '{\"endpoint\":\"\\/api\\/classes?limit=200\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 23:42:00'),
(3847, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 23:42:00'),
(3848, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 23:42:00'),
(3849, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 23:42:00'),
(3850, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 23:42:01'),
(3851, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 23:42:15'),
(3852, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 23:42:15'),
(3853, 147, 'api_access', '{\"endpoint\":\"\\/api\\/classes?limit=200\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 23:42:19'),
(3854, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 23:42:19'),
(3855, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 23:42:19'),
(3856, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 23:42:20'),
(3857, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-09 23:42:20'),
(3858, 147, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-10 05:03:30'),
(3859, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 05:03:33'),
(3860, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 05:03:33'),
(3861, 147, 'api_access', '{\"endpoint\":\"\\/api\\/classes?limit=200\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 05:03:58'),
(3862, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 05:03:59'),
(3863, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 05:03:59'),
(3864, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 05:03:59'),
(3865, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 05:03:59'),
(3866, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 05:04:05'),
(3867, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\\/f563c306-1746-11f1-8ccc-10653022c2a0\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 05:05:12'),
(3868, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\\/f563c306-1746-11f1-8ccc-10653022c2a0\\/courses\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 05:05:12'),
(3869, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\\/f563c306-1746-11f1-8ccc-10653022c2a0\\/schedule\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 05:05:12'),
(3870, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 05:05:54'),
(3871, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20&search=k\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 05:08:15'),
(3872, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20&search=ko\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 05:08:15'),
(3873, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20&search=k\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 05:08:18'),
(3874, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 05:08:19'),
(3875, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 05:08:32'),
(3876, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 05:08:32'),
(3877, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\\/f563c306-1746-11f1-8ccc-10653022c2a0\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 05:09:58'),
(3878, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20&search=ko\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 05:10:31'),
(3879, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20&search=koo\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 05:10:34'),
(3880, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20&search=ko\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 05:10:35'),
(3881, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20&search=kof\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 05:10:36'),
(3882, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20&search=kofi\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 05:10:37'),
(3883, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20&search=kof\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 05:10:39'),
(3884, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20&search=k\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 05:10:41'),
(3885, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 05:10:49'),
(3886, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20&search=k\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 05:10:52'),
(3887, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20&search=kwa\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 05:10:53'),
(3888, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20&search=kw\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 05:10:55'),
(3889, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 05:10:56'),
(3890, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20&search=k\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 05:10:57'),
(3891, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20&search=kwa\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 05:10:58'),
(3892, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20&search=kwai\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 05:10:59'),
(3893, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20&search=k\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 05:11:01'),
(3894, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 05:11:02'),
(3895, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 05:13:32'),
(3896, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 05:13:32'),
(3897, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20&department=Languages\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 05:14:08'),
(3898, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20&department=Mathematics\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 05:14:13'),
(3899, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20&department=Sciences\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 05:14:16'),
(3900, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 05:14:21'),
(3901, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 05:18:32'),
(3902, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 05:18:32'),
(3903, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 05:26:22'),
(3904, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 05:26:22'),
(3905, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 05:28:32'),
(3906, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 05:28:32'),
(3907, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 05:29:13'),
(3908, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 05:29:13'),
(3909, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 05:29:14'),
(3910, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 05:29:24'),
(3911, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 05:29:24'),
(3912, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 05:29:24'),
(3913, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 05:29:24'),
(3914, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 05:30:32'),
(3915, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 05:30:32'),
(3916, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 05:30:32'),
(3917, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 05:30:32'),
(3918, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 05:33:27'),
(3919, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 05:33:27'),
(3920, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 05:33:28'),
(3921, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 05:33:28'),
(3922, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 05:33:35'),
(3923, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 05:33:35'),
(3924, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 05:33:35'),
(3925, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 05:33:35'),
(3926, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 05:33:39'),
(3927, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 05:33:39'),
(3928, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 05:33:39'),
(3929, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 05:33:39'),
(3930, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 05:33:43'),
(3931, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 05:33:43'),
(3932, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 05:33:43'),
(3933, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 05:33:43'),
(3934, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 05:38:43'),
(3935, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 05:38:43'),
(3936, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 05:41:53'),
(3937, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 05:41:53'),
(3938, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 05:41:54'),
(3939, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 05:41:54'),
(3940, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 05:44:20'),
(3941, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 05:44:20'),
(3942, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 05:44:21'),
(3943, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 05:44:21'),
(3944, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 05:44:39'),
(3945, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 05:44:39'),
(3946, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 05:44:39'),
(3947, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 05:44:39'),
(3948, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 05:45:35'),
(3949, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 05:45:35'),
(3950, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 05:46:05'),
(3951, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 05:46:05'),
(3952, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 05:46:06'),
(3953, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 05:46:06'),
(3954, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 05:47:13'),
(3955, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 05:47:13'),
(3956, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 05:47:13'),
(3957, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 05:47:13'),
(3958, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 05:48:16'),
(3959, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 05:48:16'),
(3960, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 05:48:17'),
(3961, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 05:48:17'),
(3962, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 05:48:54'),
(3963, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 05:48:54'),
(3964, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 05:48:55'),
(3965, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 05:48:55'),
(3966, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 05:53:53'),
(3967, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 05:53:53'),
(3968, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 05:54:21'),
(3969, 147, 'api_access', '{\"endpoint\":\"\\/api\\/classes?limit=200\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 05:54:21'),
(3970, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 05:54:21'),
(3971, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 05:54:22'),
(3972, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 05:54:22'),
(3973, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 05:54:34'),
(3974, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 05:54:34'),
(3975, 147, 'api_access', '{\"endpoint\":\"\\/api\\/classes?limit=200\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 05:54:41'),
(3976, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 05:54:41'),
(3977, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 05:54:42'),
(3978, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 05:54:42'),
(3979, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 05:54:42'),
(3980, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 05:54:48'),
(3981, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 05:54:48'),
(3982, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 05:55:52'),
(3983, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 05:55:52'),
(3984, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 05:55:52'),
(3985, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 05:55:52'),
(3986, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 05:56:52'),
(3987, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 05:56:53'),
(3988, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 05:56:53'),
(3989, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 05:56:54'),
(3990, 147, 'api_access', '{\"endpoint\":\"\\/api\\/classes?limit=200\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 05:57:08'),
(3991, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 05:57:09'),
(3992, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 05:57:09'),
(3993, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 05:57:09'),
(3994, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 05:57:10'),
(3995, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 05:59:11'),
(3996, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 05:59:11'),
(3997, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:01:52'),
(3998, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:01:52'),
(3999, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:03:33'),
(4000, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:03:33'),
(4001, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:03:33'),
(4002, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:03:33'),
(4003, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:03:41'),
(4004, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:03:41'),
(4005, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:03:41'),
(4006, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:03:41'),
(4007, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:06:52'),
(4008, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:06:52'),
(4009, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:06:53'),
(4010, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:06:53'),
(4011, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:08:50'),
(4012, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:08:50'),
(4013, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:08:51'),
(4014, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:08:51'),
(4015, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:09:11'),
(4016, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:09:13'),
(4017, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:09:13'),
(4018, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:09:13'),
(4019, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\\/f563c306-1746-11f1-8ccc-10653022c2a0\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:10:00'),
(4020, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:11:17'),
(4021, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:11:17'),
(4022, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:11:18'),
(4023, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:11:18'),
(4024, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:12:59'),
(4025, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:12:59'),
(4026, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:13:00'),
(4027, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:13:00'),
(4028, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:15:58'),
(4029, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:15:58'),
(4030, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:15:59'),
(4031, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:15:59'),
(4032, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20&program_id=27\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:16:07'),
(4033, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20&program_id=24\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:16:10'),
(4034, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20&program_id=22\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:16:13'),
(4035, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20&program_id=23\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:16:20'),
(4036, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:16:26'),
(4037, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:18:39'),
(4038, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:18:39'),
(4039, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:18:40'),
(4040, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:18:40'),
(4041, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:18:49'),
(4042, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:18:49'),
(4043, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:18:50'),
(4044, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:18:50'),
(4045, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:19:07'),
(4046, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:19:07'),
(4047, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:19:08'),
(4048, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:19:09'),
(4049, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:19:20'),
(4050, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:19:20'),
(4051, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:19:21'),
(4052, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:19:21'),
(4053, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:19:28'),
(4054, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:19:28'),
(4055, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:19:29'),
(4056, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:19:29'),
(4057, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20&program_id=27\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:19:32'),
(4058, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20&program_id=22\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:19:36'),
(4059, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:19:40'),
(4060, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:22:22'),
(4061, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:22:22'),
(4062, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:22:23'),
(4063, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:22:23'),
(4064, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:22:33'),
(4065, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:22:33'),
(4066, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:22:33'),
(4067, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:22:33'),
(4068, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\\/f563c306-1746-11f1-8ccc-10653022c2a0\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:25:56'),
(4069, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\\/f563c306-1746-11f1-8ccc-10653022c2a0\\/courses\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:25:56'),
(4070, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\\/f563c306-1746-11f1-8ccc-10653022c2a0\\/schedule\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:25:56'),
(4071, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:26:16'),
(4072, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:26:16'),
(4073, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\\/f563ea9d-1746-11f1-8ccc-10653022c2a0\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:26:22'),
(4074, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\\/f563ea9d-1746-11f1-8ccc-10653022c2a0\\/courses\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:26:22'),
(4075, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\\/f563ea9d-1746-11f1-8ccc-10653022c2a0\\/schedule\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:26:22'),
(4076, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:26:29'),
(4077, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:26:29'),
(4078, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\\/f563c306-1746-11f1-8ccc-10653022c2a0\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:26:34'),
(4079, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\\/f563c306-1746-11f1-8ccc-10653022c2a0\\/courses\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:26:34'),
(4080, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\\/f563c306-1746-11f1-8ccc-10653022c2a0\\/schedule\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:26:34'),
(4081, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:27:32'),
(4082, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:27:32'),
(4083, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:28:20'),
(4084, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:28:21'),
(4085, 147, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-10 06:33:38'),
(4086, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:33:43'),
(4087, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:33:43'),
(4088, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:33:46'),
(4089, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:33:46'),
(4090, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:35:52'),
(4091, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:35:53'),
(4092, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:35:53'),
(4093, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:35:53'),
(4094, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20&program_id=27\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:36:03'),
(4095, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20&program_id=22\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:36:16'),
(4096, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:37:06');
INSERT INTO `user_activity` (`activity_id`, `user_id`, `activity_type`, `activity_details`, `ip_address`, `user_agent`, `created_at`) VALUES
(4097, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:37:06'),
(4098, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:37:06'),
(4099, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:37:06'),
(4100, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20&program_id=24\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:37:16'),
(4101, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20&program_id=23\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:37:27'),
(4102, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20&program_id=22\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:37:35'),
(4103, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:37:57'),
(4104, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\\/f563c306-1746-11f1-8ccc-10653022c2a0\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:38:05'),
(4105, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\\/f563c306-1746-11f1-8ccc-10653022c2a0\",\"method\":\"PUT\"}', '::1', NULL, '2026-03-10 06:38:14'),
(4106, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:38:14'),
(4107, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20&search=f\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:38:51'),
(4108, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20&search=fd\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:38:54'),
(4109, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20&search=f\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:38:55'),
(4110, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20&search=fi\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:38:57'),
(4111, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20&search=f\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:38:58'),
(4112, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:39:00'),
(4113, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\\/f563c306-1746-11f1-8ccc-10653022c2a0\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:39:09'),
(4114, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\\/f563c306-1746-11f1-8ccc-10653022c2a0\\/courses\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:39:09'),
(4115, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\\/f563c306-1746-11f1-8ccc-10653022c2a0\\/schedule\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:39:09'),
(4116, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:39:19'),
(4117, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:39:19'),
(4118, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\\/f563c306-1746-11f1-8ccc-10653022c2a0\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:39:31'),
(4119, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\\/f563c306-1746-11f1-8ccc-10653022c2a0\\/courses\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:39:31'),
(4120, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\\/f563c306-1746-11f1-8ccc-10653022c2a0\\/schedule\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:39:31'),
(4121, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:41:32'),
(4122, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:41:32'),
(4123, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\\/f563c306-1746-11f1-8ccc-10653022c2a0\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:41:32'),
(4124, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\\/f563c306-1746-11f1-8ccc-10653022c2a0\\/courses\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:41:34'),
(4125, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\\/f563c306-1746-11f1-8ccc-10653022c2a0\\/schedule\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:41:34'),
(4126, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:41:57'),
(4127, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:41:57'),
(4128, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\\/f563c306-1746-11f1-8ccc-10653022c2a0\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:41:59'),
(4129, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\\/f563c306-1746-11f1-8ccc-10653022c2a0\\/courses\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:41:59'),
(4130, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\\/f563c306-1746-11f1-8ccc-10653022c2a0\\/schedule\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:42:00'),
(4131, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:42:19'),
(4132, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:42:19'),
(4133, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\\/f563c306-1746-11f1-8ccc-10653022c2a0\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:42:19'),
(4134, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\\/f563c306-1746-11f1-8ccc-10653022c2a0\",\"method\":\"PUT\"}', '::1', NULL, '2026-03-10 06:42:37'),
(4135, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:42:37'),
(4136, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\\/f563c306-1746-11f1-8ccc-10653022c2a0\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:42:45'),
(4137, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\\/f563c306-1746-11f1-8ccc-10653022c2a0\\/courses\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:42:45'),
(4138, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\\/f563c306-1746-11f1-8ccc-10653022c2a0\\/schedule\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:42:45'),
(4139, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:46:56'),
(4140, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:46:56'),
(4141, 147, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-10 06:47:18'),
(4142, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\\/f563c306-1746-11f1-8ccc-10653022c2a0\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:48:01'),
(4143, 147, 'api_access', '{\"endpoint\":\"\\/api\\/users?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:48:39'),
(4144, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:52:17'),
(4145, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:52:17'),
(4146, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:52:21'),
(4147, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:52:21'),
(4148, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\\/f563c306-1746-11f1-8ccc-10653022c2a0\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:52:22'),
(4149, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\\/f563c306-1746-11f1-8ccc-10653022c2a0\\/courses\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:52:23'),
(4150, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\\/f563c306-1746-11f1-8ccc-10653022c2a0\\/schedule\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:52:23'),
(4151, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:52:31'),
(4152, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:52:31'),
(4153, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:57:21'),
(4154, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:57:21'),
(4155, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:59:30'),
(4156, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:59:30'),
(4157, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:59:30'),
(4158, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:59:30'),
(4159, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\\/f563c306-1746-11f1-8ccc-10653022c2a0\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:59:38'),
(4160, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\\/f563c306-1746-11f1-8ccc-10653022c2a0\\/courses\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:59:38'),
(4161, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\\/f563c306-1746-11f1-8ccc-10653022c2a0\\/schedule\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:59:38'),
(4162, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:59:48'),
(4163, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:59:48'),
(4164, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\\/f563c306-1746-11f1-8ccc-10653022c2a0\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:59:49'),
(4165, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\\/f563c306-1746-11f1-8ccc-10653022c2a0\\/courses\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:59:49'),
(4166, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\\/f563c306-1746-11f1-8ccc-10653022c2a0\\/schedule\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 06:59:50'),
(4167, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 07:00:19'),
(4168, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 07:00:19'),
(4169, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\\/generate-id\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 07:00:28'),
(4170, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 07:04:47'),
(4171, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 07:04:48'),
(4172, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 07:09:47'),
(4173, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 07:09:47'),
(4174, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 07:15:29'),
(4175, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 07:15:30'),
(4176, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 07:15:34'),
(4177, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 07:15:34'),
(4178, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 07:15:34'),
(4179, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 07:15:34'),
(4180, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\\/generate-id\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 07:15:45'),
(4181, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\\/generate-id\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 07:15:45'),
(4182, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 07:17:42'),
(4183, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 07:17:42'),
(4184, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 07:18:00'),
(4185, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 07:18:00'),
(4186, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 07:18:01'),
(4187, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 07:18:01'),
(4188, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\\/generate-id\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 07:18:05'),
(4189, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\\/f563c306-1746-11f1-8ccc-10653022c2a0\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 07:18:27'),
(4190, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\\/f563c306-1746-11f1-8ccc-10653022c2a0\\/courses\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 07:18:27'),
(4191, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\\/f563c306-1746-11f1-8ccc-10653022c2a0\\/schedule\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 07:18:27'),
(4192, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 07:18:37'),
(4193, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 07:18:37'),
(4194, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\\/f563c306-1746-11f1-8ccc-10653022c2a0\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 07:18:40'),
(4195, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\\/generate-id\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 07:18:53'),
(4196, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 07:19:03'),
(4197, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\",\"method\":\"POST\"}', '::1', NULL, '2026-03-10 07:19:44'),
(4198, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\",\"method\":\"POST\"}', '::1', NULL, '2026-03-10 07:20:32'),
(4199, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 07:20:32'),
(4200, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\\/902a9cf1-6814-4638-85ec-5d0e1db94f80\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 07:20:40'),
(4201, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\\/902a9cf1-6814-4638-85ec-5d0e1db94f80\\/courses\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 07:20:41'),
(4202, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\\/902a9cf1-6814-4638-85ec-5d0e1db94f80\\/schedule\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 07:20:41'),
(4203, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 07:20:55'),
(4204, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 07:20:55'),
(4205, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\\/902a9cf1-6814-4638-85ec-5d0e1db94f80\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 07:21:11'),
(4206, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\\/902a9cf1-6814-4638-85ec-5d0e1db94f80\",\"method\":\"PUT\"}', '::1', NULL, '2026-03-10 07:21:30'),
(4207, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 07:21:30'),
(4208, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\\/902a9cf1-6814-4638-85ec-5d0e1db94f80\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 07:21:39'),
(4209, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\\/902a9cf1-6814-4638-85ec-5d0e1db94f80\",\"method\":\"PUT\"}', '::1', NULL, '2026-03-10 07:22:07'),
(4210, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 07:22:07'),
(4211, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20&program_id=26\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 07:22:14'),
(4212, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 07:22:17'),
(4213, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\\/902a9cf1-6814-4638-85ec-5d0e1db94f80\",\"method\":\"PUT\"}', '::1', NULL, '2026-03-10 07:22:25'),
(4214, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 07:22:25'),
(4215, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\\/generate-id\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 07:22:29'),
(4216, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 07:23:00'),
(4217, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 07:23:00'),
(4218, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\",\"method\":\"POST\"}', '::1', NULL, '2026-03-10 07:24:42'),
(4219, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 07:24:42'),
(4220, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 07:27:46'),
(4221, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 07:27:46'),
(4222, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 07:27:47'),
(4223, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 07:27:47'),
(4224, 147, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-10 07:34:27'),
(4225, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 07:34:30'),
(4226, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 07:34:31'),
(4227, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 07:34:36'),
(4228, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 07:34:36'),
(4229, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\",\"method\":\"POST\"}', '::1', NULL, '2026-03-10 07:34:54'),
(4230, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\",\"method\":\"POST\"}', '::1', NULL, '2026-03-10 07:34:54'),
(4231, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\",\"method\":\"POST\"}', '::1', NULL, '2026-03-10 07:34:54'),
(4232, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\",\"method\":\"POST\"}', '::1', NULL, '2026-03-10 07:34:54'),
(4233, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\",\"method\":\"POST\"}', '::1', NULL, '2026-03-10 07:34:54'),
(4234, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\",\"method\":\"POST\"}', '::1', NULL, '2026-03-10 07:34:54'),
(4235, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\",\"method\":\"POST\"}', '::1', NULL, '2026-03-10 07:34:54'),
(4236, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\",\"method\":\"POST\"}', '::1', NULL, '2026-03-10 07:34:54'),
(4237, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\",\"method\":\"POST\"}', '::1', NULL, '2026-03-10 07:34:54'),
(4238, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\",\"method\":\"POST\"}', '::1', NULL, '2026-03-10 07:34:54'),
(4239, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\",\"method\":\"POST\"}', '::1', NULL, '2026-03-10 07:34:54'),
(4240, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\",\"method\":\"POST\"}', '::1', NULL, '2026-03-10 07:34:54'),
(4241, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\",\"method\":\"POST\"}', '::1', NULL, '2026-03-10 07:34:55'),
(4242, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\",\"method\":\"POST\"}', '::1', NULL, '2026-03-10 07:34:55'),
(4243, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\",\"method\":\"POST\"}', '::1', NULL, '2026-03-10 07:34:55'),
(4244, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\",\"method\":\"POST\"}', '::1', NULL, '2026-03-10 07:34:55'),
(4245, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\",\"method\":\"POST\"}', '::1', NULL, '2026-03-10 07:34:55'),
(4246, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\",\"method\":\"POST\"}', '::1', NULL, '2026-03-10 07:34:55'),
(4247, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\",\"method\":\"POST\"}', '::1', NULL, '2026-03-10 07:34:55'),
(4248, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\",\"method\":\"POST\"}', '::1', NULL, '2026-03-10 07:34:55'),
(4249, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\",\"method\":\"POST\"}', '::1', NULL, '2026-03-10 07:34:55'),
(4250, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\",\"method\":\"POST\"}', '::1', NULL, '2026-03-10 07:34:55'),
(4251, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\",\"method\":\"POST\"}', '::1', NULL, '2026-03-10 07:34:55'),
(4252, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\",\"method\":\"POST\"}', '::1', NULL, '2026-03-10 07:34:55'),
(4253, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\",\"method\":\"POST\"}', '::1', NULL, '2026-03-10 07:34:55'),
(4254, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 07:34:55'),
(4255, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 07:39:30'),
(4256, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 07:39:30'),
(4257, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\",\"method\":\"POST\"}', '::1', NULL, '2026-03-10 07:41:24'),
(4258, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\",\"method\":\"POST\"}', '::1', NULL, '2026-03-10 07:41:24'),
(4259, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\",\"method\":\"POST\"}', '::1', NULL, '2026-03-10 07:41:24'),
(4260, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\",\"method\":\"POST\"}', '::1', NULL, '2026-03-10 07:41:24'),
(4261, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\",\"method\":\"POST\"}', '::1', NULL, '2026-03-10 07:41:24'),
(4262, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\",\"method\":\"POST\"}', '::1', NULL, '2026-03-10 07:41:24'),
(4263, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\",\"method\":\"POST\"}', '::1', NULL, '2026-03-10 07:41:24'),
(4264, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\",\"method\":\"POST\"}', '::1', NULL, '2026-03-10 07:41:24'),
(4265, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\",\"method\":\"POST\"}', '::1', NULL, '2026-03-10 07:41:24'),
(4266, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\",\"method\":\"POST\"}', '::1', NULL, '2026-03-10 07:41:24'),
(4267, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\",\"method\":\"POST\"}', '::1', NULL, '2026-03-10 07:41:24'),
(4268, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\",\"method\":\"POST\"}', '::1', NULL, '2026-03-10 07:41:24'),
(4269, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\",\"method\":\"POST\"}', '::1', NULL, '2026-03-10 07:41:24'),
(4270, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\",\"method\":\"POST\"}', '::1', NULL, '2026-03-10 07:41:24'),
(4271, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\",\"method\":\"POST\"}', '::1', NULL, '2026-03-10 07:41:24'),
(4272, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\",\"method\":\"POST\"}', '::1', NULL, '2026-03-10 07:41:25'),
(4273, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\",\"method\":\"POST\"}', '::1', NULL, '2026-03-10 07:41:25'),
(4274, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\",\"method\":\"POST\"}', '::1', NULL, '2026-03-10 07:41:25'),
(4275, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\",\"method\":\"POST\"}', '::1', NULL, '2026-03-10 07:41:25'),
(4276, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\",\"method\":\"POST\"}', '::1', NULL, '2026-03-10 07:41:25'),
(4277, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\",\"method\":\"POST\"}', '::1', NULL, '2026-03-10 07:41:25'),
(4278, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 07:41:25'),
(4279, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\",\"method\":\"POST\"}', '::1', NULL, '2026-03-10 07:43:04'),
(4280, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\",\"method\":\"POST\"}', '::1', NULL, '2026-03-10 07:43:04'),
(4281, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\",\"method\":\"POST\"}', '::1', NULL, '2026-03-10 07:43:04'),
(4282, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\",\"method\":\"POST\"}', '::1', NULL, '2026-03-10 07:43:04'),
(4283, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\",\"method\":\"POST\"}', '::1', NULL, '2026-03-10 07:43:05'),
(4284, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\",\"method\":\"POST\"}', '::1', NULL, '2026-03-10 07:43:05'),
(4285, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\",\"method\":\"POST\"}', '::1', NULL, '2026-03-10 07:43:05'),
(4286, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\",\"method\":\"POST\"}', '::1', NULL, '2026-03-10 07:43:05'),
(4287, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\",\"method\":\"POST\"}', '::1', NULL, '2026-03-10 07:43:05'),
(4288, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\",\"method\":\"POST\"}', '::1', NULL, '2026-03-10 07:43:05'),
(4289, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\",\"method\":\"POST\"}', '::1', NULL, '2026-03-10 07:43:05'),
(4290, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\",\"method\":\"POST\"}', '::1', NULL, '2026-03-10 07:43:05'),
(4291, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\",\"method\":\"POST\"}', '::1', NULL, '2026-03-10 07:43:05'),
(4292, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\",\"method\":\"POST\"}', '::1', NULL, '2026-03-10 07:43:05'),
(4293, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\",\"method\":\"POST\"}', '::1', NULL, '2026-03-10 07:43:06'),
(4294, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\",\"method\":\"POST\"}', '::1', NULL, '2026-03-10 07:43:06'),
(4295, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\",\"method\":\"POST\"}', '::1', NULL, '2026-03-10 07:43:06'),
(4296, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\",\"method\":\"POST\"}', '::1', NULL, '2026-03-10 07:43:06'),
(4297, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\",\"method\":\"POST\"}', '::1', NULL, '2026-03-10 07:43:06'),
(4298, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\",\"method\":\"POST\"}', '::1', NULL, '2026-03-10 07:43:06'),
(4299, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\",\"method\":\"POST\"}', '::1', NULL, '2026-03-10 07:43:06'),
(4300, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 07:43:06'),
(4301, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=2&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 07:43:41'),
(4302, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 07:43:43'),
(4303, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\\/1cf9c9a3-03b0-41b6-9505-ede01e17e1dd\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 07:43:55'),
(4304, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\\/1cf9c9a3-03b0-41b6-9505-ede01e17e1dd\",\"method\":\"PUT\"}', '::1', NULL, '2026-03-10 07:44:19'),
(4305, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 07:44:19'),
(4306, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 07:44:29'),
(4307, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 07:44:29'),
(4308, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 07:47:36'),
(4309, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 07:47:36'),
(4310, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 07:47:50'),
(4311, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 07:47:50'),
(4312, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 07:48:21'),
(4313, 147, 'api_access', '{\"endpoint\":\"\\/api\\/classes?limit=200\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 07:48:21'),
(4314, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 07:48:21'),
(4315, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 07:48:22'),
(4316, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 07:48:22'),
(4317, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=10000\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 07:48:28'),
(4318, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 07:48:41'),
(4319, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 07:48:41'),
(4320, 147, 'api_access', '{\"endpoint\":\"\\/api\\/classes?limit=200\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 07:48:42'),
(4321, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 07:48:42'),
(4322, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 07:48:42'),
(4323, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 07:48:43'),
(4324, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 07:48:43'),
(4325, 147, 'api_access', '{\"endpoint\":\"\\/api\\/classes?limit=200\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 07:52:38'),
(4326, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 07:52:39'),
(4327, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 07:52:39'),
(4328, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 07:52:39'),
(4329, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 07:52:39'),
(4330, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 07:52:39'),
(4331, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 07:52:39'),
(4332, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 07:53:48'),
(4333, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 07:53:50'),
(4334, 147, 'api_access', '{\"endpoint\":\"\\/api\\/classes?limit=200\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 07:53:51'),
(4335, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 07:53:51'),
(4336, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 07:53:51'),
(4337, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 07:53:51'),
(4338, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 07:53:51'),
(4339, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=10000\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 07:54:19'),
(4340, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=10000\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 07:54:24'),
(4341, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 07:55:32'),
(4342, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 07:55:33'),
(4343, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 07:57:43'),
(4344, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 07:57:43'),
(4345, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 07:57:44'),
(4346, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 07:57:45'),
(4347, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=10000\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 07:57:51'),
(4348, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=10000\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 07:58:34'),
(4349, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 08:02:42'),
(4350, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 08:02:42'),
(4351, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 08:06:11'),
(4352, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 08:06:12'),
(4353, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 08:06:12'),
(4354, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 08:06:12'),
(4355, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=10000\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 08:06:28'),
(4356, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 08:08:04'),
(4357, 147, 'api_access', '{\"endpoint\":\"\\/api\\/classes?limit=200\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 08:08:04'),
(4358, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 08:08:04'),
(4359, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 08:08:04'),
(4360, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 08:08:04'),
(4361, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=10000\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 08:08:15'),
(4362, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 08:08:23'),
(4363, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 08:08:23'),
(4364, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\\/4a61a30f-259f-4dd1-b3fe-1129f679d852\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 08:08:38'),
(4365, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\\/4a61a30f-259f-4dd1-b3fe-1129f679d852\\/courses\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 08:08:39'),
(4366, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\\/4a61a30f-259f-4dd1-b3fe-1129f679d852\\/schedule\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 08:08:39'),
(4367, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 08:08:47'),
(4368, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 08:08:47'),
(4369, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\\/4a61a30f-259f-4dd1-b3fe-1129f679d852\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 08:08:47'),
(4370, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\\/4a61a30f-259f-4dd1-b3fe-1129f679d852\",\"method\":\"DELETE\"}', '::1', NULL, '2026-03-10 08:09:14'),
(4371, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\\/04796520-f31e-4c77-8d42-4349d35def9a\",\"method\":\"DELETE\"}', '::1', NULL, '2026-03-10 08:09:14'),
(4372, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\\/6bfc1390-7e3e-4522-aeef-0693b8dacb7c\",\"method\":\"DELETE\"}', '::1', NULL, '2026-03-10 08:09:14'),
(4373, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 08:09:14'),
(4374, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 08:10:15'),
(4375, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 08:10:15'),
(4376, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 08:11:08'),
(4377, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 08:11:08'),
(4378, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 08:16:09'),
(4379, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 08:16:09'),
(4380, 147, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-10 08:53:45'),
(4381, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 08:53:48'),
(4382, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 08:53:49'),
(4383, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 08:54:22'),
(4384, 147, 'api_access', '{\"endpoint\":\"\\/api\\/subjects\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 08:54:22'),
(4385, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 08:54:22'),
(4386, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\\/58\\/subjects\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 08:54:35'),
(4387, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\\/61\\/subjects\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 08:54:48'),
(4388, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=2&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 08:54:54'),
(4389, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\\/35\\/subjects\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 08:55:05'),
(4390, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 08:55:13'),
(4391, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=2&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 08:55:18'),
(4392, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\\/f563c306-1746-11f1-8ccc-10653022c2a0\",\"method\":\"PUT\"}', '::1', NULL, '2026-03-10 08:55:27'),
(4393, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=2&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 08:55:27'),
(4394, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\\/33\\/subjects\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 08:55:30'),
(4395, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 08:57:54'),
(4396, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\\/01b62b4f-aace-40ab-963d-a9894443525f\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 08:58:27'),
(4397, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\\/01b62b4f-aace-40ab-963d-a9894443525f\\/courses\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 08:58:27'),
(4398, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\\/01b62b4f-aace-40ab-963d-a9894443525f\\/schedule\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 08:58:27'),
(4399, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 08:58:35'),
(4400, 147, 'api_access', '{\"endpoint\":\"\\/api\\/subjects\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 08:58:35'),
(4401, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 08:58:35'),
(4402, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=2&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 08:58:41'),
(4403, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\\/f563c306-1746-11f1-8ccc-10653022c2a0\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 08:58:45'),
(4404, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\\/f563c306-1746-11f1-8ccc-10653022c2a0\\/courses\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 08:58:46'),
(4405, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\\/f563c306-1746-11f1-8ccc-10653022c2a0\\/schedule\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 08:58:46'),
(4406, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 08:58:48'),
(4407, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 08:58:48'),
(4408, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 08:59:11'),
(4409, 147, 'api_access', '{\"endpoint\":\"\\/api\\/subjects\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 08:59:11'),
(4410, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=2&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 08:59:11'),
(4411, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\\/33\\/subjects\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 09:00:16'),
(4412, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\\/f563c306-1746-11f1-8ccc-10653022c2a0\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 09:02:30'),
(4413, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\\/f563c306-1746-11f1-8ccc-10653022c2a0\\/schedule\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 09:02:30'),
(4414, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\\/f563c306-1746-11f1-8ccc-10653022c2a0\\/courses\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 09:02:30'),
(4415, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 09:03:01'),
(4416, 147, 'api_access', '{\"endpoint\":\"\\/api\\/subjects\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 09:03:01'),
(4417, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=2&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 09:03:01'),
(4418, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 09:03:48'),
(4419, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 09:03:49'),
(4420, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 09:07:05'),
(4421, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 09:07:05'),
(4422, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 09:07:06'),
(4423, 147, 'api_access', '{\"endpoint\":\"\\/api\\/subjects?limit=1000\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 09:07:06'),
(4424, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 09:07:06'),
(4425, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=2&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 09:07:16'),
(4426, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\\/33\\/subjects\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 09:07:20'),
(4427, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\\/33\\/subjects\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 09:07:49'),
(4428, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\\/f563c306-1746-11f1-8ccc-10653022c2a0\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 09:08:03'),
(4429, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\\/f563c306-1746-11f1-8ccc-10653022c2a0\\/courses\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 09:08:04'),
(4430, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\\/f563c306-1746-11f1-8ccc-10653022c2a0\\/schedule\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 09:08:04'),
(4431, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 09:08:29'),
(4432, 147, 'api_access', '{\"endpoint\":\"\\/api\\/subjects?limit=1000\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 09:08:29'),
(4433, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=2&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 09:08:29'),
(4434, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\\/33\\/subjects\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 09:08:37'),
(4435, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 09:12:04'),
(4436, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 09:12:04'),
(4437, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teacher-subjects\",\"method\":\"POST\"}', '::1', NULL, '2026-03-10 09:13:19'),
(4438, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\\/33\\/subjects\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 09:13:19'),
(4439, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teacher-subjects\",\"method\":\"POST\"}', '::1', NULL, '2026-03-10 09:13:36'),
(4440, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\\/33\\/subjects\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 09:13:36'),
(4441, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\\/33\\/subjects\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 09:13:43'),
(4442, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 09:13:54'),
(4443, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 09:13:54'),
(4444, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 09:13:54'),
(4445, 147, 'api_access', '{\"endpoint\":\"\\/api\\/subjects?limit=1000\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 09:13:54'),
(4446, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 09:13:54'),
(4447, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\\/48\\/subjects\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 09:14:00'),
(4448, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=2&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 09:14:04'),
(4449, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\\/33\\/subjects\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 09:14:07'),
(4450, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teacher-subjects\\/1\",\"method\":\"DELETE\"}', '::1', NULL, '2026-03-10 09:15:50'),
(4451, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\\/33\\/subjects\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 09:15:50'),
(4452, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teacher-subjects\\/2\",\"method\":\"DELETE\"}', '::1', NULL, '2026-03-10 09:15:52'),
(4453, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\\/33\\/subjects\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 09:15:52'),
(4454, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teacher-subjects\",\"method\":\"POST\"}', '::1', NULL, '2026-03-10 09:15:59'),
(4455, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\\/33\\/subjects\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 09:15:59');
INSERT INTO `user_activity` (`activity_id`, `user_id`, `activity_type`, `activity_details`, `ip_address`, `user_agent`, `created_at`) VALUES
(4456, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teacher-subjects\",\"method\":\"POST\"}', '::1', NULL, '2026-03-10 09:16:04'),
(4457, 147, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-10 09:16:56'),
(4458, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\\/f563c306-1746-11f1-8ccc-10653022c2a0\\/subjects\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 09:17:17'),
(4459, 147, 'api_access', '{\"endpoint\":\"\\/api\\/subjects\\/f554a373-1746-11f1-8ccc-10653022c2a0\\/teachers\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 09:18:13'),
(4460, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 09:18:52'),
(4461, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 09:18:53'),
(4462, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teacher-subjects\",\"method\":\"POST\"}', '::1', NULL, '2026-03-10 09:20:27'),
(4463, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\\/33\\/subjects\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 09:20:27'),
(4464, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 09:23:52'),
(4465, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 09:23:53'),
(4466, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\\/f563c306-1746-11f1-8ccc-10653022c2a0\\/subjects\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 09:35:26'),
(4467, 147, 'api_access', '{\"endpoint\":\"\\/api\\/subjects\\/f554a373-1746-11f1-8ccc-10653022c2a0\\/teachers\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 09:35:36'),
(4468, 147, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-10 11:19:20'),
(4469, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 11:19:21'),
(4470, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 11:19:21'),
(4471, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 11:19:27'),
(4472, 147, 'api_access', '{\"endpoint\":\"\\/api\\/subjects?limit=1000\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 11:19:27'),
(4473, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 11:19:27'),
(4474, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\\/58\\/subjects\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 11:19:40'),
(4475, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 11:19:46'),
(4476, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 11:19:47'),
(4477, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 11:19:47'),
(4478, 147, 'api_access', '{\"endpoint\":\"\\/api\\/subjects?limit=1000\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 11:19:47'),
(4479, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 11:19:47'),
(4480, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 11:20:37'),
(4481, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 11:20:37'),
(4482, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 11:21:01'),
(4483, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 11:21:01'),
(4484, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 11:21:01'),
(4485, 147, 'api_access', '{\"endpoint\":\"\\/api\\/subjects?limit=1000\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 11:21:01'),
(4486, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 11:21:01'),
(4487, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\\/4a61a30f-259f-4dd1-b3fe-1129f679d852\\/subjects\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 11:21:06'),
(4488, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 11:21:13'),
(4489, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 11:21:13'),
(4490, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 11:21:14'),
(4491, 147, 'api_access', '{\"endpoint\":\"\\/api\\/subjects?limit=1000\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 11:21:14'),
(4492, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 11:21:14'),
(4493, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\\/4a61a30f-259f-4dd1-b3fe-1129f679d852\\/subjects\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 11:21:17'),
(4494, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teacher-subjects\",\"method\":\"POST\"}', '::1', NULL, '2026-03-10 11:21:55'),
(4495, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\\/4a61a30f-259f-4dd1-b3fe-1129f679d852\\/subjects\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 11:21:55'),
(4496, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\\/4a61a30f-259f-4dd1-b3fe-1129f679d852\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 11:22:07'),
(4497, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\\/4a61a30f-259f-4dd1-b3fe-1129f679d852\\/courses\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 11:22:07'),
(4498, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\\/4a61a30f-259f-4dd1-b3fe-1129f679d852\\/schedule\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 11:22:07'),
(4499, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 11:22:13'),
(4500, 147, 'api_access', '{\"endpoint\":\"\\/api\\/subjects?limit=1000\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 11:22:14'),
(4501, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 11:22:14'),
(4502, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 11:26:28'),
(4503, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 11:26:28'),
(4504, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 11:26:34'),
(4505, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 11:26:34'),
(4506, 147, 'api_access', '{\"endpoint\":\"\\/api\\/subjects?limit=1000\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 11:26:35'),
(4507, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 11:26:35'),
(4508, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 11:26:35'),
(4509, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\\/4a61a30f-259f-4dd1-b3fe-1129f679d852\\/subjects\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 11:26:44'),
(4510, 147, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-10 13:44:36'),
(4511, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 13:44:40'),
(4512, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 13:44:43'),
(4513, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 13:44:44'),
(4514, 147, 'api_access', '{\"endpoint\":\"\\/api\\/subjects?limit=1000\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 13:44:44'),
(4515, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 13:44:44'),
(4516, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=2&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 13:44:50'),
(4517, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\\/f563c306-1746-11f1-8ccc-10653022c2a0\\/subjects\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 13:44:54'),
(4518, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 13:49:40'),
(4519, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 13:49:40'),
(4520, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 13:54:52'),
(4521, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 13:54:52'),
(4522, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 13:55:00'),
(4523, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 13:55:01'),
(4524, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 13:55:01'),
(4525, 147, 'api_access', '{\"endpoint\":\"\\/api\\/subjects?limit=1000\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 13:55:01'),
(4526, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 13:55:01'),
(4527, 147, 'api_access', '{\"endpoint\":\"\\/api\\/classes?limit=1000\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 13:55:08'),
(4528, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\\/4a61a30f-259f-4dd1-b3fe-1129f679d852\\/subjects\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 13:55:09'),
(4529, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teacher-subjects\",\"method\":\"POST\"}', '::1', NULL, '2026-03-10 13:55:43'),
(4530, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\\/4a61a30f-259f-4dd1-b3fe-1129f679d852\\/subjects\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 13:55:43'),
(4531, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 13:59:59'),
(4532, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 14:00:00'),
(4533, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 14:01:33'),
(4534, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 14:01:34'),
(4535, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 14:01:34'),
(4536, 147, 'api_access', '{\"endpoint\":\"\\/api\\/subjects?limit=1000\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 14:01:34'),
(4537, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 14:01:34'),
(4538, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 14:01:40'),
(4539, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 14:01:40'),
(4540, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 14:01:41'),
(4541, 147, 'api_access', '{\"endpoint\":\"\\/api\\/subjects?limit=1000\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 14:01:42'),
(4542, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 14:01:42'),
(4543, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 14:02:05'),
(4544, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 14:02:05'),
(4545, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 14:02:06'),
(4546, 147, 'api_access', '{\"endpoint\":\"\\/api\\/subjects?limit=1000\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 14:02:06'),
(4547, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 14:02:06'),
(4548, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\\/4a61a30f-259f-4dd1-b3fe-1129f679d852\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 14:03:11'),
(4549, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\\/4a61a30f-259f-4dd1-b3fe-1129f679d852\\/courses\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 14:03:12'),
(4550, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\\/4a61a30f-259f-4dd1-b3fe-1129f679d852\\/schedule\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 14:03:12'),
(4551, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 14:03:14'),
(4552, 147, 'api_access', '{\"endpoint\":\"\\/api\\/subjects?limit=1000\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 14:03:14'),
(4553, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 14:03:14'),
(4554, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\\/04796520-f31e-4c77-8d42-4349d35def9a\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 14:03:21'),
(4555, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\\/04796520-f31e-4c77-8d42-4349d35def9a\\/courses\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 14:03:21'),
(4556, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\\/04796520-f31e-4c77-8d42-4349d35def9a\\/schedule\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 14:03:21'),
(4557, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 14:03:22'),
(4558, 147, 'api_access', '{\"endpoint\":\"\\/api\\/subjects?limit=1000\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 14:03:24'),
(4559, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 14:03:24'),
(4560, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\\/1cf9c9a3-03b0-41b6-9505-ede01e17e1dd\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 14:03:30'),
(4561, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\\/1cf9c9a3-03b0-41b6-9505-ede01e17e1dd\\/courses\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 14:03:30'),
(4562, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\\/1cf9c9a3-03b0-41b6-9505-ede01e17e1dd\\/schedule\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 14:03:30'),
(4563, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 14:03:32'),
(4564, 147, 'api_access', '{\"endpoint\":\"\\/api\\/subjects?limit=1000\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 14:03:32'),
(4565, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 14:03:32'),
(4566, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\\/4a61a30f-259f-4dd1-b3fe-1129f679d852\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 14:03:35'),
(4567, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 14:05:09'),
(4568, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 14:05:09'),
(4569, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 14:05:10'),
(4570, 147, 'api_access', '{\"endpoint\":\"\\/api\\/subjects?limit=1000\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 14:05:10'),
(4571, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 14:05:10'),
(4572, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 14:05:59'),
(4573, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 14:05:59'),
(4574, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 14:06:00'),
(4575, 147, 'api_access', '{\"endpoint\":\"\\/api\\/subjects?limit=1000\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 14:06:00'),
(4576, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 14:06:00'),
(4577, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 14:06:57'),
(4578, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 14:06:57'),
(4579, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 14:06:57'),
(4580, 147, 'api_access', '{\"endpoint\":\"\\/api\\/subjects?limit=1000\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 14:06:57'),
(4581, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 14:06:57'),
(4582, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 14:07:26'),
(4583, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 14:07:27'),
(4584, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 14:07:28'),
(4585, 147, 'api_access', '{\"endpoint\":\"\\/api\\/subjects?limit=1000\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 14:07:28'),
(4586, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 14:07:28'),
(4587, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 14:07:48'),
(4588, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 14:07:48'),
(4589, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 14:07:49'),
(4590, 147, 'api_access', '{\"endpoint\":\"\\/api\\/subjects?limit=1000\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 14:07:49'),
(4591, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 14:07:49'),
(4592, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\\/4a61a30f-259f-4dd1-b3fe-1129f679d852\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 14:07:58'),
(4593, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\\/4a61a30f-259f-4dd1-b3fe-1129f679d852\\/courses\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 14:07:58'),
(4594, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\\/4a61a30f-259f-4dd1-b3fe-1129f679d852\\/schedule\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 14:07:58'),
(4595, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 14:08:00'),
(4596, 147, 'api_access', '{\"endpoint\":\"\\/api\\/subjects?limit=1000\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 14:08:00'),
(4597, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 14:08:00'),
(4598, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 14:08:40'),
(4599, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 14:08:40'),
(4600, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 14:08:41'),
(4601, 147, 'api_access', '{\"endpoint\":\"\\/api\\/subjects?limit=1000\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 14:08:41'),
(4602, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 14:08:42'),
(4603, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 14:13:40'),
(4604, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 14:13:40'),
(4605, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 14:14:02'),
(4606, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 14:14:02'),
(4607, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 14:14:05'),
(4608, 147, 'api_access', '{\"endpoint\":\"\\/api\\/subjects?limit=1000\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 14:14:05'),
(4609, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 14:14:05'),
(4610, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\\/4a61a30f-259f-4dd1-b3fe-1129f679d852\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 14:14:48'),
(4611, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 14:19:01'),
(4612, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 14:19:02'),
(4613, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 14:37:01'),
(4614, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 14:37:03'),
(4615, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 14:39:02'),
(4616, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 14:39:02'),
(4617, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 14:45:35'),
(4618, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 14:45:35'),
(4619, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=10000\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 14:45:39'),
(4620, 147, 'api_access', '{\"endpoint\":\"\\/api\\/subjects\\/76\\/teachers\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 14:45:39'),
(4621, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=10000\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 14:45:46'),
(4622, 147, 'api_access', '{\"endpoint\":\"\\/api\\/subjects\\/74\\/teachers\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 14:45:46'),
(4623, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 14:45:49'),
(4624, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=10000\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 14:46:01'),
(4625, 147, 'api_access', '{\"endpoint\":\"\\/api\\/subjects\\/92\\/teachers\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 14:46:01'),
(4626, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 14:46:11'),
(4627, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 14:46:11'),
(4628, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 14:46:12'),
(4629, 147, 'api_access', '{\"endpoint\":\"\\/api\\/subjects?limit=1000\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 14:46:12'),
(4630, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 14:46:13'),
(4631, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=10000\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 14:46:23'),
(4632, 147, 'api_access', '{\"endpoint\":\"\\/api\\/subjects\\/89\\/teachers\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 14:46:24'),
(4633, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=10000\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 14:46:27'),
(4634, 147, 'api_access', '{\"endpoint\":\"\\/api\\/subjects\\/90\\/teachers\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 14:46:27'),
(4635, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 14:51:09'),
(4636, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 14:51:10'),
(4637, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 14:56:10'),
(4638, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 14:56:10'),
(4639, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 15:10:38'),
(4640, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 15:10:38'),
(4641, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 15:10:44'),
(4642, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 15:10:44'),
(4643, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 15:10:48'),
(4644, 147, 'api_access', '{\"endpoint\":\"\\/api\\/subjects?limit=1000\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 15:10:48'),
(4645, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 15:10:48'),
(4646, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 15:13:05'),
(4647, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 15:13:06'),
(4648, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 15:13:44'),
(4649, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 15:13:44'),
(4650, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 15:13:45'),
(4651, 147, 'api_access', '{\"endpoint\":\"\\/api\\/subjects?limit=1000\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 15:13:45'),
(4652, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 15:13:45'),
(4653, 147, 'api_access', '{\"endpoint\":\"\\/api\\/class-subjects?teacher_id=58&limit=1000\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 15:13:49'),
(4654, 147, 'api_access', '{\"endpoint\":\"\\/api\\/class-subjects?subject_id=80&limit=1000\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 15:13:54'),
(4655, 147, 'api_access', '{\"endpoint\":\"\\/api\\/class-subjects?subject_id=89&limit=1000\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 15:14:05'),
(4656, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 15:15:35'),
(4657, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 15:15:36'),
(4658, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 15:15:37'),
(4659, 147, 'api_access', '{\"endpoint\":\"\\/api\\/subjects?limit=1000\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 15:15:37'),
(4660, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 15:15:38'),
(4661, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 15:15:58'),
(4662, 147, 'api_access', '{\"endpoint\":\"\\/api\\/subjects?limit=1000\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 15:15:58'),
(4663, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 15:15:58'),
(4664, 147, 'api_access', '{\"endpoint\":\"\\/api\\/class-subjects?teacher_id=58&limit=1000\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 15:16:04'),
(4665, 147, 'api_access', '{\"endpoint\":\"\\/api\\/class-subjects?subject_id=77&limit=1000\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 15:16:11'),
(4666, 147, 'api_access', '{\"endpoint\":\"\\/api\\/class-subjects?subject_id=83&limit=1000\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 15:16:15'),
(4667, 147, 'api_access', '{\"endpoint\":\"\\/api\\/class-subjects\\/59\\/assign-teacher\",\"method\":\"POST\"}', '::1', NULL, '2026-03-10 15:16:26'),
(4668, 147, 'api_access', '{\"endpoint\":\"\\/api\\/class-subjects?teacher_id=58&limit=1000\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 15:16:26'),
(4669, 147, 'api_access', '{\"endpoint\":\"\\/api\\/class-subjects?subject_id=91&limit=1000\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 15:16:33'),
(4670, 147, 'api_access', '{\"endpoint\":\"\\/api\\/class-subjects?subject_id=75&limit=1000\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 15:16:44'),
(4671, 147, 'api_access', '{\"endpoint\":\"\\/api\\/class-subjects\\/53\\/assign-teacher\",\"method\":\"POST\"}', '::1', NULL, '2026-03-10 15:16:56'),
(4672, 147, 'api_access', '{\"endpoint\":\"\\/api\\/class-subjects?teacher_id=58&limit=1000\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 15:16:56'),
(4673, 147, 'api_access', '{\"endpoint\":\"\\/api\\/class-subjects?teacher_id=58&limit=1000\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 15:17:05'),
(4674, 147, 'api_access', '{\"endpoint\":\"\\/api\\/class-subjects?teacher_id=58&limit=1000\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 15:17:19'),
(4675, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\\/4a61a30f-259f-4dd1-b3fe-1129f679d852\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 15:17:22'),
(4676, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\\/4a61a30f-259f-4dd1-b3fe-1129f679d852\\/courses\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 15:17:22'),
(4677, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\\/4a61a30f-259f-4dd1-b3fe-1129f679d852\\/schedule\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 15:17:22'),
(4678, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 15:17:50'),
(4679, 147, 'api_access', '{\"endpoint\":\"\\/api\\/subjects?limit=1000\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 15:17:50'),
(4680, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 15:17:50'),
(4681, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=10000\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 15:18:18'),
(4682, 147, 'api_access', '{\"endpoint\":\"\\/api\\/subjects\\/75\\/teachers\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 15:18:18'),
(4683, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=10000\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 15:20:02'),
(4684, 147, 'api_access', '{\"endpoint\":\"\\/api\\/subjects\\/89\\/teachers\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 15:20:02'),
(4685, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=10000\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 15:20:07'),
(4686, 147, 'api_access', '{\"endpoint\":\"\\/api\\/subjects\\/77\\/teachers\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 15:20:07'),
(4687, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=10000\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 15:20:10'),
(4688, 147, 'api_access', '{\"endpoint\":\"\\/api\\/subjects\\/75\\/teachers\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 15:20:10'),
(4689, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=10000\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 15:20:13'),
(4690, 147, 'api_access', '{\"endpoint\":\"\\/api\\/subjects\\/91\\/teachers\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 15:20:13'),
(4691, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 15:20:18'),
(4692, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 15:20:34'),
(4693, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 15:20:35'),
(4694, 147, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-10 15:21:30'),
(4695, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\\/f563c306-1746-11f1-8ccc-10653022c2a0\\/subjects\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 15:21:43'),
(4696, 147, 'api_access', '{\"endpoint\":\"\\/api\\/subjects\\/f554a373-1746-11f1-8ccc-10653022c2a0\\/teachers\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 15:21:56'),
(4697, 147, 'api_access', '{\"endpoint\":\"\\/api\\/subjects\\/f554cbac-1746-11f1-8ccc-10653022c2a0\\/teachers\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 15:22:26'),
(4698, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=10000\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 15:23:01'),
(4699, 147, 'api_access', '{\"endpoint\":\"\\/api\\/subjects\\/75\\/teachers\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 15:23:01'),
(4700, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 15:23:51'),
(4701, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20&program_id=26\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 15:23:53'),
(4702, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20&program_id=22\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 15:23:56'),
(4703, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 15:23:58'),
(4704, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=10000\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 15:24:08'),
(4705, 147, 'api_access', '{\"endpoint\":\"\\/api\\/subjects\\/75\\/teachers\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 15:24:08'),
(4706, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 15:25:34'),
(4707, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 15:25:35'),
(4708, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 15:30:35'),
(4709, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 15:30:35'),
(4710, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 15:35:35'),
(4711, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 15:35:35'),
(4712, 147, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-10 15:59:05'),
(4713, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 15:59:08'),
(4714, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 15:59:08'),
(4715, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 15:59:11'),
(4716, 147, 'api_access', '{\"endpoint\":\"\\/api\\/subjects?limit=1000\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 15:59:11'),
(4717, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 15:59:11'),
(4718, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=10000\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 15:59:17'),
(4719, 147, 'api_access', '{\"endpoint\":\"\\/api\\/class-subjects?subject_id=75&limit=1000\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 15:59:17'),
(4720, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=10000\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 15:59:21'),
(4721, 147, 'api_access', '{\"endpoint\":\"\\/api\\/class-subjects?subject_id=91&limit=1000\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 15:59:21'),
(4722, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=10000\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 15:59:24'),
(4723, 147, 'api_access', '{\"endpoint\":\"\\/api\\/class-subjects?subject_id=76&limit=1000\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 15:59:24'),
(4724, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=10000\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 15:59:35'),
(4725, 147, 'api_access', '{\"endpoint\":\"\\/api\\/class-subjects?subject_id=92&limit=1000\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 15:59:35'),
(4726, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=10000\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 15:59:39'),
(4727, 147, 'api_access', '{\"endpoint\":\"\\/api\\/class-subjects?subject_id=81&limit=1000\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 15:59:39'),
(4728, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=10000\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 15:59:42'),
(4729, 147, 'api_access', '{\"endpoint\":\"\\/api\\/class-subjects?subject_id=89&limit=1000\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 15:59:42'),
(4730, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=10000\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 15:59:44'),
(4731, 147, 'api_access', '{\"endpoint\":\"\\/api\\/class-subjects?subject_id=75&limit=1000\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 15:59:45'),
(4732, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=10000\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 15:59:47'),
(4733, 147, 'api_access', '{\"endpoint\":\"\\/api\\/class-subjects?subject_id=86&limit=1000\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 15:59:47'),
(4734, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=10000\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 15:59:53'),
(4735, 147, 'api_access', '{\"endpoint\":\"\\/api\\/class-subjects?subject_id=74&limit=1000\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 15:59:53'),
(4736, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 15:59:57'),
(4737, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 16:04:07'),
(4738, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 16:04:08'),
(4739, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 16:09:07'),
(4740, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 16:09:08'),
(4741, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 16:12:02'),
(4742, 147, 'api_access', '{\"endpoint\":\"\\/api\\/subjects?limit=1000\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 16:12:02'),
(4743, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 16:12:02'),
(4744, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 16:12:33'),
(4745, 147, 'api_access', '{\"endpoint\":\"\\/api\\/subjects?limit=1000\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 16:12:33'),
(4746, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 16:12:33'),
(4747, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\\/4a61a30f-259f-4dd1-b3fe-1129f679d852\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 16:12:48'),
(4748, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\\/4a61a30f-259f-4dd1-b3fe-1129f679d852\\/courses\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 16:12:49'),
(4749, 147, 'api_access', '{\"endpoint\":\"\\/api\\/class-subjects?teacher_id=58&limit=1000\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 16:12:49'),
(4750, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\\/4a61a30f-259f-4dd1-b3fe-1129f679d852\\/schedule\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 16:12:49'),
(4751, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\\/4a61a30f-259f-4dd1-b3fe-1129f679d852\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 16:14:08'),
(4752, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\\/4a61a30f-259f-4dd1-b3fe-1129f679d852\\/courses\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 16:14:09'),
(4753, 147, 'api_access', '{\"endpoint\":\"\\/api\\/class-subjects?teacher_id=58&limit=1000\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 16:14:09'),
(4754, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\\/4a61a30f-259f-4dd1-b3fe-1129f679d852\\/schedule\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 16:14:09'),
(4755, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 16:31:19'),
(4756, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 16:31:20'),
(4757, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\\/4a61a30f-259f-4dd1-b3fe-1129f679d852\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 16:31:20'),
(4758, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\\/4a61a30f-259f-4dd1-b3fe-1129f679d852\\/courses\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 16:31:21'),
(4759, 147, 'api_access', '{\"endpoint\":\"\\/api\\/class-subjects?teacher_id=58&limit=1000\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 16:31:21'),
(4760, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\\/4a61a30f-259f-4dd1-b3fe-1129f679d852\\/schedule\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 16:31:21'),
(4761, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 16:32:20'),
(4762, 147, 'api_access', '{\"endpoint\":\"\\/api\\/subjects?limit=1000\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 16:32:20'),
(4763, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 16:32:20'),
(4764, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\\/4a61a30f-259f-4dd1-b3fe-1129f679d852\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 16:32:34'),
(4765, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\\/4a61a30f-259f-4dd1-b3fe-1129f679d852\\/courses\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 16:32:34'),
(4766, 147, 'api_access', '{\"endpoint\":\"\\/api\\/class-subjects?teacher_id=58&limit=1000\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 16:32:34'),
(4767, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\\/4a61a30f-259f-4dd1-b3fe-1129f679d852\\/schedule\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 16:32:34'),
(4768, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 16:34:30'),
(4769, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 16:34:30'),
(4770, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\\/4a61a30f-259f-4dd1-b3fe-1129f679d852\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 16:34:31'),
(4771, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\\/4a61a30f-259f-4dd1-b3fe-1129f679d852\\/courses\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 16:34:31'),
(4772, 147, 'api_access', '{\"endpoint\":\"\\/api\\/class-subjects?teacher_id=58&limit=1000\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 16:34:31'),
(4773, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\\/4a61a30f-259f-4dd1-b3fe-1129f679d852\\/schedule\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 16:34:32'),
(4774, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\\/4a61a30f-259f-4dd1-b3fe-1129f679d852\\/courses\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 16:34:32'),
(4775, 147, 'api_access', '{\"endpoint\":\"\\/api\\/class-subjects?teacher_id=58&limit=1000\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 16:34:32'),
(4776, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 16:39:32'),
(4777, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 16:39:33'),
(4778, 147, 'api_access', '{\"endpoint\":\"\\/api\\/subjects?limit=1000\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 16:42:21'),
(4779, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 16:42:21'),
(4780, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 16:42:21'),
(4781, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers\\/4a61a30f-259f-4dd1-b3fe-1129f679d852\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 16:42:21'),
(4782, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 16:44:29'),
(4783, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 16:44:29'),
(4784, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 16:49:30'),
(4785, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 16:49:30'),
(4786, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 16:54:30'),
(4787, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 16:54:30'),
(4788, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 16:55:41'),
(4789, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 16:55:41'),
(4790, 147, 'api_access', '{\"endpoint\":\"\\/api\\/auth\\/me\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 16:55:41'),
(4791, 147, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-10 17:02:41'),
(4792, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 17:02:44'),
(4793, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 17:02:44'),
(4794, 147, 'api_access', '{\"endpoint\":\"\\/api\\/auth\\/me\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 17:02:55'),
(4795, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 17:03:20'),
(4796, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 17:03:20'),
(4797, 147, 'api_access', '{\"endpoint\":\"\\/api\\/auth\\/me\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 17:03:21'),
(4798, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 17:03:45'),
(4799, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 17:03:46'),
(4800, 147, 'api_access', '{\"endpoint\":\"\\/api\\/auth\\/me\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 17:03:46'),
(4801, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 17:04:13'),
(4802, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 17:04:13'),
(4803, 147, 'api_access', '{\"endpoint\":\"\\/api\\/auth\\/me\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 17:04:13'),
(4804, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 17:09:13'),
(4805, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 17:09:13');
INSERT INTO `user_activity` (`activity_id`, `user_id`, `activity_type`, `activity_details`, `ip_address`, `user_agent`, `created_at`) VALUES
(4806, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 17:13:49'),
(4807, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 17:13:49'),
(4808, 147, 'api_access', '{\"endpoint\":\"\\/api\\/auth\\/me\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 17:13:50'),
(4809, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 17:14:01'),
(4810, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 17:14:01'),
(4811, 147, 'api_access', '{\"endpoint\":\"\\/api\\/auth\\/me\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 17:14:01'),
(4812, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 17:14:02'),
(4813, 147, 'api_access', '{\"endpoint\":\"\\/api\\/upload\",\"method\":\"POST\"}', '::1', NULL, '2026-03-10 17:18:42'),
(4814, 147, 'api_access', '{\"endpoint\":\"\\/api\\/users\\/f55bd9f1-1746-11f1-8ccc-10653022c2a0\",\"method\":\"PUT\"}', '::1', NULL, '2026-03-10 17:18:42'),
(4815, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 17:19:00'),
(4816, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 17:19:00'),
(4817, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 17:19:58'),
(4818, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 17:19:58'),
(4819, 147, 'api_access', '{\"endpoint\":\"\\/api\\/auth\\/me\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 17:19:58'),
(4820, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 17:19:59'),
(4821, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 17:20:11'),
(4822, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 17:20:11'),
(4823, 147, 'api_access', '{\"endpoint\":\"\\/api\\/auth\\/me\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 17:20:12'),
(4824, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 17:20:13'),
(4825, 147, 'api_access', '{\"endpoint\":\"\\/api\\/auth\\/me\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 17:22:36'),
(4826, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 17:22:36'),
(4827, 147, 'api_access', '{\"endpoint\":\"\\/api\\/auth\\/me\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 17:22:41'),
(4828, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 17:22:42'),
(4829, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 17:25:11'),
(4830, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 17:25:11'),
(4831, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 17:54:39'),
(4832, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 17:54:39'),
(4833, 147, 'logout', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-10 17:54:39'),
(4834, 147, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-10 18:08:53'),
(4835, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 18:08:56'),
(4836, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 18:08:57'),
(4837, 147, 'api_access', '{\"endpoint\":\"\\/api\\/classes?limit=200\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 18:09:06'),
(4838, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 18:09:06'),
(4839, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 18:09:06'),
(4840, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 18:09:06'),
(4841, 147, 'api_access', '{\"endpoint\":\"\\/api\\/students?limit=1&status=inactive\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 18:09:07'),
(4842, 147, 'api_access', '{\"endpoint\":\"\\/api\\/programs\\/active\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 18:09:09'),
(4843, 147, 'api_access', '{\"endpoint\":\"\\/api\\/subjects?limit=1000\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 18:09:09'),
(4844, 147, 'api_access', '{\"endpoint\":\"\\/api\\/teachers?page=1&limit=20\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 18:09:10'),
(4845, 147, 'api_access', '{\"endpoint\":\"\\/api\\/auth\\/me\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 18:09:17'),
(4846, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 18:09:17'),
(4847, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 18:10:01'),
(4848, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 18:10:02'),
(4849, 147, 'api_access', '{\"endpoint\":\"\\/api\\/auth\\/me\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 18:10:02'),
(4850, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 18:10:02'),
(4851, 147, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-10 18:14:41'),
(4852, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 18:15:00'),
(4853, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 18:15:03'),
(4854, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 18:20:00'),
(4855, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 18:20:01'),
(4856, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 18:25:00'),
(4857, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 18:25:00'),
(4858, 147, 'api_access', '{\"endpoint\":\"\\/api\\/auth\\/me\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 18:29:49'),
(4859, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 18:29:50'),
(4860, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 18:29:50'),
(4861, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 18:29:51'),
(4862, 147, 'api_access', '{\"endpoint\":\"\\/api\\/auth\\/me\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 18:30:11'),
(4863, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 18:30:12'),
(4864, 147, 'api_access', '{\"endpoint\":\"\\/api\\/upload\",\"method\":\"POST\"}', '::1', NULL, '2026-03-10 18:33:37'),
(4865, 147, 'api_access', '{\"endpoint\":\"\\/api\\/users\\/f55bd9f1-1746-11f1-8ccc-10653022c2a0\",\"method\":\"PUT\"}', '::1', NULL, '2026-03-10 18:33:38'),
(4866, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 18:34:52'),
(4867, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 18:34:52'),
(4868, 147, 'api_access', '{\"endpoint\":\"\\/api\\/auth\\/me\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 18:35:40'),
(4869, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 18:35:40'),
(4870, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 18:35:40'),
(4871, 147, 'api_access', '{\"endpoint\":\"\\/api\\/login-activity\\/my-history?limit=5\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 18:35:41'),
(4872, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 18:35:41'),
(4873, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 18:36:02'),
(4874, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 18:36:03'),
(4875, 147, 'api_access', '{\"endpoint\":\"\\/api\\/auth\\/me\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 18:36:03'),
(4876, 147, 'api_access', '{\"endpoint\":\"\\/api\\/login-activity\\/my-history?limit=5\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 18:36:03'),
(4877, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 18:36:03'),
(4878, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 18:41:01'),
(4879, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 18:41:01'),
(4880, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 18:46:02'),
(4881, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 18:46:02'),
(4882, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 18:51:03'),
(4883, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 18:51:04'),
(4884, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 19:00:01'),
(4885, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 19:00:01'),
(4886, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 19:01:55'),
(4887, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 19:01:56'),
(4888, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 19:06:01'),
(4889, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 19:06:01'),
(4890, 147, 'logout', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-10 19:07:11'),
(4891, 147, 'login', '{\"ip\":\"::1\"}', '::1', NULL, '2026-03-10 21:19:41'),
(4892, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 21:19:43'),
(4893, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 21:19:43'),
(4894, 147, 'api_access', '{\"endpoint\":\"\\/api\\/auth\\/me\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 21:20:09'),
(4895, 147, 'api_access', '{\"endpoint\":\"\\/api\\/login-activity\\/my-history?limit=5\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 21:20:09'),
(4896, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 21:20:09'),
(4897, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 21:24:43'),
(4898, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 21:24:43'),
(4899, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 21:29:43'),
(4900, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 21:29:43'),
(4901, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 21:34:43'),
(4902, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 21:34:43'),
(4903, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 21:39:43'),
(4904, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 21:39:43'),
(4905, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 21:42:15'),
(4906, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 21:42:16'),
(4907, 147, 'api_access', '{\"endpoint\":\"\\/api\\/auth\\/me\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 21:42:16'),
(4908, 147, 'api_access', '{\"endpoint\":\"\\/api\\/login-activity\\/my-history?limit=5\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 21:42:16'),
(4909, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 21:42:16'),
(4910, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 21:47:15'),
(4911, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 21:47:15'),
(4912, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 21:52:15'),
(4913, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 21:52:15'),
(4914, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 21:57:15'),
(4915, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 21:57:15'),
(4916, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 22:02:15'),
(4917, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 22:02:15'),
(4918, 147, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/admin?institution_id=1\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 22:07:15'),
(4919, 147, 'api_access', '{\"endpoint\":\"\\/api\\/admin-activity\\/recent?limit=10\",\"method\":\"GET\"}', '::1', NULL, '2026-03-10 22:07:16');

-- --------------------------------------------------------

--
-- Table structure for table `user_roles`
--
-- Creation: Mar 03, 2026 at 08:58 PM
--

DROP TABLE IF EXISTS `user_roles`;
CREATE TABLE IF NOT EXISTS `user_roles` (
  `user_role_id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `role_id` int(11) NOT NULL,
  `assigned_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`user_role_id`),
  UNIQUE KEY `unique_user_role` (`user_id`,`role_id`),
  KEY `FK_user_roles_role` (`role_id`)
) ENGINE=InnoDB AUTO_INCREMENT=331 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `user_roles`
--

INSERT INTO `user_roles` (`user_role_id`, `user_id`, `role_id`, `assigned_at`) VALUES
(209, 1, 1, '2026-03-03 21:21:31'),
(210, 147, 2, '2026-03-03 21:21:31'),
(211, 148, 2, '2026-03-03 21:21:31'),
(212, 149, 2, '2026-03-03 21:21:31'),
(213, 150, 2, '2026-03-03 21:21:31'),
(214, 151, 2, '2026-03-03 21:21:31'),
(215, 155, 3, '2026-03-03 21:21:31'),
(216, 161, 3, '2026-03-03 21:21:31'),
(217, 157, 3, '2026-03-03 21:21:31'),
(218, 153, 3, '2026-03-03 21:21:31'),
(219, 159, 3, '2026-03-03 21:21:31'),
(220, 152, 3, '2026-03-03 21:21:31'),
(221, 154, 3, '2026-03-03 21:21:31'),
(222, 158, 3, '2026-03-03 21:21:31'),
(223, 160, 3, '2026-03-03 21:21:31'),
(224, 156, 3, '2026-03-03 21:21:31'),
(230, 163, 4, '2026-03-03 21:21:31'),
(231, 175, 4, '2026-03-03 21:21:31'),
(232, 171, 4, '2026-03-03 21:21:31'),
(233, 181, 4, '2026-03-03 21:21:31'),
(234, 173, 4, '2026-03-03 21:21:31'),
(235, 179, 4, '2026-03-03 21:21:31'),
(236, 167, 4, '2026-03-03 21:21:31'),
(237, 165, 4, '2026-03-03 21:21:31'),
(238, 177, 4, '2026-03-03 21:21:31'),
(239, 169, 4, '2026-03-03 21:21:31'),
(240, 164, 4, '2026-03-03 21:21:31'),
(241, 176, 4, '2026-03-03 21:21:31'),
(242, 172, 4, '2026-03-03 21:21:31'),
(243, 166, 4, '2026-03-03 21:21:31'),
(244, 174, 4, '2026-03-03 21:21:31'),
(245, 162, 4, '2026-03-03 21:21:31'),
(246, 180, 4, '2026-03-03 21:21:31'),
(247, 170, 4, '2026-03-03 21:21:31'),
(248, 178, 4, '2026-03-03 21:21:31'),
(249, 168, 4, '2026-03-03 21:21:31'),
(261, 183, 5, '2026-03-03 21:21:31'),
(262, 191, 5, '2026-03-03 21:21:31'),
(263, 184, 5, '2026-03-03 21:21:31'),
(264, 187, 5, '2026-03-03 21:21:31'),
(265, 190, 5, '2026-03-03 21:21:31'),
(266, 189, 5, '2026-03-03 21:21:31'),
(267, 185, 5, '2026-03-03 21:21:31'),
(268, 188, 5, '2026-03-03 21:21:31'),
(269, 186, 5, '2026-03-03 21:21:31'),
(270, 182, 5, '2026-03-03 21:21:31'),
(271, 192, 3, '2026-03-09 21:51:27'),
(272, 194, 3, '2026-03-09 22:06:52'),
(273, 195, 3, '2026-03-09 22:07:30'),
(274, 196, 3, '2026-03-09 22:41:47'),
(275, 197, 3, '2026-03-09 22:50:29'),
(276, 198, 3, '2026-03-09 22:50:29'),
(277, 199, 3, '2026-03-09 22:50:29'),
(278, 200, 3, '2026-03-09 22:50:29'),
(279, 201, 3, '2026-03-09 22:50:30'),
(280, 202, 3, '2026-03-09 22:50:30'),
(281, 203, 3, '2026-03-09 22:50:30'),
(282, 204, 3, '2026-03-09 22:50:30'),
(283, 205, 3, '2026-03-09 22:50:31'),
(284, 206, 3, '2026-03-09 22:50:31'),
(285, 207, 3, '2026-03-09 22:50:31'),
(286, 208, 3, '2026-03-09 22:50:31'),
(287, 209, 3, '2026-03-09 22:50:31'),
(288, 210, 3, '2026-03-09 22:50:32'),
(289, 211, 3, '2026-03-09 22:50:32'),
(290, 212, 3, '2026-03-09 23:17:53'),
(291, 213, 3, '2026-03-09 23:17:53'),
(292, 214, 3, '2026-03-09 23:17:53'),
(293, 215, 3, '2026-03-09 23:17:54'),
(294, 216, 3, '2026-03-09 23:17:54'),
(295, 217, 3, '2026-03-09 23:17:54'),
(296, 218, 3, '2026-03-09 23:17:54'),
(297, 219, 3, '2026-03-09 23:17:55'),
(298, 220, 3, '2026-03-09 23:17:55'),
(299, 221, 3, '2026-03-09 23:17:55'),
(300, 222, 3, '2026-03-09 23:22:51'),
(301, 223, 3, '2026-03-09 23:22:51'),
(302, 224, 3, '2026-03-09 23:22:52'),
(303, 225, 3, '2026-03-09 23:22:52'),
(304, 226, 3, '2026-03-09 23:22:52'),
(305, 227, 3, '2026-03-09 23:22:52'),
(306, 228, 3, '2026-03-09 23:22:52'),
(307, 229, 3, '2026-03-09 23:22:53'),
(308, 230, 3, '2026-03-09 23:22:53'),
(309, 231, 3, '2026-03-09 23:22:53'),
(310, 232, 3, '2026-03-10 07:20:32'),
(311, 233, 3, '2026-03-10 07:24:42'),
(312, 234, 3, '2026-03-10 07:43:04'),
(313, 235, 3, '2026-03-10 07:43:04'),
(314, 236, 3, '2026-03-10 07:43:04'),
(315, 237, 3, '2026-03-10 07:43:04'),
(316, 238, 3, '2026-03-10 07:43:05'),
(317, 239, 3, '2026-03-10 07:43:05'),
(318, 240, 3, '2026-03-10 07:43:05'),
(319, 241, 3, '2026-03-10 07:43:05'),
(320, 242, 3, '2026-03-10 07:43:05'),
(321, 243, 3, '2026-03-10 07:43:05'),
(322, 244, 3, '2026-03-10 07:43:05'),
(323, 245, 3, '2026-03-10 07:43:05'),
(324, 246, 3, '2026-03-10 07:43:05'),
(325, 247, 3, '2026-03-10 07:43:06'),
(326, 248, 3, '2026-03-10 07:43:06'),
(327, 249, 3, '2026-03-10 07:43:06'),
(328, 250, 3, '2026-03-10 07:43:06'),
(329, 251, 3, '2026-03-10 07:43:06'),
(330, 252, 3, '2026-03-10 07:43:06');

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
