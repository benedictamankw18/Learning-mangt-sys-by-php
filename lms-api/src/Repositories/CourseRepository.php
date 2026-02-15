<?php

namespace App\Repositories;

use App\Config\Database;
use PDO;

class CourseRepository
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance()->getConnection();
    }

    public function create(array $data): ?int
    {
        try {
            $stmt = $this->db->prepare("
                INSERT INTO courses (
                    course_code, course_name, description, program, grade_level, section,
                    subject_id, teacher_id, academic_year_id, semester_id,
                    credits, duration_weeks, start_date, end_date, max_students, status
                )
                VALUES (
                    :course_code, :course_name, :description, :program, :grade_level, :section,
                    :subject_id, :teacher_id, :academic_year_id, :semester_id,
                    :credits, :duration_weeks, :start_date, :end_date, :max_students, :status
                )
            ");

            $stmt->execute([
                'course_code' => $data['course_code'],
                'course_name' => $data['course_name'],
                'description' => $data['description'] ?? null,
                'program' => $data['program'] ?? null,
                'grade_level' => $data['grade_level'] ?? null,
                'section' => $data['section'] ?? null,
                'subject_id' => $data['subject_id'] ?? null,
                'teacher_id' => $data['teacher_id'] ?? null,
                'academic_year_id' => $data['academic_year_id'] ?? null,
                'semester_id' => $data['semester_id'] ?? null,
                'credits' => $data['credits'] ?? 3,
                'duration_weeks' => $data['duration_weeks'] ?? 16,
                'start_date' => $data['start_date'] ?? null,
                'end_date' => $data['end_date'] ?? null,
                'max_students' => $data['max_students'] ?? 40,
                'status' => $data['status'] ?? 'draft'
            ]);

            return (int) $this->db->lastInsertId();
        } catch (\PDOException $e) {
            error_log("Course Create Error: " . $e->getMessage());
            return null;
        }
    }

    public function findById(int $id): ?array
    {
        try {
            $stmt = $this->db->prepare("
                SELECT 
                    c.*,
                    sub.subject_name,
                    sub.subject_code,
                    sub.is_core,
                    ay.year_name,
                    sem.semester_name,
                    t.employee_id,
                    u.first_name as teacher_first_name,
                    u.last_name as teacher_last_name,
                    COUNT(DISTINCT ce.student_id) as enrolled_students,
                    AVG(cr.rating) as average_rating
                FROM courses c
                LEFT JOIN subjects sub ON c.subject_id = sub.subject_id
                LEFT JOIN academic_years ay ON c.academic_year_id = ay.academic_year_id
                LEFT JOIN semesters sem ON c.semester_id = sem.semester_id
                LEFT JOIN teachers t ON c.teacher_id = t.teacher_id
                LEFT JOIN users u ON t.user_id = u.user_id
                LEFT JOIN course_enrollments ce ON c.course_id = ce.course_id AND ce.status = 'active'
                LEFT JOIN course_reviews cr ON c.course_id = cr.course_id
                WHERE c.course_id = :id
                GROUP BY c.course_id
            ");

            $stmt->execute(['id' => $id]);
            return $stmt->fetch(PDO::FETCH_ASSOC) ?: null;
        } catch (\PDOException $e) {
            error_log("Course Find Error: " . $e->getMessage());
            return null;
        }
    }

    public function update(int $id, array $data): bool
    {
        try {
            $fields = [];
            $params = ['id' => $id];

            foreach ($data as $key => $value) {
                if ($key !== 'course_id') {
                    $fields[] = "{$key} = :{$key}";
                    $params[$key] = $value;
                }
            }

            if (empty($fields)) {
                return false;
            }

            $sql = "UPDATE courses SET " . implode(', ', $fields) . " WHERE course_id = :id";
            $stmt = $this->db->prepare($sql);
            return $stmt->execute($params);

        } catch (\PDOException $e) {
            error_log("Course Update Error: " . $e->getMessage());
            return false;
        }
    }

    public function delete(int $id): bool
    {
        try {
            $stmt = $this->db->prepare("UPDATE courses SET status = 'archived' WHERE course_id = :id");
            return $stmt->execute(['id' => $id]);
        } catch (\PDOException $e) {
            error_log("Course Delete Error: " . $e->getMessage());
            return false;
        }
    }

    public function getAll(int $page = 1, int $limit = 20, ?int $teacherId = null, ?string $status = null): array
    {
        try {
            $offset = ($page - 1) * $limit;

            $sql = "
                SELECT 
                    c.*,
                    sub.subject_name,
                    sub.subject_code,
                    ay.year_name,
                    sem.semester_name,
                    u.first_name as teacher_first_name,
                    u.last_name as teacher_last_name,
                    COUNT(DISTINCT ce.student_id) as enrolled_students
                FROM courses c
                LEFT JOIN subjects sub ON c.subject_id = sub.subject_id
                LEFT JOIN academic_years ay ON c.academic_year_id = ay.academic_year_id
                LEFT JOIN semesters sem ON c.semester_id = sem.semester_id
                LEFT JOIN teachers t ON c.teacher_id = t.teacher_id
                LEFT JOIN users u ON t.user_id = u.user_id
                LEFT JOIN course_enrollments ce ON c.course_id = ce.course_id AND ce.status = 'active'
                WHERE 1=1
            ";

            $params = [];

            if ($teacherId) {
                $sql .= " AND c.teacher_id = :teacher_id";
                $params['teacher_id'] = $teacherId;
            }

            if ($status) {
                $sql .= " AND c.status = :status";
                $params['status'] = $status;
            }

            $sql .= " GROUP BY c.course_id ORDER BY c.created_at DESC LIMIT :limit OFFSET :offset";

            $stmt = $this->db->prepare($sql);

            foreach ($params as $key => $value) {
                $stmt->bindValue(":{$key}", $value);
            }

            $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
            $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
            $stmt->execute();

            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (\PDOException $e) {
            error_log("Get All Courses Error: " . $e->getMessage());
            return [];
        }
    }

    public function count(?int $teacherId = null, ?string $status = null): int
    {
        try {
            $sql = "SELECT COUNT(*) FROM courses WHERE 1=1";
            $params = [];

            if ($teacherId) {
                $sql .= " AND teacher_id = :teacher_id";
                $params['teacher_id'] = $teacherId;
            }

            if ($status) {
                $sql .= " AND status = :status";
                $params['status'] = $status;
            }

            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);

            return (int) $stmt->fetchColumn();
        } catch (\PDOException $e) {
            error_log("Count Courses Error: " . $e->getMessage());
            return 0;
        }
    }

    public function getEnrolledStudents(int $courseId, int $page = 1, int $limit = 20): array
    {
        try {
            $offset = ($page - 1) * $limit;

            $stmt = $this->db->prepare("
                SELECT 
                    s.*,
                    u.username,
                    u.email,
                    u.first_name,
                    u.last_name,
                    ce.enrollment_date,
                    ce.progress_percentage
                FROM course_enrollments ce
                INNER JOIN students s ON ce.student_id = s.student_id
                INNER JOIN users u ON s.user_id = u.user_id
                WHERE ce.course_id = :course_id AND ce.status = 'active'
                ORDER BY ce.enrollment_date DESC
                LIMIT :limit OFFSET :offset
            ");

            $stmt->bindValue(':course_id', $courseId, PDO::PARAM_INT);
            $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
            $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
            $stmt->execute();

            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (\PDOException $e) {
            error_log("Get Enrolled Students Error: " . $e->getMessage());
            return [];
        }
    }

    public function getMaterials(int $courseId): array
    {
        try {
            $stmt = $this->db->prepare("
                SELECT * FROM course_materials
                WHERE course_id = :course_id
                ORDER BY order_index, created_at
            ");

            $stmt->execute(['course_id' => $courseId]);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (\PDOException $e) {
            error_log("Get Course Materials Error: " . $e->getMessage());
            return [];
        }
    }

    public function getAssessments(int $courseId): array
    {
        try {
            $stmt = $this->db->prepare("
                SELECT * FROM assessments
                WHERE course_id = :course_id
                ORDER BY due_date
            ");

            $stmt->execute(['course_id' => $courseId]);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (\PDOException $e) {
            error_log("Get Course Assessments Error: " . $e->getMessage());
            return [];
        }
    }

    public function isStudentEnrolled(int $studentId, int $courseId): bool
    {
        try {
            $stmt = $this->db->prepare("
                SELECT COUNT(*) as count
                FROM course_enrollments
                WHERE student_id = :student_id 
                AND course_id = :course_id 
                AND status = 'active'
            ");

            $stmt->execute([
                'student_id' => $studentId,
                'course_id' => $courseId
            ]);

            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            return $result['count'] > 0;
        } catch (\PDOException $e) {
            error_log("Check Student Enrollment Error: " . $e->getMessage());
            return false;
        }
    }
}
