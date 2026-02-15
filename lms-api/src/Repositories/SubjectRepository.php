<?php

namespace App\Repositories;

use App\Config\Database;

class SubjectRepository
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
                SELECT * FROM subjects
                ORDER BY subject_code ASC
                LIMIT :limit OFFSET :offset
            ");
            $stmt->bindValue(':limit', $limit, \PDO::PARAM_INT);
            $stmt->bindValue(':offset', $offset, \PDO::PARAM_INT);
            $stmt->execute();
            return $stmt->fetchAll(\PDO::FETCH_ASSOC);
        } catch (\PDOException $e) {
            error_log("Get Subjects Error: " . $e->getMessage());
            return [];
        }
    }

    public function count(): int
    {
        try {
            $stmt = $this->db->query("SELECT COUNT(*) as total FROM subjects");
            $result = $stmt->fetch(\PDO::FETCH_ASSOC);
            return (int) $result['total'];
        } catch (\PDOException $e) {
            error_log("Count Subjects Error: " . $e->getMessage());
            return 0;
        }
    }

    public function findById(int $id): ?array
    {
        try {
            $stmt = $this->db->prepare("SELECT * FROM subjects WHERE subject_id = :id");
            $stmt->execute(['id' => $id]);
            $result = $stmt->fetch(\PDO::FETCH_ASSOC);
            return $result ?: null;
        } catch (\PDOException $e) {
            error_log("Find Subject Error: " . $e->getMessage());
            return null;
        }
    }

    public function create(array $data): ?int
    {
        try {
            $stmt = $this->db->prepare("
                INSERT INTO subjects (subject_code, subject_name, description, credits, is_core)
                VALUES (:subject_code, :subject_name, :description, :credits, :is_core)
            ");
            $stmt->execute([
                'subject_code' => $data['subject_code'],
                'subject_name' => $data['subject_name'],
                'description' => $data['description'] ?? null,
                'credits' => $data['credits'] ?? 3,
                'is_core' => $data['is_core'] ?? 0
            ]);
            return (int) $this->db->lastInsertId();
        } catch (\PDOException $e) {
            error_log("Create Subject Error: " . $e->getMessage());
            return null;
        }
    }

    public function update(int $id, array $data): bool
    {
        try {
            $allowedFields = ['subject_code', 'subject_name', 'description', 'credits', 'is_core'];
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

            $sql = "UPDATE subjects SET " . implode(', ', $updates) . " WHERE subject_id = :id";
            $stmt = $this->db->prepare($sql);
            return $stmt->execute($params);
        } catch (\PDOException $e) {
            error_log("Update Subject Error: " . $e->getMessage());
            return false;
        }
    }

    public function delete(int $id): bool
    {
        try {
            $stmt = $this->db->prepare("DELETE FROM subjects WHERE subject_id = :id");
            return $stmt->execute(['id' => $id]);
        } catch (\PDOException $e) {
            error_log("Delete Subject Error: " . $e->getMessage());
            return false;
        }
    }

    public function getCoreSubjects(): array
    {
        try {
            $stmt = $this->db->query("SELECT * FROM subjects WHERE is_core = 1 ORDER BY subject_code");
            return $stmt->fetchAll(\PDO::FETCH_ASSOC);
        } catch (\PDOException $e) {
            error_log("Get Core Subjects Error: " . $e->getMessage());
            return [];
        }
    }
}
