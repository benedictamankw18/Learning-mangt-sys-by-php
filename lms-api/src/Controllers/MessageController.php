<?php

namespace App\Controllers;

use App\Repositories\MessageRepository;
use App\Utils\Response;
use App\Utils\Validator;

class MessageController
{
    private $repo;

    public function __construct()
    {
        $this->repo = new MessageRepository();
    }

    /**
     * Get inbox messages
     * GET /messages/inbox
     */
    public function getInbox(array $user): void
    {
        $page = isset($_GET['page']) ? (int) $_GET['page'] : 1;
        $limit = isset($_GET['limit']) ? (int) $_GET['limit'] : 20;

        $messages = $this->repo->getInbox($user['user_id'], $page, $limit);
        $total = $this->repo->countInbox($user['user_id']);

        Response::success([
            'data' => $messages,
            'pagination' => [
                'current_page' => $page,
                'per_page' => $limit,
                'total' => $total,
                'total_pages' => ceil($total / $limit)
            ]
        ]);
    }

    /**
     * Get sent messages
     * GET /messages/sent
     */
    public function getSent(array $user): void
    {
        $page = isset($_GET['page']) ? (int) $_GET['page'] : 1;
        $limit = isset($_GET['limit']) ? (int) $_GET['limit'] : 20;

        $messages = $this->repo->getSent($user['user_id'], $page, $limit);
        $total = $this->repo->countSent($user['user_id']);

        Response::success([
            'data' => $messages,
            'pagination' => [
                'current_page' => $page,
                'per_page' => $limit,
                'total' => $total,
                'total_pages' => ceil($total / $limit)
            ]
        ]);
    }

    /**
     * Get single message
     * GET /messages/{id}
     */
    public function show(array $user, int $id): void
    {
        $message = $this->repo->findById($id);

        if (!$message) {
            Response::notFound('Message not found');
            return;
        }

        // Authorization: user must be sender or receiver
        if ($message['sender_id'] != $user['user_id'] && $message['receiver_id'] != $user['user_id']) {
            Response::forbidden('You do not have access to this message');
            return;
        }

        // Mark as read if user is receiver and message is unread
        if ($message['receiver_id'] == $user['user_id'] && !$message['is_read']) {
            $this->repo->markAsRead($id);
            $message['is_read'] = 1;
            $message['read_at'] = date('Y-m-d H:i:s');
        }

        Response::success(['data' => $message]);
    }

    /**
     * Send message
     * POST /messages
     */
    public function send(array $user): void
    {
        $data = json_decode(file_get_contents('php://input'), true);

        $validator = new Validator($data);
        $validator->required(['receiver_id', 'message_text'])
            ->numeric('receiver_id')
            ->numeric('course_id')
            ->numeric('parent_message_id')
            ->max('subject', 200);

        if ($validator->fails()) {
            Response::validationError($validator->getErrors());
            return;
        }

        $data['sender_id'] = $user['user_id'];

        $messageId = $this->repo->send($data);

        if ($messageId) {
            Response::success([
                'message' => 'Message sent successfully',
                'message_id' => $messageId
            ], 201);
        } else {
            Response::serverError('Failed to send message');
        }
    }

    /**
     * Mark message as read
     * PUT /messages/{id}/read
     */
    public function markAsRead(array $user, int $id): void
    {
        $message = $this->repo->findById($id);

        if (!$message) {
            Response::notFound('Message not found');
            return;
        }

        // Authorization: only receiver can mark as read
        if ($message['receiver_id'] != $user['user_id']) {
            Response::forbidden('You can only mark your own received messages as read');
            return;
        }

        $success = $this->repo->markAsRead($id);

        if ($success) {
            Response::success(['message' => 'Message marked as read']);
        } else {
            Response::serverError('Failed to mark message as read');
        }
    }

    /**
     * Delete message
     * DELETE /messages/{id}
     */
    public function delete(array $user, int $id): void
    {
        $message = $this->repo->findById($id);

        if (!$message) {
            Response::notFound('Message not found');
            return;
        }

        // Authorization: user must be sender or receiver
        if ($message['sender_id'] != $user['user_id'] && $message['receiver_id'] != $user['user_id']) {
            Response::forbidden('You do not have access to delete this message');
            return;
        }

        $success = $this->repo->delete($id);

        if ($success) {
            Response::success(['message' => 'Message deleted successfully']);
        } else {
            Response::serverError('Failed to delete message');
        }
    }

    /**
     * Get unread message count
     * GET /messages/unread-count
     */
    public function getUnreadCount(array $user): void
    {
        $count = $this->repo->getUnreadCount($user['user_id']);

        Response::success(['unread_count' => $count]);
    }

    /**
     * Get conversation with another user
     * GET /messages/conversation/{userId}
     */
    public function getConversation(array $user, int $userId): void
    {
        $messages = $this->repo->getConversation($user['user_id'], $userId);

        Response::success(['data' => $messages]);
    }
}
