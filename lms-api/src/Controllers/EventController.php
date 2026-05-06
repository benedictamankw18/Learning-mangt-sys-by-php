<?php

namespace App\Controllers;

use App\Repositories\EventRepository;
use App\Utils\Response;
use App\Utils\UuidHelper;

class EventController
{
    private $eventRepository;

    private function isAdminRole(array $user): bool
    {
        $role = strtolower((string) ($user['role'] ?? ''));
        return in_array($role, ['admin', 'super_admin'], true);
    }

    private function getUserId(array $user): ?int
    {
        return isset($user['user_id']) ? (int) $user['user_id'] : null;
    }

    private function canManageEvent(array $user, array $event): bool
    {
        $userId = $this->getUserId($user);
        if (!$userId) {
            return false;
        }

        $targetRole = strtolower((string) ($event['target_role'] ?? 'all'));
        if ($targetRole === 'personal') {
            return isset($event['created_by']) && (int) $event['created_by'] === $userId;
        }

        if ($this->isAdminRole($user)) {
            return true;
        }

        return isset($event['created_by']) && (int) $event['created_by'] === $userId;
    }

    /**
     * Map frontend field names to database column names
     * Frontend uses: name, venue, starts_at, ends_at, audience
     * Database uses: title, location, start_date, end_date, target_role
     */
    private function mapEventFields(array $data): array
    {
        $mapped = [];
        foreach ($data as $key => $value) {
            switch ($key) {
                case 'name':
                    $mapped['title'] = $value;
                    break;
                case 'venue':
                    $mapped['location'] = $value;
                    break;
                case 'starts_at':
                    $mapped['start_date'] = $value;
                    break;
                case 'ends_at':
                    $mapped['end_date'] = $value;
                    break;
                case 'audience':
                    $mapped['target_role'] = $value;
                    break;
                default:
                    $mapped[$key] = $value;
            }
        }
        return $mapped;
    }

    public function __construct()
    {
        $this->eventRepository = new EventRepository();
    }

    /**
     * Get all events
     * GET /events?institution_id=1&type=school&start_date=2024-01-01&end_date=2024-12-31
     */
    public function index(array $user): void
    {
        try {
            $institutionId = $_GET['institution_id'] ?? null;
            $type = $_GET['type'] ?? null;
            $startDate = $_GET['start_date'] ?? null;
            $endDate = $_GET['end_date'] ?? null;
            $academicYearId = $_GET['academic_year_id'] ?? null;
            $publishedOnly = !empty($_GET['published_only']);
            $page = $_GET['page'] ?? 1;
            $limit = $_GET['limit'] ?? 50;
            $offset = ($page - 1) * $limit;

            $filters = [];
            if ($institutionId)
                $filters['institution_id'] = $institutionId;
            if ($type)
                $filters['type'] = $type;
            if ($startDate)
                $filters['start_date'] = $startDate;
            if ($endDate)
                $filters['end_date'] = $endDate;
            if ($academicYearId)
                $filters['academic_year_id'] = (int) $academicYearId;
            if ($publishedOnly)
                $filters['published_only'] = 1;

            $filters['viewer_user_id'] = $this->getUserId($user);
            $filters['viewer_is_admin'] = $this->isAdminRole($user);

            $events = $this->eventRepository->getAll($filters, $limit, $offset);
            $total = $this->eventRepository->count($filters);

            Response::success([
                'events' => $events,
                'pagination' => [
                    'total' => $total,
                    'page' => (int) $page,
                    'limit' => (int) $limit,
                    'pages' => ceil($total / $limit)
                ]
            ]);
        } catch (\Exception $e) {
            Response::serverError('Failed to fetch events: ' . $e->getMessage());
        }
    }

    /**
     * Get upcoming events
     * GET /events/upcoming?institution_id=1&days=30
     */
    public function getUpcoming(array $user): void
    {
        try {
            $institutionId = $_GET['institution_id'] ?? null;
            $days = $_GET['days'] ?? 30;
            $limit = $_GET['limit'] ?? 20;
            $publishedOnly = !empty($_GET['published_only']);

            $viewerUserId = $this->getUserId($user);
            $viewerIsAdmin = $this->isAdminRole($user);

            $events = $this->eventRepository->getUpcoming($institutionId, $days, $limit, $viewerUserId, $viewerIsAdmin, $publishedOnly);
            $events = array_values(array_filter($events, function ($e) { return strtolower((string) ($e['target_role'] ?? '')) !== 'personal'; }));

            Response::success($events);
        } catch (\Exception $e) {
            Response::serverError('Failed to fetch upcoming events: ' . $e->getMessage());
        }
    }

