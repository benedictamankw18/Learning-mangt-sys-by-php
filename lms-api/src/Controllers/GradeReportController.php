<?php

namespace App\Controllers;

use App\Repositories\GradeReportRepository;
use App\Repositories\StudentRepository;
use App\Repositories\ResultRepository;
use App\Utils\Response;
use App\Utils\UuidHelper;

class GradeReportController
{
    private $gradeReportRepository;
    private $studentRepository;
    private $resultRepository;

    public function __construct()
    {
        $this->gradeReportRepository = new GradeReportRepository();
        $this->studentRepository = new StudentRepository();
        $this->resultRepository = new ResultRepository();
    }

    /**
     * Get all grade reports
     * GET /grade-reports?student_id=1&semester_id=1&academic_year_id=1
     */
    public function index(array $user): void
    {
        try {
            $studentId = $_GET['student_id'] ?? null;
            $semesterId = $_GET['semester_id'] ?? null;
            $academicYearId = $_GET['academic_year_id'] ?? null;
            $page = $_GET['page'] ?? 1;
            $limit = $_GET['limit'] ?? 50;
            $offset = ($page - 1) * $limit;

            $filters = [];
            if ($studentId)
                $filters['student_id'] = $studentId;
            if ($semesterId)
                $filters['semester_id'] = $semesterId;
            if ($academicYearId)
                $filters['academic_year_id'] = $academicYearId;

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
            $data = $_POST;

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
                $data['generated_by'] ?? null
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
            $academicYearId = $_GET['academic_year_id'] ?? null;

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

            $data = $_POST;

            $report = $this->gradeReportRepository->findByUuid($sanitizedUuid);
            if (!$report) {
                Response::notFound('Grade report not found');
                return;
            }

            $reportId = $report['report_id'];

            $this->gradeReportRepository->update($reportId, $data);

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

            $data = $_POST;
            $published = $data['published'] ?? true;

            $report = $this->gradeReportRepository->findByUuid($sanitizedUuid);
            if (!$report) {
                Response::notFound('Grade report not found');
                return;
            }

            $reportId = $report['report_id'];

            $this->gradeReportRepository->update($reportId, ['published' => $published ? 1 : 0]);

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
            $data = $_POST;

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
