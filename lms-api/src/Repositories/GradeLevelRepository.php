<?php

namespace App\Repositories;

use App\Config\Database;
use PDO;

class GradeLevelRepository
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance()->getConnection();
    }

    /**
     * Get all grade levels with pagination and optional institution filter
     * Includes class count
     */
    public function getAll(int $page = 1, int $limit = 20, ?int $institutionId = null): array
    {
        $offset = ($page - 1) * $limit;

        $query = "
            SELECT 
                gl.grade_level_id,
                gl.institution_id,
                gl.grade_level_code,
                gl.grade_level_name,
                gl.level_order,
                gl.description,
                gl.status,
                gl.created_at,
                gl.updated_at,
                i.institution_name,
                i.institution_code,
                COUNT(DISTINCT c.class_id) as class_count
            FROM grade_levels gl
            LEFT JOIN institutions i ON gl.institution_id = i.institution_id
            LEFT JOIN classes c ON gl.grade_level_id = c.grade_level_id
        ";

        $params = [];

        if ($institutionId !== null) {
            $query .= " WHERE gl.institution_id = :institution_id";
            $params['institution_id'] = $institutionId;
        }

        $query .= "
            GROUP BY gl.grade_level_id
            ORDER BY gl.institution_id, gl.level_order, gl.grade_level_name
            LIMIT :limit OFFSET :offset
        ";

        $stmt = $this->db->prepare($query);

        foreach ($params as $key => $value) {
            $stmt->bindValue(":$key", $value, PDO::PARAM_INT);
        }

        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Count total grade levels with optional institution filter
     */
    public function count(?int $institutionId = null): int
    {
        $query = "SELECT COUNT(*) as total FROM grade_levels";
        $params = [];

        if ($institutionId !== null) {
            $query .= " WHERE institution_id = :institution_id";
            $params['institution_id'] = $institutionId;
        }

        $stmt = $this->db->prepare($query);
        $stmt->execute($params);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);

        return (int) $result['total'];
    }

    /**
     * Get active grade levels for an institution (ordered by level_order)
     * Used for dropdowns and quick access
     */
    public function getActiveGradeLevels(?int $institutionId = null): array
    {
        $query = "
            SELECT 
                gl.grade_level_id,
                gl.institution_id,
                gl.grade_level_code,
                gl.grade_level_name,
                gl.level_order,
                gl.description,
                COUNT(DISTINCT c.class_id) as active_class_count
            FROM grade_levels gl
            LEFT JOIN classes c ON gl.grade_level_id = c.grade_level_id AND c.status = 'active'
            WHERE gl.status = 'active'
        ";

        $params = [];

        if ($institutionId !== null) {
            $query .= " AND gl.institution_id = :institution_id";
            $params['institution_id'] = $institutionId;
        }

        $query .= "
            GROUP BY gl.grade_level_id
            ORDER BY gl.level_order ASC
        ";

        $stmt = $this->db->prepare($query);
        $stmt->execute($params);

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Find a grade level by ID with institution info and statistics
     */
    public function findById(int $id): ?array
    {
        $stmt = $this->db->prepare("
            SELECT 
                gl.grade_level_id,
                gl.institution_id,
                gl.grade_level_code,
                gl.grade_level_name,
                gl.level_order,
                gl.description,
                gl.status,
                gl.created_at,
                gl.updated_at,
                i.institution_name,
                i.institution_code,
                COUNT(DISTINCT c.class_id) as class_count,
                COUNT(DISTINCT CASE WHEN c.status = 'active' THEN c.class_id END) as active_class_count
            FROM grade_levels gl
            LEFT JOIN institutions i ON gl.institution_id = i.institution_id
            LEFT JOIN classes c ON gl.grade_level_id = c.grade_level_id
            WHERE gl.grade_level_id = :id
            GROUP BY gl.grade_level_id
        ");

        $stmt->execute(['id' => $id]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);

        return $result ?: null;
    }

    /**
     * Check whether a grade level code already exists in an institution
     */
    public function existsByCode(string $gradeLevelCode, int $institutionId, ?int $excludeId = null): bool
    {
        $sql = "SELECT 1 FROM grade_levels WHERE grade_level_code = :grade_level_code AND institution_id = :institution_id";
        $params = [
            'grade_level_code' => $gradeLevelCode,
            'institution_id' => $institutionId,
        ];

        if ($excludeId !== null) {
            $sql .= " AND grade_level_id <> :exclude_id";
            $params['exclude_id'] = $excludeId;
        }

        $sql .= " LIMIT 1";

        $stmt = $this->db->prepare($sql);
        foreach ($params as $key => $value) {
            $type = in_array($key, ['institution_id', 'exclude_id'], true) ? PDO::PARAM_INT : PDO::PARAM_STR;
            $stmt->bindValue(':' . $key, $value, $type);
        }
        $stmt->execute();

        return (bool) $stmt->fetchColumn();
    }

    /**
     * Check whether a grade level order already exists in an institution
     */
    public function existsByOrder(int $levelOrder, int $institutionId, ?int $excludeId = null): bool
    {
        $sql = "SELECT 1 FROM grade_levels WHERE level_order = :level_order AND institution_id = :institution_id";
        $params = [
            'level_order' => $levelOrder,
            'institution_id' => $institutionId,
        ];

        if ($excludeId !== null) {
            $sql .= " AND grade_level_id <> :exclude_id";
            $params['exclude_id'] = $excludeId;
        }

        $sql .= " LIMIT 1";

        $stmt = $this->db->prepare($sql);
        foreach ($params as $key => $value) {
            $type = in_array($key, ['institution_id', 'level_order', 'exclude_id'], true) ? PDO::PARAM_INT : PDO::PARAM_STR;
            $stmt->bindValue(':' . $key, $value, $type);
        }
        $stmt->execute();

        return (bool) $stmt->fetchColumn();
    }

    /**
     * Get the next available grade level order for an institution
     */
    public function getNextLevelOrder(int $institutionId): int
    {
        $stmt = $this->db->prepare("SELECT COALESCE(MAX(level_order), 0) + 1 AS next_order FROM grade_levels WHERE institution_id = :institution_id");
        $stmt->execute(['institution_id' => $institutionId]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);

        return max(1, (int) ($result['next_order'] ?? 1));
    }

    /**
     * Create a new grade level
     */
    public function create(array $data): ?int
    {
        // Set defaults
        $data['status'] = $data['status'] ?? 'active';

        $stmt = $this->db->prepare("
            INSERT INTO grade_levels (
                institution_id,
                grade_level_code,
                grade_level_name,
                level_order,
                description,
                status,
                created_at,
                updated_at
            ) VALUES (
                :institution_id,
                :grade_level_code,
                :grade_level_name,
                :level_order,
                :description,
                :status,
                NOW(),
                NOW()
            )
        ");

        $result = $stmt->execute([
            'institution_id' => $data['institution_id'],
            'grade_level_code' => $data['grade_level_code'],
            'grade_level_name' => $data['grade_level_name'],
            'level_order' => $data['level_order'],
            'description' => $data['description'] ?? null,
            'status' => $data['status']
        ]);

        $gradeLevelId = (int) $this->db->lastInsertId();
        log_audit('Grade level created', ['grade_level_id' => $gradeLevelId, 'institution_id' => $data['institution_id'], 'grade_level_name' => $data['grade_level_name'], 'level_order' => $data['level_order']]);
        return $gradeLevelId;
    }

    /**
     * Update an existing grade level
     */
    public function update(int $id, array $data): bool
    {
        $fields = [];
        $params = ['id' => $id];

        // Dynamically build update query based on provided fields
        $allowedFields = [
            'grade_level_code',
            'grade_level_name',
            'level_order',
            'description',
            'status'
        ];

        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                $fields[] = "$field = :$field";
                $params[$field] = $data[$field];
            }
        }

        if (empty($fields)) {
            return false; // Nothing to update
        }

        $fields[] = "updated_at = NOW()";

        $query = "UPDATE grade_levels SET " . implode(', ', $fields) . " WHERE grade_level_id = :id";

        $stmt = $this->db->prepare($query);
        $result = $stmt->execute($params);
        if ($result) {
            log_audit('Grade level updated', ['grade_level_id' => $id, 'fields_updated' => array_keys($data)]);
        }
        return $result;
    }

    /**
     * Delete a grade level (will cascade to classes)
     */
    public function delete(int $id): bool
    {
        $stmt = $this->db->prepare("DELETE FROM grade_levels WHERE grade_level_id = :id");
        $result = $stmt->execute(['id' => $id]);
        if ($result) {
            log_audit('Grade level deleted', ['grade_level_id' => $id]);
        }
        return $result;
    }

    /**
     * Get all classes for a specific grade level
     * Includes program, academic year, and student count
     */
    public function getGradeLevelClasses(int $gradeLevelId): array
    {
        $stmt = $this->db->prepare("
            SELECT 
                c.class_id,
                c.class_code,
                c.class_name,
                c.section,
                c.max_students,
                c.room_number,
                c.status,
                p.program_id,
                p.program_name,
                p.program_code,
                /* academic_year fields removed */
                CONCAT(tu.first_name, ' ', tu.last_name) as homeroom_teacher,
                t.teacher_id as homeroom_teacher_id,
                COUNT(DISTINCT s.student_id) as student_count
            FROM classes c
            LEFT JOIN programs p ON c.program_id = p.program_id
            /* academic_year join removed */
            LEFT JOIN teachers t ON c.class_teacher_id = t.teacher_id
            LEFT JOIN users tu ON t.user_id = tu.user_id
            LEFT JOIN students s ON c.class_id = s.class_id
            WHERE c.grade_level_id = :grade_level_id
            GROUP BY c.class_id
            ORDER BY p.program_name, c.section
        ");

        $stmt->execute(['grade_level_id' => $gradeLevelId]);

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}
