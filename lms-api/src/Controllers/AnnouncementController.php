<?php

namespace App\Controllers;

use App\Repositories\AnnouncementRepository;
use App\Utils\Response;
use App\Utils\Validator;

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
    public function index(): void
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
     * GET /api/announcements/{id}
     */
    public function show(int $id): void
    {
        $announcement = $this->announcementRepo->findById($id);

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
    public function create(): void
    {
        $roleId = $_SESSION['user']['role_id'];

        // Only admins can create announcements
        if ($roleId !== 1) {
            Response::error('Unauthorized. Admin access required.', 403);
            return;
        }

        $data = json_decode(file_get_contents('php://input'), true);

        $errors = Validator::validate($data, [
            'title' => 'required|string|max:200',
            'content' => 'string',
            'target_role' => 'string|in:all,admin,teacher,student,parent',
            'is_published' => 'boolean',
            'published_at' => 'datetime',
            'expires_at' => 'datetime'
        ]);

        if (!empty($errors)) {
            Response::error('Validation failed', 400, $errors);
            return;
        }

        $data['author_id'] = $_SESSION['user']['user_id'];

        $announcementId = $this->announcementRepo->create($data);

        Response::success([
            'message' => 'Announcement created successfully',
            'announcement_id' => $announcementId
        ], 201);
    }

    /**
     * Update an announcement (admin only)
     * PUT /api/announcements/{id}
     */
    public function update(int $id): void
    {
        $roleId = $_SESSION['user']['role_id'];

        // Only admins can update announcements
        if ($roleId !== 1) {
            Response::error('Unauthorized. Admin access required.', 403);
            return;
        }

        $announcement = $this->announcementRepo->findById($id);

        if (!$announcement) {
            Response::error('Announcement not found', 404);
            return;
        }

        $data = json_decode(file_get_contents('php://input'), true);

        $errors = Validator::validate($data, [
            'title' => 'string|max:200',
            'content' => 'string',
            'target_role' => 'string|in:all,admin,teacher,student,parent',
            'is_published' => 'boolean',
            'published_at' => 'datetime',
            'expires_at' => 'datetime'
        ]);

        if (!empty($errors)) {
            Response::error('Validation failed', 400, $errors);
            return;
        }

        $this->announcementRepo->update($id, $data);

        Response::success(['message' => 'Announcement updated successfully']);
    }

    /**
     * Delete an announcement (admin only)
     * DELETE /api/announcements/{id}
     */
    public function delete(int $id): void
    {
        $roleId = $_SESSION['user']['role_id'];

        // Only admins can delete announcements
        if ($roleId !== 1) {
            Response::error('Unauthorized. Admin access required.', 403);
            return;
        }

        $announcement = $this->announcementRepo->findById($id);

        if (!$announcement) {
            Response::error('Announcement not found', 404);
            return;
        }

        $this->announcementRepo->delete($id);

        Response::success(['message' => 'Announcement deleted successfully']);
    }
}