    /**
     * Get events calendar
     * GET /events/calendar?institution_id=1&month=3&year=2026
     * OR /events/calendar?institution_id=1&month=2024-03
     */
    public function getCalendar(array $user): void
    {
        try {
            $institutionId = $_GET['institution_id'] ?? null;
            $viewerUserId = $this->getUserId($user);
            $viewerIsAdmin = $this->isAdminRole($user);
            $publishedOnly = !empty($_GET['published_only']);

            // Support both formats: month=3&year=2026 OR month=2024-03
            if (isset($_GET['year']) && isset($_GET['month'])) {
                $year = $_GET['year'];
                $month = str_pad($_GET['month'], 2, '0', STR_PAD_LEFT);
                $monthParam = $year . '-' . $month;
            } else {
                $monthParam = $_GET['month'] ?? date('Y-m');
            }

            // The repository already applies personal-visibility rules using the viewer id.
            // Return calendar events including personal events when appropriate (owner/admin).
            $events = $this->eventRepository->getCalendar($institutionId, $monthParam, $viewerUserId, $viewerIsAdmin, $publishedOnly);

            Response::success($events);
        } catch (\Exception $e) {
            Response::serverError('Failed to fetch calendar events: ' . $e->getMessage());
        }
    }

    /**
     * Get single event
     * GET /events/{uuid} - supports both UUID and integer ID
     */
    public function show(array $user, string $uuid): void
    {
        try {
            // Try UUID first
            $sanitizedUuid = UuidHelper::sanitize($uuid);
            if ($sanitizedUuid) {
                $event = $this->eventRepository->findByUuid($sanitizedUuid);
            } else if (is_numeric($uuid)) {
                // Fallback to integer ID
                $event = $this->eventRepository->findById((int) $uuid);
            } else {
                Response::badRequest('Invalid ID format');
                return;
            }

            if (!$event) {
                Response::notFound('Event not found');
                return;
            }

            $targetRole = strtolower((string) ($event['target_role'] ?? 'all'));
            if ($targetRole === 'personal' && !$this->canManageEvent($user, $event)) {
                Response::forbidden('You are not allowed to view this personal event.');
                return;
            }

            Response::success($event);
        } catch (\Exception $e) {
            Response::serverError('Failed to fetch event: ' . $e->getMessage());
        }
    }

    /**
     * Create new event
     * POST /events
     */
    public function create(array $user): void
    {
        try {
            $data = json_decode(file_get_contents('php://input'), true);
            if (!is_array($data)) {
                Response::badRequest('Invalid request body');
                return;
            }

            // Map frontend field names to database columns
            $data = $this->mapEventFields($data);
            
            // Normalize published flag (default to 0)
            $data['is_published'] = isset($data['is_published']) ? ((int) $data['is_published'] ? 1 : 0) : 0;

            if (!isset($data['event_type']) && isset($data['type'])) {
                $data['event_type'] = $data['type'];
            }

            // Set institution_id from authenticated user if not provided
            if (empty($data['institution_id'])) {
                $data['institution_id'] = $user['institution_id'] ?? 1;
            }

            $targetRole = strtolower((string) ($data['target_role'] ?? 'all'));
            if (!$this->isAdminRole($user) && $targetRole !== 'personal') {
                Response::forbidden('Only admins can create institution-wide calendar events.');
                return;
            }

            $creatorId = $this->getUserId($user);
            if ($creatorId) {
                $data['created_by'] = $creatorId;
            }

            // Validate required fields
            $required = ['title', 'start_date', 'end_date', 'institution_id'];
            $errors = [];
            foreach ($required as $field) {
                if (empty($data[$field])) {
                    $errors[$field] = ucfirst(str_replace('_', ' ', $field)) . ' is required';
                }
            }

            if (empty($data['event_type'])) {
                $errors['event_type'] = 'Event type is required';
            }

            if (!empty($errors)) {
                Response::validationError($errors);
                return;
            }

            // Validate date range
            if (!empty($data['start_date']) && !empty($data['end_date'])) {
                $startTs = strtotime($data['start_date']);
                $endTs = strtotime($data['end_date']);
                if ($startTs === false || $endTs === false) {
                    Response::validationError(['date' => 'Invalid start_date or end_date']);
                    return;
                }
                if ($endTs < $startTs) {
                    Response::validationError(['date_range' => 'End date must be after start date']);
                    return;
                }
            }

            // Validate event type
            $validTypes = ['school', 'academic', 'sports', 'cultural', 'exam', 'examination', 'holiday', 'meeting', 'other'];
            if (!in_array($data['event_type'], $validTypes)) {
                Response::error('Invalid event type');
                return;
            }

            unset($data['type']);

            $eventId = $this->eventRepository->create($data);

            Response::success(['id' => $eventId], 'Event created successfully');
        } catch (\Exception $e) {
            Response::serverError('Failed to create event: ' . $e->getMessage());
        }
    }

