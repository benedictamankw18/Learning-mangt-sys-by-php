<?php

require_once __DIR__ . '/../vendor/autoload.php';

use Dotenv\Dotenv;
use App\Middleware\AuthMiddleware;
use App\Utils\Response;

// Load environment variables
$dotenv = Dotenv::createImmutable(__DIR__ . '/../');
$dotenv->load();

// Load CORS configuration
require_once __DIR__ . '/../config/cors.php';

// Error handling
error_reporting(E_ALL);
ini_set('display_errors', $_ENV['APP_ENV'] === 'development' ? '1' : '0');

// Set JSON content type
header('Content-Type: application/json');

// Error handler for uncaught exceptions
set_exception_handler(function ($exception) {
    error_log("Uncaught Exception: " . $exception->getMessage());
    Response::serverError('An unexpected error occurred');
});

// Get request method and URI
$method = $_SERVER['REQUEST_METHOD'];
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// Remove /api prefix if present
$uri = preg_replace('#^/api#', '', $uri);

// Remove trailing slash
$uri = rtrim($uri, '/');

// If empty, default to root
if ($uri === '') {
    $uri = '/';
}

// Auto-trigger report scheduler in background (cross-platform fallback)
maybeAutoTriggerReportScheduler($method, $uri);

// Load routes
$routes = require_once __DIR__ . '/../src/Routes/api.php';

// Find matching route
$matchedRoute = null;
$params = [];

foreach ($routes as $route => $config) {
    list($routeMethod, $routePath) = explode(' ', $route, 2);

    if ($routeMethod !== $method) {
        continue;
    }

    // Convert route pattern to regex
    $pattern = preg_replace('/\{([a-zA-Z0-9_]+)\}/', '(?P<$1>[^/]+)', $routePath);
    $pattern = '#^' . $pattern . '$#';

    if (preg_match($pattern, $uri, $matches)) {
        $matchedRoute = $config;

        // Extract named parameters
        foreach ($matches as $key => $value) {
            if (!is_numeric($key)) {
                $params[$key] = $value;
            }
        }

        break;
    }
}

// Route not found
if (!$matchedRoute) {
    Response::notFound('Endpoint not found');
    exit;
}

// Check if authentication is required
$user = null;
if ($matchedRoute['auth']) {
    $authMiddleware = new AuthMiddleware();
    $user = $authMiddleware->handle();

    if (!$user) {
        exit; // AuthMiddleware already sent error response
    }
}

// Instantiate controller
$controllerClass = "App\\Controllers\\{$matchedRoute['controller']}";

if (!class_exists($controllerClass)) {
    Response::serverError('Controller not found');
    exit;
}

$controller = new $controllerClass();
$methodName = $matchedRoute['method'];

if (!method_exists($controller, $methodName)) {
    Response::serverError('Method not found');
    exit;
}

// Call controller method with parameters
try {
    $args = [];

    // Add authenticated user as first parameter if route requires auth
    if ($user !== null) {
        $args[] = $user;
    }

    // Add route parameters in order they appear in method signature
    $reflection = new ReflectionMethod($controller, $methodName);
    $methodParams = $reflection->getParameters();

    foreach ($methodParams as $param) {
        $paramName = $param->getName();

        // Skip 'user' param as it's already added
        if ($paramName === 'user') {
            continue;
        }

        // Add route parameter if it exists
        if (isset($params[$paramName])) {
            $args[] = $params[$paramName];
        }
    }

    call_user_func_array([$controller, $methodName], $args);

} catch (Exception $e) {
    error_log("Controller Error: " . $e->getMessage());
    Response::serverError('An error occurred processing your request');
}

function maybeAutoTriggerReportScheduler(string $method, string $uri): void
{
    if (PHP_SAPI === 'cli') {
        return;
    }

    if ($method === 'OPTIONS') {
        return;
    }

    $enabled = filter_var($_ENV['REPORT_SCHEDULER_AUTO_TRIGGER'] ?? 'true', FILTER_VALIDATE_BOOLEAN);
    if (!$enabled) {
        return;
    }

    // Keep overhead low by throttling trigger attempts.
    $cooldownSeconds = (int) ($_ENV['REPORT_SCHEDULER_TRIGGER_COOLDOWN_SECONDS'] ?? 120);
    if ($cooldownSeconds < 15) {
        $cooldownSeconds = 15;
    }

    $lockFile = rtrim(sys_get_temp_dir(), DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . 'lms_report_scheduler_last_trigger.txt';
    $fp = @fopen($lockFile, 'c+');
    if (!$fp) {
        return;
    }

    if (!@flock($fp, LOCK_EX | LOCK_NB)) {
        fclose($fp);
        return;
    }

    $raw = stream_get_contents($fp);
    $lastTrigger = (int) trim((string) $raw);
    $now = time();

    if ($lastTrigger > 0 && ($now - $lastTrigger) < $cooldownSeconds) {
        @flock($fp, LOCK_UN);
        fclose($fp);
        return;
    }

    rewind($fp);
    ftruncate($fp, 0);
    fwrite($fp, (string) $now);
    fflush($fp);
    @flock($fp, LOCK_UN);
    fclose($fp);

    $workerPath = realpath(__DIR__ . '/../scripts/report_schedule_worker.php');
    if (!$workerPath || !is_file($workerPath)) {
        return;
    }

    $phpBinary = defined('PHP_BINARY') && PHP_BINARY ? PHP_BINARY : 'php';

    if (DIRECTORY_SEPARATOR === '\\') {
        $cmd = 'start /B "" ' . escapeshellarg($phpBinary) . ' ' . escapeshellarg($workerPath) . ' > NUL 2>&1';
        @pclose(@popen($cmd, 'r'));
        return;
    }

    $cmd = escapeshellarg($phpBinary) . ' ' . escapeshellarg($workerPath) . ' > /dev/null 2>&1 &';
    @exec($cmd);
}
