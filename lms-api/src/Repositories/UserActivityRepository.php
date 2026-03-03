<?php

namespace App\Repositories;

use PDO;

class UserActivityRepository extends BaseRepository
{
    protected $table = 'user_activity';
    protected $primaryKey = 'activity_id';

    /**
     * Override create to match user_activity schema (no UUID field)
     */
    public function create(array $data): int
    {
        $stmt = $this->db->prepare("
            INSERT INTO {$this->table} (
                user_id,
                activity_type,
                activity_details,
                ip_address,
                user_agent
            ) VALUES (
                :user_id,
                :activity_type,
                :activity_details,
                :ip_address,
                :user_agent
            )
        ");

        $stmt->execute([
            'user_id' => $data['user_id'],
            'activity_type' => $data['activity_type'],
            'activity_details' => $data['activity_details'] ?? null,
            'ip_address' => $data['ip_address'] ?? null,
            'user_agent' => $data['user_agent'] ?? null
        ]);

        return (int) $this->db->lastInsertId();
    }

    public function getAll(array $filters = [], int $limit = 50, int $offset = 0): array
    {
        $sql = "SELECT ua.*, 
                CONCAT(u.first_name, ' ', u.last_name) as user_name,
                u.email,
                r.role_name
                FROM {$this->table} ua
                LEFT JOIN users u ON ua.user_id = u.user_id
                LEFT JOIN user_roles ur ON u.user_id = ur.user_id
                LEFT JOIN roles r ON ur.role_id = r.role_id
                WHERE 1=1";
        $params = [];

        if (!empty($filters['user_id'])) {
            $sql .= " AND ua.user_id = :user_id";
            $params[':user_id'] = $filters['user_id'];
        }

        if (!empty($filters['action'])) {
            $sql .= " AND ua.action = :action";
            $params[':action'] = $filters['action'];
        }

        if (!empty($filters['start_date'])) {
            $sql .= " AND ua.created_at >= :start_date";
            $params[':start_date'] = $filters['start_date'];
        }

        if (!empty($filters['end_date'])) {
            $sql .= " AND ua.created_at <= :end_date";
            $params[':end_date'] = $filters['end_date'] . ' 23:59:59';
        }

        if (!empty($filters['institution_id'])) {
            $sql .= " AND ua.institution_id = :institution_id";
            $params[':institution_id'] = $filters['institution_id'];
        }

        $sql .= " ORDER BY ua.created_at DESC LIMIT :limit OFFSET :offset";
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

        if (!empty($filters['user_id'])) {
            $sql .= " AND user_id = :user_id";
            $params[':user_id'] = $filters['user_id'];
        }

        if (!empty($filters['action'])) {
            $sql .= " AND action = :action";
            $params[':action'] = $filters['action'];
        }

        if (!empty($filters['start_date'])) {
            $sql .= " AND created_at >= :start_date";
            $params[':start_date'] = $filters['start_date'];
        }

        if (!empty($filters['end_date'])) {
            $sql .= " AND created_at <= :end_date";
            $params[':end_date'] = $filters['end_date'] . ' 23:59:59';
        }

        if (!empty($filters['institution_id'])) {
            $sql .= " AND institution_id = :institution_id";
            $params[':institution_id'] = $filters['institution_id'];
        }

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);

        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return $result['total'];
    }

