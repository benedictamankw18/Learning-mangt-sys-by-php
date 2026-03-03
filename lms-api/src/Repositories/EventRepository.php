<?php

namespace App\Repositories;

use PDO;

class EventRepository extends BaseRepository
{
    protected $table = 'events';
    protected $primaryKey = 'event_id';

    public function getAll(array $filters = [], int $limit = 50, int $offset = 0): array
    {
        $sql = "SELECT e.*, i.institution_name as institution_name 
                FROM {$this->table} e
                LEFT JOIN institutions i ON e.institution_id = i.institution_id
                WHERE 1=1";
        $params = [];

        if (!empty($filters['institution_id'])) {
            $sql .= " AND e.institution_id = :institution_id";
            $params[':institution_id'] = $filters['institution_id'];
        }

        if (!empty($filters['type'])) {
            $sql .= " AND e.event_type = :type";
            $params[':type'] = $filters['type'];
        }

        if (!empty($filters['start_date'])) {
            $sql .= " AND e.start_date >= :start_date";
            $params[':start_date'] = $filters['start_date'];
        }

        if (!empty($filters['end_date'])) {
            $sql .= " AND e.end_date <= :end_date";
            $params[':end_date'] = $filters['end_date'];
        }

        $sql .= " ORDER BY e.start_date ASC LIMIT :limit OFFSET :offset";
        $params[':limit'] = (int) $limit;
        $params[':offset'] = (int) $offset;

        $stmt = $this->db->prepare($sql);
        foreach ($params as $key => $value) {
            if ($key === ':limit' || $key === ':offset') {
                $stmt->bindValue($key, $value, PDO::PARAM_INT);
            } else {
                $stmt->bindValue($key, $value);
            }
        }
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function count(array $filters = []): int
    {
        $sql = "SELECT COUNT(*) as total FROM {$this->table} WHERE 1=1";
        $params = [];

        if (!empty($filters['institution_id'])) {
            $sql .= " AND institution_id = :institution_id";
            $params[':institution_id'] = $filters['institution_id'];
        }

        if (!empty($filters['type'])) {
            $sql .= " AND event_type = :type";
            $params[':type'] = $filters['type'];
        }

        if (!empty($filters['start_date'])) {
            $sql .= " AND start_date >= :start_date";
            $params[':start_date'] = $filters['start_date'];
        }

        if (!empty($filters['end_date'])) {
            $sql .= " AND end_date <= :end_date";
            $params[':end_date'] = $filters['end_date'];
        }

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);

        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return $result['total'];
    }

    public function getUpcoming($institutionId = null, $days = 30, $limit = 20)
    {
        $sql = "SELECT e.*, i.institution_name as institution_name 
                FROM {$this->table} e
                LEFT JOIN institutions i ON e.institution_id = i.institution_id
                WHERE e.start_date >= CURDATE() 
                AND e.start_date <= DATE_ADD(CURDATE(), INTERVAL :days DAY)";
        $params = [':days' => (int) $days];

        if ($institutionId) {
            $sql .= " AND e.institution_id = :institution_id";
            $params[':institution_id'] = $institutionId;
        }

        $sql .= " ORDER BY e.start_date ASC LIMIT :limit";
        $params[':limit'] = (int) $limit;

        $stmt = $this->db->prepare($sql);
        foreach ($params as $key => $value) {
            if ($key === ':days' || $key === ':limit') {
                $stmt->bindValue($key, $value, PDO::PARAM_INT);
            } else {
                $stmt->bindValue($key, $value);
            }
        }
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getCalendar($institutionId = null, $month = null)
    {
        if (!$month) {
            $month = date('Y-m');
        }

        $startDate = $month . '-01';
        $endDate = date('Y-m-t', strtotime($startDate));

        $sql = "SELECT e.*, i.institution_name as institution_name 
                FROM {$this->table} e
                LEFT JOIN institutions i ON e.institution_id = i.institution_id
                WHERE (
                    (e.start_date >= ? AND e.start_date <= ?)
                    OR (e.end_date >= ? AND e.end_date <= ?)
                    OR (e.start_date <= ? AND e.end_date >= ?)
                )";
        $params = [$startDate, $endDate, $startDate, $endDate, $startDate, $endDate];

        if ($institutionId) {
            $sql .= " AND e.institution_id = ?";
            $params[] = $institutionId;
        }

        $sql .= " ORDER BY e.start_date ASC";

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getByType($type, $institutionId = null, $limit = 50)
    {
        $sql = "SELECT e.*, i.institution_name as institution_name 
                FROM {$this->table} e
                LEFT JOIN institutions i ON e.institution_id = i.institution_id
                WHERE e.event_type = :type";
        $params = [':type' => $type];

        if ($institutionId) {
            $sql .= " AND e.institution_id = :institution_id";
            $params[':institution_id'] = $institutionId;
        }

        $sql .= " ORDER BY e.start_date DESC LIMIT :limit";
        $params[':limit'] = (int) $limit;

        $stmt = $this->db->prepare($sql);
        foreach ($params as $key => $value) {
            if ($key === ':limit') {
                $stmt->bindValue($key, $value, PDO::PARAM_INT);
            } else {
                $stmt->bindValue($key, $value);
            }
        }
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getAcademicCalendar($institutionId = null, $academicYearId = null)
    {
        $sql = "SELECT e.*, i.institution_name as institution_name 
                FROM {$this->table} e
                LEFT JOIN institutions i ON e.institution_id = i.institution_id
                WHERE e.event_type IN ('academic', 'exam', 'holiday')";
        $params = [];

        if ($institutionId) {
            $sql .= " AND e.institution_id = :institution_id";
            $params[':institution_id'] = $institutionId;
        }

        // Note: events table doesn't have academic_year_id column
        // Filter by date range instead if needed

        $sql .= " ORDER BY e.start_date ASC";

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}
