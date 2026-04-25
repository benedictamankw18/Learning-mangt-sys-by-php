<?php

namespace App\Controllers;

use App\Repositories\ChatRepository;
use App\Utils\Response;
use App\Utils\UuidHelper;

class ChatController
{
    private ChatRepository $repo;

    public function __construct()
    {
        $this->repo = new ChatRepository();
    }

    private function institutionId(array $user): ?int
    {
        return isset($user['institution_id']) ? (int) $user['institution_id'] : null;
    }

    private function parseBody(): array
    {
        $body = json_decode(file_get_contents('php://input'), true);
        return is_array($body) ? $body : [];
    }

    private function requireRoomMember(?array $room): bool
    {
        if (!$room) {
            Response::notFound('Chat room not found');
            return false;
        }

        return true;
    }

    /**
     * GET /chat/rooms
     */
    public function index(array $user): void
    {
        $userId = (int) $user['user_id'];
        $institutionId = $this->institutionId($user);

        Response::success([
            'rooms' => $this->repo->getRoomsForUser($userId, $institutionId),
            'unread_count' => $this->repo->countUnreadForUser($userId, $institutionId),
        ]);
    }

    /**
     * POST /chat/rooms
     */
    public function store(array $user): void
    {
        $body = $this->parseBody();
        $roomType = $body['room_type'] ?? 'direct';
        $userId = (int) $user['user_id'];
        $institutionId = $this->institutionId($user);

        if ($roomType === 'direct') {
            $otherUserId = isset($body['other_user_id']) ? (int) $body['other_user_id'] : 0;
            if ($otherUserId <= 0 || $otherUserId === $userId) {
                Response::validationError(['other_user_id' => 'A valid different user is required for direct chat']);
                return;
            }

            $roomId = $this->repo->createDirectRoom($userId, $otherUserId, $institutionId);
            if (!$roomId) {
                Response::serverError('Failed to create direct chat room');
                return;
            }

            $room = $this->repo->getRoomsForUser($userId, $institutionId);
            Response::success(['room_id' => $roomId, 'rooms' => $room], 201);
            return;
        }

        $errors = [];
        if ($roomType !== 'group' && $roomType !== 'broadcast') {
            $errors['room_type'] = 'Room type must be direct, group, or broadcast';
        }
        if (empty($body['room_name'])) {
            $errors['room_name'] = 'Room name is required for group chat';
        }

        if (!empty($errors)) {
            Response::validationError($errors);
            return;
        }

        $roomId = $this->repo->createGroupRoom([
            'institution_id' => $institutionId,
            'room_type' => $roomType,
            'room_name' => $body['room_name'] ?? null,
            'room_avatar' => $body['room_avatar'] ?? null,
            'room_description' => $body['room_description'] ?? null,
            'category_type' => $body['category_type'] ?? 'custom',
            'category_ref_id' => isset($body['category_ref_id']) ? (int) $body['category_ref_id'] : null,
            'category_label' => $body['category_label'] ?? null,
            'member_ids' => $body['member_ids'] ?? [],
        ], $userId);

        if (!$roomId) {
            Response::serverError('Failed to create chat room');
            return;
        }

        Response::success(['room_id' => $roomId], 201);
    }

    /**
     * GET /chat/rooms/{roomUuid}
     */
    public function show(array $user, string $roomUuid): void
    {
        $roomUuid = UuidHelper::sanitize($roomUuid);
        if (!$roomUuid) {
            Response::badRequest('Invalid room UUID');
            return;
        }

        $room = $this->repo->findRoomByUuid($roomUuid, (int) $user['user_id']);
        if (!$this->requireRoomMember($room)) {
            return;
        }

        $room['members'] = $this->repo->getRoomMembers((int) $room['room_id']);
        Response::success(['room' => $room]);
    }

