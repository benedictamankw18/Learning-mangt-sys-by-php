<?php

namespace App\Repositories;

use App\Config\Database;

class AcademicYearRepository
{
    private $db;

    public function __construct()
    {
        $this->db = Database::getInstance()->getConnection();
    }

    public function getAll(int $page = 1, int $limit = 20, ?int $institutionId = null): array
    {
        try {
            $offset = ($page - 1) * $limit;
            $where = '';
            $params = [];

            if ($institutionId !== null) {
                $where = 'WHERE institution_id = :institution_id';
                $params['institution_id'] = $institutionId;
            }

            $stmt = $this->db->prepare("SELECT * FROM academic_years $where ORDER BY start_date DESC LIMIT :limit OFFSET :offset");

            foreach ($params as $key => $value) {
                $stmt->bindValue(':' . $key, $value, \PDO::PARAM_INT);
            }

            $stmt->bindValue(':limit', $limit, \PDO::PARAM_INT);
            $stmt->bindValue(':offset', $offset, \PDO::PARAM_INT);
            $stmt->execute();

            return $stmt->fetchAll(\PDO::FETCH_ASSOC);
        } catch (\PDOException $e) {
            error_log("Get Academic Years Error: " . $e->getMessage());
            return [];
        }
    }

    public function count(?int $institutionId = null): int
    {
        try {
            if ($institutionId !== null) {
                $stmt = $this->db->prepare("SELECT COUNT(*) as total FROM academic_years WHERE institution_id = :institution_id");
                $stmt->execute(['institution_id' => $institutionId]);
            } else {
                $stmt = $this->db->query("SELECT COUNT(*) as total FROM academic_years");
            }

            $result = $stmt->fetch(\PDO::FETCH_ASSOC);
            return (int) $result['total'];
        } catch (\PDOException $e) {
            error_log("Count Academic Years Error: " . $e->getMessage());
            return 0;
        }
    }

    public function findById(int $id, ?int $institutionId = null): ?array
    {
        try {
            $sql = "SELECT * FROM academic_years WHERE academic_year_id = :id";
            $params = ['id' => $id];

            if ($institutionId !== null) {
                $sql .= " AND institution_id = :institution_id";
                $params['institution_id'] = $institutionId;
            }

            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);
            $result = $stmt->fetch(\PDO::FETCH_ASSOC);
            return $result ?: null;
        } catch (\PDOException $e) {
            error_log("Find Academic Year Error: " . $e->getMessage());
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

            $stmt = $this->db->prepare("\n                INSERT INTO academic_years (institution_id, year_name, start_date, end_date, is_current)\n                VALUES (:institution_id, :year_name, :start_date, :end_date, :is_current)\n            ");
            $stmt->bindValue(':institution_id', $institutionId, \PDO::PARAM_INT);
            $stmt->bindValue(':year_name', (string) $data['year_name'], \PDO::PARAM_STR);
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
            error_log("Create Academic Year Error: " . $e->getMessage());
            return null;
        }
    }

    public function existsByYearName(string $yearName, int $institutionId, ?int $excludeId = null): bool
    {
        try {
            $sql = 'SELECT 1 FROM academic_years WHERE year_name = :year_name AND institution_id = :institution_id';
            if ($excludeId !== null) {
                $sql .= ' AND academic_year_id <> :exclude_id';
            }
            $sql .= ' LIMIT 1';

            $stmt = $this->db->prepare($sql);
            $stmt->bindValue(':year_name', $yearName, \PDO::PARAM_STR);
            $stmt->bindValue(':institution_id', $institutionId, \PDO::PARAM_INT);
            if ($excludeId !== null) {
                $stmt->bindValue(':exclude_id', $excludeId, \PDO::PARAM_INT);
            }
            $stmt->execute();

            return (bool) $stmt->fetchColumn();
        } catch (\PDOException $e) {
            error_log('Exists Academic Year Error: ' . $e->getMessage());
            return false;
        }
    }

public function update(int $id, array $data): bool
{
    try {
        // Fields allowed to be updated (exclude is_current here)
        $allowedFields = ['institution_id', 'year_name', 'start_date', 'end_date'];

        $updates = [];
        $params = ['id' => $id];

        // Get existing record
        $existing = $this->findById($id);
        if (!$existing) {
            return false;
        }

        // Determine institution_id (needed if we update is_current)
        $institutionId = array_key_exists('institution_id', $data)
            ? (int) $data['institution_id']
            : (int) $existing['institution_id'];

        // Handle normal fields
        foreach ($allowedFields as $field) {
            if (array_key_exists($field, $data)) {
                $updates[] = "$field = :$field";
                $params[$field] = $data[$field];
            }
        }

        // Handle is_current separately (normalize to 0/1)
        if (array_key_exists('is_current', $data)) {
            $isCurrent = !empty($data['is_current']) ? 1 : 0;

            $updates[] = "is_current = :is_current";
            $params['is_current'] = $isCurrent;
        } else {
            $isCurrent = null;
        }

        // Nothing to update
        if (empty($updates)) {
            return false;
        }

        $this->db->beginTransaction();

        // Ensure only one current academic year per institution
        if ($isCurrent === 1) {
            $this->clearCurrentForInstitution($institutionId, $id);
        }

        // Build and execute query
        $sql = "UPDATE academic_years 
                SET " . implode(', ', $updates) . " 
                WHERE academic_year_id = :id";

        $stmt = $this->db->prepare($sql);
        foreach ($params as $key => $value) {
            $type = in_array($key, ['id', 'institution_id', 'is_current'], true) ? \PDO::PARAM_INT : \PDO::PARAM_STR;
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

        error_log("Update Academic Year Error: " . $e->getMessage());
        return false;
    }
}

    public function delete(int $id): bool
    {
        try {
            $stmt = $this->db->prepare("DELETE FROM academic_years WHERE academic_year_id = :id");
            return $stmt->execute(['id' => $id]);
        } catch (\PDOException $e) {
            error_log("Delete Academic Year Error: " . $e->getMessage());
            return false;
        }
    }

    public function getCurrent(?int $institutionId = null): ?array
    {
        try {
            if ($institutionId !== null) {
                $stmt = $this->db->prepare("SELECT * FROM academic_years WHERE is_current = 1 AND institution_id = :institution_id ORDER BY academic_year_id DESC LIMIT 1");
                $stmt->execute(['institution_id' => $institutionId]);
            } else {
                $stmt = $this->db->query("SELECT * FROM academic_years WHERE is_current = 1 ORDER BY academic_year_id DESC LIMIT 1");
            }

            $result = $stmt->fetch(\PDO::FETCH_ASSOC);
            return $result ?: null;
        } catch (\PDOException $e) {
            error_log("Get Current Academic Year Error: " . $e->getMessage());
            return null;
        }
    }

    private function clearCurrentForInstitution(int $institutionId, ?int $excludeId = null): void
    {
        $sql = "UPDATE academic_years SET is_current = 0 WHERE institution_id = :institution_id";
        if ($excludeId !== null) {
            $sql .= " AND academic_year_id <> :exclude_id";
        }

        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(':institution_id', $institutionId, \PDO::PARAM_INT);
        if ($excludeId !== null) {
            $stmt->bindValue(':exclude_id', $excludeId, \PDO::PARAM_INT);
        }
        $stmt->execute();
    }
}
