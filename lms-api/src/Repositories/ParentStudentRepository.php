<?php

namespace App\Repositories;

use App\Config\Database;

class ParentStudentRepository
{
    private $db;

    public function __construct()
    {
        $this->db = Database::getInstance()->getConnection();
    }

    public function getParentStudents(int $parentId): array
    {
        try {
            $stmt = $this->db->prepare("
                SELECT ps.*, st.student_id_number, st.date_of_birth, st.gender,
                       u.first_name, u.last_name, u.email
                FROM parent_students ps
                LEFT JOIN students st ON ps.student_id = st.student_id
                LEFT JOIN users u ON st.user_id = u.user_id
                WHERE ps.parent_id = :parent_id
                ORDER BY ps.is_primary_contact DESC, u.last_name, u.first_name
            ");
            $stmt->execute(['parent_id' => $parentId]);
            return $stmt->fetchAll(\PDO::FETCH_ASSOC);
        } catch (\PDOException $e) {
            error_log("Get Parent Students Error: " . $e->getMessage());
            return [];
        }
    }

    public function getStudentParents(int $studentId): array
    {
        try {
            $stmt = $this->db->prepare("
                SELECT ps.*, p.first_name, p.last_name, p.email, p.phone_number,
                       p.address, p.occupation
                FROM parent_students ps
                LEFT JOIN parents p ON ps.parent_id = p.parent_id
                WHERE ps.student_id = :student_id
                ORDER BY ps.is_primary_contact DESC, p.last_name, p.first_name
            ");
            $stmt->execute(['student_id' => $studentId]);
            return $stmt->fetchAll(\PDO::FETCH_ASSOC);
        } catch (\PDOException $e) {
            error_log("Get Student Parents Error: " . $e->getMessage());
            return [];
        }
    }

    public function findById(int $id): ?array
    {
        try {
            $stmt = $this->db->prepare("
                SELECT ps.*, 
                       p.first_name as parent_first_name, p.last_name as parent_last_name,
                       st.student_id_number, stu.first_name as student_first_name, 
                       stu.last_name as student_last_name
                FROM parent_students ps
                LEFT JOIN parents p ON ps.parent_id = p.parent_id
                LEFT JOIN students st ON ps.student_id = st.student_id
                LEFT JOIN users stu ON st.user_id = stu.user_id
                WHERE ps.parent_student_id = :id
            ");
            $stmt->execute(['id' => $id]);
            $result = $stmt->fetch(\PDO::FETCH_ASSOC);
            return $result ?: null;
        } catch (\PDOException $e) {
            error_log("Find Parent Student Error: " . $e->getMessage());
            return null;
        }
    }

    public function create(array $data): ?int
    {
        try {
            $stmt = $this->db->prepare("
                INSERT INTO parent_students (parent_id, student_id, relationship_type, is_primary_contact, can_pickup)
                VALUES (:parent_id, :student_id, :relationship_type, :is_primary_contact, :can_pickup)
            ");
            $stmt->execute([
                'parent_id' => $data['parent_id'],
                'student_id' => $data['student_id'],
                'relationship_type' => $data['relationship_type'] ?? 'Parent',
                'is_primary_contact' => $data['is_primary_contact'] ?? 0,
                'can_pickup' => $data['can_pickup'] ?? 1
            ]);
            return (int) $this->db->lastInsertId();
        } catch (\PDOException $e) {
            error_log("Create Parent Student Error: " . $e->getMessage());
            return null;
        }
    }

    public function update(int $id, array $data): bool
    {
        try {
            $allowedFields = ['relationship_type', 'is_primary_contact', 'can_pickup'];
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

            $sql = "UPDATE parent_students SET " . implode(', ', $updates) . " WHERE parent_student_id = :id";
            $stmt = $this->db->prepare($sql);
            return $stmt->execute($params);
        } catch (\PDOException $e) {
            error_log("Update Parent Student Error: " . $e->getMessage());
            return false;
        }
    }

    public function delete(int $id): bool
    {
        try {
            $stmt = $this->db->prepare("DELETE FROM parent_students WHERE parent_student_id = :id");
            return $stmt->execute(['id' => $id]);
        } catch (\PDOException $e) {
            error_log("Delete Parent Student Error: " . $e->getMessage());
            return false;
        }
    }

    public function relationshipExists(int $parentId, int $studentId): bool
    {
        try {
            $stmt = $this->db->prepare("
                SELECT COUNT(*) as count FROM parent_students
                WHERE parent_id = :parent_id AND student_id = :student_id
            ");
            $stmt->execute([
                'parent_id' => $parentId,
                'student_id' => $studentId
            ]);
            $result = $stmt->fetch(\PDO::FETCH_ASSOC);
            return $result['count'] > 0;
        } catch (\PDOException $e) {
            error_log("Check Parent Student Relationship Error: " . $e->getMessage());
            return false;
        }
    }
}