    /**
     * PUT /chat/rooms/{roomUuid}
     */
    public function updateRoom(array $user, string $roomUuid): void
    {
        $roomUuid = UuidHelper::sanitize($roomUuid);
        if (!$roomUuid) {
            Response::badRequest('Invalid room UUID');
            return;
        }

        $room = $this->repo->findRoomByUuid($roomUuid, (int) $user['user_id']);
        if (!$this->requireRoomMember($room)) {
            return;
        }

        if (($room['room_type'] ?? '') !== 'group' && ($room['room_type'] ?? '') !== 'broadcast') {
            Response::forbidden('Only group chats can be updated');
            return;
        }

        $currentUserId = (int) $user['user_id'];
        $isSystemAdmin = !empty($user['is_super_admin']) || (isset($user['role_id']) && (int) $user['role_id'] === 1);
        $memberRole = $this->repo->getRoomMemberRole((int) $room['room_id'], $currentUserId);
        $canEdit = $isSystemAdmin || $memberRole === 'admin';
        if (!$canEdit) {
            Response::forbidden('Only group admins can update this room');
            return;
        }

        $body = $this->parseBody();
        $updates = [];
        if (array_key_exists('room_name', $body)) {
            $roomName = trim((string) $body['room_name']);
            if ($roomName === '') {
                Response::validationError(['room_name' => 'Room name cannot be empty']);
                return;
            }
            $updates['room_name'] = $roomName;
        }

        if (array_key_exists('room_description', $body)) {
            $updates['room_description'] = trim((string) $body['room_description']);
        }

        if (array_key_exists('room_avatar', $body)) {
            $updates['room_avatar'] = trim((string) $body['room_avatar']);
        }

        if (empty($updates)) {
            Response::validationError(['payload' => 'No room fields to update']);
            return;
        }

        if (!$this->repo->updateRoom((int) $room['room_id'], $updates)) {
            Response::serverError('Failed to update group chat');
            return;
        }

        Response::success(['message' => 'Group chat updated successfully']);
    }

    /**
     * POST /chat/rooms/{roomUuid}/members
     */
    public function addMembers(array $user, string $roomUuid): void
    {
        $roomUuid = UuidHelper::sanitize($roomUuid);
        if (!$roomUuid) {
            Response::badRequest('Invalid room UUID');
            return;
        }

        $room = $this->repo->findRoomByUuid($roomUuid, (int) $user['user_id']);
        if (!$this->requireRoomMember($room)) {
            return;
        }

        if (($room['room_type'] ?? '') === 'direct') {
            Response::forbidden('Direct chats cannot be extended');
            return;
        }

        $currentUserId = (int) $user['user_id'];
        $isSystemAdmin = !empty($user['is_super_admin']) || (isset($user['role_id']) && (int) $user['role_id'] === 1);
        $memberRole = $this->repo->getRoomMemberRole((int) $room['room_id'], $currentUserId);
        if (!$isSystemAdmin && $memberRole !== 'admin') {
            Response::forbidden('Only group admins can manage members');
            return;
        }

        $body = $this->parseBody();
        $memberIds = $body['member_ids'] ?? [];
        if (!is_array($memberIds) || empty($memberIds)) {
            Response::validationError(['member_ids' => 'member_ids must be a non-empty array']);
            return;
        }

        $role = in_array(strtolower((string) ($body['member_role'] ?? 'member')), ['admin', 'member'], true)
            ? strtolower((string) $body['member_role'])
            : 'member';

        $added = 0;
        foreach ($memberIds as $memberId) {
            if ($this->repo->addMember((int) $room['room_id'], (int) $memberId, $role)) {
                $added++;
            }
        }

        Response::success(['added' => $added], 'Members added successfully');
    }

    /**
     * DELETE /chat/rooms/{roomUuid}/members/{userId}
     */
    public function removeMember(array $user, string $roomUuid, int $userId): void
    {
        $roomUuid = UuidHelper::sanitize($roomUuid);
        if (!$roomUuid) {
            Response::badRequest('Invalid room UUID');
            return;
        }

        $memberUserId = (int) $userId;

        $room = $this->repo->findRoomByUuid($roomUuid, (int) $user['user_id']);
        if (!$this->requireRoomMember($room)) {
            return;
        }

        $currentUserId = (int) $user['user_id'];
        $isSelfLeave = $memberUserId === $currentUserId;

        if (($room['room_type'] ?? '') === 'direct' && !$isSelfLeave) {
            Response::forbidden('Direct chats cannot remove other members');
            return;
        }

        if (!$this->repo->removeMember((int) $room['room_id'], $memberUserId)) {
            Response::serverError('Failed to remove member');
            return;
        }

        Response::success(['message' => $isSelfLeave ? 'Left chat successfully' : 'Member removed successfully']);
    }

    /**
     * GET /chat/rooms/{roomUuid}/messages
     */
    public function messages(array $user, string $roomUuid): void
    {
        $roomUuid = UuidHelper::sanitize($roomUuid);
        if (!$roomUuid) {
            Response::badRequest('Invalid room UUID');
            return;
        }

        $room = $this->repo->findRoomByUuid($roomUuid, (int) $user['user_id']);
        if (!$this->requireRoomMember($room)) {
            return;
        }

        $limit = min(100, max(1, (int) ($_GET['limit'] ?? 30)));
        $before = isset($_GET['before']) ? trim((string) $_GET['before']) : null;

        $messages = $this->repo->getMessages((int) $room['room_id'], $limit, $before ?: null);
        Response::success(['messages' => $messages]);
    }

