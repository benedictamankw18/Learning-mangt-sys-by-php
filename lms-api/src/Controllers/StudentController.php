<?php

namespace App\Controllers;

use App\Utils\Response;
use App\Utils\Validator;
use App\Utils\UuidHelper;
use App\Repositories\StudentRepository;
use App\Repositories\UserRepository;
use App\Repositories\ClassRepository;
use App\Middleware\RoleMiddleware;

class StudentController
{
    private StudentRepository $studentRepo;
    private UserRepository $userRepo;
    private ClassRepository $classRepo;

    public function __construct()
    {
        $this->studentRepo = new StudentRepository();
        $this->userRepo    = new UserRepository();
        $this->classRepo   = new ClassRepository();
    }

    public function index(array $user): void
    {
        $roleMiddleware = new RoleMiddleware($user);

        if (!$roleMiddleware->hasRole(['admin', 'teacher'])) {
            Response::forbidden('Only admins and teachers can view all students');
            return;
        }

        $page  = (int) ($_GET['page']  ?? 1);
        $limit = (int) ($_GET['limit'] ?? 20);

        // Multi-tenant: restrict to the user's institution unless super_admin
        if ($user['role'] === 'super_admin') {
            $institutionId = isset($_GET['institution_id']) ? (int) $_GET['institution_id'] : null;
        } else {
            $institutionId = (int) $user['institution_id'];
        }

        $classId   = isset($_GET['class_id'])   ? (int) $_GET['class_id']   : null;
        $programId = isset($_GET['program_id']) ? (int) $_GET['program_id'] : null;
        $status    = $_GET['status'] ?? null;
        $search    = $_GET['search'] ?? null;

        $students = $this->studentRepo->getAll($page, $limit, $institutionId, $classId, $programId, $status, $search);
        $total    = $this->studentRepo->count($institutionId, $classId, $programId, $status, $search);

        Response::paginated($students, $total, $page, $limit);
    }

    /**
     * Toggle student active/inactive status
     * PUT /api/students/{uuid}/status
     */
    public function toggleStatus(array $user, string $uuid): void
    {
        $sanitizedUuid = UuidHelper::sanitize($uuid);
        if (!$sanitizedUuid) {
            Response::badRequest('Invalid UUID format');
            return;
        }

        $roleMiddleware = new RoleMiddleware($user);
        if (!$roleMiddleware->requireRole('admin')) {
            return;
        }

        $student = $this->studentRepo->findByUuid($sanitizedUuid);
        if (!$student) {
            Response::notFound('Student not found');
            return;
        }

        // Multi-tenant check
        if ($user['role'] !== 'super_admin' && (int) $student['institution_id'] !== (int) $user['institution_id']) {
            Response::forbidden('Access denied');
            return;
        }

        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        $newStatus = $data['status'] ?? (($student['status'] === 'active') ? 'inactive' : 'active');

        if (!in_array($newStatus, ['active', 'inactive', 'withdrawn'], true)) {
            Response::badRequest('Invalid status value');
            return;
        }

        $isActive = ($newStatus === 'active') ? 1 : 0;
        $this->userRepo->update($student['user_id'], ['is_active' => $isActive]);

        if ($this->studentRepo->update($student['student_id'], ['status' => $newStatus])) {
            Response::success(['message' => 'Status updated', 'status' => $newStatus]);
        } else {
            Response::serverError('Failed to update status');
        }
    }

    public function show(array $user, string $uuid): void
    {
        $sanitizedUuid = UuidHelper::sanitize($uuid);
        if (!$sanitizedUuid) {
            Response::badRequest('Invalid UUID format');
            return;
        }

        $roleMiddleware = new RoleMiddleware($user);

        $student = $this->studentRepo->findByUuid($sanitizedUuid);

        if (!$student) {
            Response::notFound('Student not found');
            return;
        }

        // Students can only view their own profile
        if ($roleMiddleware->isStudent() && $student['user_id'] != $user['user_id']) {
            Response::forbidden('You can only view your own profile');
            return;
        }

        Response::success($student);
    }

