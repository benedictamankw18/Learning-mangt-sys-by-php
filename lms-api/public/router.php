<?php
/**
 * Router script for PHP built-in development server
 * This ensures all API requests go through index.php, even those with file extensions
 */

// Get the requested URI
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// If the URI starts with /api or matches an API pattern, route through index.php
if (preg_match('#^/api/#', $uri)) {
    require __DIR__ . '/index.php';
    return true;
}

// For file uploads directory, serve files directly from lms-api/uploads/
// Must be checked BEFORE the generic static-file extension check below
if (preg_match('#^/uploads/#', $uri)) {
    $filePath = dirname(__DIR__) . str_replace('/', DIRECTORY_SEPARATOR, $uri);
    if (file_exists($filePath)) {
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
