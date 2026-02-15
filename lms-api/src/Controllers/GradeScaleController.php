<?php

namespace App\Controllers;

use App\Utils\Response;
use App\Utils\Validator;
use App\Repositories\GradeScaleRepository;
use App\Middleware\RoleMiddleware;

class GradeScaleController
{
    private GradeScaleRepository $repo;

    public function __construct()
    {
        $this->repo = new GradeScaleRepository();
    }

    public function index(array $user): void
    {
        $scales = $this->repo->getAll();
        Response::success($scales);
    }

    public function show(array $user, int $id): void
    {
        $scale = $this->repo->findById($id);

        if (!$scale) {
            Response::notFound('Grade scale not found');
            return;
        }

        Response::success($scale);
    }

    public function create(array $user): void
    {
        $roleMiddleware = new RoleMiddleware($user);

        if (!$roleMiddleware->requireRole('admin')) {
            return;
        }

        $data = json_decode(file_get_contents('php://input'), true);

        $validator = new Validator($data);
        $validator->required(['grade', 'min_score', 'max_score'])
            ->maxLength('grade', 2)
            ->numeric('min_score')
            ->numeric('max_score');

        if (isset($data['grade_point'])) {
            $validator->numeric('grade_point');
        }

        if ($validator->fails()) {
            Response::validationError($validator->getErrors());
            return;
        }

        $scaleId = $this->repo->create($data);

        if ($scaleId) {
            Response::success([
                'message' => 'Grade scale created successfully',
                'grade_scale_id' => $scaleId
            ], 201);
        } else {
            Response::serverError('Failed to create grade scale');
        }
    }

    public function update(array $user, int $id): void
    {
        $roleMiddleware = new RoleMiddleware($user);

        if (!$roleMiddleware->requireRole('admin')) {
            return;
        }

        $scale = $this->repo->findById($id);

        if (!$scale) {
            Response::notFound('Grade scale not found');
            return;
        }

        $data = json_decode(file_get_contents('php://input'), true);

        $validator = new Validator($data);
        if (isset($data['grade'])) {
            $validator->maxLength('grade', 2);
        }
        if (isset($data['min_score'])) {
            $validator->numeric('min_score');
        }
        if (isset($data['max_score'])) {
            $validator->numeric('max_score');
        }
        if (isset($data['grade_point'])) {
            $validator->numeric('grade_point');
        }

        if ($validator->fails()) {
            Response::validationError($validator->getErrors());
            return;
        }

        if ($this->repo->update($id, $data)) {
            Response::success(['message' => 'Grade scale updated successfully']);
        } else {
            Response::serverError('Failed to update grade scale');
        }
    }

    public function delete(array $user, int $id): void
    {
        $roleMiddleware = new RoleMiddleware($user);

        if (!$roleMiddleware->requireRole('admin')) {
            return;
        }

        $scale = $this->repo->findById($id);

        if (!$scale) {
            Response::notFound('Grade scale not found');
            return;
        }

        if ($this->repo->delete($id)) {
            Response::success(['message' => 'Grade scale deleted successfully']);
        } else {
            Response::serverError('Failed to delete grade scale');
        }
    }
}
