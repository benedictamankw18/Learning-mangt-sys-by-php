<?php

namespace App\Controllers;

use App\Repositories\NotificationRepository;
use App\Repositories\MessageRepository;
use App\Utils\Response;
use App\Utils\Validator;

class NotificationController
{
    private NotificationRepository $notificationRepo;
    private MessageRepository $messageRepo;

    public function __construct(NotificationRepository $notificationRepo, MessageRepository $messageRepo)
    {
        $this->notificationRepo = $notificationRepo;
        $this->messageRepo = $messageRepo;
    }

    /**
     * Get notifications for the authenticated user
     * GET /api/notifications
     */
    public function index(): void
    {
        $userId = $_SESSION['user']['user_id'];
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
     * GET /api/notifications/{id}
     */
    public function show(int $id): void
    {
        $userId = $_SESSION['user']['user_id'];
        $notification = $this->notificationRepo->findById($id);

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
    public function create(): void
    {
        $roleId = $_SESSION['user']['role_id'];

        // Only admins can create notifications
        if ($roleId !== 1) {
            Response::error('Unauthorized. Admin access required.', 403);
            return;
        }

        $data = json_decode(file_get_contents('php://input'), true);

        $errors = Validator::validate($data, [
            'user_id' => 'required|integer',
            'title' => 'required|string|max:200',
            'message' => 'required|string',
            'notification_type' => 'string|max:50',
            'priority_level' => 'string|in:Low,Normal,High,Urgent',
            'expires_at' => 'datetime'
        ]);

        if (!empty($errors)) {
            Response::error('Validation failed', 400, $errors);
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
     * PUT /api/notifications/{id}/read
     */
    public function markAsRead(int $id): void
    {
        $userId = $_SESSION['user']['user_id'];
        $notification = $this->notificationRepo->findById($id);

        if (!$notification) {
            Response::error('Notification not found', 404);
            return;
        }

        // Check if notification belongs to the user
        if ($notification['user_id'] !== $userId) {
            Response::error('Unauthorized', 403);
            return;
        }

        $this->notificationRepo->markAsRead($id);

        Response::success(['message' => 'Notification marked as read']);
    }

    /**
     * Mark all notifications as read
     * PUT /api/notifications/read-all
     */
    public function markAllAsRead(): void
    {
        $userId = $_SESSION['user']['user_id'];
        $this->notificationRepo->markAllAsRead($userId);

        Response::success(['message' => 'All notifications marked as read']);
    }

    /**
     * Get unread notification count
     * GET /api/notifications/unread-count
     */
    public function getUnreadCount(): void
    {
        $userId = $_SESSION['user']['user_id'];
        $unreadCount = $this->notificationRepo->getUnreadCount($userId);

        Response::success(['unread_count' => $unreadCount]);
    }

    /**
     * Get notification and message summary
     * GET /api/notifications/summary
     */
    public function getSummary(): void
    {
        $userId = $_SESSION['user']['user_id'];

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
     * DELETE /api/notifications/{id}
     */
    public function delete(int $id): void
    {
        $userId = $_SESSION['user']['user_id'];
        $notification = $this->notificationRepo->findById($id);

        if (!$notification) {
            Response::error('Notification not found', 404);
            return;
        }

        // Check if notification belongs to the user
        if ($notification['user_id'] !== $userId) {
            Response::error('Unauthorized', 403);
            return;
        }

        $this->notificationRepo->delete($id);

        Response::success(['message' => 'Notification deleted successfully']);
    }

    /**
     * Delete all read notifications
     * DELETE /api/notifications/read
     */
    public function deleteAllRead(): void
    {
        $userId = $_SESSION['user']['user_id'];
        $this->notificationRepo->deleteAllRead($userId);

        Response::success(['message' => 'All read notifications deleted successfully']);
    }
}
