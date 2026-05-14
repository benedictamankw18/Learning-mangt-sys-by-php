-- ============================================================
-- Seed Realistic Assignment & Submission Data for Analytics
-- ============================================================
-- This script creates sample assignments and student submissions
-- across all teacher courses to populate analytics dashboard with data.
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================
-- 1. TRUNCATE EXISTING DATA (optional - comment out if you want to preserve)
-- ============================================================
-- TRUNCATE TABLE `assignment_submissions`;
-- TRUNCATE TABLE `assignments`;

-- ============================================================
-- 2. CREATE ASSIGNMENTS FOR EACH COURSE
-- ============================================================
-- For each course (class_subject), create 3 sample assignments

INSERT INTO `assignments` 
  (`uuid`, `course_id`, `title`, `description`, `due_date`, `submission_type`, `max_score`, `status`,   `created_at`, `updated_at`)
SELECT 
  UUID() as uuid,
  cs.`course_id`,
  CONCAT('Assignment 1: Chapter Overview - ', SUBSTRING_INDEX(s.subject_code, '-', 1)) as title,
  CONCAT('Complete readings from Chapter 1-2 and submit your summary.') as description,
  DATE_ADD(NOW(), INTERVAL 7 DAY) as due_date,
  'file' as submission_type,
  100 as max_score,
  'active' as status,
  NOW() as created_at,
  NOW() as updated_at
FROM `class_subjects` cs
INNER JOIN `subjects` s ON cs.`subject_id` = s.`subject_id`
WHERE cs.`status` = 'active'
ON DUPLICATE KEY UPDATE `updated_at` = NOW();

INSERT INTO `assignments` 
  (`uuid`, `course_id`, `title`, `description`,  `due_date`, `submission_type`, `max_score`, `status`,  `created_at`, `updated_at`)
SELECT 
  UUID() as uuid,
  cs.`course_id`,
  CONCAT('Assignment 2: Problem Set - ', SUBSTRING_INDEX(s.subject_code, '-', 1)) as title,
  CONCAT('Solve problems from textbook section 2.3-2.5') as description,
  DATE_ADD(NOW(), INTERVAL 14 DAY) as due_date,
  'file' as submission_type,
  100 as max_score,
  'active' as status,
  NOW() as created_at,
  NOW() as updated_at
FROM `class_subjects` cs
INNER JOIN `subjects` s ON cs.`subject_id` = s.`subject_id`
WHERE cs.`status` = 'active'
ON DUPLICATE KEY UPDATE `updated_at` = NOW();

INSERT INTO `assignments` 
  (`uuid`, `course_id`, `title`, `description`, `due_date`, `submission_type`, `max_score`, `status`,  `created_at`, `updated_at`)
SELECT 
  UUID() as uuid,
  cs.`course_id`,
  CONCAT('Assignment 3: Research Project - ', SUBSTRING_INDEX(s.subject_code, '-', 1)) as title,
  CONCAT('Research current topics in ', s.subject_name) as description,
  DATE_ADD(NOW(), INTERVAL 21 DAY) as due_date,
  'file' as submission_type,
  100 as max_score,
  'active' as status,
  NOW() as created_at,
  NOW() as updated_at
FROM `class_subjects` cs
INNER JOIN `subjects` s ON cs.`subject_id` = s.`subject_id`
WHERE cs.`status` = 'active'
ON DUPLICATE KEY UPDATE `updated_at` = NOW();

-- ============================================================
-- 3. CREATE STUDENT SUBMISSIONS FOR EACH ASSIGNMENT
-- ============================================================
-- Get enrolled students and create submissions with realistic scores

INSERT INTO `assignment_submissions` 
  (`uuid`, `assignment_id`, `student_id`, `file_path`, `score`, `feedback`, `submitted_at`, `graded_at`, `grader_id`, `status`, `created_at`, `updated_at`)
