<?php

namespace App\Controllers;

use App\Utils\Response;
use App\Utils\Validator;
use App\Repositories\ClassSubjectRepository;
use App\Middleware\RoleMiddleware;

class ClassSubjectController
{
    private ClassSubjectRepository $repo;

    public function __construct()
    {
        $this->repo = new ClassSubjectRepository();
    }

    /**
     * Get all class subjects (with pagination)
     * In Ghana SHS: A class subject is a subject taught to a specific class
     */
    public function index(array $user): void
    {
        $page = isset($_GET['page']) ? (int) $_GET['page'] : 1;
        $limit = isset($_GET['limit']) ? (int) $_GET['limit'] : 20;
        $institutionId = isset($_GET['institution_id']) ? (int) $_GET['institution_id'] : null;
        $classId = isset($_GET['class_id']) ? (int) $_GET['class_id'] : null;
        $subjectId = isset($_GET['subject_id']) ? (int) $_GET['subject_id'] : null;
        $teacherId = isset($_GET['teacher_id']) ? (int) $_GET['teacher_id'] : null;

        // Super admin can view all institutions' class subjects
        if ($user['role'] !== 'super_admin' && !$institutionId) {
            $institutionId = $user['institution_id'];
        }

        $classSubjects = $this->repo->getAll($page, $limit, $institutionId, $classId, $subjectId, $teacherId);
        $total = $this->repo->count($institutionId, $classId, $subjectId, $teacherId);

        Response::success([
            'data' => $classSubjects,
            'pagination' => [
                'current_page' => $page,
                'per_page' => $limit,
                'total' => $total,
                'total_pages' => ceil($total / $limit)
            ]
        ]);
    }

    /**
     * Get a single class subject by ID
     */
    public function show(array $user, int $id): void
    {
        $classSubject = $this->repo->findById($id);

        if (!$classSubject) {
            Response::notFound('Class subject not found');
            return;
        }

        // Check authorization
        if ($user['role'] !== 'super_admin' && $classSubject['institution_id'] != $user['institution_id']) {
            Response::forbidden('You do not have access to this class subject');
            return;
        }

        Response::success($classSubject);
    }

    /**
     * Create a new class subject (assign a subject to a class with a teacher)
     */
    public function create(array $user): void
    {
        $roleMiddleware = new RoleMiddleware($user);

        if (!$roleMiddleware->requireRole(['admin', 'super_admin'])) {
            return;
        }

        $data = json_decode(file_get_contents('php://input'), true);

        // Set institution_id based on user role
        if ($user['role'] !== 'super_admin') {
            $data['institution_id'] = $user['institution_id'];
        }

        $validator = new Validator($data);
        $validator->required(['institution_id', 'class_id', 'subject_id'])
            ->numeric('class_id')
            ->numeric('subject_id');

        if (isset($data['teacher_id'])) {
            $validator->numeric('teacher_id');
        }

        if ($validator->fails()) {
            Response::validationError($validator->getErrors());
            return;
        }

        // Check if class subject already exists
        $exists = $this->repo->exists(
            $data['institution_id'],
            $data['class_id'],
            $data['subject_id'],
            $data['academic_year_id'] ?? null,
            $data['semester_id'] ?? null
        );

        if ($exists) {
            Response::badRequest('This subject is already assigned to this class for the specified academic year and semester');
            return;
        }

        $classSubjectId = $this->repo->create($data);

        if ($classSubjectId) {
            Response::success([
                'message' => 'Class subject created successfully',
                'class_subject_id' => $classSubjectId
            ], 201);
        } else {
            Response::serverError('Failed to create class subject');
        }
    }

    /**
     * Update an existing class subject
     */
    public function update(array $user, int $id): void
    {
        $roleMiddleware = new RoleMiddleware($user);

        if (!$roleMiddleware->requireRole(['admin', 'teacher', 'super_admin'])) {
            return;
        }

        $classSubject = $this->repo->findById($id);

        if (!$classSubject) {
            Response::notFound('Class subject not found');
            return;
        }

        // Check authorization
        if ($user['role'] !== 'super_admin' && $classSubject['institution_id'] != $user['institution_id']) {
            Response::forbidden('You do not have access to update this class subject');
            return;
        }

        // Teachers can only update their own class subjects
        if ($user['role'] === 'teacher' && $classSubject['teacher_id'] != $user['teacher_id']) {
            Response::forbidden('You can only update your own class subjects');
            return;
        }

        $data = json_decode(file_get_contents('php://input'), true);

        $validator = new Validator($data);

        if ($validator->fails()) {
            Response::validationError($validator->getErrors());
            return;
        }

        $success = $this->repo->update($id, $data);

        if ($success) {
            Response::success(['message' => 'Class subject updated successfully']);
        } else {
            Response::serverError('Failed to update class subject');
        }
    }

