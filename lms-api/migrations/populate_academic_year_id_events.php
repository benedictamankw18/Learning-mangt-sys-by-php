<?php
/**
 * Migration: Populate academic_year_id for existing events
 * Run this with: php migrations/populate_academic_year_id_events.php
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

    echo "🔄 Running migration: Populate academic_year_id for existing events...\n";

    // Get current academic year
    $stmt = $pdo->prepare("SELECT academic_year_id FROM academic_years WHERE is_current = 1 LIMIT 1");
    $stmt->execute();
    $result = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$result) {
        echo "❌ No current academic year found. Please set up a current academic year first.\n";
        exit(1);
    }

    $currentYearId = $result['academic_year_id'];
    echo "  → Current academic year ID: {$currentYearId}\n";

    // Update events where academic_year_id is NULL
    $updateStmt = $pdo->prepare("UPDATE events SET academic_year_id = :year_id WHERE academic_year_id IS NULL OR academic_year_id = 0");
    $updateStmt->execute(['year_id' => $currentYearId]);
    $rowsUpdated = $updateStmt->rowCount();

    echo "  → Updated {$rowsUpdated} event row(s) with current academic year.\n";
    echo "✅ Migration completed successfully!\n";
    exit(0);

} catch (PDOException $e) {
    echo "❌ Migration failed: " . $e->getMessage() . "\n";
    exit(1);
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    exit(1);
}
