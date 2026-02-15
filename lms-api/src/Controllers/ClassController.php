<?php

namespace App\Controllers;

use App\Utils\Response;
use App\Utils\Validator;
use App\Repositories\ClassRepository;
use App\Middleware\RoleMiddleware;

class ClassController
{
    private ClassRepository $repo;

    public function __construct()
    {
        $this->repo = new ClassRepository();
    }

    /**
     * Get all classes (with pagination)
     */
    public function index(array $user): void
    {
        $page = isset($_GET['page']) ? (int) $_GET['page'] : 1;
        $limit = isset($_GET['limit']) ? (int) $_GET['limit'] : 20;
        $institutionId = isset($_GET['institution_id']) ? (int) $_GET['institution_id'] : null;
        $programId = isset($_GET['program_id']) ? (int) $_GET['program_id'] : null;
        $gradeLevelId = isset($_GET['grade_level_id']) ? (int) $_GET['grade_level_id'] : null;

        // Super admin can view all institutions' classes
        if ($user['role'] !== 'super_admin' && !$institutionId) {
            $institutionId = $user['institution_id'];
        }

        $classes = $this->repo->getAll($page, $limit, $institutionId, $programId, $gradeLevelId);
        $total = $this->repo->count($institutionId, $programId, $gradeLevelId);

        Response::success([
            'data' => $classes,
            'pagination' => [
                'current_page' => $page,
                'per_page' => $limit,
                'total' => $total,
                'total_pages' => ceil($total / $limit)
            ]
        ]);
    }

    /**
     * Get a single class by ID
     */
    public function show(array $user, int $id): void
    {
        $class = $this->repo->findById($id);

        if (!$class) {
            Response::notFound('Class not found');
            return;
        }

        // Check authorization
        if ($user['role'] !== 'super_admin' && $class['institution_id'] != $user['institution_id']) {
            Response::forbidden('You do not have access to this class');
            return;
        }

        Response::success($class);
    }

    /**
     * Create a new class
     */
    public function create(array $user): void
    {
        $roleMiddleware = new RoleMiddleware($user);

        if (!$roleMiddleware->requireRole(['admin', 'super_admin'])) {
            return;
        }

        $data = json_decode(file_get_contents('php://input'), true);

        // Set institution_id based on user role
        if ($user['role'] !== 'super_admin') {
            $data['institution_id'] = $user['institution_id'];
        }

        $validator = new Validator($data);
        $validator->required(['institution_id', 'program_id', 'grade_level_id', 'class_code', 'class_name', 'section', 'academic_year_id'])
            ->maxLength('class_code', 50)
            ->maxLength('class_name', 200)
            ->maxLength('section', 50)
            ->numeric('program_id')
            ->numeric('grade_level_id')
            ->numeric('academic_year_id');

        if (isset($data['max_students'])) {
            $validator->numeric('max_students');
        }

        if ($validator->fails()) {
            Response::validationError($validator->getErrors());
            return;
        }

        $classId = $this->repo->create($data);

        if ($classId) {
            Response::success([
                'message' => 'Class created successfully',
                'class_id' => $classId
            ], 201);
        } else {
            Response::serverError('Failed to create class');
        }
    }

    /**
     * Update an existing class
     */
    public function update(array $user, int $id): void
    {
        $roleMiddleware = new RoleMiddleware($user);

        if (!$roleMiddleware->requireRole(['admin', 'super_admin'])) {
            return;
        }

        $class = $this->repo->findById($id);

        if (!$class) {
            Response::notFound('Class not found');
            return;
        }

        // Check authorization
        if ($user['role'] !== 'super_admin' && $class['institution_id'] != $user['institution_id']) {
            Response::forbidden('You do not have access to update this class');
            return;
        }

        $data = json_decode(file_get_contents('php://input'), true);

        $validator = new Validator($data);
        if (isset($data['class_code'])) {
            $validator->maxLength('class_code', 50);
        }
        if (isset($data['class_name'])) {
            $validator->maxLength('class_name', 200);
        }
        if (isset($data['section'])) {
            $validator->maxLength('section', 50);
        }
        if (isset($data['max_students'])) {
            $validator->numeric('max_students');
        }

        if ($validator->fails()) {
            Response::validationError($validator->getErrors());
            return;
        }

        $success = $this->repo->update($id, $data);

        if ($success) {
            Response::success(['message' => 'Class updated successfully']);
        } else {
            Response::serverError('Failed to update class');
        }
    }

