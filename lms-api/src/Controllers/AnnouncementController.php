<?php

namespace App\Controllers;

use App\Repositories\AnnouncementRepository;
use App\Repositories\NotificationRepository;
use App\Repositories\UserRepository;
use App\Utils\Response;
use App\Utils\Validator;
use App\Utils\UuidHelper;

class AnnouncementController
{
    private AnnouncementRepository $announcementRepo;
    private NotificationRepository $notificationRepo;
    private UserRepository $userRepo;

    public function __construct()
    {
        $this->announcementRepo = new AnnouncementRepository();
        $this->notificationRepo = new NotificationRepository();
        $this->userRepo = new UserRepository();
    }

    /**
     * Get all announcements
     * GET /api/announcements
     */
    public function index(array $user): void
    {
        $page = isset($_GET['page']) ? max(1, (int) $_GET['page']) : 1;
        $limit = isset($_GET['limit']) ? min(100, max(1, (int) $_GET['limit'])) : 20;
        $targetRole = $_GET['target_role'] ?? null;
        $isPublished = isset($_GET['is_published']) ? (bool) $_GET['is_published'] : null;

        $institutionId = $user['institution_id'] ?? null;

        $userRole = $user['role'] ?? null;
        $userId = $user['user_id'] ?? null;
        $studentClassName = $user['class_name'] ?? null;
        $studentClassCode = $user['class_code'] ?? null;
        $studentClassId = isset($user['class_id']) ? (int) $user['class_id'] : null;

        // If caller didn't explicitly request drafts, hide unpublished announcements for non-admins.
        // However, allow authenticated users to see their own drafts by leaving isPublished=null
        // so the repository can include (is_published = 1 OR author_id = :user_id).
        if ($isPublished === null && !$this->isAdmin($user) && empty($user['is_super_admin'])) {
            $userIdProvided = isset($user['user_id']) && $user['user_id'];
            if (!$userIdProvided) {
                $isPublished = true;
            }
        }

        $announcements = $this->announcementRepo->getAll($page, $limit, $targetRole, $isPublished, $institutionId, $userRole, $userId, $studentClassName, $studentClassCode, $studentClassId);
        $total = $this->announcementRepo->count($targetRole, $isPublished, $institutionId, $userRole, $userId, $studentClassName, $studentClassCode, $studentClassId);

        Response::success([
            'announcements' => $announcements,
            'pagination' => [
                'page' => $page,
                'limit' => $limit,
                'total' => $total,
                'pages' => ceil($total / $limit)
            ]
        ]);
    }

    private function isAdmin(array $user): bool
    {
        return !empty($user['is_super_admin']) || in_array('admin', $user['roles'] ?? []);
    }

    private function isTeacher(array $user): bool
    {
        return in_array('teacher', $user['roles'] ?? []);
    }

    private function canManageAnnouncement(array $user, array $announcement): bool
    {
        // Super admins may manage all
        if (!empty($user['is_super_admin'])) {
            return true;
        }

        // Authors can manage their own announcements
        if (isset($announcement['author_id']) && (string) $announcement['author_id'] === (string) ($user['user_id'] ?? '')) {
            return true;
        }

        // Teachers can manage only their own (covered by author check above)
        // Regular admins (non-super) should NOT manage announcements authored by teachers.
        return false;
    }

    /**
     * Get a single announcement
     * GET /api/announcements/{uuid}
     */
    public function show(array $user, string $uuid): void
    {
        $sanitizedUuid = UuidHelper::sanitize($uuid);
        if (!$sanitizedUuid) {
            Response::badRequest('Invalid UUID format');
            return;
        }

        $institutionId = $user['institution_id'] ?? null;
        $announcement = $this->announcementRepo->findByUuid(
            $sanitizedUuid,
            $institutionId,
            $user['role'] ?? null,
            $user['user_id'] ?? null,
            $user['class_name'] ?? null,
            $user['class_code'] ?? null,
            isset($user['class_id']) ? (int) $user['class_id'] : null
        );

        if (!$announcement) {
            Response::error('Announcement not found', 404);
            return;
        }

        // Do not expose unpublished announcements to non-authors/non-admins
        $isPublishedFlag = !empty($announcement['is_published']);
        $isAuthor = isset($announcement['author_id']) && (string)$announcement['author_id'] === (string)($user['user_id'] ?? '');
        if (!$isPublishedFlag && !$isAuthor && !$this->isAdmin($user) && empty($user['is_super_admin'])) {
            Response::error('Announcement not found', 404);
            return;
        }

        Response::success($announcement);
    }

