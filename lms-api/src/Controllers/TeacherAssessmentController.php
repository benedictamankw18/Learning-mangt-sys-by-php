<?php

namespace App\Controllers;

use App\Config\Database;
use App\Middleware\RoleMiddleware;
use App\Repositories\AssessmentCategoryRepository;
use App\Repositories\NotificationRepository;
use App\Repositories\TeacherRepository;
use App\Utils\Response;
use PDO;

class TeacherAssessmentController
{
    private PDO $db;
    private AssessmentCategoryRepository $categoryRepo;
    private NotificationRepository $notificationRepo;
    private TeacherRepository $teacherRepo;

    public function __construct()
    {
        $this->db = Database::getInstance()->getConnection();
        $this->categoryRepo = new AssessmentCategoryRepository();
        $this->notificationRepo = new NotificationRepository();
        $this->teacherRepo = new TeacherRepository();
    }

    /**
     * Notify all active admins in this institution when assessments are submitted for approval.
     */
    private function notifyAdminsForApprovalSubmission(
        int $institutionId,
        int $courseId,
        int $submittedByUserId,
        int $processedCount,
        int $studentsCount
    ): void {
        if ($institutionId <= 0 || $submittedByUserId <= 0 || $processedCount <= 0) {
            return;
        }

        try {
            $stmtAdmins = $this->db->prepare(
                "SELECT DISTINCT a.user_id
                 FROM admins a
                 WHERE a.institution_id = :institution_id
                   AND a.user_id IS NOT NULL
                   AND LOWER(COALESCE(a.status, 'active')) = 'active'"
            );
            $stmtAdmins->execute(['institution_id' => $institutionId]);
            $adminUserIds = array_values(array_unique(array_map('intval', $stmtAdmins->fetchAll(PDO::FETCH_COLUMN))));

            if (!$adminUserIds) {
                return;
            }

            $title = 'Teacher submitted assessments for approval';
            $message = "A teacher submitted {$processedCount} assessment score(s) for approval";
            if ($studentsCount > 0) {
                $message .= " across {$studentsCount} student(s)";
            }
            if ($courseId > 0) {
                $message .= " for class subject ID {$courseId}";
            }
            $message .= '.';

            foreach ($adminUserIds as $adminUserId) {
                if ($adminUserId <= 0) {
                    continue;
                }

                $this->notificationRepo->create([
                    'sender_id' => $submittedByUserId,
                    'user_id' => $adminUserId,
                    'target_role' => 'admin',
                    'course_id' => $courseId > 0 ? $courseId : null,
                    'title' => $title,
                    'message' => $message,
                    'notification_type' => 'assessment_approval_submission',
                    'link' => '/admin/dashboard.html#grades',
                ]);
            }
        } catch (\Throwable $e) {
            error_log('TeacherAssessmentController::notifyAdminsForApprovalSubmission ' . $e->getMessage());
        }
    }

    /**
     * Get assessment categories for the teacher's institution
     * GET /teacher/assessment-categories
     */
    public function getCategories(array $user): void
    {
        try {
            if (!$this->requireTeacherRole($user)) {
                return;
            }

            $institutionId = $this->getInstitutionId($user);
            if ($institutionId <= 0) {
                Response::error('Institution context required', 400);
            }

            $categories = $this->categoryRepo->getAll($institutionId, 1, 200);
            Response::success([
                'categories' => $categories,
                'count' => count($categories),
            ]);
        } catch (\Throwable $e) {
            error_log('TeacherAssessmentController::getCategories ' . $e->getMessage());
            Response::serverError('Failed to fetch assessment categories');
        }
    }

    /**
     * Get teacher's classes and subjects
     * GET /teacher/classes-subjects
     */
    public function getClassesSubjects(array $user): void
    {
        try {
            if (!$this->requireTeacherRole($user)) {
                return;
            }

            $institutionId = $this->getInstitutionId($user);
            $teacherId = $this->getTeacherId($user);

            if ($institutionId <= 0 || $teacherId <= 0) {
                Response::error('Teacher context required', 400);
            }

            $stmt = $this->db->prepare(
                "SELECT
                    c.class_id,
                    c.class_name,
                    cs.course_id AS class_subject_id,
                    cs.subject_id,
                    s.subject_name
                FROM class_subjects cs
                INNER JOIN classes c ON cs.class_id = c.class_id
                INNER JOIN subjects s ON cs.subject_id = s.subject_id
                WHERE cs.institution_id = :institution_id
                  AND cs.teacher_id = :teacher_id
                  AND cs.status = 'active'
                ORDER BY c.class_name, s.subject_name"
            );
            $stmt->execute([
                'institution_id' => $institutionId,
                'teacher_id' => $teacherId,
            ]);

            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $grouped = [];
            foreach ($rows as $row) {
                $classId = (int) $row['class_id'];
                if (!isset($grouped[$classId])) {
                    $grouped[$classId] = [
                        'class_id' => $classId,
                        'class_name' => $row['class_name'],
                        'subjects' => [],
                    ];
                }

                $grouped[$classId]['subjects'][] = [
                    'subject_id' => (int) $row['subject_id'],
                    'subject_name' => $row['subject_name'],
                    'class_subject_id' => (int) $row['class_subject_id'],
                ];
            }

            Response::success([
                'classes_subjects' => array_values($grouped),
                'count' => count($grouped),
            ]);
        } catch (\Throwable $e) {
            error_log('TeacherAssessmentController::getClassesSubjects ' . $e->getMessage());
            Response::serverError('Failed to fetch classes and subjects');
        }
    }

    /**
     * Get students for a class (with optional filtering by subject)
     * GET /teacher/students
     * Query params: class_id, class_subject_id (optional)
     */
    public function getStudents(array $user): void
    {
        try {
            if (!$this->requireTeacherRole($user)) {
                return;
            }

            $institutionId = $this->getInstitutionId($user);
            $teacherId = $this->getTeacherId($user);

            if ($institutionId <= 0 || $teacherId <= 0) {
                Response::error('Teacher context required', 400);
            }

            $classId = isset($_GET['class_id']) ? (int) $_GET['class_id'] : 0;
            $courseId = $this->getCourseIdFromRequest();

            if ($classId <= 0 && $courseId <= 0) {
                Response::error('class_id or class_subject_id is required', 400);
            }

            if ($classId <= 0 && $courseId > 0) {
                $stmtClass = $this->db->prepare(
                    'SELECT class_id
                     FROM class_subjects
                     WHERE course_id = :course_id AND institution_id = :institution_id AND teacher_id = :teacher_id
                     LIMIT 1'
                );
                $stmtClass->execute([
                    'course_id' => $courseId,
                    'institution_id' => $institutionId,
                    'teacher_id' => $teacherId,
                ]);
                $classId = (int) $stmtClass->fetchColumn();
            }

            if ($classId <= 0) {
                Response::error('Unable to resolve class for selected subject', 400);
            }

            $stmt = $this->db->prepare(
                "SELECT
                    s.student_id,
                    s.student_id_number,
                    s.uuid AS student_uuid,
                    u.first_name,
                    u.last_name,
                    u.email
                 FROM students s
                 INNER JOIN users u ON s.user_id = u.user_id
                 WHERE s.institution_id = :institution_id
                   AND s.class_id = :class_id
                   AND LOWER(COALESCE(s.status, 'active')) = 'active'
                 ORDER BY u.first_name, u.last_name"
            );
            $stmt->execute([
                'institution_id' => $institutionId,
                'class_id' => $classId,
            ]);

            $students = $stmt->fetchAll(PDO::FETCH_ASSOC);
            Response::success([
                'students' => $students,
                'count' => count($students),
            ]);
        } catch (\Throwable $e) {
            error_log('TeacherAssessmentController::getStudents ' . $e->getMessage());
            Response::serverError('Failed to fetch students');
        }
    }

