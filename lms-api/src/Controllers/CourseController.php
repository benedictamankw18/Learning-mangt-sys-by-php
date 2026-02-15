<?php

namespace App\Controllers;

use App\Utils\Response;
use App\Utils\Validator;
use App\Repositories\CourseRepository;
use App\Repositories\CourseReviewRepository;
use App\Repositories\CourseScheduleRepository;
use App\Repositories\CourseMaterialRepository;
use App\Repositories\TeacherRepository;
use App\Repositories\StudentRepository;
use App\Middleware\RoleMiddleware;

class CourseController
{
    private CourseRepository $courseRepo;
    private CourseReviewRepository $reviewRepo;
    private CourseScheduleRepository $scheduleRepo;
    private CourseMaterialRepository $materialRepo;
    private TeacherRepository $teacherRepo;
    private StudentRepository $studentRepo;

    public function __construct()
    {
        $this->courseRepo = new CourseRepository();
        $this->reviewRepo = new CourseReviewRepository();
        $this->scheduleRepo = new CourseScheduleRepository();
        $this->materialRepo = new CourseMaterialRepository();
        $this->teacherRepo = new TeacherRepository();
        $this->studentRepo = new StudentRepository();
    }

    public function index(array $user): void
    {
        $page = (int) ($_GET['page'] ?? 1);
        $limit = (int) ($_GET['limit'] ?? 20);
        $teacherId = isset($_GET['teacher_id']) ? (int) $_GET['teacher_id'] : null;
        $status = $_GET['status'] ?? null;

        $courses = $this->courseRepo->getAll($page, $limit, $teacherId, $status);
        $total = $this->courseRepo->count($teacherId, $status);

        Response::paginated($courses, $total, $page, $limit);
    }

    public function show(array $user, int $id): void
    {
        $course = $this->courseRepo->findById($id);

        if (!$course) {
            Response::notFound('Course not found');
            return;
        }

        // Students can only view courses they're enrolled in
        $roleMiddleware = new RoleMiddleware($user);
        if ($roleMiddleware->isStudent() && !$roleMiddleware->isAdmin()) {
            $student = $this->studentRepo->findByUserId($user['user_id']);
            if (!$student) {
                Response::forbidden('Student profile not found');
                return;
            }

            if (!$this->courseRepo->isStudentEnrolled($student['student_id'], $id)) {
                Response::forbidden('You are not enrolled in this course');
                return;
            }
        }

        Response::success($course);
    }

    public function create(array $user): void
    {
        $roleMiddleware = new RoleMiddleware($user);

        if (!$roleMiddleware->requireRole(['admin', 'teacher'])) {
            return;
        }

        $data = json_decode(file_get_contents('php://input'), true);

        $validator = new Validator($data);
        $validator->required(['course_code', 'course_name']);

        // Validate teacher_id only if provided
        if (isset($data['teacher_id'])) {
            $validator->numeric('teacher_id');
        }

        // Validate new class structure fields
        if (isset($data['program'])) {
            $validator->max('program', 100);
        }

        if (isset($data['grade_level'])) {
            $validator->max('grade_level', 20);
        }

        if (isset($data['section'])) {
            $validator->max('section', 50);
        }

        if (isset($data['subject_id'])) {
            $validator->numeric('subject_id');
        }

        if (isset($data['academic_year_id'])) {
            $validator->numeric('academic_year_id');
        }

        if (isset($data['semester_id'])) {
            $validator->numeric('semester_id');
        }

        $validator->numeric('credits')
            ->numeric('duration_weeks');

        if ($validator->fails()) {
            Response::validationError($validator->getErrors());
            return;
        }

        // Teachers can only create courses for themselves
        if ($roleMiddleware->isTeacher() && !$roleMiddleware->isAdmin()) {
            $teacher = $this->teacherRepo->findByUserId($user['user_id']);
            if (!$teacher) {
                Response::forbidden('Teacher profile not found');
                return;
            }
            // Auto-assign teacher_id if not provided
            if (!isset($data['teacher_id'])) {
                $data['teacher_id'] = $teacher['teacher_id'];
            } elseif ($teacher['teacher_id'] != $data['teacher_id']) {
                Response::forbidden('You can only create courses for yourself');
                return;
            }
        }

        $courseId = $this->courseRepo->create($data);

        if (!$courseId) {
            Response::serverError('Failed to create course');
            return;
        }

        $course = $this->courseRepo->findById($courseId);
        Response::success($course, 201);
    }

