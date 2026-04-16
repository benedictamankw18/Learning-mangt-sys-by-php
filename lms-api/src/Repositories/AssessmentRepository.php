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
                    course_id, academic_year_id, category_id, title, description, assessment_type,
                    max_score, due_date, duration_minutes, passing_score, is_published, weight_percentage
                )
                VALUES (
                    :course_id, :academic_year_id, :category_id, :title, :description, :type,
                    :max_score, :due_date, :duration, :passing_score, :is_published, :weight_percentage
                )
            ");

            $stmt->execute([
                'course_id' => $data['course_id'],
                'academic_year_id' => $data['academic_year_id'] ?? null,
                'category_id' => $data['category_id'] ?? null,
                'title' => $data['title'],
                'description' => $data['description'] ?? null,
                'type' => $data['assessment_type'],
                'max_score' => $data['max_score'] ?? 100,
                'due_date' => $data['due_date'] ?? null,
                'duration' => $data['duration_minutes'] ?? null,
                'passing_score' => $data['passing_score'] ?? 60,
                'is_published' => $data['is_published'] ?? 0,
                'weight_percentage' => $data['weight_percentage'] ?? null
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

    /**
     * Count published assessments of type 'exam' due within the next N days,
     * scoped to an institution via the class_subjects join.
     *
     * @param int $institutionId
     * @param int $days  Look-ahead window (default 7 days)
     * @return int
     */
    public function countUpcomingByInstitution(int $institutionId, int $days = 7): int
    {
        try {
            $stmt = $this->db->prepare("
                SELECT COUNT(*) AS cnt
                FROM assessments a
                INNER JOIN class_subjects cs ON a.course_id = cs.course_id
                WHERE cs.institution_id = :institution_id
                  AND a.assessment_type  = 'exam'
                  AND a.is_published     = 1
                  AND a.due_date        >= CURRENT_DATE()
                  AND a.due_date        <  DATE_ADD(CURRENT_DATE(), INTERVAL :days DAY)
            ");
            $stmt->execute(['institution_id' => $institutionId, 'days' => $days]);
            return (int) $stmt->fetchColumn();
        } catch (\PDOException $e) {
            error_log("Count Upcoming Exams Error: " . $e->getMessage());
            return 0;
        }
    }

    /**
     * Count published assessments due within the next N days for a teacher's courses.
     */
    public function countUpcomingByTeacher(int $teacherId, int $days = 7): int
    {
        try {
            $stmt = $this->db->prepare("
                SELECT COUNT(*) AS cnt
                FROM assessments a
                INNER JOIN class_subjects cs ON a.course_id = cs.course_id
                WHERE cs.teacher_id   = :teacher_id
                  AND a.is_published  = 1
                  AND a.due_date     >= CURRENT_DATE()
                  AND a.due_date     <  DATE_ADD(CURRENT_DATE(), INTERVAL :days DAY)
            ");
            $stmt->execute(['teacher_id' => $teacherId, 'days' => $days]);
            return (int) $stmt->fetchColumn();
        } catch (\PDOException $e) {
            error_log("Count Teacher Upcoming Assessments Error: " . $e->getMessage());
            return 0;
        }
    }

    /**
     * Count published assessments due within the next N days for a student's enrolled courses.
     */
    public function countUpcomingByStudent(int $studentId, int $days = 7): int
    {
        try {
            $stmt = $this->db->prepare("
                SELECT COUNT(*) AS cnt
                FROM assessments a
                INNER JOIN course_enrollments ce ON a.course_id = ce.course_id
                WHERE ce.student_id = :student_id
                  AND ce.status     = 'active'
                  AND a.is_published = 1
                  AND a.due_date    >= CURRENT_DATE()
                  AND a.due_date    <  DATE_ADD(CURRENT_DATE(), INTERVAL :days DAY)
            ");
            $stmt->bindValue(':student_id', $studentId, \PDO::PARAM_INT);
            $stmt->bindValue(':days', $days, \PDO::PARAM_INT);
            $stmt->execute();
            return (int) $stmt->fetchColumn();
        } catch (\PDOException $e) {
            error_log("Count Student Upcoming Assessments Error: " . $e->getMessage());
            return 0;
        }
    }

    /**
     * Compute final score for a student in a course using published teacher assessments.
     * Completeness requires every institution category to have a published score entry.
     */
    public function computePublishedFinalScore(
        int $institutionId,
        int $courseId,
        int $studentId,
        int $academicYearId,
        int $semesterId
    ): array {
        try {
            $requiredStmt = $this->db->prepare(
                "SELECT category_id, category_name, COALESCE(weight_percentage, 0) AS weight_percentage
                 FROM assessment_categories
                 WHERE institution_id = :institution_id
                 ORDER BY category_id"
            );
            $requiredStmt->execute(['institution_id' => $institutionId]);
            $requiredCategories = $requiredStmt->fetchAll(PDO::FETCH_ASSOC);

            $scoresStmt = $this->db->prepare(
                "SELECT
                    a.category_id,
                    MAX(ac.category_name) AS category_name,
                    MAX(COALESCE(ac.weight_percentage, 0)) AS weight_percentage,
                    SUM(COALESCE(sub.score, 0)) AS student_score,
                    SUM(COALESCE(a.max_score, 0)) AS category_max_score,
                    SUM(CASE WHEN sub.submission_id IS NULL THEN 0 ELSE 1 END) AS score_rows
                 FROM assessments a
                 INNER JOIN assessment_categories ac ON ac.category_id = a.category_id
                 LEFT JOIN assessment_submissions sub
                    ON sub.assessment_id = a.assessment_id
                   AND sub.student_id = :student_id
                 WHERE a.course_id = :course_id
                   AND a.academic_year_id = :academic_year_id
                   AND a.semester_id = :semester_id
                   AND a.assessment_type = 'teacher_mode'
                   AND a.is_published = 1
                   AND ac.institution_id = :institution_id
                 GROUP BY a.category_id"
            );

            $scoresStmt->execute([
                'student_id' => $studentId,
                'course_id' => $courseId,
                'academic_year_id' => $academicYearId,
                'semester_id' => $semesterId,
                'institution_id' => $institutionId,
            ]);

            $publishedByCategory = $scoresStmt->fetchAll(PDO::FETCH_ASSOC);
            $publishedMap = [];
            foreach ($publishedByCategory as $row) {
                $publishedMap[(int) $row['category_id']] = $row;
            }

            $breakdown = [];
            $missingCategories = [];
            $weightedSum = 0.0;
            $weightSum = 0.0;

            foreach ($requiredCategories as $required) {
                $categoryId = (int) $required['category_id'];
                $requiredWeight = (float) $required['weight_percentage'];
                $actual = $publishedMap[$categoryId] ?? null;

                $scoreRows = $actual ? (int) $actual['score_rows'] : 0;
                $studentScore = $actual ? (float) $actual['student_score'] : 0.0;
                $maxScore = $actual ? (float) $actual['category_max_score'] : 0.0;
                $hasScore = $scoreRows > 0 && $maxScore > 0;
                $categoryPercentage = $hasScore ? (($studentScore / $maxScore) * 100.0) : null;

                if (!$hasScore) {
                    $missingCategories[] = [
                        'category_id' => $categoryId,
                        'category_name' => (string) $required['category_name'],
                    ];
                } else {
                    $weightedSum += ($categoryPercentage * $requiredWeight) / 100.0;
                    $weightSum += $requiredWeight;
                }

                $breakdown[] = [
                    'category_id' => $categoryId,
                    'category_name' => (string) $required['category_name'],
                    'weight_percentage' => $requiredWeight,
                    'student_score' => $hasScore ? round($studentScore, 2) : null,
                    'category_max_score' => $hasScore ? round($maxScore, 2) : null,
                    'category_percentage' => $hasScore ? round($categoryPercentage, 2) : null,
                    'is_complete' => $hasScore,
                ];
            }

            $complete = count($missingCategories) === 0;
            // Force over-100 scale when complete by dividing weighted sum by 100-based weights.
            $finalPercentage = $complete ? round($weightedSum, 2) : null;

            return [
                'complete' => $complete,
                'missing_categories' => $missingCategories,
                'required_categories_count' => count($requiredCategories),
                'breakdown' => $breakdown,
                'final_percentage' => $finalPercentage,
                'weights_sum' => round($weightSum, 2),
                'published_categories_count' => count($publishedByCategory),
                'formula' => 'SUM((category_score/category_max_score)*category_weight)',
            ];
        } catch (\PDOException $e) {
            error_log("Compute Published Final Score Error: " . $e->getMessage());
            return [
                'complete' => false,
                'missing_categories' => [],
                'required_categories_count' => 0,
                'breakdown' => [],
                'final_percentage' => null,
                'weights_sum' => 0,
                'published_categories_count' => 0,
                'formula' => 'SUM((category_score/category_max_score)*category_weight)',
            ];
        }
    }
}
