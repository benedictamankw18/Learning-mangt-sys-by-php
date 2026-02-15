<?php

namespace App\Repositories;

use App\Config\Database;
use PDO;

class ErrorLogRepository
{
    private $db;

    public function __construct()
    {
        $this->db = Database::getInstance()->getConnection();
    }

    /**
     * Get all error logs
     */
    public function getAll(int $page = 1, int $limit = 20, array $filters = []): array
    {
        try {
            $offset = ($page - 1) * $limit;

            $where = [];
            $params = [];

            if (isset($filters['severity_level'])) {
                $where[] = "el.severity_level = :severity_level";
                $params['severity_level'] = $filters['severity_level'];
            }

            if (isset($filters['is_resolved'])) {
                $where[] = "el.is_resolved = :is_resolved";
                $params['is_resolved'] = $filters['is_resolved'];
            }

            if (isset($filters['source'])) {
                $where[] = "el.source LIKE :source";
                $params['source'] = "%{$filters['source']}%";
            }

            if (isset($filters['from_date'])) {
                $where[] = "el.created_at >= :from_date";
                $params['from_date'] = $filters['from_date'];
            }

            if (isset($filters['to_date'])) {
                $where[] = "el.created_at <= :to_date";
                $params['to_date'] = $filters['to_date'];
            }

            $whereClause = !empty($where) ? "WHERE " . implode(" AND ", $where) : "";

            $stmt = $this->db->prepare("
                SELECT 
                    el.*,
                    CONCAT(u.first_name, ' ', u.last_name) as user_name,
                    u.email as user_email,
                    CONCAT(resolver.first_name, ' ', resolver.last_name) as resolved_by_name
                FROM error_logs el
                LEFT JOIN users u ON el.user_id = u.user_id
                LEFT JOIN users resolver ON el.resolved_by = resolver.user_id
                $whereClause
                ORDER BY el.created_at DESC
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
            error_log("Get All Error Logs Error: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Count error logs
     */
    public function count(array $filters = []): int
    {
        try {
            $where = [];
            $params = [];

            if (isset($filters['severity_level'])) {
                $where[] = "severity_level = :severity_level";
                $params['severity_level'] = $filters['severity_level'];
            }

            if (isset($filters['is_resolved'])) {
                $where[] = "is_resolved = :is_resolved";
                $params['is_resolved'] = $filters['is_resolved'];
            }

            if (isset($filters['source'])) {
                $where[] = "source LIKE :source";
                $params['source'] = "%{$filters['source']}%";
            }

            if (isset($filters['from_date'])) {
                $where[] = "created_at >= :from_date";
                $params['from_date'] = $filters['from_date'];
            }

            if (isset($filters['to_date'])) {
                $where[] = "created_at <= :to_date";
                $params['to_date'] = $filters['to_date'];
            }

            $whereClause = !empty($where) ? "WHERE " . implode(" AND ", $where) : "";

            $stmt = $this->db->prepare("SELECT COUNT(*) as total FROM error_logs $whereClause");

            foreach ($params as $key => $value) {
                $stmt->bindValue(":$key", $value);
            }

            $stmt->execute();
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            return (int) $result['total'];
        } catch (\PDOException $e) {
            error_log("Count Error Logs Error: " . $e->getMessage());
            return 0;
        }
    }

    /**
     * Find error log by ID
     */
    public function findById(int $id): ?array
    {
        try {
            $stmt = $this->db->prepare("
                SELECT 
                    el.*,
                    CONCAT(u.first_name, ' ', u.last_name) as user_name,
                    u.email as user_email,
                    CONCAT(resolver.first_name, ' ', resolver.last_name) as resolved_by_name
                FROM error_logs el
                LEFT JOIN users u ON el.user_id = u.user_id
                LEFT JOIN users resolver ON el.resolved_by = resolver.user_id
                WHERE el.error_log_id = :id
            ");
            $stmt->execute(['id' => $id]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            return $result ?: null;
        } catch (\PDOException $e) {
            error_log("Find Error Log Error: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Create error log
     */
    public function create(array $data): int
    {
        try {
            $stmt = $this->db->prepare("
                INSERT INTO error_logs (
                    error_message, stack_trace, source, 
                    severity_level, user_id, ip_address
                )
                VALUES (
                    :error_message, :stack_trace, :source,
                    :severity_level, :user_id, :ip_address
                )
            ");
            $stmt->execute([
                'error_message' => $data['error_message'],
                'stack_trace' => $data['stack_trace'] ?? null,
                'source' => $data['source'] ?? null,
                'severity_level' => $data['severity_level'] ?? 'error',
                'user_id' => $data['user_id'] ?? null,
                'ip_address' => $data['ip_address'] ?? null
            ]);
            return (int) $this->db->lastInsertId();
        } catch (\PDOException $e) {
            error_log("Create Error Log Error: " . $e->getMessage());
            return 0;
        }
    }

    /**
     * Mark error as resolved
     */
    public function markResolved(int $id, int $resolvedBy): bool
    {
        try {
            $stmt = $this->db->prepare("
                UPDATE error_logs 
                SET is_resolved = 1, resolved_by = :resolved_by, resolved_at = NOW()
                WHERE error_log_id = :id
            ");
            return $stmt->execute([
                'id' => $id,
                'resolved_by' => $resolvedBy
            ]);
        } catch (\PDOException $e) {
            error_log("Mark Error Resolved Error: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Delete error log
     */
    public function delete(int $id): bool
    {
        try {
            $stmt = $this->db->prepare("DELETE FROM error_logs WHERE error_log_id = :id");
            return $stmt->execute(['id' => $id]);
        } catch (\PDOException $e) {
            error_log("Delete Error Log Error: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Get unresolved errors
     */
    public function getUnresolved(int $page = 1, int $limit = 20): array
    {
        try {
            $offset = ($page - 1) * $limit;
            $stmt = $this->db->prepare("
                SELECT 
                    el.*,
                    CONCAT(u.first_name, ' ', u.last_name) as user_name,
                    u.email as user_email
                FROM error_logs el
                LEFT JOIN users u ON el.user_id = u.user_id
                WHERE el.is_resolved = 0
                ORDER BY el.created_at DESC
                LIMIT :limit OFFSET :offset
            ");
            $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
            $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
            $stmt->execute();
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (\PDOException $e) {
            error_log("Get Unresolved Errors Error: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Count unresolved errors
     */
    public function countUnresolved(): int
    {
        try {
            $stmt = $this->db->query("SELECT COUNT(*) as total FROM error_logs WHERE is_resolved = 0");
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            return (int) $result['total'];
        } catch (\PDOException $e) {
            error_log("Count Unresolved Errors Error: " . $e->getMessage());
            return 0;
        }
    }

    /**
     * Get errors by severity
     */
    public function getBySeverity(string $severity, int $page = 1, int $limit = 20): array
    {
        try {
            $offset = ($page - 1) * $limit;
            $stmt = $this->db->prepare("
                SELECT 
                    el.*,
                    CONCAT(u.first_name, ' ', u.last_name) as user_name,
                    u.email as user_email
                FROM error_logs el
                LEFT JOIN users u ON el.user_id = u.user_id
                WHERE el.severity_level = :severity
                ORDER BY el.created_at DESC
                LIMIT :limit OFFSET :offset
            ");
            $stmt->bindValue(':severity', $severity, PDO::PARAM_STR);
            $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
            $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
            $stmt->execute();
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (\PDOException $e) {
            error_log("Get Errors By Severity Error: " . $e->getMessage());
            return [];
        }
    }
}