SELECT 
  UUID() as uuid,
  a.`assignment_id`,
  se.`student_id`,
  CONCAT('/uploads/assignments/', DATE_FORMAT(NOW(), '%Y%m%d'), '_', UUID(), '.pdf') as file_path,
  -- Generate realistic score distribution (40-95 with more in mid-range)
  CASE 
    WHEN RAND() < 0.05 THEN FLOOR(40 + RAND() * 20)   -- 5% fail (40-60)
    WHEN RAND() < 0.15 THEN FLOOR(60 + RAND() * 15)   -- 10% below avg (60-75)
    WHEN RAND() < 0.60 THEN FLOOR(75 + RAND() * 15)   -- 45% average (75-90)
    ELSE FLOOR(85 + RAND() * 10)                       -- 40% above avg (85-95)
  END as score,
  CASE 
    WHEN FLOOR(75 + RAND() * 20) > 85 THEN 'Good work, well organized!'
    WHEN FLOOR(75 + RAND() * 20) > 75 THEN 'Satisfactory, needs some refinement'
    ELSE 'Needs improvement, please revise'
  END as feedback,
  DATE_ADD(NOW(), INTERVAL FLOOR(RAND() * 3) - 2 DAY) as submitted_at,
  DATE_ADD(NOW(), INTERVAL 1 DAY) as graded_at,
  cs.`teacher_id` as grader_id,
  'submitted' as status,
  NOW() as created_at,
  NOW() as updated_at
FROM `assignments` a
INNER JOIN `class_subjects` cs ON a.`course_id` = cs.`course_id`
INNER JOIN `student_enrollments` se ON se.`class_id` = cs.`class_id`
  AND se.`status` IN ('active', 'completed')
  AND se.`academic_year_id` = cs.`academic_year_id`
WHERE a.`status` = 'active'
  AND cs.`status` = 'active'
  AND a.`created_at` IS NOT NULL
ON DUPLICATE KEY UPDATE `updated_at` = NOW();

-- ============================================================
-- 4. UPDATE ASSIGNMENT STATISTICS
-- ============================================================
-- Recalculate submission counts and average scores per assignment

UPDATE `assignments` a
SET 
  a.`submission_count` = (
    SELECT COUNT(*) 
    FROM `assignment_submissions` asub 
    WHERE asub.`assignment_id` = a.`assignment_id`
  ),
  a.`average_score` = (
    SELECT COALESCE(AVG(asub.`score`), 0)
    FROM `assignment_submissions` asub 
    WHERE asub.`assignment_id` = a.`assignment_id` 
      AND asub.`score` IS NOT NULL
  )
WHERE a.`status` = 'active';

-- ============================================================
-- 5. VERIFY DATA CREATION
-- ============================================================
-- Run these SELECT statements to verify the seeded data

-- Show assignment count by course
SELECT cs.course_id, COUNT(a.assignment_id) as assignment_count, s.subject_name
FROM class_subjects cs
LEFT JOIN assignments a ON a.course_id = cs.course_id AND a.status = 'active'
LEFT JOIN subjects s ON cs.subject_id = s.subject_id
GROUP BY cs.course_id
ORDER BY assignment_count DESC;

-- Show submission count and average score by assignment
SELECT a.assignment_id, a.title, COUNT(asub.submission_id) as submission_count, 
       AVG(asub.score) as avg_score
FROM assignments a
LEFT JOIN assignment_submissions asub ON asub.assignment_id = a.assignment_id
WHERE a.status = 'active'
GROUP BY a.assignment_id
ORDER BY submission_count DESC;

-- Show class performance (average scores per course)
SELECT cs.course_id, s.subject_name, c.class_name, 
       AVG(asub.score) as avg_score, COUNT(asub.submission_id) as submission_count
FROM class_subjects cs
INNER JOIN subjects s ON cs.subject_id = s.subject_id
INNER JOIN classes c ON cs.class_id = c.class_id
LEFT JOIN assignments a ON a.course_id = cs.course_id
LEFT JOIN assignment_submissions asub ON asub.assignment_id = a.assignment_id
WHERE cs.status = 'active'
GROUP BY cs.course_id
ORDER BY avg_score DESC;

SET FOREIGN_KEY_CHECKS = 1;
