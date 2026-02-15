<?php

namespace App\Repositories;

use App\Config\Database;
use PDO;

class TeacherRepository
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
                INSERT INTO teachers (institution_id, user_id, employee_id, department, specialization, hire_date)
                VALUES (:institution_id, :user_id, :employee_id, :department, :specialization, :hire_date)
            ");

            $stmt->execute([
                'institution_id' => $data['institution_id'],
                'user_id' => $userId,
                'employee_id' => $data['employee_id'],
                'department' => $data['department'] ?? null,
                'specialization' => $data['specialization'] ?? null,
                'hire_date' => $data['hire_date'] ?? date('Y-m-d')
            ]);

            return (int) $this->db->lastInsertId();
        } catch (\PDOException $e) {
            error_log("Teacher Create Error: " . $e->getMessage());
            return null;
        }
    }

    public function findById(int $id): ?array
    {
        try {
            $stmt = $this->db->prepare("
                SELECT 
                    t.*,
                    u.username,
                    u.email,
                    u.first_name,
                    u.last_name,
                    u.phone_number,
                    u.address,
                    u.is_active
                FROM teachers t
                INNER JOIN users u ON t.user_id = u.user_id
                WHERE t.teacher_id = :id
            ");

            $stmt->execute(['id' => $id]);
            return $stmt->fetch(PDO::FETCH_ASSOC) ?: null;
        } catch (\PDOException $e) {
            error_log("Teacher Find Error: " . $e->getMessage());
            return null;
        }
    }

    public function findByUserId(int $userId): ?array
    {
        try {
            $stmt = $this->db->prepare("SELECT * FROM teachers WHERE user_id = :user_id");
            $stmt->execute(['user_id' => $userId]);
            return $stmt->fetch(PDO::FETCH_ASSOC) ?: null;
        } catch (\PDOException $e) {
            error_log("Teacher Find By User Error: " . $e->getMessage());
            return null;
        }
    }

    public function update(int $id, array $data): bool
    {
        try {
            $fields = [];
            $params = ['id' => $id];

            foreach ($data as $key => $value) {
                if ($key !== 'teacher_id' && $key !== 'user_id') {
                    $fields[] = "{$key} = :{$key}";
                    $params[$key] = $value;
                }
            }

            if (empty($fields)) {
                return false;
            }

            $sql = "UPDATE teachers SET " . implode(', ', $fields) . " WHERE teacher_id = :id";
            $stmt = $this->db->prepare($sql);
            return $stmt->execute($params);

        } catch (\PDOException $e) {
            error_log("Teacher Update Error: " . $e->getMessage());
            return false;
        }
    }

    public function getAll(int $page = 1, int $limit = 20, ?string $department = null): array
    {
        try {
            $offset = ($page - 1) * $limit;

            $sql = "
                SELECT 
                    t.*,
                    u.username,
                    u.email,
                    u.first_name,
                    u.last_name
                FROM teachers t
                INNER JOIN users u ON t.user_id = u.user_id
                WHERE u.deleted_at IS NULL
            ";

            if ($department) {
                $sql .= " AND t.department = :department";
            }

            $sql .= " ORDER BY t.created_at DESC LIMIT :limit OFFSET :offset";

            $stmt = $this->db->prepare($sql);

            if ($department) {
                $stmt->bindValue(':department', $department);
            }

            $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
            $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
            $stmt->execute();

            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (\PDOException $e) {
            error_log("Get All Teachers Error: " . $e->getMessage());
            return [];
        }
    }

    public function count(?string $department = null): int
    {
        try {
            $sql = "
                SELECT COUNT(*) FROM teachers t
                INNER JOIN users u ON t.user_id = u.user_id
                WHERE u.deleted_at IS NULL
            ";

            if ($department) {
                $sql .= " AND t.department = :department";
            }

            $stmt = $this->db->prepare($sql);

            if ($department) {
                $stmt->execute(['department' => $department]);
            } else {
                $stmt->execute();
            }

            return (int) $stmt->fetchColumn();
        } catch (\PDOException $e) {
            error_log("Count Teachers Error: " . $e->getMessage());
            return 0;
        }
    }

    public function getCourses(int $teacherId): array
    {
        try {
            $stmt = $this->db->prepare("
                SELECT 
                    c.*,
                    COUNT(DISTINCT ce.student_id) as enrolled_students
                FROM courses c
                LEFT JOIN course_enrollments ce ON c.course_id = ce.course_id AND ce.status = 'active'
                WHERE c.teacher_id = :teacher_id
                GROUP BY c.course_id
                ORDER BY c.created_at DESC
            ");

            $stmt->execute(['teacher_id' => $teacherId]);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (\PDOException $e) {
            error_log("Get Teacher Courses Error: " . $e->getMessage());
            return [];
        }
    }

    public function getSchedule(int $teacherId, ?string $date = null): array
    {
        try {
            $sql = "
                SELECT 
                    cs.*,
                    c.course_name,
                    c.course_code
                FROM course_schedules cs
                INNER JOIN courses c ON cs.course_id = c.course_id
                WHERE c.teacher_id = :teacher_id
            ";

            $params = ['teacher_id' => $teacherId];

            if ($date) {
                $sql .= " AND cs.day_of_week = DAYNAME(:date)";
                $params['date'] = $date;
            }

            $sql .= " ORDER BY cs.start_time";

            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (\PDOException $e) {
            error_log("Get Teacher Schedule Error: " . $e->getMessage());
            return [];
        }
    }
}