    /**
     * Delete a class
     */
    public function delete(array $user, int $id): void
    {
        $roleMiddleware = new RoleMiddleware($user);

        if (!$roleMiddleware->requireRole(['admin', 'super_admin'])) {
            return;
        }

        $class = $this->repo->findById($id);

        if (!$class) {
            Response::notFound('Class not found');
            return;
        }

        // Check authorization
        if ($user['role'] !== 'super_admin' && $class['institution_id'] != $user['institution_id']) {
            Response::forbidden('You do not have access to delete this class');
            return;
        }

        $success = $this->repo->delete($id);

        if ($success) {
            Response::success(['message' => 'Class deleted successfully']);
        } else {
            Response::serverError('Failed to delete class');
        }
    }

    /**
     * Get students in a class
     */
    public function getStudents(array $user, int $id): void
    {
        $class = $this->repo->findById($id);

        if (!$class) {
            Response::notFound('Class not found');
            return;
        }

        // Check authorization
        if ($user['role'] !== 'super_admin' && $class['institution_id'] != $user['institution_id']) {
            Response::forbidden('You do not have access to this class');
            return;
        }

        $students = $this->repo->getClassStudents($id);

        Response::success(['data' => $students]);
    }

    /**
     * Get class subjects for a class
     */
    public function getClassSubjects(array $user, int $id): void
    {
        $class = $this->repo->findById($id);

        if (!$class) {
            Response::notFound('Class not found');
            return;
        }

        // Check authorization
        if ($user['role'] !== 'super_admin' && $class['institution_id'] != $user['institution_id']) {
            Response::forbidden('You do not have access to this class');
            return;
        }

        $classSubjects = $this->repo->getClassSubjects($id);

        Response::success(['data' => $classSubjects]);
    }

    /**
     * Assign homeroom teacher to class
     */
    public function assignTeacher(array $user, int $id): void
    {
        $roleMiddleware = new RoleMiddleware($user);

        if (!$roleMiddleware->requireRole(['admin', 'super_admin'])) {
            return;
        }

        $class = $this->repo->findById($id);

        if (!$class) {
            Response::notFound('Class not found');
            return;
        }

        // Check authorization
        if ($user['role'] !== 'super_admin' && $class['institution_id'] != $user['institution_id']) {
            Response::forbidden('You do not have access to update this class');
            return;
        }

        $data = json_decode(file_get_contents('php://input'), true);

        $validator = new Validator($data);
        $validator->required(['teacher_id'])->numeric('teacher_id');

        if ($validator->fails()) {
            Response::validationError($validator->getErrors());
            return;
        }

        $success = $this->repo->assignTeacher($id, $data['teacher_id']);

        if ($success) {
            Response::success(['message' => 'Class teacher assigned successfully']);
        } else {
            Response::serverError('Failed to assign class teacher');
        }
    }

    /**
     * Get class schedule/timetable
     */
    public function getSchedule(array $user, int $id): void
    {
        $class = $this->repo->findById($id);

        if (!$class) {
            Response::notFound('Class not found');
            return;
        }

        // Check authorization
        if ($user['role'] !== 'super_admin' && $class['institution_id'] != $user['institution_id']) {
            Response::forbidden('You do not have access to this class');
            return;
        }

        $schedule = $this->repo->getClassSchedule($id);

        Response::success(['data' => $schedule]);
    }
}
