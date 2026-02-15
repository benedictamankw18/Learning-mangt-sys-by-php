<?php

namespace App\Repositories;

use App\Config\Database;
use PDO;

class MessageRepository
{
    private $db;

    public function __construct()
    {
        $this->db = Database::getInstance()->getConnection();
    }

    /**
     * Get inbox messages for user
     */
    public function getInbox(int $userId, int $page = 1, int $limit = 20): array
    {
        try {
            $offset = ($page - 1) * $limit;
            $stmt = $this->db->prepare("
                SELECT 
                    m.*,
                    CONCAT(u.first_name, ' ', u.last_name) as sender_name,
                    u.email as sender_email,
                    cs.course_id,
                    s.subject_name,
                    c.class_name
                FROM messages m
                INNER JOIN users u ON m.sender_id = u.user_id
                LEFT JOIN class_subjects cs ON m.course_id = cs.course_id
                LEFT JOIN subjects s ON cs.subject_id = s.subject_id
                LEFT JOIN classes c ON cs.class_id = c.class_id
                WHERE m.receiver_id = :user_id
                ORDER BY m.sent_at DESC
                LIMIT :limit OFFSET :offset
            ");
            $stmt->bindValue(':user_id', $userId, PDO::PARAM_INT);
            $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
            $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
            $stmt->execute();
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (\PDOException $e) {
            error_log("Get Inbox Error: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Get sent messages for user
     */
    public function getSent(int $userId, int $page = 1, int $limit = 20): array
    {
        try {
            $offset = ($page - 1) * $limit;
            $stmt = $this->db->prepare("
                SELECT 
                    m.*,
                    CONCAT(u.first_name, ' ', u.last_name) as receiver_name,
                    u.email as receiver_email,
                    cs.course_id,
                    s.subject_name,
                    c.class_name
                FROM messages m
                INNER JOIN users u ON m.receiver_id = u.user_id
                LEFT JOIN class_subjects cs ON m.course_id = cs.course_id
                LEFT JOIN subjects s ON cs.subject_id = s.subject_id
                LEFT JOIN classes c ON cs.class_id = c.class_id
                WHERE m.sender_id = :user_id
                ORDER BY m.sent_at DESC
                LIMIT :limit OFFSET :offset
            ");
            $stmt->bindValue(':user_id', $userId, PDO::PARAM_INT);
            $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
            $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
            $stmt->execute();
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (\PDOException $e) {
            error_log("Get Sent Messages Error: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Find message by ID
     */
    public function findById(int $id): ?array
    {
        try {
            $stmt = $this->db->prepare("
                SELECT 
                    m.*,
                    CONCAT(sender.first_name, ' ', sender.last_name) as sender_name,
                    sender.email as sender_email,
                    CONCAT(receiver.first_name, ' ', receiver.last_name) as receiver_name,
                    receiver.email as receiver_email,
                    cs.course_id,
                    s.subject_name,
                    c.class_name
                FROM messages m
                INNER JOIN users sender ON m.sender_id = sender.user_id
                INNER JOIN users receiver ON m.receiver_id = receiver.user_id
                LEFT JOIN class_subjects cs ON m.course_id = cs.course_id
                LEFT JOIN subjects s ON cs.subject_id = s.subject_id
                LEFT JOIN classes c ON cs.class_id = c.class_id
                WHERE m.message_id = :id
            ");
            $stmt->execute(['id' => $id]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            return $result ?: null;
        } catch (\PDOException $e) {
            error_log("Find Message Error: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Send a new message
     */
    public function send(array $data): int
    {
        try {
            $stmt = $this->db->prepare("
                INSERT INTO messages (
                    sender_id, receiver_id, course_id, subject, 
                    message_text, parent_message_id
                )
                VALUES (
                    :sender_id, :receiver_id, :course_id, :subject,
                    :message_text, :parent_message_id
                )
            ");
            $stmt->execute([
                'sender_id' => $data['sender_id'],
                'receiver_id' => $data['receiver_id'],
                'course_id' => $data['course_id'] ?? null,
                'subject' => $data['subject'] ?? null,
                'message_text' => $data['message_text'],
                'parent_message_id' => $data['parent_message_id'] ?? null
            ]);
            return (int) $this->db->lastInsertId();
        } catch (\PDOException $e) {
            error_log("Send Message Error: " . $e->getMessage());
            return 0;
        }
    }

    /**
     * Mark message as read
     */
    public function markAsRead(int $id): bool
    {
        try {
            $stmt = $this->db->prepare("
                UPDATE messages 
                SET is_read = 1, read_at = NOW()
                WHERE message_id = :id AND is_read = 0
            ");
            return $stmt->execute(['id' => $id]);
        } catch (\PDOException $e) {
            error_log("Mark Message Read Error: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Delete message
     */
    public function delete(int $id): bool
    {
        try {
            $stmt = $this->db->prepare("DELETE FROM messages WHERE message_id = :id");
            return $stmt->execute(['id' => $id]);
        } catch (\PDOException $e) {
            error_log("Delete Message Error: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Get unread message count
     */
    public function getUnreadCount(int $userId): int
    {
        try {
            $stmt = $this->db->prepare("
                SELECT COUNT(*) as total 
                FROM messages 
                WHERE receiver_id = :user_id AND is_read = 0
            ");
            $stmt->execute(['user_id' => $userId]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            return (int) $result['total'];
        } catch (\PDOException $e) {
            error_log("Get Unread Count Error: " . $e->getMessage());
            return 0;
        }
    }

    /**
     * Get conversation between two users
     */
    public function getConversation(int $userId, int $otherUserId): array
    {
        try {
            $stmt = $this->db->prepare("
                SELECT 
                    m.*,
                    CONCAT(sender.first_name, ' ', sender.last_name) as sender_name,
                    CONCAT(receiver.first_name, ' ', receiver.last_name) as receiver_name
                FROM messages m
                INNER JOIN users sender ON m.sender_id = sender.user_id
                INNER JOIN users receiver ON m.receiver_id = receiver.user_id
                WHERE 
                    (m.sender_id = :user_id AND m.receiver_id = :other_user_id)
                    OR (m.sender_id = :other_user_id AND m.receiver_id = :user_id)
                ORDER BY m.sent_at ASC
            ");
            $stmt->execute([
                'user_id' => $userId,
                'other_user_id' => $otherUserId
            ]);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (\PDOException $e) {
            error_log("Get Conversation Error: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Count inbox messages
     */
    public function countInbox(int $userId): int
    {
        try {
            $stmt = $this->db->prepare("
                SELECT COUNT(*) as total 
                FROM messages 
                WHERE receiver_id = :user_id
            ");
            $stmt->execute(['user_id' => $userId]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            return (int) $result['total'];
        } catch (\PDOException $e) {
            error_log("Count Inbox Error: " . $e->getMessage());
            return 0;
        }
    }

    /**
     * Count sent messages
     */
    public function countSent(int $userId): int
    {
        try {
            $stmt = $this->db->prepare("
                SELECT COUNT(*) as total 
                FROM messages 
                WHERE sender_id = :user_id
            ");
            $stmt->execute(['user_id' => $userId]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            return (int) $result['total'];
        } catch (\PDOException $e) {
            error_log("Count Sent Error: " . $e->getMessage());
            return 0;
        }
    }
}
