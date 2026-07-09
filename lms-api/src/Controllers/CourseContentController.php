<?php

namespace App\Controllers;

use App\Repositories\CourseContentRepository;
use App\Utils\Response;
use App\Utils\UuidHelper;

class CourseContentController
{
    private $courseContentRepository;

    public function __construct()
    {
        $this->courseContentRepository = new CourseContentRepository();
    }

    /**
     * Get all course content
     * GET /course-content?course_id=1&section_id=1&teacher_id=1&type=lesson&is_active=1
     */
    public function index(array $user): void
    {
        try {
            $courseId = $_GET['course_id'] ?? null;
            $sectionId = $_GET['section_id'] ?? null;
            $teacherId = $_GET['teacher_id'] ?? null;
            $type = $_GET['type'] ?? null;
            $isActive = $_GET['is_active'] ?? null;
            $page = $_GET['page'] ?? 1;
            $limit = $_GET['limit'] ?? 50;
            $offset = ($page - 1) * $limit;

            $filters = [];
            if ($courseId)
                $filters['course_id'] = $courseId;
            if ($sectionId)
                $filters['section_id'] = $sectionId;
            if ($teacherId)
                $filters['teacher_id'] = $teacherId;
            if ($type)
                $filters['type'] = $type;
            if ($isActive !== null)
                $filters['is_active'] = $isActive;

            $content = $this->courseContentRepository->getAll($filters, $limit, $offset);
            $total = $this->courseContentRepository->count($filters);

            Response::success([
                'content' => $content,
                'pagination' => [
                    'total' => $total,
                    'page' => (int) $page,
                    'limit' => (int) $limit,
                    'pages' => ceil($total / $limit)
                ]
            ]);
        } catch (\Exception $e) {
            Response::serverError('Failed to fetch course content: ' . $e->getMessage());
        }
    }

    /**
     * Get single course content
     * GET /course-content/{uuid}
     */
    public function show(array $user, string $uuid): void
    {
        try {
            $sanitizedUuid = UuidHelper::sanitize($uuid);
            if (!$sanitizedUuid) {
                Response::badRequest('Invalid UUID format');
                return;
            }

            $content = $this->courseContentRepository->findByUuid($sanitizedUuid);

            if (!$content) {
                Response::notFound('Content not found');
                return;
            }

            Response::success($content);
        } catch (\Exception $e) {
            Response::serverError('Failed to fetch content: ' . $e->getMessage());
        }
    }

    /**
     * Create new course content
     * POST /course-content
     */
    public function create(array $user): void
    {
        try {
            $data = $_POST;

            // Validate required fields
            $required = ['title', 'content_type', 'course_id', 'section_id'];
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

            // Validate content type
            $validTypes = ['lesson', 'module', 'unit', 'topic', 'video', 'document', 'quiz', 'assignment'];
            if (!in_array($data['content_type'], $validTypes)) {
                Response::error('Invalid content type');
                return;
            }

            $contentId = $this->courseContentRepository->create($data);

            Response::success(['id' => $contentId], 'Course content created successfully');
        } catch (\Exception $e) {
            Response::serverError('Failed to create content: ' . $e->getMessage());
        }
    }

    /**
     * Update course content
     * PUT /course-content/{uuid}
     */
    public function update(array $user, string $uuid): void
    {
        try {
            $sanitizedUuid = UuidHelper::sanitize($uuid);
            if (!$sanitizedUuid) {
                Response::badRequest('Invalid UUID format');
                return;
            }

            $data = $_POST;

            $content = $this->courseContentRepository->findByUuid($sanitizedUuid);
            if (!$content) {
                Response::notFound('Content not found');
                return;
            }

            $contentId = $content['course_content_id'];

            // Validate content type if provided
            if (isset($data['content_type'])) {
                $validTypes = ['lesson', 'module', 'unit', 'topic', 'video', 'document', 'quiz', 'assignment'];
                if (!in_array($data['content_type'], $validTypes)) {
                    Response::error('Invalid content type');
                    return;
                }
            }

            $this->courseContentRepository->update($contentId, $data);

            Response::success(null, 'Course content updated successfully');
        } catch (\Exception $e) {
            Response::serverError('Failed to update content: ' . $e->getMessage());
        }
    }

