<?php

namespace App\Controllers;

use App\Utils\Response;
use App\Utils\Validator;
use App\Repositories\ParentRepository;
use App\Repositories\UserRepository;
use App\Middleware\RoleMiddleware;

class ParentController
{
    private ParentRepository $repo;
    private UserRepository $userRepo;

    public function __construct()
    {
        $this->repo = new ParentRepository();
        $this->userRepo = new UserRepository();
    }

    public function index(array $user): void
    {
        $page = isset($_GET['page']) ? (int) $_GET['page'] : 1;
        $limit = isset($_GET['limit']) ? (int) $_GET['limit'] : 20;
        $institutionId = isset($user['institution_id']) ? (int) $user['institution_id'] : null;

        $parents = $this->repo->getAll($page, $limit, $institutionId);
        $total = $this->repo->count($institutionId);

        Response::success([
            'data' => $parents,
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
        $parent = $this->repo->findById($id);

        if (!$parent) {
            Response::notFound('Parent not found');
            return;
        }

        Response::success($parent);
    }

    public function create(array $user): void
    {
        $roleMiddleware = new RoleMiddleware($user);

        if (!$roleMiddleware->requireRole('admin')) {
            return;
        }

        $data = json_decode(file_get_contents('php://input'), true);

        $validator = new Validator($data);
        $validator->required(['username', 'email', 'password', 'first_name', 'last_name'])
            ->maxLength('username', 50)
            ->email('email')
            ->min('password', 8)
            ->maxLength('first_name', 100)
            ->maxLength('last_name', 100);

        $validator->maxLength('email', 100);
        if (isset($data['phone_number'])) {
            $validator->maxLength('phone_number', 20);
        }
        if (isset($data['guardian_id'])) {
            $validator->maxLength('guardian_id', 50);
        }
        if (isset($data['prefers_email_notifications'])) {
            $validator->in('prefers_email_notifications', [0, 1, '0', '1']);
        }
        if (isset($data['prefers_sms_notifications'])) {
            $validator->in('prefers_sms_notifications', [0, 1, '0', '1']);
        }

        if ($validator->fails()) {
            Response::validationError($validator->getErrors());
            return;
        }

        $institutionId = isset($user['institution_id']) ? (int) $user['institution_id'] : null;
        if ($institutionId === null) {
            Response::serverError('Unable to determine institution for parent account');
            return;
        }

        $duplicates = [];
        if ($this->userRepo->isUsernameTaken($data['username'], $institutionId)) {
            $duplicates['username'] = ['Username already taken'];
        }
        if ($this->userRepo->isEmailTaken($data['email'], null, $institutionId)) {
            $duplicates['email'] = ['Email already in use'];
        }
        if (!empty($duplicates)) {
            Response::validationError($duplicates);
            return;
        }

        $data['institution_id'] = $institutionId;

        $userId = $this->userRepo->create($data);
        if (!$userId) {
            Response::serverError('Failed to create parent user account');
            return;
        }

        $parentRole = $this->userRepo->getRoleByName('parent');
        if (!$parentRole || !$this->userRepo->assignRole($userId, (int) $parentRole['role_id'])) {
            $this->userRepo->delete($userId);
            Response::serverError('Failed to assign parent role');
            return;
        }

        $parentId = $this->repo->create([
            'institution_id' => $institutionId,
            'user_id' => $userId,
            'guardian_id' => $data['guardian_id'] ?? null,
            'occupation' => $data['occupation'] ?? null,
            'prefers_email_notifications' => $data['prefers_email_notifications'] ?? 1,
            'prefers_sms_notifications' => $data['prefers_sms_notifications'] ?? 0,
        ]);

        if ($parentId) {
            Response::success([
                'message' => 'Parent created successfully',
                'parent_id' => $parentId,
                'user_id' => $userId
            ], 201);
        } else {
            $this->userRepo->delete($userId);
            Response::serverError('Failed to create parent');
        }
    }

    public function update(array $user, int $id): void
    {
        $roleMiddleware = new RoleMiddleware($user);

        if (!$roleMiddleware->requireRole('admin')) {
            return;
        }

        $parent = $this->repo->findById($id);

        if (!$parent) {
            Response::notFound('Parent not found');
            return;
        }

        $data = json_decode(file_get_contents('php://input'), true);

        $validator = new Validator($data);
        if (isset($data['username'])) {
            $validator->maxLength('username', 50);
        }
        if (isset($data['first_name'])) {
            $validator->maxLength('first_name', 100);
        }
        if (isset($data['last_name'])) {
            $validator->maxLength('last_name', 100);
        }
        if (isset($data['email'])) {
            $validator->email('email')->maxLength('email', 100);
        }
        if (isset($data['password']) && $data['password'] !== '') {
            $validator->min('password', 8);
        }
        if (isset($data['phone_number'])) {
            $validator->maxLength('phone_number', 20);
        }
        if (isset($data['guardian_id'])) {
            $validator->maxLength('guardian_id', 50);
        }
        if (isset($data['prefers_email_notifications'])) {
            $validator->in('prefers_email_notifications', [0, 1, '0', '1']);
        }
        if (isset($data['prefers_sms_notifications'])) {
            $validator->in('prefers_sms_notifications', [0, 1, '0', '1']);
        }

        if ($validator->fails()) {
            Response::validationError($validator->getErrors());
            return;
        }

        $institutionId = isset($user['institution_id']) ? (int) $user['institution_id'] : null;
        $duplicateErrors = [];

        if (!empty($data['username']) && $institutionId !== null && $this->userRepo->isUsernameTaken($data['username'], $institutionId, (int) $parent['user_id'])) {
            $duplicateErrors['username'] = ['Username already taken'];
        }
        if (!empty($data['email']) && $this->userRepo->isEmailTaken($data['email'], (int) $parent['user_id'], $institutionId)) {
            $duplicateErrors['email'] = ['Email already in use'];
        }
        if (!empty($duplicateErrors)) {
            Response::validationError($duplicateErrors);
            return;
        }

        $userFields = array_intersect_key($data, array_flip([
            'username',
            'email',
            'first_name',
            'last_name',
            'phone_number',
            'address'
        ]));

        $parentFields = array_intersect_key($data, array_flip([
            'guardian_id',
            'occupation',
            'prefers_email_notifications',
            'prefers_sms_notifications'
        ]));

        $userUpdated = true;
        if (!empty($userFields)) {
            $userUpdated = $this->userRepo->update((int) $parent['user_id'], $userFields);
        }

        if ($userUpdated && isset($data['password']) && $data['password'] !== '') {
            $userUpdated = $this->userRepo->updatePassword((int) $parent['user_id'], (string) $data['password']);
        }

        $parentUpdated = true;
        if (!empty($parentFields)) {
            $parentUpdated = $this->repo->update($id, $parentFields);
        }

        if (!$userUpdated || !$parentUpdated) {
            Response::serverError('Failed to update parent');
            return;
        }

        Response::success(['message' => 'Parent updated successfully']);
    }

    public function delete(array $user, int $id): void
    {
        $roleMiddleware = new RoleMiddleware($user);

        if (!$roleMiddleware->requireRole('admin')) {
            return;
        }

        $parent = $this->repo->findById($id);

        if (!$parent) {
            Response::notFound('Parent not found');
            return;
        }

        if ($this->repo->delete($id)) {
            Response::success(['message' => 'Parent deleted successfully']);
        } else {
            Response::serverError('Failed to delete parent');
        }
    }

    public function getStudents(array $user, int $id): void
    {
        $parent = $this->repo->findById($id);

        if (!$parent) {
            Response::notFound('Parent not found');
            return;
        }

        $students = $this->repo->getStudents($id);
        Response::success($students);
    }
}