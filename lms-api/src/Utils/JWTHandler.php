<?php

namespace App\Utils;

use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Exception;

class JWTHandler
{
    private static $config;

    private static function getConfig(): array
    {
        if (self::$config === null) {
            self::$config = require __DIR__ . '/../../config/jwt.php';
        }
        return self::$config;
    }

    public static function generateAccessToken(array $payload): string
    {
        $config = self::getConfig();

        $issuedAt = time();
        $expire = $issuedAt + $config['access_expiry'];

        $token = [
            'iss' => $config['issuer'],
            'aud' => $config['audience'],
            'iat' => $issuedAt,
            'exp' => $expire,
            'data' => $payload
        ];

        return JWT::encode($token, $config['secret'], $config['algorithm']);
    }

    public static function generateRefreshToken(int $userId): string
    {
        $config = self::getConfig();

        $issuedAt = time();
        $expire = $issuedAt + $config['refresh_expiry'];

        $token = [
            'iss' => $config['issuer'],
            'aud' => $config['audience'],
            'iat' => $issuedAt,
            'exp' => $expire,
            'type' => 'refresh',
            'user_id' => $userId
        ];

        return JWT::encode($token, $config['secret'], $config['algorithm']);
    }

    public static function validateToken(string $token): ?object
    {
        try {
            $config = self::getConfig();
            $decoded = JWT::decode($token, new Key($config['secret'], $config['algorithm']));

            if ($decoded->iss !== $config['issuer'] || $decoded->aud !== $config['audience']) {
                return null;
            }

            return $decoded;
        } catch (Exception $e) {
            error_log("JWT Validation Error: " . $e->getMessage());
            return null;
        }
    }

    public static function getBearerToken(): ?string
    {
        $headers = self::getAuthorizationHeader();

        if (!empty($headers)) {
            if (preg_match('/Bearer\s+(.*)$/i', $headers, $matches)) {
                return $matches[1];
            }
        }

        return null;
    }

    private static function getAuthorizationHeader(): ?string
    {
        $headers = null;

        if (isset($_SERVER['Authorization'])) {
            $headers = trim($_SERVER['Authorization']);
        } elseif (isset($_SERVER['HTTP_AUTHORIZATION'])) {
            $headers = trim($_SERVER['HTTP_AUTHORIZATION']);
        } elseif (function_exists('apache_request_headers')) {
            $requestHeaders = apache_request_headers();
            $requestHeaders = array_combine(
                array_map('ucwords', array_keys($requestHeaders)),
                array_values($requestHeaders)
            );

            if (isset($requestHeaders['Authorization'])) {
                $headers = trim($requestHeaders['Authorization']);
            }
        }

        return $headers;
    }

    public static function getUserFromToken(): ?array
    {
        $token = self::getBearerToken();

        if (!$token) {
            return null;
        }

        $decoded = self::validateToken($token);

        if (!$decoded || !isset($decoded->data)) {
            return null;
        }

        return (array) $decoded->data;
    }
}
