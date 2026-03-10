-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Mar 08, 2026 at 06:55 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

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

-- --------------------------------------------------------

--
-- Table structure for table `academic_years`
--

CREATE TABLE `academic_years` (
  `academic_year_id` int(11) NOT NULL,
  `institution_id` int(11) NOT NULL,
  `year_name` varchar(20) NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `is_current` tinyint(1) DEFAULT 0,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
-- Table structure for table `announcements`
--

CREATE TABLE `announcements` (
  `announcement_id` int(11) NOT NULL,
  `uuid` char(36) NOT NULL,
  `title` varchar(200) NOT NULL,
  `content` text DEFAULT NULL,
  `author_id` int(11) DEFAULT NULL,
  `target_role` varchar(50) DEFAULT NULL,
  `is_published` tinyint(1) DEFAULT 0,
  `published_at` datetime DEFAULT NULL,
  `expires_at` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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

CREATE TABLE `assessments` (
  `assessment_id` int(11) NOT NULL,
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
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `assessment_categories`
--

CREATE TABLE `assessment_categories` (
  `category_id` int(11) NOT NULL,
  `category_name` varchar(100) NOT NULL,
  `weight_percentage` decimal(5,2) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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

CREATE TABLE `assessment_submissions` (
  `submission_id` int(11) NOT NULL,
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
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Triggers `assessment_submissions`
--
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

CREATE TABLE `assignments` (
  `assignment_id` int(11) NOT NULL,
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
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `assignments`
--

INSERT INTO `assignments` (`assignment_id`, `uuid`, `course_id`, `section_id`, `title`, `description`, `file_path`, `max_score`, `passing_score`, `rubric`, `submission_type`, `due_date`, `status`, `created_at`, `updated_at`) VALUES
(32, 'f5b9f76d-1746-11f1-8ccc-10653022c2a0', 48, NULL, 'Essay Writing - My First Day', 'Write a 500-word essay about your first day at school', NULL, 20.00, 60.00, NULL, 'both', '2024-09-15 23:59:59', 'active', '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(33, 'f5bd81f0-1746-11f1-8ccc-10653022c2a0', 48, NULL, 'Grammar Exercise Set 1', 'Complete exercises on page 25-30', NULL, 15.00, 60.00, NULL, 'both', '2024-09-22 23:59:59', 'active', '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(34, 'f5bd8749-1746-11f1-8ccc-10653022c2a0', 54, NULL, 'Cell Structure Diagram', 'Draw and label a plant cell', NULL, 25.00, 60.00, NULL, 'both', '2024-09-18 23:59:59', 'active', '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
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

CREATE TABLE `assignment_submissions` (
  `submission_id` int(11) NOT NULL,
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
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `attendance`
--

CREATE TABLE `attendance` (
  `attendance_id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `course_id` int(11) NOT NULL,
  `attendance_date` date NOT NULL,
  `status` varchar(20) NOT NULL,
  `remarks` text DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `attendance`
--

INSERT INTO `attendance` (`attendance_id`, `student_id`, `course_id`, `attendance_date`, `status`, `remarks`, `created_at`, `updated_at`) VALUES
(1, 64, 48, '2024-09-01', 'present', NULL, '2026-03-03 21:21:32', '2026-03-03 21:21:32'),
(2, 66, 48, '2024-09-01', 'present', NULL, '2026-03-03 21:21:32', '2026-03-03 21:21:32'),
(3, 70, 48, '2024-09-01', 'present', NULL, '2026-03-03 21:21:32', '2026-03-03 21:21:32'),
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

CREATE TABLE `classes` (
  `class_id` int(11) NOT NULL,
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
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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

CREATE TABLE `class_subjects` (
  `course_id` int(11) NOT NULL,
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
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `class_subjects`
--

INSERT INTO `class_subjects` (`course_id`, `institution_id`, `class_id`, `subject_id`, `teacher_id`, `academic_year_id`, `semester_id`, `duration_weeks`, `start_date`, `end_date`, `status`, `created_at`, `updated_at`) VALUES
(48, 1, 33, 74, 33, 17, 21, 14, '2024-09-01', '2024-12-20', 'active', '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(49, 1, 33, 75, 35, 17, 21, 14, '2024-09-01', '2024-12-20', 'active', '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(50, 1, 33, 78, NULL, 17, 21, 14, '2024-09-01', '2024-12-20', 'active', '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(51, 1, 33, 79, NULL, 17, 21, 14, '2024-09-01', '2024-12-20', 'active', '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(52, 1, 35, 74, 33, 17, 21, 14, '2024-09-01', '2024-12-20', 'active', '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(53, 1, 35, 75, 35, 17, 21, 14, '2024-09-01', '2024-12-20', 'active', '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(54, 1, 35, 85, 34, 17, 21, 14, '2024-09-01', '2024-12-20', 'active', '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(55, 1, 35, 83, 36, 17, 21, 14, '2024-09-01', '2024-12-20', 'active', '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(56, 1, 35, 84, 37, 17, 21, 14, '2024-09-01', '2024-12-20', 'active', '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(57, 1, 36, 74, 33, 17, 21, 14, '2024-09-01', '2024-12-20', 'active', '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(58, 1, 36, 85, 34, 17, 21, 14, '2024-09-01', '2024-12-20', 'active', '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(59, 1, 36, 83, 36, 17, 21, 14, '2024-09-01', '2024-12-20', 'active', '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(60, 1, 34, 74, 33, 17, 21, 14, '2024-09-01', '2024-12-20', 'active', '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(61, 1, 34, 78, NULL, 17, 21, 14, '2024-09-01', '2024-12-20', 'active', '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(62, 1, 34, 79, NULL, 17, 21, 14, '2024-09-01', '2024-12-20', 'active', '2026-03-03 21:21:31', '2026-03-03 21:21:31');

-- --------------------------------------------------------

--
-- Table structure for table `course_content`
--

CREATE TABLE `course_content` (
  `course_content_id` int(11) NOT NULL,
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
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `course_content_order`
--

CREATE TABLE `course_content_order` (
  `course_content_order_id` int(11) NOT NULL,
  `course_id` int(11) NOT NULL,
  `course_section_id` int(11) NOT NULL,
  `course_content_id` int(11) DEFAULT NULL,
  `material_id` int(11) DEFAULT NULL,
  `order_index` int(11) NOT NULL DEFAULT 0,
  `item_type` varchar(20) NOT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `course_enrollments`
--

CREATE TABLE `course_enrollments` (
  `enrollment_id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `course_id` int(11) NOT NULL,
  `enrollment_date` datetime DEFAULT current_timestamp(),
  `completion_date` datetime DEFAULT NULL,
  `status` varchar(20) DEFAULT 'active',
  `progress_percentage` decimal(5,2) DEFAULT 0.00,
  `final_grade` varchar(2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `course_enrollments`
--

INSERT INTO `course_enrollments` (`enrollment_id`, `student_id`, `course_id`, `enrollment_date`, `completion_date`, `status`, `progress_percentage`, `final_grade`) VALUES
(192, 63, 52, '2024-09-01 00:00:00', NULL, 'active', 15.00, NULL),
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
(203, 65, 54, '2024-09-01 00:00:00', NULL, 'active', 15.00, NULL),
(204, 65, 55, '2024-09-01 00:00:00', NULL, 'active', 15.00, NULL),
(205, 65, 56, '2024-09-01 00:00:00', NULL, 'active', 15.00, NULL),
(206, 66, 48, '2024-09-01 00:00:00', NULL, 'active', 15.00, NULL),
(207, 66, 49, '2024-09-01 00:00:00', NULL, 'active', 15.00, NULL),
(208, 66, 50, '2024-09-01 00:00:00', NULL, 'active', 15.00, NULL),
(209, 66, 51, '2024-09-01 00:00:00', NULL, 'active', 15.00, NULL),
(210, 67, 57, '2024-09-01 00:00:00', NULL, 'active', 15.00, NULL),
(211, 67, 58, '2024-09-01 00:00:00', NULL, 'active', 15.00, NULL),
(212, 67, 59, '2024-09-01 00:00:00', NULL, 'active', 15.00, NULL),
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

CREATE TABLE `course_materials` (
  `material_id` int(11) NOT NULL,
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
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `course_reviews`
--

CREATE TABLE `course_reviews` (
  `review_id` int(11) NOT NULL,
  `course_id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `rating` int(11) NOT NULL CHECK (`rating` between 1 and 5),
  `review_text` text DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `course_schedules`
--

CREATE TABLE `course_schedules` (
  `schedule_id` int(11) NOT NULL,
  `course_id` int(11) NOT NULL,
  `day_of_week` varchar(20) NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `room` varchar(50) DEFAULT NULL,
  `is_recurring` tinyint(1) DEFAULT 1,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `course_schedules`
--

INSERT INTO `course_schedules` (`schedule_id`, `course_id`, `day_of_week`, `start_time`, `end_time`, `room`, `is_recurring`, `created_at`, `updated_at`) VALUES
(61, 48, 'Monday', '08:00:00', '09:30:00', 'Room A101', 1, '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
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

CREATE TABLE `course_sections` (
  `course_sections_id` int(11) NOT NULL,
  `course_id` int(11) NOT NULL,
  `section_name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `order_index` int(11) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `created_by` int(11) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `error_logs`
--

CREATE TABLE `error_logs` (
  `error_log_id` int(11) NOT NULL,
  `error_message` text DEFAULT NULL,
  `stack_trace` text DEFAULT NULL,
  `source` varchar(200) DEFAULT NULL,
  `severity_level` varchar(20) DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL,
  `ip_address` varchar(50) DEFAULT NULL,
  `is_resolved` tinyint(1) DEFAULT 0,
  `resolved_by` int(11) DEFAULT NULL,
  `resolved_at` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `events`
--

CREATE TABLE `events` (
  `event_id` int(11) NOT NULL,
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
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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

CREATE TABLE `grade_levels` (
  `grade_level_id` int(11) NOT NULL,
  `institution_id` int(11) NOT NULL,
  `grade_level_code` varchar(20) NOT NULL,
  `grade_level_name` varchar(50) NOT NULL,
  `level_order` int(11) NOT NULL,
  `description` text DEFAULT NULL,
  `status` varchar(20) DEFAULT 'active',
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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

CREATE TABLE `grade_reports` (
  `report_id` int(11) NOT NULL,
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
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `grade_report_details`
--

CREATE TABLE `grade_report_details` (
  `report_detail_id` int(11) NOT NULL,
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
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `grade_scales`
--

CREATE TABLE `grade_scales` (
  `grade_scale_id` int(11) NOT NULL,
  `institution_id` int(11) DEFAULT NULL,
  `grade` varchar(5) NOT NULL,
  `min_score` decimal(5,2) NOT NULL,
  `max_score` decimal(5,2) NOT NULL,
  `grade_point` decimal(3,2) DEFAULT NULL,
  `remark` varchar(50) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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

CREATE TABLE `institutions` (
  `institution_id` int(11) NOT NULL,
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
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `institutions`
--

INSERT INTO `institutions` (`institution_id`, `uuid`, `institution_code`, `institution_name`, `institution_type`, `email`, `phone`, `address`, `city`, `state`, `country`, `postal_code`, `website`, `status`, `subscription_plan`, `subscription_expires_at`, `max_students`, `max_teachers`, `created_at`, `updated_at`) VALUES
(17, 'f541726b-1746-11f1-8ccc-10653022c2a0', 'ACCRASHS', 'Accra Senior High School', 'shs', 'info@accrashs.edu.gh', '+233 30 222 1111', 'Independence Avenue', 'Accra', 'Greater Accra', 'Ghana', NULL, NULL, 'active', NULL, NULL, 500, 50, '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(18, 'f5418554-1746-11f1-8ccc-10653022c2a0', 'KUMASHS', 'Kumasi Senior High School', 'shs', 'info@kumashs.edu.gh', '+233 32 222 2222', 'Asafo Road', 'Kumasi', 'Ashanti', 'Ghana', NULL, NULL, 'active', 'year', '2030-03-31', 500, 50, '2026-03-03 21:21:31', '2026-03-08 05:19:50'),
(19, 'f5418874-1746-11f1-8ccc-10653022c2a0', 'CCASHS', 'Cape Coast Senior High School', 'shs', 'info@ccashs.edu.gh', '+233 33 222 3333', 'Commercial Road', 'Cape Coast', 'Central', 'Ghana', NULL, NULL, 'active', NULL, NULL, 500, 50, '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(20, 'f5418b00-1746-11f1-8ccc-10653022c2a0', 'TAMASHS', 'Tamale Senior High School', 'shs', 'info@tamashs.edu.gh', '+233 37 222 4444', 'Hospital Road', 'Tamale', 'Northern', 'Ghana', NULL, NULL, 'active', NULL, NULL, 500, 50, '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(21, 'f5418d84-1746-11f1-8ccc-10653022c2a0', 'HOSHS', 'Ho Senior High School', 'shs', 'info@hoshs.edu.gh', '+233 36 222 5555', 'Volta Street', 'Ho', 'Volta', 'Ghana', NULL, NULL, 'active', NULL, NULL, 500, 50, '2026-03-03 21:21:31', '2026-03-03 21:21:31');

-- --------------------------------------------------------

--
-- Table structure for table `institution_settings`
--

CREATE TABLE `institution_settings` (
  `setting_id` int(11) NOT NULL,
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
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `institution_settings`
--

INSERT INTO `institution_settings` (`setting_id`, `institution_id`, `school_name`, `motto`, `description`, `vision`, `mission`, `logo_url`, `banner_url`, `theme_primary_color`, `theme_secondary_color`, `timezone`, `academic_year_start_month`, `academic_year_end_month`, `grading_system`, `locale`, `currency`, `date_format`, `time_format`, `allow_parent_registration`, `allow_student_self_enrollment`, `require_email_verification`, `custom_css`, `custom_footer`, `social_facebook`, `social_twitter`, `social_instagram`, `social_linkedin`, `updated_at`) VALUES
(17, 1, 'Accra Senior High School', 'Excellence Through Knowledge', 'A leading Senior High School in Accra, Ghana, committed to academic excellence and holistic development.', 'To be the premier institution for secondary education in Ghana, producing well-rounded graduates.', 'To provide quality education that empowers students to excel academically and contribute positively to society.', '/uploads/institutions/accra-shs/logo.png', NULL, '#006B3F', '#FCD116', 'Africa/Accra', 9, 6, 'ghana_waec', 'en_GH', 'GHS', 'Y-m-d', 'H:i:s', 1, 0, 1, NULL, NULL, NULL, NULL, NULL, NULL, '2026-03-03 21:21:31'),
(18, 2, 'Kumasi Senior High School', 'Knowledge is Power', 'Premier institution in the Ashanti Region dedicated to nurturing future leaders.', 'To be recognized as a center of excellence in secondary education across West Africa.', 'Empowering students with knowledge, skills, and character for global competitiveness.', '/uploads/institutions/kumasi-shs/logo.png', NULL, '#C8102E', '#FCD116', 'Africa/Accra', 9, 6, 'ghana_waec', 'en_GH', 'GHS', 'Y-m-d', 'H:i:s', 1, 0, 1, NULL, NULL, NULL, NULL, NULL, NULL, '2026-03-03 21:21:31'),
(19, 3, 'Cape Coast Senior High School', 'Discipline and Hard Work', 'Historic institution in Cape Coast fostering academic excellence since establishment.', 'To maintain our legacy of excellence while embracing modern educational practices.', 'Developing disciplined, hardworking students who excel in all spheres of life.', '/uploads/institutions/capecoast-shs/logo.png', NULL, '#0047AB', '#FFFFFF', 'Africa/Accra', 9, 6, 'ghana_waec', 'en_GH', 'GHS', 'Y-m-d', 'H:i:s', 1, 0, 1, NULL, NULL, NULL, NULL, NULL, NULL, '2026-03-03 21:21:31'),
(20, 4, 'Tamale Senior High School', 'Service and Dedication', 'Leading the way in quality education in Northern Ghana.', 'To be the educational beacon of Northern Ghana, inspiring excellence.', 'Providing comprehensive education that prepares students for leadership and service.', '/uploads/institutions/tamale-shs/logo.png', NULL, '#228B22', '#FFD700', 'Africa/Accra', 9, 6, 'ghana_waec', 'en_GH', 'GHS', 'Y-m-d', 'H:i:s', 1, 0, 1, NULL, NULL, NULL, NULL, NULL, NULL, '2026-03-03 21:21:31'),
(21, 5, 'Ho Senior High School', 'Unity and Progress', 'Excellence in education for the Volta Region and beyond.', 'To cultivate a community of learners committed to excellence and innovation.', 'Nurturing talents and building character for national development.', '/uploads/institutions/ho-shs/logo.png', NULL, '#006400', '#FFFFFF', 'Africa/Accra', 9, 6, 'ghana_waec', 'en_GH', 'GHS', 'Y-m-d', 'H:i:s', 1, 0, 1, NULL, NULL, NULL, NULL, NULL, NULL, '2026-03-03 21:21:31');

-- --------------------------------------------------------

--
-- Table structure for table `login_activity`
--

CREATE TABLE `login_activity` (
  `login_activity_id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `login_time` datetime DEFAULT current_timestamp(),
  `logout_time` datetime DEFAULT NULL,
  `ip_address` varchar(50) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `is_successful` tinyint(1) DEFAULT 1,
  `failure_reason` varchar(200) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `login_activity`
--

INSERT INTO `login_activity` (`login_activity_id`, `user_id`, `login_time`, `logout_time`, `ip_address`, `user_agent`, `is_successful`, `failure_reason`) VALUES
(144, 1, '2026-03-08 06:27:27', '2026-03-08 05:28:14', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', 1, NULL),
(145, 1, '2026-03-08 06:28:27', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', 1, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `messages`
--

CREATE TABLE `messages` (
  `message_id` int(11) NOT NULL,
  `uuid` char(36) NOT NULL,
  `sender_id` int(11) NOT NULL,
  `receiver_id` int(11) NOT NULL,
  `course_id` int(11) DEFAULT NULL,
  `subject` varchar(200) DEFAULT NULL,
  `message_text` text NOT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  `parent_message_id` int(11) DEFAULT NULL,
  `sent_at` datetime DEFAULT current_timestamp(),
  `read_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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

CREATE TABLE `notifications` (
  `notification_id` int(11) NOT NULL,
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
  `read_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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

CREATE TABLE `parents` (
  `parent_id` int(11) NOT NULL,
  `institution_id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `phone_number` varchar(20) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `occupation` varchar(100) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `parents`
--

INSERT INTO `parents` (`parent_id`, `institution_id`, `user_id`, `first_name`, `last_name`, `phone_number`, `email`, `occupation`, `address`, `created_at`, `updated_at`) VALUES
(32, 17, 8, 'Yaw', 'Osei', '+233 24 555 5555', 'yaw.osei@parent.accrashs.edu.gh', 'Engineer', 'East Legon, Accra', '2026-03-03 21:21:31', '2026-03-03 21:49:34'),
(33, 20, 183, 'Akua', 'Adjei', '+233 24 555 5556', 'akua.adjei@parent.accrashs.edu.gh', 'Nurse', 'Osu, Accra', '2026-03-03 21:21:31', '2026-03-03 21:48:56'),
(34, 19, 184, 'Emmanuel', 'Addo', '+233 24 555 5557', 'emmanuel.addo@parent.accrashs.edu.gh', 'Teacher', 'Tema, Accra', '2026-03-03 21:21:31', '2026-03-03 21:48:40'),
(35, 21, 185, 'Patience', 'Boakye', '+233 24 555 5558', 'patience.boakye@parent.accrashs.edu.gh', 'Accountant', 'Spintex, Accra', '2026-03-03 21:21:31', '2026-03-03 21:49:04'),
(36, 17, 186, 'Samuel', 'Nyarko', '+233 24 555 5559', 'samuel.nyarko@parent.accrashs.edu.gh', 'Business Owner', 'Madina, Accra', '2026-03-03 21:21:31', '2026-03-03 21:48:30'),
(37, 19, 187, 'Grace', 'Mensah', '+233 24 555 5560', 'grace.mensah@parent.accrashs.edu.gh', 'Doctor', 'Dansoman, Accra', '2026-03-03 21:21:31', '2026-03-03 21:48:48'),
(38, 21, 188, 'Peter', 'Owusu', '+233 24 555 5561', 'peter.owusu@parent.accrashs.edu.gh', 'Lawyer', 'Kaneshie, Accra', '2026-03-03 21:21:31', '2026-03-03 21:48:04'),
(39, 21, 189, 'Mary', 'Asare', '+233 24 555 5562', 'mary.asare@parent.accrashs.edu.gh', 'Banker', 'Achimota, Accra', '2026-03-03 21:21:31', '2026-03-03 21:48:23'),
(40, 18, 190, 'Joseph', 'Boateng', '+233 24 555 5563', 'joseph.boateng@parent.accrashs.edu.gh', 'Architect', 'Labone, Accra', '2026-03-03 21:21:31', '2026-03-03 21:47:57'),
(41, 21, 191, 'Elizabeth', 'Ofori', '+233 24 555 5564', 'elizabeth.ofori@parent.accrashs.edu.gh', 'Civil Servant', 'South Labadi, Accra', '2026-03-03 21:21:31', '2026-03-03 21:47:50');

-- --------------------------------------------------------

--
-- Table structure for table `parent_students`
--

CREATE TABLE `parent_students` (
  `parent_student_id` int(11) NOT NULL,
  `parent_id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `relationship_type` varchar(50) DEFAULT 'Parent',
  `is_primary_contact` tinyint(1) DEFAULT 0,
  `can_pickup` tinyint(1) DEFAULT 1,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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

CREATE TABLE `password_reset_tokens` (
  `token_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `token` varchar(100) NOT NULL,
  `expiry_date` datetime NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `used_at` datetime DEFAULT NULL,
  `ip_address` varchar(50) DEFAULT NULL,
  `user_agent` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
(13, 1, '8c921a1ae67517c94ca7fe97038755f1c6312cba723b0b94f60a4d8490a9f461', '2026-03-06 12:30:56', 1, '2026-03-06 10:30:56', '2026-03-06 10:32:28', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0');

-- --------------------------------------------------------

--
-- Table structure for table `permissions`
--

CREATE TABLE `permissions` (
  `permission_id` int(11) NOT NULL,
  `permission_name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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

CREATE TABLE `programs` (
  `program_id` int(11) NOT NULL,
  `institution_id` int(11) NOT NULL,
  `program_code` varchar(20) NOT NULL,
  `program_name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `duration_years` int(11) DEFAULT 3,
  `status` varchar(20) DEFAULT 'active',
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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

CREATE TABLE `quizzes` (
  `quiz_id` int(11) NOT NULL,
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
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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

CREATE TABLE `quiz_questions` (
  `question_id` int(11) NOT NULL,
  `quiz_id` int(11) NOT NULL,
  `question_text` text NOT NULL,
  `question_type` varchar(50) NOT NULL,
  `points` int(11) DEFAULT 1,
  `difficulty` varchar(20) DEFAULT NULL,
  `explanation` text DEFAULT NULL,
  `correct_answer` varchar(500) DEFAULT NULL,
  `order_index` int(11) DEFAULT 0,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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

CREATE TABLE `quiz_question_options` (
  `option_id` int(11) NOT NULL,
  `question_id` int(11) NOT NULL,
  `option_label` varchar(5) NOT NULL,
  `option_text` varchar(500) NOT NULL,
  `is_correct` tinyint(1) DEFAULT 0,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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

CREATE TABLE `quiz_submissions` (
  `submission_id` int(11) NOT NULL,
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
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `quiz_submission_answers`
--

CREATE TABLE `quiz_submission_answers` (
  `submission_answer_id` int(11) NOT NULL,
  `submission_id` int(11) NOT NULL,
  `question_id` int(11) NOT NULL,
  `answer` text DEFAULT NULL,
  `is_correct` tinyint(1) DEFAULT NULL,
  `points_earned` decimal(10,2) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `results`
--

CREATE TABLE `results` (
  `result_id` int(11) NOT NULL,
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
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `roles`
--

CREATE TABLE `roles` (
  `role_id` int(11) NOT NULL,
  `role_name` varchar(50) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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

CREATE TABLE `role_permissions` (
  `role_permission_id` int(11) NOT NULL,
  `role_id` int(11) NOT NULL,
  `permission_id` int(11) NOT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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

CREATE TABLE `schema_migrations` (
  `version` varchar(50) NOT NULL,
  `description` varchar(255) NOT NULL,
  `applied_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `applied_by` varchar(100) DEFAULT 'admin',
  `execution_time_ms` int(11) DEFAULT NULL,
  `success` tinyint(1) DEFAULT 1,
  `notes` text DEFAULT NULL
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

CREATE TABLE `semesters` (
  `semester_id` int(11) NOT NULL,
  `institution_id` int(11) NOT NULL,
  `academic_year_id` int(11) NOT NULL,
  `semester_name` varchar(20) NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `is_current` tinyint(1) DEFAULT 0,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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

CREATE TABLE `students` (
  `student_id` int(11) NOT NULL,
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
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `students`
--

INSERT INTO `students` (`student_id`, `uuid`, `institution_id`, `user_id`, `class_id`, `student_id_number`, `enrollment_date`, `gender`, `date_of_birth`, `parent_name`, `parent_phone`, `parent_email`, `emergency_contact`, `status`, `created_at`, `updated_at`) VALUES
(63, 'f58350f7-1746-11f1-8ccc-10653022c2a0', 1, 162, 35, 'ASHS-2024-0001', '2024-09-01', 'Male', '2009-03-15', NULL, NULL, NULL, NULL, 'active', '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(64, 'f5836bbd-1746-11f1-8ccc-10653022c2a0', 1, 163, 33, 'ASHS-2024-0002', '2024-09-01', 'Female', '2009-05-20', NULL, NULL, NULL, NULL, 'active', '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(65, 'f5837514-1746-11f1-8ccc-10653022c2a0', 1, 164, 35, 'ASHS-2024-0003', '2024-09-01', 'Male', '2009-01-10', NULL, NULL, NULL, NULL, 'active', '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(66, 'f583778f-1746-11f1-8ccc-10653022c2a0', 1, 165, 33, 'ASHS-2024-0004', '2024-09-01', 'Female', '2009-07-25', NULL, NULL, NULL, NULL, 'active', '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(67, 'f584599e-1746-11f1-8ccc-10653022c2a0', 1, 166, 36, 'ASHS-2024-0005', '2024-09-01', 'Male', '2009-02-14', NULL, NULL, NULL, NULL, 'active', '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(68, 'f5845b9e-1746-11f1-8ccc-10653022c2a0', 1, 167, 34, 'ASHS-2024-0006', '2024-09-01', 'Female', '2009-06-30', NULL, NULL, NULL, NULL, 'active', '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(69, 'f5845cea-1746-11f1-8ccc-10653022c2a0', 1, 168, 37, 'ASHS-2024-0007', '2024-09-01', 'Male', '2009-04-18', NULL, NULL, NULL, NULL, 'active', '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(70, 'f5845e2e-1746-11f1-8ccc-10653022c2a0', 1, 169, 33, 'ASHS-2024-0008', '2024-09-01', 'Female', '2009-08-05', NULL, NULL, NULL, NULL, 'active', '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(71, 'f58460d1-1746-11f1-8ccc-10653022c2a0', 1, 170, 35, 'ASHS-2024-0009', '2024-09-01', 'Male', '2009-11-22', NULL, NULL, NULL, NULL, 'active', '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(72, 'f5846258-1746-11f1-8ccc-10653022c2a0', 1, 171, 34, 'ASHS-2024-0010', '2024-09-01', 'Female', '2009-09-12', NULL, NULL, NULL, NULL, 'active', '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(73, 'f58463da-1746-11f1-8ccc-10653022c2a0', 1, 172, 36, 'ASHS-2024-0011', '2024-09-01', 'Male', '2009-10-08', NULL, NULL, NULL, NULL, 'active', '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(74, 'f584655f-1746-11f1-8ccc-10653022c2a0', 1, 173, 37, 'ASHS-2024-0012', '2024-09-01', 'Female', '2009-12-01', NULL, NULL, NULL, NULL, 'active', '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(75, 'f58466ef-1746-11f1-8ccc-10653022c2a0', 1, 174, 35, 'ASHS-2024-0013', '2024-09-01', 'Male', '2009-03-28', NULL, NULL, NULL, NULL, 'active', '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(76, 'f5846874-1746-11f1-8ccc-10653022c2a0', 1, 175, 33, 'ASHS-2024-0014', '2024-09-01', 'Female', '2009-05-16', NULL, NULL, NULL, NULL, 'active', '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(77, 'f58469ef-1746-11f1-8ccc-10653022c2a0', 1, 176, 36, 'ASHS-2024-0015', '2024-09-01', 'Male', '2009-07-04', NULL, NULL, NULL, NULL, 'active', '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(78, 'f5846b59-1746-11f1-8ccc-10653022c2a0', 1, 177, 34, 'ASHS-2024-0016', '2024-09-01', 'Female', '2009-02-19', NULL, NULL, NULL, NULL, 'active', '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(79, 'f5846cdb-1746-11f1-8ccc-10653022c2a0', 1, 178, 37, 'ASHS-2024-0017', '2024-09-01', 'Male', '2009-06-11', NULL, NULL, NULL, NULL, 'active', '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(80, 'f5846e55-1746-11f1-8ccc-10653022c2a0', 1, 179, 35, 'ASHS-2024-0018', '2024-09-01', 'Female', '2009-04-23', NULL, NULL, NULL, NULL, 'active', '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(81, 'f5846fe4-1746-11f1-8ccc-10653022c2a0', 2, 180, NULL, 'KSHS-2024-0001', '2024-09-01', 'Male', '2009-08-14', NULL, NULL, NULL, NULL, 'active', '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(82, 'f584716f-1746-11f1-8ccc-10653022c2a0', 2, 181, NULL, 'KSHS-2024-0002', '2024-09-01', 'Female', '2009-10-27', NULL, NULL, NULL, NULL, 'active', '2026-03-03 21:21:31', '2026-03-03 21:21:31');

-- --------------------------------------------------------

--
-- Table structure for table `subjects`
--

CREATE TABLE `subjects` (
  `subject_id` int(11) NOT NULL,
  `uuid` char(36) NOT NULL,
  `institution_id` int(11) NOT NULL,
  `subject_code` varchar(20) NOT NULL,
  `subject_name` varchar(200) NOT NULL,
  `description` text DEFAULT NULL,
  `credits` int(11) DEFAULT 3,
  `is_core` tinyint(1) DEFAULT 0,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `subjects`
--

INSERT INTO `subjects` (`subject_id`, `uuid`, `institution_id`, `subject_code`, `subject_name`, `description`, `credits`, `is_core`, `created_at`, `updated_at`) VALUES
(74, 'f554a373-1746-11f1-8ccc-10653022c2a0', 1, 'ENG', 'English Language', 'Core English Language', 3, 1, '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(75, 'f554b5f4-1746-11f1-8ccc-10653022c2a0', 1, 'MATH-C', 'Mathematics (Core)', 'Core Mathematics', 3, 1, '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(76, 'f554ba2b-1746-11f1-8ccc-10653022c2a0', 1, 'INT-SCI', 'Integrated Science', 'Integrated Science', 3, 1, '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(77, 'f554bcec-1746-11f1-8ccc-10653022c2a0', 1, 'SOC-ST', 'Social Studies', 'Social Studies', 3, 1, '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(78, 'f554bf85-1746-11f1-8ccc-10653022c2a0', 1, 'LIT', 'Literature in English', 'Literature in English', 3, 0, '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(79, 'f554c226-1746-11f1-8ccc-10653022c2a0', 1, 'HIST', 'History', 'History', 3, 0, '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(80, 'f554c473-1746-11f1-8ccc-10653022c2a0', 1, 'GEOG', 'Geography', 'Geography', 3, 0, '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(81, 'f554c6a8-1746-11f1-8ccc-10653022c2a0', 1, 'CRS', 'Christian Religious Studies', 'Christian Religious Studies', 3, 0, '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(82, 'f554c94a-1746-11f1-8ccc-10653022c2a0', 1, 'ECON', 'Economics', 'Economics', 3, 0, '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(83, 'f554cbac-1746-11f1-8ccc-10653022c2a0', 1, 'PHY', 'Physics', 'Physics', 3, 0, '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(84, 'f554ce13-1746-11f1-8ccc-10653022c2a0', 1, 'CHEM', 'Chemistry', 'Chemistry', 3, 0, '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(85, 'f554d060-1746-11f1-8ccc-10653022c2a0', 1, 'BIO', 'Biology', 'Biology', 3, 0, '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(86, 'f554d2bb-1746-11f1-8ccc-10653022c2a0', 1, 'MATH-E', 'Elective Mathematics', 'Elective Mathematics', 3, 0, '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(87, 'f554d527-1746-11f1-8ccc-10653022c2a0', 1, 'ICT', 'Information Technology', 'Information Technology', 3, 0, '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(88, 'f554d77b-1746-11f1-8ccc-10653022c2a0', 1, 'BUS-MGT', 'Business Management', 'Business Management', 3, 0, '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(89, 'f554d9ca-1746-11f1-8ccc-10653022c2a0', 1, 'ACCT', 'Accounting', 'Accounting', 3, 0, '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(90, 'f5554e65-1746-11f1-8ccc-10653022c2a0', 1, 'COST', 'Costing', 'Costing', 3, 0, '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(91, 'f55550f5-1746-11f1-8ccc-10653022c2a0', 1, 'FIN-ACCT', 'Financial Accounting', 'Financial Accounting', 3, 0, '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(92, 'f55552dd-1746-11f1-8ccc-10653022c2a0', 1, 'ECON-BUS', 'Economics', 'Economics for Business', 3, 0, '2026-03-03 21:21:31', '2026-03-03 21:21:31');

-- --------------------------------------------------------

--
-- Table structure for table `superadmin_activity`
--

CREATE TABLE `superadmin_activity` (
  `activity_id` int(11) NOT NULL,
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
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tracks all meaningful actions performed by super admins';

-- --------------------------------------------------------

--
-- Table structure for table `system_settings`
--

CREATE TABLE `system_settings` (
  `settings_id` int(11) NOT NULL,
  `settings` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`settings`)),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `system_settings`
--

INSERT INTO `system_settings` (`settings_id`, `settings`, `updated_at`) VALUES
(1, '{\r\n    \"site_name\": \"Ghana SHS LMS\",\r\n    \"site_url\": \"https://ghanashslms.edu.gh\",\r\n    \"app_version\": \"1.0.0\",\r\n    \"timezone\": \"Africa/Accra\",\r\n    \"default_language\": \"en\",\r\n    \"date_format\": \"Y-m-d\",\r\n    \"time_format\": \"H:i:s\",\r\n    \"max_upload_size\": \"10485760\",\r\n    \"session_timeout\": \"3600\",\r\n    \"allow_registration\": 1,\r\n    \"require_verification\": 1,\r\n    \"smtp_host\": \"smtp.ghanashslms.edu.gh\",\r\n    \"smtp_port\": 587,\r\n    \"smtp_username\": \"noreply@ghanashslms.edu.gh\",\r\n    \"from_address\": \"noreply@ghanashslms.edu.gh\",\r\n    \"from_name\": \"Ghana SHS LMS\",\r\n    \"enable_notifications\": 1,\r\n    \"enable_email_notifications\": 1,\r\n    \"enable_sms_notifications\": 0,\r\n    \"maintenance_mode\": 0,\r\n    \"ga_id\": \"\",\r\n    \"integrations_note\": \"\",\r\n    \"updated_at\": \"2024-09-01 08:00:00\"\r\n}', '2024-09-01 08:00:00');

-- --------------------------------------------------------

--
-- Table structure for table `teachers`
--

CREATE TABLE `teachers` (
  `teacher_id` int(11) NOT NULL,
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
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `teachers`
--

INSERT INTO `teachers` (`teacher_id`, `uuid`, `institution_id`, `user_id`, `employee_id`, `program_id`, `specialization`, `hire_date`, `employment_end_date`, `qualification`, `years_of_experience`, `created_at`, `updated_at`) VALUES
(33, 'f563c306-1746-11f1-8ccc-10653022c2a0', 1, 152, 'T-2024-001', NULL, 'English Language', '2020-09-01', NULL, 'Masters in English', NULL, '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(34, 'f563d91a-1746-11f1-8ccc-10653022c2a0', 1, 153, 'T-2024-002', NULL, 'Biology', '2019-09-01', NULL, 'Masters in Biology', NULL, '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(35, 'f563de68-1746-11f1-8ccc-10653022c2a0', 1, 154, 'T-2024-003', NULL, 'Mathematics', '2021-09-01', NULL, 'BSc Mathematics', NULL, '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(36, 'f563e2b7-1746-11f1-8ccc-10653022c2a0', 1, 155, 'T-2024-004', NULL, 'Physics', '2018-09-01', NULL, 'MSc Physics', NULL, '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(37, 'f563e6cd-1746-11f1-8ccc-10653022c2a0', 1, 156, 'T-2024-005', NULL, 'Chemistry', '2020-09-01', NULL, 'BSc Chemistry', NULL, '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(38, 'f563ea9d-1746-11f1-8ccc-10653022c2a0', 1, 157, 'T-2024-006', NULL, 'History', '2022-09-01', NULL, 'BA History', NULL, '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(39, 'f563ee21-1746-11f1-8ccc-10653022c2a0', 1, 158, 'T-2024-007', NULL, 'Literature', '2021-09-01', NULL, 'BA Literature', NULL, '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(40, 'f5647f97-1746-11f1-8ccc-10653022c2a0', 1, 159, 'T-2024-008', NULL, 'Economics', '2019-09-01', NULL, 'BSc Economics', NULL, '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(41, 'f56483c9-1746-11f1-8ccc-10653022c2a0', 2, 160, 'T-2024-009', NULL, 'ICT', '2020-09-01', NULL, 'MSc Computer Science', NULL, '2026-03-03 21:21:31', '2026-03-03 21:21:31'),
(42, 'f564869e-1746-11f1-8ccc-10653022c2a0', 2, 161, 'T-2024-010', NULL, 'Geography', '2021-09-01', NULL, 'BA Geography', NULL, '2026-03-03 21:21:31', '2026-03-03 21:21:31');

-- --------------------------------------------------------

--
-- Table structure for table `teacher_subjects`
--

CREATE TABLE `teacher_subjects` (
  `teacher_subject_id` int(11) NOT NULL,
  `teacher_id` int(11) NOT NULL,
  `subject_id` int(11) NOT NULL,
  `assigned_date` date DEFAULT curdate(),
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `user_id` int(11) NOT NULL,
  `uuid` char(36) NOT NULL,
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
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`user_id`, `uuid`, `institution_id`, `username`, `email`, `password_hash`, `first_name`, `last_name`, `phone_number`, `address`, `date_of_birth`, `is_super_admin`, `is_active`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, '1bfe8992-16ae-11f1-9c28-10653022c2a0', NULL, 'superadmin', 'benedictamankwa18@gmail.com', '$2y$10$zXQ3Pq1GPnOVwrzcDfvz8OV7yaxbUJKr9kEkBP7CwTyMNYF5aGDkS', 'Platform', 'Super Administrator', '+233 30 000 0000', NULL, NULL, 1, 1, '2026-01-01 18:17:08', '2026-03-06 10:32:28', NULL),
(8, 'def42c78-1743-11f1-8ccc-10653022c2a0', NULL, 'superadmin', 'superadmin@ghslms.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Platform', 'Super Administrator', '+233 30 000 0000', NULL, NULL, 1, 1, '2026-03-03 20:59:25', '2026-03-03 20:59:25', NULL),
(54, '55d2f602-1744-11f1-8ccc-10653022c2a0', NULL, 'superadmin', 'superadmin@ghslms.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Platform', 'Super Administrator', '+233 30 000 0000', NULL, NULL, 1, 1, '2026-03-03 21:02:44', '2026-03-03 21:02:44', NULL),
(100, '627dbb2e-1744-11f1-8ccc-10653022c2a0', NULL, 'superadmin', 'superadmin@ghslms.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Platform', 'Super Administrator', '+233 30 000 0000', NULL, NULL, 1, 1, '2026-03-03 21:03:05', '2026-03-03 21:03:05', NULL),
(146, 'f53e889e-1746-11f1-8ccc-10653022c2a0', NULL, 'superadmin', 'superadmin@ghslms.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Platform', 'Super Administrator', '+233 30 000 0000', NULL, NULL, 1, 1, '2026-03-03 21:21:31', '2026-03-03 21:21:31', NULL),
(147, 'f55bd9f1-1746-11f1-8ccc-10653022c2a0', 1, 'admin', 'admin@accrashs.edu.gh', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Justice', 'Mensah', '+233 30 111 1001', NULL, NULL, 0, 1, '2026-03-03 21:21:31', '2026-03-03 21:21:31', NULL),
(148, 'f55bed57-1746-11f1-8ccc-10653022c2a0', 2, 'admin2', 'admin@kumashs.edu.gh', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Akosua', 'Agyemang', '+233 32 111 2001', NULL, NULL, 0, 1, '2026-03-03 21:21:31', '2026-03-03 21:21:31', NULL),
(149, 'f55bf3bc-1746-11f1-8ccc-10653022c2a0', 3, 'admin3', 'admin@ccashs.edu.gh', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Kwesi', 'Atta', '+233 33 111 3001', NULL, NULL, 0, 1, '2026-03-03 21:21:31', '2026-03-03 21:21:31', NULL),
(150, 'f55bf8f7-1746-11f1-8ccc-10653022c2a0', 4, 'admin4', 'admin@tamashs.edu.gh', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Alhassan', 'Mohammed', '+233 37 111 4001', NULL, NULL, 0, 1, '2026-03-03 21:21:31', '2026-03-03 21:21:31', NULL),
(151, 'f55c96d5-1746-11f1-8ccc-10653022c2a0', 5, 'admin5', 'admin@hoshs.edu.gh', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Elikem', 'Agbeko', '+233 36 111 5001', NULL, NULL, 0, 1, '2026-03-03 21:21:31', '2026-03-03 21:21:31', NULL),
(152, 'f56106d8-1746-11f1-8ccc-10653022c2a0', 1, 'kofi.mensah', 'kofi.mensah@accrashs.edu.gh', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Kofi', 'Mensah', '+233 24 111 1111', NULL, NULL, 0, 1, '2026-03-03 21:21:31', '2026-03-03 21:21:31', NULL),
(153, 'f5617797-1746-11f1-8ccc-10653022c2a0', 1, 'ama.asante', 'ama.asante@accrashs.edu.gh', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Ama', 'Asante', '+233 24 111 1112', NULL, NULL, 0, 1, '2026-03-03 21:21:31', '2026-03-03 21:21:31', NULL),
(154, 'f5617b21-1746-11f1-8ccc-10653022c2a0', 1, 'kwabena.owusu', 'kwabena.owusu@accrashs.edu.gh', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Kwabena', 'Owusu', '+233 24 111 1113', NULL, NULL, 0, 1, '2026-03-03 21:21:31', '2026-03-03 21:21:31', NULL),
(155, 'f5617dc9-1746-11f1-8ccc-10653022c2a0', 1, 'abena.boateng', 'abena.boateng@accrashs.edu.gh', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Abena', 'Boateng', '+233 24 111 1114', NULL, NULL, 0, 1, '2026-03-03 21:21:31', '2026-03-03 21:21:31', NULL),
(156, 'f561800e-1746-11f1-8ccc-10653022c2a0', 1, 'yaw.frimpong', 'yaw.frimpong@accrashs.edu.gh', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Yaw', 'Frimpong', '+233 24 111 1115', NULL, NULL, 0, 1, '2026-03-03 21:21:31', '2026-03-03 21:21:31', NULL),
(157, 'f5618275-1746-11f1-8ccc-10653022c2a0', 1, 'akosua.darko', 'akosua.darko@accrashs.edu.gh', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Akosua', 'Darko', '+233 24 111 1116', NULL, NULL, 0, 1, '2026-03-03 21:21:31', '2026-03-03 21:21:31', NULL),
(158, 'f5618577-1746-11f1-8ccc-10653022c2a0', 1, 'kwame.appiah', 'kwame.appiah@accrashs.edu.gh', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Kwame', 'Appiah', '+233 24 111 1117', NULL, NULL, 0, 1, '2026-03-03 21:21:31', '2026-03-03 21:21:31', NULL),
(159, 'f56188e6-1746-11f1-8ccc-10653022c2a0', 1, 'efua.amoah', 'efua.amoah@accrashs.edu.gh', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Efua', 'Amoah', '+233 24 111 1118', NULL, NULL, 0, 1, '2026-03-03 21:21:31', '2026-03-03 21:21:31', NULL),
(160, 'f5618bfa-1746-11f1-8ccc-10653022c2a0', 2, 'kwasi.boadu', 'kwasi.boadu@kumashs.edu.gh', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Kwasi', 'Boadu', '+233 24 112 1111', NULL, NULL, 0, 1, '2026-03-03 21:21:31', '2026-03-03 21:21:31', NULL),
(161, 'f5618fc7-1746-11f1-8ccc-10653022c2a0', 2, 'adwoa.sarpong', 'adwoa.sarpong@kumashs.edu.gh', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Adwoa', 'Sarpong', '+233 24 112 1112', NULL, NULL, 0, 1, '2026-03-03 21:21:31', '2026-03-03 21:21:31', NULL),
(162, 'f56feb3f-1746-11f1-8ccc-10653022c2a0', 1, 'kwame.osei', 'kwame.osei@student.accrashs.edu.gh', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Kwame', 'Osei', '+233 55 111 2001', NULL, NULL, 0, 1, '2026-03-03 21:21:31', '2026-03-03 21:21:31', NULL),
(163, 'f570186d-1746-11f1-8ccc-10653022c2a0', 1, 'abena.adjei', 'abena.adjei@student.accrashs.edu.gh', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Abena', 'Adjei', '+233 55 111 2002', NULL, NULL, 0, 1, '2026-03-03 21:21:31', '2026-03-03 21:21:31', NULL),
(164, 'f5701c21-1746-11f1-8ccc-10653022c2a0', 1, 'kofi.addo', 'kofi.addo@student.accrashs.edu.gh', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Kofi', 'Addo', '+233 55 111 2003', NULL, NULL, 0, 1, '2026-03-03 21:21:31', '2026-03-03 21:21:31', NULL),
(165, 'f5701efa-1746-11f1-8ccc-10653022c2a0', 1, 'ama.boakye', 'ama.boakye@student.accrashs.edu.gh', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Ama', 'Boakye', '+233 55 111 2004', NULL, NULL, 0, 1, '2026-03-03 21:21:31', '2026-03-03 21:21:31', NULL),
(166, 'f570218e-1746-11f1-8ccc-10653022c2a0', 1, 'kwabena.nyarko', 'kwabena.nyarko@student.accrashs.edu.gh', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Kwabena', 'Nyarko', '+233 55 111 2005', NULL, NULL, 0, 1, '2026-03-03 21:21:31', '2026-03-03 21:21:31', NULL),
(167, 'f5702415-1746-11f1-8ccc-10653022c2a0', 1, 'akosua.mensah', 'akosua.mensah@student.accrashs.edu.gh', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Akosua', 'Mensah', '+233 55 111 2006', NULL, NULL, 0, 1, '2026-03-03 21:21:31', '2026-03-03 21:21:31', NULL),
(168, 'f57025ee-1746-11f1-8ccc-10653022c2a0', 1, 'yaw.owusu', 'yaw.owusu@student.accrashs.edu.gh', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Yaw', 'Owusu', '+233 55 111 2007', NULL, NULL, 0, 1, '2026-03-03 21:21:31', '2026-03-03 21:21:31', NULL),
(169, 'f57027a8-1746-11f1-8ccc-10653022c2a0', 1, 'efua.asare', 'efua.asare@student.accrashs.edu.gh', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Efua', 'Asare', '+233 55 111 2008', NULL, NULL, 0, 1, '2026-03-03 21:21:31', '2026-03-03 21:21:31', NULL),
(170, 'f5702949-1746-11f1-8ccc-10653022c2a0', 1, 'kwesi.boateng', 'kwesi.boateng@student.accrashs.edu.gh', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Kwesi', 'Boateng', '+233 55 111 2009', NULL, NULL, 0, 1, '2026-03-03 21:21:31', '2026-03-03 21:21:31', NULL),
(171, 'f5702bcd-1746-11f1-8ccc-10653022c2a0', 1, 'adwoa.ofori', 'adwoa.ofori@student.accrashs.edu.gh', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Adwoa', 'Ofori', '+233 55 111 2010', NULL, NULL, 0, 1, '2026-03-03 21:21:31', '2026-03-03 21:21:31', NULL),
(172, 'f5702e1f-1746-11f1-8ccc-10653022c2a0', 1, 'kojo.agyemang', 'kojo.agyemang@student.accrashs.edu.gh', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Kojo', 'Agyemang', '+233 55 111 2011', NULL, NULL, 0, 1, '2026-03-03 21:21:31', '2026-03-03 21:21:31', NULL),
(173, 'f570303a-1746-11f1-8ccc-10653022c2a0', 1, 'afua.darko', 'afua.darko@student.accrashs.edu.gh', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Afua', 'Darko', '+233 55 111 2012', NULL, NULL, 0, 1, '2026-03-03 21:21:31', '2026-03-03 21:21:31', NULL),
(174, 'f5703293-1746-11f1-8ccc-10653022c2a0', 1, 'kwame.frimpong', 'kwame.frimpong@student.accrashs.edu.gh', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Kwame', 'Frimpong', '+233 55 111 2013', NULL, NULL, 0, 1, '2026-03-03 21:21:31', '2026-03-03 21:21:31', NULL),
(175, 'f5703513-1746-11f1-8ccc-10653022c2a0', 1, 'abena.appiah', 'abena.appiah@student.accrashs.edu.gh', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Abena', 'Appiah', '+233 55 111 2014', NULL, NULL, 0, 1, '2026-03-03 21:21:31', '2026-03-03 21:21:31', NULL),
(176, 'f570370e-1746-11f1-8ccc-10653022c2a0', 1, 'kofi.amoah', 'kofi.amoah@student.accrashs.edu.gh', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Kofi', 'Amoah', '+233 55 111 2015', NULL, NULL, 0, 1, '2026-03-03 21:21:31', '2026-03-03 21:21:31', NULL),
(177, 'f570397e-1746-11f1-8ccc-10653022c2a0', 1, 'ama.sarpong', 'ama.sarpong@student.accrashs.edu.gh', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Ama', 'Sarpong', '+233 55 111 2016', NULL, NULL, 0, 1, '2026-03-03 21:21:31', '2026-03-03 21:21:31', NULL),
(178, 'f5703c1a-1746-11f1-8ccc-10653022c2a0', 1, 'yaw.boadu', 'yaw.boadu@student.accrashs.edu.gh', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Yaw', 'Boadu', '+233 55 111 2017', NULL, NULL, 0, 1, '2026-03-03 21:21:31', '2026-03-03 21:21:31', NULL),
(179, 'f57460aa-1746-11f1-8ccc-10653022c2a0', 1, 'akosua.atta', 'akosua.atta@student.accrashs.edu.gh', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Akosua', 'Atta', '+233 55 111 2018', NULL, NULL, 0, 1, '2026-03-03 21:21:31', '2026-03-03 21:21:31', NULL),
(180, 'f57472dd-1746-11f1-8ccc-10653022c2a0', 2, 'kwasi.mohammed', 'kwasi.mohammed@student.kumashs.edu.gh', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Kwasi', 'Mohammed', '+233 55 112 2001', NULL, NULL, 0, 1, '2026-03-03 21:21:31', '2026-03-03 21:21:31', NULL),
(181, 'f5756c83-1746-11f1-8ccc-10653022c2a0', 2, 'afua.agbeko', 'afua.agbeko@student.kumashs.edu.gh', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Afua', 'Agbeko', '+233 55 112 2002', NULL, NULL, 0, 1, '2026-03-03 21:21:31', '2026-03-03 21:21:31', NULL),
(182, 'f5893d8e-1746-11f1-8ccc-10653022c2a0', 1, 'yaw.osei', 'yaw.osei@parent.accrashs.edu.gh', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Yaw', 'Osei', '+233 24 555 5555', NULL, NULL, 0, 1, '2026-03-03 21:21:31', '2026-03-03 21:21:31', NULL),
(183, 'f5895666-1746-11f1-8ccc-10653022c2a0', 1, 'akua.adjei', 'akua.adjei@parent.accrashs.edu.gh', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Akua', 'Adjei', '+233 24 555 5556', NULL, NULL, 0, 1, '2026-03-03 21:21:31', '2026-03-03 21:21:31', NULL),
(184, 'f5895a04-1746-11f1-8ccc-10653022c2a0', 1, 'emmanuel.addo', 'emmanuel.addo@parent.accrashs.edu.gh', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Emmanuel', 'Addo', '+233 24 555 5557', NULL, NULL, 0, 1, '2026-03-03 21:21:31', '2026-03-03 21:21:31', NULL),
(185, 'f5895ca7-1746-11f1-8ccc-10653022c2a0', 1, 'patience.boakye', 'patience.boakye@parent.accrashs.edu.gh', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Patience', 'Boakye', '+233 24 555 5558', NULL, NULL, 0, 1, '2026-03-03 21:21:31', '2026-03-03 21:21:31', NULL),
(186, 'f5896754-1746-11f1-8ccc-10653022c2a0', 1, 'samuel.nyarko', 'samuel.nyarko@parent.accrashs.edu.gh', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Samuel', 'Nyarko', '+233 24 555 5559', NULL, NULL, 0, 1, '2026-03-03 21:21:31', '2026-03-03 21:21:31', NULL),
(187, 'f5896b77-1746-11f1-8ccc-10653022c2a0', 1, 'grace.mensah', 'grace.mensah@parent.accrashs.edu.gh', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Grace', 'Mensah', '+233 24 555 5560', NULL, NULL, 0, 1, '2026-03-03 21:21:31', '2026-03-03 21:21:31', NULL),
(188, 'f5896f23-1746-11f1-8ccc-10653022c2a0', 1, 'peter.owusu', 'peter.owusu@parent.accrashs.edu.gh', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Peter', 'Owusu', '+233 24 555 5561', NULL, NULL, 0, 1, '2026-03-03 21:21:31', '2026-03-03 21:21:31', NULL),
(189, 'f58972c5-1746-11f1-8ccc-10653022c2a0', 1, 'mary.asare', 'mary.asare@parent.accrashs.edu.gh', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Mary', 'Asare', '+233 24 555 5562', NULL, NULL, 0, 1, '2026-03-03 21:21:31', '2026-03-03 21:21:31', NULL),
(190, 'f589767e-1746-11f1-8ccc-10653022c2a0', 19, 'joseph.boateng', 'joseph.boateng@parent.accrashs.edu.gh', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Joseph', 'Boateng', '+233 24 555 5563', NULL, NULL, 0, 1, '2026-03-03 21:21:31', '2026-03-03 21:50:08', NULL),
(191, 'f5897ade-1746-11f1-8ccc-10653022c2a0', 1, 'elizabeth.ofori', 'elizabeth.ofori@parent.accrashs.edu.gh', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Elizabeth', 'Ofori', '+233 24 555 5564', NULL, NULL, 0, 1, '2026-03-03 21:21:31', '2026-03-03 21:21:31', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `user_activity`
--

CREATE TABLE `user_activity` (
  `activity_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `activity_type` varchar(50) NOT NULL,
  `activity_details` text DEFAULT NULL,
  `ip_address` varchar(50) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
(1573, 1, 'api_access', '{\"endpoint\":\"\\/api\\/dashboard\\/superadmin\",\"method\":\"GET\"}', '::1', NULL, '2026-03-08 05:38:29');

-- --------------------------------------------------------

--
-- Table structure for table `user_roles`
--

CREATE TABLE `user_roles` (
  `user_role_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `role_id` int(11) NOT NULL,
  `assigned_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
(270, 182, 5, '2026-03-03 21:21:31');

-- --------------------------------------------------------

--
-- Stand-in structure for view `vw_classes`
-- (See below for the actual view)
--
CREATE TABLE `vw_classes` (
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
CREATE TABLE `vw_student_courses` (
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
CREATE TABLE `vw_teacher_courses` (
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
CREATE TABLE `vw_user_roles` (
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

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vw_classes`  AS SELECT `cls`.`class_id` AS `class_id`, `cls`.`class_code` AS `class_code`, `cls`.`class_name` AS `class_name`, `p`.`program_id` AS `program_id`, `p`.`program_code` AS `program_code`, `p`.`program_name` AS `program_name`, `gl`.`grade_level_id` AS `grade_level_id`, `gl`.`grade_level_code` AS `grade_level_code`, `gl`.`grade_level_name` AS `grade_level_name`, `gl`.`level_order` AS `level_order`, `cls`.`section` AS `section`, `cls`.`room_number` AS `room_number`, `cls`.`max_students` AS `max_students`, `cls`.`status` AS `status`, `i`.`institution_id` AS `institution_id`, `i`.`institution_name` AS `institution_name`, `ay`.`academic_year_id` AS `academic_year_id`, `ay`.`year_name` AS `year_name`, `t`.`teacher_id` AS `class_teacher_id`, `u`.`first_name` AS `class_teacher_first_name`, `u`.`last_name` AS `class_teacher_last_name`, `u`.`email` AS `class_teacher_email`, count(distinct `s`.`student_id`) AS `total_students`, count(distinct case when `s`.`status` = 'active' then `s`.`student_id` end) AS `active_students` FROM (((((((`classes` `cls` join `institutions` `i` on(`cls`.`institution_id` = `i`.`institution_id`)) join `programs` `p` on(`cls`.`program_id` = `p`.`program_id`)) join `grade_levels` `gl` on(`cls`.`grade_level_id` = `gl`.`grade_level_id`)) join `academic_years` `ay` on(`cls`.`academic_year_id` = `ay`.`academic_year_id`)) left join `teachers` `t` on(`cls`.`class_teacher_id` = `t`.`teacher_id`)) left join `users` `u` on(`t`.`user_id` = `u`.`user_id`)) left join `students` `s` on(`cls`.`class_id` = `s`.`class_id`)) GROUP BY `cls`.`class_id` ;

-- --------------------------------------------------------

--
-- Structure for view `vw_student_courses`
--
DROP TABLE IF EXISTS `vw_student_courses`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vw_student_courses`  AS SELECT `s`.`student_id` AS `student_id`, `s`.`student_id_number` AS `student_id_number`, `cls`.`class_id` AS `class_id`, `cls`.`class_code` AS `class_code`, `cls`.`class_name` AS `class_name`, `p`.`program_id` AS `program_id`, `p`.`program_code` AS `program_code`, `p`.`program_name` AS `class_program`, `gl`.`grade_level_id` AS `grade_level_id`, `gl`.`grade_level_code` AS `grade_level_code`, `gl`.`grade_level_name` AS `class_grade_level`, `cls`.`section` AS `class_section`, `u`.`first_name` AS `first_name`, `u`.`last_name` AS `last_name`, `u`.`email` AS `email`, `c`.`course_id` AS `course_id`, `sub`.`subject_id` AS `subject_id`, `sub`.`subject_name` AS `subject_name`, `sub`.`subject_code` AS `subject_code`, `sub`.`is_core` AS `is_core`, `ce`.`enrollment_date` AS `enrollment_date`, `ce`.`status` AS `enrollment_status`, `ce`.`progress_percentage` AS `progress_percentage`, `ce`.`final_grade` AS `final_grade`, `t`.`teacher_id` AS `teacher_id`, `ut`.`first_name` AS `teacher_first_name`, `ut`.`last_name` AS `teacher_last_name` FROM (((((((((`students` `s` join `users` `u` on(`s`.`user_id` = `u`.`user_id`)) left join `classes` `cls` on(`s`.`class_id` = `cls`.`class_id`)) left join `programs` `p` on(`cls`.`program_id` = `p`.`program_id`)) left join `grade_levels` `gl` on(`cls`.`grade_level_id` = `gl`.`grade_level_id`)) join `course_enrollments` `ce` on(`s`.`student_id` = `ce`.`student_id`)) join `class_subjects` `c` on(`ce`.`course_id` = `c`.`course_id`)) left join `subjects` `sub` on(`c`.`subject_id` = `sub`.`subject_id`)) left join `teachers` `t` on(`c`.`teacher_id` = `t`.`teacher_id`)) left join `users` `ut` on(`t`.`user_id` = `ut`.`user_id`)) WHERE `u`.`deleted_at` is null AND `ce`.`status` = 'active' ;

-- --------------------------------------------------------

--
-- Structure for view `vw_teacher_courses`
--
DROP TABLE IF EXISTS `vw_teacher_courses`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vw_teacher_courses`  AS SELECT `t`.`teacher_id` AS `teacher_id`, `t`.`employee_id` AS `employee_id`, `u`.`first_name` AS `first_name`, `u`.`last_name` AS `last_name`, `u`.`email` AS `email`, `c`.`course_id` AS `course_id`, `cls`.`class_id` AS `class_id`, `cls`.`class_code` AS `class_code`, `cls`.`class_name` AS `class_name`, `p`.`program_id` AS `program_id`, `p`.`program_code` AS `program_code`, `p`.`program_name` AS `class_program`, `gl`.`grade_level_id` AS `grade_level_id`, `gl`.`grade_level_code` AS `grade_level_code`, `gl`.`grade_level_name` AS `class_grade_level`, `cls`.`section` AS `class_section`, `sub`.`subject_id` AS `subject_id`, `sub`.`subject_name` AS `subject_name`, `sub`.`subject_code` AS `subject_code`, `sub`.`is_core` AS `is_core`, `c`.`status` AS `status`, `c`.`start_date` AS `start_date`, `c`.`end_date` AS `end_date`, count(distinct `ce`.`student_id`) AS `enrolled_students` FROM (((((((`teachers` `t` join `users` `u` on(`t`.`user_id` = `u`.`user_id`)) join `class_subjects` `c` on(`t`.`teacher_id` = `c`.`teacher_id`)) left join `classes` `cls` on(`c`.`class_id` = `cls`.`class_id`)) left join `programs` `p` on(`cls`.`program_id` = `p`.`program_id`)) left join `grade_levels` `gl` on(`cls`.`grade_level_id` = `gl`.`grade_level_id`)) left join `subjects` `sub` on(`c`.`subject_id` = `sub`.`subject_id`)) left join `course_enrollments` `ce` on(`c`.`course_id` = `ce`.`course_id` and `ce`.`status` = 'active')) WHERE `u`.`deleted_at` is null GROUP BY `t`.`teacher_id`, `c`.`course_id` ;

-- --------------------------------------------------------

--
-- Structure for view `vw_user_roles`
--
DROP TABLE IF EXISTS `vw_user_roles`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vw_user_roles`  AS SELECT `u`.`user_id` AS `user_id`, `u`.`username` AS `username`, `u`.`email` AS `email`, `u`.`first_name` AS `first_name`, `u`.`last_name` AS `last_name`, `u`.`is_active` AS `is_active`, group_concat(`r`.`role_name` order by `r`.`role_name` ASC separator ',') AS `roles`, group_concat(`p`.`permission_name` order by `p`.`permission_name` ASC separator ',') AS `permissions` FROM ((((`users` `u` left join `user_roles` `ur` on(`u`.`user_id` = `ur`.`user_id`)) left join `roles` `r` on(`ur`.`role_id` = `r`.`role_id`)) left join `role_permissions` `rp` on(`r`.`role_id` = `rp`.`role_id`)) left join `permissions` `p` on(`rp`.`permission_id` = `p`.`permission_id`)) WHERE `u`.`deleted_at` is null GROUP BY `u`.`user_id` ;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `academic_years`
--
ALTER TABLE `academic_years`
  ADD PRIMARY KEY (`academic_year_id`),
  ADD UNIQUE KEY `unique_year_institution` (`year_name`,`institution_id`),
  ADD KEY `idx_institution_id` (`institution_id`),
  ADD KEY `idx_is_current` (`is_current`),
  ADD KEY `idx_year_name` (`year_name`);

--
-- Indexes for table `announcements`
--
ALTER TABLE `announcements`
  ADD PRIMARY KEY (`announcement_id`),
  ADD UNIQUE KEY `uuid` (`uuid`),
  ADD UNIQUE KEY `uuid_2` (`uuid`),
  ADD UNIQUE KEY `uuid_3` (`uuid`),
  ADD KEY `FK_announcements_author` (`author_id`),
  ADD KEY `idx_target_role` (`target_role`),
  ADD KEY `idx_is_published` (`is_published`),
  ADD KEY `idx_published_at` (`published_at`),
  ADD KEY `idx_announcements_uuid` (`uuid`);

--
-- Indexes for table `assessments`
--
ALTER TABLE `assessments`
  ADD PRIMARY KEY (`assessment_id`),
  ADD KEY `idx_course_id` (`course_id`),
  ADD KEY `idx_category_id` (`category_id`),
  ADD KEY `idx_assessment_type` (`assessment_type`),
  ADD KEY `idx_due_date` (`due_date`);

--
-- Indexes for table `assessment_categories`
--
ALTER TABLE `assessment_categories`
  ADD PRIMARY KEY (`category_id`),
  ADD KEY `idx_category_name` (`category_name`);

--
-- Indexes for table `assessment_submissions`
--
ALTER TABLE `assessment_submissions`
  ADD PRIMARY KEY (`submission_id`),
  ADD KEY `idx_assessment_id` (`assessment_id`),
  ADD KEY `idx_student_id` (`student_id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_submission_assessment_student` (`assessment_id`,`student_id`);

--
-- Indexes for table `assignments`
--
ALTER TABLE `assignments`
  ADD PRIMARY KEY (`assignment_id`),
  ADD UNIQUE KEY `uuid` (`uuid`),
  ADD UNIQUE KEY `uuid_2` (`uuid`),
  ADD UNIQUE KEY `uuid_3` (`uuid`),
  ADD KEY `idx_course_id` (`course_id`),
  ADD KEY `idx_section_id` (`section_id`),
  ADD KEY `idx_due_date` (`due_date`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_assignments_uuid` (`uuid`);

--
-- Indexes for table `assignment_submissions`
--
ALTER TABLE `assignment_submissions`
  ADD PRIMARY KEY (`submission_id`),
  ADD KEY `FK_assignment_submissions_grader` (`graded_by`),
  ADD KEY `idx_assignment_id` (`assignment_id`),
  ADD KEY `idx_student_id` (`student_id`),
  ADD KEY `idx_course_id` (`course_id`),
  ADD KEY `idx_status` (`status`);

--
-- Indexes for table `attendance`
--
ALTER TABLE `attendance`
  ADD PRIMARY KEY (`attendance_id`),
  ADD UNIQUE KEY `unique_attendance` (`student_id`,`course_id`,`attendance_date`),
  ADD KEY `idx_student_id` (`student_id`),
  ADD KEY `idx_course_id` (`course_id`),
  ADD KEY `idx_attendance_date` (`attendance_date`),
  ADD KEY `idx_attendance_date_range` (`student_id`,`attendance_date`);

--
-- Indexes for table `classes`
--
ALTER TABLE `classes`
  ADD PRIMARY KEY (`class_id`),
  ADD UNIQUE KEY `unique_class_code_institution` (`class_code`,`institution_id`),
  ADD UNIQUE KEY `unique_class_composition` (`institution_id`,`program_id`,`grade_level_id`,`section`,`academic_year_id`),
  ADD UNIQUE KEY `uuid` (`uuid`),
  ADD UNIQUE KEY `uuid_2` (`uuid`),
  ADD UNIQUE KEY `uuid_3` (`uuid`),
  ADD KEY `idx_institution_id` (`institution_id`),
  ADD KEY `idx_program_id` (`program_id`),
  ADD KEY `idx_grade_level_id` (`grade_level_id`),
  ADD KEY `idx_class_code` (`class_code`),
  ADD KEY `idx_section` (`section`),
  ADD KEY `idx_academic_year_id` (`academic_year_id`),
  ADD KEY `idx_class_teacher_id` (`class_teacher_id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_classes_uuid` (`uuid`);

--
-- Indexes for table `class_subjects`
--
ALTER TABLE `class_subjects`
  ADD PRIMARY KEY (`course_id`),
  ADD UNIQUE KEY `unique_class_subject_year` (`institution_id`,`class_id`,`subject_id`,`academic_year_id`,`semester_id`),
  ADD KEY `idx_institution_id` (`institution_id`),
  ADD KEY `idx_class_id` (`class_id`),
  ADD KEY `idx_subject_id` (`subject_id`),
  ADD KEY `idx_teacher_id` (`teacher_id`),
  ADD KEY `idx_academic_year_id` (`academic_year_id`),
  ADD KEY `idx_semester_id` (`semester_id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_course_teacher_status` (`teacher_id`,`status`);

--
-- Indexes for table `course_content`
--
ALTER TABLE `course_content`
  ADD PRIMARY KEY (`course_content_id`),
  ADD UNIQUE KEY `uuid` (`uuid`),
  ADD UNIQUE KEY `uuid_2` (`uuid`),
  ADD UNIQUE KEY `uuid_3` (`uuid`),
  ADD KEY `FK_course_content_creator` (`created_by`),
  ADD KEY `idx_course_content_course` (`course_id`),
  ADD KEY `idx_course_content_section` (`section_id`),
  ADD KEY `idx_course_content_active` (`is_active`),
  ADD KEY `idx_course_content_uuid` (`uuid`);

--
-- Indexes for table `course_content_order`
--
ALTER TABLE `course_content_order`
  ADD PRIMARY KEY (`course_content_order_id`),
  ADD KEY `FK_content_order_content` (`course_content_id`),
  ADD KEY `FK_content_order_material` (`material_id`),
  ADD KEY `idx_content_order_course` (`course_id`),
  ADD KEY `idx_content_order_section` (`course_section_id`),
  ADD KEY `idx_content_order_index` (`order_index`);

--
-- Indexes for table `course_enrollments`
--
ALTER TABLE `course_enrollments`
  ADD PRIMARY KEY (`enrollment_id`),
  ADD UNIQUE KEY `unique_enrollment` (`student_id`,`course_id`),
  ADD KEY `idx_student_id` (`student_id`),
  ADD KEY `idx_course_id` (`course_id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_enrollment_student_status` (`student_id`,`status`);

--
-- Indexes for table `course_materials`
--
ALTER TABLE `course_materials`
  ADD PRIMARY KEY (`material_id`),
  ADD KEY `FK_materials_uploader` (`uploaded_by`),
  ADD KEY `idx_course_id` (`course_id`),
  ADD KEY `idx_section_id` (`section_id`),
  ADD KEY `idx_material_type` (`material_type`),
  ADD KEY `idx_is_active` (`is_active`),
  ADD KEY `idx_status` (`status`);

--
-- Indexes for table `course_reviews`
--
ALTER TABLE `course_reviews`
  ADD PRIMARY KEY (`review_id`),
  ADD UNIQUE KEY `unique_review` (`course_id`,`student_id`),
  ADD KEY `FK_reviews_student` (`student_id`),
  ADD KEY `idx_course_id` (`course_id`),
  ADD KEY `idx_rating` (`rating`);

--
-- Indexes for table `course_schedules`
--
ALTER TABLE `course_schedules`
  ADD PRIMARY KEY (`schedule_id`),
  ADD UNIQUE KEY `unique_course_schedules` (`course_id`,`day_of_week`,`start_time`,`end_time`),
  ADD KEY `idx_course_id` (`course_id`),
  ADD KEY `idx_day_of_week` (`day_of_week`);

--
-- Indexes for table `course_sections`
--
ALTER TABLE `course_sections`
  ADD PRIMARY KEY (`course_sections_id`),
  ADD KEY `FK_course_sections_creator` (`created_by`),
  ADD KEY `idx_course_id` (`course_id`),
  ADD KEY `idx_order_index` (`order_index`),
  ADD KEY `idx_is_active` (`is_active`);

--
-- Indexes for table `error_logs`
--
ALTER TABLE `error_logs`
  ADD PRIMARY KEY (`error_log_id`),
  ADD KEY `FK_error_logs_user` (`user_id`),
  ADD KEY `FK_error_logs_resolved_by` (`resolved_by`),
  ADD KEY `idx_severity_level` (`severity_level`),
  ADD KEY `idx_is_resolved` (`is_resolved`),
  ADD KEY `idx_created_at` (`created_at`);

--
-- Indexes for table `events`
--
ALTER TABLE `events`
  ADD PRIMARY KEY (`event_id`),
  ADD UNIQUE KEY `uuid` (`uuid`),
  ADD UNIQUE KEY `uuid_2` (`uuid`),
  ADD UNIQUE KEY `uuid_3` (`uuid`),
  ADD KEY `FK_events_creator` (`created_by`),
  ADD KEY `idx_institution_id` (`institution_id`),
  ADD KEY `idx_event_dates` (`start_date`,`end_date`),
  ADD KEY `idx_event_type` (`event_type`),
  ADD KEY `idx_target_role` (`target_role`),
  ADD KEY `idx_course_id` (`course_id`),
  ADD KEY `idx_events_uuid` (`uuid`);

--
-- Indexes for table `grade_levels`
--
ALTER TABLE `grade_levels`
  ADD PRIMARY KEY (`grade_level_id`),
  ADD UNIQUE KEY `unique_grade_code_institution` (`grade_level_code`,`institution_id`),
  ADD UNIQUE KEY `unique_grade_order_institution` (`institution_id`,`level_order`),
  ADD KEY `idx_institution_id` (`institution_id`),
  ADD KEY `idx_grade_level_code` (`grade_level_code`),
  ADD KEY `idx_level_order` (`level_order`),
  ADD KEY `idx_status` (`status`);

--
-- Indexes for table `grade_reports`
--
ALTER TABLE `grade_reports`
  ADD PRIMARY KEY (`report_id`),
  ADD UNIQUE KEY `uuid` (`uuid`),
  ADD UNIQUE KEY `unique_student_semester_report` (`student_id`,`academic_year_id`,`semester_id`,`report_type`),
  ADD KEY `FK_grade_reports_generator` (`generated_by`),
  ADD KEY `idx_institution_id` (`institution_id`),
  ADD KEY `idx_student_id` (`student_id`),
  ADD KEY `idx_academic_year` (`academic_year_id`),
  ADD KEY `idx_semester` (`semester_id`),
  ADD KEY `idx_report_type` (`report_type`),
  ADD KEY `idx_grade_reports_uuid` (`uuid`);

--
-- Indexes for table `grade_report_details`
--
ALTER TABLE `grade_report_details`
  ADD PRIMARY KEY (`report_detail_id`),
  ADD KEY `idx_report_id` (`report_id`),
  ADD KEY `idx_course_id` (`course_id`);

--
-- Indexes for table `grade_scales`
--
ALTER TABLE `grade_scales`
  ADD PRIMARY KEY (`grade_scale_id`),
  ADD KEY `idx_institution_id` (`institution_id`),
  ADD KEY `idx_grade` (`grade`),
  ADD KEY `idx_score_range` (`min_score`,`max_score`);

--
-- Indexes for table `institutions`
--
ALTER TABLE `institutions`
  ADD PRIMARY KEY (`institution_id`),
  ADD UNIQUE KEY `institution_code` (`institution_code`),
  ADD UNIQUE KEY `uuid` (`uuid`),
  ADD UNIQUE KEY `uuid_2` (`uuid`),
  ADD UNIQUE KEY `uuid_3` (`uuid`),
  ADD KEY `idx_institution_code` (`institution_code`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_institutions_uuid` (`uuid`);

--
-- Indexes for table `institution_settings`
--
ALTER TABLE `institution_settings`
  ADD PRIMARY KEY (`setting_id`),
  ADD UNIQUE KEY `unique_institution` (`institution_id`);

--
-- Indexes for table `login_activity`
--
ALTER TABLE `login_activity`
  ADD PRIMARY KEY (`login_activity_id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_login_time` (`login_time`),
  ADD KEY `idx_is_successful` (`is_successful`);

--
-- Indexes for table `messages`
--
ALTER TABLE `messages`
  ADD PRIMARY KEY (`message_id`),
  ADD UNIQUE KEY `uuid` (`uuid`),
  ADD UNIQUE KEY `uuid_2` (`uuid`),
  ADD UNIQUE KEY `uuid_3` (`uuid`),
  ADD KEY `FK_messages_parent` (`parent_message_id`),
  ADD KEY `idx_messages_sender` (`sender_id`),
  ADD KEY `idx_messages_receiver` (`receiver_id`),
  ADD KEY `idx_messages_course` (`course_id`),
  ADD KEY `idx_messages_read` (`is_read`),
  ADD KEY `idx_messages_sent_at` (`sent_at`),
  ADD KEY `idx_messages_uuid` (`uuid`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`notification_id`),
  ADD UNIQUE KEY `uuid` (`uuid`),
  ADD UNIQUE KEY `uuid_2` (`uuid`),
  ADD UNIQUE KEY `uuid_3` (`uuid`),
  ADD KEY `idx_sender_id` (`sender_id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_target_role` (`target_role`),
  ADD KEY `idx_course_id` (`course_id`),
  ADD KEY `idx_is_read` (`is_read`),
  ADD KEY `idx_created_at` (`created_at`),
  ADD KEY `idx_notifications_uuid` (`uuid`);

--
-- Indexes for table `parents`
--
ALTER TABLE `parents`
  ADD PRIMARY KEY (`parent_id`),
  ADD UNIQUE KEY `user_id` (`user_id`),
  ADD KEY `idx_institution_id` (`institution_id`),
  ADD KEY `idx_phone` (`phone_number`),
  ADD KEY `idx_email` (`email`);

--
-- Indexes for table `parent_students`
--
ALTER TABLE `parent_students`
  ADD PRIMARY KEY (`parent_student_id`),
  ADD UNIQUE KEY `unique_parent_student` (`parent_id`,`student_id`),
  ADD KEY `idx_parent_id` (`parent_id`),
  ADD KEY `idx_student_id` (`student_id`);

--
-- Indexes for table `password_reset_tokens`
--
ALTER TABLE `password_reset_tokens`
  ADD PRIMARY KEY (`token_id`),
  ADD UNIQUE KEY `token` (`token`),
  ADD KEY `idx_token` (`token`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_expiry_date` (`expiry_date`),
  ADD KEY `idx_is_active` (`is_active`);

--
-- Indexes for table `permissions`
--
ALTER TABLE `permissions`
  ADD PRIMARY KEY (`permission_id`),
  ADD UNIQUE KEY `permission_name` (`permission_name`);

--
-- Indexes for table `programs`
--
ALTER TABLE `programs`
  ADD PRIMARY KEY (`program_id`),
  ADD UNIQUE KEY `unique_program_code_institution` (`program_code`,`institution_id`),
  ADD KEY `idx_institution_id` (`institution_id`),
  ADD KEY `idx_program_code` (`program_code`),
  ADD KEY `idx_status` (`status`);

--
-- Indexes for table `quizzes`
--
ALTER TABLE `quizzes`
  ADD PRIMARY KEY (`quiz_id`),
  ADD KEY `idx_course_id` (`course_id`),
  ADD KEY `idx_section_id` (`section_id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_is_activated` (`is_activated`),
  ADD KEY `idx_start_date` (`start_date`),
  ADD KEY `idx_end_date` (`end_date`);

--
-- Indexes for table `quiz_questions`
--
ALTER TABLE `quiz_questions`
  ADD PRIMARY KEY (`question_id`),
  ADD KEY `idx_quiz_id` (`quiz_id`),
  ADD KEY `idx_question_type` (`question_type`),
  ADD KEY `idx_order_index` (`order_index`);

--
-- Indexes for table `quiz_question_options`
--
ALTER TABLE `quiz_question_options`
  ADD PRIMARY KEY (`option_id`),
  ADD KEY `idx_question_id` (`question_id`);

--
-- Indexes for table `quiz_submissions`
--
ALTER TABLE `quiz_submissions`
  ADD PRIMARY KEY (`submission_id`),
  ADD KEY `FK_quiz_submissions_grader` (`graded_by`),
  ADD KEY `idx_quiz_id` (`quiz_id`),
  ADD KEY `idx_student_id` (`student_id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_attempt` (`attempt`);

--
-- Indexes for table `quiz_submission_answers`
--
ALTER TABLE `quiz_submission_answers`
  ADD PRIMARY KEY (`submission_answer_id`),
  ADD KEY `idx_submission_id` (`submission_id`),
  ADD KEY `idx_question_id` (`question_id`);

--
-- Indexes for table `results`
--
ALTER TABLE `results`
  ADD PRIMARY KEY (`result_id`),
  ADD UNIQUE KEY `unique_student_course_semester` (`student_id`,`course_id`,`semester_id`),
  ADD KEY `idx_student_id` (`student_id`),
  ADD KEY `idx_course_id` (`course_id`),
  ADD KEY `idx_subject_id` (`subject_id`),
  ADD KEY `idx_semester_id` (`semester_id`),
  ADD KEY `idx_grade` (`grade`);

--
-- Indexes for table `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`role_id`),
  ADD UNIQUE KEY `role_name` (`role_name`);

--
-- Indexes for table `role_permissions`
--
ALTER TABLE `role_permissions`
  ADD PRIMARY KEY (`role_permission_id`),
  ADD UNIQUE KEY `unique_role_permission` (`role_id`,`permission_id`),
  ADD KEY `FK_role_permissions_permission` (`permission_id`);

--
-- Indexes for table `schema_migrations`
--
ALTER TABLE `schema_migrations`
  ADD PRIMARY KEY (`version`),
  ADD KEY `idx_applied_at` (`applied_at`);

--
-- Indexes for table `semesters`
--
ALTER TABLE `semesters`
  ADD PRIMARY KEY (`semester_id`),
  ADD KEY `idx_institution_id` (`institution_id`),
  ADD KEY `idx_academic_year_id` (`academic_year_id`),
  ADD KEY `idx_is_current` (`is_current`);

--
-- Indexes for table `students`
--
ALTER TABLE `students`
  ADD PRIMARY KEY (`student_id`),
  ADD UNIQUE KEY `user_id` (`user_id`),
  ADD UNIQUE KEY `unique_student_id_institution` (`student_id_number`,`institution_id`),
  ADD UNIQUE KEY `uuid` (`uuid`),
  ADD UNIQUE KEY `uuid_2` (`uuid`),
  ADD UNIQUE KEY `uuid_3` (`uuid`),
  ADD KEY `idx_institution_id` (`institution_id`),
  ADD KEY `idx_class_id` (`class_id`),
  ADD KEY `idx_student_id_number` (`student_id_number`),
  ADD KEY `idx_students_uuid` (`uuid`);

--
-- Indexes for table `subjects`
--
ALTER TABLE `subjects`
  ADD PRIMARY KEY (`subject_id`),
  ADD UNIQUE KEY `unique_subject_code_institution` (`subject_code`,`institution_id`),
  ADD UNIQUE KEY `uuid` (`uuid`),
  ADD UNIQUE KEY `uuid_2` (`uuid`),
  ADD UNIQUE KEY `uuid_3` (`uuid`),
  ADD KEY `idx_institution_id` (`institution_id`),
  ADD KEY `idx_subject_code` (`subject_code`),
  ADD KEY `idx_is_core` (`is_core`),
  ADD KEY `idx_subjects_uuid` (`uuid`);

--
-- Indexes for table `superadmin_activity`
--
ALTER TABLE `superadmin_activity`
  ADD PRIMARY KEY (`activity_id`),
  ADD UNIQUE KEY `uuid` (`uuid`),
  ADD KEY `idx_performed_by` (`performed_by`),
  ADD KEY `idx_activity_type` (`activity_type`),
  ADD KEY `idx_entity` (`entity_type`,`entity_id`),
  ADD KEY `idx_severity` (`severity`),
  ADD KEY `idx_created_at` (`created_at`);

--
-- Indexes for table `system_settings`
--
ALTER TABLE `system_settings`
  ADD PRIMARY KEY (`settings_id`);

--
-- Indexes for table `teachers`
--
ALTER TABLE `teachers`
  ADD PRIMARY KEY (`teacher_id`),
  ADD UNIQUE KEY `user_id` (`user_id`),
  ADD UNIQUE KEY `unique_employee_id_institution` (`employee_id`,`institution_id`),
  ADD UNIQUE KEY `uuid` (`uuid`),
  ADD UNIQUE KEY `uuid_2` (`uuid`),
  ADD UNIQUE KEY `uuid_3` (`uuid`),
  ADD KEY `idx_institution_id` (`institution_id`),
  ADD KEY `idx_employee_id` (`employee_id`),
  ADD KEY `idx_program_id` (`program_id`),
  ADD KEY `idx_employment_end_date` (`employment_end_date`),
  ADD KEY `idx_teachers_uuid` (`uuid`);

--
-- Indexes for table `teacher_subjects`
--
ALTER TABLE `teacher_subjects`
  ADD PRIMARY KEY (`teacher_subject_id`),
  ADD KEY `idx_teacher_id` (`teacher_id`),
  ADD KEY `idx_subject_id` (`subject_id`),
  ADD KEY `idx_teacher_subject` (`teacher_id`,`subject_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `uuid` (`uuid`),
  ADD UNIQUE KEY `uuid_2` (`uuid`),
  ADD UNIQUE KEY `uuid_3` (`uuid`),
  ADD UNIQUE KEY `unique_username_institution` (`username`,`institution_id`),
  ADD UNIQUE KEY `unique_email_institution` (`email`,`institution_id`),
  ADD KEY `idx_institution` (`institution_id`),
  ADD KEY `idx_username` (`username`),
  ADD KEY `idx_email` (`email`),
  ADD KEY `idx_is_super_admin` (`is_super_admin`),
  ADD KEY `idx_is_active` (`is_active`),
  ADD KEY `idx_user_active` (`is_active`,`created_at`),
  ADD KEY `idx_users_uuid` (`uuid`);

--
-- Indexes for table `user_activity`
--
ALTER TABLE `user_activity`
  ADD PRIMARY KEY (`activity_id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_activity_type` (`activity_type`),
  ADD KEY `idx_created_at` (`created_at`);

--
-- Indexes for table `user_roles`
--
ALTER TABLE `user_roles`
  ADD PRIMARY KEY (`user_role_id`),
  ADD UNIQUE KEY `unique_user_role` (`user_id`,`role_id`),
  ADD KEY `FK_user_roles_role` (`role_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `academic_years`
--
ALTER TABLE `academic_years`
  MODIFY `academic_year_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;

--
-- AUTO_INCREMENT for table `announcements`
--
ALTER TABLE `announcements`
  MODIFY `announcement_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `assessments`
--
ALTER TABLE `assessments`
  MODIFY `assessment_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `assessment_categories`
--
ALTER TABLE `assessment_categories`
  MODIFY `category_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=25;

--
-- AUTO_INCREMENT for table `assessment_submissions`
--
ALTER TABLE `assessment_submissions`
  MODIFY `submission_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `assignments`
--
ALTER TABLE `assignments`
  MODIFY `assignment_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=42;

--
-- AUTO_INCREMENT for table `assignment_submissions`
--
ALTER TABLE `assignment_submissions`
  MODIFY `submission_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `attendance`
--
ALTER TABLE `attendance`
  MODIFY `attendance_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=101;

--
-- AUTO_INCREMENT for table `classes`
--
ALTER TABLE `classes`
  MODIFY `class_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=43;

--
-- AUTO_INCREMENT for table `class_subjects`
--
ALTER TABLE `class_subjects`
  MODIFY `course_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=63;

--
-- AUTO_INCREMENT for table `course_content`
--
ALTER TABLE `course_content`
  MODIFY `course_content_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `course_content_order`
--
ALTER TABLE `course_content_order`
  MODIFY `course_content_order_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `course_enrollments`
--
ALTER TABLE `course_enrollments`
  MODIFY `enrollment_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=242;

--
-- AUTO_INCREMENT for table `course_materials`
--
ALTER TABLE `course_materials`
  MODIFY `material_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `course_reviews`
--
ALTER TABLE `course_reviews`
  MODIFY `review_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `course_schedules`
--
ALTER TABLE `course_schedules`
  MODIFY `schedule_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=81;

--
-- AUTO_INCREMENT for table `course_sections`
--
ALTER TABLE `course_sections`
  MODIFY `course_sections_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `error_logs`
--
ALTER TABLE `error_logs`
  MODIFY `error_log_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `events`
--
ALTER TABLE `events`
  MODIFY `event_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `grade_levels`
--
ALTER TABLE `grade_levels`
  MODIFY `grade_level_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=28;

--
-- AUTO_INCREMENT for table `grade_reports`
--
ALTER TABLE `grade_reports`
  MODIFY `report_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `grade_report_details`
--
ALTER TABLE `grade_report_details`
  MODIFY `report_detail_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `grade_scales`
--
ALTER TABLE `grade_scales`
  MODIFY `grade_scale_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=46;

--
-- AUTO_INCREMENT for table `institutions`
--
ALTER TABLE `institutions`
  MODIFY `institution_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

--
-- AUTO_INCREMENT for table `institution_settings`
--
ALTER TABLE `institution_settings`
  MODIFY `setting_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

--
-- AUTO_INCREMENT for table `login_activity`
--
ALTER TABLE `login_activity`
  MODIFY `login_activity_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=146;

--
-- AUTO_INCREMENT for table `messages`
--
ALTER TABLE `messages`
  MODIFY `message_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `notification_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=218;

--
-- AUTO_INCREMENT for table `parents`
--
ALTER TABLE `parents`
  MODIFY `parent_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=42;

--
-- AUTO_INCREMENT for table `parent_students`
--
ALTER TABLE `parent_students`
  MODIFY `parent_student_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=62;

--
-- AUTO_INCREMENT for table `password_reset_tokens`
--
ALTER TABLE `password_reset_tokens`
  MODIFY `token_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `permissions`
--
ALTER TABLE `permissions`
  MODIFY `permission_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=49;

--
-- AUTO_INCREMENT for table `programs`
--
ALTER TABLE `programs`
  MODIFY `program_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=28;

--
-- AUTO_INCREMENT for table `quizzes`
--
ALTER TABLE `quizzes`
  MODIFY `quiz_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=34;

--
-- AUTO_INCREMENT for table `quiz_questions`
--
ALTER TABLE `quiz_questions`
  MODIFY `question_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=64;

--
-- AUTO_INCREMENT for table `quiz_question_options`
--
ALTER TABLE `quiz_question_options`
  MODIFY `option_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=29;

--
-- AUTO_INCREMENT for table `quiz_submissions`
--
ALTER TABLE `quiz_submissions`
  MODIFY `submission_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `quiz_submission_answers`
--
ALTER TABLE `quiz_submission_answers`
  MODIFY `submission_answer_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `results`
--
ALTER TABLE `results`
  MODIFY `result_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `roles`
--
ALTER TABLE `roles`
  MODIFY `role_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

--
-- AUTO_INCREMENT for table `role_permissions`
--
ALTER TABLE `role_permissions`
  MODIFY `role_permission_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=94;

--
-- AUTO_INCREMENT for table `semesters`
--
ALTER TABLE `semesters`
  MODIFY `semester_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=27;

--
-- AUTO_INCREMENT for table `students`
--
ALTER TABLE `students`
  MODIFY `student_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=83;

--
-- AUTO_INCREMENT for table `subjects`
--
ALTER TABLE `subjects`
  MODIFY `subject_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=94;

--
-- AUTO_INCREMENT for table `superadmin_activity`
--
ALTER TABLE `superadmin_activity`
  MODIFY `activity_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `system_settings`
--
ALTER TABLE `system_settings`
  MODIFY `settings_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `teachers`
--
ALTER TABLE `teachers`
  MODIFY `teacher_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=43;

--
-- AUTO_INCREMENT for table `teacher_subjects`
--
ALTER TABLE `teacher_subjects`
  MODIFY `teacher_subject_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=192;

--
-- AUTO_INCREMENT for table `user_activity`
--
ALTER TABLE `user_activity`
  MODIFY `activity_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1574;

--
-- AUTO_INCREMENT for table `user_roles`
--
ALTER TABLE `user_roles`
  MODIFY `user_role_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=271;

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
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
