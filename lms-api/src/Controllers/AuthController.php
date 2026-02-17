<?php

namespace App\Controllers;

use App\Utils\Response;
use App\Utils\Validator;
use App\Utils\JWTHandler;
use App\Repositories\UserRepository;
use App\Repositories\StudentRepository;
use App\Repositories\TeacherRepository;
use App\Repositories\LoginActivityRepository;
use App\Config\Database;

class AuthController
{
    private UserRepository $userRepo;
    private StudentRepository $studentRepo;
    private TeacherRepository $teacherRepo;
    private LoginActivityRepository $loginActivityRepo;
    private JWTHandler $jwtHandler;

    public function __construct()
    {
        $this->userRepo = new UserRepository();
        $this->studentRepo = new StudentRepository();
        $this->teacherRepo = new TeacherRepository();
        $this->loginActivityRepo = new LoginActivityRepository();
        $this->jwtHandler = new JWTHandler();
    }

    public function register(): void
    {
        $data = json_decode(file_get_contents('php://input'), true);

        $validator = new Validator($data);
        $validator->required(['username', 'email', 'password', 'first_name', 'last_name', 'institution_id'])
            ->email('email')
            ->min('password', 8)
            ->min('username', 3);

        if ($validator->fails()) {
            Response::validationError($validator->getErrors());
            return;
        }

        // Check if email exists
        if ($this->userRepo->findByEmail($data['email'])) {
            Response::error('Email already exists', 409);
            return;
        }

        // Check if username exists
        if ($this->userRepo->findByUsername($data['username'])) {
            Response::error('Username already exists', 409);
            return;
        }

        // Determine role (default to student)
        $roleType = strtolower($data['role_type'] ?? 'student');
        $role = $this->userRepo->getRoleByName($roleType);

        if (!$role) {
            Response::error('Invalid role type. Must be: admin, teacher, student, or parent', 400);
            return;
        }

        // Create user
        $userId = $this->userRepo->create($data);

        if (!$userId) {
            Response::serverError('Failed to create user');
            return;
        }

        // Assign role
        $this->userRepo->assignRole($userId, $role['role_id']);

        // Create student or teacher record
        if ($roleType === 'student') {
            $studentIdNumber = 'STU-' . date('Y') . str_pad($userId, 5, '0', STR_PAD_LEFT);
            $this->studentRepo->create($userId, [
                'institution_id' => $data['institution_id'],
                'student_id_number' => $studentIdNumber,
                'enrollment_date' => date('Y-m-d'),
                'class_id' => $data['class_id'] ?? null,
                'gender' => $data['gender'] ?? null,
                'date_of_birth' => $data['date_of_birth'] ?? null
            ]);
        } elseif ($roleType === 'teacher') {
            $employeeId = 'EMP-' . date('Y') . str_pad($userId, 5, '0', STR_PAD_LEFT);
            $this->teacherRepo->create($userId, [
                'institution_id' => $data['institution_id'],
                'employee_id' => $employeeId,
                'department' => $data['department'] ?? null,
                'specialization' => $data['specialization'] ?? null,
                'hire_date' => date('Y-m-d')
            ]);
        }

        $user = $this->userRepo->findById($userId);

        Response::success([
            'user' => $user,
            'message' => 'Registration successful'
        ], 201);
    }

    public function login(): void
    {
        $data = json_decode(file_get_contents('php://input'), true);

        $validator = new Validator($data);
        $validator->required(['login', 'password']);

        if ($validator->fails()) {
            Response::validationError($validator->getErrors());
            return;
        }

        // Login can be email or username
        $user = filter_var($data['login'], FILTER_VALIDATE_EMAIL)
            ? $this->userRepo->findByEmail($data['login'])
            : $this->userRepo->findByUsername($data['login']);

        if (!$user || !password_verify($data['password'], $user['password_hash'])) {
            // Log failed login attempt
            $this->loginActivityRepo->create([
                'user_id' => $user['user_id'] ?? null,
                'login_time' => date('Y-m-d H:i:s'),
                'ip_address' => $_SERVER['REMOTE_ADDR'] ?? null,
                'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? null,
                'is_successful' => 0,
                'failure_reason' => 'Invalid credentials'
            ]);
            Response::unauthorized('Invalid credentials');
            return;
        }

        if (!$user['is_active']) {
            // Log failed login attempt (inactive account)
            $this->loginActivityRepo->create([
                'user_id' => $user['user_id'],
                'login_time' => date('Y-m-d H:i:s'),
                'ip_address' => $_SERVER['REMOTE_ADDR'] ?? null,
                'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? null,
                'is_successful' => 0,
                'failure_reason' => 'Account is inactive'
            ]);
            Response::forbidden('Account is inactive');
            return;
        }

        // Generate tokens
        $accessToken = $this->jwtHandler->generateAccessToken([
            'user_id' => $user['user_id'],
            'email' => $user['email'],
            'username' => $user['username']
        ]);
        $refreshToken = $this->jwtHandler->generateRefreshToken($user['user_id']);

        // Log successful login activity
        $this->loginActivityRepo->create([
            'user_id' => $user['user_id'],
            'login_time' => date('Y-m-d H:i:s'),
            'ip_address' => $_SERVER['REMOTE_ADDR'] ?? null,
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? null,
            'is_successful' => 1,
            'failure_reason' => null
        ]);

        // Log login activity (legacy)
        $this->userRepo->logActivity($user['user_id'], 'login', [
            'ip' => $_SERVER['REMOTE_ADDR'] ?? ''
        ]);

        // Fetch complete user data with roles
        $completeUser = $this->userRepo->findById($user['user_id']);

        // Extract primary role (first role in array)
        $completeUser['role'] = !empty($completeUser['roles']) ? $completeUser['roles'][0] : null;

        Response::success([
            'user' => $completeUser,
            'access_token' => $accessToken,
            'refresh_token' => $refreshToken,
            'token_type' => 'Bearer'
        ]);
    }

