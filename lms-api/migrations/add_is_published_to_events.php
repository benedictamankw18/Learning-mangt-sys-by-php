<?php
/**
 * Migration: Add is_published column to events table
 * Run this with: php migrations/add_is_published_to_events.php
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

    echo "🔄 Running migration: Add is_published to events table...\n";

    $stmt = $pdo->prepare("SHOW COLUMNS FROM events LIKE 'is_published'");
    $stmt->execute();
    if ($stmt->fetch()) {
        echo "✅ Column is_published already exists on events. Skipping migration.\n";
        exit(0);
    }

    echo "  → Adding column is_published to events...\n";
    $pdo->exec("ALTER TABLE events ADD COLUMN is_published TINYINT(1) NOT NULL DEFAULT 0 AFTER end_date");

    echo "  → Adding index idx_events_is_published...\n";
    $pdo->exec("ALTER TABLE events ADD INDEX idx_events_is_published (is_published)");

    echo "✅ Migration completed successfully!\n";
    exit(0);

} catch (PDOException $e) {
    echo "❌ Migration failed: " . $e->getMessage() . "\n";
    exit(1);
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    exit(1);
}
