<?php

namespace App\Repositories;

use PDO;
use App\Utils\UuidHelper;

class StudentActivityRepository extends BaseRepository
{
    protected $table = 'student_activity';
    protected $primaryKey = 'activity_id';

    /**
     * Log a new student activity.
     */
    public function create(array $data): int
    {
        $stmt = $this->db->prepare("
            INSERT INTO {$this->table} (
                uuid,
                institution_id,
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
                :institution_id,
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
            ':uuid'           => UuidHelper::generate(),
            ':institution_id' => $data['institution_id'],
            ':performed_by'   => $data['performed_by'],
            ':activity_type'  => $data['activity_type'],
            ':description'    => $data['description'],
            ':entity_type'    => $data['entity_type'] ?? null,
            ':entity_id'      => $data['entity_id']   ?? null,
            ':meta'           => $data['meta']         ?? null,
            ':ip_address'     => $data['ip_address']   ?? null,
            ':user_agent'     => $data['user_agent']   ?? null,
            ':severity'       => $data['severity']     ?? 'info',
        ]);

        return (int) $this->db->lastInsertId();
    }

    /**
     * Retrieve activities for an institution with optional filters.
     *
     * Supported filters: performed_by, activity_type, entity_type, entity_id,
     *                    severity, start_date, end_date
     */
    public function getAllByInstitution(int $institutionId, array $filters = [], int $limit = 50, int $offset = 0): array
    {
        $sql = "SELECT sa.*,
                    CONCAT(u.first_name, ' ', u.last_name) AS performer_name,
                    u.email AS performer_email
                FROM {$this->table} sa
                LEFT JOIN users u ON sa.performed_by = u.user_id
                WHERE sa.institution_id = :institution_id";
        $params = [':institution_id' => $institutionId];

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
     * Count activities for an institution matching the same filters as getAll().
     */
    public function countByInstitution(int $institutionId, array $filters = []): int
    {
        $sql = "SELECT COUNT(*) AS total FROM {$this->table}
                WHERE institution_id = :institution_id";
        $params = [':institution_id' => $institutionId];

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
     * Fetch the most recent N activities for an institution (for dashboard feed).
     */
    public function getRecent(int $institutionId, int $limit = 10): array
    {
        $stmt = $this->db->prepare("
            SELECT sa.*,
                CONCAT(u.first_name, ' ', u.last_name) AS performer_name,
                u.email AS performer_email
            FROM {$this->table} sa
            LEFT JOIN users u ON sa.performed_by = u.user_id
            WHERE sa.institution_id = :institution_id
            ORDER BY sa.created_at DESC
            LIMIT :limit
        ");
        $stmt->bindValue(':institution_id', $institutionId, PDO::PARAM_INT);
        $stmt->bindValue(':limit',          $limit,         PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Fetch activities for a specific performer within an institution.
     */
    public function getByPerformer(int $institutionId, int $userId, int $limit = 50, int $offset = 0): array
    {
        $stmt = $this->db->prepare("
            SELECT * FROM {$this->table}
            WHERE institution_id = :institution_id
              AND performed_by = :performed_by
            ORDER BY created_at DESC
            LIMIT :limit OFFSET :offset
        ");
        $stmt->bindValue(':institution_id', $institutionId, PDO::PARAM_INT);
        $stmt->bindValue(':performed_by',   $userId,        PDO::PARAM_INT);
        $stmt->bindValue(':limit',          $limit,         PDO::PARAM_INT);
        $stmt->bindValue(':offset',         $offset,        PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Fetch activities by type within an institution.
     */
    public function getByType(int $institutionId, string $type, int $limit = 50, int $offset = 0): array
    {
        $stmt = $this->db->prepare("
            SELECT sa.*,
                CONCAT(u.first_name, ' ', u.last_name) AS performer_name
            FROM {$this->table} sa
            LEFT JOIN users u ON sa.performed_by = u.user_id
            WHERE sa.institution_id = :institution_id
              AND sa.activity_type = :activity_type
            ORDER BY sa.created_at DESC
            LIMIT :limit OFFSET :offset
        ");
        $stmt->bindValue(':institution_id', $institutionId, PDO::PARAM_INT);
        $stmt->bindValue(':activity_type',  $type);
        $stmt->bindValue(':limit',          $limit,  PDO::PARAM_INT);
        $stmt->bindValue(':offset',         $offset, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Fetch activities by severity within an institution.
     */
    public function getBySeverity(int $institutionId, string $severity, int $limit = 50, int $offset = 0): array
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
            WHERE sa.institution_id = :institution_id
              AND sa.severity = :severity
            ORDER BY sa.created_at DESC
            LIMIT :limit OFFSET :offset
        ");
        $stmt->bindValue(':institution_id', $institutionId, PDO::PARAM_INT);
        $stmt->bindValue(':severity',       $severity);
        $stmt->bindValue(':limit',          $limit,  PDO::PARAM_INT);
        $stmt->bindValue(':offset',         $offset, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Aggregate counts grouped by activity_type and severity for an institution.
     *
     * Returns:
     *   [
     *     'by_type'     => [ ['activity_type' => '...', 'total' => N], ... ],
     *     'by_severity' => [ 'info' => N, 'warning' => N, 'critical' => N ],
     *     'total'       => N,
     *   ]
     */
    public function getStats(int $institutionId): array
    {
        $stmt = $this->db->prepare("
            SELECT activity_type, COUNT(*) AS total
            FROM {$this->table}
            WHERE institution_id = :institution_id
            GROUP BY activity_type
            ORDER BY total DESC
        ");
        $stmt->bindValue(':institution_id', $institutionId, PDO::PARAM_INT);
        $stmt->execute();
        $byType = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $stmt2 = $this->db->prepare("
            SELECT severity, COUNT(*) AS total
            FROM {$this->table}
            WHERE institution_id = :institution_id
            GROUP BY severity
        ");
        $stmt2->bindValue(':institution_id', $institutionId, PDO::PARAM_INT);
        $stmt2->execute();
        $severityRows = $stmt2->fetchAll(PDO::FETCH_ASSOC);

        $bySeverity = ['info' => 0, 'warning' => 0, 'critical' => 0];
        foreach ($severityRows as $row) {
            $bySeverity[$row['severity']] = (int) $row['total'];
        }

        return [
            'by_type'     => $byType,
            'by_severity' => $bySeverity,
            'total'       => array_sum($bySeverity),
        ];
    }

    /**
     * Delete activity records older than a given number of days for an institution.
     * Returns the number of rows deleted.
     */
    public function deleteOlderThan(int $institutionId, int $days): int
    {
        $stmt = $this->db->prepare("
            DELETE FROM {$this->table}
            WHERE institution_id = :institution_id
              AND created_at < DATE_SUB(NOW(), INTERVAL :days DAY)
        ");
        $stmt->bindValue(':institution_id', $institutionId, PDO::PARAM_INT);
        $stmt->bindValue(':days',           $days,          PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->rowCount();
    }
}


