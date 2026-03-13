<?php

namespace App\Controllers;

use App\Utils\Response;
use App\Utils\Validator;
use App\Utils\UuidHelper;
use App\Repositories\ClassRepository;
use App\Middleware\RoleMiddleware;
use App\Middleware\AuthorizationMiddleware;

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
        $status = isset($_GET['status']) && in_array($_GET['status'], ['active', 'inactive'], true) ? $_GET['status'] : null;
        $search = isset($_GET['search']) ? trim($_GET['search']) : null;
        if ($search === '') $search = null;

        // Super admin can view all institutions' classes
        if ($user['role'] !== 'super_admin' && !$institutionId) {
            $institutionId = $user['institution_id'];
        }

        $classes = $this->repo->getAll($page, $limit, $institutionId, $programId, $gradeLevelId, $status, $search);
        $stats   = $this->repo->getStats($institutionId, $programId, $gradeLevelId, $status, $search);

        Response::success([
            'data' => $classes,
            'pagination' => [
                'current_page'   => $page,
                'per_page'       => $limit,
                'total'          => $stats['total'],
                'total_pages'    => ceil($stats['total'] / $limit),
                'active_count'   => $stats['active_count'],
                'inactive_count' => $stats['inactive_count'],
                'total_students' => $stats['total_students'],
            ]
        ]);
    }

    /**
     * Get a single class by UUID
     */
    public function show(array $user, string $uuid): void
    {
        $sanitizedUuid = UuidHelper::sanitize($uuid);
        if (!$sanitizedUuid) {
            Response::badRequest('Invalid UUID format');
            return;
        }

        $class = $this->repo->findByUuid($sanitizedUuid);

        if (!$class) {
            Response::notFound('Class not found');
            return;
        }

        // Check authorization
        $authz = new AuthorizationMiddleware($user);
        if (!$authz->requireInstitutionAccess($class, 'You do not have access to this class')) {
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

        try {
            $classId = $this->repo->create($data);

            if ($classId) {
                Response::success([
                    'message' => 'Class created successfully',
                    'class_id' => $classId
                ], 201);
            } else {
                Response::serverError('Failed to create class');
            }
        } catch (\PDOException $e) {
            if (strpos($e->getMessage(), '1062') !== false) {
                if (strpos($e->getMessage(), 'unique_class_composition') !== false) {
                    Response::error(
                        'A class with section "' . ($data['section'] ?? '') . '" already exists for the selected program, grade level, and academic year.',
                        409
                    );
                } else {
                    // unique_class_code_institution or any other unique key
                    Response::error(
                        'A class with code "' . ($data['class_code'] ?? '') . '" already exists in this institution.',
                        409
                    );
                }
            } else {
                error_log('Class create error: ' . $e->getMessage());
                Response::serverError('Failed to create class');
            }
        }
    }

    /**
     * Update an existing class
     */
    public function update(array $user, string $uuid): void
    {
        $sanitizedUuid = UuidHelper::sanitize($uuid);
        if (!$sanitizedUuid) {
            Response::badRequest('Invalid UUID format');
            return;
        }

        $roleMiddleware = new RoleMiddleware($user);

        if (!$roleMiddleware->requireRole(['admin', 'super_admin'])) {
            return;
        }

        $class = $this->repo->findByUuid($sanitizedUuid);

        if (!$class) {
            Response::notFound('Class not found');
            return;
        }

        $classId = $class['class_id'];

        // Check authorization
        $authz = new AuthorizationMiddleware($user);
        if (!$authz->requireInstitutionAdmin($class, 'You do not have access to update this class')) {
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

        $success = $this->repo->update($classId, $data);

        if ($success) {
            Response::success(['message' => 'Class updated successfully']);
        } else {
            Response::serverError('Failed to update class');
        }
    }

    /**
     * Delete a class
     */
    public function delete(array $user, string $uuid): void
    {
        $sanitizedUuid = UuidHelper::sanitize($uuid);
        if (!$sanitizedUuid) {
            Response::badRequest('Invalid UUID format');
            return;
        }

        $roleMiddleware = new RoleMiddleware($user);

        if (!$roleMiddleware->requireRole(['admin', 'super_admin'])) {
            return;
        }

        $class = $this->repo->findByUuid($sanitizedUuid);

        if (!$class) {
            Response::notFound('Class not found');
            return;
        }

        $classId = $class['class_id'];

        // Check authorization
        $authz = new AuthorizationMiddleware($user);
        if (!$authz->requireInstitutionAdmin($class, 'You do not have access to delete this class')) {
            return;
        }

        $success = $this->repo->delete($classId);

        if ($success) {
            Response::success(['message' => 'Class deleted successfully']);
        } else {
            Response::serverError('Failed to delete class');
        }
    }

    /**
     * Get students in a class
     */
    public function getStudents(array $user, string $uuid): void
    {
        $sanitizedUuid = UuidHelper::sanitize($uuid);
        if (!$sanitizedUuid) {
            Response::badRequest('Invalid UUID format');
            return;
        }

        $class = $this->repo->findByUuid($sanitizedUuid);

        if (!$class) {
            Response::notFound('Class not found');
            return;
        }

        $classId = $class['class_id'];

        // Check authorization
        $authz = new AuthorizationMiddleware($user);
        if (!$authz->requireInstitutionAccess($class, 'You do not have access to this class')) {
            return;
        }

        $students = $this->repo->getClassStudents($classId);

        Response::success($students);
    }

    /**
     * Get class subjects for a class
     */
    public function getClassSubjects(array $user, string $uuid): void
    {
        $sanitizedUuid = UuidHelper::sanitize($uuid);
        if (!$sanitizedUuid) {
            Response::badRequest('Invalid UUID format');
            return;
        }

        $class = $this->repo->findByUuid($sanitizedUuid);

        if (!$class) {
            Response::notFound('Class not found');
            return;
        }

        $classId = $class['class_id'];

        // Check authorization
        $authz = new AuthorizationMiddleware($user);
        if (!$authz->requireInstitutionAccess($class, 'You do not have access to this class')) {
            return;
        }

        $classSubjects = $this->repo->getClassSubjects($classId);

        Response::success($classSubjects);
    }

    /**
     * Assign homeroom teacher to class
     */
    public function assignTeacher(array $user, string $uuid): void
    {
        $sanitizedUuid = UuidHelper::sanitize($uuid);
        if (!$sanitizedUuid) {
            Response::badRequest('Invalid UUID format');
            return;
        }

        $roleMiddleware = new RoleMiddleware($user);

        if (!$roleMiddleware->requireRole(['admin', 'super_admin'])) {
            return;
        }

        $class = $this->repo->findByUuid($sanitizedUuid);

        if (!$class) {
            Response::notFound('Class not found');
            return;
        }

        $classId = $class['class_id'];

        // Check authorization
        $authz = new AuthorizationMiddleware($user);
        if (!$authz->requireInstitutionAdmin($class, 'You do not have access to update this class')) {
            return;
        }

        $data = json_decode(file_get_contents('php://input'), true);

        $validator = new Validator($data);
        $validator->required(['teacher_id'])->numeric('teacher_id');

        if ($validator->fails()) {
            Response::validationError($validator->getErrors());
            return;
        }

        $success = $this->repo->assignTeacher($classId, $data['teacher_id']);

        if ($success) {
            Response::success(['message' => 'Class teacher assigned successfully']);
        } else {
            Response::serverError('Failed to assign class teacher');
        }
    }

    /**
     * Get class schedule/timetable
     */
    public function getSchedule(array $user, string $uuid): void
    {
        $sanitizedUuid = UuidHelper::sanitize($uuid);
        if (!$sanitizedUuid) {
            Response::badRequest('Invalid UUID format');
            return;
        }

        $class = $this->repo->findByUuid($sanitizedUuid);

        if (!$class) {
            Response::notFound('Class not found');
            return;
        }

        $classId = $class['class_id'];

        // Check authorization
        $authz = new AuthorizationMiddleware($user);
        if (!$authz->requireInstitutionAccess($class, 'You do not have access to this class')) {
            return;
        }

        $schedule = $this->repo->getClassSchedule($classId);

        Response::success($schedule);
    }

    /**
     * Get performance statistics for a class
     */
    public function getPerformance(array $user, string $uuid): void
    {
        $sanitizedUuid = UuidHelper::sanitize($uuid);
        if (!$sanitizedUuid) {
            Response::badRequest('Invalid UUID format');
            return;
        }

        $class = $this->repo->findByUuid($sanitizedUuid);

        if (!$class) {
            Response::notFound('Class not found');
            return;
        }

        $classId = $class['class_id'];

        // Check authorization
        $authz = new AuthorizationMiddleware($user);
        if (!$authz->requireInstitutionAccess($class, 'You do not have access to this class')) {
            return;
        }

        $performance = $this->repo->getClassPerformance($classId);

        Response::success($performance);
    }
}
