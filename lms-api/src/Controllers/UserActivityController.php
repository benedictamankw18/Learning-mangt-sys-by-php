<?php

namespace App\Controllers;

use App\Repositories\UserActivityRepository;
use App\Utils\Response;

class UserActivityController
{
    private $userActivityRepository;

    public function __construct()
    {
        $this->userActivityRepository = new UserActivityRepository();
    }

    /**
     * Get all user activities
     * GET /user-activity?user_id=1&action=login&start_date=2024-01-01&end_date=2024-12-31
     */
    public function index(array $user): void
    {
        try {
            $userId = $_GET['user_id'] ?? null;
            $action = $_GET['action'] ?? null;
            $startDate = $_GET['start_date'] ?? null;
            $endDate = $_GET['end_date'] ?? null;
            $institutionId = $_GET['institution_id'] ?? null;
            $page = $_GET['page'] ?? 1;
            $limit = $_GET['limit'] ?? 50;
            $offset = ($page - 1) * $limit;

            $filters = [];
            if ($userId)
                $filters['user_id'] = $userId;
            if ($action)
                $filters['action'] = $action;
            if ($startDate)
                $filters['start_date'] = $startDate;
            if ($endDate)
                $filters['end_date'] = $endDate;
            if ($institutionId)
                $filters['institution_id'] = $institutionId;

            $activities = $this->userActivityRepository->getAll($filters, $limit, $offset);
            $total = $this->userActivityRepository->count($filters);

            Response::success([
                'activities' => $activities,
                'pagination' => [
                    'total' => $total,
                    'page' => (int) $page,
                    'limit' => (int) $limit,
                    'pages' => ceil($total / $limit)
                ]
            ]);
        } catch (\Exception $e) {
            Response::serverError('Failed to fetch user activities: ' . $e->getMessage());
        }
    }

    /**
     * Get single activity
     * GET /user-activity/{id}
     */
    public function show(array $user, int $id): void
    {
        try {
            $activity = $this->userActivityRepository->findById($id);

            if (!$activity) {
                Response::notFound('Activity not found');
                return;
            }

            Response::success($activity);
        } catch (\Exception $e) {
            Response::serverError('Failed to fetch activity: ' . $e->getMessage());
        }
    }

    /**
     * Log user activity
     * POST /user-activity
     */
    public function log(array $user): void
    {
        try {
            $data = $_POST;

            // Validate required fields
            $required = ['user_id', 'action', 'entity_type'];
            $errors = [];
            foreach ($required as $field) {
                if (empty($data[$field])) {
                    $errors[$field] = ucfirst(str_replace('_', ' ', $field)) . ' is required';
                }
            }

            if (!empty($errors)) {
                Response::validationError($errors);
                return;
            }

            $activityId = $this->userActivityRepository->create($data);

            Response::success(['id' => $activityId], 'Activity logged successfully');
        } catch (\Exception $e) {
            Response::serverError('Failed to log activity: ' . $e->getMessage());
        }
    }

    /**
     * Get user's activity history
     * GET /user-activity/user/{userId}?limit=100
     */
    public function getUserHistory(array $user, int $userId): void
    {
        try {
            $limit = $_GET['limit'] ?? 100;
            $offset = $_GET['offset'] ?? 0;

            $activities = $this->userActivityRepository->getUserHistory($userId, $limit, $offset);

            Response::success($activities);
        } catch (\Exception $e) {
            Response::serverError('Failed to fetch user history: ' . $e->getMessage());
        }
    }

    /**
     * Get recent activities
     * GET /user-activity/recent?institution_id=1&limit=50
     */
    public function getRecent(array $user): void
    {
        try {
            $institutionId = $_GET['institution_id'] ?? null;
            $limit = $_GET['limit'] ?? 50;

            $activities = $this->userActivityRepository->getRecent($institutionId, $limit);

            Response::success($activities);
        } catch (\Exception $e) {
            Response::serverError('Failed to fetch recent activities: ' . $e->getMessage());
        }
    }

    /**
     * Get activities by action
     * GET /user-activity/action/{action}?institution_id=1
     */
    public function getByAction(array $user, string $action): void
    {
        try {
            $institutionId = $_GET['institution_id'] ?? null;
            $limit = $_GET['limit'] ?? 100;

            $activities = $this->userActivityRepository->getByAction($action, $institutionId, $limit);

            Response::success($activities);
        } catch (\Exception $e) {
            Response::serverError('Failed to fetch activities: ' . $e->getMessage());
        }
    }

    /**
     * Get activity statistics
     * GET /user-activity/stats?institution_id=1&start_date=2024-01-01&end_date=2024-12-31
     */
    public function getStatistics(array $user): void
    {
        try {
            $institutionId = $_GET['institution_id'] ?? null;
            $startDate = $_GET['start_date'] ?? null;
            $endDate = $_GET['end_date'] ?? null;

            $stats = $this->userActivityRepository->getStatistics($institutionId, $startDate, $endDate);

            Response::success($stats);
        } catch (\Exception $e) {
            Response::serverError('Failed to fetch statistics: ' . $e->getMessage());
        }
    }

    /**
     * Get activities by entity
     * GET /user-activity/entity/{entityType}/{entityId}
     */
    public function getByEntity(array $user, string $entityType, int $entityId): void
    {
        try {
            $limit = $_GET['limit'] ?? 50;

            $activities = $this->userActivityRepository->getByEntity($entityType, $entityId, $limit);

            Response::success($activities);
        } catch (\Exception $e) {
            Response::serverError('Failed to fetch entity activities: ' . $e->getMessage());
        }
    }

    /**
     * Delete old activities (cleanup)
     * DELETE /user-activity/cleanup?days=90
     */
    public function cleanup(array $user): void
    {
        try {
            $days = $_GET['days'] ?? 90;

            $deleted = $this->userActivityRepository->deleteOlderThan($days);

            Response::success(['deleted_count' => $deleted], "Deleted {$deleted} old activities");
        } catch (\Exception $e) {
            Response::serverError('Failed to cleanup activities: ' . $e->getMessage());
        }
    }

    /**
     * Get audit trail for specific date range
     * GET /user-activity/audit-trail?start_date=2024-01-01&end_date=2024-01-31&institution_id=1
     */
    public function getAuditTrail(array $user): void
    {
        try {
            $startDate = $_GET['start_date'] ?? date('Y-m-01');
            $endDate = $_GET['end_date'] ?? date('Y-m-t');
            $institutionId = $_GET['institution_id'] ?? null;
            $action = $_GET['action'] ?? null;

            $auditTrail = $this->userActivityRepository->getAuditTrail($startDate, $endDate, $institutionId, $action);

            Response::success($auditTrail);
        } catch (\Exception $e) {
            Response::serverError('Failed to fetch audit trail: ' . $e->getMessage());
        }
    }
}
