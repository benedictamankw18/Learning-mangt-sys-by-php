<?php

namespace App\Controllers;

use App\Config\Database;
use App\Middleware\RoleMiddleware;
use App\Repositories\AssessmentCategoryRepository;
use App\Repositories\TeacherRepository;
use App\Utils\Response;
use PDO;

class TeacherAssessmentController
{
    private PDO $db;
    private AssessmentCategoryRepository $categoryRepo;
    private TeacherRepository $teacherRepo;

    public function __construct()
    {
        $this->db = Database::getInstance()->getConnection();
        $this->categoryRepo = new AssessmentCategoryRepository();
        $this->teacherRepo = new TeacherRepository();
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
        $this->persistAssessments($user, false);
    }

    /**
     * Publish assessment scores (final mode)
     * POST /teacher/assessments/publish
     * Body: { assessments: [ { student_id, category_id, score, max_score } ] }
     */
    public function publishAssessments(array $user): void
    {
        $this->persistAssessments($user, true);
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

                if (!$this->saveScore($courseId, $studentId, $categoryId, $score, $maxScore, $publish)) {
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
     * @param int $studentId
     * @param int $categoryId
     * @param float $score
     * @param float $maxScore
     * @param bool $published
     */
    private function saveScore(
        int $courseId,
        int $studentId,
        int $categoryId,
        float $score,
        float $maxScore,
        bool $published
    ): bool {
        $assessmentId = $this->ensureCategoryAssessment($courseId, $categoryId, $maxScore, $published);
        if ($assessmentId <= 0) {
            return false;
        }

        $status = $published ? 'graded' : 'draft';
        $gradedAt = $published ? date('Y-m-d H:i:s') : null;

        $stmtFind = $this->db->prepare(
            'SELECT submission_id
             FROM assessment_submissions
             WHERE assessment_id = :assessment_id AND student_id = :student_id
             ORDER BY submission_id DESC
             LIMIT 1'
        );
        $stmtFind->execute([
            'assessment_id' => $assessmentId,
            'student_id' => $studentId,
        ]);
        $submissionId = (int) $stmtFind->fetchColumn();

        if ($submissionId > 0) {
            $stmtUpdate = $this->db->prepare(
                'UPDATE assessment_submissions
                 SET score = :score,
                     status = :status,
                     submitted_at = NOW(),
                     graded_at = :graded_at,
                     updated_at = NOW()
                 WHERE submission_id = :submission_id'
            );

            return $stmtUpdate->execute([
                'score' => $score,
                'status' => $status,
                'graded_at' => $gradedAt,
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
     * Helper: Get assessment scores for a specific category
     * @param int $classId
     * @param int $subjectId
     * @param int $categoryId
     * @return array
     */
    private function persistAssessments(array $user, bool $publish): void
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

            if (!is_array($assessments) || !$assessments) {
                Response::error('Assessments array required', 400);
            }

            $this->db->beginTransaction();
            $processed = 0;
            $errors = [];

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

                if (!$this->saveScore($courseId, $studentId, $categoryId, $score, $maxScore, $publish)) {
                    $errors[] = "Assessment {$idx}: failed to persist score";
                    continue;
                }

                $processed++;
            }

            if ($errors && $processed === 0) {
                $this->db->rollBack();
                Response::error('Validation failed', 400, ['errors' => $errors]);
            }

            $this->db->commit();
            Response::success([
                $publish ? 'published' : 'saved' => $processed,
                'total' => count($assessments),
                'errors' => $errors,
            ], $publish ? 'Assessments published successfully' : 'Assessments saved successfully');
        } catch (\Throwable $e) {
            if ($this->db->inTransaction()) {
                $this->db->rollBack();
            }
            error_log('TeacherAssessmentController::persistAssessments ' . $e->getMessage());
            Response::serverError($publish ? 'Failed to publish assessments' : 'Failed to save assessments');
        }
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