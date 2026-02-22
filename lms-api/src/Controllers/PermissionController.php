<?php

namespace App\Controllers;

use App\Utils\Response;
use App\Utils\Validator;
use App\Repositories\PermissionRepository;
use App\Middleware\RoleMiddleware;

class PermissionController
{
    private PermissionRepository $permissionRepo;

    public function __construct()
    {
        $this->permissionRepo = new PermissionRepository();
    }

    public function index(array $user): void
    {
        $roleMiddleware = new RoleMiddleware($user);

        if (!$roleMiddleware->isAdmin() && empty($user['is_super_admin'])) {
            Response::forbidden('Only admins or super admins can view permissions');
            return;
        }

        $permissions = $this->permissionRepo->getAll();
        Response::success($permissions);
    }

    public function show(array $user, int $id): void
    {
        $roleMiddleware = new RoleMiddleware($user);

        if (!$roleMiddleware->isAdmin() && empty($user['is_super_admin'])) {
            Response::forbidden('Only admins or super admins can view permission details');
            return;
        }

        $permission = $this->permissionRepo->findById($id);

        if (!$permission) {
            Response::notFound('Permission not found');
            return;
        }

        Response::success($permission);
    }

    public function create(array $user): void
    {
        $roleMiddleware = new RoleMiddleware($user);

        if (!$roleMiddleware->isAdmin() && empty($user['is_super_admin'])) {
            Response::forbidden('Only admins or super admins can create permissions');
            return;
        }

        $data = json_decode(file_get_contents('php://input'), true);

        $validator = new Validator($data);
        $validator->required(['permission_name']);

        if ($validator->fails()) {
            Response::validationError($validator->getErrors());
            return;
        }

        $permissionId = $this->permissionRepo->create($data);

        if ($permissionId) {
            $permission = $this->permissionRepo->findById($permissionId);
            Response::success($permission, 201);
        } else {
            Response::serverError('Failed to create permission');
        }
    }

    public function update(array $user, int $id): void
    {
        $roleMiddleware = new RoleMiddleware($user);

        if (!$roleMiddleware->isAdmin() && empty($user['is_super_admin'])) {
            Response::forbidden('Only admins or super admins can update permissions');
            return;
        }

        $permission = $this->permissionRepo->findById($id);

        if (!$permission) {
            Response::notFound('Permission not found');
            return;
        }

        $data = json_decode(file_get_contents('php://input'), true);

        if ($this->permissionRepo->update($id, $data)) {
            $updatedPermission = $this->permissionRepo->findById($id);
            Response::success($updatedPermission);
        } else {
            Response::serverError('Failed to update permission');
        }
    }

    public function delete(array $user, int $id): void
    {
        $roleMiddleware = new RoleMiddleware($user);

        if (!$roleMiddleware->isAdmin() && empty($user['is_super_admin'])) {
            Response::forbidden('Only admins or super admins can delete permissions');
            return;
        }

        $permission = $this->permissionRepo->findById($id);

        if (!$permission) {
            Response::notFound('Permission not found');
            return;
        }

        if ($this->permissionRepo->delete($id)) {
            Response::success(['message' => 'Permission deleted successfully']);
        } else {
            Response::serverError('Failed to delete permission');
        }
    }
}