    /**
     * Delete course content
     * DELETE /course-content/{uuid}
     */
    public function delete(array $user, string $uuid): void
    {
        try {
            $sanitizedUuid = UuidHelper::sanitize($uuid);
            if (!$sanitizedUuid) {
                Response::badRequest('Invalid UUID format');
                return;
            }

            $content = $this->courseContentRepository->findByUuid($sanitizedUuid);
            if (!$content) {
                Response::notFound('Content not found');
                return;
            }

            $contentId = $content['course_content_id'];

            $this->courseContentRepository->delete($contentId);

            Response::success(null, 'Course content deleted successfully');
        } catch (\Exception $e) {
            Response::serverError('Failed to delete content: ' . $e->getMessage());
        }
    }

    /**
     * Get content by course
     * GET /course-content/course/{courseId}
     */
    public function getByCourse(array $user, int $courseId): void
    {
        try {
            $content = $this->courseContentRepository->getByCourse($courseId);

            Response::success($content);
        } catch (\Exception $e) {
            Response::serverError('Failed to fetch content: ' . $e->getMessage());
        }
    }

    /**
     * Get content by section
     * GET /course-content/section/{sectionId}
     */
    public function getBySection(array $user, int $sectionId): void
    {
        try {
            $content = $this->courseContentRepository->getBySection($sectionId);

            Response::success($content);
        } catch (\Exception $e) {
            Response::serverError('Failed to fetch content: ' . $e->getMessage());
        }
    }

    /**
     * Reorder content - NOT IMPLEMENTED
     * Note: ordering is managed in course_content_order table
     * PUT /course-content/reorder
     */
    public function reorder(array $user): void
    {
        Response::error('Reorder functionality not implemented - use course_content_order table');
    }

    /**
     * Duplicate content
     * POST /course-content/{uuid}/duplicate
     */
    public function duplicate(array $user, string $uuid): void
    {
        try {
            $sanitizedUuid = UuidHelper::sanitize($uuid);
            if (!$sanitizedUuid) {
                Response::badRequest('Invalid UUID format');
                return;
            }

            $data = $_POST;

            $content = $this->courseContentRepository->findByUuid($sanitizedUuid);
            if (!$content) {
                Response::notFound('Content not found');
                return;
            }

            $contentId = $content['course_content_id'];

            $newId = $this->courseContentRepository->duplicate(
                $contentId,
                $data['course_id'] ?? null,
                $data['section_id'] ?? null
            );

            Response::success(['id' => $newId], 'Content duplicated successfully');
        } catch (\Exception $e) {
            Response::serverError('Failed to duplicate content: ' . $e->getMessage());
        }
    }

    /**
     * Activate/deactivate content
     * PUT /course-content/{uuid}/activate
     */
    public function activate(array $user, string $uuid): void
    {
        try {
            $sanitizedUuid = UuidHelper::sanitize($uuid);
            if (!$sanitizedUuid) {
                Response::badRequest('Invalid UUID format');
                return;
            }

            $data = $_POST;
            $isActive = $data['is_active'] ?? true;

            $content = $this->courseContentRepository->findByUuid($sanitizedUuid);
            if (!$content) {
                Response::notFound('Content not found');
                return;
            }

            $contentId = $content['course_content_id'];

            $this->courseContentRepository->update($contentId, ['is_active' => $isActive ? 1 : 0]);

            Response::success(null, $isActive ? 'Content activated successfully' : 'Content deactivated successfully');
        } catch (\Exception $e) {
            Response::serverError('Failed to update content status: ' . $e->getMessage());
        }
    }
}
