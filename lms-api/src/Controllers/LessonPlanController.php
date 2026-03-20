<?php

namespace App\Controllers;

use App\Utils\Response;
use App\Utils\Validator;
use App\Repositories\LessonPlanRepository;
use App\Repositories\CourseMaterialRepository;
use App\Middleware\RoleMiddleware;

class LessonPlanController
{
    private LessonPlanRepository $lessonPlanRepo;
    private CourseMaterialRepository $materialRepo;

    public function __construct()
    {
        $this->lessonPlanRepo = new LessonPlanRepository();
        $this->materialRepo = new CourseMaterialRepository();
    }

    /**
     * Get all lesson plans for a course
     */
    public function index(array $user): void
    {
        $courseId = (int) ($_GET['course_id'] ?? 0);
        
        if (!$courseId) {
            Response::validationError(['course_id' => 'Course ID is required']);
            return;
        }

        $lessonPlans = $this->lessonPlanRepo->getCourseLessonPlans($courseId);
        Response::success($lessonPlans);
    }

    /**
     * Get lesson plans by week
     */
    public function getByWeek(array $user): void
    {
        $courseId = (int) ($_GET['course_id'] ?? 0);
        $week = (int) ($_GET['week'] ?? 0);
        
        if (!$courseId) {
            Response::validationError(['course_id' => 'Course ID is required']);
            return;
        }

        $lessonPlans = $this->lessonPlanRepo->getByWeek($courseId, $week);
        Response::success($lessonPlans);
    }

    /**
     * Get a single lesson plan with materials
     */
    public function show(array $user, int $id): void
    {
        $lessonPlan = $this->lessonPlanRepo->findById($id);
        if (!$lessonPlan) {
            Response::notFound('Lesson plan not found');
            return;
        }

        Response::success($lessonPlan);
    }

    /**
     * Create a new lesson plan
     */
    public function create(array $user): void
    {
        $roleMiddleware = new RoleMiddleware($user);
        if (!$roleMiddleware->requireRole(['teacher'])) return;

        $data = json_decode(file_get_contents('php://input'), true);
        if (!is_array($data)) {
            Response::validationError(['body' => 'Invalid request payload']);
            return;
        }

        // Backward compatibility: allow legacy title and map it to strand.
        if (!isset($data['strand']) && isset($data['title'])) {
            $data['strand'] = $data['title'];
        }

        $validator = new Validator($data);
        $validator->required(['course_id', 'strand']);

        if ($validator->fails()) {
            Response::validationError($validator->getErrors());
            return;
        }

        $data['created_by'] = $user['user_id'];
        $id = $this->lessonPlanRepo->create($data);
        
        if (!$id) {
            Response::serverError('Failed to create lesson plan');
            return;
        }

        // Link materials if provided
        if (!empty($data['material_ids']) && is_array($data['material_ids'])) {
            foreach ($data['material_ids'] as $index => $materialId) {
                $this->lessonPlanRepo->linkMaterial($id, (int)$materialId, $index);
            }
        }

        Response::success(['id' => $id], 201);
    }

    /**
     * Update a lesson plan
     */
    public function update(array $user, int $id): void
    {
        $roleMiddleware = new RoleMiddleware($user);
        if (!$roleMiddleware->requireRole(['teacher'])) return;

        $lessonPlan = $this->lessonPlanRepo->findById($id);
        if (!$lessonPlan) {
            Response::notFound('Lesson plan not found');
            return;
        }

        $data = json_decode(file_get_contents('php://input'), true);
        if (!is_array($data)) {
            Response::validationError(['body' => 'Invalid request payload']);
            return;
        }

        if (!isset($data['strand']) && isset($data['title'])) {
            $data['strand'] = $data['title'];
        }

        $updated = $this->lessonPlanRepo->update($id, $data);
        
        if (!$updated) {
            Response::serverError('Failed to update lesson plan');
            return;
        }

        // Update material links if provided
        if (array_key_exists('material_ids', $data) && is_array($data['material_ids'])) {
            // Get existing materials
            $existingMaterials = $this->lessonPlanRepo->getLessonPlanMaterials($id);
            $existingIds = array_column($existingMaterials, 'material_id');
            $newIds = array_map('intval', $data['material_ids']);

            // Remove unlinked materials
            foreach ($existingIds as $existingId) {
                if (!in_array($existingId, $newIds)) {
                    $this->lessonPlanRepo->unlinkMaterial($id, $existingId);
                }
            }

            // Add new materials
            foreach ($newIds as $index => $newId) {
                if (!in_array($newId, $existingIds)) {
                    $this->lessonPlanRepo->linkMaterial($id, $newId, $index);
                }
            }
        }

        Response::success(['message' => 'Updated successfully']);
    }

    /**
     * Delete a lesson plan
     */
    public function delete(array $user, int $id): void
    {
        $roleMiddleware = new RoleMiddleware($user);
        if (!$roleMiddleware->requireRole(['teacher'])) return;

        $lessonPlan = $this->lessonPlanRepo->findById($id);
        if (!$lessonPlan) {
            Response::notFound('Lesson plan not found');
            return;
        }

        $deleted = $this->lessonPlanRepo->delete($id);
        if (!$deleted) {
            Response::serverError('Failed to delete lesson plan');
            return;
        }

        Response::success(['message' => 'Deleted successfully']);
    }

    /**
     * Link a material to a lesson plan
     */
    public function linkMaterial(array $user, int $id): void
    {
        $roleMiddleware = new RoleMiddleware($user);
        if (!$roleMiddleware->requireRole(['teacher'])) return;

        $lessonPlan = $this->lessonPlanRepo->findById($id);
        if (!$lessonPlan) {
            Response::notFound('Lesson plan not found');
            return;
        }

        $data = json_decode(file_get_contents('php://input'), true);
        $validator = new Validator($data);
        $validator->required(['material_id']);

        if ($validator->fails()) {
            Response::validationError($validator->getErrors());
            return;
        }

        $material = $this->materialRepo->findById((int)$data['material_id']);
        if (!$material) {
            Response::notFound('Material not found');
            return;
        }

        $linked = $this->lessonPlanRepo->linkMaterial(
            $id,
            (int)$data['material_id'],
            (int)($data['order_index'] ?? 0)
        );

        if (!$linked) {
            Response::serverError('Failed to link material');
            return;
        }

        Response::success(['message' => 'Material linked successfully']);
    }

    /**
     * Unlink a material from a lesson plan
     */
    public function unlinkMaterial(array $user, int $id, int $materialId): void
    {
        $roleMiddleware = new RoleMiddleware($user);
        if (!$roleMiddleware->requireRole(['teacher'])) return;

        $lessonPlan = $this->lessonPlanRepo->findById($id);
        if (!$lessonPlan) {
            Response::notFound('Lesson plan not found');
            return;
        }

        $unlinked = $this->lessonPlanRepo->unlinkMaterial($id, $materialId);
        if (!$unlinked) {
            Response::serverError('Failed to unlink material');
            return;
        }

        Response::success(['message' => 'Material unlinked successfully']);
    }
}
