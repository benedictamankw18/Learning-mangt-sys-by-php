<?php
/**
 * Cross-platform loop scheduler for report worker.
 *
 * Usage:
 *   php scripts/report_schedule_loop.php
 *
 * Optional env vars:
 *   REPORT_SCHEDULER_LOOP_INTERVAL_SECONDS=60
 */

require_once __DIR__ . '/../vendor/autoload.php';

use Dotenv\Dotenv;

$dotenv = Dotenv::createImmutable(__DIR__ . '/../');
$dotenv->safeLoad();

date_default_timezone_set($_ENV['APP_TIMEZONE'] ?? 'UTC');

$interval = (int) ($_ENV['REPORT_SCHEDULER_LOOP_INTERVAL_SECONDS'] ?? 60);
if ($interval < 15) {
    $interval = 15;
}

$worker = realpath(__DIR__ . '/report_schedule_worker.php');
if (!$worker || !is_file($worker)) {
    fwrite(STDERR, "Worker script not found\n");
    exit(1);
}

$phpBinary = defined('PHP_BINARY') && PHP_BINARY ? PHP_BINARY : 'php';

echo '[' . date('Y-m-d H:i:s') . "] Report scheduler loop started (interval {$interval}s)\n";

while (true) {
    $startedAt = microtime(true);
    $cmd = escapeshellarg($phpBinary) . ' ' . escapeshellarg($worker);

    passthru($cmd, $exitCode);

    if ($exitCode !== 0) {
        echo '[' . date('Y-m-d H:i:s') . "] Worker exited with code {$exitCode}\n";
    }

    $elapsed = (int) floor(microtime(true) - $startedAt);
    $sleepFor = max(1, $interval - $elapsed);
    sleep($sleepFor);
}
