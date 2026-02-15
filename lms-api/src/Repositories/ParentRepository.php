<?php

namespace App\Repositories;

use App\Config\Database;

class ParentRepository
{
    private $db;

    public function __construct()
    {
        $this->db = Database::getInstance()->getConnection();
    }

    public function getAll(int $page = 1, int $limit = 20): array
    {
        try {
            $offset = ($page - 1) * $limit;
            $stmt = $this->db->prepare("
                SELECT p.*, u.username, u.is_active
                FROM parents p
                LEFT JOIN users u ON p.user_id = u.user_id
                ORDER BY p.last_name, p.first_name
                LIMIT :limit OFFSET :offset
            ");
            $stmt->bindValue(':limit', $limit, \PDO::PARAM_INT);
            $stmt->bindValue(':offset', $offset, \PDO::PARAM_INT);
            $stmt->execute();
            return $stmt->fetchAll(\PDO::FETCH_ASSOC);
        } catch (\PDOException $e) {
            error_log("Get Parents Error: " . $e->getMessage());
            return [];
        }
    }

    public function count(): int
    {
        try {
            $stmt = $this->db->query("SELECT COUNT(*) as total FROM parents");
            $result = $stmt->fetch(\PDO::FETCH_ASSOC);
            return (int) $result['total'];
        } catch (\PDOException $e) {
            error_log("Count Parents Error: " . $e->getMessage());
            return 0;
        }
    }

    public function findById(int $id): ?array
    {
        try {
            $stmt = $this->db->prepare("
                SELECT p.*, u.username, u.is_active
                FROM parents p
                LEFT JOIN users u ON p.user_id = u.user_id
                WHERE p.parent_id = :id
            ");
            $stmt->execute(['id' => $id]);
            $result = $stmt->fetch(\PDO::FETCH_ASSOC);
            return $result ?: null;
        } catch (\PDOException $e) {
            error_log("Find Parent Error: " . $e->getMessage());
            return null;
        }
    }

    public function create(array $data): ?int
    {
        try {
            $stmt = $this->db->prepare("
                INSERT INTO parents (user_id, first_name, last_name, phone, email, occupation, address)
                VALUES (:user_id, :first_name, :last_name, :phone, :email, :occupation, :address)
            ");
            $stmt->execute([
                'user_id' => $data['user_id'] ?? null,
                'first_name' => $data['first_name'],
                'last_name' => $data['last_name'],
                'phone' => $data['phone'] ?? null,
                'email' => $data['email'] ?? null,
                'occupation' => $data['occupation'] ?? null,
                'address' => $data['address'] ?? null
            ]);
            return (int) $this->db->lastInsertId();
        } catch (\PDOException $e) {
            error_log("Create Parent Error: " . $e->getMessage());
            return null;
        }
    }

    public function update(int $id, array $data): bool
    {
        try {
            $allowedFields = ['user_id', 'first_name', 'last_name', 'phone', 'email', 'occupation', 'address'];
            $updates = [];
            $params = ['id' => $id];

            foreach ($allowedFields as $field) {
                if (isset($data[$field])) {
                    $updates[] = "$field = :$field";
                    $params[$field] = $data[$field];
                }
            }

            if (empty($updates)) {
                return false;
            }

            $sql = "UPDATE parents SET " . implode(', ', $updates) . " WHERE parent_id = :id";
            $stmt = $this->db->prepare($sql);
            return $stmt->execute($params);
        } catch (\PDOException $e) {
            error_log("Update Parent Error: " . $e->getMessage());
            return false;
        }
    }

    public function delete(int $id): bool
    {
        try {
            $stmt = $this->db->prepare("DELETE FROM parents WHERE parent_id = :id");
            return $stmt->execute(['id' => $id]);
        } catch (\PDOException $e) {
            error_log("Delete Parent Error: " . $e->getMessage());
            return false;
        }
    }

    public function getStudents(int $parentId): array
    {
        try {
            $stmt = $this->db->prepare("
                SELECT s.*, u.first_name, u.last_name, u.email, ps.relationship, ps.is_primary
                FROM parent_students ps
                INNER JOIN students s ON ps.student_id = s.student_id
                INNER JOIN users u ON s.user_id = u.user_id
                WHERE ps.parent_id = :parent_id
                ORDER BY ps.is_primary DESC, u.last_name, u.first_name
            ");
            $stmt->execute(['parent_id' => $parentId]);
            return $stmt->fetchAll(\PDO::FETCH_ASSOC);
        } catch (\PDOException $e) {
            error_log("Get Parent Students Error: " . $e->getMessage());
            return [];
        }
    }
}
