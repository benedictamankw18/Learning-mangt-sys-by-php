<?php

namespace App\Repositories;

use PDO;
use App\Config\Database;
use App\Utils\UuidHelper;

class AssignmentRepository
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance()->getConnection();
    }

    /**
     * Get all assignments for a course
     */
    public function getCourseAssignments(int $courseId): array
    {
        $stmt = $this->db->prepare("
            SELECT 
                a.*,
                cs.section_name
            FROM assignments a
            LEFT JOIN course_sections cs ON a.section_id = cs.course_sections_id
            WHERE a.course_id = :course_id
            ORDER BY a.due_date DESC, a.created_at DESC
        ");

        $stmt->execute(['course_id' => $courseId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Find assignment by ID
     */
    public function findById(int $id): ?array
    {
        $stmt = $this->db->prepare("
            SELECT 
                a.*,
                c.institution_id,
                c.teacher_id,
                cs.section_name
            FROM assignments a
            INNER JOIN class_subjects c ON a.course_id = c.course_id
            LEFT JOIN course_sections cs ON a.section_id = cs.course_sections_id
            WHERE a.assignment_id = :id
        ");

        $stmt->execute(['id' => $id]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return $result ?: null;
    }

    /**
     * Find assignment by UUID
     * 
     * @param string $uuid
     * @return array|null
     */
    public function findByUuid(string $uuid): ?array
    {
        // Validate UUID format
        if (!UuidHelper::isValid($uuid)) {
            return null;
        }

        $stmt = $this->db->prepare("
            SELECT 
                a.*,
                c.institution_id,
                c.teacher_id,
                cs.section_name
            FROM assignments a
            INNER JOIN class_subjects c ON a.course_id = c.course_id
            LEFT JOIN course_sections cs ON a.section_id = cs.course_sections_id
            WHERE a.uuid = :uuid
        ");

        $stmt->execute(['uuid' => $uuid]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return $result ?: null;
    }

    /**
     * Create a new assignment
     */
    public function create(array $data): int
    {
        // Auto-generate UUID if not provided
        if (!isset($data['uuid'])) {
            $data['uuid'] = UuidHelper::generate();
        }

        $stmt = $this->db->prepare("
            INSERT INTO assignments (
                uuid,
                course_id,
                section_id,
                title,
                description,
                file_path,
                max_score,
                passing_score,
                rubric,
                submission_type,
                due_date,
                status
            ) VALUES (
                :uuid,
                :course_id,
                :section_id,
                :title,
                :description,
                :file_path,
                :max_score,
                :passing_score,
                :rubric,
                :submission_type,
                :due_date,
                :status
            )
        ");

        $stmt->execute([
            'uuid' => $data['uuid'],
            'course_id' => $data['course_id'],
            'section_id' => $data['section_id'] ?? null,
            'title' => $data['title'],
            'description' => $data['description'] ?? null,
            'file_path' => $data['file_path'] ?? null,
            'max_score' => $data['max_score'] ?? 100.00,
            'passing_score' => $data['passing_score'] ?? 60.00,
            'rubric' => $data['rubric'] ?? null,
            'submission_type' => $data['submission_type'] ?? 'both',
            'due_date' => $data['due_date'] ?? null,
            'status' => $data['status'] ?? 'draft'
        ]);

        return (int) $this->db->lastInsertId();
    }

    /**
     * Update an assignment
     */
    public function update(int $id, array $data): bool
    {
        $fields = [];
        $params = ['id' => $id];

        $allowedFields = [
            'section_id',
            'title',
            'description',
            'file_path',
            'max_score',
            'passing_score',
            'rubric',
            'submission_type',
            'due_date',
            'status'
        ];

        foreach ($allowedFields as $field) {
            if (array_key_exists($field, $data)) {
                $fields[] = "$field = :$field";
                $params[$field] = $data[$field];
            }
        }

        if (empty($fields)) {
            return false;
        }

        $fields[] = "updated_at = NOW()";

        $sql = "UPDATE assignments SET " . implode(', ', $fields) . " WHERE assignment_id = :id";
        $stmt = $this->db->prepare($sql);

        return $stmt->execute($params);
    }

    /**
     * Delete an assignment
     */
    public function delete(int $id): bool
    {
        $stmt = $this->db->prepare("
            DELETE FROM assignments WHERE assignment_id = :id
        ");

        return $stmt->execute(['id' => $id]);
    }

    /**
     * Get submissions for an assignment
     */
    public function getSubmissions(int $assignmentId): array
    {
        $stmt = $this->db->prepare("
            SELECT 
                asub.*,
                s.first_name,
                s.last_name,
                s.student_number,
                CONCAT(u.first_name, ' ', u.last_name) as grader_name
            FROM assignment_submissions asub
            INNER JOIN students s ON asub.student_id = s.student_id
            LEFT JOIN users u ON asub.graded_by = u.user_id
            WHERE asub.assignment_id = :assignment_id
            ORDER BY asub.submitted_at DESC, asub.created_at DESC
        ");

        $stmt->execute(['assignment_id' => $assignmentId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Find submission by ID
     */
    public function findSubmissionById(int $id): ?array
    {
        $stmt = $this->db->prepare("
            SELECT 
                asub.*,
                a.course_id,
                c.institution_id,
                c.teacher_id,
                s.student_number,
                CONCAT(s.first_name, ' ', s.last_name) as student_name
            FROM assignment_submissions asub
            INNER JOIN assignments a ON asub.assignment_id = a.assignment_id
            INNER JOIN class_subjects c ON a.course_id = c.course_id
            INNER JOIN students s ON asub.student_id = s.student_id
            WHERE asub.submission_id = :id
        ");

        $stmt->execute(['id' => $id]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return $result ?: null;
    }

    /**
     * Submit assignment
     */
    public function submitAssignment(array $data): int
    {
        $stmt = $this->db->prepare("
            INSERT INTO assignment_submissions (
                assignment_id,
                student_id,
                course_id,
                submission_text,
                submission_file,
                status,
                submitted_at
            ) VALUES (
                :assignment_id,
                :student_id,
                :course_id,
                :submission_text,
                :submission_file,
                'submitted',
                NOW()
            )
        ");

        $stmt->execute([
            'assignment_id' => $data['assignment_id'],
            'student_id' => $data['student_id'],
            'course_id' => $data['course_id'],
            'submission_text' => $data['submission_text'] ?? null,
            'submission_file' => $data['submission_file'] ?? null
        ]);

        return (int) $this->db->lastInsertId();
    }

    /**
     * Grade a submission
     */
    public function gradeSubmission(int $submissionId, array $data): bool
    {
        $stmt = $this->db->prepare("
            UPDATE assignment_submissions
            SET 
                score = :score,
                feedback = :feedback,
                graded_by = :graded_by,
                graded_at = NOW(),
                status = 'graded',
                updated_at = NOW()
            WHERE submission_id = :id
        ");

        return $stmt->execute([
            'id' => $submissionId,
            'score' => $data['score'],
            'feedback' => $data['feedback'] ?? null,
            'graded_by' => $data['graded_by']
        ]);
    }

    /**
     * Get student's submission for an assignment
     */
    public function getStudentSubmission(int $assignmentId, int $studentId): ?array
    {
        $stmt = $this->db->prepare("
            SELECT *
            FROM assignment_submissions
            WHERE assignment_id = :assignment_id AND student_id = :student_id
            ORDER BY submitted_at DESC
            LIMIT 1
        ");

        $stmt->execute([
            'assignment_id' => $assignmentId,
            'student_id' => $studentId
        ]);

        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return $result ?: null;
    }

    /**
     * Count active assignments (status='active') for a teacher's courses.
     */
    public function countActiveByTeacher(int $teacherId): int
    {
        try {
            $stmt = $this->db->prepare("
                SELECT COUNT(*) AS cnt
                FROM assignments a
                INNER JOIN class_subjects cs ON a.course_id = cs.course_id
                WHERE cs.teacher_id = :teacher_id
                  AND a.status      = 'active'
            ");
            $stmt->execute(['teacher_id' => $teacherId]);
            return (int) $stmt->fetchColumn();
        } catch (\PDOException $e) {
            error_log("Count Active Assignments Error: " . $e->getMessage());
            return 0;
        }
    }

    /**
     * Count ungraded (status='submitted') submissions for a teacher's assignments.
     */
    public function countPendingGradesByTeacher(int $teacherId): int
    {
        try {
            $stmt = $this->db->prepare("
                SELECT COUNT(*) AS cnt
                FROM assignment_submissions asub
                INNER JOIN assignments a   ON asub.assignment_id = a.assignment_id
                INNER JOIN class_subjects cs ON a.course_id = cs.course_id
                WHERE cs.teacher_id  = :teacher_id
                  AND asub.status    = 'submitted'
            ");
            $stmt->execute(['teacher_id' => $teacherId]);
            return (int) $stmt->fetchColumn();
        } catch (\PDOException $e) {
            error_log("Count Pending Grades Error: " . $e->getMessage());
            return 0;
        }
    }

    /**
     * Count active assignments not yet submitted by a student.
     */
    public function countPendingByStudent(int $studentId): int
    {
        try {
            $stmt = $this->db->prepare("
                SELECT COUNT(*) AS cnt
                FROM assignments a
                INNER JOIN course_enrollments ce ON a.course_id = ce.course_id
                WHERE ce.student_id = :student_id
                  AND ce.status     = 'active'
                  AND a.status      = 'active'
                  AND due_date > NOW()
                  AND NOT EXISTS (
                      SELECT 1 FROM assignment_submissions asub
                      WHERE asub.assignment_id = a.assignment_id
                        AND asub.student_id    = :student_id2
                  )
            ");
            $stmt->execute(['student_id' => $studentId, 'student_id2' => $studentId]);
            return (int) $stmt->fetchColumn();
        } catch (\PDOException $e) {
            error_log("Count Student Pending Assignments Error: " . $e->getMessage());
            return 0;
        }
    }

    /**
     * Returns the list of pending assignments for a student (not yet submitted, still active, due in future).
     */
    public function getPendingByStudent(int $studentId, int $limit = 5): array
    {
        try {
            $stmt = $this->db->prepare("
                SELECT
                    a.assignment_id,
                    a.title          AS assignment_title,
                    a.due_date,
                    a.max_score,
                    s.subject_name,
                    s.subject_code
                FROM assignments a
                INNER JOIN course_enrollments ce ON a.course_id = ce.course_id
                INNER JOIN class_subjects     cs ON a.course_id = cs.course_id
                INNER JOIN subjects            s  ON cs.subject_id = s.subject_id
                WHERE ce.student_id = :student_id
                  AND ce.status     = 'active'
                  AND a.status      = 'active'
                  AND a.due_date    > NOW()
                  AND NOT EXISTS (
                      SELECT 1 FROM assignment_submissions asub
                      WHERE asub.assignment_id = a.assignment_id
                        AND asub.student_id    = :student_id2
                  )
                ORDER BY a.due_date ASC
                LIMIT :lim
            ");
            $stmt->bindValue('student_id',  $studentId, \PDO::PARAM_INT);
            $stmt->bindValue('student_id2', $studentId, \PDO::PARAM_INT);
            $stmt->bindValue('lim',          $limit,     \PDO::PARAM_INT);
            $stmt->execute();
            return $stmt->fetchAll(\PDO::FETCH_ASSOC);
        } catch (\PDOException $e) {
            error_log("Get Student Pending Assignments Error: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Most recent graded submissions for a student with score and percentage.
     */
    public function getRecentGradesByStudent(int $studentId, int $limit = 5): array
    {
        try {
            $stmt = $this->db->prepare("
                SELECT
                    a.title          AS assignment_title,
                    s.subject_name,
                    s.subject_code,
                    asub.score,
                    asub.graded_at,
                    a.max_score,
                    CASE WHEN a.max_score > 0
                         THEN ROUND((asub.score / a.max_score) * 100, 1)
                         ELSE 0 END AS percentage
                FROM assignment_submissions asub
                INNER JOIN assignments a     ON asub.assignment_id = a.assignment_id
                INNER JOIN class_subjects cs ON a.course_id = cs.course_id
                INNER JOIN subjects s        ON cs.subject_id = s.subject_id
                WHERE asub.student_id = :student_id
                  AND asub.status     = 'graded'
                ORDER BY asub.graded_at DESC
                LIMIT :lim
            ");
            $stmt->bindValue(':student_id', $studentId, \PDO::PARAM_INT);
            $stmt->bindValue(':lim', $limit, \PDO::PARAM_INT);
            $stmt->execute();
            return $stmt->fetchAll(\PDO::FETCH_ASSOC);
        } catch (\PDOException $e) {
            error_log("Student Recent Grades Error: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Average score per subject for a student (grade trend chart).
     * Returns ['labels' => [...], 'data' => [...]] for Chart.js.
     */
    public function getGradeTrendByStudent(int $studentId): array
    {
        try {
            $stmt = $this->db->prepare("
                SELECT
                    s.subject_name                                       AS label,
                    COALESCE(ROUND(AVG(
                        CASE WHEN a.max_score > 0
                             THEN (asub.score / a.max_score) * 100
                             ELSE 0 END
                    ), 1), 0)                                            AS avg_pct
                FROM assignment_submissions asub
                INNER JOIN assignments a     ON asub.assignment_id = a.assignment_id
                INNER JOIN class_subjects cs ON a.course_id = cs.course_id
                INNER JOIN subjects s        ON cs.subject_id = s.subject_id
                WHERE asub.student_id = :student_id
                  AND asub.status     = 'graded'
                GROUP BY s.subject_id, s.subject_name
                ORDER BY s.subject_name
            ");
            $stmt->execute(['student_id' => $studentId]);
            $rows = $stmt->fetchAll(\PDO::FETCH_ASSOC);
            return [
                'labels' => array_column($rows, 'label'),
                'data'   => array_map('floatval', array_column($rows, 'avg_pct')),
            ];
        } catch (\PDOException $e) {
            error_log("Student Grade Trend Error: " . $e->getMessage());
            return ['labels' => [], 'data' => []];
        }
    }

    /**
     * Get the most recent N ungraded submissions for a teacher, with student name and assignment title.
     */
    public function getRecentSubmissionsByTeacher(int $teacherId, int $limit = 5): array
    {
        try {
            $stmt = $this->db->prepare("
                SELECT
                    asub.submission_id,
                    asub.assignment_id,
                    asub.submitted_at,
                    a.title           AS assignment_title,
                    CONCAT(u.first_name, ' ', u.last_name) AS student_name,
                    s.student_id_number
                FROM assignment_submissions asub
                INNER JOIN assignments a     ON asub.assignment_id = a.assignment_id
                INNER JOIN class_subjects cs ON a.course_id        = cs.course_id
                INNER JOIN students s        ON asub.student_id    = s.student_id
                INNER JOIN users u           ON s.user_id          = u.user_id
                WHERE cs.teacher_id = :teacher_id
                  AND asub.status   = 'submitted'
                ORDER BY asub.submitted_at DESC
                LIMIT :lim
            ");
            $stmt->bindValue(':teacher_id', $teacherId, PDO::PARAM_INT);
            $stmt->bindValue(':lim',        $limit,     PDO::PARAM_INT);
            $stmt->execute();
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (\PDOException $e) {
            error_log("Get Recent Submissions Error: " . $e->getMessage());
            return [];
        }
    }
}
