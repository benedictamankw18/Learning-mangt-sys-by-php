-- ========================================
-- Migration: Create subscription_plans table
-- Version: 002
-- Date: 2026-03-15
-- Description: Move hardcoded subscription plans into database table
-- ========================================
USE lms;

CREATE TABLE
    IF NOT EXISTS subscription_plans (
        plan_id INT AUTO_INCREMENT PRIMARY KEY,
        plan_name VARCHAR(100) NOT NULL,
        amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
        currency VARCHAR(10) NOT NULL DEFAULT 'GHS',
        duration_months INT NOT NULL DEFAULT 12,
        max_students INT NOT NULL DEFAULT 0,
        max_teachers INT NOT NULL DEFAULT 0,
        features_json JSON NULL,
        is_active TINYINT (1) NOT NULL DEFAULT 1,
        sort_order INT NOT NULL DEFAULT 0,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uq_subscription_plans_name (plan_name),
        KEY idx_subscription_plans_active_sort (is_active, sort_order)
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

INSERT INTO
    subscription_plans (
        plan_name,
        amount,
        currency,
        duration_months,
        max_students,
        max_teachers,
        features_json,
        is_active,
        sort_order
    )
VALUES
    (
        'Basic',
        5000.00,
        'GHS',
        12,
        500,
        50,
        JSON_ARRAY (
            'Student Management',
            'Teacher Management',
            'Attendance Tracking',
            'Grade Management',
            'Reports',
            'Parent Portal'
        ),
        1,
        10
    ),
    (
        'Standard',
        10000.00,
        'GHS',
        12,
        1000,
        100,
        JSON_ARRAY (
            'All Basic Features',
            'Advanced Analytics',
            'SMS Notifications',
            'Email Integration',
            'Timetable Management',
            'Library Management'
        ),
        1,
        20
    ),
    (
        'Premium',
        20000.00,
        'GHS',
        12,
        5000,
        500,
        JSON_ARRAY (
            'All Standard Features',
            'Unlimited Students/Teachers',
            'API Access',
            'Custom Branding',
            'Priority Support',
            'Mobile App Access',
            'Advanced Security'
        ),
        1,
        30
    ) ON DUPLICATE KEY
UPDATE amount =
VALUES
    (amount),
    currency =
VALUES
    (currency),
    duration_months =
VALUES
    (duration_months),
    max_students =
VALUES
    (max_students),
    max_teachers =
VALUES
    (max_teachers),
    features_json =
VALUES
    (features_json),
    is_active =
VALUES
    (is_active),
    sort_order =
VALUES
    (sort_order);

-- Optional migration tracking entry
-- INSERT INTO schema_migrations (version, description, applied_by, notes)
-- VALUES ('002', 'Create subscription_plans table', 'admin', 'Seeded Basic/Standard/Premium plans');