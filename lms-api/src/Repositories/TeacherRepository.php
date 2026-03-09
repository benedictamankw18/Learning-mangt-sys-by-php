<?php

namespace App\Repositories;

use App\Config\Database;
use App\Utils\UuidHelper;
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
            // Auto-generate UUID if not provided
            if (!isset($data['uuid'])) {
                $data['uuid'] = UuidHelper::generate();
            }

            $stmt = $this->db->prepare("
                INSERT INTO teachers (
                    uuid, institution_id, user_id, employee_id, department, 
                    specialization, hire_date, employment_end_date, qualification, 
                    years_of_experience
                )
                VALUES (
                    :uuid, :institution_id, :user_id, :employee_id, :department,
                    :specialization, :hire_date, :employment_end_date, :qualification,
                    :years_of_experience
                )
            ");

            $stmt->execute([
                'uuid' => $data['uuid'],
                'institution_id' => $data['institution_id'],
                'user_id' => $userId,
                'employee_id' => $data['employee_id'],
                'department' => $data['department'] ?? null,
                'specialization' => $data['specialization'] ?? null,
                'hire_date' => $data['hire_date'] ?? date('Y-m-d'),
                'employment_end_date' => $data['employment_end_date'] ?? null,
                'qualification' => $data['qualification'] ?? null,
                'years_of_experience' => $data['years_of_experience'] ?? null
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

    /**
     * Find teacher by UUID
     * 
     * @param string $uuid
     * @return array|null
     */
    public function findByUuid(string $uuid): ?array
    {
        // Validate UUID format
        if (!UuidHelper::isValid($uuid)) {
            return null;
        }

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
                WHERE t.uuid = :uuid
            ");

            $stmt->execute(['uuid' => $uuid]);
            return $stmt->fetch(PDO::FETCH_ASSOC) ?: null;
        } catch (\PDOException $e) {
            error_log("Teacher Find By UUID Error: " . $e->getMessage());
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

    public function countByInstitution(int $institutionId): int
    {
        try {
            $stmt = $this->db->prepare("
                SELECT COUNT(*) FROM teachers t
                INNER JOIN users u ON t.user_id = u.user_id
                WHERE t.institution_id = :institution_id AND u.deleted_at IS NULL
            ");
            $stmt->execute(['institution_id' => $institutionId]);
            return (int) $stmt->fetchColumn();
        } catch (\PDOException $e) {
            error_log("Count Teachers By Institution Error: " . $e->getMessage());
            return 0;
        }
    }

    public function countByInstitutionThisMonth(int $institutionId): int
    {
        try {
            $stmt = $this->db->prepare("
                SELECT COUNT(*) FROM teachers t
                INNER JOIN users u ON t.user_id = u.user_id
                WHERE t.institution_id = :institution_id AND u.deleted_at IS NULL
                AND YEAR(t.created_at) = YEAR(CURRENT_DATE())
                AND MONTH(t.created_at) = MONTH(CURRENT_DATE())
            ");
            $stmt->execute(['institution_id' => $institutionId]);
            return (int) $stmt->fetchColumn();
        } catch (\PDOException $e) {
            error_log("Count Teachers This Month Error: " . $e->getMessage());
            return 0;
        }
    }

    public function countByInstitutionLastMonth(int $institutionId): int
    {
        try {
            $stmt = $this->db->prepare("
                SELECT COUNT(*) FROM teachers t
                INNER JOIN users u ON t.user_id = u.user_id
                WHERE t.institution_id = :institution_id AND u.deleted_at IS NULL
                AND YEAR(t.created_at) = YEAR(DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH))
                AND MONTH(t.created_at) = MONTH(DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH))
            ");
            $stmt->execute(['institution_id' => $institutionId]);
            return (int) $stmt->fetchColumn();
        } catch (\PDOException $e) {
            error_log("Count Teachers Last Month Error: " . $e->getMessage());
            return 0;
        }
    }

    public function getCourses(int $teacherId): array
    {
        try {
            $stmt = $this->db->prepare("
                SELECT 
                    cs.course_id,
                    cs.institution_id,
                    cs.class_id,
                    cs.subject_id,
                    cs.teacher_id,
                    cs.academic_year_id,
                    cs.semester_id,
                    cs.status,
                    cs.start_date,
                    cs.end_date,
                    s.subject_name,
                    s.subject_code,
                    c.class_name,
                    COUNT(DISTINCT ce.student_id) as enrolled_students
                FROM class_subjects cs
                INNER JOIN subjects s ON cs.subject_id = s.subject_id
                INNER JOIN classes c ON cs.class_id = c.class_id
                LEFT JOIN course_enrollments ce ON cs.course_id = ce.course_id AND ce.status = 'active'
                WHERE cs.teacher_id = :teacher_id
                GROUP BY cs.course_id
                ORDER BY cs.created_at DESC
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
                    cs.schedule_id,
                    cs.day_of_week,
                    cs.start_time,
                    cs.end_time,
                    cs.room,
                    s.subject_name,
                    s.subject_code,
                    cl.class_name,
                    cl.class_code
                FROM course_schedules cs
                INNER JOIN class_subjects csub ON cs.course_id = csub.course_id
                INNER JOIN subjects s          ON csub.subject_id = s.subject_id
                INNER JOIN classes cl          ON csub.class_id = cl.class_id
                WHERE csub.teacher_id = :teacher_id
            ";

            $params = ['teacher_id' => $teacherId];

            if ($date) {
                $sql .= " AND LOWER(cs.day_of_week) = LOWER(DAYNAME(:date))";
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

    /**
     * Per-course average assignment score for a teacher (class performance chart).
     * Returns ['labels' => [...], 'data' => [...]] ready for Chart.js.
     */
    public function getClassPerformanceChart(int $teacherId): array
    {
        try {
            $stmt = $this->db->prepare("
                SELECT
                    CONCAT(s.subject_code, ' (', c.class_code, ')') AS label,
                    COALESCE(ROUND(AVG(asub.score), 1), 0)           AS avg_score
                FROM class_subjects cs
                INNER JOIN subjects s    ON cs.subject_id = s.subject_id
                INNER JOIN classes c     ON cs.class_id   = c.class_id
                LEFT  JOIN assignments a ON a.course_id   = cs.course_id AND a.status = 'active'
                LEFT  JOIN assignment_submissions asub
                                         ON asub.assignment_id = a.assignment_id
                                        AND asub.score IS NOT NULL
                WHERE cs.teacher_id = :teacher_id
                GROUP BY cs.course_id, s.subject_name, c.class_name
                ORDER BY avg_score DESC
            ");
            $stmt->execute(['teacher_id' => $teacherId]);
            $rows   = $stmt->fetchAll(\PDO::FETCH_ASSOC);
            $labels = array_column($rows, 'label');
            $data   = array_map('floatval', array_column($rows, 'avg_score'));
            return compact('labels', 'data');
        } catch (\PDOException $e) {
            error_log("Class Performance Chart Error: " . $e->getMessage());
            return ['labels' => [], 'data' => []];
        }
    }
}
