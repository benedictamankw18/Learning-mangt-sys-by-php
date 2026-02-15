<?php

namespace App\Repositories;

use App\Config\Database;

class ResultRepository
{
    private $db;

    public function __construct()
    {
        $this->db = Database::getInstance()->getConnection();
    }

    public function getStudentResults(int $studentId, ?int $semesterId = null): array
    {
        try {
            $sql = "
                SELECT r.*, c.course_name, c.course_code, s.subject_name, sem.semester_name
                FROM results r
                LEFT JOIN courses c ON r.course_id = c.course_id
                LEFT JOIN subjects s ON r.subject_id = s.subject_id
                LEFT JOIN semesters sem ON r.semester_id = sem.semester_id
                WHERE r.student_id = :student_id
            ";

            if ($semesterId) {
                $sql .= " AND r.semester_id = :semester_id";
            }

            $sql .= " ORDER BY sem.start_date DESC, s.subject_name";

            $stmt = $this->db->prepare($sql);
            $params = ['student_id' => $studentId];
            if ($semesterId) {
                $params['semester_id'] = $semesterId;
            }

            $stmt->execute($params);
            return $stmt->fetchAll(\PDO::FETCH_ASSOC);
        } catch (\PDOException $e) {
            error_log("Get Student Results Error: " . $e->getMessage());
            return [];
        }
    }

    public function findById(int $id): ?array
    {
        try {
            $stmt = $this->db->prepare("
                SELECT r.*, c.course_name, c.course_code, s.subject_name, sem.semester_name,
                       st.student_id_number, u.first_name, u.last_name
                FROM results r
                LEFT JOIN courses c ON r.course_id = c.course_id
                LEFT JOIN subjects s ON r.subject_id = s.subject_id
                LEFT JOIN semesters sem ON r.semester_id = sem.semester_id
                LEFT JOIN students st ON r.student_id = st.student_id
                LEFT JOIN users u ON st.user_id = u.user_id
                WHERE r.result_id = :id
            ");
            $stmt->execute(['id' => $id]);
            $result = $stmt->fetch(\PDO::FETCH_ASSOC);
            return $result ?: null;
        } catch (\PDOException $e) {
            error_log("Find Result Error: " . $e->getMessage());
            return null;
        }
    }

    public function create(array $data): ?int
    {
        try {
            $stmt = $this->db->prepare("
                INSERT INTO results (student_id, course_id, subject_id, semester_id, class_score, exam_score, total_score, grade, grade_point, remark)
                VALUES (:student_id, :course_id, :subject_id, :semester_id, :class_score, :exam_score, :total_score, :grade, :grade_point, :remark)
            ");
            $stmt->execute([
                'student_id' => $data['student_id'],
                'course_id' => $data['course_id'],
                'subject_id' => $data['subject_id'] ?? null,
                'semester_id' => $data['semester_id'] ?? null,
                'class_score' => $data['class_score'] ?? null,
                'exam_score' => $data['exam_score'] ?? null,
                'total_score' => $data['total_score'],
                'grade' => $data['grade'] ?? null,
                'grade_point' => $data['grade_point'] ?? null,
                'remark' => $data['remark'] ?? null
            ]);
            return (int) $this->db->lastInsertId();
        } catch (\PDOException $e) {
            error_log("Create Result Error: " . $e->getMessage());
            return null;
        }
    }

    public function update(int $id, array $data): bool
    {
        try {
            $allowedFields = ['class_score', 'exam_score', 'total_score', 'grade', 'grade_point', 'remark'];
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

            $sql = "UPDATE results SET " . implode(', ', $updates) . " WHERE result_id = :id";
            $stmt = $this->db->prepare($sql);
            return $stmt->execute($params);
        } catch (\PDOException $e) {
            error_log("Update Result Error: " . $e->getMessage());
            return false;
        }
    }

    public function delete(int $id): bool
    {
        try {
            $stmt = $this->db->prepare("DELETE FROM results WHERE result_id = :id");
            return $stmt->execute(['id' => $id]);
        } catch (\PDOException $e) {
            error_log("Delete Result Error: " . $e->getMessage());
            return false;
        }
    }

    public function getCourseResults(int $courseId, ?int $semesterId = null): array
    {
        try {
            $sql = "
                SELECT r.*, st.student_id_number, u.first_name, u.last_name, s.subject_name
                FROM results r
                LEFT JOIN students st ON r.student_id = st.student_id
                LEFT JOIN users u ON st.user_id = u.user_id
                LEFT JOIN subjects s ON r.subject_id = s.subject_id
                WHERE r.course_id = :course_id
            ";

            if ($semesterId) {
                $sql .= " AND r.semester_id = :semester_id";
            }

            $sql .= " ORDER BY u.last_name, u.first_name";

            $stmt = $this->db->prepare($sql);
            $params = ['course_id' => $courseId];
            if ($semesterId) {
                $params['semester_id'] = $semesterId;
            }

            $stmt->execute($params);
            return $stmt->fetchAll(\PDO::FETCH_ASSOC);
        } catch (\PDOException $e) {
            error_log("Get Course Results Error: " . $e->getMessage());
            return [];
        }
    }
}
