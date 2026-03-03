<?php

namespace App\Controllers;

use App\Repositories\UserActivityRepository;

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
    public function index($request)
    {
        try {
            $userId = $request['query']['user_id'] ?? null;
            $action = $request['query']['action'] ?? null;
            $startDate = $request['query']['start_date'] ?? null;
            $endDate = $request['query']['end_date'] ?? null;
            $institutionId = $request['query']['institution_id'] ?? null;
            $page = $request['query']['page'] ?? 1;
            $limit = $request['query']['limit'] ?? 50;
            $offset = ($page - 1) * $limit;

            $filters = [];
            if ($userId) $filters['user_id'] = $userId;
            if ($action) $filters['action'] = $action;
            if ($startDate) $filters['start_date'] = $startDate;
            if ($endDate) $filters['end_date'] = $endDate;
            if ($institutionId) $filters['institution_id'] = $institutionId;

            $activities = $this->userActivityRepository->getAll($filters, $limit, $offset);
            $total = $this->userActivityRepository->count($filters);

            return [
                'success' => true,
                'data' => $activities,
                'pagination' => [
                    'total' => $total,
                    'page' => (int)$page,
                    'limit' => (int)$limit,
                    'pages' => ceil($total / $limit)
                ]
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => 'Failed to fetch user activities',
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Get single activity
     * GET /user-activity/{id}
     */
    public function show($request)
    {
        try {
            $id = $request['params']['id'];
            $activity = $this->userActivityRepository->findById($id);

            if (!$activity) {
                return [
                    'success' => false,
                    'message' => 'Activity not found'
                ];
            }

            return [
                'success' => true,
                'data' => $activity
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => 'Failed to fetch activity',
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Log user activity
     * POST /user-activity
     */
    public function log($request)
    {
        try {
            $data = $request['body'];

            // Validate required fields
            $required = ['user_id', 'action', 'entity_type'];
            foreach ($required as $field) {
                if (empty($data[$field])) {
                    return [
                        'success' => false,
                        'message' => ucfirst(str_replace('_', ' ', $field)) . ' is required'
                    ];
                }
            }

            $activityId = $this->userActivityRepository->create($data);

            return [
                'success' => true,
                'message' => 'Activity logged successfully',
                'data' => ['id' => $activityId]
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => 'Failed to log activity',
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Get user's activity history
     * GET /user-activity/user/{userId}?limit=100
     */
    public function getUserHistory($request)
    {
        try {
            $userId = $request['params']['userId'];
            $limit = $request['query']['limit'] ?? 100;
            $offset = $request['query']['offset'] ?? 0;

            $activities = $this->userActivityRepository->getUserHistory($userId, $limit, $offset);

            return [
                'success' => true,
                'data' => $activities
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => 'Failed to fetch user history',
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Get recent activities
     * GET /user-activity/recent?institution_id=1&limit=50
     */
    public function getRecent($request)
    {
        try {
            $institutionId = $request['query']['institution_id'] ?? null;
            $limit = $request['query']['limit'] ?? 50;

            $activities = $this->userActivityRepository->getRecent($institutionId, $limit);

            return [
                'success' => true,
                'data' => $activities
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => 'Failed to fetch recent activities',
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Get activities by action
     * GET /user-activity/action/{action}?institution_id=1
     */
    public function getByAction($request)
    {
        try {
            $action = $request['params']['action'];
            $institutionId = $request['query']['institution_id'] ?? null;
            $limit = $request['query']['limit'] ?? 100;

            $activities = $this->userActivityRepository->getByAction($action, $institutionId, $limit);

            return [
                'success' => true,
                'data' => $activities
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => 'Failed to fetch activities',
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Get activity statistics
     * GET /user-activity/stats?institution_id=1&start_date=2024-01-01&end_date=2024-12-31
     */
    public function getStatistics($request)
    {
        try {
            $institutionId = $request['query']['institution_id'] ?? null;
            $startDate = $request['query']['start_date'] ?? null;
            $endDate = $request['query']['end_date'] ?? null;

            $stats = $this->userActivityRepository->getStatistics($institutionId, $startDate, $endDate);

            return [
                'success' => true,
                'data' => $stats
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => 'Failed to fetch statistics',
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Get activities by entity
     * GET /user-activity/entity/{entityType}/{entityId}
     */
    public function getByEntity($request)
    {
        try {
            $entityType = $request['params']['entityType'];
            $entityId = $request['params']['entityId'];
            $limit = $request['query']['limit'] ?? 50;

            $activities = $this->userActivityRepository->getByEntity($entityType, $entityId, $limit);

            return [
                'success' => true,
                'data' => $activities
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => 'Failed to fetch entity activities',
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Delete old activities (cleanup)
     * DELETE /user-activity/cleanup?days=90
     */
    public function cleanup($request)
    {
        try {
            $days = $request['query']['days'] ?? 90;

            $deleted = $this->userActivityRepository->deleteOlderThan($days);

            return [
                'success' => true,
                'message' => "Deleted {$deleted} old activities",
                'data' => ['deleted_count' => $deleted]
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => 'Failed to cleanup activities',
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Get audit trail for specific date range
     * GET /user-activity/audit-trail?start_date=2024-01-01&end_date=2024-01-31&institution_id=1
     */
    public function getAuditTrail($request)
    {
        try {
            $startDate = $request['query']['start_date'] ?? date('Y-m-01');
            $endDate = $request['query']['end_date'] ?? date('Y-m-t');
            $institutionId = $request['query']['institution_id'] ?? null;
            $action = $request['query']['action'] ?? null;

            $auditTrail = $this->userActivityRepository->getAuditTrail($startDate, $endDate, $institutionId, $action);

            return [
                'success' => true,
                'data' => $auditTrail
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => 'Failed to fetch audit trail',
                'error' => $e->getMessage()
            ];
        }
    }
}
