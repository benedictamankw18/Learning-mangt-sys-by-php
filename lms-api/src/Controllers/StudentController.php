<?php

namespace App\Controllers;

use App\Utils\Response;
use App\Utils\Validator;
use App\Repositories\StudentRepository;
use App\Repositories\UserRepository;
use App\Middleware\RoleMiddleware;

class StudentController
{
    private StudentRepository $studentRepo;
    private UserRepository $userRepo;

    public function __construct()
    {
        $this->studentRepo = new StudentRepository();
        $this->userRepo = new UserRepository();
    }

    public function index(array $user): void
    {
        $roleMiddleware = new RoleMiddleware($user);

        if (!$roleMiddleware->hasRole(['admin', 'teacher'])) {
            Response::forbidden('Only admins and teachers can view all students');
            return;
        }

        $page = (int) ($_GET['page'] ?? 1);
        $limit = (int) ($_GET['limit'] ?? 20);
        $gradeLevel = $_GET['grade_level'] ?? null;

        $students = $this->studentRepo->getAll($page, $limit, $gradeLevel);
        $total = $this->studentRepo->count($gradeLevel);

        Response::paginated($students, $total, $page, $limit);
    }

    public function show(array $user, int $id): void
    {
        $roleMiddleware = new RoleMiddleware($user);

        $student = $this->studentRepo->findById($id);

        if (!$student) {
            Response::notFound('Student not found');
            return;
        }

        // Students can only view their own profile
        if ($roleMiddleware->isStudent() && $student['user_id'] != $user['user_id']) {
            Response::forbidden('You can only view your own profile');
            return;
        }

        Response::success($student);
    }

    public function create(array $user): void
    {
        $roleMiddleware = new RoleMiddleware($user);

        if (!$roleMiddleware->requireRole('admin')) {
            return;
        }

        $data = json_decode(file_get_contents('php://input'), true);

        $validator = new Validator($data);
        $validator->required(['username', 'email', 'password', 'first_name', 'last_name', 'student_id_number'])
            ->email('email')
            ->min('password', 8);

        if ($validator->fails()) {
            Response::validationError($validator->getErrors());
            return;
        }

        // Create user first
        $userId = $this->userRepo->create($data);

        if (!$userId) {
            Response::serverError('Failed to create user');
            return;
        }

        // Assign student role
        $this->userRepo->assignRole($userId, 3);

        // Create student profile
        $studentId = $this->studentRepo->create($userId, $data);

        if (!$studentId) {
            Response::serverError('Failed to create student profile');
            return;
        }

        $student = $this->studentRepo->findById($studentId);

        Response::success($student, 201);
    }

    public function update(array $user, int $id): void
    {
        $roleMiddleware = new RoleMiddleware($user);

        $student = $this->studentRepo->findById($id);

        if (!$student) {
            Response::notFound('Student not found');
            return;
        }

        // Students can update their own profile, admins can update any
        if (!$roleMiddleware->isAdmin() && $student['user_id'] != $user['user_id']) {
            Response::forbidden('You can only update your own profile');
            return;
        }

        $data = json_decode(file_get_contents('php://input'), true);

        // Update user info
        if (isset($data['first_name']) || isset($data['last_name']) || isset($data['phone']) || isset($data['address'])) {
            $updateData = [];
            if (isset($data['first_name']))
                $updateData['first_name'] = $data['first_name'];
            if (isset($data['last_name']))
                $updateData['last_name'] = $data['last_name'];
            if (isset($data['phone']))
                $updateData['phone'] = $data['phone'];
            if (isset($data['address']))
                $updateData['address'] = $data['address'];

            $this->userRepo->update($student['user_id'], $updateData);
        }

        // Update student-specific info
        if ($this->studentRepo->update($id, $data)) {
            $updated = $this->studentRepo->findById($id);
            Response::success($updated);
        } else {
            Response::serverError('Failed to update student');
        }
    }

    public function getEnrolledCourses(array $user, int $id): void
    {
        $roleMiddleware = new RoleMiddleware($user);

        $student = $this->studentRepo->findById($id);

        if (!$student) {
            Response::notFound('Student not found');
            return;
        }

        // Students can only view their own courses
        if ($roleMiddleware->isStudent() && $student['user_id'] != $user['user_id']) {
            Response::forbidden('You can only view your own courses');
            return;
        }

        $courses = $this->studentRepo->getEnrolledCourses($id);
        Response::success($courses);
    }

