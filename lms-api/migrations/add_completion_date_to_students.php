<?php
/**
 * Migration: Add completion_date column to students table
 * Run: php migrations/add_completion_date_to_students.php
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

    echo "Running migration: add completion_date to students...\n";

    $hasColumnStmt = $pdo->query("SHOW COLUMNS FROM students LIKE 'completion_date'");
    $hasColumn = (bool) $hasColumnStmt->fetch(PDO::FETCH_ASSOC);

    if (!$hasColumn) {
        $pdo->exec("ALTER TABLE students ADD COLUMN completion_date DATETIME NULL AFTER status");
        echo "Added column completion_date.\n";
    } else {
        echo "Column completion_date already exists.\n";
    }

    $backfillSql = "UPDATE students SET completion_date = COALESCE(completion_date, updated_at) WHERE LOWER(COALESCE(status, '')) = 'completed' AND completion_date IS NULL";
    $affected = $pdo->exec($backfillSql);
    echo "Backfilled completion_date for {$affected} completed students.\n";

    echo "Migration completed successfully.\n";
    exit(0);
} catch (Throwable $e) {
    echo "Migration failed: " . $e->getMessage() . "\n";
    exit(1);
}