    /**
     * Get existing assessment scores
     * GET /teacher/assessments/existing
     * Query params: class_id, class_subject_id, category_id (optional)
     */
    public function getExistingAssessments(array $user): void
    {
        try {
            if (!$this->requireTeacherRole($user)) {
                return;
            }

            $institutionId = $this->getInstitutionId($user);
            $courseId = $this->getCourseIdFromRequest();

            if ($institutionId <= 0 || $courseId <= 0) {
                Response::error('class_subject_id and institution context are required', 400);
            }

            $categoryId = isset($_GET['category_id']) ? (int) $_GET['category_id'] : 0;

            $currentAcademicYearId = $this->getCurrentAcademicYearId();
            if ($currentAcademicYearId <= 0) {
                Response::error('No current academic year found', 400);
                return;
            }

            $currentSemesterId = $this->getCurrentSemesterId();
            if ($currentSemesterId <= 0) {
                Response::error('No current semester found', 400);
                return;
            }

            $sql =
                "SELECT
                    sub.submission_id AS score_id,
                    sub.student_id,
                    sub.score,
                    sub.status,
                    sub.graded_at,
                    a.assessment_id,
                    a.title AS assessment_name,
                    a.max_score,
                    a.category_id,
                    ac.category_name
                FROM assessments a
                INNER JOIN assessment_categories ac ON a.category_id = ac.category_id
                LEFT JOIN assessment_submissions sub ON sub.assessment_id = a.assessment_id
                WHERE a.course_id = :course_id
                  AND a.academic_year_id = :academic_year_id
                                    AND a.semester_id = :semester_id
                  AND a.assessment_type = 'teacher_mode'
                  AND ac.institution_id = :institution_id";

            $params = [
                'course_id' => $courseId,
                'academic_year_id' => $currentAcademicYearId,
                'semester_id' => $currentSemesterId,
                'institution_id' => $institutionId,
            ];

            if ($categoryId > 0) {
                $sql .= ' AND a.category_id = :category_id';
                $params['category_id'] = $categoryId;
            }

            $sql .= ' ORDER BY a.category_id, sub.student_id';

            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $grouped = [];
            foreach ($rows as $row) {
                $catId = (int) $row['category_id'];
                if (!isset($grouped[$catId])) {
                    $grouped[$catId] = [
                        'category_id' => $catId,
                        'category_name' => $row['category_name'],
                        'scores' => [],
                    ];
                }

                if ($row['student_id'] !== null) {
                    $grouped[$catId]['scores'][] = [
                        'score_id' => $row['score_id'] ? (int) $row['score_id'] : null,
                        'student_id' => (int) $row['student_id'],
                        'assessment_id' => (int) $row['assessment_id'],
                        'assessment_name' => $row['assessment_name'],
                        'score' => (float) $row['score'],
                        'max_score' => (float) $row['max_score'],
                        'graded_at' => $row['graded_at'],
                        'status' => $row['status'],
                    ];
                }
            }

            Response::success([
                'assessments' => array_values($grouped),
                'count' => count($grouped),
            ]);
        } catch (\Throwable $e) {
            error_log('TeacherAssessmentController::getExistingAssessments ' . $e->getMessage());
            Response::serverError('Failed to fetch existing assessments');
        }
    }

    /**
     * Get graded assignments and quizzes for auto-fill modal
     * GET /teacher/assignments-quizzes
     * Query params: class_subject_id, student_id (optional)
     */
    public function getAssignmentsAndQuizzes(array $user): void
    {
        try {
            if (!$this->requireTeacherRole($user)) {
                return;
            }

            $institutionId = $this->getInstitutionId($user);
            $courseId = $this->getCourseIdFromRequest();
            $studentId = isset($_GET['student_id']) ? (int) $_GET['student_id'] : 0;

            if ($institutionId <= 0 || $courseId <= 0) {
                Response::error('class_subject_id and institution context are required', 400);
            }

            $assignmentSql =
                "SELECT
                    'assignment' AS type,
                    a.assignment_id AS id,
                    a.title AS name,
                    a.description,
                    asub.student_id,
                    asub.score,
                    a.max_score,
                    asub.graded_at
                FROM assignments a
                INNER JOIN assignment_submissions asub ON asub.assignment_id = a.assignment_id
                INNER JOIN class_subjects cs ON cs.course_id = a.course_id
                WHERE a.course_id = :course_id
                  AND cs.institution_id = :institution_id
                  AND asub.score IS NOT NULL
                  AND asub.graded_at IS NOT NULL";

            $quizSql =
                "SELECT
                    'quiz' AS type,
                    q.quiz_id AS id,
                    q.title AS name,
                    q.description,
                    qbest.student_id,
                    qbest.score,
                    qbest.max_score,
                    qbest.graded_at
                FROM quizzes q
                INNER JOIN (
                    SELECT
                        qs.quiz_id,
                        qs.student_id,
                        MAX(qs.score) AS score,
                        COALESCE(MAX(qs.max_score), 100) AS max_score,
                        MAX(COALESCE(qs.graded_at, qs.submitted_at)) AS graded_at
                    FROM quiz_submissions qs
                    WHERE qs.score IS NOT NULL
                      AND qs.submitted_at IS NOT NULL
                    GROUP BY qs.quiz_id, qs.student_id
                ) qbest ON qbest.quiz_id = q.quiz_id
                INNER JOIN class_subjects cs ON cs.course_id = q.course_id
                WHERE q.course_id = :course_id
                  AND cs.institution_id = :institution_id";

            $params = [
                'course_id' => $courseId,
                'institution_id' => $institutionId,
            ];

            if ($studentId > 0) {
                $assignmentSql .= ' AND asub.student_id = :student_id';
                $quizSql .= ' AND qbest.student_id = :student_id';
                $params['student_id'] = $studentId;
            }

            $stmt = $this->db->prepare($assignmentSql);
            $stmt->execute($params);
            $assignments = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $stmt = $this->db->prepare($quizSql);
            $stmt->execute($params);
            $quizzes = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $items = array_merge($assignments, $quizzes);
            usort($items, static function (array $a, array $b): int {
                return strtotime((string) ($b['graded_at'] ?? '1970-01-01')) <=> strtotime((string) ($a['graded_at'] ?? '1970-01-01'));
            });

            Response::success([
                'items' => $items,
                'count' => count($items),
            ]);
        } catch (\Throwable $e) {
            error_log('TeacherAssessmentController::getAssignmentsAndQuizzes ' . $e->getMessage());
            Response::serverError('Failed to fetch graded items');
        }
    }

