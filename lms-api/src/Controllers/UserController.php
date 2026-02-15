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

        if (!$roleMiddleware->isAdmin()) {
            Response::forbidden('Only admins can view users list');
            return;
        }

        $page = isset($_GET['page']) ? (int) $_GET['page'] : 1;
        $limit = isset($_GET['limit']) ? (int) $_GET['limit'] : 20;

        $users = $this->userRepo->getAll($page, $limit);
        $total = $this->userRepo->count();

        Response::success([
            'users' => $users,
            'pagination' => [
                'current_page' => $page,
                'per_page' => $limit,
                'total' => $total,
                'total_pages' => ceil($total / $limit)
            ]
        ]);
    }

    public function show(array $user, int $id): void
    {
        $roleMiddleware = new RoleMiddleware($user);

        // Users can view their own profile, admins can view any
        if (!$roleMiddleware->isAdmin() && $user['user_id'] != $id) {
            Response::forbidden('You can only view your own profile');
            return;
        }

        $targetUser = $this->userRepo->findById($id);

        if (!$targetUser) {
            Response::notFound('User not found');
            return;
        }

        Response::success($targetUser);
    }

    public function create(array $user): void
    {
        $roleMiddleware = new RoleMiddleware($user);

        if (!$roleMiddleware->isAdmin()) {
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
            $newUser = $this->userRepo->findById($userId);
            Response::success($newUser, 201);
        } else {
            Response::serverError('Failed to create user');
        }
    }

    public function update(array $user, int $id): void
    {
        $roleMiddleware = new RoleMiddleware($user);

        // Users can update their own profile, admins can update any
        if (!$roleMiddleware->isAdmin() && $user['user_id'] != $id) {
            Response::forbidden('You can only update your own profile');
            return;
        }

        $targetUser = $this->userRepo->findById($id);

        if (!$targetUser) {
            Response::notFound('User not found');
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

        if (!$roleMiddleware->isAdmin()) {
            Response::forbidden('Only admins can delete users');
            return;
        }

        $targetUser = $this->userRepo->findById($id);

        if (!$targetUser) {
            Response::notFound('User not found');
            return;
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
