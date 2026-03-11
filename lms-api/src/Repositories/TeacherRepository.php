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
                    uuid, institution_id, user_id, employee_id, program_id, 
                    specialization, hire_date, employment_end_date, qualification, 
                    years_of_experience
                )
                VALUES (
                    :uuid, :institution_id, :user_id, :employee_id, :program_id,
                    :specialization, :hire_date, :employment_end_date, :qualification,
                    :years_of_experience
                )
            ");

            $stmt->execute([
                'uuid' => $data['uuid'],
                'institution_id' => $data['institution_id'],
                'user_id' => $userId,
                'employee_id' => $data['employee_id'],
                'program_id' => isset($data['program_id']) ? (int)$data['program_id'] : null,
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
                    u.is_active,
                    p.program_name,
                    p.program_code
                FROM teachers t
                INNER JOIN users u ON t.user_id = u.user_id
                LEFT JOIN programs p ON t.program_id = p.program_id
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
                    u.is_active,
                    p.program_name,
                    p.program_code
                FROM teachers t
                INNER JOIN users u ON t.user_id = u.user_id
                LEFT JOIN programs p ON t.program_id = p.program_id
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

    public function getAll(int $page = 1, int $limit = 20, ?int $programId = null, ?string $search = null, ?int $institutionId = null): array
    {
        try {
            $offset = ($page - 1) * $limit;

            $sql = "
                SELECT 
                    t.*,
                    u.username,
                    u.email,
                    u.first_name,
                    u.last_name,
                    u.phone_number,
                    u.address,
                    u.is_active,
                    p.program_name,
                    p.program_code
                FROM teachers t
                INNER JOIN users u ON t.user_id = u.user_id
                LEFT JOIN programs p ON t.program_id = p.program_id
                WHERE u.deleted_at IS NULL
            ";

            if ($programId) {
                $sql .= " AND t.program_id = :program_id";
            }

            if ($institutionId) {
                $sql .= " AND t.institution_id = :institution_id";
            }

            if ($search) {
                $sql .= " AND (u.first_name LIKE :s1 OR u.last_name LIKE :s2 OR u.email LIKE :s3 OR t.employee_id LIKE :s4)";
            }

            $sql .= " ORDER BY t.created_at DESC LIMIT :limit OFFSET :offset";

            $stmt = $this->db->prepare($sql);

            if ($institutionId) {
                $stmt->bindValue(':institution_id', $institutionId, PDO::PARAM_INT);
            }
            if ($programId) {
                $stmt->bindValue(':program_id', $programId, PDO::PARAM_INT);
            }

            if ($search) {
                $searchVal = '%' . $search . '%';
                $stmt->bindValue(':s1', $searchVal);
                $stmt->bindValue(':s2', $searchVal);
                $stmt->bindValue(':s3', $searchVal);
                $stmt->bindValue(':s4', $searchVal);
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

    public function count(?int $programId = null, ?string $search = null, ?int $institutionId = null): int
    {
        try {
            $sql = "
                SELECT COUNT(*) FROM teachers t
                INNER JOIN users u ON t.user_id = u.user_id
                WHERE u.deleted_at IS NULL
            ";

            if ($institutionId) {
                $sql .= " AND t.institution_id = :institution_id";
            }

            if ($programId) {
                $sql .= " AND t.program_id = :program_id";
            }

            if ($search) {
                $sql .= " AND (u.first_name LIKE :s1 OR u.last_name LIKE :s2 OR u.email LIKE :s3 OR t.employee_id LIKE :s4)";
            }

            $stmt = $this->db->prepare($sql);

            $params = [];
            if ($institutionId) $params['institution_id'] = $institutionId;
            if ($programId) $params['program_id'] = $programId;
            if ($search) {
                $searchVal = '%' . $search . '%';
                $params['s1'] = $searchVal;
                $params['s2'] = $searchVal;
                $params['s3'] = $searchVal;
                $params['s4'] = $searchVal;
            }
            $stmt->execute($params);

            return (int) $stmt->fetchColumn();
        } catch (\PDOException $e) {
            error_log("Count Teachers Error: " . $e->getMessage());
            return 0;
        }
    }

    public function isEmployeeIdTaken(string $employeeId, ?int $institutionId = null, ?int $excludeTeacherId = null): bool
    {
        try {
            $sql = "SELECT teacher_id FROM teachers WHERE employee_id = :eid";
            $params = ['eid' => $employeeId];
            if ($institutionId !== null) {
                $sql .= " AND institution_id = :institution_id";
                $params['institution_id'] = $institutionId;
            }
            if ($excludeTeacherId !== null) {
                $sql .= " AND teacher_id != :exclude_id";
                $params['exclude_id'] = $excludeTeacherId;
            }
            $sql .= " LIMIT 1";
            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);
            return (bool) $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (\PDOException $e) {
            error_log("isEmployeeIdTaken Error: " . $e->getMessage());
            return false;
        }
    }

    public function getNextIdSequence(int $institutionId, string $prefix, int $year): int
    {
        try {
            $stmt = $this->db->prepare("
                SELECT employee_id FROM teachers
                WHERE institution_id = :institution_id AND employee_id LIKE :pattern
                ORDER BY employee_id DESC LIMIT 1
            ");
            $stmt->execute(['institution_id' => $institutionId, 'pattern' => "{$prefix}-{$year}-%"]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$row) return 1;
            $parts = explode('-', $row['employee_id']);
            return (int) end($parts) + 1;
        } catch (\PDOException $e) {
            error_log("TeacherRepository::getNextIdSequence error: " . $e->getMessage());
            return 1;
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
                    p.program_name,
                    COUNT(DISTINCT ce.student_id) as enrolled_students
                FROM class_subjects cs
                INNER JOIN subjects s ON cs.subject_id = s.subject_id
                INNER JOIN classes c ON cs.class_id = c.class_id
                LEFT JOIN programs p ON p.program_id = c.program_id
                LEFT JOIN students ce ON c.class_id = ce.class_id AND ce.status = 'active'
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

    /**
     * Aggregate performance data for a teacher.
     * Returns avg_scores, attendance, grade_dist, submissions, submission_rate.
     */
    public function getPerformance(int $teacherId): array
    {
        // 0. Get teacher's institution_id for grade scale lookup
        $institutionId = null;
        try {
            $stmt = $this->db->prepare("SELECT institution_id FROM teachers WHERE teacher_id = :id LIMIT 1");
            $stmt->execute(['id' => $teacherId]);
            $row = $stmt->fetch(\PDO::FETCH_ASSOC);
            $institutionId = $row ? (int)$row['institution_id'] : null;
        } catch (\PDOException $e) {
            error_log("Performance institution lookup error: " . $e->getMessage());
        }

        // 1. Average scores per course (reuse existing logic)
        $avg_scores = $this->getClassPerformanceChart($teacherId);

        // 2. Attendance rate — join via course_id (attendance.course_id = class_subjects.course_id)
        $attendance = ['rate' => 0, 'present' => 0, 'total' => 0];
        try {
            $stmt = $this->db->prepare("
                SELECT
                    COUNT(*)                                                    AS total,
                    SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END)      AS present
                FROM attendance a
                INNER JOIN class_subjects cs ON a.course_id = cs.course_id
                WHERE cs.teacher_id = :teacher_id
            ");
            $stmt->execute(['teacher_id' => $teacherId]);
            $row = $stmt->fetch(\PDO::FETCH_ASSOC);
            if ($row && (int)$row['total'] > 0) {
                $attendance = [
                    'rate'    => round(((int)$row['present'] / (int)$row['total']) * 100, 1),
                    'present' => (int)$row['present'],
                    'total'   => (int)$row['total'],
                ];
            }
        } catch (\PDOException $e) {
            error_log("Performance attendance error: " . $e->getMessage());
        }

        // 3. Grade distribution — dynamic from grade_scales table.
        //    Uses institution-specific scales if they exist, falls back to global (institution_id IS NULL).
        $grade_dist = ['labels' => [], 'data' => []];
        try {
            $stmt = $this->db->prepare("
                SELECT
                    gs.grade,
                    gs.min_score,
                    gs.max_score,
                    COUNT(asub.submission_id) AS cnt
                FROM grade_scales gs
                LEFT JOIN (
                    SELECT asub2.score, asub2.submission_id
                    FROM assignment_submissions asub2
                    INNER JOIN class_subjects cs ON asub2.course_id = cs.course_id
                    WHERE cs.teacher_id = :teacher_id AND asub2.score IS NOT NULL
                ) asub ON asub.score >= gs.min_score AND asub.score <= gs.max_score
                WHERE
                    gs.institution_id = :institution_id
                    OR (
                        gs.institution_id IS NULL
                        AND NOT EXISTS (
                            SELECT 1 FROM grade_scales gs2
                            WHERE gs2.institution_id = :institution_id2
                              AND gs2.grade = gs.grade
                        )
                    )
                GROUP BY gs.grade_scale_id, gs.grade, gs.min_score, gs.max_score
                ORDER BY gs.min_score DESC
            ");
            $stmt->execute([
                'teacher_id'     => $teacherId,
                'institution_id'  => $institutionId,
                'institution_id2' => $institutionId,
            ]);
            $rows = $stmt->fetchAll(\PDO::FETCH_ASSOC);
            if ($rows) {
                $grade_dist['labels'] = array_column($rows, 'grade');
                $grade_dist['data']   = array_map('intval', array_column($rows, 'cnt'));
            }
        } catch (\PDOException $e) {
            error_log("Performance grade dist error: " . $e->getMessage());
        }

        // 4. Submission rate per assignment (last 10 active assignments)
        $submissions = ['labels' => [], 'submitted' => [], 'total' => []];
        $submission_rate = 0;
        try {
            $stmt = $this->db->prepare("
                SELECT
                    CONCAT(LEFT(a.title, 20), IF(LENGTH(a.title) > 20, '…', '')) AS label,
                    COUNT(DISTINCT asub.student_id)                               AS submitted,
                    COUNT(DISTINCT enr.student_id)                                AS total_enrolled
                FROM assignments a
                INNER JOIN class_subjects cs  ON a.course_id = cs.course_id
                LEFT  JOIN assignment_submissions asub
                                               ON asub.assignment_id = a.assignment_id
                                              AND asub.status IN ('submitted','graded')
                LEFT  JOIN students enr    ON enr.class_id = cs.class_id
                                              AND enr.status = 'active'
                WHERE cs.teacher_id = :teacher_id AND a.status = 'active'
                GROUP BY a.assignment_id, a.title
                ORDER BY a.created_at DESC
                LIMIT 10
            ");
            $stmt->execute(['teacher_id' => $teacherId]);
            $rows = $stmt->fetchAll(\PDO::FETCH_ASSOC);
            if ($rows) {
                $submissions['labels']    = array_column($rows, 'label');
                $submissions['submitted'] = array_map('intval', array_column($rows, 'submitted'));
                $submissions['total']     = array_map('intval', array_column($rows, 'total_enrolled'));

                $totalEnrolled  = array_sum($submissions['total']);
                $totalSubmitted = array_sum($submissions['submitted']);
                $submission_rate = $totalEnrolled > 0
                    ? round(($totalSubmitted / $totalEnrolled) * 100, 1)
                    : 0;
            }
        } catch (\PDOException $e) {
            error_log("Performance submission error: " . $e->getMessage());
        }

        return compact('avg_scores', 'attendance', 'grade_dist', 'submissions', 'submission_rate');
    }
}
