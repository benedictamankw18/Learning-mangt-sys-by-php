<?php

namespace App\Repositories;

use App\Config\Database;
use PDO;

class ProgramRepository
{
    private $db;

    public function __construct()
    {
        $this->db = Database::getInstance()->getConnection();
    }

    /**
     * Get all programs with pagination
     * 
     * @param int $page
     * @param int $limit
     * @param int|null $institutionId
     * @param string $search
     * @param string $status
     * @return array
     */
    public function getAll(
        int $page = 1,
        int $limit = 20,
        ?int $institutionId = null,
        string $search = '',
        string $status = ''
    ): array
    {
        try {
            $offset = ($page - 1) * $limit;

            $sql = "
                SELECT 
                    p.*,
                    i.institution_name,
                    i.institution_code,
                    (SELECT COUNT(*) FROM classes WHERE program_id = p.program_id) as class_count
                FROM programs p
                LEFT JOIN institutions i ON p.institution_id = i.institution_id
            ";

            $conditions = [];

            if ($institutionId) {
                $conditions[] = 'p.institution_id = :institution_id';
            }

            if ($search !== '') {
                $conditions[] = '(p.program_name LIKE :search_name OR p.program_code LIKE :search_code)';
            }

            if (in_array($status, ['active', 'inactive'], true)) {
                $conditions[] = 'p.status = :status';
            }

            if ($conditions) {
                $sql .= ' WHERE ' . implode(' AND ', $conditions);
            }

            $sql .= " ORDER BY p.program_name ASC LIMIT :limit OFFSET :offset";

            $stmt = $this->db->prepare($sql);

            if ($institutionId) {
                $stmt->bindValue(':institution_id', $institutionId, PDO::PARAM_INT);
            }

            if ($search !== '') {
                $searchTerm = '%' . $search . '%';
                $stmt->bindValue(':search_name', $searchTerm, PDO::PARAM_STR);
                $stmt->bindValue(':search_code', $searchTerm, PDO::PARAM_STR);
            }

            if (in_array($status, ['active', 'inactive'], true)) {
                $stmt->bindValue(':status', $status, PDO::PARAM_STR);
            }

            $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
            $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
            $stmt->execute();

            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (\PDOException $e) {
            error_log("Get Programs Error: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Get total count of programs
     * 
     * @param int|null $institutionId
     * @param string $search
     * @param string $status
     * @return int
     */
    public function count(?int $institutionId = null, string $search = '', string $status = ''): int
    {
        try {
            $sql = "SELECT COUNT(*) as total FROM programs";
            $conditions = [];

            if ($institutionId) {
                $conditions[] = 'institution_id = :institution_id';
            }

            if ($search !== '') {
                $conditions[] = '(program_name LIKE :search_name OR program_code LIKE :search_code)';
            }

            if (in_array($status, ['active', 'inactive'], true)) {
                $conditions[] = 'status = :status';
            }

            if ($conditions) {
                $sql .= ' WHERE ' . implode(' AND ', $conditions);
            }

            $stmt = $this->db->prepare($sql);

            if ($institutionId) {
                $stmt->bindValue(':institution_id', $institutionId, PDO::PARAM_INT);
            }

            if ($search !== '') {
                $searchTerm = '%' . $search . '%';
                $stmt->bindValue(':search_name', $searchTerm, PDO::PARAM_STR);
                $stmt->bindValue(':search_code', $searchTerm, PDO::PARAM_STR);
            }

            if (in_array($status, ['active', 'inactive'], true)) {
                $stmt->bindValue(':status', $status, PDO::PARAM_STR);
            }

            $stmt->execute();
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            return (int) $result['total'];
        } catch (\PDOException $e) {
            error_log("Count Programs Error: " . $e->getMessage());
            return 0;
        }
    }

    /**
     * Get active programs only
     * 
     * @param int|null $institutionId
     * @return array
     */
    public function getActivePrograms(?int $institutionId = null): array
    {
        try {
            $sql = "
                SELECT 
                    p.*,
                    i.institution_name,
                    i.institution_code,
                    (SELECT COUNT(*) FROM classes WHERE program_id = p.program_id AND status = 'active') as active_class_count
                FROM programs p
                LEFT JOIN institutions i ON p.institution_id = i.institution_id
                WHERE p.status = 'active'
            ";

            if ($institutionId) {
                $sql .= " AND p.institution_id = :institution_id";
            }

            $sql .= " ORDER BY p.program_name ASC";

            $stmt = $this->db->prepare($sql);

            if ($institutionId) {
                $stmt->bindValue(':institution_id', $institutionId, PDO::PARAM_INT);
            }

            $stmt->execute();
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (\PDOException $e) {
            error_log("Get Active Programs Error: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Find program by ID
     * 
     * @param int $id
     * @return array|null
     */
    public function findById(int $id): ?array
    {
        try {
            $stmt = $this->db->prepare("
                SELECT 
                    p.*,
                    i.institution_name,
                    i.institution_code,
                    (SELECT COUNT(*) FROM classes WHERE program_id = p.program_id) as class_count,
                    (SELECT COUNT(*) FROM classes WHERE program_id = p.program_id AND status = 'active') as active_class_count
                FROM programs p
                LEFT JOIN institutions i ON p.institution_id = i.institution_id
                WHERE p.program_id = :id
            ");
            $stmt->execute(['id' => $id]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            return $result ?: null;
        } catch (\PDOException $e) {
            error_log("Find Program Error: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Create a new program
     * 
     * @param array $data
     * @return int|null
     */
    public function create(array $data): ?int
    {
        try {
            $stmt = $this->db->prepare("
                INSERT INTO programs (
                    institution_id, program_code, program_name, 
                    description, duration_years, status
                )
                VALUES (
                    :institution_id, :program_code, :program_name,
                    :description, :duration_years, :status
                )
            ");

            $stmt->execute([
                'institution_id' => $data['institution_id'],
                'program_code' => $data['program_code'],
                'program_name' => $data['program_name'],
                'description' => $data['description'] ?? null,
                'duration_years' => $data['duration_years'] ?? 3,
                'status' => $data['status'] ?? 'active'
            ]);

            return (int) $this->db->lastInsertId();
        } catch (\PDOException $e) {
            error_log("Create Program Error: " . $e->getMessage());
            if ($e->errorInfo[1] === 1062) {
                throw new \RuntimeException('Program code already exists', 409);
            }
            return null;
        }
    }

    /**
     * Update a program
     * 
     * @param int $id
     * @param array $data
     * @return bool
     */
    public function update(int $id, array $data): bool
    {
        try {
            $allowedFields = [
                'institution_id',
                'program_code',
                'program_name',
                'description',
                'duration_years',
                'status'
            ];

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

            $sql = "UPDATE programs SET " . implode(', ', $updates) . " WHERE program_id = :id";
            $stmt = $this->db->prepare($sql);
            return $stmt->execute($params);
        } catch (\PDOException $e) {
            error_log("Update Program Error: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Delete a program
     * 
     * @param int $id
     * @return bool
     */
    public function delete(int $id): bool
    {
        try {
            $stmt = $this->db->prepare("DELETE FROM programs WHERE program_id = :id");
            return $stmt->execute(['id' => $id]);
        } catch (\PDOException $e) {
            error_log("Delete Program Error: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Get classes for a program
     * 
     * @param int $id
     * @return array
     */
    public function getProgramClasses(int $id): array
    {
        try {
            $stmt = $this->db->prepare("
                SELECT 
                    c.*,
                    g.grade_level_name,
                    g.grade_level_code,
                    g.level_order,
                    (SELECT COUNT(*) FROM students WHERE class_id = c.class_id) as student_count
                FROM classes c
                LEFT JOIN grade_levels g ON c.grade_level_id = g.grade_level_id
                WHERE c.program_id = :id
                ORDER BY g.level_order ASC, c.class_name ASC
            ");
            $stmt->execute(['id' => $id]);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (\PDOException $e) {
            error_log("Get Program Classes Error: " . $e->getMessage());
            return [];
        }
    }
}
