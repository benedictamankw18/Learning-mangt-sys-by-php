<?php
/**
 * Migration: Add institution_id to announcements
 * Purpose: Enable multi-tenant isolation - users can only see announcements from their institution
 * Run: php migrations/add_institution_id_to_announcements.php
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

    echo "Running migration: add institution_id to announcements...\n";

    // Check if column already exists
    $result = $pdo->query("SHOW COLUMNS FROM announcements WHERE Field = 'institution_id'");
    if ($result && $result->rowCount() > 0) {
        echo "✓ Column 'institution_id' already exists. Skipping migration.\n";
        exit(0);
    }

    // 1. Add institution_id column (after author_id, default to 1 for existing rows)
    echo "  → Adding institution_id column...\n";
    $pdo->exec("
        ALTER TABLE announcements 
        ADD COLUMN institution_id INT NOT NULL DEFAULT 1 
        AFTER author_id
    ");
    echo "  ✓ Column added\n";

    // 2. Add index for institution_id (for query performance)
    echo "  → Adding index on institution_id...\n";
    $pdo->exec("
        ALTER TABLE announcements 
        ADD INDEX idx_institution_id (institution_id)
    ");
    echo "  ✓ Index added\n";

    // 3. Add foreign key constraint (optional but ensures data integrity)
    echo "  → Adding foreign key constraint...\n";
    $pdo->exec("
        ALTER TABLE announcements 
        ADD CONSTRAINT fk_announcements_institution_id 
        FOREIGN KEY (institution_id) 
        REFERENCES institutions(institution_id)
    ");
    echo "  ✓ Foreign key added\n";

    echo "\n✅ Migration completed successfully!\n";
    echo "All existing announcements have institution_id = 1\n";

} catch (PDOException $e) {
    echo "❌ Migration failed: " . $e->getMessage() . "\n";
    exit(1);
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    exit(1);
}
