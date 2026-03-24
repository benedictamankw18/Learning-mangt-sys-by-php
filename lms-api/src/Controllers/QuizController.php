<?php

namespace App\Controllers;

use App\Repositories\QuizRepository;
use App\Repositories\ClassSubjectRepository;
use App\Repositories\StudentRepository;
use App\Utils\Response;
use App\Utils\Validator;
use App\Middleware\RoleMiddleware;

class QuizController
{
    private QuizRepository $repo;
    private ClassSubjectRepository $courseRepo;
    private StudentRepository $studentRepo;

    public function __construct()
    {
        $this->repo = new QuizRepository();
        $this->courseRepo = new ClassSubjectRepository();
        $this->studentRepo = new StudentRepository();
    }

    /**
     * Resolve student_id from auth payload; fallback to lookup by user_id.
     */
    private function resolveStudentId(array $user): ?int
    {
        if (isset($user['student_id']) && is_numeric($user['student_id'])) {
            $studentId = (int) $user['student_id'];
            return $studentId > 0 ? $studentId : null;
        }

        if (!isset($user['user_id']) || !is_numeric($user['user_id'])) {
            return null;
        }

        $student = $this->studentRepo->findByUserId((int) $user['user_id']);
        if (!$student || !isset($student['student_id']) || !is_numeric($student['student_id'])) {
            return null;
        }

        $studentId = (int) $student['student_id'];
        return $studentId > 0 ? $studentId : null;
    }

    /**
     * Get all quizzes for a course
     * GET /courses/{courseId}/quizzes
     */
    public function getByCourse(array $user, int $courseId): void
    {
        // Check if course exists and user has access
        $course = $this->courseRepo->findById($courseId);

        if (!$course) {
            Response::error('Course not found', 404);
            return;
        }

        // Check authorization
        if ($user['role'] !== 'super_admin' && $course['institution_id'] != $user['institution_id']) {
            Response::forbidden('You do not have access to this course');
            return;
        }

        $quizzes = $this->repo->getCourseQuizzes($courseId);

        // Student visibility rule: only active quizzes should be visible.
        if (($user['role'] ?? '') === 'student') {
            $quizzes = array_values(array_filter($quizzes, static function ($quiz) {
                return strtolower((string) ($quiz['status'] ?? '')) === 'active';
            }));
        }

        Response::success([
            'quizzes' => $quizzes,
            'count' => count($quizzes)
        ]);
    }

    /**
     * Get a single quiz
     * GET /quizzes/{id}
     */
    public function show(array $user, int $id): void
    {
        $quiz = $this->repo->findById($id);

        if (!$quiz) {
            Response::error('Quiz not found', 404);
            return;
        }

        // Check authorization
        if ($user['role'] !== 'super_admin' && $quiz['institution_id'] != $user['institution_id']) {
            Response::forbidden('You do not have access to this quiz');
            return;
        }

        Response::success($quiz);
    }

    /**
     * Create a new quiz (teacher/admin)
     * POST /quizzes
     */
    public function create(array $user): void
    {
        $roleMiddleware = new RoleMiddleware($user);
        if (!$roleMiddleware->requireRole(['admin', 'teacher', 'super_admin'])) {
            return;
        }

        $data = json_decode(file_get_contents('php://input'), true);

        $validator = new Validator($data);
        $validator->required(['course_id', 'title', 'duration_minutes'])
            ->numeric('course_id')
            ->numeric('section_id')
            ->max('title', 200)
            ->numeric('duration_minutes')
            ->numeric('max_attempts')
            ->numeric('randomize_questions')
            ->in('status', ['draft', 'active', 'archived'])
            ->in('quiz_type', ['graded', 'practice', 'survey'])
            ->in('show_results', ['instant', 'after_end', 'never']);

        if ($validator->fails()) {
            Response::validationError($validator->getErrors());
            return;
        }

        // Check if course exists
        $course = $this->courseRepo->findById($data['course_id']);

        if (!$course) {
            Response::error('Course not found', 404);
            return;
        }

        // Check authorization
        if ($user['role'] !== 'super_admin' && $course['institution_id'] != $user['institution_id']) {
            Response::forbidden('You do not have access to this course');
            return;
        }

        // Teachers can only create quizzes for their own courses
        if ($user['role'] === 'teacher' && $course['teacher_id'] != $user['teacher_id']) {
            Response::forbidden('You can only create quizzes for your own courses');
            return;
        }

        $quizId = $this->repo->create($data);

        Response::success([
            'message' => 'Quiz created successfully',
            'quiz_id' => $quizId
        ], 201);
    }

