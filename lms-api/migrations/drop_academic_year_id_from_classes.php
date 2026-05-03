<?php
/**
 * Migration: Drop academic_year_id column from classes table
 * Run: php migrations/drop_academic_year_id_from_classes.php
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

    echo "Running migration: drop academic_year_id from classes...\n";

    // Check if column exists
    $hasColumnStmt = $pdo->query("SHOW COLUMNS FROM classes LIKE 'academic_year_id'");
    $hasColumn = (bool) $hasColumnStmt->fetch(PDO::FETCH_ASSOC);

    if ($hasColumn) {
        // Drop foreign key if exists
        $fkCheck = $pdo->prepare("SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'classes' AND COLUMN_NAME = 'academic_year_id' AND CONSTRAINT_NAME IS NOT NULL");
        $fkCheck->execute();
        $fk = $fkCheck->fetch(PDO::FETCH_ASSOC);
        if ($fk && !empty($fk['CONSTRAINT_NAME'])) {
            $constraint = $fk['CONSTRAINT_NAME'];
            try {
                $pdo->exec("ALTER TABLE classes DROP FOREIGN KEY `{$constraint}`");
                echo "Dropped foreign key {$constraint}.\n";
            } catch (Throwable $e) {
                echo "Failed to drop foreign key {$constraint}: " . $e->getMessage() . "\n";
            }
        }

        // Drop index if exists
        try {
            $pdo->exec("ALTER TABLE classes DROP INDEX idx_classes_academic_year_id");
            echo "Dropped index idx_classes_academic_year_id.\n";
        } catch (Throwable $e) {
            // ignore if doesn't exist
        }

        // Finally drop column
        $pdo->exec("ALTER TABLE classes DROP COLUMN academic_year_id");
        echo "Dropped column academic_year_id from classes.\n";
    } else {
        echo "Column academic_year_id does not exist on classes.\n";
    }

    echo "Migration completed.\n";
    exit(0);
} catch (Throwable $e) {
    echo "Migration failed: " . $e->getMessage() . "\n";
    exit(1);
}
