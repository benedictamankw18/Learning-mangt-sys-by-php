<?php

namespace App\Repositories;

use PDO;
use App\Utils\UuidHelper;

class SuperadminActivityRepository extends BaseRepository
{
    protected $table = 'superadmin_activity';
    protected $primaryKey = 'activity_id';

    /**
     * Log a new superadmin activity.
     */
    public function create(array $data): int
    {
        $stmt = $this->db->prepare("
            INSERT INTO {$this->table} (
                uuid,
                performed_by,
                activity_type,
                description,
                entity_type,
                entity_id,
                meta,
                ip_address,
                user_agent,
                severity
            ) VALUES (
                :uuid,
                :performed_by,
                :activity_type,
                :description,
                :entity_type,
                :entity_id,
                :meta,
                :ip_address,
                :user_agent,
                :severity
            )
        ");

        $stmt->execute([
            ':uuid'          => UuidHelper::generate(),
            ':performed_by'  => $data['performed_by'],
            ':activity_type' => $data['activity_type'],
            ':description'   => $data['description'],
            ':entity_type'   => $data['entity_type'] ?? null,
            ':entity_id'     => $data['entity_id']   ?? null,
            ':meta'          => $data['meta']         ?? null,
            ':ip_address'    => $data['ip_address']   ?? null,
            ':user_agent'    => $data['user_agent']   ?? null,
            ':severity'      => $data['severity']     ?? 'info',
        ]);

        return (int) $this->db->lastInsertId();
    }

    /**
     * Retrieve activities with optional filters, joined with performer info.
     *
     * Supported filters: performed_by, activity_type, entity_type, entity_id,
     *                    severity, start_date, end_date
     */
    public function getAll(array $filters = [], int $limit = 50, int $offset = 0): array
    {
        $sql = "SELECT sa.*,
                    CONCAT(u.first_name, ' ', u.last_name) AS performer_name,
                    u.email AS performer_email
                FROM {$this->table} sa
                LEFT JOIN users u ON sa.performed_by = u.user_id
                WHERE 1=1";
        $params = [];

        if (!empty($filters['performed_by'])) {
            $sql .= " AND sa.performed_by = :performed_by";
            $params[':performed_by'] = (int) $filters['performed_by'];
        }

        if (!empty($filters['activity_type'])) {
            $sql .= " AND sa.activity_type = :activity_type";
            $params[':activity_type'] = $filters['activity_type'];
        }

        if (!empty($filters['entity_type'])) {
            $sql .= " AND sa.entity_type = :entity_type";
            $params[':entity_type'] = $filters['entity_type'];
        }

        if (!empty($filters['entity_id'])) {
            $sql .= " AND sa.entity_id = :entity_id";
            $params[':entity_id'] = (int) $filters['entity_id'];
        }

        if (!empty($filters['severity'])) {
            $sql .= " AND sa.severity = :severity";
            $params[':severity'] = $filters['severity'];
        }

        if (!empty($filters['start_date'])) {
            $sql .= " AND sa.created_at >= :start_date";
            $params[':start_date'] = $filters['start_date'];
        }

        if (!empty($filters['end_date'])) {
            $sql .= " AND sa.created_at <= :end_date";
            $params[':end_date'] = $filters['end_date'] . ' 23:59:59';
        }

        $sql .= " ORDER BY sa.created_at DESC LIMIT :limit OFFSET :offset";

        $stmt = $this->db->prepare($sql);
        foreach ($params as $key => $value) {
            $stmt->bindValue($key, $value);
        }
        $stmt->bindValue(':limit',  $limit,  PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Count activities matching the same filters as getAll().
     */
    public function count(array $filters = []): int
    {
        $sql = "SELECT COUNT(*) AS total FROM {$this->table} WHERE 1=1";
        $params = [];

        if (!empty($filters['performed_by'])) {
            $sql .= " AND performed_by = :performed_by";
            $params[':performed_by'] = (int) $filters['performed_by'];
        }

        if (!empty($filters['activity_type'])) {
            $sql .= " AND activity_type = :activity_type";
            $params[':activity_type'] = $filters['activity_type'];
        }

        if (!empty($filters['entity_type'])) {
            $sql .= " AND entity_type = :entity_type";
            $params[':entity_type'] = $filters['entity_type'];
        }

        if (!empty($filters['entity_id'])) {
            $sql .= " AND entity_id = :entity_id";
            $params[':entity_id'] = (int) $filters['entity_id'];
        }

        if (!empty($filters['severity'])) {
            $sql .= " AND severity = :severity";
            $params[':severity'] = $filters['severity'];
        }

        if (!empty($filters['start_date'])) {
            $sql .= " AND created_at >= :start_date";
            $params[':start_date'] = $filters['start_date'];
        }

        if (!empty($filters['end_date'])) {
            $sql .= " AND created_at <= :end_date";
            $params[':end_date'] = $filters['end_date'] . ' 23:59:59';
        }

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);

        return (int) $stmt->fetch(PDO::FETCH_ASSOC)['total'];
    }

    /**
     * Fetch the most recent N activities with performer info (for dashboard feed).
     */
    public function getRecent(int $limit = 10): array
    {
        $stmt = $this->db->prepare("
            SELECT sa.*,
                CONCAT(u.first_name, ' ', u.last_name) AS performer_name,
                u.email AS performer_email
            FROM {$this->table} sa
            LEFT JOIN users u ON sa.performed_by = u.user_id
            ORDER BY sa.created_at DESC
            LIMIT :limit
        ");
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Fetch activities for a specific performer (superadmin user).
     */
    public function getByPerformer(int $userId, int $limit = 50, int $offset = 0): array
    {
        $stmt = $this->db->prepare("
            SELECT * FROM {$this->table}
            WHERE performed_by = :performed_by
            ORDER BY created_at DESC
            LIMIT :limit OFFSET :offset
        ");
        $stmt->bindValue(':performed_by', $userId, PDO::PARAM_INT);
        $stmt->bindValue(':limit',        $limit,  PDO::PARAM_INT);
        $stmt->bindValue(':offset',       $offset, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Fetch activities by type (e.g. 'institution_created', 'backup').
     */
    public function getByType(string $type, int $limit = 50, int $offset = 0): array
    {
        $stmt = $this->db->prepare("
            SELECT sa.*,
                CONCAT(u.first_name, ' ', u.last_name) AS performer_name
            FROM {$this->table} sa
            LEFT JOIN users u ON sa.performed_by = u.user_id
            WHERE sa.activity_type = :activity_type
            ORDER BY sa.created_at DESC
            LIMIT :limit OFFSET :offset
        ");
        $stmt->bindValue(':activity_type', $type);
        $stmt->bindValue(':limit',         $limit,  PDO::PARAM_INT);
        $stmt->bindValue(':offset',        $offset, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Fetch activities by severity level ('info', 'warning', 'critical').
     */
    public function getBySeverity(string $severity, int $limit = 50, int $offset = 0): array
    {
        $allowed = ['info', 'warning', 'critical'];
        if (!in_array($severity, $allowed, true)) {
            return [];
        }

        $stmt = $this->db->prepare("
            SELECT sa.*,
                CONCAT(u.first_name, ' ', u.last_name) AS performer_name
            FROM {$this->table} sa
            LEFT JOIN users u ON sa.performed_by = u.user_id
            WHERE sa.severity = :severity
            ORDER BY sa.created_at DESC
            LIMIT :limit OFFSET :offset
        ");
        $stmt->bindValue(':severity', $severity);
        $stmt->bindValue(':limit',    $limit,  PDO::PARAM_INT);
        $stmt->bindValue(':offset',   $offset, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Aggregate counts grouped by activity_type and severity — used for dashboard stats.
     *
     * Returns:
     *   [
     *     'by_type'     => [ ['activity_type' => '...', 'total' => N], ... ],
     *     'by_severity' => [ 'info' => N, 'warning' => N, 'critical' => N ],
     *     'total'       => N,
     *   ]
     */
    public function getStats(): array
    {
        $byType = $this->db->query("
            SELECT activity_type, COUNT(*) AS total
            FROM {$this->table}
            GROUP BY activity_type
            ORDER BY total DESC
        ")->fetchAll(PDO::FETCH_ASSOC);

        $severityRows = $this->db->query("
            SELECT severity, COUNT(*) AS total
            FROM {$this->table}
            GROUP BY severity
        ")->fetchAll(PDO::FETCH_ASSOC);

        $bySeverity = ['info' => 0, 'warning' => 0, 'critical' => 0];
        foreach ($severityRows as $row) {
            $bySeverity[$row['severity']] = (int) $row['total'];
        }

        $total = array_sum($bySeverity);

        return [
            'by_type'     => $byType,
            'by_severity' => $bySeverity,
            'total'       => $total,
        ];
    }

    /**
     * Delete activity records older than a given number of days.
     * Returns the number of rows deleted.
     */
    public function deleteOlderThan(int $days): int
    {
        $stmt = $this->db->prepare("
            DELETE FROM {$this->table}
            WHERE created_at < DATE_SUB(NOW(), INTERVAL :days DAY)
        ");
        $stmt->bindValue(':days', $days, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->rowCount();
    }
}
