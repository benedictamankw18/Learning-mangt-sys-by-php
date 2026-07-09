<?php
/**
 * Migration: Add semester_id column and FK to assessments table
 * Run: php migrations/add_semester_id_to_assessments.php
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

    echo "Running migration: add semester_id to assessments...\n";

    $hasColumnStmt = $pdo->query("SHOW COLUMNS FROM assessments LIKE 'semester_id'");
    $hasColumn = (bool) $hasColumnStmt->fetch(PDO::FETCH_ASSOC);

    if (!$hasColumn) {
        $pdo->exec("ALTER TABLE assessments ADD COLUMN semester_id INT(11) NULL AFTER academic_year_id");
        echo "Added column semester_id.\n";
    } else {
        echo "Column semester_id already exists.\n";
    }

    $indexExistsStmt = $pdo->prepare("SHOW INDEX FROM assessments WHERE Key_name = :key_name");
    $indexExistsStmt->execute(['key_name' => 'idx_semester_id']);
    $hasIndex = (bool) $indexExistsStmt->fetch(PDO::FETCH_ASSOC);

    if (!$hasIndex) {
        $pdo->exec("ALTER TABLE assessments ADD INDEX idx_semester_id (semester_id)");
        echo "Added index idx_semester_id.\n";
    } else {
        echo "Index idx_semester_id already exists.\n";
    }

    $fkExistsStmt = $pdo->prepare("SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'assessments' AND CONSTRAINT_TYPE = 'FOREIGN KEY' AND CONSTRAINT_NAME = :constraint_name");
    $fkExistsStmt->execute(['constraint_name' => 'fk_assessments_semester_id']);
    $hasFk = (bool) $fkExistsStmt->fetch(PDO::FETCH_ASSOC);

    if (!$hasFk) {
        $pdo->exec("ALTER TABLE assessments ADD CONSTRAINT fk_assessments_semester_id FOREIGN KEY (semester_id) REFERENCES semesters (semester_id) ON DELETE SET NULL ON UPDATE CASCADE");
        echo "Added foreign key fk_assessments_semester_id.\n";
    } else {
        echo "Foreign key fk_assessments_semester_id already exists.\n";
    }

    echo "Migration completed successfully.\n";
    exit(0);
} catch (Throwable $e) {
    echo "Migration failed: " . $e->getMessage() . "\n";
    exit(1);
}