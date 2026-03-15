<?php

namespace App\Controllers;

use App\Utils\Response;
use App\Utils\Validator;
use App\Utils\UuidHelper;
use App\Repositories\UserRepository;
use App\Middleware\RoleMiddleware;
use App\Services\EmailService;

class UserController
{
    private UserRepository $userRepo;

    private function getDisplayName(array $user): string
    {
        $first = trim((string) ($user['first_name'] ?? ''));
        $last = trim((string) ($user['last_name'] ?? ''));
        $full = trim($first . ' ' . $last);

        if ($full !== '') {
            return $full;
        }

        return (string) ($user['username'] ?? 'User');
    }

    private function sendUserCreatedNotification(array $recipient, array $performedBy): void
    {
        try {
            $email = trim((string) ($recipient['email'] ?? ''));
            if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
                return;
            }

            $emailService = new EmailService();
            if (!$emailService->isEnabled()) {
                return;
            }

            $recipientName = $this->getDisplayName($recipient);
            $actorName = $this->getDisplayName($performedBy);
            $username = (string) ($recipient['username'] ?? '');
            $frontendUrl = rtrim((string) ($_ENV['FRONTEND_URL'] ?? 'http://localhost:8080'), '/');
            $loginUrl = $frontendUrl . '/auth/login.html';

            $subject = 'Your LMS account has been created';
            $body = "
                <p>Hi <strong>{$recipientName}</strong>,</p>
                <p>Your LMS user account has been created successfully.</p>
                <p><strong>Username:</strong> {$username}<br><strong>Email:</strong> {$email}</p>
                <p>You can sign in here: <a href=\"{$loginUrl}\">{$loginUrl}</a></p>
                <p>Created by: {$actorName}</p>
                <p>Regards,<br>LMS Team</p>
            ";

            $altBody = "Hi {$recipientName},\n\n"
                . "Your LMS user account has been created successfully.\n"
                . "Username: {$username}\n"
                . "Email: {$email}\n"
                . "Sign in: {$loginUrl}\n"
                . "Created by: {$actorName}\n\n"
                . "Regards,\nLMS Team";

            $emailService->send($email, $subject, $body, $recipientName, $altBody);
        } catch (\Throwable $e) {
            error_log('User created email notification failed: ' . $e->getMessage());
        }
    }

    private function sendUserUpdatedNotification(array $recipient, array $performedBy, array $changedFields = []): void
    {
        try {
            $email = trim((string) ($recipient['email'] ?? ''));
            if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
                return;
            }

            $emailService = new EmailService();
            if (!$emailService->isEnabled()) {
                return;
            }

            $recipientName = $this->getDisplayName($recipient);
            $actorName     = $this->getDisplayName($performedBy);

            $hidden = ['password', 'new_password', 'old_password'];
            $fields = array_values(array_filter($changedFields, function ($field) use ($hidden) {
                return !in_array((string) $field, $hidden, true);
            }));

            $emailService->sendAccountUpdatedEmail($email, $recipientName, $fields, $actorName);
        } catch (\Throwable $e) {
            error_log('User updated email notification failed: ' . $e->getMessage());
        }
    }

    private function normalizeRoleName(string $roleName): string
    {
        return str_replace(['_', '-', ' '], '', strtolower(trim($roleName)));
    }

    private function isSuperAdminRoleName(string $roleName): bool
    {
        return $this->normalizeRoleName($roleName) === 'superadmin';
    }

    private function isAdminLikeRoleName(string $roleName): bool
    {
        $normalized = $this->normalizeRoleName($roleName);
        return strpos($normalized, 'admin') !== false && $normalized !== 'superadmin';
    }

    private function hasAdminLikeRole(array $roles): bool
    {
        foreach ($roles as $roleName) {
            if ($this->isAdminLikeRoleName((string) $roleName)) {
                return true;
            }
        }
        return false;
    }

    public function __construct()
    {
        $this->userRepo = new UserRepository();
    }

    public function index(array $user): void
    {
        $roleMiddleware = new RoleMiddleware($user);
        $page = isset($_GET['page']) ? (int) $_GET['page'] : 1;
        // accept per_page or limit for compatibility
        $limit = isset($_GET['per_page']) ? (int) $_GET['per_page'] : (isset($_GET['limit']) ? (int) $_GET['limit'] : 10);

        // Super admins may only view admin users (paginated)
        if (!empty($user['is_super_admin'])) {
            $filters = [];
            if (isset($_GET['search']) && trim((string) $_GET['search']) !== '') {
                $filters['search'] = trim((string) $_GET['search']);
            }
            if (isset($_GET['institution_id']) && (string) $_GET['institution_id'] !== '') {
                $filters['institution_id'] = (int) $_GET['institution_id'];
            } elseif (!empty($user['institution_id'])) {
                // Keep /api/users institution-scoped by default, even for super admins.
                $filters['institution_id'] = (int) $user['institution_id'];
            }
            if (isset($_GET['is_active']) && (string) $_GET['is_active'] !== '') {
                $filters['is_active'] = (int) $_GET['is_active'];
            }

            $users = $this->userRepo->getByRoleFiltered('admin', $page, $limit, $filters);
            $total = $this->userRepo->countByRoleFiltered('admin', $filters);
            Response::paginated($users, $total, $page, $limit);
            return;
        }

        // Only admins can view full users list
        if (!$roleMiddleware->isAdmin()) {
            Response::forbidden('Only admins can view users list');
            return;
        }

        $institutionId = isset($user['institution_id']) ? (int) $user['institution_id'] : 0;
        if ($institutionId <= 0) {
            Response::forbidden('Admin institution context is required');
            return;
        }

        $users = $this->userRepo->getByInstitution($institutionId, $page, $limit);
        $total = $this->userRepo->countByInstitution($institutionId);

        // Use the paginated helper to emit a consistent shape
        Response::paginated($users, $total, $page, $limit);
    }

    public function show(array $user, string $uuid): void
    {
        $sanitizedUuid = UuidHelper::sanitize($uuid);
        if (!$sanitizedUuid) {
            Response::badRequest('Invalid UUID format');
            return;
        }

        $roleMiddleware = new RoleMiddleware($user);
        // Fetch target user first
        $targetUser = $this->userRepo->findByUuid($sanitizedUuid);

        if (!$targetUser) {
            Response::notFound('User not found');
            return;
        }

        $targetUserId = $targetUser['user_id'];

        // Admins can view any user
        if ($roleMiddleware->isAdmin()) {
            Response::success($targetUser);
            return;
        }

        // Super admins can only view admin users (or their own profile)
        if (!empty($user['is_super_admin'])) {
            if ($user['user_id'] === $targetUserId) {
                Response::success($targetUser);
                return;
            }
            $roles = $targetUser['roles'] ?? [];
            if ($this->hasAdminLikeRole($roles)) {
                Response::success($targetUser);
                return;
            }
            Response::forbidden('Super admins can only view admin users');
            return;
        }

        // Regular users: can view only their own profile
        if ($user['user_id'] != $targetUserId) {
            Response::forbidden('You can only view your own profile');
            return;
        }

        Response::success($targetUser);
    }

    public function create(array $user): void
    {
        $roleMiddleware = new RoleMiddleware($user);

        // Admins can create any users. Super admins may create only admin users.
        if (!$roleMiddleware->isAdmin() && empty($user['is_super_admin'])) {
            Response::forbidden('Only admins can create users');
            return;
        }

        $data = json_decode(file_get_contents('php://input'), true);

        $validator = new Validator($data);
        $validator->required(['username', 'email', 'password'])
            ->email('email');

        if ($validator->fails()) {
            Response::validationError($validator->getErrors());
            return;
        }

        // Check if username exists
        if ($this->userRepo->findByUsername($data['username'])) {
            Response::badRequest('Username already exists');
            return;
        }

        // Check if email exists
        if ($this->userRepo->findByEmail($data['email'])) {
            Response::badRequest('Email already exists');
            return;
        }

        // Add institution_id for multi-tenant support
        if ($user['role'] !== 'super_admin' && !empty($user['institution_id'])) {
            $data['institution_id'] = $user['institution_id'];
        }

        $userId = $this->userRepo->create($data);

        if ($userId) {
            // If creator is super_admin, ensure the new user is assigned the 'admin' role
            if (!empty($user['is_super_admin'])) {
                $adminRole = $this->userRepo->getRoleByName('admin');
                if ($adminRole && isset($adminRole['role_id'])) {
                    $this->userRepo->assignRole($userId, (int) $adminRole['role_id']);
                }
            }

            $newUser = $this->userRepo->findById($userId);
            if (is_array($newUser)) {
                $this->sendUserCreatedNotification($newUser, $user);
            }
            Response::success($newUser, 201);
        } else {
            Response::serverError('Failed to create user');
        }
    }

    public function update(array $user, string $uuid): void
    {
        $sanitizedUuid = UuidHelper::sanitize($uuid);
        if (!$sanitizedUuid) {
            Response::badRequest('Invalid UUID format');
            return;
        }

        $roleMiddleware = new RoleMiddleware($user);

        // Users can update their own profile.
        // Admins can update any user.
        // Super admins may update admin users (and their own profile) only.
        $targetUser = $this->userRepo->findByUuid($sanitizedUuid);

        if (!$targetUser) {
            Response::notFound('User not found');
            return;
        }

        $targetUserId = $targetUser['user_id'];

        if ($user['user_id'] === $targetUserId) {
            // allowed: updating own profile
        } elseif ($roleMiddleware->isAdmin()) {
            // allowed: admin can update any
        } elseif (!empty($user['is_super_admin'])) {
            // super_admin may only update users who have the 'admin' role
            $roles = $targetUser['roles'] ?? [];
            if (!$this->hasAdminLikeRole($roles)) {
                Response::forbidden('Super admins can only update admin users');
                return;
            }
        } else {
            Response::forbidden('You can only update your own profile');
            return;
        }

        $data = json_decode(file_get_contents('php://input'), true);

        $requestedRoleId = null;
        if (is_array($data) && array_key_exists('role_id', $data) && $data['role_id'] !== '' && $data['role_id'] !== null) {
            $requestedRoleId = (int) $data['role_id'];
            unset($data['role_id']);
        }

        // Super admins can only assign admin role
        if (!empty($user['is_super_admin']) && $requestedRoleId !== null) {
            $requestedRole = $this->userRepo->getRoleById($requestedRoleId);
            $requestedRoleName = strtolower((string) ($requestedRole['role_name'] ?? ''));
            if (!$this->isAdminLikeRoleName($requestedRoleName)) {
                Response::forbidden('Super admins can only assign admin role');
                return;
            }
        }

        if ($this->userRepo->update($targetUserId, $data)) {
            if ($requestedRoleId !== null) {
                if (!$this->userRepo->assignRole($targetUserId, $requestedRoleId)) {
                    Response::serverError('Failed to update user role');
                    return;
                }
            }

            $updatedUser = $this->userRepo->findByUuid($sanitizedUuid);
            if (is_array($updatedUser)) {
                $this->sendUserUpdatedNotification($updatedUser, $user, array_keys($data));
            }
            Response::success($updatedUser);
        } else {
            Response::serverError('Failed to update user');
        }
    }

    public function delete(array $user, string $uuid): void
    {
        $sanitizedUuid = UuidHelper::sanitize($uuid);
        if (!$sanitizedUuid) {
            Response::badRequest('Invalid UUID format');
            return;
        }

        $roleMiddleware = new RoleMiddleware($user);

        $isSuperAdmin = !empty($user['is_super_admin']);

        // Allow admins to delete any user. Super admins may delete users
        // but only when the target user has the 'admin' role.
        if (!$roleMiddleware->isAdmin() && !$isSuperAdmin) {
            Response::forbidden('Only admins can delete users');
            return;
        }

        $targetUser = $this->userRepo->findByUuid($sanitizedUuid);

        if (!$targetUser) {
            Response::notFound('User not found');
            return;
        }

        $targetUserId = $targetUser['user_id'];

        // If requester is super_admin but not an admin, ensure the target
        // user has the 'admin' role before allowing deletion.
        if ($isSuperAdmin && !$roleMiddleware->isAdmin()) {
            $roles = $targetUser['roles'] ?? [];
            if (!$this->hasAdminLikeRole($roles)) {
                Response::forbidden('Super admins can only delete admin users');
                return;
            }
        }

        if ($this->userRepo->delete($targetUserId)) {
            Response::success(['message' => 'User deleted successfully']);
        } else {
            Response::serverError('Failed to delete user');
        }
    }

    public function assignRole(array $user, string $uuid): void
    {
        $sanitizedUuid = UuidHelper::sanitize($uuid);
        if (!$sanitizedUuid) {
            Response::badRequest('Invalid UUID format');
            return;
        }

        $roleMiddleware = new RoleMiddleware($user);

        if (!$roleMiddleware->isAdmin()) {
            Response::forbidden('Only admins can assign roles');
            return;
        }

        $targetUser = $this->userRepo->findByUuid($sanitizedUuid);

        if (!$targetUser) {
            Response::notFound('User not found');
            return;
        }

        $targetUserId = $targetUser['user_id'];

        $data = json_decode(file_get_contents('php://input'), true);

        $validator = new Validator($data);
        $validator->required(['role_id'])->numeric('role_id');

        if ($validator->fails()) {
            Response::validationError($validator->getErrors());
            return;
        }

        $requestedRoleId = (int) $data['role_id'];
        $requestedRole = $this->userRepo->getRoleById($requestedRoleId);
        $requestedRoleName = strtolower((string) ($requestedRole['role_name'] ?? ''));
        if ($this->isSuperAdminRoleName($requestedRoleName)) {
            Response::forbidden('Superadmin role cannot be assigned here');
            return;
        }

        if ($this->userRepo->assignRole($targetUserId, $requestedRoleId)) {
            Response::success(['message' => 'Role assigned successfully']);
        } else {
            Response::serverError('Failed to assign role');
        }
    }

    /**
        * Assign a single role to a user.
        * Expects JSON: { roles: [<roleId>|<roleName>] }
     */
    public function assignRoles(array $user, string $uuid): void
    {
        $sanitizedUuid = UuidHelper::sanitize($uuid);
        if (!$sanitizedUuid) {
            Response::badRequest('Invalid UUID format');
            return;
        }

        $roleMiddleware = new RoleMiddleware($user);

        if (!$roleMiddleware->isAdmin()) {
            Response::forbidden('Only admins can assign roles');
            return;
        }

        $targetUser = $this->userRepo->findByUuid($sanitizedUuid);

        if (!$targetUser) {
            Response::notFound('User not found');
            return;
        }

        $targetUserId = $targetUser['user_id'];

        $data = json_decode(file_get_contents('php://input'), true);
        if (!isset($data['roles']) || !is_array($data['roles'])) {
            Response::validationError(['roles' => 'roles array required']);
            return;
        }

        $roles = array_values(array_filter($data['roles'], function ($role) {
            return $role !== null && $role !== '';
        }));

        if (count($roles) !== 1) {
            Response::validationError(['roles' => 'Exactly one role can be assigned to a user']);
            return;
        }

        try {
            $roleInput = $roles[0];
            $roleId = null;

            if (is_numeric($roleInput) || ctype_digit((string) $roleInput)) {
                $roleId = (int) $roleInput;
                $role = $this->userRepo->getRoleById($roleId);
                $roleName = strtolower((string) ($role['role_name'] ?? ''));
                if ($this->isSuperAdminRoleName($roleName)) {
                    Response::forbidden('Superadmin role cannot be assigned here');
                    return;
                }
            } else {
                $roleName = strtolower((string) $roleInput);
                if ($this->isSuperAdminRoleName($roleName)) {
                    Response::forbidden('Superadmin role cannot be assigned here');
                    return;
                }

                $role = $this->userRepo->getRoleByName($roleName);
                if ($role && isset($role['role_id'])) {
                    $roleId = (int) $role['role_id'];
                }
            }

            if (!$roleId) {
                Response::validationError(['roles' => 'Selected role does not exist']);
                return;
            }

            if ($this->userRepo->assignRole($targetUserId, $roleId)) {
                Response::success(['message' => 'Role updated']);
                return;
            }

            Response::serverError('Failed to assign role');
        } catch (\Exception $e) {
            error_log('Assign Roles Error: ' . $e->getMessage());
            Response::serverError('Failed to assign roles');
        }
    }

    /**
     * Bulk actions on users
     * Expects JSON: { action: 'activate'|'deactivate'|'delete', ids: [1,2,3] }
     */
    public function bulk(array $user): void
    {
        $roleMiddleware = new RoleMiddleware($user);

        // Allow admins to perform bulk actions. Super admins may perform bulk
        // actions but only on users who have the 'admin' role.
        $isSuperAdmin = !empty($user['is_super_admin']);
        if (!$roleMiddleware->isAdmin() && !$isSuperAdmin) {
            Response::forbidden('Only admins can perform bulk actions');
            return;
        }

        $data = json_decode(file_get_contents('php://input'), true);
        if (!isset($data['action']) || !isset($data['ids']) || !is_array($data['ids'])) {
            Response::validationError(['action' => 'action and ids required']);
            return;
        }

        $action = $data['action'];
        $originalIds = array_map('intval', $data['ids']);
        $ids = $originalIds;

        // If the requester is a super_admin, restrict the target ids to users
        // that have the 'admin' role to enforce policy.
        if ($isSuperAdmin) {
            $allowed = [];
            foreach ($ids as $iid) {
                $t = $this->userRepo->findById($iid);
                if ($t) {
                    $roles = $t['roles'] ?? [];
                    if ($this->hasAdminLikeRole($roles)) {
                        $allowed[] = $iid;
                    }
                }
            }
            $ids = $allowed;
        }

        // Determine which ids were skipped by policy filtering
        $skipped_ids = array_values(array_diff($originalIds, $ids));

        $results = ['updated' => 0, 'deleted' => 0, 'failed' => 0];

        foreach ($ids as $id) {
            try {
                if ($action === 'activate') {
                    if ($this->userRepo->update($id, ['is_active' => 1]))
                        $results['updated']++;
                    else
                        $results['failed']++;
                } elseif ($action === 'deactivate') {
                    if ($this->userRepo->update($id, ['is_active' => 0]))
                        $results['updated']++;
                    else
                        $results['failed']++;
                } elseif ($action === 'delete') {
                    if ($this->userRepo->delete($id))
                        $results['deleted']++;
                    else
                        $results['failed']++;
                } else {
                    $results['failed']++;
                }
            } catch (\Exception $e) {
                error_log('Bulk action error for user ' . $id . ': ' . $e->getMessage());
                $results['failed']++;
            }
        }

        Response::success(['results' => $results, 'skipped_ids' => $skipped_ids]);
    }

    /**
     * Import users from JSON rows
     * Expects JSON: { rows: [ { first_name, last_name, username, email, institution_name|institution_id, roles, is_active }, ... ] }
     */
    public function import(array $user): void
    {
        $roleMiddleware = new RoleMiddleware($user);

        $isSuperAdmin = !empty($user['is_super_admin']);
        // Allow admins to import. Super admins may import but only create
        // users with the 'admin' role (ignore provided roles).
        if (!$roleMiddleware->isAdmin() && !$isSuperAdmin) {
            Response::forbidden('Only admins can import users');
            return;
        }

        $data = json_decode(file_get_contents('php://input'), true);
        if (!isset($data['rows']) || !is_array($data['rows'])) {
            Response::validationError(['rows' => 'rows array required']);
            return;
        }

        $created = 0;
        $errors = [];

        // Pre-fetch admin role id when requester is super_admin to assign later
        $adminRole = null;
        if ($isSuperAdmin) {
            $adminRole = $this->userRepo->getRoleByName('admin');
        }

        foreach ($data['rows'] as $idx => $row) {
            $rowIndex = $idx + 1;

            // basic validation: require username or email
            $username = isset($row['username']) ? trim($row['username']) : null;
            $email = isset($row['email']) ? trim($row['email']) : null;

            if (empty($username) && empty($email)) {
                $errors[] = ['row' => $rowIndex, 'error' => 'Missing username or email'];
                continue;
            }

            if ($email && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
                $errors[] = ['row' => $rowIndex, 'error' => 'Invalid email'];
                continue;
            }

            $rowRoles = [];
            if (!$isSuperAdmin && !empty($row['roles'])) {
                $rowRoles = is_array($row['roles']) ? $row['roles'] : array_map('trim', explode(',', $row['roles']));
                $rowRoles = array_values(array_filter($rowRoles, function ($role) {
                    return $role !== null && trim((string) $role) !== '';
                }));

                if (count($rowRoles) > 1) {
                    $errors[] = ['row' => $rowIndex, 'error' => 'Only one role can be assigned to a user'];
                    continue;
                }
            }

            // Prepare payload for creation
            $payload = [];
            $payload['first_name'] = $row['first_name'] ?? null;
            $payload['last_name'] = $row['last_name'] ?? null;
            $payload['username'] = $username ?? ($email ? preg_replace('/@.+$/', '', $email) : null);
            $payload['email'] = $email ?? null;
            // auto generate a password if not provided
            $payload['password'] = $row['password'] ?? bin2hex(random_bytes(6));
            if ($isSuperAdmin) {
                // attempt to resolve institution id by name if provided
                if (!empty($row['institution_id'])) {
                    $payload['institution_id'] = (int) $row['institution_id'];
                } elseif (!empty($row['institution_name'])) {
                    $instRepo = new \App\Repositories\InstitutionRepository();
                    $inst = $instRepo->findByName($row['institution_name']);
                    if ($inst && isset($inst['institution_id'])) {
                        $payload['institution_id'] = (int) $inst['institution_id'];
                    }
                }
            } elseif (!empty($user['institution_id'])) {
                $payload['institution_id'] = (int) $user['institution_id'];
            }

            // default active flag
            $payload['is_active'] = isset($row['is_active']) ? (int) $row['is_active'] : 1;

            // Skip duplicates before hitting DB unique constraints.
            if (!empty($payload['username']) && $this->userRepo->isUsernameTaken((string) $payload['username'], $payload['institution_id'] ?? null)) {
                $errors[] = ['row' => $rowIndex, 'error' => 'User already exists (username already used in this institution)'];
                continue;
            }

            if (!empty($payload['email']) && $this->userRepo->isEmailTaken((string) $payload['email'])) {
                $errors[] = ['row' => $rowIndex, 'error' => 'User already exists (email already used)'];
                continue;
            }

            // create user
            $userId = $this->userRepo->create($payload);
            if (!$userId) {
                // Fallback classification in case a race condition still causes duplicate insert failure.
                if (!empty($payload['username']) && $this->userRepo->isUsernameTaken((string) $payload['username'], $payload['institution_id'] ?? null)) {
                    $errors[] = ['row' => $rowIndex, 'error' => 'User already exists (username already used in this institution)'];
                } elseif (!empty($payload['email']) && $this->userRepo->isEmailTaken((string) $payload['email'])) {
                    $errors[] = ['row' => $rowIndex, 'error' => 'User already exists (email already used)'];
                } else {
                    $errors[] = ['row' => $rowIndex, 'error' => 'Failed to create user'];
                }
                continue;
            }

            $created++;

            // assign roles
            if ($isSuperAdmin) {
                // When super_admin imports, always assign 'admin' role and ignore provided roles
                if ($adminRole && isset($adminRole['role_id'])) {
                    $this->userRepo->assignRole($userId, (int) $adminRole['role_id']);
                }
            } else {
                if (!empty($rowRoles)) {
                    $roleInput = $rowRoles[0];
                    if (is_numeric($roleInput) || ctype_digit((string) $roleInput)) {
                        $this->userRepo->assignRole($userId, (int) $roleInput);
                    } else {
                        $role = $this->userRepo->getRoleByName(strtolower((string) $roleInput));
                        if ($role && isset($role['role_id'])) {
                            $this->userRepo->assignRole($userId, (int) $role['role_id']);
                        }
                    }
                }
            }

            $createdUser = $this->userRepo->findById((int) $userId);
            if (is_array($createdUser)) {
                $this->sendUserCreatedNotification($createdUser, $user);
            }
        }

        // Provide a list of skipped row numbers for the client UI to display.
        $skipped_rows = array_map(function ($e) {
            return $e['row'] ?? null;
        }, $errors);

        Response::success(['created' => $created, 'errors' => $errors, 'skipped_rows' => array_values(array_filter($skipped_rows))]);
    }

    public function removeRole(array $user, string $uuid, int $roleId): void
    {
        $sanitizedUuid = UuidHelper::sanitize($uuid);
        if (!$sanitizedUuid) {
            Response::badRequest('Invalid UUID format');
            return;
        }

        $roleMiddleware = new RoleMiddleware($user);

        if (!$roleMiddleware->isAdmin()) {
            Response::forbidden('Only admins can remove roles');
            return;
        }

        $targetUser = $this->userRepo->findByUuid($sanitizedUuid);

        if (!$targetUser) {
            Response::notFound('User not found');
            return;
        }

        $targetUserId = $targetUser['user_id'];

        if ($this->userRepo->removeRole($targetUserId, $roleId)) {
            Response::success(['message' => 'Role removed successfully']);
        } else {
            Response::serverError('Failed to remove role');
        }
    }

    public function resetPassword(array $user, string $uuid): void
    {
        $sanitizedUuid = UuidHelper::sanitize($uuid);
        if (!$sanitizedUuid) {
            Response::badRequest('Invalid UUID format');
            return;
        }

        $roleMiddleware = new RoleMiddleware($user);
        $isSuperAdmin = !empty($user['is_super_admin']);

        if (!$roleMiddleware->isAdmin() && !$isSuperAdmin) {
            Response::forbidden('Only admins can reset user passwords');
            return;
        }

        $targetUser = $this->userRepo->findByUuid($sanitizedUuid);
        if (!$targetUser) {
            Response::notFound('User not found');
            return;
        }

        // Super admins may reset passwords only for admin users.
        if ($isSuperAdmin && !$roleMiddleware->isAdmin()) {
            $roles = $targetUser['roles'] ?? [];
            if (!$this->hasAdminLikeRole($roles)) {
                Response::forbidden('Super admins can only reset admin user passwords');
                return;
            }
        }

        $data = json_decode(file_get_contents('php://input'), true);
        $validator = new Validator($data);
        $validator->required(['new_password'])->min('new_password', 8);

        if ($validator->fails()) {
            Response::validationError($validator->getErrors());
            return;
        }

        if ($this->userRepo->updatePassword((int) $targetUser['user_id'], (string) $data['new_password'])) {
            $this->userRepo->logActivity((int) $user['user_id'], 'admin_password_reset', [
                'target_user_uuid' => $sanitizedUuid,
                'target_user_id' => (int) $targetUser['user_id'],
            ]);

            $email = trim((string) ($targetUser['email'] ?? ''));
            if ($email !== '' && filter_var($email, FILTER_VALIDATE_EMAIL)) {
                $emailService = new EmailService();
                if ($emailService->isEnabled()) {
                    $emailService->sendPasswordChangedConfirmationEmail(
                        $email,
                        $this->getDisplayName($targetUser),
                        $this->getDisplayName($user)
                    );
                }
            }

            Response::success(['message' => 'Password reset successfully']);
            return;
        }

        Response::serverError('Failed to reset password');
    }

    public function getActivity(array $user, string $uuid): void
    {
        $sanitizedUuid = UuidHelper::sanitize($uuid);
        if (!$sanitizedUuid) {
            Response::badRequest('Invalid UUID format');
            return;
        }

        $roleMiddleware = new RoleMiddleware($user);

        $targetUser = $this->userRepo->findByUuid($sanitizedUuid);

        if (!$targetUser) {
            Response::notFound('User not found');
            return;
        }

        $targetUserId = $targetUser['user_id'];

        // Users can view their own activity, admins can view any
        if (!$roleMiddleware->isAdmin() && $user['user_id'] != $targetUserId) {
            Response::forbidden('You can only view your own activity');
            return;
        }

        try {
            $db = \App\Config\Database::getInstance()->getConnection();
            $stmt = $db->prepare("
                SELECT * FROM user_activity 
                WHERE user_id = :user_id 
                ORDER BY created_at DESC 
                LIMIT 50
            ");
            $stmt->execute(['user_id' => $targetUserId]);
            $activity = $stmt->fetchAll(\PDO::FETCH_ASSOC);

            Response::success($activity);
        } catch (\PDOException $e) {
            error_log("Get User Activity Error: " . $e->getMessage());
            Response::serverError('Failed to fetch user activity');
        }
    }
}