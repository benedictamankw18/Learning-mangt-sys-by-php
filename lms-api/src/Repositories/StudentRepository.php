<?php

namespace App\Repositories;

use App\Config\Database;
use PDO;

class StudentRepository
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance()->getConnection();
    }

    public function create(int $userId, array $data): ?int
    {
        try {
            $stmt = $this->db->prepare("
                INSERT INTO students (institution_id, user_id, student_id_number, enrollment_date, class_id, gender, date_of_birth)
                VALUES (:institution_id, :user_id, :student_id_number, :enrollment_date, :class_id, :gender, :date_of_birth)
            ");

            $stmt->execute([
                'institution_id' => $data['institution_id'],
                'user_id' => $userId,
                'student_id_number' => $data['student_id_number'],
                'enrollment_date' => $data['enrollment_date'] ?? date('Y-m-d'),
                'class_id' => $data['class_id'] ?? null,
                'gender' => $data['gender'] ?? null,
                'date_of_birth' => $data['date_of_birth'] ?? null
            ]);

            return (int) $this->db->lastInsertId();
        } catch (\PDOException $e) {
            error_log("Student Create Error: " . $e->getMessage());
            return null;
        }
    }

    public function findById(int $id): ?array
    {
        try {
            $stmt = $this->db->prepare("
                SELECT 
                    s.*,
                    u.username,
                    u.email,
                    u.first_name,
                    u.last_name,
                    u.phone_number,
                    u.address,
                    u.date_of_birth,
                    u.is_active
                FROM students s
                INNER JOIN users u ON s.user_id = u.user_id
                WHERE s.student_id = :id
            ");

            $stmt->execute(['id' => $id]);
            return $stmt->fetch(PDO::FETCH_ASSOC) ?: null;
        } catch (\PDOException $e) {
            error_log("Student Find Error: " . $e->getMessage());
            return null;
        }
    }

    public function findByUserId(int $userId): ?array
    {
        try {
            $stmt = $this->db->prepare("SELECT * FROM students WHERE user_id = :user_id");
            $stmt->execute(['user_id' => $userId]);
            return $stmt->fetch(PDO::FETCH_ASSOC) ?: null;
        } catch (\PDOException $e) {
            error_log("Student Find By User Error: " . $e->getMessage());
            return null;
        }
    }

    public function update(int $id, array $data): bool
    {
        try {
            $fields = [];
            $params = ['id' => $id];

            foreach ($data as $key => $value) {
                if ($key !== 'student_id' && $key !== 'user_id') {
                    $fields[] = "{$key} = :{$key}";
                    $params[$key] = $value;
                }
            }

            if (empty($fields)) {
                return false;
            }

            $sql = "UPDATE students SET " . implode(', ', $fields) . " WHERE student_id = :id";
            $stmt = $this->db->prepare($sql);
            return $stmt->execute($params);

        } catch (\PDOException $e) {
            error_log("Student Update Error: " . $e->getMessage());
            return false;
        }
    }

    public function getAll(int $page = 1, int $limit = 20, ?string $gradeLevel = null): array
    {
        try {
            $offset = ($page - 1) * $limit;

            $sql = "
                SELECT 
                    s.*,
                    u.username,
                    u.email,
                    u.first_name,
                    u.last_name
                FROM students s
                INNER JOIN users u ON s.user_id = u.user_id
                WHERE u.deleted_at IS NULL
            ";

            if ($gradeLevel) {
                $sql .= " AND s.grade_level = :grade_level";
            }

            $sql .= " ORDER BY s.created_at DESC LIMIT :limit OFFSET :offset";

            $stmt = $this->db->prepare($sql);

            if ($gradeLevel) {
                $stmt->bindValue(':grade_level', $gradeLevel);
            }

            $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
            $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
            $stmt->execute();

            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (\PDOException $e) {
            error_log("Get All Students Error: " . $e->getMessage());
            return [];
        }
    }

    public function count(?string $gradeLevel = null): int
    {
        try {
            $sql = "
                SELECT COUNT(*) FROM students s
                INNER JOIN users u ON s.user_id = u.user_id
                WHERE u.deleted_at IS NULL
            ";

            if ($gradeLevel) {
                $sql .= " AND s.grade_level = :grade_level";
            }

            $stmt = $this->db->prepare($sql);

            if ($gradeLevel) {
                $stmt->execute(['grade_level' => $gradeLevel]);
            } else {
                $stmt->execute();
            }

            return (int) $stmt->fetchColumn();
        } catch (\PDOException $e) {
            error_log("Count Students Error: " . $e->getMessage());
            return 0;
        }
    }

    public function countByInstitution(int $institutionId): int
    {
        try {
            $stmt = $this->db->prepare("
                SELECT COUNT(*) FROM students s
                INNER JOIN users u ON s.user_id = u.user_id
                WHERE s.institution_id = :institution_id AND u.deleted_at IS NULL
            ");
            $stmt->execute(['institution_id' => $institutionId]);
            return (int) $stmt->fetchColumn();
        } catch (\PDOException $e) {
            error_log("Count Students By Institution Error: " . $e->getMessage());
            return 0;
        }
    }

    public function countActiveByInstitution(int $institutionId): int
    {
        try {
            $stmt = $this->db->prepare("
                SELECT COUNT(*) FROM students s
                INNER JOIN users u ON s.user_id = u.user_id
                WHERE s.institution_id = :institution_id 
                AND u.is_active = 1 
                AND u.deleted_at IS NULL
            ");
            $stmt->execute(['institution_id' => $institutionId]);
            return (int) $stmt->fetchColumn();
        } catch (\PDOException $e) {
            error_log("Count Active Students By Institution Error: " . $e->getMessage());
            return 0;
        }
    }

    public function enrollInCourse(int $studentId, int $courseId): bool
    {
        try {
            $stmt = $this->db->prepare("
                INSERT IGNORE INTO course_enrollments (student_id, course_id, enrollment_date)
                VALUES (:student_id, :course_id, NOW())
            ");
            return $stmt->execute(['student_id' => $studentId, 'course_id' => $courseId]);
        } catch (\PDOException $e) {
            error_log("Course Enrollment Error: " . $e->getMessage());
            return false;
        }
    }

    public function unenrollFromCourse(int $studentId, int $courseId): bool
    {
        try {
            $stmt = $this->db->prepare("
                UPDATE course_enrollments 
                SET status = 'dropped', completion_date = NOW()
                WHERE student_id = :student_id AND course_id = :course_id
            ");
            return $stmt->execute(['student_id' => $studentId, 'course_id' => $courseId]);
        } catch (\PDOException $e) {
            error_log("Course Unenrollment Error: " . $e->getMessage());
            return false;
        }
    }

    public function findEnrollmentById(int $enrollmentId): ?array
    {
        try {
            $stmt = $this->db->prepare("
                SELECT ce.*, 
                       c.course_name, c.course_code,
                       u.first_name, u.last_name, s.student_id_number
                FROM course_enrollments ce
                JOIN courses c ON ce.course_id = c.course_id
                JOIN students s ON ce.student_id = s.student_id
                JOIN users u ON s.user_id = u.user_id
                WHERE ce.enrollment_id = :enrollment_id
            ");
            $stmt->execute(['enrollment_id' => $enrollmentId]);
            $result = $stmt->fetch(\PDO::FETCH_ASSOC);
            return $result ?: null;
        } catch (\PDOException $e) {
            error_log("Find Enrollment Error: " . $e->getMessage());
            return null;
        }
    }

    public function updateEnrollment(int $enrollmentId, array $data): bool
    {
        try {
            $allowedFields = ['status', 'progress_percentage', 'final_grade', 'completion_date'];
            $updates = [];
            $params = ['enrollment_id' => $enrollmentId];

            foreach ($allowedFields as $field) {
                if (isset($data[$field])) {
                    $updates[] = "$field = :$field";
                    $params[$field] = $data[$field];
                }
            }

            if (empty($updates)) {
                return false;
            }

            $sql = "UPDATE course_enrollments SET " . implode(', ', $updates) . " WHERE enrollment_id = :enrollment_id";
            $stmt = $this->db->prepare($sql);
            return $stmt->execute($params);

        } catch (\PDOException $e) {
            error_log("Update Enrollment Error: " . $e->getMessage());
            return false;
        }
    }

    public function deleteEnrollment(int $enrollmentId): bool
    {
        try {
            $stmt = $this->db->prepare("DELETE FROM course_enrollments WHERE enrollment_id = :enrollment_id");
            return $stmt->execute(['enrollment_id' => $enrollmentId]);
        } catch (\PDOException $e) {
            error_log("Delete Enrollment Error: " . $e->getMessage());
            return false;
        }
    }

    public function getEnrolledCourses(int $studentId): array
    {
        try {
            $stmt = $this->db->prepare("
                SELECT 
                    c.*,
                    ce.enrollment_date,
                    ce.status as enrollment_status,
                    ce.progress_percentage,
                    t.first_name as teacher_first_name,
                    t.last_name as teacher_last_name
                FROM course_enrollments ce
                INNER JOIN courses c ON ce.course_id = c.course_id
                LEFT JOIN teachers teach ON c.teacher_id = teach.teacher_id
                LEFT JOIN users t ON teach.user_id = t.user_id
                WHERE ce.student_id = :student_id AND ce.status = 'active'
                ORDER BY ce.enrollment_date DESC
            ");

            $stmt->execute(['student_id' => $studentId]);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (\PDOException $e) {
            error_log("Get Enrolled Courses Error: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Get monthly enrollment counts for current year by institution
     */
    public function getMonthlyEnrollmentsByInstitution(int $institutionId): array
    {
        try {
            $stmt = $this->db->prepare("
                SELECT 
                    MONTH(s.created_at) as month,
                    COUNT(*) as count
                FROM students s
                INNER JOIN users u ON s.user_id = u.user_id
                WHERE s.institution_id = :institution_id
                AND YEAR(s.created_at) = YEAR(CURDATE())
                AND u.deleted_at IS NULL
                GROUP BY MONTH(s.created_at)
                ORDER BY month
            ");

            $stmt->execute(['institution_id' => $institutionId]);
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Initialize array with zeros for all 12 months
            $monthlyData = array_fill(1, 12, 0);

            // Fill in actual counts
            foreach ($results as $row) {
                $monthlyData[(int) $row['month']] = (int) $row['count'];
            }

            // Return indexed array (0-11) for frontend
            return array_values($monthlyData);
        } catch (\PDOException $e) {
            error_log("Get Monthly Enrollments Error: " . $e->getMessage());
            return array_fill(0, 12, 0);
        }
    }
}