    /**
     * POST /chat/rooms/{roomUuid}/messages
     */
    public function sendMessage(array $user, string $roomUuid): void
    {
        $roomUuid = UuidHelper::sanitize($roomUuid);
        if (!$roomUuid) {
            Response::badRequest('Invalid room UUID');
            return;
        }

        $room = $this->repo->findRoomByUuid($roomUuid, (int) $user['user_id']);
        if (!$this->requireRoomMember($room)) {
            return;
        }

        $body = $this->parseBody();
        $hasAttachments = !empty($body['attachments']) && is_array($body['attachments']);
        $messageText = isset($body['message_text']) ? trim((string) $body['message_text']) : '';
        if ($messageText === '' && !$hasAttachments) {
            Response::validationError(['message_text' => 'Message text is required']);
            return;
        }

        if (!isset($body['message_type']) || trim((string) $body['message_type']) === '') {
            $body['message_type'] = $hasAttachments ? ($messageText !== '' ? 'mixed' : 'attachment') : 'text';
        }

        $messageId = $this->repo->sendMessage((int) $room['room_id'], (int) $user['user_id'], $body);
        if (!$messageId) {
            Response::serverError('Failed to send message');
            return;
        }

        Response::success(['message_id' => $messageId], 'Message sent successfully', 201);
    }

    /**
     * PUT /chat/messages/{messageUuid}
     */
    public function updateMessage(array $user, string $messageUuid): void
    {
        $messageUuid = UuidHelper::sanitize($messageUuid);
        if (!$messageUuid) {
            Response::badRequest('Invalid message UUID');
            return;
        }

        $message = $this->repo->findMessageByUuid($messageUuid);
        if (!$message) {
            Response::notFound('Message not found');
            return;
        }

        $roomUuidForMessage = $this->repo->getRoomUuidById((int) $message['room_id']);
        $room = $roomUuidForMessage
            ? $this->repo->findRoomByUuid($roomUuidForMessage, (int) $user['user_id'])
            : null;
        if (!$room) {
            Response::forbidden('You do not have access to update this message');
            return;
        }

        if ((int) $message['sender_id'] !== (int) $user['user_id']) {
            Response::forbidden('You can only edit your own messages');
            return;
        }

        $body = $this->parseBody();
        $messageText = isset($body['message_text']) ? trim((string) $body['message_text']) : '';
        $existingAttachments = $this->repo->getMessageAttachments((int) $message['chat_message_id']);
        if ($messageText === '' && empty($existingAttachments)) {
            Response::validationError(['message_text' => 'Message text is required']);
            return;
        }

        $messageType = isset($body['message_type']) ? trim((string) $body['message_type']) : '';
        if ($messageType === '') {
            $messageType = !empty($existingAttachments)
                ? ($messageText !== '' ? 'mixed' : 'attachment')
                : 'text';
        }

        if (!$this->repo->updateMessage((int) $message['chat_message_id'], $messageText !== '' ? $messageText : null, $messageType)) {
            Response::serverError('Failed to update message');
            return;
        }

        Response::success(['message_uuid' => $messageUuid, 'is_edited' => true], 'Message updated successfully');
    }

    /**
     * POST /chat/messages/{messageUuid}/reply
     */
    public function replyToMessage(array $user, string $messageUuid): void
    {
        $messageUuid = UuidHelper::sanitize($messageUuid);
        if (!$messageUuid) {
            Response::badRequest('Invalid message UUID');
            return;
        }

        $message = $this->repo->findMessageByUuid($messageUuid);
        if (!$message) {
            Response::notFound('Message not found');
            return;
        }

        $roomUuidForMessage = $this->repo->getRoomUuidById((int) $message['room_id']);
        $room = $roomUuidForMessage
            ? $this->repo->findRoomByUuid($roomUuidForMessage, (int) $user['user_id'])
            : null;
        if (!$room) {
            Response::forbidden('You do not have access to reply to this message');
            return;
        }

        $body = $this->parseBody();
        $hasAttachments = !empty($body['attachments']) && is_array($body['attachments']);
        $messageText = isset($body['message_text']) ? trim((string) $body['message_text']) : '';
        if ($messageText === '' && !$hasAttachments) {
            Response::validationError(['message_text' => 'Message text is required']);
            return;
        }

        if (!isset($body['message_type']) || trim((string) $body['message_type']) === '') {
            $body['message_type'] = $hasAttachments ? ($messageText !== '' ? 'mixed' : 'attachment') : 'text';
        }
        $body['reply_to_message_id'] = (int) $message['chat_message_id'];

        $messageId = $this->repo->sendMessage((int) $message['room_id'], (int) $user['user_id'], $body);
        if (!$messageId) {
            Response::serverError('Failed to send reply');
            return;
        }

        Response::success(['message_id' => $messageId, 'reply_to_uuid' => $messageUuid], 'Reply sent successfully', 201);
    }

