<?php

namespace App\Repositories;

use App\Config\Database;
use App\Utils\UuidHelper;
use PDO;

class ClassRepository
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance()->getConnection();
    }

    /**
     * Get all classes with pagination and optional filters
     * Includes program, grade level, academic year, teacher, and student count
     */
    public function getAll(
        int $page = 1,
        int $limit = 20,
        ?int $institutionId = null,
        ?int $programId = null,
        ?int $gradeLevelId = null,
        ?string $status = null,
        ?string $search = null
    ): array {
        $offset = ($page - 1) * $limit;

        $query = "
            SELECT 
                c.class_id,
                c.uuid,
                c.institution_id,
                c.class_code,
                c.class_name,
                c.section,
                c.max_students,
                c.room_number,
                c.status,
                c.created_at,
                c.updated_at,
                p.program_id,
                p.program_name,
                p.program_code,
                gl.grade_level_id,
                gl.grade_level_name,
                gl.grade_level_code,
                gl.level_order,
                ay.academic_year_id,
                ay.year_name,
                ay.is_current,
                CONCAT(tu.first_name, ' ', tu.last_name) as class_teacher_name,
                t.teacher_id as class_teacher_id,
                COUNT(DISTINCT s.student_id) as student_count
            FROM classes c
            LEFT JOIN programs p ON c.program_id = p.program_id
            LEFT JOIN grade_levels gl ON c.grade_level_id = gl.grade_level_id
            LEFT JOIN academic_years ay ON c.academic_year_id = ay.academic_year_id
            LEFT JOIN teachers t ON c.class_teacher_id = t.teacher_id
            LEFT JOIN users tu ON t.user_id = tu.user_id
            LEFT JOIN students s ON c.class_id = s.class_id
            WHERE 1=1
        ";

        $params = [];

        if ($institutionId !== null) {
            $query .= " AND c.institution_id = :institution_id";
            $params['institution_id'] = $institutionId;
        }

        if ($programId !== null) {
            $query .= " AND c.program_id = :program_id";
            $params['program_id'] = $programId;
        }

        if ($gradeLevelId !== null) {
            $query .= " AND c.grade_level_id = :grade_level_id";
            $params['grade_level_id'] = $gradeLevelId;
        }

        if ($status !== null) {
            $query .= " AND c.status = :status";
            $params['status'] = $status;
        }

        if ($search !== null) {
            $query .= " AND (c.class_name LIKE :search_name OR c.class_code LIKE :search_code OR c.section LIKE :search_sec)";
            $params['search_name'] = '%' . $search . '%';
            $params['search_code'] = '%' . $search . '%';
            $params['search_sec']  = '%' . $search . '%';
        }

        $query .= "
            GROUP BY c.class_id
            ORDER BY gl.level_order, p.program_name, c.section
            LIMIT :limit OFFSET :offset
        ";

        $stmt = $this->db->prepare($query);

        foreach ($params as $key => $value) {
            $type = is_int($value) ? PDO::PARAM_INT : PDO::PARAM_STR;
            $stmt->bindValue(":$key", $value, $type);
        }

        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Count total classes with optional filters
     */
    public function count(?int $institutionId = null, ?int $programId = null, ?int $gradeLevelId = null): int
    {
        $query = "SELECT COUNT(*) as total FROM classes WHERE 1=1";
        $params = [];

        if ($institutionId !== null) {
            $query .= " AND institution_id = :institution_id";
            $params['institution_id'] = $institutionId;
        }

        if ($programId !== null) {
            $query .= " AND program_id = :program_id";
            $params['program_id'] = $programId;
        }

        if ($gradeLevelId !== null) {
            $query .= " AND grade_level_id = :grade_level_id";
            $params['grade_level_id'] = $gradeLevelId;
        }

        $stmt = $this->db->prepare($query);
        $stmt->execute($params);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);

        return (int) $result['total'];
    }

    /**
     * Return aggregate stats: total, active_count, inactive_count, total_students
     */
    public function getStats(?int $institutionId = null, ?int $programId = null, ?int $gradeLevelId = null, ?string $status = null, ?string $search = null): array
    {
        $where  = '1=1';
        $params = [];

        if ($institutionId !== null) {
            $where .= ' AND c.institution_id = :institution_id';
            $params['institution_id'] = $institutionId;
        }
        if ($programId !== null) {
            $where .= ' AND c.program_id = :program_id';
            $params['program_id'] = $programId;
        }
        if ($gradeLevelId !== null) {
            $where .= ' AND c.grade_level_id = :grade_level_id';
            $params['grade_level_id'] = $gradeLevelId;
        }
        if ($status !== null) {
            $where .= ' AND c.status = :status';
            $params['status'] = $status;
        }
        if ($search !== null) {
            $where .= ' AND (c.class_name LIKE :search_name OR c.class_code LIKE :search_code OR c.section LIKE :search_sec)';
            $params['search_name'] = '%' . $search . '%';
            $params['search_code'] = '%' . $search . '%';
            $params['search_sec']  = '%' . $search . '%';
        }

        $query = "
            SELECT
                COUNT(DISTINCT c.class_id)                                           AS total,
                COUNT(DISTINCT CASE WHEN c.status = 'active'   THEN c.class_id END)  AS active_count,
                COUNT(DISTINCT CASE WHEN c.status != 'active'  THEN c.class_id END)  AS inactive_count,
                COUNT(s.student_id)                                                  AS total_students
            FROM classes c
            LEFT JOIN students s ON s.class_id = c.class_id
            WHERE {$where}
        ";

        $stmt = $this->db->prepare($query);
        $stmt->execute($params);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        return [
            'total'          => (int) ($row['total']          ?? 0),
            'active_count'   => (int) ($row['active_count']   ?? 0),
            'inactive_count' => (int) ($row['inactive_count'] ?? 0),
            'total_students' => (int) ($row['total_students'] ?? 0),
        ];
    }

    public function countByInstitutionThisMonth(int $institutionId): int
    {
        try {
            $stmt = $this->db->prepare("
                SELECT COUNT(*) FROM classes
                WHERE institution_id = :institution_id
                AND YEAR(created_at) = YEAR(CURRENT_DATE())
                AND MONTH(created_at) = MONTH(CURRENT_DATE())
            ");
            $stmt->execute(['institution_id' => $institutionId]);
            return (int) $stmt->fetchColumn();
        } catch (\PDOException $e) {
            error_log("Count Classes This Month Error: " . $e->getMessage());
            return 0;
        }
    }

    public function countByInstitutionLastMonth(int $institutionId): int
    {
        try {
            $stmt = $this->db->prepare("
                SELECT COUNT(*) FROM classes
                WHERE institution_id = :institution_id
                AND YEAR(created_at) = YEAR(DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH))
                AND MONTH(created_at) = MONTH(DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH))
            ");
            $stmt->execute(['institution_id' => $institutionId]);
            return (int) $stmt->fetchColumn();
        } catch (\PDOException $e) {
            error_log("Count Classes Last Month Error: " . $e->getMessage());
            return 0;
        }
    }

    /**
     * Find a class by ID with full details
     */
    public function findById(int $id): ?array
    {
        $stmt = $this->db->prepare("
            SELECT 
                c.class_id,
                c.institution_id,
                c.class_code,
                c.class_name,
                c.section,
                c.max_students,
                c.room_number,
                c.status,
                c.created_at,
                c.updated_at,
                p.program_id,
                p.program_name,
                p.program_code,
                gl.grade_level_id,
                gl.grade_level_name,
                gl.grade_level_code,
                gl.level_order,
                ay.academic_year_id,
                ay.year_name,
                ay.start_date,
                ay.end_date,
                ay.is_current,
                t.teacher_id as class_teacher_id,
                CONCAT(tu.first_name, ' ', tu.last_name) as class_teacher_name,
                tu.email as class_teacher_email,
                COUNT(DISTINCT s.student_id) as student_count,
                COUNT(DISTINCT cs.course_id) as subject_count
            FROM classes c
            LEFT JOIN programs p ON c.program_id = p.program_id
            LEFT JOIN grade_levels gl ON c.grade_level_id = gl.grade_level_id
            LEFT JOIN academic_years ay ON c.academic_year_id = ay.academic_year_id
            LEFT JOIN teachers t ON c.class_teacher_id = t.teacher_id
            LEFT JOIN users tu ON t.user_id = tu.user_id
            LEFT JOIN students s ON c.class_id = s.class_id
            LEFT JOIN class_subjects cs ON c.class_id = cs.class_id
            WHERE c.class_id = :id
            GROUP BY c.class_id
        ");

        $stmt->execute(['id' => $id]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);

        return $result ?: null;
    }

    /**
     * Find a class by UUID with full details
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

        $stmt = $this->db->prepare("
            SELECT 
                c.class_id,
                c.institution_id,
                c.uuid,
                c.class_code,
                c.class_name,
                c.section,
                c.max_students,
                c.room_number,
                c.status,
                c.created_at,
                c.updated_at,
                p.program_id,
                p.program_name,
                p.program_code,
                gl.grade_level_id,
                gl.grade_level_name,
                gl.grade_level_code,
                gl.level_order,
                ay.academic_year_id,
                ay.year_name,
                ay.start_date,
                ay.end_date,
                ay.is_current,
                t.teacher_id as class_teacher_id,
                CONCAT(tu.first_name, ' ', tu.last_name) as class_teacher_name,
                tu.email as class_teacher_email,
                COUNT(DISTINCT s.student_id) as student_count,
                COUNT(DISTINCT cs.course_id) as subject_count
            FROM classes c
            LEFT JOIN programs p ON c.program_id = p.program_id
            LEFT JOIN grade_levels gl ON c.grade_level_id = gl.grade_level_id
            LEFT JOIN academic_years ay ON c.academic_year_id = ay.academic_year_id
            LEFT JOIN teachers t ON c.class_teacher_id = t.teacher_id
            LEFT JOIN users tu ON t.user_id = tu.user_id
            LEFT JOIN students s ON c.class_id = s.class_id
            LEFT JOIN class_subjects cs ON c.class_id = cs.class_id
            WHERE c.uuid = :uuid
            GROUP BY c.class_id
        ");

        $stmt->execute(['uuid' => $uuid]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);

        return $result ?: null;
    }

    /**
     * Create a new class
     */
    public function create(array $data): ?int
    {
        // Auto-generate UUID if not provided
        if (!isset($data['uuid'])) {
            $data['uuid'] = UuidHelper::generate();
        }

        // Set defaults
        $data['status'] = $data['status'] ?? 'active';
        $data['max_students'] = $data['max_students'] ?? 40;

        $stmt = $this->db->prepare("
            INSERT INTO classes (
                uuid,
                institution_id,
                program_id,
                grade_level_id,
                academic_year_id,
                class_code,
                class_name,
                section,
                class_teacher_id,
                max_students,
                room_number,
                status,
                created_at,
                updated_at
            ) VALUES (
                :uuid,
                :institution_id,
                :program_id,
                :grade_level_id,
                :academic_year_id,
                :class_code,
                :class_name,
                :section,
                :class_teacher_id,
                :max_students,
                :room_number,
                :status,
                NOW(),
                NOW()
            )
        ");

        $result = $stmt->execute([
            'uuid' => $data['uuid'],
            'institution_id' => $data['institution_id'],
            'program_id' => $data['program_id'],
            'grade_level_id' => $data['grade_level_id'],
            'academic_year_id' => $data['academic_year_id'],
            'class_code' => $data['class_code'],
            'class_name' => $data['class_name'],
            'section' => $data['section'],
            'class_teacher_id' => $data['class_teacher_id'] ?? null,
            'max_students' => $data['max_students'],
            'room_number' => $data['room_number'] ?? null,
            'status' => $data['status']
        ]);

        return $result ? (int) $this->db->lastInsertId() : null;
    }

    /**
     * Update an existing class
     */
    public function update(int $id, array $data): bool
    {
        $fields = [];
        $params = ['id' => $id];

        // Dynamically build update query based on provided fields
        $allowedFields = [
            'class_code',
            'class_name',
            'section',
            'program_id',
            'grade_level_id',
            'academic_year_id',
            'class_teacher_id',
            'max_students',
            'room_number',
            'status'
        ];

        foreach ($allowedFields as $field) {
            if (array_key_exists($field, $data)) {
                $fields[] = "$field = :$field";
                $params[$field] = $data[$field];
            }
        }

        if (empty($fields)) {
            return false; // Nothing to update
        }

        $fields[] = "updated_at = NOW()";

        $query = "UPDATE classes SET " . implode(', ', $fields) . " WHERE class_id = :id";

        $stmt = $this->db->prepare($query);
        return $stmt->execute($params);
    }

    /**
     * Delete a class (will cascade to related records)
     */
    public function delete(int $id): bool
    {
        $stmt = $this->db->prepare("DELETE FROM classes WHERE class_id = :id");
        return $stmt->execute(['id' => $id]);
    }

    /**
     * Get all students enrolled in a class
     */
    public function getClassStudents(int $classId): array
    {
        $stmt = $this->db->prepare("
            SELECT 
                s.student_id,
                s.student_id_number,
                s.enrollment_date,
                s.gender,
                s.date_of_birth,
                s.status,
                u.user_id,
                u.username,
                u.email,
                u.first_name,
                u.last_name,
                u.phone_number,
                TIMESTAMPDIFF(YEAR, s.date_of_birth, CURDATE()) as age
            FROM students s
            INNER JOIN users u ON s.user_id = u.user_id
            WHERE s.class_id = :class_id
            ORDER BY u.last_name, u.first_name
        ");

        $stmt->execute(['class_id' => $classId]);

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Get all class subjects (courses) for a class
     */
    public function getClassSubjects(int $classId): array
    {
        $stmt = $this->db->prepare("
            SELECT 
                cs.course_id,
                cs.status,
                s.subject_id,
                s.subject_code,
                s.subject_name,
                s.description,
                s.credits,
                s.is_core,
                t.teacher_id,
                CONCAT(tu.first_name, ' ', tu.last_name) as teacher_name,
                tu.email as teacher_email,
                COUNT(DISTINCT st.student_id) as enrolled_students
            FROM class_subjects cs
            INNER JOIN subjects s ON cs.subject_id = s.subject_id
            LEFT JOIN teachers t ON cs.teacher_id = t.teacher_id
            LEFT JOIN users tu ON t.user_id = tu.user_id
            LEFT JOIN students st ON st.class_id = cs.class_id
            WHERE cs.class_id = :class_id
            GROUP BY cs.course_id
            ORDER BY s.is_core DESC, s.subject_name
        ");

        $stmt->execute(['class_id' => $classId]);

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Assign a homeroom teacher to a class
     */
    public function assignTeacher(int $classId, int $teacherId): bool
    {
        $stmt = $this->db->prepare("
            UPDATE classes 
            SET class_teacher_id = :teacher_id, updated_at = NOW()
            WHERE class_id = :class_id
        ");

        return $stmt->execute([
            'class_id' => $classId,
            'teacher_id' => $teacherId
        ]);
    }

    /**
     * Get performance statistics for a class from the results table.
     * Returns an overall summary and a per-subject breakdown.
     */
    public function getClassPerformance(int $classId): array
    {
        // ── Overall summary ───────────────────────────────────────────────────
        $summaryStmt = $this->db->prepare("
            SELECT
                ROUND(AVG(r.total_score), 1)                                                        AS avg_score,
                ROUND(MAX(r.total_score), 1)                                                        AS highest_score,
                ROUND(MIN(r.total_score), 1)                                                        AS lowest_score,
                ROUND(SUM(CASE WHEN r.remark = 'Pass' THEN 1 ELSE 0 END) / COUNT(*) * 100, 1)      AS pass_rate,
                COUNT(*)                                                                             AS total_results,
                COUNT(DISTINCT r.student_id)                                                        AS students_assessed,
                COUNT(DISTINCT r.subject_id)                                                        AS subjects_assessed
            FROM results r
            INNER JOIN students st ON r.student_id = st.student_id
            WHERE st.class_id = :class_id
        ");
        $summaryStmt->execute(['class_id' => $classId]);
        $summary = $summaryStmt->fetch(PDO::FETCH_ASSOC);

        // ── Per-subject breakdown ─────────────────────────────────────────────
        $bySubjectStmt = $this->db->prepare("
            SELECT
                s.subject_id,
                s.subject_name,
                s.subject_code,
                ROUND(AVG(r.total_score), 1)                                                        AS avg_score,
                ROUND(MAX(r.total_score), 1)                                                        AS highest,
                ROUND(MIN(r.total_score), 1)                                                        AS lowest,
                COUNT(DISTINCT r.student_id)                                                        AS student_count,
                ROUND(SUM(CASE WHEN r.remark = 'Pass' THEN 1 ELSE 0 END) / COUNT(*) * 100, 1)      AS pass_rate
            FROM results r
            INNER JOIN students st ON r.student_id = st.student_id
            INNER JOIN subjects s  ON r.subject_id  = s.subject_id
            WHERE st.class_id = :class_id
            GROUP BY r.subject_id
            ORDER BY avg_score DESC
        ");
        $bySubjectStmt->execute(['class_id' => $classId]);
        $bySubject = $bySubjectStmt->fetchAll(PDO::FETCH_ASSOC);

        return [
            'summary'    => $summary    ?: [],
            'by_subject' => $bySubject  ?: [],
        ];
    }

    /**
     * Get class schedule/timetable
     * Returns all scheduled sessions for class subjects
     */
    public function getClassSchedule(int $classId): array
    {
        $stmt = $this->db->prepare("
            SELECT 
                csch.schedule_id,
                csch.day_of_week,
                csch.start_time,
                csch.end_time,
                csch.room,
                cs.course_id,
                s.subject_id,
                s.subject_code,
                s.subject_name,
                t.teacher_id,
                CONCAT(tu.first_name, ' ', tu.last_name) as teacher_name
            FROM course_schedules csch
            INNER JOIN class_subjects cs ON csch.course_id = cs.course_id
            INNER JOIN subjects s ON cs.subject_id = s.subject_id
            LEFT JOIN teachers t ON cs.teacher_id = t.teacher_id
            LEFT JOIN users tu ON t.user_id = tu.user_id
            WHERE cs.class_id = :class_id
            ORDER BY 
                FIELD(csch.day_of_week, 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'),
                csch.start_time
        ");

        $stmt->execute(['class_id' => $classId]);

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}