    /**
     * Delete a class subject
     */
    public function delete(array $user, int $id): void
    {
        $roleMiddleware = new RoleMiddleware($user);

        if (!$roleMiddleware->requireRole(['admin', 'super_admin'])) {
            return;
        }

        $classSubject = $this->repo->findById($id);

        if (!$classSubject) {
            Response::notFound('Class subject not found');
            return;
        }

        // Check authorization
        if ($user['role'] !== 'super_admin' && $classSubject['institution_id'] != $user['institution_id']) {
            Response::forbidden('You do not have access to delete this class subject');
            return;
        }

        $success = $this->repo->delete($id);

        if ($success) {
            Response::success(['message' => 'Class subject deleted successfully']);
        } else {
            Response::serverError('Failed to delete class subject');
        }
    }

    /**
     * Get enrolled students for a class subject
     */
    public function getEnrolledStudents(array $user, int $id): void
    {
        $classSubject = $this->repo->findById($id);

        if (!$classSubject) {
            Response::notFound('Class subject not found');
            return;
        }

        // Check authorization
        if ($user['role'] !== 'super_admin' && $classSubject['institution_id'] != $user['institution_id']) {
            Response::forbidden('You do not have access to this class subject');
            return;
        }

        $students = $this->repo->getEnrolledStudents($id);

        Response::success(['data' => $students]);
    }

    /**
     * Get materials for a class subject
     */
    public function getMaterials(array $user, int $id): void
    {
        $classSubject = $this->repo->findById($id);

        if (!$classSubject) {
            Response::notFound('Class subject not found');
            return;
        }

        // Check authorization
        if ($user['role'] !== 'super_admin' && $classSubject['institution_id'] != $user['institution_id']) {
            Response::forbidden('You do not have access to this class subject');
            return;
        }

        $materials = $this->repo->getMaterials($id);

        Response::success(['data' => $materials]);
    }

    /**
     * Create a material for a class subject
     */
    public function createMaterial(array $user, int $id): void
    {
        $roleMiddleware = new RoleMiddleware($user);

        if (!$roleMiddleware->requireRole(['admin', 'teacher', 'super_admin'])) {
            return;
        }

        $classSubject = $this->repo->findById($id);

        if (!$classSubject) {
            Response::notFound('Class subject not found');
            return;
        }

        // Check authorization
        if ($user['role'] !== 'super_admin' && $classSubject['institution_id'] != $user['institution_id']) {
            Response::forbidden('You do not have access to this class subject');
            return;
        }

        // Teachers can only add materials to their own class subjects
        if ($user['role'] === 'teacher' && $classSubject['teacher_id'] != $user['teacher_id']) {
            Response::forbidden('You can only add materials to your own class subjects');
            return;
        }

        $data = json_decode(file_get_contents('php://input'), true);
        $data['course_id'] = $id;
        $data['uploaded_by'] = $user['user_id'];

        $validator = new Validator($data);
        $validator->required(['title', 'section_id'])
            ->maxLength('title', 200)
            ->numeric('section_id');

        if ($validator->fails()) {
            Response::validationError($validator->getErrors());
            return;
        }

        $materialId = $this->repo->createMaterial($data);

        if ($materialId) {
            Response::success([
                'message' => 'Material created successfully',
                'material_id' => $materialId
            ], 201);
        } else {
            Response::serverError('Failed to create material. Ensure the section exists.');
        }
    }

