<?php

namespace App\Controllers;

use App\Repositories\EventRepository;

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
    public function index($request)
    {
        try {
            $institutionId = $request['query']['institution_id'] ?? null;
            $type = $request['query']['type'] ?? null;
            $startDate = $request['query']['start_date'] ?? null;
            $endDate = $request['query']['end_date'] ?? null;
            $page = $request['query']['page'] ?? 1;
            $limit = $request['query']['limit'] ?? 50;
            $offset = ($page - 1) * $limit;

            $filters = [];
            if ($institutionId) $filters['institution_id'] = $institutionId;
            if ($type) $filters['type'] = $type;
            if ($startDate) $filters['start_date'] = $startDate;
            if ($endDate) $filters['end_date'] = $endDate;

            $events = $this->eventRepository->getAll($filters, $limit, $offset);
            $total = $this->eventRepository->count($filters);

            return [
                'success' => true,
                'data' => $events,
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
                'message' => 'Failed to fetch events',
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Get upcoming events
     * GET /events/upcoming?institution_id=1&days=30
     */
    public function getUpcoming($request)
    {
        try {
            $institutionId = $request['query']['institution_id'] ?? null;
            $days = $request['query']['days'] ?? 30;
            $limit = $request['query']['limit'] ?? 20;

            $events = $this->eventRepository->getUpcoming($institutionId, $days, $limit);

            return [
                'success' => true,
                'data' => $events
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => 'Failed to fetch upcoming events',
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Get events calendar
     * GET /events/calendar?institution_id=1&month=2024-03
     */
    public function getCalendar($request)
    {
        try {
            $institutionId = $request['query']['institution_id'] ?? null;
            $month = $request['query']['month'] ?? date('Y-m');

            $events = $this->eventRepository->getCalendar($institutionId, $month);

            return [
                'success' => true,
                'data' => $events
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => 'Failed to fetch calendar events',
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Get single event
     * GET /events/{id}
     */
    public function show($request)
    {
        try {
            $id = $request['params']['id'];
            $event = $this->eventRepository->findById($id);

            if (!$event) {
                return [
                    'success' => false,
                    'message' => 'Event not found'
                ];
            }

            return [
                'success' => true,
                'data' => $event
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => 'Failed to fetch event',
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Create new event
     * POST /events
     */
    public function create($request)
    {
        try {
            $data = $request['body'];

            // Validate required fields
            $required = ['title', 'description', 'start_date', 'end_date', 'type', 'institution_id'];
            foreach ($required as $field) {
                if (empty($data[$field])) {
                    return [
                        'success' => false,
                        'message' => ucfirst(str_replace('_', ' ', $field)) . ' is required'
                    ];
                }
            }

            // Validate event type
            $validTypes = ['school', 'academic', 'sports', 'cultural', 'exam', 'holiday', 'meeting', 'other'];
            if (!in_array($data['type'], $validTypes)) {
                return [
                    'success' => false,
                    'message' => 'Invalid event type'
                ];
            }

            $eventId = $this->eventRepository->create($data);

            return [
                'success' => true,
                'message' => 'Event created successfully',
                'data' => ['id' => $eventId]
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => 'Failed to create event',
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Update event
     * PUT /events/{id}
     */
    public function update($request)
    {
        try {
            $id = $request['params']['id'];
            $data = $request['body'];

            $event = $this->eventRepository->findById($id);
            if (!$event) {
                return [
                    'success' => false,
                    'message' => 'Event not found'
                ];
            }

            // Validate event type if provided
            if (isset($data['type'])) {
                $validTypes = ['school', 'academic', 'sports', 'cultural', 'exam', 'holiday', 'meeting', 'other'];
                if (!in_array($data['type'], $validTypes)) {
                    return [
                        'success' => false,
                        'message' => 'Invalid event type'
                    ];
                }
            }

            $this->eventRepository->update($id, $data);

            return [
                'success' => true,
                'message' => 'Event updated successfully'
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => 'Failed to update event',
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Delete event
     * DELETE /events/{id}
     */
    public function delete($request)
    {
        try {
            $id = $request['params']['id'];

            $event = $this->eventRepository->findById($id);
            if (!$event) {
                return [
                    'success' => false,
                    'message' => 'Event not found'
                ];
            }

            $this->eventRepository->delete($id);

            return [
                'success' => true,
                'message' => 'Event deleted successfully'
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => 'Failed to delete event',
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Get events by type
     * GET /events/type/{type}?institution_id=1
     */
    public function getByType($request)
    {
        try {
            $type = $request['params']['type'];
            $institutionId = $request['query']['institution_id'] ?? null;
            $limit = $request['query']['limit'] ?? 50;

            $events = $this->eventRepository->getByType($type, $institutionId, $limit);

            return [
                'success' => true,
                'data' => $events
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => 'Failed to fetch events',
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Get academic calendar
     * GET /events/academic-calendar?institution_id=1&academic_year_id=1
     */
    public function getAcademicCalendar($request)
    {
        try {
            $institutionId = $request['query']['institution_id'] ?? null;
            $academicYearId = $request['query']['academic_year_id'] ?? null;

            $events = $this->eventRepository->getAcademicCalendar($institutionId, $academicYearId);

            return [
                'success' => true,
                'data' => $events
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => 'Failed to fetch academic calendar',
                'error' => $e->getMessage()
            ];
        }
    }
}
