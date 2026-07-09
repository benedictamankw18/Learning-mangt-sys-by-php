<?php

require_once __DIR__ . '/../vendor/autoload.php';

// Load .env
$dotenv = Dotenv\Dotenv::createUnsafeMutable(__DIR__ . '/..');
$dotenv->load();

use App\Config\Database;

class AddInstitutionIdToNotifications
{
    public function up(): void
    {
        $db = Database::getInstance()->getConnection();
        
        $table = 'notifications';
        
        // Check if the column already exists
        $stmt = $db->query("
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = '$table' AND COLUMN_NAME = 'institution_id'
        ");
        
        if ($stmt->rowCount() > 0) {
            echo "Column 'institution_id' already exists in '$table' table.\n";
            return;
        }
        
        // Add institution_id column
        $db->exec("
            ALTER TABLE $table
            ADD COLUMN institution_id INT NOT NULL DEFAULT 1 AFTER uuid,
            ADD CONSTRAINT fk_notifications_institution_id 
                FOREIGN KEY (institution_id) REFERENCES institutions(institution_id) ON DELETE CASCADE,
            ADD INDEX idx_institution_id (institution_id)
        ");
        
        echo "Migration completed successfully.\n";
    }
    
    public function down(): void
    {
        $db = Database::getInstance()->getConnection();
        $db->exec("ALTER TABLE notifications DROP FOREIGN KEY fk_notifications_institution_id");
        $db->exec("ALTER TABLE notifications DROP COLUMN institution_id");
        echo "Rollback completed successfully.\n";
    }
}

$migration = new AddInstitutionIdToNotifications();
$migration->up();
