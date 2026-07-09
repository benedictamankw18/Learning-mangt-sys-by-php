<?php
/**
 * Migration: Fix after_submission_graded trigger sender_id FK issue
 * Run: php migrations/fix_after_submission_graded_trigger_sender_id.php
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

    echo "Running migration: fix after_submission_graded trigger sender_id...\n";

    $pdo->exec('DROP TRIGGER IF EXISTS after_submission_graded');

    $triggerSql = <<<SQL
CREATE TRIGGER after_submission_graded
AFTER UPDATE ON assessment_submissions
FOR EACH ROW
BEGIN
    DECLARE student_user_id INT;
    DECLARE sender_user_id INT;
    DECLARE assessment_title VARCHAR(200);

    IF NEW.graded_at IS NOT NULL AND OLD.graded_at IS NULL THEN
        SELECT user_id INTO student_user_id
          FROM students
         WHERE student_id = NEW.student_id;

        SELECT title INTO assessment_title
          FROM assessments
         WHERE assessment_id = NEW.assessment_id;

        SELECT t.user_id INTO sender_user_id
          FROM assessments a
          INNER JOIN class_subjects cs ON cs.course_id = a.course_id
          INNER JOIN teachers t ON t.teacher_id = cs.teacher_id
         WHERE a.assessment_id = NEW.assessment_id
         LIMIT 1;

        IF sender_user_id IS NULL THEN
            SET sender_user_id = student_user_id;
        END IF;

        INSERT INTO notifications (uuid, sender_id, user_id, title, message, notification_type)
        VALUES (
            UUID(),
            sender_user_id,
            student_user_id,
            'Assessment Graded',
            CONCAT('Your submission for "', assessment_title, '" has been graded. Score: ', NEW.score),
            'grading'
        );
    END IF;
END
SQL;

    $pdo->exec($triggerSql);

    echo "Trigger recreated successfully.\n";
    echo "Migration completed successfully.\n";
    exit(0);
} catch (Throwable $e) {
    echo "Migration failed: " . $e->getMessage() . "\n";
    exit(1);
}