    /**
     * Mark an announcement as read for the current user.
     * POST /api/announcements/{uuid}/read
     */
    public function markAsRead(array $user, string $uuid): void
    {
        $sanitizedUuid = UuidHelper::sanitize($uuid);
        if (!$sanitizedUuid) {
            Response::badRequest('Invalid UUID format');
            return;
        }

        $userId = (int) ($user['user_id'] ?? 0);
        if ($userId <= 0) {
            Response::error('Unauthorized', 403);
            return;
        }

        $institutionId = $user['institution_id'] ?? null;
        $announcement = $this->announcementRepo->findByUuid(
            $sanitizedUuid,
            $institutionId,
            $user['role'] ?? null,
            $userId,
            $user['class_name'] ?? null,
            $user['class_code'] ?? null,
            isset($user['class_id']) ? (int) $user['class_id'] : null
        );

        if (!$announcement) {
            Response::error('Announcement not found', 404);
            return;
        }

        // Prevent marking drafts as read by unauthorized users
        $isPublishedFlag = !empty($announcement['is_published']);
        $isAuthor = isset($announcement['author_id']) && (string)$announcement['author_id'] === (string)($user['user_id'] ?? '');
        if (!$isPublishedFlag && !$isAuthor && !$this->isAdmin($user) && empty($user['is_super_admin'])) {
            Response::error('Announcement not found', 404);
            return;
        }

        if (!$this->announcementRepo->markAsRead((int) $announcement['announcement_id'], $userId)) {
            Response::serverError('Failed to mark announcement as read');
            return;
        }

        $updated = $this->announcementRepo->findByUuid(
            $sanitizedUuid,
            $institutionId,
            $user['role'] ?? null,
            $userId,
            $user['class_name'] ?? null,
            $user['class_code'] ?? null,
            isset($user['class_id']) ? (int) $user['class_id'] : null
        );

        Response::success([
            'message' => 'Announcement marked as read',
            'announcement' => $updated ?: $announcement,
        ]);
    }

    /**
     * Create a new announcement (admin only)
     * POST /api/announcements
     */
    public function create(array $user): void
    {
        $isAdmin = $this->isAdmin($user);
        $isTeacher = $this->isTeacher($user);

        // Admins can create all announcements; teachers can create class announcements only.
        if (!$isAdmin && !$isTeacher) {
            Response::error('Unauthorized. Admin or teacher access required.', 403);
            return;
        }

        $data = json_decode(file_get_contents('php://input'), true);

        $validator = new Validator($data);
        $validator->required(['title']);

        if ($validator->fails()) {
            Response::validationError($validator->getErrors());
            return;
        }

        $targetRole = strtolower((string) ($data['target_role'] ?? 'all'));
        if ($isTeacher && $targetRole !== 'class') {
            Response::error('Unauthorized. Teachers can only create class announcements.', 403);
            return;
        }

        $data['uuid'] = UuidHelper::generate();
        $data['author_id'] = $user['user_id'];
        $data['institution_id'] = $user['institution_id'] ?? 1;
        if (!empty($data['is_published'])) {
            $data['published_at'] = $data['published_at'] ?? date('Y-m-d H:i:s');
        } else {
            $data['published_at'] = null;
        }

        $announcementId = $this->announcementRepo->create($data);

        if (!empty($data['is_published'])) {
            $this->sendPublishedAnnouncementNotifications($data);
        }

        Response::success([
            'message' => 'Announcement created successfully',
            'announcement_id' => $announcementId,
            'announcement_uuid' => $data['uuid']
        ], 'Announcement created successfully', 201);
    }

    /**
     * Update an announcement (admin only)
     * PUT /api/announcements/{uuid}
     */
    public function update(array $user, string $uuid): void
    {
        $sanitizedUuid = UuidHelper::sanitize($uuid);
        if (!$sanitizedUuid) {
            Response::badRequest('Invalid UUID format');
            return;
        }

        $institutionId = $user['institution_id'] ?? null;
        $announcement = $this->announcementRepo->findByUuid(
            $sanitizedUuid,
            $institutionId,
            $user['role'] ?? null,
            $user['user_id'] ?? null,
            $user['class_name'] ?? null,
            $user['class_code'] ?? null,
            isset($user['class_id']) ? (int) $user['class_id'] : null
        );

        if (!$announcement) {
            Response::error('Announcement not found', 404);
            return;
        }

        if (!$this->canManageAnnouncement($user, $announcement)) {
            Response::error('Unauthorized. You can only manage your own announcements.', 403);
            return;
        }

        $announcementId = $announcement['announcement_id'];

        $data = json_decode(file_get_contents('php://input'), true);

        $validator = new Validator($data);
        // No required fields for update

        if ($validator->fails()) {
            Response::validationError($validator->getErrors());
            return;
        }

        $wasPublished = !empty($announcement['is_published']);
        $willBePublished = array_key_exists('is_published', $data)
            ? (bool) $data['is_published']
            : $wasPublished;

        // If unpublishing (is_published = 0), set published_at to NULL
        if (isset($data['is_published']) && !$data['is_published']) {
            $data['published_at'] = null;
        } elseif (!empty($data['is_published']) && empty($data['published_at'])) {
            $data['published_at'] = date('Y-m-d H:i:s');
        }

        if (!$this->isAdmin($user) && isset($data['target_role']) && strtolower((string) $data['target_role']) !== 'class') {
            Response::error('Unauthorized. Teachers can only manage class announcements.', 403);
            return;
        }

        $this->announcementRepo->update($announcementId, $data);

        if (!$wasPublished && $willBePublished) {
            $notificationAnnouncement = array_merge($announcement, $data);
            $notificationAnnouncement['announcement_id'] = $announcementId;
            $this->sendPublishedAnnouncementNotifications($notificationAnnouncement);
        }

        Response::success(['message' => 'Announcement updated successfully']);
    }

