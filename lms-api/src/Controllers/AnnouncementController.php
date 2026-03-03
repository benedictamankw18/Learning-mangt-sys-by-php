<?php

namespace App\Controllers;

use App\Repositories\AnnouncementRepository;
use App\Utils\Response;
use App\Utils\Validator;
use App\Utils\UuidHelper;

class AnnouncementController
{
    private AnnouncementRepository $announcementRepo;

    public function __construct()
    {
        $this->announcementRepo = new AnnouncementRepository();
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

        $announcements = $this->announcementRepo->getAll($page, $limit, $targetRole, $isPublished);
        $total = $this->announcementRepo->count($targetRole, $isPublished);

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

        $announcement = $this->announcementRepo->findByUuid($sanitizedUuid);

        if (!$announcement) {
            Response::error('Announcement not found', 404);
            return;
        }

        Response::success($announcement);
    }

    /**
     * Create a new announcement (admin only)
     * POST /api/announcements
     */
    public function create(array $user): void
    {
        $roleId = $user['role_id'];

        // Only admins can create announcements
        if ($roleId !== 1) {
            Response::error('Unauthorized. Admin access required.', 403);
            return;
        }

        $data = json_decode(file_get_contents('php://input'), true);

        $validator = new Validator($data);
        $validator->required(['title']);

        if ($validator->fails()) {
            Response::validationError($validator->getErrors());
            return;
        }

        $data['author_id'] = $user['user_id'];

        $announcementId = $this->announcementRepo->create($data);

        Response::success([
            'message' => 'Announcement created successfully',
            'announcement_id' => $announcementId
        ], 201);
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

        $roleId = $user['role_id'];

        // Only admins can update announcements
        if ($roleId !== 1) {
            Response::error('Unauthorized. Admin access required.', 403);
            return;
        }

        $announcement = $this->announcementRepo->findByUuid($sanitizedUuid);

        if (!$announcement) {
            Response::error('Announcement not found', 404);
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

        $this->announcementRepo->update($announcementId, $data);

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

        $roleId = $user['role_id'];

        // Only admins can delete announcements
        if ($roleId !== 1) {
            Response::error('Unauthorized. Admin access required.', 403);
            return;
        }

        $announcement = $this->announcementRepo->findByUuid($sanitizedUuid);

        if (!$announcement) {
            Response::error('Announcement not found', 404);
            return;
        }

        $announcementId = $announcement['announcement_id'];

        $this->announcementRepo->delete($announcementId);

        Response::success(['message' => 'Announcement deleted successfully']);
    }
}
