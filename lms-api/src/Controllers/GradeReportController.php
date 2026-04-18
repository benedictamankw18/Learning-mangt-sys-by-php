<?php

namespace App\Controllers;

use App\Repositories\GradeReportRepository;
use App\Repositories\NotificationRepository;
use App\Repositories\StudentRepository;
use App\Repositories\ResultRepository;
use App\Utils\Response;
use App\Utils\UuidHelper;

class GradeReportController
{
    private $gradeReportRepository;
    private $notificationRepository;
    private $studentRepository;
    private $resultRepository;

    public function __construct()
    {
        $this->gradeReportRepository = new GradeReportRepository();
        $this->notificationRepository = new NotificationRepository();
        $this->studentRepository = new StudentRepository();
        $this->resultRepository = new ResultRepository();
    }

    private function isSendBackForCorrectionPayload(array $data): bool
    {
        if (!array_key_exists('Approved', $data)) {
            return false;
        }

        $approved = (int) $data['Approved'];
        $comment = trim((string) ($data['principal_comment'] ?? ''));

        return $approved === 0 && $comment !== '';
    }

    private function notifyTeacherForCorrection(array $report, array $user, string $comment): void
    {
        $teacherUserId = isset($report['generated_by']) ? (int) $report['generated_by'] : 0;
        $senderUserId = isset($user['user_id']) ? (int) $user['user_id'] : (isset($user['id']) ? (int) $user['id'] : 0);

        if ($teacherUserId <= 0 || $senderUserId <= 0 || $teacherUserId === $senderUserId) {
            return;
        }

        $studentLabel = (string) ($report['student_id_number'] ?? $report['student_id'] ?? 'Unknown Student');
        $reportUuid = (string) ($report['uuid'] ?? '');

        $title = 'Grade report sent back for correction';
        $message = 'A grade report was returned for correction by admin.';
        if ($studentLabel !== '') {
            $message .= ' Student: ' . $studentLabel . '.';
        }
        if ($reportUuid !== '') {
            $message .= ' Report: ' . $reportUuid . '.';
        }
        $message .= ' Note: ' . $comment;

        try {
            $this->notificationRepository->create([
                'sender_id' => $senderUserId,
                'user_id' => $teacherUserId,
                'target_role' => 'teacher',
                'title' => $title,
                'message' => $message,
                'notification_type' => 'grade_report_correction',
                'link' => '/teacher/dashboard.html#grading',
            ]);
        } catch (\Throwable $notifyError) {
            error_log('GradeReportController::notifyTeacherForCorrection ' . $notifyError->getMessage());
        }
    }

    /**
     * Get all grade reports
     * GET /grade-reports?student_id=1&semester_id=1&academic_year_id=1
     */
    public function index(array $user): void
    {
        try {
            $studentId = $_GET['student_id'] ?? null;
            $classId = $_GET['class_id'] ?? null;
            $semesterId = $_GET['semester_id'] ?? null;
            $academicYearId = $_GET['academic_year_id'] ?? null;
            $generatedBy = $_GET['generated_by'] ?? null;
            $hasFeedback = $_GET['has_feedback'] ?? null;
            $page = $_GET['page'] ?? 1;
            $limit = $_GET['limit'] ?? 50;
            $offset = ($page - 1) * $limit;

            $filters = [];
            if ($studentId)
                $filters['student_id'] = $studentId;
            if ($classId)
                $filters['class_id'] = $classId;
            if ($semesterId)
                $filters['semester_id'] = $semesterId;
            if ($academicYearId)
                $filters['academic_year_id'] = $academicYearId;
            if ($generatedBy)
                $filters['generated_by'] = $generatedBy;
            if ($hasFeedback !== null && $hasFeedback !== '')
                $filters['has_feedback'] = $hasFeedback;

            $reports = $this->gradeReportRepository->getAll($filters, $limit, $offset);
            $total = $this->gradeReportRepository->count($filters);

            Response::success([
                'reports' => $reports,
                'pagination' => [
                    'total' => $total,
                    'page' => (int) $page,
                    'limit' => (int) $limit,
                    'pages' => ceil($total / $limit)
                ]
            ]);
        } catch (\Exception $e) {
            Response::serverError('Failed to fetch grade reports: ' . $e->getMessage());
        }
    }

