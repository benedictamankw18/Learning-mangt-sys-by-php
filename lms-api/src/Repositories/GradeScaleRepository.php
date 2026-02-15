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

    public function getAll(): array
    {
        try {
            $stmt = $this->db->query("SELECT * FROM grade_scales ORDER BY min_score DESC");
            return $stmt->fetchAll(\PDO::FETCH_ASSOC);
        } catch (\PDOException $e) {
            error_log("Get Grade Scales Error: " . $e->getMessage());
            return [];
        }
    }

    public function findById(int $id): ?array
    {
        try {
            $stmt = $this->db->prepare("SELECT * FROM grade_scales WHERE grade_scale_id = :id");
            $stmt->execute(['id' => $id]);
            $result = $stmt->fetch(\PDO::FETCH_ASSOC);
            return $result ?: null;
        } catch (\PDOException $e) {
            error_log("Find Grade Scale Error: " . $e->getMessage());
            return null;
        }
    }

    public function create(array $data): ?int
    {
        try {
            $stmt = $this->db->prepare("
                INSERT INTO grade_scales (grade, min_score, max_score, grade_point, remark)
                VALUES (:grade, :min_score, :max_score, :grade_point, :remark)
            ");
            $stmt->execute([
                'grade' => $data['grade'],
                'min_score' => $data['min_score'],
                'max_score' => $data['max_score'],
                'grade_point' => $data['grade_point'] ?? null,
                'remark' => $data['remark'] ?? null
            ]);
            return (int) $this->db->lastInsertId();
        } catch (\PDOException $e) {
            error_log("Create Grade Scale Error: " . $e->getMessage());
            return null;
        }
    }

    public function update(int $id, array $data): bool
    {
        try {
            $allowedFields = ['grade', 'min_score', 'max_score', 'grade_point', 'remark'];
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

            $sql = "UPDATE grade_scales SET " . implode(', ', $updates) . " WHERE grade_scale_id = :id";
            $stmt = $this->db->prepare($sql);
            return $stmt->execute($params);
        } catch (\PDOException $e) {
            error_log("Update Grade Scale Error: " . $e->getMessage());
            return false;
        }
    }

    public function delete(int $id): bool
    {
        try {
            $stmt = $this->db->prepare("DELETE FROM grade_scales WHERE grade_scale_id = :id");
            return $stmt->execute(['id' => $id]);
        } catch (\PDOException $e) {
            error_log("Delete Grade Scale Error: " . $e->getMessage());
            return false;
        }
    }

    public function getGradeForScore(float $score): ?array
    {
        try {
            $stmt = $this->db->prepare("
                SELECT * FROM grade_scales
                WHERE :score BETWEEN min_score AND max_score
                LIMIT 1
            ");
            $stmt->execute(['score' => $score]);
            $result = $stmt->fetch(\PDO::FETCH_ASSOC);
            return $result ?: null;
        } catch (\PDOException $e) {
            error_log("Get Grade For Score Error: " . $e->getMessage());
            return null;
        }
    }
}
