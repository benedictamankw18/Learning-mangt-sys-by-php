<?php

namespace App\Repositories;

use PDO;
use App\Config\Database;

class QuizRepository
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance()->getConnection();
    }

    /**
     * Get all quizzes for a course
     */
    public function getCourseQuizzes(int $courseId): array
    {
        $stmt = $this->db->prepare("
            SELECT 
                q.*,
                cs.section_name,
                (
                    SELECT COALESCE(SUM(qq.points), 0)
                    FROM quiz_questions qq
                    WHERE qq.quiz_id = q.quiz_id
                ) AS total_points,
                (
                    SELECT COUNT(*)
                    FROM quiz_questions qq
                    WHERE qq.quiz_id = q.quiz_id
                ) AS question_count
            FROM quizzes q
            LEFT JOIN course_sections cs ON q.section_id = cs.course_sections_id
            WHERE q.course_id = :course_id
            ORDER BY q.start_date DESC, q.created_at DESC
        ");

        $stmt->execute(['course_id' => $courseId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Find quiz by ID
     */
    public function findById(int $id): ?array
    {
        $stmt = $this->db->prepare("
            SELECT 
                q.*,
                c.institution_id,
                c.teacher_id,
                cs.section_name,
                (
                    SELECT COALESCE(SUM(qq.points), 0)
                    FROM quiz_questions qq
                    WHERE qq.quiz_id = q.quiz_id
                ) AS total_points,
                (
                    SELECT COUNT(*)
                    FROM quiz_questions qq
                    WHERE qq.quiz_id = q.quiz_id
                ) AS question_count
            FROM quizzes q
            INNER JOIN class_subjects c ON q.course_id = c.course_id
            LEFT JOIN course_sections cs ON q.section_id = cs.course_sections_id
            WHERE q.quiz_id = :id
        ");

        $stmt->execute(['id' => $id]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return $result ?: null;
    }

    /**
     * Create a new quiz
     */
    public function create(array $data): int
    {
        $stmt = $this->db->prepare("
            INSERT INTO quizzes (
                course_id,
                section_id,
                title,
                description,
                duration_minutes,
                max_attempts,
                status,
                quiz_type,
                is_activated,
                show_results,
                randomize_questions,
                start_date,
                end_date
            ) VALUES (
                :course_id,
                :section_id,
                :title,
                :description,
                :duration_minutes,
                :max_attempts,
                :status,
                :quiz_type,
                :is_activated,
                :show_results,
                :randomize_questions,
                :start_date,
                :end_date
            )
        ");

        $stmt->execute([
            'course_id' => $data['course_id'],
            'section_id' => $data['section_id'] ?? null,
            'title' => $data['title'],
            'description' => $data['description'] ?? null,
            'duration_minutes' => $data['duration_minutes'],
            'max_attempts' => $data['max_attempts'] ?? 1,
            'status' => $data['status'] ?? 'draft',
            'quiz_type' => $data['quiz_type'] ?? 'graded',
            'is_activated' => $data['is_activated'] ?? 0,
            'show_results' => $data['show_results'] ?? 'after_end',
            'randomize_questions' => $data['randomize_questions'] ?? 0,
            'start_date' => $data['start_date'] ?? null,
            'end_date' => $data['end_date'] ?? null
        ]);

        return (int) $this->db->lastInsertId();
    }

    /**
     * Update a quiz
     */
    public function update(int $id, array $data): bool
    {
        $fields = [];
        $params = ['id' => $id];

        $allowedFields = [
            'section_id',
            'title',
            'description',
            'duration_minutes',
            'max_attempts',
            'status',
            'quiz_type',
            'is_activated',
            'show_results',
            'randomize_questions',
            'start_date',
            'end_date'
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

        $sql = "UPDATE quizzes SET " . implode(', ', $fields) . " WHERE quiz_id = :id";
        $stmt = $this->db->prepare($sql);

        return $stmt->execute($params);
    }

    /**
     * Delete a quiz
     */
    public function delete(int $id): bool
    {
        $stmt = $this->db->prepare("
            DELETE FROM quizzes WHERE quiz_id = :id
        ");

        return $stmt->execute(['id' => $id]);
    }

    /**
     * Get questions for a quiz
     */
    public function getQuestions(int $quizId): array
    {
        $stmt = $this->db->prepare("
            SELECT *
            FROM quiz_questions
            WHERE quiz_id = :quiz_id
            ORDER BY order_index ASC, created_at ASC
        ");

        $stmt->execute(['quiz_id' => $quizId]);
        $questions = $stmt->fetchAll(PDO::FETCH_ASSOC);

        if (!$questions) {
            return [];
        }

        foreach ($questions as &$question) {
            $optStmt = $this->db->prepare("
                SELECT option_label, option_text, is_correct
                FROM quiz_question_options
                WHERE question_id = :question_id
                ORDER BY option_label ASC
            ");
            $optStmt->execute(['question_id' => (int) $question['question_id']]);
            $question['options'] = $optStmt->fetchAll(PDO::FETCH_ASSOC);
        }

        return $questions;
    }

    /**
     * Get question with options
     */
    public function getQuestionWithOptions(int $questionId): ?array
    {
        $stmt = $this->db->prepare("
            SELECT *
            FROM quiz_questions
            WHERE question_id = :id
        ");

        $stmt->execute(['id' => $questionId]);
        $question = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$question) {
            return null;
        }

        // Get options
        $stmt = $this->db->prepare("
            SELECT *
            FROM quiz_question_options
            WHERE question_id = :question_id
            ORDER BY option_label ASC
        ");

        $stmt->execute(['question_id' => $questionId]);
        $question['options'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

        return $question;
    }

    /**
     * Find question by ID
     */
    public function findQuestionById(int $questionId): ?array
    {
        $stmt = $this->db->prepare("
            SELECT *
            FROM quiz_questions
            WHERE question_id = :id
        ");

        $stmt->execute(['id' => $questionId]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return $result ?: null;
    }

    /**
     * Add question to quiz
     */
    public function addQuestion(array $data): int
    {
        $imageQuestion = $data['image_question'] ?? ($data['image_name'] ?? null);

        $stmt = $this->db->prepare("
            INSERT INTO quiz_questions (
                quiz_id,
                question_text,
                image_question,
                question_type,
                points,
                difficulty,
                explanation,
                correct_answer,
                order_index
            ) VALUES (
                :quiz_id,
                :question_text,
                :image_question,
                :question_type,
                :points,
                :difficulty,
                :explanation,
                :correct_answer,
                :order_index
            )
        ");

        $stmt->execute([
            'quiz_id' => $data['quiz_id'],
            'question_text' => $data['question_text'],
            'image_question' => $imageQuestion,
            'question_type' => $data['question_type'],
            'points' => $data['points'] ?? 1,
            'difficulty' => $data['difficulty'] ?? 'medium',
            'explanation' => $data['explanation'] ?? null,
            'correct_answer' => $data['correct_answer'] ?? null,
            'order_index' => $data['order_index'] ?? 0
        ]);

        $questionId = (int) $this->db->lastInsertId();

        // Add options if provided
        if (!empty($data['options']) && is_array($data['options'])) {
            foreach ($data['options'] as $option) {
                $this->addQuestionOption($questionId, $option);
            }
        }

        return $questionId;
    }

    /**
     * Add option to question
     */
    public function addQuestionOption(int $questionId, array $data): int
    {
        $stmt = $this->db->prepare("
            INSERT INTO quiz_question_options (
                question_id,
                option_label,
                option_text,
                is_correct
            ) VALUES (
                :question_id,
                :option_label,
                :option_text,
                :is_correct
            )
        ");

        $stmt->execute([
            'question_id' => $questionId,
            'option_label' => $data['label'],
            'option_text' => $data['text'],
            'is_correct' => $data['is_correct'] ?? 0
        ]);

        return (int) $this->db->lastInsertId();
    }

    /**
     * Replace all options for a question
     */
    public function replaceQuestionOptions(int $questionId, array $options): void
    {
        $deleteStmt = $this->db->prepare("
            DELETE FROM quiz_question_options
            WHERE question_id = :question_id
        ");
        $deleteStmt->execute(['question_id' => $questionId]);

        foreach ($options as $option) {
            $this->addQuestionOption($questionId, $option);
        }
    }

    /**
     * Update question by ID
     */
    public function updateQuestion(int $questionId, array $data): bool
    {
        if (array_key_exists('image_name', $data) && !array_key_exists('image_question', $data)) {
            $data['image_question'] = $data['image_name'];
        }

        $fields = [];
        $params = ['question_id' => $questionId];

        $allowedFields = [
            'question_text',
            'image_question',
            'question_type',
            'points',
            'difficulty',
            'explanation',
            'correct_answer',
            'order_index'
        ];

        foreach ($allowedFields as $field) {
            if (array_key_exists($field, $data)) {
                $fields[] = "$field = :$field";
                $params[$field] = $data[$field];
            }
        }

        if (!empty($fields)) {
            $fields[] = 'updated_at = NOW()';
            $sql = "UPDATE quiz_questions SET " . implode(', ', $fields) . " WHERE question_id = :question_id";
            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);
        }

        if (array_key_exists('options', $data) && is_array($data['options'])) {
            $this->replaceQuestionOptions($questionId, $data['options']);
        }

        return true;
    }

    /**
     * Delete question by ID
     */
    public function deleteQuestion(int $questionId): bool
    {
        $stmt = $this->db->prepare("
            DELETE FROM quiz_questions
            WHERE question_id = :question_id
        ");

        return $stmt->execute(['question_id' => $questionId]);
    }

    /**
     * Start quiz (create submission)
     */
    public function startQuiz(int $quizId, int $studentId): int
    {
        // Get current attempt number
        $stmt = $this->db->prepare("
            SELECT COALESCE(MAX(attempt), 0) as last_attempt
            FROM quiz_submissions
            WHERE quiz_id = :quiz_id AND student_id = :student_id
        ");

        $stmt->execute([
            'quiz_id' => $quizId,
            'student_id' => $studentId
        ]);

        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        $attempt = $result['last_attempt'] + 1;

        // Create submission
        $stmt = $this->db->prepare("
            INSERT INTO quiz_submissions (
                quiz_id,
                student_id,
                attempt,
                status
            ) VALUES (
                :quiz_id,
                :student_id,
                :attempt,
                'in_progress'
            )
        ");

        $stmt->execute([
            'quiz_id' => $quizId,
            'student_id' => $studentId,
            'attempt' => $attempt
        ]);

        return (int) $this->db->lastInsertId();
    }

    /**
     * Submit quiz
     */
    public function submitQuiz(int $submissionId, array $answers, int $studentId): bool
    {
        // Get quiz details
        $stmt = $this->db->prepare("
            SELECT q.*, qs.quiz_id
            FROM quiz_submissions qs
            INNER JOIN quizzes q ON qs.quiz_id = q.quiz_id
            WHERE qs.submission_id = :submission_id
        ");

        $stmt->execute(['submission_id' => $submissionId]);
        $quiz = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$quiz) {
            return false;
        }

        $totalScore = 0;
        $maxScore = 0;

        // Process each answer
        foreach ($answers as $answer) {
            $questionId = $answer['question_id'];
            $studentAnswer = $answer['answer'];

            // Get question details
            $stmt = $this->db->prepare("
                SELECT * FROM quiz_questions WHERE question_id = :id
            ");
            $stmt->execute(['id' => $questionId]);
            $question = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$question) {
                continue;
            }

            $maxScore += $question['points'];
            $normalizedStudentAnswer = $this->normalizeAnswerForComparison((string) $studentAnswer, (string) ($question['question_type'] ?? ''));
            $normalizedCorrectAnswer = $this->normalizeAnswerForComparison((string) ($question['correct_answer'] ?? ''), (string) ($question['question_type'] ?? ''));
            $isCorrect = strcasecmp($normalizedStudentAnswer, $normalizedCorrectAnswer) === 0;
            $pointsEarned = $isCorrect ? $question['points'] : 0;
            $totalScore += $pointsEarned;

            // Save answer
            $stmt = $this->db->prepare("
                INSERT INTO quiz_submission_answers (
                    submission_id,
                    question_id,
                    answer,
                    is_correct,
                    points_earned
                ) VALUES (
                    :submission_id,
                    :question_id,
                    :answer,
                    :is_correct,
                    :points_earned
                )
            ");

            $stmt->execute([
                'submission_id' => $submissionId,
                'question_id' => $questionId,
                'answer' => $studentAnswer,
                'is_correct' => $isCorrect,
                'points_earned' => $pointsEarned
            ]);
        }

        // Update submission
        $stmt = $this->db->prepare("
            UPDATE quiz_submissions
            SET 
                score = :score,
                max_score = :max_score,
                status = 'submitted',
                submitted_at = NOW(),
                graded_at = NOW(),
                updated_at = NOW()
            WHERE submission_id = :id
        ");

        return $stmt->execute([
            'id' => $submissionId,
            'score' => $totalScore,
            'max_score' => $maxScore
        ]);
    }

    /**
     * Normalize answer format before comparison.
     * True/False questions may come in as A/B while correct answers are stored as true/false.
     */
    private function normalizeAnswerForComparison(string $value, string $questionType): string
    {
        $normalizedType = strtolower(trim($questionType));
        $normalizedValue = strtolower(trim($value));

        if ($normalizedType !== 'true_false') {
            return $normalizedValue;
        }

        if (in_array($normalizedValue, ['a', 'true', '1', 't', 'yes'], true)) {
            return 'true';
        }

        if (in_array($normalizedValue, ['b', 'false', '0', 'f', 'no'], true)) {
            return 'false';
        }

        return $normalizedValue;
    }

    /**
     * Get submission by ID
     */
    public function getSubmissionById(int $id): ?array
    {
        $stmt = $this->db->prepare("
            SELECT 
                qs.*,
                q.course_id,
                c.institution_id,
                c.teacher_id,
                s.student_id_number,
                CONCAT(u.first_name, ' ', u.last_name) as student_name
            FROM quiz_submissions qs
            INNER JOIN quizzes q ON qs.quiz_id = q.quiz_id
            INNER JOIN class_subjects c ON q.course_id = c.course_id
            INNER JOIN students s ON qs.student_id = s.student_id
            LEFT JOIN users u ON u.user_id = s.user_id
            WHERE qs.submission_id = :id
        ");

        $stmt->execute(['id' => $id]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return $result ?: null;
    }

    /**
     * Get submission answers joined with question metadata for review UI
     */
    public function getSubmissionAnswerDetails(int $submissionId): array
    {
        $stmt = $this->db->prepare("\n            SELECT\n                q.question_id,\n                q.question_text,\n                q.correct_answer,\n                q.explanation,\n                q.order_index,\n                q.question_type,\n                q.points,\n                sa.answer AS student_answer,\n                sa.is_correct,\n                sa.points_earned\n            FROM quiz_submission_answers sa\n            INNER JOIN quiz_questions q ON q.question_id = sa.question_id\n            WHERE sa.submission_id = :submission_id\n            ORDER BY q.order_index ASC, q.question_id ASC\n        ");

        $stmt->execute(['submission_id' => $submissionId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Get student's attempts for a quiz
     */
    public function getStudentAttempts(int $quizId, int $studentId): array
    {
        $stmt = $this->db->prepare("
            SELECT *
            FROM quiz_submissions
            WHERE quiz_id = :quiz_id AND student_id = :student_id
            ORDER BY attempt DESC
        ");

        $stmt->execute([
            'quiz_id' => $quizId,
            'student_id' => $studentId
        ]);

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Get quiz result summary for teachers/admins
     */
    public function getQuizResultsSummary(int $quizId): array
    {
        $stmt = $this->db->prepare("
            SELECT
                COUNT(*) AS total_attempts,
                COUNT(DISTINCT qs.student_id) AS unique_students,
                SUM(CASE WHEN qs.status = 'submitted' THEN 1 ELSE 0 END) AS submitted_attempts,
                SUM(CASE WHEN qs.status = 'in_progress' THEN 1 ELSE 0 END) AS in_progress_attempts,
                COALESCE(AVG(CASE WHEN qs.max_score > 0 THEN (qs.score / qs.max_score) * 100 END), 0) AS avg_percentage,
                COALESCE(MAX(CASE WHEN qs.max_score > 0 THEN (qs.score / qs.max_score) * 100 END), 0) AS best_percentage,
                COALESCE(MIN(CASE WHEN qs.max_score > 0 THEN (qs.score / qs.max_score) * 100 END), 0) AS lowest_percentage
            FROM quiz_submissions qs
            WHERE qs.quiz_id = :quiz_id
        ");

        $stmt->execute(['quiz_id' => $quizId]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);

        return $result ?: [
            'total_attempts' => 0,
            'unique_students' => 0,
            'submitted_attempts' => 0,
            'in_progress_attempts' => 0,
            'avg_percentage' => 0,
            'best_percentage' => 0,
            'lowest_percentage' => 0,
        ];
    }

    /**
     * Get quiz submissions for teachers/admins
     */
    public function getQuizSubmissions(int $quizId): array
    {
        $stmt = $this->db->prepare("
            SELECT
                qs.submission_id,
                qs.quiz_id,
                qs.student_id,
                qs.attempt,
                qs.status,
                qs.score,
                qs.max_score,
                qs.created_at AS started_at,
                qs.submitted_at,
                qs.graded_at,
                s.student_id_number,
                TRIM(CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, ''))) AS student_name
            FROM quiz_submissions qs
            LEFT JOIN students s ON s.student_id = qs.student_id
            LEFT JOIN users u ON u.user_id = s.user_id
            WHERE qs.quiz_id = :quiz_id
            ORDER BY qs.submitted_at DESC, qs.created_at DESC, qs.attempt DESC
        ");

        $stmt->execute(['quiz_id' => $quizId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Parent dashboard: per-subject quiz score summary for a student
     */
    public function getStudentQuizPerformanceBySubject(int $studentId): array
    {
        $stmt = $this->db->prepare("\n            SELECT\n                COALESCE(s.subject_name, CONCAT('Course ', q.course_id)) AS subject_name,\n                COUNT(*) AS submitted_attempts,\n                ROUND(AVG(CASE WHEN qs.max_score > 0 THEN (qs.score / qs.max_score) * 100 END), 1) AS avg_percentage,\n                ROUND(MAX(CASE WHEN qs.max_score > 0 THEN (qs.score / qs.max_score) * 100 END), 1) AS best_percentage\n            FROM quiz_submissions qs\n            INNER JOIN quizzes q ON q.quiz_id = qs.quiz_id\n            LEFT JOIN class_subjects cs ON cs.course_id = q.course_id\n            LEFT JOIN subjects s ON s.subject_id = cs.subject_id\n            WHERE qs.student_id = :student_id\n              AND qs.status = 'submitted'\n            GROUP BY COALESCE(s.subject_name, CONCAT('Course ', q.course_id))\n            ORDER BY avg_percentage DESC, subject_name ASC\n        ");

        $stmt->execute(['student_id' => $studentId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Parent dashboard: quiz completion status summary for a student
     */
    public function getStudentQuizCompletionStatus(int $studentId): array
    {
        $stmt = $this->db->prepare("\n            SELECT\n                COUNT(DISTINCT q.quiz_id) AS assigned_quizzes,\n                COUNT(DISTINCT CASE WHEN subm.status = 'submitted' THEN q.quiz_id END) AS completed_quizzes,\n                COUNT(DISTINCT CASE WHEN subm.status = 'in_progress' THEN q.quiz_id END) AS in_progress_quizzes,\n                COUNT(DISTINCT subm.submission_id) AS total_attempts\n            FROM students st\n            INNER JOIN class_subjects cs\n                ON cs.class_id = st.class_id\n               AND LOWER(COALESCE(cs.status, '')) = 'active'\n            INNER JOIN quizzes q ON q.course_id = cs.course_id\n            LEFT JOIN quiz_submissions subm\n                ON subm.quiz_id = q.quiz_id\n               AND subm.student_id = st.student_id\n            WHERE st.student_id = :student_id\n              AND LOWER(COALESCE(q.status, '')) = 'active'\n        ");

        $stmt->execute(['student_id' => $studentId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC) ?: [];

        $assigned = (int) ($row['assigned_quizzes'] ?? 0);
        $completed = (int) ($row['completed_quizzes'] ?? 0);
        $inProgress = (int) ($row['in_progress_quizzes'] ?? 0);
        $attempts = (int) ($row['total_attempts'] ?? 0);
        $completionRate = $assigned > 0 ? round(($completed / $assigned) * 100, 1) : 0.0;

        return [
            'assigned_quizzes' => $assigned,
            'completed_quizzes' => $completed,
            'in_progress_quizzes' => $inProgress,
            'total_attempts' => $attempts,
            'completion_rate' => $completionRate,
        ];
    }

    /**
     * Parent dashboard: recent quiz attempts for a student
     */
    public function getRecentStudentQuizAttempts(int $studentId, int $limit = 6): array
    {
        $stmt = $this->db->prepare("\n            SELECT\n                qs.submission_id,\n                qs.quiz_id,\n                q.title AS quiz_title,\n                COALESCE(s.subject_name, CONCAT('Course ', q.course_id)) AS subject_name,\n                qs.attempt,\n                qs.status,\n                qs.score,\n                qs.max_score,\n                ROUND(CASE WHEN qs.max_score > 0 THEN (qs.score / qs.max_score) * 100 ELSE NULL END, 1) AS percentage,\n                qs.submitted_at,\n                qs.created_at\n            FROM quiz_submissions qs\n            INNER JOIN quizzes q ON q.quiz_id = qs.quiz_id\n            LEFT JOIN class_subjects cs ON cs.course_id = q.course_id\n            LEFT JOIN subjects s ON s.subject_id = cs.subject_id\n            WHERE qs.student_id = :student_id\n            ORDER BY COALESCE(qs.submitted_at, qs.created_at) DESC, qs.submission_id DESC\n            LIMIT :limit\n        ");

        $stmt->bindValue(':student_id', $studentId, PDO::PARAM_INT);
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}