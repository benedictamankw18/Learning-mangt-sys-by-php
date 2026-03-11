-- =============================================================================
-- LMS Activity Tables Migration
-- Adds: teacher_activity, student_activity, parent_activity
-- Adds: 90-day auto-purge via EVENT SCHEDULER + AFTER INSERT triggers
-- Run against: lms database
-- Date: 2026-03-11
-- =============================================================================

USE `lms`;

-- ---------------------------------------------------------------------------
-- 1. TEACHER ACTIVITY
-- ---------------------------------------------------------------------------

DROP TABLE IF EXISTS `teacher_activity`;
CREATE TABLE `teacher_activity` (
  `activity_id`   int(11)      NOT NULL AUTO_INCREMENT,
  `uuid`          char(36)     NOT NULL,
  `institution_id` int(11)     NOT NULL COMMENT 'Institution the teacher belongs to',
  `performed_by`  int(11)      NOT NULL COMMENT 'user_id of the teacher who performed the action',
  `activity_type` varchar(50)  NOT NULL COMMENT 'e.g. grade_added, assignment_created, attendance_marked, material_uploaded, login, logout',
  `description`   varchar(500) NOT NULL COMMENT 'Human-readable summary shown in the activity list',
  `entity_type`   varchar(50)  DEFAULT NULL COMMENT 'Type of resource affected: student, class, course, assignment, grade, etc.',
  `entity_id`     int(11)      DEFAULT NULL COMMENT 'Primary key of the affected entity (optional)',
  `meta`          varchar(255) DEFAULT NULL COMMENT 'Extra context: student name, class name, subject, etc.',
  `ip_address`    varchar(50)  DEFAULT NULL,
  `user_agent`    text         DEFAULT NULL,
  `severity`      enum('info','warning','critical') NOT NULL DEFAULT 'info',
  `created_at`    datetime     DEFAULT current_timestamp(),
  PRIMARY KEY (`activity_id`),
  UNIQUE KEY `uuid` (`uuid`),
  KEY `idx_ta_institution_id`  (`institution_id`),
  KEY `idx_ta_performed_by`    (`performed_by`),
  KEY `idx_ta_activity_type`   (`activity_type`),
  KEY `idx_ta_entity`          (`entity_type`, `entity_id`),
  KEY `idx_ta_severity`        (`severity`),
  KEY `idx_ta_created_at`      (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Tracks all meaningful actions performed by teachers';


-- ---------------------------------------------------------------------------
-- 2. STUDENT ACTIVITY
-- ---------------------------------------------------------------------------

DROP TABLE IF EXISTS `student_activity`;
CREATE TABLE `student_activity` (
  `activity_id`   int(11)      NOT NULL AUTO_INCREMENT,
  `uuid`          char(36)     NOT NULL,
  `institution_id` int(11)     NOT NULL COMMENT 'Institution the student belongs to',
  `performed_by`  int(11)      NOT NULL COMMENT 'user_id of the student who performed the action',
  `activity_type` varchar(50)  NOT NULL COMMENT 'e.g. assignment_submitted, material_viewed, grade_viewed, login, logout, attendance_checked',
  `description`   varchar(500) NOT NULL COMMENT 'Human-readable summary shown in the activity list',
  `entity_type`   varchar(50)  DEFAULT NULL COMMENT 'Type of resource affected: assignment, material, grade, course, etc.',
  `entity_id`     int(11)      DEFAULT NULL COMMENT 'Primary key of the affected entity (optional)',
  `meta`          varchar(255) DEFAULT NULL COMMENT 'Extra context: subject name, assignment title, score, etc.',
  `ip_address`    varchar(50)  DEFAULT NULL,
  `user_agent`    text         DEFAULT NULL,
  `severity`      enum('info','warning','critical') NOT NULL DEFAULT 'info',
  `created_at`    datetime     DEFAULT current_timestamp(),
  PRIMARY KEY (`activity_id`),
  UNIQUE KEY `uuid` (`uuid`),
  KEY `idx_sa_institution_id`  (`institution_id`),
  KEY `idx_sa_performed_by`    (`performed_by`),
  KEY `idx_sa_activity_type`   (`activity_type`),
  KEY `idx_sa_entity`          (`entity_type`, `entity_id`),
  KEY `idx_sa_severity`        (`severity`),
  KEY `idx_sa_created_at`      (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Tracks all meaningful actions performed by students';


-- ---------------------------------------------------------------------------
-- 3. PARENT ACTIVITY
-- ---------------------------------------------------------------------------

DROP TABLE IF EXISTS `parent_activity`;
CREATE TABLE `parent_activity` (
  `activity_id`   int(11)      NOT NULL AUTO_INCREMENT,
  `uuid`          char(36)     NOT NULL,
  `institution_id` int(11)     NOT NULL COMMENT 'Institution the parent belongs to (via their child)',
  `performed_by`  int(11)      NOT NULL COMMENT 'user_id of the parent who performed the action',
  `activity_type` varchar(50)  NOT NULL COMMENT 'e.g. grade_viewed, attendance_viewed, announcement_read, message_sent, login, logout',
  `description`   varchar(500) NOT NULL COMMENT 'Human-readable summary shown in the activity list',
  `entity_type`   varchar(50)  DEFAULT NULL COMMENT 'Type of resource affected: student, grade, attendance, announcement, etc.',
  `entity_id`     int(11)      DEFAULT NULL COMMENT 'Primary key of the affected entity (optional)',
  `meta`          varchar(255) DEFAULT NULL COMMENT 'Extra context: child name, subject, class, etc.',
  `ip_address`    varchar(50)  DEFAULT NULL,
  `user_agent`    text         DEFAULT NULL,
  `severity`      enum('info','warning','critical') NOT NULL DEFAULT 'info',
  `created_at`    datetime     DEFAULT current_timestamp(),
  PRIMARY KEY (`activity_id`),
  UNIQUE KEY `uuid` (`uuid`),
  KEY `idx_pa_institution_id`  (`institution_id`),
  KEY `idx_pa_performed_by`    (`performed_by`),
  KEY `idx_pa_activity_type`   (`activity_type`),
  KEY `idx_pa_entity`          (`entity_type`, `entity_id`),
  KEY `idx_pa_severity`        (`severity`),
  KEY `idx_pa_created_at`      (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Tracks all meaningful actions performed by parents';


-- ---------------------------------------------------------------------------
-- 4. AFTER INSERT TRIGGERS  — purge rows older than 90 days on every insert
--    These fire inline and act as a real-time safety net regardless of
--    whether the event scheduler is running.
-- ---------------------------------------------------------------------------

-- admin_activity
DROP TRIGGER IF EXISTS `trg_admin_activity_purge`;
DELIMITER $$
CREATE TRIGGER `trg_admin_activity_purge`
AFTER INSERT ON `admin_activity`
FOR EACH ROW
BEGIN
  DELETE FROM `admin_activity`
  WHERE `created_at` < (NOW() - INTERVAL 90 DAY);
END$$
DELIMITER ;

-- teacher_activity
DROP TRIGGER IF EXISTS `trg_teacher_activity_purge`;
DELIMITER $$
CREATE TRIGGER `trg_teacher_activity_purge`
AFTER INSERT ON `teacher_activity`
FOR EACH ROW
BEGIN
  DELETE FROM `teacher_activity`
  WHERE `created_at` < (NOW() - INTERVAL 90 DAY);
END$$
DELIMITER ;

-- student_activity
DROP TRIGGER IF EXISTS `trg_student_activity_purge`;
DELIMITER $$
CREATE TRIGGER `trg_student_activity_purge`
AFTER INSERT ON `student_activity`
FOR EACH ROW
BEGIN
  DELETE FROM `student_activity`
  WHERE `created_at` < (NOW() - INTERVAL 90 DAY);
END$$
DELIMITER ;

-- parent_activity
DROP TRIGGER IF EXISTS `trg_parent_activity_purge`;
DELIMITER $$
CREATE TRIGGER `trg_parent_activity_purge`
AFTER INSERT ON `parent_activity`
FOR EACH ROW
BEGIN
  DELETE FROM `parent_activity`
  WHERE `created_at` < (NOW() - INTERVAL 90 DAY);
END$$
DELIMITER ;


-- ---------------------------------------------------------------------------
-- 5. SCHEDULED EVENTS  — nightly sweep at 02:00, catches any gaps the
--    triggers may miss (e.g. bulk imports bypassing triggers, or rows
--    that predate trigger creation).
--    Requires: SET GLOBAL event_scheduler = ON;  (or my.ini: event_scheduler=ON)
-- ---------------------------------------------------------------------------

-- Enable the event scheduler for this session (DBA may need to make permanent)
SET GLOBAL event_scheduler = ON;

DROP EVENT IF EXISTS `evt_purge_activity_logs`;
DELIMITER $$
CREATE EVENT `evt_purge_activity_logs`
ON SCHEDULE EVERY 1 DAY
STARTS (CURRENT_DATE + INTERVAL 1 DAY + INTERVAL 2 HOUR)   -- first run: tomorrow at 02:00
ON COMPLETION PRESERVE
ENABLE
COMMENT 'Deletes activity log records older than 90 days from all *_activity tables'
DO
BEGIN
  DELETE FROM `admin_activity`   WHERE `created_at` < (NOW() - INTERVAL 90 DAY);
  DELETE FROM `teacher_activity` WHERE `created_at` < (NOW() - INTERVAL 90 DAY);
  DELETE FROM `student_activity` WHERE `created_at` < (NOW() - INTERVAL 90 DAY);
  DELETE FROM `parent_activity`  WHERE `created_at` < (NOW() - INTERVAL 90 DAY);
END$$
DELIMITER ;
