<?php

namespace App\Controllers;

use App\Repositories\GradeReportRepository;
use App\Repositories\StudentRepository;
use App\Repositories\ResultRepository;

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
    public function index($request)
    {
        try {
            $studentId = $request['query']['student_id'] ?? null;
            $semesterId = $request['query']['semester_id'] ?? null;
            $academicYearId = $request['query']['academic_year_id'] ?? null;
            $page = $request['query']['page'] ?? 1;
            $limit = $request['query']['limit'] ?? 50;
            $offset = ($page - 1) * $limit;

            $filters = [];
            if ($studentId) $filters['student_id'] = $studentId;
            if ($semesterId) $filters['semester_id'] = $semesterId;
            if ($academicYearId) $filters['academic_year_id'] = $academicYearId;

            $reports = $this->gradeReportRepository->getAll($filters, $limit, $offset);
            $total = $this->gradeReportRepository->count($filters);

            return [
                'success' => true,
                'data' => $reports,
                'pagination' => [
                    'total' => $total,
                    'page' => (int)$page,
                    'limit' => (int)$limit,
                    'pages' => ceil($total / $limit)
                ]
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => 'Failed to fetch grade reports',
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Get single grade report
     * GET /grade-reports/{id}
     */
    public function show($request)
    {
        try {
            $id = $request['params']['id'];
            $report = $this->gradeReportRepository->findById($id);

            if (!$report) {
                return [
                    'success' => false,
                    'message' => 'Grade report not found'
                ];
            }

            // Get report details (individual subject grades)
            $details = $this->gradeReportRepository->getReportDetails($id);
            $report['details'] = $details;

            return [
                'success' => true,
                'data' => $report
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => 'Failed to fetch grade report',
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Generate grade report for student
     * POST /grade-reports/generate
     */
    public function generate($request)
    {
        try {
            $data = $request['body'];

            // Validate required fields
            $required = ['student_id', 'semester_id', 'academic_year_id'];
            foreach ($required as $field) {
                if (empty($data[$field])) {
                    return [
                        'success' => false,
                        'message' => ucfirst(str_replace('_', ' ', $field)) . ' is required'
                    ];
                }
            }

            // Check if student exists
            $student = $this->studentRepository->findById($data['student_id']);
            if (!$student) {
                return [
                    'success' => false,
                    'message' => 'Student not found'
                ];
            }

            // Generate report
            $reportId = $this->gradeReportRepository->generateReport(
                $data['student_id'],
                $data['semester_id'],
                $data['academic_year_id'],
                $data['remarks'] ?? null,
                $data['generated_by'] ?? null
            );

            return [
                'success' => true,
                'message' => 'Grade report generated successfully',
                'data' => ['id' => $reportId]
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => 'Failed to generate grade report',
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Get student report card
     * GET /grade-reports/student/{studentId}/report-card?semester_id=1
     */
    public function getReportCard($request)
    {
        try {
            $studentId = $request['params']['studentId'];
            $semesterId = $request['query']['semester_id'] ?? null;
            $academicYearId = $request['query']['academic_year_id'] ?? null;

            $reportCard = $this->gradeReportRepository->getReportCard(
                $studentId,
                $semesterId,
                $academicYearId
            );

            if (!$reportCard) {
                return [
                    'success' => false,
                    'message' => 'Report card not found'
                ];
            }

            return [
                'success' => true,
                'data' => $reportCard
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => 'Failed to fetch report card',
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Get student transcript (all terms)
     * GET /grade-reports/student/{studentId}/transcript
     */
    public function getTranscript($request)
    {
        try {
            $studentId = $request['params']['studentId'];
            $academicYearId = $request['query']['academic_year_id'] ?? null;

            $transcript = $this->gradeReportRepository->getTranscript($studentId, $academicYearId);

            return [
                'success' => true,
                'data' => $transcript
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => 'Failed to fetch transcript',
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Update grade report
     * PUT /grade-reports/{id}
     */
    public function update($request)
    {
        try {
            $id = $request['params']['id'];
            $data = $request['body'];

            $report = $this->gradeReportRepository->findById($id);
            if (!$report) {
                return [
                    'success' => false,
                    'message' => 'Grade report not found'
                ];
            }

            $this->gradeReportRepository->update($id, $data);

            return [
                'success' => true,
                'message' => 'Grade report updated successfully'
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => 'Failed to update grade report',
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Delete grade report
     * DELETE /grade-reports/{id}
     */
    public function delete($request)
    {
        try {
            $id = $request['params']['id'];

            $report = $this->gradeReportRepository->findById($id);
            if (!$report) {
                return [
                    'success' => false,
                    'message' => 'Grade report not found'
                ];
            }

            $this->gradeReportRepository->delete($id);

            return [
                'success' => true,
                'message' => 'Grade report deleted successfully'
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => 'Failed to delete grade report',
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Publish/unpublish grade report
     * PUT /grade-reports/{id}/publish
     */
    public function publish($request)
    {
        try {
            $id = $request['params']['id'];
            $data = $request['body'];
            $published = $data['published'] ?? true;

            $report = $this->gradeReportRepository->findById($id);
            if (!$report) {
                return [
                    'success' => false,
                    'message' => 'Grade report not found'
                ];
            }

            $this->gradeReportRepository->update($id, ['published' => $published ? 1 : 0]);

            return [
                'success' => true,
                'message' => $published ? 'Grade report published successfully' : 'Grade report unpublished successfully'
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => 'Failed to update report status',
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Get class grade reports
     * GET /grade-reports/class/{classId}?semester_id=1
     */
    public function getClassReports($request)
    {
        try {
            $classId = $request['params']['classId'];
            $semesterId = $request['query']['semester_id'] ?? null;
            $academicYearId = $request['query']['academic_year_id'] ?? null;

            $reports = $this->gradeReportRepository->getClassReports(
                $classId,
                $semesterId,
                $academicYearId
            );

            return [
                'success' => true,
                'data' => $reports
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => 'Failed to fetch class reports',
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Bulk generate reports for class
     * POST /grade-reports/bulk-generate
     */
    public function bulkGenerate($request)
    {
        try {
            $data = $request['body'];

            // Validate required fields
            $required = ['class_id', 'semester_id', 'academic_year_id'];
            foreach ($required as $field) {
                if (empty($data[$field])) {
                    return [
                        'success' => false,
                        'message' => ucfirst(str_replace('_', ' ', $field)) . ' is required'
                    ];
                }
            }

            $generatedCount = $this->gradeReportRepository->bulkGenerateForClass(
                $data['class_id'],
                $data['semester_id'],
                $data['academic_year_id'],
                $data['generated_by'] ?? null
            );

            return [
                'success' => true,
                'message' => "Successfully generated {$generatedCount} grade reports",
                'data' => ['count' => $generatedCount]
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => 'Failed to generate bulk reports',
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Get report statistics
     * GET /grade-reports/stats?institution_id=1&semester_id=1
     */
    public function getStatistics($request)
    {
        try {
            $institutionId = $request['query']['institution_id'] ?? null;
            $semesterId = $request['query']['semester_id'] ?? null;
            $academicYearId = $request['query']['academic_year_id'] ?? null;

            $stats = $this->gradeReportRepository->getStatistics(
                $institutionId,
                $semesterId,
                $academicYearId
            );

            return [
                'success' => true,
                'data' => $stats
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => 'Failed to fetch statistics',
                'error' => $e->getMessage()
            ];
        }
    }
}