    /**
     * Update event
     * PUT /events/{uuid} - supports both UUID and integer ID
     */
    public function update(array $user, string $uuid): void
    {
        try {
            // Try UUID first
            $sanitizedUuid = UuidHelper::sanitize($uuid);
            if ($sanitizedUuid) {
                $event = $this->eventRepository->findByUuid($sanitizedUuid);
            } else if (is_numeric($uuid)) {
                // Fallback to integer ID
                $event = $this->eventRepository->findById((int) $uuid);
            } else {
                Response::badRequest('Invalid ID format');
                return;
            }

            if (!$event) {
                Response::notFound('Event not found');
                return;
            }

            if (!$this->canManageEvent($user, $event)) {
                Response::forbidden('You can only edit events you created.');
                return;
            }

            $data = json_decode(file_get_contents('php://input'), true);
            
            // Map frontend field names to database columns
            $data = $this->mapEventFields($data);
            
            $eventId = $event['event_id'];

            // Normalize is_published if provided
            if (isset($data['is_published'])) {
                $data['is_published'] = ((int) $data['is_published']) ? 1 : 0;
            }

            if (!isset($data['event_type']) && isset($data['type'])) {
                $data['event_type'] = $data['type'];
            }

            // Validate event type if provided
            if (isset($data['event_type'])) {
                $validTypes = ['school', 'academic', 'sports', 'cultural', 'exam', 'examination', 'holiday', 'meeting', 'other'];
                if (!in_array($data['event_type'], $validTypes)) {
                    Response::error('Invalid event type');
                    return;
                }
            }

            // Validate date range when updating (consider existing values)
            $newStart = isset($data['start_date']) ? $data['start_date'] : ($event['start_date'] ?? null);
            $newEnd = isset($data['end_date']) ? $data['end_date'] : ($event['end_date'] ?? null);
            if ($newStart && $newEnd) {
                $sTs = strtotime($newStart);
                $eTs = strtotime($newEnd);
                if ($sTs === false || $eTs === false) {
                    Response::validationError(['date' => 'Invalid start_date or end_date']);
                    return;
                }
                if ($eTs < $sTs) {
                    Response::validationError(['date_range' => 'End date must be after start date']);
                    return;
                }
            }

            unset($data['type']);

            $this->eventRepository->update($eventId, $data);

            Response::success(null, 'Event updated successfully');
        } catch (\Exception $e) {
            Response::serverError('Failed to update event: ' . $e->getMessage());
        }
    }

    /**
     * Delete event
     * DELETE /events/{uuid} - supports both UUID and integer ID
     */
    public function delete(array $user, string $uuid): void
    {
        try {
            // Try UUID first
            $sanitizedUuid = UuidHelper::sanitize($uuid);
            if ($sanitizedUuid) {
                $event = $this->eventRepository->findByUuid($sanitizedUuid);
            } else if (is_numeric($uuid)) {
                // Fallback to integer ID
                $event = $this->eventRepository->findById((int) $uuid);
            } else {
                Response::badRequest('Invalid ID format');
                return;
            }

            if (!$event) {
                Response::notFound('Event not found');
                return;
            }

            if (!$this->canManageEvent($user, $event)) {
                Response::forbidden('You can only delete events you created.');
                return;
            }

            $eventId = $event['event_id'];

            $this->eventRepository->delete($eventId);

            Response::success(null, 'Event deleted successfully');
        } catch (\Exception $e) {
            Response::serverError('Failed to delete event: ' . $e->getMessage());
        }
    }

    /**
     * Get events by type
     * GET /events/type/{type}?institution_id=1
     */
    public function getByType(array $user, string $type): void
    {
        try {
            $institutionId = $_GET['institution_id'] ?? null;
            $limit = $_GET['limit'] ?? 50;
            $publishedOnly = !empty($_GET['published_only']);

            $viewerUserId = $this->getUserId($user);
            $viewerIsAdmin = $this->isAdminRole($user);

            $events = $this->eventRepository->getByType($type, $institutionId, $limit, $viewerUserId, $viewerIsAdmin, $publishedOnly);

            Response::success($events);
        } catch (\Exception $e) {
            Response::serverError('Failed to fetch events: ' . $e->getMessage());
        }
    }

    /**
     * Get academic calendar
     * GET /events/academic-calendar?institution_id=1&academic_year_id=1
     */
    public function getAcademicCalendar(array $user): void
    {
        try {
            $institutionId = $_GET['institution_id'] ?? null;
            $academicYearId = $_GET['academic_year_id'] ?? null;
            $publishedOnly = !empty($_GET['published_only']);

            $viewerUserId = $this->getUserId($user);
            $viewerIsAdmin = $this->isAdminRole($user);

            $events = $this->eventRepository->getAcademicCalendar($institutionId, $academicYearId, $viewerUserId, $viewerIsAdmin, $publishedOnly);

            Response::success($events);
        } catch (\Exception $e) {
            Response::serverError('Failed to fetch academic calendar: ' . $e->getMessage());
        }
    }
}