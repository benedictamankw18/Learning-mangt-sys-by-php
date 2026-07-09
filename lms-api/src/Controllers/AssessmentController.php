<?php

namespace App\Controllers;

use App\Utils\Response;
use App\Utils\Validator;
use App\Repositories\AssessmentRepository;
use App\Repositories\CourseRepository;
use App\Repositories\TeacherRepository;
use App\Repositories\StudentRepository;
use App\Middleware\RoleMiddleware;

class AssessmentController
{
    private AssessmentRepository $assessmentRepo;
    private CourseRepository $courseRepo;
    private TeacherRepository $teacherRepo;
    private StudentRepository $studentRepo;

    public function __construct()
    {
        $this->assessmentRepo = new AssessmentRepository();
        $this->courseRepo = new CourseRepository();
        $this->teacherRepo = new TeacherRepository();
        $this->studentRepo = new StudentRepository();
    }

    public function index(array $user): void
    {
        $courseId = isset($_GET['course_id']) ? (int) $_GET['course_id'] : null;

        if (!$courseId) {
            Response::error('course_id parameter is required', 400);
            return;
        }

        // Students can only view assessments for enrolled courses
        $roleMiddleware = new RoleMiddleware($user);
        if ($roleMiddleware->isStudent() && !$roleMiddleware->isAdmin()) {
            $student = $this->studentRepo->findByUserId($user['user_id']);
            if (!$student) {
                Response::forbidden('Student profile not found');
                return;
            }

            if (!$this->courseRepo->isStudentEnrolled($student['student_id'], $courseId)) {
                Response::forbidden('You can only view assessments for enrolled courses');
                return;
            }
        }

        $assessments = $this->assessmentRepo->getByCourse($courseId);
        Response::success($assessments);
    }

    public function show(array $user, int $id): void
    {
        $assessment = $this->assessmentRepo->findById($id);

        if (!$assessment) {
            Response::notFound('Assessment not found');
            return;
        }

        // Students can only view assessments for enrolled courses
        $roleMiddleware = new RoleMiddleware($user);
        if ($roleMiddleware->isStudent() && !$roleMiddleware->isAdmin()) {
            $student = $this->studentRepo->findByUserId($user['user_id']);
            if (!$student) {
                Response::forbidden('Student profile not found');
                return;
            }

            if (!$this->courseRepo->isStudentEnrolled($student['student_id'], $assessment['course_id'])) {
                Response::forbidden('You can only view assessments for enrolled courses');
                return;
            }
        }

        Response::success($assessment);
    }

    public function create(array $user): void
    {
        $roleMiddleware = new RoleMiddleware($user);

        if (!$roleMiddleware->hasRole(['admin', 'teacher'])) {
            Response::forbidden('Only admins and teachers can create assessments');
            return;
        }

        $data = json_decode(file_get_contents('php://input'), true);

        $validator = new Validator($data);
        $validator->required(['course_id', 'title', 'assessment_type'])
            ->numeric('course_id')
            ->numeric('max_score')
            ->in('assessment_type', ['exam', 'quiz', 'assignment', 'project', 'presentation']);

        if ($validator->fails()) {
            Response::validationError($validator->getErrors());
            return;
        }

        $course = $this->courseRepo->findById((int) $data['course_id']);

        if (!$course) {
            Response::notFound('Course not found');
            return;
        }

        // Teachers can only create assessments for their own courses
        if ($roleMiddleware->isTeacher() && !$roleMiddleware->isAdmin()) {
            $teacher = $this->teacherRepo->findByUserId($user['user_id']);
            if (!$teacher || $course['teacher_id'] != $teacher['teacher_id']) {
                Response::forbidden('You can only create assessments for your own courses');
                return;
            }
        }

        $assessmentId = $this->assessmentRepo->create($data);

        if (!$assessmentId) {
            Response::serverError('Failed to create assessment');
            return;
        }

        $assessment = $this->assessmentRepo->findById($assessmentId);
        Response::success($assessment, 201);
    }

    public function update(array $user, int $id): void
    {
        $roleMiddleware = new RoleMiddleware($user);

        if (!$roleMiddleware->hasRole(['admin', 'teacher'])) {
            Response::forbidden('Only admins and teachers can update assessments');
            return;
        }

        $assessment = $this->assessmentRepo->findById($id);

        if (!$assessment) {
            Response::notFound('Assessment not found');
            return;
        }

        $course = $this->courseRepo->findById($assessment['course_id']);

        // Teachers can only update assessments for their own courses
        if ($roleMiddleware->isTeacher() && !$roleMiddleware->isAdmin()) {
            $teacher = $this->teacherRepo->findByUserId($user['user_id']);
            if (!$teacher || $course['teacher_id'] != $teacher['teacher_id']) {
                Response::forbidden('You can only update assessments for your own courses');
                return;
            }
        }

        $data = json_decode(file_get_contents('php://input'), true);

        if ($this->assessmentRepo->update($id, $data)) {
            $updated = $this->assessmentRepo->findById($id);
            Response::success($updated);
        } else {
            Response::serverError('Failed to update assessment');
        }
    }

