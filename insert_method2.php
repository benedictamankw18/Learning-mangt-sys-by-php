<?php
$file = 'lms-api/src/Controllers/TeacherAssessmentController.php';
$content = file_get_contents($file);

// Check if the string exists
if (strpos($content, 'Get assessment categories') !== false) {
    echo '✓ Found string' . PHP_EOL;
    
    // Find position of the comment
    $pos = strpos($content, 'Get assessment categories');
    echo 'Position: ' . $pos . PHP_EOL;
    
    // Show context
    echo substr($content, $pos - 50, 150) . PHP_EOL;
} else {
    echo '✗ String not found' . PHP_EOL;
}

// Try simple string replacement
$methodCode = <<<'EOD'

    /**
     * Notify student and teacher when an assessment submission is created or edited
     */
    private function notifyAssessmentSubmissionEvent(
        int $institutionId,
        int $courseId,
        int $studentId,
        int $submittedByUserId,
        bool $isNew = false
    ): void {
        if ($institutionId <= 0 || $courseId <= 0 || $studentId <= 0) {
            return;
        }

        try {
            $classSubjectRepo = new \App\Repositories\ClassSubjectRepository();
            $course = $classSubjectRepo->findById($courseId);
            if (!$course) {
                return;
            }

            $studentRepo = new \App\Repositories\StudentRepository();
            $student = $studentRepo->findById($studentId);
            if (!$student) {
                return;
            }

            $studentUserId = (int) ($student['user_id'] ?? 0);
            if ($studentUserId <= 0) {
                return;
            }

            $courseName = $classSubjectRepo->getNameById($courseId) ?: 'the class subject';
            $studentName = trim((string) (($student['first_name'] ?? '') . ' ' . ($student['last_name'] ?? '')));
            $eventType = $isNew ? 'created' : 'updated';
            $title = "Assessment Score " . ucfirst($eventType);
            $studentMessage = "Your assessment score for {$courseName} has been {$eventType}.";

            // Notify student
            $this->notificationRepo->create([
                'sender_id' => $submittedByUserId > 0 ? $submittedByUserId : null,
                'user_id' => $studentUserId,
                'target_role' => 'student',
                'course_id' => $courseId,
                'title' => $title,
                'message' => $studentMessage,
                'notification_type' => 'assessment_submission_' . $eventType,
                'link' => '/student/dashboard.html#assessments',
            ]);

            // Notify teacher
            $teacherId = (int) ($course['teacher_id'] ?? 0);
            if ($teacherId > 0) {
                $teacher = $this->teacherRepo->findById($teacherId);
                $teacherUserId = (int) ($teacher['user_id'] ?? 0);
                if ($teacherUserId > 0) {
                    $teacherMessage = "Assessment score for {$studentName} in {$courseName} has been {$eventType}.";
                    $this->notificationRepo->create([
                        'sender_id' => $submittedByUserId > 0 ? $submittedByUserId : null,
                        'user_id' => $teacherUserId,
                        'target_role' => 'teacher',
                        'course_id' => $courseId,
                        'title' => $title,
                        'message' => $teacherMessage,
                        'notification_type' => 'assessment_submission_' . $eventType . '_teacher',
                        'link' => '/teacher/dashboard.html#assessments',
                    ]);
                }
            }
        } catch (\Throwable $e) {
            error_log('TeacherAssessmentController::notifyAssessmentSubmissionEvent ' . $e->getMessage());
        }
    }
EOD;

// Find marker line
$findMarker = "    /**\n     * Get assessment categories for the teacher's institution\n     * GET /teacher/assessment-categories\n     */\n    public function getCategories(array \$user): void";
$replaceMarker = $methodCode . "\n\n    /**\n     * Get assessment categories for the teacher's institution\n     * GET /teacher/assessment-categories\n     */\n    public function getCategories(array \$user): void";

if (strpos($content, $findMarker) !== false) {
    echo "✓ Found exact marker\n";
    $newContent = str_replace($findMarker, $replaceMarker, $content);
    file_put_contents($file, $newContent);
    echo "✓ File updated\n";
    exec('php -l "' . $file . '" 2>&1', $output);
    echo implode("\n", $output) . "\n";
} else {
    echo "✗ Exact marker not found\n";
}
?>