    public function enrollInCourse(array $user): void
    {
        $roleMiddleware = new RoleMiddleware($user);

        $data = json_decode(file_get_contents('php://input'), true);

        $validator = new Validator($data);
        $validator->required(['course_id', 'student_id'])
            ->numeric('course_id')
            ->numeric('student_id');

        if ($validator->fails()) {
            Response::validationError($validator->getErrors());
            return;
        }

        $studentId = (int) $data['student_id'];
        $student = $this->studentRepo->findById($studentId);

        if (!$student) {
            Response::notFound('Student not found');
            return;
        }

        // Students can enroll themselves, or admin can enroll any student
        if (!$roleMiddleware->isAdmin() && $student['user_id'] != $user['user_id']) {
            Response::forbidden('You can only enroll yourself');
            return;
        }

        if ($this->studentRepo->enrollInCourse($studentId, (int) $data['course_id'])) {
            Response::success(['message' => 'Enrolled successfully'], 201);
        } else {
            Response::serverError('Failed to enroll in course');
        }
    }

    public function unenrollFromCourse(array $user, int $id, int $courseId): void
    {
        $roleMiddleware = new RoleMiddleware($user);

        $student = $this->studentRepo->findById($id);

        if (!$student) {
            Response::notFound('Student not found');
            return;
        }

        // Only admin can unenroll students
        if (!$roleMiddleware->requireRole('admin')) {
            return;
        }

        if ($this->studentRepo->unenrollFromCourse($id, $courseId)) {
            Response::success(['message' => 'Unenrolled successfully']);
        } else {
            Response::serverError('Failed to unenroll from course');
        }
    }

    /**
     * Delete (deactivate) a student
     * DELETE /api/students/{id}
     */
    public function delete(array $user, int $id): void
    {
        $roleMiddleware = new RoleMiddleware($user);

        // Only admins can delete students
        if (!$roleMiddleware->requireRole('admin')) {
            return;
        }

        $student = $this->studentRepo->findById($id);

        if (!$student) {
            Response::notFound('Student not found');
            return;
        }

        // Soft delete - set status to 'withdrawn'
        if ($this->studentRepo->update($id, ['status' => 'withdrawn'])) {
            Response::success(['message' => 'Student deactivated successfully']);
        } else {
            Response::serverError('Failed to deactivate student');
        }
    }

    /**
     * Update enrollment
     * PUT /api/enrollments/{id}
     */
    public function updateEnrollment(array $user, int $id): void
    {
        $roleMiddleware = new RoleMiddleware($user);

        // Only admins and teachers can update enrollments
        if (!$roleMiddleware->hasRole(['admin', 'teacher'])) {
            Response::forbidden('Only admins and teachers can update enrollments');
            return;
        }

        $enrollment = $this->studentRepo->findEnrollmentById($id);

        if (!$enrollment) {
            Response::notFound('Enrollment not found');
            return;
        }

        $data = json_decode(file_get_contents('php://input'), true);

        $validator = new Validator($data);
        if (isset($data['status'])) {
            $validator->in('status', ['active', 'completed', 'dropped', 'suspended']);
        }
        if (isset($data['progress_percentage'])) {
            $validator->numeric('progress_percentage');
        }

        if ($validator->fails()) {
            Response::validationError($validator->getErrors());
            return;
        }

        if ($this->studentRepo->updateEnrollment($id, $data)) {
            Response::success(['message' => 'Enrollment updated successfully']);
        } else {
            Response::serverError('Failed to update enrollment');
        }
    }

    /**
     * Delete enrollment (hard delete)
     * DELETE /api/enrollments/{id}
     */
    public function deleteEnrollment(array $user, int $id): void
    {
        $roleMiddleware = new RoleMiddleware($user);

        // Only admins can delete enrollments
        if (!$roleMiddleware->requireRole('admin')) {
            return;
        }

        $enrollment = $this->studentRepo->findEnrollmentById($id);

        if (!$enrollment) {
            Response::notFound('Enrollment not found');
            return;
        }

        if ($this->studentRepo->deleteEnrollment($id)) {
            Response::success(['message' => 'Enrollment deleted successfully']);
        } else {
            Response::serverError('Failed to delete enrollment');
        }
    }
}
