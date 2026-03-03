<?php

namespace App\Repositories;

use PDO;

class CourseContentRepository extends BaseRepository
{
    protected $table = 'course_content';
    protected $primaryKey = 'course_content_id';

    public function getAll(array $filters = [], int $limit = 50, int $offset = 0): array
    {
        $sql = "SELECT cc.*, 
                CONCAT(u.first_name, ' ', u.last_name) as created_by_name
                FROM {$this->table} cc
                LEFT JOIN users u ON cc.created_by = u.user_id
                WHERE 1=1";
        $params = [];

        if (!empty($filters['course_id'])) {
            $sql .= " AND cc.course_id = :course_id";
            $params[':course_id'] = $filters['course_id'];
        }

        if (!empty($filters['section_id'])) {
            $sql .= " AND cc.section_id = :section_id";
            $params[':section_id'] = $filters['section_id'];
        }

        if (!empty($filters['teacher_id'])) {
            $sql .= " AND cc.created_by = :teacher_id";
            $params[':teacher_id'] = $filters['teacher_id'];
        }

        if (!empty($filters['type'])) {
            $sql .= " AND cc.content_type = :type";
            $params[':type'] = $filters['type'];
        }

        if (isset($filters['is_active'])) {
            $sql .= " AND cc.is_active = :is_active";
            $params[':is_active'] = $filters['is_active'];
        }

        $sql .= " ORDER BY cc.created_at DESC LIMIT :limit OFFSET :offset";
        $params[':limit'] = (int) $limit;
        $params[':offset'] = (int) $offset;

        $stmt = $this->db->prepare($sql);
        foreach ($params as $key => $value) {
            if ($key === ':limit' || $key === ':offset') {
                $stmt->bindValue($key, $value, PDO::PARAM_INT);
            } else {
                $stmt->bindValue($key, $value);
            }
        }
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function count(array $filters = []): int
    {
        $sql = "SELECT COUNT(*) as total FROM {$this->table} WHERE 1=1";
        $params = [];

        if (!empty($filters['course_id'])) {
            $sql .= " AND course_id = :course_id";
            $params[':course_id'] = $filters['course_id'];
        }

        if (!empty($filters['section_id'])) {
            $sql .= " AND section_id = :section_id";
            $params[':section_id'] = $filters['section_id'];
        }

        if (!empty($filters['teacher_id'])) {
            $sql .= " AND created_by = :teacher_id";
            $params[':teacher_id'] = $filters['teacher_id'];
        }

        if (!empty($filters['type'])) {
            $sql .= " AND content_type = :type";
            $params[':type'] = $filters['type'];
        }

        if (isset($filters['is_active'])) {
            $sql .= " AND is_active = :is_active";
            $params[':is_active'] = $filters['is_active'];
        }

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);

        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return $result['total'];
    }

    // Override to use correct primary key
    public function findById(int $id): ?array
    {
        $stmt = $this->db->prepare("SELECT * FROM {$this->table} WHERE course_content_id = :id LIMIT 1");
        $stmt->bindValue(':id', $id, PDO::PARAM_INT);
        $stmt->execute();

        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return $result ?: null;
    }

    /**
     * Find course content by UUID
     * 
     * @param string $uuid
     * @return array|null
     */
    public function findByUuid(string $uuid): ?array
    {
        // Validate UUID format
        if (!\App\Utils\UuidHelper::isValid($uuid)) {
            return null;
        }

        $stmt = $this->db->prepare("SELECT * FROM {$this->table} WHERE uuid = :uuid LIMIT 1");
        $stmt->bindValue(':uuid', $uuid);
        $stmt->execute();

        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return $result ?: null;
    }

    public function getByCourse($courseId)
    {
        $sql = "SELECT cc.*, 
                CONCAT(u.first_name, ' ', u.last_name) as created_by_name
                FROM {$this->table} cc
                LEFT JOIN users u ON cc.created_by = u.user_id
                WHERE cc.course_id = :course_id
                ORDER BY cc.created_at ASC";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([':course_id' => $courseId]);

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getBySection($sectionId)
    {
        $sql = "SELECT cc.*, 
                CONCAT(u.first_name, ' ', u.last_name) as created_by_name
                FROM {$this->table} cc
                LEFT JOIN users u ON cc.created_by = u.user_id
                WHERE cc.section_id = :section_id
                ORDER BY cc.created_at ASC";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([':section_id' => $sectionId]);

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function duplicate($id, $courseId = null, $sectionId = null)
    {
        $original = $this->findById($id);
        if (!$original) {
            throw new \Exception('Content not found');
        }

        $newData = [
            'title' => $original['title'] . ' (Copy)',
            'course_id' => $courseId ?? $original['course_id'],
            'section_id' => $sectionId ?? $original['section_id'],
            'content_text' => $original['content_text'],
            'description' => $original['description'],
            'content_type' => $original['content_type'],
            'is_active' => 0, // Set to inactive by default
            'created_by' => $original['created_by']
        ];

        return $this->create($newData);
    }

    // Override to use correct primary key
    public function update(int $id, array $data): bool
    {
        $fields = [];
        foreach (array_keys($data) as $field) {
            $fields[] = "{$field} = :{$field}";
        }

        $sql = "UPDATE {$this->table} SET " . implode(', ', $fields) . " WHERE course_content_id = :id";

        $stmt = $this->db->prepare($sql);

        foreach ($data as $key => $value) {
            $stmt->bindValue(":{$key}", $value);
        }

        $stmt->bindValue(':id', $id, PDO::PARAM_INT);

        return $stmt->execute();
    }

    // Override to use correct primary key
    public function delete(int $id): bool
    {
        $stmt = $this->db->prepare("DELETE FROM {$this->table} WHERE course_content_id = :id");
        $stmt->bindValue(':id', $id, PDO::PARAM_INT);

        return $stmt->execute();
    }
}