    public function update(array $user, int $id): void
    {
        $roleMiddleware = new RoleMiddleware($user);

        if (!$roleMiddleware->hasRole(['admin', 'teacher'])) {
            Response::forbidden('Only admins and teachers can update courses');
            return;
        }

        $course = $this->courseRepo->findById($id);

        if (!$course) {
            Response::notFound('Course not found');
            return;
        }

        // Teachers can only update their own courses
        if ($roleMiddleware->isTeacher() && !$roleMiddleware->isAdmin()) {
            $teacher = $this->teacherRepo->findByUserId($user['user_id']);
            if (!$teacher || $course['teacher_id'] != $teacher['teacher_id']) {
                Response::forbidden('You can only update your own courses');
                return;
            }
        }

        $data = json_decode(file_get_contents('php://input'), true);

        if ($this->courseRepo->update($id, $data)) {
            $updated = $this->courseRepo->findById($id);
            Response::success($updated);
        } else {
            Response::serverError('Failed to update course');
        }
    }

    public function delete(array $user, int $id): void
    {
        $roleMiddleware = new RoleMiddleware($user);

        if (!$roleMiddleware->requireRole('admin')) {
            return;
        }

        if ($this->courseRepo->delete($id)) {
            Response::success(['message' => 'Course archived successfully']);
        } else {
            Response::serverError('Failed to archive course');
        }
    }

    public function getEnrolledStudents(array $user, int $id): void
    {
        $roleMiddleware = new RoleMiddleware($user);

        $course = $this->courseRepo->findById($id);

        if (!$course) {
            Response::notFound('Course not found');
            return;
        }

        // Teachers can only view their own courses
        if ($roleMiddleware->isTeacher() && !$roleMiddleware->isAdmin()) {
            $teacher = $this->teacherRepo->findByUserId($user['user_id']);
            if (!$teacher || $course['teacher_id'] != $teacher['teacher_id']) {
                Response::forbidden('You can only view students in your own courses');
                return;
            }
        }

        $page = (int) ($_GET['page'] ?? 1);
        $limit = (int) ($_GET['limit'] ?? 20);

        $students = $this->courseRepo->getEnrolledStudents($id, $page, $limit);

        Response::success($students);
    }

    public function getMaterials(array $user, int $id): void
    {
        $course = $this->courseRepo->findById($id);

        if (!$course) {
            Response::notFound('Course not found');
            return;
        }

        // Students can only access materials for courses they're enrolled in
        $roleMiddleware = new RoleMiddleware($user);
        if ($roleMiddleware->isStudent() && !$roleMiddleware->isAdmin()) {
            $student = $this->studentRepo->findByUserId($user['user_id']);
            if (!$student) {
                Response::forbidden('Student profile not found');
                return;
            }

            if (!$this->courseRepo->isStudentEnrolled($student['student_id'], $id)) {
                Response::forbidden('You can only access materials for courses you are enrolled in');
                return;
            }
        }

        $materials = $this->materialRepo->getCourseMaterials($id);
        Response::success($materials);
    }

    /**
     * Create a course material
     * POST /api/courses/{id}/materials
     */
    public function createMaterial(array $user, int $id): void
    {
        $roleMiddleware = new RoleMiddleware($user);

        if (!$roleMiddleware->requireRole(['admin', 'teacher'])) {
            return;
        }

        $course = $this->courseRepo->findById($id);

        if (!$course) {
            Response::notFound('Course not found');
            return;
        }

        // Teachers can only add materials to their own courses
        if ($roleMiddleware->isTeacher() && !$roleMiddleware->isAdmin()) {
            $teacher = $this->teacherRepo->findByUserId($user['user_id']);
            if (!$teacher || $course['teacher_id'] != $teacher['teacher_id']) {
                Response::forbidden('You can only add materials to your own courses');
                return;
            }
        }

        $data = json_decode(file_get_contents('php://input'), true);

        $errors = Validator::validate($data, [
            'title' => 'required|string|max:200',
            'description' => 'string',
            'material_type' => 'string|max:50',
            'file_path' => 'string|max:500',
            'file_size' => 'integer',
            'order_index' => 'integer'
        ]);

        if (!empty($errors)) {
            Response::error('Validation failed', 400, $errors);
            return;
        }

        $data['course_id'] = $id;

        $materialId = $this->materialRepo->create($data);

        Response::success([
            'message' => 'Course material created successfully',
            'material_id' => $materialId
        ], 201);
    }

