<?php

namespace App\Repositories;

use App\Config\Database;
use App\Utils\UuidHelper;
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
            // Auto-generate UUID if not provided
            if (!isset($data['uuid'])) {
                $data['uuid'] = UuidHelper::generate();
            }

            $stmt = $this->db->prepare("
                INSERT INTO students (
                    uuid, institution_id, user_id, student_id_number, enrollment_date, 
                    class_id, gender, date_of_birth, parent_name, parent_phone, 
                    parent_email, emergency_contact, status
                )
                VALUES (
                    :uuid, :institution_id, :user_id, :student_id_number, :enrollment_date,
                    :class_id, :gender, :date_of_birth, :parent_name, :parent_phone,
                    :parent_email, :emergency_contact, :status
                )
            ");

            $stmt->execute([
                'uuid' => $data['uuid'],
                'institution_id' => $data['institution_id'],
                'user_id' => $userId,
                'student_id_number' => $data['student_id_number'],
                'enrollment_date' => (!empty($data['enrollment_date'])) ? $data['enrollment_date'] : date('Y-m-d'),
                'class_id' => (!empty($data['class_id'])) ? (int) $data['class_id'] : null,
                'gender' => (!empty($data['gender'])) ? $data['gender'] : null,
                'date_of_birth' => (!empty($data['date_of_birth'])) ? $data['date_of_birth'] : null,
                'parent_name' => (!empty($data['parent_name'])) ? $data['parent_name'] : null,
                'parent_phone' => (!empty($data['parent_phone'])) ? $data['parent_phone'] : null,
                'parent_email' => (!empty($data['parent_email'])) ? $data['parent_email'] : null,
                'emergency_contact' => (!empty($data['emergency_contact'])) ? $data['emergency_contact'] : null,
                'status' => $data['status'] ?? 'active'
            ]);

            return (int) $this->db->lastInsertId();
        } catch (\PDOException $e) {
            error_log("Student Create Error: " . $e->getMessage());
            return null;
        }
    }

    public function isStudentIdTaken(string $studentIdNumber, ?int $institutionId, ?int $excludeStudentId = null): bool
    {
        try {
            $sql = "SELECT student_id FROM students WHERE student_id_number = :sid";
            $params = ['sid' => $studentIdNumber];
            if ($institutionId !== null) {
                $sql .= " AND institution_id = :institution_id";
                $params['institution_id'] = $institutionId;
            }
            if ($excludeStudentId !== null) {
                $sql .= " AND student_id != :exclude_id";
                $params['exclude_id'] = $excludeStudentId;
            }
            $sql .= " LIMIT 1";
            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);
            return (bool) $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (\PDOException $e) {
            error_log("isStudentIdTaken Error: " . $e->getMessage());
            return false;
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

    /**
     * Find student by UUID
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
                    s.*,
                    u.username,
                    u.email,
                    u.first_name,
                    u.last_name,
                    u.phone_number,
                    u.address,
                    u.date_of_birth,
                    u.is_active,
                    c.class_name,
                    c.class_code,
                    p.program_id,
                    p.program_name
                FROM students s
                INNER JOIN users u ON s.user_id = u.user_id
                LEFT JOIN classes c ON s.class_id = c.class_id
                LEFT JOIN programs p ON c.program_id = p.program_id
                WHERE s.uuid = :uuid
            ");

            $stmt->execute(['uuid' => $uuid]);
            return $stmt->fetch(PDO::FETCH_ASSOC) ?: null;
        } catch (\PDOException $e) {
            error_log("Student Find By UUID Error: " . $e->getMessage());
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

    public function getAll(
        int $page = 1,
        int $limit = 20,
        ?int $institutionId = null,
        ?int $classId = null,
        ?int $programId = null,
        ?string $status = null,
        ?string $search = null
    ): array {
        try {
            $offset = ($page - 1) * $limit;
            $params = [];

            $sql = "
                SELECT
                    s.student_id, s.uuid, s.institution_id, s.student_id_number,
                    s.enrollment_date, s.class_id, s.gender, s.status,
                    s.parent_name, s.parent_phone, s.parent_email,
                    s.emergency_contact, s.created_at,
                    u.user_id, u.username, u.email, u.first_name, u.last_name,
                    u.phone_number, u.date_of_birth, u.is_active,
                    c.class_name, c.class_code,
                    p.program_id, p.program_name
                FROM students s
                INNER JOIN users u ON s.user_id = u.user_id
                LEFT JOIN classes c ON s.class_id = c.class_id
                LEFT JOIN programs p ON c.program_id = p.program_id
                WHERE u.deleted_at IS NULL
            ";

            if ($institutionId !== null) {
                $sql .= " AND s.institution_id = :institution_id";
                $params['institution_id'] = $institutionId;
            }
            if ($classId !== null) {
                $sql .= " AND s.class_id = :class_id";
                $params['class_id'] = $classId;
            }
            if ($programId !== null) {
                $sql .= " AND p.program_id = :program_id";
                $params['program_id'] = $programId;
            }
            if ($status !== null && $status !== '') {
                $sql .= " AND s.status = :status";
                $params['status'] = $status;
            }
            if ($search !== null && $search !== '') {
                $sql .= " AND (u.first_name LIKE :search1 OR u.last_name LIKE :search2
                          OR u.email LIKE :search3 OR s.student_id_number LIKE :search4)";
                $searchVal = '%' . $search . '%';
                $params['search1'] = $searchVal;
                $params['search2'] = $searchVal;
                $params['search3'] = $searchVal;
                $params['search4'] = $searchVal;
            }

            $sql .= " ORDER BY s.created_at DESC LIMIT :limit OFFSET :offset";

            $stmt = $this->db->prepare($sql);
            foreach ($params as $key => $value) {
                $stmt->bindValue(":$key", $value);
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

    public function count(
        ?int $institutionId = null,
        ?int $classId = null,
        ?int $programId = null,
        ?string $status = null,
        ?string $search = null
    ): int {
        try {
            $params = [];

            $sql = "
                SELECT COUNT(*) FROM students s
                INNER JOIN users u ON s.user_id = u.user_id
                LEFT JOIN classes c ON s.class_id = c.class_id
                LEFT JOIN programs p ON c.program_id = p.program_id
                WHERE u.deleted_at IS NULL
            ";

            if ($institutionId !== null) {
                $sql .= " AND s.institution_id = :institution_id";
                $params['institution_id'] = $institutionId;
            }
            if ($classId !== null) {
                $sql .= " AND s.class_id = :class_id";
                $params['class_id'] = $classId;
            }
            if ($programId !== null) {
                $sql .= " AND p.program_id = :program_id";
                $params['program_id'] = $programId;
            }
            if ($status !== null && $status !== '') {
                $sql .= " AND s.status = :status";
                $params['status'] = $status;
            }
            if ($search !== null && $search !== '') {
                $sql .= " AND (u.first_name LIKE :search1 OR u.last_name LIKE :search2
                          OR u.email LIKE :search3 OR s.student_id_number LIKE :search4)";
                $searchVal = '%' . $search . '%';
                $params['search1'] = $searchVal;
                $params['search2'] = $searchVal;
                $params['search3'] = $searchVal;
                $params['search4'] = $searchVal;
            }

            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);
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

    public function countByInstitutionThisMonth(int $institutionId): int
    {
        try {
            $stmt = $this->db->prepare("
                SELECT COUNT(*) FROM students s
                INNER JOIN users u ON s.user_id = u.user_id
                WHERE s.institution_id = :institution_id AND u.deleted_at IS NULL
                AND YEAR(s.created_at) = YEAR(CURRENT_DATE())
                AND MONTH(s.created_at) = MONTH(CURRENT_DATE())
            ");
            $stmt->execute(['institution_id' => $institutionId]);
            return (int) $stmt->fetchColumn();
        } catch (\PDOException $e) {
            error_log("Count Students This Month Error: " . $e->getMessage());
            return 0;
        }
    }

    public function countByInstitutionLastMonth(int $institutionId): int
    {
        try {
            $stmt = $this->db->prepare("
                SELECT COUNT(*) FROM students s
                INNER JOIN users u ON s.user_id = u.user_id
                WHERE s.institution_id = :institution_id AND u.deleted_at IS NULL
                AND YEAR(s.created_at) = YEAR(DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH))
                AND MONTH(s.created_at) = MONTH(DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH))
            ");
            $stmt->execute(['institution_id' => $institutionId]);
            return (int) $stmt->fetchColumn();
        } catch (\PDOException $e) {
            error_log("Count Students Last Month Error: " . $e->getMessage());
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
                       c.subject_name, c.subject_code,
                       u.first_name, u.last_name, s.student_id_number
                FROM course_enrollments ce
                JOIN subjects c ON ce.course_id = c.subject_id
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
                    cs.course_id,
                    cs.institution_id,
                    cs.class_id,
                    cs.subject_id,
                    cs.teacher_id,
                    cs.status,
                    s.subject_name,
                    s.subject_code,
                    cl.class_name,
                    sem.semester_name,
                    st.enrollment_date,
                    cs.status as enrollment_status,
                    NULL as progress_percentage,
                    t.first_name as teacher_first_name,
                    t.last_name as teacher_last_name
                FROM students st
                INNER JOIN class_subjects cs ON cs.class_id = st.class_id
                INNER JOIN subjects s ON cs.subject_id = s.subject_id
                INNER JOIN classes cl ON cs.class_id = cl.class_id
                LEFT JOIN semesters sem ON cs.semester_id = sem.semester_id
                LEFT JOIN teachers teach ON cs.teacher_id = teach.teacher_id
                LEFT JOIN users t ON teach.user_id = t.user_id
                WHERE st.student_id = :student_id AND cs.status = 'active'
                ORDER BY s.subject_name ASC
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
    /**
     * Get the next available sequence number for a student ID in a given year.
     * Looks for existing IDs matching '{prefix}-{year}-*' for this institution,
     * finds the max sequence, and returns max + 1 (or 1 if none exist).
     */
    public function getNextIdSequence(int $institutionId, string $prefix, int $year): int
    {
        try {
            $like = $prefix . '-' . $year . '-%';
            $stmt = $this->db->prepare("
                SELECT student_id_number
                FROM students
                WHERE institution_id = :institution_id
                  AND student_id_number LIKE :like
                ORDER BY student_id_number DESC
                LIMIT 1
            ");
            $stmt->bindValue(':institution_id', $institutionId, PDO::PARAM_INT);
            $stmt->bindValue(':like', $like);
            $stmt->execute();
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$row) {
                return 1;
            }
            // Extract sequence from the last segment e.g. "ASHS-2026-0042" → 42
            $parts = explode('-', $row['student_id_number']);
            $seq = (int) end($parts);
            return $seq + 1;
        } catch (\PDOException $e) {
            error_log("Get Next ID Sequence Error: " . $e->getMessage());
            return 1;
        }
    }

    /**
     * Get monthly new-enrollment counts for the last 12 months (rolling window).
     * Returns a 12-element array: index 0 = oldest month, index 11 = current month.
     * Spans two calendar years when needed (e.g. Apr 2025 – Mar 2026).
     *
     * @param int $institutionId
     * @return array<int, int>
     */
    public function getMonthlyEnrollmentsByInstitution(int $institutionId): array
    {
        try {
            $stmt = $this->db->prepare("
                SELECT 
                    YEAR(s.enrollment_date)  AS year,
                    MONTH(s.enrollment_date) AS month,
                    COUNT(*)            AS count
                FROM students s
                INNER JOIN users u ON s.user_id = u.user_id
                WHERE s.institution_id = :institution_id
                AND s.enrollment_date >= DATE_FORMAT(
                        DATE_SUB(CURRENT_DATE(), INTERVAL 11 MONTH), '%Y-%m-01'
                    )
                AND u.deleted_at IS NULL
                GROUP BY YEAR(s.enrollment_date), MONTH(s.enrollment_date)
                ORDER BY year, month
            ");

            $stmt->execute(['institution_id' => $institutionId]);
            $results = $stmt->fetchAll(\PDO::FETCH_ASSOC);

            // Build a year-month keyed map
            $map = [];
            foreach ($results as $row) {
                $key = $row['year'] . '-' . str_pad($row['month'], 2, '0', STR_PAD_LEFT);
                $map[$key] = (int) $row['count'];
            }

            // Produce an ordered 12-element array matching the frontend getLast12MonthLabels()
            $counts = [];
            $now = new \DateTime();
            for ($i = 11; $i >= 0; $i--) {
                $d = (clone $now)->modify("-{$i} months");
                $counts[] = $map[$d->format('Y-m')] ?? 0;
            }

            return $counts; // index 0 = 11 months ago, index 11 = current month
        } catch (\PDOException $e) {
            error_log("Get Monthly Enrollments Error: " . $e->getMessage());
            return array_fill(0, 12, 0);
        }
    }
}
