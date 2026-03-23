<?php

namespace App\Controllers;

use App\Repositories\AssignmentRepository;
use App\Repositories\ClassSubjectRepository;
use App\Repositories\StudentRepository;
use App\Utils\Response;
use App\Utils\Validator;
use App\Utils\UuidHelper;
use App\Middleware\RoleMiddleware;

class AssignmentController
{
    private AssignmentRepository $repo;
    private ClassSubjectRepository $courseRepo;
    private StudentRepository $studentRepo;

    public function __construct()
    {
        $this->repo = new AssignmentRepository();
        $this->courseRepo = new ClassSubjectRepository();
        $this->studentRepo = new StudentRepository();
    }

    /**
     * Resolve student_id from auth payload, with fallback lookup by user_id.
     */
    private function resolveStudentId(array $user): int
    {
        $studentId = isset($user['student_id']) ? (int) $user['student_id'] : 0;
        if ($studentId > 0) {
            return $studentId;
        }

        $student = $this->studentRepo->findByUserId((int) ($user['user_id'] ?? 0));
        return (int) ($student['student_id'] ?? 0);
    }

    /**
     * Escape text for a simple PDF content stream.
     */
    private function pdfEscape(string $text): string
    {
        $text = str_replace(["\\", "(", ")"], ["\\\\", "\\(", "\\)"], $text);
        return preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/', '', $text) ?? '';
    }

    /**
     * Create a minimal one-page PDF from plain text lines.
     */
    private function buildSimplePdf(array $lines): string
    {
        $ops = [];
        $y = 800;
        foreach ($lines as $line) {
            if ($y < 40) {
                break;
            }
            $ops[] = sprintf('BT /F1 11 Tf 50 %d Td (%s) Tj ET', $y, $this->pdfEscape((string) $line));
            $y -= 14;
        }

        $stream = implode("\n", $ops) . "\n";

        $pdf = "%PDF-1.4\n";
        $offsets = [];

        $offsets[] = strlen($pdf);
        $pdf .= "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n";

        $offsets[] = strlen($pdf);
        $pdf .= "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n";

        $offsets[] = strlen($pdf);
        $pdf .= "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj\n";

        $offsets[] = strlen($pdf);
        $pdf .= "4 0 obj << /Length " . strlen($stream) . " >> stream\n" . $stream . "endstream endobj\n";

        $offsets[] = strlen($pdf);
        $pdf .= "5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\n";

        $xrefOffset = strlen($pdf);
        $pdf .= "xref\n0 6\n";
        $pdf .= "0000000000 65535 f \n";
        foreach ($offsets as $off) {
            $pdf .= sprintf('%010d 00000 n ', $off) . "\n";
        }

        $pdf .= "trailer << /Size 6 /Root 1 0 R >>\nstartxref\n" . $xrefOffset . "\n%%EOF";
        return $pdf;
    }

    /**
     * Wrap a long string into shorter lines for PDF output.
     */
    private function wrapForPdf(string $text, int $width = 95): array
    {
        $normalized = trim(str_replace(["\r\n", "\r"], "\n", $text));
        if ($normalized === '') {
            return ['-'];
        }

        $wrapped = wordwrap($normalized, $width, "\n", true);
        return explode("\n", $wrapped);
    }

    /**
     * Get assignments for logged-in student with submission status.
     * GET /assignments/my
     */
    public function getMyAssignments(array $user): void
    {
        $roleMiddleware = new RoleMiddleware($user);
        if (!$roleMiddleware->requireRole(['student'])) {
            return;
        }

        $studentId = $this->resolveStudentId($user);

        if ($studentId <= 0) {
            Response::notFound('Student record not found');
            return;
        }

        $filters = [
            'status' => $_GET['status'] ?? '',
            'subject_id' => $_GET['subject_id'] ?? '',
            'search' => $_GET['search'] ?? '',
        ];

        $assignments = $this->repo->getAssignmentsForStudent($studentId, $filters);

        Response::success([
            'assignments' => $assignments,
            'count' => count($assignments),
        ]);
    }

    /**
     * Get all assignments for a course
     * GET /courses/{courseId}/assignments
     */
    public function getByCourse(array $user, int $courseId): void
    {
        // Check if course exists and user has access
        $course = $this->courseRepo->findById($courseId);

        if (!$course) {
            Response::error('Course not found', 404);
            return;
        }

        // Check authorization
        if ($user['role'] !== 'super_admin' && $course['institution_id'] != $user['institution_id']) {
            Response::forbidden('You do not have access to this course');
            return;
        }

        $assignments = $this->repo->getCourseAssignments($courseId);

        Response::success([
            'assignments' => $assignments,
            'count' => count($assignments)
        ]);
    }