    /**
     * Delete an announcement (admin only)
     * DELETE /api/announcements/{uuid}
     */
    public function delete(array $user, string $uuid): void
    {
        $sanitizedUuid = UuidHelper::sanitize($uuid);
        if (!$sanitizedUuid) {
            Response::badRequest('Invalid UUID format');
            return;
        }

        $institutionId = $user['institution_id'] ?? null;
        $announcement = $this->announcementRepo->findByUuid(
            $sanitizedUuid,
            $institutionId,
            $user['role'] ?? null,
            $user['user_id'] ?? null,
            $user['class_name'] ?? null,
            $user['class_code'] ?? null,
            isset($user['class_id']) ? (int) $user['class_id'] : null
        );

        if (!$announcement) {
            Response::error('Announcement not found', 404);
            return;
        }

        if (!$this->canManageAnnouncement($user, $announcement)) {
            Response::error('Unauthorized. You can only delete your own announcements.', 403);
            return;
        }

        $announcementId = $announcement['announcement_id'];

        $this->announcementRepo->delete($announcementId);

        Response::success(['message' => 'Announcement deleted successfully']);
    }

    /**
     * Send notifications for a published announcement to the institution
     */
    private function sendPublishedAnnouncementNotifications(array $announcement): void
    {
        $institutionId = (int) ($announcement['institution_id'] ?? 0);
        $authorId = (int) ($announcement['author_id'] ?? 0);

        if ($institutionId <= 0) {
            return;
        }

        $title = trim((string) ($announcement['title'] ?? ''));
        $message = $title !== ''
            ? 'New announcement published: ' . $title
            : 'A new announcement has been published.';

        try {
            // Create a single institution-scoped notification
            $this->notificationRepo->create([
                'sender_id' => $authorId > 0 ? $authorId : 0,
                'institution_id' => $institutionId,
                'target_role' => $announcement['target_role'] ?? null,
                'title' => 'Announcement Published',
                'message' => $message,
                'notification_type' => 'announcement',
            ]);
        } catch (\Throwable $e) {
            error_log('Announcement notification error: ' . $e->getMessage());
        }
    }

    /**
     * Upload attachment for an announcement
     * POST /api/announcements/{uuid}/attachments
     */
    public function uploadAttachment(array $user, string $uuid): void
    {
        $sanitizedUuid = UuidHelper::sanitize($uuid);
        if (!$sanitizedUuid) {
            Response::badRequest('Invalid UUID format');
            return;
        }

        $institutionId = $user['institution_id'] ?? null;
        $announcement = $this->announcementRepo->findByUuid(
            $sanitizedUuid,
            $institutionId,
            $user['role'] ?? null,
            $user['user_id'] ?? null
        );
        if (!$announcement) {
            Response::error('Announcement not found', 404);
            return;
        }

        if (!$this->canManageAnnouncement($user, $announcement)) {
            Response::error('Unauthorized. You can only upload attachments to your own announcements.', 403);
            return;
        }

        if (!isset($_FILES['file'])) {
            Response::error('No file uploaded', 400);
            return;
        }

        $file = $_FILES['file'];
        if ($file['error'] !== UPLOAD_ERR_OK) {
            Response::error('File upload error', 400);
            return;
        }

        // Basic file size check (50MB)
        if ($file['size'] > 50 * 1024 * 1024) {
            Response::error('File size exceeds 50MB limit', 400);
            return;
        }

        try {
            $projectRoot = dirname(__DIR__, 2);
            $uploadDir = $projectRoot . '/uploads/announcements/' . $sanitizedUuid . '/';
            if (!file_exists($uploadDir)) {
                mkdir($uploadDir, 0777, true);
            }

            $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
            $safeName = preg_replace('/[^A-Za-z0-9_\-.]/', '_', pathinfo($file['name'], PATHINFO_FILENAME));
            $filename = uniqid() . '_' . time() . '_' . $safeName . ($ext ? '.' . $ext : '');
            $destination = $uploadDir . $filename;

            if (!move_uploaded_file($file['tmp_name'], $destination)) {
                Response::error('Failed to save uploaded file', 500);
                return;
            }

            $fileData = [
                'original_name' => $file['name'],
                'filename' => $filename,
                'size' => $file['size'],
                'type' => $file['type'],
                'url' => '/uploads/announcements/' . $sanitizedUuid . '/' . $filename,
                'uploaded_at' => date('Y-m-d H:i:s')
            ];

            $this->announcementRepo->addAttachment((int)$announcement['announcement_id'], $fileData);

            Response::success(['file' => $fileData], 'File uploaded and attached to announcement');
        } catch (\Exception $e) {
            Response::serverError('Failed to upload attachment: ' . $e->getMessage());
        }
    }
}
