<?php
/**
 * Seed sample report schedules for testing
 * Run: php seed_sample_schedules.php
 */

require_once __DIR__ . '/../vendor/autoload.php';

use Dotenv\Dotenv;

$dotenv = Dotenv::createImmutable(__DIR__ . '/../');
$dotenv->safeLoad();

date_default_timezone_set($_ENV['APP_TIMEZONE'] ?? 'UTC');

try {
    $host = $_ENV['DB_HOST'] ?? 'localhost';
    $dbname = $_ENV['DB_NAME'] ?? 'lms';
    $user = $_ENV['DB_USER'] ?? 'root';
    $pass = $_ENV['DB_PASS'] ?? '';
    $port = $_ENV['DB_PORT'] ?? 3306;

    $pdo = new PDO("mysql:host={$host};port={$port};dbname={$dbname};charset=utf8mb4", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    echo "Seeding sample report schedules...\n";

    // Get first user with valid institution
    $userStmt = $pdo->query("SELECT user_id, institution_id FROM users WHERE is_active = 1 AND institution_id IS NOT NULL ORDER BY user_id LIMIT 1");
    $user = $userStmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        // Fallback: use institution_id 1, user_id 1 (should exist)
        $userId = 1;
        $institutionId = 1;
    } else {
        $userId = (int) $user['user_id'];
        $institutionId = (int) $user['institution_id'];
    }

    $samples = [
        [
            'schedule_name' => 'Weekly Class Reports',
            'report_type' => 'class',
            'frequency' => 'weekly',
            'recipient_email' => 'benedictamankwa9@gmail.com',
            'next_run_at' => date('Y-m-d H:i:s', strtotime('+1 hour')),
        ],
        [
            'schedule_name' => 'Monthly Program Summary',
            'report_type' => 'program',
            'frequency' => 'monthly',
            'recipient_email' => 'benedictamankwa9@gmail.com',
            'next_run_at' => date('Y-m-d H:i:s', strtotime('+30 minutes')),
        ],
        [
            'schedule_name' => 'Semester Attendance Report',
            'report_type' => 'attendance',
            'frequency' => 'term_end',
            'recipient_email' => 'benedictamankwa9@gmail.com',
            'next_run_at' => date('Y-m-d H:i:s', strtotime('+2 hours')),
        ],
    ];

    $stmt = $pdo->prepare(
        'INSERT INTO report_schedules (uuid, institution_id, created_by, schedule_name, report_type, frequency, recipient_email, is_active, next_run_at, created_at, updated_at)
         VALUES (UUID(), :institution_id, :created_by, :schedule_name, :report_type, :frequency, :recipient_email, 1, :next_run_at, NOW(), NOW())'
    );

    foreach ($samples as $sample) {
        $stmt->execute([
            ':institution_id' => $institutionId,
            ':created_by' => $userId,
            ':schedule_name' => $sample['schedule_name'],
            ':report_type' => $sample['report_type'],
            ':frequency' => $sample['frequency'],
            ':recipient_email' => $sample['recipient_email'],
            ':next_run_at' => $sample['next_run_at'],
        ]);

        echo "✓ Added: {$sample['schedule_name']}\n";
    }

    echo "\nSample schedules created successfully.\n";
    echo "Next run times are staggered for testing.\n";
    exit(0);
} catch (Throwable $e) {
    echo "Seed failed: " . $e->getMessage() . "\n";
    exit(1);
}