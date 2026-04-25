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
     * Get all notifications for a user with pagination
     */
    public function getUserNotifications(int $userId, int $limit = 20, int $offset = 0): array
    {
        $stmt = $this->db->prepare("
            SELECT 
                notification_id,
                user_id,
                title,
                message,
                notification_type,
                is_read,
                created_at,
                read_at
            FROM notifications
            WHERE user_id = :user_id
            ORDER BY is_read ASC, created_at DESC
            LIMIT :limit OFFSET :offset
        ");

        $stmt->bindValue(':user_id', $userId, PDO::PARAM_INT);
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Count total notifications for a user
     */
    public function countUserNotifications(int $userId): int
    {
        $stmt = $this->db->prepare("
            SELECT COUNT(*) as total
            FROM notifications
            WHERE user_id = :user_id
        ");

        $stmt->bindValue(':user_id', $userId, PDO::PARAM_INT);
        $stmt->execute();

        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return (int) $result['total'];
    }

    /**
     * Get unread notification count for a user
     */
    public function getUnreadCount(int $userId): int
    {
        $stmt = $this->db->prepare("
            SELECT COUNT(*) as unread_count
            FROM notifications
            WHERE user_id = :user_id
                AND is_read = 0
        ");

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
                user_id,
                title,
                message,
                notification_type,
                is_read,
                created_at,
                read_at
            FROM notifications
            WHERE notification_id = :id
        ");

        $stmt->bindValue(':id', $id, PDO::PARAM_INT);
        $stmt->execute();

        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return $result ?: null;
    }

    /**
     * Find notification by UUID
     * 
     * @param string $uuid
     * @return array|null
     */
    public function findByUuid(string $uuid): ?array
    {
        // Validate UUID format
        if (!UuidHelper::isValid($uuid)) {
            return null;
        }

        $stmt = $this->db->prepare("
            SELECT 
                notification_id,
                user_id,
                uuid,
                title,
                message,
                notification_type,
                is_read,
                created_at,
                read_at
            FROM notifications
            WHERE uuid = :uuid
        ");

        $stmt->bindValue(':uuid', $uuid);
        $stmt->execute();

        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return $result ?: null;
    }

    /**
     * Create a new notification
     */
    public function create(array $data): int
    {
        // Auto-generate UUID if not provided
        if (!isset($data['uuid'])) {
            $data['uuid'] = UuidHelper::generate();
        }

        $senderId = isset($data['sender_id']) ? (int) $data['sender_id'] : 0;
        if ($senderId <= 0 && isset($data['user_id'])) {
            $senderId = (int) $data['user_id'];
        }

        $stmt = $this->db->prepare("
            INSERT INTO notifications (
                uuid,
                sender_id,
                user_id,
                target_role,
                course_id,
                title,
                message,
                notification_type,
                link
            ) VALUES (
                :uuid,
                :sender_id,
                :user_id,
                :target_role,
                :course_id,
                :title,
                :message,
                :notification_type,
                :link
            )
        ");

        $stmt->execute([
            ':uuid' => $data['uuid'],
            ':sender_id' => $senderId,
            ':user_id' => $data['user_id'] ?? null,
            ':target_role' => $data['target_role'] ?? null,
            ':course_id' => $data['course_id'] ?? null,
            ':title' => $data['title'],
            ':message' => $data['message'],
            ':notification_type' => $data['notification_type'] ?? null,
            ':link' => $data['link'] ?? null
        ]);

        return (int) $this->db->lastInsertId();
    }

    /**
     * Mark notification as read
     */
    public function markAsRead(int $id): bool
    {
        $stmt = $this->db->prepare("
            UPDATE notifications
            SET is_read = 1
            WHERE notification_id = :id
        ");

        $stmt->bindValue(':id', $id, PDO::PARAM_INT);
        return $stmt->execute();
    }

    /**
     * Mark all notifications as read for a user
     */
    public function markAllAsRead(int $userId): bool
    {
        $stmt = $this->db->prepare("
            UPDATE notifications
            SET is_read = 1
            WHERE user_id = :user_id AND is_read = 0
        ");

        $stmt->bindValue(':user_id', $userId, PDO::PARAM_INT);
        return $stmt->execute();
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
     * Delete all read notifications for a user
     */
    public function deleteAllRead(int $userId): bool
    {
        $stmt = $this->db->prepare("
            DELETE FROM notifications
            WHERE user_id = :user_id AND is_read = 1
        ");

        $stmt->bindValue(':user_id', $userId, PDO::PARAM_INT);
        return $stmt->execute();
    }
}
