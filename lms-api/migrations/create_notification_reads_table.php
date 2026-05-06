<?php

require_once __DIR__ . '/../vendor/autoload.php';

// Load .env
$dotenv = Dotenv\Dotenv::createUnsafeMutable(__DIR__ . '/..');
$dotenv->load();

use App\Config\Database;
use App\Utils\UuidHelper;

class CreateNotificationReadsTable
{
    public function up(): void
    {
        $db = Database::getInstance()->getConnection();
        
        $table = 'notification_reads';
        
        // Check if the table already exists
        $stmt = $db->query("SHOW TABLES LIKE '$table'");
        
        if ($stmt->rowCount() > 0) {
            echo "Table '$table' already exists.\n";
            return;
        }
        
        // Create notification_reads table
        $db->exec("
            CREATE TABLE IF NOT EXISTS $table (
                notification_read_id INT AUTO_INCREMENT PRIMARY KEY,
                uuid CHAR(36) NOT NULL UNIQUE,
                notification_id INT NOT NULL,
                user_id INT NOT NULL,
                read_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT fk_notification_reads_notification_id 
                    FOREIGN KEY (notification_id) REFERENCES notifications(notification_id) ON DELETE CASCADE,
                CONSTRAINT fk_notification_reads_user_id 
                    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
                UNIQUE KEY uk_notification_user (notification_id, user_id),
                INDEX idx_user_id (user_id),
                INDEX idx_read_at (read_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");
        
        echo "Migration completed successfully.\n";
    }
    
    public function down(): void
    {
        $db = Database::getInstance()->getConnection();
        $db->exec("DROP TABLE IF EXISTS notification_reads");
        echo "Rollback completed successfully.\n";
    }
}

$migration = new CreateNotificationReadsTable();
$migration->up();
