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

    public function index(array $user): void
    {
        $page = isset($_GET['page']) ? (int) $_GET['page'] : 1;
        $limit = isset($_GET['limit']) ? (int) $_GET['limit'] : 20;

        $categories = $this->repo->getAll($page, $limit);
        $total = $this->repo->count();

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
        $category = $this->repo->findById($id);

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

        $categoryId = $this->repo->create($data);

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

        $category = $this->repo->findById($id);

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

        if ($this->repo->update($id, $data)) {
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

        $category = $this->repo->findById($id);

        if (!$category) {
            Response::notFound('Assessment category not found');
            return;
        }

        if ($this->repo->delete($id)) {
            Response::success(['message' => 'Assessment category deleted successfully']);
        } else {
            Response::serverError('Failed to delete assessment category');
        }
    }
}
