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

        if (($user['role'] ?? null) === 'student') {
            $studentId = isset($user['student_id']) ? (int) $user['student_id'] : 0;
            if ($studentId <= 0) {
                $studentId = $this->repo->getStudentIdByUserId((int) ($user['user_id'] ?? 0)) ?? 0;
            }

            if ($studentId > 0) {
                $completionMap = $this->repo->getMaterialCompletionMapForStudentCourse($id, $studentId);

                foreach ($materials as &$material) {
                    $materialId = (int) ($material['material_id'] ?? 0);
                    $completion = $completionMap[$materialId] ?? null;

                    $material['is_completed'] = $completion['is_completed'] ?? false;
                    $material['completed_at'] = $completion['completed_at'] ?? null;
                    $material['completion_source'] = $completion['completion_source'] ?? null;
                    $material['last_opened_at'] = $completion['last_opened_at'] ?? null;
                }
                unset($material);
            }
        }

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
            ->numeric('section_id')
            ->numeric('order_index')
            ->numeric('is_required')
            ->numeric('is_active');

        if ($validator->fails()) {
            Response::validationError($validator->getErrors());
            return;
        }

        if (isset($data['access_permission'])) {
            $permission = strtolower((string) $data['access_permission']);
            if (!in_array($permission, ['view', 'download'], true)) {
                Response::validationError(['access_permission' => 'access_permission must be view or download']);
                return;
            }
            $data['access_permission'] = $permission;
        }

        if (isset($data['download_count'])) {
            $downloadCount = (int) $data['download_count'];
            if ($downloadCount < 0) {
                Response::validationError(['download_count' => 'download_count must be zero or greater']);
                return;
            }
            $data['download_count'] = $downloadCount;
        }

        if (array_key_exists('order_index', $data)) {
            $orderIndex = (int) $data['order_index'];
            if ($orderIndex < 0) {
                Response::validationError(['order_index' => 'order_index must be zero or greater']);
                return;
            }
            $data['order_index'] = $orderIndex;
        }

        if (array_key_exists('is_required', $data)) {
            $data['is_required'] = (int) ((int) $data['is_required'] ? 1 : 0);
        }

        if (array_key_exists('is_active', $data)) {
            $data['is_active'] = (int) ((int) $data['is_active'] ? 1 : 0);
            if (!array_key_exists('status', $data)) {
                $data['status'] = $data['is_active'] === 1 ? 'active' : 'inactive';
            }
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

        if (isset($data['order_index'])) {
            $validator->numeric('order_index');
        }

        if (isset($data['is_required'])) {
            $validator->numeric('is_required');
        }

        if (isset($data['is_active'])) {
            $validator->numeric('is_active');
        }

        if ($validator->fails()) {
            Response::validationError($validator->getErrors());
            return;
        }

        if (isset($data['access_permission'])) {
            $permission = strtolower((string) $data['access_permission']);
            if (!in_array($permission, ['view', 'download'], true)) {
                Response::validationError(['access_permission' => 'access_permission must be view or download']);
                return;
            }
            $data['access_permission'] = $permission;
        }

        if (isset($data['download_count'])) {
            $downloadCount = (int) $data['download_count'];
            if ($downloadCount < 0) {
                Response::validationError(['download_count' => 'download_count must be zero or greater']);
                return;
            }
            $data['download_count'] = $downloadCount;
        }

        if (array_key_exists('order_index', $data)) {
            $orderIndex = (int) $data['order_index'];
            if ($orderIndex < 0) {
                Response::validationError(['order_index' => 'order_index must be zero or greater']);
                return;
            }
            $data['order_index'] = $orderIndex;
        }

        if (array_key_exists('is_required', $data)) {
            $data['is_required'] = (int) ((int) $data['is_required'] ? 1 : 0);
        }

        if (array_key_exists('is_active', $data)) {
            $data['is_active'] = (int) ((int) $data['is_active'] ? 1 : 0);
            if (!array_key_exists('status', $data)) {
                $data['status'] = $data['is_active'] === 1 ? 'active' : 'inactive';
            }
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
     * Mark a material as completed by a student.
     */
    public function completeMaterial(array $user, int $courseId, int $materialId): void
    {
        $roleMiddleware = new RoleMiddleware($user);

        if (!$roleMiddleware->requireRole(['student'])) {
            return;
        }

        $material = $this->repo->findMaterialById($materialId);

        if (!$material) {
            Response::notFound('Material not found');
            return;
        }

        if ((int) $material['course_id'] !== $courseId) {
            Response::badRequest('Material does not belong to this class subject');
            return;
        }

        if ($user['role'] !== 'super_admin' && (int) $material['institution_id'] !== (int) $user['institution_id']) {
            Response::forbidden('You do not have access to this material');
            return;
        }

        $studentId = isset($user['student_id']) ? (int) $user['student_id'] : 0;
        if ($studentId <= 0) {
            $studentId = $this->repo->getStudentIdByUserId((int) $user['user_id']) ?? 0;
        }

        if ($studentId <= 0) {
            Response::forbidden('Unable to resolve student profile for completion tracking');
            return;
        }

        if (!$this->repo->isStudentEnrolledInCourse($courseId, $studentId)) {
            Response::forbidden('You are not actively enrolled in this class subject');
            return;
        }

        $body = json_decode(file_get_contents('php://input'), true) ?: [];
        $source = strtolower((string) ($body['source'] ?? 'open'));
        if (!in_array($source, ['open', 'preview', 'download'], true)) {
            $source = 'open';
        }

        $ok = $this->repo->markMaterialCompleted($materialId, $studentId, $source);

        if (!$ok) {
            Response::serverError('Failed to track material completion');
            return;
        }

        Response::success([
            'message' => 'Material completion tracked successfully',
            'tracked' => true,
        ]);
    }

    /**
     * Get required-material completion progress report for a class subject.
     */
    public function getRequiredMaterialProgress(array $user, int $id): void
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

        if ($user['role'] !== 'super_admin' && (int) $classSubject['institution_id'] !== (int) $user['institution_id']) {
            Response::forbidden('You do not have access to this class subject');
            return;
        }

        if ($user['role'] === 'teacher' && (int) ($classSubject['teacher_id'] ?? 0) !== (int) ($user['teacher_id'] ?? 0)) {
            Response::forbidden('You can only access required-progress for your own class subjects');
            return;
        }

        $rows = $this->repo->getRequiredMaterialProgress($id);

        $totalRequired = count($rows);
        $totalCompleted = 0;
        $totalRequiredSlots = 0;

        foreach ($rows as &$row) {
            $completed = (int) ($row['completed_students'] ?? 0);
            $total = (int) ($row['total_students'] ?? 0);
            $row['completion_rate'] = $total > 0 ? round(($completed / $total) * 100, 2) : 0.0;

            $totalCompleted += $completed;
            $totalRequiredSlots += $total;
        }
        unset($row);

        Response::success([
            'course_id' => $id,
            'summary' => [
                'required_materials' => $totalRequired,
                'completed_slots' => $totalCompleted,
                'total_slots' => $totalRequiredSlots,
                'completion_rate' => $totalRequiredSlots > 0 ? round(($totalCompleted / $totalRequiredSlots) * 100, 2) : 0.0,
            ],
            'data' => $rows,
        ]);
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
        $data['institution_id'] = $classSubject['institution_id'] ?? ($user['institution_id'] ?? null);

        $validator = new Validator($data);
        $validator->required(['day_of_week', 'start_time', 'end_time'])
            ->maxLength('day_of_week', 20);

        if (isset($data['period_label'])) {
            $validator->maxLength('period_label', 50);
        }

        if (isset($data['status'])) {
            $validator->in('status', ['active', 'inactive']);
        }

        if ($validator->fails()) {
            Response::validationError($validator->getErrors());
            return;
        }

        $slotExists = $this->repo->scheduleSlotExists(
            $id,
            (string) ($data['day_of_week'] ?? ''),
            (string) ($data['start_time'] ?? ''),
            (string) ($data['end_time'] ?? '')
        );

        if ($slotExists) {
            Response::error('Duplicate schedule: this class subject already has this day and time slot.', 409);
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

        if (isset($data['period_label'])) {
            $validator->maxLength('period_label', 50);
        }

        if (isset($data['status'])) {
            $validator->in('status', ['active', 'inactive']);
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