    /**
     * Get single grade report
     * GET /grade-reports/{uuid}
     */
    public function show(array $user, string $uuid): void
    {
        try {
            $sanitizedUuid = UuidHelper::sanitize($uuid);
            if (!$sanitizedUuid) {
                Response::badRequest('Invalid UUID format');
                return;
            }

            $report = $this->gradeReportRepository->findByUuid($sanitizedUuid);

            if (!$report) {
                Response::notFound('Grade report not found');
                return;
            }

            $reportId = $report['report_id'];

            // Get report details (individual subject grades)
            $details = $this->gradeReportRepository->getReportDetails($reportId);
            $report['details'] = $details;

            Response::success($report);
        } catch (\Exception $e) {
            Response::serverError('Failed to fetch grade report: ' . $e->getMessage());
        }
    }

    /**
     * Generate grade report for student
     * POST /grade-reports/generate
     */
    public function generate(array $user): void
    {
        try {
            $data = json_decode((string) file_get_contents('php://input'), true) ?: $_POST;

            // Validate required fields
            $required = ['student_id', 'semester_id', 'academic_year_id'];
            $errors = [];
            foreach ($required as $field) {
                if (empty($data[$field])) {
                    $errors[$field] = ucfirst(str_replace('_', ' ', $field)) . ' is required';
                }
            }

            if (!empty($errors)) {
                Response::validationError($errors);
                return;
            }

            // Check if student exists
            $student = $this->studentRepository->findById($data['student_id']);
            if (!$student) {
                Response::notFound('Student not found');
                return;
            }

            // Generate report
            $reportId = $this->gradeReportRepository->generateReport(
                $data['student_id'],
                $data['semester_id'],
                $data['academic_year_id'],
                $data['remarks'] ?? null,
                $data['generated_by'] ?? null,
                $student['class_id'] ?? null,
                true,
                $student['institution_id'] ?? null
            );

            Response::success(['id' => $reportId], 'Grade report generated successfully');
        } catch (\Exception $e) {
            Response::serverError('Failed to generate grade report: ' . $e->getMessage());
        }
    }

    /**
     * Get student report card
     * GET /grade-reports/student/{studentId}/report-card?semester_id=1
     */
    public function getReportCard(array $user, int $studentId): void
    {
        try {
            $semesterId = $_GET['semester_id'] ?? null;
            $academicYearId = $_GET['academic_year_id'] ?? null;

            $reportCard = $this->gradeReportRepository->getReportCard(
                $studentId,
                $semesterId,
                $academicYearId
            );

            if (!$reportCard) {
                Response::notFound('Report card not found');
                return;
            }

            if ($semesterId && $academicYearId && (!isset($reportCard['class_rank']) || $reportCard['class_rank'] === null || $reportCard['class_rank'] === '')) {
                $this->gradeReportRepository->recalculateClassRankForStudentTerm(
                    $studentId,
                    (int) $semesterId,
                    (int) $academicYearId
                );

                $reportCard = $this->gradeReportRepository->getReportCard(
                    $studentId,
                    $semesterId,
                    $academicYearId
                );
            }

            Response::success($reportCard);
        } catch (\Exception $e) {
            Response::serverError('Failed to fetch report card: ' . $e->getMessage());
        }
    }

    /**
     * Get student transcript (all terms)
     * GET /grade-reports/student/{studentId}/transcript
     */
    public function getTranscript(array $user, int $studentId): void
    {
        try {
            $allTerms = isset($_GET['all_terms'])
                && in_array(strtolower((string) $_GET['all_terms']), ['1', 'true', 'yes'], true);
            $academicYearId = $allTerms ? null : ($_GET['academic_year_id'] ?? null);

            $transcript = $this->gradeReportRepository->getTranscript($studentId, $academicYearId);

            Response::success($transcript);
        } catch (\Exception $e) {
            Response::serverError('Failed to fetch transcript: ' . $e->getMessage());
        }
    }

    /**
     * Update grade report
     * PUT /grade-reports/{uuid}
     */
    public function update(array $user, string $uuid): void
    {
        try {
            $sanitizedUuid = UuidHelper::sanitize($uuid);
            if (!$sanitizedUuid) {
                Response::badRequest('Invalid UUID format');
                return;
            }

            $data = json_decode((string) file_get_contents('php://input'), true) ?: $_POST;

            $report = $this->gradeReportRepository->findByUuid($sanitizedUuid);
            if (!$report) {
                Response::notFound('Grade report not found');
                return;
            }

            $reportId = $report['report_id'];

            $this->gradeReportRepository->update($reportId, $data);

            if ($this->isSendBackForCorrectionPayload($data)) {
                $comment = trim((string) ($data['principal_comment'] ?? ''));
                $this->notifyTeacherForCorrection($report, $user, $comment);
            }

            Response::success(null, 'Grade report updated successfully');
        } catch (\Exception $e) {
            Response::serverError('Failed to update grade report: ' . $e->getMessage());
        }
    }

