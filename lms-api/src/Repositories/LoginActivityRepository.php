<?php

namespace App\Repositories;

use App\Config\Database;
use PDO;

class LoginActivityRepository
{
    private $db;

    public function __construct()
    {
        $this->db = Database::getInstance()->getConnection();
    }

    /**
     * Get all login activities (Admin only)
     */
    public function getAll(int $page = 1, int $limit = 20, array $filters = []): array
    {
        try {
            $offset = ($page - 1) * $limit;

            $where = [];
            $params = [];

            if (isset($filters['user_id'])) {
                $where[] = "la.user_id = :user_id";
                $params['user_id'] = $filters['user_id'];
            }

            if (isset($filters['is_successful'])) {
                $where[] = "la.is_successful = :is_successful";
                $params['is_successful'] = $filters['is_successful'];
            }

            if (isset($filters['from_date'])) {
                $where[] = "la.login_time >= :from_date";
                $params['from_date'] = $filters['from_date'];
            }

            if (isset($filters['to_date'])) {
                $where[] = "la.login_time <= :to_date";
                $params['to_date'] = $filters['to_date'];
            }

            $whereClause = !empty($where) ? "WHERE " . implode(" AND ", $where) : "";

            $stmt = $this->db->prepare("
                SELECT 
                    la.*,
                    CONCAT(u.first_name, ' ', u.last_name) as user_name,
                    u.email,
                    u.username,
                    i.institution_name
                FROM login_activity la
                LEFT JOIN users u ON la.user_id = u.user_id
                LEFT JOIN institutions i ON u.institution_id = i.institution_id
                $whereClause
                ORDER BY la.login_time DESC
                LIMIT :limit OFFSET :offset
            ");

            foreach ($params as $key => $value) {
                $stmt->bindValue(":$key", $value);
            }
            $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
            $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);

            $stmt->execute();
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (\PDOException $e) {
            error_log("Get All Login Activity Error: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Count all login activities
     */
    public function count(array $filters = []): int
    {
        try {
            $where = [];
            $params = [];

            if (isset($filters['user_id'])) {
                $where[] = "user_id = :user_id";
                $params['user_id'] = $filters['user_id'];
            }

            if (isset($filters['is_successful'])) {
                $where[] = "is_successful = :is_successful";
                $params['is_successful'] = $filters['is_successful'];
            }

            if (isset($filters['from_date'])) {
                $where[] = "login_time >= :from_date";
                $params['from_date'] = $filters['from_date'];
            }

            if (isset($filters['to_date'])) {
                $where[] = "login_time <= :to_date";
                $params['to_date'] = $filters['to_date'];
            }

            $whereClause = !empty($where) ? "WHERE " . implode(" AND ", $where) : "";

            $stmt = $this->db->prepare("SELECT COUNT(*) as total FROM login_activity $whereClause");

            foreach ($params as $key => $value) {
                $stmt->bindValue(":$key", $value);
            }

            $stmt->execute();
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            return (int) $result['total'];
        } catch (\PDOException $e) {
            error_log("Count Login Activity Error: " . $e->getMessage());
            return 0;
        }
    }

    /**
     * Get user's login history
     */
    public function getUserLoginHistory(int $userId, int $page = 1, int $limit = 20): array
    {
        try {
            $offset = ($page - 1) * $limit;
            $stmt = $this->db->prepare("
                SELECT *
                FROM login_activity
                WHERE user_id = :user_id
                ORDER BY login_time DESC
                LIMIT :limit OFFSET :offset
            ");
            $stmt->bindValue(':user_id', $userId, PDO::PARAM_INT);
            $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
            $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
            $stmt->execute();
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (\PDOException $e) {
            error_log("Get User Login History Error: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Count user's login activities
     */
    public function countUserLoginActivity(int $userId): int
    {
        try {
            $stmt = $this->db->prepare("
                SELECT COUNT(*) as total 
                FROM login_activity 
                WHERE user_id = :user_id
            ");
            $stmt->execute(['user_id' => $userId]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            return (int) $result['total'];
        } catch (\PDOException $e) {
            error_log("Count User Login Activity Error: " . $e->getMessage());
            return 0;
        }
    }

    /**
     * Get recent logins
     */
    public function getRecentLogins(int $userId, int $limit = 5): array
    {
        try {
            $stmt = $this->db->prepare("
                SELECT *
                FROM login_activity
                WHERE user_id = :user_id
                ORDER BY login_time DESC
                LIMIT :limit
            ");
            $stmt->bindValue(':user_id', $userId, PDO::PARAM_INT);
            $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
            $stmt->execute();
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (\PDOException $e) {
            error_log("Get Recent Logins Error: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Get failed login attempts
     */
    public function getFailedAttempts(?int $userId = null, int $hours = 24): array
    {
        try {
            $sql = "
                SELECT 
                    la.*,
                    CONCAT(u.first_name, ' ', u.last_name) as user_name,
                    u.email,
                    u.username
                FROM login_activity la
                LEFT JOIN users u ON la.user_id = u.user_id
                WHERE la.is_successful = 0 
                AND la.login_time >= DATE_SUB(NOW(), INTERVAL :hours HOUR)
            ";

            if ($userId !== null) {
                $sql .= " AND la.user_id = :user_id";
            }

            $sql .= " ORDER BY la.login_time DESC";

            $stmt = $this->db->prepare($sql);
            $stmt->bindValue(':hours', $hours, PDO::PARAM_INT);

            if ($userId !== null) {
                $stmt->bindValue(':user_id', $userId, PDO::PARAM_INT);
            }

            $stmt->execute();
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (\PDOException $e) {
            error_log("Get Failed Attempts Error: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Create login activity record
     */
    public function create(array $data): int
    {
        try {
            $stmt = $this->db->prepare("
                INSERT INTO login_activity (
                    user_id, login_time, ip_address, 
                    user_agent, is_successful, failure_reason
                )
                VALUES (
                    :user_id, :login_time, :ip_address,
                    :user_agent, :is_successful, :failure_reason
                )
            ");
            $stmt->execute([
                'user_id' => $data['user_id'] ?? null,
                'login_time' => $data['login_time'] ?? date('Y-m-d H:i:s'),
                'ip_address' => $data['ip_address'] ?? null,
                'user_agent' => $data['user_agent'] ?? null,
                'is_successful' => $data['is_successful'] ?? 1,
                'failure_reason' => $data['failure_reason'] ?? null
            ]);
            return (int) $this->db->lastInsertId();
        } catch (\PDOException $e) {
            error_log("Create Login Activity Error: " . $e->getMessage());
            return 0;
        }
    }

    /**
     * Log login attempt (legacy method)
     */
    public function logLogin(array $data): int
    {
        try {
            $stmt = $this->db->prepare("
                INSERT INTO login_activity (
                    user_id, ip_address, user_agent, 
                    is_successful, failure_reason
                )
                VALUES (
                    :user_id, :ip_address, :user_agent,
                    :is_successful, :failure_reason
                )
            ");
            $stmt->execute([
                'user_id' => $data['user_id'] ?? null,
                'ip_address' => $data['ip_address'] ?? null,
                'user_agent' => $data['user_agent'] ?? null,
                'is_successful' => $data['is_successful'] ?? 1,
                'failure_reason' => $data['failure_reason'] ?? null
            ]);
            return (int) $this->db->lastInsertId();
        } catch (\PDOException $e) {
            error_log("Log Login Error: " . $e->getMessage());
            return 0;
        }
    }

    /**
     * Log logout
     */
    public function logLogout(int $userId): bool
    {
        try {
            $stmt = $this->db->prepare("
                UPDATE login_activity 
                SET logout_time = NOW()
                WHERE user_id = :user_id 
                AND logout_time IS NULL
                ORDER BY login_time DESC
                LIMIT 1
            ");
            return $stmt->execute(['user_id' => $userId]);
        } catch (\PDOException $e) {
            error_log("Log Logout Error: " . $e->getMessage());
            return false;
        }
    }
}
