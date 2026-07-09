<?php

namespace App\Controllers;

use App\Utils\Response;
use App\Utils\Validator;
use App\Middleware\RoleMiddleware;
use App\Repositories\SystemSettingsRepository;

class SystemController
{
    private SystemSettingsRepository $repo;

    public function __construct()
    {
        $this->repo = new SystemSettingsRepository();
    }

    public function getSettings(array $user): void
    {
        $roleMiddleware = new RoleMiddleware($user);
        if (!$roleMiddleware->isAdmin() && empty($user['is_super_admin'])) {
            Response::forbidden('Only admins or super admins can view system settings');
            return;
        }

        $data = $this->repo->getSettings();
        Response::success($data);
    }

    public function updateSettings(array $user): void
    {
        $roleMiddleware = new RoleMiddleware($user);
        if (!$roleMiddleware->isAdmin() && empty($user['is_super_admin'])) {
            Response::forbidden('Only admins or super admins can update system settings');
            return;
        }

        $input = json_decode(file_get_contents('php://input'), true) ?: [];

        // Validate known keys if present
        $errors = [];
        if (isset($input['site_name'])) {
            $v = new Validator(['site_name' => $input['site_name']]);
            $v->required(['site_name']);
            if ($v->fails())
                $errors = array_merge($errors, $v->getErrors());
        }
        if (isset($input['from_address'])) {
            $v = new Validator(['from_address' => $input['from_address']]);
            $v->required(['from_address'])->email('from_address');
            if ($v->fails())
                $errors = array_merge($errors, $v->getErrors());
        }
        if (isset($input['smtp_port'])) {
            $v = new Validator(['smtp_port' => $input['smtp_port']]);
            $v->required(['smtp_port'])->numeric('smtp_port');
            if ($v->fails())
                $errors = array_merge($errors, $v->getErrors());
        }

        if (!empty($errors)) {
            Response::validationError($errors);
            return;
        }

        $existing = $this->repo->getSettings();
        $merged = array_replace_recursive($existing ?: [], $input);

        if (!$this->repo->saveSettings($merged)) {
            Response::serverError('Failed to save settings');
            return;
        }

        Response::success($merged, 200, 'Settings saved');
    }
}
