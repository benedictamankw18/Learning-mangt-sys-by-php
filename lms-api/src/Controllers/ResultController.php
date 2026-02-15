<?php

namespace App\Controllers;

use App\Utils\Response;
use App\Utils\Validator;
use App\Repositories\ResultRepository;
use App\Repositories\StudentRepository;
use App\Repositories\CourseRepository;
use App\Middleware\RoleMiddleware;

class ResultController
{
    private ResultRepository $resultRepo;
    private StudentRepository $studentRepo;
    private CourseRepository $courseRepo;

    public function __construct()
    {
        $this->resultRepo = new ResultRepository();
        $this->studentRepo = new StudentRepository();
        $this->courseRepo = new CourseRepository();
    }

    public function getStudentResults(array $user, int $studentId): void
    {
        $roleMiddleware = new RoleMiddleware($user);

        $student = $this->studentRepo->findById($studentId);

        if (!$student) {
            Response::notFound('Student not found');
            return;
        }

        // Students can only view their own results
        if ($roleMiddleware->isStudent() && $student['user_id'] != $user['user_id']) {
            Response::forbidden('You can only view your own results');
            return;
        }

        $semesterId = isset($_GET['semester_id']) ? (int) $_GET['semester_id'] : null;
        $results = $this->resultRepo->getStudentResults($studentId, $semesterId);

        Response::success($results);
    }

    public function show(array $user, int $id): void
    {
        $result = $this->resultRepo->findById($id);

        if (!$result) {
            Response::notFound('Result not found');
            return;
        }

        // Students can only view results for courses they're enrolled in
        $roleMiddleware = new RoleMiddleware($user);
        if ($roleMiddleware->isStudent() && !$roleMiddleware->isAdmin()) {
            $student = $this->studentRepo->findByUserId($user['user_id']);
            if (!$student) {
                Response::forbidden('Student profile not found');
                return;
            }

            // Verify this result belongs to the student OR they're enrolled in the course
            if ($result['student_id'] != $student['student_id']) {
                Response::forbidden('You can only view your own results');
                return;
            }

            if (!$this->courseRepo->isStudentEnrolled($student['student_id'], $result['course_id'])) {
                Response::forbidden('You can only view results for enrolled courses');
                return;
            }
        }

        Response::success($result);
    }

    public function create(array $user): void
    {
        $roleMiddleware = new RoleMiddleware($user);

        if (!$roleMiddleware->hasRole(['admin', 'teacher'])) {
            Response::forbidden('Only admins and teachers can create results');
            return;
        }

        $data = json_decode(file_get_contents('php://input'), true);

        $validator = new Validator($data);
        $validator->required(['student_id', 'course_id', 'total_score'])
            ->numeric('student_id')
            ->numeric('course_id')
            ->numeric('total_score');

        if (isset($data['class_score'])) {
            $validator->numeric('class_score');
        }
        if (isset($data['exam_score'])) {
            $validator->numeric('exam_score');
        }
        if (isset($data['subject_id'])) {
            $validator->numeric('subject_id');
        }
        if (isset($data['semester_id'])) {
            $validator->numeric('semester_id');
        }

        if ($validator->fails()) {
            Response::validationError($validator->getErrors());
            return;
        }

        $resultId = $this->resultRepo->create($data);

        if ($resultId) {
            Response::success([
                'message' => 'Result created successfully',
                'result_id' => $resultId
            ], 201);
        } else {
            Response::serverError('Failed to create result');
        }
    }

    public function update(array $user, int $id): void
    {
        $roleMiddleware = new RoleMiddleware($user);

        if (!$roleMiddleware->hasRole(['admin', 'teacher'])) {
            Response::forbidden('Only admins and teachers can update results');
            return;
        }

        $result = $this->resultRepo->findById($id);

        if (!$result) {
            Response::notFound('Result not found');
            return;
        }

        $data = json_decode(file_get_contents('php://input'), true);

        $validator = new Validator($data);
        if (isset($data['class_score'])) {
            $validator->numeric('class_score');
        }
        if (isset($data['exam_score'])) {
            $validator->numeric('exam_score');
        }
        if (isset($data['total_score'])) {
            $validator->numeric('total_score');
        }

        if ($validator->fails()) {
            Response::validationError($validator->getErrors());
            return;
        }

        if ($this->resultRepo->update($id, $data)) {
            Response::success(['message' => 'Result updated successfully']);
        } else {
            Response::serverError('Failed to update result');
        }
    }

    public function delete(array $user, int $id): void
    {
        $roleMiddleware = new RoleMiddleware($user);

        if (!$roleMiddleware->requireRole('admin')) {
            return;
        }

        $result = $this->resultRepo->findById($id);

        if (!$result) {
            Response::notFound('Result not found');
            return;
        }

        if ($this->resultRepo->delete($id)) {
            Response::success(['message' => 'Result deleted successfully']);
        } else {
            Response::serverError('Failed to delete result');
        }
    }

    public function getCourseResults(array $user, int $courseId): void
    {
        $semesterId = isset($_GET['semester_id']) ? (int) $_GET['semester_id'] : null;
        $results = $this->resultRepo->getCourseResults($courseId, $semesterId);

        Response::success($results);
    }
}