    /**
     * Update a course material
     * PUT /api/courses/{courseId}/materials/{materialId}
     */
    public function updateMaterial(array $user, int $courseId, int $materialId): void
    {
        $roleMiddleware = new RoleMiddleware($user);

        if (!$roleMiddleware->requireRole(['admin', 'teacher'])) {
            return;
        }

        $course = $this->courseRepo->findById($courseId);
        $material = $this->materialRepo->findById($materialId);

        if (!$course) {
            Response::notFound('Course not found');
            return;
        }

        if (!$material) {
            Response::notFound('Material not found');
            return;
        }

        // Verify material belongs to the course
        if ($material['course_id'] != $courseId) {
            Response::error('Material does not belong to this course', 400);
            return;
        }

        // Teachers can only update materials for their own courses
        if ($roleMiddleware->isTeacher() && !$roleMiddleware->isAdmin()) {
            $teacher = $this->teacherRepo->findByUserId($user['user_id']);
            if (!$teacher || $course['teacher_id'] != $teacher['teacher_id']) {
                Response::forbidden('You can only update materials for your own courses');
                return;
            }
        }

        $data = json_decode(file_get_contents('php://input'), true);

        $errors = Validator::validate($data, [
            'title' => 'string|max:200',
            'description' => 'string',
            'material_type' => 'string|max:50',
            'file_path' => 'string|max:500',
            'file_size' => 'integer',
            'order_index' => 'integer',
            'is_active' => 'boolean'
        ]);

        if (!empty($errors)) {
            Response::error('Validation failed', 400, $errors);
            return;
        }

        $this->materialRepo->update($materialId, $data);

        Response::success(['message' => 'Course material updated successfully']);
    }

    /**
     * Delete a course material
     * DELETE /api/courses/{courseId}/materials/{materialId}
     */
    public function deleteMaterial(array $user, int $courseId, int $materialId): void
    {
        $roleMiddleware = new RoleMiddleware($user);

        if (!$roleMiddleware->requireRole(['admin', 'teacher'])) {
            return;
        }

        $course = $this->courseRepo->findById($courseId);
        $material = $this->materialRepo->findById($materialId);

        if (!$course) {
            Response::notFound('Course not found');
            return;
        }

        if (!$material) {
            Response::notFound('Material not found');
            return;
        }

        // Verify material belongs to the course
        if ($material['course_id'] != $courseId) {
            Response::error('Material does not belong to this course', 400);
            return;
        }

        // Teachers can only delete materials from their own courses
        if ($roleMiddleware->isTeacher() && !$roleMiddleware->isAdmin()) {
            $teacher = $this->teacherRepo->findByUserId($user['user_id']);
            if (!$teacher || $course['teacher_id'] != $teacher['teacher_id']) {
                Response::forbidden('You can only delete materials from your own courses');
                return;
            }
        }

        $this->materialRepo->delete($materialId);

        Response::success(['message' => 'Course material deleted successfully']);
    }

    public function getAssessments(array $user, int $id): void
    {
        $course = $this->courseRepo->findById($id);

        if (!$course) {
            Response::notFound('Course not found');
            return;
        }

        // Students can only view assessments for enrolled courses
        $roleMiddleware = new RoleMiddleware($user);
        if ($roleMiddleware->isStudent() && !$roleMiddleware->isAdmin()) {
            $student = $this->studentRepo->findByUserId($user['user_id']);
            if (!$student) {
                Response::forbidden('Student profile not found');
                return;
            }

            if (!$this->courseRepo->isStudentEnrolled($student['student_id'], $id)) {
                Response::forbidden('You can only view assessments for enrolled courses');
                return;
            }
        }

        $assessments = $this->courseRepo->getAssessments($id);
        Response::success($assessments);
    }

    // ==========================================
    // COURSE REVIEWS
    // ==========================================

    /**
     * Get reviews for a course
     * GET /api/courses/{id}/reviews
     */
    public function getReviews(array $user, int $id): void
    {
        $course = $this->courseRepo->findById($id);

        if (!$course) {
            Response::notFound('Course not found');
            return;
        }

        // Students can only view reviews for enrolled courses
        $roleMiddleware = new RoleMiddleware($user);
        if ($roleMiddleware->isStudent() && !$roleMiddleware->isAdmin()) {
            $student = $this->studentRepo->findByUserId($user['user_id']);
            if (!$student) {
                Response::forbidden('Student profile not found');
                return;
            }

            if (!$this->courseRepo->isStudentEnrolled($student['student_id'], $id)) {
                Response::forbidden('You can only view reviews for enrolled courses');
                return;
            }
        }

        $page = (int) ($_GET['page'] ?? 1);
        $limit = (int) ($_GET['limit'] ?? 20);

        $reviews = $this->reviewRepo->getCourseReviews($id, $page, $limit);
        $total = $this->reviewRepo->countCourseReviews($id);
        $stats = $this->reviewRepo->getCourseReviewStats($id);

        Response::success([
            'reviews' => $reviews,
            'stats' => $stats,
            'pagination' => [
                'page' => $page,
                'limit' => $limit,
                'total' => $total,
                'pages' => ceil($total / $limit)
            ]
        ]);
    }

