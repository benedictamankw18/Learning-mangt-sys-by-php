<?php

namespace App\Repositories;

use PDO;

class NotificationRepository
{
    private PDO $db;

    public function __construct(PDO $db)
    {
        $this->db = $db;
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
                priority_level,
                is_read,
                created_at,
                expires_at
            FROM notifications
            WHERE user_id = :user_id
                AND (expires_at IS NULL OR expires_at > NOW())
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
                AND (expires_at IS NULL OR expires_at > NOW())
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
                AND (expires_at IS NULL OR expires_at > NOW())
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
                priority_level,
                is_read,
                created_at,
                expires_at
            FROM notifications
            WHERE notification_id = :id
        ");

        $stmt->bindValue(':id', $id, PDO::PARAM_INT);
        $stmt->execute();

        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return $result ?: null;
    }

    /**
     * Create a new notification
     */
    public function create(array $data): int
    {
        $stmt = $this->db->prepare("
            INSERT INTO notifications (
                user_id,
                title,
                message,
                notification_type,
                priority_level,
                expires_at
            ) VALUES (
                :user_id,
                :title,
                :message,
                :notification_type,
                :priority_level,
                :expires_at
            )
        ");

        $stmt->execute([
            ':user_id' => $data['user_id'],
            ':title' => $data['title'],
            ':message' => $data['message'],
            ':notification_type' => $data['notification_type'] ?? null,
            ':priority_level' => $data['priority_level'] ?? 'Normal',
            ':expires_at' => $data['expires_at'] ?? null
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
