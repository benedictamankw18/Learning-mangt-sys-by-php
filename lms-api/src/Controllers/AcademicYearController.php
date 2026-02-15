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

        $years = $this->repo->getAll($page, $limit);
        $total = $this->repo->count();

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
        $year = $this->repo->findById($id);

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

        $data = json_decode(file_get_contents('php://input'), true);

        $validator = new Validator($data);
        $validator->required(['year_name', 'start_date', 'end_date'])
            ->maxLength('year_name', 20)
            ->date('start_date')
            ->date('end_date');

        if ($validator->fails()) {
            Response::validationError($validator->getErrors());
            return;
        }

        $yearId = $this->repo->create($data);

        if ($yearId) {
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

        $year = $this->repo->findById($id);

        if (!$year) {
            Response::notFound('Academic year not found');
            return;
        }

        $data = json_decode(file_get_contents('php://input'), true);

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

        $year = $this->repo->findById($id);

        if (!$year) {
            Response::notFound('Academic year not found');
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
        $year = $this->repo->getCurrent();

        if (!$year) {
            Response::notFound('No current academic year set');
            return;
        }

        Response::success($year);
    }
}