    public function create(array $user): void
    {
        $roleMiddleware = new RoleMiddleware($user);

        if (!$roleMiddleware->requireRole('admin')) {
            return;
        }

        $data = json_decode(file_get_contents('php://input'), true);

        $validator = new Validator($data);
        $validator->required(['username', 'email', 'password', 'first_name', 'last_name', 'student_id_number'])
            ->email('email')
            ->min('password', 8);

        if ($validator->fails()) {
            Response::validationError($validator->getErrors());
            return;
        }

        // Add institution_id for multi-tenant support
        if ($user['role'] !== 'super_admin') {
            $data['institution_id'] = $user['institution_id'];
        }

        // Check for duplicate username / email before attempting the INSERT
        $institutionId = isset($data['institution_id']) ? (int) $data['institution_id'] : null;
        $duplicates = [];
        if ($this->userRepo->isUsernameTaken($data['username'], $institutionId)) {
            $duplicates['username'] = 'Username is already taken';
        }
        if ($this->userRepo->isEmailTaken($data['email'])) {
            $duplicates['email'] = 'Email address is already in use';
        }
        if ($this->studentRepo->isStudentIdTaken($data['student_id_number'], $institutionId)) {
            $duplicates['student_id_number'] = 'Student ID is already in use';
        }
        if (!empty($duplicates)) {
            Response::validationError($duplicates);
            return;
        }

        // Validate class_id if provided
        if (!empty($data['class_id'])) {
            $class = $this->classRepo->findById((int) $data['class_id']);
            if (!$class) {
                Response::validationError(['class_id' => 'Selected class does not exist']);
                return;
            }
        }

        // Create user first
        $userId = $this->userRepo->create($data);

        if (!$userId) {
            Response::serverError('Failed to create user');
            return;
        }

        // Assign student role
        $this->userRepo->assignRole($userId, 3);

        // Create student profile
        $studentId = $this->studentRepo->create($userId, $data);

        if (!$studentId) {
            Response::serverError('Failed to create student profile');
            return;
        }

        $student = $this->studentRepo->findById($studentId);

        Response::success($student, 201);
    }

    public function update(array $user, string $uuid): void
    {
        $sanitizedUuid = UuidHelper::sanitize($uuid);
        if (!$sanitizedUuid) {
            Response::badRequest('Invalid UUID format');
            return;
        }

        $roleMiddleware = new RoleMiddleware($user);

        $student = $this->studentRepo->findByUuid($sanitizedUuid);

        if (!$student) {
            Response::notFound('Student not found');
            return;
        }

        $studentId = $student['student_id'];

        // Students can update their own profile, admins can update any
        if (!$roleMiddleware->isAdmin() && $student['user_id'] != $user['user_id']) {
            Response::forbidden('You can only update your own profile');
            return;
        }

        $data = json_decode(file_get_contents('php://input'), true);

        // Update user-table fields only
        $userFields = ['first_name', 'last_name', 'email', 'username', 'phone_number', 'phone', 'address', 'date_of_birth'];
        $updateUserData = array_intersect_key($data, array_flip($userFields));
        if (!empty($updateUserData)) {
            $this->userRepo->update($student['user_id'], $updateUserData);
        }

        // Update student-table fields only (never pass user-table columns to students)
        $studentFields = ['student_id_number', 'enrollment_date', 'class_id', 'gender', 'status',
                          'parent_name', 'parent_phone', 'parent_email', 'emergency_contact'];
        $updateStudentData = array_intersect_key($data, array_flip($studentFields));

        if (empty($updateStudentData) || $this->studentRepo->update($studentId, $updateStudentData)) {
            $updated = $this->studentRepo->findByUuid($sanitizedUuid);
            Response::success($updated);
        } else {
            Response::serverError('Failed to update student');
        }
    }

    public function getEnrolledCourses(array $user, string $uuid): void
    {
        $sanitizedUuid = UuidHelper::sanitize($uuid);
        if (!$sanitizedUuid) {
            Response::badRequest('Invalid UUID format');
            return;
        }

        $roleMiddleware = new RoleMiddleware($user);

        $student = $this->studentRepo->findByUuid($sanitizedUuid);

        if (!$student) {
            Response::notFound('Student not found');
            return;
        }

        $studentId = $student['student_id'];

        // Students can only view their own courses
        if ($roleMiddleware->isStudent() && $student['user_id'] != $user['user_id']) {
            Response::forbidden('You can only view your own courses');
            return;
        }

        $courses = $this->studentRepo->getEnrolledCourses($studentId);
        Response::success($courses);
    }

    public function enrollInCourse(array $user): void
    {
        $roleMiddleware = new RoleMiddleware($user);

        $data = json_decode(file_get_contents('php://input'), true);

        $validator = new Validator($data);
        $validator->required(['course_id', 'student_id'])
            ->numeric('course_id')
            ->numeric('student_id');

        if ($validator->fails()) {
            Response::validationError($validator->getErrors());
            return;
        }

        $studentId = (int) $data['student_id'];
        $student = $this->studentRepo->findById($studentId);

        if (!$student) {
            Response::notFound('Student not found');
            return;
        }

        // Students can enroll themselves, or admin can enroll any student
        if (!$roleMiddleware->isAdmin() && $student['user_id'] != $user['user_id']) {
            Response::forbidden('You can only enroll yourself');
            return;
        }

        if ($this->studentRepo->enrollInCourse($studentId, (int) $data['course_id'])) {
            Response::success(['message' => 'Enrolled successfully'], 201);
        } else {
            Response::serverError('Failed to enroll in course');
        }
    }

