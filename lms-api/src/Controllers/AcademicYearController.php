<?php

namespace App\Controllers;

use App\Utils\Response;
use App\Utils\Validator;
use App\Repositories\AcademicYearRepository;
use App\Middleware\RoleMiddleware;

class AcademicYearController
{
    private AcademicYearRepository $repo;

    public function __construct()
    {
        $this->repo = new AcademicYearRepository();
    }

    public function index(array $user): void
    {
        $page = isset($_GET['page']) ? (int) $_GET['page'] : 1;
        $limit = isset($_GET['limit']) ? (int) $_GET['limit'] : 20;
        $institutionId = ($user['role'] ?? '') !== 'super_admin' ? (int) ($user['institution_id'] ?? 0) : null;

        $years = $this->repo->getAll($page, $limit, $institutionId);
        $total = $this->repo->count($institutionId);

        Response::success([
            'data' => $years,
            'pagination' => [
                'current_page' => $page,
                'per_page' => $limit,
                'total' => $total,
                'total_pages' => ceil($total / $limit)
            ]
        ]);
    }

    public function show(array $user, int $id): void
    {
        $institutionId = ($user['role'] ?? '') !== 'super_admin' ? (int) ($user['institution_id'] ?? 0) : null;
        $year = $this->repo->findById($id, $institutionId);

        if (!$year) {
            Response::notFound('Academic year not found');
            return;
        }

        Response::success($year);
    }

    public function create(array $user): void
    {
        $roleMiddleware = new RoleMiddleware($user);

        if (!$roleMiddleware->requireRole('admin')) {
            return;
        }

        $data = json_decode((string) file_get_contents('php://input'), true);
        if (!is_array($data)) {
            Response::error('Invalid JSON payload', 400);
            return;
        }

        $validator = new Validator($data);
        $validator->required(['year_name', 'start_date', 'end_date'])
            ->maxLength('year_name', 20)
            ->date('start_date')
            ->date('end_date');

        if ($validator->fails()) {
            Response::validationError($validator->getErrors());
            return;
        }

        $startDate = (string) $data['start_date'];
        $endDate = (string) $data['end_date'];
        if ($startDate >= $endDate) {
            Response::error('end_date must be after start_date', 422);
            return;
        }

        // Add institution_id for multi-tenant support
        if ($user['role'] !== 'super_admin') {
            $data['institution_id'] = (int) ($user['institution_id'] ?? 0);
            if ($data['institution_id'] <= 0) {
                Response::error('Missing institution context', 400);
                return;
            }
        } elseif (empty($data['institution_id'])) {
            Response::error('institution_id is required for super admin', 400);
            return;
        }

        $institutionId = (int) $data['institution_id'];
        $yearName = trim((string) $data['year_name']);
        if ($this->repo->existsByYearName($yearName, $institutionId)) {
            Response::error('Academic year already exists for this institution', 409);
            return;
        }

        $yearId = $this->repo->create($data);

        if ($yearId !== null) {
            Response::success([
                'message' => 'Academic year created successfully',
                'academic_year_id' => $yearId
            ], 201);
        } else {
            Response::serverError('Failed to create academic year');
        }
    }

    public function update(array $user, int $id): void
    {
        $roleMiddleware = new RoleMiddleware($user);

        if (!$roleMiddleware->requireRole('admin')) {
            return;
        }

        $institutionId = ($user['role'] ?? '') !== 'super_admin' ? (int) ($user['institution_id'] ?? 0) : null;
        $year = $this->repo->findById($id, $institutionId);

        if (!$year) {
            Response::notFound('Academic year not found');
            return;
        }

        $data = json_decode((string) file_get_contents('php://input'), true);
        if (!is_array($data)) {
            Response::error('Invalid JSON payload', 400);
            return;
        }

        if (array_key_exists('is_current', $data)) {
            $requestedIsCurrent = !empty($data['is_current']) ? 1 : 0;
            $existingIsCurrent = ((int) ($year['is_current'] ?? 0)) === 1;

            if ($existingIsCurrent && $requestedIsCurrent === 0) {
                Response::error('Cannot unset current academic year directly. Set another year as current instead.', 422);
                return;
            }
        }

        $validator = new Validator($data);
        if (isset($data['year_name'])) {
            $validator->maxLength('year_name', 20);
        }
        if (isset($data['start_date'])) {
            $validator->date('start_date');
        }
        if (isset($data['end_date'])) {
            $validator->date('end_date');
        }

        if ($validator->fails()) {
            Response::validationError($validator->getErrors());
            return;
        }

        $startDate = isset($data['start_date'])
            ? (string) $data['start_date']
            : (string) ($year['start_date'] ?? '');
        $endDate = isset($data['end_date'])
            ? (string) $data['end_date']
            : (string) ($year['end_date'] ?? '');

        if ($startDate !== '' && $endDate !== '' && $startDate >= $endDate) {
            Response::error('end_date must be after start_date', 422);
            return;
        }

        $targetInstitutionId = ($user['role'] ?? '') !== 'super_admin'
            ? (int) ($year['institution_id'] ?? 0)
            : (int) ($data['institution_id'] ?? ($year['institution_id'] ?? 0));

        if (isset($data['year_name']) && $targetInstitutionId > 0) {
            $yearName = trim((string) $data['year_name']);
            if ($this->repo->existsByYearName($yearName, $targetInstitutionId, $id)) {
                Response::error('Academic year already exists for this institution', 409);
                return;
            }
        }

        if ($this->repo->update($id, $data)) {
            Response::success(['message' => 'Academic year updated successfully']);
        } else {
            Response::serverError('Failed to update academic year');
        }
    }

    public function delete(array $user, int $id): void
    {
        $roleMiddleware = new RoleMiddleware($user);

        if (!$roleMiddleware->requireRole('admin')) {
            return;
        }

        $institutionId = ($user['role'] ?? '') !== 'super_admin' ? (int) ($user['institution_id'] ?? 0) : null;
        $year = $this->repo->findById($id, $institutionId);

        if (!$year) {
            Response::notFound('Academic year not found');
            return;
        }

        if ($year['is_current'] == 1 || $year['is_current'] === '1') {
            Response::error('Cannot delete current academic year. Please set another year as current first.', 409);
            return;
        }

        if ($this->repo->delete($id)) {
            Response::success(['message' => 'Academic year deleted successfully']);
        } else {
            Response::serverError('Failed to delete academic year');
        }
    }

    public function getCurrent(array $user): void
    {
        $institutionId = ($user['role'] ?? '') !== 'super_admin' ? (int) ($user['institution_id'] ?? 0) : null;
        $year = $this->repo->getCurrent($institutionId);

        if (!$year) {
            Response::notFound('No current academic year set');
            return;
        }

        Response::success($year);
    }
}
