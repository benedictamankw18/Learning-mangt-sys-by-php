<?php

namespace App\Controllers;

use App\Utils\Response;
use App\Utils\Validator;
use App\Repositories\UserRepository;
use App\Middleware\RoleMiddleware;

class UserController
{
    private UserRepository $userRepo;

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
            $users = $this->userRepo->getByRole('admin', $page, $limit);
            $total = $this->userRepo->countByRole('admin');
            Response::paginated($users, $total, $page, $limit);
            return;
        }

        // Only admins can view full users list
        if (!$roleMiddleware->isAdmin()) {
            Response::forbidden('Only admins can view users list');
            return;
        }

        $users = $this->userRepo->getAll($page, $limit);
        $total = $this->userRepo->count();

        // Use the paginated helper to emit a consistent shape
        Response::paginated($users, $total, $page, $limit);
    }

    public function show(array $user, int $id): void
    {
        $roleMiddleware = new RoleMiddleware($user);
        // Fetch target user first
        $targetUser = $this->userRepo->findById($id);

        if (!$targetUser) {
            Response::notFound('User not found');
            return;
        }

        // Admins can view any user
        if ($roleMiddleware->isAdmin()) {
            Response::success($targetUser);
            return;
        }

        // Super admins can only view admin users (or their own profile)
        if (!empty($user['is_super_admin'])) {
            if ($user['user_id'] === $id) {
                Response::success($targetUser);
                return;
            }
            $roles = $targetUser['roles'] ?? [];
            if (in_array('admin', $roles)) {
                Response::success($targetUser);
                return;
            }
            Response::forbidden('Super admins can only view admin users');
            return;
        }

        // Regular users: can view only their own profile
        if ($user['user_id'] != $id) {
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
            Response::success($newUser, 201);
        } else {
            Response::serverError('Failed to create user');
        }
    }

    public function update(array $user, int $id): void
    {
        $roleMiddleware = new RoleMiddleware($user);

        // Users can update their own profile.
        // Admins can update any user.
        // Super admins may update admin users (and their own profile) only.
        $targetUser = $this->userRepo->findById($id);

        if (!$targetUser) {
            Response::notFound('User not found');
            return;
        }

        if ($user['user_id'] === $id) {
            // allowed: updating own profile
        } elseif ($roleMiddleware->isAdmin()) {
            // allowed: admin can update any
        } elseif (!empty($user['is_super_admin'])) {
            // super_admin may only update users who have the 'admin' role
            $roles = $targetUser['roles'] ?? [];
            if (!in_array('admin', $roles)) {
                Response::forbidden('Super admins can only update admin users');
                return;
            }
        } else {
            Response::forbidden('You can only update your own profile');
            return;
        }

        $data = json_decode(file_get_contents('php://input'), true);

        if ($this->userRepo->update($id, $data)) {
            $updatedUser = $this->userRepo->findById($id);
            Response::success($updatedUser);
        } else {
            Response::serverError('Failed to update user');
        }
    }

    public function delete(array $user, int $id): void
    {
        $roleMiddleware = new RoleMiddleware($user);

        $isSuperAdmin = !empty($user['is_super_admin']);

        // Allow admins to delete any user. Super admins may delete users
        // but only when the target user has the 'admin' role.
        if (!$roleMiddleware->isAdmin() && !$isSuperAdmin) {
            Response::forbidden('Only admins can delete users');
            return;
        }

        $targetUser = $this->userRepo->findById($id);

        if (!$targetUser) {
            Response::notFound('User not found');
            return;
        }

        // If requester is super_admin but not an admin, ensure the target
        // user has the 'admin' role before allowing deletion.
        if ($isSuperAdmin && !$roleMiddleware->isAdmin()) {
            $roles = $targetUser['roles'] ?? [];
            if (!in_array('admin', $roles)) {
                Response::forbidden('Super admins can only delete admin users');
                return;
            }
        }

        if ($this->userRepo->delete($id)) {
            Response::success(['message' => 'User deleted successfully']);
        } else {
            Response::serverError('Failed to delete user');
        }
    }

    public function assignRole(array $user, int $id): void
    {
        $roleMiddleware = new RoleMiddleware($user);

        if (!$roleMiddleware->isAdmin()) {
            Response::forbidden('Only admins can assign roles');
            return;
        }

        $targetUser = $this->userRepo->findById($id);

        if (!$targetUser) {
            Response::notFound('User not found');
            return;
        }

        $data = json_decode(file_get_contents('php://input'), true);

        $validator = new Validator($data);
        $validator->required(['role_id'])->numeric('role_id');

        if ($validator->fails()) {
            Response::validationError($validator->getErrors());
            return;
        }

        if ($this->userRepo->assignRole($id, (int) $data['role_id'])) {
            Response::success(['message' => 'Role assigned successfully']);
        } else {
            Response::serverError('Failed to assign role');
        }
    }

    /**
     * Assign multiple roles to a user (replace existing roles)
     * Expects JSON: { roles: [<roleId>|<roleName>, ...] }
     */
    public function assignRoles(array $user, int $id): void
    {
        $roleMiddleware = new RoleMiddleware($user);

        if (!$roleMiddleware->isAdmin()) {
            Response::forbidden('Only admins can assign roles');
            return;
        }

        $targetUser = $this->userRepo->findById($id);

        if (!$targetUser) {
            Response::notFound('User not found');
            return;
        }

        $data = json_decode(file_get_contents('php://input'), true);
        if (!isset($data['roles']) || !is_array($data['roles'])) {
            Response::validationError(['roles' => 'roles array required']);
            return;
        }

        try {
            $db = \App\Config\Database::getInstance()->getConnection();
            // Remove existing roles
            $stmt = $db->prepare("DELETE FROM user_roles WHERE user_id = :user_id");
            $stmt->execute(['user_id' => $id]);

            // Assign provided roles (accept numeric ids or role names)
            foreach ($data['roles'] as $r) {
                if (is_numeric($r) || ctype_digit((string) $r)) {
                    $this->userRepo->assignRole($id, (int) $r);
                } else {
                    // look up role by name
                    $role = $this->userRepo->getRoleByName(strtolower((string) $r));
                    if ($role && isset($role['role_id'])) {
                        $this->userRepo->assignRole($id, (int) $role['role_id']);
                    }
                }
            }

            Response::success(['message' => 'Roles updated']);
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
                    if (in_array('admin', $roles)) {
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

            // Prepare payload for creation
            $payload = [];
            $payload['first_name'] = $row['first_name'] ?? null;
            $payload['last_name'] = $row['last_name'] ?? null;
            $payload['username'] = $username ?? ($email ? preg_replace('/@.+$/', '', $email) : null);
            $payload['email'] = $email ?? null;
            // auto generate a password if not provided
            $payload['password'] = $row['password'] ?? bin2hex(random_bytes(6));
            // attempt to resolve institution id by name if provided
            if (!empty($row['institution_id'])) {
                $payload['institution_id'] = (int) $row['institution_id'];
            } elseif (!empty($row['institution_name'])) {
                // try to find by name
                $instRepo = new \App\Repositories\InstitutionRepository();
                $inst = $instRepo->findByName($row['institution_name']);
                if ($inst && isset($inst['institution_id']))
                    $payload['institution_id'] = (int) $inst['institution_id'];
            }

            // default active flag
            $payload['is_active'] = isset($row['is_active']) ? (int) $row['is_active'] : 1;

            // create user
            $userId = $this->userRepo->create($payload);
            if (!$userId) {
                $errors[] = ['row' => $rowIndex, 'error' => 'Failed to create user'];
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
                // Admins may provide roles (comma-separated or array)
                if (!empty($row['roles'])) {
                    $roles = is_array($row['roles']) ? $row['roles'] : array_map('trim', explode(',', $row['roles']));
                    foreach ($roles as $r) {
                        if (is_numeric($r) || ctype_digit((string) $r)) {
                            $this->userRepo->assignRole($userId, (int) $r);
                        } else {
                            $role = $this->userRepo->getRoleByName(strtolower($r));
                            if ($role && isset($role['role_id'])) {
                                $this->userRepo->assignRole($userId, (int) $role['role_id']);
                            }
                        }
                    }
                }
            }
        }

        // Provide a list of skipped row numbers for the client UI to display.
        $skipped_rows = array_map(function ($e) {
            return $e['row'] ?? null;
        }, $errors);

        Response::success(['created' => $created, 'errors' => $errors, 'skipped_rows' => array_values(array_filter($skipped_rows))]);
    }

    public function removeRole(array $user, int $id, int $roleId): void
    {
        $roleMiddleware = new RoleMiddleware($user);

        if (!$roleMiddleware->isAdmin()) {
            Response::forbidden('Only admins can remove roles');
            return;
        }

        $targetUser = $this->userRepo->findById($id);

        if (!$targetUser) {
            Response::notFound('User not found');
            return;
        }

        if ($this->userRepo->removeRole($id, $roleId)) {
            Response::success(['message' => 'Role removed successfully']);
        } else {
            Response::serverError('Failed to remove role');
        }
    }

    public function getActivity(array $user, int $id): void
    {
        $roleMiddleware = new RoleMiddleware($user);

        // Users can view their own activity, admins can view any
        if (!$roleMiddleware->isAdmin() && $user['user_id'] != $id) {
            Response::forbidden('You can only view your own activity');
            return;
        }

        $targetUser = $this->userRepo->findById($id);

        if (!$targetUser) {
            Response::notFound('User not found');
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
            $stmt->execute(['user_id' => $id]);
            $activity = $stmt->fetchAll(\PDO::FETCH_ASSOC);

            Response::success($activity);
        } catch (\PDOException $e) {
            error_log("Get User Activity Error: " . $e->getMessage());
            Response::serverError('Failed to fetch user activity');
        }
    }
}