    /**
     * Update a material for a class subject
     */
    public function updateMaterial(array $user, int $courseId, int $materialId): void
    {
        $roleMiddleware = new RoleMiddleware($user);

        if (!$roleMiddleware->requireRole(['admin', 'teacher', 'super_admin'])) {
            return;
        }

        // Check if the material exists
        $material = $this->repo->findMaterialById($materialId);

        if (!$material) {
            Response::notFound('Material not found');
            return;
        }

        // Check if material belongs to the course
        if ($material['course_id'] != $courseId) {
            Response::badRequest('Material does not belong to this class subject');
            return;
        }

        // Check authorization
        if ($user['role'] !== 'super_admin' && $material['institution_id'] != $user['institution_id']) {
            Response::forbidden('You do not have access to this material');
            return;
        }

        // Teachers can only update materials for their own class subjects
        $classSubject = $this->repo->findById($courseId);
        if ($user['role'] === 'teacher' && $classSubject['teacher_id'] != $user['teacher_id']) {
            Response::forbidden('You can only update materials for your own class subjects');
            return;
        }

        $data = json_decode(file_get_contents('php://input'), true);

        $validator = new Validator($data);

        // Validate if fields are present
        if (isset($data['title'])) {
            $validator->maxLength('title', 200);
        }

        if (isset($data['section_id'])) {
            $validator->numeric('section_id');
        }

        if ($validator->fails()) {
            Response::validationError($validator->getErrors());
            return;
        }

        $success = $this->repo->updateMaterial($materialId, $data);

        if ($success) {
            Response::success(['message' => 'Material updated successfully']);
        } else {
            Response::serverError('Failed to update material');
        }
    }

    /**
     * Delete a material for a class subject
     */
    public function deleteMaterial(array $user, int $courseId, int $materialId): void
    {
        $roleMiddleware = new RoleMiddleware($user);

        if (!$roleMiddleware->requireRole(['admin', 'teacher', 'super_admin'])) {
            return;
        }

        // Check if the material exists
        $material = $this->repo->findMaterialById($materialId);

        if (!$material) {
            Response::notFound('Material not found');
            return;
        }

        // Check if material belongs to the course
        if ($material['course_id'] != $courseId) {
            Response::badRequest('Material does not belong to this class subject');
            return;
        }

        // Check authorization
        if ($user['role'] !== 'super_admin' && $material['institution_id'] != $user['institution_id']) {
            Response::forbidden('You do not have access to this material');
            return;
        }

        // Teachers can only delete materials for their own class subjects
        $classSubject = $this->repo->findById($courseId);
        if ($user['role'] === 'teacher' && $classSubject['teacher_id'] != $user['teacher_id']) {
            Response::forbidden('You can only delete materials for your own class subjects');
            return;
        }

        $success = $this->repo->deleteMaterial($materialId);

        if ($success) {
            Response::success(['message' => 'Material deleted successfully']);
        } else {
            Response::serverError('Failed to delete material');
        }
    }

    /**
     * Get content for a class subject
     */
    public function getContent(array $user, int $id): void
    {
        $classSubject = $this->repo->findById($id);

        if (!$classSubject) {
            Response::notFound('Class subject not found');
            return;
        }

        // Check authorization
        if ($user['role'] !== 'super_admin' && $classSubject['institution_id'] != $user['institution_id']) {
            Response::forbidden('You do not have access to this class subject');
            return;
        }

        $content = $this->repo->getContents($id);

        Response::success(['data' => $content]);
    }

    /**
     * Create content for a class subject
     */
    public function createContent(array $user, int $id): void
    {
        $roleMiddleware = new RoleMiddleware($user);

        if (!$roleMiddleware->requireRole(['admin', 'teacher', 'super_admin'])) {
            return;
        }

        $classSubject = $this->repo->findById($id);

        if (!$classSubject) {
            Response::notFound('Class subject not found');
            return;
        }

        // Check authorization
        if ($user['role'] !== 'super_admin' && $classSubject['institution_id'] != $user['institution_id']) {
            Response::forbidden('You do not have access to this class subject');
            return;
        }

        // Teachers can only add content to their own class subjects
        if ($user['role'] === 'teacher' && $classSubject['teacher_id'] != $user['teacher_id']) {
            Response::forbidden('You can only add content to your own class subjects');
            return;
        }

        $data = json_decode(file_get_contents('php://input'), true);
        $data['course_id'] = $id;
        $data['created_by'] = $user['user_id'];

        $validator = new Validator($data);
        $validator->required(['title', 'section_id'])
            ->maxLength('title', 200)
            ->numeric('section_id');

        if ($validator->fails()) {
            Response::validationError($validator->getErrors());
            return;
        }

        $contentId = $this->repo->createContent($data);

        if ($contentId) {
            Response::success([
                'message' => 'Content created successfully',
                'content_id' => $contentId
            ], 201);
        } else {
            Response::serverError('Failed to create content. Ensure the section exists.');
        }
    }

