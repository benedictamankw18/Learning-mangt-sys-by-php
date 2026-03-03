<?php

namespace App\Controllers;

use App\Utils\Response;
use App\Utils\Validator;
use App\Utils\UuidHelper;
use App\Repositories\SubjectRepository;
use App\Middleware\RoleMiddleware;

class SubjectController
{
    private SubjectRepository $repo;

    public function __construct()
    {
        $this->repo = new SubjectRepository();
    }

    public function index(array $user): void
    {
        $page = isset($_GET['page']) ? (int) $_GET['page'] : 1;
        $limit = isset($_GET['limit']) ? (int) $_GET['limit'] : 20;

        $subjects = $this->repo->getAll($page, $limit);
        $total = $this->repo->count();

        Response::success([
            'data' => $subjects,
            'pagination' => [
                'current_page' => $page,
                'per_page' => $limit,
                'total' => $total,
                'total_pages' => ceil($total / $limit)
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

        $subject = $this->repo->findByUuid($sanitizedUuid);

        if (!$subject) {
            Response::notFound('Subject not found');
            return;
        }

        Response::success($subject);
    }

    public function create(array $user): void
    {
        $roleMiddleware = new RoleMiddleware($user);

        if (!$roleMiddleware->requireRole('admin')) {
            return;
        }

        $data = json_decode(file_get_contents('php://input'), true);

        $validator = new Validator($data);
        $validator->required(['subject_code', 'subject_name'])
            ->maxLength('subject_code', 20)
            ->maxLength('subject_name', 200);

        if (isset($data['credits'])) {
            $validator->numeric('credits');
        }

        if ($validator->fails()) {
            Response::validationError($validator->getErrors());
            return;
        }

        // Add institution_id for multi-tenant support (CRITICAL)
        if ($user['role'] !== 'super_admin') {
            $data['institution_id'] = $user['institution_id'];
        }

        $subjectId = $this->repo->create($data);

        if ($subjectId) {
            Response::success([
                'message' => 'Subject created successfully',
                'subject_id' => $subjectId
            ], 201);
        } else {
            Response::serverError('Failed to create subject');
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

        if (!$roleMiddleware->requireRole('admin')) {
            return;
        }

        $subject = $this->repo->findByUuid($sanitizedUuid);

        if (!$subject) {
            Response::notFound('Subject not found');
            return;
        }

        $subjectId = $subject['subject_id'];

        $data = json_decode(file_get_contents('php://input'), true);

        $validator = new Validator($data);
        if (isset($data['subject_code'])) {
            $validator->maxLength('subject_code', 20);
        }
        if (isset($data['subject_name'])) {
            $validator->maxLength('subject_name', 200);
        }
        if (isset($data['credits'])) {
            $validator->numeric('credits');
        }

        if ($validator->fails()) {
            Response::validationError($validator->getErrors());
            return;
        }

        if ($this->repo->update($subjectId, $data)) {
            Response::success(['message' => 'Subject updated successfully']);
        } else {
            Response::serverError('Failed to update subject');
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

        if (!$roleMiddleware->requireRole('admin')) {
            return;
        }

        $subject = $this->repo->findByUuid($sanitizedUuid);

        if (!$subject) {
            Response::notFound('Subject not found');
            return;
        }

        $subjectId = $subject['subject_id'];

        if ($this->repo->delete($subjectId)) {
            Response::success(['message' => 'Subject deleted successfully']);
        } else {
            Response::serverError('Failed to delete subject');
        }
    }

    public function getCoreSubjects(array $user): void
    {
        $subjects = $this->repo->getCoreSubjects();
        Response::success($subjects);
    }
}
