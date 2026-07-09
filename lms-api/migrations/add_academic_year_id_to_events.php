<?php
/**
 * Migration: Add academic_year_id column to events table
 * Run this with: php migrations/add_academic_year_id_to_events.php
 */

require_once __DIR__ . '/../vendor/autoload.php';

$envFile = __DIR__ . '/../.env';
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos($line, '=') && !strpos($line, '#')) {
            [$key, $value] = explode('=', $line, 2);
            $_ENV[trim($key)] = trim($value);
        }
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

    echo "🔄 Running migration: Add academic_year_id to events table...\n";

    // Check if column already exists
    $stmt = $pdo->prepare("SHOW COLUMNS FROM events LIKE 'academic_year_id'");
    $stmt->execute();
    if ($stmt->fetch()) {
        echo "✅ Column academic_year_id already exists on events. Skipping migration.\n";
        exit(0);
    }

    // Add the column
    echo "  → Adding column academic_year_id to events...\n";
    $pdo->exec("ALTER TABLE events ADD COLUMN academic_year_id INT(11) NULL AFTER institution_id");

    // Add index
    echo "  → Adding index idx_events_academic_year_id...\n";
    $pdo->exec("ALTER TABLE events ADD INDEX idx_events_academic_year_id (academic_year_id)");

    // Add foreign key
    echo "  → Adding foreign key constraint fk_events_academic_year_id...\n";
    $pdo->exec("ALTER TABLE events ADD CONSTRAINT fk_events_academic_year_id FOREIGN KEY (academic_year_id) REFERENCES academic_years (academic_year_id) ON DELETE SET NULL ON UPDATE CASCADE");

    echo "✅ Migration completed successfully!\n";
    exit(0);

} catch (PDOException $e) {
    echo "❌ Migration failed: " . $e->getMessage() . "\n";
    exit(1);
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    exit(1);
}
