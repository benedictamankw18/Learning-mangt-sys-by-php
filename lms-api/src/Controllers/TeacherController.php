<?php

namespace App\Controllers;

use App\Utils\Response;
use App\Utils\Validator;
use App\Utils\UuidHelper;
use App\Repositories\TeacherRepository;
use App\Repositories\UserRepository;
use App\Middleware\RoleMiddleware;

class TeacherController
{
    private TeacherRepository $teacherRepo;
    private UserRepository $userRepo;

    public function __construct()
    {
        $this->teacherRepo = new TeacherRepository();
        $this->userRepo = new UserRepository();
    }

    public function index(array $user): void
    {
        $roleMiddleware = new RoleMiddleware($user);

        if (!$roleMiddleware->hasRole(['admin', 'teacher'])) {
            Response::forbidden('Only admins and teachers can view teachers list');
            return;
        }

        $page = isset($_GET['page']) ? (int) $_GET['page'] : 1;
        $limit = isset($_GET['limit']) ? (int) $_GET['limit'] : 20;
        $programId = isset($_GET['program_id']) ? (int) $_GET['program_id'] : null;
        $search = $_GET['search'] ?? null;
        $institutionId = (int) $user['institution_id'];

        $teachers = $this->teacherRepo->getAll($page, $limit, $programId, $search, $institutionId);
        $total = $this->teacherRepo->count($programId, $search, $institutionId);
        $newThisMonth = $this->teacherRepo->countByInstitutionThisMonth($institutionId);

        Response::success([
            'teachers' => $teachers,
            'pagination' => [
                'current_page' => $page,
                'per_page' => $limit,
                'total' => $total,
                'total_pages' => ceil($total / $limit),
                'new_this_month' => $newThisMonth
            ]
        ]);
    }

    public function show(array $user, string $uuid): void
    {
        $sanitizedUuid = UuidHelper::sanitize($uuid);
        if (!$sanitizedUuid) {
            Response::badRequest('Invalid UUID format');
            return;
        }

        $roleMiddleware = new RoleMiddleware($user);

        $teacher = $this->teacherRepo->findByUuid($sanitizedUuid);

        if (!$teacher) {
            Response::notFound('Teacher not found');
            return;
        }

        $teacherId = $teacher['teacher_id'];

        // Teachers can only view their own profile unless they're admin
        if ($roleMiddleware->isTeacher() && !$roleMiddleware->isAdmin()) {
            $currentTeacher = $this->teacherRepo->findByUserId($user['user_id']);
            if (!$currentTeacher || $currentTeacher['teacher_id'] != $teacherId) {
                Response::forbidden('You can only view your own profile');
                return;
            }
        }

        Response::success($teacher);
    }

    public function create(array $user): void
    {
        $roleMiddleware = new RoleMiddleware($user);

        if (!$roleMiddleware->isAdmin()) {
            Response::forbidden('Only admins can create teachers');
            return;
        }

        $data = json_decode(file_get_contents('php://input'), true);

        $validator = new Validator($data);
        $validator
            ->required(['username', 'email', 'password', 'first_name', 'last_name', 'employee_id'])
            ->email('email')
            ->min('password', 8);

        if ($validator->fails()) {
            Response::validationError($validator->getErrors());
            return;
        }

        $institutionId = (int) $user['institution_id'];
        $data['institution_id'] = $institutionId;

        // Duplicate checks
        $duplicates = [];
        if ($this->userRepo->isUsernameTaken($data['username'], $institutionId)) {
            $duplicates['username'] = ['Username already taken'];
        }
        if ($this->userRepo->isEmailTaken($data['email'])) {
            $duplicates['email'] = ['Email already in use'];
        }
        if ($this->teacherRepo->isEmployeeIdTaken($data['employee_id'], $institutionId)) {
            $duplicates['employee_id'] = ['Employee ID already in use'];
        }
        if (!empty($duplicates)) {
            Response::validationError($duplicates);
            return;
        }

        // Create user account
        $userId = $this->userRepo->create($data);
        if (!$userId) {
            Response::serverError('Failed to create user account');
            return;
        }

        // Assign teacher role
        $teacherRole = $this->userRepo->getRoleByName('teacher');
        if ($teacherRole) {
            $this->userRepo->assignRole($userId, (int) $teacherRole['role_id']);
        }

        // Create teacher profile
        $teacherId = $this->teacherRepo->create($userId, $data);
        if (!$teacherId) {
            Response::serverError('Failed to create teacher profile');
            return;
        }

        Response::success($this->teacherRepo->findById($teacherId), 201);
    }

