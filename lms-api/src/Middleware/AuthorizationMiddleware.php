<?php

namespace App\Middleware;

use App\Utils\Response;

/**
 * Authorization Middleware
 * Handles resource-level authorization checks
 * - Institution-based access control
 * - Ownership verification
 * - Cross-institution data protection
 */
class AuthorizationMiddleware
{
    private array $user;

    public function __construct(array $user)
    {
        $this->user = $user;
    }

    /**
     * Check if user has access to a resource based on institution
     * Super admins bypass this check
     * 
     * @param array $resource The resource to check (must have 'institution_id')
     * @param string $errorMessage Custom error message
     * @return bool True if authorized, false and sends response if not
     */
    public function requireInstitutionAccess(array $resource, string $errorMessage = 'You do not have access to this resource'): bool
    {
        // Super admins have access to all institutions
        if ($this->isSuperAdmin()) {
            return true;
        }

        // Check if resource has institution_id
        if (!isset($resource['institution_id'])) {
            Response::serverError('Resource does not have institution_id');
            return false;
        }

        // Check if user has institution_id
        if (!isset($this->user['institution_id'])) {
            Response::forbidden('User does not belong to any institution');
            return false;
        }

        // Compare institution IDs
        if ($resource['institution_id'] != $this->user['institution_id']) {
            Response::forbidden($errorMessage);
            return false;
        }

        return true;
    }

    /**
     * Check if user owns a resource
     * 
     * @param array $resource The resource to check
     * @param string $ownerField The field name that contains the owner ID (default: 'user_id')
     * @param string $errorMessage Custom error message
     * @return bool True if authorized, false and sends response if not
     */
    public function requireOwnership(array $resource, string $ownerField = 'user_id', string $errorMessage = 'You do not own this resource'): bool
    {
        // Check if resource has owner field
        if (!isset($resource[$ownerField])) {
            Response::serverError("Resource does not have {$ownerField} field");
            return false;
        }

        // Check if user has user_id
        if (!isset($this->user['user_id'])) {
            Response::unauthorized('User ID not found');
            return false;
        }

        // Compare owner IDs
        if ($resource[$ownerField] != $this->user['user_id']) {
            Response::forbidden($errorMessage);
            return false;
        }

        return true;
    }

    /**
     * Check if user owns resource OR is an admin
     * 
     * @param array $resource The resource to check
     * @param string $ownerField The field name that contains the owner ID
     * @param string $errorMessage Custom error message
     * @return bool True if authorized, false and sends response if not
     */
    public function requireOwnershipOrAdmin(array $resource, string $ownerField = 'user_id', string $errorMessage = 'You can only access your own resources'): bool
    {
        // Admins and super admins can access any resource
        if ($this->isAdmin() || $this->isSuperAdmin()) {
            return true;
        }

        return $this->requireOwnership($resource, $ownerField, $errorMessage);
    }

    /**
     * Check if user has access based on institution AND is admin
     * Used when only admins can perform certain actions
     * 
     * @param array $resource The resource to check
     * @param string $errorMessage Custom error message
     * @return bool True if authorized, false and sends response if not
     */
    public function requireInstitutionAdmin(array $resource, string $errorMessage = 'You do not have permission to access this resource'): bool
    {
        // Must be admin or super admin
        if (!$this->isAdmin() && !$this->isSuperAdmin()) {
            Response::forbidden('Admin access required');
            return false;
        }

        // Check institution access
        return $this->requireInstitutionAccess($resource, $errorMessage);
    }

    /**
     * Check if user is a student and owns the student record
     * 
     * @param array $student The student record
     * @return bool True if authorized, false and sends response if not
     */
    public function requireStudentOwnership(array $student): bool
    {
        // If user is admin or teacher, allow access
        if ($this->isAdmin() || $this->hasRole('teacher')) {
            return $this->requireInstitutionAccess($student, 'You do not have access to this student');
        }

        // If user is a student, check ownership
        if ($this->hasRole('student')) {
            return $this->requireOwnership($student, 'user_id', 'You can only view your own profile');
        }

        Response::forbidden('You do not have permission to access student data');
        return false;
    }

