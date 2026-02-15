<?php

namespace App\Repositories;

use PDO;
use App\Config\Database;

class CourseMaterialRepository
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance()->getConnection();
    }

    /**
     * Get all materials for a course
     */
    public function getCourseMaterials(int $courseId): array
    {
        $stmt = $this->db->prepare("
            SELECT *
            FROM course_materials
            WHERE course_id = :course_id AND is_active = 1
            ORDER BY order_index ASC, created_at DESC
        ");

        $stmt->execute(['course_id' => $courseId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Find material by ID
     */
    public function findById(int $id): ?array
    {
        $stmt = $this->db->prepare("
            SELECT *
            FROM course_materials
            WHERE material_id = :id
        ");

        $stmt->execute(['id' => $id]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return $result ?: null;
    }

    /**
     * Create a new material
     */
    public function create(array $data): int
    {
        $stmt = $this->db->prepare("
            INSERT INTO course_materials (
                course_id,
                title,
                description,
                material_type,
                file_path,
                file_size,
                order_index,
                is_active
            ) VALUES (
                :course_id,
                :title,
                :description,
                :material_type,
                :file_path,
                :file_size,
                :order_index,
                :is_active
            )
        ");

        $stmt->execute([
            'course_id' => $data['course_id'],
            'title' => $data['title'],
            'description' => $data['description'] ?? null,
            'material_type' => $data['material_type'] ?? 'document',
            'file_path' => $data['file_path'] ?? null,
            'file_size' => $data['file_size'] ?? null,
            'order_index' => $data['order_index'] ?? 0,
            'is_active' => $data['is_active'] ?? 1
        ]);

        return (int) $this->db->lastInsertId();
    }

    /**
     * Update a material
     */
    public function update(int $id, array $data): bool
    {
        $fields = [];
        $params = ['id' => $id];

        $allowedFields = ['title', 'description', 'material_type', 'file_path', 'file_size', 'order_index', 'is_active'];

        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                $fields[] = "{$field} = :{$field}";
                $params[$field] = $data[$field];
            }
        }

        if (empty($fields)) {
            return false;
        }

        $sql = "UPDATE course_materials SET " . implode(', ', $fields) . " WHERE material_id = :id";
        $stmt = $this->db->prepare($sql);
        return $stmt->execute($params);
    }

    /**
     * Delete a material (soft delete)
     */
    public function delete(int $id): bool
    {
        $stmt = $this->db->prepare("UPDATE course_materials SET is_active = 0 WHERE material_id = :id");
        return $stmt->execute(['id' => $id]);
    }

    /**
     * Hard delete a material
     */
    public function hardDelete(int $id): bool
    {
        $stmt = $this->db->prepare("DELETE FROM course_materials WHERE material_id = :id");
        return $stmt->execute(['id' => $id]);
    }

    /**
     * Count materials for a course
     */
    public function countCourseMaterials(int $courseId): int
    {
        $stmt = $this->db->prepare("
            SELECT COUNT(*) as total
            FROM course_materials
            WHERE course_id = :course_id AND is_active = 1
        ");

        $stmt->execute(['course_id' => $courseId]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return (int) $result['total'];
    }
}