    /**
     * Create a review for a course
     * POST /api/courses/{id}/reviews
     */
    public function createReview(array $user, int $id): void
    {
        $course = $this->courseRepo->findById($id);

        if (!$course) {
            Response::notFound('Course not found');
            return;
        }

        // Get student record
        $student = $this->studentRepo->findByUserId($user['user_id']);
        if (!$student) {
            Response::error('Student profile not found', 404);
            return;
        }

        // Students can only review courses they're enrolled in
        if (!$this->courseRepo->isStudentEnrolled($student['student_id'], $id)) {
            Response::forbidden('You can only review courses you are enrolled in');
            return;
        }

        // Check if student already reviewed this course
        $existingReview = $this->reviewRepo->findByStudentAndCourse($student['student_id'], $id);
        if ($existingReview) {
            Response::error('You have already reviewed this course. Use update instead.', 400);
            return;
        }

        $data = json_decode(file_get_contents('php://input'), true);

        $errors = Validator::validate($data, [
            'rating' => 'required|integer|min:1|max:5',
            'review_text' => 'string'
        ]);

        if (!empty($errors)) {
            Response::error('Validation failed', 400, $errors);
            return;
        }

        $data['course_id'] = $id;
        $data['student_id'] = $student['student_id'];

        $reviewId = $this->reviewRepo->create($data);

        Response::success([
            'message' => 'Review created successfully',
            'review_id' => $reviewId
        ], 201);
    }

    /**
     * Update a review
     * PUT /api/courses/{courseId}/reviews/{reviewId}
     */
    public function updateReview(array $user, int $courseId, int $reviewId): void
    {
        $review = $this->reviewRepo->findById($reviewId);

        if (!$review) {
            Response::notFound('Review not found');
            return;
        }

        // Check if review belongs to the student
        $student = $this->studentRepo->findByUserId($user['user_id']);
        if (!$student || $review['student_id'] !== $student['student_id']) {
            Response::error('Unauthorized. You can only update your own reviews.', 403);
            return;
        }

        $data = json_decode(file_get_contents('php://input'), true);

        $errors = Validator::validate($data, [
            'rating' => 'integer|min:1|max:5',
            'review_text' => 'string'
        ]);

        if (!empty($errors)) {
            Response::error('Validation failed', 400, $errors);
            return;
        }

        $this->reviewRepo->update($reviewId, $data);

        Response::success(['message' => 'Review updated successfully']);
    }

    /**
     * Delete a review
     * DELETE /api/courses/{courseId}/reviews/{reviewId}
     */
    public function deleteReview(array $user, int $courseId, int $reviewId): void
    {
        $review = $this->reviewRepo->findById($reviewId);

        if (!$review) {
            Response::notFound('Review not found');
            return;
        }

        // Students can delete their own reviews, admins can delete any
        $roleMiddleware = new RoleMiddleware($user);
        $student = $this->studentRepo->findByUserId($user['user_id']);

        if (!$roleMiddleware->isAdmin() && (!$student || $review['student_id'] !== $student['student_id'])) {
            Response::error('Unauthorized', 403);
            return;
        }

        $this->reviewRepo->delete($reviewId);

        Response::success(['message' => 'Review deleted successfully']);
    }

    // ==========================================
    // COURSE SCHEDULES
    // ==========================================

    /**
     * Get schedules for a course
     * GET /api/courses/{id}/schedules
     */
    public function getSchedules(array $user, int $id): void
    {
        $course = $this->courseRepo->findById($id);

        if (!$course) {
            Response::notFound('Course not found');
            return;
        }

        // Students can only view schedules for enrolled courses
        $roleMiddleware = new RoleMiddleware($user);
        if ($roleMiddleware->isStudent() && !$roleMiddleware->isAdmin()) {
            $student = $this->studentRepo->findByUserId($user['user_id']);
            if (!$student) {
                Response::forbidden('Student profile not found');
                return;
            }

            if (!$this->courseRepo->isStudentEnrolled($student['student_id'], $id)) {
                Response::forbidden('You can only view schedules for enrolled courses');
                return;
            }
        }

        $schedules = $this->scheduleRepo->getCourseSchedules($id);

        Response::success($schedules);
    }

