<?php

namespace App\Repositories;

use App\Config\Database;
use PDO;

class AssessmentRepository
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance()->getConnection();
    }

    public function create(array $data): ?int
    {
        try {
            $stmt = $this->db->prepare("
                INSERT INTO assessments (
                    course_id, title, description, assessment_type,
                    max_score, due_date, duration_minutes, passing_score
                )
                VALUES (
                    :course_id, :title, :description, :type,
                    :max_score, :due_date, :duration, :passing_score
                )
            ");

            $stmt->execute([
                'course_id' => $data['course_id'],
                'title' => $data['title'],
                'description' => $data['description'] ?? null,
                'type' => $data['assessment_type'],
                'max_score' => $data['max_score'] ?? 100,
                'due_date' => $data['due_date'] ?? null,
                'duration' => $data['duration_minutes'] ?? null,
                'passing_score' => $data['passing_score'] ?? 60
            ]);

            return (int) $this->db->lastInsertId();
        } catch (\PDOException $e) {
            error_log("Assessment Create Error: " . $e->getMessage());
            return null;
        }
    }

    public function findById(int $id): ?array
    {
        try {
            $stmt = $this->db->prepare("
                SELECT 
                    a.*,
                    c.course_name,
                    c.course_code
                FROM assessments a
                INNER JOIN courses c ON a.course_id = c.course_id
                WHERE a.assessment_id = :id
            ");

            $stmt->execute(['id' => $id]);
            return $stmt->fetch(PDO::FETCH_ASSOC) ?: null;
        } catch (\PDOException $e) {
            error_log("Assessment Find Error: " . $e->getMessage());
            return null;
        }
    }

    public function update(int $id, array $data): bool
    {
        try {
            $fields = [];
            $params = ['id' => $id];

            foreach ($data as $key => $value) {
                if ($key !== 'assessment_id') {
                    $fields[] = "{$key} = :{$key}";
                    $params[$key] = $value;
                }
            }

            if (empty($fields)) {
                return false;
            }

            $sql = "UPDATE assessments SET " . implode(', ', $fields) . " WHERE assessment_id = :id";
            $stmt = $this->db->prepare($sql);
            return $stmt->execute($params);

        } catch (\PDOException $e) {
            error_log("Assessment Update Error: " . $e->getMessage());
            return false;
        }
    }

    public function delete(int $id): bool
    {
        try {
            $stmt = $this->db->prepare("DELETE FROM assessments WHERE assessment_id = :id");
            return $stmt->execute(['id' => $id]);
        } catch (\PDOException $e) {
            error_log("Assessment Delete Error: " . $e->getMessage());
            return false;
        }
    }

    public function getByCourse(int $courseId): array
    {
        try {
            $stmt = $this->db->prepare("
                SELECT * FROM assessments
                WHERE course_id = :course_id
                ORDER BY due_date
            ");

            $stmt->execute(['course_id' => $courseId]);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (\PDOException $e) {
            error_log("Get Assessments By Course Error: " . $e->getMessage());
            return [];
        }
    }

    public function submitAssessment(int $assessmentId, int $studentId, array $data): ?int
    {
        try {
            $stmt = $this->db->prepare("
                INSERT INTO assessment_submissions (
                    assessment_id, student_id, submission_text, score, status
                )
                VALUES (:assessment_id, :student_id, :submission, :score, :status)
            ");

            $stmt->execute([
                'assessment_id' => $assessmentId,
                'student_id' => $studentId,
                'submission' => $data['submission_text'] ?? null,
                'score' => $data['score'] ?? null,
                'status' => $data['status'] ?? 'submitted'
            ]);

            return (int) $this->db->lastInsertId();
        } catch (\PDOException $e) {
            error_log("Submit Assessment Error: " . $e->getMessage());
            return null;
        }
    }

    public function gradeSubmission(int $submissionId, float $score, ?string $feedback = null): bool
    {
        try {
            $stmt = $this->db->prepare("
                UPDATE assessment_submissions
                SET score = :score, feedback = :feedback, status = 'graded', graded_at = NOW()
                WHERE submission_id = :id
            ");

            return $stmt->execute([
                'id' => $submissionId,
                'score' => $score,
                'feedback' => $feedback
            ]);
        } catch (\PDOException $e) {
            error_log("Grade Submission Error: " . $e->getMessage());
            return false;
        }
    }

    public function getSubmissions(int $assessmentId, int $page = 1, int $limit = 20): array
    {
        try {
            $offset = ($page - 1) * $limit;

            $stmt = $this->db->prepare("
                SELECT 
                    sub.*,
                    s.student_id_number,
                    u.first_name,
                    u.last_name,
                    u.email
                FROM assessment_submissions sub
                INNER JOIN students s ON sub.student_id = s.student_id
                INNER JOIN users u ON s.user_id = u.user_id
                WHERE sub.assessment_id = :assessment_id
                ORDER BY sub.submitted_at DESC
                LIMIT :limit OFFSET :offset
            ");

            $stmt->bindValue(':assessment_id', $assessmentId, PDO::PARAM_INT);
            $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
            $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
            $stmt->execute();

            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (\PDOException $e) {
            error_log("Get Submissions Error: " . $e->getMessage());
            return [];
        }
    }

    public function getStudentSubmission(int $assessmentId, int $studentId): ?array
    {
        try {
            $stmt = $this->db->prepare("
                SELECT * FROM assessment_submissions
                WHERE assessment_id = :assessment_id AND student_id = :student_id
                ORDER BY submitted_at DESC
                LIMIT 1
            ");

            $stmt->execute([
                'assessment_id' => $assessmentId,
                'student_id' => $studentId
            ]);

            return $stmt->fetch(PDO::FETCH_ASSOC) ?: null;
        } catch (\PDOException $e) {
            error_log("Get Student Submission Error: " . $e->getMessage());
            return null;
        }
    }

    public function findSubmissionById(int $id): ?array
    {
        try {
            $stmt = $this->db->prepare("
                SELECT *
                FROM assessment_submissions
                WHERE submission_id = :id
            ");

            $stmt->execute(['id' => $id]);
            return $stmt->fetch(PDO::FETCH_ASSOC) ?: null;
        } catch (\PDOException $e) {
            error_log("Find Submission Error: " . $e->getMessage());
            return null;
        }
    }

    public function updateSubmission(int $id, array $data): bool
    {
        try {
            $fields = [];
            $params = ['id' => $id];

            $allowedFields = ['submission_text', 'file_path'];

            foreach ($allowedFields as $field) {
                if (isset($data[$field])) {
                    $fields[] = "{$field} = :{$field}";
                    $params[$field] = $data[$field];
                }
            }

            if (empty($fields)) {
                return false;
            }

            $sql = "UPDATE assessment_submissions SET " . implode(', ', $fields) . " WHERE submission_id = :id";
            $stmt = $this->db->prepare($sql);
            return $stmt->execute($params);

        } catch (\PDOException $e) {
            error_log("Update Submission Error: " . $e->getMessage());
            return false;
        }
    }

    public function deleteSubmission(int $id): bool
    {
        try {
            $stmt = $this->db->prepare("DELETE FROM assessment_submissions WHERE submission_id = :id");
            return $stmt->execute(['id' => $id]);
        } catch (\PDOException $e) {
            error_log("Delete Submission Error: " . $e->getMessage());
            return false;
        }
    }
}