    /**
     * Delete grade report
     * DELETE /grade-reports/{uuid}
     */
    public function delete(array $user, string $uuid): void
    {
        try {
            $sanitizedUuid = UuidHelper::sanitize($uuid);
            if (!$sanitizedUuid) {
                Response::badRequest('Invalid UUID format');
                return;
            }

            $report = $this->gradeReportRepository->findByUuid($sanitizedUuid);
            if (!$report) {
                Response::notFound('Grade report not found');
                return;
            }

            $reportId = $report['report_id'];

            $this->gradeReportRepository->delete($reportId);

            Response::success(null, 'Grade report deleted successfully');
        } catch (\Exception $e) {
            Response::serverError('Failed to delete grade report: ' . $e->getMessage());
        }
    }

    /**
     * Publish/unpublish grade report
     * PUT /grade-reports/{uuid}/publish
     */
    public function publish(array $user, string $uuid): void
    {
        try {
            $sanitizedUuid = UuidHelper::sanitize($uuid);
            if (!$sanitizedUuid) {
                Response::badRequest('Invalid UUID format');
                return;
            }

            $data = json_decode((string) file_get_contents('php://input'), true) ?: $_POST;
            $published = $data['published'] ?? true;

            $report = $this->gradeReportRepository->findByUuid($sanitizedUuid);
            if (!$report) {
                Response::notFound('Grade report not found');
                return;
            }

            $reportId = $report['report_id'];

            $this->gradeReportRepository->update($reportId, ['is_published' => $published ? 1 : 0]);

            Response::success(null, $published ? 'Grade report published successfully' : 'Grade report unpublished successfully');
        } catch (\Exception $e) {
            Response::serverError('Failed to update report status: ' . $e->getMessage());
        }
    }

    /**
     * Get class grade reports
     * GET /grade-reports/class/{classId}?semester_id=1
     */
    public function getClassReports(array $user, int $classId): void
    {
        try {
            $semesterId = $_GET['semester_id'] ?? null;
            $academicYearId = $_GET['academic_year_id'] ?? null;

            $reports = $this->gradeReportRepository->getClassReports(
                $classId,
                $semesterId,
                $academicYearId
            );

            Response::success($reports);
        } catch (\Exception $e) {
            Response::serverError('Failed to fetch class reports: ' . $e->getMessage());
        }
    }

    /**
     * Bulk generate reports for class
     * POST /grade-reports/bulk-generate
     */
    public function bulkGenerate(array $user): void
    {
        try {
            $data = json_decode((string) file_get_contents('php://input'), true) ?: $_POST;

            // Validate required fields
            $required = ['class_id', 'semester_id', 'academic_year_id'];
            $errors = [];
            foreach ($required as $field) {
                if (empty($data[$field])) {
                    $errors[$field] = ucfirst(str_replace('_', ' ', $field)) . ' is required';
                }
            }

            if (!empty($errors)) {
                Response::validationError($errors);
                return;
            }

            $generatedCount = $this->gradeReportRepository->bulkGenerateForClass(
                $data['class_id'],
                $data['semester_id'],
                $data['academic_year_id'],
                $data['generated_by'] ?? null
            );

            Response::success(['count' => $generatedCount], "Successfully generated {$generatedCount} grade reports");
        } catch (\Exception $e) {
            Response::serverError('Failed to generate bulk reports: ' . $e->getMessage());
        }
    }

    /**
     * Get report statistics
     * GET /grade-reports/stats?institution_id=1&semester_id=1
     */
    public function getStatistics(array $user): void
    {
        try {
            $institutionId = $_GET['institution_id'] ?? null;
            $semesterId = $_GET['semester_id'] ?? null;
            $academicYearId = $_GET['academic_year_id'] ?? null;

            $stats = $this->gradeReportRepository->getStatistics(
                $institutionId,
                $semesterId,
                $academicYearId
            );

            Response::success($stats);
        } catch (\Exception $e) {
            Response::serverError('Failed to fetch statistics: ' . $e->getMessage());
        }
    }
}