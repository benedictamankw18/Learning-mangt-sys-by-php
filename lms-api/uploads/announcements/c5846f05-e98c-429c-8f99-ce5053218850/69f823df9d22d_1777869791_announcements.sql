-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: May 04, 2026 at 06:26 AM
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
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `attachments` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`attachments`)),
  `priority` tinyint(3) NOT NULL DEFAULT 0,
  `read_count` int(11) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `announcements`
--

INSERT INTO `announcements` (`announcement_id`, `uuid`, `title`, `content`, `author_id`, `target_role`, `is_published`, `published_at`, `expires_at`, `created_at`, `updated_at`, `attachments`, `priority`, `read_count`) VALUES
(1, 'f5e2b3c2-1746-11f1-8ccc-10653022c2a0', 'Welcome to New Academic Year', '__ANN_META__{\"priority\":\"normal\",\"class_audience\":\"\",\"attachments\":[]}\nfdfdfww', 147, NULL, 1, '2024-08-25 08:00:00', NULL, '2026-03-03 21:21:32', '2026-05-04 03:49:40', NULL, 0, 0),
(2, 'f5e3ae08-1746-11f1-8ccc-10653022c2a0', 'First Term Schedule', 'First term runs from September 1 to December 20. Midterm exams: October 28-November 1.', 147, NULL, 1, '2024-08-26 09:00:00', NULL, '2026-03-03 21:21:32', '2026-05-04 04:25:34', '[{\"original_name\":\"teacher-assessment-import-template.csv.xlsx\",\"filename\":\"69f81ca4c850a_1777867940_teacher-assessment-import-template.csv.xlsx\",\"size\":11328,\"type\":\"application\\/vnd.openxmlformats-officedocument.spreadsheetml.sheet\",\"url\":\"\\/uploads\\/announcements\\/9619dbaa-54f7-4254-b2ef-c45ebf844d3c\\/69f81ca4c850a_1777867940_teacher-assessment-import-template.csv.xlsx\",\"uploaded_at\":\"2026-05-04 06:12:20\"},{\"original_name\":\"report-card-mr-osei-kwame-first-term.pdf\",\"filename\":\"69f81ee5ee36f_1777868517_report-card-mr-osei-kwame-first-term.pdf\",\"size\":29276,\"type\":\"application\\/pdf\",\"url\":\"\\/uploads\\/announcements\\/9619dbaa-54f7-4254-b2ef-c45ebf844d3c\\/69f81ee5ee36f_1777868517_report-card-mr-osei-kwame-first-term.pdf\",\"uploaded_at\":\"2026-05-04 06:21:57\"},{\"original_name\":\"report-card-mr-osei-kwame-second-term.pdf\",\"filename\":\"69f81ee6088e6_1777868518_report-card-mr-osei-kwame-second-term.pdf\",\"size\":24718,\"type\":\"application\\/pdf\",\"url\":\"\\/uploads\\/announcements\\/9619dbaa-54f7-4254-b2ef-c45ebf844d3c\\/69f81ee6088e6_1777868518_report-card-mr-osei-kwame-second-term.pdf\",\"uploaded_at\":\"2026-05-04 06:21:58\"},{\"original_name\":\"report-card-mr-osei-kwame-firstterm.pdf\",\"filename\":\"69f81ee6130f1_1777868518_report-card-mr-osei-kwame-firstterm.pdf\",\"size\":29269,\"type\":\"application\\/pdf\",\"url\":\"\\/uploads\\/announcements\\/9619dbaa-54f7-4254-b2ef-c45ebf844d3c\\/69f81ee6130f1_1777868518_report-card-mr-osei-kwame-firstterm.pdf\",\"uploaded_at\":\"2026-05-04 06:21:58\"}]', 0, 0),
(3, 'f5e3b346-1746-11f1-8ccc-10653022c2a0', 'Sports Day Announcement', 'Annual sports day will be held on November 15. All students must participate.', 147, 'student', 1, '2024-10-01 10:00:00', NULL, '2026-03-03 21:21:32', '2026-05-04 03:49:51', NULL, 0, 0),
(4, 'f5e3b72c-1746-11f1-8ccc-10653022c2a0', 'Parent-Teacher Conference', 'PTA meeting scheduled for October 20 at 2:00 PM in the school hall.', 147, 'parent', 1, '2024-10-05 08:00:00', NULL, '2026-03-03 21:21:32', '2026-05-04 03:50:31', NULL, 0, 0),
(5, 'f5e3ba20-1746-11f1-8ccc-10653022c2a0', 'Library Hours Extended', 'Library will now close at 8:00 PM on weekdays to accommodate exam preparation.', 147, 'student', 1, '2024-10-10 12:00:00', NULL, '2026-03-03 21:21:32', '2026-05-04 03:50:54', NULL, 0, 0),
(6, 'f5e3bd2d-1746-11f1-8ccc-10653022c2a0', 'Midterm Exam Timetable Released', 'Check your student portal for the complete midterm examination timetable.', 147, 'student', 1, '2024-10-15 08:00:00', NULL, '2026-03-03 21:21:32', '2026-05-04 03:50:54', NULL, 0, 0),
(7, 'f5e3bfde-1746-11f1-8ccc-10653022c2a0', 'Teacher Training Workshop', 'Mandatory workshop on modern teaching methods - Saturday, November 5.', 147, 'teacher', 1, '2024-10-20 09:00:00', NULL, '2026-03-03 21:21:32', '2026-05-04 03:50:54', NULL, 0, 0),
(8, 'f5e3c263-1746-11f1-8ccc-10653022c2a0', 'School Closing Date', 'First term ends December 20. Second term resumes January 6, 2025.', 147, NULL, 1, '2024-11-01 10:00:00', NULL, '2026-03-03 21:21:32', '2026-05-04 03:50:54', NULL, 0, 0),
(9, '0562420a-1922-4eef-b299-f22c43476ffd', 'guly6cytcyh', '__ANN_META__{\"priority\":\"urgent\",\"class_audience\":\"\",\"attachments\":[\"lms (2).sql\",\"report-card-mr-osei-kwame-first-term.pdf\",\"report-card-mr-osei-kwame-second-term.pdf\",\"report-card-mr-osei-kwame-firstterm.pdf\",\"lms (1).sql\",\"teacher-assessment-import-template.csv.xlsx\"]}\njgvyuytfutf6c\'tc7dt', 147, 'all', 0, '2026-05-04 03:21:40', NULL, '2026-05-04 03:10:55', '2026-05-04 03:50:54', NULL, 0, 0),
(10, 'c5846f05-e98c-429c-8f99-ce5053218850', 'xcddfd', '__ANN_META__{\"priority\":\"normal\",\"class_audience\":\"\",\"attachments\":[]}\nfdfdfww', 147, 'student', 0, NULL, NULL, '2026-05-04 03:24:01', '2026-05-04 03:24:15', NULL, 0, 0),
(11, '0718cd59-cc9a-4b46-b10d-c8d3eee9cf0e', ',lkjjjjj', '__ANN_META__{\"priority\":\"normal\",\"class_audience\":\"\",\"attachments\":[]}\n', 147, 'class', 0, NULL, NULL, '2026-05-04 03:46:56', '2026-05-04 03:47:33', NULL, 0, 0),
(12, '9619dbaa-54f7-4254-b2ef-c45ebf844d3c', 'cwfewffewfewf', '__ANN_META__{\"priority\":\"normal\",\"class_audience\":[\"SHS 1 General Arts A\",\"SHS 1 General Arts B\",\"SHS 1 Science S\",\"SHS 1 Science W\"]}\nvdsbdfbfdbdfbfdbdfbfdbfd', 152, 'class', 0, NULL, '2026-05-22 04:11:00', '2026-05-04 04:12:20', '2026-05-04 04:21:58', '[{\"original_name\":\"teacher-assessment-import-template.csv.xlsx\",\"filename\":\"69f81ca4c850a_1777867940_teacher-assessment-import-template.csv.xlsx\",\"size\":11328,\"type\":\"application\\/vnd.openxmlformats-officedocument.spreadsheetml.sheet\",\"url\":\"\\/uploads\\/announcements\\/9619dbaa-54f7-4254-b2ef-c45ebf844d3c\\/69f81ca4c850a_1777867940_teacher-assessment-import-template.csv.xlsx\",\"uploaded_at\":\"2026-05-04 06:12:20\"},{\"original_name\":\"report-card-mr-osei-kwame-first-term.pdf\",\"filename\":\"69f81ee5ee36f_1777868517_report-card-mr-osei-kwame-first-term.pdf\",\"size\":29276,\"type\":\"application\\/pdf\",\"url\":\"\\/uploads\\/announcements\\/9619dbaa-54f7-4254-b2ef-c45ebf844d3c\\/69f81ee5ee36f_1777868517_report-card-mr-osei-kwame-first-term.pdf\",\"uploaded_at\":\"2026-05-04 06:21:57\"},{\"original_name\":\"report-card-mr-osei-kwame-second-term.pdf\",\"filename\":\"69f81ee6088e6_1777868518_report-card-mr-osei-kwame-second-term.pdf\",\"size\":24718,\"type\":\"application\\/pdf\",\"url\":\"\\/uploads\\/announcements\\/9619dbaa-54f7-4254-b2ef-c45ebf844d3c\\/69f81ee6088e6_1777868518_report-card-mr-osei-kwame-second-term.pdf\",\"uploaded_at\":\"2026-05-04 06:21:58\"},{\"original_name\":\"report-card-mr-osei-kwame-firstterm.pdf\",\"filename\":\"69f81ee6130f1_1777868518_report-card-mr-osei-kwame-firstterm.pdf\",\"size\":29269,\"type\":\"application\\/pdf\",\"url\":\"\\/uploads\\/announcements\\/9619dbaa-54f7-4254-b2ef-c45ebf844d3c\\/69f81ee6130f1_1777868518_report-card-mr-osei-kwame-firstterm.pdf\",\"uploaded_at\":\"2026-05-04 06:21:58\"}]', 0, 0);

--
-- Indexes for dumped tables
--

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
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `announcements`
--
ALTER TABLE `announcements`
  MODIFY `announcement_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `announcements`
--
ALTER TABLE `announcements`
  ADD CONSTRAINT `FK_announcements_author` FOREIGN KEY (`author_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
