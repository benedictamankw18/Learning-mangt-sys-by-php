<?php
/**
 * Migration: Backfill notification links
 *
 * Purpose: Populate notifications.link for existing rows where link is NULL/empty,
 * using role-based defaults that match dashboard destinations.
 *
 * Created: 2026-05-07
 */

namespace App\Migrations;

use App\Config\Database;

class BackfillNotificationLinks
{
    public static function up(): void
    {
        $db = Database::getInstance()->getConnection();

        $sql = "
            UPDATE notifications
            SET link = CASE
                WHEN LOWER(COALESCE(target_role, '')) = 'admin' THEN '/admin/dashboard.html#notifications'
                WHEN LOWER(COALESCE(target_role, '')) = 'teacher' THEN '/teacher/dashboard.html#notifications'
                WHEN LOWER(COALESCE(target_role, '')) = 'student' THEN '/student/dashboard.html#notifications'
                WHEN LOWER(COALESCE(target_role, '')) = 'parent' THEN '/parent/dashboard.html#notifications'
                WHEN LOWER(COALESCE(target_role, '')) IN ('super_admin', 'superadmin') THEN '/superadmin/dashboard.html#notifications'
                ELSE '/dashboard.html#notifications'
            END
            WHERE link IS NULL OR TRIM(link) = ''
        ";

        $db->exec($sql);
        echo "Migration completed: backfilled notifications.link for NULL/empty values\n";
    }

    public static function down(): void
    {
        $db = Database::getInstance()->getConnection();

        $sql = "
            UPDATE notifications
            SET link = NULL
            WHERE link IN (
                '/admin/dashboard.html#notifications',
                '/teacher/dashboard.html#notifications',
                '/student/dashboard.html#notifications',
                '/parent/dashboard.html#notifications',
                '/superadmin/dashboard.html#notifications',
                '/dashboard.html#notifications'
            )
        ";

        $db->exec($sql);
        echo "Migration rolled back: reset backfilled notification links to NULL\n";
    }
}
