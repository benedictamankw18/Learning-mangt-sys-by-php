-- ========================================
-- Migration: Add UUIDs for API Security
-- Version: 001
-- Date: 2026-03-03
-- Description: Add UUID columns to prevent predictable ID enumeration attacks
-- ========================================

-- IMPORTANT: This migration is for EXISTING databases
-- Run this on production/staging databases that were created before UUID implementation
-- For fresh installations, use lms (1).sql which already includes UUIDs

-- ========================================
-- BACKUP FIRST!
-- ========================================
-- Before running this migration, ensure you have a complete backup:
-- mysqldump -u root -p lms > lms_backup_before_uuid_migration.sql

-- ========================================
-- START MIGRATION
-- ========================================

USE lms;

SET FOREIGN_KEY_CHECKS=0;

-- ========================================
-- Step 1: Add UUID columns
-- ========================================

-- Institutions table
ALTER TABLE `institutions` 
  ADD COLUMN IF NOT EXISTS `uuid` CHAR(36) NULL AFTER `institution_id`;

-- Users table
ALTER TABLE `users` 
  ADD COLUMN IF NOT EXISTS `uuid` CHAR(36) NULL AFTER `user_id`;

-- Students table
ALTER TABLE `students` 
  ADD COLUMN IF NOT EXISTS `uuid` CHAR(36) NULL AFTER `student_id`;

-- Teachers table
ALTER TABLE `teachers` 
  ADD COLUMN IF NOT EXISTS `uuid` CHAR(36) NULL AFTER `teacher_id`;

-- Classes table
ALTER TABLE `classes` 
  ADD COLUMN IF NOT EXISTS `uuid` CHAR(36) NULL AFTER `class_id`;

-- Subjects table
ALTER TABLE `subjects` 
  ADD COLUMN IF NOT EXISTS `uuid` CHAR(36) NULL AFTER `subject_id`;

-- Course Content table
ALTER TABLE `course_content` 
  ADD COLUMN IF NOT EXISTS `uuid` CHAR(36) NULL AFTER `course_content_id`;

-- Assignments table
ALTER TABLE `assignments` 
  ADD COLUMN IF NOT EXISTS `uuid` CHAR(36) NULL AFTER `assignment_id`;

-- Grade Reports table
ALTER TABLE `grade_reports` 
  ADD COLUMN IF NOT EXISTS `uuid` CHAR(36) NULL AFTER `report_id`;

-- Messages table
ALTER TABLE `messages` 
  ADD COLUMN IF NOT EXISTS `uuid` CHAR(36) NULL AFTER `message_id`;

-- Notifications table
ALTER TABLE `notifications` 
  ADD COLUMN IF NOT EXISTS `uuid` CHAR(36) NULL AFTER `notification_id`;

-- Events table
ALTER TABLE `events` 
  ADD COLUMN IF NOT EXISTS `uuid` CHAR(36) NULL AFTER `event_id`;

-- Announcements table
ALTER TABLE `announcements` 
  ADD COLUMN IF NOT EXISTS `uuid` CHAR(36) NULL AFTER `announcement_id`;

-- ========================================
-- Step 2: Generate UUIDs for existing records
-- ========================================

UPDATE `institutions` SET `uuid` = UUID() WHERE `uuid` IS NULL OR `uuid` = '';
UPDATE `users` SET `uuid` = UUID() WHERE `uuid` IS NULL OR `uuid` = '';
UPDATE `students` SET `uuid` = UUID() WHERE `uuid` IS NULL OR `uuid` = '';
UPDATE `teachers` SET `uuid` = UUID() WHERE `uuid` IS NULL OR `uuid` = '';
UPDATE `classes` SET `uuid` = UUID() WHERE `uuid` IS NULL OR `uuid` = '';
UPDATE `subjects` SET `uuid` = UUID() WHERE `uuid` IS NULL OR `uuid` = '';
UPDATE `course_content` SET `uuid` = UUID() WHERE `uuid` IS NULL OR `uuid` = '';
UPDATE `assignments` SET `uuid` = UUID() WHERE `uuid` IS NULL OR `uuid` = '';
UPDATE `grade_reports` SET `uuid` = UUID() WHERE `uuid` IS NULL OR `uuid` = '';
UPDATE `messages` SET `uuid` = UUID() WHERE `uuid` IS NULL OR `uuid` = '';
UPDATE `notifications` SET `uuid` = UUID() WHERE `uuid` IS NULL OR `uuid` = '';
UPDATE `events` SET `uuid` = UUID() WHERE `uuid` IS NULL OR `uuid` = '';
UPDATE `announcements` SET `uuid` = UUID() WHERE `uuid` IS NULL OR `uuid` = '';

-- ========================================
-- Step 3: Make UUID columns NOT NULL and UNIQUE
-- ========================================

