<?php
require_once __DIR__ . '/../vendor/autoload.php';

use Dotenv\Dotenv;

$dotenv = Dotenv::createImmutable(__DIR__ . '/../');
$dotenv->safeLoad();

$host = $_ENV['DB_HOST'] ?? 'localhost';
$dbname = $_ENV['DB_NAME'] ?? 'lms';
$user = $_ENV['DB_USER'] ?? 'root';
$pass = $_ENV['DB_PASS'] ?? '';
$port = $_ENV['DB_PORT'] ?? 3306;

$pdo = new PDO("mysql:host={$host};port={$port};dbname={$dbname};charset=utf8mb4", $user, $pass);

// Update last 3 schedules to run now
$pdo->exec('UPDATE report_schedules SET next_run_at = NOW() ORDER BY schedule_id DESC LIMIT 3');

$rows = $pdo->query('SELECT schedule_id, schedule_name, next_run_at, is_active FROM report_schedules ORDER BY schedule_id DESC LIMIT 3')->fetchAll(PDO::FETCH_ASSOC);

echo "Updated schedules:\n";
foreach ($rows as $r) {
    echo "  [" . $r['schedule_id'] . "] " . $r['schedule_name'] . " - Run at: " . $r['next_run_at'] . " - Active: " . ($r['is_active'] ? 'Yes' : 'No') . "\n";
}
