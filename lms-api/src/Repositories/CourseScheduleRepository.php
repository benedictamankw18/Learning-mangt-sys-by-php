<?php

namespace App\Repositories;

use PDO;
use App\Config\Database;

class CourseScheduleRepository
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance()->getConnection();
    }

    /**
     * Get all schedules for a course
     */
    public function getCourseSchedules(int $courseId, ?int $institutionId = null): array
    {
        $sql = "
            SELECT *
            FROM course_schedules
            WHERE course_id = :course_id
        ";

        $params = ['course_id' => $courseId];
        if ($institutionId !== null) {
            $sql .= " AND institution_id = :institution_id";
            $params['institution_id'] = $institutionId;
        }

        $sql .= "
            ORDER BY 
                FIELD(day_of_week, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'),
                start_time
        ";

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Find schedule by ID
     */
    public function findById(int $id, ?int $institutionId = null): ?array
    {
        $sql = "
            SELECT *
            FROM course_schedules
            WHERE schedule_id = :id
        ";

        $params = ['id' => $id];
        if ($institutionId !== null) {
            $sql .= " AND institution_id = :institution_id";
            $params['institution_id'] = $institutionId;
        }

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return $result ?: null;
    }

    /**
     * Create a new schedule
     */
    public function create(array $data): int
    {
        $stmt = $this->db->prepare("
            INSERT INTO course_schedules (
                course_id,
                institution_id,
                day_of_week,
                start_time,
                end_time,
                period_label,
                room,
                status,
                is_recurring
            ) VALUES (
                :course_id,
                :institution_id,
                :day_of_week,
                :start_time,
                :end_time,
                :period_label,
                :room,
                :status,
                :is_recurring
            )
        ");

        $stmt->execute([
            'course_id' => $data['course_id'],
            'institution_id' => $data['institution_id'] ?? null,
            'day_of_week' => $data['day_of_week'],
            'start_time' => $data['start_time'],
            'end_time' => $data['end_time'],
            'period_label' => $data['period_label'] ?? null,
            'room' => $data['room'] ?? null,
            'status' => $data['status'] ?? 'active',
            'is_recurring' => $data['is_recurring'] ?? 1
        ]);

        $scheduleId = (int) $this->db->lastInsertId();
        log_audit('Course schedule created', ['schedule_id' => $scheduleId, 'course_id' => $data['course_id'], 'day_of_week' => $data['day_of_week']]);
        return $scheduleId;
    }

    /**
     * Update a schedule
     */
    public function update(int $id, array $data): bool
    {
        $fields = [];
        $params = ['id' => $id];

        $allowedFields = ['day_of_week', 'start_time', 'end_time', 'period_label', 'room', 'status', 'is_recurring'];

        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                $fields[] = "{$field} = :{$field}";
                $params[$field] = $data[$field];
            }
        }

        if (empty($fields)) {
            return false;
        }

        $sql = "UPDATE course_schedules SET " . implode(', ', $fields) . " WHERE schedule_id = :id";
        $stmt = $this->db->prepare($sql);
        $result = $stmt->execute($params);
        if ($result) {
            log_audit('Course schedule updated', ['schedule_id' => $id, 'fields_updated' => array_keys($data)]);
        }
        return $result;
    }

    /**
     * Delete a schedule
     */
    public function delete(int $id): bool
    {
        $stmt = $this->db->prepare("DELETE FROM course_schedules WHERE schedule_id = :id");
        $result = $stmt->execute(['id' => $id]);
        if ($result) {
            log_audit('Course schedule deleted', ['schedule_id' => $id]);
        }
        return $result;
    }

    /**
     * Delete all schedules for a course
     */
    public function deleteByCourse(int $courseId): bool
    {
        $stmt = $this->db->prepare("DELETE FROM course_schedules WHERE course_id = :course_id");
        $result = $stmt->execute(['course_id' => $courseId]);
        if ($result) {
            log_audit('Course schedules deleted by course', ['course_id' => $courseId]);
        }
        return $result;
    }
}
