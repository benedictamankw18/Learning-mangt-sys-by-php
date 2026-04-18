<?php
require_once __DIR__ . '/../vendor/autoload.php';

use Dotenv\Dotenv;

$dotenv = Dotenv::createImmutable(__DIR__ . '/..');
$dotenv->safeLoad();

$pdo = new PDO('mysql:host=localhost;dbname=lms;charset=utf8mb4', 'root', '');

echo "\n=== SAMPLE SCHEDULES ===\n";
$schedules = $pdo->query('SELECT schedule_id, schedule_name, report_type, frequency, is_active, last_run_at, next_run_at FROM report_schedules ORDER BY schedule_id DESC LIMIT 3')->fetchAll(PDO::FETCH_ASSOC);

foreach ($schedules as $row) {
    echo "\n[Schedule " . $row['schedule_id'] . "] " . $row['schedule_name'] . "\n";
    echo "  Type: " . $row['report_type'] . "\n";
    echo "  Frequency: " . $row['frequency'] . "\n";
    echo "  Active: " . ($row['is_active'] ? 'Yes' : 'No') . "\n";
    echo "  Last Run: " . ($row['last_run_at'] ?: 'Never') . "\n";
    echo "  Next Run: " . $row['next_run_at'] . "\n";
}

echo "\n=== RECENT RUN LOGS ===\n";
$runs = $pdo->query('SELECT schedule_id, run_at, status, message FROM report_schedule_runs ORDER BY run_id DESC LIMIT 5')->fetchAll(PDO::FETCH_ASSOC);

foreach ($runs as $row) {
    echo "[Schedule " . $row['schedule_id'] . "] " . $row['run_at'] . " - " . $row['status'];
    if ($row['message']) {
        echo " (" . substr($row['message'], 0, 60) . ")";
    }
    echo "\n";
}

echo "\n";