    /**
     * Save assessment scores (draft mode)
     * POST /teacher/assessments/save
     * Body: { assessments: [ { student_id, category_id, score, max_score } ] }
     */
    public function saveAssessments(array $user): void
    {
        $this->persistAssessments($user, 'draft');
    }

    /**
     * Publish assessment scores immediately
     * POST /teacher/assessments/publish
     * Body: { assessments: [ { student_id, category_id, score, max_score } ] }
     */
    public function publishAssessments(array $user): void
    {
        $this->persistAssessments($user, 'published');
    }

    /**
     * Submit assessment scores for admin approval
     * POST /teacher/assessments/submit-for-approval
     * Body: { assessments: [ { student_id, category_id, score, max_score } ] }
     */
    public function submitAssessmentsForApproval(array $user): void
    {
        $this->persistAssessments($user, 'pending_approval');
    }

        /**
         * Generate grade reports when grades are submitted for approval
         */
        private function generateGradeReportsFromAssessments(
            int $institutionId,
            int $courseId,
            array $studentIds,
            int $generatedByUserId
        ): array {
            $stats = [
                'students_considered' => 0,
                'reports_created' => 0,
                'reports_reused' => 0,
                'details_created' => 0,
                'details_updated' => 0,
                'details_skipped' => 0,
                'errors' => [],
            ];

            try {
                $currentAcademicYearId = $this->getCurrentAcademicYearId();
                $currentSemesterId = $this->getCurrentSemesterId();
                if ($currentAcademicYearId <= 0 || $currentSemesterId <= 0) {
                    $stats['errors'][] = 'Missing current academic year or semester';
                    return $stats;
                }

                foreach ($studentIds as $studentId) {
                    $stats['students_considered']++;

                    // Check if report already exists
                    $stmt = $this->db->prepare(
                        "SELECT gr.report_id
                         FROM grade_reports gr
                         WHERE gr.student_id = :student_id
                           AND gr.semester_id = :semester_id
                           AND gr.academic_year_id = :academic_year_id
                           AND gr.report_type = 'semester'
                         LIMIT 1"
                    );
                    $stmt->execute([
                        ':student_id' => $studentId,
                        ':semester_id' => $currentSemesterId,
                        ':academic_year_id' => $currentAcademicYearId,
                    ]);
                    $reportId = (int) $stmt->fetchColumn();

                    // If no existing report, create one
                    if ($reportId <= 0) {
                        $stmtInsert = $this->db->prepare(
                            "INSERT INTO grade_reports 
                            (
                                uuid,
                                institution_id,
                                student_id,
                                semester_id,
                                academic_year_id,
                                report_type,
                                Approved,
                                is_published,
                                principal_comment,
                                generated_at,
                                generated_by,
                                created_at
                            )
                            VALUES
                            (
                                UUID(),
                                :institution_id,
                                :student_id,
                                :semester_id,
                                :academic_year_id,
                                'semester',
                                0,
                                0,
                                NULL,
                                NOW(),
                                :generated_by,
                                NOW()
                            )"
                        );
                        $stmtInsert->execute([
                            ':institution_id' => $institutionId,
                            ':student_id' => $studentId,
                            ':semester_id' => $currentSemesterId,
                            ':academic_year_id' => $currentAcademicYearId,
                            ':generated_by' => $generatedByUserId > 0 ? $generatedByUserId : null,
                        ]);
                        $reportId = (int) $this->db->lastInsertId();
                        $stats['reports_created']++;
                    } else {
                        $stmtUpdateReport = $this->db->prepare(
                            "UPDATE grade_reports
                             SET generated_at = NOW(),
                                 generated_by = :generated_by,
                                 Approved = 0,
                                 is_published = 0,
                                 principal_comment = NULL,
                                 updated_at = NOW()
                             WHERE report_id = :report_id"
                        );
                        $stmtUpdateReport->execute([
                            ':generated_by' => $generatedByUserId > 0 ? $generatedByUserId : null,
                            ':report_id' => $reportId,
                        ]);
                        $stats['reports_reused']++;
                    }

                    $scores = $this->calculateWeightedGradeSummary($studentId, $courseId);

                    if ($scores && $scores['percentage'] !== null) {
                        $percentage = (float) $scores['percentage'];
                        $totalScore = (float) $scores['total_score'];

                        $detailUpsertStmt = $this->db->prepare(
                            "INSERT INTO grade_report_details
                            (report_id, course_id, total_score, percentage, created_at, updated_at)
                            VALUES (:report_id, :course_id, :total_score, :percentage, NOW(), NOW())
                            ON DUPLICATE KEY UPDATE
                                total_score = VALUES(total_score),
                                percentage = VALUES(percentage),
                                updated_at = NOW()"
                        );
                        $detailUpsertStmt->execute([
                            ':report_id' => $reportId,
                            ':course_id' => $courseId,
                            ':total_score' => round($totalScore, 2),
                            ':percentage' => round($percentage, 2),
                        ]);

                        // MySQL returns 1 for insert and 2 for update on ON DUPLICATE KEY UPDATE.
                        if ($detailUpsertStmt->rowCount() > 1) {
                            $stats['details_updated']++;
                        } else {
                            $stats['details_created']++;
                        }
                    } else {
                        $stats['details_skipped']++;
                    }
                }
            } catch (\Throwable $e) {
                error_log('TeacherAssessmentController::generateGradeReportsFromAssessments ' . $e->getMessage());
                $stats['errors'][] = $e->getMessage();
            }

            return $stats;
        }

    /**
     * Calculate report summary from published assessments.
     * total_score: raw sum of scores
     * percentage: weighted score (same formula as grading draft estimate)
     *
     * @return array{total_score: float, percentage: float|null}|null
     */
    private function calculateWeightedGradeSummary(int $studentId, int $courseId): ?array
    {
        $stmt = $this->db->prepare(
            "SELECT
                ass.score,
                a.max_score,
                ac.weight_percentage
             FROM assessment_submissions ass
             INNER JOIN assessments a ON a.assessment_id = ass.assessment_id
             INNER JOIN assessment_categories ac ON ac.category_id = a.category_id
             WHERE ass.student_id = :student_id
               AND a.course_id = :course_id
             AND ass.status IN ('published', 'pending_approval')"
        );
        $stmt->execute([
            ':student_id' => $studentId,
            ':course_id' => $courseId,
        ]);

        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        if (!$rows) {
            return null;
        }

        $rawTotalScore = 0.0;
        $weightedSum = 0.0;
        $enteredCount = 0;

        foreach ($rows as $row) {
            $score = isset($row['score']) ? (float) $row['score'] : null;
            $maxScore = isset($row['max_score']) ? (float) $row['max_score'] : 0.0;
            $weight = isset($row['weight_percentage']) ? (float) $row['weight_percentage'] : 0.0;

            if ($score === null || $maxScore <= 0) {
                continue;
            }

            $rawTotalScore += $score;
            $weightedSum += (($score / $maxScore) * $weight);
            $enteredCount++;
        }

        if ($enteredCount === 0) {
            return null;
        }

        return [
            'total_score' => round($rawTotalScore, 2),
            'percentage' => round($weightedSum, 2),
        ];
    }

