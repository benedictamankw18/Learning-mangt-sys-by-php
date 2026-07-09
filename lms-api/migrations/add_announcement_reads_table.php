<?php
/**
 * Migration: Create announcement_reads table
 * Purpose: Track which users have viewed each announcement
 * Run: php migrations/add_announcement_reads_table.php
 */

require_once __DIR__ . '/../vendor/autoload.php';

$envFile = __DIR__ . '/../.env';
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        $trimmed = trim($line);
        if ($trimmed === '' || strpos($trimmed, '#') === 0 || strpos($trimmed, '=') === false) {
            continue;
        }

        [$key, $value] = explode('=', $trimmed, 2);
        $key = trim($key);
        $value = trim($value);

        if ($value !== '' && ($value[0] === '"' || $value[0] === "'")) {
            $quote = $value[0];
            $endPos = strrpos($value, $quote);
            if ($endPos !== false && $endPos > 0) {
                $value = substr($value, 1, $endPos - 1);
            }
        } else {
            $hashPos = strpos($value, '#');
            if ($hashPos !== false) {
                $value = rtrim(substr($value, 0, $hashPos));
            }
        }

        $_ENV[$key] = $value;
    }
}

try {
    $host = $_ENV['DB_HOST'] ?? 'localhost';
    $dbname = $_ENV['DB_NAME'] ?? 'lms';
    $user = $_ENV['DB_USER'] ?? 'root';
    $pass = $_ENV['DB_PASS'] ?? '';
    $port = $_ENV['DB_PORT'] ?? 3306;

    $pdo = new PDO("mysql:host={$host};port={$port};dbname={$dbname};charset=utf8mb4", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    echo "Running migration: create announcement_reads table...\n";

    $exists = $pdo->query("SHOW TABLES LIKE 'announcement_reads'")->fetchColumn();
    if ($exists) {
        echo "✓ Table 'announcement_reads' already exists. Skipping migration.\n";
        exit(0);
    }

    $pdo->exec("
        CREATE TABLE announcement_reads (
            announcement_read_id INT NOT NULL AUTO_INCREMENT,
            uuid CHAR(36) NOT NULL,
            announcement_id INT NOT NULL,
            user_id INT NOT NULL,
            read_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (announcement_read_id),
            UNIQUE KEY uq_announcement_reads_uuid (uuid),
            UNIQUE KEY uq_announcement_reads_announcement_user (announcement_id, user_id),
            KEY idx_announcement_reads_announcement_id (announcement_id),
            KEY idx_announcement_reads_user_id (user_id),
            CONSTRAINT fk_announcement_reads_announcement_id
                FOREIGN KEY (announcement_id) REFERENCES announcements (announcement_id)
                ON DELETE CASCADE,
            CONSTRAINT fk_announcement_reads_user_id
                FOREIGN KEY (user_id) REFERENCES users (user_id)
                ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");

    echo "Migration completed successfully.\n";
    exit(0);
} catch (Throwable $e) {
    echo "Migration failed: " . $e->getMessage() . "\n";
    exit(1);
}