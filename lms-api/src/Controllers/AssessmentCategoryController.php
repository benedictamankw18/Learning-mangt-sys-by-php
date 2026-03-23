<?php

namespace App\Controllers;

use App\Utils\Response;
use App\Utils\Validator;
use App\Repositories\AssessmentCategoryRepository;
use App\Middleware\RoleMiddleware;

class AssessmentCategoryController
{
    private AssessmentCategoryRepository $repo;

    public function __construct()
    {
        $this->repo = new AssessmentCategoryRepository();
    }

    private function resolveInstitutionId(array $user): int
    {
        return isset($user['institution_id']) ? (int) $user['institution_id'] : 0;
    }

    public function index(array $user): void
    {
        $page = isset($_GET['page']) ? (int) $_GET['page'] : 1;
        $limit = isset($_GET['limit']) ? (int) $_GET['limit'] : 20;

        $institutionId = $this->resolveInstitutionId($user);
        if ($institutionId <= 0) {
            Response::forbidden('Institution scope is required');
            return;
        }

        $categories = $this->repo->getAll($institutionId, $page, $limit);
        $total = $this->repo->count($institutionId);

        Response::success([
            'data' => $categories,
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
        $institutionId = $this->resolveInstitutionId($user);
        if ($institutionId <= 0) {
            Response::forbidden('Institution scope is required');
            return;
        }

        $category = $this->repo->findById($id, $institutionId);

        if (!$category) {
            Response::notFound('Assessment category not found');
            return;
        }

        Response::success($category);
    }

    public function create(array $user): void
    {
        $roleMiddleware = new RoleMiddleware($user);

        if (!$roleMiddleware->hasRole(['admin', 'teacher'])) {
            Response::forbidden('Only admins and teachers can create assessment categories');
            return;
        }

        $data = json_decode(file_get_contents('php://input'), true);

        $validator = new Validator($data);
        $validator->required(['category_name'])
            ->maxLength('category_name', 100);

        if (isset($data['weight_percentage'])) {
            $validator->numeric('weight_percentage');
        }

        if ($validator->fails()) {
            Response::validationError($validator->getErrors());
            return;
        }

        if (isset($data['weight_percentage']) && (float) $data['weight_percentage'] < 1) {
            Response::validationError([
                'weight_percentage' => ['Weight percentage must be 1 or greater']
            ]);
            return;
        }

        if (isset($data['weight_percentage']) && (float) $data['weight_percentage'] > 100) {
            Response::validationError([
                'weight_percentage' => ['Weight percentage must be 100 or less']
            ]);
            return;
        }

        $institutionId = $this->resolveInstitutionId($user);
        if ($institutionId <= 0) {
            Response::forbidden('Institution scope is required');
            return;
        }

        $categoryId = $this->repo->create($data, $institutionId);

        if ($categoryId) {
            Response::success([
                'message' => 'Assessment category created successfully',
                'category_id' => $categoryId
            ], 201);
        } else {
            Response::serverError('Failed to create assessment category');
        }
    }

    public function update(array $user, int $id): void
    {
        $roleMiddleware = new RoleMiddleware($user);

        if (!$roleMiddleware->hasRole(['admin', 'teacher'])) {
            Response::forbidden('Only admins and teachers can update assessment categories');
            return;
        }

        $institutionId = $this->resolveInstitutionId($user);
        if ($institutionId <= 0) {
            Response::forbidden('Institution scope is required');
            return;
        }

        $category = $this->repo->findById($id, $institutionId);

        if (!$category) {
            Response::notFound('Assessment category not found');
            return;
        }

        $data = json_decode(file_get_contents('php://input'), true);

        $validator = new Validator($data);
        if (isset($data['category_name'])) {
            $validator->maxLength('category_name', 100);
        }
        if (isset($data['weight_percentage'])) {
            $validator->numeric('weight_percentage');
        }

        if ($validator->fails()) {
            Response::validationError($validator->getErrors());
            return;
        }

        if (isset($data['weight_percentage']) && (float) $data['weight_percentage'] < 1) {
            Response::validationError([
                'weight_percentage' => ['Weight percentage must be 1 or greater']
            ]);
            return;
        }

        if (isset($data['weight_percentage']) && (float) $data['weight_percentage'] > 100) {
            Response::validationError([
                'weight_percentage' => ['Weight percentage must be 100 or less']
            ]);
            return;
        }

        if ($this->repo->update($id, $data, $institutionId)) {
            Response::success(['message' => 'Assessment category updated successfully']);
        } else {
            Response::serverError('Failed to update assessment category');
        }
    }

    public function delete(array $user, int $id): void
    {
        $roleMiddleware = new RoleMiddleware($user);

        if (!$roleMiddleware->requireRole('admin')) {
            return;
        }

        $institutionId = $this->resolveInstitutionId($user);
        if ($institutionId <= 0) {
            Response::forbidden('Institution scope is required');
            return;
        }

        $category = $this->repo->findById($id, $institutionId);

        if (!$category) {
            Response::notFound('Assessment category not found');
            return;
        }

        if ($this->repo->countByInstitution($institutionId) <= 1) {
            Response::validationError([
                'category' => ['At least one assessment category must remain for the institution']
            ]);
            return;
        }

        if ($this->repo->hasLinkedAssessments($id, $institutionId)) {
            Response::validationError([
                'category' => ['Cannot delete category because it is used by one or more assessments']
            ]);
            return;
        }

        if ($this->repo->delete($id, $institutionId)) {
            Response::success(['message' => 'Assessment category deleted successfully']);
        } else {
            Response::serverError('Failed to delete assessment category');
        }
    }
}