-- Course materials schema fix: explicit permission and download tracking
-- Run this against existing databases that already have course_materials table.
ALTER TABLE course_materials
ADD COLUMN access_permission ENUM ('view', 'download') NOT NULL DEFAULT 'download' AFTER status,
ADD COLUMN download_count INT (11) NOT NULL DEFAULT 0 AFTER access_permission,
ADD KEY idx_access_permission (access_permission);

-- Optional data backfill from legacy tags convention (permission:view)
UPDATE course_materials
SET
    access_permission = 'view'
WHERE
    tags IS NOT NULL
    AND LOWER(tags) LIKE '%permission:view%';




-- Add backend download analytics so counts are institution-wide and accurate across devices.    