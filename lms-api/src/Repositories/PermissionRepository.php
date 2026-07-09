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
            error_log("Get All Permissions Error: " . $e->getMessage());
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
            error_log("Find Permission Error: " . $e->getMessage());
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

            return (int) $this->db->lastInsertId();
        } catch (\PDOException $e) {
            error_log("Create Permission Error: " . $e->getMessage());
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
            return $stmt->execute($params);

        } catch (\PDOException $e) {
            error_log("Update Permission Error: " . $e->getMessage());
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
            return $stmt->execute(['id' => $id]);
        } catch (\PDOException $e) {
            error_log("Delete Permission Error: " . $e->getMessage());
            return false;
        }
    }
}
