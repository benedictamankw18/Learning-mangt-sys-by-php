<?php

namespace App\Controllers;

use App\Utils\Response;
use App\Utils\Validator;
use App\Repositories\SemesterRepository;
use App\Middleware\RoleMiddleware;

class SemesterController
{
    private SemesterRepository $repo;

    public function __construct()
    {
        $this->repo = new SemesterRepository();
    }

    public function index(array $user): void
    {
        $page = isset($_GET['page']) ? (int) $_GET['page'] : 1;
        $limit = isset($_GET['limit']) ? (int) $_GET['limit'] : 20;
        $academicYearId = isset($_GET['academic_year_id']) ? (int) $_GET['academic_year_id'] : null;

        $semesters = $this->repo->getAll($page, $limit, $academicYearId);
        $total = $this->repo->count($academicYearId);

        Response::success([
            'data' => $semesters,
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
        $semester = $this->repo->findById($id);

        if (!$semester) {
            Response::notFound('Semester not found');
            return;
        }

        Response::success($semester);
    }

    public function create(array $user): void
    {
        $roleMiddleware = new RoleMiddleware($user);

        if (!$roleMiddleware->requireRole('admin')) {
            return;
        }

        $data = json_decode(file_get_contents('php://input'), true);

        $validator = new Validator($data);
        $validator->required(['academic_year_id', 'semester_name', 'start_date', 'end_date'])
            ->numeric('academic_year_id')
            ->maxLength('semester_name', 20)
            ->date('start_date')
            ->date('end_date');

        if ($validator->fails()) {
            Response::validationError($validator->getErrors());
            return;
        }

        $semesterId = $this->repo->create($data);

        if ($semesterId) {
            Response::success([
                'message' => 'Semester created successfully',
                'semester_id' => $semesterId
            ], 201);
        } else {
            Response::serverError('Failed to create semester');
        }
    }

    public function update(array $user, int $id): void
    {
        $roleMiddleware = new RoleMiddleware($user);

        if (!$roleMiddleware->requireRole('admin')) {
            return;
        }

        $semester = $this->repo->findById($id);

        if (!$semester) {
            Response::notFound('Semester not found');
            return;
        }

        $data = json_decode(file_get_contents('php://input'), true);

        $validator = new Validator($data);
        if (isset($data['academic_year_id'])) {
            $validator->numeric('academic_year_id');
        }
        if (isset($data['semester_name'])) {
            $validator->maxLength('semester_name', 20);
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
            Response::success(['message' => 'Semester updated successfully']);
        } else {
            Response::serverError('Failed to update semester');
        }
    }

    public function delete(array $user, int $id): void
    {
        $roleMiddleware = new RoleMiddleware($user);

        if (!$roleMiddleware->requireRole('admin')) {
            return;
        }

        $semester = $this->repo->findById($id);

        if (!$semester) {
            Response::notFound('Semester not found');
            return;
        }

        if ($this->repo->delete($id)) {
            Response::success(['message' => 'Semester deleted successfully']);
        } else {
            Response::serverError('Failed to delete semester');
        }
    }

    public function getCurrent(array $user): void
    {
        $semester = $this->repo->getCurrent();

        if (!$semester) {
            Response::notFound('No current semester set');
            return;
        }

        Response::success($semester);
    }
}
