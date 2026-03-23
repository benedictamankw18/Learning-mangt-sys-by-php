<?php

namespace App\Repositories;

use App\Config\Database;

class AssessmentCategoryRepository
{
    private $db;

    public function __construct()
    {
        $this->db = Database::getInstance()->getConnection();
    }

    public function getAll(int $institutionId, int $page = 1, int $limit = 20): array
    {
        try {
            $offset = ($page - 1) * $limit;
            $stmt = $this->db->prepare("
                SELECT * FROM assessment_categories
                WHERE institution_id = :institution_id
                ORDER BY category_name ASC
                LIMIT :limit OFFSET :offset
            ");
            $stmt->bindValue(':institution_id', $institutionId, \PDO::PARAM_INT);
            $stmt->bindValue(':limit', $limit, \PDO::PARAM_INT);
            $stmt->bindValue(':offset', $offset, \PDO::PARAM_INT);
            $stmt->execute();
            return $stmt->fetchAll(\PDO::FETCH_ASSOC);
        } catch (\PDOException $e) {
            error_log("Get Assessment Categories Error: " . $e->getMessage());
            return [];
        }
    }

    public function count(int $institutionId): int
    {
        try {
            $stmt = $this->db->prepare("SELECT COUNT(*) as total FROM assessment_categories WHERE institution_id = :institution_id");
            $stmt->execute(['institution_id' => $institutionId]);
            $result = $stmt->fetch(\PDO::FETCH_ASSOC);
            return (int) $result['total'];
        } catch (\PDOException $e) {
            error_log("Count Assessment Categories Error: " . $e->getMessage());
            return 0;
        }
    }

    public function countByInstitution(int $institutionId): int
    {
        return $this->count($institutionId);
    }

    public function findById(int $id, int $institutionId): ?array
    {
        try {
            $stmt = $this->db->prepare("SELECT * FROM assessment_categories WHERE category_id = :id AND institution_id = :institution_id");
            $stmt->execute([
                'id' => $id,
                'institution_id' => $institutionId,
            ]);
            $result = $stmt->fetch(\PDO::FETCH_ASSOC);
            return $result ?: null;
        } catch (\PDOException $e) {
            error_log("Find Assessment Category Error: " . $e->getMessage());
            return null;
        }
    }

    public function create(array $data, int $institutionId): ?int
    {
        try {
            $stmt = $this->db->prepare("
                INSERT INTO assessment_categories (category_name, institution_id, weight_percentage, description)
                VALUES (:category_name, :institution_id, :weight_percentage, :description)
            ");
            $stmt->execute([
                'category_name' => $data['category_name'],
                'institution_id' => $institutionId,
                'weight_percentage' => $data['weight_percentage'] ?? 1,
                'description' => $data['description'] ?? null
            ]);
            return (int) $this->db->lastInsertId();
        } catch (\PDOException $e) {
            error_log("Create Assessment Category Error: " . $e->getMessage());
            return null;
        }
    }

    public function update(int $id, array $data, int $institutionId): bool
    {
        try {
            $allowedFields = ['category_name', 'weight_percentage', 'description'];
            $updates = [];
            $params = [
                'id' => $id,
                'institution_id' => $institutionId,
            ];

            foreach ($allowedFields as $field) {
                if (isset($data[$field])) {
                    $updates[] = "$field = :$field";
                    $params[$field] = $data[$field];
                }
            }

            if (empty($updates)) {
                return false;
            }

            $sql = "UPDATE assessment_categories SET " . implode(', ', $updates) . " WHERE category_id = :id AND institution_id = :institution_id";
            $stmt = $this->db->prepare($sql);
            return $stmt->execute($params);
        } catch (\PDOException $e) {
            error_log("Update Assessment Category Error: " . $e->getMessage());
            return false;
        }
    }

    public function delete(int $id, int $institutionId): bool
    {
        try {
            $stmt = $this->db->prepare("DELETE FROM assessment_categories WHERE category_id = :id AND institution_id = :institution_id");
            $stmt->execute([
                'id' => $id,
                'institution_id' => $institutionId,
            ]);
            return $stmt->rowCount() > 0;
        } catch (\PDOException $e) {
            error_log("Delete Assessment Category Error: " . $e->getMessage());
            return false;
        }
    }

    public function hasLinkedAssessments(int $id, int $institutionId): bool
    {
        try {
            $stmt = $this->db->prepare(" 
                SELECT 1
                FROM assessments a
                INNER JOIN assessment_categories c ON c.category_id = a.category_id
                WHERE c.category_id = :id
                  AND c.institution_id = :institution_id
                LIMIT 1
            ");
            $stmt->execute([
                'id' => $id,
                'institution_id' => $institutionId,
            ]);

            return (bool) $stmt->fetchColumn();
        } catch (\PDOException $e) {
            error_log("Has Linked Assessments Error: " . $e->getMessage());
            return false;
        }
    }
}