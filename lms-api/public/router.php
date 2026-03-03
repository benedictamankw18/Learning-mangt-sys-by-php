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

// For static files (css, js, images), serve them directly
if (preg_match('/\.(?:css|js|jpg|jpeg|png|gif|svg|ico|woff|woff2|ttf|eot)$/', $uri)) {
    return false; // Serve the file normally
}

// For file uploads directory, serve files directly
if (preg_match('#^/uploads/#', $uri) && file_exists(__DIR__ . $uri)) {
    return false; // Serve the file normally
}

// Everything else goes through index.php
require __DIR__ . '/index.php';
return true;
