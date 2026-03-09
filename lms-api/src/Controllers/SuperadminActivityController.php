<?php

namespace App\Controllers;

use App\Repositories\SuperadminActivityRepository;
use App\Utils\Response;

class SuperadminActivityController
{
    private SuperadminActivityRepository $repo;

    public function __construct()
    {
        $this->repo = new SuperadminActivityRepository();
    }

    // -------------------------------------------------------------------------
    // Authorization helper
    // -------------------------------------------------------------------------

    private function requireSuperAdmin(array $user): bool
    {
        if (empty($user['is_super_admin']) || $user['is_super_admin'] != 1) {
            Response::forbidden('Super admin access required');
            return false;
        }
        return true;
    }

    // -------------------------------------------------------------------------
    // GET /superadmin-activity
    // -------------------------------------------------------------------------

    /**
     * Paginated list with optional filters.
     *
     * Query params: performed_by, activity_type, entity_type, entity_id,
     *               severity, start_date, end_date, page, limit
     */
    public function index(array $user): void
    {
        if (!$this->requireSuperAdmin($user)) return;

        try {
            $page   = max(1, (int) ($_GET['page']  ?? 1));
            $limit  = min(100, max(1, (int) ($_GET['limit'] ?? 25)));
            $offset = ($page - 1) * $limit;

            $filters = $this->buildFilters();

            $activities = $this->repo->getAll($filters, $limit, $offset);
            $total      = $this->repo->count($filters);

            Response::success([
                'activities' => $activities,
                'pagination' => [
                    'total' => $total,
                    'page'  => $page,
                    'limit' => $limit,
                    'pages' => (int) ceil($total / $limit),
                ],
            ]);
        } catch (\Exception $e) {
            error_log('SuperadminActivity index error: ' . $e->getMessage());
            Response::serverError('Failed to fetch activities');
        }
    }

    // -------------------------------------------------------------------------
    // POST /superadmin-activity
    // -------------------------------------------------------------------------

    /**
     * Log a new superadmin activity.
     *
     * Body fields: activity_type*, description*, entity_type, entity_id,
     *              meta, severity
     */
    public function store(array $user): void
    {
        if (!$this->requireSuperAdmin($user)) return;

        try {
            $body = $this->parseBody();

            $errors = [];
            if (empty($body['activity_type'])) {
                $errors['activity_type'] = 'Activity type is required';
            }
            if (empty($body['description'])) {
                $errors['description'] = 'Description is required';
            }

            $allowedSeverities = ['info', 'warning', 'critical'];
            if (!empty($body['severity']) && !in_array($body['severity'], $allowedSeverities, true)) {
                $errors['severity'] = 'Severity must be info, warning, or critical';
            }

            if (!empty($errors)) {
                Response::validationError($errors);
                return;
            }

            $activityId = $this->repo->create([
                'performed_by'  => $user['user_id'],
                'activity_type' => $body['activity_type'],
                'description'   => $body['description'],
                'entity_type'   => $body['entity_type'] ?? null,
                'entity_id'     => isset($body['entity_id']) ? (int) $body['entity_id'] : null,
                'meta'          => $body['meta'] ?? null,
                'ip_address'    => $_SERVER['REMOTE_ADDR'] ?? null,
                'user_agent'    => $_SERVER['HTTP_USER_AGENT'] ?? null,
                'severity'      => $body['severity'] ?? 'info',
            ]);

            Response::success(['activity_id' => $activityId], 'Activity logged successfully');
        } catch (\Exception $e) {
            error_log('SuperadminActivity store error: ' . $e->getMessage());
            Response::serverError('Failed to log activity');
        }
    }

    // -------------------------------------------------------------------------
    // GET /superadmin-activity/{id}
    // -------------------------------------------------------------------------

    public function show(array $user, int $id): void
    {
        if (!$this->requireSuperAdmin($user)) return;

        try {
            $activity = $this->repo->findById($id);

            if (!$activity) {
                Response::notFound('Activity not found');
                return;
            }

            Response::success($activity);
        } catch (\Exception $e) {
            error_log('SuperadminActivity show error: ' . $e->getMessage());
            Response::serverError('Failed to fetch activity');
        }
    }

    // -------------------------------------------------------------------------
    // GET /superadmin-activity/recent?limit=10
    // -------------------------------------------------------------------------

    public function recent(array $user): void
    {
        if (!$this->requireSuperAdmin($user)) return;

        try {
            $limit = min(50, max(1, (int) ($_GET['limit'] ?? 10)));

            Response::success($this->repo->getRecent($limit));
        } catch (\Exception $e) {
            error_log('SuperadminActivity recent error: ' . $e->getMessage());
            Response::serverError('Failed to fetch recent activities');
        }
    }

