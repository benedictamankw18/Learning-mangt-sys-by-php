<?php

namespace App\Repositories;

use App\Config\Database;
use PDO;

class RoleRepository
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance()->getConnection();
    }

    public function getAll(): array
    {
        try {
            $stmt = $this->db->query("
                SELECT r.*, 
                       COUNT(DISTINCT ur.user_id) as user_count,
                       COUNT(DISTINCT rp.permission_id) as permission_count
                FROM roles r
                LEFT JOIN user_roles ur ON r.role_id = ur.role_id
                LEFT JOIN role_permissions rp ON r.role_id = rp.role_id
                LEFT JOIN users u ON u.user_id = ur.user_id
                WHERE u.deleted_at IS NULL
                GROUP BY r.role_id
                ORDER BY r.role_name
            ");
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (\PDOException $e) {
            error_log("Get All Roles Error: " . $e->getMessage());
            return [];
        }
    }

    public function findById(int $id): ?array
    {
        try {
            $stmt = $this->db->prepare("
                SELECT r.*, GROUP_CONCAT(p.permission_name) as permissions
                FROM roles r
                LEFT JOIN role_permissions rp ON r.role_id = rp.role_id
                LEFT JOIN permissions p ON rp.permission_id = p.permission_id
                WHERE r.role_id = :id
                GROUP BY r.role_id
            ");

            $stmt->execute(['id' => $id]);
            $role = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($role) {
                $role['permissions'] = $role['permissions'] ? explode(',', $role['permissions']) : [];
            }

            return $role ?: null;
        } catch (\PDOException $e) {
            error_log("Find Role Error: " . $e->getMessage());
            return null;
        }
    }

    public function create(array $data): ?int
    {
        try {
            $stmt = $this->db->prepare("
                INSERT INTO roles (role_name, description)
                VALUES (:role_name, :description)
            ");

            $stmt->execute([
                'role_name' => strtolower($data['role_name']),
                'description' => $data['description'] ?? null
            ]);

            return (int) $this->db->lastInsertId();
        } catch (\PDOException $e) {
            error_log("Create Role Error: " . $e->getMessage());
            return null;
        }
    }

    public function update(int $id, array $data): bool
    {
        try {
            $fields = [];
            $params = ['id' => $id];

            foreach ($data as $key => $value) {
                if ($key !== 'role_id') {
                    $fields[] = "{$key} = :{$key}";
                    $params[$key] = $key === 'role_name' ? strtolower($value) : $value;
                }
            }

            if (empty($fields)) {
                return false;
            }

            $sql = "UPDATE roles SET " . implode(', ', $fields) . " WHERE role_id = :id";
            $stmt = $this->db->prepare($sql);
            return $stmt->execute($params);

        } catch (\PDOException $e) {
            error_log("Update Role Error: " . $e->getMessage());
            return false;
        }
    }

    public function delete(int $id): bool
    {
        try {
            // First remove all role permissions
            $stmt = $this->db->prepare("DELETE FROM role_permissions WHERE role_id = :id");
            $stmt->execute(['id' => $id]);

            // Then delete the role
            $stmt = $this->db->prepare("DELETE FROM roles WHERE role_id = :id");
            return $stmt->execute(['id' => $id]);
        } catch (\PDOException $e) {
            error_log("Delete Role Error: " . $e->getMessage());
            return false;
        }
    }

    public function assignPermission(int $roleId, int $permissionId): bool
    {
        try {
            $stmt = $this->db->prepare("
                INSERT IGNORE INTO role_permissions (role_id, permission_id)
                VALUES (:role_id, :permission_id)
            ");
            return $stmt->execute(['role_id' => $roleId, 'permission_id' => $permissionId]);
        } catch (\PDOException $e) {
            error_log("Assign Permission Error: " . $e->getMessage());
            return false;
        }
    }

    public function removePermission(int $roleId, int $permissionId): bool
    {
        try {
            $stmt = $this->db->prepare("
                DELETE FROM role_permissions WHERE role_id = :role_id AND permission_id = :permission_id
            ");
            return $stmt->execute(['role_id' => $roleId, 'permission_id' => $permissionId]);
        } catch (\PDOException $e) {
            error_log("Remove Permission Error: " . $e->getMessage());
            return false;
        }
    }

    public function getPermissions(int $roleId): array
    {
        try {
            $stmt = $this->db->prepare("
                SELECT p.*
                FROM permissions p
                INNER JOIN role_permissions rp ON p.permission_id = rp.permission_id
                WHERE rp.role_id = :role_id
                ORDER BY p.permission_name
            ");

            $stmt->execute(['role_id' => $roleId]);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (\PDOException $e) {
            error_log("Get Role Permissions Error: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Get users assigned to a role
     */
    public function getUsers(int $roleId): array
    {
        try {
            $stmt = $this->db->prepare("\n                SELECT u.*, i.institution_name AS institution_name, GROUP_CONCAT(r.role_name) as roles\n                FROM users u\n                INNER JOIN user_roles ur ON u.user_id = ur.user_id\n                INNER JOIN roles r ON ur.role_id = r.role_id\n                LEFT JOIN institutions i ON i.institution_id = u.institution_id\n                WHERE ur.role_id = :role_id AND u.deleted_at IS NULL\n                GROUP BY u.user_id\n                ORDER BY u.last_name, u.first_name\n            ");

            $stmt->execute(['role_id' => $roleId]);
            $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

            foreach ($users as &$user) {
                $user['roles'] = $user['roles'] ? explode(',', $user['roles']) : [];
                unset($user['password_hash']);
            }

            return $users;
        } catch (\PDOException $e) {
            error_log("Get Role Users Error: " . $e->getMessage());
            return [];
        }
    }
}