    /**
     * POST /chat/messages/{messageUuid}/forward
     */
    public function forwardMessage(array $user, string $messageUuid): void
    {
        $messageUuid = UuidHelper::sanitize($messageUuid);
        if (!$messageUuid) {
            Response::badRequest('Invalid message UUID');
            return;
        }

        $sourceMessage = $this->repo->findMessageByUuid($messageUuid);
        if (!$sourceMessage) {
            Response::notFound('Message not found');
            return;
        }

        $sourceRoomUuid = $this->repo->getRoomUuidById((int) $sourceMessage['room_id']);
        $sourceRoom = $sourceRoomUuid
            ? $this->repo->findRoomByUuid($sourceRoomUuid, (int) $user['user_id'])
            : null;
        if (!$sourceRoom) {
            Response::forbidden('You do not have access to forward this message');
            return;
        }

        $body = $this->parseBody();
        $targetRoomUuid = UuidHelper::sanitize((string) ($body['target_room_uuid'] ?? ''));
        if (!$targetRoomUuid) {
            Response::validationError(['target_room_uuid' => 'A valid target room UUID is required']);
            return;
        }

        $targetRoom = $this->repo->findRoomByUuid($targetRoomUuid, (int) $user['user_id']);
        if (!$targetRoom) {
            Response::forbidden('You do not have access to the target room');
            return;
        }

        $attachments = $this->repo->getMessageAttachments((int) $sourceMessage['chat_message_id']);
        $messageText = isset($body['message_text'])
            ? trim((string) $body['message_text'])
            : trim((string) ($sourceMessage['message_text'] ?? ''));

        if ($messageText === '' && empty($attachments)) {
            Response::validationError(['message_text' => 'Message text is required']);
            return;
        }

        $payload = [
            'message_text' => $messageText !== '' ? $messageText : null,
            'attachments' => $attachments,
        ];
        $payload['message_type'] = !empty($attachments)
            ? ($messageText !== '' ? 'mixed' : 'attachment')
            : 'text';

        $newMessageId = $this->repo->sendMessage((int) $targetRoom['room_id'], (int) $user['user_id'], $payload);
        if (!$newMessageId) {
            Response::serverError('Failed to forward message');
            return;
        }

        Response::success([
            'message_id' => $newMessageId,
            'target_room_uuid' => $targetRoomUuid,
            'forwarded_from_uuid' => $messageUuid,
        ], 'Message forwarded successfully', 201);
    }

    /**
     * PUT /chat/messages/{messageUuid}/read
     */
    public function markAsRead(array $user, string $messageUuid): void
    {
        $messageUuid = UuidHelper::sanitize($messageUuid);
        if (!$messageUuid) {
            Response::badRequest('Invalid message UUID');
            return;
        }

        $message = $this->repo->findMessageByUuid($messageUuid);
        if (!$message) {
            Response::notFound('Message not found');
            return;
        }

        $roomUuidForMessage = $this->repo->getRoomUuidById((int) $message['room_id']);
        $room = $roomUuidForMessage
            ? $this->repo->findRoomByUuid($roomUuidForMessage, (int) $user['user_id'])
            : null;
        if (!$room) {
            Response::forbidden('You do not have access to this message');
            return;
        }

        if (!$this->repo->markMessageRead((int) $message['room_id'], (int) $user['user_id'], (int) $message['chat_message_id'])) {
            Response::serverError('Failed to mark message as read');
            return;
        }

        Response::success(['message' => 'Message marked as read']);
    }

    /**
     * DELETE /chat/messages/{messageUuid}
     */
    public function deleteMessage(array $user, string $messageUuid): void
    {
        $messageUuid = UuidHelper::sanitize($messageUuid);
        if (!$messageUuid) {
            Response::badRequest('Invalid message UUID');
            return;
        }

        $message = $this->repo->findMessageByUuid($messageUuid);
        if (!$message) {
            Response::notFound('Message not found');
            return;
        }

        $roomUuidForMessage = $this->repo->getRoomUuidById((int) $message['room_id']);
        $room = $roomUuidForMessage
            ? $this->repo->findRoomByUuid($roomUuidForMessage, (int) $user['user_id'])
            : null;
        if (!$room) {
            Response::forbidden('You do not have access to delete this message');
            return;
        }

        if ((int) $message['sender_id'] !== (int) $user['user_id']) {
            Response::forbidden('You can only delete your own messages');
            return;
        }

        if (!$this->repo->softDeleteMessage((int) $message['chat_message_id'], (int) $user['user_id'])) {
            Response::serverError('Failed to delete message');
            return;
        }

        Response::success(['message' => 'Message deleted successfully']);
    }

}