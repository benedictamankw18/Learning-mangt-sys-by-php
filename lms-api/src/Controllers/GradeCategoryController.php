<?php

namespace App\Controllers;

use App\Middleware\RoleMiddleware;
use App\Repositories\GradeCategoryRepository;
use App\Utils\Response;
use App\Utils\Validator;

class GradeCategoryController
{
    private GradeCategoryRepository $repo;

    public function __construct()
    {
        $this->repo = new GradeCategoryRepository();
    }

    public function index(array $user): void
    {
        $institutionId = $user['role'] === 'super_admin' ? null : (int) ($user['institution_id'] ?? 0);
        $rows = $this->repo->getAll($institutionId > 0 ? $institutionId : null);
        Response::success($rows);
    }

    public function show(array $user, int $id): void
    {
        $institutionId = $user['role'] === 'super_admin' ? null : (int) ($user['institution_id'] ?? 0);
        $row = $this->repo->findById($id, $institutionId > 0 ? $institutionId : null);

        if (!$row) {
            Response::notFound('Grade category not found');
            return;
        }

        Response::success($row);
    }

    public function create(array $user): void
    {
        $roleMiddleware = new RoleMiddleware($user);
        if (!$roleMiddleware->requireRole(['admin', 'super_admin'])) {
            return;
        }

        $data = json_decode(file_get_contents('php://input'), true);
        $validator = new Validator($data);
        $validator->required(['grade_categories_name'])->maxLength('grade_categories_name', 50);

        if (isset($data['grade_categories_description'])) {
            $validator->maxLength('grade_categories_description', 255);
        }
        if (isset($data['Pass_Threshold'])) {
            $validator->numeric('Pass_Threshold');
        }
        if (isset($data['Used_By'])) {
            $validator->maxLength('Used_By', 50);
        }
        if (isset($data['status'])) {
            $validator->maxLength('status', 50);
        }

        if ($validator->fails()) {
            Response::validationError($validator->getErrors());
            return;
        }

        if ($user['role'] !== 'super_admin') {
            $data['institution_id'] = (int) $user['institution_id'];
        }

        if (empty($data['institution_id'])) {
            Response::badRequest('institution_id is required');
            return;
        }

        $id = $this->repo->create($data);
        if (!$id) {
            Response::serverError('Failed to create grade category');
            return;
        }

        Response::success(['grade_categories_id' => $id, 'message' => 'Grade category created successfully'], 201);
    }

    public function update(array $user, int $id): void
    {
        $roleMiddleware = new RoleMiddleware($user);
        if (!$roleMiddleware->requireRole(['admin', 'super_admin'])) {
            return;
        }

        $institutionId = $user['role'] === 'super_admin' ? null : (int) ($user['institution_id'] ?? 0);
        $row = $this->repo->findById($id, $institutionId > 0 ? $institutionId : null);

        if (!$row) {
            Response::notFound('Grade category not found');
            return;
        }

        $data = json_decode(file_get_contents('php://input'), true);

        $validator = new Validator($data ?? []);
        if (isset($data['grade_categories_name'])) {
            $validator->maxLength('grade_categories_name', 50);
        }
        if (isset($data['grade_categories_description'])) {
            $validator->maxLength('grade_categories_description', 255);
        }
        if (isset($data['Pass_Threshold'])) {
            $validator->numeric('Pass_Threshold');
        }
        if (isset($data['Used_By'])) {
            $validator->maxLength('Used_By', 50);
        }
        if (isset($data['status'])) {
            $validator->maxLength('status', 50);
        }

        if ($validator->fails()) {
            Response::validationError($validator->getErrors());
            return;
        }

        if (!$this->repo->update($id, $data ?? [])) {
            Response::serverError('Failed to update grade category');
            return;
        }

        Response::success(['message' => 'Grade category updated successfully']);
    }

    public function delete(array $user, int $id): void
    {
        $roleMiddleware = new RoleMiddleware($user);
        if (!$roleMiddleware->requireRole(['admin', 'super_admin'])) {
            return;
        }

        $institutionId = $user['role'] === 'super_admin' ? null : (int) ($user['institution_id'] ?? 0);
        $row = $this->repo->findById($id, $institutionId > 0 ? $institutionId : null);

        if (!$row) {
            Response::notFound('Grade category not found');
            return;
        }

        if (!$this->repo->delete($id, $institutionId > 0 ? $institutionId : null)) {
            Response::serverError('Failed to delete grade category');
            return;
        }

        Response::success(['message' => 'Grade category deleted successfully']);
    }
}