    // -------------------------------------------------------------------------
    // GET /superadmin-activity/type/{type}?page=1&limit=25
    // -------------------------------------------------------------------------

    public function byType(array $user, string $type): void
    {
        if (!$this->requireSuperAdmin($user)) return;

        try {
            $page   = max(1, (int) ($_GET['page']  ?? 1));
            $limit  = min(100, max(1, (int) ($_GET['limit'] ?? 25)));
            $offset = ($page - 1) * $limit;

            Response::success($this->repo->getByType($type, $limit, $offset));
        } catch (\Exception $e) {
            error_log('SuperadminActivity byType error: ' . $e->getMessage());
            Response::serverError('Failed to fetch activities by type');
        }
    }

    // -------------------------------------------------------------------------
    // GET /superadmin-activity/severity/{severity}?page=1&limit=25
    // -------------------------------------------------------------------------

    public function bySeverity(array $user, string $severity): void
    {
        if (!$this->requireSuperAdmin($user)) return;

        try {
            $allowed = ['info', 'warning', 'critical'];
            if (!in_array($severity, $allowed, true)) {
                Response::badRequest('Severity must be info, warning, or critical');
                return;
            }

            $page   = max(1, (int) ($_GET['page']  ?? 1));
            $limit  = min(100, max(1, (int) ($_GET['limit'] ?? 25)));
            $offset = ($page - 1) * $limit;

            Response::success($this->repo->getBySeverity($severity, $limit, $offset));
        } catch (\Exception $e) {
            error_log('SuperadminActivity bySeverity error: ' . $e->getMessage());
            Response::serverError('Failed to fetch activities by severity');
        }
    }

    // -------------------------------------------------------------------------
    // GET /superadmin-activity/performer/{userId}?page=1&limit=25
    // -------------------------------------------------------------------------

    public function byPerformer(array $user, int $userId): void
    {
        if (!$this->requireSuperAdmin($user)) return;

        try {
            $page   = max(1, (int) ($_GET['page']  ?? 1));
            $limit  = min(100, max(1, (int) ($_GET['limit'] ?? 25)));
            $offset = ($page - 1) * $limit;

            Response::success($this->repo->getByPerformer($userId, $limit, $offset));
        } catch (\Exception $e) {
            error_log('SuperadminActivity byPerformer error: ' . $e->getMessage());
            Response::serverError('Failed to fetch performer activities');
        }
    }

    // -------------------------------------------------------------------------
    // GET /superadmin-activity/stats
    // -------------------------------------------------------------------------

    public function stats(array $user): void
    {
        if (!$this->requireSuperAdmin($user)) return;

        try {
            Response::success($this->repo->getStats());
        } catch (\Exception $e) {
            error_log('SuperadminActivity stats error: ' . $e->getMessage());
            Response::serverError('Failed to fetch activity statistics');
        }
    }

    // -------------------------------------------------------------------------
    // DELETE /superadmin-activity/cleanup?days=90
    // -------------------------------------------------------------------------

    public function cleanup(array $user): void
    {
        if (!$this->requireSuperAdmin($user)) return;

        try {
            $days = max(1, (int) ($_GET['days'] ?? 90));
            $deleted = $this->repo->deleteOlderThan($days);

            Response::success(
                ['deleted_count' => $deleted],
                "Deleted {$deleted} activit" . ($deleted === 1 ? 'y' : 'ies') . " older than {$days} day(s)"
            );
        } catch (\Exception $e) {
            error_log('SuperadminActivity cleanup error: ' . $e->getMessage());
            Response::serverError('Failed to cleanup activities');
        }
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private function buildFilters(): array
    {
        $filters = [];

        if (!empty($_GET['performed_by']))  $filters['performed_by']  = (int) $_GET['performed_by'];
        if (!empty($_GET['activity_type'])) $filters['activity_type'] = $_GET['activity_type'];
        if (!empty($_GET['entity_type']))   $filters['entity_type']   = $_GET['entity_type'];
        if (!empty($_GET['entity_id']))     $filters['entity_id']     = (int) $_GET['entity_id'];
        if (!empty($_GET['severity']))      $filters['severity']      = $_GET['severity'];
        if (!empty($_GET['start_date']))    $filters['start_date']    = $_GET['start_date'];
        if (!empty($_GET['end_date']))      $filters['end_date']      = $_GET['end_date'];

        return $filters;
    }

    private function parseBody(): array
    {
        $contentType = $_SERVER['CONTENT_TYPE'] ?? '';

        if (str_contains($contentType, 'application/json')) {
            $raw = file_get_contents('php://input');
            return json_decode($raw, true) ?? [];
        }

        return $_POST;
    }
}
