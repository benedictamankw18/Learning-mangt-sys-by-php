<?php

namespace App\Repositories;

use PDO;

class UserActivityRepository extends BaseRepository
{
    protected $table = 'user_activity';

    public function getAll($filters = [], $limit = 50, $offset = 0)
    {
        $sql = "SELECT ua.*, 
                CONCAT(u.first_name, ' ', u.last_name) as user_name,
                u.email,
                r.name as role_name
                FROM {$this->table} ua
                LEFT JOIN users u ON ua.user_id = u.id
                LEFT JOIN user_roles ur ON u.id = ur.user_id
                LEFT JOIN roles r ON ur.role_id = r.id
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
        $params[':limit'] = (int)$limit;
        $params[':offset'] = (int)$offset;

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

    public function count($filters = [])
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
        $stmt->bindValue(':limit', (int)$limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', (int)$offset, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getRecent($institutionId = null, $limit = 50)
    {
        $sql = "SELECT ua.*, 
                CONCAT(u.first_name, ' ', u.last_name) as user_name,
                u.email
                FROM {$this->table} ua
                LEFT JOIN users u ON ua.user_id = u.id
                WHERE 1=1";
        $params = [];

        if ($institutionId) {
            $sql .= " AND ua.institution_id = :institution_id";
            $params[':institution_id'] = $institutionId;
        }

        $sql .= " ORDER BY ua.created_at DESC LIMIT :limit";
        $params[':limit'] = (int)$limit;

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
                LEFT JOIN users u ON ua.user_id = u.id
                WHERE ua.action = :action";
        $params = [':action' => $action];

        if ($institutionId) {
            $sql .= " AND ua.institution_id = :institution_id";
            $params[':institution_id'] = $institutionId;
        }

        $sql .= " ORDER BY ua.created_at DESC LIMIT :limit";
        $params[':limit'] = (int)$limit;

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
        $sql = "SELECT 
                COUNT(*) as total_activities,
                COUNT(DISTINCT user_id) as unique_users,
                COUNT(DISTINCT DATE(created_at)) as active_days,
                action,
                COUNT(*) as action_count
                FROM {$this->table}
                WHERE 1=1";
        $params = [];

        if ($institutionId) {
            $sql .= " AND institution_id = :institution_id";
            $params[':institution_id'] = $institutionId;
        }

        if ($startDate) {
            $sql .= " AND created_at >= :start_date";
            $params[':start_date'] = $startDate;
        }

        if ($endDate) {
            $sql .= " AND created_at <= :end_date";
            $params[':end_date'] = $endDate . ' 23:59:59';
        }

        $sql .= " GROUP BY action ORDER BY action_count DESC";

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);

        $actions = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Get overall stats
        $overallSql = "SELECT 
                      COUNT(*) as total_activities,
                      COUNT(DISTINCT user_id) as unique_users
                      FROM {$this->table}
                      WHERE 1=1";
        $overallParams = [];

        if ($institutionId) {
            $overallSql .= " AND institution_id = :institution_id";
            $overallParams[':institution_id'] = $institutionId;
        }

        if ($startDate) {
            $overallSql .= " AND created_at >= :start_date";
            $overallParams[':start_date'] = $startDate;
        }

        if ($endDate) {
            $overallSql .= " AND created_at <= :end_date";
            $overallParams[':end_date'] = $endDate . ' 23:59:59';
        }

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
                LEFT JOIN users u ON ua.user_id = u.id
                WHERE ua.entity_type = :entity_type 
                AND ua.entity_id = :entity_id
                ORDER BY ua.created_at DESC 
                LIMIT :limit";

        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(':entity_type', $entityType);
        $stmt->bindValue(':entity_id', $entityId, PDO::PARAM_INT);
        $stmt->bindValue(':limit', (int)$limit, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function deleteOlderThan($days)
    {
        $sql = "DELETE FROM {$this->table} 
                WHERE created_at < DATE_SUB(NOW(), INTERVAL :days DAY)";

        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(':days', (int)$days, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->rowCount();
    }

    public function getAuditTrail($startDate, $endDate, $institutionId = null, $action = null)
    {
        $sql = "SELECT ua.*, 
                CONCAT(u.first_name, ' ', u.last_name) as user_name,
                u.email,
                r.name as role_name
                FROM {$this->table} ua
                LEFT JOIN users u ON ua.user_id = u.id
                LEFT JOIN user_roles ur ON u.id = ur.user_id
                LEFT JOIN roles r ON ur.role_id = r.id
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
