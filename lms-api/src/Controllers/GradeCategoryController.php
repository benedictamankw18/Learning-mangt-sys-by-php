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
        if (!is_array($data)) {
            $data = [];
        }

        if (array_key_exists('set_as_primary', $data)) {
            $data['set_as_primary'] = $this->normalizePrimaryInput($data['set_as_primary']);
        }

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

        $status = strtolower(trim((string) ($data['status'] ?? 'active')));
        $setAsPrimary = (int) ($data['set_as_primary'] ?? 0);
        if ($this->isInvalidPrimaryStatusCombination($status, $setAsPrimary)) {
            Response::badRequest('Primary category must be active. Inactive categories cannot be set as primary.');
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
        if (!is_array($data)) {
            $data = [];
        }

        if (array_key_exists('set_as_primary', $data)) {
            $data['set_as_primary'] = $this->normalizePrimaryInput($data['set_as_primary']);
        }

        $validator = new Validator($data);
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

        $nextStatus = array_key_exists('status', $data)
            ? strtolower(trim((string) $data['status']))
            : strtolower(trim((string) ($row['status'] ?? 'active')));
        $nextPrimary = array_key_exists('set_as_primary', $data)
            ? (int) $data['set_as_primary']
            : (int) ($row['set_as_primary'] ?? 0);

        if ($this->isInvalidPrimaryStatusCombination($nextStatus, $nextPrimary)) {
            Response::badRequest('Primary category must be active. Inactive categories cannot be set as primary.');
            return;
        }

        if (!$this->repo->update($id, $data)) {
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

    private function normalizePrimaryInput($value): int
    {
        if (is_bool($value)) {
            return $value ? 1 : 0;
        }

        if (is_numeric($value)) {
            return ((int) $value) === 1 ? 1 : 0;
        }

        $text = strtolower(trim((string) $value));
        return in_array($text, ['1', 'true', 'yes', 'on'], true) ? 1 : 0;
    }

    private function isInvalidPrimaryStatusCombination(string $status, int $setAsPrimary): bool
    {
        return $setAsPrimary === 1 && $status === 'inactive';
    }
}
