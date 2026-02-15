<?php

namespace App\Middleware;

use App\Utils\Response;

class RoleMiddleware
{
    private array $user;

    public function __construct(array $user)
    {
        $this->user = $user;
    }

    public function hasRole(string|array $roles): bool
    {
        $requiredRoles = is_array($roles) ? $roles : [$roles];
        $userRoles = $this->user['roles'] ?? [];

        foreach ($requiredRoles as $role) {
            if (in_array($role, $userRoles)) {
                return true;
            }
        }

        return false;
    }

    public function hasPermission(string|array $permissions): bool
    {
        $requiredPermissions = is_array($permissions) ? $permissions : [$permissions];
        $userPermissions = $this->user['permissions'] ?? [];

        foreach ($requiredPermissions as $permission) {
            if (in_array($permission, $userPermissions)) {
                return true;
            }
        }

        return false;
    }

    public function requireRole(string|array $roles): bool
    {
        if (!$this->hasRole($roles)) {
            $roleList = is_array($roles) ? implode(', ', $roles) : $roles;
            Response::forbidden("Required role(s): {$roleList}");
            return false;
        }
        return true;
    }

    public function requirePermission(string|array $permissions): bool
    {
        if (!$this->hasPermission($permissions)) {
            $permissionList = is_array($permissions) ? implode(', ', $permissions) : $permissions;
            Response::forbidden("Required permission(s): {$permissionList}");
            return false;
        }
        return true;
    }

    public function isAdmin(): bool
    {
        return $this->hasRole('admin');
    }

    public function isTeacher(): bool
    {
        return $this->hasRole('teacher');
    }

    public function isStudent(): bool
    {
        return $this->hasRole('student');
    }

    public function isParent(): bool
    {
        return $this->hasRole('parent');
    }
}
