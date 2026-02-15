<?php

namespace App\Controllers;

use App\Utils\Response;
use App\Utils\Validator;
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

    public function show(array $user, int $id): void
    {
        $subject = $this->repo->findById($id);

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

    public function update(array $user, int $id): void
    {
        $roleMiddleware = new RoleMiddleware($user);

        if (!$roleMiddleware->requireRole('admin')) {
            return;
        }

        $subject = $this->repo->findById($id);

        if (!$subject) {
            Response::notFound('Subject not found');
            return;
        }

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

        if ($this->repo->update($id, $data)) {
            Response::success(['message' => 'Subject updated successfully']);
        } else {
            Response::serverError('Failed to update subject');
        }
    }

    public function delete(array $user, int $id): void
    {
        $roleMiddleware = new RoleMiddleware($user);

        if (!$roleMiddleware->requireRole('admin')) {
            return;
        }

        $subject = $this->repo->findById($id);

        if (!$subject) {
            Response::notFound('Subject not found');
            return;
        }

        if ($this->repo->delete($id)) {
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
