<?php

namespace App\Controllers;

use App\Utils\Response;
use App\Utils\Validator;
use App\Repositories\ParentStudentRepository;
use App\Repositories\ParentRepository;
use App\Repositories\StudentRepository;
use App\Middleware\RoleMiddleware;

class ParentStudentController
{
    private ParentStudentRepository $parentStudentRepo;
    private ParentRepository $parentRepo;
    private StudentRepository $studentRepo;

    public function __construct()
    {
        $this->parentStudentRepo = new ParentStudentRepository();
        $this->parentRepo = new ParentRepository();
        $this->studentRepo = new StudentRepository();
    }

    public function getParentStudents(array $user, int $parentId): void
    {
        $parent = $this->parentRepo->findById($parentId);

        if (!$parent) {
            Response::notFound('Parent not found');
            return;
        }

        $students = $this->parentStudentRepo->getParentStudents($parentId);
        Response::success($students);
    }

    public function getStudentParents(array $user, int $studentId): void
    {
        $student = $this->studentRepo->findById($studentId);

        if (!$student) {
            Response::notFound('Student not found');
            return;
        }

        $parents = $this->parentStudentRepo->getStudentParents($studentId);
        Response::success($parents);
    }

    public function show(array $user, int $id): void
    {
        $parentStudent = $this->parentStudentRepo->findById($id);

        if (!$parentStudent) {
            Response::notFound('Parent-Student relationship not found');
            return;
        }

        Response::success($parentStudent);
    }

    public function create(array $user): void
    {
        $roleMiddleware = new RoleMiddleware($user);

        if (!$roleMiddleware->requireRole('admin')) {
            return;
        }

        $data = json_decode(file_get_contents('php://input'), true);

        $validator = new Validator($data);
        $validator->required(['parent_id', 'student_id'])
            ->numeric('parent_id')
            ->numeric('student_id');

        if (isset($data['relationship_type'])) {
            $validator->maxLength('relationship_type', 50);
        }
        if (isset($data['is_primary_contact'])) {
            $validator->numeric('is_primary_contact');
        }
        if (isset($data['can_pickup'])) {
            $validator->numeric('can_pickup');
        }

        if ($validator->fails()) {
            Response::validationError($validator->getErrors());
            return;
        }

        // Check if parent exists
        $parent = $this->parentRepo->findById($data['parent_id']);
        if (!$parent) {
            Response::notFound('Parent not found');
            return;
        }

        // Check if student exists
        $student = $this->studentRepo->findById($data['student_id']);
        if (!$student) {
            Response::notFound('Student not found');
            return;
        }

        // Check if relationship already exists
        if ($this->parentStudentRepo->relationshipExists($data['parent_id'], $data['student_id'])) {
            Response::validationError(['message' => 'This parent-student relationship already exists']);
            return;
        }

        $relationshipId = $this->parentStudentRepo->create($data);

        if ($relationshipId) {
            Response::success([
                'message' => 'Parent-Student relationship created successfully',
                'parent_student_id' => $relationshipId
            ], 201);
        } else {
            Response::serverError('Failed to create relationship');
        }
    }

    public function update(array $user, int $id): void
    {
        $roleMiddleware = new RoleMiddleware($user);

        if (!$roleMiddleware->requireRole('admin')) {
            return;
        }

        $parentStudent = $this->parentStudentRepo->findById($id);

        if (!$parentStudent) {
            Response::notFound('Parent-Student relationship not found');
            return;
        }

        $data = json_decode(file_get_contents('php://input'), true);

        $validator = new Validator($data);
        if (isset($data['relationship_type'])) {
            $validator->maxLength('relationship_type', 50);
        }
        if (isset($data['is_primary_contact'])) {
            $validator->numeric('is_primary_contact');
        }
        if (isset($data['can_pickup'])) {
            $validator->numeric('can_pickup');
        }

        if ($validator->fails()) {
            Response::validationError($validator->getErrors());
            return;
        }

        if ($this->parentStudentRepo->update($id, $data)) {
            Response::success(['message' => 'Parent-Student relationship updated successfully']);
        } else {
            Response::serverError('Failed to update relationship');
        }
    }

    public function delete(array $user, int $id): void
    {
        $roleMiddleware = new RoleMiddleware($user);

        if (!$roleMiddleware->requireRole('admin')) {
            return;
        }

        $parentStudent = $this->parentStudentRepo->findById($id);

        if (!$parentStudent) {
            Response::notFound('Parent-Student relationship not found');
            return;
        }

        if ($this->parentStudentRepo->delete($id)) {
            Response::success(['message' => 'Parent-Student relationship deleted successfully']);
        } else {
            Response::serverError('Failed to delete relationship');
        }
    }
}
