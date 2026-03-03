-- ========================================
-- Schema Migrations Tracking Table
-- ========================================
-- This table tracks which migrations have been applied to the database
-- Best practice for managing database schema changes over time

CREATE TABLE IF NOT EXISTS `schema_migrations` (
  `version` VARCHAR(50) NOT NULL PRIMARY KEY,
  `description` VARCHAR(255) NOT NULL,
  `applied_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `applied_by` VARCHAR(100) DEFAULT 'admin',
  `execution_time_ms` INT DEFAULT NULL,
  `success` TINYINT(1) DEFAULT 1,
  `notes` TEXT DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create index for quick lookups
CREATE INDEX `idx_applied_at` ON `schema_migrations`(`applied_at`);

-- ========================================
-- Record Initial State
-- ========================================

-- Record the base schema
INSERT INTO `schema_migrations` (`version`, `description`, `applied_by`, `notes`) 
VALUES ('000', 'Initial database schema', 'system', 'Base schema from lms (1).sql');

-- ========================================
-- Usage
-- ========================================

-- After running a migration, record it:
-- INSERT INTO schema_migrations (version, description, execution_time_ms, notes) 
-- VALUES ('001', 'Add UUIDs for security', 1500, 'Added UUID columns to 13 tables');

-- Check which migrations have been applied:
-- SELECT * FROM schema_migrations ORDER BY version;

-- Check if specific migration exists:
-- SELECT COUNT(*) FROM schema_migrations WHERE version = '001';