    public function unenrollFromCourse(array $user, string $uuid, int $courseId): void
    {
        $sanitizedUuid = UuidHelper::sanitize($uuid);
        if (!$sanitizedUuid) {
            Response::badRequest('Invalid UUID format');
            return;
        }

        $roleMiddleware = new RoleMiddleware($user);

        $student = $this->studentRepo->findByUuid($sanitizedUuid);

        if (!$student) {
            Response::notFound('Student not found');
            return;
        }

        $studentId = $student['student_id'];

        // Only admin can unenroll students
        if (!$roleMiddleware->requireRole('admin')) {
            return;
        }

        if ($this->studentRepo->unenrollFromCourse($studentId, $courseId)) {
            Response::success(['message' => 'Unenrolled successfully']);
        } else {
            Response::serverError('Failed to unenroll from course');
        }
    }

    /**
     * Delete (deactivate) a student
     * DELETE /api/students/{uuid}
     */
    public function delete(array $user, string $uuid): void
    {
        $sanitizedUuid = UuidHelper::sanitize($uuid);
        if (!$sanitizedUuid) {
            Response::badRequest('Invalid UUID format');
            return;
        }

        $roleMiddleware = new RoleMiddleware($user);

        // Only admins can delete students
        if (!$roleMiddleware->requireRole('admin')) {
            return;
        }

        $student = $this->studentRepo->findByUuid($sanitizedUuid);

        if (!$student) {
            Response::notFound('Student not found');
            return;
        }

        $studentId = $student['student_id'];

        // Soft delete - set status to 'withdrawn'
        if ($this->studentRepo->update($studentId, ['status' => 'withdrawn'])) {
            Response::success(['message' => 'Student deactivated successfully']);
        } else {
            Response::serverError('Failed to deactivate student');
        }
    }

    /**
     * Update enrollment
     * PUT /api/enrollments/{id}
     */
    public function updateEnrollment(array $user, int $id): void
    {
        $roleMiddleware = new RoleMiddleware($user);

        // Only admins and teachers can update enrollments
        if (!$roleMiddleware->hasRole(['admin', 'teacher'])) {
            Response::forbidden('Only admins and teachers can update enrollments');
            return;
        }

        $enrollment = $this->studentRepo->findEnrollmentById($id);

        if (!$enrollment) {
            Response::notFound('Enrollment not found');
            return;
        }

        $data = json_decode(file_get_contents('php://input'), true);

        $validator = new Validator($data);
        if (isset($data['status'])) {
            $validator->in('status', ['active', 'completed', 'dropped', 'suspended']);
        }
        if (isset($data['progress_percentage'])) {
            $validator->numeric('progress_percentage');
        }

        if ($validator->fails()) {
            Response::validationError($validator->getErrors());
            return;
        }

        if ($this->studentRepo->updateEnrollment($id, $data)) {
            Response::success(['message' => 'Enrollment updated successfully']);
        } else {
            Response::serverError('Failed to update enrollment');
        }
    }

    /**
     * Generate the next available student ID for this institution and year.
     * GET /api/students/generate-id
     */
    public function generateId(array $user): void
    {
        $roleMiddleware = new RoleMiddleware($user);
        if (!$roleMiddleware->hasRole(['admin', 'super_admin'])) {
            Response::forbidden('Only admins can generate student IDs');
            return;
        }

        $institutionId = (int) $user['institution_id'];
        $year = (int) date('Y');

        // Fetch institution name to derive prefix (same logic as frontend)
        $fullUser = $this->userRepo->findById($user['user_id']);
        $institutionName = $fullUser['institution_name'] ?? '';

        $prefix = 'SHS';
        if ($institutionName !== '') {
            preg_match_all('/\b[A-Za-z]/', $institutionName, $matches);
            $initials = $matches[0] ?? [];
            if (count($initials) >= 2) {
                $prefix = strtoupper(implode('', array_slice($initials, 0, 6)));
            }
        }

        $seq    = $this->studentRepo->getNextIdSequence($institutionId, $prefix, $year);
        $nextId = sprintf('%s-%d-%04d', $prefix, $year, $seq);

        Response::success(['next_id' => $nextId]);
    }

    /**
     * Delete enrollment (hard delete)
     * DELETE /api/enrollments/{id}
     */
    public function deleteEnrollment(array $user, int $id): void
    {
        $roleMiddleware = new RoleMiddleware($user);

        // Only admins can delete enrollments
        if (!$roleMiddleware->requireRole('admin')) {
            return;
        }

        $enrollment = $this->studentRepo->findEnrollmentById($id);

        if (!$enrollment) {
            Response::notFound('Enrollment not found');
            return;
        }

        if ($this->studentRepo->deleteEnrollment($id)) {
            Response::success(['message' => 'Enrollment deleted successfully']);
        } else {
            Response::serverError('Failed to delete enrollment');
        }
    }
}
