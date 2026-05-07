<?php
$file = 'lms-api/src/Controllers/TeacherAssessmentController.php';
$lines = file($file);

// Find the line before "Get assessment categories"
$insertAfterLine = null;
foreach ($lines as $idx => $line) {
    if (strpos($line, 'Get assessment categories') !== false) {
        $insertAfterLine = $idx - 2;  // Insert before the comment block
        // Show lines around it
        for ($i = max(0, $idx - 3); $i <= min(count($lines) - 1, $idx + 5); $i++) {
            echo ($i + 1) . ': ' . $lines[$i];
        }
        break;
    }
}

if ($insertAfterLine !== null) {
    echo "\nInserting after line " . ($insertAfterLine + 1) . "\n";
}
?>
