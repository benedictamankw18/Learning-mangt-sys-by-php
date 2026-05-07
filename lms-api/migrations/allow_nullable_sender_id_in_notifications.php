<?php
/**
 * Migration: Allow nullable sender_id in notifications table
 * 
 * Purpose: Enable broadcast notifications (Institution, Academic Year, Semester, Event)
 * that aren't tied to a specific user sender. These are system-wide notifications.
 * 
 * Created: 2026-05-07
 */

namespace App\Migrations;

use App\Config\Database;
use PDO;

class AllowNullableSenderIdInNotifications
{
    public static function up(): void
    {
        $db = Database::getInstance()->getConnection();
        
        try {
            // Drop the foreign key constraint first
            $db->exec("ALTER TABLE notifications DROP CONSTRAINT FK_notifications_sender");
            
            // Modify the column to allow NULL
            $db->exec("ALTER TABLE notifications MODIFY COLUMN sender_id INT NULL");
            
            // Re-add the foreign key constraint (now allowing NULL)
            $db->exec("ALTER TABLE notifications ADD CONSTRAINT FK_notifications_sender 
                       FOREIGN KEY (sender_id) REFERENCES users(user_id) ON DELETE SET NULL");
            
            echo "Migration completed: sender_id now allows NULL values\n";
        } catch (\PDOException $e) {
            echo "Migration error: " . $e->getMessage() . "\n";
            throw $e;
        }
    }
    
    public static function down(): void
    {
        $db = Database::getInstance()->getConnection();
        
        try {
            // Revert to NOT NULL
            $db->exec("ALTER TABLE notifications DROP CONSTRAINT FK_notifications_sender");
            $db->exec("ALTER TABLE notifications MODIFY COLUMN sender_id INT NOT NULL DEFAULT 0");
            $db->exec("ALTER TABLE notifications ADD CONSTRAINT FK_notifications_sender 
                       FOREIGN KEY (sender_id) REFERENCES users(user_id) ON DELETE CASCADE");
            
            echo "Migration rolled back: sender_id reverted to NOT NULL\n";
        } catch (\PDOException $e) {
            echo "Rollback error: " . $e->getMessage() . "\n";
            throw $e;
        }
    }
}
