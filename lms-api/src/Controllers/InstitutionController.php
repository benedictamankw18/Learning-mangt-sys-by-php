<?php

namespace App\Controllers;

use App\Utils\Response;
use App\Utils\Validator;
use App\Repositories\InstitutionRepository;
use App\Middleware\RoleMiddleware;

class InstitutionController
{
    private InstitutionRepository $repo;

    public function __construct()
    {
        $this->repo = new InstitutionRepository();
    }

    /**
     * Get all institutions (Super Admin only)
     */
    public function index(array $user): void
    {
        $roleMiddleware = new RoleMiddleware($user);

        if (!$roleMiddleware->requireRole('super_admin')) {
            return;
        }

        $page = isset($_GET['page']) ? (int) $_GET['page'] : 1;
        $limit = isset($_GET['limit']) ? (int) $_GET['limit'] : 20;

        // Allow caller to request all institutions (bypass the 'with admins' filter)
        $page = isset($_GET['page']) ? (int) $_GET['page'] : 1;
        $perPage = isset($_GET['per_page']) ? (int) $_GET['per_page'] : 10;
        $limit = isset($_GET['limit']) ? (int) $_GET['limit'] : $perPage;
        $includeAll = isset($_GET['include_all']) && $_GET['include_all'] == '1';

        // Collect filter params
        $filters = [];
        if (!empty($_GET['q']))
            $filters['q'] = trim($_GET['q']);
        if (!empty($_GET['status']))
            $filters['status'] = $_GET['status'];
        if (!empty($_GET['type']))
            $filters['type'] = $_GET['type'];
        if (isset($_GET['has_admin']))
            $filters['has_admin'] = $_GET['has_admin'];

        // If include_all is not set, default behavior historically returned only institutions with admins.
        // Respect include_all; otherwise allow caller to filter by has_admin explicitly.
        if ($includeAll) {
            $institutions = $this->repo->getAll($page, $limit, $filters);
            $total = $this->repo->countFiltered($filters);
        } else {
            // If includeAll not set but caller didn't specify has_admin, default to only institutions with admins
            if (!isset($filters['has_admin'])) {
                $filters['has_admin'] = 'yes';
            }
            $institutions = $this->repo->getAll($page, $limit, $filters);
            $total = $this->repo->countFiltered($filters);
            // if ($includeAll) {
            //     // Return full list (paginated)
            //     $institutions = $this->repo->getAll($page, $limit);
            //     $total = $this->repo->count();
            // } else {
            //     // Default: Only return institutions that have at least one admin user
            //     $institutions = $this->repo->getAllWithAdmins($page, $limit);
            //     $total = $this->repo->countWithAdmins();
        }

        Response::success([
            'data' => $institutions,
            'pagination' => [
                'current_page' => $page,
                'per_page' => $limit,
                'total' => $total,
                'total_pages' => ceil($total / $limit)
            ]
        ]);
    }

    /**
     * Get a single institution by ID
     */
    public function show(array $user, int $id): void
    {
        $roleMiddleware = new RoleMiddleware($user);
        // Super admin may view any institution; regular admin limited to their own
        if ($user['role'] !== 'super_admin') {
            if (!$roleMiddleware->requireRole('admin')) {
                return;
            }

            if ($id != $user['institution_id']) {
                Response::forbidden('You can only view your own institution');
                return;
            }
        }

        $institution = $this->repo->findById($id);

        if (!$institution) {
            Response::notFound('Institution not found');
            return;
        }

        Response::success($institution);
    }

    /**
     * Create a new institution (Super Admin only)
     */
    public function create(array $user): void
    {
        $roleMiddleware = new RoleMiddleware($user);

        if (!$roleMiddleware->requireRole('super_admin')) {
            return;
        }

        $data = json_decode(file_get_contents('php://input'), true);

        $validator = new Validator($data);
        $validator->required(['institution_code', 'institution_name', 'institution_type'])
            ->maxLength('institution_code', 20)
            ->maxLength('institution_name', 200)
            ->maxLength('institution_type', 50);

        if (isset($data['email'])) {
            $validator->email('email');
        }

        if ($validator->fails()) {
            Response::validationError($validator->getErrors());
            return;
        }

        $institutionId = $this->repo->create($data);

        if ($institutionId) {
            Response::success([
                'message' => 'Institution created successfully',
                'institution_id' => $institutionId
            ], 201);
        } else {
            Response::serverError('Failed to create institution');
        }
    }

