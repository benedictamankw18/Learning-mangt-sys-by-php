<?php

namespace App\Repositories;

use App\Config\Database;

class GradeScaleRepository
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
                    gs.*,
                    gc.grade_categories_name,
                    gc.grade_categories_description,
                    gc.set_as_primary,
                    gc.status AS category_status
                FROM grade_scales gs
                LEFT JOIN grade_categories gc ON gc.grade_categories_id = gs.grade_categories_id
            ";

            $params = [];
            if ($institutionId !== null) {
                $sql .= " WHERE gs.institution_id = :institution_id";
                $params['institution_id'] = $institutionId;
            }

            $sql .= " ORDER BY COALESCE(gs.grade_categories_id, 0) ASC, gs.min_score DESC, gs.grade ASC";

            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);

            return $stmt->fetchAll(\PDO::FETCH_ASSOC);
        } catch (\PDOException $e) {
            error_log('Get Grade Scales Error: ' . $e->getMessage());
            return [];
        }
    }

    public function findById(int $id, ?int $institutionId = null): ?array
    {
        try {
            $sql = "
                SELECT
                    gs.*,
                    gc.grade_categories_name,
                    gc.grade_categories_description,
                    gc.set_as_primary,
                    gc.status AS category_status
                FROM grade_scales gs
                LEFT JOIN grade_categories gc ON gc.grade_categories_id = gs.grade_categories_id
                WHERE gs.grade_scale_id = :id
            ";

            $params = ['id' => $id];
            if ($institutionId !== null) {
                $sql .= " AND gs.institution_id = :institution_id";
                $params['institution_id'] = $institutionId;
            }

            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);

            $result = $stmt->fetch(\PDO::FETCH_ASSOC);
            return $result ?: null;
        } catch (\PDOException $e) {
            error_log('Find Grade Scale Error: ' . $e->getMessage());
            return null;
        }
    }

    public function create(array $data): ?int
    {
        try {
            $stmt = $this->db->prepare("
                INSERT INTO grade_scales (
                    institution_id,
                    grade_categories_id,
                    grade,
                    min_score,
                    max_score,
                    grade_point,
                    Interpretation,
                    Status,
                    remark
                ) VALUES (
                    :institution_id,
                    :grade_categories_id,
                    :grade,
                    :min_score,
                    :max_score,
                    :grade_point,
                    :Interpretation,
                    :Status,
                    :remark
                )
            ");

            $stmt->execute([
                'institution_id' => $data['institution_id'] ?? null,
                'grade_categories_id' => $data['grade_categories_id'] ?? null,
                'grade' => $data['grade'],
                'min_score' => $data['min_score'],
                'max_score' => $data['max_score'],
                'grade_point' => $data['grade_point'] ?? null,
                'Interpretation' => $data['Interpretation'] ?? null,
                'Status' => $data['Status'] ?? 'active',
                'remark' => $data['remark'] ?? null,
            ]);

            return (int) $this->db->lastInsertId();
        } catch (\PDOException $e) {
            error_log('Create Grade Scale Error: ' . $e->getMessage());
            return null;
        }
    }

    public function update(int $id, array $data): bool
    {
        try {
            $allowedFields = [
                'grade_categories_id',
                'grade',
                'min_score',
                'max_score',
                'grade_point',
                'Interpretation',
                'Status',
                'remark',
            ];

            $updates = [];
            $params = ['id' => $id];

            foreach ($allowedFields as $field) {
                if (array_key_exists($field, $data)) {
                    $updates[] = "$field = :$field";
                    $params[$field] = $data[$field];
                }
            }

            if (empty($updates)) {
                return false;
            }

            $sql = 'UPDATE grade_scales SET ' . implode(', ', $updates) . ' WHERE grade_scale_id = :id';
            $stmt = $this->db->prepare($sql);

            return $stmt->execute($params);
        } catch (\PDOException $e) {
            error_log('Update Grade Scale Error: ' . $e->getMessage());
            return false;
        }
    }

    public function delete(int $id, ?int $institutionId = null): bool
    {
        try {
            $sql = 'DELETE FROM grade_scales WHERE grade_scale_id = :id';
            $params = ['id' => $id];

            if ($institutionId !== null) {
                $sql .= ' AND institution_id = :institution_id';
                $params['institution_id'] = $institutionId;
            }

            $stmt = $this->db->prepare($sql);
            return $stmt->execute($params);
        } catch (\PDOException $e) {
            error_log('Delete Grade Scale Error: ' . $e->getMessage());
            return false;
        }
    }

    public function getGradeForScore(float $score): ?array
    {
        try {
            $stmt = $this->db->prepare("
                SELECT *
                FROM grade_scales
                WHERE :score BETWEEN min_score AND max_score
                ORDER BY min_score DESC
                LIMIT 1
            ");
            $stmt->execute(['score' => $score]);
            $result = $stmt->fetch(\PDO::FETCH_ASSOC);
            return $result ?: null;
        } catch (\PDOException $e) {
            error_log('Get Grade For Score Error: ' . $e->getMessage());
            return null;
        }
    }
}
