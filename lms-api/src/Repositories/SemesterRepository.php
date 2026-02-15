<?php

namespace App\Repositories;

use App\Config\Database;

class SemesterRepository
{
    private $db;

    public function __construct()
    {
        $this->db = Database::getInstance()->getConnection();
    }

    public function getAll(int $page = 1, int $limit = 20, ?int $academicYearId = null): array
    {
        try {
            $offset = ($page - 1) * $limit;
            $sql = "
                SELECT s.*, ay.year_name
                FROM semesters s
                LEFT JOIN academic_years ay ON s.academic_year_id = ay.academic_year_id
            ";

            if ($academicYearId) {
                $sql .= " WHERE s.academic_year_id = :academic_year_id";
            }

            $sql .= " ORDER BY s.start_date DESC LIMIT :limit OFFSET :offset";

            $stmt = $this->db->prepare($sql);
            $stmt->bindValue(':limit', $limit, \PDO::PARAM_INT);
            $stmt->bindValue(':offset', $offset, \PDO::PARAM_INT);

            if ($academicYearId) {
                $stmt->bindValue(':academic_year_id', $academicYearId, \PDO::PARAM_INT);
            }

            $stmt->execute();
            return $stmt->fetchAll(\PDO::FETCH_ASSOC);
        } catch (\PDOException $e) {
            error_log("Get Semesters Error: " . $e->getMessage());
            return [];
        }
    }

    public function count(?int $academicYearId = null): int
    {
        try {
            $sql = "SELECT COUNT(*) as total FROM semesters";
            if ($academicYearId) {
                $sql .= " WHERE academic_year_id = :academic_year_id";
            }

            $stmt = $this->db->prepare($sql);
            if ($academicYearId) {
                $stmt->bindValue(':academic_year_id', $academicYearId, \PDO::PARAM_INT);
            }

            $stmt->execute();
            $result = $stmt->fetch(\PDO::FETCH_ASSOC);
            return (int) $result['total'];
        } catch (\PDOException $e) {
            error_log("Count Semesters Error: " . $e->getMessage());
            return 0;
        }
    }

    public function findById(int $id): ?array
    {
        try {
            $stmt = $this->db->prepare("
                SELECT s.*, ay.year_name
                FROM semesters s
                LEFT JOIN academic_years ay ON s.academic_year_id = ay.academic_year_id
                WHERE s.semester_id = :id
            ");
            $stmt->execute(['id' => $id]);
            $result = $stmt->fetch(\PDO::FETCH_ASSOC);
            return $result ?: null;
        } catch (\PDOException $e) {
            error_log("Find Semester Error: " . $e->getMessage());
            return null;
        }
    }

    public function create(array $data): ?int
    {
        try {
            $stmt = $this->db->prepare("
                INSERT INTO semesters (academic_year_id, semester_name, start_date, end_date, is_current)
                VALUES (:academic_year_id, :semester_name, :start_date, :end_date, :is_current)
            ");
            $stmt->execute([
                'academic_year_id' => $data['academic_year_id'],
                'semester_name' => $data['semester_name'],
                'start_date' => $data['start_date'],
                'end_date' => $data['end_date'],
                'is_current' => $data['is_current'] ?? 0
            ]);
            return (int) $this->db->lastInsertId();
        } catch (\PDOException $e) {
            error_log("Create Semester Error: " . $e->getMessage());
            return null;
        }
    }

    public function update(int $id, array $data): bool
    {
        try {
            $allowedFields = ['academic_year_id', 'semester_name', 'start_date', 'end_date', 'is_current'];
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

            $sql = "UPDATE semesters SET " . implode(', ', $updates) . " WHERE semester_id = :id";
            $stmt = $this->db->prepare($sql);
            return $stmt->execute($params);
        } catch (\PDOException $e) {
            error_log("Update Semester Error: " . $e->getMessage());
            return false;
        }
    }

    public function delete(int $id): bool
    {
        try {
            $stmt = $this->db->prepare("DELETE FROM semesters WHERE semester_id = :id");
            return $stmt->execute(['id' => $id]);
        } catch (\PDOException $e) {
            error_log("Delete Semester Error: " . $e->getMessage());
            return false;
        }
    }

    public function getCurrent(): ?array
    {
        try {
            $stmt = $this->db->query("
                SELECT s.*, ay.year_name
                FROM semesters s
                LEFT JOIN academic_years ay ON s.academic_year_id = ay.academic_year_id
                WHERE s.is_current = 1
                LIMIT 1
            ");
            $result = $stmt->fetch(\PDO::FETCH_ASSOC);
            return $result ?: null;
        } catch (\PDOException $e) {
            error_log("Get Current Semester Error: " . $e->getMessage());
            return null;
        }
    }
}
