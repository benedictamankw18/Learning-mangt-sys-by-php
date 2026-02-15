<?php

namespace App\Controllers;

use App\Utils\Response;
use App\Utils\Validator;
use App\Repositories\ParentRepository;
use App\Middleware\RoleMiddleware;

class ParentController
{
    private ParentRepository $repo;

    public function __construct()
    {
        $this->repo = new ParentRepository();
    }

    public function index(array $user): void
    {
        $page = isset($_GET['page']) ? (int) $_GET['page'] : 1;
        $limit = isset($_GET['limit']) ? (int) $_GET['limit'] : 20;

        $parents = $this->repo->getAll($page, $limit);
        $total = $this->repo->count();

        Response::success([
            'data' => $parents,
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
        $parent = $this->repo->findById($id);

        if (!$parent) {
            Response::notFound('Parent not found');
            return;
        }

        Response::success($parent);
    }

    public function create(array $user): void
    {
        $roleMiddleware = new RoleMiddleware($user);

        if (!$roleMiddleware->requireRole('admin')) {
            return;
        }

        $data = json_decode(file_get_contents('php://input'), true);

        $validator = new Validator($data);
        $validator->required(['first_name', 'last_name'])
            ->maxLength('first_name', 100)
            ->maxLength('last_name', 100);

        if (isset($data['email'])) {
            $validator->email('email')->maxLength('email', 100);
        }
        if (isset($data['phone'])) {
            $validator->maxLength('phone', 20);
        }
        if (isset($data['user_id'])) {
            $validator->numeric('user_id');
        }

        if ($validator->fails()) {
            Response::validationError($validator->getErrors());
            return;
        }

        $parentId = $this->repo->create($data);

        if ($parentId) {
            Response::success([
                'message' => 'Parent created successfully',
                'parent_id' => $parentId
            ], 201);
        } else {
            Response::serverError('Failed to create parent');
        }
    }

    public function update(array $user, int $id): void
    {
        $roleMiddleware = new RoleMiddleware($user);

        if (!$roleMiddleware->requireRole('admin')) {
            return;
        }

        $parent = $this->repo->findById($id);

        if (!$parent) {
            Response::notFound('Parent not found');
            return;
        }

        $data = json_decode(file_get_contents('php://input'), true);

        $validator = new Validator($data);
        if (isset($data['first_name'])) {
            $validator->maxLength('first_name', 100);
        }
        if (isset($data['last_name'])) {
            $validator->maxLength('last_name', 100);
        }
        if (isset($data['email'])) {
            $validator->email('email')->maxLength('email', 100);
        }
        if (isset($data['phone'])) {
            $validator->maxLength('phone', 20);
        }
        if (isset($data['user_id'])) {
            $validator->numeric('user_id');
        }

        if ($validator->fails()) {
            Response::validationError($validator->getErrors());
            return;
        }

        if ($this->repo->update($id, $data)) {
            Response::success(['message' => 'Parent updated successfully']);
        } else {
            Response::serverError('Failed to update parent');
        }
    }

    public function delete(array $user, int $id): void
    {
        $roleMiddleware = new RoleMiddleware($user);

        if (!$roleMiddleware->requireRole('admin')) {
            return;
        }

        $parent = $this->repo->findById($id);

        if (!$parent) {
            Response::notFound('Parent not found');
            return;
        }

        if ($this->repo->delete($id)) {
            Response::success(['message' => 'Parent deleted successfully']);
        } else {
            Response::serverError('Failed to delete parent');
        }
    }

    public function getStudents(array $user, int $id): void
    {
        $parent = $this->repo->findById($id);

        if (!$parent) {
            Response::notFound('Parent not found');
            return;
        }

        $students = $this->repo->getStudents($id);
        Response::success($students);
    }
}
