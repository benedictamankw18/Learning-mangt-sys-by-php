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
     * Filters by target_role (if set) or user_id (if set)
     */
    public function getInstitutionNotifications(int $institutionId, int $userId, int $limit = 20, int $offset = 0, ?string $userRole = null): array
    {
        $stmt = $this->db->prepare("
            SELECT 
                n.notification_id,
                n.uuid,
                n.title,
                n.message,
                n.target_role,
                n.user_id,
                n.notification_type,
                n.link,
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
               AND my_read.user_id = ?
            WHERE n.institution_id = ?
            AND (
                (n.target_role IS NOT NULL AND n.target_role != '' AND n.target_role = ?)
                OR (n.user_id IS NOT NULL AND n.user_id = ?)
            )
            ORDER BY n.created_at DESC
            LIMIT ? OFFSET ?
        ");

        $stmt->execute([$userId, $institutionId, $userRole ?: '', $userId, $limit, $offset]);

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Count total notifications for an institution
     * Filters by target_role or user_id
     */
    public function countInstitutionNotifications(int $institutionId, ?string $userRole = null, ?int $userId = null): int
    {
        $stmt = $this->db->prepare("
            SELECT COUNT(*) as total
            FROM notifications
            WHERE institution_id = ?
            AND (
                (target_role IS NOT NULL AND target_role != '' AND target_role = ?)
                OR (user_id IS NOT NULL AND user_id = ?)
            )
        ");

        $stmt->execute([$institutionId, $userRole ?: '', $userId ?? 0]);

        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return (int) $result['total'];
    }

    /**
     * Get unread notification count for a user in an institution
     * Filters by target_role or user_id
     */
    public function getUnreadCount(int $institutionId, int $userId, ?string $userRole = null): int
    {
        $stmt = $this->db->prepare("
            SELECT COUNT(*) as unread_count
            FROM notifications n
            LEFT JOIN notification_reads nr ON n.notification_id = nr.notification_id AND nr.user_id = ?
            WHERE n.institution_id = ?
                AND nr.notification_read_id IS NULL
                AND (
                    (n.target_role IS NOT NULL AND n.target_role != '' AND n.target_role = ?)
                    OR (n.user_id IS NOT NULL AND n.user_id = ?)
                )
        ");

        $stmt->execute([$userId, $institutionId, $userRole ?: '', $userId]);

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
                link,
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
                n.link,
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
     * Check whether a notification with the same quiz activation payload already exists for a user.
     */
    public function quizActivationExists(int $userId, int $courseId, string $title, string $message): bool
    {
        $stmt = $this->db->prepare("\n            SELECT notification_id\n            FROM notifications\n            WHERE user_id = ?\n              AND course_id = ?\n              AND notification_type = 'quiz_activated'\n              AND title = ?\n              AND message = ?\n            LIMIT 1\n        ");

        $stmt->execute([$userId, $courseId, $title, $message]);
        return (bool) $stmt->fetch(PDO::FETCH_ASSOC);
    }

    /**
     * Find a recently created admin broadcast notification for assessment approval submissions.
     */
    private function findRecentAssessmentApprovalBroadcast(
        int $institutionId,
        ?int $courseId,
        string $title,
        string $message,
        int $windowSeconds = 120
    ): ?int {
        $stmt = $this->db->prepare("\n            SELECT notification_id\n            FROM notifications\n            WHERE institution_id = :institution_id\n              AND target_role = 'admin'\n              AND user_id IS NULL\n              AND notification_type = 'assessment_approval_submission'\n              AND ((course_id IS NULL AND :course_id IS NULL) OR course_id = :course_id)\n              AND title = :title\n              AND message = :message\n              AND created_at >= DATE_SUB(NOW(), INTERVAL :window SECOND)\n            ORDER BY notification_id DESC\n            LIMIT 1\n        ");

        if ($courseId === null) {
            $stmt->bindValue(':course_id', null, PDO::PARAM_NULL);
        } else {
            $stmt->bindValue(':course_id', $courseId, PDO::PARAM_INT);
        }
        $stmt->bindValue(':institution_id', $institutionId, PDO::PARAM_INT);
        $stmt->bindValue(':title', $title);
        $stmt->bindValue(':message', $message);
        $stmt->bindValue(':window', $windowSeconds, PDO::PARAM_INT);
        $stmt->execute();

        $existing = $stmt->fetchColumn();
        return $existing !== false ? (int) $existing : null;
    }

    /**
     * Create a new institution-scoped notification (not per-user)
     */
    public function create(array $data): int
    {
        if (!isset($data['uuid'])) {
            $data['uuid'] = UuidHelper::generate();
        }

        $senderId = array_key_exists('sender_id', $data) && $data['sender_id'] !== null
            ? (int) $data['sender_id']
            : null;
        $institutionId = isset($data['institution_id']) ? (int) $data['institution_id'] : 1;
        $targetRole = $data['target_role'] ?? null;
        $userId = isset($data['user_id']) && $data['user_id'] !== null ? (int) $data['user_id'] : null;
        $courseId = isset($data['course_id']) && $data['course_id'] !== null ? (int) $data['course_id'] : null;
        $link = $data['link'] ?? null;
        $title = (string) $data['title'];
        $message = (string) $data['message'];
        $notificationType = isset($data['notification_type']) && $data['notification_type'] !== ''
            ? (string) $data['notification_type']
            : null;

        if ($notificationType === 'assessment_approval_submission' && $targetRole === 'admin' && $userId === null) {
            $existingId = $this->findRecentAssessmentApprovalBroadcast(
                $institutionId,
                $courseId,
                $title,
                $message
            );
            if ($existingId !== null) {
                return $existingId;
            }
        }

        $stmt = $this->db->prepare("
            INSERT INTO notifications (
                uuid,
                institution_id,
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
                :institution_id,
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

        $stmt->bindValue(':uuid', $data['uuid']);
        $stmt->bindValue(':institution_id', $institutionId, PDO::PARAM_INT);
        if ($senderId === null) {
            $stmt->bindValue(':sender_id', null, PDO::PARAM_NULL);
        } else {
            $stmt->bindValue(':sender_id', $senderId, PDO::PARAM_INT);
        }
        if ($userId === null) {
            $stmt->bindValue(':user_id', null, PDO::PARAM_NULL);
        } else {
            $stmt->bindValue(':user_id', $userId, PDO::PARAM_INT);
        }
        if ($targetRole === null || $targetRole === '') {
            $stmt->bindValue(':target_role', null, PDO::PARAM_NULL);
        } else {
            $stmt->bindValue(':target_role', (string) $targetRole);
        }
        if ($courseId === null) {
            $stmt->bindValue(':course_id', null, PDO::PARAM_NULL);
        } else {
            $stmt->bindValue(':course_id', $courseId, PDO::PARAM_INT);
        }
        $stmt->bindValue(':title', $title);
        $stmt->bindValue(':message', $message);
        if ($notificationType !== null) {
            $stmt->bindValue(':notification_type', $notificationType);
        } else {
            $stmt->bindValue(':notification_type', null, PDO::PARAM_NULL);
        }
        if ($link === null || $link === '') {
            $stmt->bindValue(':link', null, PDO::PARAM_NULL);
        } else {
            $stmt->bindValue(':link', (string) $link);
        }
        $stmt->execute();

        $notificationId = (int) $this->db->lastInsertId();
        log_audit('Notification created', ['notification_id' => $notificationId, 'institution_id' => $institutionId, 'title' => $title, 'notification_type' => $notificationType]);
        return $notificationId;
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
            log_error('NotificationRepository::markAsRead error: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Mark all notifications as read for a user in an institution
     */
    public function markAllAsRead(int $institutionId, int $userId, ?string $userRole = null): bool
    {
        try {
            $this->db->beginTransaction();

            // Get all unread notification IDs for this user in this institution
            // Filtered by target_role or user_id
            $stmt = $this->db->prepare("
                SELECT n.notification_id
                FROM notifications n
                LEFT JOIN notification_reads nr ON n.notification_id = nr.notification_id AND nr.user_id = ?
                WHERE n.institution_id = ? 
                    AND nr.notification_read_id IS NULL
                    AND (
                        (n.target_role IS NOT NULL AND n.target_role != '' AND n.target_role = ?)
                        OR (n.user_id IS NOT NULL AND n.user_id = ?)
                    )
            ");
            $stmt->execute([$userId, $institutionId, $userRole ?: '', $userId]);
            $unreadIds = $stmt->fetchAll(PDO::FETCH_COLUMN);

            // Insert reads for all unread notifications
            foreach ($unreadIds as $notificationId) {
                $insertStmt = $this->db->prepare("
                    INSERT IGNORE INTO notification_reads (uuid, notification_id, user_id, read_at)
                    VALUES (?, ?, ?, NOW())
                ");
                $insertStmt->execute([
                    UuidHelper::generate(),
                    $notificationId,
                    $userId
                ]);
            }

            $this->db->commit();
            return true;
        } catch (\PDOException $e) {
            if ($this->db->inTransaction()) {
                $this->db->rollBack();
            }
            log_error('NotificationRepository::markAllAsRead error: ' . $e->getMessage());
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
        $result = $stmt->execute();
        if ($result) {
            log_audit('Notification deleted', ['notification_id' => $id]);
        }
        return $result;
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
