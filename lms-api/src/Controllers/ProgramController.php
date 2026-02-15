<?php

namespace App\Controllers;

use App\Utils\Response;
use App\Utils\Validator;
use App\Repositories\ProgramRepository;
use App\Middleware\RoleMiddleware;

class ProgramController
{
    private ProgramRepository $repo;

    public function __construct()
    {
        $this->repo = new ProgramRepository();
    }

    /**
     * Get all programs (with pagination)
     */
    public function index(array $user): void
    {
        $page = isset($_GET['page']) ? (int) $_GET['page'] : 1;
        $limit = isset($_GET['limit']) ? (int) $_GET['limit'] : 20;
        $institutionId = isset($_GET['institution_id']) ? (int) $_GET['institution_id'] : null;

        // Super admin can view all institutions' programs
        if ($user['role'] !== 'super_admin' && !$institutionId) {
            $institutionId = $user['institution_id'];
        }

        $programs = $this->repo->getAll($page, $limit, $institutionId);
        $total = $this->repo->count($institutionId);

        Response::success([
            'data' => $programs,
            'pagination' => [
                'current_page' => $page,
                'per_page' => $limit,
                'total' => $total,
                'total_pages' => ceil($total / $limit)
            ]
        ]);
    }

    /**
     * Get active programs only
     */
    public function getActivePrograms(array $user): void
    {
        $institutionId = $user['role'] === 'super_admin' && isset($_GET['institution_id'])
            ? (int) $_GET['institution_id']
            : $user['institution_id'];

        $programs = $this->repo->getActivePrograms($institutionId);

        Response::success(['data' => $programs]);
    }

    /**
     * Get a single program by ID
     */
    public function show(array $user, int $id): void
    {
        $program = $this->repo->findById($id);

        if (!$program) {
            Response::notFound('Program not found');
            return;
        }

        // Check authorization
        if ($user['role'] !== 'super_admin' && $program['institution_id'] != $user['institution_id']) {
            Response::forbidden('You do not have access to this program');
            return;
        }

        Response::success($program);
    }

    /**
     * Create a new program
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
        $validator->required(['institution_id', 'program_code', 'program_name'])
            ->maxLength('program_code', 20)
            ->maxLength('program_name', 100);

        if (isset($data['duration_years'])) {
            $validator->numeric('duration_years');
        }

        if ($validator->fails()) {
            Response::validationError($validator->getErrors());
            return;
        }

        $programId = $this->repo->create($data);

        if ($programId) {
            Response::success([
                'message' => 'Program created successfully',
                'program_id' => $programId
            ], 201);
        } else {
            Response::serverError('Failed to create program');
        }
    }

    /**
     * Update an existing program
     */
    public function update(array $user, int $id): void
    {
        $roleMiddleware = new RoleMiddleware($user);

        if (!$roleMiddleware->requireRole(['admin', 'super_admin'])) {
            return;
        }

        $program = $this->repo->findById($id);

        if (!$program) {
            Response::notFound('Program not found');
            return;
        }

        // Check authorization
        if ($user['role'] !== 'super_admin' && $program['institution_id'] != $user['institution_id']) {
            Response::forbidden('You do not have access to update this program');
            return;
        }

        $data = json_decode(file_get_contents('php://input'), true);

        $validator = new Validator($data);
        if (isset($data['program_code'])) {
            $validator->maxLength('program_code', 20);
        }
        if (isset($data['program_name'])) {
            $validator->maxLength('program_name', 100);
        }
        if (isset($data['duration_years'])) {
            $validator->numeric('duration_years');
        }

        if ($validator->fails()) {
            Response::validationError($validator->getErrors());
            return;
        }

        $success = $this->repo->update($id, $data);

        if ($success) {
            Response::success(['message' => 'Program updated successfully']);
        } else {
            Response::serverError('Failed to update program');
        }
    }

    /**
     * Delete a program
     */
    public function delete(array $user, int $id): void
    {
        $roleMiddleware = new RoleMiddleware($user);

        if (!$roleMiddleware->requireRole(['admin', 'super_admin'])) {
            return;
        }

        $program = $this->repo->findById($id);

        if (!$program) {
            Response::notFound('Program not found');
            return;
        }

        // Check authorization
        if ($user['role'] !== 'super_admin' && $program['institution_id'] != $user['institution_id']) {
            Response::forbidden('You do not have access to delete this program');
            return;
        }

        $success = $this->repo->delete($id);

        if ($success) {
            Response::success(['message' => 'Program deleted successfully']);
        } else {
            Response::serverError('Failed to delete program');
        }
    }

    /**
     * Get classes for a specific program
     */
    public function getClasses(array $user, int $id): void
    {
        $program = $this->repo->findById($id);

        if (!$program) {
            Response::notFound('Program not found');
            return;
        }

        // Check authorization
        if ($user['role'] !== 'super_admin' && $program['institution_id'] != $user['institution_id']) {
            Response::forbidden('You do not have access to this program');
            return;
        }

        $classes = $this->repo->getProgramClasses($id);

        Response::success(['data' => $classes]);
    }
}