    public function update(array $user, string $uuid): void
    {
        $sanitizedUuid = UuidHelper::sanitize($uuid);
        if (!$sanitizedUuid) {
            Response::badRequest('Invalid UUID format');
            return;
        }

        $roleMiddleware = new RoleMiddleware($user);

        $teacher = $this->teacherRepo->findByUuid($sanitizedUuid);

        if (!$teacher) {
            Response::notFound('Teacher not found');
            return;
        }

        $teacherId = $teacher['teacher_id'];

        // Teachers can only update their own profile unless they're admin
        if ($roleMiddleware->isTeacher() && !$roleMiddleware->isAdmin()) {
            $currentTeacher = $this->teacherRepo->findByUserId($user['user_id']);
            if (!$currentTeacher || $currentTeacher['teacher_id'] != $teacherId) {
                Response::forbidden('You can only update your own profile');
                return;
            }
        }

        $data = json_decode(file_get_contents('php://input'), true);

        // Update user-table fields
        $userFieldKeys = ['first_name', 'last_name', 'email', 'username', 'phone_number', 'address', 'is_active'];
        $userFields = array_intersect_key($data, array_flip($userFieldKeys));
        if (!empty($userFields)) {
            $this->userRepo->update($teacher['user_id'], $userFields);
        }

        // Update teacher-table fields (exclude user fields)
        $teacherFields = array_diff_key($data, array_flip($userFieldKeys));
        if (!empty($teacherFields) && !$this->teacherRepo->update($teacherId, $teacherFields)) {
            // Still return success if at least user fields were updated
            if (empty($userFields)) {
                Response::serverError('Failed to update teacher');
                return;
            }
        }

        $updatedTeacher = $this->teacherRepo->findByUuid($sanitizedUuid);
        Response::success($updatedTeacher);
    }

    /**
     * Generate the next available employee ID for this institution and year.
     * GET /api/teachers/generate-id
     */
    public function generateId(array $user): void
    {
        $roleMiddleware = new RoleMiddleware($user);
        if (!$roleMiddleware->hasRole(['admin', 'super_admin'])) {
            Response::forbidden('Only admins can generate teacher IDs');
            return;
        }

        $institutionId = (int) $user['institution_id'];
        $year = (int) date('Y');

        $fullUser = $this->userRepo->findById($user['user_id']);
        $institutionName = $fullUser['institution_name'] ?? '';

        $prefix = 'SHS-T';
        if ($institutionName !== '') {
            preg_match_all('/\b[A-Za-z]/', $institutionName, $matches);
            $initials = $matches[0] ?? [];
            if (count($initials) >= 2) {
                // Append 'T' to distinguish employee IDs from student IDs
                // e.g. institution "Springfield High School" → teachers: SHST, students: SHS
                $prefix = strtoupper(implode('', array_slice($initials, 0, 5))) . '-T';
            }
        }

        $seq    = $this->teacherRepo->getNextIdSequence($institutionId, $prefix, $year);
        $nextId = sprintf('%s-%d-%04d', $prefix, $year, $seq);

        Response::success(['next_id' => $nextId]);
    }

    public function getCourses(array $user, string $uuid): void
    {
        $sanitizedUuid = UuidHelper::sanitize($uuid);
        if (!$sanitizedUuid) {
            Response::badRequest('Invalid UUID format');
            return;
        }

        $roleMiddleware = new RoleMiddleware($user);

        $teacher = $this->teacherRepo->findByUuid($sanitizedUuid);

        if (!$teacher) {
            Response::notFound('Teacher not found');
            return;
        }

        $teacherId = $teacher['teacher_id'];

        // Teachers can only view their own courses unless they're admin
        if ($roleMiddleware->isTeacher() && !$roleMiddleware->isAdmin()) {
            $currentTeacher = $this->teacherRepo->findByUserId($user['user_id']);
            if (!$currentTeacher || $currentTeacher['teacher_id'] != $teacherId) {
                Response::forbidden('You can only view your own courses');
                return;
            }
        }

        $courses = $this->teacherRepo->getCourses($teacherId);
        Response::success($courses);
    }

    public function getSchedule(array $user, string $uuid): void
    {
        $sanitizedUuid = UuidHelper::sanitize($uuid);
        if (!$sanitizedUuid) {
            Response::badRequest('Invalid UUID format');
            return;
        }

        $roleMiddleware = new RoleMiddleware($user);

        $teacher = $this->teacherRepo->findByUuid($sanitizedUuid);

        if (!$teacher) {
            Response::notFound('Teacher not found');
            return;
        }

        $teacherId = $teacher['teacher_id'];

        // Teachers can only view their own schedule unless they're admin
        if ($roleMiddleware->isTeacher() && !$roleMiddleware->isAdmin()) {
            $currentTeacher = $this->teacherRepo->findByUserId($user['user_id']);
            if (!$currentTeacher || $currentTeacher['teacher_id'] != $teacherId) {
                Response::forbidden('You can only view your own schedule');
                return;
            }
        }

        $date = $_GET['date'] ?? null;
        $schedule = $this->teacherRepo->getSchedule($teacherId, $date);
        Response::success($schedule);
    }

    /**
     * Delete (deactivate) a teacher
     * DELETE /api/teachers/{uuid}
     */
    public function delete(array $user, string $uuid): void
    {
        $sanitizedUuid = UuidHelper::sanitize($uuid);
        if (!$sanitizedUuid) {
            Response::badRequest('Invalid UUID format');
            return;
        }

        $roleMiddleware = new RoleMiddleware($user);

        // Only admins can delete teachers
        if (!$roleMiddleware->requireRole('admin')) {
            return;
        }

        $teacher = $this->teacherRepo->findByUuid($sanitizedUuid);

        if (!$teacher) {
            Response::notFound('Teacher not found');
            return;
        }

        $teacherId = $teacher['teacher_id'];

        // Soft delete - set employment_end_date
        $data = ['employment_end_date' => date('Y-m-d')];

        if ($this->teacherRepo->update($teacherId, $data)) {
            Response::success(['message' => 'Teacher deactivated successfully']);
        } else {
            Response::serverError('Failed to deactivate teacher');
        }
    }
}
