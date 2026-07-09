<?php

namespace App\Controllers;

use App\Repositories\ErrorLogRepository;
use App\Utils\Response;
use App\Utils\Validator;
use App\Middleware\RoleMiddleware;

class ErrorLogController
{
    private $repo;

    public function __construct()
    {
        $this->repo = new ErrorLogRepository();
    }

    /**
     * Get all error logs (Admin only)
     * GET /error-logs
     */
    public function index(array $user): void
    {
        $roleMiddleware = new RoleMiddleware($user);
        if (!$roleMiddleware->requireRole(['admin', 'super_admin'])) {
            return;
        }

        $page = isset($_GET['page']) ? (int) $_GET['page'] : 1;
        $limit = isset($_GET['limit']) ? (int) $_GET['limit'] : 20;

        $filters = [];
        if (isset($_GET['severity_level'])) {
            $filters['severity_level'] = $_GET['severity_level'];
        }
        if (isset($_GET['is_resolved'])) {
            $filters['is_resolved'] = (int) $_GET['is_resolved'];
        }
        if (isset($_GET['source'])) {
            $filters['source'] = $_GET['source'];
        }
        if (isset($_GET['from_date'])) {
            $filters['from_date'] = $_GET['from_date'];
        }
        if (isset($_GET['to_date'])) {
            $filters['to_date'] = $_GET['to_date'];
        }

        $errors = $this->repo->getAll($page, $limit, $filters);
        $total = $this->repo->count($filters);

        Response::success([
            'data' => $errors,
            'pagination' => [
                'current_page' => $page,
                'per_page' => $limit,
                'total' => $total,
                'total_pages' => ceil($total / $limit)
            ]
        ]);
    }

    /**
     * Get single error log (Admin only)
     * GET /error-logs/{id}
     */
    public function show(array $user, int $id): void
    {
        $roleMiddleware = new RoleMiddleware($user);
        if (!$roleMiddleware->requireRole(['admin', 'super_admin'])) {
            return;
        }

        $error = $this->repo->findById($id);

        if (!$error) {
            Response::notFound('Error log not found');
            return;
        }

        Response::success(['data' => $error]);
    }

    /**
     * Create error log (Internal use or Admin)
     * POST /error-logs
     */
    public function create(array $user): void
    {
        $roleMiddleware = new RoleMiddleware($user);
        if (!$roleMiddleware->requireRole(['admin', 'super_admin'])) {
            return;
        }

        $data = json_decode(file_get_contents('php://input'), true);

        $validator = new Validator($data);
        $validator->required(['error_message'])
            ->in('severity_level', ['critical', 'error', 'warning', 'info', 'debug'])
            ->max('source', 200);

        if ($validator->fails()) {
            Response::validationError($validator->getErrors());
            return;
        }

        // Add request metadata
        $data['ip_address'] = $_SERVER['REMOTE_ADDR'] ?? null;
        $data['user_id'] = $user['user_id'];

        $errorId = $this->repo->create($data);

        if ($errorId) {
            Response::success([
                'message' => 'Error log created successfully',
                'error_log_id' => $errorId
            ], 201);
        } else {
            Response::serverError('Failed to create error log');
        }
    }

    /**
     * Mark error as resolved (Admin only)
     * PUT /error-logs/{id}/resolve
     */
    public function markResolved(array $user, int $id): void
    {
        $roleMiddleware = new RoleMiddleware($user);
        if (!$roleMiddleware->requireRole(['admin', 'super_admin'])) {
            return;
        }

        $error = $this->repo->findById($id);

        if (!$error) {
            Response::notFound('Error log not found');
            return;
        }

        if ($error['is_resolved']) {
            Response::error('Error log already resolved', 400);
            return;
        }

        $success = $this->repo->markResolved($id, $user['user_id']);

        if ($success) {
            Response::success(['message' => 'Error log marked as resolved']);
        } else {
            Response::serverError('Failed to mark error as resolved');
        }
    }

    /**
     * Delete error log (Admin only)
     * DELETE /error-logs/{id}
     */
    public function delete(array $user, int $id): void
    {
        $roleMiddleware = new RoleMiddleware($user);
        if (!$roleMiddleware->requireRole(['admin', 'super_admin'])) {
            return;
        }

        $error = $this->repo->findById($id);

        if (!$error) {
            Response::notFound('Error log not found');
            return;
        }

        $success = $this->repo->delete($id);

        if ($success) {
            Response::success(['message' => 'Error log deleted successfully']);
        } else {
            Response::serverError('Failed to delete error log');
        }
    }

    /**
     * Get unresolved errors (Admin only)
     * GET /error-logs/unresolved
     */
    public function getUnresolved(array $user): void
    {
        $roleMiddleware = new RoleMiddleware($user);
        if (!$roleMiddleware->requireRole(['admin', 'super_admin'])) {
            return;
        }

        $page = isset($_GET['page']) ? (int) $_GET['page'] : 1;
        $limit = isset($_GET['limit']) ? (int) $_GET['limit'] : 20;

        $errors = $this->repo->getUnresolved($page, $limit);
        $total = $this->repo->countUnresolved();

        Response::success([
            'data' => $errors,
            'pagination' => [
                'current_page' => $page,
                'per_page' => $limit,
                'total' => $total,
                'total_pages' => ceil($total / $limit)
            ]
        ]);
    }

    /**
     * Get errors by severity (Admin only)
     * GET /error-logs/severity/{severity}
     */
    public function getBySeverity(array $user, string $severity): void
    {
        $roleMiddleware = new RoleMiddleware($user);
        if (!$roleMiddleware->requireRole(['admin', 'super_admin'])) {
            return;
        }

        $page = isset($_GET['page']) ? (int) $_GET['page'] : 1;
        $limit = isset($_GET['limit']) ? (int) $_GET['limit'] : 20;

        $errors = $this->repo->getBySeverity($severity, $page, $limit);

        Response::success([
            'data' => $errors,
            'pagination' => [
                'current_page' => $page,
                'per_page' => $limit
            ]
        ]);
    }
}
