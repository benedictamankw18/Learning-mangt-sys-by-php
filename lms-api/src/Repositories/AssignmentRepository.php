<?php

namespace App\Repositories;

use PDO;
use App\Config\Database;

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
     * Create a new assignment
     */
    public function create(array $data): int
    {
        $stmt = $this->db->prepare("
            INSERT INTO assignments (
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
}