    /**
     * Get a single assignment
     * GET /assignments/{uuid}
     */
    public function show(array $user, string $uuid): void
    {
        $sanitizedUuid = UuidHelper::sanitize($uuid);
        if (!$sanitizedUuid) {
            Response::badRequest('Invalid UUID format');
            return;
        }

        $assignment = $this->repo->findByUuid($sanitizedUuid);

        if (!$assignment) {
            Response::error('Assignment not found', 404);
            return;
        }

        // Check authorization
        if ($user['role'] !== 'super_admin' && $assignment['institution_id'] != $user['institution_id']) {
            Response::forbidden('You do not have access to this assignment');
            return;
        }

        Response::success($assignment);
    }

    /**
     * Create a new assignment (teacher/admin)
     * POST /assignments
     */
    public function create(array $user): void
    {
        $roleMiddleware = new RoleMiddleware($user);
        if (!$roleMiddleware->requireRole(['admin', 'teacher', 'super_admin'])) {
            return;
        }

        $data = json_decode(file_get_contents('php://input'), true);

        $validator = new Validator($data);
        $validator->required(['course_id', 'title'])
            ->numeric('course_id')
            ->numeric('section_id')
            ->max('title', 200)
            ->max('file_path', 500)
            ->numeric('max_score')
            ->numeric('passing_score')
            ->in('submission_type', ['text', 'file', 'both'])
            ->in('status', ['draft', 'active', 'archived']);

        if ($validator->fails()) {
            Response::validationError($validator->getErrors());
            return;
        }

        // Check if course exists
        $course = $this->courseRepo->findById($data['course_id']);

        if (!$course) {
            Response::error('Course not found', 404);
            return;
        }

        // Check authorization
        if ($user['role'] !== 'super_admin' && $course['institution_id'] != $user['institution_id']) {
            Response::forbidden('You do not have access to this course');
            return;
        }

        // Teachers can only create assignments for their own courses
        if ($user['role'] === 'teacher' && $course['teacher_id'] != $user['teacher_id']) {
            Response::forbidden('You can only create assignments for your own courses');
            return;
        }

        $assignmentId = $this->repo->create($data);

        Response::success([
            'message' => 'Assignment created successfully',
            'assignment_id' => $assignmentId
        ], 201);
    }

    /**
     * Update an assignment (teacher/admin)
     * PUT /assignments/{uuid}
     */
    public function update(array $user, string $uuid): void
    {
        $sanitizedUuid = UuidHelper::sanitize($uuid);
        if (!$sanitizedUuid) {
            Response::badRequest('Invalid UUID format');
            return;
        }

        $roleMiddleware = new RoleMiddleware($user);
        if (!$roleMiddleware->requireRole(['admin', 'teacher', 'super_admin'])) {
            return;
        }

        // Check if assignment exists
        $assignment = $this->repo->findByUuid($sanitizedUuid);

        if (!$assignment) {
            Response::error('Assignment not found', 404);
            return;
        }

        $assignmentId = $assignment['assignment_id'];

        // Check authorization
        if ($user['role'] !== 'super_admin' && $assignment['institution_id'] != $user['institution_id']) {
            Response::forbidden('You do not have access to this assignment');
            return;
        }

        // Teachers can only update their own assignments
        if ($user['role'] === 'teacher' && $assignment['teacher_id'] != $user['teacher_id']) {
            Response::forbidden('You can only update your own assignments');
            return;
        }

        $data = json_decode(file_get_contents('php://input'), true);

        $validator = new Validator($data);
        $validator->numeric('section_id')
            ->max('title', 200)
            ->max('file_path', 500)
            ->numeric('max_score')
            ->numeric('passing_score')
            ->in('submission_type', ['text', 'file', 'both'])
            ->in('status', ['draft', 'active', 'archived']);

        if ($validator->fails()) {
            Response::validationError($validator->getErrors());
            return;
        }

        $this->repo->update($assignmentId, $data);

        Response::success(['message' => 'Assignment updated successfully']);
    }