ALTER TABLE `institutions` MODIFY COLUMN `uuid` CHAR(36) NOT NULL UNIQUE;
ALTER TABLE `users` MODIFY COLUMN `uuid` CHAR(36) NOT NULL UNIQUE;
ALTER TABLE `students` MODIFY COLUMN `uuid` CHAR(36) NOT NULL UNIQUE;
ALTER TABLE `teachers` MODIFY COLUMN `uuid` CHAR(36) NOT NULL UNIQUE;
ALTER TABLE `classes` MODIFY COLUMN `uuid` CHAR(36) NOT NULL UNIQUE;
ALTER TABLE `subjects` MODIFY COLUMN `uuid` CHAR(36) NOT NULL UNIQUE;
ALTER TABLE `course_content` MODIFY COLUMN `uuid` CHAR(36) NOT NULL UNIQUE;
ALTER TABLE `assignments` MODIFY COLUMN `uuid` CHAR(36) NOT NULL UNIQUE;
ALTER TABLE `grade_reports` MODIFY COLUMN `uuid` CHAR(36) NOT NULL UNIQUE;
ALTER TABLE `messages` MODIFY COLUMN `uuid` CHAR(36) NOT NULL UNIQUE;
ALTER TABLE `notifications` MODIFY COLUMN `uuid` CHAR(36) NOT NULL UNIQUE;
ALTER TABLE `events` MODIFY COLUMN `uuid` CHAR(36) NOT NULL UNIQUE;
ALTER TABLE `announcements` MODIFY COLUMN `uuid` CHAR(36) NOT NULL UNIQUE;

-- ========================================
-- Step 4: Add indexes for UUID lookups
-- ========================================

-- Drop existing indexes if they exist (ignore errors)
ALTER TABLE `institutions` DROP INDEX IF EXISTS `idx_institutions_uuid`;
ALTER TABLE `users` DROP INDEX IF EXISTS `idx_users_uuid`;
ALTER TABLE `students` DROP INDEX IF EXISTS `idx_students_uuid`;
ALTER TABLE `teachers` DROP INDEX IF EXISTS `idx_teachers_uuid`;
ALTER TABLE `classes` DROP INDEX IF EXISTS `idx_classes_uuid`;
ALTER TABLE `subjects` DROP INDEX IF EXISTS `idx_subjects_uuid`;
ALTER TABLE `course_content` DROP INDEX IF EXISTS `idx_course_content_uuid`;
ALTER TABLE `assignments` DROP INDEX IF EXISTS `idx_assignments_uuid`;
ALTER TABLE `grade_reports` DROP INDEX IF EXISTS `idx_grade_reports_uuid`;
ALTER TABLE `messages` DROP INDEX IF EXISTS `idx_messages_uuid`;
ALTER TABLE `notifications` DROP INDEX IF EXISTS `idx_notifications_uuid`;
ALTER TABLE `events` DROP INDEX IF EXISTS `idx_events_uuid`;
ALTER TABLE `announcements` DROP INDEX IF EXISTS `idx_announcements_uuid`;

-- Create indexes for performance
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

SET FOREIGN_KEY_CHECKS=1;

-- ========================================
-- Verification Queries
-- ========================================

-- Check that all records have UUIDs
SELECT 'institutions' as table_name, COUNT(*) as total, 
       SUM(CASE WHEN uuid IS NOT NULL AND uuid != '' THEN 1 ELSE 0 END) as with_uuid
FROM institutions
UNION ALL
SELECT 'users', COUNT(*), SUM(CASE WHEN uuid IS NOT NULL AND uuid != '' THEN 1 ELSE 0 END)
FROM users
UNION ALL
SELECT 'students', COUNT(*), SUM(CASE WHEN uuid IS NOT NULL AND uuid != '' THEN 1 ELSE 0 END)
FROM students
UNION ALL
SELECT 'teachers', COUNT(*), SUM(CASE WHEN uuid IS NOT NULL AND uuid != '' THEN 1 ELSE 0 END)
FROM teachers
UNION ALL
SELECT 'classes', COUNT(*), SUM(CASE WHEN uuid IS NOT NULL AND uuid != '' THEN 1 ELSE 0 END)
FROM classes
UNION ALL
SELECT 'subjects', COUNT(*), SUM(CASE WHEN uuid IS NOT NULL AND uuid != '' THEN 1 ELSE 0 END)
FROM subjects
UNION ALL
SELECT 'course_content', COUNT(*), SUM(CASE WHEN uuid IS NOT NULL AND uuid != '' THEN 1 ELSE 0 END)
FROM course_content
UNION ALL
SELECT 'assignments', COUNT(*), SUM(CASE WHEN uuid IS NOT NULL AND uuid != '' THEN 1 ELSE 0 END)
FROM assignments
UNION ALL
SELECT 'grade_reports', COUNT(*), SUM(CASE WHEN uuid IS NOT NULL AND uuid != '' THEN 1 ELSE 0 END)
FROM grade_reports
UNION ALL
SELECT 'messages', COUNT(*), SUM(CASE WHEN uuid IS NOT NULL AND uuid != '' THEN 1 ELSE 0 END)
FROM messages
UNION ALL
SELECT 'notifications', COUNT(*), SUM(CASE WHEN uuid IS NOT NULL AND uuid != '' THEN 1 ELSE 0 END)
FROM notifications
UNION ALL
SELECT 'events', COUNT(*), SUM(CASE WHEN uuid IS NOT NULL AND uuid != '' THEN 1 ELSE 0 END)
FROM events
UNION ALL
SELECT 'announcements', COUNT(*), SUM(CASE WHEN uuid IS NOT NULL AND uuid != '' THEN 1 ELSE 0 END)
FROM announcements;

-- ========================================
-- MIGRATION COMPLETE
-- ========================================

-- Expected output: All tables should show total = with_uuid
-- If any table shows mismatch, rerun the UPDATE statements for that table

-- Next steps:
-- 1. Update PHP repositories to use UUIDs in API endpoints
-- 2. Update controllers to accept UUID parameters
-- 3. Test all API endpoints with UUIDs
-- 4. Monitor application logs for any integer ID usage

SELECT 'Migration completed successfully! Check verification results above.' as status;