    /**
     * Update an existing institution
     */
    public function update(array $user, int $id): void
    {
        $roleMiddleware = new RoleMiddleware($user);

        // Super admin can update any institution
        // Regular admin can only update their own institution
        if ($user['role'] !== 'super_admin') {
            if (!$roleMiddleware->requireRole('admin')) {
                return;
            }

            if ($id != $user['institution_id']) {
                Response::forbidden('You can only update your own institution');
                return;
            }
        }

        $institution = $this->repo->findById($id);

        if (!$institution) {
            Response::notFound('Institution not found');
            return;
        }

        $data = json_decode(file_get_contents('php://input'), true);

        $validator = new Validator($data);
        if (isset($data['institution_code'])) {
            $validator->maxLength('institution_code', 20);
        }
        if (isset($data['institution_name'])) {
            $validator->maxLength('institution_name', 200);
        }
        if (isset($data['email'])) {
            $validator->email('email');
        }

        if ($validator->fails()) {
            Response::validationError($validator->getErrors());
            return;
        }

        $success = $this->repo->update($id, $data);

        if ($success) {
            Response::success(['message' => 'Institution updated successfully']);
        } else {
            Response::serverError('Failed to update institution');
        }
    }

    /**
     * Delete an institution (Super Admin only)
     */
    public function delete(array $user, int $id): void
    {
        $roleMiddleware = new RoleMiddleware($user);

        if (!$roleMiddleware->requireRole('super_admin')) {
            return;
        }

        $institution = $this->repo->findById($id);

        if (!$institution) {
            Response::notFound('Institution not found');
            return;
        }

        $success = $this->repo->delete($id);

        if ($success) {
            Response::success(['message' => 'Institution deleted successfully']);
        } else {
            Response::serverError('Failed to delete institution');
        }
    }

    /**
     * Get statistics for an institution (Super Admin only)
     */
    public function getStatistics(array $user, int $id): void
    {
        // Super admin may view statistics for any institution; regular admin limited to their own
        if ($user['role'] !== 'super_admin') {
            $roleMiddleware = new RoleMiddleware($user);
            if (!$roleMiddleware->requireRole('admin')) {
                return;
            }

            if ($id != $user['institution_id']) {
                Response::forbidden('You can only view your own institution statistics');
                return;
            }
        }

        $institution = $this->repo->findById($id);

        if (!$institution) {
            Response::notFound('Institution not found');
            return;
        }

        $stats = $this->repo->getStatistics($id);

        Response::success($stats);
    }

    /**
     * Get users for an institution
     */
    public function getUsers(array $user, int $id): void
    {
        $roleMiddleware = new RoleMiddleware($user);
        // Super admin may view users for any institution; regular admin limited to their own
        if ($user['role'] !== 'super_admin') {
            // Regular admin can only view their own institution's users
            if (!$roleMiddleware->requireRole('admin')) {
                return;
            }

            if ($id != $user['institution_id']) {
                Response::forbidden('You can only view your own institution users');
                return;
            }
        }

        $institution = $this->repo->findById($id);

        if (!$institution) {
            Response::notFound('Institution not found');
            return;
        }

        $page = isset($_GET['page']) ? (int) $_GET['page'] : 1;
        $limit = isset($_GET['limit']) ? (int) $_GET['limit'] : 20;

        $users = $this->repo->getInstitutionUsers($id, $page, $limit);
        $total = $this->repo->countInstitutionUsers($id);

        Response::success([
            'data' => $users,
            'pagination' => [
                'current_page' => $page,
                'per_page' => $limit,
                'total' => $total,
                'total_pages' => ceil($total / $limit)
            ]
        ]);
    }

    /**
     * Get programs for an institution
     */
    public function getPrograms(array $user, int $id): void
    {
        $institution = $this->repo->findById($id);

        if (!$institution) {
            Response::notFound('Institution not found');
            return;
        }

        // Check authorization: super_admin may access any, others only their own
        if ($user['role'] !== 'super_admin' && $id != $user['institution_id']) {
            Response::forbidden('You do not have access to this institution');
            return;
        }

        $programs = $this->repo->getInstitutionPrograms($id);

        Response::success(['data' => $programs]);
    }