    /**
     * Update a quiz (teacher/admin)
     * PUT /quizzes/{id}
     */
    public function update(array $user, int $id): void
    {
        $roleMiddleware = new RoleMiddleware($user);
        if (!$roleMiddleware->requireRole(['admin', 'teacher', 'super_admin'])) {
            return;
        }

        // Check if quiz exists
        $quiz = $this->repo->findById($id);

        if (!$quiz) {
            Response::error('Quiz not found', 404);
            return;
        }

        // Check authorization
        if ($user['role'] !== 'super_admin' && $quiz['institution_id'] != $user['institution_id']) {
            Response::forbidden('You do not have access to this quiz');
            return;
        }

        // Teachers can only update their own quizzes
        if ($user['role'] === 'teacher' && $quiz['teacher_id'] != $user['teacher_id']) {
            Response::forbidden('You can only update your own quizzes');
            return;
        }

        $data = json_decode(file_get_contents('php://input'), true);

        $validator = new Validator($data);
        $validator->numeric('section_id')
            ->max('title', 200)
            ->numeric('duration_minutes')
            ->numeric('max_attempts')
            ->numeric('randomize_questions')
            ->in('status', ['draft', 'active', 'archived'])
            ->in('quiz_type', ['graded', 'practice', 'survey'])
            ->in('show_results', ['instant', 'after_end', 'never']);

        if ($validator->fails()) {
            Response::validationError($validator->getErrors());
            return;
        }

        $this->repo->update($id, $data);

        Response::success(['message' => 'Quiz updated successfully']);
    }

    /**
     * Delete a quiz (teacher/admin)
     * DELETE /quizzes/{id}
     */
    public function delete(array $user, int $id): void
    {
        $roleMiddleware = new RoleMiddleware($user);
        if (!$roleMiddleware->requireRole(['admin', 'teacher', 'super_admin'])) {
            return;
        }

        // Check if quiz exists
        $quiz = $this->repo->findById($id);

        if (!$quiz) {
            Response::error('Quiz not found', 404);
            return;
        }

        // Check authorization
        if ($user['role'] !== 'super_admin' && $quiz['institution_id'] != $user['institution_id']) {
            Response::forbidden('You do not have access to this quiz');
            return;
        }

        // Teachers can only delete their own quizzes
        if ($user['role'] === 'teacher' && $quiz['teacher_id'] != $user['teacher_id']) {
            Response::forbidden('You can only delete your own quizzes');
            return;
        }

        $this->repo->delete($id);

        Response::success(['message' => 'Quiz deleted successfully']);
    }

    /**
     * Get questions for a quiz (teacher/admin)
     * GET /quizzes/{id}/questions
     */
    public function getQuestions(array $user, int $id): void
    {
        // Check if quiz exists
        $quiz = $this->repo->findById($id);

        if (!$quiz) {
            Response::error('Quiz not found', 404);
            return;
        }

        // Check authorization
        if ($user['role'] !== 'super_admin' && $quiz['institution_id'] != $user['institution_id']) {
            Response::forbidden('You do not have access to this quiz');
            return;
        }

        $questions = $this->repo->getQuestions($id);

        Response::success([
            'questions' => $questions,
            'count' => count($questions)
        ]);
    }

