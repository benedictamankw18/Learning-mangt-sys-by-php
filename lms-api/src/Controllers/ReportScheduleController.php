<?php

namespace App\Controllers;

use App\Middleware\RoleMiddleware;
use App\Repositories\ReportScheduleRepository;
use App\Utils\Response;
use App\Utils\Validator;

class ReportScheduleController
{
    private ReportScheduleRepository $repo;

    public function __construct()
    {
        $this->repo = new ReportScheduleRepository();
    }

    public function index(array $user): void
    {
        $roleMiddleware = new RoleMiddleware($user);
        if (!$roleMiddleware->requireRole(['admin'])) {
            return;
        }

        $institutionId = (int) ($user['institution_id'] ?? 0);
        if ($institutionId <= 0) {
            Response::badRequest('Institution context is required');
            return;
        }

        $rows = $this->repo->getAllByInstitution($institutionId);
        Response::success(['schedules' => $rows]);
    }

    public function getTypes(array $user): void
    {
        $roleMiddleware = new RoleMiddleware($user);
        if (!$roleMiddleware->requireRole(['admin', 'teacher', 'super_admin'])) {
            return;
        }

        $institutionId = (int) ($user['institution_id'] ?? 0);
        if ($institutionId <= 0) {
            Response::badRequest('Institution context is required');
            return;
        }

        $types = $this->repo->getAvailableReportTypesByInstitution($institutionId);
        $items = array_map(function (string $value): array {
            return [
                'value' => $value,
                'label' => $this->formatTypeLabel($value),
            ];
        }, $types);

        Response::success(['report_types' => $items]);
    }

    public function create(array $user): void
    {
        $roleMiddleware = new RoleMiddleware($user);
        if (!$roleMiddleware->requireRole(['admin'])) {
            return;
        }

        $institutionId = (int) ($user['institution_id'] ?? 0);
        $createdBy = (int) ($user['user_id'] ?? 0);
        if ($institutionId <= 0 || $createdBy <= 0) {
            Response::badRequest('Institution and user context are required');
            return;
        }

        $data = json_decode((string) file_get_contents('php://input'), true) ?: [];

        $validator = new Validator($data);
        $validator->required(['schedule_name', 'report_type', 'frequency', 'recipient_email']);

        if ($validator->fails()) {
            Response::validationError($validator->getErrors());
            return;
        }

        $scheduleName = trim((string) ($data['schedule_name'] ?? ''));
        $reportType = strtolower(trim((string) ($data['report_type'] ?? '')));
        $frequency = strtolower(trim((string) ($data['frequency'] ?? '')));
        $recipientEmail = trim((string) ($data['recipient_email'] ?? ''));

        $allowedTypes = ['class', 'program', 'semester', 'annual', 'wassce', 'progress', 'teacher', 'attendance', 'enrollment'];
        $allowedFrequencies = ['weekly', 'monthly', 'term_end', 'year_end'];

        if (!in_array($reportType, $allowedTypes, true)) {
            Response::validationError(['report_type' => 'Invalid report_type']);
            return;
        }

        if (!in_array($frequency, $allowedFrequencies, true)) {
            Response::validationError(['frequency' => 'Invalid frequency']);
            return;
        }

        if (!filter_var($recipientEmail, FILTER_VALIDATE_EMAIL)) {
            Response::validationError(['recipient_email' => 'Recipient email is invalid']);
            return;
        }

        $nextRunAt = $this->repo->computeNextRunAt($frequency, $institutionId);

        $schedule = $this->repo->createSchedule([
            'institution_id' => $institutionId,
            'created_by' => $createdBy,
            'schedule_name' => $scheduleName,
            'report_type' => $reportType,
            'frequency' => $frequency,
            'recipient_email' => $recipientEmail,
            'is_active' => 1,
            'next_run_at' => $nextRunAt,
        ]);

        if (!$schedule) {
            Response::serverError('Failed to create report schedule');
            return;
        }

        Response::success(['schedule' => $schedule], 'Report schedule created');
    }

    public function updateStatus(array $user, int $id): void
    {
        $roleMiddleware = new RoleMiddleware($user);
        if (!$roleMiddleware->requireRole(['admin'])) {
            return;
        }

        $institutionId = (int) ($user['institution_id'] ?? 0);
        if ($institutionId <= 0) {
            Response::badRequest('Institution context is required');
            return;
        }

        $schedule = $this->repo->findByIdForInstitution($id, $institutionId);
        if (!$schedule) {
            Response::notFound('Report schedule not found');
            return;
        }

        $data = json_decode((string) file_get_contents('php://input'), true) ?: [];
        $active = null;

        if (array_key_exists('is_active', $data)) {
            $active = ((int) $data['is_active']) === 1;
        } elseif (array_key_exists('active', $data)) {
            $active = ((int) $data['active']) === 1;
        } else {
            $active = ((int) ($schedule['is_active'] ?? 0)) !== 1;
        }

        $ok = $this->repo->setActive($id, $institutionId, $active);
        if (!$ok) {
            Response::serverError('Failed to update schedule status');
            return;
        }

        $updated = $this->repo->findByIdForInstitution($id, $institutionId);
        Response::success(['schedule' => $updated], 'Schedule status updated');
    }

    public function delete(array $user, int $id): void
    {
        $roleMiddleware = new RoleMiddleware($user);
        if (!$roleMiddleware->requireRole(['admin'])) {
            return;
        }

        $institutionId = (int) ($user['institution_id'] ?? 0);
        if ($institutionId <= 0) {
            Response::badRequest('Institution context is required');
            return;
        }

        $deleted = $this->repo->deleteForInstitution($id, $institutionId);
        if (!$deleted) {
            Response::notFound('Report schedule not found');
            return;
        }

        Response::success(null, 'Report schedule deleted');
    }

    private function formatTypeLabel(string $value): string
    {
        $normalized = str_replace(['_', '-'], ' ', strtolower(trim($value)));
        if ($normalized === '') {
            return 'Report';
        }

        return ucwords($normalized);
    }
}