    /**
     * Admin approval for teacher assessment scores.
     * POST /teacher/assessments/approve
     * Body: { class_subject_id, student_id? }
     */
    public function approveAssessments(array $user): void
    {
        try {
            $roleMiddleware = new RoleMiddleware($user);
            if (!$roleMiddleware->requireRole(['admin', 'super_admin'])) {
                return;
            }

            $institutionId = $this->getInstitutionId($user);
            if ($institutionId <= 0) {
                Response::error('Institution context required', 400);
            }

            $input = json_decode((string) file_get_contents('php://input'), true) ?: [];
            $courseId = isset($input['class_subject_id']) ? (int) $input['class_subject_id'] : (int) ($input['course_id'] ?? 0);
            $studentId = isset($input['student_id']) ? (int) $input['student_id'] : 0;

            if ($courseId <= 0) {
                Response::error('class_subject_id is required', 400);
            }

            $currentAcademicYearId = $this->getCurrentAcademicYearId();
            $currentSemesterId = $this->getCurrentSemesterId();
            if ($currentAcademicYearId <= 0 || $currentSemesterId <= 0) {
                Response::error('No current academic year/semester found', 400);
            }

            $stmtAssessments = $this->db->prepare(
                "SELECT a.assessment_id
                 FROM assessments a
                 INNER JOIN class_subjects cs ON cs.course_id = a.course_id
                 WHERE a.course_id = :course_id
                   AND a.academic_year_id = :academic_year_id
                   AND a.semester_id = :semester_id
                   AND a.assessment_type = 'teacher_mode'
                   AND cs.institution_id = :institution_id"
            );
            $stmtAssessments->execute([
                'course_id' => $courseId,
                'academic_year_id' => $currentAcademicYearId,
                'semester_id' => $currentSemesterId,
                'institution_id' => $institutionId,
            ]);

            $assessmentIds = array_map('intval', $stmtAssessments->fetchAll(PDO::FETCH_COLUMN));
            if (!$assessmentIds) {
                Response::error('No teacher assessments found for this course in current term', 404);
            }

            $this->db->beginTransaction();

            $placeholders = [];
            $params = [];
            foreach ($assessmentIds as $i => $assessmentId) {
                $key = 'a' . $i;
                $placeholders[] = ':' . $key;
                $params[$key] = $assessmentId;
            }

            $sqlSub =
                "UPDATE assessment_submissions
                 SET status = 'published',
                     graded_at = COALESCE(graded_at, NOW()),
                     updated_at = NOW()
                 WHERE assessment_id IN (" . implode(',', $placeholders) . ")
                   AND status IN ('pending_approval', 'pending_approval')";

            if ($studentId > 0) {
                $sqlSub .= ' AND student_id = :student_id';
                $params['student_id'] = $studentId;
            }

            $stmtPendingStudents = $this->db->prepare(
                "SELECT DISTINCT student_id
                 FROM assessment_submissions
                 WHERE assessment_id IN (" . implode(',', $placeholders) . ")
                   AND status IN ('pending_approval', 'pending_approval')"
                . ($studentId > 0 ? ' AND student_id = :student_id' : '')
            );
            $stmtPendingStudents->execute($params);
            $approvedStudentIds = array_values(array_unique(array_map('intval', $stmtPendingStudents->fetchAll(PDO::FETCH_COLUMN))));

            $stmtUpdateSub = $this->db->prepare($sqlSub);
            $stmtUpdateSub->execute($params);
            $approvedRows = $stmtUpdateSub->rowCount();

            $sqlAssess =
                "UPDATE assessments
                 SET is_published = 1,
                     updated_at = NOW()
                 WHERE assessment_id IN (" . implode(',', $placeholders) . ')';
            $stmtUpdateAssess = $this->db->prepare($sqlAssess);
            $stmtUpdateAssess->execute($params);
            $publishedAssessments = $stmtUpdateAssess->rowCount();

            $generatedByUserId = isset($user['user_id']) ? (int) $user['user_id'] : (isset($user['id']) ? (int) $user['id'] : 0);
            $gradeReportStats = [
                'students_considered' => 0,
                'reports_created' => 0,
                'reports_reused' => 0,
                'details_created' => 0,
                'details_updated' => 0,
                'details_skipped' => 0,
                'errors' => [],
            ];

            if ($approvedRows > 0 && $approvedStudentIds) {
                $gradeReportStats = $this->generateGradeReportsFromAssessments(
                    $institutionId,
                    $courseId,
                    $approvedStudentIds,
                    $generatedByUserId
                );
            }

            $this->db->commit();

            Response::success([
                'approved_submissions' => $approvedRows,
                'published_assessments' => $publishedAssessments,
                'course_id' => $courseId,
                'student_id' => $studentId > 0 ? $studentId : null,
                'grade_report_stats' => $gradeReportStats,
            ], 'Assessments approved and published');
        } catch (\Throwable $e) {
            if ($this->db->inTransaction()) {
                $this->db->rollBack();
            }
            error_log('TeacherAssessmentController::approveAssessments ' . $e->getMessage());
            Response::serverError('Failed to approve assessments');
        }
    }

    /**
     * Import assessment scores from parsed CSV rows.
     * POST /teacher/assessments/import
     * Body: { class_subject_id, rows: [ { student_name, student_id_number?, category_name, score, max_score } ], publish? }
     */
    public function importAssessments(array $user): void
    {
        try {
            if (!$this->requireTeacherRole($user)) {
                return;
            }

            $institutionId = $this->getInstitutionId($user);
            $teacherId = $this->getTeacherId($user);
            if ($institutionId <= 0 || $teacherId <= 0) {
                Response::error('Teacher context required', 400);
            }

            $input = json_decode((string) file_get_contents('php://input'), true) ?: [];
            $courseId = isset($input['class_subject_id']) ? (int) $input['class_subject_id'] : 0;
            $rows = $input['rows'] ?? [];
            $publish = !empty($input['publish']);

            if ($courseId <= 0) {
                Response::error('class_subject_id is required', 400);
            }
            if (!is_array($rows) || !$rows) {
                Response::error('rows array is required', 400);
            }
            if (!$this->teacherOwnsCourse($teacherId, $institutionId, $courseId)) {
                Response::error('course not assigned to this teacher', 403);
            }

            $studentMaps = $this->buildStudentLookupMaps($institutionId, $courseId, $teacherId);
            $nameToStudentId = $studentMaps['by_name'];
            $idNumberToStudentId = $studentMaps['by_id_number'];

            $categories = $this->categoryRepo->getAll($institutionId, 1, 500);
            $categoryNameToId = [];
            foreach ($categories as $category) {
                $normalized = $this->normalizeLookupValue((string) ($category['category_name'] ?? ''));
                if ($normalized !== '') {
                    $categoryNameToId[$normalized] = (int) $category['category_id'];
                }
            }

            $this->db->beginTransaction();
            $processed = 0;
            $errors = [];
            $processedStudentIds = [];
            $insertedRows = [];
            $notInsertedRows = [];

            foreach ($rows as $idx => $row) {
                $line = $idx + 2;
                $rawStudentName = trim((string) ($row['student_name'] ?? ''));
                $rawStudentIdNumber = trim((string) ($row['student_id_number'] ?? ''));
                $rawCategoryName = trim((string) ($row['category_name'] ?? ''));
                $studentName = $this->normalizeLookupValue($rawStudentName);
                $studentIdNumber = $this->normalizeLookupValue($rawStudentIdNumber);
                $categoryName = $this->normalizeLookupValue($rawCategoryName);
                $scoreRaw = $row['score'] ?? null;
                $maxScoreRaw = $row['max_score'] ?? null;

                $baseRow = [
                    'line' => $line,
                    'student_name' => $rawStudentName,
                    'student_id_number' => $rawStudentIdNumber,
                    'category_name' => $rawCategoryName,
                ];

                if (($studentName === '' && $studentIdNumber === '') || $categoryName === '' || $scoreRaw === null || $maxScoreRaw === null) {
                    $errorMessage = 'missing required fields (provide student_name or student_id_number, plus category_name, score, max_score)';
                    $errors[] = ['line' => $line, 'error' => $errorMessage];
                    $notInsertedRows[] = $baseRow + ['error' => $errorMessage];
                    continue;
                }

                $studentIdByIdNumber = 0;
                $studentIdByName = 0;
                if ($studentIdNumber !== '' && isset($idNumberToStudentId[$studentIdNumber])) {
                    $studentIdByIdNumber = (int) $idNumberToStudentId[$studentIdNumber];
                }
                if ($studentName !== '' && isset($nameToStudentId[$studentName])) {
                    $studentIdByName = (int) $nameToStudentId[$studentName];
                }

                if ($studentIdByIdNumber > 0 && $studentIdByName > 0 && $studentIdByIdNumber !== $studentIdByName) {
                    $errorMessage = 'student_name and student_id_number refer to different students';
                    $errors[] = ['line' => $line, 'error' => $errorMessage];
                    $notInsertedRows[] = $baseRow + ['error' => $errorMessage];
                    continue;
                }

                $studentId = $studentIdByIdNumber > 0 ? $studentIdByIdNumber : $studentIdByName;
                if ($studentId <= 0) {
                    $errorMessage = 'student_name or student_id_number not found in selected class';
                    $errors[] = ['line' => $line, 'error' => $errorMessage];
                    $notInsertedRows[] = $baseRow + ['error' => $errorMessage];
                    continue;
                }

                $categoryId = isset($categoryNameToId[$categoryName]) ? (int) $categoryNameToId[$categoryName] : 0;
                if ($categoryId <= 0) {
                    $errorMessage = 'category not found';
                    $errors[] = ['line' => $line, 'error' => $errorMessage];
                    $notInsertedRows[] = $baseRow + ['error' => $errorMessage];
                    continue;
                }

                $score = is_numeric($scoreRaw) ? (float) $scoreRaw : NAN;
                $maxScore = is_numeric($maxScoreRaw) ? (float) $maxScoreRaw : NAN;
                if (!is_finite($score) || !is_finite($maxScore) || $maxScore <= 0) {
                    $errorMessage = 'score and max_score must be valid numbers';
                    $errors[] = ['line' => $line, 'error' => $errorMessage];
                    $notInsertedRows[] = $baseRow + ['error' => $errorMessage];
                    continue;
                }
                if ($score < 0 || $score > $maxScore) {
                    $errorMessage = "score must be between 0 and {$maxScore}";
                    $errors[] = ['line' => $line, 'error' => $errorMessage];
                    $notInsertedRows[] = $baseRow + ['error' => $errorMessage];
                    continue;
                }
                if ($maxScore <= $score) {
                    $errorMessage = 'max_score must be greater than score';
                    $errors[] = ['line' => $line, 'error' => $errorMessage];
                    $notInsertedRows[] = $baseRow + ['error' => $errorMessage];
                    continue;
                }

                $importStatus = $publish ? 'pending_approval' : 'draft';
                if (!$this->saveScore($courseId, $studentId, $categoryId, $score, $maxScore, $importStatus)) {
                    $errorMessage = 'failed to persist score';
                    $errors[] = ['line' => $line, 'error' => $errorMessage];
                    $notInsertedRows[] = $baseRow + ['error' => $errorMessage];
                    continue;
                }

                $processed++;
                $insertedRows[] = $baseRow + [
                    'score' => $score,
                    'max_score' => $maxScore,
                ];
            }

            if ($processed === 0) {
                $this->db->rollBack();
                Response::error('Import failed', 400, [
                    'rows' => $errors,
                    'inserted_rows' => $insertedRows,
                    'not_inserted_rows' => $notInsertedRows,
                    'processed' => 0,
                    'failed' => count($notInsertedRows),
                    'total' => count($rows),
                ]);
            }

            $this->db->commit();
            Response::success([
                'processed' => $processed,
                'total' => count($rows),
                'failed' => count($errors),
                'errors' => $errors,
                'inserted_rows' => $insertedRows,
                'not_inserted_rows' => $notInsertedRows,
            ], $publish ? 'Assessment scores imported and published' : 'Assessment scores imported successfully');
        } catch (\Throwable $e) {
            if ($this->db->inTransaction()) {
                $this->db->rollBack();
            }
            error_log('TeacherAssessmentController::importAssessments ' . $e->getMessage());
            Response::serverError('Failed to import assessment scores');
        }
    }

    /**
     * Export currently scoped teacher assessments as CSV.
     * GET /teacher/assessments/export?class_subject_id=...&category_ids=1,2
     */
    public function exportAssessments(array $user): void
    {
        try {
            if (!$this->requireTeacherRole($user)) {
                return;
            }

            $institutionId = $this->getInstitutionId($user);
            $teacherId = $this->getTeacherId($user);
            $courseId = $this->getCourseIdFromRequest();
            $format = strtolower((string) ($_GET['format'] ?? 'csv'));

            if ($institutionId <= 0 || $teacherId <= 0 || $courseId <= 0) {
                Response::error('class_subject_id and teacher context are required', 400);
            }
            if (!$this->teacherOwnsCourse($teacherId, $institutionId, $courseId)) {
                Response::error('course not assigned to this teacher', 403);
            }
            if ($format !== 'csv') {
                Response::error('Only csv format is supported by API export endpoint', 400);
            }

            $currentAcademicYearId = $this->getCurrentAcademicYearId();
            $currentSemesterId = $this->getCurrentSemesterId();
            if ($currentAcademicYearId <= 0 || $currentSemesterId <= 0) {
                Response::error('Current academic year and semester are required', 400);
            }

            $categoryIds = [];
            $categoryCsv = trim((string) ($_GET['category_ids'] ?? ''));
            if ($categoryCsv !== '') {
                foreach (explode(',', $categoryCsv) as $rawId) {
                    $id = (int) trim($rawId);
                    if ($id > 0) {
                        $categoryIds[] = $id;
                    }
                }
            }
            if (!$categoryIds && isset($_GET['category_id'])) {
                $single = (int) $_GET['category_id'];
                if ($single > 0) {
                    $categoryIds[] = $single;
                }
            }

            $sql =
                "SELECT
                    u.first_name,
                    u.last_name,
                    s.student_id_number,
                    ac.category_name,
                    a.title AS assessment_name,
                    sub.score,
                    a.max_score,
                    sub.status,
                    sub.graded_at
                FROM assessments a
                INNER JOIN assessment_categories ac ON ac.category_id = a.category_id
                LEFT JOIN assessment_submissions sub ON sub.assessment_id = a.assessment_id
                LEFT JOIN students s ON s.student_id = sub.student_id
                LEFT JOIN users u ON u.user_id = s.user_id
                WHERE a.course_id = :course_id
                  AND a.academic_year_id = :academic_year_id
                  AND a.semester_id = :semester_id
                  AND a.assessment_type = 'teacher_mode'
                  AND ac.institution_id = :institution_id";

            $params = [
                'course_id' => $courseId,
                'academic_year_id' => $currentAcademicYearId,
                'semester_id' => $currentSemesterId,
                'institution_id' => $institutionId,
            ];

            if ($categoryIds) {
                $placeholders = [];
                foreach ($categoryIds as $i => $cid) {
                    $key = 'cid_' . $i;
                    $placeholders[] = ':' . $key;
                    $params[$key] = $cid;
                }
                $sql .= ' AND a.category_id IN (' . implode(',', $placeholders) . ')';
            }

            $sql .= ' ORDER BY u.first_name, u.last_name, ac.category_name';

            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $filename = 'teacher-assessments-' . date('Y-m-d-His') . '.csv';
            header('Content-Type: text/csv; charset=utf-8');
            header('Content-Disposition: attachment; filename=' . $filename);

            $out = fopen('php://output', 'w');
            fputcsv($out, ['student_name', 'student_id_number', 'category_name', 'assessment_name', 'score', 'max_score', 'status', 'graded_at']);

            foreach ($rows as $row) {
                $studentName = trim((string) (($row['first_name'] ?? '') . ' ' . ($row['last_name'] ?? '')));
                fputcsv($out, [
                    $studentName,
                    $row['student_id_number'] ?? '',
                    $row['category_name'] ?? '',
                    $row['assessment_name'] ?? '',
                    $row['score'] ?? '',
                    $row['max_score'] ?? '',
                    $row['status'] ?? '',
                    $row['graded_at'] ?? '',
                ]);
            }

            fclose($out);
            exit();
        } catch (\Throwable $e) {
            error_log('TeacherAssessmentController::exportAssessments ' . $e->getMessage());
            Response::serverError('Failed to export assessment scores');
        }
    }

    /**
     * Helper: Save a single assessment score
        * @param int $courseId
     * @param int $studentId
     * @param int $categoryId
     * @param float $score
     * @param float $maxScore
        * @param string $status
     */
    private function saveScore(
        int $courseId,
        int $studentId,
        int $categoryId,
        float $score,
        float $maxScore,
        string $status
    ): bool {
        $isPublished = $status === 'published' || $status === 'graded';
        $assessmentId = $this->ensureCategoryAssessment($courseId, $categoryId, $maxScore, $isPublished);
        if ($assessmentId <= 0) {
            return false;
        }

        $gradedAt = ($status === 'published' || $status === 'graded') ? date('Y-m-d H:i:s') : null;

        $stmtFind = $this->db->prepare(
            'SELECT submission_id, status
             FROM assessment_submissions
             WHERE assessment_id = :assessment_id AND student_id = :student_id
             ORDER BY submission_id DESC
             LIMIT 1'
        );
        $stmtFind->execute([
            'assessment_id' => $assessmentId,
            'student_id' => $studentId,
        ]);
        $existingSubmission = $stmtFind->fetch(PDO::FETCH_ASSOC) ?: null;
        $submissionId = (int) ($existingSubmission['submission_id'] ?? 0);
        $currentStatus = (string) ($existingSubmission['status'] ?? '');

        if ($submissionId > 0) {
            $stmtUpdate = $this->db->prepare(
                'UPDATE assessment_submissions
                 SET score = :score,
                     status = CASE
                         WHEN :status_for_published_check_1 = "published" AND status = "draft" THEN "published"
                         WHEN :status_for_published_check_2 = "published" THEN status
                         ELSE :status_for_else
                     END,
                     submitted_at = NOW(),
                     graded_at = CASE
                         WHEN :status_for_published_check_3 = "published" AND status = "draft" THEN :graded_at_for_publish
                         WHEN :status_for_published_check_4 = "published" THEN graded_at
                         ELSE :graded_at_for_else
                     END,
                     updated_at = NOW()
                 WHERE submission_id = :submission_id'
            );

            if ($status === 'published' && in_array($currentStatus, ['pending_approval', 'pending_approve'], true)) {
                // Preserve pending approval rows exactly as-is during teacher publish.
                return true;
            }

            return $stmtUpdate->execute([
                'score' => $score,
                'status_for_published_check_1' => $status,
                'status_for_published_check_2' => $status,
                'status_for_else' => $status,
                'status_for_published_check_3' => $status,
                'status_for_published_check_4' => $status,
                'graded_at_for_publish' => $gradedAt,
                'graded_at_for_else' => $gradedAt,
                'submission_id' => $submissionId,
            ]);
        }

        $stmtInsert = $this->db->prepare(
            'INSERT INTO assessment_submissions
             (assessment_id, student_id, submission_text, score, status, submitted_at, graded_at)
             VALUES
             (:assessment_id, :student_id, NULL, :score, :status, NOW(), :graded_at)'
        );

        return $stmtInsert->execute([
            'assessment_id' => $assessmentId,
            'student_id' => $studentId,
            'score' => $score,
            'status' => $status,
            'graded_at' => $gradedAt,
        ]);
    }

    /**
     * Persist assessment entries in draft, pending approval, or graded mode.
     */
    private function persistAssessments(array $user, string $mode): void
    {
        try {
            if (!$this->requireTeacherRole($user)) {
                return;
            }

            $institutionId = $this->getInstitutionId($user);
            $teacherId = $this->getTeacherId($user);
            if ($institutionId <= 0 || $teacherId <= 0) {
                Response::error('Teacher context required', 400);
            }

            $input = json_decode((string) file_get_contents('php://input'), true) ?: [];
            $assessments = $input['assessments'] ?? null;
            $courseIdFromBody = isset($input['class_subject_id']) ? (int) $input['class_subject_id'] : 0;
            $generatedByUserId = isset($user['user_id']) ? (int) $user['user_id'] : (isset($user['id']) ? (int) $user['id'] : 0);

            if (!is_array($assessments) || !$assessments) {
                Response::error('Assessments array required', 400);
            }

            $this->db->beginTransaction();
            $processed = 0;
            $errors = [];
            $processedStudentIds = [];

            $publishEligibility = [];
            if ($mode === 'published') {
                $submittedCategoriesByStudentCourse = [];
                $requiredCategoriesByCourse = [];

                foreach ($assessments as $assessment) {
                    $studentId = isset($assessment['student_id']) ? (int) $assessment['student_id'] : 0;
                    $categoryId = isset($assessment['category_id']) ? (int) $assessment['category_id'] : 0;
                    $courseId = isset($assessment['class_subject_id']) ? (int) $assessment['class_subject_id'] : $courseIdFromBody;

                    if ($studentId <= 0 || $categoryId <= 0 || $courseId <= 0) {
                        continue;
                    }

                    $key = $studentId . ':' . $courseId;
                    if (!isset($submittedCategoriesByStudentCourse[$key])) {
                        $submittedCategoriesByStudentCourse[$key] = [];
                    }
                    $submittedCategoriesByStudentCourse[$key][$categoryId] = true;

                    if (!isset($requiredCategoriesByCourse[$courseId])) {
                        $requiredCategoriesByCourse[$courseId] = $this->getRequiredTeacherModeCategoryIdsForCourse($courseId);
                    }
                }

                foreach ($submittedCategoriesByStudentCourse as $key => $submittedCategoryMap) {
                    [, $courseIdPart] = array_map('intval', explode(':', $key));
                    $required = $requiredCategoriesByCourse[$courseIdPart] ?? [];
                    $submitted = array_keys($submittedCategoryMap);
                    $missing = array_values(array_diff($required, $submitted));

                    if (!$required || !$missing) {
                        $publishEligibility[$key] = [
                            'allowed' => true,
                            'missing' => [],
                        ];
                        continue;
                    }

                    $publishEligibility[$key] = [
                        'allowed' => false,
                        'missing' => $missing,
                    ];
                }
            }

            foreach ($assessments as $idx => $assessment) {
                $studentId = isset($assessment['student_id']) ? (int) $assessment['student_id'] : 0;
                $categoryId = isset($assessment['category_id']) ? (int) $assessment['category_id'] : 0;
                $courseId = isset($assessment['class_subject_id']) ? (int) $assessment['class_subject_id'] : $courseIdFromBody;
                $score = isset($assessment['score']) ? (float) $assessment['score'] : null;
                $maxScore = isset($assessment['max_score']) ? (float) $assessment['max_score'] : 100.0;

                if ($studentId <= 0 || $categoryId <= 0 || $courseId <= 0 || $score === null) {
                    $errors[] = "Assessment {$idx}: missing required fields";
                    continue;
                }

                if ($maxScore <= 0) {
                    $errors[] = "Assessment {$idx}: max_score must be greater than 0";
                    continue;
                }

                if ($score < 0 || $score > $maxScore) {
                    $errors[] = "Assessment {$idx}: score must be between 0 and {$maxScore}";
                    continue;
                }

                if (!$this->teacherOwnsCourse($teacherId, $institutionId, $courseId)) {
                    $errors[] = "Assessment {$idx}: course not assigned to this teacher";
                    continue;
                }

                if ($mode === 'published') {
                    $eligibilityKey = $studentId . ':' . $courseId;
                    $eligibility = $publishEligibility[$eligibilityKey] ?? null;
                    if ($eligibility && !$eligibility['allowed']) {
                        $missingText = implode(',', $eligibility['missing']);
                        $errors[] = "Assessment {$idx}: student {$studentId} is missing category ids [{$missingText}]";
                        continue;
                    }
                }

                $targetStatus = 'draft';
                if ($mode === 'pending_approval' || $mode === 'pending_approval') {
                    $targetStatus = 'pending_approval';
                } elseif ($mode === 'published') {
                    $targetStatus = 'published';
                } elseif ($mode === 'graded') {
                    $targetStatus = 'graded';
                }

                if ($mode === 'pending_approval') {
                    $targetStatus = 'pending_approval';
                }

                if (!$this->saveScore($courseId, $studentId, $categoryId, $score, $maxScore, $targetStatus)) {
                    $errors[] = "Assessment {$idx}: failed to persist score";
                    continue;
                }

                $processed++;
                $processedStudentIds[] = $studentId;
            }

            if ($errors && $processed === 0) {
                $this->db->rollBack();
                Response::error('Validation failed', 400, ['errors' => $errors]);
            }

            $gradeReportStats = null;
            if ($mode === 'pending_approval' && $processed > 0) {
                $studentIds = array_values(array_unique(array_map('intval', $processedStudentIds)));
                $courseId = $courseIdFromBody > 0 ? $courseIdFromBody : (
                    is_array($assessments) && count($assessments) > 0
                        ? (int) ($assessments[0]['class_subject_id'] ?? 0)
                        : 0
                );
                if ($courseId > 0 && $studentIds) {
                    $gradeReportStats = $this->generateGradeReportsFromAssessments($institutionId, $courseId, $studentIds, $generatedByUserId);
                }
            }

            $this->db->commit();
            $message = 'Assessments saved successfully';
            if ($mode === 'pending_approval' || $mode === 'pending_approval') {
                $message = 'Assessments submitted for admin approval';
            } elseif ($mode === 'published') {
                $message = 'Assessments published successfully';
            } elseif ($mode === 'graded') {
                $message = 'Assessments graded successfully';
            }

            $responseData = [
                $mode => $processed,
                'total' => count($assessments),
                'errors' => $errors,
            ];

            if ($mode === 'pending_approval' || $mode === 'pending_approval') {
                $responseData['grade_report_stats'] = $gradeReportStats ?: [
                    'students_considered' => 0,
                    'reports_created' => 0,
                    'reports_reused' => 0,
                    'details_created' => 0,
                    'details_updated' => 0,
                    'details_skipped' => 0,
                    'errors' => [],
                    'deferred_until_admin_approval' => true,
                ];

                $studentCount = count(array_unique(array_map('intval', $processedStudentIds)));
                $courseIdForNotification = $courseIdFromBody > 0 ? $courseIdFromBody : (
                    is_array($assessments) && count($assessments) > 0
                        ? (int) ($assessments[0]['class_subject_id'] ?? 0)
                        : 0
                );

                $this->notifyAdminsForApprovalSubmission(
                    $institutionId,
                    $courseIdForNotification,
                    $generatedByUserId,
                    $processed,
                    $studentCount
                );
            }

            Response::success($responseData, $message);
        } catch (\Throwable $e) {
            if ($this->db->inTransaction()) {
                $this->db->rollBack();
            }
            error_log('TeacherAssessmentController::persistAssessments ' . $e->getMessage());
            Response::serverError('Failed to persist assessments');
        }
    }

    /**
     * Get required teacher-mode assessment category IDs for a course in the current period.
     *
     * @return int[]
     */
    private function getRequiredTeacherModeCategoryIdsForCourse(int $courseId): array
    {
        $currentAcademicYearId = $this->getCurrentAcademicYearId();
        $currentSemesterId = $this->getCurrentSemesterId();
        if ($courseId <= 0 || $currentAcademicYearId <= 0 || $currentSemesterId <= 0) {
            return [];
        }

        $stmt = $this->db->prepare(
            "SELECT DISTINCT category_id
             FROM assessments
             WHERE course_id = :course_id
               AND academic_year_id = :academic_year_id
               AND semester_id = :semester_id
               AND assessment_type = 'teacher_mode'"
        );
        $stmt->execute([
            'course_id' => $courseId,
            'academic_year_id' => $currentAcademicYearId,
            'semester_id' => $currentSemesterId,
        ]);

        return array_map('intval', $stmt->fetchAll(PDO::FETCH_COLUMN));
    }

    private function ensureCategoryAssessment(int $courseId, int $categoryId, float $maxScore, bool $published): int
    {
        $currentAcademicYearId = $this->getCurrentAcademicYearId();
        if ($currentAcademicYearId <= 0) {
            return 0;
        }

        $currentSemesterId = $this->getCurrentSemesterId();
        if ($currentSemesterId <= 0) {
            return 0;
        }

        $stmt = $this->db->prepare(
            "SELECT assessment_id
             FROM assessments
             WHERE course_id = :course_id
               AND category_id = :category_id
               AND academic_year_id = :academic_year_id
                             AND semester_id = :semester_id
               AND assessment_type = 'teacher_mode'
             ORDER BY assessment_id DESC
             LIMIT 1"
        );
        $stmt->execute([
            'course_id' => $courseId,
            'category_id' => $categoryId,
            'academic_year_id' => $currentAcademicYearId,
                        'semester_id' => $currentSemesterId,
        ]);
        $assessmentId = (int) $stmt->fetchColumn();

        if ($assessmentId > 0) {
            $stmtUpdate = $this->db->prepare(
                'UPDATE assessments
                 SET max_score = :max_score,
                     is_published = :is_published,
                     updated_at = NOW()
                 WHERE assessment_id = :assessment_id'
            );
            $stmtUpdate->execute([
                'max_score' => $maxScore,
                'is_published' => $published ? 1 : 0,
                'assessment_id' => $assessmentId,
            ]);
            return $assessmentId;
        }

        $category = $this->categoryRepo->findById($categoryId, (int) $this->getCurrentInstitutionForCategory($categoryId));
        $title = ($category['category_name'] ?? 'Assessment') . ' (Teacher Score)';

        $stmtInsert = $this->db->prepare(
            "INSERT INTO assessments
             (course_id, category_id, academic_year_id, semester_id, title, description, assessment_type, max_score, passing_score, is_published)
             VALUES
             (:course_id, :category_id, :academic_year_id, :semester_id, :title, :description, 'teacher_mode', :max_score, 0, :is_published)"
        );
        $stmtInsert->execute([
            'course_id' => $courseId,
            'category_id' => $categoryId,
            'academic_year_id' => $currentAcademicYearId,
            'semester_id' => $currentSemesterId,
            'title' => $title,
            'description' => 'Auto-managed teacher category score entry.',
            'max_score' => $maxScore,
            'is_published' => $published ? 1 : 0,
        ]);

        return (int) $this->db->lastInsertId();
    }

    private function teacherOwnsCourse(int $teacherId, int $institutionId, int $courseId): bool
    {
        $stmt = $this->db->prepare(
            'SELECT 1
             FROM class_subjects
             WHERE course_id = :course_id
               AND institution_id = :institution_id
               AND teacher_id = :teacher_id
             LIMIT 1'
        );
        $stmt->execute([
            'course_id' => $courseId,
            'institution_id' => $institutionId,
            'teacher_id' => $teacherId,
        ]);
        return (bool) $stmt->fetchColumn();
    }

    private function getCourseIdFromRequest(): int
    {
        if (isset($_GET['class_subject_id'])) {
            return (int) $_GET['class_subject_id'];
        }
        if (isset($_GET['course_id'])) {
            return (int) $_GET['course_id'];
        }
        if (isset($_GET['subject_id']) && isset($_GET['class_id'])) {
            $stmt = $this->db->prepare(
                'SELECT course_id
                 FROM class_subjects
                 WHERE class_id = :class_id AND subject_id = :subject_id
                 ORDER BY course_id DESC
                 LIMIT 1'
            );
            $stmt->execute([
                'class_id' => (int) $_GET['class_id'],
                'subject_id' => (int) $_GET['subject_id'],
            ]);
            return (int) $stmt->fetchColumn();
        }

        return 0;
    }

    private function getInstitutionId(array $user): int
    {
        return isset($user['institution_id']) ? (int) $user['institution_id'] : 0;
    }

    private function getTeacherId(array $user): int
    {
        $userId = isset($user['user_id']) ? (int) $user['user_id'] : (isset($user['id']) ? (int) $user['id'] : 0);
        if ($userId <= 0) {
            return 0;
        }

        $teacher = $this->teacherRepo->findByUserId($userId);
        return $teacher ? (int) ($teacher['teacher_id'] ?? 0) : 0;
    }

    private function requireTeacherRole(array $user): bool
    {
        $roleMiddleware = new RoleMiddleware($user);
        return $roleMiddleware->requireRole(['teacher', 'admin']);
    }

    private function getCurrentInstitutionForCategory(int $categoryId): int
    {
        $stmt = $this->db->prepare('SELECT institution_id FROM assessment_categories WHERE category_id = :category_id LIMIT 1');
        $stmt->execute(['category_id' => $categoryId]);
        return (int) $stmt->fetchColumn();
    }

    private function normalizeLookupValue(string $value): string
    {
        $normalized = preg_replace('/\s+/', ' ', trim($value));
        return strtolower((string) $normalized);
    }

    private function buildStudentLookupMaps(int $institutionId, int $courseId, int $teacherId): array
    {
        $stmt = $this->db->prepare(
            "SELECT
                s.student_id,
                s.student_id_number,
                u.first_name,
                u.last_name
             FROM class_subjects cs
             INNER JOIN students s ON s.class_id = cs.class_id AND s.institution_id = cs.institution_id
             INNER JOIN users u ON u.user_id = s.user_id
             WHERE cs.course_id = :course_id
               AND cs.institution_id = :institution_id
               AND cs.teacher_id = :teacher_id
               AND LOWER(COALESCE(s.status, 'active')) = 'active'"
        );
        $stmt->execute([
            'course_id' => $courseId,
            'institution_id' => $institutionId,
            'teacher_id' => $teacherId,
        ]);

        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $byName = [];
        $byIdNumber = [];

        foreach ($rows as $row) {
            $studentId = (int) ($row['student_id'] ?? 0);
            if ($studentId <= 0) {
                continue;
            }

            $fullName = $this->normalizeLookupValue(((string) ($row['first_name'] ?? '')) . ' ' . ((string) ($row['last_name'] ?? '')));
            if ($fullName !== '' && !isset($byName[$fullName])) {
                $byName[$fullName] = $studentId;
            }

            $idNumber = $this->normalizeLookupValue((string) ($row['student_id_number'] ?? ''));
            if ($idNumber !== '' && !isset($byIdNumber[$idNumber])) {
                $byIdNumber[$idNumber] = $studentId;
            }
        }

        return [
            'by_name' => $byName,
            'by_id_number' => $byIdNumber,
        ];
    }

    private function getCurrentAcademicYearId(): int
    {
        $stmt = $this->db->prepare('SELECT academic_year_id FROM academic_years WHERE is_current = 1 LIMIT 1');
        $stmt->execute();
        return (int) $stmt->fetchColumn();
    }

    private function getCurrentSemesterId(): int
    {
        $stmt = $this->db->prepare('SELECT semester_id FROM semesters WHERE is_current = 1 LIMIT 1');
        $stmt->execute();
        return (int) $stmt->fetchColumn();
    }
}