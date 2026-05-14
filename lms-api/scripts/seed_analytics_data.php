<?php
/**
 * Seed Analytics Data Script
 * 
 * This script populates the LMS database with sample assignments and submissions
 * to make the teacher analytics dashboard display meaningful data.
 * 
 * Usage: php seed_analytics_data.php
 */

require_once __DIR__ . '/../config/database.php';

try {
    $db = \App\Config\Database::getInstance()->getConnection();
    
    echo "\n=================================================\n";
    echo "Seeding Analytics Data\n";
    echo "=================================================\n\n";
    
    // Read the SQL seed file
    $sqlFile = __DIR__ . '/seed_analytics_data.sql';
    if (!file_exists($sqlFile)) {
        throw new Exception("Seed SQL file not found: $sqlFile");
    }
    
    $sql = file_get_contents($sqlFile);
    
    // Execute the seed script
    echo "Executing seed script...\n";
    $db->exec($sql);
    echo "✓ Seed script executed successfully\n\n";
    
    // Verify the results
    echo "Verifying data creation...\n";
    
    // Count assignments
    $stmt = $db->query("SELECT COUNT(*) as count FROM assignments WHERE status = 'active'");
    $result = $stmt->fetch(\PDO::FETCH_ASSOC);
    echo "✓ Active assignments: " . $result['count'] . "\n";
    
    // Count submissions
    $stmt = $db->query("SELECT COUNT(*) as count FROM assignment_submissions");
    $result = $stmt->fetch(\PDO::FETCH_ASSOC);
    echo "✓ Total submissions: " . $result['count'] . "\n";
    
    // Average score stats
    $stmt = $db->query("
        SELECT 
            AVG(asub.score) as avg_score,
            MIN(asub.score) as min_score,
            MAX(asub.score) as max_score
        FROM assignment_submissions asub
        WHERE asub.score IS NOT NULL
    ");
    $result = $stmt->fetch(\PDO::FETCH_ASSOC);
    echo "✓ Average score: " . round($result['avg_score'], 2) . " / 100\n";
    echo "  Min: " . $result['min_score'] . " | Max: " . $result['max_score'] . "\n";
    
    // Course performance
    $stmt = $db->query("
        SELECT 
            cs.course_id,
            s.subject_name,
            c.class_name,
            COUNT(DISTINCT a.assignment_id) as assignment_count,
            COUNT(DISTINCT asub.submission_id) as submission_count,
            ROUND(AVG(asub.score), 1) as avg_score
        FROM class_subjects cs
        INNER JOIN subjects s ON cs.subject_id = s.subject_id
        INNER JOIN classes c ON cs.class_id = c.class_id
        LEFT JOIN assignments a ON a.course_id = cs.course_id AND a.status = 'active'
        LEFT JOIN assignment_submissions asub ON asub.assignment_id = a.assignment_id
        WHERE cs.status = 'active'
        GROUP BY cs.course_id
        ORDER BY avg_score DESC
        LIMIT 5
    ");
    $courses = $stmt->fetchAll(\PDO::FETCH_ASSOC);
    
    echo "\n✓ Top 5 courses by performance:\n";
    foreach ($courses as $course) {
        echo sprintf(
            "  %s - %s (%d assignments, %d submissions, avg: %.1f%%)\n",
            $course['subject_name'],
            $course['class_name'],
            $course['assignment_count'],
            $course['submission_count'],
            $course['avg_score'] ?? 0
        );
    }
    
    echo "\n=================================================\n";
    echo "✓ Analytics data seeded successfully!\n";
    echo "=================================================\n";
    echo "\nRefresh the teacher analytics page to see updated data.\n\n";
    
} catch (Exception $e) {
    echo "✗ Error: " . $e->getMessage() . "\n";
    exit(1);
}
