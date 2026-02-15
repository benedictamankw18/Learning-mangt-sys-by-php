<?php

namespace App\Controllers;

use App\Repositories\CourseSectionRepository;
use App\Repositories\ClassSubjectRepository;
use App\Utils\Response;
use App\Utils\Validator;
use App\Middleware\RoleMiddleware;

class CourseSectionController
{
    private CourseSectionRepository $repo;
    private ClassSubjectRepository $courseRepo;

    public function __construct()
    {
        $this->repo = new CourseSectionRepository();
        $this->courseRepo = new ClassSubjectRepository();
    }

    /**
     * Get all sections for a course
     * GET /courses/{courseId}/sections
     */
    public function index(array $user, int $courseId): void
    {
        // Check if course exists and user has access
        $course = $this->courseRepo->findById($courseId);

        if (!$course) {
            Response::error('Course not found', 404);
            return;
        }

        // Check authorization
        if ($user['role'] !== 'super_admin' && $course['institution_id'] != $user['institution_id']) {
            Response::forbidden('You do not have access to this course');
            return;
        }

        $sections = $this->repo->getCourseSections($courseId);

        Response::success([
            'sections' => $sections,
            'count' => count($sections)
        ]);
    }

    /**
     * Create a new section (teacher/admin)
     * POST /courses/{courseId}/sections
     */
    public function create(array $user, int $courseId): void
    {
        $roleMiddleware = new RoleMiddleware($user);
        if (!$roleMiddleware->requireRole(['admin', 'teacher', 'super_admin'])) {
            return;
        }

        // Check if course exists
        $course = $this->courseRepo->findById($courseId);

        if (!$course) {
            Response::error('Course not found', 404);
            return;
        }

        // Check authorization
        if ($user['role'] !== 'super_admin' && $course['institution_id'] != $user['institution_id']) {
            Response::forbidden('You do not have access to this course');
            return;
        }

        // Teachers can only create sections for their own courses
        if ($user['role'] === 'teacher' && $course['teacher_id'] != $user['teacher_id']) {
            Response::forbidden('You can only create sections for your own courses');
            return;
        }

        $data = json_decode(file_get_contents('php://input'), true);

        $validator = new Validator($data);
        $validator->required(['section_name'])
            ->max('section_name', 100)
            ->numeric('order_index');

        if ($validator->fails()) {
            Response::validationError($validator->getErrors());
            return;
        }

        $data['course_id'] = $courseId;
        $data['created_by'] = $user['user_id'];

        $sectionId = $this->repo->create($data);

        Response::success([
            'message' => 'Section created successfully',
            'section_id' => $sectionId
        ], 201);
    }

    /**
     * Update a section (teacher/admin)
     * PUT /courses/{courseId}/sections/{sectionId}
     */
    public function update(array $user, int $courseId, int $sectionId): void
    {
        $roleMiddleware = new RoleMiddleware($user);
        if (!$roleMiddleware->requireRole(['admin', 'teacher', 'super_admin'])) {
            return;
        }

        // Check if section exists
        $section = $this->repo->findById($sectionId);

        if (!$section) {
            Response::error('Section not found', 404);
            return;
        }

        // Verify section belongs to course
        if ($section['course_id'] != $courseId) {
            Response::error('Section does not belong to this course', 400);
            return;
        }

        // Check authorization
        if ($user['role'] !== 'super_admin' && $section['institution_id'] != $user['institution_id']) {
            Response::forbidden('You do not have access to this section');
            return;
        }

        // Teachers can only update sections for their own courses
        if ($user['role'] === 'teacher') {
            $course = $this->courseRepo->findById($courseId);
            if ($course['teacher_id'] != $user['teacher_id']) {
                Response::forbidden('You can only update sections for your own courses');
                return;
            }
        }

        $data = json_decode(file_get_contents('php://input'), true);

        $validator = new Validator($data);
        $validator->max('section_name', 100)
            ->numeric('order_index');

        if ($validator->fails()) {
            Response::validationError($validator->getErrors());
            return;
        }

        $this->repo->update($sectionId, $data);

        Response::success(['message' => 'Section updated successfully']);
    }

    /**
     * Delete a section (teacher/admin)
     * DELETE /courses/{courseId}/sections/{sectionId}
     */
    public function delete(array $user, int $courseId, int $sectionId): void
    {
        $roleMiddleware = new RoleMiddleware($user);
        if (!$roleMiddleware->requireRole(['admin', 'teacher', 'super_admin'])) {
            return;
        }

        // Check if section exists
        $section = $this->repo->findById($sectionId);

        if (!$section) {
            Response::error('Section not found', 404);
            return;
        }

        // Verify section belongs to course
        if ($section['course_id'] != $courseId) {
            Response::error('Section does not belong to this course', 400);
            return;
        }

        // Check authorization
        if ($user['role'] !== 'super_admin' && $section['institution_id'] != $user['institution_id']) {
            Response::forbidden('You do not have access to this section');
            return;
        }

        // Teachers can only delete sections for their own courses
        if ($user['role'] === 'teacher') {
            $course = $this->courseRepo->findById($courseId);
            if ($course['teacher_id'] != $user['teacher_id']) {
                Response::forbidden('You can only delete sections for your own courses');
                return;
            }
        }

        $this->repo->delete($sectionId);

        Response::success(['message' => 'Section deleted successfully']);
    }
}
