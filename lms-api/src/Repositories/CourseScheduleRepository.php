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
    public function getCourseSchedules(int $courseId): array
    {
        $stmt = $this->db->prepare("
            SELECT *
            FROM course_schedules
            WHERE course_id = :course_id
            ORDER BY 
                FIELD(day_of_week, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'),
                start_time
        ");

        $stmt->execute(['course_id' => $courseId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Find schedule by ID
     */
    public function findById(int $id): ?array
    {
        $stmt = $this->db->prepare("
            SELECT *
            FROM course_schedules
            WHERE schedule_id = :id
        ");

        $stmt->execute(['id' => $id]);
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
                day_of_week,
                start_time,
                end_time,
                room
            ) VALUES (
                :course_id,
                :day_of_week,
                :start_time,
                :end_time,
                :room
            )
        ");

        $stmt->execute([
            'course_id' => $data['course_id'],
            'day_of_week' => $data['day_of_week'],
            'start_time' => $data['start_time'],
            'end_time' => $data['end_time'],
            'room' => $data['room'] ?? null
        ]);

        return (int) $this->db->lastInsertId();
    }

    /**
     * Update a schedule
     */
    public function update(int $id, array $data): bool
    {
        $fields = [];
        $params = ['id' => $id];

        $allowedFields = ['day_of_week', 'start_time', 'end_time', 'room'];

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
        return $stmt->execute($params);
    }

    /**
     * Delete a schedule
     */
    public function delete(int $id): bool
    {
        $stmt = $this->db->prepare("DELETE FROM course_schedules WHERE schedule_id = :id");
        return $stmt->execute(['id' => $id]);
    }

    /**
     * Delete all schedules for a course
     */
    public function deleteByCourse(int $courseId): bool
    {
        $stmt = $this->db->prepare("DELETE FROM course_schedules WHERE course_id = :course_id");
        return $stmt->execute(['course_id' => $courseId]);
    }
}