    /**
     * Check if user is a teacher and owns the teacher record
     * 
     * @param array $teacher The teacher record
     * @return bool True if authorized, false and sends response if not
     */
    public function requireTeacherOwnership(array $teacher): bool
    {
        // If user is admin, allow access (with institution check)
        if ($this->isAdmin()) {
            return $this->requireInstitutionAccess($teacher, 'You do not have access to this teacher');
        }

        // If user is a teacher, check ownership
        if ($this->hasRole('teacher')) {
            return $this->requireOwnership($teacher, 'user_id', 'You can only view your own profile');
        }

        Response::forbidden('You do not have permission to access teacher data');
        return false;
    }

    /**
     * Check if user has access to message (sender or receiver)
     * 
     * @param array $message The message record
     * @return bool True if authorized, false and sends response if not
     */
    public function requireMessageAccess(array $message): bool
    {
        $userId = $this->user['user_id'] ?? null;

        if (!$userId) {
            Response::unauthorized('User ID not found');
            return false;
        }

        // Check if user is sender or receiver
        if ($message['sender_id'] == $userId || $message['receiver_id'] == $userId) {
            return true;
        }

        Response::forbidden('You can only access your own messages');
        return false;
    }

    /**
     * Check if user has access to notification (owner only)
     * 
     * @param array $notification The notification record
     * @return bool True if authorized, false and sends response if not
     */
    public function requireNotificationAccess(array $notification): bool
    {
        return $this->requireOwnership($notification, 'user_id', 'You can only access your own notifications');
    }

    /**
     * Check if user can create assignments (teacher for their courses or admin)
     * 
     * @param array $course The course record
     * @param int|null $teacherId Optional teacher ID from user context
     * @return bool True if authorized, false and sends response if not
     */
    public function requireAssignmentCreationAccess(array $course, ?int $teacherId = null): bool
    {
        // Check institution access first
        if (!$this->requireInstitutionAccess($course, 'You do not have access to this course')) {
            return false;
        }

        // Admins can create assignments for any course in their institution
        if ($this->isAdmin()) {
            return true;
        }

        // Teachers can only create assignments for their own courses
        if ($this->hasRole('teacher') && $teacherId !== null) {
            if ($course['teacher_id'] != $teacherId) {
                Response::forbidden('You can only create assignments for your own courses');
                return false;
            }
            return true;
        }

        Response::forbidden('You do not have permission to create assignments');
        return false;
    }

    /**
     * Check if user has multiple roles
     * 
     * @param string|array $roles Role name(s) to check
     * @return bool True if user has any of the roles
     */
    public function hasRole(string|array $roles): bool
    {
        $requiredRoles = is_array($roles) ? $roles : [$roles];
        $userRoles = $this->user['roles'] ?? [];

        // Also check legacy 'role' field for backwards compatibility
        if (isset($this->user['role']) && !in_array($this->user['role'], $userRoles)) {
            $userRoles[] = $this->user['role'];
        }

        foreach ($requiredRoles as $role) {
            if (in_array($role, $userRoles)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Check if user is an admin
     * 
     * @return bool
     */
    public function isAdmin(): bool
    {
        return $this->hasRole('admin');
    }

    /**
     * Check if user is a super admin
     * 
     * @return bool
     */
    public function isSuperAdmin(): bool
    {
        return $this->user['is_super_admin'] ?? false || $this->user['role'] === 'super_admin';
    }

    /**
     * Check if user is a teacher
     * 
     * @return bool
     */
    public function isTeacher(): bool
    {
        return $this->hasRole('teacher');
    }

    /**
     * Check if user is a student
     * 
     * @return bool
     */
    public function isStudent(): bool
    {
        return $this->hasRole('student');
    }

    /**
     * Get the current user
     * 
     * @return array
     */
    public function getUser(): array
    {
        return $this->user;
    }

    /**
     * Get user's institution ID
     * 
     * @return int|null
     */
    public function getInstitutionId(): ?int
    {
        return $this->user['institution_id'] ?? null;
    }

    /**
     * Get user's ID
     * 
     * @return int|null
     */
    public function getUserId(): ?int
    {
        return $this->user['user_id'] ?? null;
    }
}
