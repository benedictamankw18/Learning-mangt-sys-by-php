<?php

require __DIR__ . '/vendor/autoload.php';

use Dotenv\Dotenv;
use App\Repositories\UserRepository;
use App\Utils\JWTHandler;

try {
    $dotenv = Dotenv::createImmutable(__DIR__);
    $dotenv->load();

    echo "Testing Login Flow\n";
    echo "==================\n\n";

    $userRepo = new UserRepository();
    $jwtHandler = new JWTHandler();

    $login = 'admin';
    $password = 'password';

    echo "1. Finding user by username: $login\n";
    $user = $userRepo->findByUsername($login);

    if ($user) {
        echo "   ✓ User found: {$user['username']} ({$user['email']})\n\n";

        echo "2. Verifying password\n";
        if (password_verify($password, $user['password_hash'])) {
            echo "   ✓ Password verified\n\n";

            echo "3. Checking if user is active\n";
            if ($user['is_active']) {
                echo "   ✓ User is active\n\n";

                echo "4. Generating JWT tokens\n";
                $accessToken = $jwtHandler->generateAccessToken($user['user_id'], $user['email']);
                $refreshToken = $jwtHandler->generateRefreshToken($user['user_id']);
                echo "   ✓ Access token: " . substr($accessToken, 0, 50) . "...\n";
                echo "   ✓ Refresh token: " . substr($refreshToken, 0, 50) . "...\n\n";

                echo "5. Logging activity\n";
                $result = $userRepo->logActivity($user['user_id'], 'login', ['ip' => '127.0.0.1']);
                echo "   " . ($result ? "✓" : "✗") . " Activity logged\n\n";

                echo "SUCCESS: Login flow completed!\n";
            } else {
                echo "   ✗ User is inactive\n";
            }
        } else {
            echo "   ✗ Password verification failed\n";
        }
    } else {
        echo "   ✗ User not found\n";
    }

} catch (Exception $e) {
    echo "\nERROR: " . $e->getMessage() . "\n";
    echo "File: " . $e->getFile() . ":" . $e->getLine() . "\n";
    echo "\nTrace:\n" . $e->getTraceAsString() . "\n";
}
