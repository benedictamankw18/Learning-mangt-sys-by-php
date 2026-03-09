<?php

namespace App\Repositories;

use App\Config\Database;
use PDO;

class AttendanceRepository
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance()->getConnection();
    }

    public function markAttendance(int $studentId, int $courseId, string $date, string $status, ?string $remarks = null): bool
    {
        try {
            $stmt = $this->db->prepare("
                INSERT INTO attendance (student_id, course_id, attendance_date, status, remarks)
                VALUES (:student_id, :course_id, :date, :status, :remarks)
                ON DUPLICATE KEY UPDATE status = VALUES(status), remarks = VALUES(remarks)
            ");

            $stmt->execute([
                'student_id' => $studentId,
                'course_id' => $courseId,
                'date' => $date,
                'status' => $status,
                'remarks' => $remarks
            ]);

            return true;
        } catch (\PDOException $e) {
            error_log("Mark Attendance Error: " . $e->getMessage());
            return false;
        }
    }

    public function getAttendanceByStudent(int $studentId, ?int $courseId = null, ?string $startDate = null, ?string $endDate = null): array
    {
        try {
            $sql = "
                SELECT 
                    a.*,
                    c.course_name,
                    c.course_code
                FROM attendance a
                INNER JOIN courses c ON a.course_id = c.course_id
                WHERE a.student_id = :student_id
            ";

            $params = ['student_id' => $studentId];

            if ($courseId) {
                $sql .= " AND a.course_id = :course_id";
                $params['course_id'] = $courseId;
            }

            if ($startDate) {
                $sql .= " AND a.attendance_date >= :start_date";
                $params['start_date'] = $startDate;
            }

            if ($endDate) {
                $sql .= " AND a.attendance_date <= :end_date";
                $params['end_date'] = $endDate;
            }

            $sql .= " ORDER BY a.attendance_date DESC";

            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);

            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (\PDOException $e) {
            error_log("Get Attendance By Student Error: " . $e->getMessage());
            return [];
        }
    }

    public function getAttendanceByCourse(int $courseId, string $date): array
    {
        try {
            $stmt = $this->db->prepare("
                SELECT 
                    a.*,
                    s.student_id_number,
                    u.first_name,
                    u.last_name
                FROM attendance a
                INNER JOIN students s ON a.student_id = s.student_id
                INNER JOIN users u ON s.user_id = u.user_id
                WHERE a.course_id = :course_id AND a.attendance_date = :date
                ORDER BY u.last_name, u.first_name
            ");

            $stmt->execute([
                'course_id' => $courseId,
                'date' => $date
            ]);

            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (\PDOException $e) {
            error_log("Get Attendance By Course Error: " . $e->getMessage());
            return [];
        }
    }

    public function getAttendanceStats(int $studentId, ?int $courseId = null): array
    {
        try {
            $sql = "
                SELECT 
                    COUNT(*) as total_days,
                    COALESCE(SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END), 0) as present_days,
                    COALESCE(SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END), 0) as absent_days,
                    COALESCE(SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END), 0) as late_days,
                    COALESCE(SUM(CASE WHEN status = 'excused' THEN 1 ELSE 0 END), 0) as excused_days,
                    COALESCE(ROUND((SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) / NULLIF(COUNT(*), 0)) * 100, 2), 0) as attendance_percentage
                FROM attendance
                WHERE student_id = :student_id
            ";

            $params = ['student_id' => $studentId];

            if ($courseId) {
                $sql .= " AND course_id = :course_id";
                $params['course_id'] = $courseId;
            }

            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);

            return $stmt->fetch(PDO::FETCH_ASSOC) ?: [];
        } catch (\PDOException $e) {
            error_log("Get Attendance Stats Error: " . $e->getMessage());
            return [];
        }
    }

    public function bulkMarkAttendance(int $courseId, string $date, array $studentData): bool
    {
        try {
            $this->db->beginTransaction();

            $stmt = $this->db->prepare("
                INSERT INTO attendance (student_id, course_id, attendance_date, status, remarks)
                VALUES (:student_id, :course_id, :date, :status, :remarks)
                ON DUPLICATE KEY UPDATE status = VALUES(status), remarks = VALUES(remarks)
            ");

            foreach ($studentData as $data) {
                $stmt->execute([
                    'student_id' => $data['student_id'],
                    'course_id' => $courseId,
                    'date' => $date,
                    'status' => $data['status'],
                    'remarks' => $data['remarks'] ?? null
                ]);
            }

            $this->db->commit();
            return true;

        } catch (\Exception $e) {
            if ($this->db->inTransaction()) {
                $this->db->rollBack();
            }
            error_log("Bulk Mark Attendance Error: " . $e->getMessage());
            return false;
        }
    }

    public function findById(int $attendanceId): ?array
    {
        try {
            $stmt = $this->db->prepare("
                SELECT a.*, 
                       u.first_name, u.last_name,
                       c.course_name, c.course_code
                FROM attendance a
                JOIN students s ON a.student_id = s.student_id
                JOIN users u ON s.user_id = u.user_id
                JOIN courses c ON a.course_id = c.course_id
                WHERE a.attendance_id = :attendance_id
            ");
            $stmt->execute(['attendance_id' => $attendanceId]);
            $result = $stmt->fetch(\PDO::FETCH_ASSOC);
            return $result ?: null;
        } catch (\PDOException $e) {
            error_log("Find Attendance Error: " . $e->getMessage());
            return null;
        }
    }

    public function update(int $attendanceId, array $data): bool
    {
        try {
            $allowedFields = ['status', 'remarks'];
            $updates = [];
            $params = ['attendance_id' => $attendanceId];

            foreach ($allowedFields as $field) {
                if (isset($data[$field])) {
                    $updates[] = "$field = :$field";
                    $params[$field] = $data[$field];
                }
            }

            if (empty($updates)) {
                return false;
            }

            $sql = "UPDATE attendance SET " . implode(', ', $updates) . " WHERE attendance_id = :attendance_id";
            $stmt = $this->db->prepare($sql);
            return $stmt->execute($params);

        } catch (\PDOException $e) {
            error_log("Update Attendance Error: " . $e->getMessage());
            return false;
        }
    }

    public function delete(int $attendanceId): bool
    {
        try {
            $stmt = $this->db->prepare("DELETE FROM attendance WHERE attendance_id = :attendance_id");
            return $stmt->execute(['attendance_id' => $attendanceId]);
        } catch (\PDOException $e) {
            error_log("Delete Attendance Error: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Attendance rate for a single date, scoped to an institution.
     * Rate = present / total records marked that day (×100).
     *
     * @param int    $institutionId
     * @param string|null $date  Y-m-d; defaults to today
     * @return float  0–100, rounded to 1 decimal place
     */
    public function getDailyRateByInstitution(int $institutionId, ?string $date = null): float
    {
        try {
            $date = $date ?? date('Y-m-d');
            $stmt = $this->db->prepare("
                SELECT
                    COUNT(*)                                                         AS total,
                    COALESCE(SUM(a.status = 'present'), 0)                          AS present
                FROM attendance a
                INNER JOIN students s ON a.student_id = s.student_id
                WHERE s.institution_id = :institution_id
                  AND a.attendance_date  = :date
            ");
            $stmt->execute(['institution_id' => $institutionId, 'date' => $date]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$row || (int) $row['total'] === 0) return 0.0;
            return round(((int) $row['present'] / (int) $row['total']) * 100, 1);
        } catch (\PDOException $e) {
            error_log("Daily Attendance Rate Error: " . $e->getMessage());
            return 0.0;
        }
    }

    /**
     * Attendance rate for the current calendar week (Monday → today), scoped to an institution.
     *
     * @param int $institutionId
     * @return float  0–100, rounded to 1 decimal place
     */
    public function getWeeklyRateByInstitution(int $institutionId): float
    {
        try {
            // Monday of the current week
            $monday = date('Y-m-d', strtotime('monday this week'));
            $today  = date('Y-m-d');
            $stmt = $this->db->prepare("
                SELECT
                    COUNT(*)                                                         AS total,
                    COALESCE(SUM(a.status = 'present'), 0)                          AS present
                FROM attendance a
                INNER JOIN students s ON a.student_id = s.student_id
                WHERE s.institution_id = :institution_id
                  AND a.attendance_date BETWEEN :monday AND :today
            ");
            $stmt->execute([
                'institution_id' => $institutionId,
                'monday'         => $monday,
                'today'          => $today,
            ]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$row || (int) $row['total'] === 0) return 0.0;
            return round(((int) $row['present'] / (int) $row['total']) * 100, 1);
        } catch (\PDOException $e) {
            error_log("Weekly Attendance Rate Error: " . $e->getMessage());
            return 0.0;
        }
    }

    /**
     * Attendance rate for a teacher's courses on a given date (default today).
     * Scoped by teacher_id via class_subjects.
     */
    public function getDailyRateByTeacher(int $teacherId, ?string $date = null): float
    {
        try {
            $date = $date ?? date('Y-m-d');
            $stmt = $this->db->prepare("
                SELECT
                    COUNT(*)                               AS total,
                    COALESCE(SUM(a.status = 'present'), 0) AS present
                FROM attendance a
                INNER JOIN class_subjects cs ON a.course_id = cs.course_id
                WHERE cs.teacher_id    = :teacher_id
                  AND a.attendance_date = :date
            ");
            $stmt->execute(['teacher_id' => $teacherId, 'date' => $date]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$row || (int) $row['total'] === 0) return 0.0;
            return round(((int) $row['present'] / (int) $row['total']) * 100, 1);
        } catch (\PDOException $e) {
            error_log("Teacher Daily Attendance Rate Error: " . $e->getMessage());
            return 0.0;
        }
    }

    /**
     * Attendance rate for a teacher's courses this week (Monday → today).
     */
    public function getWeeklyRateByTeacher(int $teacherId): float
    {
        try {
            $monday = date('Y-m-d', strtotime('monday this week'));
            $today  = date('Y-m-d');
            $stmt = $this->db->prepare("
                SELECT
                    COUNT(*)                               AS total,
                    COALESCE(SUM(a.status = 'present'), 0) AS present
                FROM attendance a
                INNER JOIN class_subjects cs ON a.course_id = cs.course_id
                WHERE cs.teacher_id  = :teacher_id
                  AND a.attendance_date BETWEEN :monday AND :today
            ");
            $stmt->execute(['teacher_id' => $teacherId, 'monday' => $monday, 'today' => $today]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$row || (int) $row['total'] === 0) return 0.0;
            return round(((int) $row['present'] / (int) $row['total']) * 100, 1);
        } catch (\PDOException $e) {
            error_log("Teacher Weekly Attendance Rate Error: " . $e->getMessage());
            return 0.0;
        }
    }

    /**
     * Today's schedule entries count for a teacher.
     */
    public function countTodayScheduleByTeacher(int $teacherId): int
    {
        try {
            $dayName = date('l'); // e.g. Monday
            $stmt = $this->db->prepare("
                SELECT COUNT(*) AS cnt
                FROM course_schedules cs_sched
                INNER JOIN class_subjects cs ON cs_sched.course_id = cs.course_id
                WHERE cs.teacher_id     = :teacher_id
                  AND cs_sched.day_of_week = :day_name
            ");
            $stmt->execute(['teacher_id' => $teacherId, 'day_name' => $dayName]);
            return (int) $stmt->fetchColumn();
        } catch (\PDOException $e) {
            error_log("Teacher Today Schedule Count Error: " . $e->getMessage());
            return 0;
        }
    }

    /**
     * Overall attendance rate for a student across all enrolled courses.
     */
    public function getOverallRateByStudent(int $studentId): float
    {
        try {
            $stmt = $this->db->prepare("
                SELECT
                    COUNT(*)                               AS total,
                    COALESCE(SUM(status = 'present'), 0)   AS present
                FROM attendance
                WHERE student_id = :student_id
            ");
            $stmt->execute(['student_id' => $studentId]);
            $row = $stmt->fetch(\PDO::FETCH_ASSOC);
            if (!$row || (int) $row['total'] === 0) return 0.0;
            return round(((int) $row['present'] / (int) $row['total']) * 100, 1);
        } catch (\PDOException $e) {
            error_log("Student Overall Attendance Rate Error: " . $e->getMessage());
            return 0.0;
        }
    }

    /**
     * Today's schedule for a student via course_enrollments → class_subjects → course_schedules.
     */
    public function getTodayScheduleByStudent(int $studentId): array
    {
        try {
            $dayName = strtolower(date('l'));
            $stmt = $this->db->prepare("
                SELECT
                    cs_sched.schedule_id,
                    cs_sched.day_of_week,
                    cs_sched.start_time,
                    cs_sched.end_time,
                    cs_sched.room,
                    s.subject_name,
                    s.subject_code,
                    cl.class_name,
                    CONCAT(ut.first_name, ' ', ut.last_name) AS teacher_name
                FROM course_enrollments ce
                INNER JOIN class_subjects cs         ON ce.course_id = cs.course_id
                INNER JOIN course_schedules cs_sched ON cs.course_id = cs_sched.course_id
                INNER JOIN subjects s                ON cs.subject_id = s.subject_id
                INNER JOIN classes cl                ON cs.class_id = cl.class_id
                LEFT  JOIN teachers t                ON cs.teacher_id = t.teacher_id
                LEFT  JOIN users ut                  ON t.user_id = ut.user_id
                WHERE ce.student_id = :student_id
                  AND ce.status = 'active'
                  AND LOWER(cs_sched.day_of_week) = :day_name
                ORDER BY cs_sched.start_time
            ");
            $stmt->execute(['student_id' => $studentId, 'day_name' => $dayName]);
            return $stmt->fetchAll(\PDO::FETCH_ASSOC);
        } catch (\PDOException $e) {
            error_log("Student Today Schedule Error: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Rolling 12-month monthly attendance rate for a teacher's courses.
     * Returns a 12-element array aligned with getLast12MonthLabels() (oldest first).
     */
    public function getAttendanceTrendByTeacher(int $teacherId): array
    {
        try {
            $stmt = $this->db->prepare("
                SELECT
                    YEAR(a.attendance_date)                        AS yr,
                    MONTH(a.attendance_date)                       AS mo,
                    COUNT(*)                                       AS total,
                    COALESCE(SUM(a.status = 'present'), 0)         AS present
                FROM attendance a
                INNER JOIN class_subjects cs ON a.course_id = cs.course_id
                WHERE cs.teacher_id = :teacher_id
                  AND a.attendance_date >= DATE_FORMAT(
                        DATE_SUB(CURRENT_DATE(), INTERVAL 11 MONTH), '%Y-%m-01'
                      )
                GROUP BY yr, mo
                ORDER BY yr, mo
            ");
            $stmt->execute(['teacher_id' => $teacherId]);
            $rows = $stmt->fetchAll(\PDO::FETCH_ASSOC);

            $map = [];
            foreach ($rows as $row) {
                $key = $row['yr'] . '-' . (int) $row['mo'];
                $map[$key] = (int) $row['total'] > 0
                    ? round(((int) $row['present'] / (int) $row['total']) * 100, 1)
                    : 0.0;
            }

            $result = [];
            $now    = new \DateTime();
            for ($i = 11; $i >= 0; $i--) {
                $d   = (clone $now)->modify("-{$i} months");
                $key = $d->format('Y') . '-' . (int) $d->format('n');
                $result[] = $map[$key] ?? 0.0;
            }
            return $result;
        } catch (\PDOException $e) {
            error_log("Teacher Attendance Trend Error: " . $e->getMessage());
            return array_fill(0, 12, 0.0);
        }
    }
}