    /**
     * Add question to quiz (teacher/admin)
     * POST /quizzes/{id}/questions
     */
    public function addQuestion(array $user, int $id): void
    {
        $roleMiddleware = new RoleMiddleware($user);
        if (!$roleMiddleware->requireRole(['admin', 'teacher', 'super_admin'])) {
            return;
        }

        // Check if quiz exists
        $quiz = $this->repo->findById($id);

        if (!$quiz) {
            Response::error('Quiz not found', 404);
            return;
        }

        // Check authorization
        if ($user['role'] !== 'super_admin' && $quiz['institution_id'] != $user['institution_id']) {
            Response::forbidden('You do not have access to this quiz');
            return;
        }

        // Teachers can only add questions to their own quizzes
        if ($user['role'] === 'teacher' && $quiz['teacher_id'] != $user['teacher_id']) {
            Response::forbidden('You can only add questions to your own quizzes');
            return;
        }

        $data = json_decode(file_get_contents('php://input'), true);

        $validator = new Validator($data);
        $validator->required(['question_text', 'question_type'])
            ->in('question_type', ['multiple_choice', 'true_false', 'short_answer', 'essay'])
            ->numeric('points')
            ->in('difficulty', ['easy', 'medium', 'hard'])
            ->max('image_question', 255)
            ->max('image_name', 255)
            ->max('correct_answer', 500)
            ->numeric('order_index');

        if ($validator->fails()) {
            Response::validationError($validator->getErrors());
            return;
        }

        if (array_key_exists('image_name', $data) && !array_key_exists('image_question', $data)) {
            $data['image_question'] = $data['image_name'];
        }

        if (array_key_exists('image_question', $data)) {
            $data['image_question'] = $this->normalizeImageQuestionPath($data['image_question']);
        }

        if (!empty($data['options']) && is_array($data['options'])) {
            $normalizedOptions = [];
            foreach ($data['options'] as $option) {
                $label = strtoupper(trim((string) ($option['label'] ?? '')));
                $text = trim((string) ($option['text'] ?? ''));
                if (!$label || !$text) {
                    continue;
                }

                $normalizedOptions[] = [
                    'label' => $label,
                    'text' => $text,
                    'is_correct' => !empty($option['is_correct']) ? 1 : 0,
                ];
            }

            $data['options'] = $normalizedOptions;
        }

        $data['quiz_id'] = $id;

        $questionId = $this->repo->addQuestion($data);

        Response::success([
            'message' => 'Question added successfully',
            'question_id' => $questionId
        ], 201);
    }

    /**
     * Update question (teacher/admin)
     * PUT /quiz-questions/{id}
     */
    public function updateQuestion(array $user, int $id): void
    {
        $roleMiddleware = new RoleMiddleware($user);
        if (!$roleMiddleware->requireRole(['admin', 'teacher', 'super_admin'])) {
            return;
        }

        $question = $this->repo->findQuestionById($id);
        if (!$question) {
            Response::error('Question not found', 404);
            return;
        }

        $quiz = $this->repo->findById((int) $question['quiz_id']);
        if (!$quiz) {
            Response::error('Quiz not found', 404);
            return;
        }

        if ($user['role'] !== 'super_admin' && $quiz['institution_id'] != $user['institution_id']) {
            Response::forbidden('You do not have access to this question');
            return;
        }

        if ($user['role'] === 'teacher' && $quiz['teacher_id'] != $user['teacher_id']) {
            Response::forbidden('You can only update questions in your own quizzes');
            return;
        }

        $data = json_decode(file_get_contents('php://input'), true);

        $validator = new Validator($data);
        $validator->max('question_text', 65535)
            ->in('question_type', ['multiple_choice', 'true_false', 'short_answer', 'essay'])
            ->numeric('points')
            ->in('difficulty', ['easy', 'medium', 'hard'])
            ->max('image_question', 255)
            ->max('image_name', 255)
            ->max('correct_answer', 500)
            ->numeric('order_index');

        if ($validator->fails()) {
            Response::validationError($validator->getErrors());
            return;
        }

        if (array_key_exists('image_name', $data) && !array_key_exists('image_question', $data)) {
            $data['image_question'] = $data['image_name'];
        }

        if (array_key_exists('image_question', $data)) {
            $data['image_question'] = $this->normalizeImageQuestionPath($data['image_question']);
        }

        if (array_key_exists('options', $data) && is_array($data['options'])) {
            $normalizedOptions = [];
            foreach ($data['options'] as $option) {
                $label = strtoupper(trim((string) ($option['label'] ?? '')));
                $text = trim((string) ($option['text'] ?? ''));
                if (!$label || !$text) {
                    continue;
                }

                $normalizedOptions[] = [
                    'label' => $label,
                    'text' => $text,
                    'is_correct' => !empty($option['is_correct']) ? 1 : 0,
                ];
            }

            $data['options'] = $normalizedOptions;
        }

        $this->repo->updateQuestion($id, $data);

        Response::success(['message' => 'Question updated successfully']);
    }

