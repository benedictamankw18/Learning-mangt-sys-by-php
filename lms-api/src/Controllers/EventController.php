<?php

namespace App\Controllers;

use App\Repositories\EventRepository;
use App\Utils\Response;
use App\Utils\UuidHelper;

class EventController
{
    private $eventRepository;

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

            $events = $this->eventRepository->getUpcoming($institutionId, $days, $limit);

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

            // Support both formats: month=3&year=2026 OR month=2024-03
            if (isset($_GET['year']) && isset($_GET['month'])) {
                $year = $_GET['year'];
                $month = str_pad($_GET['month'], 2, '0', STR_PAD_LEFT);
                $monthParam = $year . '-' . $month;
            } else {
                $monthParam = $_GET['month'] ?? date('Y-m');
            }

            $events = $this->eventRepository->getCalendar($institutionId, $monthParam);

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

            // Validate required fields
            $required = ['title', 'description', 'start_date', 'end_date', 'type', 'institution_id'];
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

            // Validate event type
            $validTypes = ['school', 'academic', 'sports', 'cultural', 'exam', 'holiday', 'meeting', 'other'];
            if (!in_array($data['type'], $validTypes)) {
                Response::error('Invalid event type');
                return;
            }

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

            $data = json_decode(file_get_contents('php://input'), true);
            $eventId = $event['event_id'];

            // Validate event type if provided
            if (isset($data['type'])) {
                $validTypes = ['school', 'academic', 'sports', 'cultural', 'exam', 'holiday', 'meeting', 'other'];
                if (!in_array($data['type'], $validTypes)) {
                    Response::error('Invalid event type');
                    return;
                }
            }

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

            $events = $this->eventRepository->getByType($type, $institutionId, $limit);

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

            $events = $this->eventRepository->getAcademicCalendar($institutionId, $academicYearId);

            Response::success($events);
        } catch (\Exception $e) {
            Response::serverError('Failed to fetch academic calendar: ' . $e->getMessage());
        }
    }
}