    public function delete(array $user, int $id): void
    {
        $roleMiddleware = new RoleMiddleware($user);

        if (!$roleMiddleware->hasRole(['admin', 'teacher'])) {
            Response::forbidden('Only admins and teachers can delete assessments');
            return;
        }

        $assessment = $this->assessmentRepo->findById($id);

        if (!$assessment) {
            Response::notFound('Assessment not found');
            return;
        }

        $course = $this->courseRepo->findById($assessment['course_id']);

        // Teachers can only delete assessments for their own courses
        if ($roleMiddleware->isTeacher() && !$roleMiddleware->isAdmin()) {
            $teacher = $this->teacherRepo->findByUserId($user['user_id']);
            if (!$teacher || $course['teacher_id'] != $teacher['teacher_id']) {
                Response::forbidden('You can only delete assessments for your own courses');
                return;
            }
        }

        if ($this->assessmentRepo->delete($id)) {
            Response::success(['message' => 'Assessment deleted successfully']);
        } else {
            Response::serverError('Failed to delete assessment');
        }
    }

    public function submit(array $user, int $id): void
    {
        $roleMiddleware = new RoleMiddleware($user);

        if (!$roleMiddleware->isStudent()) {
            Response::forbidden('Only students can submit assessments');
            return;
        }

        $assessment = $this->assessmentRepo->findById($id);

        if (!$assessment) {
            Response::notFound('Assessment not found');
            return;
        }

        $student = $this->studentRepo->findByUserId($user['user_id']);

        if (!$student) {
            Response::notFound('Student profile not found');
            return;
        }

        $data = json_decode(file_get_contents('php://input'), true);

        $submissionId = $this->assessmentRepo->submitAssessment($id, $student['student_id'], $data);

        if (!$submissionId) {
            Response::serverError('Failed to submit assessment');
            return;
        }

        Response::success(['message' => 'Assessment submitted successfully', 'submission_id' => $submissionId], 201);
    }

    public function getSubmissions(array $user, int $id): void
    {
        $roleMiddleware = new RoleMiddleware($user);

        if (!$roleMiddleware->hasRole(['admin', 'teacher'])) {
            Response::forbidden('Only admins and teachers can view submissions');
            return;
        }

        $assessment = $this->assessmentRepo->findById($id);

        if (!$assessment) {
            Response::notFound('Assessment not found');
            return;
        }

        $course = $this->courseRepo->findById($assessment['course_id']);

        // Teachers can only view submissions for their own courses
        if ($roleMiddleware->isTeacher() && !$roleMiddleware->isAdmin()) {
            $teacher = $this->teacherRepo->findByUserId($user['user_id']);
            if (!$teacher || $course['teacher_id'] != $teacher['teacher_id']) {
                Response::forbidden('You can only view submissions for your own courses');
                return;
            }
        }

        $page = (int) ($_GET['page'] ?? 1);
        $limit = (int) ($_GET['limit'] ?? 20);

        $submissions = $this->assessmentRepo->getSubmissions($id, $page, $limit);
        Response::success($submissions);
    }

    public function gradeSubmission(array $user, int $submissionId): void
    {
        $roleMiddleware = new RoleMiddleware($user);

        if (!$roleMiddleware->hasRole(['admin', 'teacher'])) {
            Response::forbidden('Only admins and teachers can grade submissions');
            return;
        }

        $data = json_decode(file_get_contents('php://input'), true);

        $validator = new Validator($data);
        $validator->required(['score'])->numeric('score');

        if ($validator->fails()) {
            Response::validationError($validator->getErrors());
            return;
        }

        if ($this->assessmentRepo->gradeSubmission($submissionId, (float) $data['score'], $data['feedback'] ?? null)) {
            Response::success(['message' => 'Submission graded successfully']);
        } else {
            Response::serverError('Failed to grade submission');
        }
    }

    /**
     * Update a submission (before grading)
     * PUT /api/submissions/{id}
     */
    public function updateSubmission(array $user, int $id): void
    {
        $submission = $this->assessmentRepo->findSubmissionById($id);

        if (!$submission) {
            Response::notFound('Submission not found');
            return;
        }

        // Only the student who submitted can update (and only if not graded)
        $student = $this->studentRepo->findByUserId($user['user_id']);

        if (!$student || $submission['student_id'] != $student['student_id']) {
            Response::forbidden('You can only update your own submissions');
            return;
        }

        if ($submission['status'] === 'graded') {
            Response::error('Cannot update a graded submission', 400);
            return;
        }

        $data = json_decode(file_get_contents('php://input'), true);

        if ($this->assessmentRepo->updateSubmission($id, $data)) {
            Response::success(['message' => 'Submission updated successfully']);
        } else {
            Response::serverError('Failed to update submission');
        }
    }

    /**
     * Delete a submission
     * DELETE /api/submissions/{id}
     */
    public function deleteSubmission(array $user, int $id): void
    {
        $roleMiddleware = new RoleMiddleware($user);

        $submission = $this->assessmentRepo->findSubmissionById($id);

        if (!$submission) {
            Response::notFound('Submission not found');
            return;
        }

        // Students can delete own ungraded submissions, admins can delete any
        if (!$roleMiddleware->isAdmin()) {
            $student = $this->studentRepo->findByUserId($user['user_id']);

            if (!$student || $submission['student_id'] != $student['student_id']) {
                Response::forbidden('You can only delete your own submissions');
                return;
            }

            if ($submission['status'] === 'graded') {
                Response::error('Cannot delete a graded submission', 400);
                return;
            }
        }

        if ($this->assessmentRepo->deleteSubmission($id)) {
            Response::success(['message' => 'Submission deleted successfully']);
        } else {
            Response::serverError('Failed to delete submission');
        }
    }
}