    private function normalizeImageQuestionPath($value): ?string
    {
        if (!is_string($value)) {
            return null;
        }

        $path = trim($value);
        if ($path === '') {
            return null;
        }

        if (preg_match('#^https?://#i', $path)) {
            return $path;
        }

        if (strpos($path, '/api/upload/') === 0) {
            return $path;
        }

        if (strpos($path, '/uploads/') === 0) {
            return '/api' . $path;
        }

        if (strpos($path, '/') === false) {
            return '/api/upload/quiz-questions/' . $path;
        }

        return $path;
    }

    /**
     * Delete question (teacher/admin)
     * DELETE /quiz-questions/{id}
     */
    public function deleteQuestion(array $user, int $id): void
    {
        $roleMiddleware = new RoleMiddleware($user);
        if (!$roleMiddleware->requireRole(['admin', 'teacher', 'super_admin'])) {
            return;
        }

        $question = $this->repo->findQuestionById($id);
        if (!$question) {
            Response::error('Question not found', 404);
            return;
        }

        $quiz = $this->repo->findById((int) $question['quiz_id']);
        if (!$quiz) {
            Response::error('Quiz not found', 404);
            return;
        }

        if ($user['role'] !== 'super_admin' && $quiz['institution_id'] != $user['institution_id']) {
            Response::forbidden('You do not have access to this question');
            return;
        }

        if ($user['role'] === 'teacher' && $quiz['teacher_id'] != $user['teacher_id']) {
            Response::forbidden('You can only delete questions in your own quizzes');
            return;
        }

        $this->repo->deleteQuestion($id);
        Response::success(['message' => 'Question deleted successfully']);
    }

    /**
     * Start quiz (student)
     * POST /quizzes/{id}/start
     */
    public function startQuiz(array $user, int $id): void
    {
        $roleMiddleware = new RoleMiddleware($user);
        if (!$roleMiddleware->requireRole(['student'])) {
            return;
        }

        $studentId = $this->resolveStudentId($user);
        if ($studentId === null) {
            Response::forbidden('Student profile not found for this account');
            return;
        }

        // Check if quiz exists
        $quiz = $this->repo->findById($id);

        if (!$quiz) {
            Response::error('Quiz not found', 404);
            return;
        }

        // Check authorization (student must be enrolled)
        if ($user['role'] !== 'super_admin' && $quiz['institution_id'] != $user['institution_id']) {
            Response::forbidden('You do not have access to this quiz');
            return;
        }

        // Check if quiz is activated
        if (!$quiz['is_activated']) {
            Response::error('Quiz is not activated', 400);
            return;
        }

        // Check attempts
        $attempts = $this->repo->getStudentAttempts($id, $studentId);
        if (count($attempts) >= $quiz['max_attempts']) {
            Response::error('Maximum attempts reached', 400);
            return;
        }

        $submissionId = $this->repo->startQuiz($id, $studentId);

        Response::success([
            'message' => 'Quiz started successfully',
            'submission_id' => $submissionId,
            'duration_minutes' => $quiz['duration_minutes']
        ], 201);
    }

    /**
     * Submit quiz (student)
     * POST /quiz-submissions/{id}/submit
     */
    public function submitQuiz(array $user, int $id): void
    {
        $roleMiddleware = new RoleMiddleware($user);
        if (!$roleMiddleware->requireRole(['student'])) {
            return;
        }

        $studentId = $this->resolveStudentId($user);
        if ($studentId === null) {
            Response::forbidden('Student profile not found for this account');
            return;
        }

        // Check if submission exists
        $submission = $this->repo->getSubmissionById($id);

        if (!$submission) {
            Response::error('Submission not found', 404);
            return;
        }

        // Verify ownership
        if ($submission['student_id'] != $studentId) {
            Response::forbidden('This submission does not belong to you');
            return;
        }

        // Check if already submitted
        if ($submission['status'] === 'submitted') {
            Response::error('Quiz already submitted', 400);
            return;
        }

        $data = json_decode(file_get_contents('php://input'), true);

        $validator = new Validator($data);
        $validator->required(['answers']);

        if ($validator->fails()) {
            Response::validationError($validator->getErrors());
            return;
        }

        // Ensure answers is an array
        if (!is_array($data['answers'])) {
            Response::error('Answers must be an array', 400);
            return;
        }

        $this->repo->submitQuiz($id, $data['answers'], $studentId);

        Response::success(['message' => 'Quiz submitted successfully']);
    }

