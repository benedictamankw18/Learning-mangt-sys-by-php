<?php

namespace App\Controllers;

use App\Utils\Response;
use App\Utils\Validator;
use App\Utils\UuidHelper;
use App\Repositories\TeacherRepository;
use App\Repositories\UserRepository;
use App\Middleware\RoleMiddleware;

class TeacherController
{
    private TeacherRepository $teacherRepo;
    private UserRepository $userRepo;

    public function __construct()
    {
        $this->teacherRepo = new TeacherRepository();
        $this->userRepo = new UserRepository();
    }

    public function index(array $user): void
    {
        $roleMiddleware = new RoleMiddleware($user);

        if (!$roleMiddleware->hasRole(['admin', 'teacher'])) {
            Response::forbidden('Only admins and teachers can view teachers list');
            return;
        }

        $page = isset($_GET['page']) ? (int) $_GET['page'] : 1;
        $limit = isset($_GET['limit']) ? (int) $_GET['limit'] : 20;
        $department = $_GET['department'] ?? null;

        $teachers = $this->teacherRepo->getAll($page, $limit, $department);
        $total = $this->teacherRepo->count($department);

        Response::success([
            'teachers' => $teachers,
            'pagination' => [
                'current_page' => $page,
                'per_page' => $limit,
                'total' => $total,
                'total_pages' => ceil($total / $limit)
            ]
        ]);
    }

    public function show(array $user, string $uuid): void
    {
        $sanitizedUuid = UuidHelper::sanitize($uuid);
        if (!$sanitizedUuid) {
            Response::badRequest('Invalid UUID format');
            return;
        }

        $roleMiddleware = new RoleMiddleware($user);

        $teacher = $this->teacherRepo->findByUuid($sanitizedUuid);

        if (!$teacher) {
            Response::notFound('Teacher not found');
            return;
        }

        $teacherId = $teacher['teacher_id'];

        // Teachers can only view their own profile unless they're admin
        if ($roleMiddleware->isTeacher() && !$roleMiddleware->isAdmin()) {
            $currentTeacher = $this->teacherRepo->findByUserId($user['user_id']);
            if (!$currentTeacher || $currentTeacher['teacher_id'] != $teacherId) {
                Response::forbidden('You can only view your own profile');
                return;
            }
        }

        Response::success($teacher);
    }

    public function create(array $user): void
    {
        $roleMiddleware = new RoleMiddleware($user);

        if (!$roleMiddleware->isAdmin()) {
            Response::forbidden('Only admins can create teachers');
            return;
        }

        $data = json_decode(file_get_contents('php://input'), true);

        $validator = new Validator($data);
        $validator->required(['user_id', 'employee_id']);

        if ($validator->fails()) {
            Response::validationError($validator->getErrors());
            return;
        }

        // Add institution_id for multi-tenant support
        if ($user['role'] !== 'super_admin') {
            $data['institution_id'] = $user['institution_id'];
        }

        // Check if user exists
        $userExists = $this->userRepo->findById((int) $data['user_id']);
        if (!$userExists) {
            Response::notFound('User not found');
            return;
        }

        // Check if teacher profile already exists
        $existingTeacher = $this->teacherRepo->findByUserId((int) $data['user_id']);
        if ($existingTeacher) {
            Response::badRequest('Teacher profile already exists for this user');
            return;
        }

        $teacherId = $this->teacherRepo->create((int) $data['user_id'], $data);

        if ($teacherId) {
            $teacher = $this->teacherRepo->findById($teacherId);
            Response::success($teacher, 201);
        } else {
            Response::serverError('Failed to create teacher');
        }
    }

