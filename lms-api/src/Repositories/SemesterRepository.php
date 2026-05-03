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
            $stmt = $this->db->prepare(
                "SELECT s.*, ay.year_name
                 FROM semesters s
                 LEFT JOIN academic_years ay ON s.academic_year_id = ay.academic_year_id
                 WHERE s.semester_id = :id"
            );
            $stmt->bindValue(':id', $id, \PDO::PARAM_INT);
            $stmt->execute();
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
            $institutionId = (int) $data['institution_id'];
            $isCurrent = !empty($data['is_current']) ? 1 : 0;

            $this->db->beginTransaction();

            if ($isCurrent === 1) {
                $this->clearCurrentForInstitution($institutionId);
            }

            $stmt = $this->db->prepare(
                "INSERT INTO semesters (institution_id, academic_year_id, semester_name, start_date, end_date, is_current)
                 VALUES (:institution_id, :academic_year_id, :semester_name, :start_date, :end_date, :is_current)"
            );
            $stmt->bindValue(':institution_id', $institutionId, \PDO::PARAM_INT);
            $stmt->bindValue(':academic_year_id', (int) $data['academic_year_id'], \PDO::PARAM_INT);
            $stmt->bindValue(':semester_name', (string) $data['semester_name'], \PDO::PARAM_STR);
            $stmt->bindValue(':start_date', (string) $data['start_date'], \PDO::PARAM_STR);
            $stmt->bindValue(':end_date', (string) $data['end_date'], \PDO::PARAM_STR);
            $stmt->bindValue(':is_current', $isCurrent, \PDO::PARAM_INT);
            $stmt->execute();

            $this->db->commit();
            return (int) $this->db->lastInsertId();
        } catch (\PDOException $e) {
            if ($this->db->inTransaction()) {
                $this->db->rollBack();
            }
            error_log("Create Semester Error: " . $e->getMessage());
            return null;
        }
    }

    public function academicYearBelongsToInstitution(int $academicYearId, int $institutionId): bool
    {
        try {
            $stmt = $this->db->prepare(
                'SELECT 1 FROM academic_years WHERE academic_year_id = :academic_year_id AND institution_id = :institution_id LIMIT 1'
            );
            $stmt->bindValue(':academic_year_id', $academicYearId, \PDO::PARAM_INT);
            $stmt->bindValue(':institution_id', $institutionId, \PDO::PARAM_INT);
            $stmt->execute();

            return (bool) $stmt->fetchColumn();
        } catch (\PDOException $e) {
            error_log('Check Semester Academic Year Error: ' . $e->getMessage());
            return false;
        }
    }

    public function existsBySemesterName(string $semesterName, int $academicYearId, int $institutionId, ?int $excludeId = null): bool
    {
        try {
            $sql = 'SELECT 1 FROM semesters WHERE semester_name = :semester_name AND academic_year_id = :academic_year_id AND institution_id = :institution_id';
            if ($excludeId !== null) {
                $sql .= ' AND semester_id <> :exclude_id';
            }
            $sql .= ' LIMIT 1';

            $stmt = $this->db->prepare($sql);
            $stmt->bindValue(':semester_name', $semesterName, \PDO::PARAM_STR);
            $stmt->bindValue(':academic_year_id', $academicYearId, \PDO::PARAM_INT);
            $stmt->bindValue(':institution_id', $institutionId, \PDO::PARAM_INT);
            if ($excludeId !== null) {
                $stmt->bindValue(':exclude_id', $excludeId, \PDO::PARAM_INT);
            }
            $stmt->execute();

            return (bool) $stmt->fetchColumn();
        } catch (\PDOException $e) {
            error_log('Check Duplicate Semester Error: ' . $e->getMessage());
            return false;
        }
    }

    public function update(int $id, array $data): bool
    {
        try {
            $allowedFields = [
                'institution_id',
                'academic_year_id',
                'semester_name',
                'start_date',
                'end_date'
            ];

            $updates = [];
            $params = ['id' => $id];

            $existing = $this->findById($id);
            if (!$existing) {
                return false;
            }

            $institutionId = array_key_exists('institution_id', $data)
                ? (int) $data['institution_id']
                : (int) $existing['institution_id'];

            foreach ($allowedFields as $field) {
                if (array_key_exists($field, $data)) {
                    $updates[] = "$field = :$field";
                    $params[$field] = $data[$field];
                }
            }

            if (array_key_exists('is_current', $data)) {
                $isCurrent = !empty($data['is_current']) ? 1 : 0;
                $updates[] = 'is_current = :is_current';
                $params['is_current'] = $isCurrent;
            } else {
                $isCurrent = null;
            }

            if (empty($updates)) {
                return false;
            }

            $this->db->beginTransaction();

            if ($isCurrent === 1) {
                $this->clearCurrentForInstitution($institutionId, $id);
            }

            $sql = 'UPDATE semesters SET ' . implode(', ', $updates) . ' WHERE semester_id = :id';
            $stmt = $this->db->prepare($sql);
            foreach ($params as $key => $value) {
                $type = in_array($key, ['id', 'institution_id', 'academic_year_id', 'is_current'], true)
                    ? \PDO::PARAM_INT
                    : \PDO::PARAM_STR;
                $stmt->bindValue(':' . $key, $value, $type);
            }
            $result = $stmt->execute();

            if ($result) {
                $this->db->commit();
                return true;
            }

            $this->db->rollBack();
            return false;
        } catch (\PDOException $e) {
            if ($this->db->inTransaction()) {
                $this->db->rollBack();
            }
            error_log("Update Semester Error: " . $e->getMessage());
            return false;
        }
    }

    public function delete(int $id): bool
    {
        try {
            $stmt = $this->db->prepare('DELETE FROM semesters WHERE semester_id = :id');
            $stmt->bindValue(':id', $id, \PDO::PARAM_INT);
            return $stmt->execute();
        } catch (\PDOException $e) {
            error_log("Delete Semester Error: " . $e->getMessage());
            return false;
        }
    }

    public function getCurrent(?int $institutionId = null): ?array
    {
        try {
            $sql = "
                SELECT s.*, ay.year_name
                FROM semesters s
                LEFT JOIN academic_years ay ON s.academic_year_id = ay.academic_year_id
                WHERE s.is_current = 1
            ";

            if ($institutionId !== null) {
                $sql .= ' AND s.institution_id = :institution_id';
            }

            $sql .= ' ORDER BY s.semester_id DESC LIMIT 1';

            $stmt = $this->db->prepare($sql);

            if ($institutionId !== null) {
                $stmt->bindValue(':institution_id', $institutionId, \PDO::PARAM_INT);
            }

            $stmt->execute();
            $result = $stmt->fetch(\PDO::FETCH_ASSOC);
            return $result ?: null;
        } catch (\PDOException $e) {
            error_log("Get Current Semester Error: " . $e->getMessage());
            return null;
        }
    }

    private function clearCurrentForInstitution(int $institutionId, ?int $excludeId = null): void
    {
        $sql = 'UPDATE semesters SET is_current = 0 WHERE institution_id = :institution_id';

        if ($excludeId !== null) {
            $sql .= ' AND semester_id <> :exclude_id';
        }

        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(':institution_id', $institutionId, \PDO::PARAM_INT);
        if ($excludeId !== null) {
            $stmt->bindValue(':exclude_id', $excludeId, \PDO::PARAM_INT);
        }
        $stmt->execute();
    }
}
