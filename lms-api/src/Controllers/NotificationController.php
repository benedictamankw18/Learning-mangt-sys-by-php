<?php

namespace App\Controllers;

use App\Repositories\NotificationRepository;
use App\Repositories\MessageRepository;
use App\Utils\Response;
use App\Utils\Validator;
use App\Utils\UuidHelper;

class NotificationController
{
    private NotificationRepository $notificationRepo;
    private MessageRepository $messageRepo;

    public function __construct()
    {
        $this->notificationRepo = new NotificationRepository();
        $this->messageRepo = new MessageRepository();
    }

    /**
     * Get notifications for the authenticated user
     * GET /api/notifications
     */
    public function index(array $user): void
    {
        $userId = $user['user_id'];
        $page = isset($_GET['page']) ? max(1, (int) $_GET['page']) : 1;
        $limit = isset($_GET['limit']) ? min(100, max(1, (int) $_GET['limit'])) : 20;
        $offset = ($page - 1) * $limit;

        $notifications = $this->notificationRepo->getUserNotifications($userId, $limit, $offset);
        $total = $this->notificationRepo->countUserNotifications($userId);
        $unreadCount = $this->notificationRepo->getUnreadCount($userId);

        Response::success([
            'notifications' => $notifications,
            'pagination' => [
                'page' => $page,
                'limit' => $limit,
                'total' => $total,
                'pages' => ceil($total / $limit)
            ],
            'unread_count' => $unreadCount
        ]);
    }

    /**
     * Get a single notification
     * GET /api/notifications/{uuid}
     */
    public function show(array $user, string $uuid): void
    {
        $sanitizedUuid = UuidHelper::sanitize($uuid);
        if (!$sanitizedUuid) {
            Response::badRequest('Invalid UUID format');
            return;
        }

        $userId = $user['user_id'];
        $notification = $this->notificationRepo->findByUuid($sanitizedUuid);

        if (!$notification) {
            Response::error('Notification not found', 404);
            return;
        }

        // Check if notification belongs to the user
        if ($notification['user_id'] !== $userId) {
            Response::error('Unauthorized', 403);
            return;
        }

        Response::success($notification);
    }

    /**
     * Create a new notification (admin only)
     * POST /api/notifications
     */
    public function create(array $user): void
    {
        $roleId = $user['role_id'];

        // Only admins can create notifications
        if ($roleId !== 1) {
            Response::error('Unauthorized. Admin access required.', 403);
            return;
        }

        $data = json_decode(file_get_contents('php://input'), true);

        $validator = new Validator($data);
        $validator->required(['user_id', 'title', 'message']);

        if ($validator->fails()) {
            Response::validationError($validator->getErrors());
            return;
        }

        $notificationId = $this->notificationRepo->create($data);

        Response::success([
            'message' => 'Notification created successfully',
            'notification_id' => $notificationId
        ], 201);
    }

    /**
     * Mark notification as read
     * PUT /api/notifications/{uuid}/read
     */
    public function markAsRead(array $user, string $uuid): void
    {
        $sanitizedUuid = UuidHelper::sanitize($uuid);
        if (!$sanitizedUuid) {
            Response::badRequest('Invalid UUID format');
            return;
        }

        $userId = $user['user_id'];
        $notification = $this->notificationRepo->findByUuid($sanitizedUuid);

        if (!$notification) {
            Response::error('Notification not found', 404);
            return;
        }

        $notificationId = $notification['notification_id'];

        // Check if notification belongs to the user
        if ($notification['user_id'] !== $userId) {
            Response::error('Unauthorized', 403);
            return;
        }

        $this->notificationRepo->markAsRead($notificationId);

        Response::success(['message' => 'Notification marked as read']);
    }

    /**
     * Mark all notifications as read
     * PUT /api/notifications/read-all
     */
    public function markAllAsRead(array $user): void
    {
        $userId = $user['user_id'];
        $this->notificationRepo->markAllAsRead($userId);

        Response::success(['message' => 'All notifications marked as read']);
    }

    /**
     * Get unread notification count
     * GET /api/notifications/unread-count
     */
    public function getUnreadCount(array $user): void
    {
        $userId = $user['user_id'];
        $unreadCount = $this->notificationRepo->getUnreadCount($userId);

        Response::success(['unread_count' => $unreadCount]);
    }

    /**
     * Get notification and message summary
     * GET /api/notifications/summary
     */
    public function getSummary(array $user): void
    {
        $userId = $user['user_id'];

        // Get unread counts
        $notificationsCount = $this->notificationRepo->getUnreadCount($userId);
        $messagesCount = $this->messageRepo->getUnreadCount($userId);
        $totalCount = $notificationsCount + $messagesCount;

        // Get recent notifications (limit 5)
        $recentNotifications = $this->notificationRepo->getUserNotifications($userId, 5, 0);

        // Get recent messages (limit 5)
        $recentMessages = $this->messageRepo->getInbox($userId, 1, 5);

        Response::success([
            'total_unread' => $totalCount,
            'notifications_unread' => $notificationsCount,
            'messages_unread' => $messagesCount,
            'recent_notifications' => $recentNotifications,
            'recent_messages' => $recentMessages
        ]);
    }

    /**
     * 
    /**
     * Delete a notification
     * DELETE /api/notifications/{uuid}
     */
    public function delete(array $user, string $uuid): void
    {
        $sanitizedUuid = UuidHelper::sanitize($uuid);
        if (!$sanitizedUuid) {
            Response::badRequest('Invalid UUID format');
            return;
        }

        $userId = $user['user_id'];
        $notification = $this->notificationRepo->findByUuid($sanitizedUuid);

        if (!$notification) {
            Response::error('Notification not found', 404);
            return;
        }

        $notificationId = $notification['notification_id'];

        // Check if notification belongs to the user
        if ($notification['user_id'] !== $userId) {
            Response::error('Unauthorized', 403);
            return;
        }

        $this->notificationRepo->delete($notificationId);

        Response::success(['message' => 'Notification deleted successfully']);
    }

    /**
     * Delete all read notifications
     * DELETE /api/notifications/read
     */
    public function deleteAllRead(array $user): void
    {
        $userId = $user['user_id'];
        $this->notificationRepo->deleteAllRead($userId);

        Response::success(['message' => 'All read notifications deleted successfully']);
    }
}
