<?php

namespace App\Repositories;

use App\Config\Database;
use PDO;

class ClassSubjectRepository
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance()->getConnection();
    }

    /**
     * Get all class subjects with pagination and optional filters
     * Includes class, subject, teacher, and enrollment information
     */
    public function getAll(
        int $page = 1,
        int $limit = 20,
        ?int $institutionId = null,
        ?int $classId = null,
        ?int $subjectId = null,
        ?int $teacherId = null
    ): array {
        $offset = ($page - 1) * $limit;

        $query = "
            SELECT 
                cs.course_id,
                cs.institution_id,
                cs.duration_weeks,
                cs.start_date,
                cs.end_date,
                cs.status,
                cs.created_at,
                cs.updated_at,
                c.class_id,
                c.class_code,
                c.class_name,
                c.section,
                s.subject_id,
                s.subject_code,
                s.subject_name,
                s.description,
                s.credits,
                s.is_core,
                t.teacher_id,
                CONCAT(tu.first_name, ' ', tu.last_name) as teacher_name,
                tu.email as teacher_email,
                ay.academic_year_id,
                ay.year_name,
                sem.semester_id,
                sem.semester_name,
                p.program_id,
                p.program_name,
                gl.grade_level_id,
                gl.grade_level_name,
                COUNT(DISTINCT e.enrollment_id) as enrolled_students
            FROM class_subjects cs
            INNER JOIN classes c ON cs.class_id = c.class_id
            INNER JOIN subjects s ON cs.subject_id = s.subject_id
            LEFT JOIN teachers t ON cs.teacher_id = t.teacher_id
            LEFT JOIN users tu ON t.user_id = tu.user_id
            LEFT JOIN academic_years ay ON cs.academic_year_id = ay.academic_year_id
            LEFT JOIN semesters sem ON cs.semester_id = sem.semester_id
            LEFT JOIN programs p ON c.program_id = p.program_id
            LEFT JOIN grade_levels gl ON c.grade_level_id = gl.grade_level_id
            LEFT JOIN course_enrollments e ON cs.course_id = e.course_id
            WHERE 1=1
        ";

        $params = [];

        if ($institutionId !== null) {
            $query .= " AND cs.institution_id = :institution_id";
            $params['institution_id'] = $institutionId;
        }

        if ($classId !== null) {
            $query .= " AND cs.class_id = :class_id";
            $params['class_id'] = $classId;
        }

        if ($subjectId !== null) {
            $query .= " AND cs.subject_id = :subject_id";
            $params['subject_id'] = $subjectId;
        }

        if ($teacherId !== null) {
            $query .= " AND cs.teacher_id = :teacher_id";
            $params['teacher_id'] = $teacherId;
        }

        $query .= "
            GROUP BY cs.course_id
            ORDER BY gl.level_order, c.class_name, s.is_core DESC, s.subject_name
            LIMIT :limit OFFSET :offset
        ";

        $stmt = $this->db->prepare($query);

        foreach ($params as $key => $value) {
            $stmt->bindValue(":$key", $value, PDO::PARAM_INT);
        }

        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Count total class subjects with optional filters
     */
    public function count(
        ?int $institutionId = null,
        ?int $classId = null,
        ?int $subjectId = null,
        ?int $teacherId = null
    ): int {
        $query = "SELECT COUNT(*) as total FROM class_subjects WHERE 1=1";
        $params = [];

        if ($institutionId !== null) {
            $query .= " AND institution_id = :institution_id";
            $params['institution_id'] = $institutionId;
        }

        if ($classId !== null) {
            $query .= " AND class_id = :class_id";
            $params['class_id'] = $classId;
        }

        if ($subjectId !== null) {
            $query .= " AND subject_id = :subject_id";
            $params['subject_id'] = $subjectId;
        }

        if ($teacherId !== null) {
            $query .= " AND teacher_id = :teacher_id";
            $params['teacher_id'] = $teacherId;
        }

        $stmt = $this->db->prepare($query);
        $stmt->execute($params);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);

        return (int) $result['total'];
    }

    /**
     * Find a class subject by ID with full details
     */
    public function findById(int $id): ?array
    {
        $stmt = $this->db->prepare("
            SELECT 
                cs.course_id,
                cs.institution_id,
                cs.duration_weeks,
                cs.start_date,
                cs.end_date,
                cs.status,
                cs.created_at,
                cs.updated_at,
                c.class_id,
                c.class_code,
                c.class_name,
                c.section,
                s.subject_id,
                s.subject_code,
                s.subject_name,
                s.is_core,
                s.description,
                s.credits,
                t.teacher_id,
                CONCAT(tu.first_name, ' ', tu.last_name) as teacher_name,
                tu.email as teacher_email,
                tu.phone_number as teacher_phone,
                ay.academic_year_id,
                ay.year_name,
                ay.start_date as year_start_date,
                ay.end_date as year_end_date,
                sem.semester_id,
                sem.semester_name,
                p.program_id,
                p.program_name,
                gl.grade_level_id,
                gl.grade_level_name,
                COUNT(DISTINCT e.enrollment_id) as enrolled_students,
                COUNT(DISTINCT m.material_id) as materials_count,
                COUNT(DISTINCT a.assessment_id) as assessments_count
            FROM class_subjects cs
            INNER JOIN classes c ON cs.class_id = c.class_id
            INNER JOIN subjects s ON cs.subject_id = s.subject_id
            LEFT JOIN teachers t ON cs.teacher_id = t.teacher_id
            LEFT JOIN users tu ON t.user_id = tu.user_id
            LEFT JOIN academic_years ay ON cs.academic_year_id = ay.academic_year_id
            LEFT JOIN semesters sem ON cs.semester_id = sem.semester_id
            LEFT JOIN programs p ON c.program_id = p.program_id
            LEFT JOIN grade_levels gl ON c.grade_level_id = gl.grade_level_id
            LEFT JOIN course_enrollments e ON cs.course_id = e.course_id
            LEFT JOIN course_materials m ON cs.course_id = m.course_id
            LEFT JOIN assessments a ON cs.course_id = a.course_id
            WHERE cs.course_id = :id
            GROUP BY cs.course_id
        ");

        $stmt->execute(['id' => $id]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);

        return $result ?: null;
    }

    /**
     * Check if a class subject already exists
     */
    public function exists(
        int $institutionId,
        int $classId,
        int $subjectId,
        ?int $academicYearId = null,
        ?int $semesterId = null
    ): bool {
        $query = "
            SELECT COUNT(*) as count
            FROM class_subjects
            WHERE institution_id = :institution_id
                AND class_id = :class_id
                AND subject_id = :subject_id
        ";

        $params = [
            'institution_id' => $institutionId,
            'class_id' => $classId,
            'subject_id' => $subjectId
        ];

        // Handle NULL comparison for academic_year_id
        if ($academicYearId !== null) {
            $query .= " AND academic_year_id = :academic_year_id";
            $params['academic_year_id'] = $academicYearId;
        } else {
            $query .= " AND academic_year_id IS NULL";
        }

        // Handle NULL comparison for semester_id
        if ($semesterId !== null) {
            $query .= " AND semester_id = :semester_id";
            $params['semester_id'] = $semesterId;
        } else {
            $query .= " AND semester_id IS NULL";
        }

        $stmt = $this->db->prepare($query);
        $stmt->execute($params);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);

        return $result['count'] > 0;
    }

    /**
     * Create a new class subject
     */
    public function create(array $data): ?int
    {
        // Set defaults
        $data['status'] = $data['status'] ?? 'active';
        $data['duration_weeks'] = $data['duration_weeks'] ?? 16;

        // Check if class subject already exists
        $exists = $this->exists(
            $data['institution_id'],
            $data['class_id'],
            $data['subject_id'],
            $data['academic_year_id'] ?? null,
            $data['semester_id'] ?? null
        );

        if ($exists) {
            return null; // Already exists
        }

        $stmt = $this->db->prepare("
            INSERT INTO class_subjects (
                institution_id,
                class_id,
                subject_id,
                teacher_id,
                academic_year_id,
                semester_id,
                duration_weeks,
                start_date,
                end_date,
                status,
                created_at,
                updated_at
            ) VALUES (
                :institution_id,
                :class_id,
                :subject_id,
                :teacher_id,
                :academic_year_id,
                :semester_id,
                :duration_weeks,
                :start_date,
                :end_date,
                :status,
                NOW(),
                NOW()
            )
        ");

        $result = $stmt->execute([
            'institution_id' => $data['institution_id'],
            'class_id' => $data['class_id'],
            'subject_id' => $data['subject_id'],
            'teacher_id' => $data['teacher_id'] ?? null,
            'academic_year_id' => $data['academic_year_id'] ?? null,
            'semester_id' => $data['semester_id'] ?? null,
            'duration_weeks' => $data['duration_weeks'],
            'start_date' => $data['start_date'] ?? null,
            'end_date' => $data['end_date'] ?? null,
            'status' => $data['status']
        ]);

        return $result ? (int) $this->db->lastInsertId() : null;
    }

    /**
     * Update an existing class subject
     */
    public function update(int $id, array $data): bool
    {
        $fields = [];
        $params = ['id' => $id];

        // Dynamically build update query based on provided fields
        $allowedFields = [
            'teacher_id',
            'duration_weeks',
            'start_date',
            'end_date',
            'status',
            'academic_year_id',
            'semester_id'
        ];

        foreach ($allowedFields as $field) {
            if (array_key_exists($field, $data)) {
                $fields[] = "$field = :$field";
                $params[$field] = $data[$field];
            }
        }

        if (empty($fields)) {
            return false; // Nothing to update
        }

        $fields[] = "updated_at = NOW()";

        $query = "UPDATE class_subjects SET " . implode(', ', $fields) . " WHERE course_id = :id";

        $stmt = $this->db->prepare($query);
        return $stmt->execute($params);
    }

    /**
     * Delete a class subject (will cascade to enrollments, materials, etc.)
     */
    public function delete(int $id): bool
    {
        $stmt = $this->db->prepare("DELETE FROM class_subjects WHERE course_id = :id");
        return $stmt->execute(['id' => $id]);
    }

    /**
     * Get enrolled students for a class subject
     */
    public function getEnrolledStudents(int $courseId): array
    {
        $stmt = $this->db->prepare("
            SELECT 
                e.enrollment_id,
                e.enrollment_date,
                e.status as enrollment_status,
                s.student_id,
                s.student_id_number,
                s.gender,
                s.date_of_birth,
                u.user_id,
                u.username,
                u.email,
                u.first_name,
                u.last_name,
                u.phone_number,
                TIMESTAMPDIFF(YEAR, s.date_of_birth, CURDATE()) as age
            FROM course_enrollments e
            INNER JOIN students s ON e.student_id = s.student_id
            INNER JOIN users u ON s.user_id = u.user_id
            WHERE e.course_id = :course_id
            ORDER BY u.last_name, u.first_name
        ");

        $stmt->execute(['course_id' => $courseId]);

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Get materials for a class subject
     */
    public function getMaterials(int $courseId): array
    {
        $stmt = $this->db->prepare("
            SELECT 
                m.material_id,
                m.title,
                m.description,
                m.file_path,
                m.file_name,
                m.material_type,
                m.file_size,
                m.external_link,
                m.is_required,
                m.is_active,
                m.status,
                m.order_index,
                m.tags,
                m.created_at,
                CONCAT(u.first_name, ' ', u.last_name) as uploaded_by_name,
                u.user_id as uploaded_by_id
            FROM course_materials m
            LEFT JOIN users u ON m.uploaded_by = u.user_id
            WHERE m.course_id = :course_id
            ORDER BY m.order_index, m.created_at DESC
        ");

        $stmt->execute(['course_id' => $courseId]);

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Create a material for a class subject
     * Note: Creates course_content_order entry automatically for frontend ordering
     */
    public function createMaterial(array $data): ?int
    {
        // section_id is required as per system requirements
        if (!isset($data['section_id'])) {
            return null;
        }

        // Get next order_index for this section if not provided
        if (!isset($data['order_index'])) {
            $stmt = $this->db->prepare("
                SELECT COALESCE(MAX(order_index), -1) + 1 as next_order
                FROM course_content_order
                WHERE course_id = :course_id AND course_section_id = :section_id
            ");
            $stmt->execute([
                'course_id' => $data['course_id'],
                'section_id' => $data['section_id']
            ]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            $data['order_index'] = $result['next_order'] ?? 0;
        }

        // Insert material
        $stmt = $this->db->prepare("
            INSERT INTO course_materials (
                course_id,
                section_id,
                title,
                description,
                material_type,
                file_name,
                file_path,
                file_size,
                external_link,
                order_index,
                is_required,
                is_active,
                uploaded_by,
                status,
                tags,
                created_at,
                updated_at
            ) VALUES (
                :course_id,
                :section_id,
                :title,
                :description,
                :material_type,
                :file_name,
                :file_path,
                :file_size,
                :external_link,
                :order_index,
                :is_required,
                :is_active,
                :uploaded_by,
                :status,
                :tags,
                NOW(),
                NOW()
            )
        ");

        $result = $stmt->execute([
            'course_id' => $data['course_id'],
            'section_id' => $data['section_id'],
            'title' => $data['title'],
            'description' => $data['description'] ?? null,
            'material_type' => $data['material_type'] ?? null,
            'file_name' => $data['file_name'] ?? null,
            'file_path' => $data['file_path'] ?? null,
            'file_size' => $data['file_size'] ?? null,
            'external_link' => $data['external_link'] ?? null,
            'order_index' => $data['order_index'],
            'is_required' => $data['is_required'] ?? 0,
            'is_active' => $data['is_active'] ?? 1,
            'uploaded_by' => $data['uploaded_by'],
            'status' => $data['status'] ?? 'active',
            'tags' => $data['tags'] ?? null
        ]);

        if (!$result) {
            return null;
        }

        $materialId = (int) $this->db->lastInsertId();

        // Create course_content_order entry for frontend ordering
        $orderStmt = $this->db->prepare("
            INSERT INTO course_content_order (
                course_id,
                course_section_id,
                material_id,
                item_type,
                order_index,
                created_at,
                updated_at
            ) VALUES (
                :course_id,
                :course_section_id,
                :material_id,
                'material',
                :order_index,
                NOW(),
                NOW()
            )
        ");

        $orderStmt->execute([
            'course_id' => $data['course_id'],
            'course_section_id' => $data['section_id'],
            'material_id' => $materialId,
            'order_index' => $data['order_index']
        ]);

        return $materialId;
    }

    /**
     * Find a material by ID
     */
    public function findMaterialById(int $materialId): ?array
    {
        $stmt = $this->db->prepare("
            SELECT 
                m.material_id,
                m.course_id,
                m.section_id,
                m.title,
                m.description,
                m.material_type,
                m.file_name,
                m.file_path,
                m.file_size,
                m.external_link,
                m.order_index,
                m.is_required,
                m.is_active,
                m.uploaded_by,
                m.status,
                m.tags,
                m.created_at,
                m.updated_at,
                cs.institution_id,
                CONCAT(u.first_name, ' ', u.last_name) as uploaded_by_name
            FROM course_materials m
            INNER JOIN class_subjects cs ON m.course_id = cs.course_id
            LEFT JOIN users u ON m.uploaded_by = u.user_id
            WHERE m.material_id = :material_id
        ");

        $stmt->execute(['material_id' => $materialId]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);

        return $result ?: null;
    }

    /**
     * Update a material
     */
    public function updateMaterial(int $materialId, array $data): bool
    {
        $fields = [];
        $params = ['material_id' => $materialId];

        // Dynamically build update query based on provided fields
        $allowedFields = [
            'section_id',
            'title',
            'description',
            'material_type',
            'file_name',
            'file_path',
            'file_size',
            'external_link',
            'order_index',
            'is_required',
            'is_active',
            'status',
            'tags'
        ];

        foreach ($allowedFields as $field) {
            if (array_key_exists($field, $data)) {
                $fields[] = "$field = :$field";
                $params[$field] = $data[$field];
            }
        }

        if (empty($fields)) {
            return false; // Nothing to update
        }

        $fields[] = "updated_at = NOW()";

        $query = "UPDATE course_materials SET " . implode(', ', $fields) . " WHERE material_id = :material_id";

        $stmt = $this->db->prepare($query);
        return $stmt->execute($params);
    }

    /**
     * Delete a material (will also delete its course_content_order entry)
     */
    public function deleteMaterial(int $materialId): bool
    {
        // First delete from course_content_order
        $stmt = $this->db->prepare("DELETE FROM course_content_order WHERE material_id = :material_id");
        $stmt->execute(['material_id' => $materialId]);

        // Then delete the material
        $stmt = $this->db->prepare("DELETE FROM course_materials WHERE material_id = :material_id");
        return $stmt->execute(['material_id' => $materialId]);
    }

    /**
     * Get all content for a class subject
     */
    public function getContents(int $courseId): array
    {
        $stmt = $this->db->prepare("
            SELECT 
                cc.course_content_id,
                cc.course_id,
                cc.section_id,
                cc.title,
                cc.content_text,
                cc.description,
                cc.content_type,
                cc.is_active,
                cc.created_at,
                cc.updated_at,
                CONCAT(u.first_name, ' ', u.last_name) as created_by_name,
                u.user_id as created_by_id,
                cs.section_name
            FROM course_content cc
            LEFT JOIN users u ON cc.created_by = u.user_id
            LEFT JOIN course_sections cs ON cc.section_id = cs.course_sections_id
            WHERE cc.course_id = :course_id
            ORDER BY cc.section_id, cc.created_at DESC
        ");

        $stmt->execute(['course_id' => $courseId]);

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Find a content by ID
     */
    public function findContentById(int $contentId): ?array
    {
        $stmt = $this->db->prepare("
            SELECT 
                cc.course_content_id,
                cc.course_id,
                cc.section_id,
                cc.title,
                cc.content_text,
                cc.description,
                cc.content_type,
                cc.is_active,
                cc.created_by,
                cc.created_at,
                cc.updated_at,
                cs.institution_id,
                CONCAT(u.first_name, ' ', u.last_name) as created_by_name
            FROM course_content cc
            INNER JOIN class_subjects csub ON cc.course_id = csub.course_id
            LEFT JOIN users u ON cc.created_by = u.user_id
            LEFT JOIN course_sections cs ON cc.section_id = cs.course_sections_id
            WHERE cc.course_content_id = :content_id
        ");

        $stmt->execute(['content_id' => $contentId]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);

        return $result ?: null;
    }

    /**
     * Create content for a class subject
     * Note: Creates course_content_order entry automatically for frontend ordering
     */
    public function createContent(array $data): ?int
    {
        // section_id is required as per system requirements
        if (!isset($data['section_id'])) {
            return null;
        }

        // Get next order_index for this section if not provided
        if (!isset($data['order_index'])) {
            $stmt = $this->db->prepare("
                SELECT COALESCE(MAX(order_index), -1) + 1 as next_order
                FROM course_content_order
                WHERE course_id = :course_id AND course_section_id = :section_id
            ");
            $stmt->execute([
                'course_id' => $data['course_id'],
                'section_id' => $data['section_id']
            ]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            $data['order_index'] = $result['next_order'] ?? 0;
        }

        // Insert content
        $stmt = $this->db->prepare("
            INSERT INTO course_content (
                course_id,
                section_id,
                title,
                content_text,
                description,
                content_type,
                is_active,
                created_by,
                created_at,
                updated_at
            ) VALUES (
                :course_id,
                :section_id,
                :title,
                :content_text,
                :description,
                :content_type,
                :is_active,
                :created_by,
                NOW(),
                NOW()
            )
        ");

        $result = $stmt->execute([
            'course_id' => $data['course_id'],
            'section_id' => $data['section_id'],
            'title' => $data['title'],
            'content_text' => $data['content_text'] ?? null,
            'description' => $data['description'] ?? null,
            'content_type' => $data['content_type'] ?? 'lesson',
            'is_active' => $data['is_active'] ?? 1,
            'created_by' => $data['created_by']
        ]);

        if (!$result) {
            return null;
        }

        $contentId = (int) $this->db->lastInsertId();

        // Create course_content_order entry for frontend ordering
        $orderStmt = $this->db->prepare("
            INSERT INTO course_content_order (
                course_id,
                course_section_id,
                course_content_id,
                item_type,
                order_index,
                created_at,
                updated_at
            ) VALUES (
                :course_id,
                :course_section_id,
                :course_content_id,
                'content',
                :order_index,
                NOW(),
                NOW()
            )
        ");

        $orderStmt->execute([
            'course_id' => $data['course_id'],
            'course_section_id' => $data['section_id'],
            'course_content_id' => $contentId,
            'order_index' => $data['order_index']
        ]);

        return $contentId;
    }

    /**
     * Update content
     */
    public function updateContent(int $contentId, array $data): bool
    {
        $fields = [];
        $params = ['content_id' => $contentId];

        // Dynamically build update query based on provided fields
        $allowedFields = [
            'section_id',
            'title',
            'content_text',
            'description',
            'content_type',
            'is_active'
        ];

        foreach ($allowedFields as $field) {
            if (array_key_exists($field, $data)) {
                $fields[] = "$field = :$field";
                $params[$field] = $data[$field];
            }
        }

        if (empty($fields)) {
            return false; // Nothing to update
        }

        $fields[] = "updated_at = NOW()";

        $query = "UPDATE course_content SET " . implode(', ', $fields) . " WHERE course_content_id = :content_id";

        $stmt = $this->db->prepare($query);
        return $stmt->execute($params);
    }

    /**
     * Delete content (will also delete its course_content_order entry)
     */
    public function deleteContent(int $contentId): bool
    {
        // First delete from course_content_order
        $stmt = $this->db->prepare("DELETE FROM course_content_order WHERE course_content_id = :content_id");
        $stmt->execute(['content_id' => $contentId]);

        // Then delete the content
        $stmt = $this->db->prepare("DELETE FROM course_content WHERE course_content_id = :content_id");
        return $stmt->execute(['content_id' => $contentId]);
    }

    /**
     * Get assessments for a class subject
     */
    public function getAssessments(int $courseId): array
    {
        $stmt = $this->db->prepare("
            SELECT 
                a.assessment_id,
                a.course_id,
                a.category_id,
                a.assessment_type,
                a.title,
                a.description,
                a.max_score,
                a.passing_score,
                a.weight_percentage,
                a.due_date,
                a.duration_minutes,
                a.is_published,
                a.created_at,
                a.updated_at,
                COUNT(DISTINCT sub.submission_id) as submissions_count,
                COUNT(DISTINCT CASE WHEN sub.status = 'graded' THEN sub.submission_id END) as graded_count
            FROM assessments a
            LEFT JOIN assessment_submissions sub ON a.assessment_id = sub.assessment_id
            WHERE a.course_id = :course_id
            GROUP BY a.assessment_id
            ORDER BY a.due_date DESC, a.created_at DESC
        ");

        $stmt->execute(['course_id' => $courseId]);

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Get schedules/timetable for a class subject
     */
    public function getSchedules(int $courseId): array
    {
        $stmt = $this->db->prepare("
            SELECT 
                schedule_id,
                course_id,
                day_of_week,
                start_time,
                end_time,
                room,
                is_recurring,
                created_at,
                updated_at
            FROM course_schedules
            WHERE course_id = :course_id
            ORDER BY 
                FIELD(day_of_week, 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'),
                start_time
        ");

        $stmt->execute(['course_id' => $courseId]);

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Find a schedule by ID with course info for authorization
     */
    public function findScheduleById(int $scheduleId): ?array
    {
        $stmt = $this->db->prepare("
            SELECT 
                s.schedule_id,
                s.course_id,
                s.day_of_week,
                s.start_time,
                s.end_time,
                s.room,
                s.is_recurring,
                s.created_at,
                s.updated_at,
                cs.institution_id
            FROM course_schedules s
            INNER JOIN class_subjects cs ON s.course_id = cs.course_id
            WHERE s.schedule_id = :schedule_id
        ");

        $stmt->execute(['schedule_id' => $scheduleId]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);

        return $result ?: null;
    }

    /**
     * Create a schedule for a class subject
     */
    public function createSchedule(array $data): ?int
    {
        $stmt = $this->db->prepare("
            INSERT INTO course_schedules (
                course_id,
                day_of_week,
                start_time,
                end_time,
                room,
                is_recurring,
                created_at,
                updated_at
            ) VALUES (
                :course_id,
                :day_of_week,
                :start_time,
                :end_time,
                :room,
                :is_recurring,
                NOW(),
                NOW()
            )
        ");

        $result = $stmt->execute([
            'course_id' => $data['course_id'],
            'day_of_week' => strtolower($data['day_of_week']),
            'start_time' => $data['start_time'],
            'end_time' => $data['end_time'],
            'room' => $data['room'] ?? null,
            'is_recurring' => $data['is_recurring'] ?? 1
        ]);

        return $result ? (int) $this->db->lastInsertId() : null;
    }

    /**
     * Update a schedule
     */
    public function updateSchedule(int $scheduleId, array $data): bool
    {
        $fields = [];
        $params = ['schedule_id' => $scheduleId];

        // Allowed fields for update
        $allowedFields = ['day_of_week', 'start_time', 'end_time', 'room', 'is_recurring'];

        foreach ($allowedFields as $field) {
            if (array_key_exists($field, $data)) {
                if ($field === 'day_of_week') {
                    $fields[] = "$field = :$field";
                    $params[$field] = strtolower($data[$field]);
                } else {
                    $fields[] = "$field = :$field";
                    $params[$field] = $data[$field];
                }
            }
        }

        if (empty($fields)) {
            return false; // Nothing to update
        }

        $fields[] = "updated_at = NOW()";
        $query = "UPDATE course_schedules SET " . implode(', ', $fields) . " WHERE schedule_id = :schedule_id";

        $stmt = $this->db->prepare($query);
        return $stmt->execute($params);
    }

    /**
     * Delete a schedule
     */
    public function deleteSchedule(int $scheduleId): bool
    {
        $stmt = $this->db->prepare("DELETE FROM course_schedules WHERE schedule_id = :schedule_id");
        return $stmt->execute(['schedule_id' => $scheduleId]);
    }

    /**
     * Assign a teacher to a class subject
     */
    public function assignTeacher(int $courseId, int $teacherId): bool
    {
        $stmt = $this->db->prepare("
            UPDATE class_subjects 
            SET teacher_id = :teacher_id, updated_at = NOW()
            WHERE course_id = :course_id
        ");

        return $stmt->execute([
            'course_id' => $courseId,
            'teacher_id' => $teacherId
        ]);
    }

    /**
     * Get course distribution by subject for an institution
     * Returns array of subject counts for charts
     */
    public function getCourseDistributionBySubject(int $institutionId): array
    {
        try {
            $stmt = $this->db->prepare("
                SELECT 
                    s.subject_name,
                    COUNT(cs.course_id) as count
                FROM class_subjects cs
                INNER JOIN subjects s ON cs.subject_id = s.subject_id
                WHERE cs.institution_id = :institution_id
                GROUP BY s.subject_id, s.subject_name
                ORDER BY count DESC
                LIMIT 5
            ");

            $stmt->execute(['institution_id' => $institutionId]);
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return [
                'labels' => array_column($results, 'subject_name'),
                'data' => array_map('intval', array_column($results, 'count'))
            ];
        } catch (\PDOException $e) {
            error_log("Get Course Distribution Error: " . $e->getMessage());
            return [
                'labels' => [],
                'data' => []
            ];
        }
    }
}
