<?php

namespace App\Controllers;

use App\Utils\Response;
use App\Utils\Validator;
use App\Repositories\TeacherSubjectRepository;
use App\Repositories\TeacherRepository;
use App\Repositories\SubjectRepository;
use App\Middleware\RoleMiddleware;

class TeacherSubjectController
{
    private TeacherSubjectRepository $teacherSubjectRepo;
    private TeacherRepository $teacherRepo;
    private SubjectRepository $subjectRepo;

    public function __construct()
    {
        $this->teacherSubjectRepo = new TeacherSubjectRepository();
        $this->teacherRepo = new TeacherRepository();
        $this->subjectRepo = new SubjectRepository();
    }

    public function getTeacherSubjects(array $user, string $teacherId): void
    {
        // Accept both UUID string and numeric teacher_id
        $teacher = is_numeric($teacherId)
            ? $this->teacherRepo->findById((int)$teacherId)
            : $this->teacherRepo->findByUuid($teacherId);

        if (!$teacher) {
            Response::notFound('Teacher not found');
            return;
        }

        $subjects = $this->teacherSubjectRepo->getTeacherSubjects((int)$teacher['teacher_id']);
        Response::success($subjects);
    }

    public function getSubjectTeachers(array $user, string $subjectId): void
    {
        // Accept both UUID string and numeric subject_id
        $subject = is_numeric($subjectId)
            ? $this->subjectRepo->findById((int)$subjectId)
            : $this->subjectRepo->findByUuid($subjectId);

        if (!$subject) {
            Response::notFound('Subject not found');
            return;
        }

        $teachers = $this->teacherSubjectRepo->getSubjectTeachers((int)$subject['subject_id']);
        Response::success($teachers);
    }

    public function show(array $user, int $id): void
    {
        $teacherSubject = $this->teacherSubjectRepo->findById($id);

        if (!$teacherSubject) {
            Response::notFound('Teacher-Subject assignment not found');
            return;
        }

        Response::success($teacherSubject);
    }

    public function create(array $user): void
    {
        $roleMiddleware = new RoleMiddleware($user);

        if (!$roleMiddleware->requireRole('admin')) {
            return;
        }

        $data = json_decode(file_get_contents('php://input'), true);

        $validator = new Validator($data);
        $validator->required(['teacher_id', 'subject_id']);

        if (isset($data['assigned_date'])) {
            $validator->date('assigned_date');
        }

        if ($validator->fails()) {
            Response::validationError($validator->getErrors());
            return;
        }

        // Resolve teacher (UUID or numeric)
        $teacherIdRaw = $data['teacher_id'];
        $teacher = is_numeric($teacherIdRaw)
            ? $this->teacherRepo->findById((int)$teacherIdRaw)
            : $this->teacherRepo->findByUuid((string)$teacherIdRaw);
        if (!$teacher) {
            Response::notFound('Teacher not found');
            return;
        }
        $data['teacher_id'] = (int)$teacher['teacher_id'];

        // Resolve subject (UUID or numeric)
        $subjectIdRaw = $data['subject_id'];
        $subject = is_numeric($subjectIdRaw)
            ? $this->subjectRepo->findById((int)$subjectIdRaw)
            : $this->subjectRepo->findByUuid((string)$subjectIdRaw);
        if (!$subject) {
            Response::notFound('Subject not found');
            return;
        }
        $data['subject_id'] = (int)$subject['subject_id'];

        // Check if assignment already exists
        if ($this->teacherSubjectRepo->assignmentExists($data['teacher_id'], $data['subject_id'])) {
            Response::validationError(['message' => 'This teacher is already assigned to this subject']);
            return;
        }

        $assignmentId = $this->teacherSubjectRepo->create($data);

        if ($assignmentId) {
            Response::success([
                'message' => 'Teacher-Subject assignment created successfully',
                'teacher_subject_id' => $assignmentId
            ], 201);
        } else {
            Response::serverError('Failed to create assignment');
        }
    }

    public function update(array $user, int $id): void
    {
        $roleMiddleware = new RoleMiddleware($user);

        if (!$roleMiddleware->requireRole('admin')) {
            return;
        }

        $teacherSubject = $this->teacherSubjectRepo->findById($id);

        if (!$teacherSubject) {
            Response::notFound('Teacher-Subject assignment not found');
            return;
        }

        $data = json_decode(file_get_contents('php://input'), true);

        $validator = new Validator($data);
        if (isset($data['assigned_date'])) {
            $validator->date('assigned_date');
        }

        if ($validator->fails()) {
            Response::validationError($validator->getErrors());
            return;
        }

        if ($this->teacherSubjectRepo->update($id, $data)) {
            Response::success(['message' => 'Teacher-Subject assignment updated successfully']);
        } else {
            Response::serverError('Failed to update assignment');
        }
    }

    public function delete(array $user, int $id): void
    {
        $roleMiddleware = new RoleMiddleware($user);

        if (!$roleMiddleware->requireRole('admin')) {
            return;
        }

        $teacherSubject = $this->teacherSubjectRepo->findById($id);

        if (!$teacherSubject) {
            Response::notFound('Teacher-Subject assignment not found');
            return;
        }

        if ($this->teacherSubjectRepo->delete($id)) {
            Response::success(['message' => 'Teacher-Subject assignment deleted successfully']);
        } else {
            Response::serverError('Failed to delete assignment');
        }
    }
}