    /**
     * Update content for a class subject
     */
    public function updateContent(array $user, int $courseId, int $contentId): void
    {
        $roleMiddleware = new RoleMiddleware($user);

        if (!$roleMiddleware->requireRole(['admin', 'teacher', 'super_admin'])) {
            return;
        }

        // Check if the content exists
        $content = $this->repo->findContentById($contentId);

        if (!$content) {
            Response::notFound('Content not found');
            return;
        }

        // Check if content belongs to the course
        if ($content['course_id'] != $courseId) {
            Response::badRequest('Content does not belong to this class subject');
            return;
        }

        // Check authorization
        if ($user['role'] !== 'super_admin' && $content['institution_id'] != $user['institution_id']) {
            Response::forbidden('You do not have access to this content');
            return;
        }

        // Teachers can only update content for their own class subjects
        $classSubject = $this->repo->findById($courseId);
        if ($user['role'] === 'teacher' && $classSubject['teacher_id'] != $user['teacher_id']) {
            Response::forbidden('You can only update content for your own class subjects');
            return;
        }

        $data = json_decode(file_get_contents('php://input'), true);

        $validator = new Validator($data);

        // Validate if fields are present
        if (isset($data['title'])) {
            $validator->maxLength('title', 200);
        }

        if (isset($data['section_id'])) {
            $validator->numeric('section_id');
        }

        if ($validator->fails()) {
            Response::validationError($validator->getErrors());
            return;
        }

        $success = $this->repo->updateContent($contentId, $data);

        if ($success) {
            Response::success(['message' => 'Content updated successfully']);
        } else {
            Response::serverError('Failed to update content');
        }
    }

    /**
     * Delete content for a class subject
     */
    public function deleteContent(array $user, int $courseId, int $contentId): void
    {
        $roleMiddleware = new RoleMiddleware($user);

        if (!$roleMiddleware->requireRole(['admin', 'teacher', 'super_admin'])) {
            return;
        }

        // Check if the content exists
        $content = $this->repo->findContentById($contentId);

        if (!$content) {
            Response::notFound('Content not found');
            return;
        }

        // Check if content belongs to the course
        if ($content['course_id'] != $courseId) {
            Response::badRequest('Content does not belong to this class subject');
            return;
        }

        // Check authorization
        if ($user['role'] !== 'super_admin' && $content['institution_id'] != $user['institution_id']) {
            Response::forbidden('You do not have access to this content');
            return;
        }

        // Teachers can only delete content for their own class subjects
        $classSubject = $this->repo->findById($courseId);
        if ($user['role'] === 'teacher' && $classSubject['teacher_id'] != $user['teacher_id']) {
            Response::forbidden('You can only delete content for your own class subjects');
            return;
        }

        $success = $this->repo->deleteContent($contentId);

        if ($success) {
            Response::success(['message' => 'Content deleted successfully']);
        } else {
            Response::serverError('Failed to delete content');
        }
    }

    /**
     * Get assessments for a class subject
     */
    public function getAssessments(array $user, int $id): void
    {
        $classSubject = $this->repo->findById($id);

        if (!$classSubject) {
            Response::notFound('Class subject not found');
            return;
        }

        // Check authorization
        if ($user['role'] !== 'super_admin' && $classSubject['institution_id'] != $user['institution_id']) {
            Response::forbidden('You do not have access to this class subject');
            return;
        }

        $assessments = $this->repo->getAssessments($id);

        Response::success(['data' => $assessments]);
    }

    /**
     * Get schedules for a class subject
     */
    public function getSchedules(array $user, int $id): void
    {
        $classSubject = $this->repo->findById($id);

        if (!$classSubject) {
            Response::notFound('Class subject not found');
            return;
        }

        // Check authorization
        if ($user['role'] !== 'super_admin' && $classSubject['institution_id'] != $user['institution_id']) {
            Response::forbidden('You do not have access to this class subject');
            return;
        }

        $schedules = $this->repo->getSchedules($id);

        Response::success(['data' => $schedules]);
    }

