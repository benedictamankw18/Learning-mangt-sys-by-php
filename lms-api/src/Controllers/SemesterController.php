<?php

namespace App\Controllers;

use App\Utils\Response;
use App\Utils\Validator;
use App\Repositories\SemesterRepository;
use App\Repositories\AcademicYearRepository;
use App\Middleware\RoleMiddleware;

class SemesterController
{
    private SemesterRepository $repo;
    private AcademicYearRepository $academicYearRepo;

    public function __construct()
    {
        $this->repo = new SemesterRepository();
        $this->academicYearRepo = new AcademicYearRepository();
    }

    public function index(array $user): void
    {
        $page = isset($_GET['page']) ? (int) $_GET['page'] : 1;
        $limit = isset($_GET['limit']) ? (int) $_GET['limit'] : 20;
        $academicYearId = isset($_GET['academic_year_id']) ? (int) $_GET['academic_year_id'] : null;

        $semesters = $this->repo->getAll($page, $limit, $academicYearId);
        $total = $this->repo->count($academicYearId);

        Response::success([
            'data' => $semesters,
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
        $semester = $this->repo->findById($id);

        if (!$semester) {
            Response::notFound('Semester not found');
            return;
        }

        Response::success($semester);
    }

    public function create(array $user): void
    {
        $roleMiddleware = new RoleMiddleware($user);

        if (!$roleMiddleware->requireRole('admin')) {
            return;
        }

        $data = json_decode((string) file_get_contents('php://input'), true);
        if (!is_array($data)) {
            Response::error('Invalid JSON payload', 400);
            return;
        }

        $validator = new Validator($data);
        $validator->required(['academic_year_id', 'semester_name', 'start_date', 'end_date'])
            ->numeric('academic_year_id')
            ->maxLength('semester_name', 20)
            ->date('start_date')
            ->date('end_date');

        if ($validator->fails()) {
            Response::validationError($validator->getErrors());
            return;
        }

        $startDate = (string) $data['start_date'];
        $endDate = (string) $data['end_date'];
        if ($startDate >= $endDate) {
            Response::error('end_date must be after start_date', 422);
            return;
        }

        // Add institution_id for multi-tenant support
        if ($user['role'] !== 'super_admin') {
            $data['institution_id'] = (int) ($user['institution_id'] ?? 0);
            if ($data['institution_id'] <= 0) {
                Response::error('Missing institution context', 400);
                return;
            }
        } elseif (empty($data['institution_id'])) {
            Response::error('institution_id is required for super admin', 400);
            return;
        }

        $institutionId = (int) $data['institution_id'];
        $academicYearId = (int) $data['academic_year_id'];
        $semesterName = trim((string) $data['semester_name']);
        if (!$this->repo->academicYearBelongsToInstitution($academicYearId, $institutionId)) {
            Response::error('Selected academic year is invalid for this institution', 422);
            return;
        }

        $isCurrent = !empty($data['is_current']) ? 1 : 0;
        if ($isCurrent === 1) {
            $currentAcademicYear = $this->academicYearRepo->getCurrent($institutionId);
            if (!$currentAcademicYear) {
                Response::error('No current academic year is set for this institution', 422);
                return;
            }

            $currentAcademicYearId = (int) ($currentAcademicYear['academic_year_id'] ?? 0);
            if ($academicYearId !== $currentAcademicYearId) {
                Response::error('Current semester must belong to the current academic year', 422);
                return;
            }
        }

        if ($this->repo->existsBySemesterName($semesterName, $academicYearId, $institutionId)) {
            Response::error('Semester already exists for this academic year', 409);
            return;
        }

        $semesterId = $this->repo->create($data);

        if ($semesterId !== null) {
            Response::success([
                'message' => 'Semester created successfully',
                'semester_id' => $semesterId
            ], 201);
        } else {
            Response::serverError('Failed to create semester');
        }
    }

    public function update(array $user, int $id): void
    {
        $roleMiddleware = new RoleMiddleware($user);

        if (!$roleMiddleware->requireRole('admin')) {
            return;
        }

        $semester = $this->repo->findById($id);

        if (!$semester) {
            Response::notFound('Semester not found');
            return;
        }

        $data = json_decode((string) file_get_contents('php://input'), true);
        if (!is_array($data)) {
            Response::error('Invalid JSON payload', 400);
            return;
        }

        if (array_key_exists('is_current', $data)) {
            $requestedIsCurrent = !empty($data['is_current']) ? 1 : 0;
            $existingIsCurrent = ((int) ($semester['is_current'] ?? 0)) === 1;

            if ($existingIsCurrent && $requestedIsCurrent === 0) {
                Response::error('Cannot unset current semester directly. Set another semester as current instead.', 422);
                return;
            }
        }

        $validator = new Validator($data);
        if (isset($data['academic_year_id'])) {
            $validator->numeric('academic_year_id');
        }
        if (isset($data['semester_name'])) {
            $validator->maxLength('semester_name', 20);
        }
        if (isset($data['start_date'])) {
            $validator->date('start_date');
        }
        if (isset($data['end_date'])) {
            $validator->date('end_date');
        }

        if ($validator->fails()) {
            Response::validationError($validator->getErrors());
            return;
        }

        $startDate = isset($data['start_date'])
            ? (string) $data['start_date']
            : (string) ($semester['start_date'] ?? '');
        $endDate = isset($data['end_date'])
            ? (string) $data['end_date']
            : (string) ($semester['end_date'] ?? '');

        if ($startDate !== '' && $endDate !== '' && $startDate >= $endDate) {
            Response::error('end_date must be after start_date', 422);
            return;
        }

        $targetInstitutionId = ($user['role'] ?? '') !== 'super_admin'
            ? (int) ($semester['institution_id'] ?? 0)
            : (int) ($data['institution_id'] ?? ($semester['institution_id'] ?? 0));

        if (isset($data['academic_year_id']) && $targetInstitutionId > 0) {
            $academicYearId = (int) $data['academic_year_id'];
            if (!$this->repo->academicYearBelongsToInstitution($academicYearId, $targetInstitutionId)) {
                Response::error('Selected academic year is invalid for this institution', 422);
                return;
            }
        }

        $targetAcademicYearId = isset($data['academic_year_id'])
            ? (int) $data['academic_year_id']
            : (int) ($semester['academic_year_id'] ?? 0);

        $targetIsCurrent = array_key_exists('is_current', $data)
            ? (!empty($data['is_current']) ? 1 : 0)
            : null;

        if ($targetIsCurrent === 1 && $targetInstitutionId > 0) {
            $currentAcademicYear = $this->academicYearRepo->getCurrent($targetInstitutionId);
            if (!$currentAcademicYear) {
                Response::error('No current academic year is set for this institution', 422);
                return;
            }

            $currentAcademicYearId = (int) ($currentAcademicYear['academic_year_id'] ?? 0);
            if ($targetAcademicYearId !== $currentAcademicYearId) {
                Response::error('Current semester must belong to the current academic year', 422);
                return;
            }
        }

        $targetSemesterName = isset($data['semester_name'])
            ? trim((string) $data['semester_name'])
            : (string) ($semester['semester_name'] ?? '');

        if ($targetInstitutionId > 0 && $targetAcademicYearId > 0 && $targetSemesterName !== '') {
            if ($this->repo->existsBySemesterName($targetSemesterName, $targetAcademicYearId, $targetInstitutionId, $id)) {
                Response::error('Semester already exists for this academic year', 409);
                return;
            }
        }

        if ($this->repo->update($id, $data)) {
            Response::success(['message' => 'Semester updated successfully']);
        } else {
            Response::serverError('Failed to update semester');
        }
    }

    public function delete(array $user, int $id): void
    {
        $roleMiddleware = new RoleMiddleware($user);

        if (!$roleMiddleware->requireRole('admin')) {
            return;
        }

        $semester = $this->repo->findById($id);

        if (!$semester) {
            Response::notFound('Semester not found');
            return;
        }

        if ($semester['is_current'] == 1 || $semester['is_current'] === '1') {
            Response::error('Cannot delete current semester. Please set another semester as current first.', 409);
            return;
        }

        if ($this->repo->delete($id)) {
            Response::success(['message' => 'Semester deleted successfully']);
        } else {
            Response::serverError('Failed to delete semester');
        }
    }

    public function getCurrent(array $user): void
    {
        $institutionId = ($user['role'] ?? '') !== 'super_admin' ? (int) ($user['institution_id'] ?? 0) : null;
        $semester = $this->repo->getCurrent($institutionId);

        if (!$semester) {
            Response::notFound('No current semester set');
            return;
        }

        Response::success($semester);
    }
}
