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