    /**
     * Get quiz results (student)
     * GET /quiz-submissions/{id}
     */
    public function getSubmissionResults(array $user, int $id): void
    {
        $studentId = null;
        if (($user['role'] ?? '') === 'student') {
            $studentId = $this->resolveStudentId($user);
            if ($studentId === null) {
                Response::forbidden('Student profile not found for this account');
                return;
            }
        }

        // Check if submission exists
        $submission = $this->repo->getSubmissionById($id);

        if (!$submission) {
            Response::error('Submission not found', 404);
            return;
        }

        // Students can only view their own submissions
        if (($user['role'] ?? '') === 'student' && $submission['student_id'] != $studentId) {
            Response::forbidden('This submission does not belong to you');
            return;
        }

        // Teachers/admins can view all submissions for their courses
        if (in_array($user['role'], ['teacher', 'admin'])) {
            if ($user['role'] !== 'super_admin' && $submission['institution_id'] != $user['institution_id']) {
                Response::forbidden('You do not have access to this submission');
                return;
            }

            if ($user['role'] === 'teacher' && $submission['teacher_id'] != $user['teacher_id']) {
                Response::forbidden('You can only view submissions for your own courses');
                return;
            }
        }

        $answerDetails = $this->repo->getSubmissionAnswerDetails($id);
        $questions = [];
        $answers = [];

        foreach ($answerDetails as $row) {
            $questionId = (int) ($row['question_id'] ?? 0);
            if ($questionId <= 0) {
                continue;
            }

            $questions[] = [
                'question_id' => $questionId,
                'question_text' => $row['question_text'] ?? null,
                'correct_answer' => $row['correct_answer'] ?? null,
                'explanation' => $row['explanation'] ?? null,
                'question_type' => $row['question_type'] ?? null,
                'points' => $row['points'] ?? null,
                'student_answer' => $row['student_answer'] ?? null,
                'is_correct' => (int) ($row['is_correct'] ?? 0) === 1,
                'points_earned' => $row['points_earned'] ?? null,
            ];
            $answers[(string) $questionId] = (string) ($row['student_answer'] ?? '');
        }

        Response::success(array_merge($submission, [
            'questions' => $questions,
            'answers' => $answers,
        ]));
    }

    /**
     * Get quiz results and analytics (teacher/admin)
     * GET /quizzes/{id}/results
     */
    public function getResults(array $user, int $id): void
    {
        $roleMiddleware = new RoleMiddleware($user);
        if (!$roleMiddleware->requireRole(['teacher', 'admin', 'super_admin'])) {
            return;
        }

        $quiz = $this->repo->findById($id);

        if (!$quiz) {
            Response::error('Quiz not found', 404);
            return;
        }

        if ($user['role'] !== 'super_admin' && $quiz['institution_id'] != $user['institution_id']) {
            Response::forbidden('You do not have access to this quiz');
            return;
        }

        if ($user['role'] === 'teacher' && $quiz['teacher_id'] != $user['teacher_id']) {
            Response::forbidden('You can only view results for your own quizzes');
            return;
        }

        $summary = $this->repo->getQuizResultsSummary($id);
        $submissions = $this->repo->getQuizSubmissions($id);

        Response::success([
            'quiz' => $quiz,
            'summary' => $summary,
            'submissions' => $submissions,
            'count' => count($submissions)
        ]);
    }

    /**
     * Get student's attempts for a quiz (student)
     * GET /quizzes/{id}/my-attempts
     */
    public function getMyAttempts(array $user, int $id): void
    {
        $roleMiddleware = new RoleMiddleware($user);
        if (!$roleMiddleware->requireRole(['student'])) {
            return;
        }

        $studentId = $this->resolveStudentId($user);
        if ($studentId === null) {
            Response::forbidden('Student profile not found for this account');
            return;
        }

        // Check if quiz exists
        $quiz = $this->repo->findById($id);

        if (!$quiz) {
            Response::error('Quiz not found', 404);
            return;
        }

        $attempts = $this->repo->getStudentAttempts($id, $studentId);

        Response::success([
            'attempts' => $attempts,
            'count' => count($attempts),
            'max_attempts' => $quiz['max_attempts']
        ]);
    }
}
