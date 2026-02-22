<?php

namespace App\Controllers;

use App\Utils\Response;
use App\Utils\Validator;
use App\Repositories\RoleRepository;
use App\Middleware\RoleMiddleware;

class RoleController
{
    private RoleRepository $roleRepo;

    public function __construct()
    {
        $this->roleRepo = new RoleRepository();
    }

    public function index(array $user): void
    {
        $roleMiddleware = new RoleMiddleware($user);

        // Allow admins or super_admin to view roles (view-only)
        if (!$roleMiddleware->isAdmin() && empty($user['is_super_admin'])) {
            Response::forbidden('Only admins can view roles');
            return;
        }

        $roles = $this->roleRepo->getAll();
        Response::success($roles);
    }

    public function show(array $user, int $id): void
    {
        $roleMiddleware = new RoleMiddleware($user);

        // Allow admins or super_admin to view role details
        if (!$roleMiddleware->isAdmin() && empty($user['is_super_admin'])) {
            Response::forbidden('Only admins can view role details');
            return;
        }

        $role = $this->roleRepo->findById($id);

        if (!$role) {
            Response::notFound('Role not found');
            return;
        }

        Response::success($role);
    }

    public function create(array $user): void
    {
        $roleMiddleware = new RoleMiddleware($user);
        // Allow admins or super_admin to create roles
        if (!$roleMiddleware->isAdmin() && empty($user['is_super_admin'])) {
            Response::forbidden('Only admins or super admins can create roles');
            return;
        }

        $data = json_decode(file_get_contents('php://input'), true) ?: [];

        $validator = new Validator(is_array($data) ? $data : []);
        $validator->required(['role_name']);

        if ($validator->fails()) {
            Response::validationError($validator->getErrors());
            return;
        }

        $roleId = $this->roleRepo->create($data);

        if ($roleId) {
            $role = $this->roleRepo->findById($roleId);
            Response::success($role, 201);
        } else {
            Response::serverError('Failed to create role');
        }
    }

    public function update(array $user, int $id): void
    {
        $roleMiddleware = new RoleMiddleware($user);
        // Allow admins or super_admin to update roles
        if (!$roleMiddleware->isAdmin() && empty($user['is_super_admin'])) {
            Response::forbidden('Only admins or super admins can update roles');
            return;
        }

        $role = $this->roleRepo->findById($id);

        if (!$role) {
            Response::notFound('Role not found');
            return;
        }

        $data = json_decode(file_get_contents('php://input'), true) ?: [];

        if ($this->roleRepo->update($id, is_array($data) ? $data : [])) {
            $updatedRole = $this->roleRepo->findById($id);
            Response::success($updatedRole);
        } else {
            Response::serverError('Failed to update role');
        }
    }

    public function delete(array $user, int $id): void
    {
        $roleMiddleware = new RoleMiddleware($user);
        // Allow admins or super_admin to delete roles
        if (!$roleMiddleware->isAdmin() && empty($user['is_super_admin'])) {
            Response::forbidden('Only admins or super admins can delete roles');
            return;
        }

        $role = $this->roleRepo->findById($id);

        if (!$role) {
            Response::notFound('Role not found');
            return;
        }

        if ($this->roleRepo->delete($id)) {
            Response::success(['message' => 'Role deleted successfully']);
        } else {
            Response::serverError('Failed to delete role');
        }
    }

    public function getPermissions(array $user, int $id): void
    {
        $roleMiddleware = new RoleMiddleware($user);

        // Allow admins or super_admin to view role permissions
        if (!$roleMiddleware->isAdmin() && empty($user['is_super_admin'])) {
            Response::forbidden('Only admins can view role permissions');
            return;
        }

        $role = $this->roleRepo->findById($id);

        if (!$role) {
            Response::notFound('Role not found');
            return;
        }

        $permissions = $this->roleRepo->getPermissions($id);
        Response::success($permissions);
    }

    public function getUsers(array $user, int $id): void
    {
        $roleMiddleware = new RoleMiddleware($user);

        // Allow admins or super_admin to view users for a role
        if (!$roleMiddleware->isAdmin() && empty($user['is_super_admin'])) {
            Response::forbidden('Only admins or super admins can view users for a role');
            return;
        }

        $role = $this->roleRepo->findById($id);
        if (!$role) {
            Response::notFound('Role not found');
            return;
        }

        $users = $this->roleRepo->getUsers($id);
        Response::success($users);
    }

    public function assignPermission(array $user, int $id): void
    {
        $roleMiddleware = new RoleMiddleware($user);

        // Allow admins or super admins to assign permissions
        if (!$roleMiddleware->isAdmin() && empty($user['is_super_admin'])) {
            Response::forbidden('Only admins or super admins can assign permissions');
            return;
        }

        $role = $this->roleRepo->findById($id);

        if (!$role) {
            Response::notFound('Role not found');
            return;
        }

        $data = json_decode(file_get_contents('php://input'), true) ?: [];

        $validator = new Validator(is_array($data) ? $data : []);
        $validator->required(['permission_id'])->numeric('permission_id');

        if ($validator->fails()) {
            Response::validationError($validator->getErrors());
            return;
        }

        if ($this->roleRepo->assignPermission($id, (int) $data['permission_id'])) {
            Response::success(['message' => 'Permission assigned successfully']);
        } else {
            Response::serverError('Failed to assign permission');
        }
    }

    public function removePermission(array $user, int $id, int $permissionId): void
    {
        $roleMiddleware = new RoleMiddleware($user);

        // Allow admins or super admins to remove permissions
        if (!$roleMiddleware->isAdmin() && empty($user['is_super_admin'])) {
            Response::forbidden('Only admins or super admins can remove permissions');
            return;
        }

        $role = $this->roleRepo->findById($id);

        if (!$role) {
            Response::notFound('Role not found');
            return;
        }

        if ($this->roleRepo->removePermission($id, $permissionId)) {
            Response::success(['message' => 'Permission removed successfully']);
        } else {
            Response::serverError('Failed to remove permission');
        }
    }
}
