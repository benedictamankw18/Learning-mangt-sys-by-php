<?php

namespace App\Controllers;

use App\Repositories\CourseContentRepository;

class CourseContentController
{
    private $courseContentRepository;

    public function __construct()
    {
        $this->courseContentRepository = new CourseContentRepository();
    }

    /**
     * Get all course content
     * GET /course-content?class_subject_id=1&type=lesson
     */
    public function index($request)
    {
        try {
            $classSubjectId = $request['query']['class_subject_id'] ?? null;
            $type = $request['query']['type'] ?? null;
            $page = $request['query']['page'] ?? 1;
            $limit = $request['query']['limit'] ?? 50;
            $offset = ($page - 1) * $limit;

            $filters = [];
            if ($classSubjectId) $filters['class_subject_id'] = $classSubjectId;
            if ($type) $filters['type'] = $type;

            $content = $this->courseContentRepository->getAll($filters, $limit, $offset);
            $total = $this->courseContentRepository->count($filters);

            return [
                'success' => true,
                'data' => $content,
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
                'message' => 'Failed to fetch course content',
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Get single course content
     * GET /course-content/{id}
     */
    public function show($request)
    {
        try {
            $id = $request['params']['id'];
            $content = $this->courseContentRepository->findById($id);

            if (!$content) {
                return [
                    'success' => false,
                    'message' => 'Content not found'
                ];
            }

            return [
                'success' => true,
                'data' => $content
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => 'Failed to fetch content',
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Create new course content
     * POST /course-content
     */
    public function create($request)
    {
        try {
            $data = $request['body'];

            // Validate required fields
            $required = ['title', 'type', 'class_subject_id'];
            foreach ($required as $field) {
                if (empty($data[$field])) {
                    return [
                        'success' => false,
                        'message' => ucfirst(str_replace('_', ' ', $field)) . ' is required'
                    ];
                }
            }

            // Validate content type
            $validTypes = ['lesson', 'module', 'unit', 'topic', 'video', 'document', 'quiz', 'assignment'];
            if (!in_array($data['type'], $validTypes)) {
                return [
                    'success' => false,
                    'message' => 'Invalid content type'
                ];
            }

            $contentId = $this->courseContentRepository->create($data);

            return [
                'success' => true,
                'message' => 'Course content created successfully',
                'data' => ['id' => $contentId]
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => 'Failed to create content',
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Update course content
     * PUT /course-content/{id}
     */
    public function update($request)
    {
        try {
            $id = $request['params']['id'];
            $data = $request['body'];

            $content = $this->courseContentRepository->findById($id);
            if (!$content) {
                return [
                    'success' => false,
                    'message' => 'Content not found'
                ];
            }

            // Validate content type if provided
            if (isset($data['type'])) {
                $validTypes = ['lesson', 'module', 'unit', 'topic', 'video', 'document', 'quiz', 'assignment'];
                if (!in_array($data['type'], $validTypes)) {
                    return [
                        'success' => false,
                        'message' => 'Invalid content type'
                    ];
                }
            }

            $this->courseContentRepository->update($id, $data);

            return [
                'success' => true,
                'message' => 'Course content updated successfully'
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => 'Failed to update content',
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Delete course content
     * DELETE /course-content/{id}
     */
    public function delete($request)
    {
        try {
            $id = $request['params']['id'];

            $content = $this->courseContentRepository->findById($id);
            if (!$content) {
                return [
                    'success' => false,
                    'message' => 'Content not found'
                ];
            }

            $this->courseContentRepository->delete($id);

            return [
                'success' => true,
                'message' => 'Course content deleted successfully'
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => 'Failed to delete content',
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Get content by class subject
     * GET /course-content/class-subject/{classSubjectId}
     */
    public function getByClassSubject($request)
    {
        try {
            $classSubjectId = $request['params']['classSubjectId'];

            $content = $this->courseContentRepository->getByClassSubject($classSubjectId);

            return [
                'success' => true,
                'data' => $content
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => 'Failed to fetch content',
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Reorder content
     * PUT /course-content/reorder
     */
    public function reorder($request)
    {
        try {
            $data = $request['body'];

            // Expect array of {id, order_position}
            if (empty($data['items']) || !is_array($data['items'])) {
                return [
                    'success' => false,
                    'message' => 'Items array is required'
                ];
            }

            $this->courseContentRepository->reorder($data['items']);

            return [
                'success' => true,
                'message' => 'Content reordered successfully'
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => 'Failed to reorder content',
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Duplicate content
     * POST /course-content/{id}/duplicate
     */
    public function duplicate($request)
    {
        try {
            $id = $request['params']['id'];
            $data = $request['body'];

            $content = $this->courseContentRepository->findById($id);
            if (!$content) {
                return [
                    'success' => false,
                    'message' => 'Content not found'
                ];
            }

            $newId = $this->courseContentRepository->duplicate($id, $data['class_subject_id'] ?? null);

            return [
                'success' => true,
                'message' => 'Content duplicated successfully',
                'data' => ['id' => $newId]
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => 'Failed to duplicate content',
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Publish/unpublish content
     * PUT /course-content/{id}/publish
     */
    public function publish($request)
    {
        try {
            $id = $request['params']['id'];
            $data = $request['body'];
            $published = $data['published'] ?? true;

            $content = $this->courseContentRepository->findById($id);
            if (!$content) {
                return [
                    'success' => false,
                    'message' => 'Content not found'
                ];
            }

            $this->courseContentRepository->update($id, ['published' => $published ? 1 : 0]);

            return [
                'success' => true,
                'message' => $published ? 'Content published successfully' : 'Content unpublished successfully'
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => 'Failed to update content status',
                'error' => $e->getMessage()
            ];
        }
    }
}