    /**
     * Delete an assignment (teacher/admin)
     * DELETE /assignments/{uuid}
     */
    public function delete(array $user, string $uuid): void
    {
        $sanitizedUuid = UuidHelper::sanitize($uuid);
        if (!$sanitizedUuid) {
            Response::badRequest('Invalid UUID format');
            return;
        }

        $roleMiddleware = new RoleMiddleware($user);
        if (!$roleMiddleware->requireRole(['admin', 'teacher', 'super_admin'])) {
            return;
        }

        // Check if assignment exists
        $assignment = $this->repo->findByUuid($sanitizedUuid);

        if (!$assignment) {
            Response::error('Assignment not found', 404);
            return;
        }

        $assignmentId = $assignment['assignment_id'];

        // Check authorization
        if ($user['role'] !== 'super_admin' && $assignment['institution_id'] != $user['institution_id']) {
            Response::forbidden('You do not have access to this assignment');
            return;
        }

        // Teachers can only delete their own assignments
        if ($user['role'] === 'teacher' && $assignment['teacher_id'] != $user['teacher_id']) {
            Response::forbidden('You can only delete your own assignments');
            return;
        }

        $this->repo->delete($assignmentId);

        Response::success(['message' => 'Assignment deleted successfully']);
    }

    /**
     * Get submissions for an assignment (teacher/admin)
     * GET /assignments/{uuid}/submissions
     */
    public function getSubmissions(array $user, string $uuid): void
    {
        $sanitizedUuid = UuidHelper::sanitize($uuid);
        if (!$sanitizedUuid) {
            Response::badRequest('Invalid UUID format');
            return;
        }

        $roleMiddleware = new RoleMiddleware($user);
        if (!$roleMiddleware->requireRole(['admin', 'teacher', 'super_admin'])) {
            return;
        }

        // Check if assignment exists
        $assignment = $this->repo->findByUuid($sanitizedUuid);

        if (!$assignment) {
            Response::error('Assignment not found', 404);
            return;
        }

        $assignmentId = $assignment['assignment_id'];

        // Check authorization
        if ($user['role'] !== 'super_admin' && $assignment['institution_id'] != $user['institution_id']) {
            Response::forbidden('You do not have access to this assignment');
            return;
        }

        // Teachers can only view submissions for their own assignments
        if ($user['role'] === 'teacher' && $assignment['teacher_id'] != $user['teacher_id']) {
            Response::forbidden('You can only view submissions for your own assignments');
            return;
        }

        $submissions = $this->repo->getSubmissions($assignmentId);

        Response::success([
            'submissions' => $submissions,
            'count' => count($submissions),
            'max_score' => $assignment['max_score'] ?? null,
            'due_date' => $assignment['due_date'] ?? null,
            'assignment' => [
                'uuid' => $sanitizedUuid,
                'title' => $assignment['title'] ?? '',
                'max_score' => $assignment['max_score'] ?? null,
                'due_date' => $assignment['due_date'] ?? null,
            ],
        ]);
    }

    /**
     * Return all submission data required for client-side export (teacher/admin).
     * GET /assignments/{uuid}/submissions/download-all
     */
    public function downloadAllSubmissions(array $user, string $uuid): void
    {
        $sanitizedUuid = UuidHelper::sanitize($uuid);
        if (!$sanitizedUuid) {
            Response::badRequest('Invalid UUID format');
            return;
        }

        $roleMiddleware = new RoleMiddleware($user);
        if (!$roleMiddleware->requireRole(['admin', 'teacher', 'super_admin'])) {
            return;
        }

        $assignment = $this->repo->findByUuid($sanitizedUuid);
        if (!$assignment) {
            Response::error('Assignment not found', 404);
            return;
        }

        if ($user['role'] !== 'super_admin' && $assignment['institution_id'] != $user['institution_id']) {
            Response::forbidden('You do not have access to this assignment');
            return;
        }

        if ($user['role'] === 'teacher' && $assignment['teacher_id'] != $user['teacher_id']) {
            Response::forbidden('You can only download submissions for your own assignments');
            return;
        }

        $submissions = $this->repo->getSubmissions((int) $assignment['assignment_id']);

        Response::success([
            'assignment' => [
                'uuid' => $sanitizedUuid,
                'title' => $assignment['title'] ?? '',
                'submission_type' => strtolower((string) ($assignment['submission_type'] ?? 'both')),
                'max_score' => $assignment['max_score'] ?? null,
                'institution_name' => $assignment['institution_name'] ?? '',
                'institution_code' => $assignment['institution_code'] ?? '',
                'logo_url' => $assignment['logo_url'] ?? '',
            ],
            'submissions' => $submissions,
            'count' => count($submissions),
        ]);
    }

