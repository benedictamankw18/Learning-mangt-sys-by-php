<?php

namespace App\Config;

use PDO;
use PDOException;
use Exception;

class Database
{
    private static $instance = null;
    private $connection;

    private function __construct()
    {
        try {
            $host = $_ENV['DB_HOST'];
            $dbname = $_ENV['DB_NAME'];
            $user = $_ENV['DB_USER'];
            $pass = $_ENV['DB_PASS'];
            $port = $_ENV['DB_PORT'] ?? 3306;

            $dsn = "mysql:host={$host};port={$port};dbname={$dbname};charset=utf8mb4";

            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci"
            ];

            $this->connection = new PDO($dsn, $user, $pass, $options);
            $this->runMigrations();
        } catch (PDOException $e) {
            error_log("Database Connection Error: " . $e->getMessage());
            throw new Exception("Database connection failed");
        }
    }

    /**
     * Safe, idempotent schema additions (run once per connection, silently ignored if already applied).
     */
    private function runMigrations(): void
    {
        $migrations = [
            // Add profile photo URL storage to users table
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_photo VARCHAR(500) DEFAULT NULL",
            // Drop any recursive trigger on admin_activity (error 1442 fix)
            "DROP TRIGGER IF EXISTS after_admin_activity_insert",
            "DROP TRIGGER IF EXISTS before_admin_activity_insert",
            "DROP TRIGGER IF EXISTS after_admin_activity_update",
            "DROP TRIGGER IF EXISTS before_admin_activity_update",
        ];
        foreach ($migrations as $sql) {
            try {
                $this->connection->exec($sql);
            } catch (PDOException $e) {
                // Column already exists or DB version doesn't support IF NOT EXISTS — safe to ignore
                error_log("Migration skipped: " . $e->getMessage());
            }
        }

        // Drop ALL triggers on admin_activity dynamically (error 1442: recursive trigger)
        try {
            $stmt = $this->connection->query(
                "SELECT TRIGGER_NAME FROM information_schema.TRIGGERS
                 WHERE EVENT_OBJECT_TABLE = 'admin_activity'
                   AND TRIGGER_SCHEMA = DATABASE()"
            );
            foreach ($stmt->fetchAll(PDO::FETCH_COLUMN) as $triggerName) {
                $this->connection->exec("DROP TRIGGER IF EXISTS `" . str_replace('`', '', $triggerName) . "`");
                error_log("Dropped recursive trigger on admin_activity: {$triggerName}");
            }
        } catch (PDOException $e) {
            error_log("Trigger cleanup skipped: " . $e->getMessage());
        }
    }

    public static function getInstance(): Database
    {
        if (self::$instance === null) {
            self::$instance = new Database();
        }
        return self::$instance;
    }

    public function getConnection(): PDO
    {
        return $this->connection;
    }

    private function __clone()
    {
    }

    public function __wakeup()
    {
        throw new Exception("Cannot unserialize singleton");
    }
}
