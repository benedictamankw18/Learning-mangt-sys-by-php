<?php
/**
 * Migration: Add class_id column and FK to grade_reports table
 * Run: php migrations/add_class_id_to_grade_reports.php
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

    echo "Running migration: add class_id to grade_reports...\n";

    $hasColumnStmt = $pdo->query("SHOW COLUMNS FROM grade_reports LIKE 'class_id'");
    $hasColumn = (bool) $hasColumnStmt->fetch(PDO::FETCH_ASSOC);

    if (!$hasColumn) {
        $pdo->exec("ALTER TABLE grade_reports ADD COLUMN class_id INT(11) NULL AFTER student_id");
        echo "Added column class_id.\n";
    } else {
        echo "Column class_id already exists.\n";
    }

    $indexExistsStmt = $pdo->prepare("SHOW INDEX FROM grade_reports WHERE Key_name = :key_name");
    $indexExistsStmt->execute(['key_name' => 'idx_grade_reports_class_id']);
    $hasIndex = (bool) $indexExistsStmt->fetch(PDO::FETCH_ASSOC);

    if (!$hasIndex) {
        $pdo->exec("ALTER TABLE grade_reports ADD INDEX idx_grade_reports_class_id (class_id)");
        echo "Added index idx_grade_reports_class_id.\n";
    } else {
        echo "Index idx_grade_reports_class_id already exists.\n";
    }

    $fkExistsStmt = $pdo->prepare("SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'grade_reports' AND CONSTRAINT_TYPE = 'FOREIGN KEY' AND CONSTRAINT_NAME = :constraint_name");
    $fkExistsStmt->execute(['constraint_name' => 'fk_grade_reports_class_id']);
    $hasFk = (bool) $fkExistsStmt->fetch(PDO::FETCH_ASSOC);

    if (!$hasFk) {
        // Use ON DELETE SET NULL to avoid cascading deletes from classes
        $pdo->exec("ALTER TABLE grade_reports ADD CONSTRAINT fk_grade_reports_class_id FOREIGN KEY (class_id) REFERENCES classes (class_id) ON DELETE SET NULL ON UPDATE CASCADE");
        echo "Added foreign key fk_grade_reports_class_id.\n";
    } else {
        echo "Foreign key fk_grade_reports_class_id already exists.\n";
    }

    // Backfill existing grade_reports.class_id from students.class_id when possible
    $hasStudentClassStmt = $pdo->query("SHOW COLUMNS FROM students LIKE 'class_id'");
    $hasStudentClass = (bool) $hasStudentClassStmt->fetch(PDO::FETCH_ASSOC);
    if ($hasStudentClass) {
        $updateSql = "UPDATE grade_reports gr JOIN students s ON gr.student_id = s.student_id SET gr.class_id = s.class_id WHERE gr.class_id IS NULL AND s.class_id IS NOT NULL";
        $affected = $pdo->exec($updateSql);
        echo "Backfilled class_id for {$affected} grade_reports rows.\n";
    } else {
        echo "students.class_id column not found; skipping backfill.\n";
    }

    echo "Migration completed successfully.\n";
    exit(0);
} catch (Throwable $e) {
    echo "Migration failed: " . $e->getMessage() . "\n";
    exit(1);
}
