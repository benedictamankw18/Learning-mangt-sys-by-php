<?php

namespace App\Repositories;

use App\Config\Database;

class GradeCategoryRepository
{
    private $db;

    public function __construct()
    {
        $this->db = Database::getInstance()->getConnection();
    }

    public function getAll(?int $institutionId = null): array
    {
        try {
            $sql = "
                SELECT
                    gc.*,
                    COUNT(gs.grade_scale_id) AS details_count,
                    MAX(gs.updated_at) AS last_scale_update
                FROM grade_categories gc
                LEFT JOIN grade_scales gs ON gs.grade_categories_id = gc.grade_categories_id
            ";

            $params = [];
            if ($institutionId !== null) {
                $sql .= " WHERE gc.institution_id = :institution_id";
                $params['institution_id'] = $institutionId;
            }

            $sql .= " GROUP BY gc.grade_categories_id ORDER BY gc.grade_categories_name ASC";

            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);
            return $stmt->fetchAll(\PDO::FETCH_ASSOC);
        } catch (\PDOException $e) {
            error_log('Get Grade Categories Error: ' . $e->getMessage());
            return [];
        }
    }

    public function findById(int $id, ?int $institutionId = null): ?array
    {
        try {
            $sql = 'SELECT * FROM grade_categories WHERE grade_categories_id = :id';
            $params = ['id' => $id];

            if ($institutionId !== null) {
                $sql .= ' AND institution_id = :institution_id';
                $params['institution_id'] = $institutionId;
            }

            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);
            $row = $stmt->fetch(\PDO::FETCH_ASSOC);
            return $row ?: null;
        } catch (\PDOException $e) {
            error_log('Find Grade Category Error: ' . $e->getMessage());
            return null;
        }
    }

    public function create(array $data): ?int
    {
        try {
            $stmt = $this->db->prepare("
                INSERT INTO grade_categories (
                    institution_id,
                    grade_categories_name,
                    grade_categories_description,
                    Pass_Threshold,
                    Used_By,
                    set_as_primary,
                    status
                ) VALUES (
                    :institution_id,
                    :grade_categories_name,
                    :grade_categories_description,
                    :Pass_Threshold,
                    :Used_By,
                    :set_as_primary,
                    :status
                )
            ");

            $stmt->execute([
                'institution_id' => $data['institution_id'],
                'grade_categories_name' => $data['grade_categories_name'],
                'grade_categories_description' => $data['grade_categories_description'] ?? null,
                'Pass_Threshold' => $data['Pass_Threshold'] ?? null,
                'Used_By' => $data['Used_By'] ?? null,
                'set_as_primary' => $data['set_as_primary'] ?? 0,
                'status' => $data['status'] ?? 'active',
            ]);

            return (int) $this->db->lastInsertId();
        } catch (\PDOException $e) {
            error_log('Create Grade Category Error: ' . $e->getMessage());
            return null;
        }
    }

    public function update(int $id, array $data): bool
    {
        try {
            $allowed = [
                'grade_categories_name',
                'grade_categories_description',
                'Pass_Threshold',
                'Used_By',
                'set_as_primary',
                'status',
            ];

            $updates = [];
            $params = ['id' => $id];

            foreach ($allowed as $field) {
                if (array_key_exists($field, $data)) {
                    $updates[] = "$field = :$field";
                    $params[$field] = $data[$field];
                }
            }

            if (!$updates) {
                return false;
            }

            $sql = 'UPDATE grade_categories SET ' . implode(', ', $updates) . ' WHERE grade_categories_id = :id';
            $stmt = $this->db->prepare($sql);
            return $stmt->execute($params);
        } catch (\PDOException $e) {
            error_log('Update Grade Category Error: ' . $e->getMessage());
            return false;
        }
    }

    public function delete(int $id, ?int $institutionId = null): bool
    {
        try {
            $sql = 'DELETE FROM grade_categories WHERE grade_categories_id = :id';
            $params = ['id' => $id];

            if ($institutionId !== null) {
                $sql .= ' AND institution_id = :institution_id';
                $params['institution_id'] = $institutionId;
            }

            $stmt = $this->db->prepare($sql);
            return $stmt->execute($params);
        } catch (\PDOException $e) {
            error_log('Delete Grade Category Error: ' . $e->getMessage());
            return false;
        }
    }
}
