-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Mar 01, 2026 at 07:37 PM
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
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `academic_years`
--

INSERT INTO `academic_years` (`academic_year_id`, `institution_id`, `year_name`, `start_date`, `end_date`, `is_current`, `created_at`, `updated_at`) VALUES
(1, 1, '2024-2025', '2024-09-01', '2025-06-30', 1, '2026-03-01 18:17:08', '2026-03-01 18:17:08');

-- --------------------------------------------------------

--
-- Table structure for table `announcements`
--

DROP TABLE IF EXISTS `announcements`;
CREATE TABLE IF NOT EXISTS `announcements` (
  `announcement_id` int(11) NOT NULL AUTO_INCREMENT,
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
  KEY `FK_announcements_author` (`author_id`),
  KEY `idx_target_role` (`target_role`),
  KEY `idx_is_published` (`is_published`),
  KEY `idx_published_at` (`published_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `assessments`
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

--
-- Dumping data for table `assessments`
--

INSERT INTO `assessments` (`assessment_id`, `course_id`, `category_id`, `title`, `description`, `assessment_type`, `max_score`, `passing_score`, `due_date`, `duration_minutes`, `is_published`, `weight_percentage`, `created_at`, `updated_at`) VALUES
(1, 2, NULL, 'Mid-Semester Biology Test', 'Covers cell biology and genetics topics', 'exam', 100.00, 50.00, '2024-11-15 10:00:00', NULL, 1, NULL, '2026-03-01 18:17:08', '2026-03-01 18:17:08');

-- --------------------------------------------------------

--
-- Table structure for table `assessment_categories`
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
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `assessment_categories`
--

INSERT INTO `assessment_categories` (`category_id`, `category_name`, `weight_percentage`, `description`, `created_at`, `updated_at`) VALUES
(1, 'Quiz', 15.00, 'Short quizzes and tests', '2026-03-01 18:17:08', '2026-03-01 18:17:08'),
(2, 'Assignment', 20.00, 'Homework and take-home assignments', '2026-03-01 18:17:08', '2026-03-01 18:17:08'),
(3, 'Midterm', 25.00, 'Mid-term examination', '2026-03-01 18:17:08', '2026-03-01 18:17:08'),
(4, 'Final', 40.00, 'Final examination', '2026-03-01 18:17:08', '2026-03-01 18:17:08');

-- --------------------------------------------------------

--
-- Table structure for table `assessment_submissions`
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
        
        INSERT INTO notifications (user_id, title, message, notification_type)
        VALUES (
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

DROP TABLE IF EXISTS `assignments`;
CREATE TABLE IF NOT EXISTS `assignments` (
  `assignment_id` int(11) NOT NULL AUTO_INCREMENT,
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
  KEY `idx_course_id` (`course_id`),
  KEY `idx_section_id` (`section_id`),
  KEY `idx_due_date` (`due_date`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `assignments`
--

INSERT INTO `assignments` (`assignment_id`, `course_id`, `section_id`, `title`, `description`, `file_path`, `max_score`, `passing_score`, `rubric`, `submission_type`, `due_date`, `status`, `created_at`, `updated_at`) VALUES
(1, 2, 2, 'Cell Diagram and Functions', 'Draw and label a plant cell diagram, explaining the function of each organelle', NULL, 50.00, 25.00, 'Criteria:\n- Accurate diagram (15 pts)\n- Correct labels (15 pts)\n- Clear explanations (15 pts)\n- Presentation (5 pts)', 'both', '2024-09-22 23:59:59', 'active', '2026-03-01 18:17:08', '2026-03-01 18:17:08');

-- --------------------------------------------------------

--
-- Table structure for table `assignment_submissions`
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

--
-- Dumping data for table `assignment_submissions`
--

INSERT INTO `assignment_submissions` (`submission_id`, `assignment_id`, `student_id`, `course_id`, `submission_text`, `submission_file`, `score`, `feedback`, `graded_by`, `graded_at`, `status`, `submitted_at`, `created_at`, `updated_at`) VALUES
(1, 1, 1, 2, 'Plant Cell Diagram:\nNucleus - Controls cell activities\nMitochondria - Energy production\nChloroplast - Photosynthesis\nCell Wall - Protection and support\nVacuole - Storage', '/uploads/submissions/kwame_cell_diagram.pdf', NULL, NULL, NULL, NULL, 'submitted', '2024-09-21 16:30:00', '2026-03-01 18:17:08', '2026-03-01 18:17:08');

-- --------------------------------------------------------

--
-- Table structure for table `attendance`
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

DROP TABLE IF EXISTS `classes`;
CREATE TABLE IF NOT EXISTS `classes` (
  `class_id` int(11) NOT NULL AUTO_INCREMENT,
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
  KEY `idx_institution_id` (`institution_id`),
  KEY `idx_program_id` (`program_id`),
  KEY `idx_grade_level_id` (`grade_level_id`),
  KEY `idx_class_code` (`class_code`),
  KEY `idx_section` (`section`),
  KEY `idx_academic_year_id` (`academic_year_id`),
  KEY `idx_class_teacher_id` (`class_teacher_id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `classes`
--

INSERT INTO `classes` (`class_id`, `institution_id`, `program_id`, `grade_level_id`, `class_code`, `class_name`, `section`, `academic_year_id`, `class_teacher_id`, `max_students`, `room_number`, `status`, `created_at`, `updated_at`) VALUES
(1, 1, 1, 1, '1ART1', 'SHS 1 Art 1', 'A', 1, NULL, 40, NULL, 'active', '2026-03-01 18:17:08', '2026-03-01 18:17:08'),
(2, 1, 2, 1, '1SCI2', 'SHS 1 Science 2', 'B', 1, NULL, 40, NULL, 'active', '2026-03-01 18:17:08', '2026-03-01 18:17:08');

-- --------------------------------------------------------

--
-- Table structure for table `class_subjects`
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
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `class_subjects`
--

INSERT INTO `class_subjects` (`course_id`, `institution_id`, `class_id`, `subject_id`, `teacher_id`, `academic_year_id`, `semester_id`, `duration_weeks`, `start_date`, `end_date`, `status`, `created_at`, `updated_at`) VALUES
(1, 1, 1, 1, 1, 1, 1, 14, '2024-09-01', '2024-12-20', 'active', '2026-03-01 18:17:08', '2026-03-01 18:17:08'),
(2, 1, 2, 10, 2, 1, 1, 14, '2024-09-01', '2024-12-20', 'active', '2026-03-01 18:17:08', '2026-03-01 18:17:08');

-- --------------------------------------------------------

--
-- Table structure for table `course_content`
--

DROP TABLE IF EXISTS `course_content`;
CREATE TABLE IF NOT EXISTS `course_content` (
  `course_content_id` int(11) NOT NULL AUTO_INCREMENT,
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
  KEY `FK_course_content_creator` (`created_by`),
  KEY `idx_course_content_course` (`course_id`),
  KEY `idx_course_content_section` (`section_id`),
  KEY `idx_course_content_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `course_content_order`
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
) ;

-- --------------------------------------------------------

--
-- Table structure for table `course_enrollments`
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
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `course_enrollments`
--

INSERT INTO `course_enrollments` (`enrollment_id`, `student_id`, `course_id`, `enrollment_date`, `completion_date`, `status`, `progress_percentage`, `final_grade`) VALUES
(1, 1, 2, '2024-09-01 00:00:00', NULL, 'active', 0.00, NULL),
(2, 2, 1, '2024-09-01 00:00:00', NULL, 'active', 0.00, NULL);

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
    
    INSERT INTO notifications (user_id, title, message, notification_type)
    VALUES (
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

--
-- Dumping data for table `course_materials`
--

INSERT INTO `course_materials` (`material_id`, `course_id`, `section_id`, `title`, `description`, `material_type`, `file_name`, `file_path`, `file_size`, `external_link`, `order_index`, `is_required`, `is_active`, `uploaded_by`, `status`, `tags`, `created_at`, `updated_at`) VALUES
(1, 2, 1, 'Biology Syllabus 2024-2025', 'Complete course outline for SHS 1 Biology', 'pdf', 'biology-syllabus.pdf', '/uploads/courses/bio-1sci2/syllabus.pdf', NULL, NULL, 0, 1, 1, 4, 'active', NULL, '2026-03-01 18:17:08', '2026-03-01 18:17:08'),
(2, 2, 1, 'Introduction to Living Organisms', 'Video lecture on characteristics of life', 'video', 'living-organisms.mp4', '/uploads/courses/bio-1sci2/living-organisms.mp4', NULL, NULL, 0, 1, 1, 4, 'active', NULL, '2026-03-01 18:17:08', '2026-03-01 18:17:08'),
(3, 2, 2, 'Cell Structure Guide', 'Detailed notes on cell organelles', 'pdf', 'cell-structure.pdf', '/uploads/courses/bio-1sci2/cell-structure.pdf', NULL, NULL, 0, 1, 1, 4, 'active', NULL, '2026-03-01 18:17:08', '2026-03-01 18:17:08');

-- --------------------------------------------------------

--
-- Table structure for table `course_reviews`
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

--
-- Dumping data for table `course_sections`
--

INSERT INTO `course_sections` (`course_sections_id`, `course_id`, `section_name`, `description`, `order_index`, `is_active`, `created_by`, `created_at`, `updated_at`) VALUES
(1, 2, 'Week 1: Introduction to Biology', 'Basic concepts of living organisms and cells', 1, 1, 4, '2026-03-01 18:17:08', '2026-03-01 18:17:08'),
(2, 2, 'Week 2: Cell Structure', 'Understanding cell components and functions', 2, 1, 4, '2026-03-01 18:17:08', '2026-03-01 18:17:08'),
(3, 2, 'Week 3: Genetics', 'Introduction to heredity and DNA', 3, 1, 4, '2026-03-01 18:17:08', '2026-03-01 18:17:08');

-- --------------------------------------------------------

--
-- Table structure for table `error_logs`
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

DROP TABLE IF EXISTS `events`;
CREATE TABLE IF NOT EXISTS `events` (
  `event_id` int(11) NOT NULL AUTO_INCREMENT,
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
  KEY `FK_events_creator` (`created_by`),
  KEY `idx_institution_id` (`institution_id`),
  KEY `idx_event_dates` (`start_date`,`end_date`),
  KEY `idx_event_type` (`event_type`),
  KEY `idx_target_role` (`target_role`),
  KEY `idx_course_id` (`course_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `grade_levels`
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
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `grade_levels`
--

INSERT INTO `grade_levels` (`grade_level_id`, `institution_id`, `grade_level_code`, `grade_level_name`, `level_order`, `description`, `status`, `created_at`, `updated_at`) VALUES
(1, 1, 'SHS1', 'SHS 1', 1, 'Senior High School Year 1', 'active', '2026-03-01 18:17:08', '2026-03-01 18:17:08'),
(2, 1, 'SHS2', 'SHS 2', 2, 'Senior High School Year 2', 'active', '2026-03-01 18:17:08', '2026-03-01 18:17:08'),
(3, 1, 'SHS3', 'SHS 3', 3, 'Senior High School Year 3', 'active', '2026-03-01 18:17:08', '2026-03-01 18:17:08');

-- --------------------------------------------------------

--
-- Table structure for table `grade_reports`
--

DROP TABLE IF EXISTS `grade_reports`;
CREATE TABLE IF NOT EXISTS `grade_reports` (
  `report_id` int(11) NOT NULL AUTO_INCREMENT,
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
  UNIQUE KEY `unique_student_semester_report` (`student_id`,`academic_year_id`,`semester_id`,`report_type`),
  KEY `FK_grade_reports_generator` (`generated_by`),
  KEY `idx_institution_id` (`institution_id`),
  KEY `idx_student_id` (`student_id`),
  KEY `idx_academic_year` (`academic_year_id`),
  KEY `idx_semester` (`semester_id`),
  KEY `idx_report_type` (`report_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `grade_report_details`
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
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `grade_scales`
--

INSERT INTO `grade_scales` (`grade_scale_id`, `institution_id`, `grade`, `min_score`, `max_score`, `grade_point`, `remark`, `created_at`) VALUES
(1, 1, 'A1', 80.00, 100.00, 4.00, 'Excellent', '2026-03-01 18:17:08'),
(2, 1, 'B2', 70.00, 79.99, 3.50, 'Very Good', '2026-03-01 18:17:08'),
(3, 1, 'B3', 65.00, 69.99, 3.00, 'Good', '2026-03-01 18:17:08'),
(4, 1, 'C4', 60.00, 64.99, 2.50, 'Credit', '2026-03-01 18:17:08'),
(5, 1, 'C5', 55.00, 59.99, 2.00, 'Credit', '2026-03-01 18:17:08'),
(6, 1, 'C6', 50.00, 54.99, 1.50, 'Credit', '2026-03-01 18:17:08'),
(7, 1, 'D7', 45.00, 49.99, 1.00, 'Pass', '2026-03-01 18:17:08'),
(8, 1, 'E8', 40.00, 44.99, 0.50, 'Pass', '2026-03-01 18:17:08'),
(9, 1, 'F9', 0.00, 39.99, 0.00, 'Fail', '2026-03-01 18:17:08');

-- --------------------------------------------------------

--
-- Table structure for table `institutions`
--

DROP TABLE IF EXISTS `institutions`;
CREATE TABLE IF NOT EXISTS `institutions` (
  `institution_id` int(11) NOT NULL AUTO_INCREMENT,
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
  KEY `idx_institution_code` (`institution_code`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `institutions`
--

INSERT INTO `institutions` (`institution_id`, `institution_code`, `institution_name`, `institution_type`, `email`, `phone`, `address`, `city`, `state`, `country`, `postal_code`, `website`, `status`, `subscription_plan`, `subscription_expires_at`, `max_students`, `max_teachers`, `created_at`, `updated_at`) VALUES
(1, 'ACCRA-SHS-001', 'Accra Senior High School', 'shs', 'admin@accrashs.edu.gh', '+233 30 222 1234', 'P.O. Box 123, Accra', 'Accra', 'Greater Accra', 'Ghana', 'GA-123-4567', 'https://www.accrashs.edu.gh', 'active', 'premium', '2026-12-31', 1500, 100, '2026-03-01 18:17:08', '2026-03-01 18:17:08');

-- --------------------------------------------------------

--
-- Table structure for table `institution_settings`
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
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `institution_settings`
--

INSERT INTO `institution_settings` (`setting_id`, `institution_id`, `school_name`, `motto`, `description`, `vision`, `mission`, `logo_url`, `banner_url`, `theme_primary_color`, `theme_secondary_color`, `timezone`, `academic_year_start_month`, `academic_year_end_month`, `grading_system`, `locale`, `currency`, `date_format`, `time_format`, `allow_parent_registration`, `allow_student_self_enrollment`, `require_email_verification`, `custom_css`, `custom_footer`, `social_facebook`, `social_twitter`, `social_instagram`, `social_linkedin`, `updated_at`) VALUES
(1, 1, 'Accra Senior High School', 'Excellence Through Knowledge', 'A leading Senior High School in Accra, Ghana, committed to academic excellence and holistic development.', 'To be the premier institution for secondary education in Ghana, producing well-rounded graduates.', 'To provide quality education that empowers students to excel academically and contribute positively to society.', '/uploads/institutions/accra-shs/logo.png', NULL, '#006B3F', '#FCD116', 'Africa/Accra', 9, 6, 'ghana_waec', 'en_GH', 'GHS', 'Y-m-d', 'H:i:s', 1, 0, 1, NULL, NULL, NULL, NULL, NULL, NULL, '2026-03-01 18:17:08');

-- --------------------------------------------------------

--
-- Table structure for table `login_activity`
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

DROP TABLE IF EXISTS `messages`;
CREATE TABLE IF NOT EXISTS `messages` (
  `message_id` int(11) NOT NULL AUTO_INCREMENT,
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
  KEY `FK_messages_parent` (`parent_message_id`),
  KEY `idx_messages_sender` (`sender_id`),
  KEY `idx_messages_receiver` (`receiver_id`),
  KEY `idx_messages_course` (`course_id`),
  KEY `idx_messages_read` (`is_read`),
  KEY `idx_messages_sent_at` (`sent_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
CREATE TABLE IF NOT EXISTS `notifications` (
  `notification_id` int(11) NOT NULL AUTO_INCREMENT,
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
  KEY `idx_sender_id` (`sender_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_target_role` (`target_role`),
  KEY `idx_course_id` (`course_id`),
  KEY `idx_is_read` (`is_read`),
  KEY `idx_created_at` (`created_at`)
) ;

--
-- Dumping data for table `notifications`
--

INSERT INTO `notifications` (`notification_id`, `sender_id`, `user_id`, `target_role`, `course_id`, `title`, `message`, `notification_type`, `is_read`, `link`, `created_at`, `read_at`) VALUES
(1, 0, 5, NULL, NULL, 'Course Enrollment', NULL, 'enrollment', 0, NULL, '2026-03-01 18:17:08', NULL),
(2, 0, 6, NULL, NULL, 'Course Enrollment', NULL, 'enrollment', 0, NULL, '2026-03-01 18:17:08', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `parents`
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
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `parents`
--

INSERT INTO `parents` (`parent_id`, `institution_id`, `user_id`, `first_name`, `last_name`, `phone_number`, `email`, `occupation`, `address`, `created_at`, `updated_at`) VALUES
(1, 1, 7, '', '', '+233 24 555 5555', 'yaw.osei@parent.accrashs.edu.gh', 'Engineer', 'Accra, Ghana', '2026-03-01 18:17:08', '2026-03-01 18:17:08');

-- --------------------------------------------------------

--
-- Table structure for table `parent_students`
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
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `parent_students`
--

INSERT INTO `parent_students` (`parent_student_id`, `parent_id`, `student_id`, `relationship_type`, `is_primary_contact`, `can_pickup`, `created_at`) VALUES
(1, 1, 1, 'Father', 1, 1, '2026-03-01 18:17:08');

-- --------------------------------------------------------

--
-- Table structure for table `password_reset_tokens`
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

DROP TABLE IF EXISTS `permissions`;
CREATE TABLE IF NOT EXISTS `permissions` (
  `permission_id` int(11) NOT NULL AUTO_INCREMENT,
  `permission_name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`permission_id`),
  UNIQUE KEY `permission_name` (`permission_name`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
(8, 'manage_attendance', 'Mark and manage attendance', '2026-03-01 18:17:08');

-- --------------------------------------------------------

--
-- Table structure for table `programs`
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
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `programs`
--

INSERT INTO `programs` (`program_id`, `institution_id`, `program_code`, `program_name`, `description`, `duration_years`, `status`, `created_at`, `updated_at`) VALUES
(1, 1, 'GART', 'General Arts', 'General Arts programme focuses on humanities, languages, and social sciences', 3, 'active', '2026-03-01 18:17:08', '2026-03-01 18:17:08'),
(2, 1, 'GSCI', 'General Science', 'General Science programme focuses on pure sciences and mathematics', 3, 'active', '2026-03-01 18:17:08', '2026-03-01 18:17:08'),
(3, 1, 'BUS', 'Business', 'Business programme focuses on commerce, accounting, and economics', 3, 'active', '2026-03-01 18:17:08', '2026-03-01 18:17:08');

-- --------------------------------------------------------

--
-- Table structure for table `quizzes`
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
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `quizzes`
--

INSERT INTO `quizzes` (`quiz_id`, `course_id`, `section_id`, `title`, `description`, `duration_minutes`, `max_attempts`, `status`, `quiz_type`, `is_activated`, `show_results`, `start_date`, `end_date`, `created_at`, `updated_at`) VALUES
(1, 2, 2, 'Cell Biology Quiz', 'Test your knowledge on cell structure and functions', 45, 2, 'active', 'graded', 1, 'after_end', '2024-09-23 08:00:00', '2024-09-30 23:59:59', '2026-03-01 18:17:08', '2026-03-01 18:17:08');

-- --------------------------------------------------------

--
-- Table structure for table `quiz_questions`
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
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `quiz_questions`
--

INSERT INTO `quiz_questions` (`question_id`, `quiz_id`, `question_text`, `question_type`, `points`, `difficulty`, `explanation`, `correct_answer`, `order_index`, `created_at`, `updated_at`) VALUES
(1, 1, 'Which organelle is known as the \"powerhouse of the cell\"?', 'multiple_choice', 5, 'easy', 'Mitochondria generate ATP through cellular respiration.', NULL, 1, '2026-03-01 18:17:08', '2026-03-01 18:17:08'),
(2, 1, 'Plant cells have cell walls while animal cells do not.', 'true_false', 3, 'easy', 'Plant cells have rigid cell walls made of cellulose, which animal cells lack.', 'True', 2, '2026-03-01 18:17:08', '2026-03-01 18:17:08'),
(3, 1, 'What is the function of the cell membrane?', 'multiple_choice', 5, 'medium', 'The cell membrane controls what enters and exits the cell, acting as a selective barrier.', NULL, 3, '2026-03-01 18:17:08', '2026-03-01 18:17:08');

-- --------------------------------------------------------

--
-- Table structure for table `quiz_question_options`
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
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `quiz_question_options`
--

INSERT INTO `quiz_question_options` (`option_id`, `question_id`, `option_label`, `option_text`, `is_correct`, `created_at`) VALUES
(1, 1, 'A', 'Nucleus', 0, '2026-03-01 18:17:08'),
(2, 1, 'B', 'Mitochondria', 1, '2026-03-01 18:17:08'),
(3, 1, 'C', 'Ribosome', 0, '2026-03-01 18:17:08'),
(4, 1, 'D', 'Chloroplast', 0, '2026-03-01 18:17:08'),
(5, 2, 'T', 'True', 1, '2026-03-01 18:17:08'),
(6, 2, 'F', 'False', 0, '2026-03-01 18:17:08'),
(7, 3, 'A', 'Protein synthesis', 0, '2026-03-01 18:17:08'),
(8, 3, 'B', 'Controls what enters and exits the cell', 1, '2026-03-01 18:17:08'),
(9, 3, 'C', 'Energy production', 0, '2026-03-01 18:17:08'),
(10, 3, 'D', 'Photosynthesis', 0, '2026-03-01 18:17:08');

-- --------------------------------------------------------

--
-- Table structure for table `quiz_submissions`
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

--
-- Dumping data for table `quiz_submissions`
--

INSERT INTO `quiz_submissions` (`submission_id`, `quiz_id`, `student_id`, `attempt`, `score`, `max_score`, `status`, `duration_minutes`, `submitted_at`, `graded_at`, `graded_by`, `comments`, `created_at`, `updated_at`) VALUES
(1, 1, 1, 1, 13.00, 13.00, 'completed', 35, '2024-09-24 10:30:00', NULL, NULL, NULL, '2026-03-01 18:17:08', '2026-03-01 18:17:08');

-- --------------------------------------------------------

--
-- Table structure for table `quiz_submission_answers`
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

--
-- Dumping data for table `quiz_submission_answers`
--

INSERT INTO `quiz_submission_answers` (`submission_answer_id`, `submission_id`, `question_id`, `answer`, `is_correct`, `points_earned`, `created_at`) VALUES
(1, 1, 1, 'B', 1, 5.00, '2026-03-01 18:17:08'),
(2, 1, 2, 'True', 1, 3.00, '2026-03-01 18:17:08'),
(3, 1, 3, 'B', 1, 5.00, '2026-03-01 18:17:08');

-- --------------------------------------------------------

--
-- Table structure for table `results`
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

DROP TABLE IF EXISTS `roles`;
CREATE TABLE IF NOT EXISTS `roles` (
  `role_id` int(11) NOT NULL AUTO_INCREMENT,
  `role_name` varchar(50) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`role_id`),
  UNIQUE KEY `role_name` (`role_name`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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

DROP TABLE IF EXISTS `role_permissions`;
CREATE TABLE IF NOT EXISTS `role_permissions` (
  `role_permission_id` int(11) NOT NULL AUTO_INCREMENT,
  `role_id` int(11) NOT NULL,
  `permission_id` int(11) NOT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`role_permission_id`),
  UNIQUE KEY `unique_role_permission` (`role_id`,`permission_id`),
  KEY `FK_role_permissions_permission` (`permission_id`)
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
(25, 3, 5, '2026-03-01 18:17:08');

-- --------------------------------------------------------

--
-- Table structure for table `semesters`
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
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `semesters`
--

INSERT INTO `semesters` (`semester_id`, `institution_id`, `academic_year_id`, `semester_name`, `start_date`, `end_date`, `is_current`, `created_at`, `updated_at`) VALUES
(1, 1, 1, 'First Semester', '2024-09-01', '2024-12-20', 1, '2026-03-01 18:17:08', '2026-03-01 18:17:08'),
(2, 1, 1, 'Second Semester', '2025-01-06', '2025-04-15', 0, '2026-03-01 18:17:08', '2026-03-01 18:17:08');

-- --------------------------------------------------------

--
-- Table structure for table `students`
--

DROP TABLE IF EXISTS `students`;
CREATE TABLE IF NOT EXISTS `students` (
  `student_id` int(11) NOT NULL AUTO_INCREMENT,
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
  KEY `idx_institution_id` (`institution_id`),
  KEY `idx_class_id` (`class_id`),
  KEY `idx_student_id_number` (`student_id_number`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `students`
--

INSERT INTO `students` (`student_id`, `institution_id`, `user_id`, `class_id`, `student_id_number`, `enrollment_date`, `gender`, `date_of_birth`, `parent_name`, `parent_phone`, `parent_email`, `emergency_contact`, `status`, `created_at`, `updated_at`) VALUES
(1, 1, 5, 2, 'STU-2024-00001', '2024-09-01', 'Male', '2009-03-15', NULL, NULL, NULL, NULL, 'active', '2026-03-01 18:17:08', '2026-03-01 18:17:08'),
(2, 1, 6, 1, 'STU-2024-00002', '2024-09-01', 'Female', '2009-07-22', NULL, NULL, NULL, NULL, 'active', '2026-03-01 18:17:08', '2026-03-01 18:17:08');

-- --------------------------------------------------------

--
-- Table structure for table `subjects`
--

DROP TABLE IF EXISTS `subjects`;
CREATE TABLE IF NOT EXISTS `subjects` (
  `subject_id` int(11) NOT NULL AUTO_INCREMENT,
  `institution_id` int(11) NOT NULL,
  `subject_code` varchar(20) NOT NULL,
  `subject_name` varchar(200) NOT NULL,
  `description` text DEFAULT NULL,
  `credits` int(11) DEFAULT 3,
  `is_core` tinyint(1) DEFAULT 0,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`subject_id`),
  UNIQUE KEY `unique_subject_code_institution` (`subject_code`,`institution_id`),
  KEY `idx_institution_id` (`institution_id`),
  KEY `idx_subject_code` (`subject_code`),
  KEY `idx_is_core` (`is_core`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `subjects`
--

INSERT INTO `subjects` (`subject_id`, `institution_id`, `subject_code`, `subject_name`, `description`, `credits`, `is_core`, `created_at`, `updated_at`) VALUES
(1, 1, 'CORE-ENG', 'Core English', 'English Language - Core Subject', 4, 1, '2026-03-01 18:17:08', '2026-03-01 18:17:08'),
(2, 1, 'CORE-MATH', 'Core Mathematics', 'Mathematics - Core Subject', 4, 1, '2026-03-01 18:17:08', '2026-03-01 18:17:08'),
(3, 1, 'CORE-SCI', 'Integrated Science', 'Science - Core Subject', 3, 1, '2026-03-01 18:17:08', '2026-03-01 18:17:08'),
(4, 1, 'CORE-SOC', 'Social Studies', 'Social Studies - Core Subject', 2, 1, '2026-03-01 18:17:08', '2026-03-01 18:17:08'),
(5, 1, 'ELEC-LIT', 'Literature in English', 'Elective Literature', 3, 0, '2026-03-01 18:17:08', '2026-03-01 18:17:08'),
(6, 1, 'ELEC-HIST', 'History', 'Elective History', 3, 0, '2026-03-01 18:17:08', '2026-03-01 18:17:08'),
(7, 1, 'ELEC-GEOG', 'Geography', 'Elective Geography', 3, 0, '2026-03-01 18:17:08', '2026-03-01 18:17:08'),
(8, 1, 'ELEC-CRS', 'Christian Religious Studies', 'Elective CRS', 3, 0, '2026-03-01 18:17:08', '2026-03-01 18:17:08'),
(9, 1, 'ELEC-ECON', 'Economics', 'Elective Economics', 3, 0, '2026-03-01 18:17:08', '2026-03-01 18:17:08'),
(10, 1, 'ELEC-BIO', 'Elective Biology', 'Biology - Science Elective', 4, 0, '2026-03-01 18:17:08', '2026-03-01 18:17:08'),
(11, 1, 'ELEC-CHEM', 'Elective Chemistry', 'Chemistry - Science Elective', 4, 0, '2026-03-01 18:17:08', '2026-03-01 18:17:08'),
(12, 1, 'ELEC-PHYS', 'Elective Physics', 'Physics - Science Elective', 4, 0, '2026-03-01 18:17:08', '2026-03-01 18:17:08'),
(13, 1, 'ELEC-EMATH', 'Elective Mathematics', 'Advanced Mathematics', 4, 0, '2026-03-01 18:17:08', '2026-03-01 18:17:08'),
(14, 1, 'ELEC-ACC', 'Financial Accounting', 'Elective Accounting', 3, 0, '2026-03-01 18:17:08', '2026-03-01 18:17:08'),
(15, 1, 'ELEC-BUS', 'Business Management', 'Elective Business', 3, 0, '2026-03-01 18:17:08', '2026-03-01 18:17:08'),
(16, 1, 'ELEC-ICT', 'Information Technology', 'ICT Elective', 3, 0, '2026-03-01 18:17:08', '2026-03-01 18:17:08');

-- --------------------------------------------------------

--
-- Table structure for table `system_settings`
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
(1, '{}', '2026-03-01 18:13:59');

-- --------------------------------------------------------

--
-- Table structure for table `teachers`
--

DROP TABLE IF EXISTS `teachers`;
CREATE TABLE IF NOT EXISTS `teachers` (
  `teacher_id` int(11) NOT NULL AUTO_INCREMENT,
  `institution_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `employee_id` varchar(50) NOT NULL,
  `department` varchar(100) DEFAULT NULL,
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
  KEY `idx_institution_id` (`institution_id`),
  KEY `idx_employee_id` (`employee_id`),
  KEY `idx_department` (`department`),
  KEY `idx_employment_end_date` (`employment_end_date`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `teachers`
--

INSERT INTO `teachers` (`teacher_id`, `institution_id`, `user_id`, `employee_id`, `department`, `specialization`, `hire_date`, `employment_end_date`, `qualification`, `years_of_experience`, `created_at`, `updated_at`) VALUES
(1, 1, 3, 'EMP-2024-00001', 'Languages', 'English Language', '2020-09-01', NULL, NULL, NULL, '2026-03-01 18:17:08', '2026-03-01 18:17:08'),
(2, 1, 4, 'EMP-2024-00002', 'Sciences', 'Biology', '2021-09-01', NULL, NULL, NULL, '2026-03-01 18:17:08', '2026-03-01 18:17:08');

-- --------------------------------------------------------

--
-- Table structure for table `teacher_subjects`
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

DROP TABLE IF EXISTS `users`;
CREATE TABLE IF NOT EXISTS `users` (
  `user_id` int(11) NOT NULL AUTO_INCREMENT,
  `institution_id` int(11) DEFAULT NULL,
  `username` varchar(50) NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `password_hash` varchar(255) NOT NULL,
  `first_name` varchar(100) DEFAULT NULL,
  `last_name` varchar(100) DEFAULT NULL,
  `phone_number` varchar(20) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `date_of_birth` date DEFAULT NULL,
  `is_super_admin` tinyint(1) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `unique_username_institution` (`username`,`institution_id`),
  UNIQUE KEY `unique_email_institution` (`email`,`institution_id`),
  KEY `idx_institution` (`institution_id`),
  KEY `idx_username` (`username`),
  KEY `idx_email` (`email`),
  KEY `idx_is_super_admin` (`is_super_admin`),
  KEY `idx_is_active` (`is_active`),
  KEY `idx_user_active` (`is_active`,`created_at`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`user_id`, `institution_id`, `username`, `email`, `password_hash`, `first_name`, `last_name`, `phone_number`, `address`, `date_of_birth`, `is_super_admin`, `is_active`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, NULL, 'superadmin', 'superadmin@ghslms.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Platform', 'Super Administrator', '+233 30 000 0000', NULL, NULL, 1, 1, '2026-03-01 18:17:08', '2026-03-01 18:17:08', NULL),
(2, 1, 'admin', 'admin@accrashs.edu.gh', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'System', 'Administrator', '+233 24 000 0000', NULL, NULL, 0, 1, '2026-03-01 18:17:08', '2026-03-01 18:17:08', NULL),
(3, 1, 'kofi.mensah', 'kofi.mensah@accrashs.edu.gh', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Kofi', 'Mensah', '+233 24 111 1111', NULL, NULL, 0, 1, '2026-03-01 18:17:08', '2026-03-01 18:17:08', NULL),
(4, 1, 'ama.asante', 'ama.asante@accrashs.edu.gh', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Ama', 'Asante', '+233 24 222 2222', NULL, NULL, 0, 1, '2026-03-01 18:17:08', '2026-03-01 18:17:08', NULL),
(5, 1, 'kwame.osei', 'kwame.osei@student.accrashs.edu.gh', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Kwame', 'Osei', '+233 24 333 3333', NULL, '2009-03-15', 0, 1, '2026-03-01 18:17:08', '2026-03-01 18:17:08', NULL),
(6, 1, 'abena.adjei', 'abena.adjei@student.accrashs.edu.gh', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Abena', 'Adjei', '+233 24 444 4444', NULL, '2009-07-22', 0, 1, '2026-03-01 18:17:08', '2026-03-01 18:17:08', NULL),
(7, 1, 'yaw.osei', 'yaw.osei@parent.accrashs.edu.gh', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Yaw', 'Osei', '+233 24 555 5555', NULL, NULL, 0, 1, '2026-03-01 18:17:08', '2026-03-01 18:17:08', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `user_activity`
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

DROP TABLE IF EXISTS `user_roles`;
CREATE TABLE IF NOT EXISTS `user_roles` (
  `user_role_id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `role_id` int(11) NOT NULL,
  `assigned_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`user_role_id`),
  UNIQUE KEY `unique_user_role` (`user_id`,`role_id`),
  KEY `FK_user_roles_role` (`role_id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `user_roles`
--

INSERT INTO `user_roles` (`user_role_id`, `user_id`, `role_id`, `assigned_at`) VALUES
(1, 1, 1, '2026-03-01 18:17:08'),
(2, 2, 2, '2026-03-01 18:17:08'),
(3, 3, 3, '2026-03-01 18:17:08'),
(4, 4, 3, '2026-03-01 18:17:08'),
(5, 5, 4, '2026-03-01 18:17:08'),
(6, 6, 4, '2026-03-01 18:17:08'),
(7, 7, 5, '2026-03-01 18:17:08');

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
-- Constraints for table `teachers`
--
ALTER TABLE `teachers`
  ADD CONSTRAINT `FK_teachers_institution` FOREIGN KEY (`institution_id`) REFERENCES `institutions` (`institution_id`) ON DELETE CASCADE,
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

-- ========================================
-- UUID COLUMNS FOR API SECURITY
-- ========================================
-- Adding UUIDs to prevent predictable ID enumeration attacks
-- UUIDs are used in API endpoints while integer IDs remain for internal foreign keys

-- Add UUID columns to major tables
ALTER TABLE `institutions` ADD COLUMN `uuid` CHAR(36) NOT NULL UNIQUE AFTER `institution_id`;
ALTER TABLE `users` ADD COLUMN `uuid` CHAR(36) NOT NULL UNIQUE AFTER `user_id`;
ALTER TABLE `students` ADD COLUMN `uuid` CHAR(36) NOT NULL UNIQUE AFTER `student_id`;
ALTER TABLE `teachers` ADD COLUMN `uuid` CHAR(36) NOT NULL UNIQUE AFTER `teacher_id`;
ALTER TABLE `classes` ADD COLUMN `uuid` CHAR(36) NOT NULL UNIQUE AFTER `class_id`;
ALTER TABLE `subjects` ADD COLUMN `uuid` CHAR(36) NOT NULL UNIQUE AFTER `subject_id`;
ALTER TABLE `course_content` ADD COLUMN `uuid` CHAR(36) NOT NULL UNIQUE AFTER `course_content_id`;
ALTER TABLE `assignments` ADD COLUMN `uuid` CHAR(36) NOT NULL UNIQUE AFTER `assignment_id`;
  ALTER TABLE `grade_reports` ADD COLUMN `uuid` CHAR(36) NOT NULL UNIQUE AFTER `report_id`;
ALTER TABLE `messages` ADD COLUMN `uuid` CHAR(36) NOT NULL UNIQUE AFTER `message_id`;
ALTER TABLE `notifications` ADD COLUMN `uuid` CHAR(36) NOT NULL UNIQUE AFTER `notification_id`;
ALTER TABLE `events` ADD COLUMN `uuid` CHAR(36) NOT NULL UNIQUE AFTER `event_id`;
ALTER TABLE `announcements` ADD COLUMN `uuid` CHAR(36) NOT NULL UNIQUE AFTER `announcement_id`;

-- Add indexes for UUID lookups (performance optimization)
CREATE INDEX `idx_institutions_uuid` ON `institutions`(`uuid`);
CREATE INDEX `idx_users_uuid` ON `users`(`uuid`);
CREATE INDEX `idx_students_uuid` ON `students`(`uuid`);
CREATE INDEX `idx_teachers_uuid` ON `teachers`(`uuid`);
CREATE INDEX `idx_classes_uuid` ON `classes`(`uuid`);
CREATE INDEX `idx_subjects_uuid` ON `subjects`(`uuid`);
CREATE INDEX `idx_course_content_uuid` ON `course_content`(`uuid`);
CREATE INDEX `idx_assignments_uuid` ON `assignments`(`uuid`);
CREATE INDEX `idx_grade_reports_uuid` ON `grade_reports`(`uuid`);
CREATE INDEX `idx_messages_uuid` ON `messages`(`uuid`);
CREATE INDEX `idx_notifications_uuid` ON `notifications`(`uuid`);
CREATE INDEX `idx_events_uuid` ON `events`(`uuid`);
CREATE INDEX `idx_announcements_uuid` ON `announcements`(`uuid`);

-- Generate UUIDs for existing records in INSERT statements above
-- (UUIDs will be auto-generated by MySQL UUID() function during INSERT)

-- Update existing records with UUIDs (for data already inserted above)
UPDATE `institutions` SET `uuid` = UUID() WHERE `uuid` = '';
UPDATE `users` SET `uuid` = UUID() WHERE `uuid` = '';
UPDATE `students` SET `uuid` = UUID() WHERE `uuid` = '';
UPDATE `teachers` SET `uuid` = UUID() WHERE `uuid` = '';
UPDATE `classes` SET `uuid` = UUID() WHERE `uuid` = '';
UPDATE `subjects` SET `uuid` = UUID() WHERE `uuid` = '';
UPDATE `course_content` SET `uuid` = UUID() WHERE `uuid` = '';
UPDATE `assignments` SET `uuid` = UUID() WHERE `uuid` = '';
UPDATE `grade_reports` SET `uuid` = UUID() WHERE `uuid` = '';
UPDATE `messages` SET `uuid` = UUID() WHERE `uuid` = '';
UPDATE `notifications` SET `uuid` = UUID() WHERE `uuid` = '';
UPDATE `events` SET `uuid` = UUID() WHERE `uuid` = '';
UPDATE `announcements` SET `uuid` = UUID() WHERE `uuid` = '';

SET FOREIGN_KEY_CHECKS=1;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