    /**
     * Create a schedule for a class subject
     */
    public function createSchedule(array $user, int $id): void
    {
        $roleMiddleware = new RoleMiddleware($user);

        if (!$roleMiddleware->requireRole(['admin', 'super_admin'])) {
            return;
        }

        $classSubject = $this->repo->findById($id);

        if (!$classSubject) {
            Response::notFound('Class subject not found');
            return;
        }

        // Check authorization - institution level
        if ($user['role'] !== 'super_admin' && $classSubject['institution_id'] != $user['institution_id']) {
            Response::forbidden('You do not have access to this class subject');
            return;
        }

        $data = json_decode(file_get_contents('php://input'), true);
        $data['course_id'] = $id;

        $validator = new Validator($data);
        $validator->required(['day_of_week', 'start_time', 'end_time'])
            ->maxLength('day_of_week', 20);

        if ($validator->fails()) {
            Response::validationError($validator->getErrors());
            return;
        }

        $scheduleId = $this->repo->createSchedule($data);

        if ($scheduleId) {
            Response::success([
                'message' => 'Schedule created successfully',
                'schedule_id' => $scheduleId
            ], 201);
        } else {
            Response::serverError('Failed to create schedule');
        }
    }

    /**
     * Assign teacher to a class subject
     */
    public function assignTeacher(array $user, int $id): void
    {
        $roleMiddleware = new RoleMiddleware($user);

        if (!$roleMiddleware->requireRole(['admin', 'super_admin'])) {
            return;
        }

        $classSubject = $this->repo->findById($id);

        if (!$classSubject) {
            Response::notFound('Class subject not found');
            return;
        }

        // Check authorization
        if ($user['role'] !== 'super_admin' && $classSubject['institution_id'] != $user['institution_id']) {
            Response::forbidden('You do not have access to this class subject');
            return;
        }

        $data = json_decode(file_get_contents('php://input'), true);

        $validator = new Validator($data);
        $validator->required(['teacher_id'])->numeric('teacher_id');

        if ($validator->fails()) {
            Response::validationError($validator->getErrors());
            return;
        }

        $success = $this->repo->assignTeacher($id, $data['teacher_id']);

        if ($success) {
            Response::success(['message' => 'Teacher assigned successfully']);
        } else {
            Response::serverError('Failed to assign teacher');
        }
    }

    /**
     * Update a schedule for a class subject
     */
    public function updateSchedule(array $user, int $courseId, int $scheduleId): void
    {
        $roleMiddleware = new RoleMiddleware($user);

        if (!$roleMiddleware->requireRole(['admin', 'super_admin'])) {
            return;
        }

        // Check if schedule exists and belongs to course
        $schedule = $this->repo->findScheduleById($scheduleId);
        if (!$schedule) {
            Response::notFound('Schedule not found');
            return;
        }

        if ($schedule['course_id'] != $courseId) {
            Response::badRequest('Schedule does not belong to this class subject');
            return;
        }

        // Check authorization - institution level
        if ($user['role'] !== 'super_admin' && $schedule['institution_id'] != $user['institution_id']) {
            Response::forbidden('You do not have access to this schedule');
            return;
        }

        $data = json_decode(file_get_contents('php://input'), true);

        $validator = new Validator($data);
        if (isset($data['day_of_week'])) {
            $validator->maxLength('day_of_week', 20);
        }

        if ($validator->fails()) {
            Response::validationError($validator->getErrors());
            return;
        }

        $success = $this->repo->updateSchedule($scheduleId, $data);

        if ($success) {
            Response::success(['message' => 'Schedule updated successfully']);
        } else {
            Response::serverError('Failed to update schedule');
        }
    }

    /**
     * Delete a schedule for a class subject
     */
    public function deleteSchedule(array $user, int $courseId, int $scheduleId): void
    {
        $roleMiddleware = new RoleMiddleware($user);

        if (!$roleMiddleware->requireRole(['admin', 'super_admin'])) {
            return;
        }

        // Check if schedule exists and belongs to course
        $schedule = $this->repo->findScheduleById($scheduleId);
        if (!$schedule) {
            Response::notFound('Schedule not found');
            return;
        }

        if ($schedule['course_id'] != $courseId) {
            Response::badRequest('Schedule does not belong to this class subject');
            return;
        }

        // Check authorization - institution level
        if ($user['role'] !== 'super_admin' && $schedule['institution_id'] != $user['institution_id']) {
            Response::forbidden('You do not have access to this schedule');
            return;
        }

        $success = $this->repo->deleteSchedule($scheduleId);

        if ($success) {
            Response::success(['message' => 'Schedule deleted successfully']);
        } else {
            Response::serverError('Failed to delete schedule');
        }
    }
}