    /**
     * Publish assignment grades (teacher/admin).
     * POST /assignments/{uuid}/submissions/publish
     */
    public function publishSubmissionGrades(array $user, string $uuid): void
    {
        $sanitizedUuid = UuidHelper::sanitize($uuid);
        if (!$sanitizedUuid) {
            Response::badRequest('Invalid UUID format');
            return;
        }

        $roleMiddleware = new RoleMiddleware($user);
        if (!$roleMiddleware->requireRole(['admin', 'teacher', 'super_admin'])) {
            return;
        }

        $assignment = $this->repo->findByUuid($sanitizedUuid);
        if (!$assignment) {
            Response::error('Assignment not found', 404);
            return;
        }

        if ($user['role'] !== 'super_admin' && $assignment['institution_id'] != $user['institution_id']) {
            Response::forbidden('You do not have access to this assignment');
            return;
        }

        if ($user['role'] === 'teacher' && $assignment['teacher_id'] != $user['teacher_id']) {
            Response::forbidden('You can only publish grades for your own assignments');
            return;
        }

        $updatedCount = $this->repo->publishGradesForAssignment((int) $assignment['assignment_id']);

        Response::success([
            'message' => 'Grades published successfully',
            'updated' => $updatedCount,
        ]);
    }

    /**
     * Submit an assignment (student)
     * POST /assignments/{uuid}/submit
     */
    public function submit(array $user, string $uuid): void
    {
        $sanitizedUuid = UuidHelper::sanitize($uuid);
        if (!$sanitizedUuid) {
            Response::badRequest('Invalid UUID format');
            return;
        }

        $roleMiddleware = new RoleMiddleware($user);
        if (!$roleMiddleware->requireRole(['student'])) {
            return;
        }

        // Check if assignment exists
        $assignment = $this->repo->findByUuid($sanitizedUuid);

        if (!$assignment) {
            Response::error('Assignment not found', 404);
            return;
        }

        $assignmentId = $assignment['assignment_id'];

        // Check authorization (student must be enrolled in the course)
        if ($user['role'] !== 'super_admin' && $assignment['institution_id'] != $user['institution_id']) {
            Response::forbidden('You do not have access to this assignment');
            return;
        }

        // Check if assignment is past due date
        if ($assignment['due_date']) {
            $dueDate = new \DateTime($assignment['due_date']);
            $now = new \DateTime();
            if ($now > $dueDate) {
                Response::error('This assignment is past the due date and cannot be submitted.', 400);
                return;
            }
        }

        $data = json_decode(file_get_contents('php://input'), true);

        $validator = new Validator($data);
        $validator->max('submission_file', 500);

        if ($validator->fails()) {
            Response::validationError($validator->getErrors());
            return;
        }

        $studentId = $this->resolveStudentId($user);
        if ($studentId <= 0) {
            Response::notFound('Student record not found');
            return;
        }

        $existingSubmission = $this->repo->getStudentSubmission($assignmentId, $studentId);
        if ($existingSubmission) {
            Response::error('You have already submitted this assignment. Resubmission is not allowed.', 409);
            return;
        }

        $data['assignment_id'] = $assignmentId;
        $data['student_id'] = $studentId;
        $data['course_id'] = $assignment['course_id'];

        $submissionId = $this->repo->submitAssignment($data);

        Response::success([
            'message' => 'Assignment submitted successfully',
            'submission_id' => $submissionId
        ], 201);
    }

    /**
     * Grade a submission (teacher/admin)
     * PUT /assignment-submissions/{id}/grade
     */
    public function gradeSubmission(array $user, int $id): void
    {
        $roleMiddleware = new RoleMiddleware($user);
        if (!$roleMiddleware->requireRole(['admin', 'teacher', 'super_admin'])) {
            return;
        }

        // Check if submission exists
        $submission = $this->repo->findSubmissionById($id);

        if (!$submission) {
            Response::error('Submission not found', 404);
            return;
        }

        // Check authorization
        if ($user['role'] !== 'super_admin' && $submission['institution_id'] != $user['institution_id']) {
            Response::forbidden('You do not have access to this submission');
            return;
        }

        // Teachers can only grade submissions for their own courses
        if ($user['role'] === 'teacher' && $submission['teacher_id'] != $user['teacher_id']) {
            Response::forbidden('You can only grade submissions for your own courses');
            return;
        }

        $data = json_decode(file_get_contents('php://input'), true);

        $validator = new Validator($data);
        $validator->required(['score'])
            ->numeric('score');

        if ($validator->fails()) {
            Response::validationError($validator->getErrors());
            return;
        }

        $data['graded_by'] = $user['user_id'];

        if (!$this->repo->gradeSubmission($id, $data)) {
            Response::serverError('Failed to update score');
            return;
        }

        Response::success([
            'message' => 'Submission graded successfully',
            'status' => $submission['status'] ?? null,
        ]);
    }
}