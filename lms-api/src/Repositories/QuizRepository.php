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
            $isCorrect = ($studentAnswer == $question['correct_answer']);
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
                s.student_number,
                CONCAT(s.first_name, ' ', s.last_name) as student_name
            FROM quiz_submissions qs
            INNER JOIN quizzes q ON qs.quiz_id = q.quiz_id
            INNER JOIN class_subjects c ON q.course_id = c.course_id
            INNER JOIN students s ON qs.student_id = s.student_id
            WHERE qs.submission_id = :id
        ");

        $stmt->execute(['id' => $id]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return $result ?: null;
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
}