    public function me(array $user): void
    {
        unset($user['password_hash']);
        Response::success($user);
    }

    public function logout(array $user): void
    {
        // Update logout time in login_activity table
        $this->loginActivityRepo->logLogout($user['user_id']);

        // Log logout activity (legacy)
        $this->userRepo->logActivity($user['user_id'], 'logout', [
            'ip' => $_SERVER['REMOTE_ADDR'] ?? ''
        ]);

        Response::success(['message' => 'Logged out successfully']);
    }

    public function refresh(): void
    {
        $data = json_decode(file_get_contents('php://input'), true);

        if (!isset($data['refresh_token'])) {
            Response::error('Refresh token required', 400);
            return;
        }

        $payload = $this->jwtHandler->validateToken($data['refresh_token']);

        if (!$payload) {
            Response::unauthorized('Invalid refresh token');
            return;
        }

        $user = $this->userRepo->findById($payload->user_id);

        if (!$user || !$user['is_active']) {
            Response::unauthorized('User not found or inactive');
            return;
        }

        $accessToken = $this->jwtHandler->generateAccessToken([
            'user_id' => $user['user_id'],
            'email' => $user['email'],
            'username' => $user['username']
        ]);

        Response::success([
            'access_token' => $accessToken,
            'token_type' => 'Bearer'
        ]);
    }

    public function forgotPassword(): void
    {
        $data = json_decode(file_get_contents('php://input'), true);

        $validator = new Validator($data);
        $validator->required(['email'])->email('email');

        if ($validator->fails()) {
            Response::validationError($validator->getErrors());
            return;
        }

        $user = $this->userRepo->findByEmail($data['email']);

        // If user exists and is active, create reset token
        if ($user && $user['is_active']) {
            $token = $this->userRepo->createPasswordResetToken($user['user_id'], 60); // 60 minutes expiry

            if ($token) {
                // TODO: Send email with reset link containing the token
                // Example reset link: https://yourdomain.com/reset-password?token={$token}
                // For now, we'll return the token in the response (remove in production)

                // Log the password reset request
                $this->userRepo->logActivity($user['user_id'], 'password_reset_requested', [
                    'ip' => $_SERVER['REMOTE_ADDR'] ?? '',
                    'email' => $data['email']
                ]);

                // In development, return the token. In production, just return success message
                if (getenv('APP_ENV') === 'development' || getenv('APP_ENV') === 'local') {
                    Response::success([
                        'message' => 'Password reset token generated successfully',
                        'token' => $token,
                        'expires_in' => '60 minutes',
                        'reset_url' => getenv('APP_URL') . '/reset-password?token=' . $token
                    ]);
                    return;
                }
            }
        }

        // Always return success for security (don't reveal if email exists)
        Response::success([
            'message' => 'If your email exists in our system, you will receive a password reset link shortly'
        ]);
    }

    public function resetPassword(): void
    {
        $data = json_decode(file_get_contents('php://input'), true);

        $validator = new Validator($data);
        $validator->required(['token', 'password'])->min('password', 8);

        if ($validator->fails()) {
            Response::validationError($validator->getErrors());
            return;
        }

        // Validate the token
        $tokenData = $this->userRepo->validatePasswordResetToken($data['token']);

        if (!$tokenData) {
            Response::error('Invalid or expired reset token', 400);
            return;
        }

        // Update the password
        if ($this->userRepo->updatePassword($tokenData['user_id'], $data['password'])) {
            // Mark token as used
            $this->userRepo->markTokenAsUsed($data['token']);

            // Log password reset
            $this->userRepo->logActivity($tokenData['user_id'], 'password_reset_completed', [
                'ip' => $_SERVER['REMOTE_ADDR'] ?? ''
            ]);

            Response::success(['message' => 'Password reset successful. You can now login with your new password']);
        } else {
            Response::serverError('Failed to reset password');
        }
    }

    public function changePassword(array $user): void
    {
        $data = json_decode(file_get_contents('php://input'), true);

        $validator = new Validator($data);
        $validator->required(['current_password', 'new_password'])->min('new_password', 8);

        if ($validator->fails()) {
            Response::validationError($validator->getErrors());
            return;
        }

        $passwordHash = $this->userRepo->getPasswordHash($user['user_id']);

        if (!$passwordHash || !password_verify($data['current_password'], $passwordHash)) {
            Response::error('Current password is incorrect', 400);
            return;
        }

        if ($this->userRepo->updatePassword($user['user_id'], $data['new_password'])) {
            Response::success(['message' => 'Password changed successfully']);
        } else {
            Response::serverError('Failed to change password');
        }
    }
}
