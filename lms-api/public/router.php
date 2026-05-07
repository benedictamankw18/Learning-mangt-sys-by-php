<?php
/**
 * Router script for PHP built-in development server
 * This ensures all API requests go through index.php, even those with file extensions
 */

function sendCorsHeaders(): void
{
    $allowedOrigins = $_ENV['ALLOWED_ORIGINS'] ?? '*';
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';

    if ($allowedOrigins === '*') {
        if ($origin) {
            header('Access-Control-Allow-Origin: ' . $origin);
            header('Vary: Origin');
        } else {
            header('Access-Control-Allow-Origin: *');
        }
    } else {
        $originsArray = array_values(array_filter(array_map(function ($item) {
            return trim((string) $item, " \t\n\r\0\x0B\"'");
        }, explode(',', $allowedOrigins))));

        if ($origin && in_array($origin, $originsArray, true)) {
            header('Access-Control-Allow-Origin: ' . $origin);
            header('Vary: Origin');
        }
    }

    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Max-Age: 3600');
}

// Get the requested URI
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// If the URI starts with /api or matches an API pattern, route through index.php
if (preg_match('#^/api/#', $uri)) {
    sendCorsHeaders();

    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
        http_response_code(200);
        header('Content-Type: application/json; charset=UTF-8');
        echo json_encode(['success' => true, 'message' => 'OK']);
        return true;
    }

    require __DIR__ . '/index.php';
    return true;
}

// For file uploads directory, serve files directly from lms-api/uploads/
// Must be checked BEFORE the generic static-file extension check below
if (preg_match('#^/uploads/#', $uri)) {
    $filePath = dirname(__DIR__) . str_replace('/', DIRECTORY_SEPARATOR, $uri);
    if (file_exists($filePath)) {
        $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
        if ($origin) {
            header('Access-Control-Allow-Origin: ' . $origin);
            header('Vary: Origin');
        }
        $ext = strtolower(pathinfo($filePath, PATHINFO_EXTENSION));
        $mimeMap = [
            'png'  => 'image/png',
            'jpg'  => 'image/jpeg',
            'jpeg' => 'image/jpeg',
            'gif'  => 'image/gif',
            'webp' => 'image/webp',
            'svg'  => 'image/svg+xml',
            'pdf'  => 'application/pdf',
            'doc'  => 'application/msword',
            'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ];
        header('Content-Type: ' . ($mimeMap[$ext] ?? 'application/octet-stream'));
        header('Content-Length: ' . filesize($filePath));
        readfile($filePath);
        return true;
    }
}

// Backward compatibility: old records may reference /materials/<file>.
// Map them to /uploads/materials/<file> when running the PHP dev server.
if (preg_match('#^/materials/#', $uri)) {
    $legacyPath = '/uploads' . $uri;
    $filePath = dirname(__DIR__) . str_replace('/', DIRECTORY_SEPARATOR, $legacyPath);
    if (file_exists($filePath)) {
        $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
        if ($origin) {
            header('Access-Control-Allow-Origin: ' . $origin);
            header('Vary: Origin');
        }
        $ext = strtolower(pathinfo($filePath, PATHINFO_EXTENSION));
        $mimeMap = [
            'png'  => 'image/png',
            'jpg'  => 'image/jpeg',
            'jpeg' => 'image/jpeg',
            'gif'  => 'image/gif',
            'webp' => 'image/webp',
            'svg'  => 'image/svg+xml',
            'pdf'  => 'application/pdf',
            'doc'  => 'application/msword',
            'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ];
        header('Content-Type: ' . ($mimeMap[$ext] ?? 'application/octet-stream'));
        header('Content-Length: ' . filesize($filePath));
        readfile($filePath);
        return true;
    }
}

// For static files (css, js, images), serve them directly from public/
if (preg_match('/\.(?:css|js|jpg|jpeg|png|gif|svg|ico|woff|woff2|ttf|eot)$/', $uri)) {
    return false; // Serve the file normally
}

// Everything else goes through index.php
require __DIR__ . '/index.php';
return true;