    public function getUserHistory($userId, $limit = 100, $offset = 0)
    {
        $sql = "SELECT * FROM {$this->table} 
                WHERE user_id = :user_id 
                ORDER BY created_at DESC 
                LIMIT :limit OFFSET :offset";

        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(':user_id', $userId, PDO::PARAM_INT);
        $stmt->bindValue(':limit', (int) $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', (int) $offset, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getRecent($institutionId = null, $limit = 50)
    {
        $sql = "SELECT ua.*, 
                CONCAT(u.first_name, ' ', u.last_name) as user_name,
                u.email
                FROM {$this->table} ua
                LEFT JOIN users u ON ua.user_id = u.user_id
                WHERE 1=1";
        $params = [];

        if ($institutionId) {
            $sql .= " AND ua.institution_id = :institution_id";
            $params[':institution_id'] = $institutionId;
        }

        $sql .= " ORDER BY ua.created_at DESC LIMIT :limit";
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

    public function getByAction($action, $institutionId = null, $limit = 100)
    {
        $sql = "SELECT ua.*, 
                CONCAT(u.first_name, ' ', u.last_name) as user_name,
                u.email
                FROM {$this->table} ua
                LEFT JOIN users u ON ua.user_id = u.user_id
                WHERE ua.action = :action";
        $params = [':action' => $action];

        if ($institutionId) {
            $sql .= " AND ua.institution_id = :institution_id";
            $params[':institution_id'] = $institutionId;
        }

        $sql .= " ORDER BY ua.created_at DESC LIMIT :limit";
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

    public function getStatistics($institutionId = null, $startDate = null, $endDate = null)
    {
        // Get stats by action
        $sql = "SELECT 
                ua.activity_type,
                COUNT(*) as action_count
                FROM {$this->table} ua";

        $joins = [];
        $conditions = ["1=1"];
        $params = [];

        if ($institutionId) {
            $joins[] = "JOIN users u ON ua.user_id = u.user_id";
            $conditions[] = "u.institution_id = :institution_id";
            $params[':institution_id'] = $institutionId;
        }

        if ($startDate) {
            $conditions[] = "ua.created_at >= :start_date";
            $params[':start_date'] = $startDate;
        }

        if ($endDate) {
            $conditions[] = "ua.created_at <= :end_date";
            $params[':end_date'] = $endDate . ' 23:59:59';
        }

        if (!empty($joins)) {
            $sql .= " " . implode(" ", array_unique($joins));
        }

        $sql .= " WHERE " . implode(" AND ", $conditions);
        $sql .= " GROUP BY ua.activity_type ORDER BY action_count DESC";

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);

        $actions = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Get overall stats
        $overallSql = "SELECT 
                      COUNT(*) as total_activities,
                      COUNT(DISTINCT ua.user_id) as unique_users,
                      COUNT(DISTINCT DATE(ua.created_at)) as active_days
                      FROM {$this->table} ua";

        $overallJoins = [];
        $overallConditions = ["1=1"];
        $overallParams = [];

        if ($institutionId) {
            $overallJoins[] = "JOIN users u ON ua.user_id = u.user_id";
            $overallConditions[] = "u.institution_id = :institution_id";
            $overallParams[':institution_id'] = $institutionId;
        }

        if ($startDate) {
            $overallConditions[] = "ua.created_at >= :start_date";
            $overallParams[':start_date'] = $startDate;
        }

        if ($endDate) {
            $overallConditions[] = "ua.created_at <= :end_date";
            $overallParams[':end_date'] = $endDate . ' 23:59:59';
        }

        if (!empty($overallJoins)) {
            $overallSql .= " " . implode(" ", array_unique($overallJoins));
        }

        $overallSql .= " WHERE " . implode(" AND ", $overallConditions);

        $overallStmt = $this->db->prepare($overallSql);
        $overallStmt->execute($overallParams);
        $overall = $overallStmt->fetch(PDO::FETCH_ASSOC);

        return [
            'overall' => $overall,
            'by_action' => $actions
        ];
    }

    public function getByEntity($entityType, $entityId, $limit = 50)
    {
        $sql = "SELECT ua.*, 
                CONCAT(u.first_name, ' ', u.last_name) as user_name,
                u.email
                FROM {$this->table} ua
                LEFT JOIN users u ON ua.user_id = u.user_id
                WHERE ua.entity_type = :entity_type 
                AND ua.entity_id = :entity_id
                ORDER BY ua.created_at DESC 
                LIMIT :limit";

        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(':entity_type', $entityType);
        $stmt->bindValue(':entity_id', $entityId, PDO::PARAM_INT);
        $stmt->bindValue(':limit', (int) $limit, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function deleteOlderThan($days)
    {
        $sql = "DELETE FROM {$this->table} 
                WHERE created_at < DATE_SUB(NOW(), INTERVAL :days DAY)";

        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(':days', (int) $days, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->rowCount();
    }

    public function getAuditTrail($startDate, $endDate, $institutionId = null, $action = null)
    {
        $sql = "SELECT ua.*, 
                CONCAT(u.first_name, ' ', u.last_name) as user_name,
                u.email,
                r.role_name
                FROM {$this->table} ua
                LEFT JOIN users u ON ua.user_id = u.user_id
                LEFT JOIN user_roles ur ON u.user_id = ur.user_id
                LEFT JOIN roles r ON ur.role_id = r.role_id
                WHERE ua.created_at >= :start_date 
                AND ua.created_at <= :end_date";
        $params = [
            ':start_date' => $startDate,
            ':end_date' => $endDate . ' 23:59:59'
        ];

        if ($institutionId) {
            $sql .= " AND ua.institution_id = :institution_id";
            $params[':institution_id'] = $institutionId;
        }

        if ($action) {
            $sql .= " AND ua.action = :action";
            $params[':action'] = $action;
        }

        $sql .= " ORDER BY ua.created_at DESC";

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}
