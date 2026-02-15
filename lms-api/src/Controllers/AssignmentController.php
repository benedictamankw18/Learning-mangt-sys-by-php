<?php

namespace App\Controllers;

use App\Repositories\AssignmentRepository;
use App\Repositories\ClassSubjectRepository;
use App\Utils\Response;
use App\Utils\Validator;
use App\Middleware\RoleMiddleware;

class AssignmentController
{
    private AssignmentRepository $repo;
    private ClassSubjectRepository $courseRepo;

    public function __construct()
    {
        $this->repo = new AssignmentRepository();
        $this->courseRepo = new ClassSubjectRepository();
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
     * GET /assignments/{id}
     */
    public function show(array $user, int $id): void
    {
        $assignment = $this->repo->findById($id);

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
     * PUT /assignments/{id}
     */
    public function update(array $user, int $id): void
    {
        $roleMiddleware = new RoleMiddleware($user);
        if (!$roleMiddleware->requireRole(['admin', 'teacher', 'super_admin'])) {
            return;
        }

        // Check if assignment exists
        $assignment = $this->repo->findById($id);

        if (!$assignment) {
            Response::error('Assignment not found', 404);
            return;
        }

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

        $this->repo->update($id, $data);

        Response::success(['message' => 'Assignment updated successfully']);
    }

    /**
     * Delete an assignment (teacher/admin)
     * DELETE /assignments/{id}
     */
    public function delete(array $user, int $id): void
    {
        $roleMiddleware = new RoleMiddleware($user);
        if (!$roleMiddleware->requireRole(['admin', 'teacher', 'super_admin'])) {
            return;
        }

        // Check if assignment exists
        $assignment = $this->repo->findById($id);

        if (!$assignment) {
            Response::error('Assignment not found', 404);
            return;
        }

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

        $this->repo->delete($id);

        Response::success(['message' => 'Assignment deleted successfully']);
    }

    /**
     * Get submissions for an assignment (teacher/admin)
     * GET /assignments/{id}/submissions
     */
    public function getSubmissions(array $user, int $id): void
    {
        $roleMiddleware = new RoleMiddleware($user);
        if (!$roleMiddleware->requireRole(['admin', 'teacher', 'super_admin'])) {
            return;
        }

        // Check if assignment exists
        $assignment = $this->repo->findById($id);

        if (!$assignment) {
            Response::error('Assignment not found', 404);
            return;
        }

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

        $submissions = $this->repo->getSubmissions($id);

        Response::success([
            'submissions' => $submissions,
            'count' => count($submissions)
        ]);
    }

    /**
     * Submit an assignment (student)
     * POST /assignments/{id}/submit
     */
    public function submit(array $user, int $id): void
    {
        $roleMiddleware = new RoleMiddleware($user);
        if (!$roleMiddleware->requireRole(['student'])) {
            return;
        }

        // Check if assignment exists
        $assignment = $this->repo->findById($id);

        if (!$assignment) {
            Response::error('Assignment not found', 404);
            return;
        }

        // Check authorization (student must be enrolled in the course)
        if ($user['role'] !== 'super_admin' && $assignment['institution_id'] != $user['institution_id']) {
            Response::forbidden('You do not have access to this assignment');
            return;
        }

        $data = json_decode(file_get_contents('php://input'), true);

        $validator = new Validator($data);
        $validator->max('submission_file', 500);

        if ($validator->fails()) {
            Response::validationError($validator->getErrors());
            return;
        }

        $data['assignment_id'] = $id;
        $data['student_id'] = $user['student_id'];
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

        $this->repo->gradeSubmission($id, $data);

        Response::success(['message' => 'Submission graded successfully']);
    }
}
