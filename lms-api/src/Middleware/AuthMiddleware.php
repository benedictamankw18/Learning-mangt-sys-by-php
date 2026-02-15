<?php

namespace App\Middleware;

use App\Utils\JWTHandler;
use App\Utils\Response;
use App\Config\Database;
use PDO;

class AuthMiddleware
{
    private JWTHandler $jwtHandler;
    private PDO $db;

    public function __construct()
    {
        $this->jwtHandler = new JWTHandler();
        $this->db = Database::getInstance()->getConnection();
    }

    public function handle(): ?array
    {
        $token = $this->jwtHandler->getBearerToken();

        if (!$token) {
            Response::unauthorized('Missing authentication token');
            return null;
        }

        $payload = $this->jwtHandler->validateToken($token);

        if (!$payload) {
            Response::unauthorized('Invalid or expired token');
            return null;
        }

        // Extract user ID from payload data
        $userId = $payload->data->user_id ?? null;

        if (!$userId) {
            Response::unauthorized('Invalid token payload');
            return null;
        }

        // Load user from database
        $user = $this->loadUser($userId);

        if (!$user) {
            Response::unauthorized('User not found');
            return null;
        }

        if (!$user['is_active']) {
            Response::forbidden('Account is inactive');
            return null;
        }

        // Log user activity
        $this->logActivity($user['user_id']);

        return $user;
    }

    private function loadUser(int $userId): ?array
    {
        try {
            $stmt = $this->db->prepare("
                SELECT 
                    u.user_id,
                    u.institution_id,
                    u.username,
                    u.email,
                    u.first_name,
                    u.last_name,
                    u.is_active,
                    u.is_super_admin,
                    u.created_at,
                    GROUP_CONCAT(DISTINCT r.role_name) as roles,
                    GROUP_CONCAT(DISTINCT p.permission_name) as permissions
                FROM users u
                LEFT JOIN user_roles ur ON u.user_id = ur.user_id
                LEFT JOIN roles r ON ur.role_id = r.role_id
                LEFT JOIN role_permissions rp ON r.role_id = rp.role_id
                LEFT JOIN permissions p ON rp.permission_id = p.permission_id
                WHERE u.user_id = :user_id
                GROUP BY u.user_id
            ");

            $stmt->execute(['user_id' => $userId]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($user) {
                $user['roles'] = $user['roles'] ? explode(',', $user['roles']) : [];
                $user['permissions'] = $user['permissions'] ? explode(',', $user['permissions']) : [];

                // Add 'role' key for backwards compatibility
                // Priority: super_admin > first role in array
                if ($user['is_super_admin']) {
                    $user['role'] = 'super_admin';
                } elseif (!empty($user['roles'])) {
                    $user['role'] = $user['roles'][0];
                } else {
                    $user['role'] = 'user';
                }
            }

            return $user ?: null;

        } catch (\PDOException $e) {
            error_log("Auth Error: " . $e->getMessage());
            return null;
        }
    }

    private function logActivity(int $userId): void
    {
        try {
            $stmt = $this->db->prepare("
                INSERT INTO user_activity (user_id, activity_type, activity_details, ip_address)
                VALUES (:user_id, 'api_access', :details, :ip)
            ");

            $stmt->execute([
                'user_id' => $userId,
                'details' => json_encode([
                    'endpoint' => $_SERVER['REQUEST_URI'] ?? '',
                    'method' => $_SERVER['REQUEST_METHOD'] ?? ''
                ]),
                'ip' => $_SERVER['REMOTE_ADDR'] ?? ''
            ]);
        } catch (\PDOException $e) {
            error_log("Activity Log Error: " . $e->getMessage());
        }
    }
}
