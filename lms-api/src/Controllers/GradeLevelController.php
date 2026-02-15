<?php

namespace App\Controllers;

use App\Utils\Response;
use App\Utils\Validator;
use App\Repositories\GradeLevelRepository;
use App\Middleware\RoleMiddleware;

class GradeLevelController
{
    private GradeLevelRepository $repo;

    public function __construct()
    {
        $this->repo = new GradeLevelRepository();
    }

    /**
     * Get all grade levels (with pagination)
     */
    public function index(array $user): void
    {
        $page = isset($_GET['page']) ? (int) $_GET['page'] : 1;
        $limit = isset($_GET['limit']) ? (int) $_GET['limit'] : 20;
        $institutionId = isset($_GET['institution_id']) ? (int) $_GET['institution_id'] : null;

        // Super admin can view all institutions' grade levels
        if ($user['role'] !== 'super_admin' && !$institutionId) {
            $institutionId = $user['institution_id'];
        }

        $gradeLevels = $this->repo->getAll($page, $limit, $institutionId);
        $total = $this->repo->count($institutionId);

        Response::success([
            'data' => $gradeLevels,
            'pagination' => [
                'current_page' => $page,
                'per_page' => $limit,
                'total' => $total,
                'total_pages' => ceil($total / $limit)
            ]
        ]);
    }

    /**
     * Get active grade levels only (ordered by level_order)
     */
    public function getActiveGradeLevels(array $user): void
    {
        $institutionId = $user['role'] === 'super_admin' && isset($_GET['institution_id'])
            ? (int) $_GET['institution_id']
            : $user['institution_id'];

        $gradeLevels = $this->repo->getActiveGradeLevels($institutionId);

        Response::success(['data' => $gradeLevels]);
    }

    /**
     * Get a single grade level by ID
     */
    public function show(array $user, int $id): void
    {
        $gradeLevel = $this->repo->findById($id);

        if (!$gradeLevel) {
            Response::notFound('Grade level not found');
            return;
        }

        // Check authorization
        if ($user['role'] !== 'super_admin' && $gradeLevel['institution_id'] != $user['institution_id']) {
            Response::forbidden('You do not have access to this grade level');
            return;
        }

        Response::success($gradeLevel);
    }

    /**
     * Create a new grade level
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
        $validator->required(['institution_id', 'grade_level_code', 'grade_level_name', 'level_order'])
            ->maxLength('grade_level_code', 20)
            ->maxLength('grade_level_name', 50)
            ->numeric('level_order');

        if ($validator->fails()) {
            Response::validationError($validator->getErrors());
            return;
        }

        $gradeLevelId = $this->repo->create($data);

        if ($gradeLevelId) {
            Response::success([
                'message' => 'Grade level created successfully',
                'grade_level_id' => $gradeLevelId
            ], 201);
        } else {
            Response::serverError('Failed to create grade level');
        }
    }

    /**
     * Update an existing grade level
     */
    public function update(array $user, int $id): void
    {
        $roleMiddleware = new RoleMiddleware($user);

        if (!$roleMiddleware->requireRole(['admin', 'super_admin'])) {
            return;
        }

        $gradeLevel = $this->repo->findById($id);

        if (!$gradeLevel) {
            Response::notFound('Grade level not found');
            return;
        }

        // Check authorization
        if ($user['role'] !== 'super_admin' && $gradeLevel['institution_id'] != $user['institution_id']) {
            Response::forbidden('You do not have access to update this grade level');
            return;
        }

        $data = json_decode(file_get_contents('php://input'), true);

        $validator = new Validator($data);
        if (isset($data['grade_level_code'])) {
            $validator->maxLength('grade_level_code', 20);
        }
        if (isset($data['grade_level_name'])) {
            $validator->maxLength('grade_level_name', 50);
        }
        if (isset($data['level_order'])) {
            $validator->numeric('level_order');
        }

        if ($validator->fails()) {
            Response::validationError($validator->getErrors());
            return;
        }

        $success = $this->repo->update($id, $data);

        if ($success) {
            Response::success(['message' => 'Grade level updated successfully']);
        } else {
            Response::serverError('Failed to update grade level');
        }
    }

    /**
     * Delete a grade level
     */
    public function delete(array $user, int $id): void
    {
        $roleMiddleware = new RoleMiddleware($user);

        if (!$roleMiddleware->requireRole(['admin', 'super_admin'])) {
            return;
        }

        $gradeLevel = $this->repo->findById($id);

        if (!$gradeLevel) {
            Response::notFound('Grade level not found');
            return;
        }

        // Check authorization
        if ($user['role'] !== 'super_admin' && $gradeLevel['institution_id'] != $user['institution_id']) {
            Response::forbidden('You do not have access to delete this grade level');
            return;
        }

        $success = $this->repo->delete($id);

        if ($success) {
            Response::success(['message' => 'Grade level deleted successfully']);
        } else {
            Response::serverError('Failed to delete grade level');
        }
    }

    /**
     * Get classes for a specific grade level
     */
    public function getClasses(array $user, int $id): void
    {
        $gradeLevel = $this->repo->findById($id);

        if (!$gradeLevel) {
            Response::notFound('Grade level not found');
            return;
        }

        // Check authorization
        if ($user['role'] !== 'super_admin' && $gradeLevel['institution_id'] != $user['institution_id']) {
            Response::forbidden('You do not have access to this grade level');
            return;
        }

        $classes = $this->repo->getGradeLevelClasses($id);

        Response::success(['data' => $classes]);
    }
}