    /**
     * Create a schedule for a course
     * POST /api/courses/{id}/schedules
     */
    public function createSchedule(array $user, int $id): void
    {
        $roleMiddleware = new RoleMiddleware($user);

        if (!$roleMiddleware->requireRole(['admin', 'teacher'])) {
            return;
        }

        $course = $this->courseRepo->findById($id);

        if (!$course) {
            Response::notFound('Course not found');
            return;
        }

        // Teachers can only create schedules for their own courses
        if ($roleMiddleware->isTeacher() && !$roleMiddleware->isAdmin()) {
            $teacher = $this->teacherRepo->findByUserId($user['user_id']);
            if (!$teacher || $course['teacher_id'] != $teacher['teacher_id']) {
                Response::forbidden('You can only create schedules for your own courses');
                return;
            }
        }

        $data = json_decode(file_get_contents('php://input'), true);

        $errors = Validator::validate($data, [
            'day_of_week' => 'required|string|in:Monday,Tuesday,Wednesday,Thursday,Friday,Saturday,Sunday',
            'start_time' => 'required|string',
            'end_time' => 'required|string',
            'room' => 'string|max:50'
        ]);

        if (!empty($errors)) {
            Response::error('Validation failed', 400, $errors);
            return;
        }

        $data['course_id'] = $id;

        $scheduleId = $this->scheduleRepo->create($data);

        Response::success([
            'message' => 'Schedule created successfully',
            'schedule_id' => $scheduleId
        ], 201);
    }

    /**
     * Update a schedule
     * PUT /api/courses/{courseId}/schedules/{scheduleId}
     */
    public function updateSchedule(array $user, int $courseId, int $scheduleId): void
    {
        $roleMiddleware = new RoleMiddleware($user);

        if (!$roleMiddleware->requireRole(['admin', 'teacher'])) {
            return;
        }

        $course = $this->courseRepo->findById($courseId);
        $schedule = $this->scheduleRepo->findById($scheduleId);

        if (!$course) {
            Response::notFound('Course not found');
            return;
        }

        if (!$schedule) {
            Response::notFound('Schedule not found');
            return;
        }

        // Teachers can only update schedules for their own courses
        if ($roleMiddleware->isTeacher() && !$roleMiddleware->isAdmin()) {
            $teacher = $this->teacherRepo->findByUserId($user['user_id']);
            if (!$teacher || $course['teacher_id'] != $teacher['teacher_id']) {
                Response::forbidden('You can only update schedules for your own courses');
                return;
            }
        }

        $data = json_decode(file_get_contents('php://input'), true);

        $errors = Validator::validate($data, [
            'day_of_week' => 'string|in:Monday,Tuesday,Wednesday,Thursday,Friday,Saturday,Sunday',
            'start_time' => 'string',
            'end_time' => 'string',
            'room' => 'string|max:50'
        ]);

        if (!empty($errors)) {
            Response::error('Validation failed', 400, $errors);
            return;
        }

        $this->scheduleRepo->update($scheduleId, $data);

        Response::success(['message' => 'Schedule updated successfully']);
    }

    /**
     * Delete a schedule
     * DELETE /api/courses/{courseId}/schedules/{scheduleId}
     */
    public function deleteSchedule(array $user, int $courseId, int $scheduleId): void
    {
        $roleMiddleware = new RoleMiddleware($user);

        if (!$roleMiddleware->requireRole(['admin', 'teacher'])) {
            return;
        }

        $course = $this->courseRepo->findById($courseId);
        $schedule = $this->scheduleRepo->findById($scheduleId);

        if (!$course) {
            Response::notFound('Course not found');
            return;
        }

        if (!$schedule) {
            Response::notFound('Schedule not found');
            return;
        }

        // Teachers can only delete schedules for their own courses
        if ($roleMiddleware->isTeacher() && !$roleMiddleware->isAdmin()) {
            $teacher = $this->teacherRepo->findByUserId($user['user_id']);
            if (!$teacher || $course['teacher_id'] != $teacher['teacher_id']) {
                Response::forbidden('You can only delete schedules for your own courses');
                return;
            }
        }

        $this->scheduleRepo->delete($scheduleId);

        Response::success(['message' => 'Schedule deleted successfully']);
    }
}