    /**
     * Get classes for an institution
     */
    public function getClasses(array $user, int $id): void
    {
        $institution = $this->repo->findById($id);

        if (!$institution) {
            Response::notFound('Institution not found');
            return;
        }

        // Check authorization: super_admin may access any, others only their own
        if ($user['role'] !== 'super_admin' && $id != $user['institution_id']) {
            Response::forbidden('You do not have access to this institution');
            return;
        }

        $page = isset($_GET['page']) ? (int) $_GET['page'] : 1;
        $limit = isset($_GET['limit']) ? (int) $_GET['limit'] : 20;

        $classes = $this->repo->getInstitutionClasses($id, $page, $limit);
        $total = $this->repo->countInstitutionClasses($id);

        Response::success([
            'data' => $classes,
            'pagination' => [
                'current_page' => $page,
                'per_page' => $limit,
                'total' => $total,
                'total_pages' => ceil($total / $limit)
            ]
        ]);
    }

    /**
     * Update institution status (Super Admin only)
     */
    public function updateStatus(array $user, int $id): void
    {
        $roleMiddleware = new RoleMiddleware($user);

        if (!$roleMiddleware->requireRole('super_admin')) {
            return;
        }

        $institution = $this->repo->findById($id);

        if (!$institution) {
            Response::notFound('Institution not found');
            return;
        }

        $data = json_decode(file_get_contents('php://input'), true);

        $validator = new Validator($data);
        $validator->required(['status'])->in('status', ['active', 'inactive', 'suspended']);

        if ($validator->fails()) {
            Response::validationError($validator->getErrors());
            return;
        }

        $success = $this->repo->updateStatus($id, $data['status']);

        if ($success) {
            Response::success(['message' => 'Institution status updated successfully']);
        } else {
            Response::serverError('Failed to update institution status');
        }
    }

    /**
     * Get institution settings
     * GET /institutions/{id}/settings
     */
    public function getSettings(array $user, int $id): void
    {
        // Check if institution exists
        $institution = $this->repo->findById($id);

        if (!$institution) {
            Response::notFound('Institution not found');
            return;
        }

        // Authorization: super_admin may view only institutions that have admin users; admin can view own institution only
        if ($user['role'] === 'super_admin') {
            if (!$this->repo->hasAdminUsers($id)) {
                Response::forbidden('You do not have access to this institution\'s settings');
                return;
            }
        } elseif ($institution['institution_id'] != $user['institution_id']) {
            Response::forbidden('You do not have access to this institution\'s settings');
            return;
        }

        $settings = $this->repo->getSettings($id);

        if ($settings) {
            Response::success(['data' => $settings]);
        } else {
            Response::notFound('Settings not found for this institution');
        }
    }

    /**
     * Update institution settings
     * PUT /institutions/{id}/settings
     */
    public function updateSettings(array $user, int $id): void
    {
        // Check if institution exists
        $institution = $this->repo->findById($id);

        if (!$institution) {
            Response::notFound('Institution not found');
            return;
        }

        // Authorization: super_admin may update only institutions that have admin users, admin can update own institution only
        if ($user['role'] === 'super_admin') {
            if (!$this->repo->hasAdminUsers($id)) {
                Response::forbidden('You do not have access to update this institution\'s settings');
                return;
            }
        } elseif ($institution['institution_id'] != $user['institution_id']) {
            Response::forbidden('You do not have access to update this institution\'s settings');
            return;
        }

        $data = json_decode(file_get_contents('php://input'), true);

        $validator = new Validator($data);
        $validator->max('school_name', 200)
            ->max('motto', 300)
            ->max('logo_url', 500)
            ->max('banner_url', 500)
            ->max('theme_primary_color', 20)
            ->max('theme_secondary_color', 20)
            ->max('timezone', 50)
            ->numeric('academic_year_start_month')
            ->numeric('academic_year_end_month')
            ->in('grading_system', ['percentage', 'gpa', 'letter'])
            ->max('locale', 10)
            ->max('currency', 10)
            ->max('date_format', 20)
            ->max('time_format', 20)
            ->max('social_facebook', 200)
            ->max('social_twitter', 200)
            ->max('social_instagram', 200)
            ->max('social_linkedin', 200);

        if ($validator->fails()) {
            Response::validationError($validator->getErrors());
            return;
        }

        $success = $this->repo->updateSettings($id, $data);

        if ($success) {
            Response::success(['message' => 'Institution settings updated successfully']);
        } else {
            Response::serverError('Failed to update institution settings');
        }
    }
}