    public function update(array $user, string $uuid): void
    {
        $sanitizedUuid = UuidHelper::sanitize($uuid);
        if (!$sanitizedUuid) {
            Response::badRequest('Invalid UUID format');
            return;
        }

        $roleMiddleware = new RoleMiddleware($user);

        $teacher = $this->teacherRepo->findByUuid($sanitizedUuid);

        if (!$teacher) {
            Response::notFound('Teacher not found');
            return;
        }

        $teacherId = $teacher['teacher_id'];

        // Teachers can only update their own profile unless they're admin
        if ($roleMiddleware->isTeacher() && !$roleMiddleware->isAdmin()) {
            $currentTeacher = $this->teacherRepo->findByUserId($user['user_id']);
            if (!$currentTeacher || $currentTeacher['teacher_id'] != $teacherId) {
                Response::forbidden('You can only update your own profile');
                return;
            }
        }

        $data = json_decode(file_get_contents('php://input'), true);

        if ($this->teacherRepo->update($teacherId, $data)) {
            $updatedTeacher = $this->teacherRepo->findByUuid($sanitizedUuid);
            Response::success($updatedTeacher);
        } else {
            Response::serverError('Failed to update teacher');
        }
    }

    public function getCourses(array $user, string $uuid): void
    {
        $sanitizedUuid = UuidHelper::sanitize($uuid);
        if (!$sanitizedUuid) {
            Response::badRequest('Invalid UUID format');
            return;
        }

        $roleMiddleware = new RoleMiddleware($user);

        $teacher = $this->teacherRepo->findByUuid($sanitizedUuid);

        if (!$teacher) {
            Response::notFound('Teacher not found');
            return;
        }

        $teacherId = $teacher['teacher_id'];

        // Teachers can only view their own courses unless they're admin
        if ($roleMiddleware->isTeacher() && !$roleMiddleware->isAdmin()) {
            $currentTeacher = $this->teacherRepo->findByUserId($user['user_id']);
            if (!$currentTeacher || $currentTeacher['teacher_id'] != $teacherId) {
                Response::forbidden('You can only view your own courses');
                return;
            }
        }

        $courses = $this->teacherRepo->getCourses($teacherId);
        Response::success($courses);
    }

    public function getSchedule(array $user, string $uuid): void
    {
        $sanitizedUuid = UuidHelper::sanitize($uuid);
        if (!$sanitizedUuid) {
            Response::badRequest('Invalid UUID format');
            return;
        }

        $roleMiddleware = new RoleMiddleware($user);

        $teacher = $this->teacherRepo->findByUuid($sanitizedUuid);

        if (!$teacher) {
            Response::notFound('Teacher not found');
            return;
        }

        $teacherId = $teacher['teacher_id'];

        // Teachers can only view their own schedule unless they're admin
        if ($roleMiddleware->isTeacher() && !$roleMiddleware->isAdmin()) {
            $currentTeacher = $this->teacherRepo->findByUserId($user['user_id']);
            if (!$currentTeacher || $currentTeacher['teacher_id'] != $teacherId) {
                Response::forbidden('You can only view your own schedule');
                return;
            }
        }

        $date = $_GET['date'] ?? null;
        $schedule = $this->teacherRepo->getSchedule($teacherId, $date);
        Response::success($schedule);
    }

    /**
     * Delete (deactivate) a teacher
     * DELETE /api/teachers/{uuid}
     */
    public function delete(array $user, string $uuid): void
    {
        $sanitizedUuid = UuidHelper::sanitize($uuid);
        if (!$sanitizedUuid) {
            Response::badRequest('Invalid UUID format');
            return;
        }

        $roleMiddleware = new RoleMiddleware($user);

        // Only admins can delete teachers
        if (!$roleMiddleware->requireRole('admin')) {
            return;
        }

        $teacher = $this->teacherRepo->findByUuid($sanitizedUuid);

        if (!$teacher) {
            Response::notFound('Teacher not found');
            return;
        }

        $teacherId = $teacher['teacher_id'];

        // Soft delete - set employment_end_date
        $data = ['employment_end_date' => date('Y-m-d')];

        if ($this->teacherRepo->update($teacherId, $data)) {
            Response::success(['message' => 'Teacher deactivated successfully']);
        } else {
            Response::serverError('Failed to deactivate teacher');
        }
    }
}
