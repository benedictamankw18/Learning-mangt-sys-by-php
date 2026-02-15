<?php

namespace App\Repositories;

use App\Config\Database;

class TeacherSubjectRepository
{
    private $db;

    public function __construct()
    {
        $this->db = Database::getInstance()->getConnection();
    }

    public function getTeacherSubjects(int $teacherId): array
    {
        try {
            $stmt = $this->db->prepare("
                SELECT ts.*, s.subject_name, s.subject_code, s.credits, s.is_core,
                       t.employee_id, u.first_name, u.last_name
                FROM teacher_subjects ts
                LEFT JOIN subjects s ON ts.subject_id = s.subject_id
                LEFT JOIN teachers t ON ts.teacher_id = t.teacher_id
                LEFT JOIN users u ON t.user_id = u.user_id
                WHERE ts.teacher_id = :teacher_id
                ORDER BY s.subject_name
            ");
            $stmt->execute(['teacher_id' => $teacherId]);
            return $stmt->fetchAll(\PDO::FETCH_ASSOC);
        } catch (\PDOException $e) {
            error_log("Get Teacher Subjects Error: " . $e->getMessage());
            return [];
        }
    }

    public function getSubjectTeachers(int $subjectId): array
    {
        try {
            $stmt = $this->db->prepare("
                SELECT ts.*, t.employee_id, t.department, t.qualification,
                       u.first_name, u.last_name, u.email, u.phone_number
                FROM teacher_subjects ts
                LEFT JOIN teachers t ON ts.teacher_id = t.teacher_id
                LEFT JOIN users u ON t.user_id = u.user_id
                WHERE ts.subject_id = :subject_id
                ORDER BY u.last_name, u.first_name
            ");
            $stmt->execute(['subject_id' => $subjectId]);
            return $stmt->fetchAll(\PDO::FETCH_ASSOC);
        } catch (\PDOException $e) {
            error_log("Get Subject Teachers Error: " . $e->getMessage());
            return [];
        }
    }

    public function findById(int $id): ?array
    {
        try {
            $stmt = $this->db->prepare("
                SELECT ts.*, s.subject_name, s.subject_code,
                       t.employee_id, u.first_name, u.last_name
                FROM teacher_subjects ts
                LEFT JOIN subjects s ON ts.subject_id = s.subject_id
                LEFT JOIN teachers t ON ts.teacher_id = t.teacher_id
                LEFT JOIN users u ON t.user_id = u.user_id
                WHERE ts.teacher_subject_id = :id
            ");
            $stmt->execute(['id' => $id]);
            $result = $stmt->fetch(\PDO::FETCH_ASSOC);
            return $result ?: null;
        } catch (\PDOException $e) {
            error_log("Find Teacher Subject Error: " . $e->getMessage());
            return null;
        }
    }

    public function create(array $data): ?int
    {
        try {
            $stmt = $this->db->prepare("
                INSERT INTO teacher_subjects (teacher_id, subject_id, assigned_date)
                VALUES (:teacher_id, :subject_id, :assigned_date)
            ");
            $stmt->execute([
                'teacher_id' => $data['teacher_id'],
                'subject_id' => $data['subject_id'],
                'assigned_date' => $data['assigned_date'] ?? date('Y-m-d')
            ]);
            return (int) $this->db->lastInsertId();
        } catch (\PDOException $e) {
            error_log("Create Teacher Subject Error: " . $e->getMessage());
            return null;
        }
    }

    public function update(int $id, array $data): bool
    {
        try {
            $allowedFields = ['assigned_date'];
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

            $sql = "UPDATE teacher_subjects SET " . implode(', ', $updates) . " WHERE teacher_subject_id = :id";
            $stmt = $this->db->prepare($sql);
            return $stmt->execute($params);
        } catch (\PDOException $e) {
            error_log("Update Teacher Subject Error: " . $e->getMessage());
            return false;
        }
    }

    public function delete(int $id): bool
    {
        try {
            $stmt = $this->db->prepare("DELETE FROM teacher_subjects WHERE teacher_subject_id = :id");
            return $stmt->execute(['id' => $id]);
        } catch (\PDOException $e) {
            error_log("Delete Teacher Subject Error: " . $e->getMessage());
            return false;
        }
    }

    public function assignmentExists(int $teacherId, int $subjectId): bool
    {
        try {
            $stmt = $this->db->prepare("
                SELECT COUNT(*) as count FROM teacher_subjects
                WHERE teacher_id = :teacher_id AND subject_id = :subject_id
            ");
            $stmt->execute([
                'teacher_id' => $teacherId,
                'subject_id' => $subjectId
            ]);
            $result = $stmt->fetch(\PDO::FETCH_ASSOC);
            return $result['count'] > 0;
        } catch (\PDOException $e) {
            error_log("Check Teacher Subject Assignment Error: " . $e->getMessage());
            return false;
        }
    }
}
