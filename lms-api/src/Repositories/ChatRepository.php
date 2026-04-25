<?php

namespace App\Repositories;

use App\Config\Database;
use App\Utils\UuidHelper;
use PDO;

class ChatRepository
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance()->getConnection();
    }

    public function getRoomsForUser(int $userId, ?int $institutionId = null): array
    {
        try {
            $sql = "
                SELECT
                    r.room_id,
                    r.uuid,
                    r.institution_id,
                    r.room_type,
                    r.room_name,
                    r.room_avatar,
                    r.room_description,
                    r.category_type,
                    r.category_ref_id,
                    r.category_label,
                    r.direct_user_1,
                    r.direct_user_2,
                    r.created_by,
                    r.is_active,
                    r.last_message_at,
                    r.created_at,
                    r.updated_at,
                    rm.last_read_message_id,
                    rm.last_read_at,
                    lm.uuid AS last_message_uuid,
                    lm.message_text AS last_message_text,
                    lm.message_type AS last_message_type,
                    lm.created_at AS last_message_created_at,
                    CONCAT(sender.first_name, ' ', sender.last_name) AS last_message_sender_name,
                    CASE
                        WHEN r.room_type = 'direct' AND r.direct_user_1 = :current_user_id_name_1 THEN CONCAT(other_user.first_name, ' ', other_user.last_name)
                        WHEN r.room_type = 'direct' AND r.direct_user_2 = :current_user_id_name_2 THEN CONCAT(other_user.first_name, ' ', other_user.last_name)
                        ELSE r.room_name
                    END AS display_name,
                    CASE
                        WHEN r.room_type = 'direct' AND r.direct_user_1 = :current_user_id_avatar_1 THEN other_user.profile_photo
                        WHEN r.room_type = 'direct' AND r.direct_user_2 = :current_user_id_avatar_2 THEN other_user.profile_photo
                        ELSE r.room_avatar
                    END AS display_avatar,
                    COALESCE(unread.unread_count, 0) AS unread_count,
                    COALESCE(member_count.member_total, 0) AS member_count
                FROM chat_rooms r
                INNER JOIN chat_room_members rm
                    ON rm.room_id = r.room_id
                   AND rm.user_id = :member_user_id
                   AND rm.left_at IS NULL
                LEFT JOIN users other_user
                    ON r.room_type = 'direct'
                   AND other_user.user_id = CASE
                        WHEN r.direct_user_1 = :current_user_id_join THEN r.direct_user_2
                        ELSE r.direct_user_1
                    END
                LEFT JOIN chat_messages lm
                    ON lm.chat_message_id = (
                        SELECT cm.chat_message_id
                        FROM chat_messages cm
                        WHERE cm.room_id = r.room_id
                          AND cm.deleted_at IS NULL
                        ORDER BY cm.created_at DESC, cm.chat_message_id DESC
                        LIMIT 1
                    )
                LEFT JOIN users sender ON sender.user_id = lm.sender_id
                LEFT JOIN (
                    SELECT room_id, COUNT(*) AS member_total
                    FROM chat_room_members
                    WHERE left_at IS NULL
                    GROUP BY room_id
                ) member_count ON member_count.room_id = r.room_id
                LEFT JOIN (
                    SELECT m.room_id, COUNT(*) AS unread_count
                    FROM chat_messages m
                    INNER JOIN chat_room_members rm2 ON rm2.room_id = m.room_id
                    WHERE rm2.user_id = :unread_user_id_filter
                      AND rm2.left_at IS NULL
                      AND m.deleted_at IS NULL
                      AND m.sender_id <> :unread_user_id_sender
                      AND (
                        rm2.last_read_message_id IS NULL
                        OR m.chat_message_id > rm2.last_read_message_id
                      )
                    GROUP BY m.room_id
                ) unread ON unread.room_id = r.room_id
                WHERE r.is_active = 1
            ";

            $params = [
                'current_user_id_name_1' => $userId,
                'current_user_id_name_2' => $userId,
                'current_user_id_avatar_1' => $userId,
                'current_user_id_avatar_2' => $userId,
                'current_user_id_join' => $userId,
                'member_user_id' => $userId,
                'unread_user_id_filter' => $userId,
                'unread_user_id_sender' => $userId,
            ];

            if ($institutionId !== null) {
                $sql .= " AND (r.institution_id IS NULL OR r.institution_id = :institution_id)";
                $params['institution_id'] = $institutionId;
            }

            $sql .= " ORDER BY COALESCE(r.last_message_at, r.created_at) DESC, r.room_id DESC";

            $stmt = $this->db->prepare($sql);
            foreach ($params as $key => $value) {
                $stmt->bindValue(':' . $key, $value, is_int($value) ? PDO::PARAM_INT : PDO::PARAM_STR);
            }
            $stmt->execute();

            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (\PDOException $e) {
            error_log('ChatRepository::getRoomsForUser error: ' . $e->getMessage());
            return [];
        }
    }

    public function findRoomByUuid(string $uuid, int $userId): ?array
    {
        if (!UuidHelper::isValid($uuid)) {
            return null;
        }

        try {
            $stmt = $this->db->prepare("\n                SELECT r.*\n                FROM chat_rooms r\n                INNER JOIN chat_room_members rm ON rm.room_id = r.room_id\n                WHERE r.uuid = :uuid\n                  AND rm.user_id = :user_id\n                  AND rm.left_at IS NULL\n                  AND r.is_active = 1\n                LIMIT 1\n            ");
            $stmt->execute([
                'uuid' => $uuid,
                'user_id' => $userId,
            ]);

            $room = $stmt->fetch(PDO::FETCH_ASSOC);
            return $room ?: null;
        } catch (\PDOException $e) {
            error_log('ChatRepository::findRoomByUuid error: ' . $e->getMessage());
            return null;
        }
    }

    public function getRoomMembers(int $roomId): array
    {
        try {
            $stmt = $this->db->prepare("\n                SELECT\n                    rm.room_member_id,\n                    rm.room_id,\n                    rm.user_id,\n                    rm.member_role,\n                    rm.joined_at,\n                    rm.left_at,\n                    rm.is_muted,\n                    rm.is_archived,\n                    rm.last_read_message_id,\n                    rm.last_read_at,\n                    u.uuid,\n                    u.username,\n                    u.email,\n                    u.first_name,\n                    u.last_name,\n                    u.profile_photo\n                FROM chat_room_members rm\n                INNER JOIN users u ON u.user_id = rm.user_id\n                WHERE rm.room_id = :room_id\n                  AND rm.left_at IS NULL\n                ORDER BY CASE WHEN rm.member_role = 'admin' THEN 0 ELSE 1 END, u.first_name ASC, u.last_name ASC\n            ");
            $stmt->execute(['room_id' => $roomId]);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (\PDOException $e) {
            error_log('ChatRepository::getRoomMembers error: ' . $e->getMessage());
            return [];
        }
    }

    public function getRoomMemberRole(int $roomId, int $userId): ?string
    {
        try {
            $stmt = $this->db->prepare("\n                SELECT member_role\n                FROM chat_room_members\n                WHERE room_id = :room_id\n                  AND user_id = :user_id\n                  AND left_at IS NULL\n                LIMIT 1\n            ");
            $stmt->execute([
                'room_id' => $roomId,
                'user_id' => $userId,
            ]);

            $role = $stmt->fetchColumn();
            return $role !== false ? (string) $role : null;
        } catch (\PDOException $e) {
            error_log('ChatRepository::getRoomMemberRole error: ' . $e->getMessage());
            return null;
        }
    }

    public function findDirectRoom(int $userId, int $otherUserId): ?array
    {
        try {
            [$user1, $user2] = $this->sortPair($userId, $otherUserId);

            $stmt = $this->db->prepare("\n                SELECT *\n                FROM chat_rooms\n                WHERE room_type = 'direct'\n                  AND direct_user_1 = :user1\n                  AND direct_user_2 = :user2\n                LIMIT 1\n            ");
            $stmt->execute([
                'user1' => $user1,
                'user2' => $user2,
            ]);

            $room = $stmt->fetch(PDO::FETCH_ASSOC);
            return $room ?: null;
        } catch (\PDOException $e) {
            error_log('ChatRepository::findDirectRoom error: ' . $e->getMessage());
            return null;
        }
    }
    public function createDirectRoom(int $userId, int $otherUserId, ?int $institutionId = null): int
    {
        try {
            $existing = $this->findDirectRoom($userId, $otherUserId);
            if ($existing) {
                return (int) $existing['room_id'];
            }

            [$user1, $user2] = $this->sortPair($userId, $otherUserId);

            $this->db->beginTransaction();

            $stmt = $this->db->prepare("\n                INSERT INTO chat_rooms (\n                    uuid, institution_id, room_type, direct_user_1, direct_user_2, created_by, is_active\n                ) VALUES (\n                    :uuid, :institution_id, 'direct', :direct_user_1, :direct_user_2, :created_by, 1\n                )\n            ");
            $stmt->execute([
                'uuid' => UuidHelper::generate(),
                'institution_id' => $institutionId,
                'direct_user_1' => $user1,
                'direct_user_2' => $user2,
                'created_by' => $userId,
            ]);

            $roomId = (int) $this->db->lastInsertId();

            $memberStmt = $this->db->prepare("\n                INSERT INTO chat_room_members (room_id, user_id, member_role)\n                VALUES (:room_id, :user_id, 'member')\n            ");
            $memberStmt->execute(['room_id' => $roomId, 'user_id' => $user1]);
            $memberStmt->execute(['room_id' => $roomId, 'user_id' => $user2]);

            $this->db->commit();
            return $roomId;
        } catch (\PDOException $e) {
            if ($this->db->inTransaction()) {
                $this->db->rollBack();
            }
            error_log('ChatRepository::createDirectRoom error: ' . $e->getMessage());
            return 0;
        }
    }

    public function createGroupRoom(array $data, int $creatorId): int
    {
        try {
            $this->db->beginTransaction();

            $stmt = $this->db->prepare("\n                INSERT INTO chat_rooms (\n                    uuid, institution_id, room_type, room_name, room_avatar, room_description,\n                    category_type, category_ref_id, category_label, created_by, is_active\n                ) VALUES (\n                    :uuid, :institution_id, :room_type, :room_name, :room_avatar, :room_description,\n                    :category_type, :category_ref_id, :category_label, :created_by, 1\n                )\n            ");
            $stmt->execute([
                'uuid' => UuidHelper::generate(),
                'institution_id' => $data['institution_id'] ?? null,
                'room_type' => $data['room_type'] ?? 'group',
                'room_name' => $data['room_name'] ?? null,
                'room_avatar' => $data['room_avatar'] ?? null,
                'room_description' => $data['room_description'] ?? null,
                'category_type' => $data['category_type'] ?? 'custom',
                'category_ref_id' => $data['category_ref_id'] ?? null,
                'category_label' => $data['category_label'] ?? null,
                'created_by' => $creatorId,
            ]);

            $roomId = (int) $this->db->lastInsertId();
            $this->addMember($roomId, $creatorId, 'admin');

            if (!empty($data['member_ids']) && is_array($data['member_ids'])) {
                foreach ($data['member_ids'] as $memberId) {
                    $memberId = (int) $memberId;
                    if ($memberId > 0 && $memberId !== $creatorId) {
                        $this->addMember($roomId, $memberId, 'member');
                    }
                }
            }

            $this->db->commit();
            return $roomId;
        } catch (\PDOException $e) {
            if ($this->db->inTransaction()) {
                $this->db->rollBack();
            }
            error_log('ChatRepository::createGroupRoom error: ' . $e->getMessage());
            return 0;
        }
    }

    public function updateRoom(int $roomId, array $data): bool
    {
        try {
            $fields = [];
            $params = ['room_id' => $roomId];

            if (array_key_exists('room_name', $data)) {
                $fields[] = 'room_name = :room_name';
                $params['room_name'] = $data['room_name'];
            }

            if (array_key_exists('room_description', $data)) {
                $fields[] = 'room_description = :room_description';
                $params['room_description'] = $data['room_description'];
            }

            if (array_key_exists('room_avatar', $data)) {
                $fields[] = 'room_avatar = :room_avatar';
                $params['room_avatar'] = $data['room_avatar'];
            }

            if (!$fields) {
                return false;
            }

            $fields[] = 'updated_at = NOW()';
            $sql = 'UPDATE chat_rooms SET ' . implode(', ', $fields) . ' WHERE room_id = :room_id';
            $stmt = $this->db->prepare($sql);
            return $stmt->execute($params);
        } catch (\PDOException $e) {
            error_log('ChatRepository::updateRoom error: ' . $e->getMessage());
            return false;
        }
    }

    public function addMember(int $roomId, int $userId, string $role = 'member'): bool
    {
        try {
            $stmt = $this->db->prepare("\n                INSERT INTO chat_room_members (room_id, user_id, member_role)\n                VALUES (:room_id, :user_id, :member_role)\n                ON DUPLICATE KEY UPDATE left_at = NULL, member_role = VALUES(member_role)\n            ");
            return $stmt->execute([
                'room_id' => $roomId,
                'user_id' => $userId,
                'member_role' => $role,
            ]);
        } catch (\PDOException $e) {
            error_log('ChatRepository::addMember error: ' . $e->getMessage());
            return false;
        }
    }

    public function removeMember(int $roomId, int $userId): bool
    {
        try {
            $stmt = $this->db->prepare("\n                UPDATE chat_room_members\n                SET left_at = NOW(), is_archived = 1\n                WHERE room_id = :room_id AND user_id = :user_id AND left_at IS NULL\n            ");
            return $stmt->execute([
                'room_id' => $roomId,
                'user_id' => $userId,
            ]);
        } catch (\PDOException $e) {
            error_log('ChatRepository::removeMember error: ' . $e->getMessage());
            return false;
        }
    }

    public function getMessages(int $roomId, int $limit = 30, ?string $beforeUuid = null): array
    {
        try {
            $params = ['room_id' => $roomId, 'limit' => $limit];
            $cursorSql = '';
            if ($beforeUuid && UuidHelper::isValid($beforeUuid)) {
                $cursorSql = ' AND m.chat_message_id < (SELECT chat_message_id FROM chat_messages WHERE uuid = :before_uuid LIMIT 1)';
                $params['before_uuid'] = $beforeUuid;
            }

            $stmt = $this->db->prepare("\n                SELECT\n                    m.chat_message_id,\n                    m.uuid,\n                    m.room_id,\n                    m.sender_id,\n                    m.message_type,\n                    m.message_text,\n                    m.reply_to_message_id,\n                    m.is_edited,\n                    m.edited_at,\n                    m.deleted_at,\n                    m.created_at,\n                    m.updated_at,\n                    CONCAT(u.first_name, ' ', u.last_name) AS sender_name,\n                    u.email AS sender_email,\n                    u.profile_photo AS sender_photo,\n                    reply.uuid AS reply_to_uuid,\n                    reply.message_text AS reply_to_text\n                FROM chat_messages m\n                INNER JOIN users u ON u.user_id = m.sender_id\n                LEFT JOIN chat_messages reply ON reply.chat_message_id = m.reply_to_message_id\n                WHERE m.room_id = :room_id\n                  AND m.deleted_at IS NULL\n                  {$cursorSql}\n                ORDER BY m.created_at DESC, m.chat_message_id DESC\n                LIMIT :limit\n            ");

            foreach ($params as $key => $value) {
                $stmt->bindValue(':' . $key, $value, $key === 'limit' ? PDO::PARAM_INT : PDO::PARAM_STR);
            }
            $stmt->execute();

            $messages = $stmt->fetchAll(PDO::FETCH_ASSOC);
            $attachmentsByMessageId = $this->getAttachmentsByMessageIds(array_map(function ($message) {
                return (int) ($message['chat_message_id'] ?? 0);
            }, $messages));

            foreach ($messages as &$message) {
                $messageId = (int) ($message['chat_message_id'] ?? 0);
                $message['attachments'] = $attachmentsByMessageId[$messageId] ?? [];
            }
            unset($message);

            return array_reverse($messages);
        } catch (\PDOException $e) {
            error_log('ChatRepository::getMessages error: ' . $e->getMessage());
            return [];
        }
    }

    public function sendMessage(int $roomId, int $senderId, array $data): int
    {
        try {
            $attachments = $this->normalizeAttachments($data['attachments'] ?? []);
            $messageText = isset($data['message_text']) ? trim((string) $data['message_text']) : '';
            if ($messageText === '' && !empty($attachments)) {
                $firstAttachmentName = (string) ($attachments[0]['file_name'] ?? 'attachment');
                $messageText = 'Attachment: ' . $firstAttachmentName;
                if (count($attachments) > 1) {
                    $messageText .= ' (+' . (count($attachments) - 1) . ' more)';
                }
            }

            $messageType = (string) ($data['message_type'] ?? '');
            if ($messageType === '') {
                $messageType = !empty($attachments)
                    ? ($messageText !== '' ? 'mixed' : 'attachment')
                    : 'text';
            }

            $this->db->beginTransaction();

            $stmt = $this->db->prepare("\n                INSERT INTO chat_messages (\n                    uuid, room_id, sender_id, message_type, message_text, reply_to_message_id\n                ) VALUES (\n                    :uuid, :room_id, :sender_id, :message_type, :message_text, :reply_to_message_id\n                )\n            ");
            $stmt->execute([
                'uuid' => UuidHelper::generate(),
                'room_id' => $roomId,
                'sender_id' => $senderId,
                'message_type' => $messageType,
                'message_text' => $messageText !== '' ? $messageText : null,
                'reply_to_message_id' => $data['reply_to_message_id'] ?? null,
            ]);

            $messageId = (int) $this->db->lastInsertId();

            if (!empty($attachments)) {
                $this->createAttachments($messageId, $attachments);
            }

            $updateRoom = $this->db->prepare("UPDATE chat_rooms SET last_message_at = NOW() WHERE room_id = :room_id");
            $updateRoom->execute(['room_id' => $roomId]);

            $this->db->commit();
            return $messageId;
        } catch (\PDOException $e) {
            if ($this->db->inTransaction()) {
                $this->db->rollBack();
            }
            error_log('ChatRepository::sendMessage error: ' . $e->getMessage());
            return 0;
        }
    }

    public function findMessageByUuid(string $uuid): ?array
    {
        if (!UuidHelper::isValid($uuid)) {
            return null;
        }

        try {
            $stmt = $this->db->prepare("\n                SELECT *\n                FROM chat_messages\n                WHERE uuid = :uuid\n                LIMIT 1\n            ");
            $stmt->execute(['uuid' => $uuid]);
            $message = $stmt->fetch(PDO::FETCH_ASSOC);
            return $message ?: null;
        } catch (\PDOException $e) {
            error_log('ChatRepository::findMessageByUuid error: ' . $e->getMessage());
            return null;
        }
    }

    public function getMessageAttachments(int $messageId): array
    {
        if ($messageId <= 0) {
            return [];
        }

        try {
            $stmt = $this->db->prepare("\n                SELECT\n                    attachment_id,\n                    chat_message_id,\n                    file_name,\n                    file_path,\n                    mime_type,\n                    file_size,\n                    created_at\n                FROM chat_attachments\n                WHERE chat_message_id = :message_id\n                ORDER BY attachment_id ASC\n            ");
            $stmt->execute(['message_id' => $messageId]);
            return $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
        } catch (\PDOException $e) {
            error_log('ChatRepository::getMessageAttachments error: ' . $e->getMessage());
            return [];
        }
    }

    public function updateMessage(int $messageId, ?string $messageText, string $messageType = 'text'): bool
    {
        if ($messageId <= 0) {
            return false;
        }

        try {
            $stmt = $this->db->prepare("\n                UPDATE chat_messages\n                SET message_text = :message_text,\n                    message_type = :message_type,\n                    is_edited = 1,\n                    edited_at = NOW()\n                WHERE chat_message_id = :message_id\n                  AND deleted_at IS NULL\n            ");

            return $stmt->execute([
                'message_text' => $messageText,
                'message_type' => trim($messageType) !== '' ? $messageType : 'text',
                'message_id' => $messageId,
            ]);
        } catch (\PDOException $e) {
            error_log('ChatRepository::updateMessage error: ' . $e->getMessage());
            return false;
        }
    }

    public function markMessageRead(int $roomId, int $userId, int $messageId): bool
    {
        try {
            $this->db->beginTransaction();

            $readStmt = $this->db->prepare("\n                INSERT INTO chat_message_reads (chat_message_id, user_id, read_at)\n                VALUES (:chat_message_id, :user_id, NOW())\n                ON DUPLICATE KEY UPDATE read_at = VALUES(read_at)\n            ");
            $readStmt->execute([
                'chat_message_id' => $messageId,
                'user_id' => $userId,
            ]);

            $memberStmt = $this->db->prepare("\n                UPDATE chat_room_members\n                SET last_read_message_id = GREATEST(COALESCE(last_read_message_id, 0), :message_id),\n                    last_read_at = NOW()\n                WHERE room_id = :room_id AND user_id = :user_id AND left_at IS NULL\n            ");
            $memberStmt->execute([
                'message_id' => $messageId,
                'room_id' => $roomId,
                'user_id' => $userId,
            ]);

            $this->db->commit();
            return true;
        } catch (\PDOException $e) {
            if ($this->db->inTransaction()) {
                $this->db->rollBack();
            }
            error_log('ChatRepository::markMessageRead error: ' . $e->getMessage());
            return false;
        }
    }

    private function getAttachmentsByMessageIds(array $messageIds): array
    {
        $messageIds = array_values(array_filter(array_map('intval', $messageIds)));
        if (empty($messageIds)) {
            return [];
        }

        try {
            $placeholders = implode(',', array_fill(0, count($messageIds), '?'));
            $stmt = $this->db->prepare("\n                SELECT\n                    attachment_id,\n                    chat_message_id,\n                    file_name,\n                    file_path,\n                    mime_type,\n                    file_size,\n                    created_at\n                FROM chat_attachments\n                WHERE chat_message_id IN ({$placeholders})\n                ORDER BY attachment_id ASC\n            ");

            foreach ($messageIds as $index => $messageId) {
                $stmt->bindValue($index + 1, $messageId, PDO::PARAM_INT);
            }
            $stmt->execute();

            $grouped = [];
            foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $attachment) {
                $messageId = (int) ($attachment['chat_message_id'] ?? 0);
                if (!isset($grouped[$messageId])) {
                    $grouped[$messageId] = [];
                }
                $grouped[$messageId][] = $attachment;
            }

            return $grouped;
        } catch (\PDOException $e) {
            error_log('ChatRepository::getAttachmentsByMessageIds error: ' . $e->getMessage());
            return [];
        }
    }

    private function createAttachments(int $messageId, array $attachments): void
    {
        $stmt = $this->db->prepare("\n            INSERT INTO chat_attachments (chat_message_id, file_name, file_path, mime_type, file_size)\n            VALUES (:chat_message_id, :file_name, :file_path, :mime_type, :file_size)\n        ");

        foreach ($attachments as $attachment) {
            $filePath = trim((string) ($attachment['file_path'] ?? ''));
            if ($filePath === '') {
                continue;
            }

            $stmt->execute([
                'chat_message_id' => $messageId,
                'file_name' => trim((string) ($attachment['file_name'] ?? basename($filePath))),
                'file_path' => $filePath,
                'mime_type' => $attachment['mime_type'] ?? null,
                'file_size' => isset($attachment['file_size']) ? (int) $attachment['file_size'] : null,
            ]);
        }
    }

    private function normalizeAttachments($attachments): array
    {
        if (!is_array($attachments) || empty($attachments)) {
            return [];
        }

        $normalized = [];
        foreach ($attachments as $attachment) {
            if (!is_array($attachment)) {
                continue;
            }

            $filePath = trim((string) ($attachment['file_path'] ?? $attachment['path'] ?? ''));
            if ($filePath === '') {
                continue;
            }

            $normalized[] = [
                'file_name' => trim((string) ($attachment['file_name'] ?? $attachment['original_name'] ?? basename($filePath))),
                'file_path' => $filePath,
                'mime_type' => $attachment['mime_type'] ?? $attachment['type'] ?? null,
                'file_size' => isset($attachment['file_size']) ? (int) $attachment['file_size'] : (isset($attachment['size']) ? (int) $attachment['size'] : null),
            ];
        }

        return $normalized;
    }

    public function countUnreadForUser(int $userId, ?int $institutionId = null): int
    {
        try {
            $sql = "SELECT COUNT(*) AS total\n"
                . "FROM chat_messages m\n"
                . "INNER JOIN chat_room_members rm ON rm.room_id = m.room_id\n"
                . "INNER JOIN chat_rooms r ON r.room_id = m.room_id\n"
                . "WHERE rm.user_id = :count_user_id\n"
                . "  AND rm.left_at IS NULL\n"
                . "  AND m.sender_id <> :count_sender_user_id\n"
                . "  AND m.deleted_at IS NULL\n"
                . "  AND (rm.last_read_message_id IS NULL OR m.chat_message_id > rm.last_read_message_id)";

            $params = [
                'count_user_id' => $userId,
                'count_sender_user_id' => $userId,
            ];
            if ($institutionId !== null) {
                $sql .= "\n  AND (r.institution_id IS NULL OR r.institution_id = :institution_id)";
                $params['institution_id'] = $institutionId;
            }

            $stmt = $this->db->prepare($sql);
            foreach ($params as $key => $value) {
                $stmt->bindValue(':' . $key, $value, is_int($value) ? PDO::PARAM_INT : PDO::PARAM_STR);
            }
            $stmt->execute();

            return (int) ($stmt->fetch(PDO::FETCH_ASSOC)['total'] ?? 0);
        } catch (\PDOException $e) {
            error_log('ChatRepository::countUnreadForUser error: ' . $e->getMessage());
            return 0;
        }
    }

    public function softDeleteMessage(int $messageId, int $userId): bool
    {
        try {
            $stmt = $this->db->prepare("\n                UPDATE chat_messages\n                SET deleted_at = NOW()\n                WHERE chat_message_id = :message_id AND sender_id = :user_id AND deleted_at IS NULL\n            ");
            return $stmt->execute([
                'message_id' => $messageId,
                'user_id' => $userId,
            ]);
        } catch (\PDOException $e) {
            error_log('ChatRepository::softDeleteMessage error: ' . $e->getMessage());
            return false;
        }
    }

    public function getRoomUuidById(int $roomId): ?string
    {
        try {
            $stmt = $this->db->prepare("SELECT uuid FROM chat_rooms WHERE room_id = :room_id LIMIT 1");
            $stmt->execute(['room_id' => $roomId]);
            $room = $stmt->fetch(PDO::FETCH_ASSOC);
            return $room['uuid'] ?? null;
        } catch (\PDOException $e) {
            error_log('ChatRepository::getRoomUuidById error: ' . $e->getMessage());
            return null;
        }
    }

    private function sortPair(int $a, int $b): array
    {
        return $a < $b ? [$a, $b] : [$b, $a];
    }
}
