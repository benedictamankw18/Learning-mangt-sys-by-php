<?php

namespace App\Repositories;

use App\Config\Database;
use App\Utils\UuidHelper;
use PDO;

class NotificationRepository
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance()->getConnection();
    }

    /**
     * Get all notifications for an institution with read tracking for a user
     */
    public function getInstitutionNotifications(int $institutionId, int $userId, int $limit = 20, int $offset = 0): array
    {
        $stmt = $this->db->prepare("
            SELECT 
                n.notification_id,
                n.uuid,
                n.title,
                n.message,
                n.target_role,
                n.notification_type,
                n.created_at,
                COALESCE(nr.read_count, 0) AS read_count,
                CASE WHEN my_read.notification_id IS NULL THEN 0 ELSE 1 END AS is_read,
                my_read.read_at
            FROM notifications n
            LEFT JOIN (
                SELECT notification_id, COUNT(*) AS read_count
                FROM notification_reads
                GROUP BY notification_id
            ) nr ON nr.notification_id = n.notification_id
            LEFT JOIN notification_reads my_read
                ON my_read.notification_id = n.notification_id
               AND my_read.user_id = :user_id
            WHERE n.institution_id = :institution_id
            ORDER BY n.created_at DESC
            LIMIT :limit OFFSET :offset
        ");

        $stmt->bindValue(':institution_id', $institutionId, PDO::PARAM_INT);
        $stmt->bindValue(':user_id', $userId, PDO::PARAM_INT);
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Count total notifications for an institution
     */
    public function countInstitutionNotifications(int $institutionId): int
    {
        $stmt = $this->db->prepare("
            SELECT COUNT(*) as total
            FROM notifications
            WHERE institution_id = :institution_id
        ");

        $stmt->bindValue(':institution_id', $institutionId, PDO::PARAM_INT);
        $stmt->execute();

        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return (int) $result['total'];
    }

    /**
     * Get unread notification count for a user in an institution
     */
    public function getUnreadCount(int $institutionId, int $userId): int
    {
        $stmt = $this->db->prepare("
            SELECT COUNT(*) as unread_count
            FROM notifications n
            LEFT JOIN notification_reads nr ON n.notification_id = nr.notification_id AND nr.user_id = :user_id
            WHERE n.institution_id = :institution_id
                AND nr.notification_read_id IS NULL
        ");

        $stmt->bindValue(':institution_id', $institutionId, PDO::PARAM_INT);
        $stmt->bindValue(':user_id', $userId, PDO::PARAM_INT);
        $stmt->execute();

        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return (int) $result['unread_count'];
    }

    /**
     * Find notification by ID
     */
    public function findById(int $id): ?array
    {
        $stmt = $this->db->prepare("
            SELECT 
                notification_id,
                institution_id,
                uuid,
                title,
                message,
                notification_type,
                created_at
            FROM notifications
            WHERE notification_id = :id
        ");

        $stmt->bindValue(':id', $id, PDO::PARAM_INT);
        $stmt->execute();

        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return $result ?: null;
    }

    /**
     * Find notification by UUID with read status for a user
     */
    public function findByUuid(string $uuid, int $userId): ?array
    {
        if (!UuidHelper::isValid($uuid)) {
            return null;
        }

        $stmt = $this->db->prepare("
            SELECT 
                n.notification_id,
                n.uuid,
                n.title,
                n.message,
                n.target_role,
                n.notification_type,
                n.created_at,
                COALESCE(nr.read_count, 0) AS read_count,
                CASE WHEN my_read.notification_id IS NULL THEN 0 ELSE 1 END AS is_read,
                my_read.read_at
            FROM notifications n
            LEFT JOIN (
                SELECT notification_id, COUNT(*) AS read_count
                FROM notification_reads
                GROUP BY notification_id
            ) nr ON nr.notification_id = n.notification_id
            LEFT JOIN notification_reads my_read
                ON my_read.notification_id = n.notification_id
               AND my_read.user_id = :user_id
            WHERE n.uuid = :uuid
        ");

        $stmt->bindValue(':uuid', $uuid);
        $stmt->bindValue(':user_id', $userId, PDO::PARAM_INT);
        $stmt->execute();

        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return $result ?: null;
    }

    /**
     * Create a new institution-scoped notification (not per-user)
     */
    public function create(array $data): int
    {
        if (!isset($data['uuid'])) {
            $data['uuid'] = UuidHelper::generate();
        }

        $senderId = isset($data['sender_id']) ? (int) $data['sender_id'] : 0;
        $institutionId = isset($data['institution_id']) ? (int) $data['institution_id'] : 1;
        $targetRole = $data['target_role'] ?? null;

        $stmt = $this->db->prepare("
            INSERT INTO notifications (
                uuid,
                institution_id,
                sender_id,
                target_role,
                title,
                message,
                notification_type
            ) VALUES (
                :uuid,
                :institution_id,
                :sender_id,
                :target_role,
                :title,
                :message,
                :notification_type
            )
        ");

        $stmt->execute([
            ':uuid' => $data['uuid'],
            ':institution_id' => $institutionId,
            ':sender_id' => $senderId,
            ':target_role' => $targetRole,
            ':title' => $data['title'],
            ':message' => $data['message'],
            ':notification_type' => $data['notification_type'] ?? null
        ]);

        return (int) $this->db->lastInsertId();
    }

    /**
     * Mark a notification as read for a user
     */
    public function markAsRead(int $notificationId, int $userId): bool
    {
        try {
            $this->db->beginTransaction();

            $stmt = $this->db->prepare("
                INSERT IGNORE INTO notification_reads (
                    uuid,
                    notification_id,
                    user_id,
                    read_at
                ) VALUES (
                    :uuid,
                    :notification_id,
                    :user_id,
                    NOW()
                )
            ");
            $stmt->execute([
                'uuid' => UuidHelper::generate(),
                'notification_id' => $notificationId,
                'user_id' => $userId,
            ]);

            $this->db->commit();
            return true;
        } catch (\PDOException $e) {
            if ($this->db->inTransaction()) {
                $this->db->rollBack();
            }
            error_log('NotificationRepository::markAsRead error: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Mark all notifications as read for a user in an institution
     */
    public function markAllAsRead(int $institutionId, int $userId): bool
    {
        try {
            $this->db->beginTransaction();

            // Get all unread notification IDs for this user in this institution
            $stmt = $this->db->prepare("
                SELECT n.notification_id
                FROM notifications n
                LEFT JOIN notification_reads nr ON n.notification_id = nr.notification_id AND nr.user_id = :user_id
                WHERE n.institution_id = :institution_id AND nr.notification_read_id IS NULL
            ");
            $stmt->execute([':institution_id' => $institutionId, ':user_id' => $userId]);
            $unreadIds = $stmt->fetchAll(PDO::FETCH_COLUMN);

            // Insert reads for all unread notifications
            foreach ($unreadIds as $notificationId) {
                $insertStmt = $this->db->prepare("
                    INSERT IGNORE INTO notification_reads (uuid, notification_id, user_id, read_at)
                    VALUES (:uuid, :notification_id, :user_id, NOW())
                ");
                $insertStmt->execute([
                    'uuid' => UuidHelper::generate(),
                    'notification_id' => $notificationId,
                    'user_id' => $userId
                ]);
            }

            $this->db->commit();
            return true;
        } catch (\PDOException $e) {
            if ($this->db->inTransaction()) {
                $this->db->rollBack();
            }
            error_log('NotificationRepository::markAllAsRead error: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Delete a notification
     */
    public function delete(int $id): bool
    {
        $stmt = $this->db->prepare("
            DELETE FROM notifications
            WHERE notification_id = :id
        ");

        $stmt->bindValue(':id', $id, PDO::PARAM_INT);
        return $stmt->execute();
    }

    /**
     * Get legacy user notifications (for backward compatibility during transition)
     */
    public function getUserNotifications(int $userId, int $limit = 20, int $offset = 0): array
    {
        // This method is deprecated in favor of getInstitutionNotifications
        // but kept for API compatibility
        return [];
    }

    /**
     * Count legacy user notifications
     */
    public function countUserNotifications(int $userId): int
    {
        // Deprecated, kept for compatibility
        return 0;
    }
}
