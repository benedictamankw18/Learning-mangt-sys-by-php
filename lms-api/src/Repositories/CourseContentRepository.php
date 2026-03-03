<?php

namespace App\Repositories;

use PDO;

class CourseContentRepository extends BaseRepository
{
    protected $table = 'course_content';

    public function getAll($filters = [], $limit = 50, $offset = 0)
    {
        $sql = "SELECT cc.*, 
                CONCAT(u.first_name, ' ', u.last_name) as created_by_name
                FROM {$this->table} cc
                LEFT JOIN users u ON cc.created_by = u.id
                WHERE 1=1";
        $params = [];

        if (!empty($filters['class_subject_id'])) {
            $sql .= " AND cc.class_subject_id = :class_subject_id";
            $params[':class_subject_id'] = $filters['class_subject_id'];
        }

        if (!empty($filters['type'])) {
            $sql .= " AND cc.type = :type";
            $params[':type'] = $filters['type'];
        }

        $sql .= " ORDER BY cc.order_position ASC, cc.created_at DESC LIMIT :limit OFFSET :offset";
        $params[':limit'] = (int)$limit;
        $params[':offset'] = (int)$offset;

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

    public function count($filters = [])
    {
        $sql = "SELECT COUNT(*) as total FROM {$this->table} WHERE 1=1";
        $params = [];

        if (!empty($filters['class_subject_id'])) {
            $sql .= " AND class_subject_id = :class_subject_id";
            $params[':class_subject_id'] = $filters['class_subject_id'];
        }

        if (!empty($filters['type'])) {
            $sql .= " AND type = :type";
            $params[':type'] = $filters['type'];
        }

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);

        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return $result['total'];
    }

    public function getByClassSubject($classSubjectId)
    {
        $sql = "SELECT cc.*, 
                CONCAT(u.first_name, ' ', u.last_name) as created_by_name
                FROM {$this->table} cc
                LEFT JOIN users u ON cc.created_by = u.id
                WHERE cc.class_subject_id = :class_subject_id
                ORDER BY cc.order_position ASC, cc.created_at ASC";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([':class_subject_id' => $classSubjectId]);

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function reorder($items)
    {
        foreach ($items as $item) {
            $sql = "UPDATE {$this->table} 
                   SET order_position = :order_position 
                   WHERE id = :id";

            $stmt = $this->db->prepare($sql);
            $stmt->execute([
                ':order_position' => $item['order_position'],
                ':id' => $item['id']
            ]);
        }

        return true;
    }

    public function duplicate($id, $classSubjectId = null)
    {
        $original = $this->findById($id);
        if (!$original) {
            throw new \Exception('Content not found');
        }

        $newData = [
            'title' => $original['title'] . ' (Copy)',
            'description' => $original['description'],
            'content' => $original['content'],
            'type' => $original['type'],
            'class_subject_id' => $classSubjectId ?? $original['class_subject_id'],
            'order_position' => $original['order_position'],
            'duration' => $original['duration'],
            'file_path' => $original['file_path'],
            'video_url' => $original['video_url'],
            'published' => 0,
            'created_by' => $original['created_by']
        ];

        return $this->create($newData);
    }
}
