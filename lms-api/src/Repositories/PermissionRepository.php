<?php

namespace App\Repositories;

use App\Config\Database;
use PDO;

class PermissionRepository
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
                SELECT p.*, COUNT(DISTINCT rp.role_id) as role_count
                FROM permissions p
                LEFT JOIN role_permissions rp ON p.permission_id = rp.permission_id
                GROUP BY p.permission_id
                ORDER BY p.permission_name
            ");
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (\PDOException $e) {
            log_error("Get All Permissions Error: " . $e->getMessage());
            return [];
        }
    }

    public function findById(int $id): ?array
    {
        try {
            $stmt = $this->db->prepare("SELECT * FROM permissions WHERE permission_id = :id");
            $stmt->execute(['id' => $id]);
            return $stmt->fetch(PDO::FETCH_ASSOC) ?: null;
        } catch (\PDOException $e) {
            log_error("Find Permission Error: " . $e->getMessage());
            return null;
        }
    }

    public function create(array $data): ?int
    {
        try {
            $stmt = $this->db->prepare("
                INSERT INTO permissions (permission_name, description)
                VALUES (:permission_name, :description)
            ");

            $stmt->execute([
                'permission_name' => $data['permission_name'],
                'description' => $data['description'] ?? null
            ]);

            $permissionId = (int) $this->db->lastInsertId();
            log_audit('Permission created', ['permission_id' => $permissionId, 'permission_name' => $data['permission_name']]);
            return $permissionId;
        } catch (\PDOException $e) {
            log_error("Create Permission Error: " . $e->getMessage());
            return null;
        }
    }

    public function update(int $id, array $data): bool
    {
        try {
            $fields = [];
            $params = ['id' => $id];

            foreach ($data as $key => $value) {
                if ($key !== 'permission_id') {
                    $fields[] = "{$key} = :{$key}";
                    $params[$key] = $value;
                }
            }

            if (empty($fields)) {
                return false;
            }

            $sql = "UPDATE permissions SET " . implode(', ', $fields) . " WHERE permission_id = :id";
            $stmt = $this->db->prepare($sql);
            $result = $stmt->execute($params);
            if ($result) {
                log_audit('Permission updated', ['permission_id' => $id, 'fields_updated' => array_keys($data)]);
            }
            return $result;

        } catch (\PDOException $e) {
            log_error("Update Permission Error: " . $e->getMessage());
            return false;
        }
    }

    public function delete(int $id): bool
    {
        try {
            // First remove all role permissions
            $stmt = $this->db->prepare("DELETE FROM role_permissions WHERE permission_id = :id");
            $stmt->execute(['id' => $id]);

            // Then delete the permission
            $stmt = $this->db->prepare("DELETE FROM permissions WHERE permission_id = :id");
            $result = $stmt->execute(['id' => $id]);
            if ($result) {
                log_audit('Permission deleted', ['permission_id' => $id]);
            }
            return $result;
        } catch (\PDOException $e) {
            log_error("Delete Permission Error: " . $e->getMessage());
            return false;
        }
    }
}
