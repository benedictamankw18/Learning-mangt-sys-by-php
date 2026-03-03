-- Migration: create system_settings table
-- Run this on your MySQL server to add the table used by SystemController

CREATE TABLE IF NOT EXISTS system_settings (
    settings_id INT AUTO_INCREMENT PRIMARY KEY,
    settings JSON NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert an initial empty settings row
INSERT INTO system_settings (settings) VALUES ('{}');
