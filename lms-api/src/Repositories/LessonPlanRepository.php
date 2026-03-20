<?php

namespace App\Repositories;

use PDO;
use App\Config\Database;

class LessonPlanRepository
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance()->getConnection();
    }

    /**
     * Get all lesson plans for a course
     */
    public function getCourseLessonPlans(int $courseId): array
    {
        try {
            $stmt = $this->db->prepare("
                SELECT
                    lp.*,
                    cs.section_name,
                    COALESCE(mc.material_count, 0) AS material_count
                FROM lesson_plans lp
                LEFT JOIN course_sections cs ON lp.section_id = cs.course_sections_id
                LEFT JOIN (
                    SELECT lesson_plan_id, COUNT(*) AS material_count
                    FROM lesson_plan_materials
                    GROUP BY lesson_plan_id
                ) mc ON lp.lesson_plan_id = mc.lesson_plan_id
                WHERE lp.course_id = :course_id 
                ORDER BY lp.created_at DESC
            ");
            $stmt->execute(['course_id' => $courseId]);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (\PDOException $e) {
            error_log("LessonPlanRepository::getCourseLessonPlans error: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Find lesson plan by ID with related materials
     */
    public function findById(int $id): ?array
    {
        try {
            $stmt = $this->db->prepare("
                SELECT *
                FROM lesson_plans
                WHERE lesson_plan_id = :id
            ");
            $stmt->execute(['id' => $id]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$result) {
                return null;
            }

            // Get linked materials
            $result['materials'] = $this->getLessonPlanMaterials($id);
            return $result;
        } catch (\PDOException $e) {
            error_log("LessonPlanRepository::findById error: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Get materials linked to a lesson plan
     */
    public function getLessonPlanMaterials(int $lessonPlanId): array
    {
        try {
            $stmt = $this->db->prepare("
                SELECT cm.*, lpm.order_index
                FROM lesson_plan_materials lpm
                JOIN course_materials cm ON lpm.material_id = cm.material_id
                WHERE lpm.lesson_plan_id = :lesson_plan_id
                ORDER BY lpm.order_index ASC
            ");
            $stmt->execute(['lesson_plan_id' => $lessonPlanId]);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (\PDOException $e) {
            error_log("LessonPlanRepository::getLessonPlanMaterials error: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Create a new lesson plan
     */
    public function create(array $data): ?int
    {
        try {
            $strandValue = $data['strand'] ?? ($data['title'] ?? null);

            $stmt = $this->db->prepare("
                INSERT INTO lesson_plans 
                (course_id, section_id, strand, sub_strand, duration, content_standard,
                 learning_outcomes, learning_indicators, essential_questions,
                 pedagogical_strategies, teaching_learning_resources, differentiation_notes,
                 lesson_introduction, lesson_main, lesson_closure,
                 formative_assessment_mode, formative_assessment_task, formative_mark_scheme,
                 transcript_assessment_mode, transcript_assessment_task, transcript_rubric_mark_scheme,
                 reflection_remarks, created_by, is_active)
                VALUES 
                (:course_id, :section_id, :strand, :sub_strand, :duration, :content_standard,
                 :learning_outcomes, :learning_indicators, :essential_questions,
                 :pedagogical_strategies, :teaching_learning_resources, :differentiation_notes,
                 :lesson_introduction, :lesson_main, :lesson_closure,
                 :formative_assessment_mode, :formative_assessment_task, :formative_mark_scheme,
                 :transcript_assessment_mode, :transcript_assessment_task, :transcript_rubric_mark_scheme,
                 :reflection_remarks, :created_by, :is_active)
            ");

            $stmt->execute([
                'course_id' => $data['course_id'],
                'section_id' => $data['section_id'] ?? null,
                'strand' => $strandValue,
                'sub_strand' => $data['sub_strand'] ?? null,
                'duration' => $data['duration'] ?? null,
                'content_standard' => $data['content_standard'] ?? null,
                'learning_outcomes' => $data['learning_outcomes'] ?? null,
                'learning_indicators' => $data['learning_indicators'] ?? null,
                'essential_questions' => $data['essential_questions'] ?? null,
                'pedagogical_strategies' => $data['pedagogical_strategies'] ?? null,
                'teaching_learning_resources' => $data['teaching_learning_resources'] ?? null,
                'differentiation_notes' => $data['differentiation_notes'] ?? null,
                'lesson_introduction' => $data['lesson_introduction'] ?? null,
                'lesson_main' => $data['lesson_main'] ?? null,
                'lesson_closure' => $data['lesson_closure'] ?? null,
                'formative_assessment_mode' => $data['formative_assessment_mode'] ?? null,
                'formative_assessment_task' => $data['formative_assessment_task'] ?? null,
                'formative_mark_scheme' => $data['formative_mark_scheme'] ?? null,
                'transcript_assessment_mode' => $data['transcript_assessment_mode'] ?? null,
                'transcript_assessment_task' => $data['transcript_assessment_task'] ?? null,
                'transcript_rubric_mark_scheme' => $data['transcript_rubric_mark_scheme'] ?? null,
                'reflection_remarks' => $data['reflection_remarks'] ?? null,
                'created_by' => $data['created_by'],
                'is_active' => $data['is_active'] ?? 1,
            ]);

            return (int) $this->db->lastInsertId();
        } catch (\PDOException $e) {
            error_log("LessonPlanRepository::create error: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Update an existing lesson plan
     */
    public function update(int $id, array $data): bool
    {
        try {
            if (!array_key_exists('strand', $data) && array_key_exists('title', $data)) {
                $data['strand'] = $data['title'];
            }

            $allowedFields = [
                'section_id',
                'strand',
                'sub_strand',
                'duration',
                'content_standard',
                'learning_outcomes',
                'learning_indicators',
                'essential_questions',
                'pedagogical_strategies',
                'teaching_learning_resources',
                'differentiation_notes',
                'lesson_introduction',
                'lesson_main',
                'lesson_closure',
                'formative_assessment_mode',
                'formative_assessment_task',
                'formative_mark_scheme',
                'transcript_assessment_mode',
                'transcript_assessment_task',
                'transcript_rubric_mark_scheme',
                'reflection_remarks',
                'is_active',
            ];

            $updateParts = [];
            $values = ['id' => $id];

            foreach ($allowedFields as $field) {
                if (array_key_exists($field, $data)) {
                    $updateParts[] = "$field = :$field";
                    $values[$field] = $data[$field];
                }
            }

            if (empty($updateParts)) {
                return true;
            }

            $sql = "UPDATE lesson_plans SET " . implode(', ', $updateParts) . " WHERE lesson_plan_id = :id";
            $stmt = $this->db->prepare($sql);
            return $stmt->execute($values);
        } catch (\PDOException $e) {
            error_log("LessonPlanRepository::update error: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Delete a lesson plan
     */
    public function delete(int $id): bool
    {
        try {
            // Delete linked materials first
            $deleteMatStmt = $this->db->prepare("DELETE FROM lesson_plan_materials WHERE lesson_plan_id = :id");
            $deleteMatStmt->execute(['id' => $id]);

            // Delete lesson plan
            $stmt = $this->db->prepare("DELETE FROM lesson_plans WHERE lesson_plan_id = :id");
            return $stmt->execute(['id' => $id]);
        } catch (\PDOException $e) {
            error_log("LessonPlanRepository::delete error: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Link a material to a lesson plan
     */
    public function linkMaterial(int $lessonPlanId, int $materialId, int $orderIndex = 0): bool
    {
        try {
            $stmt = $this->db->prepare("
                INSERT INTO lesson_plan_materials (lesson_plan_id, material_id, order_index)
                VALUES (:lesson_plan_id, :material_id, :order_index_insert)
                ON DUPLICATE KEY UPDATE order_index = :order_index_update
            ");
            return $stmt->execute([
                'lesson_plan_id' => $lessonPlanId,
                'material_id' => $materialId,
                'order_index_insert' => $orderIndex,
                'order_index_update' => $orderIndex,
            ]);
        } catch (\PDOException $e) {
            error_log("LessonPlanRepository::linkMaterial error: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Unlink a material from a lesson plan
     */
    public function unlinkMaterial(int $lessonPlanId, int $materialId): bool
    {
        try {
            $stmt = $this->db->prepare("
                DELETE FROM lesson_plan_materials 
                WHERE lesson_plan_id = :lesson_plan_id AND material_id = :material_id
            ");
            return $stmt->execute([
                'lesson_plan_id' => $lessonPlanId,
                'material_id' => $materialId,
            ]);
        } catch (\PDOException $e) {
            error_log("LessonPlanRepository::unlinkMaterial error: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Get lesson plans by week for a course
     */
    public function getByWeek(int $courseId, int $week): array
    {
        try {
            $stmt = $this->db->prepare("
                SELECT *
                FROM lesson_plans
                WHERE course_id = :course_id AND is_active = 1
                ORDER BY created_at DESC
            ");
            $stmt->execute(['course_id' => $courseId]);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (\PDOException $e) {
            error_log("LessonPlanRepository::getByWeek error: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Get lesson plans by section
     */
    public function getBySectionId(int $sectionId): array
    {
        try {
            $stmt = $this->db->prepare("
                SELECT *
                FROM lesson_plans
                WHERE section_id = :section_id AND is_active = 1
                ORDER BY created_at DESC
            ");
            $stmt->execute(['section_id' => $sectionId]);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (\PDOException $e) {
            error_log("LessonPlanRepository::getBySectionId error: " . $e->getMessage());
            return [];
        }
    }
}