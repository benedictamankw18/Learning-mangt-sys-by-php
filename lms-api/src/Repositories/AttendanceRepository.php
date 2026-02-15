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
}
